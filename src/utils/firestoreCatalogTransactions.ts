import type { AdminActivityLogItem, BrahmyamanPlant } from '../types/nursery';

// Firestore hard limit is 500 writes/deletes and 10 MiB total payload per WriteBatch.
// We reserve 1 slot for `catalog_meta/deleted_seeds` on single-batch atomic operations (499 plants + 1 meta = 500),
// and chunk multi-batch forward & rollback operations conservatively at <= 450 ops and <= 7 MiB per batch.
export const FIRESTORE_SINGLE_BATCH_MAX_PLANTS = 499;
export const FIRESTORE_MULTI_BATCH_CHUNK_SIZE = 450;
export const FIRESTORE_MAX_BATCH_BYTES = 7 * 1024 * 1024;
export const FIRESTORE_MAX_SINGLE_DOC_BYTES = 950_000;
export const FIRESTORE_DELETED_SEEDS_MAX_IDS = 500;
export const CATALOG_OPERATION_JOURNAL_STORAGE_KEY = 'brahmyaman_catalog_op_journal_v1';

const VALID_DOC_ID_RE = /^[a-zA-Z0-9_-]{1,128}$/;

export function getUtf8ByteLength(value: string): number {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(value).length;
  }
  return value.length;
}

// ---------------------------------------------------------------------------
// ISSUE 1: Exact LocalStorage Backup & Rollback (Preserves Non-Existent Keys & Empty Strings)
// ---------------------------------------------------------------------------

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface StorageKeySnapshot {
  key: string;
  existed: boolean;
  rawValue: string | null;
}

function resolveDefaultStorage(explicit?: StorageLike | null): StorageLike | null {
  if (explicit !== undefined) {
    return explicit;
  }
  try {
    if (typeof localStorage !== 'undefined' && localStorage !== null) {
      return localStorage;
    }
  } catch {
    // Ignore SecurityError in restricted environments
  }
  return null;
}

/**
 * Captures the exact prior state of one or more localStorage keys before an optimistic mutation.
 * Specifically distinguishes between a non-existent key (`getItem(k) === null` -> `existed: false`)
 * and an existing key with an empty string (`getItem(k) === ""` -> `existed: true, rawValue: ""`).
 */
export function captureLocalStorageSnapshot(
  keys: string[],
  storage?: StorageLike | null
): StorageKeySnapshot[] {
  const target = resolveDefaultStorage(storage);
  return keys.map((key) => {
    if (!target) {
      return { key, existed: false, rawValue: null };
    }
    try {
      const rawValue = target.getItem(key);
      return {
        key,
        existed: rawValue !== null,
        rawValue,
      };
    } catch {
      return { key, existed: false, rawValue: null };
    }
  });
}

/**
 * Restores a previously captured localStorage snapshot on operation failure.
 * - If the key existed before the operation, restores its exact previous raw string (including `""`).
 * - If the key did not exist before the operation, removes the key via `removeItem(key)`.
 * - Handles storage access errors safely per key without throwing or masking the original Firestore error.
 */
export function restoreLocalStorageSnapshot(
  snapshot: StorageKeySnapshot[],
  storage?: StorageLike | null
): void {
  const target = resolveDefaultStorage(storage);
  if (!target) return;

  for (const entry of snapshot) {
    try {
      if (entry.existed && entry.rawValue !== null) {
        target.setItem(entry.key, entry.rawValue);
      } else {
        target.removeItem(entry.key);
      }
    } catch {
      // Never throw or mask the caller's Firestore error if storage access fails during rollback
    }
  }
}

export async function executeWithLocalStorageRollback<T>(params: {
  keys: string[];
  storage?: StorageLike | null;
  applyOptimistic?: (storage: StorageLike | null) => void;
  operation: () => Promise<T>;
  onRollback?: () => void;
}): Promise<T> {
  const target = resolveDefaultStorage(params.storage);
  const snapshot = captureLocalStorageSnapshot(params.keys, target);

  if (params.applyOptimistic) {
    try {
      params.applyOptimistic(target);
    } catch {
      // Continue to Firestore operation even if optimistic localStorage write hits quota
    }
  }

  try {
    return await params.operation();
  } catch (err) {
    restoreLocalStorageSnapshot(snapshot, target);
    try {
      params.onRollback?.();
    } catch {
      // Do not mask original error
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Activity Log Persistence with Exact LocalStorage & State Rollback
// ---------------------------------------------------------------------------

export interface ActivityLogPersistenceParams {
  item: AdminActivityLogItem;
  isAuthenticated: boolean;
  hasAuthUser: boolean;
  saveToFirestore: (logId: string, sanitizedPayload: Record<string, string>) => Promise<void>;
  getLogsSnapshot: () => AdminActivityLogItem[];
  applyLogsState: (nextLogs: AdminActivityLogItem[]) => void;
  persistLogsToStorage: (nextLogs: AdminActivityLogItem[]) => void;
  storageKey?: string;
  storage?: StorageLike | null;
  onWriteTracked?: (count: number) => void;
  onFirestoreError?: (err: unknown, logId: string) => void;
  onFailureWarning?: (messageBn: string) => void;
}

export function sanitizeActivityLogForFirestore(
  item: AdminActivityLogItem
): Record<string, string> {
  const sanitized: Record<string, string> = {
    id: item.id.slice(0, 128),
    timestamp: (item.timestamp || '').slice(0, 95),
    dateBn: (item.dateBn || '').slice(0, 115),
    timeBn: (item.timeBn || '').slice(0, 115),
    actionType: (item.actionType || 'plant_edit').slice(0, 55),
    titleBn: (item.titleBn || 'Activity').slice(0, 290),
    descriptionBn: (item.descriptionBn || '').slice(0, 950),
  };

  if (item.plantId && item.plantId.trim()) {
    const cleanedPlantId = item.plantId.trim().replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 128);
    if (cleanedPlantId) {
      sanitized.plantId = cleanedPlantId;
    }
  }
  if (item.plantNameBn && item.plantNameBn.trim()) {
    sanitized.plantNameBn = item.plantNameBn.trim().slice(0, 290);
  }
  if (item.thumbnail && item.thumbnail.trim() && item.thumbnail.length <= 250000) {
    sanitized.thumbnail = item.thumbnail.trim();
  }
  return sanitized;
}

/**
 * Activity log persistence with strict rollback on Firestore write failure.
 * Captures the exact prior localStorage key state (when `storageKey` is provided) so non-existent
 * or empty-string keys are restored verbatim if no concurrent logs were added during the failed write.
 */
export async function persistActivityLogEntry(
  params: ActivityLogPersistenceParams
): Promise<boolean> {
  const {
    item,
    isAuthenticated,
    hasAuthUser,
    saveToFirestore,
    getLogsSnapshot,
    applyLogsState,
    persistLogsToStorage,
    storageKey,
    storage,
    onWriteTracked,
    onFirestoreError,
    onFailureWarning,
  } = params;

  const rawStorageSnapshot = storageKey
    ? captureLocalStorageSnapshot([storageKey], storage)
    : null;

  const prevLogs = getLogsSnapshot();
  const prevIdsSig = prevLogs.map((l) => l.id).join('|');
  const optimisticLogs = [item, ...prevLogs.filter((existing) => existing.id !== item.id)];
  applyLogsState(optimisticLogs);
  try {
    persistLogsToStorage(optimisticLogs);
  } catch {
    // Ignore local storage quota errors
  }

  if (!isAuthenticated || !hasAuthUser) {
    return true;
  }

  const sanitizedLog = sanitizeActivityLogForFirestore(item);
  try {
    await saveToFirestore(item.id, sanitizedLog);
    onWriteTracked?.(1);
    return true;
  } catch (err) {
    // Roll back ONLY the failed log entry so concurrent valid logs remain intact
    const currentLogs = getLogsSnapshot();
    const rolledBackLogs = currentLogs.filter((existing) => existing.id !== item.id);
    applyLogsState(rolledBackLogs);

    const rolledBackIdsSig = rolledBackLogs.map((l) => l.id).join('|');
    if (rawStorageSnapshot && rolledBackIdsSig === prevIdsSig) {
      restoreLocalStorageSnapshot(rawStorageSnapshot, storage);
    } else {
      try {
        persistLogsToStorage(rolledBackLogs);
      } catch {
        // Ignore storage errors during rollback
      }
    }

    onFirestoreError?.(err, item.id);
    onFailureWarning?.(
      'সতর্কতা: অ্যাক্টিভিটি লগ Firestore ডাটাবেসে সেভ হয়নি — লোকাল তালিকা রোলব্যাক করা হয়েছে।'
    );
    return false;
  }
}

// ---------------------------------------------------------------------------
// ISSUE 4: Tombstone / Deleted IDs Reconciliation & Retention Policy
// ---------------------------------------------------------------------------

export interface DeletedIdsRetentionResult {
  /** Complete untruncated list of all deleted IDs (chronological oldest -> newest, deduplicated) */
  allDeletedIds: string[];
  /** List of <= 500 deleted IDs safe for Firestore `/catalog_meta/deleted_seeds` (all pinned seed IDs + newest custom IDs) */
  firestoreDeletedIds: string[];
  /** Older custom plant IDs retained in local/backup history beyond Firestore's 500-item single-document rule cap */
  archivedCustomIds: string[];
  /** Built-in static seed IDs that are permanently pinned in `firestoreDeletedIds` */
  pinnedSeedIdsIncluded: string[];
  /** True when `allDeletedIds.length > maxFirestoreIds` and older custom tombstones were archived locally */
  retentionPolicyApplied: boolean;
  /** True only if pinned static seed IDs alone exceed `maxFirestoreIds` (requires Firestore schema/rule migration) */
  requiresSchemaMigration: boolean;
}

export function isDefaultBuiltInSeedId(id: string, explicitSeedIds?: ReadonlySet<string>): boolean {
  if (explicitSeedIds) {
    return explicitSeedIds.has(id);
  }
  return id.startsWith('brahmyaman-');
}

/**
 * Reconciles deletion tombstones without silently discarding newly deleted IDs or pinned static seed IDs.
 * - Preserves 100% of deletion history in `allDeletedIds` (used for in-memory filtering, localStorage, and backups).
 * - Formats `firestoreDeletedIds` (<= 500 items per deployed `firestore.rules`) by pinning all deleted built-in
 *   seed IDs first and filling the remaining capacity with the most recently deleted custom plant IDs.
 */
export function reconcileDeletedPlantIds(
  candidateIds: Iterable<string>,
  options?: {
    pinnedSeedIds?: ReadonlySet<string>;
    activePlantIds?: ReadonlySet<string>;
    maxFirestoreIds?: number;
  }
): DeletedIdsRetentionResult {
  const maxFirestoreIds = options?.maxFirestoreIds ?? FIRESTORE_DELETED_SEEDS_MAX_IDS;
  const activeSet = options?.activePlantIds;

  // Preserve chronological order where re-added/newest IDs move to the tail (most recent)
  const orderedUnique = new Set<string>();
  for (const raw of candidateIds) {
    if (typeof raw !== 'string') continue;
    const trimmed = raw.trim();
    if (!VALID_DOC_ID_RE.test(trimmed)) continue;
    if (activeSet && activeSet.has(trimmed)) continue;
    if (orderedUnique.has(trimmed)) {
      orderedUnique.delete(trimmed);
    }
    orderedUnique.add(trimmed);
  }

  const allDeletedIds = Array.from(orderedUnique);
  if (allDeletedIds.length <= maxFirestoreIds) {
    const pinnedSeedIdsIncluded = allDeletedIds.filter((id) =>
      isDefaultBuiltInSeedId(id, options?.pinnedSeedIds)
    );
    return {
      allDeletedIds,
      firestoreDeletedIds: allDeletedIds,
      archivedCustomIds: [],
      pinnedSeedIdsIncluded,
      retentionPolicyApplied: false,
      requiresSchemaMigration: false,
    };
  }

  const pinnedSeedIdsIncluded: string[] = [];
  const customDeletedIds: string[] = [];

  for (const id of allDeletedIds) {
    if (isDefaultBuiltInSeedId(id, options?.pinnedSeedIds)) {
      pinnedSeedIdsIncluded.push(id);
    } else {
      customDeletedIds.push(id);
    }
  }

  if (pinnedSeedIdsIncluded.length > maxFirestoreIds) {
    // Pinned static seeds alone exceed the 500-item Firestore rule cap; keep newest 500 pinned seeds for wire safety
    // and flag `requiresSchemaMigration: true` so caller knows single-doc cap was exceeded by static seeds.
    const keptPinned = pinnedSeedIdsIncluded.slice(-maxFirestoreIds);
    const keptSet = new Set(keptPinned);
    const archived = allDeletedIds.filter((id) => !keptSet.has(id));
    return {
      allDeletedIds,
      firestoreDeletedIds: keptPinned,
      archivedCustomIds: archived,
      pinnedSeedIdsIncluded: keptPinned,
      retentionPolicyApplied: true,
      requiresSchemaMigration: true,
    };
  }

  const remainingCustomSlots = Math.max(0, maxFirestoreIds - pinnedSeedIdsIncluded.length);
  const recentCustomIds =
    remainingCustomSlots > 0 ? customDeletedIds.slice(-remainingCustomSlots) : [];
  const archivedCustomIds =
    remainingCustomSlots > 0
      ? customDeletedIds.slice(0, customDeletedIds.length - recentCustomIds.length)
      : [...customDeletedIds];

  // Maintain chronological relative order among the selected Firestore IDs
  const selectedSet = new Set<string>([...pinnedSeedIdsIncluded, ...recentCustomIds]);
  const firestoreDeletedIds = allDeletedIds.filter((id) => selectedSet.has(id));

  return {
    allDeletedIds,
    firestoreDeletedIds,
    archivedCustomIds,
    pinnedSeedIdsIncluded,
    retentionPolicyApplied: true,
    requiresSchemaMigration: false,
  };
}

// ---------------------------------------------------------------------------
// ISSUE 2: Byte-Aware & Count-Aware Compensating Rollback Batches
// ---------------------------------------------------------------------------

export interface BatchWriteOperation {
  setPlant: (id: string, data: Record<string, unknown>) => void;
  deletePlant: (id: string) => void;
  setTrashPlant?: (id: string, data: Record<string, unknown>) => void;
  deleteTrashPlant?: (id: string) => void;
  setDeletedSeedsMeta: (deletedIds: string[], updatedAtIso: string) => void;
  commit: () => Promise<void>;
}

export interface CatalogBatchOps {
  createBatch: () => BatchWriteOperation;
  onWriteTracked?: (count: number) => void;
  onDeleteTracked?: (count: number) => void;
  onError?: (err: unknown, path: string) => void;
}

export interface CompensatingRollbackOp {
  id: string;
  kind: 'set_plant' | 'delete_plant';
  targetCollection?: 'plants' | 'trash_plants';
  data?: Record<string, unknown>;
  estimatedBytes: number;
}

export interface PlannedRollbackBatch {
  ops: CompensatingRollbackOp[];
  metaRestore?: { deletedIds: string[]; updatedAtIso: string };
  totalOpsCount: number;
  estimatedBytes: number;
}

export interface RollbackBatchPlanResult {
  valid: boolean;
  batches: PlannedRollbackBatch[];
  oversizedOps: CompensatingRollbackOp[];
  error?: string;
}

export function estimateRollbackOpBytes(
  id: string,
  kind: 'set_plant' | 'delete_plant',
  data?: Record<string, unknown>
): number {
  const idBytes = getUtf8ByteLength(id) + 64;
  if (kind === 'delete_plant' || !data) {
    return idBytes;
  }
  return idBytes + getUtf8ByteLength(JSON.stringify(data));
}

/**
 * Splits compensating rollback operations into conservative batches bounded by BOTH:
 * - Maximum write operations per batch (`maxOpsPerBatch`, default 450, including any `metaRestore` write)
 * - Maximum estimated byte payload per batch (`maxBytesPerBatch`, default 7 MiB)
 * Stops and reports if any single operation exceeds `maxSingleOpBytes` (950 KB) or `maxBytesPerBatch`
 * rather than silently skipping it.
 */
export function planCompensatingRollbackBatches(
  opsList: CompensatingRollbackOp[],
  options?: {
    metaRestore?: { deletedIds: string[]; updatedAtIso: string };
    maxOpsPerBatch?: number;
    maxBytesPerBatch?: number;
    maxSingleOpBytes?: number;
  }
): RollbackBatchPlanResult {
  const maxOpsPerBatch = options?.maxOpsPerBatch ?? FIRESTORE_MULTI_BATCH_CHUNK_SIZE;
  const maxBytesPerBatch = options?.maxBytesPerBatch ?? FIRESTORE_MAX_BATCH_BYTES;
  const maxSingleOpBytes =
    options?.maxSingleOpBytes ?? Math.min(FIRESTORE_MAX_SINGLE_DOC_BYTES, maxBytesPerBatch);

  const oversizedOps: CompensatingRollbackOp[] = [];
  for (const op of opsList) {
    const limit = Math.min(maxSingleOpBytes, maxBytesPerBatch);
    if (
      op.estimatedBytes > limit ||
      (op.kind === 'set_plant' && (!op.data || typeof op.data !== 'object'))
    ) {
      oversizedOps.push(op);
    }
  }

  if (oversizedOps.length > 0) {
    const badIds = oversizedOps.map((o) => `${o.id} (${o.estimatedBytes} bytes)`).join(', ');
    return {
      valid: false,
      batches: [],
      oversizedOps,
      error: `Compensating rollback halted: oversized or invalid rollback operation(s): ${badIds}`,
    };
  }

  const batches: PlannedRollbackBatch[] = [];
  let currentOps: CompensatingRollbackOp[] = [];
  let currentBytes = 0;

  for (const op of opsList) {
    const wouldExceedCount = currentOps.length >= maxOpsPerBatch;
    const wouldExceedBytes =
      currentOps.length > 0 && currentBytes + op.estimatedBytes > maxBytesPerBatch;
    if (wouldExceedCount || wouldExceedBytes) {
      batches.push({
        ops: currentOps,
        totalOpsCount: currentOps.length,
        estimatedBytes: currentBytes,
      });
      currentOps = [];
      currentBytes = 0;
    }
    currentOps.push(op);
    currentBytes += op.estimatedBytes;
  }

  if (currentOps.length > 0) {
    batches.push({
      ops: currentOps,
      totalOpsCount: currentOps.length,
      estimatedBytes: currentBytes,
    });
  }

  if (options?.metaRestore) {
    const metaBytes = getUtf8ByteLength(JSON.stringify(options.metaRestore)) + 96;
    if (metaBytes > maxBytesPerBatch) {
      return {
        valid: false,
        batches: [],
        oversizedOps: [],
        error: `Compensating rollback halted: deleted_seeds metadata restore (${metaBytes} bytes) exceeds batch limit`,
      };
    }

    const lastBatch = batches[batches.length - 1];
    if (
      lastBatch &&
      lastBatch.totalOpsCount + 1 <= maxOpsPerBatch &&
      lastBatch.estimatedBytes + metaBytes <= maxBytesPerBatch
    ) {
      lastBatch.metaRestore = options.metaRestore;
      lastBatch.totalOpsCount += 1;
      lastBatch.estimatedBytes += metaBytes;
    } else {
      batches.push({
        ops: [],
        metaRestore: options.metaRestore,
        totalOpsCount: 1,
        estimatedBytes: metaBytes,
      });
    }
  }

  return {
    valid: true,
    batches,
    oversizedOps: [],
  };
}

export interface CompensatingRollbackExecutionResult {
  ok: boolean;
  restoredIds: string[];
  unrestoredIds: string[];
  oversizedIds: string[];
  batchesPlanned: number;
  batchesAttempted: number;
  batchesSucceeded: number;
  metaRestored: boolean;
  error?: string;
}

export async function executeCompensatingRollbackBatches(params: {
  opsList: CompensatingRollbackOp[];
  metaRestore?: { deletedIds: string[]; updatedAtIso: string };
  pinnedSeedIds?: ReadonlySet<string>;
  ops: CatalogBatchOps;
  maxOpsPerBatch?: number;
  maxBytesPerBatch?: number;
  maxSingleOpBytes?: number;
  onBatchRestored?: (restoredBatchIds: string[]) => void;
}): Promise<CompensatingRollbackExecutionResult> {
  const { opsList, metaRestore, ops } = params;
  const allTargetIds = opsList.map((o) => o.id);

  if (opsList.length === 0 && !metaRestore) {
    return {
      ok: true,
      restoredIds: [],
      unrestoredIds: [],
      oversizedIds: [],
      batchesPlanned: 0,
      batchesAttempted: 0,
      batchesSucceeded: 0,
      metaRestored: true,
    };
  }

  const plan = planCompensatingRollbackBatches(opsList, {
    metaRestore,
    maxOpsPerBatch: params.maxOpsPerBatch,
    maxBytesPerBatch: params.maxBytesPerBatch,
    maxSingleOpBytes: params.maxSingleOpBytes,
  });

  if (!plan.valid) {
    const errMsg = plan.error || 'Compensating rollback plan failed validation';
    ops.onError?.(new Error(errMsg), 'plants/rollback-plan-oversized');
    return {
      ok: false,
      restoredIds: [],
      unrestoredIds: allTargetIds,
      oversizedIds: plan.oversizedOps.map((o) => o.id),
      batchesPlanned: 0,
      batchesAttempted: 0,
      batchesSucceeded: 0,
      metaRestored: false,
      error: errMsg,
    };
  }

  const restoredSet = new Set<string>();
  let batchesAttempted = 0;
  let batchesSucceeded = 0;
  let metaRestored = !metaRestore;
  let firstErrorMsg: string | undefined;

  for (let bIdx = 0; bIdx < plan.batches.length; bIdx += 1) {
    const plannedBatch = plan.batches[bIdx];
    batchesAttempted += 1;
    const batch = ops.createBatch();
    let writeCount = 0;
    let deleteCount = 0;

    for (const op of plannedBatch.ops) {
      const useTrash = op.targetCollection === 'trash_plants';
      if (op.kind === 'set_plant' && op.data) {
        if (useTrash) {
          (batch.setTrashPlant ?? batch.setPlant)(op.id, op.data);
        } else {
          batch.setPlant(op.id, op.data);
        }
        writeCount += 1;
      } else {
        if (useTrash) {
          (batch.deleteTrashPlant ?? batch.deletePlant)(op.id);
        } else {
          batch.deletePlant(op.id);
        }
        deleteCount += 1;
      }
    }

    if (plannedBatch.metaRestore) {
      const reconciledMeta = reconcileDeletedPlantIds(plannedBatch.metaRestore.deletedIds, {
        pinnedSeedIds: params.pinnedSeedIds,
      });
      batch.setDeletedSeedsMeta(
        reconciledMeta.firestoreDeletedIds,
        plannedBatch.metaRestore.updatedAtIso
      );
      writeCount += 1;
    }

    try {
      await batch.commit();
      batchesSucceeded += 1;
      if (writeCount > 0) ops.onWriteTracked?.(writeCount);
      if (deleteCount > 0) ops.onDeleteTracked?.(deleteCount);

      const batchIds = plannedBatch.ops.map((o) => o.id);
      for (const id of batchIds) {
        restoredSet.add(id);
      }
      if (plannedBatch.metaRestore) {
        metaRestored = true;
      }
      params.onBatchRestored?.(batchIds);
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!firstErrorMsg) {
        firstErrorMsg = msg;
      }
      ops.onError?.(err, `plants/rollback-batch-${bIdx}`);
    }
  }

  const restoredIds = allTargetIds.filter((id) => restoredSet.has(id));
  const unrestoredIds = allTargetIds.filter((id) => !restoredSet.has(id));
  const ok = unrestoredIds.length === 0 && metaRestored && batchesSucceeded === plan.batches.length;

  return {
    ok,
    restoredIds,
    unrestoredIds,
    oversizedIds: [],
    batchesPlanned: plan.batches.length,
    batchesAttempted,
    batchesSucceeded,
    metaRestored,
    ...(firstErrorMsg ? { error: firstErrorMsg } : {}),
  };
}

// ---------------------------------------------------------------------------
// ISSUE 3: Durable Multi-Batch Operation Journal & Idempotent Crash Recovery
// ---------------------------------------------------------------------------

export type CatalogOperationState =
  | 'in_progress'
  | 'rolling_back'
  | 'failed_incomplete'
  | 'completed';

export interface CatalogOperationJournal {
  operationId: string;
  kind: 'import' | 'reset';
  state: CatalogOperationState;
  startedAt: string;
  updatedAt: string;
  totalBatches: number;
  completedBatches: number;
  /** Chronological list of document IDs modified or ambiguously in-flight across batches */
  affectedIds: string[];
  /** Subset of affectedIds whose commit threw a network/unknown error (may have committed server-side) */
  ambiguousIds?: string[];
  /** IDs already restored during compensating rollback */
  restoredIds: string[];
  /** IDs that still need compensating rollback */
  unrestoredIds: string[];
  /** Prior sanitized document state before operation (`null` if plant did not exist prior to import) */
  priorPlantsById: Record<string, Record<string, unknown> | null>;
  /** Collection holding each prior document (`plants` or `trash_plants`) */
  priorCollectionsById?: Record<string, 'plants' | 'trash_plants'>;
  /** Exact `deletedIds` list prior to the operation */
  prevDeletedIds: string[];
  recoveryAttempts: number;
  lastError?: string;
}

export interface CatalogJournalStore {
  readJournal(): CatalogOperationJournal | null;
  writeJournal(journal: CatalogOperationJournal): boolean;
  clearJournal(): void;
}

export function createLocalStorageJournalStore(
  storage?: StorageLike | null,
  storageKey = CATALOG_OPERATION_JOURNAL_STORAGE_KEY
): CatalogJournalStore {
  return {
    readJournal(): CatalogOperationJournal | null {
      const target = resolveDefaultStorage(storage);
      if (!target) return null;
      try {
        const raw = target.getItem(storageKey);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (
          parsed &&
          typeof parsed === 'object' &&
          typeof parsed.operationId === 'string' &&
          (parsed.kind === 'import' || parsed.kind === 'reset') &&
          typeof parsed.state === 'string'
        ) {
          return parsed as CatalogOperationJournal;
        }
      } catch {
        // Ignore malformed journal
      }
      return null;
    },
    writeJournal(journal: CatalogOperationJournal): boolean {
      const target = resolveDefaultStorage(storage);
      if (!target) return false;
      try {
        const serialized = JSON.stringify(journal);
        target.setItem(storageKey, serialized);
        // Verify read-back so silent quota drops are caught
        return target.getItem(storageKey) !== null;
      } catch {
        return false;
      }
    },
    clearJournal(): void {
      const target = resolveDefaultStorage(storage);
      if (!target) return;
      try {
        target.removeItem(storageKey);
      } catch {
        // Ignore storage errors
      }
    },
  };
}

export interface JournalRecoveryResult {
  foundIncomplete: boolean;
  operationId: string | null;
  kind: 'import' | 'reset' | null;
  ok: boolean;
  stateAfterRecovery: CatalogOperationState | 'none';
  recoveryAttempts: number;
  restoredIds: string[];
  unrestoredIds: string[];
  ambiguousIds: string[];
  oversizedIds: string[];
  prevDeletedIds: string[];
  error?: string;
}

export interface StartupCatalogRecoveryResult extends JournalRecoveryResult {
  attempted: boolean;
  waitingForAuth: boolean;
  journalSnapshot: CatalogOperationJournal | null;
}

export function getIncompleteCatalogOperationJournal(
  journalStore?: CatalogJournalStore
): CatalogOperationJournal | null {
  const store = journalStore ?? createLocalStorageJournalStore();
  const journal = store.readJournal();
  if (!journal || journal.state === 'completed') {
    return null;
  }
  return journal;
}

/**
 * Automatic browser-startup detection & idempotent recovery runner.
 * - Detects an incomplete journal immediately at startup.
 * - If admin auth is not ready yet, leaves the durable journal intact (`waitingForAuth: true`) without losing recovery state.
 * - Once admin auth is active, executes idempotent compensating recovery automatically.
 */
export async function runStartupCatalogRecovery(params: {
  isAdminAuthenticated: boolean;
  ops: CatalogBatchOps;
  journalStore?: CatalogJournalStore;
  pinnedSeedIds?: ReadonlySet<string>;
  maxOpsPerBatch?: number;
  maxBytesPerBatch?: number;
  maxSingleOpBytes?: number;
}): Promise<StartupCatalogRecoveryResult> {
  const journalStore = params.journalStore ?? createLocalStorageJournalStore();
  const existing = journalStore.readJournal();
  if (!existing || existing.state === 'completed') {
    if (existing?.state === 'completed') {
      journalStore.clearJournal();
    }
    return {
      foundIncomplete: false,
      attempted: false,
      waitingForAuth: false,
      journalSnapshot: null,
      operationId: existing?.operationId ?? null,
      kind: existing?.kind ?? null,
      ok: true,
      stateAfterRecovery: 'none',
      recoveryAttempts: existing?.recoveryAttempts ?? 0,
      restoredIds: existing?.restoredIds ?? [],
      unrestoredIds: [],
      ambiguousIds: existing?.ambiguousIds ?? [],
      oversizedIds: [],
      prevDeletedIds: existing?.prevDeletedIds ?? [],
    };
  }

  if (!params.isAdminAuthenticated) {
    return {
      foundIncomplete: true,
      attempted: false,
      waitingForAuth: true,
      journalSnapshot: existing,
      operationId: existing.operationId,
      kind: existing.kind,
      ok: false,
      stateAfterRecovery: existing.state,
      recoveryAttempts: existing.recoveryAttempts || 0,
      restoredIds: existing.restoredIds || [],
      unrestoredIds: existing.unrestoredIds || existing.affectedIds || [],
      ambiguousIds: existing.ambiguousIds || [],
      oversizedIds: [],
      prevDeletedIds: existing.prevDeletedIds || [],
    };
  }

  const recovery = await recoverIncompleteCatalogOperation({
    ops: params.ops,
    journalStore,
    pinnedSeedIds: params.pinnedSeedIds,
    maxOpsPerBatch: params.maxOpsPerBatch,
    maxBytesPerBatch: params.maxBytesPerBatch,
    maxSingleOpBytes: params.maxSingleOpBytes,
  });

  return {
    ...recovery,
    attempted: true,
    waitingForAuth: false,
    journalSnapshot: journalStore.readJournal(),
  };
}

/**
 * Reconciles a second device's stale local catalog and deletion list with authoritative Firestore data:
 * - Built-in static seed IDs (`brahmyaman-*`) are always present in Firestore `catalog_meta/deleted_seeds`
 *   (pinned <= 98 <= 500), so `remoteDeletedIds` is authoritative for whether a static seed is deleted or restored.
 * - Custom plants (even >500 archived ones) are authoritative in `remotePlants`: if a custom plant was
 *   deleted on Device 1, its absence from server `remotePlants` guarantees it never resurrects from stale Device 2 localStorage.
 */
export function reconcileCrossDeviceCatalogSync(params: {
  remotePlants: BrahmyamanPlant[];
  remotePlantsEmpty: boolean;
  remoteDeletedIds: string[];
  localDeletedIds: string[];
  staticSeedCatalog: BrahmyamanPlant[];
  pinnedSeedIds: ReadonlySet<string>;
  expireTrash?: (list: BrahmyamanPlant[]) => BrahmyamanPlant[];
}): {
  plants: BrahmyamanPlant[];
  mergedDeletedIds: string[];
} {
  const {
    remotePlants,
    remotePlantsEmpty,
    remoteDeletedIds,
    localDeletedIds,
    staticSeedCatalog,
    pinnedSeedIds,
  } = params;

  const activeRemoteIds = new Set(
    remotePlants.filter((p) => p.status !== 'deleted').map((p) => p.id)
  );
  const remoteDeletedSet = new Set(remoteDeletedIds);

  // For pinned static seeds, server `remoteDeletedIds` is authoritative (supports cross-device restore as well as delete).
  // For non-seed custom plants (>500 archived tombstones), retain local archive if not currently active on server.
  const preservedLocalCustomArchived =
    remoteDeletedIds.length === 0
      ? []
      : localDeletedIds.filter(
          (id) => !isDefaultBuiltInSeedId(id, pinnedSeedIds) && !activeRemoteIds.has(id)
        );

  const reconciledDeleted =
    remoteDeletedIds.length === 0 && preservedLocalCustomArchived.length === 0
      ? []
      : reconcileDeletedPlantIds([...preservedLocalCustomArchived, ...remoteDeletedIds], {
          pinnedSeedIds,
          activePlantIds: activeRemoteIds,
        }).allDeletedIds;

  const deletedSet = new Set<string>([...reconciledDeleted, ...remoteDeletedSet]);
  const filterFn = params.expireTrash ?? ((list: BrahmyamanPlant[]) => list);

  if (!remotePlantsEmpty && remotePlants.length > 0) {
    const cleaned = filterFn(remotePlants).filter((p) => !deletedSet.has(p.id));
    const existingIds = new Set(cleaned.map((p) => p.id));
    const missingDefaults = staticSeedCatalog.filter(
      (p) => !existingIds.has(p.id) && !deletedSet.has(p.id)
    );
    return {
      plants: missingDefaults.length > 0 ? [...cleaned, ...missingDefaults] : cleaned,
      mergedDeletedIds: reconciledDeleted,
    };
  }

  return {
    plants: staticSeedCatalog.filter((p) => !deletedSet.has(p.id)),
    mergedDeletedIds: reconciledDeleted,
  };
}

/**
 * Detects any incomplete multi-batch `import` or `reset` operation from the durable journal
 * and executes idempotent, byte-aware compensating rollback for all remaining `unrestoredIds`.
 * - Safe to call after a browser crash/restart or repeated times if a previous recovery was interrupted.
 * - Never clears the journal until 100% of affected IDs and metadata have been restored.
 */
export async function recoverIncompleteCatalogOperation(params: {
  ops: CatalogBatchOps;
  journalStore?: CatalogJournalStore;
  pinnedSeedIds?: ReadonlySet<string>;
  maxOpsPerBatch?: number;
  maxBytesPerBatch?: number;
  maxSingleOpBytes?: number;
}): Promise<JournalRecoveryResult> {
  const journalStore = params.journalStore ?? createLocalStorageJournalStore();
  const journal = journalStore.readJournal();

  if (!journal || journal.state === 'completed') {
    if (journal?.state === 'completed') {
      journalStore.clearJournal();
    }
    return {
      foundIncomplete: false,
      operationId: journal?.operationId ?? null,
      kind: journal?.kind ?? null,
      ok: true,
      stateAfterRecovery: 'none',
      recoveryAttempts: journal?.recoveryAttempts ?? 0,
      restoredIds: journal?.restoredIds ?? [],
      unrestoredIds: [],
      ambiguousIds: journal?.ambiguousIds ?? [],
      oversizedIds: [],
      prevDeletedIds: journal?.prevDeletedIds ?? [],
    };
  }

  const nextAttempt = (journal.recoveryAttempts || 0) + 1;
  const alreadyRestoredSet = new Set<string>(journal.restoredIds || []);
  const pendingIds = (
    journal.unrestoredIds && journal.unrestoredIds.length > 0
      ? journal.unrestoredIds
      : journal.affectedIds.filter((id) => !alreadyRestoredSet.has(id))
  ).slice();

  const rollingBackJournal: CatalogOperationJournal = {
    ...journal,
    state: 'rolling_back',
    updatedAt: new Date().toISOString(),
    recoveryAttempts: nextAttempt,
    unrestoredIds: pendingIds,
  };
  journalStore.writeJournal(rollingBackJournal);

  // Build rollback operations in reverse chronological order
  const reversedPending = [...pendingIds].reverse();
  const opsList: CompensatingRollbackOp[] = reversedPending.map((id) => {
    const priorData = journal.priorPlantsById[id] ?? null;
    const priorCollection =
      journal.priorCollectionsById?.[id] ||
      (priorData && (priorData as any).status === 'deleted' ? 'trash_plants' : 'plants');
    if (priorData) {
      return {
        id,
        kind: 'set_plant',
        targetCollection: priorCollection,
        data: priorData,
        estimatedBytes: estimateRollbackOpBytes(id, 'set_plant', priorData),
      };
    }
    return {
      id,
      kind: 'delete_plant',
      targetCollection: priorCollection,
      estimatedBytes: estimateRollbackOpBytes(id, 'delete_plant'),
    };
  });

  const rollbackResult = await executeCompensatingRollbackBatches({
    opsList,
    metaRestore: {
      deletedIds: journal.prevDeletedIds,
      updatedAtIso: new Date().toISOString(),
    },
    pinnedSeedIds: params.pinnedSeedIds,
    ops: params.ops,
    maxOpsPerBatch: params.maxOpsPerBatch,
    maxBytesPerBatch: params.maxBytesPerBatch,
    maxSingleOpBytes: params.maxSingleOpBytes,
    onBatchRestored: (batchIds) => {
      for (const id of batchIds) {
        alreadyRestoredSet.add(id);
      }
      const remaining = journal.affectedIds.filter((id) => !alreadyRestoredSet.has(id));
      journalStore.writeJournal({
        ...rollingBackJournal,
        updatedAt: new Date().toISOString(),
        restoredIds: Array.from(alreadyRestoredSet),
        unrestoredIds: remaining,
      });
    },
  });

  const cumulativeRestored = journal.affectedIds.filter((id) => alreadyRestoredSet.has(id));
  const cumulativeUnrestored = journal.affectedIds.filter((id) => !alreadyRestoredSet.has(id));

  if (rollbackResult.ok && cumulativeUnrestored.length === 0) {
    journalStore.clearJournal();
    return {
      foundIncomplete: true,
      operationId: journal.operationId,
      kind: journal.kind,
      ok: true,
      stateAfterRecovery: 'completed',
      recoveryAttempts: nextAttempt,
      restoredIds: cumulativeRestored,
      unrestoredIds: [],
      ambiguousIds: journal.ambiguousIds || [],
      oversizedIds: [],
      prevDeletedIds: journal.prevDeletedIds,
    };
  }

  const failedJournal: CatalogOperationJournal = {
    ...rollingBackJournal,
    state: 'failed_incomplete',
    updatedAt: new Date().toISOString(),
    restoredIds: cumulativeRestored,
    unrestoredIds: cumulativeUnrestored,
    lastError: rollbackResult.error || 'Compensating recovery could not complete all batches',
  };
  journalStore.writeJournal(failedJournal);

  return {
    foundIncomplete: true,
    operationId: journal.operationId,
    kind: journal.kind,
    ok: false,
    stateAfterRecovery: 'failed_incomplete',
    recoveryAttempts: nextAttempt,
    restoredIds: cumulativeRestored,
    unrestoredIds: cumulativeUnrestored,
    ambiguousIds: journal.ambiguousIds || [],
    oversizedIds: rollbackResult.oversizedIds,
    prevDeletedIds: journal.prevDeletedIds,
    error: failedJournal.lastError,
  };
}

// ---------------------------------------------------------------------------
// Catalog Import & Reset Validation and Execution
// ---------------------------------------------------------------------------

export interface PreparedImportPlant {
  plant: BrahmyamanPlant;
  sanitized: Record<string, unknown>;
  payloadBytes: number;
}

export interface ImportValidationResult {
  valid: boolean;
  prepared: PreparedImportPlant[];
  rejectedReasons: string[];
}

export function validateAndPrepareCatalogImport(
  rawPlants: BrahmyamanPlant[],
  sanitizePlant: (plant: BrahmyamanPlant) => Record<string, unknown>,
  defaultIso: string,
  defaultBn: string
): ImportValidationResult {
  if (!Array.isArray(rawPlants) || rawPlants.length === 0) {
    return {
      valid: false,
      prepared: [],
      rejectedReasons: ['Import catalog list is empty or not an array'],
    };
  }

  const dedupedById = new Map<string, PreparedImportPlant>();
  const rejectedReasons: string[] = [];

  for (let i = 0; i < rawPlants.length; i += 1) {
    const raw = rawPlants[i];
    if (!raw || typeof raw !== 'object') {
      rejectedReasons.push(`Index ${i}: invalid object`);
      continue;
    }
    const id = typeof raw.id === 'string' ? raw.id.trim() : '';
    const nameBn = typeof raw.nameBn === 'string' ? raw.nameBn.trim() : '';
    const category = typeof raw.category === 'string' ? raw.category.trim() : '';

    if (!VALID_DOC_ID_RE.test(id)) {
      rejectedReasons.push(`Index ${i}: invalid document id "${id}"`);
      continue;
    }
    if (!nameBn || nameBn.length > 300) {
      rejectedReasons.push(`Plant "${id}": invalid nameBn`);
      continue;
    }
    if (!category || category.length > 150) {
      rejectedReasons.push(`Plant "${id}": invalid category`);
      continue;
    }
    if (!Array.isArray(raw.options) || raw.options.length === 0 || raw.options.length > 10) {
      rejectedReasons.push(`Plant "${id}": options must contain 1..10 items`);
      continue;
    }

    const hasInvalidOption = raw.options.some(
      (opt) =>
        !opt ||
        typeof opt !== 'object' ||
        typeof opt.price !== 'number' ||
        !Number.isFinite(opt.price) ||
        opt.price <= 0 ||
        typeof opt.labelBn !== 'string' ||
        !opt.labelBn.trim()
    );
    if (hasInvalidOption) {
      rejectedReasons.push(
        `Plant "${id}": every option must have non-empty labelBn and positive finite price`
      );
      continue;
    }

    const normalizedPlant: BrahmyamanPlant = {
      ...raw,
      id,
      nameBn,
      status: raw.status === 'deleted' ? 'deleted' : 'active',
      updatedAt: raw.updatedAt || defaultIso,
      updatedAtBn: raw.updatedAtBn || defaultBn,
    };

    const sanitized = sanitizePlant(normalizedPlant);
    const payloadBytes = getUtf8ByteLength(JSON.stringify(sanitized));
    if (payloadBytes > FIRESTORE_MAX_SINGLE_DOC_BYTES) {
      rejectedReasons.push(
        `Plant "${id}": sanitized payload (${payloadBytes} bytes) exceeds safe Firestore limit`
      );
      continue;
    }

    dedupedById.set(id, { plant: normalizedPlant, sanitized, payloadBytes });
  }

  const prepared = Array.from(dedupedById.values());
  const valid = prepared.length > 0 && rejectedReasons.length === 0;
  return { valid, prepared, rejectedReasons };
}

/**
 * Splits prepared plants into Firestore-safe chunks bounded by both operation count (<= 450)
 * and total serialized payload size (<= 7 MiB), preventing 10 MiB WriteBatch failures on large imports.
 */
export function chunkPreparedPlantsForBatch(
  entries: PreparedImportPlant[],
  maxItemsPerChunk = FIRESTORE_MULTI_BATCH_CHUNK_SIZE,
  maxBytesPerChunk = FIRESTORE_MAX_BATCH_BYTES
): PreparedImportPlant[][] {
  const chunks: PreparedImportPlant[][] = [];
  let current: PreparedImportPlant[] = [];
  let currentBytes = 0;

  for (const entry of entries) {
    const wouldExceedCount = current.length >= maxItemsPerChunk;
    const wouldExceedBytes =
      current.length > 0 && currentBytes + entry.payloadBytes > maxBytesPerChunk;
    if (wouldExceedCount || wouldExceedBytes) {
      chunks.push(current);
      current = [];
      currentBytes = 0;
    }
    current.push(entry);
    currentBytes += entry.payloadBytes;
  }

  if (current.length > 0) {
    chunks.push(current);
  }
  return chunks;
}

export interface ReliableImportResult {
  ok: boolean;
  atomic: boolean;
  committedCount: number;
  failedCount: number;
  recoveryAttempted: boolean;
  recoverySucceeded: boolean;
  restoredIds?: string[];
  unrestoredIds?: string[];
  ambiguousIds?: string[];
  oversizedRollbackIds?: string[];
  journalWriteFailed?: boolean;
  blockedByIncompleteOperation?: boolean;
  activeOperationId?: string;
  activeOperationState?: CatalogOperationState;
  operationId?: string;
  mergedPlants: BrahmyamanPlant[];
  /** Full untruncated deletion history */
  nextDeletedIds: string[];
  /** <= 500 IDs formatted for `/catalog_meta/deleted_seeds` */
  firestoreDeletedIds?: string[];
  validationErrors?: string[];
}

/**
 * Reliable batch catalog import:
 * - Refuses to overwrite an existing incomplete multi-batch operation in the durable journal.
 * - Up to 499 plants (+1 metadata doc = 500 ops) and <= 7 MiB: single atomic Firestore WriteBatch.
 * - Above 499 plants or > 7 MiB: multi-batch sequential commits (explicitly NOT atomic across batches)
 *   tracked in a durable journal with byte-aware compensating recovery.
 */
export async function executeReliableCatalogImport(params: {
  rawPlants: BrahmyamanPlant[];
  prevPlants: BrahmyamanPlant[];
  prevDeletedIds: string[];
  sanitizePlant: (plant: BrahmyamanPlant) => Record<string, unknown>;
  defaultIso: string;
  defaultBn: string;
  ops: CatalogBatchOps;
  journalStore?: CatalogJournalStore;
  pinnedSeedIds?: ReadonlySet<string>;
  restoredDeletedIds?: string[];
}): Promise<ReliableImportResult> {
  const {
    rawPlants,
    prevPlants,
    prevDeletedIds,
    sanitizePlant,
    defaultIso,
    defaultBn,
    ops,
  } = params;

  const journalStore = params.journalStore ?? createLocalStorageJournalStore();
  const existingJournal = journalStore.readJournal();
  if (existingJournal && existingJournal.state !== 'completed') {
    return {
      ok: false,
      atomic: false,
      committedCount: 0,
      failedCount: rawPlants?.length || 0,
      recoveryAttempted: false,
      recoverySucceeded: false,
      blockedByIncompleteOperation: true,
      activeOperationId: existingJournal.operationId,
      activeOperationState: existingJournal.state,
      mergedPlants: prevPlants,
      nextDeletedIds: prevDeletedIds,
    };
  }

  const validation = validateAndPrepareCatalogImport(
    rawPlants,
    sanitizePlant,
    defaultIso,
    defaultBn
  );

  if (!validation.valid) {
    return {
      ok: false,
      atomic: true,
      committedCount: 0,
      failedCount: rawPlants?.length || 1,
      recoveryAttempted: false,
      recoverySucceeded: true,
      mergedPlants: prevPlants,
      nextDeletedIds: prevDeletedIds,
      validationErrors: validation.rejectedReasons,
    };
  }

  const { prepared } = validation;
  const prevMap = new Map<string, BrahmyamanPlant>();
  for (const p of prevPlants) {
    prevMap.set(p.id, p);
  }

  const importedActiveIds = new Set(
    prepared.filter((entry) => entry.plant.status !== 'deleted').map((entry) => entry.plant.id)
  );
  const mergedForwardDeletedInput = Array.from(
    new Set([...(params.restoredDeletedIds || []), ...prevDeletedIds])
  );
  const reconciledDeleted = reconcileDeletedPlantIds(mergedForwardDeletedInput, {
    pinnedSeedIds: params.pinnedSeedIds,
    activePlantIds: importedActiveIds,
  });
  const nextDeletedIds = reconciledDeleted.allDeletedIds;
  const firestoreDeletedIds = reconciledDeleted.firestoreDeletedIds;
  const versionIso = new Date().toISOString();

  const totalBytes = prepared.reduce((sum, entry) => sum + entry.payloadBytes, 0);
  const singleBatchEstimatedOps =
    prepared.reduce((sum, entry) => {
      const prior = prevMap.get(entry.plant.id);
      const isStatusSwitch =
        prior && ((prior.status === 'deleted') !== (entry.plant.status === 'deleted'));
      return sum + (isStatusSwitch ? 2 : 1);
    }, 0) + 1;

  // Case 1: Single atomic Firestore batch (<= 500 total write/delete ops AND <= 7 MiB total payload)
  if (
    prepared.length <= FIRESTORE_SINGLE_BATCH_MAX_PLANTS &&
    singleBatchEstimatedOps <= 500 &&
    totalBytes <= FIRESTORE_MAX_BATCH_BYTES
  ) {
    const batch = ops.createBatch();
    for (const entry of prepared) {
      const prior = prevMap.get(entry.plant.id);
      if (entry.plant.status === 'deleted') {
        (batch.setTrashPlant ?? batch.setPlant)(entry.plant.id, entry.sanitized);
        if (prior && prior.status !== 'deleted') {
          batch.deletePlant(entry.plant.id);
        }
      } else {
        batch.setPlant(entry.plant.id, entry.sanitized);
        if (prior && prior.status === 'deleted' && batch.deleteTrashPlant) {
          batch.deleteTrashPlant(entry.plant.id);
        }
      }
    }
    batch.setDeletedSeedsMeta(firestoreDeletedIds, versionIso);

    try {
      await batch.commit();
      ops.onWriteTracked?.(prepared.length + 1);

      const nextMap = new Map(prevMap);
      for (const entry of prepared) {
        nextMap.set(entry.plant.id, entry.plant);
      }

      return {
        ok: true,
        atomic: true,
        committedCount: prepared.length,
        failedCount: 0,
        recoveryAttempted: false,
        recoverySucceeded: true,
        mergedPlants: Array.from(nextMap.values()),
        nextDeletedIds,
        firestoreDeletedIds,
      };
    } catch (err) {
      ops.onError?.(err, 'plants/import-batch');
      return {
        ok: false,
        atomic: true,
        committedCount: 0,
        failedCount: prepared.length,
        recoveryAttempted: false,
        recoverySucceeded: true,
        mergedPlants: prevPlants,
        nextDeletedIds: prevDeletedIds,
      };
    }
  }

  // Case 2: Multi-batch (> 499 plants or > 7 MiB) — NOT atomic across batches; journaled + byte-aware rollback
  const chunks = chunkPreparedPlantsForBatch(prepared);
  const operationId = `op-import-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const priorPlantsById: Record<string, Record<string, unknown> | null> = {};
  const priorCollectionsById: Record<string, 'plants' | 'trash_plants'> = {};
  for (const entry of prepared) {
    const prior = prevMap.get(entry.plant.id);
    priorPlantsById[entry.plant.id] = prior ? sanitizePlant(prior) : null;
    priorCollectionsById[entry.plant.id] = prior
      ? prior.status === 'deleted'
        ? 'trash_plants'
        : 'plants'
      : entry.plant.status === 'deleted'
      ? 'trash_plants'
      : 'plants';
  }

  const journal: CatalogOperationJournal = {
    operationId,
    kind: 'import',
    state: 'in_progress',
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    totalBatches: chunks.length,
    completedBatches: 0,
    affectedIds: [],
    ambiguousIds: [],
    restoredIds: [],
    unrestoredIds: [],
    priorPlantsById,
    priorCollectionsById,
    prevDeletedIds,
    recoveryAttempts: 0,
  };
  if (!journalStore.writeJournal(journal)) {
    ops.onError?.(new Error('Failed to persist durable operation journal before multi-batch import'), 'plants/import-journal-write');
    return {
      ok: false,
      atomic: false,
      operationId,
      committedCount: 0,
      failedCount: prepared.length,
      recoveryAttempted: false,
      recoverySucceeded: true,
      journalWriteFailed: true,
      mergedPlants: prevPlants,
      nextDeletedIds: prevDeletedIds,
    };
  }

  const committedEntries: PreparedImportPlant[] = [];
  for (let chunkIdx = 0; chunkIdx < chunks.length; chunkIdx += 1) {
    const chunk = chunks[chunkIdx];
    const isLastChunk = chunkIdx === chunks.length - 1;
    const chunkIds = chunk.map((c) => c.plant.id);

    // Record in-flight chunk IDs in durable journal BEFORE calling batch.commit()
    // so an ambiguous network drop after server commit is still idempotently rolled back.
    journal.affectedIds = Array.from(new Set([...journal.affectedIds, ...chunkIds]));
    journal.ambiguousIds = [...chunkIds];
    journal.unrestoredIds = [...journal.affectedIds];
    journal.updatedAt = new Date().toISOString();
    if (!journalStore.writeJournal(journal)) {
      ops.onError?.(new Error('Failed to update durable operation journal before chunk commit'), `plants/import-journal-write-${chunkIdx}`);
      // Roll back only batches known to have been committed prior to journal failure
      const priorCommittedIds = committedEntries.map((c) => c.plant.id);
      let recoverySucceeded = true;
      let restoredIds: string[] = [];
      let unrestoredIds: string[] = [];
      let oversizedRollbackIds: string[] = [];
      if (priorCommittedIds.length > 0) {
        const priorOpsList: CompensatingRollbackOp[] = [...priorCommittedIds].reverse().map((id) => {
          const priorData = priorPlantsById[id] ?? null;
          const targetCollection = priorCollectionsById[id] || 'plants';
          return priorData
            ? {
                id,
                kind: 'set_plant',
                targetCollection,
                data: priorData,
                estimatedBytes: estimateRollbackOpBytes(id, 'set_plant', priorData),
              }
            : {
                id,
                kind: 'delete_plant',
                targetCollection,
                estimatedBytes: estimateRollbackOpBytes(id, 'delete_plant'),
              };
        });
        const recResult = await executeCompensatingRollbackBatches({
          opsList: priorOpsList,
          metaRestore: { deletedIds: prevDeletedIds, updatedAtIso: new Date().toISOString() },
          pinnedSeedIds: params.pinnedSeedIds,
          ops,
        });
        recoverySucceeded = recResult.ok;
        restoredIds = recResult.restoredIds;
        unrestoredIds = recResult.unrestoredIds;
        oversizedRollbackIds = recResult.oversizedIds;
        if (recoverySucceeded) {
          journalStore.clearJournal();
        }
      } else {
        journalStore.clearJournal();
      }
      const recoveredSet = new Set(restoredIds);
      const trueMap = new Map(prevMap);
      for (const item of committedEntries) {
        if (!recoveredSet.has(item.plant.id)) {
          trueMap.set(item.plant.id, item.plant);
        }
      }
      return {
        ok: false,
        atomic: false,
        operationId,
        committedCount: recoverySucceeded ? 0 : unrestoredIds.length,
        failedCount: prepared.length - committedEntries.length,
        recoveryAttempted: priorCommittedIds.length > 0,
        recoverySucceeded,
        restoredIds,
        unrestoredIds,
        oversizedRollbackIds,
        journalWriteFailed: true,
        mergedPlants: recoverySucceeded ? prevPlants : Array.from(trueMap.values()),
        nextDeletedIds: prevDeletedIds,
      };
    }

    const batch = ops.createBatch();
    for (const entry of chunk) {
      const prior = prevMap.get(entry.plant.id);
      if (entry.plant.status === 'deleted') {
        (batch.setTrashPlant ?? batch.setPlant)(entry.plant.id, entry.sanitized);
        if (prior && prior.status !== 'deleted') {
          batch.deletePlant(entry.plant.id);
        }
      } else {
        batch.setPlant(entry.plant.id, entry.sanitized);
        if (prior && prior.status === 'deleted' && batch.deleteTrashPlant) {
          batch.deleteTrashPlant(entry.plant.id);
        }
      }
    }
    if (isLastChunk) {
      batch.setDeletedSeedsMeta(firestoreDeletedIds, versionIso);
    }

    try {
      await batch.commit();
      ops.onWriteTracked?.(chunk.length + (isLastChunk ? 1 : 0));
      committedEntries.push(...chunk);
      journal.completedBatches = chunkIdx + 1;
      journal.ambiguousIds = [];
      journal.updatedAt = new Date().toISOString();
      journalStore.writeJournal(journal);
    } catch (err) {
      ops.onError?.(err, `plants/import-batch-${chunkIdx}`);
      const failedCount = prepared.length - committedEntries.length;

      // Preserve BOTH previously committed IDs AND the ambiguous failed/timed-out chunk IDs in
      // `journal.affectedIds` so idempotent compensating rollback repairs Firestore even if the
      // server committed this chunk before the HTTP response was lost.
      const rollbackScopeIds = Array.from(new Set([...committedEntries.map((c) => c.plant.id), ...chunkIds]));
      journal.affectedIds = rollbackScopeIds;
      journal.ambiguousIds = [...chunkIds];
      journal.unrestoredIds = [...rollbackScopeIds];
      journal.lastError = err instanceof Error ? err.message : String(err);
      journalStore.writeJournal(journal);

      const recResult = await recoverIncompleteCatalogOperation({
        ops,
        journalStore,
        pinnedSeedIds: params.pinnedSeedIds,
      });

      const recoveredSet = new Set(recResult.restoredIds);
      const trueMap = new Map(prevMap);
      for (const item of committedEntries) {
        if (!recoveredSet.has(item.plant.id)) {
          trueMap.set(item.plant.id, item.plant);
        }
      }

      return {
        ok: false,
        atomic: false,
        operationId,
        committedCount: recResult.ok ? 0 : recResult.unrestoredIds.length,
        failedCount,
        recoveryAttempted: rollbackScopeIds.length > 0,
        recoverySucceeded: recResult.ok,
        restoredIds: recResult.restoredIds,
        unrestoredIds: recResult.unrestoredIds,
        ambiguousIds: chunkIds,
        oversizedRollbackIds: recResult.oversizedIds,
        mergedPlants: recResult.ok ? prevPlants : Array.from(trueMap.values()),
        nextDeletedIds: prevDeletedIds,
      };
    }
  }

  journalStore.clearJournal();

  const finalMap = new Map(prevMap);
  for (const entry of prepared) {
    finalMap.set(entry.plant.id, entry.plant);
  }

  return {
    ok: true,
    atomic: false,
    operationId,
    committedCount: prepared.length,
    failedCount: 0,
    recoveryAttempted: false,
    recoverySucceeded: true,
    mergedPlants: Array.from(finalMap.values()),
    nextDeletedIds,
    firestoreDeletedIds,
  };
}

export interface RemotePlantSnapshotRecord {
  id: string;
  collection?: 'plants' | 'trash_plants';
  data: Record<string, unknown>;
}

export interface ReliableResetResult {
  ok: boolean;
  atomic: boolean;
  deletedCount: number;
  recoveryAttempted: boolean;
  recoverySucceeded: boolean;
  restoredIds?: string[];
  unrestoredIds?: string[];
  ambiguousIds?: string[];
  oversizedRollbackIds?: string[];
  journalWriteFailed?: boolean;
  blockedByIncompleteOperation?: boolean;
  activeOperationId?: string;
  activeOperationState?: CatalogOperationState;
  operationId?: string;
  nextDeletedIds: string[];
  remainingRemoteIds: string[];
}

/**
 * Reliable batch catalog reset:
 * - Refuses to overwrite an existing incomplete multi-batch operation in the durable journal.
 * - Up to 499 remote docs (+1 metadata reset = 500 ops): single atomic Firestore WriteBatch.
 * - Above 499 remote docs: multi-batch delete tracked in the durable journal with byte-aware
 *   compensating recovery restoring already-deleted remote docs if a later batch fails.
 */
export async function executeReliableCatalogReset(params: {
  remoteDocsBackup: RemotePlantSnapshotRecord[];
  prevDeletedIds: string[];
  ops: CatalogBatchOps;
  pinnedSeedIds?: ReadonlySet<string>;
  journalStore?: CatalogJournalStore;
}): Promise<ReliableResetResult> {
  const { remoteDocsBackup, prevDeletedIds, ops } = params;
  const journalStore = params.journalStore ?? createLocalStorageJournalStore();
  const existingJournal = journalStore.readJournal();
  if (existingJournal && existingJournal.state !== 'completed') {
    return {
      ok: false,
      atomic: false,
      deletedCount: 0,
      recoveryAttempted: false,
      recoverySucceeded: false,
      blockedByIncompleteOperation: true,
      activeOperationId: existingJournal.operationId,
      activeOperationState: existingJournal.state,
      nextDeletedIds: prevDeletedIds,
      remainingRemoteIds: remoteDocsBackup.map((r) => r.id),
    };
  }

  const resetIso = new Date().toISOString();

  // Case 1: Single atomic batch (0..499 deletes + 1 metadata reset <= 500 ops)
  if (remoteDocsBackup.length <= FIRESTORE_SINGLE_BATCH_MAX_PLANTS) {
    const batch = ops.createBatch();
    for (const rec of remoteDocsBackup) {
      if (rec.collection === 'trash_plants') {
        (batch.deleteTrashPlant ?? batch.deletePlant)(rec.id);
      } else {
        batch.deletePlant(rec.id);
      }
    }
    batch.setDeletedSeedsMeta([], resetIso);

    try {
      await batch.commit();
      if (remoteDocsBackup.length > 0) {
        ops.onDeleteTracked?.(remoteDocsBackup.length);
      }
      ops.onWriteTracked?.(1);
      return {
        ok: true,
        atomic: true,
        deletedCount: remoteDocsBackup.length,
        recoveryAttempted: false,
        recoverySucceeded: true,
        nextDeletedIds: [],
        remainingRemoteIds: [],
      };
    } catch (err) {
      ops.onError?.(err, 'plants/reset-batch');
      return {
        ok: false,
        atomic: true,
        deletedCount: 0,
        recoveryAttempted: false,
        recoverySucceeded: true,
        nextDeletedIds: prevDeletedIds,
        remainingRemoteIds: remoteDocsBackup.map((r) => r.id),
      };
    }
  }

  // Case 2: Multi-batch (> 499 remote docs) — NOT atomic across batches; journaled + byte-aware restore on error
  const operationId = `op-reset-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const priorPlantsById: Record<string, Record<string, unknown> | null> = {};
  const priorCollectionsById: Record<string, 'plants' | 'trash_plants'> = {};
  for (const rec of remoteDocsBackup) {
    priorPlantsById[rec.id] = rec.data;
    priorCollectionsById[rec.id] =
      rec.collection || ((rec.data as any)?.status === 'deleted' ? 'trash_plants' : 'plants');
  }

  const totalBatches = Math.ceil(remoteDocsBackup.length / FIRESTORE_MULTI_BATCH_CHUNK_SIZE);
  const journal: CatalogOperationJournal = {
    operationId,
    kind: 'reset',
    state: 'in_progress',
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    totalBatches,
    completedBatches: 0,
    affectedIds: [],
    ambiguousIds: [],
    restoredIds: [],
    unrestoredIds: [],
    priorPlantsById,
    priorCollectionsById,
    prevDeletedIds,
    recoveryAttempts: 0,
  };
  if (!journalStore.writeJournal(journal)) {
    ops.onError?.(new Error('Failed to persist durable operation journal before multi-batch reset'), 'plants/reset-journal-write');
    return {
      ok: false,
      atomic: false,
      operationId,
      deletedCount: 0,
      recoveryAttempted: false,
      recoverySucceeded: true,
      journalWriteFailed: true,
      nextDeletedIds: prevDeletedIds,
      remainingRemoteIds: remoteDocsBackup.map((r) => r.id),
    };
  }

  const deletedSoFar: RemotePlantSnapshotRecord[] = [];
  for (let start = 0; start < remoteDocsBackup.length; start += FIRESTORE_MULTI_BATCH_CHUNK_SIZE) {
    const chunk = remoteDocsBackup.slice(start, start + FIRESTORE_MULTI_BATCH_CHUNK_SIZE);
    const isLastChunk = start + FIRESTORE_MULTI_BATCH_CHUNK_SIZE >= remoteDocsBackup.length;
    const batchIdx = Math.floor(start / FIRESTORE_MULTI_BATCH_CHUNK_SIZE);
    const chunkIds = chunk.map((c) => c.id);

    journal.affectedIds = Array.from(new Set([...journal.affectedIds, ...chunkIds]));
    journal.ambiguousIds = [...chunkIds];
    journal.unrestoredIds = [...journal.affectedIds];
    journal.updatedAt = new Date().toISOString();
    if (!journalStore.writeJournal(journal)) {
      ops.onError?.(new Error('Failed to update durable operation journal before reset chunk commit'), `plants/reset-journal-write-${batchIdx}`);
      const priorDeletedIds = deletedSoFar.map((r) => r.id);
      let recoverySucceeded = true;
      let restoredIds: string[] = [];
      let unrestoredIds: string[] = [];
      let oversizedRollbackIds: string[] = [];
      if (priorDeletedIds.length > 0) {
        const priorOpsList: CompensatingRollbackOp[] = [...priorDeletedIds].reverse().map((id) => ({
          id,
          kind: 'set_plant',
          targetCollection: priorCollectionsById[id] || 'plants',
          data: priorPlantsById[id] || {},
          estimatedBytes: estimateRollbackOpBytes(id, 'set_plant', priorPlantsById[id] || {}),
        }));
        const recResult = await executeCompensatingRollbackBatches({
          opsList: priorOpsList,
          metaRestore: { deletedIds: prevDeletedIds, updatedAtIso: new Date().toISOString() },
          pinnedSeedIds: params.pinnedSeedIds,
          ops,
        });
        recoverySucceeded = recResult.ok;
        restoredIds = recResult.restoredIds;
        unrestoredIds = recResult.unrestoredIds;
        oversizedRollbackIds = recResult.oversizedIds;
        if (recoverySucceeded) {
          journalStore.clearJournal();
        }
      } else {
        journalStore.clearJournal();
      }
      const restoredSet = new Set(restoredIds);
      const deletedIdsRemaining = new Set(
        deletedSoFar.filter((item) => !restoredSet.has(item.id)).map((item) => item.id)
      );
      const remainingRemoteIds = remoteDocsBackup
        .filter((item) => !deletedIdsRemaining.has(item.id))
        .map((item) => item.id);
      return {
        ok: false,
        atomic: false,
        operationId,
        deletedCount: deletedIdsRemaining.size,
        recoveryAttempted: priorDeletedIds.length > 0,
        recoverySucceeded,
        restoredIds,
        unrestoredIds,
        oversizedRollbackIds,
        journalWriteFailed: true,
        nextDeletedIds: prevDeletedIds,
        remainingRemoteIds,
      };
    }

    const batch = ops.createBatch();
    for (const rec of chunk) {
      if (rec.collection === 'trash_plants') {
        (batch.deleteTrashPlant ?? batch.deletePlant)(rec.id);
      } else {
        batch.deletePlant(rec.id);
      }
    }
    if (isLastChunk) {
      batch.setDeletedSeedsMeta([], resetIso);
    }

    try {
      await batch.commit();
      ops.onDeleteTracked?.(chunk.length);
      if (isLastChunk) {
        ops.onWriteTracked?.(1);
      }
      deletedSoFar.push(...chunk);
      journal.completedBatches = batchIdx + 1;
      journal.ambiguousIds = [];
      journal.updatedAt = new Date().toISOString();
      journalStore.writeJournal(journal);
    } catch (err) {
      ops.onError?.(err, `plants/reset-batch-${batchIdx}`);

      // Keep both confirmed-deleted IDs AND the ambiguous in-flight chunk IDs in the journal
      // so idempotent rollback restores any chunk whose commit succeeded before response loss.
      const rollbackScopeIds = Array.from(new Set([...deletedSoFar.map((r) => r.id), ...chunkIds]));
      journal.affectedIds = rollbackScopeIds;
      journal.ambiguousIds = [...chunkIds];
      journal.unrestoredIds = [...rollbackScopeIds];
      journal.lastError = err instanceof Error ? err.message : String(err);
      journalStore.writeJournal(journal);

      const recResult = await recoverIncompleteCatalogOperation({
        ops,
        journalStore,
        pinnedSeedIds: params.pinnedSeedIds,
      });

      const restoredSet = new Set(recResult.restoredIds);
      const deletedIdsRemaining = new Set(
        deletedSoFar.filter((item) => !restoredSet.has(item.id)).map((item) => item.id)
      );
      const remainingRemoteIds = remoteDocsBackup
        .filter((item) => !deletedIdsRemaining.has(item.id))
        .map((item) => item.id);

      return {
        ok: false,
        atomic: false,
        operationId,
        deletedCount: deletedIdsRemaining.size,
        recoveryAttempted: rollbackScopeIds.length > 0,
        recoverySucceeded: recResult.ok,
        restoredIds: recResult.restoredIds,
        unrestoredIds: recResult.unrestoredIds,
        ambiguousIds: chunkIds,
        oversizedRollbackIds: recResult.oversizedIds,
        nextDeletedIds: prevDeletedIds,
        remainingRemoteIds,
      };
    }
  }

  journalStore.clearJournal();

  return {
    ok: true,
    atomic: false,
    operationId,
    deletedCount: remoteDocsBackup.length,
    recoveryAttempted: false,
    recoverySucceeded: true,
    nextDeletedIds: [],
    remainingRemoteIds: [],
  };
}

export interface ReliableTrashEmptyResult {
  ok: boolean;
  atomic: boolean;
  deletedIds: string[];
  failedIds: string[];
  blockedByIncompleteOperation?: boolean;
  activeOperationId?: string;
  /** Full untruncated deletion history */
  nextDeletedSeedIds: string[];
  /** <= 500 IDs formatted for `/catalog_meta/deleted_seeds` */
  firestoreDeletedSeedIds: string[];
}

/**
 * Atomically empties trashed plants and updates `catalog_meta/deleted_seeds` using WriteBatch
 * while preserving full deletion history via `reconcileDeletedPlantIds`.
 * Refuses to run if a prior multi-batch import/reset operation is still incomplete.
 */
export async function executeReliableTrashEmpty(params: {
  trashedIds: string[];
  legacyActiveTrashIds?: string[];
  prevDeletedSeedIds: string[];
  ops: CatalogBatchOps;
  pinnedSeedIds?: ReadonlySet<string>;
  journalStore?: CatalogJournalStore;
}): Promise<ReliableTrashEmptyResult> {
  const { trashedIds, legacyActiveTrashIds = [], prevDeletedSeedIds, ops } = params;
  const allDeleteTargets = Array.from(new Set([...trashedIds, ...legacyActiveTrashIds]));
  const legacyActiveSet = new Set(legacyActiveTrashIds);

  const journalStore = params.journalStore;
  const existingJournal = journalStore?.readJournal();
  if (existingJournal && existingJournal.state !== 'completed') {
    const initialReconciled = reconcileDeletedPlantIds(prevDeletedSeedIds, {
      pinnedSeedIds: params.pinnedSeedIds,
    });
    return {
      ok: false,
      atomic: false,
      deletedIds: [],
      failedIds: [...allDeleteTargets],
      blockedByIncompleteOperation: true,
      activeOperationId: existingJournal.operationId,
      nextDeletedSeedIds: initialReconciled.allDeletedIds,
      firestoreDeletedSeedIds: initialReconciled.firestoreDeletedIds,
    };
  }

  if (allDeleteTargets.length === 0) {
    const initialReconciled = reconcileDeletedPlantIds(prevDeletedSeedIds, {
      pinnedSeedIds: params.pinnedSeedIds,
    });
    return {
      ok: true,
      atomic: true,
      deletedIds: [],
      failedIds: [],
      nextDeletedSeedIds: initialReconciled.allDeletedIds,
      firestoreDeletedSeedIds: initialReconciled.firestoreDeletedIds,
    };
  }

  const fullReconciled = reconcileDeletedPlantIds([...prevDeletedSeedIds, ...allDeleteTargets], {
    pinnedSeedIds: params.pinnedSeedIds,
  });
  const versionIso = new Date().toISOString();

  // Case 1: <= 499 trashed items + 1 catalog_meta write -> 1 single atomic WriteBatch
  if (allDeleteTargets.length <= FIRESTORE_SINGLE_BATCH_MAX_PLANTS) {
    const batch = ops.createBatch();
    for (const id of allDeleteTargets) {
      if (legacyActiveSet.has(id)) {
        batch.deletePlant(id);
      } else {
        (batch.deleteTrashPlant ?? batch.deletePlant)(id);
      }
    }
    batch.setDeletedSeedsMeta(fullReconciled.firestoreDeletedIds, versionIso);

    try {
      await batch.commit();
      ops.onDeleteTracked?.(allDeleteTargets.length);
      ops.onWriteTracked?.(1);
      return {
        ok: true,
        atomic: true,
        deletedIds: allDeleteTargets,
        failedIds: [],
        nextDeletedSeedIds: fullReconciled.allDeletedIds,
        firestoreDeletedSeedIds: fullReconciled.firestoreDeletedIds,
      };
    } catch (err) {
      ops.onError?.(err, 'trash_plants/empty-trash-batch');
      return {
        ok: false,
        atomic: true,
        deletedIds: [],
        failedIds: [...allDeleteTargets],
        nextDeletedSeedIds: prevDeletedSeedIds,
        firestoreDeletedSeedIds: reconcileDeletedPlantIds(prevDeletedSeedIds, {
          pinnedSeedIds: params.pinnedSeedIds,
        }).firestoreDeletedIds,
      };
    }
  }

  // Case 2: > 499 trashed items -> commit chunked batches with synchronized deleted_seeds per chunk
  const committedIds: string[] = [];
  const runningIds: string[] = [...prevDeletedSeedIds];
  for (let start = 0; start < allDeleteTargets.length; start += FIRESTORE_MULTI_BATCH_CHUNK_SIZE) {
    const chunk = allDeleteTargets.slice(start, start + FIRESTORE_MULTI_BATCH_CHUNK_SIZE);
    runningIds.push(...chunk);
    const chunkReconciled = reconcileDeletedPlantIds(runningIds, {
      pinnedSeedIds: params.pinnedSeedIds,
    });

    const batch = ops.createBatch();
    for (const id of chunk) {
      if (legacyActiveSet.has(id)) {
        batch.deletePlant(id);
      } else {
        (batch.deleteTrashPlant ?? batch.deletePlant)(id);
      }
    }
    batch.setDeletedSeedsMeta(chunkReconciled.firestoreDeletedIds, new Date().toISOString());

    try {
      await batch.commit();
      ops.onDeleteTracked?.(chunk.length);
      ops.onWriteTracked?.(1);
      committedIds.push(...chunk);
    } catch (err) {
      ops.onError?.(
        err,
        `trash_plants/empty-trash-batch-${Math.floor(start / FIRESTORE_MULTI_BATCH_CHUNK_SIZE)}`
      );
      const committedSet = new Set(committedIds);
      const remainingIds = allDeleteTargets.filter((id) => !committedSet.has(id));
      const partialReconciled = reconcileDeletedPlantIds(
        [...prevDeletedSeedIds, ...committedIds],
        { pinnedSeedIds: params.pinnedSeedIds }
      );
      return {
        ok: false,
        atomic: false,
        deletedIds: committedIds,
        failedIds: remainingIds,
        nextDeletedSeedIds: partialReconciled.allDeletedIds,
        firestoreDeletedSeedIds: partialReconciled.firestoreDeletedIds,
      };
    }
  }

  return {
    ok: true,
    atomic: false,
    deletedIds: committedIds,
    failedIds: [],
    nextDeletedSeedIds: fullReconciled.allDeletedIds,
    firestoreDeletedSeedIds: fullReconciled.firestoreDeletedIds,
  };
}
