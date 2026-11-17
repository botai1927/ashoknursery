// Real-time Firestore Operation Telemetry & Free-Tier Threshold Monitor
// Tracks actual server reads, IndexedDB cache hits, writes, and deletes per day

export interface DailyFirestoreStats {
  dateKey: string; // YYYY-MM-DD
  serverReads: number;
  cacheHits: number;
  writes: number;
  deletes: number;
  byCollection: {
    plantsReads: number;
    plantsWrites: number;
    logsReads: number;
    logsWrites: number;
    metaOps: number;
  };
  lastUpdatedIso: string;
}

export interface StoredMonitorState {
  today: DailyFirestoreStats;
  history: DailyFirestoreStats[]; // up to last 7 days
}

export const SPARK_DAILY_LIMITS = {
  reads: 50000,
  writes: 20000,
  deletes: 20000,
  storageBytes: 1024 * 1024 * 1024, // 1 GiB
  maxDocBytes: 1048576, // 1 MiB per Firestore document
};

const STORAGE_MONITOR_KEY = 'brahmyaman_firestore_monitor_v1';

function getTodayKey(): string {
  try {
    return new Date().toISOString().slice(0, 10);
  } catch {
    return 'today';
  }
}

function createEmptyDay(dateKey: string): DailyFirestoreStats {
  return {
    dateKey,
    serverReads: 0,
    cacheHits: 0,
    writes: 0,
    deletes: 0,
    byCollection: {
      plantsReads: 0,
      plantsWrites: 0,
      logsReads: 0,
      logsWrites: 0,
      metaOps: 0,
    },
    lastUpdatedIso: new Date().toISOString(),
  };
}

function readMonitorState(): StoredMonitorState {
  const todayKey = getTodayKey();
  try {
    const raw = localStorage.getItem(STORAGE_MONITOR_KEY);
    if (!raw) {
      return { today: createEmptyDay(todayKey), history: [] };
    }
    const parsed = JSON.parse(raw) as StoredMonitorState;
    if (!parsed?.today || !parsed.today.dateKey) {
      return { today: createEmptyDay(todayKey), history: [] };
    }
    if (parsed.today.dateKey !== todayKey) {
      const nextHistory = [parsed.today, ...(Array.isArray(parsed.history) ? parsed.history : [])].slice(0, 7);
      const rolled: StoredMonitorState = {
        today: createEmptyDay(todayKey),
        history: nextHistory,
      };
      localStorage.setItem(STORAGE_MONITOR_KEY, JSON.stringify(rolled));
      return rolled;
    }
    return {
      today: {
        ...createEmptyDay(todayKey),
        ...parsed.today,
        byCollection: {
          ...createEmptyDay(todayKey).byCollection,
          ...(parsed.today.byCollection || {}),
        },
      },
      history: Array.isArray(parsed.history) ? parsed.history.slice(0, 7) : [],
    };
  } catch {
    return { today: createEmptyDay(todayKey), history: [] };
  }
}

const listeners = new Set<() => void>();

function saveMonitorState(state: StoredMonitorState) {
  try {
    localStorage.setItem(STORAGE_MONITOR_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors
  }
  listeners.forEach((cb) => {
    try {
      cb();
    } catch {}
  });
}

export function subscribeFirestoreMonitor(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function getFirestoreUsageStats(): StoredMonitorState {
  return readMonitorState();
}

export function trackFirestoreRead(
  count: number,
  source: 'plants' | 'activity_logs' | 'catalog_meta',
  fromCache: boolean
) {
  const safeCount = Math.max(0, Math.round(count));
  if (safeCount === 0) return;

  const state = readMonitorState();
  if (fromCache) {
    state.today.cacheHits += safeCount;
  } else {
    state.today.serverReads += safeCount;
    if (source === 'plants') state.today.byCollection.plantsReads += safeCount;
    else if (source === 'activity_logs') state.today.byCollection.logsReads += safeCount;
    else state.today.byCollection.metaOps += safeCount;
  }
  state.today.lastUpdatedIso = new Date().toISOString();
  saveMonitorState(state);
}

export function trackFirestoreWrite(
  count: number,
  source: 'plants' | 'activity_logs' | 'catalog_meta'
) {
  const safeCount = Math.max(0, Math.round(count));
  if (safeCount === 0) return;

  const state = readMonitorState();
  state.today.writes += safeCount;
  if (source === 'plants') state.today.byCollection.plantsWrites += safeCount;
  else if (source === 'activity_logs') state.today.byCollection.logsWrites += safeCount;
  else state.today.byCollection.metaOps += safeCount;
  state.today.lastUpdatedIso = new Date().toISOString();
  saveMonitorState(state);
}

export function trackFirestoreDelete(
  count: number,
  source: 'plants' | 'activity_logs' | 'catalog_meta'
) {
  const safeCount = Math.max(0, Math.round(count));
  if (safeCount === 0) return;

  const state = readMonitorState();
  state.today.deletes += safeCount;
  if (source === 'catalog_meta') state.today.byCollection.metaOps += safeCount;
  state.today.lastUpdatedIso = new Date().toISOString();
  saveMonitorState(state);
}

export function resetDailyMonitorCounter() {
  const state = readMonitorState();
  state.today = createEmptyDay(getTodayKey());
  saveMonitorState(state);
}

export function formatBytesReadable(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
