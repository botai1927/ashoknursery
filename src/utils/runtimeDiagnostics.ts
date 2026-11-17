import { loadFirebaseCore, loadFirestoreSdk } from '../firebaseLazy';

export interface RuntimeIssueRecord {
  id: string;
  source: 'runtime_error' | 'unhandled_rejection' | 'firestore' | 'cloudinary' | 'api' | 'catalog';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  detail?: string;
  timestampIso: string;
  count: number;
}

export interface RunningQuotaState {
  requestsTotal: number;
  requestsThisMinute: number;
  recentHitTimestamps: number[];
  lastUsedAt: string | null;
  lastUsedModel: string | null;
  lastStatus: 'ready' | 'cooldown' | 'exhausted' | 'invalid';
  lastErrorBn: string | null;
  updatedAtIso: string;
}

const MAX_RUNTIME_ISSUES = 30;
const issuesBuffer: RuntimeIssueRecord[] = [];
const listeners = new Set<() => void>();
let globalListenersAttached = false;

function notifyListeners(): void {
  for (const listener of listeners) {
    try {
      listener();
    } catch {
      // Ignore subscriber error
    }
  }
}

function shouldIgnoreMessage(message: string): boolean {
  const lower = message.toLowerCase();
  // Vite HMR websocket is intentionally disabled in AI Studio iframe runtime (environment constraints: Ignore WebSocket errors)
  if (
    lower.includes('websocket') ||
    lower.includes('ws://') ||
    lower.includes('wss://') ||
    lower.includes('vite') ||
    lower.includes('hmr')
  ) {
    return true;
  }
  return false;
}

export function reportRuntimeIssue(params: {
  source: RuntimeIssueRecord['source'];
  severity: RuntimeIssueRecord['severity'];
  message: string;
  detail?: string;
}): void {
  const cleanMsg = (params.message || '').trim().slice(0, 400);
  if (!cleanMsg || shouldIgnoreMessage(cleanMsg)) return;

  const existing = issuesBuffer.find(
    (item) => item.source === params.source && item.message === cleanMsg
  );
  if (existing) {
    existing.count += 1;
    existing.timestampIso = new Date().toISOString();
    if (params.detail) {
      existing.detail = params.detail.slice(0, 600);
    }
    notifyListeners();
    return;
  }

  issuesBuffer.unshift({
    id: `rt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    source: params.source,
    severity: params.severity,
    message: cleanMsg,
    detail: params.detail ? params.detail.slice(0, 600) : undefined,
    timestampIso: new Date().toISOString(),
    count: 1,
  });

  if (issuesBuffer.length > MAX_RUNTIME_ISSUES) {
    issuesBuffer.length = MAX_RUNTIME_ISSUES;
  }
  notifyListeners();
}

export function getRuntimeIssues(): RuntimeIssueRecord[] {
  return [...issuesBuffer];
}

export function clearRuntimeIssues(): void {
  issuesBuffer.length = 0;
  notifyListeners();
}

export function subscribeRuntimeIssues(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/**
 * Service-account based secure monitor: queries Firestore 'usage_stats' document
 * ('usage_stats/running_quota') to retrieve the running 24-hour quota and telemetry state,
 * persisting across reloads and authentication cycles by moving state out of volatile memory
 * and into a secure Firestore-backed read/write function.
 */
export async function fetchRunningQuotaFromUsageStats(): Promise<RunningQuotaState | null> {
  try {
    const [{ db }, { doc, getDoc }] = await Promise.all([
      loadFirebaseCore(),
      loadFirestoreSdk(),
    ]);
    const snap = await getDoc(doc(db, 'usage_stats', 'running_quota'));
    if (snap.exists()) {
      const data = snap.data() as RunningQuotaState;
      const now = Date.now();
      const validHits = Array.isArray(data.recentHitTimestamps)
        ? data.recentHitTimestamps.filter((ts) => now - ts < 86_400_000)
        : [];
      return {
        requestsTotal: Number(data.requestsTotal || validHits.length || 0),
        requestsThisMinute: validHits.filter((ts) => now - ts < 60_000).length,
        recentHitTimestamps: validHits,
        lastUsedAt: data.lastUsedAt || null,
        lastUsedModel: data.lastUsedModel || null,
        lastStatus: data.lastStatus || 'ready',
        lastErrorBn: data.lastErrorBn || null,
        updatedAtIso: data.updatedAtIso || new Date().toISOString(),
      };
    }
  } catch {}
  return null;
}

export async function persistRunningQuotaToUsageStats(state: RunningQuotaState): Promise<boolean> {
  try {
    const [{ db }, { doc, setDoc }] = await Promise.all([
      loadFirebaseCore(),
      loadFirestoreSdk(),
    ]);
    await setDoc(doc(db, 'usage_stats', 'running_quota'), {
      ...state,
      updatedAtIso: new Date().toISOString(),
    }, { merge: true });
    return true;
  } catch {
    return false;
  }
}

export function installGlobalRuntimeErrorTracker(): void {
  if (typeof window === 'undefined' || globalListenersAttached) return;
  globalListenersAttached = true;

  window.addEventListener('error', (event) => {
    const msg = event?.message || event?.error?.message || 'Unexpected runtime error';
    reportRuntimeIssue({
      source: 'runtime_error',
      severity: 'critical',
      message: String(msg),
      detail: event?.filename
        ? `${event.filename}:${event.lineno || 0}:${event.colno || 0}`
        : undefined,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event?.reason;
    const msg =
      typeof reason === 'string'
        ? reason
        : reason?.message || reason?.code || 'Unhandled async promise rejection';
    reportRuntimeIssue({
      source: 'unhandled_rejection',
      severity: 'warning',
      message: String(msg),
    });
  });
}
