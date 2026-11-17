import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import type { AddressInfo } from 'node:net';
import {
  verifyAdminTokenWithRevocation,
  verifyLiveRevocationViaIdentityToolkit,
} from '../src/lib/firebaseAdminAuth.ts';
import {
  FirestoreHybridRateLimitStore,
  MemoryRateLimitStore,
  createRateLimitMiddleware,
} from '../src/lib/rateLimiter.ts';
import {
  sanitizeCloudinaryTag,
  normalizeCloudNameInput,
  resolveCloudinaryCredentials,
  classifyCloudinaryError,
} from '../src/lib/cloudinary.ts';
import { resolvePlantImageUrl } from '../src/utils/imageUrl.ts';
import {
  extractCatalogSearchSuggestions,
  findMatchingHighlightSegments,
} from '../src/utils/plantSearch.ts';
import {
  sanitizePlantForFirestore,
  buildUnifiedBackupBundle,
  parseUnifiedBackupPayload,
  UNIFIED_BACKUP_VERSION,
} from '../src/utils/backupBundle.ts';
import {
  FIRESTORE_MAX_BATCH_BYTES,
  FIRESTORE_MULTI_BATCH_CHUNK_SIZE,
  FIRESTORE_SINGLE_BATCH_MAX_PLANTS,
  captureLocalStorageSnapshot,
  restoreLocalStorageSnapshot,
  executeWithLocalStorageRollback,
  persistActivityLogEntry,
  reconcileDeletedPlantIds,
  reconcileCrossDeviceCatalogSync,
  planCompensatingRollbackBatches,
  executeCompensatingRollbackBatches,
  estimateRollbackOpBytes,
  createLocalStorageJournalStore,
  getIncompleteCatalogOperationJournal,
  recoverIncompleteCatalogOperation,
  runStartupCatalogRecovery,
  validateAndPrepareCatalogImport,
  executeReliableCatalogImport,
  executeReliableCatalogReset,
  executeReliableTrashEmpty,
  chunkPreparedPlantsForBatch,
  sanitizeActivityLogForFirestore,
  type CatalogBatchOps,
  type StorageLike,
  type CompensatingRollbackOp,
} from '../src/utils/firestoreCatalogTransactions.ts';
import {
  resolveGrokCredentials,
  createInitialGrokTelemetry,
  buildGrokStatusSnapshot,
  runGrokChatWithFallback,
} from '../src/lib/grok.ts';
import {
  reportRuntimeIssue,
  getRuntimeIssues,
  clearRuntimeIssues,
} from '../src/utils/runtimeDiagnostics.ts';
import {
  resolveShareableImageUrl,
  buildPlantShareUrl,
  buildPlantShareText,
  buildWhatsAppShareUrl,
  sharePlantViaWebShare,
} from '../src/utils/plantShare.ts';
import {
  alignPlantImageSlots,
  collectReferencedCloudinaryPublicIds,
  scanCloudinaryOrphans,
} from '../src/utils/cloudinaryCleanup.ts';
import { runPlantUpdateRollbackDiagnostic } from '../src/utils/testFirestore.ts';
import {
  validateImageFile,
  requestCloudinaryUploadSignature,
  uploadToCloudinarySignedDirect,
  uploadImageSecurely,
  deleteCloudinaryAsset,
  applyUploadedPhotoToPlant,
  clearPlantPhotoSlot,
} from '../src/utils/cloudinaryUpload.ts';
import {
  isFirebasePopupPendingPromiseAssertion,
  clearStaleFirebaseAuthEvents,
} from '../src/firebase.ts';
import {
  classifyPlantsByUpload,
  sortPlantsWithUploadsFirst,
} from '../src/utils/plantUploadSort.ts';
import { computePlantDemandLeaderboard } from '../src/utils/whatsappOrderTracker.ts';
import {
  generateQrCodeSvg,
  buildPlantPublicUrl,
  buildPrintableQrTagSheetHtml,
} from '../src/utils/qrCodeSvg.ts';
import type {
  BrahmyamanPlant,
  AdminActivityLogItem,
  WhatsAppOrderLogItem,
} from '../src/types/nursery.ts';

function makePlant(id: string, price = 80, status: 'active' | 'deleted' = 'active'): BrahmyamanPlant {
  return {
    id,
    nameBn: `চারা ${id}`,
    nameEn: `Plant ${id}`,
    botanicalName: 'Hibiscus rosa-sinensis',
    category: 'পূজার ফুল ও পবিত্র গাছ',
    audience: ['puja', 'family'],
    sunlightBn: 'পূর্ণ রোদ',
    sunlightEn: 'Full Sun',
    wateringBn: 'নিয়মিত জল',
    wateringEn: 'Regular watering',
    soilTipBn: 'দোআঁশ মাটি',
    soilTipEn: 'Loamy soil',
    descriptionBn: 'বাঁকুড়ার রোদে দারুণ মানানসই সুস্থ চারা।',
    descriptionEn: 'Healthy nursery plant suited for Bankura sunlight.',
    image: `https://res.cloudinary.com/demo/image/upload/v1/brahmyaman/${id}.webp`,
    images: [`https://res.cloudinary.com/demo/image/upload/v1/brahmyaman/${id}.webp`],
    cloudinaryPublicIds: [`brahmyaman/${id}`],
    options: [
      {
        id: `${id}-opt-1`,
        labelBn: 'পলি গ্রো-ব্যাগ চারা',
        labelEn: 'Grow bag sapling',
        price,
        containerType: 'পলি গ্রো ব্যাগ',
      },
    ],
    status,
    inStock: true,
  };
}

class MockStorage implements StorageLike {
  public readonly map = new Map<string, string>();
  public throwOnWrite = false;

  getItem(key: string): string | null {
    return this.map.has(key) ? this.map.get(key)! : null;
  }

  setItem(key: string, value: string): void {
    if (this.throwOnWrite) {
      throw new Error('QuotaExceededError');
    }
    this.map.set(key, String(value));
  }

  removeItem(key: string): void {
    if (this.throwOnWrite) {
      throw new Error('StorageRemoveBlockedError');
    }
    this.map.delete(key);
  }
}

// ---------------------------------------------------------------------------
// 1. Firebase Admin Revocation Fail-Closed & Multi-Admin Auth Tests
// ---------------------------------------------------------------------------
test('Firebase revocation: rejects revoked/expired/invalid tokens with 401 and fails closed (503) on Identity Toolkit outage/timeout', async () => {
  const revokedOutcome = await verifyAdminTokenWithRevocation('tok-revoked', {
    verifyIdToken: async () => {
      const err: any = new Error('Token revoked');
      err.code = 'auth/id-token-revoked';
      throw err;
    },
    hasExplicitServiceAccount: false,
    webApiKey: 'dummy-api-key',
  });
  assert.equal(revokedOutcome.ok, false);
  assert.equal(revokedOutcome.status, 401);
  assert.equal(revokedOutcome.revoked, true);

  const expiredOutcome = await verifyAdminTokenWithRevocation('tok-expired', {
    verifyIdToken: async () => {
      const err: any = new Error('Token expired');
      err.code = 'auth/id-token-expired';
      throw err;
    },
    hasExplicitServiceAccount: false,
    webApiKey: 'dummy-api-key',
  });
  assert.equal(expiredOutcome.ok, false);
  assert.equal(expiredOutcome.status, 401);

  const outageOutcome = await verifyAdminTokenWithRevocation('tok-valid-jwt', {
    verifyIdToken: async (_tok, checkRevoked) => {
      if (checkRevoked) {
        const err: any = new Error('identitytoolkit.googleapis.com has not been used in project 829115980676');
        err.code = 'auth/internal-error';
        throw err;
      }
      return {
        uid: 'u-backup-owner',
        email: 'MahataApurba278@gmail.com',
        email_verified: true,
        auth_time: Math.floor(Date.now() / 1000),
      } as any;
    },
    hasExplicitServiceAccount: false,
    webApiKey: 'dummy-api-key',
    fetchFn: async () => new Response('upstream outage', { status: 503 }),
  });
  assert.equal(outageOutcome.ok, false);
  assert.equal(outageOutcome.status, 503);

  const timeoutOutcome = await verifyLiveRevocationViaIdentityToolkit(
    'tok-timeout',
    { uid: 'u-admin', auth_time: 1000 },
    {
      webApiKey: 'dummy-api-key',
      timeoutMs: 25,
      fetchFn: (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'));
          });
        }),
    }
  );
  assert.equal(timeoutOutcome.ok, false);
  assert.equal(timeoutOutcome.status, 503);
});

test('Firebase revocation: accepts mixed-case Backup Owner & Admin emails and tolerates 2s signup clock skew while blocking true revocation', async () => {
  const nowSec = Math.floor(Date.now() / 1000);

  const skewOk = await verifyAdminTokenWithRevocation('tok-new-login', {
    verifyIdToken: async (_tok, checkRevoked) => {
      if (checkRevoked) {
        const err: any = new Error('PERMISSION_DENIED: container ADC lacks permission');
        err.code = 'auth/internal-error';
        throw err;
      }
      return {
        uid: 'uid-backup-owner',
        email: 'MahataApurba278@gmail.com',
        email_verified: true,
        auth_time: nowSec,
      } as any;
    },
    hasExplicitServiceAccount: false,
    webApiKey: 'dummy-key',
    fetchFn: async () =>
      new Response(
        JSON.stringify({
          users: [
            {
              localId: 'uid-backup-owner',
              email: 'mahataapurba278@gmail.com',
              emailVerified: true,
              validSince: String(nowSec + 1),
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      ),
  });
  assert.equal(skewOk.ok, true);
  if (skewOk.ok) {
    assert.equal(skewOk.email, 'mahataapurba278@gmail.com');
    assert.equal(skewOk.revocationMethod, 'identity-toolkit-lookup');
  }

  const trulyRevoked = await verifyLiveRevocationViaIdentityToolkit(
    'tok-old-session',
    { uid: 'uid-admin', auth_time: nowSec - 120 },
    {
      webApiKey: 'dummy-key',
      fetchFn: async () =>
        new Response(
          JSON.stringify({
            users: [
              {
                localId: 'uid-admin',
                email: 'amahata169@gmail.com',
                emailVerified: true,
                validSince: String(nowSec - 10),
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        ),
    }
  );
  assert.equal(trulyRevoked.ok, false);
  assert.equal(trulyRevoked.status, 401);
  assert.equal(trulyRevoked.revoked, true);
});

// ---------------------------------------------------------------------------
// 2. Hybrid Distributed Rate Limiter & Fallback Resilience Tests
// ---------------------------------------------------------------------------
test('Hybrid Rate Limiter: shares state via Firestore transaction adapter, enforces 429 + Retry-After, and degrades safely on Firestore outage', async () => {
  const sharedDocs = new Map<string, any>();
  const now = 1_700_000_000_000;
  let simulateOutage = false;

  const hybridStore = new FirestoreHybridRateLimitStore({
    nowFn: () => now,
    cooldownOnErrorMs: 1000,
    adapter: {
      runTransaction: async (fn) => {
        if (simulateOutage) {
          throw new Error('PERMISSION_DENIED');
        }
        return fn({
          get: async (docId) => ({
            exists: sharedDocs.has(docId),
            data: () => sharedDocs.get(docId),
          }),
          set: (docId, data) => {
            sharedDocs.set(docId, data);
          },
        });
      },
    },
  });

  const d1 = await hybridStore.checkAndRecord('admin_ai', 'uid-1', 60_000, 2);
  const d2 = await hybridStore.checkAndRecord('admin_ai', 'uid-1', 60_000, 2);
  const d3 = await hybridStore.checkAndRecord('admin_ai', 'uid-1', 60_000, 2);
  assert.equal(d1.allowed, true);
  assert.equal(d1.backend, 'firestore-shared');
  assert.equal(d2.allowed, true);
  assert.equal(d2.remaining, 0);
  assert.equal(d3.allowed, false);
  assert.ok(d3.retryAfterSec >= 1);
  assert.equal(hybridStore.getMode(), 'firestore-shared');

  simulateOutage = true;
  const f1 = await hybridStore.checkAndRecord('admin_ai', 'uid-fallback', 60_000, 1);
  const f2 = await hybridStore.checkAndRecord('admin_ai', 'uid-fallback', 60_000, 1);
  assert.equal(f1.allowed, true);
  assert.equal(f1.backend, 'in-memory');
  assert.equal(f2.allowed, false);
  assert.equal(hybridStore.getMode(), 'in-memory-fallback');

  const app = express();
  const memStore = new MemoryRateLimitStore({ nowFn: () => now });
  app.get(
    '/limited',
    createRateLimitMiddleware({
      bucket: 'test_bucket',
      windowMs: 60_000,
      maxRequests: 1,
      store: memStore,
      errorMessage: 'Too many requests',
    }),
    (_req, res) => res.json({ ok: true })
  );

  const server = app.listen(0);
  const port = (server.address() as AddressInfo).port;
  try {
    const okRes = await fetch(`http://127.0.0.1:${port}/limited`);
    assert.equal(okRes.status, 200);
    assert.equal(okRes.headers.get('x-ratelimit-limit'), '1');
    assert.equal(okRes.headers.get('x-ratelimit-remaining'), '0');

    const blockedRes = await fetch(`http://127.0.0.1:${port}/limited`);
    assert.equal(blockedRes.status, 429);
    assert.ok(Number(blockedRes.headers.get('retry-after')) >= 1);
    const body = await blockedRes.json();
    assert.equal(body.code, 'rate_limit_exceeded');
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

// ---------------------------------------------------------------------------
// 3. ISSUE ONE — LocalStorage Rollback Bug Regression Tests
// ---------------------------------------------------------------------------
test('ISSUE 1 — LocalStorage Rollback: restores valid data, empty string, and removes non-existent keys on Firestore failure without masking errors', async () => {
  const storage = new MockStorage();
  storage.setItem('key-valid', '["brahmyaman-rose"]');
  storage.setItem('key-empty', '');
  // 'key-missing' intentionally does NOT exist in storage

  const snapshot = captureLocalStorageSnapshot(
    ['key-valid', 'key-empty', 'key-missing'],
    storage
  );
  assert.deepEqual(snapshot, [
    { key: 'key-valid', existed: true, rawValue: '["brahmyaman-rose"]' },
    { key: 'key-empty', existed: true, rawValue: '' },
    { key: 'key-missing', existed: false, rawValue: null },
  ]);

  // Simulate optimistic writes before a failing Firestore batch
  await assert.rejects(
    () =>
      executeWithLocalStorageRollback({
        keys: ['key-valid', 'key-empty', 'key-missing'],
        storage,
        applyOptimistic: (s) => {
          s?.setItem('key-valid', '["optimistic-overwritten"]');
          s?.setItem('key-empty', 'non-empty-optimistic');
          s?.setItem('key-missing', '["newly-created-optimistic"]');
        },
        operation: async () => {
          assert.equal(storage.getItem('key-valid'), '["optimistic-overwritten"]');
          assert.equal(storage.getItem('key-empty'), 'non-empty-optimistic');
          assert.equal(storage.getItem('key-missing'), '["newly-created-optimistic"]');
          throw new Error('FIRESTORE_BATCH_REJECTED');
        },
      }),
    /FIRESTORE_BATCH_REJECTED/
  );

  // Verify exact restoration of all 3 states:
  assert.equal(storage.getItem('key-valid'), '["brahmyaman-rose"]');
  assert.equal(storage.map.has('key-empty'), true);
  assert.equal(storage.getItem('key-empty'), '');
  assert.equal(storage.map.has('key-missing'), false);
  assert.equal(storage.getItem('key-missing'), null);

  // Verify storage failure during rollback never masks the original Firestore error
  await assert.rejects(
    () =>
      executeWithLocalStorageRollback({
        keys: ['key-valid'],
        storage,
        applyOptimistic: (s) => {
          s?.setItem('key-valid', 'optimistic');
          storage.throwOnWrite = true;
        },
        operation: async () => {
          throw new Error('ORIGINAL_FIRESTORE_ERROR');
        },
      }),
    /ORIGINAL_FIRESTORE_ERROR/
  );
  storage.throwOnWrite = false;

  // Verify Activity Log rollback removes non-existent storageKey on first-ever failed write
  const logStorage = new MockStorage();
  let stateLogs: AdminActivityLogItem[] = [];
  const logOk = await persistActivityLogEntry({
    item: {
      id: 'log-first-fail',
      timestamp: '2026-01-02T00:00:00.000Z',
      dateBn: '২ জানুয়ারি',
      timeBn: 'বিকাল ৪টা',
      actionType: 'price_update',
      titleBn: 'ব্যর্থ লগ',
      descriptionBn: 'টেস্ট ব্যর্থতা',
    },
    isAuthenticated: true,
    hasAuthUser: true,
    storageKey: 'brahmyaman_admin_activity_log_v1',
    storage: logStorage,
    saveToFirestore: async () => {
      assert.equal(logStorage.map.has('brahmyaman_admin_activity_log_v1'), true);
      throw new Error('PERMISSION_DENIED');
    },
    getLogsSnapshot: () => stateLogs,
    applyLogsState: (next) => {
      stateLogs = next;
    },
    persistLogsToStorage: (next) => {
      logStorage.setItem('brahmyaman_admin_activity_log_v1', JSON.stringify(next));
    },
  });
  assert.equal(logOk, false);
  assert.equal(stateLogs.length, 0);
  assert.equal(logStorage.map.has('brahmyaman_admin_activity_log_v1'), false);
});

// ---------------------------------------------------------------------------
// 4. ISSUE TWO — Byte-Aware Compensating Rollback Batches Regression Tests
// ---------------------------------------------------------------------------
test('ISSUE 2 — Byte-Aware Compensating Rollback: splits by 450 ops & 7 MiB, halts on single oversized op, and accurately reports partial rollback failures', async () => {
  // 1. Many small rollback operations -> splits at 450 op-count limit (with 1 slot reserved for metaRestore)
  const smallOps: CompensatingRollbackOp[] = Array.from({ length: 450 }, (_, i) => ({
    id: `small-${i}`,
    kind: 'delete_plant',
    estimatedBytes: 120,
  }));
  const countPlan = planCompensatingRollbackBatches(smallOps, {
    metaRestore: { deletedIds: ['brahmyaman-rose'], updatedAtIso: '2026-11-15T00:00:00.000Z' },
  });
  assert.equal(countPlan.valid, true);
  // 450 plant ops fit in batch 1 (450 ops <= 450), and metaRestore (1 op) is placed in batch 2 so batch 1 never hits 451 ops!
  assert.equal(countPlan.batches.length, 2);
  assert.equal(countPlan.batches[0].totalOpsCount, FIRESTORE_MULTI_BATCH_CHUNK_SIZE);
  assert.equal(countPlan.batches[1].totalOpsCount, 1);
  assert.ok(countPlan.batches[1].metaRestore);

  // 2. Fewer operations containing large image strings -> splits at 7 MiB byte limit
  const largeImageStr = 'data:image/jpeg;base64,' + 'A'.repeat(800_000); // ~800 KB each
  const heavyOps: CompensatingRollbackOp[] = Array.from({ length: 12 }, (_, i) => {
    const data = { ...makePlant(`heavy-${i}`), image: largeImageStr };
    return {
      id: `heavy-${i}`,
      kind: 'set_plant',
      data,
      estimatedBytes: estimateRollbackOpBytes(`heavy-${i}`, 'set_plant', data),
    };
  });
  // 12 * ~800 KB = ~9.6 MiB -> exceeds 7 MiB (7,340,032 bytes), must split into 2 batches (8 in batch 1, 4 in batch 2)
  const bytePlan = planCompensatingRollbackBatches(heavyOps, {
    metaRestore: { deletedIds: [], updatedAtIso: '2026-11-15T00:00:00.000Z' },
  });
  assert.equal(bytePlan.valid, true);
  assert.equal(bytePlan.batches.length, 2);
  assert.ok(bytePlan.batches[0].estimatedBytes <= FIRESTORE_MAX_BATCH_BYTES);
  assert.ok(bytePlan.batches[1].estimatedBytes <= FIRESTORE_MAX_BATCH_BYTES);
  assert.equal(
    bytePlan.batches[0].ops.length + bytePlan.batches[1].ops.length,
    heavyOps.length
  );

  // 3. Single oversized operation (> 950 KB) -> detected upfront before any commit, never silently skipped
  const oversizedOp: CompensatingRollbackOp = {
    id: 'oversized-plant-1',
    kind: 'set_plant',
    data: { id: 'oversized-plant-1', blob: 'X'.repeat(1_100_000) },
    estimatedBytes: 1_100_100,
  };
  let oversizedBatchCommitted = false;
  const oversizedExec = await executeCompensatingRollbackBatches({
    opsList: [heavyOps[0], oversizedOp],
    ops: {
      createBatch: () => ({
        setPlant: () => {},
        deletePlant: () => {},
        setDeletedSeedsMeta: () => {},
        commit: async () => {
          oversizedBatchCommitted = true;
        },
      }),
    },
  });
  assert.equal(oversizedExec.ok, false);
  assert.equal(oversizedBatchCommitted, false);
  assert.deepEqual(oversizedExec.oversizedIds, ['oversized-plant-1']);
  assert.deepEqual(oversizedExec.restoredIds, []);
  assert.deepEqual(oversizedExec.unrestoredIds, ['heavy-0', 'oversized-plant-1']);

  // 4. Failure during one rollback batch -> accurate reporting of restoredIds vs unrestoredIds
  const restoredInDb = new Set<string>();
  let batchCommitIdx = 0;
  const partialExec = await executeCompensatingRollbackBatches({
    opsList: heavyOps, // 2 batches: 9 ops in batch 1 (~7.2 MiB <= 7.34 MiB), 3 ops in batch 2
    metaRestore: { deletedIds: ['seed-1'], updatedAtIso: '2026-11-15T00:00:00.000Z' },
    ops: {
      createBatch: () => {
        const pending: string[] = [];
        return {
          setPlant: (id) => pending.push(id),
          deletePlant: (id) => pending.push(id),
          setDeletedSeedsMeta: () => {},
          commit: async () => {
            batchCommitIdx += 1;
            if (batchCommitIdx === 2) {
              throw new Error('SECOND_ROLLBACK_BATCH_FAILED');
            }
            pending.forEach((id) => restoredInDb.add(id));
          },
        };
      },
    },
  });
  assert.equal(partialExec.ok, false);
  assert.equal(partialExec.batchesPlanned, 2);
  assert.equal(partialExec.batchesAttempted, 2);
  assert.equal(partialExec.batchesSucceeded, 1);
  assert.equal(
    partialExec.restoredIds.length + partialExec.unrestoredIds.length,
    heavyOps.length
  );
  assert.deepEqual(partialExec.restoredIds, Array.from(restoredInDb));
  for (const id of partialExec.unrestoredIds) {
    assert.equal(restoredInDb.has(id), false);
  }
});

// ---------------------------------------------------------------------------
// 5. ISSUE THREE — Multi-Batch Import/Reset Durable Crash Recovery Tests
// ---------------------------------------------------------------------------
test('ISSUE 3 — Multi-Batch Crash Recovery: handles early/late batch failure, simulated restart, idempotent multi-attempt recovery, failed recovery, and blocks concurrent operations', async () => {
  const dbPlants = new Map<string, any>();
  let deletedMeta: string[] = [];
  let failOnCommitNumber: number | null = null;
  let alwaysFailCommits = false;
  let commitCounter = 0;

  const makeOps = (): CatalogBatchOps => ({
    createBatch: () => {
      const staged: Array<() => void> = [];
      return {
        setPlant: (id, data) => staged.push(() => dbPlants.set(id, data)),
        deletePlant: (id) => staged.push(() => dbPlants.delete(id)),
        setDeletedSeedsMeta: (ids) =>
          staged.push(() => {
            deletedMeta = ids;
          }),
        commit: async () => {
          commitCounter += 1;
          if (alwaysFailCommits || (failOnCommitNumber !== null && commitCounter === failOnCommitNumber)) {
            throw new Error(`Simulated Firestore commit failure at #${commitCounter}`);
          }
          staged.forEach((fn) => fn());
        },
      };
    },
  });

  const journalBacking = new MockStorage();
  const journalStore = createLocalStorageJournalStore(journalBacking);

  // 1. Successful multi-batch operation (510 plants -> 2 batches) clears journal on completion
  const plants510 = Array.from({ length: 510 }, (_, i) => makePlant(`imp-${i}`, 100));
  const successImport = await executeReliableCatalogImport({
    rawPlants: plants510,
    prevPlants: [],
    prevDeletedIds: ['brahmyaman-amrapali-mango'],
    sanitizePlant: (p) => p as any,
    defaultIso: '2026-11-15T00:00:00.000Z',
    defaultBn: 'আজ',
    ops: makeOps(),
    journalStore,
  });
  assert.equal(successImport.ok, true);
  assert.equal(successImport.atomic, false);
  assert.equal(dbPlants.size, 510);
  assert.equal(journalStore.readJournal(), null);

  // 2. Failure after an early batch (Batch 2 fails after Batch 1 committed) -> auto-rolls back Batch 1
  dbPlants.clear();
  dbPlants.set('imp-0', makePlant('imp-0', 55)); // pre-existing plant with price 55
  commitCounter = 0;
  failOnCommitNumber = 2; // Batch 1 (450 plants) succeeds; Batch 2 (60 plants) fails; Rollback Batch 3 & 4 succeed
  const earlyFailImport = await executeReliableCatalogImport({
    rawPlants: plants510,
    prevPlants: [makePlant('imp-0', 55)],
    prevDeletedIds: ['brahmyaman-amrapali-mango'],
    sanitizePlant: (p) => p as any,
    defaultIso: '2026-11-15T00:00:00.000Z',
    defaultBn: 'আজ',
    ops: makeOps(),
    journalStore,
  });
  assert.equal(earlyFailImport.ok, false);
  assert.equal(earlyFailImport.recoveryAttempted, true);
  assert.equal(earlyFailImport.recoverySucceeded, true);
  assert.equal(dbPlants.size, 1);
  assert.equal(dbPlants.get('imp-0').options[0].price, 55);
  assert.equal(journalStore.readJournal(), null);

  // 3. Failure after a later batch (950 plants -> 3 batches: Batch 1 & 2 commit 900 plants, Batch 3 fails)
  const plants950 = Array.from({ length: 950 }, (_, i) => makePlant(`late-${i}`, 120));
  dbPlants.clear();
  commitCounter = 0;
  failOnCommitNumber = 3; // Batch 3 fails after 900 plants committed in Batch 1 & 2
  const lateFailImport = await executeReliableCatalogImport({
    rawPlants: plants950,
    prevPlants: [],
    prevDeletedIds: [],
    sanitizePlant: (p) => p as any,
    defaultIso: '2026-11-15T00:00:00.000Z',
    defaultBn: 'আজ',
    ops: makeOps(),
    journalStore,
  });
  assert.equal(lateFailImport.ok, false);
  assert.equal(lateFailImport.recoveryAttempted, true);
  assert.equal(lateFailImport.recoverySucceeded, true);
  assert.equal(dbPlants.size, 0);
  assert.equal(journalStore.readJournal(), null);

  // 4. Recovery itself fails (network disconnects during Batch 2 AND stays offline during rollback)
  //    -> Journal persists in 'failed_incomplete', blocks concurrent import/reset, and succeeds on retry!
  dbPlants.clear();
  for (let i = 0; i < 520; i += 1) {
    dbPlants.set(`reset-doc-${i}`, makePlant(`reset-doc-${i}`, 90));
  }
  const remoteBackup520 = Array.from({ length: 520 }, (_, i) => ({
    id: `reset-doc-${i}`,
    data: makePlant(`reset-doc-${i}`, 90) as any,
  }));

  let customCommitCount = 0;
  const offlineAfterBatch1Ops: CatalogBatchOps = {
    createBatch: () => {
      const staged: Array<() => void> = [];
      return {
        setPlant: (id, data) => staged.push(() => dbPlants.set(id, data)),
        deletePlant: (id) => staged.push(() => dbPlants.delete(id)),
        setDeletedSeedsMeta: (ids) =>
          staged.push(() => {
            deletedMeta = ids;
          }),
        commit: async () => {
          customCommitCount += 1;
          if (customCommitCount >= 2) {
            throw new Error('NETWORK_DISCONNECTED');
          }
          staged.forEach((fn) => fn());
        },
      };
    },
  };

  const failedResetWithFailedRecovery = await executeReliableCatalogReset({
    remoteDocsBackup: remoteBackup520,
    prevDeletedIds: ['brahmyaman-amrapali-mango'],
    ops: offlineAfterBatch1Ops,
    journalStore,
  });
  assert.equal(failedResetWithFailedRecovery.ok, false);
  assert.equal(failedResetWithFailedRecovery.recoveryAttempted, true);
  assert.equal(failedResetWithFailedRecovery.recoverySucceeded, false);
  assert.equal(dbPlants.size, 70); // 450 deleted in Batch 1, 70 remain

  // Verify durable journal survived in 'failed_incomplete' state with 520 unrestored IDs (450 confirmed + 70 ambiguous in-flight)
  const persistedJournal = journalStore.readJournal();
  assert.ok(persistedJournal);
  assert.equal(persistedJournal.state, 'failed_incomplete');
  assert.equal(persistedJournal.unrestoredIds.length, 520);
  assert.equal(persistedJournal.ambiguousIds?.length, 70);

  // 5. Repeated import or reset request while previous operation is incomplete MUST be blocked
  const blockedImport = await executeReliableCatalogImport({
    rawPlants: [makePlant('new-1')],
    prevPlants: [],
    prevDeletedIds: [],
    sanitizePlant: (p) => p as any,
    defaultIso: '2026-11-15T00:00:00.000Z',
    defaultBn: 'আজ',
    ops: makeOps(),
    journalStore,
  });
  assert.equal(blockedImport.ok, false);
  assert.equal(blockedImport.blockedByIncompleteOperation, true);
  assert.equal(blockedImport.activeOperationId, persistedJournal.operationId);

  const blockedReset = await executeReliableCatalogReset({
    remoteDocsBackup: [],
    prevDeletedIds: [],
    ops: makeOps(),
    journalStore,
  });
  assert.equal(blockedReset.ok, false);
  assert.equal(blockedReset.blockedByIncompleteOperation, true);

  // 6. Simulated application restart: new JournalStore instance reads from same persistent storage
  //    First retry fails again -> journal increments recoveryAttempts and stays intact
  failOnCommitNumber = null;
  alwaysFailCommits = true;
  const restartedJournalStore = createLocalStorageJournalStore(journalBacking);
  const retryFail = await recoverIncompleteCatalogOperation({
    ops: makeOps(),
    journalStore: restartedJournalStore,
  });
  assert.equal(retryFail.foundIncomplete, true);
  assert.equal(retryFail.ok, false);
  assert.equal(retryFail.stateAfterRecovery, 'failed_incomplete');
  assert.equal(retryFail.recoveryAttempts, 2);
  assert.equal(retryFail.unrestoredIds.length, 520);

  // 7. Second recovery attempt after network reconnects -> idempotently restores all 520 docs & clears journal
  alwaysFailCommits = false;
  const retrySuccess = await recoverIncompleteCatalogOperation({
    ops: makeOps(),
    journalStore: restartedJournalStore,
  });
  assert.equal(retrySuccess.foundIncomplete, true);
  assert.equal(retrySuccess.ok, true);
  assert.equal(retrySuccess.stateAfterRecovery, 'completed');
  assert.equal(retrySuccess.restoredIds.length, 520);
  assert.equal(retrySuccess.unrestoredIds.length, 0);
  assert.equal(dbPlants.size, 520);
  assert.deepEqual(deletedMeta, ['brahmyaman-amrapali-mango']);
  assert.equal(restartedJournalStore.readJournal(), null);

  // 8. Calling recovery a third time after completion is a clean idempotent no-op
  const idempotentNoop = await recoverIncompleteCatalogOperation({
    ops: makeOps(),
    journalStore: restartedJournalStore,
  });
  assert.equal(idempotentNoop.foundIncomplete, false);
  assert.equal(idempotentNoop.ok, true);
});

// ---------------------------------------------------------------------------
// 6. ISSUE FOUR — Deleted IDs Limit (>500) & Tombstone Retention Policy Tests
// ---------------------------------------------------------------------------
test('ISSUE 4 — Tombstone Retention (>500 IDs): preserves 100% of allDeletedIds, pins static seed IDs, retains newest custom deletions in Firestore 500-cap, and maintains import/trash compatibility', async () => {
  const pinnedSeeds = new Set([
    'brahmyaman-amrapali-mango',
    'brahmyaman-dalim-pomegranate',
    'brahmyaman-raktajaba',
  ]);

  // Existing metadata with 500 IDs (3 oldest are built-in static seeds + 497 custom plant IDs)
  const existing500 = [
    'brahmyaman-amrapali-mango',
    'brahmyaman-dalim-pomegranate',
    'brahmyaman-raktajaba',
    ...Array.from({ length: 497 }, (_, i) => `custom-old-${i + 1}`),
  ];
  assert.equal(existing500.length, 500);

  // Delete 25 more custom plants -> total 525 deleted IDs
  const newDeletions25 = Array.from({ length: 25 }, (_, i) => `custom-new-${i + 1}`);
  const reconciled = reconcileDeletedPlantIds([...existing500, ...newDeletions25], {
    pinnedSeedIds: pinnedSeeds,
  });

  // 1. Zero truncation in full history (`allDeletedIds` has all 525 IDs, including oldest custom IDs)
  assert.equal(reconciled.allDeletedIds.length, 525);
  assert.ok(reconciled.allDeletedIds.includes('custom-old-1'));
  assert.ok(reconciled.allDeletedIds.includes('custom-new-25'));

  // 2. Firestore payload strictly <= 500 items for `firestore.rules` compatibility
  assert.equal(reconciled.firestoreDeletedIds.length, 500);
  assert.equal(reconciled.retentionPolicyApplied, true);
  assert.equal(reconciled.requiresSchemaMigration, false);

  // 3. All 3 oldest built-in static seed IDs remain permanently pinned in `firestoreDeletedIds`
  for (const seedId of pinnedSeeds) {
    assert.ok(
      reconciled.firestoreDeletedIds.includes(seedId),
      `Pinned seed ${seedId} must never be evicted from Firestore deleted_seeds`
    );
  }

  // 4. All 25 newly deleted IDs (`custom-new-1`..`custom-new-25`) are included in `firestoreDeletedIds` (fixes old `.slice(0, 500)` bug!)
  for (const newId of newDeletions25) {
    assert.ok(
      reconciled.firestoreDeletedIds.includes(newId),
      `Newly deleted ID ${newId} must be included in Firestore deleted_seeds`
    );
  }

  // 5. The 25 oldest custom IDs (`custom-old-1`..`custom-old-25`) are tracked in `archivedCustomIds` and remain in `allDeletedIds`
  assert.equal(reconciled.archivedCustomIds.length, 25);
  assert.equal(reconciled.archivedCustomIds[0], 'custom-old-1');
  assert.equal(reconciled.archivedCustomIds[24], 'custom-old-25');

  // 6. Backup/Restore & Import compatibility: re-importing a deleted plant as active removes it from tombstones while keeping >500 history intact
  const dbPlants = new Map<string, any>();
  let firestoreMetaWritten: string[] = [];
  const importRes = await executeReliableCatalogImport({
    rawPlants: [
      makePlant('brahmyaman-amrapali-mango', 150, 'active'), // restored from backup!
      makePlant('custom-old-1', 90, 'active'), // older archived custom plant restored from backup!
    ],
    prevPlants: [],
    prevDeletedIds: reconciled.allDeletedIds,
    sanitizePlant: (p) => p as any,
    defaultIso: '2026-11-15T00:00:00.000Z',
    defaultBn: 'আজ',
    pinnedSeedIds: pinnedSeeds,
    ops: {
      createBatch: () => {
        const staged: Array<() => void> = [];
        return {
          setPlant: (id, data) => staged.push(() => dbPlants.set(id, data)),
          deletePlant: (id) => staged.push(() => dbPlants.delete(id)),
          setDeletedSeedsMeta: (ids) =>
            staged.push(() => {
              firestoreMetaWritten = ids;
            }),
          commit: async () => {
            staged.forEach((fn) => fn());
          },
        };
      },
    },
  });

  assert.equal(importRes.ok, true);
  assert.equal(importRes.nextDeletedIds.length, 523); // 525 - 2 restored active plants
  assert.equal(importRes.nextDeletedIds.includes('brahmyaman-amrapali-mango'), false);
  assert.equal(importRes.nextDeletedIds.includes('custom-old-1'), false);
  assert.equal(firestoreMetaWritten.length, 500);
  assert.equal(firestoreMetaWritten.includes('brahmyaman-amrapali-mango'), false);
  assert.equal(firestoreMetaWritten.includes('brahmyaman-dalim-pomegranate'), true);

  // 7. Trash Empty compatibility with >500 deleted IDs
  const trashRes = await executeReliableTrashEmpty({
    trashedIds: ['trash-526', 'trash-527'],
    prevDeletedSeedIds: existing500,
    pinnedSeedIds: pinnedSeeds,
    ops: {
      createBatch: () => {
        const staged: Array<() => void> = [];
        return {
          setPlant: () => {},
          deletePlant: () => {},
          setDeletedSeedsMeta: (ids) =>
            staged.push(() => {
              firestoreMetaWritten = ids;
            }),
          commit: async () => {
            staged.forEach((fn) => fn());
          },
        };
      },
    },
  });
  assert.equal(trashRes.ok, true);
  assert.equal(trashRes.nextDeletedSeedIds.length, 502);
  assert.equal(trashRes.firestoreDeletedSeedIds.length, 500);
  assert.ok(trashRes.firestoreDeletedSeedIds.includes('trash-526'));
  assert.ok(trashRes.firestoreDeletedSeedIds.includes('trash-527'));
  assert.ok(trashRes.firestoreDeletedSeedIds.includes('brahmyaman-amrapali-mango'));
});

// ---------------------------------------------------------------------------
// 7. Cloudinary Alignment, Orphan Scanner & Rollback Diagnostic Tests
// ---------------------------------------------------------------------------
test('Cloudinary alignment preserves 1-to-1 slots across mixed preset + Cloudinary URLs & detects true orphans vs trash-only assets', async () => {
  const aligned = alignPlantImageSlots(
    [
      '/assets/local_preset.jpg',
      'https://res.cloudinary.com/nursery/image/upload/w_1200,q_auto/v123/brahmyaman/slot2.webp',
      '',
    ],
    ['stale-pid-0', 'brahmyaman/slot2', 'stale-pid-2']
  );
  assert.deepEqual(aligned.cloudinaryPublicIds, ['', 'brahmyaman/slot2']);

  const activePlant = makePlant('active-rose', 70, 'active');
  const trashedPlant = makePlant('trashed-mango', 120, 'deleted');
  const refs = collectReferencedCloudinaryPublicIds([activePlant, trashedPlant]);
  assert.ok(refs.activePublicIds.has('brahmyaman/active-rose'));
  assert.ok(refs.trashedPublicIds.has('brahmyaman/trashed-mango'));

  const scanReport = await scanCloudinaryOrphans({
    plants: [activePlant, trashedPlant],
    fetchResourcePage: async () => ({
      resources: [
        { public_id: 'brahmyaman/active-rose', url: 'https://res.cloudinary.com/demo/active.webp', bytes: 2048 },
        { public_id: 'brahmyaman/trashed-mango', url: 'https://res.cloudinary.com/demo/trashed.webp', bytes: 4096 },
        { public_id: 'brahmyaman/orphan-unused', url: 'https://res.cloudinary.com/demo/orphan.webp', bytes: 8192 },
      ],
      next_cursor: null,
    }),
  });
  assert.equal(scanReport.activeReferencedCount, 1);
  assert.equal(scanReport.trashedOnlyAssets.length, 1);
  assert.equal(scanReport.orphans.length, 1);
  assert.equal(scanReport.orphans[0].publicId, 'brahmyaman/orphan-unused');
});

test('Firestore rollback diagnostic verifies zero UI desync on injected write failure', async () => {
  const result = await runPlantUpdateRollbackDiagnostic({ mode: 'injected_failure' });
  assert.equal(result.passed, true);
  assert.equal(result.failureTriggered, true);
  assert.equal(result.uiDesyncDetected, false);
  assert.equal(result.finalPriceInState, result.originalPrice);
  assert.equal(result.finalPriceInRef, result.originalPrice);
});

// ---------------------------------------------------------------------------
// 8. GAP 1 — Ambiguous Batch Commits (Network Response Lost After Server Commit)
// ---------------------------------------------------------------------------
test('GAP 1 — Ambiguous Batch Commits: rolls back BOTH confirmed batches AND in-flight batch when network drops after server actually committed', async () => {
  const dbPlants = new Map<string, any>();
  let deletedMeta: string[] = ['brahmyaman-amrapali-mango'];
  let commitCall = 0;

  // Pre-seed 1 existing plant that will be overwritten in Batch 1, plus 1 existing plant overwritten in Batch 2
  dbPlants.set('ambig-0', makePlant('ambig-0', 50));
  dbPlants.set('ambig-460', makePlant('ambig-460', 60));

  const journalBacking = new MockStorage();
  const journalStore = createLocalStorageJournalStore(journalBacking);

  // Simulate network drop on Batch 2 AFTER Firestore server already applied Batch 2's writes!
  const ambiguousImportOps: CatalogBatchOps = {
    createBatch: () => {
      const staged: Array<() => void> = [];
      return {
        setPlant: (id, data) => staged.push(() => dbPlants.set(id, data)),
        deletePlant: (id) => staged.push(() => dbPlants.delete(id)),
        setDeletedSeedsMeta: (ids) =>
          staged.push(() => {
            deletedMeta = ids;
          }),
        commit: async () => {
          commitCall += 1;
          // Server ACTUALLY commits the staged writes before the HTTP response is lost!
          staged.forEach((fn) => fn());
          if (commitCall === 2) {
            throw new Error('NETWORK_RESPONSE_LOST_AFTER_SERVER_COMMIT');
          }
        },
      };
    },
  };

  const importPlants510 = Array.from({ length: 510 }, (_, i) => makePlant(`ambig-${i}`, 199));
  const importRes = await executeReliableCatalogImport({
    rawPlants: importPlants510,
    prevPlants: [makePlant('ambig-0', 50), makePlant('ambig-460', 60)],
    prevDeletedIds: ['brahmyaman-amrapali-mango'],
    sanitizePlant: (p) => p as any,
    defaultIso: '2026-11-15T00:00:00.000Z',
    defaultBn: 'আজ',
    ops: ambiguousImportOps,
    journalStore,
  });

  assert.equal(importRes.ok, false);
  assert.equal(importRes.recoveryAttempted, true);
  assert.equal(importRes.recoverySucceeded, true);
  assert.equal(importRes.ambiguousIds?.length, 60);
  // Every newly created plant from Batch 1 (450) AND ambiguous Batch 2 (60) must be deleted,
  // and the 2 pre-existing plants ('ambig-0' in Batch 1 and 'ambig-460' in ambiguous Batch 2) must be restored to their original prices!
  assert.equal(dbPlants.size, 2);
  assert.equal(dbPlants.get('ambig-0')?.options[0].price, 50);
  assert.equal(dbPlants.get('ambig-460')?.options[0].price, 60);
  assert.deepEqual(deletedMeta, ['brahmyaman-amrapali-mango']);
  assert.equal(journalStore.readJournal(), null);

  // Now verify the exact same ambiguous commit scenario for Multi-Batch Catalog Reset (520 remote docs)
  dbPlants.clear();
  for (let i = 0; i < 520; i += 1) {
    dbPlants.set(`rst-${i}`, makePlant(`rst-${i}`, 110));
  }
  const remoteBackup520 = Array.from({ length: 520 }, (_, i) => ({
    id: `rst-${i}`,
    data: makePlant(`rst-${i}`, 110) as any,
  }));

  commitCall = 0;
  const resetRes = await executeReliableCatalogReset({
    remoteDocsBackup: remoteBackup520,
    prevDeletedIds: ['brahmyaman-amrapali-mango'],
    ops: ambiguousImportOps,
    journalStore,
  });

  assert.equal(resetRes.ok, false);
  assert.equal(resetRes.recoveryAttempted, true);
  assert.equal(resetRes.recoverySucceeded, true);
  assert.equal(resetRes.ambiguousIds?.length, 70);
  // Even though Batch 2's 70 deletes actually executed on the server before throwing NETWORK_RESPONSE_LOST,
  // all 520 plants (450 from Batch 1 + 70 from ambiguous Batch 2) are restored!
  assert.equal(dbPlants.size, 520);
  assert.deepEqual(deletedMeta, ['brahmyaman-amrapali-mango']);
  assert.equal(journalStore.readJournal(), null);
});

// ---------------------------------------------------------------------------
// 9. GAP 2 — Journal Write Failure Halts Import/Reset Safely Before Mutating Firestore
// ---------------------------------------------------------------------------
test('GAP 2 — Journal Write Failure: aborts multi-batch import/reset with 0 Firestore commits when initial journal write fails, and rolls back prior batches if mid-flight journal write fails', async () => {
  const dbPlants = new Map<string, any>();
  let commitCalls = 0;

  const makeOps = (): CatalogBatchOps => ({
    createBatch: () => {
      const staged: Array<() => void> = [];
      return {
        setPlant: (id, data) => staged.push(() => dbPlants.set(id, data)),
        deletePlant: (id) => staged.push(() => dbPlants.delete(id)),
        setDeletedSeedsMeta: () => {},
        commit: async () => {
          commitCalls += 1;
          staged.forEach((fn) => fn());
        },
      };
    },
  });

  const brokenStorage = new MockStorage();
  brokenStorage.throwOnWrite = true;
  const brokenJournalStore = createLocalStorageJournalStore(brokenStorage);

  const plants510 = Array.from({ length: 510 }, (_, i) => makePlant(`jfail-${i}`, 90));

  // 1. Initial journal write fails before Batch 1 -> Import stops immediately with 0 Firestore commits
  const abortedImport = await executeReliableCatalogImport({
    rawPlants: plants510,
    prevPlants: [],
    prevDeletedIds: ['brahmyaman-amrapali-mango'],
    sanitizePlant: (p) => p as any,
    defaultIso: '2026-11-15T00:00:00.000Z',
    defaultBn: 'আজ',
    ops: makeOps(),
    journalStore: brokenJournalStore,
  });
  assert.equal(abortedImport.ok, false);
  assert.equal(abortedImport.journalWriteFailed, true);
  assert.equal(commitCalls, 0);
  assert.equal(dbPlants.size, 0);

  // 2. Initial journal write fails before Batch 1 -> Reset stops immediately with 0 Firestore commits
  const backup510 = plants510.map((p) => ({ id: p.id, data: p as any }));
  const abortedReset = await executeReliableCatalogReset({
    remoteDocsBackup: backup510,
    prevDeletedIds: ['brahmyaman-amrapali-mango'],
    ops: makeOps(),
    journalStore: brokenJournalStore,
  });
  assert.equal(abortedReset.ok, false);
  assert.equal(abortedReset.journalWriteFailed, true);
  assert.equal(commitCalls, 0);

  // 3. Mid-operation journal write failure before Batch 2 (after Batch 1 committed) -> halts Batch 2 and rolls back Batch 1
  let writeCount = 0;
  const midFailJournalStore = {
    readJournal: () => null,
    writeJournal: () => {
      writeCount += 1;
      // Allow initial journal write (#1), pre-Batch-1 write (#2), and post-Batch-1 write (#3);
      // fail on pre-Batch-2 journal write (#4)!
      return writeCount < 4;
    },
    clearJournal: () => {},
  };

  const midAbortImport = await executeReliableCatalogImport({
    rawPlants: plants510,
    prevPlants: [],
    prevDeletedIds: [],
    sanitizePlant: (p) => p as any,
    defaultIso: '2026-11-15T00:00:00.000Z',
    defaultBn: 'আজ',
    ops: makeOps(),
    journalStore: midFailJournalStore,
  });
  assert.equal(midAbortImport.ok, false);
  assert.equal(midAbortImport.journalWriteFailed, true);
  assert.equal(midAbortImport.recoveryAttempted, true);
  assert.equal(midAbortImport.recoverySucceeded, true);
  assert.equal(dbPlants.size, 0);
});

// ---------------------------------------------------------------------------
// 10. GAP 3 — Browser Startup Incomplete Operation Detection & Auth-Gated Recovery
// ---------------------------------------------------------------------------
test('GAP 3 — Browser Startup Recovery: detects incomplete journal on boot, preserves journal while waiting for admin auth, and automatically recovers once authenticated', async () => {
  const dbPlants = new Map<string, any>();
  let deletedMeta: string[] = [];
  let failCommits = false;

  const makeOps = (): CatalogBatchOps => ({
    createBatch: () => {
      const staged: Array<() => void> = [];
      return {
        setPlant: (id, data) => staged.push(() => dbPlants.set(id, data)),
        deletePlant: (id) => staged.push(() => dbPlants.delete(id)),
        setDeletedSeedsMeta: (ids) =>
          staged.push(() => {
            deletedMeta = ids;
          }),
        commit: async () => {
          if (failCommits) {
            throw new Error('OFFLINE_DURING_STARTUP_RECOVERY');
          }
          staged.forEach((fn) => fn());
        },
      };
    },
  });

  const storage = new MockStorage();
  const journalStore = createLocalStorageJournalStore(storage);

  // Simulate browser crash right after Batch 1 of an import modified 2 plants
  dbPlants.set('crash-new-1', makePlant('crash-new-1', 120));
  dbPlants.set('crash-existing-1', makePlant('crash-existing-1', 250)); // was 80 before crash
  journalStore.writeJournal({
    operationId: 'op-import-startup-test',
    kind: 'import',
    state: 'in_progress',
    startedAt: '2026-11-15T10:00:00.000Z',
    updatedAt: '2026-11-15T10:00:02.000Z',
    totalBatches: 2,
    completedBatches: 1,
    affectedIds: ['crash-new-1', 'crash-existing-1'],
    ambiguousIds: [],
    restoredIds: [],
    unrestoredIds: ['crash-new-1', 'crash-existing-1'],
    priorPlantsById: {
      'crash-new-1': null,
      'crash-existing-1': makePlant('crash-existing-1', 80) as any,
    },
    prevDeletedIds: ['brahmyaman-amrapali-mango'],
    recoveryAttempts: 0,
  });

  // Step 1: On browser open, getIncompleteCatalogOperationJournal immediately detects the crashed op
  const detectedAtBoot = getIncompleteCatalogOperationJournal(journalStore);
  assert.ok(detectedAtBoot);
  assert.equal(detectedAtBoot.operationId, 'op-import-startup-test');

  // Step 2: Startup recovery runs before Firebase Auth has finished restoring the admin session
  const preAuthResult = await runStartupCatalogRecovery({
    isAdminAuthenticated: false,
    ops: makeOps(),
    journalStore,
  });
  assert.equal(preAuthResult.foundIncomplete, true);
  assert.equal(preAuthResult.waitingForAuth, true);
  assert.equal(preAuthResult.attempted, false);
  assert.equal(preAuthResult.ok, false);
  // Journal must remain intact in localStorage while waiting for auth
  assert.ok(journalStore.readJournal());

  // Step 3: Admin auth becomes ready, but browser is temporarily offline -> journal transitions to 'failed_incomplete'
  failCommits = true;
  const offlineAuthResult = await runStartupCatalogRecovery({
    isAdminAuthenticated: true,
    ops: makeOps(),
    journalStore,
  });
  assert.equal(offlineAuthResult.foundIncomplete, true);
  assert.equal(offlineAuthResult.waitingForAuth, false);
  assert.equal(offlineAuthResult.attempted, true);
  assert.equal(offlineAuthResult.ok, false);
  assert.equal(offlineAuthResult.stateAfterRecovery, 'failed_incomplete');
  assert.equal(offlineAuthResult.recoveryAttempts, 1);

  // Step 4: Network reconnects / startup recovery runs with authenticated admin -> restores DB & clears journal
  failCommits = false;
  const onlineAuthResult = await runStartupCatalogRecovery({
    isAdminAuthenticated: true,
    ops: makeOps(),
    journalStore,
  });
  assert.equal(onlineAuthResult.foundIncomplete, true);
  assert.equal(onlineAuthResult.attempted, true);
  assert.equal(onlineAuthResult.ok, true);
  assert.equal(onlineAuthResult.stateAfterRecovery, 'completed');
  assert.equal(dbPlants.has('crash-new-1'), false);
  assert.equal(dbPlants.get('crash-existing-1')?.options[0].price, 80);
  assert.deepEqual(deletedMeta, ['brahmyaman-amrapali-mango']);
  assert.equal(journalStore.readJournal(), null);
});

// ---------------------------------------------------------------------------
// 11. GAP 4 — Cross-Device Stale Catalog Resurrection Prevention
// ---------------------------------------------------------------------------
test('GAP 4 — Cross-Device Sync: prevents deleted static seeds or >500 archived custom plants from resurrecting on Device 2, and honors cross-device seed restores', () => {
  const staticSeeds = [
    makePlant('brahmyaman-amrapali-mango', 120),
    makePlant('brahmyaman-raktajaba', 80),
    makePlant('brahmyaman-tulsi', 40),
  ];
  const pinnedSeedIds = new Set(staticSeeds.map((p) => p.id));

  // Scenario A:
  // Device 1 permanently deleted:
  //  - built-in seed 'brahmyaman-amrapali-mango'
  //  - old custom plant 'custom-archived-1'
  //  - 499 newer custom plants ('custom-new-1' .. 'custom-new-499')
  // So Firestore `catalog_meta/deleted_seeds` has 500 IDs: 'brahmyaman-amrapali-mango' + 'custom-new-1'..'custom-new-499'
  // ('custom-archived-1' was evicted from Firestore's 500-item array cap AND deleted from Firestore `/plants`).
  // Firestore `/plants` currently contains ONLY 'custom-active-999' and 'brahmyaman-raktajaba'.
  const remoteDeletedIds500 = [
    'brahmyaman-amrapali-mango',
    ...Array.from({ length: 499 }, (_, i) => `custom-new-${i + 1}`),
  ];
  const remotePlantsOnServer = [
    makePlant('brahmyaman-raktajaba', 85),
    makePlant('custom-active-999', 150),
  ];

  // Device 2 had 'custom-archived-1' in its localDeletedIds from earlier, or had stale local state.
  const device2SyncA = reconcileCrossDeviceCatalogSync({
    remotePlants: remotePlantsOnServer,
    remotePlantsEmpty: false,
    remoteDeletedIds: remoteDeletedIds500,
    localDeletedIds: ['custom-archived-1'],
    staticSeedCatalog: staticSeeds,
    pinnedSeedIds,
  });

  const resultingPlantIdsA = device2SyncA.plants.map((p) => p.id);
  // 1. Deleted built-in seed 'brahmyaman-amrapali-mango' MUST NOT resurrect
  assert.equal(resultingPlantIdsA.includes('brahmyaman-amrapali-mango'), false);
  // 2. Deleted archived custom plant 'custom-archived-1' MUST NOT resurrect
  assert.equal(resultingPlantIdsA.includes('custom-archived-1'), false);
  // 3. Active server custom plant + non-deleted static seeds ARE present
  assert.deepEqual(resultingPlantIdsA.sort(), [
    'brahmyaman-raktajaba',
    'brahmyaman-tulsi',
    'custom-active-999',
  ]);
  // 4. Device 2 preserves 'custom-archived-1' in its merged local deletion history (501 total)
  assert.equal(device2SyncA.mergedDeletedIds.length, 501);
  assert.ok(device2SyncA.mergedDeletedIds.includes('custom-archived-1'));

  // Scenario B:
  // Now Device 1 RESTORES 'brahmyaman-amrapali-mango' back to active catalog (removing it from Firestore `deleted_seeds`).
  // Device 2 still has 'brahmyaman-amrapali-mango' in its stale `localDeletedIds`.
  // When Device 2 receives the updated `remoteDeletedIds` (without 'brahmyaman-amrapali-mango'),
  // it must NOT re-hide 'brahmyaman-amrapali-mango'!
  const remoteDeletedAfterRestore = Array.from({ length: 499 }, (_, i) => `custom-new-${i + 1}`);
  const device2SyncB = reconcileCrossDeviceCatalogSync({
    remotePlants: [
      makePlant('brahmyaman-amrapali-mango', 120),
      ...remotePlantsOnServer,
    ],
    remotePlantsEmpty: false,
    remoteDeletedIds: remoteDeletedAfterRestore,
    localDeletedIds: device2SyncA.mergedDeletedIds, // still contains 'brahmyaman-amrapali-mango' locally!
    staticSeedCatalog: staticSeeds,
    pinnedSeedIds,
  });

  const resultingPlantIdsB = device2SyncB.plants.map((p) => p.id);
  assert.equal(resultingPlantIdsB.includes('brahmyaman-amrapali-mango'), true);
  assert.equal(device2SyncB.mergedDeletedIds.includes('brahmyaman-amrapali-mango'), false);
  assert.equal(device2SyncB.mergedDeletedIds.includes('custom-archived-1'), true);
});

// ---------------------------------------------------------------------------
// 12. GAP 5 — handleEmptyTrash / executeReliableTrashEmpty Multi-Batch (>499) Failure Paths
// ---------------------------------------------------------------------------
test('GAP 5 — Multi-Batch Trash Empty (>499 items): blocks on incomplete journal, handles Batch 1 or Batch 2 failure cleanly without corrupting tombstones, and completes on retry', async () => {
  const pinnedSeeds = new Set(['brahmyaman-amrapali-mango', 'brahmyaman-raktajaba']);
  const trashed520 = Array.from({ length: 520 }, (_, i) => `trash-item-${i + 1}`);
  const priorDeleted500 = [
    'brahmyaman-amrapali-mango',
    'brahmyaman-raktajaba',
    ...Array.from({ length: 498 }, (_, i) => `prior-del-${i + 1}`),
  ];

  const dbPlants = new Map<string, any>();
  for (const id of trashed520) {
    dbPlants.set(id, makePlant(id, 75, 'deleted'));
  }
  let firestoreDeletedMeta: string[] = [...priorDeleted500];
  let failOnBatch: number | null = null;
  let batchCounter = 0;

  const makeTrashOps = (): CatalogBatchOps => ({
    createBatch: () => {
      const staged: Array<() => void> = [];
      return {
        setPlant: (id, data) => staged.push(() => dbPlants.set(id, data)),
        deletePlant: (id) => staged.push(() => dbPlants.delete(id)),
        setDeletedSeedsMeta: (ids) =>
          staged.push(() => {
            firestoreDeletedMeta = ids;
          }),
        commit: async () => {
          batchCounter += 1;
          if (failOnBatch !== null && batchCounter === failOnBatch) {
            throw new Error(`TRASH_EMPTY_BATCH_${batchCounter}_FAILED`);
          }
          staged.forEach((fn) => fn());
        },
      };
    },
  });

  // 1. Blocked if an incomplete import/reset operation exists in the journal
  const journalStorage = new MockStorage();
  const journalStore = createLocalStorageJournalStore(journalStorage);
  journalStore.writeJournal({
    operationId: 'op-reset-blocking-trash',
    kind: 'reset',
    state: 'failed_incomplete',
    startedAt: '2026-11-15T00:00:00.000Z',
    updatedAt: '2026-11-15T00:00:01.000Z',
    totalBatches: 2,
    completedBatches: 1,
    affectedIds: ['doc-1'],
    restoredIds: [],
    unrestoredIds: ['doc-1'],
    priorPlantsById: { 'doc-1': makePlant('doc-1') as any },
    prevDeletedIds: [],
    recoveryAttempts: 1,
  });

  const blockedTrash = await executeReliableTrashEmpty({
    trashedIds: trashed520,
    prevDeletedSeedIds: priorDeleted500,
    ops: makeTrashOps(),
    pinnedSeedIds: pinnedSeeds,
    journalStore,
  });
  assert.equal(blockedTrash.ok, false);
  assert.equal(blockedTrash.blockedByIncompleteOperation, true);
  assert.equal(blockedTrash.deletedIds.length, 0);
  assert.equal(blockedTrash.failedIds.length, 520);
  assert.equal(dbPlants.size, 520);

  journalStore.clearJournal();

  // 2. Batch 1 fails immediately -> 0 items deleted, all 520 in failedIds, metadata untouched
  batchCounter = 0;
  failOnBatch = 1;
  const batch1Fail = await executeReliableTrashEmpty({
    trashedIds: trashed520,
    prevDeletedSeedIds: priorDeleted500,
    ops: makeTrashOps(),
    pinnedSeedIds: pinnedSeeds,
    journalStore,
  });
  assert.equal(batch1Fail.ok, false);
  assert.equal(batch1Fail.atomic, false);
  assert.equal(batch1Fail.deletedIds.length, 0);
  assert.equal(batch1Fail.failedIds.length, 520);
  assert.equal(batch1Fail.nextDeletedSeedIds.length, 500);
  assert.equal(dbPlants.size, 520);

  // 3. Batch 1 succeeds (450 items deleted + metadata updated), Batch 2 (70 items) fails
  batchCounter = 0;
  failOnBatch = 2;
  const batch2Fail = await executeReliableTrashEmpty({
    trashedIds: trashed520,
    prevDeletedSeedIds: priorDeleted500,
    ops: makeTrashOps(),
    pinnedSeedIds: pinnedSeeds,
    journalStore,
  });
  assert.equal(batch2Fail.ok, false);
  assert.equal(batch2Fail.atomic, false);
  assert.equal(batch2Fail.deletedIds.length, 450);
  assert.equal(batch2Fail.failedIds.length, 70);
  assert.equal(dbPlants.size, 70); // Only the 70 uncommitted trash items remain in Firestore
  assert.equal(batch2Fail.nextDeletedSeedIds.length, 950); // 500 prior + 450 committed
  assert.equal(batch2Fail.firestoreDeletedSeedIds.length, 500); // Capped at 500 for firestore.rules
  assert.equal(firestoreDeletedMeta.length, 500);
  assert.ok(firestoreDeletedMeta.includes('brahmyaman-amrapali-mango'));
  assert.ok(firestoreDeletedMeta.includes('trash-item-450'));
  assert.equal(firestoreDeletedMeta.includes('trash-item-451'), false);

  // 4. Retrying with the remaining 70 failedIds succeeds in a single atomic batch and completes the operation
  batchCounter = 0;
  failOnBatch = null;
  const retryRemaining70 = await executeReliableTrashEmpty({
    trashedIds: batch2Fail.failedIds,
    prevDeletedSeedIds: batch2Fail.nextDeletedSeedIds,
    ops: makeTrashOps(),
    pinnedSeedIds: pinnedSeeds,
    journalStore,
  });
  assert.equal(retryRemaining70.ok, true);
  assert.equal(retryRemaining70.atomic, true);
  assert.equal(retryRemaining70.deletedIds.length, 70);
  assert.equal(retryRemaining70.failedIds.length, 0);
  assert.equal(dbPlants.size, 0);
  assert.equal(retryRemaining70.nextDeletedSeedIds.length, 1020); // 500 prior + 520 trashed
  assert.equal(retryRemaining70.firestoreDeletedSeedIds.length, 500);
  assert.ok(retryRemaining70.firestoreDeletedSeedIds.includes('brahmyaman-amrapali-mango'));
  assert.ok(retryRemaining70.firestoreDeletedSeedIds.includes('trash-item-520'));
});

// ---------------------------------------------------------------------------
// 13. Cloudinary Upload Signature & ASCII Tag Fix + Delivery URL Optimization
// ---------------------------------------------------------------------------
test('Cloudinary Upload Signature: strictly excludes f_auto from upload transformations and enforces ASCII-safe tags', async () => {
  assert.equal(sanitizeCloudinaryTag('রক্তজবা (Hibiscus)!'), 'Hibiscus');
  assert.equal(sanitizeCloudinaryTag('শুধু বাংলা নাম'), 'plant');
  assert.equal(sanitizeCloudinaryTag('Amrapali Mango #1'), 'Amrapali_Mango_1');

  const prevName = process.env.CLOUDINARY_CLOUD_NAME;
  const prevKey = process.env.CLOUDINARY_API_KEY;
  const prevSecret = process.env.CLOUDINARY_API_SECRET;
  try {
    process.env.CLOUDINARY_CLOUD_NAME = 'demo-nursery-cloud';
    process.env.CLOUDINARY_API_KEY = '1234567890';
    process.env.CLOUDINARY_API_SECRET = 'super-secret-for-unit-test-only';

    const mod = await import(`../src/lib/cloudinary.ts?sigtest=${Date.now()}`);
    const sig = mod.generateCloudinaryUploadSignature({
      plantName: 'কাশ্মীরি গোলাপ',
      slot: 2,
    });

    assert.equal(sig.cloudName, 'demo-nursery-cloud');
    assert.equal(sig.folder, 'brahmyaman_plants');
    assert.equal(sig.transformation.includes('f_auto'), false);
    assert.equal(sig.transformation, 'w_1400,h_1400,c_limit,q_auto:good');
    assert.match(sig.tags, /^[a-zA-Z0-9_,-]+$/);
    assert.ok(sig.signature.length >= 32);
  } finally {
    if (prevName === undefined) delete process.env.CLOUDINARY_CLOUD_NAME;
    else process.env.CLOUDINARY_CLOUD_NAME = prevName;
    if (prevKey === undefined) delete process.env.CLOUDINARY_API_KEY;
    else process.env.CLOUDINARY_API_KEY = prevKey;
    if (prevSecret === undefined) delete process.env.CLOUDINARY_API_SECRET;
    else process.env.CLOUDINARY_API_SECRET = prevSecret;
  }

  // Delivery URLs DO get f_auto,q_auto safely injected without duplicating existing directives
  const rawCloudUrl = 'https://res.cloudinary.com/demo/image/upload/v1700000000/brahmyaman_plants/rose.jpg';
  assert.equal(
    resolvePlantImageUrl(rawCloudUrl, '/fallback.jpg'),
    'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_900,c_limit/v1700000000/brahmyaman_plants/rose.jpg'
  );
  const alreadyOptimized = 'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto/v1700/rose.jpg';
  assert.equal(resolvePlantImageUrl(alreadyOptimized, '/fallback.jpg'), alreadyOptimized);
  assert.equal(
    resolvePlantImageUrl('https://upload.wikimedia.org/wikipedia/commons/a/a9/Rose.jpg', '/fallback.jpg'),
    '/api/image-proxy?url=https%3A%2F%2Fupload.wikimedia.org%2Fwikipedia%2Fcommons%2Fa%2Fa9%2FRose.jpg'
  );
});

// ---------------------------------------------------------------------------
// 14. Strict firestore.rules Plant Schema Sanitizer
// ---------------------------------------------------------------------------
test('sanitizePlantForFirestore: strips unknown keys like embeddedPhotos, clamps strings, enforces options[0].price > 0 and secondary image <= 2048 bytes', () => {
  const dirtyPlant: any = {
    id: 'bad id with spaces!@#',
    nameBn: 'ক'.repeat(400),
    category: 'পূজার ফুল ও পবিত্র গাছ',
    badgeBn: 'খ'.repeat(200),
    sunlightBn: 'স'.repeat(450),
    image: 'https://res.cloudinary.com/demo/image/upload/v1/pub_0.jpg',
    images: [
      'https://res.cloudinary.com/demo/image/upload/v1/pub_0.jpg',
      'data:image/jpeg;base64,' + 'A'.repeat(3000),
      'https://res.cloudinary.com/demo/image/upload/v1/pub_2.jpg',
    ],
    cloudinaryPublicIds: ['pub_0', 'pub_1', 'pub_2'],
    options: [],
    embeddedPhotos: { slot0DataUrl: 'data:image/jpeg;base64,ABC' },
    extraDisallowedField: 'should-be-stripped',
  };

  const sanitized = sanitizePlantForFirestore(dirtyPlant);
  assert.equal('embeddedPhotos' in sanitized, false);
  assert.equal('extraDisallowedField' in sanitized, false);
  assert.match(sanitized.id, /^[a-zA-Z0-9_-]+$/);
  assert.equal(sanitized.nameBn.length, 300);
  assert.equal(sanitized.badgeBn.length, 120);
  assert.equal(sanitized.sunlightBn.length, 300);
  assert.ok(Array.isArray(sanitized.options) && sanitized.options.length === 1);
  assert.ok(sanitized.options[0].price > 0);
  // Secondary slot > 2048 stripped, slot3 stays aligned!
  assert.equal(sanitized.images.length, 2);
  assert.equal(sanitized.images[1], 'https://res.cloudinary.com/demo/image/upload/v1/pub_2.jpg');
  assert.deepEqual(sanitized.cloudinaryPublicIds, ['pub_0', 'pub_2']);
});

// ---------------------------------------------------------------------------
// 15. Unified Firebase + Cloudinary Complete Backup & Restore (v1/v2/v3)
// ---------------------------------------------------------------------------
test('Unified Backup Bundle: exports Firebase catalog, embedded 3-slot photos, orphan-annotated Cloudinary library & AI blueprint without secrets, and restores v1/v2/v3 with deletedSeedIds', async () => {
  const p1 = {
    ...makePlant('plant-rose-1', 120),
    image: 'https://res.cloudinary.com/demo/image/upload/v1/brahmyaman_plants/rose_slot1.jpg',
    images: [
      'https://res.cloudinary.com/demo/image/upload/v1/brahmyaman_plants/rose_slot1.jpg',
      'https://res.cloudinary.com/demo/image/upload/v1/brahmyaman_plants/rose_slot2.jpg',
    ],
    cloudinaryPublicIds: ['brahmyaman_plants/rose_slot1', 'brahmyaman_plants/rose_slot2'],
    embeddedPhotos: {
      slot0DataUrl: 'data:image/jpeg;base64,PRIMARYDATA',
      slot1DataUrl: 'data:image/jpeg;base64,SECONDARYDATA',
    },
  };

  const bundle = buildUnifiedBackupBundle({
    plants: [p1, makePlant('plant-trash-1', 90, 'deleted')],
    deletedSeedIds: ['brahmyaman-amrapali-mango'],
    activityLogs: [],
    cloudinaryLibrary: {
      configured: true,
      cloudName: 'demo',
      folder: 'brahmyaman_plants',
      totalAssets: 3,
      totalBytes: 30000,
      truncated: false,
      resources: [
        {
          public_id: 'brahmyaman_plants/rose_slot1',
          url: 'https://res.cloudinary.com/demo/image/upload/v1/brahmyaman_plants/rose_slot1.jpg',
          bytes: 10000,
        },
        {
          public_id: 'brahmyaman_plants/unused_orphan',
          url: 'https://res.cloudinary.com/demo/image/upload/v1/brahmyaman_plants/unused_orphan.jpg',
          bytes: 20000,
        },
      ],
    },
    exportedAtIso: '2026-11-16T08:00:00.000Z',
    exportedAtBn: '১৬ নভেম্বর',
  });

  assert.equal(bundle.backupVersion, UNIFIED_BACKUP_VERSION);
  assert.equal(bundle.summary.totalPlants, 2);
  assert.equal(bundle.summary.activePlants, 1);
  assert.equal(bundle.summary.trashPlants, 1);
  assert.equal(bundle.summary.cloudinaryLinkedAssetsCount, 1);
  assert.equal(bundle.summary.cloudinaryOrphanAssetsCount, 1);
  assert.ok(bundle.aiRebuildBlueprint.rebuildPromptForNextAI.length > 50);

  const jsonText = JSON.stringify(bundle);
  // Ensure zero secret/credential strings leak
  assert.equal(jsonText.includes('API_SECRET'), false);
  assert.equal(jsonText.includes('SERVICE_ACCOUNT'), false);

  const parsedV3 = parseUnifiedBackupPayload(jsonText);
  assert.ok(parsedV3);
  assert.equal(parsedV3.plants.length, 2);
  assert.deepEqual(parsedV3.deletedSeedIds, ['brahmyaman-amrapali-mango']);
  assert.equal(parsedV3.cloudinaryAssetsCount, 2);

  // If primary URL was wiped in an offline recovery test, parser rehydrates from embeddedPhotos
  const offlineBroken = structuredClone(bundle);
  offlineBroken.firebaseCatalog.plants[0].image = '';
  offlineBroken.firebaseCatalog.plants[0].images = [];
  const parsedRehydrated = parseUnifiedBackupPayload(JSON.stringify(offlineBroken));
  assert.ok(parsedRehydrated);
  assert.equal(parsedRehydrated.plants[0].image, 'data:image/jpeg;base64,PRIMARYDATA');
  assert.deepEqual(parsedRehydrated.plants[0].images, [
    'data:image/jpeg;base64,PRIMARYDATA',
    'data:image/jpeg;base64,SECONDARYDATA',
  ]);

  // Verify backward compatibility with legacy v1 array & v2 { plants } formats
  assert.equal(parseUnifiedBackupPayload(JSON.stringify([makePlant('legacy-1', 50)]))?.plants.length, 1);
  assert.equal(
    parseUnifiedBackupPayload(JSON.stringify({ backupVersion: '2.0', plants: [makePlant('v2-1', 60)] }))?.plants.length,
    1
  );

  // Verify executeReliableCatalogImport preserves restoredDeletedIds while excluding active imported IDs
  const dbMap = new Map<string, any>();
  let serverDeletedMeta: string[] = [];
  const res = await executeReliableCatalogImport({
    rawPlants: [makePlant('brahmyaman-tulsi', 40)],
    prevPlants: [],
    prevDeletedIds: [],
    restoredDeletedIds: ['brahmyaman-amrapali-mango', 'brahmyaman-tulsi'],
    sanitizePlant: sanitizePlantForFirestore,
    defaultIso: '2026-11-16T00:00:00.000Z',
    defaultBn: 'আজ',
    pinnedSeedIds: new Set(['brahmyaman-amrapali-mango', 'brahmyaman-tulsi']),
    ops: {
      createBatch: () => {
        const ops: Array<() => void> = [];
        return {
          setPlant: (id, data) => ops.push(() => dbMap.set(id, data)),
          deletePlant: (id) => ops.push(() => dbMap.delete(id)),
          setDeletedSeedsMeta: (ids) => ops.push(() => { serverDeletedMeta = ids; }),
          commit: async () => ops.forEach((fn) => fn()),
        };
      },
    },
  });
  assert.equal(res.ok, true);
  assert.deepEqual(serverDeletedMeta, ['brahmyaman-amrapali-mango']);
});

// ---------------------------------------------------------------------------
// 16. Dedicated Cloudinary Upload Utility (Validation, Signed-Direct & Server Failover, Immediate Plant Slot Update)
// ---------------------------------------------------------------------------
test('cloudinaryUpload utility: validates mobile files, supports signed-direct & server failover, stops on 401/403, and updates plant slots immutably', async () => {
  // 1. File validation (MIME, Android filename-only fallback, size > 65MB, non-image)
  assert.equal(validateImageFile({ name: 'hibiscus.jpg', type: 'image/jpeg', size: 1024 }).ok, true);
  assert.equal(validateImageFile({ name: 'IMG_20261116.heic', type: '', size: 4096 }).ok, true);
  assert.equal(validateImageFile({ name: 'catalog.pdf', type: 'application/pdf', size: 2048 }).ok, false);
  assert.equal(validateImageFile({ name: 'empty.jpg', type: 'image/jpeg', size: 0 }).ok, false);
  assert.equal(
    validateImageFile({ name: 'huge.png', type: 'image/png', size: 70 * 1024 * 1024 }).ok,
    false
  );

  // 2. Server-first succeeds normally
  const serverSuccess = await uploadImageSecurely(
    { imagePayload: 'data:image/webp;base64,AAAA', plantName: 'রক্তজবা', slotNumber: 1 },
    {
      getAuthHeaders: async () => ({ Authorization: 'Bearer fake-token' }),
      fetchFn: async (input) => {
        const url = String(input);
        assert.equal(url, '/api/admin/cloudinary-upload');
        return new Response(
          JSON.stringify({
            success: true,
            url: 'https://res.cloudinary.com/demo/image/upload/v1/brahmyaman_plants/hibiscus.webp',
            public_id: 'brahmyaman_plants/hibiscus',
            bytes: 18400,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      },
    }
  );
  assert.equal(serverSuccess.ok, true);
  assert.equal(serverSuccess.method, 'server');
  assert.equal(serverSuccess.publicId, 'brahmyaman_plants/hibiscus');

  // 3. Server upload 500 -> automatically fails over to signed-direct (/api/admin/cloudinary-signature -> api.cloudinary.com)
  const calledUrls: string[] = [];
  const failoverSuccess = await uploadImageSecurely(
    { imagePayload: 'data:image/jpeg;base64,BBBB', plantName: 'কাগজি লেবু', slotNumber: 2 },
    {
      getAuthHeaders: async () => ({ Authorization: 'Bearer fake-token' }),
      fetchFn: async (input) => {
        const url = String(input);
        calledUrls.push(url);
        if (url === '/api/admin/cloudinary-upload') {
          return new Response(JSON.stringify({ success: false, error: 'Server proxy busy' }), { status: 502 });
        }
        if (url === '/api/admin/cloudinary-signature') {
          return new Response(
            JSON.stringify({
              success: true,
              cloudName: 'demo-cloud',
              apiKey: '999888',
              timestamp: 1700000000,
              signature: 'abcdef123456',
              folder: 'brahmyaman_plants',
              tags: 'brahmyaman_nursery,lemon,slot_2',
              transformation: 'w_1400,h_1400,c_limit,q_auto:good',
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }
        assert.equal(url, 'https://api.cloudinary.com/v1_1/demo-cloud/image/upload');
        return new Response(
          JSON.stringify({
            secure_url: 'https://res.cloudinary.com/demo-cloud/image/upload/v1700/slot2.webp',
            public_id: 'brahmyaman_plants/lemon_slot2',
            bytes: 22100,
            width: 1200,
            height: 900,
            format: 'webp',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      },
    }
  );
  assert.equal(failoverSuccess.ok, true);
  assert.equal(failoverSuccess.method, 'signed-direct');
  assert.equal(failoverSuccess.publicId, 'brahmyaman_plants/lemon_slot2');
  assert.deepEqual(calledUrls, [
    '/api/admin/cloudinary-upload',
    '/api/admin/cloudinary-signature',
    'https://api.cloudinary.com/v1_1/demo-cloud/image/upload',
  ]);

  // 4. 401/403 Auth error stops immediately and triggers onUnauthorized without failover
  let unauthorizedCalled = false;
  let signatureCalledAfter401 = false;
  const authBlocked = await uploadImageSecurely(
    { imagePayload: 'data:image/jpeg;base64,CCCC', plantName: 'গোলাপ', slotNumber: 1 },
    {
      getAuthHeaders: async () => ({ Authorization: 'Bearer expired' }),
      onUnauthorized: () => {
        unauthorizedCalled = true;
      },
      fetchFn: async (input) => {
        if (String(input) === '/api/admin/cloudinary-signature') {
          signatureCalledAfter401 = true;
        }
        return new Response(JSON.stringify({ success: false, error: 'Token revoked' }), { status: 401 });
      },
    }
  );
  assert.equal(authBlocked.ok, false);
  assert.equal(authBlocked.authError, true);
  assert.equal(unauthorizedCalled, true);
  assert.equal(signatureCalledAfter401, false);

  // 5. Signed-direct helper & Delete helper
  const directSig = await requestCloudinaryUploadSignature(
    { plantName: 'Padma', slotNumber: 3 },
    {
      getAuthHeaders: async () => ({ Authorization: 'Bearer tok' }),
      fetchFn: async () =>
        new Response(
          JSON.stringify({
            success: true,
            cloudName: 'demo-cloud',
            apiKey: '111',
            timestamp: 1700000100,
            signature: 'sig123',
            folder: 'brahmyaman_plants',
            tags: 'brahmyaman_nursery,Padma,slot_3',
            transformation: 'w_1400,h_1400,c_limit,q_auto:good',
          }),
          { status: 200 }
        ),
    }
  );
  assert.equal(directSig.ok, true);
  const directUpload = await uploadToCloudinarySignedDirect(
    'data:image/webp;base64,DDDD',
    directSig,
    async () =>
      new Response(
        JSON.stringify({
          secure_url: 'https://res.cloudinary.com/demo-cloud/image/upload/v1/padma3.webp',
          public_id: 'brahmyaman_plants/padma3',
          bytes: 15000,
        }),
        { status: 200 }
      )
  );
  assert.equal(directUpload.ok, true);

  const delRes = await deleteCloudinaryAsset('brahmyaman_plants/old_asset', {
    getAuthHeaders: async () => ({ Authorization: 'Bearer tok' }),
    fetchFn: async () => new Response(JSON.stringify({ success: true }), { status: 200 }),
  });
  assert.equal(delRes.ok, true);

  // 6. Immediate immutable plant slot updates preserve 1-to-1 cloudinaryPublicIds alignment
  const originalPlant = makePlant('imm-test', 120);
  const updatedSlot2 = applyUploadedPhotoToPlant({
    plant: originalPlant,
    slotIndex: 1,
    uploadedUrl: 'https://res.cloudinary.com/demo/image/upload/v2/brahmyaman/slot2.webp',
    publicId: 'brahmyaman/slot2',
    timestampIso: '2026-11-16T09:00:00.000Z',
    timestampBn: '১৬ নভেম্বর · দুপুর ৩:০০',
  });

  // Original remains unmutated
  assert.equal(originalPlant.images?.length, 1);
  assert.equal(updatedSlot2.images?.length, 2);
  assert.deepEqual(updatedSlot2.cloudinaryPublicIds, ['brahmyaman/imm-test', 'brahmyaman/slot2']);
  assert.equal(updatedSlot2.updatedAt, '2026-11-16T09:00:00.000Z');

  // Clearing secondary slot 2 drops its URL & publicId cleanly while keeping slot 1 intact
  const clearedSlot2 = clearPlantPhotoSlot({
    plant: updatedSlot2,
    slotIndex: 1,
    timestampIso: '2026-11-16T09:05:00.000Z',
    timestampBn: '১৬ নভেম্বর · দুপুর ৩:০৫',
  });
  assert.equal(clearedSlot2.images?.length, 1);
  assert.deepEqual(clearedSlot2.cloudinaryPublicIds, ['brahmyaman/imm-test']);
});

// ---------------------------------------------------------------------------
// 19. Firebase Auth PopupOperation PendingPromise Assertion Guard & Cleanup
// ---------------------------------------------------------------------------
test('Firebase Auth PopupOperation Guard: detects Pending promise was never set assertion and purges only stale firebase:authEvent / pendingRedirect storage keys', () => {
  // 1. Accurately detects string, Error, and stack-trace representations of the assertion
  assert.equal(
    isFirebasePopupPendingPromiseAssertion(
      '[2026-11-16T09:03:12.139Z]  @firebase/auth: Auth (13.3.0): INTERNAL ASSERTION FAILED: Pending promise was never set'
    ),
    true
  );
  assert.equal(
    isFirebasePopupPendingPromiseAssertion(
      new Error('INTERNAL ASSERTION FAILED: Pending promise was never set')
    ),
    true
  );
  assert.equal(isFirebasePopupPendingPromiseAssertion(new Error('auth/popup-blocked')), false);
  assert.equal(isFirebasePopupPendingPromiseAssertion(null), false);

  // 2. Purges stale firebase:authEvent:* and firebase:pendingRedirect:* keys while preserving app data & active authUser keys
  const storeData = new Map<string, string>([
    ['firebase:authEvent:AIzaSyDemo:DEFAULT', '{"type":"signInViaPopup"}'],
    ['firebase:pendingRedirect:AIzaSyDemo:DEFAULT', 'true'],
    ['firebase:authUser:AIzaSyDemo:DEFAULT', '{"uid":"owner-1"}'],
    ['brahmyaman_plants_v5', '[]'],
  ]);

  const mockStorage = {
    get length() {
      return storeData.size;
    },
    key(index: number) {
      return Array.from(storeData.keys())[index] ?? null;
    },
    removeItem(k: string) {
      storeData.delete(k);
    },
  };

  const removed = clearStaleFirebaseAuthEvents([mockStorage]);
  assert.equal(removed, 2);
  assert.equal(storeData.has('firebase:authEvent:AIzaSyDemo:DEFAULT'), false);
  assert.equal(storeData.has('firebase:pendingRedirect:AIzaSyDemo:DEFAULT'), false);
  assert.equal(storeData.has('firebase:authUser:AIzaSyDemo:DEFAULT'), true);
  assert.equal(storeData.has('brahmyaman_plants_v5'), true);
});

// ---------------------------------------------------------------------------
// 20. Cloudinary Credential Resolution & Invalid Cloud Name Classification
// ---------------------------------------------------------------------------
test('Cloudinary Diagnostics: normalizes quotes/URLs, classifies Invalid cloud_name as 422 INVALID_CLOUD_NAME, and short-circuits redundant retry', async () => {
  assert.equal(normalizeCloudNameInput(' "dhkg8vecf" '), 'dhkg8vecf');
  assert.equal(
    normalizeCloudNameInput('https://res.cloudinary.com/dhkg8vecf/image/upload/v1/sample.jpg'),
    'dhkg8vecf'
  );
  assert.equal(normalizeCloudNameInput('@dhkg8vecf'), 'dhkg8vecf');

  const fromUrl = resolveCloudinaryCredentials({
    CLOUDINARY_URL: 'cloudinary://123456:mysecret@dhkg8vecf',
  });
  assert.deepEqual(fromUrl, {
    cloudName: 'dhkg8vecf',
    apiKey: '123456',
    apiSecret: 'mysecret',
  });

  const classified = classifyCloudinaryError(
    { error: { message: 'Invalid cloud_name hkg8vecf', http_code: 400 } },
    'hkg8vecf'
  );
  assert.equal(classified.statusCode, 422);
  assert.equal(classified.code, 'INVALID_CLOUD_NAME');
  assert.match(classified.message, /hkg8vecf/);
  assert.match(classified.message, /CLOUDINARY_CLOUD_NAME/);

  // uploadImageSecurely should NOT retry signed-direct when server returns 422 INVALID_CLOUD_NAME
  let calls = 0;
  const outcome = await uploadImageSecurely(
    {
      imagePayload: 'data:image/webp;base64,AAAA',
      plantName: 'Jaba',
      slotNumber: 1,
    },
    {
      getAuthHeaders: async () => ({ Authorization: 'Bearer tok' }),
      fetchFn: async () => {
        calls += 1;
        return new Response(
          JSON.stringify({
            success: false,
            code: 'INVALID_CLOUD_NAME',
            error: 'Invalid cloud_name hkg8vecf',
          }),
          { status: 422 }
        );
      },
    }
  );
  assert.equal(outcome.ok, false);
  assert.equal(outcome.errorCode, 'INVALID_CLOUD_NAME');
  assert.equal(calls, 1);
});

// ---------------------------------------------------------------------------
// 21. Cloud Name Case Normalization, Rate Limiter Pruning, Asset Paths & Trash Collection Isolation
// ---------------------------------------------------------------------------
test('Cloud Name case normalization, Rate Limiter stale-bucket pruning & fallback diagnostics', async () => {
  // Uppercase Cloudinary Product Environment name like HGK8VECF must normalize cleanly to lowercase hgk8vecf
  assert.equal(normalizeCloudNameInput('HGK8VECF'), 'hgk8vecf');
  assert.equal(
    normalizeCloudNameInput('https://res.cloudinary.com/HGK8VECF/image/upload/v1/sample.jpg'),
    'hgk8vecf'
  );

  // MemoryRateLimitStore auto-prunes expired buckets on the 200th operation without waiting for same-key traffic
  let clock = 1_000_000;
  const mem = new MemoryRateLimitStore({ nowFn: () => clock });
  for (let i = 0; i < 199; i += 1) {
    await mem.checkAndRecord('admin_ai', `ephemeral-ip-${i}`, 1_000, 5);
  }
  assert.equal(mem.getTrackedKeyCount(), 199);

  clock += 5_000; // advance past window, then trigger 200th op
  await mem.checkAndRecord('admin_ai', 'fresh-client', 1_000, 5);
  assert.equal(mem.getTrackedKeyCount(), 1);

  // HybridRateLimitStore exposes exact 'cross-project-adc-denied' reason on IAM/ADC denial
  const deniedStore = new FirestoreHybridRateLimitStore({
    adapter: {
      runTransaction: async () => {
        throw new Error('7 PERMISSION_DENIED: Missing or insufficient permissions on hidden-catalyst-7ln7n');
      },
    },
  });
  assert.equal(deniedStore.getFallbackReason(), null);
  const res = await deniedStore.checkAndRecord('admin_ai', 'uid-1', 60_000, 10);
  assert.equal(res.backend, 'in-memory');
  assert.equal(deniedStore.getMode(), 'in-memory-fallback');
  assert.equal(deniedStore.getFallbackReason(), 'cross-project-adc-denied');
});

test('resolvePlantImageUrl handles external/data URLs and Node test environments safely', () => {
  assert.equal(
    resolvePlantImageUrl('https://res.cloudinary.com/hgk8vecf/image/upload/v1/rose.webp', '/fallback.jpg'),
    'https://res.cloudinary.com/hgk8vecf/image/upload/f_auto,q_auto,w_900,c_limit/v1/rose.webp'
  );
  assert.equal(
    resolvePlantImageUrl('data:image/webp;base64,QUFB', '/fallback.jpg'),
    'data:image/webp;base64,QUFB'
  );
  // In pure Node test runner (without Vite import.meta.glob), string returns without throwing
  const assetResult = resolvePlantImageUrl('/src/assets/images/ashoke_photos/photo_101.jpg', '/fallback.jpg');
  assert.equal(typeof assetResult, 'string');
  assert.ok(assetResult.length > 0);
});

test('Trash Collection Isolation: routes deleted items to trash_plants, empties both collections, resets both collections, and preserves pinnedSeedIds during rollback', async () => {
  const activeCollection = new Map<string, any>();
  const trashCollection = new Map<string, any>();
  let writtenDeletedMeta: string[] = [];

  const makeDualOps = (): CatalogBatchOps => ({
    createBatch: () => {
      const staged: Array<() => void> = [];
      return {
        setPlant: (id, data) => staged.push(() => activeCollection.set(id, data)),
        deletePlant: (id) => staged.push(() => activeCollection.delete(id)),
        setTrashPlant: (id, data) => staged.push(() => trashCollection.set(id, data)),
        deleteTrashPlant: (id) => staged.push(() => trashCollection.delete(id)),
        setDeletedSeedsMeta: (ids) =>
          staged.push(() => {
            writtenDeletedMeta = ids;
          }),
        commit: async () => {
          staged.forEach((fn) => fn());
        },
      };
    },
  });

  // 1. Import mixes 2 active plants + 1 trashed plant -> must route into separate collections!
  const activeA = makePlant('active-a', 90, 'active');
  const activeB = makePlant('active-b', 120, 'active');
  const trashedC = makePlant('trashed-c', 150, 'deleted');
  // Pretend trashed-c previously existed in activeCollection -> import must remove it from activeCollection!
  const prevTrashedC = makePlant('trashed-c', 150, 'active');
  activeCollection.set('trashed-c', prevTrashedC);

  const imp = await executeReliableCatalogImport({
    rawPlants: [activeA, activeB, trashedC],
    prevPlants: [prevTrashedC],
    prevDeletedIds: [],
    sanitizePlant: (p) => p as any,
    defaultIso: '2026-11-16T00:00:00.000Z',
    defaultBn: 'আজ',
    ops: makeDualOps(),
  });
  assert.equal(imp.ok, true);
  assert.equal(activeCollection.has('active-a'), true);
  assert.equal(activeCollection.has('active-b'), true);
  assert.equal(activeCollection.has('trashed-c'), false);
  assert.equal(trashCollection.has('trashed-c'), true);
  assert.equal(trashCollection.get('trashed-c').status, 'deleted');

  // 2. Empty Trash removes items from trashCollection AND any legacy trashed docs from activeCollection
  activeCollection.set('legacy-trashed-d', makePlant('legacy-trashed-d', 80, 'deleted'));
  const emptyRes = await executeReliableTrashEmpty({
    trashedIds: ['trashed-c'],
    legacyActiveTrashIds: ['legacy-trashed-d'],
    prevDeletedSeedIds: [],
    ops: makeDualOps(),
  });
  assert.equal(emptyRes.ok, true);
  assert.equal(trashCollection.has('trashed-c'), false);
  assert.equal(activeCollection.has('legacy-trashed-d'), false);
  assert.ok(emptyRes.nextDeletedSeedIds.includes('trashed-c'));
  assert.ok(emptyRes.nextDeletedSeedIds.includes('legacy-trashed-d'));

  // 3. Reset clears BOTH /plants and /trash_plants and rolls back each to its original collection on failure
  activeCollection.set('keep-active', makePlant('keep-active', 70, 'active'));
  trashCollection.set('keep-trash', makePlant('keep-trash', 110, 'deleted'));
  let failOnce = false;
  const resetFailOps: CatalogBatchOps = {
    createBatch: () => {
      const staged: Array<() => void> = [];
      return {
        setPlant: (id, data) => staged.push(() => activeCollection.set(id, data)),
        deletePlant: (id) => staged.push(() => activeCollection.delete(id)),
        setTrashPlant: (id, data) => staged.push(() => trashCollection.set(id, data)),
        deleteTrashPlant: (id) => staged.push(() => trashCollection.delete(id)),
        setDeletedSeedsMeta: (ids) =>
          staged.push(() => {
            writtenDeletedMeta = ids;
          }),
        commit: async () => {
          if (!failOnce) {
            failOnce = true;
            throw new Error('RESET_REJECTED');
          }
          staged.forEach((fn) => fn());
        },
      };
    },
  };

  const resetRes = await executeReliableCatalogReset({
    remoteDocsBackup: [
      { id: 'keep-active', data: makePlant('keep-active', 70, 'active') as any, collection: 'plants' },
      { id: 'keep-trash', data: makePlant('keep-trash', 110, 'deleted') as any, collection: 'trash_plants' },
    ],
    prevDeletedIds: ['brahmyaman-amrapali-mango'],
    ops: resetFailOps,
  });
  assert.equal(resetRes.ok, false);
  assert.equal(activeCollection.has('keep-active'), true);
  assert.equal(trashCollection.has('keep-trash'), true);

  // 4. executeCompensatingRollbackBatches respects pinnedSeedIds when >500 deleted IDs exist
  const pinnedSeeds = new Set(['brahmyaman-amrapali-mango', 'brahmyaman-raktajaba']);
  const manyDeletedIds = [
    'brahmyaman-amrapali-mango',
    'brahmyaman-raktajaba',
    ...Array.from({ length: 510 }, (_, i) => `custom-del-${i}`),
  ];
  await executeCompensatingRollbackBatches({
    opsList: [{ id: 'rb-1', kind: 'delete_plant', targetCollection: 'trash_plants', estimatedBytes: 100 }],
    metaRestore: { deletedIds: manyDeletedIds, updatedAtIso: '2026-11-16T00:00:00.000Z' },
    pinnedSeedIds: pinnedSeeds,
    ops: makeDualOps(),
  });
  assert.equal(writtenDeletedMeta.length, 500);
  assert.ok(writtenDeletedMeta.includes('brahmyaman-amrapali-mango'));
  assert.ok(writtenDeletedMeta.includes('brahmyaman-raktajaba'));
  assert.ok(writtenDeletedMeta.includes('custom-del-509'));
});

test('Live Search Suggestions: returns ranked Bengali & 2-char phonetic matches and highlights matching text segments', () => {
  const sampleCatalog = [
    {
      ...makePlant('amrapali-mango', 120),
      nameBn: 'আম্রপালী আম',
      nameEn: 'Amrapali Mango',
      category: 'ছাদবাগানের ফল ও কলম' as const,
    },
    {
      ...makePlant('kagzi-lemon', 60),
      nameBn: 'বারোমাসি কাগজি লেবু',
      nameEn: 'Kagzi Lemon',
      category: 'ছাদবাগানের ফল ও কলম' as const,
    },
    {
      ...makePlant('kashmiri-rose', 80),
      nameBn: 'কাশ্মীরি গোলাপ',
      nameEn: 'Kashmiri Rose',
      category: 'ছাদ ও বারান্দার ফুল' as const,
    },
    {
      ...makePlant('raktajaba', 50),
      nameBn: 'রক্তজবা',
      nameEn: 'Red Hibiscus',
      category: 'পূজার ফুল ও পবিত্র গাছ' as const,
    },
  ];

  // Empty query yields no active suggestions
  assert.deepEqual(extractCatalogSearchSuggestions(sampleCatalog, '   '), {
    totalMatches: 0,
    suggestions: [],
  });

  // 2-char phonetic prefix "go" finds Kashmiri Rose ("গোলাপ") alongside substring matches ("Mango")
  const goRes = extractCatalogSearchSuggestions(sampleCatalog, 'go', 5);
  assert.ok(goRes.suggestions.some((p) => p.id === 'kashmiri-rose'));

  // 3-char Benglish prefix "gol" uniquely resolves to "গোলাপ" (Golap)
  const golRes = extractCatalogSearchSuggestions(sampleCatalog, 'gol', 5);
  assert.equal(golRes.totalMatches, 1);
  assert.equal(golRes.suggestions[0].id, 'kashmiri-rose');

  // Bengali query "আম" matches Amrapali Mango at #1 and highlights "আম"
  const aamRes = extractCatalogSearchSuggestions(sampleCatalog, 'আম', 5);
  assert.equal(aamRes.suggestions[0].id, 'amrapali-mango');

  const segments = findMatchingHighlightSegments('আম্রপালী আম', 'আম');
  assert.equal(segments.some((s) => s.matched && s.text === 'আম'), true);

  // Phonetic highlight works on Bengali title when user types English/Benglish "golap"
  const phoneticSegments = findMatchingHighlightSegments('কাশ্মীরি গোলাপ', 'golap');
  assert.equal(
    phoneticSegments.some((s) => s.matched && s.text === 'গোলাপ'),
    true
  );
});

// ---------------------------------------------------------------------------
// 22. Dual-AI (xAI Grok) Client, Plant History Timestamp & Live Runtime Watchdog
// ---------------------------------------------------------------------------
test('xAI Grok utility: resolves XAI_API_KEY / GROK_API_KEY, classifies 401/429 without leaking keys, and falls back across Grok models', async () => {
  // 1. Env resolution priority & quote stripping
  assert.deepEqual(resolveGrokCredentials({}), {
    configured: false,
    apiKey: '',
    envVarName: null,
  });
  assert.deepEqual(resolveGrokCredentials({ GROK_API_KEY: ' "xai-fallback-key" ' }), {
    configured: true,
    apiKey: 'xai-fallback-key',
    envVarName: 'GROK_API_KEY',
  });
  assert.deepEqual(
    resolveGrokCredentials({ XAI_API_KEY: "'xai-primary-key'", GROK_API_KEY: 'xai-secondary' }),
    {
      configured: true,
      apiKey: 'xai-primary-key',
      envVarName: 'XAI_API_KEY',
    }
  );

  // 2. Telemetry snapshot never exposes the secret value
  const telemetry = createInitialGrokTelemetry();
  const initialSnap = buildGrokStatusSnapshot(telemetry, { XAI_API_KEY: 'xai-super-secret-value' });
  assert.equal(initialSnap.configured, true);
  assert.equal(initialSnap.envVarName, 'XAI_API_KEY');
  assert.equal(initialSnap.status, 'ready');
  assert.equal(JSON.stringify(initialSnap).includes('xai-super-secret-value'), false);

  // 3. Model cascade: primary model 'grok-4' hits 429 rate limit -> succeeds on next Grok model ('grok-3-mini') with Bearer header
  const seenModels: string[] = [];
  const chatRes = await runGrokChatWithFallback({
    messages: [{ role: 'user', content: 'জবা গাছের যত্ন বলুন' }],
    env: { XAI_API_KEY: 'xai-secret-123' },
    telemetry,
    fetchFn: async (_input, init) => {
      assert.equal(
        (init?.headers as Record<string, string>)?.Authorization,
        'Bearer xai-secret-123'
      );
      const parsedBody = JSON.parse(String(init?.body || '{}'));
      seenModels.push(parsedBody.model);
      if (parsedBody.model === 'grok-4') {
        return new Response(
          JSON.stringify({ error: { message: 'Rate limit exceeded for grok-4' } }),
          { status: 429 }
        );
      }
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: 'জবা গাছে পর্যাপ্ত রোদ ও হালকা জল দিন।' } }],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    },
  });
  assert.deepEqual(seenModels, ['grok-4', 'grok-3-mini']);
  assert.equal(chatRes.modelUsed, 'grok-3-mini');
  assert.equal(chatRes.envVarName, 'XAI_API_KEY');
  assert.equal(buildGrokStatusSnapshot(telemetry, { XAI_API_KEY: 'xai-secret-123' }).status, 'ready');

  // 4. Dual-secret failover: if XAI_API_KEY returns HTTP 400 "Incorrect API key provided", automatically falls back to GROK_API_KEY with model grok-4
  const dualKeyTelemetry = createInitialGrokTelemetry();
  const seenAuthHeaders: string[] = [];
  const dualRes = await runGrokChatWithFallback({
    messages: [{ role: 'user', content: 'কাগজি লেবুর পরিচর্যা বলুন' }],
    env: { XAI_API_KEY: 'grok_invalid_key', GROK_API_KEY: 'xai-valid-backup-key' },
    telemetry: dualKeyTelemetry,
    fetchFn: async (input, init) => {
      assert.equal(String(input), 'https://api.x.ai/v1/chat/completions');
      const authHeader = String((init?.headers as Record<string, string>)?.Authorization || '');
      seenAuthHeaders.push(authHeader);
      const parsedBody = JSON.parse(String(init?.body || '{}'));
      assert.equal(parsedBody.model, 'grok-4');
      if (authHeader === 'Bearer grok_invalid_key') {
        return new Response(
          JSON.stringify({
            code: 'invalid-argument',
            error: 'Incorrect API key provided. You can obtain an API key from https://console.x.ai.',
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: 'কাগজি লেবু গাছে নিয়মিত রোদ ও জৈব সার দিন।' } }],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    },
  });
  assert.deepEqual(seenAuthHeaders, ['Bearer grok_invalid_key', 'Bearer xai-valid-backup-key']);
  assert.equal(dualRes.modelUsed, 'grok-4');
  assert.equal(dualRes.envVarName, 'GROK_API_KEY');

  // 5. 401 Invalid API key halts immediately without looping through extra models and marks status invalid
  const authTelemetry = createInitialGrokTelemetry();
  let authAttempts = 0;
  await assert.rejects(
    () =>
      runGrokChatWithFallback({
        messages: [{ role: 'user', content: 'ping' }],
        env: { GROK_API_KEY: 'xai-bad-key' },
        telemetry: authTelemetry,
        fetchFn: async () => {
          authAttempts += 1;
          return new Response(
            JSON.stringify({ error: { message: 'Invalid API key provided' } }),
            { status: 401 }
          );
        },
      }),
    /Invalid API key/i
  );
  assert.equal(authAttempts, 1);
  assert.equal(
    buildGrokStatusSnapshot(authTelemetry, { GROK_API_KEY: 'xai-bad-key' }).status,
    'invalid'
  );
});

test('Upload History Sanitization & Live Runtime Diagnostics: preserves createdAt/plantId and deduplicates runtime errors while ignoring Vite HMR noise', () => {
  // 1. Firestore sanitizer preserves createdAt, createdAtBn on plant & sanitized plantId on activity log
  const sanitizedPlant = sanitizePlantForFirestore({
    ...makePlant('plant-history-1', 150),
    createdAt: '2026-11-16T07:00:00.000Z',
    createdAtBn: '১৬ নভেম্বর ২০২৬ · দুপুর ১২:৩০',
  });
  assert.equal(sanitizedPlant.createdAt, '2026-11-16T07:00:00.000Z');
  assert.equal(sanitizedPlant.createdAtBn, '১৬ নভেম্বর ২০২৬ · দুপুর ১২:৩০');

  const sanitizedLog = sanitizeActivityLogForFirestore({
    id: 'log-1',
    timestamp: '2026-11-16T07:05:00.000Z',
    dateBn: '১৬ নভেম্বর ২০২৬',
    timeBn: 'দুপুর ১২:৩৫',
    actionType: 'photo_upload',
    titleBn: 'নতুন ছবি আপলোড',
    descriptionBn: 'Cloudinary তে ছবি আপলোড হয়েছে',
    plantId: 'plant/invalid$chars',
    plantNameBn: 'রক্তজবা',
  });
  assert.equal(sanitizedLog.plantId, 'plant-invalid-chars');

  // 2. Runtime diagnostics buffer ignores Vite HMR WebSocket errors, deduplicates identical issues, and caps count
  clearRuntimeIssues();
  reportRuntimeIssue({
    source: 'runtime_error',
    severity: 'warning',
    message: '[vite] failed to connect to websocket',
  });
  assert.equal(getRuntimeIssues().length, 0);

  reportRuntimeIssue({
    source: 'cloudinary',
    severity: 'critical',
    message: 'Invalid cloud_name hkg8vecf',
    detail: 'Check CLOUDINARY_CLOUD_NAME',
  });
  reportRuntimeIssue({
    source: 'cloudinary',
    severity: 'critical',
    message: 'Invalid cloud_name hkg8vecf',
  });
  const recorded = getRuntimeIssues();
  assert.equal(recorded.length, 1);
  assert.equal(recorded[0].count, 2);
  assert.equal(recorded[0].severity, 'critical');
  clearRuntimeIssues();
});

// ---------------------------------------------------------------------------
// 23. Photo & Product Share to WhatsApp / Web Share API Level 2 Tests
// ---------------------------------------------------------------------------
test('Plant Photo & Product Share: generates WhatsApp share link with product details & photo URL, excludes data URLs from text, and attaches actual image File when Web Share API Level 2 is available', async () => {
  const samplePlant = {
    ...makePlant('brahmyaman-raktajaba', 60),
    nameBn: 'রক্তজবা',
    nameEn: 'Red Hibiscus',
    botanicalName: 'Hibiscus rosa-sinensis',
  };

  // 1. Public HTTPS URLs and root-relative asset paths resolve cleanly; base64 data URIs are excluded from text URLs
  assert.equal(
    resolveShareableImageUrl('https://res.cloudinary.com/hgk8vecf/image/upload/v1/jaba.webp', 'https://nursery.example.com'),
    'https://res.cloudinary.com/hgk8vecf/image/upload/v1/jaba.webp'
  );
  assert.equal(
    resolveShareableImageUrl('/assets/jaba.jpg', 'https://nursery.example.com/'),
    'https://nursery.example.com/assets/jaba.jpg'
  );
  assert.equal(
    resolveShareableImageUrl('data:image/jpeg;base64,/9j/4AAQ', 'https://nursery.example.com'),
    null
  );

  // 2. Formatted product details & universal WhatsApp share link (`https://wa.me/?text=...`)
  assert.equal(
    buildPlantShareUrl('brahmyaman-raktajaba', 'https://nursery.example.com/'),
    'https://nursery.example.com/?plant=brahmyaman-raktajaba'
  );

  const built = buildPlantShareText({
    plant: samplePlant,
    selectedOption: samplePlant.options[0],
    photoUrl: 'https://res.cloudinary.com/hgk8vecf/image/upload/v1/jaba.webp',
    lang: 'bn',
    origin: 'https://nursery.example.com',
  });
  assert.match(built.text, /রক্তজবা/);
  assert.match(built.text, /₹60/);
  assert.match(built.text, /https:\/\/nursery\.example\.com\/\?plant=brahmyaman-raktajaba/);
  assert.match(built.text, /https:\/\/res\.cloudinary\.com\/hgk8vecf\/image\/upload\/v1\/jaba\.webp/);

  const waUrl = buildWhatsAppShareUrl(built.text);
  assert.ok(waUrl.startsWith('https://wa.me/?text='));
  assert.equal(decodeURIComponent(waUrl.slice('https://wa.me/?text='.length)), built.text);

  // 3. Web Share API Level 2 attaches actual image File + product caption when supported
  let sharedPayload: any = null;
  const nativeFileRes = await sharePlantViaWebShare({
    plant: samplePlant,
    selectedOption: samplePlant.options[0],
    photoUrl: 'https://res.cloudinary.com/hgk8vecf/image/upload/v1/jaba.webp',
    lang: 'bn',
    origin: 'https://nursery.example.com',
    fetchFn: async () =>
      new Response(new Uint8Array([137, 80, 78, 71]), {
        status: 200,
        headers: { 'Content-Type': 'image/png' },
      }),
    navigatorObj: {
      canShare: (data) => Array.isArray(data.files) && data.files.length === 1,
      share: async (data) => {
        sharedPayload = data;
      },
    },
  });
  assert.equal(nativeFileRes.ok, true);
  assert.equal(nativeFileRes.method, 'native-file');
  assert.equal(sharedPayload.files.length, 1);
  assert.equal(sharedPayload.files[0].name, 'red-hibiscus.png');
  assert.match(sharedPayload.text, /রক্তজবা/);

  // 4. Gracefully requests WhatsApp / Copy fallback when navigator.share is unavailable (e.g., desktop)
  const desktopRes = await sharePlantViaWebShare({
    plant: samplePlant,
    photoUrl: 'https://res.cloudinary.com/hgk8vecf/image/upload/v1/jaba.webp',
    navigatorObj: {},
  });
  assert.equal(desktopRes.ok, false);
  assert.equal(desktopRes.fallbackRequired, true);
});

// ---------------------------------------------------------------------------
// 24. Uploaded Plant Date-Time Ordering ("টিউলিপ", "জাম"), Demand Leaderboard & Printable QR Tags
// ---------------------------------------------------------------------------
test('Uploaded Plant Date-Time Sort, Demand Leaderboard & Printable QR Tags: keeps user-uploaded plants at the very top even if bulk auto-fix touched static seeds', () => {
  const bulkAutoFixIso = '2026-11-16T10:00:00.000Z';
  const staticSeeds = Array.from({ length: 6 }, (_, i) => ({
    ...makePlant(`ashoke-seed-${i + 1}`, 50),
    nameBn: `ডিফল্ট চারা ${i + 1}`,
    image: '/plants/default.jpg',
    images: undefined,
    cloudinaryPublicIds: undefined,
    updatedAt: bulkAutoFixIso, // Simulates bulk auto-bug-fix touching 6 static seeds at once
    updatedAtBn: '১৬ নভেম্বর ২০২৬ · বিকাল ৩:৩০',
  }));

  const jamPlant: BrahmyamanPlant = {
    ...makePlant('ashoke-jam', 100),
    nameBn: 'কালো জাম (Jamun)',
    image: 'https://res.cloudinary.com/hgk8vecf/image/upload/v1/jam.webp',
    updatedAt: '2026-11-16T08:15:00.000Z',
    updatedAtBn: '১৬ নভেম্বর ২০২৬ · দুপুর ১:৪৫',
  };

  const tulipPlant: BrahmyamanPlant = {
    ...makePlant('plant-1763280000000', 120),
    nameBn: 'টিউলিপ (Tulip)',
    image: 'https://res.cloudinary.com/hgk8vecf/image/upload/v1/tulip.webp',
    createdAt: '2026-11-16T09:30:00.000Z',
    createdAtBn: '১৬ নভেম্বর ২০২৬ · দুপুর ৩:০০',
  };

  const classifiedMap = classifyPlantsByUpload([...staticSeeds, jamPlant, tulipPlant]);
  const uploadedOnly = Array.from(classifiedMap.values()).filter((item) => item.isUserUploaded);
  assert.equal(uploadedOnly.length, 2);
  assert.equal(classifiedMap.get(tulipPlant.id)?.isUserUploaded, true);
  assert.equal(classifiedMap.get(jamPlant.id)?.isUserUploaded, true);
  assert.equal(classifiedMap.get(staticSeeds[0].id)?.isUserUploaded, false);

  // Newest uploaded ("টিউলিপ") is #1, followed by "কালো জাম" (#2), and untouched bulk-fixed static seeds come after!
  const sortedPlants = sortPlantsWithUploadsFirst([...staticSeeds, jamPlant, tulipPlant]);
  assert.equal(sortedPlants[0].id, tulipPlant.id);
  assert.equal(sortedPlants[1].id, jamPlant.id);

  // WhatsApp Demand Leaderboard computation
  const sampleOrders: WhatsAppOrderLogItem[] = [
    {
      id: 'wa-1',
      timestamp: '2026-11-16T09:40:00.000Z',
      dateBn: '১৬ নভেম্বর ২০২৬',
      timeBn: 'দুপুর ৩:১০',
      eventType: 'cart_order',
      items: [
        {
          plantId: tulipPlant.id,
          plantNameBn: tulipPlant.nameBn,
          category: tulipPlant.category,
          optionLabelBn: 'পলি চারা',
          unitPrice: 120,
          quantity: 3,
        },
      ],
      totalAmount: 360,
      totalQuantity: 3,
      status: 'new',
    },
    {
      id: 'wa-2',
      timestamp: '2026-11-16T09:45:00.000Z',
      dateBn: '১৬ নভেম্বর ২০২৬',
      timeBn: 'দুপুর ৩:১৫',
      eventType: 'photo_share',
      items: [
        {
          plantId: tulipPlant.id,
          plantNameBn: tulipPlant.nameBn,
          category: tulipPlant.category,
          optionLabelBn: 'পলি চারা',
          unitPrice: 120,
          quantity: 1,
        },
      ],
      totalAmount: 120,
      totalQuantity: 1,
      status: 'new',
    },
  ];
  const leaderboard = computePlantDemandLeaderboard(sampleOrders);
  assert.equal(leaderboard.length, 1);
  assert.equal(leaderboard[0].plantId, tulipPlant.id);
  assert.equal(leaderboard[0].totalRequestedQty, 3);
  assert.equal(leaderboard[0].shareCount, 1);
  assert.equal(leaderboard[0].demandScore, 7);

  // Printable QR Code SVG & A4 Sheet Generator
  const qrUrl = buildPlantPublicUrl(tulipPlant.id, 'https://nursery.example.com');
  assert.equal(qrUrl, 'https://nursery.example.com/?plant=plant-1763280000000');
  const svg = generateQrCodeSvg(qrUrl, { size: 120 });
  assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.match(svg, /<path d="M/);

  const htmlSheet = buildPrintableQrTagSheetHtml([tulipPlant, jamPlant], {
    origin: 'https://nursery.example.com',
    layout: 'compact_12',
  });
  assert.match(htmlSheet, /টিউলিপ/);
  assert.match(htmlSheet, /কালো জাম/);
  assert.match(htmlSheet, /\+91 86094 17672/);
});





