import { Component, type ReactNode, useState, useEffect, useLayoutEffect, useRef, useMemo, lazy, Suspense } from 'react';
import { MessageCircle, ArrowRight } from 'lucide-react';
import { Header, WindowViewKey } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { SeasonalOffersSection } from './components/SeasonalOffersSection';
import { SeasonalHighlightsBanner } from './components/SeasonalHighlightsBanner';
import { CatalogSection } from './components/CatalogSection';
import { TestimonialsSection } from './components/TestimonialsSection';
import { CareGuideSection } from './components/CareGuideSection';
import { LocationSection } from './components/LocationSection';
import { Footer } from './components/Footer';
import { PlantDetailWindow } from './components/PlantDetailWindow';
import { WhatsAppCartModal } from './components/WhatsAppCartModal';
import { CurrentMonthBestBuysBanner } from './components/CurrentMonthBestBuysBanner';
import { BRAHMYAMAN_PLANTS } from './data/brahmyamanCatalog';
import {
  BrahmyamanPlant,
  PlantPotOption,
  WhatsAppInquiryItem,
  AudienceTag,
} from './types/nursery';
import { NotFoundPage } from './components/NotFoundPage';
import { getBengaliDateTime } from './utils/bengaliDateTime';
import type { User as FirebaseUser } from 'firebase/auth';
import type { WriteBatch } from 'firebase/firestore';
import type { OperationType } from './firebase';
import {
  loadFirebaseAuthSdk,
  loadFirebaseCore,
  loadFirestoreSdk,
} from './firebaseLazy';
import {
  applySeoMetadataToDocument,
  buildSeoMetaForState,
} from './utils/seoMetadata';

const AdminPage = lazy(() =>
  import('./components/AdminPage').then((m) => ({ default: m.AdminPage }))
);
import {
  trackFirestoreRead,
  trackFirestoreWrite,
  trackFirestoreDelete,
} from './utils/firestoreMonitor';
import {
  captureLocalStorageSnapshot,
  restoreLocalStorageSnapshot,
  reconcileDeletedPlantIds,
  reconcileCrossDeviceCatalogSync,
  createLocalStorageJournalStore,
  getIncompleteCatalogOperationJournal,
  recoverIncompleteCatalogOperation,
  runStartupCatalogRecovery,
  executeReliableCatalogImport,
  executeReliableCatalogReset,
  executeReliableTrashEmpty,
  CatalogBatchOps,
  StartupCatalogRecoveryResult,
} from './utils/firestoreCatalogTransactions';
import { sanitizePlantForFirestore } from './utils/backupBundle';
import {
  installGlobalRuntimeErrorTracker,
  reportRuntimeIssue,
} from './utils/runtimeDiagnostics';

const STORAGE_INQUIRY_KEY = 'brahmyaman_inquiry_list_v1';
const STORAGE_CATALOG_KEY = 'brahmyaman_custom_catalog_v3';
const STORAGE_PERMANENTLY_DELETED_KEY = 'brahmyaman_permanently_deleted_ids_v1';
const STORAGE_CATALOG_SYNCED_AT_KEY = 'brahmyaman_catalog_synced_at_v1';
const STORAGE_REMOTE_VERSION_KEY = 'brahmyaman_catalog_remote_version_v1';
const CATALOG_SYNC_CHANNEL = 'brahmyaman_catalog_sync';
const PUBLIC_VERSION_CHECK_DEBOUNCE_MS = 4000; // 4s debounce around cheap 1-read version check so edits show live immediately
const DEFAULT_SEED_ID_SET: ReadonlySet<string> = new Set(BRAHMYAMAN_PLANTS.map((p) => p.id));

function broadcastCatalogUpdate(): void {
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const ch = new BroadcastChannel(CATALOG_SYNC_CHANNEL);
      ch.postMessage({ type: 'catalog_updated', ts: Date.now() });
      ch.close();
    }
  } catch {
    // Ignore BroadcastChannel unavailability
  }
}

// Defensive LocalStorage writer that never crashes even if storage quota is full
function safeSetLocalStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch (err: any) {
    console.warn(`LocalStorage quota safe-guard in App for ${key}:`, err);
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        // Strip heavy base64 strings if quota exceeded
        const lightweight = parsed.map((item: any) => ({
          ...item,
          image: typeof item.image === 'string' && item.image.length > 500 ? '' : item.image,
          images: Array.isArray(item.images)
            ? item.images.filter((img: any) => typeof img === 'string' && img.length <= 500)
            : item.images,
        }));
        localStorage.setItem(key, JSON.stringify(lightweight));
      }
    } catch {}
  }
}

function getPermanentlyDeletedIds(): Set<string> {
  try {
    const saved = localStorage.getItem(STORAGE_PERMANENTLY_DELETED_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return new Set(parsed);
    }
  } catch {}
  return new Set();
}

function addPermanentlyDeletedId(id: string) {
  try {
    const set = getPermanentlyDeletedIds();
    set.add(id);
    safeSetLocalStorage(STORAGE_PERMANENTLY_DELETED_KEY, JSON.stringify(Array.from(set)));
  } catch {}
}

function removePermanentlyDeletedId(id: string) {
  try {
    const set = getPermanentlyDeletedIds();
    set.delete(id);
    safeSetLocalStorage(STORAGE_PERMANENTLY_DELETED_KEY, JSON.stringify(Array.from(set)));
  } catch {}
}

// Helper to auto-purge items that have been in trash for >= 30 days
function purgeExpiredTrash(list: BrahmyamanPlant[]): BrahmyamanPlant[] {
  const now = Date.now();
  const ms30Days = 30 * 24 * 60 * 60 * 1000;
  return list.filter((p) => {
    if (p.status === 'deleted' && p.deletedAt) {
      const deletedTime = new Date(p.deletedAt).getTime();
      if (!isNaN(deletedTime) && now - deletedTime >= ms30Days) {
        addPermanentlyDeletedId(p.id);
        return false;
      }
    }
    return true;
  });
}

class AppErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      message: error?.message || 'অপ্রত্যাশিত অ্যাপ্লিকেশন ত্রুটি ঘটেছে।',
    };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    reportRuntimeIssue({
      source: 'runtime_error',
      severity: 'critical',
      message: error?.message || 'React render error',
      detail: info?.componentStack?.slice(0, 500),
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#142318] text-white flex items-center justify-center p-6 font-sans-bn">
          <div className="max-w-md w-full bg-white text-[#142318] rounded-3xl p-6 shadow-2xl space-y-4 text-center">
            <h1 className="font-serif-bn text-xl font-bold text-[#B34728]">
              দুঃখিত, পাতাটি লোড করতে সমস্যা হয়েছে
            </h1>
            <p className="text-xs text-[#526356] bg-[#FAF8F5] p-3 rounded-xl border border-[#E8E1D5] font-mono break-words">
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, message: '' });
              }}
              className="w-full py-2.5 px-4 bg-[#1B8354] hover:bg-[#146c44] text-white text-sm font-bold rounded-xl cursor-pointer"
            >
              পুনরায় চেষ্টা করুন
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  useEffect(() => {
    installGlobalRuntimeErrorTracker();
  }, []);

  return (
    <AppErrorBoundary>
      <AppContent />
    </AppErrorBoundary>
  );
}

function AppContent() {
  const [lang, setLang] = useState<'bn' | 'en'>('bn');
  const [activeAudience, setActiveAudience] = useState<AudienceTag>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);

  // Dedicated Item Window ID (?plant=<id>) + Catalog scroll restoration ref
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const search = new URLSearchParams(window.location.search);
      return search.get('plant');
    }
    return null;
  });
  const catalogScrollYRef = useRef<number>(0);
  const prevSelectedPlantIdRef = useRef<string | null>(selectedPlantId);

  // Dedicated Section Window Key: 'catalog' | 'offers' | 'care' | 'reviews' | 'location'
  const [hasInvalidViewParam, setHasInvalidViewParam] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const view = new URLSearchParams(window.location.search).get('view');
      return Boolean(view && !['catalog', 'offers', 'care', 'reviews', 'location'].includes(view));
    }
    return false;
  });

  const [activeWindow, setActiveWindow] = useState<WindowViewKey>(() => {
    if (typeof window !== 'undefined') {
      const search = new URLSearchParams(window.location.search);
      const view = search.get('view') as WindowViewKey;
      if (['catalog', 'offers', 'care', 'reviews', 'location'].includes(view)) {
        return view;
      }
    }
    return 'catalog';
  });

  // Dedicated Page Routing: 'shop' | 'admin' | 'not_found'
  const [currentRoute, setCurrentRoute] = useState<'shop' | 'admin' | 'not_found'>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const hash = window.location.hash;
      const search = window.location.search;
      if (
        path === '/admin' ||
        path.startsWith('/admin') ||
        hash === '#admin' ||
        search.includes('admin=true')
      ) {
        return 'admin';
      }
      if (path !== '/' && path !== '/index.html') {
        return 'not_found';
      }
    }
    return 'shop';
  });

  // Plant Catalog state with Real-Time Firestore Sync & LocalStorage Fallback
  const [plants, setPlants] = useState<BrahmyamanPlant[]>(() => {
    try {
      const deletedIds = getPermanentlyDeletedIds();
      const saved = localStorage.getItem(STORAGE_CATALOG_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleaned = purgeExpiredTrash(parsed).filter((p) => !deletedIds.has(p.id));
          const existingIds = new Set(cleaned.map((p: BrahmyamanPlant) => p.id));
          const missingDefaults = BRAHMYAMAN_PLANTS.filter(
            (p) => !existingIds.has(p.id) && !deletedIds.has(p.id)
          );
          return missingDefaults.length > 0 ? [...cleaned, ...missingDefaults] : cleaned;
        }
      }
      return BRAHMYAMAN_PLANTS.filter((p) => !deletedIds.has(p.id));
    } catch {
      return BRAHMYAMAN_PLANTS;
    }
  });

  // Keep latest remote active plants, remote trash plants, and deleted seed IDs synchronized
  const [currentAuthUser, setCurrentAuthUser] = useState<FirebaseUser | null>(null);
  const remoteActivePlantsRef = useRef<BrahmyamanPlant[] | null>(null);
  const remoteTrashPlantsRef = useRef<BrahmyamanPlant[]>([]);
  const remotePlantsRef = useRef<BrahmyamanPlant[] | null>(null);
  const legacyTrashMigrationInFlightRef = useRef<boolean>(false);
  const remoteDeletedIdsRef = useRef<string[]>([]);
  const hasReceivedRemoteDeletedMetaRef = useRef<boolean>(false);
  const deletedSeedIdsRef = useRef<Set<string>>(getPermanentlyDeletedIds());
  const plantsRef = useRef<BrahmyamanPlant[]>(plants);
  plantsRef.current = plants;

  // Startup crash recovery state (automatically detects incomplete multi-batch journal on browser open)
  const [startupRecoveryStatus, setStartupRecoveryStatus] =
    useState<StartupCatalogRecoveryResult | null>(() => {
      const pending = getIncompleteCatalogOperationJournal();
      if (!pending) return null;
      return {
        foundIncomplete: true,
        attempted: false,
        waitingForAuth: true,
        journalSnapshot: pending,
        operationId: pending.operationId,
        kind: pending.kind,
        ok: false,
        stateAfterRecovery: pending.state,
        recoveryAttempts: pending.recoveryAttempts || 0,
        restoredIds: pending.restoredIds || [],
        unrestoredIds: pending.unrestoredIds || pending.affectedIds || [],
        ambiguousIds: pending.ambiguousIds || [],
        oversizedIds: [],
        prevDeletedIds: pending.prevDeletedIds || [],
      };
    });

  const mergeCatalogWithDeletedFilter = (
    sourcePlants: BrahmyamanPlant[],
    deletedIds: Set<string>
  ): BrahmyamanPlant[] => {
    const cleaned = purgeExpiredTrash(sourcePlants).filter((p) => !deletedIds.has(p.id));
    const existingIds = new Set(cleaned.map((p) => p.id));
    const missingDefaults = BRAHMYAMAN_PLANTS.filter(
      (p) => !existingIds.has(p.id) && !deletedIds.has(p.id)
    );
    return missingDefaults.length > 0 ? [...cleaned, ...missingDefaults] : cleaned;
  };

  const combineActiveAndTrashPlants = (
    activeDocs: BrahmyamanPlant[] | null,
    trashDocs: BrahmyamanPlant[]
  ): BrahmyamanPlant[] | null => {
    if (activeDocs === null) return null;
    const byId = new Map<string, BrahmyamanPlant>();
    for (const item of activeDocs) {
      byId.set(item.id, item);
    }
    for (const trashItem of trashDocs) {
      byId.set(trashItem.id, { ...trashItem, status: 'deleted' });
    }
    return Array.from(byId.values());
  };

  // Smart Route-Aware Firestore Sync:
  // - Admin route (/admin): Full real-time onSnapshot listeners on /plants + (when verified) /trash_plants
  // - Public shop route (/): 5-min local cache + 1-read version check on /plants ONLY (Trash never exposed publicly!)
  useEffect(() => {
    let isCancelled = false;
    let unsubPlants: (() => void) | undefined;
    let unsubTrashPlants: (() => void) | undefined;
    let unsubDeletedMeta: (() => void) | undefined;

    const applyAdminRemoteSync = () => {
      const combined = combineActiveAndTrashPlants(
        remoteActivePlantsRef.current,
        remoteTrashPlantsRef.current
      );
      remotePlantsRef.current = combined;

      if (combined !== null) {
        const effectiveRemoteDeletedIds = hasReceivedRemoteDeletedMetaRef.current
          ? remoteDeletedIdsRef.current
          : Array.from(deletedSeedIdsRef.current).filter((id) => DEFAULT_SEED_ID_SET.has(id));

        const synced = reconcileCrossDeviceCatalogSync({
          remotePlants: combined,
          remotePlantsEmpty: combined.length === 0,
          remoteDeletedIds: effectiveRemoteDeletedIds,
          localDeletedIds: Array.from(deletedSeedIdsRef.current),
          staticSeedCatalog: BRAHMYAMAN_PLANTS,
          pinnedSeedIds: DEFAULT_SEED_ID_SET,
          expireTrash: purgeExpiredTrash,
        });

        if (hasReceivedRemoteDeletedMetaRef.current) {
          deletedSeedIdsRef.current = new Set<string>(synced.mergedDeletedIds);
          safeSetLocalStorage(
            STORAGE_PERMANENTLY_DELETED_KEY,
            JSON.stringify(synced.mergedDeletedIds)
          );
        }
        plantsRef.current = synced.plants;
        setPlants(synced.plants);
      }
    };

    let syncTimerId: ReturnType<typeof setTimeout> | null = null;

    const maybeMigrateLegacyTrashedDocsFromPublicPlants = async (activeDocs: BrahmyamanPlant[]) => {
      if (!currentAuthUser?.emailVerified || legacyTrashMigrationInFlightRef.current) return;
      const legacyTrashed = activeDocs.filter((p) => p.status === 'deleted');
      if (legacyTrashed.length === 0) return;

      legacyTrashMigrationInFlightRef.current = true;
      try {
        const [{ db }, fs] = await Promise.all([loadFirebaseCore(), loadFirestoreSdk()]);
        // Move legacy soft-deleted docs out of public /plants into Admin-only /trash_plants atomically
        for (let i = 0; i < legacyTrashed.length; i += 200) {
          const chunk = legacyTrashed.slice(i, i + 200);
          const batch = fs.writeBatch(db);
          for (const item of chunk) {
            const sanitized = sanitizePlantForFirestore({
              ...item,
              status: 'deleted',
            });
            batch.set(fs.doc(db, 'trash_plants', item.id), sanitized);
            batch.delete(fs.doc(db, 'plants', item.id));
          }
          await batch.commit();
          trackFirestoreWrite(chunk.length, 'plants');
          trackFirestoreDelete(chunk.length, 'plants');
        }
      } catch {
        // Keep silent if user is not an authorized admin; next authorized admin login will migrate
      } finally {
        legacyTrashMigrationInFlightRef.current = false;
      }
    };

    if (currentRoute === 'admin') {
      void Promise.all([loadFirebaseCore(), loadFirestoreSdk()])
        .then(([{ db }, fs]) => {
          if (isCancelled) return;
          unsubDeletedMeta = fs.onSnapshot(
            fs.doc(db, 'catalog_meta', 'deleted_seeds'),
            (docSnap) => {
              trackFirestoreRead(1, 'catalog_meta', docSnap.metadata.fromCache);
              const data = docSnap.exists() ? docSnap.data() : undefined;
              const rawIds = Array.isArray(data?.deletedIds)
                ? data.deletedIds.filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
                : [];
              remoteDeletedIdsRef.current = rawIds;
              hasReceivedRemoteDeletedMetaRef.current = true;

              if (remotePlantsRef.current !== null) {
                applyAdminRemoteSync();
                if (typeof data?.updatedAt === 'string' && data.updatedAt) {
                  safeSetLocalStorage(STORAGE_REMOTE_VERSION_KEY, data.updatedAt);
                }
                safeSetLocalStorage(STORAGE_CATALOG_SYNCED_AT_KEY, Date.now().toString());
              } else if (docSnap.exists()) {
                const synced = reconcileCrossDeviceCatalogSync({
                  remotePlants: [],
                  remotePlantsEmpty: true,
                  remoteDeletedIds: rawIds,
                  localDeletedIds: Array.from(deletedSeedIdsRef.current),
                  staticSeedCatalog: BRAHMYAMAN_PLANTS,
                  pinnedSeedIds: DEFAULT_SEED_ID_SET,
                  expireTrash: purgeExpiredTrash,
                });
                const nextSet = new Set<string>(synced.mergedDeletedIds);
                deletedSeedIdsRef.current = nextSet;
                safeSetLocalStorage(
                  STORAGE_PERMANENTLY_DELETED_KEY,
                  JSON.stringify(synced.mergedDeletedIds)
                );
                if (typeof data?.updatedAt === 'string' && data.updatedAt) {
                  safeSetLocalStorage(STORAGE_REMOTE_VERSION_KEY, data.updatedAt);
                }
                safeSetLocalStorage(STORAGE_CATALOG_SYNCED_AT_KEY, Date.now().toString());
                setPlants((prev) => mergeCatalogWithDeletedFilter(prev, nextSet));
              }
            },
            () => {
              // Quietly fallback to local persistence when offline
            }
          );

          unsubPlants = fs.onSnapshot(
            fs.collection(db, 'plants'),
            (snapshot) => {
              trackFirestoreRead(
                snapshot.docChanges().length || snapshot.size || 1,
                'plants',
                snapshot.metadata.fromCache
              );
              const remoteActive: BrahmyamanPlant[] = [];
              snapshot.forEach((docSnap) => {
                remoteActive.push(docSnap.data() as BrahmyamanPlant);
              });
              remoteActivePlantsRef.current = remoteActive;
              applyAdminRemoteSync();

              if (currentAuthUser?.emailVerified && remoteActive.some((p) => p.status === 'deleted')) {
                void maybeMigrateLegacyTrashedDocsFromPublicPlants(remoteActive);
              }
            },
            () => {
              // Quietly fallback to local persistence when offline
            }
          );

          if (currentAuthUser?.emailVerified) {
            unsubTrashPlants = fs.onSnapshot(
              fs.collection(db, 'trash_plants'),
              (snapshot) => {
                trackFirestoreRead(
                  snapshot.docChanges().length || snapshot.size || 1,
                  'plants',
                  snapshot.metadata.fromCache
                );
                const remoteTrash: BrahmyamanPlant[] = [];
                snapshot.forEach((docSnap) => {
                  remoteTrash.push({
                    ...(docSnap.data() as BrahmyamanPlant),
                    status: 'deleted',
                  });
                });
                remoteTrashPlantsRef.current = remoteTrash;
                applyAdminRemoteSync();
              },
              () => {
                // Quietly ignore if user is not an authorized admin yet
              }
            );
          } else {
            remoteTrashPlantsRef.current = [];
          }
        })
        .catch(() => {
          // Quietly fallback to local storage
        });

      return () => {
        isCancelled = true;
        unsubPlants?.();
        unsubTrashPlants?.();
        unsubDeletedMeta?.();
      };
    }

    if (currentRoute === 'not_found') {
      return () => {
        isCancelled = true;
      };
    }

    // Public Storefront: Always run 1-Read Version Check (4s debounce) so Admin edits & uploads appear live immediately
    const syncPublicStorefrontCatalog = async (forceCheck = false) => {
      try {
        const lastSyncedMs = Number(localStorage.getItem(STORAGE_CATALOG_SYNCED_AT_KEY) || '0');
        const hasCachedCatalog = Boolean(localStorage.getItem(STORAGE_CATALOG_KEY));
        if (!forceCheck && hasCachedCatalog && Date.now() - lastSyncedMs < PUBLIC_VERSION_CHECK_DEBOUNCE_MS) {
          return;
        }

        const [{ db }, fs] = await Promise.all([loadFirebaseCore(), loadFirestoreSdk()]);
        if (isCancelled) return;

        // Step 1: Read ONLY catalog_meta/deleted_seeds (1 single read!)
        const metaSnap = await fs.getDoc(fs.doc(db, 'catalog_meta', 'deleted_seeds'));
        if (isCancelled) return;
        trackFirestoreRead(1, 'catalog_meta', metaSnap.metadata.fromCache);

        let remoteVersion = '';
        let rawIds: string[] = [];
        if (metaSnap.exists()) {
          const data = metaSnap.data();
          rawIds = Array.isArray(data?.deletedIds)
            ? data.deletedIds.filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
            : [];
          remoteDeletedIdsRef.current = rawIds;
          hasReceivedRemoteDeletedMetaRef.current = true;
          remoteVersion = typeof data?.updatedAt === 'string' ? data.updatedAt : '';
        }

        const cachedVersion = localStorage.getItem(STORAGE_REMOTE_VERSION_KEY) || '';
        if (hasCachedCatalog && remoteVersion && cachedVersion === remoteVersion) {
          // Catalog unchanged on server -> 0 plant collection reads needed!
          const syncedMetaOnly = reconcileCrossDeviceCatalogSync({
            remotePlants: plantsRef.current,
            remotePlantsEmpty: plantsRef.current.length === 0,
            remoteDeletedIds: rawIds,
            localDeletedIds: Array.from(deletedSeedIdsRef.current),
            staticSeedCatalog: BRAHMYAMAN_PLANTS,
            pinnedSeedIds: DEFAULT_SEED_ID_SET,
            expireTrash: purgeExpiredTrash,
          });
          deletedSeedIdsRef.current = new Set<string>(syncedMetaOnly.mergedDeletedIds);
          safeSetLocalStorage(
            STORAGE_PERMANENTLY_DELETED_KEY,
            JSON.stringify(syncedMetaOnly.mergedDeletedIds)
          );
          safeSetLocalStorage(STORAGE_CATALOG_SYNCED_AT_KEY, Date.now().toString());
          plantsRef.current = syncedMetaOnly.plants;
          setPlants(syncedMetaOnly.plants);
          return;
        }

        // Step 2: Catalog changed or first visit -> fetch plants collection once
        const plantsSnap = await fs.getDocs(fs.collection(db, 'plants'));
        if (isCancelled) return;
        trackFirestoreRead(
          plantsSnap.size || 1,
          'plants',
          plantsSnap.metadata.fromCache
        );

        const remotePlants: BrahmyamanPlant[] = [];
        plantsSnap.forEach((docSnap) => {
          remotePlants.push(docSnap.data() as BrahmyamanPlant);
        });
        remotePlantsRef.current = remotePlants;

        const synced = reconcileCrossDeviceCatalogSync({
          remotePlants,
          remotePlantsEmpty: plantsSnap.empty || remotePlants.length === 0,
          remoteDeletedIds: rawIds,
          localDeletedIds: Array.from(deletedSeedIdsRef.current),
          staticSeedCatalog: BRAHMYAMAN_PLANTS,
          pinnedSeedIds: DEFAULT_SEED_ID_SET,
          expireTrash: purgeExpiredTrash,
        });

        deletedSeedIdsRef.current = new Set<string>(synced.mergedDeletedIds);
        safeSetLocalStorage(
          STORAGE_PERMANENTLY_DELETED_KEY,
          JSON.stringify(synced.mergedDeletedIds)
        );
        plantsRef.current = synced.plants;
        setPlants(synced.plants);

        if (remoteVersion) {
          safeSetLocalStorage(STORAGE_REMOTE_VERSION_KEY, remoteVersion);
        } else {
          safeSetLocalStorage(STORAGE_REMOTE_VERSION_KEY, 'initial-seeded');
        }
        safeSetLocalStorage(STORAGE_CATALOG_SYNCED_AT_KEY, Date.now().toString());
      } catch {
        // Quietly keep local storage fallback when offline
      }
    };

    // Defer remote Firebase hydration until after initial storefront paint so LCP renders instantaneously
    syncTimerId = setTimeout(() => {
      if (!isCancelled) {
        void syncPublicStorefrontCatalog(true);
      }
    }, 150);

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        void syncPublicStorefrontCatalog(false);
      }
    };

    const handleStorageSync = (ev: StorageEvent) => {
      if (ev.key === STORAGE_CATALOG_KEY && ev.newValue) {
        try {
          const parsed = JSON.parse(ev.newValue);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const nextPlants = purgeExpiredTrash(parsed);
            plantsRef.current = nextPlants;
            setPlants(nextPlants);
          }
        } catch {}
        void syncPublicStorefrontCatalog(true);
      }
    };

    let channel: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        channel = new BroadcastChannel(CATALOG_SYNC_CHANNEL);
        channel.onmessage = () => {
          void syncPublicStorefrontCatalog(true);
        };
      }
    } catch {}

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('storage', handleStorageSync);

    return () => {
      isCancelled = true;
      if (syncTimerId !== null) clearTimeout(syncTimerId);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('storage', handleStorageSync);
      try {
        channel?.close();
      } catch {}
    };
  }, [currentRoute, currentAuthUser?.uid, currentAuthUser?.emailVerified]);

  useEffect(() => {
    try {
      const cleaned = purgeExpiredTrash(plants);
      safeSetLocalStorage(STORAGE_CATALOG_KEY, JSON.stringify(cleaned));
    } catch {
      // Ignore quota errors
    }
  }, [plants]);

  // Prevent browser's default delayed smooth/auto scroll restoration from fighting our instant exact restore
  useEffect(() => {
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  // Route navigation helper with history sync
  const navigateTo = (route: 'shop' | 'admin') => {
    setHasInvalidViewParam(false);
    setSelectedPlantId(null);
    setCurrentRoute(route);
    if (typeof window !== 'undefined') {
      if (route === 'admin') {
        window.history.pushState(null, '', '/admin');
      } else {
        window.history.pushState(null, '', '/');
      }
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  };

  // Window Navigator (Separate window for Catalog, Offers, Care, Reviews, Location)
  const handleNavigateWindow = (windowKey: WindowViewKey) => {
    setHasInvalidViewParam(false);
    setCurrentRoute('shop');
    setSelectedPlantId(null);
    setActiveWindow(windowKey);
    if (typeof window !== 'undefined') {
      const url = windowKey === 'catalog' ? '/' : `/?view=${windowKey}`;
      window.history.pushState(null, '', url);
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  };

  // Dedicated Item Window Actions
  const handleOpenPlantDetail = (plant: BrahmyamanPlant) => {
    setHasInvalidViewParam(false);
    setCurrentRoute('shop');
    if (!selectedPlantId && typeof window !== 'undefined') {
      catalogScrollYRef.current = window.scrollY;
    }
    setSelectedPlantId(plant.id);
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', `?plant=${plant.id}`);
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  };

  const handleClosePlantDetail = () => {
    setHasInvalidViewParam(false);
    setCurrentRoute('shop');
    setSelectedPlantId(null);
    if (typeof window !== 'undefined') {
      const url = activeWindow === 'catalog' ? '/' : `/?view=${activeWindow}`;
      window.history.pushState(null, '', url);
    }
  };

  // Restore exact catalog scroll position synchronously BEFORE browser paint (zero scroll animation!)
  useLayoutEffect(() => {
    const prevId = prevSelectedPlantIdRef.current;
    prevSelectedPlantIdRef.current = selectedPlantId;
    if (prevId && !selectedPlantId && currentRoute === 'shop' && typeof window !== 'undefined') {
      window.scrollTo({ top: catalogScrollYRef.current, behavior: 'instant' as ScrollBehavior });
    }
  }, [selectedPlantId, currentRoute]);

  // Listen to popstate, hashchange, and secret keyboard shortcuts (Ctrl+Shift+A)
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      const search = window.location.search;
      const params = new URLSearchParams(search);

      if (
        path === '/admin' ||
        path.startsWith('/admin') ||
        hash === '#admin' ||
        search.includes('admin=true')
      ) {
        setHasInvalidViewParam(false);
        setCurrentRoute('admin');
        return;
      }

      if (path !== '/' && path !== '/index.html') {
        setHasInvalidViewParam(false);
        setSelectedPlantId(null);
        setCurrentRoute('not_found');
        return;
      }

      setCurrentRoute('shop');

      const plantParam = params.get('plant');
      if (plantParam) {
        setSelectedPlantId((curr) => {
          if (!curr) {
            catalogScrollYRef.current = window.scrollY;
          }
          return plantParam;
        });
      } else {
        setSelectedPlantId(null);
      }

      const rawView = params.get('view');
      const viewParam = rawView as WindowViewKey;
      if (rawView && !['catalog', 'offers', 'care', 'reviews', 'location'].includes(rawView)) {
        setHasInvalidViewParam(true);
      } else {
        setHasInvalidViewParam(false);
        if (['catalog', 'offers', 'care', 'reviews', 'location'].includes(viewParam)) {
          setActiveWindow(viewParam);
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) ||
        (e.altKey && (e.key === 'a' || e.key === 'A'))
      ) {
        e.preventDefault();
        setCurrentRoute((prev) => {
          const next = prev === 'admin' ? 'shop' : 'admin';
          if (next === 'admin') {
            window.history.pushState(null, '', '/admin');
          } else {
            window.history.pushState(null, '', '/');
          }
          return next;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  // WhatsApp inquiry items stored in state and persisted in localStorage
  const [inquiryItems, setInquiryItems] = useState<WhatsAppInquiryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_INQUIRY_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    safeSetLocalStorage(STORAGE_INQUIRY_KEY, JSON.stringify(inquiryItems));
  }, [inquiryItems]);

  const handleToggleLang = () => {
    setLang((prev) => (prev === 'bn' ? 'en' : 'bn'));
  };

  const handleSelectAudience = (audience: AudienceTag) => {
    setActiveAudience(audience);
    setSelectedPlantId(null);
    setActiveWindow('catalog');
    if (audience !== 'all') {
      window.requestAnimationFrame(() => {
        const catalogEl = document.getElementById('catalog-content-anchor') || document.getElementById('catalog');
        if (catalogEl) {
          catalogEl.scrollIntoView({ behavior: 'instant' as ScrollBehavior });
        }
      });
    }
  };

  const handleAddToInquiry = (plant: BrahmyamanPlant, option: PlantPotOption) => {
    setInquiryItems((prev) => {
      const existingIdx = prev.findIndex(
        (it) => it.plantId === plant.id && it.optionLabelBn === option.labelBn
      );

      if (existingIdx >= 0) {
        return prev.map((it, idx) =>
          idx === existingIdx ? { ...it, quantity: it.quantity + 1 } : it
        );
      }

      return [
        ...prev,
        {
          plantId: plant.id,
          nameBn: plant.nameBn,
          nameEn: plant.nameEn,
          optionLabelBn: option.labelBn,
          optionLabelEn: option.labelEn,
          price: option.price,
          quantity: 1,
        },
      ];
    });
  };

  const handleUpdateQty = (index: number, delta: number) => {
    setInquiryItems((prev) =>
      prev
        .map((it, idx) =>
          idx === index ? { ...it, quantity: it.quantity + delta } : it
        )
        .filter((it) => it.quantity > 0)
    );
  };

  const handleRemoveItem = (index: number) => {
    setInquiryItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleClearAll = () => {
    setInquiryItems([]);
  };

  // Helper to commit a plant set/delete AND catalog_meta/deleted_seeds atomically in 1 WriteBatch
  const commitPlantWithCatalogMetaBatch = async (
    nextDeletedIds: string[],
    applyPlantOp: (batch: WriteBatch, db: Awaited<ReturnType<typeof loadFirebaseCore>>['db'], fs: Awaited<ReturnType<typeof loadFirestoreSdk>>) => void
  ): Promise<boolean> => {
    const prevSet = new Set(deletedSeedIdsRef.current);
    const storageSnapshot = captureLocalStorageSnapshot([
      STORAGE_PERMANENTLY_DELETED_KEY,
      STORAGE_REMOTE_VERSION_KEY,
      STORAGE_CATALOG_SYNCED_AT_KEY,
    ]);

    const reconciled = reconcileDeletedPlantIds(nextDeletedIds, {
      pinnedSeedIds: DEFAULT_SEED_ID_SET,
    });
    const versionIso = new Date().toISOString();
    deletedSeedIdsRef.current = new Set(reconciled.allDeletedIds);
    safeSetLocalStorage(
      STORAGE_PERMANENTLY_DELETED_KEY,
      JSON.stringify(reconciled.allDeletedIds)
    );
    safeSetLocalStorage(STORAGE_REMOTE_VERSION_KEY, versionIso);
    safeSetLocalStorage(STORAGE_CATALOG_SYNCED_AT_KEY, Date.now().toString());

    try {
      const [{ db }, fs] = await Promise.all([loadFirebaseCore(), loadFirestoreSdk()]);
      const batch = fs.writeBatch(db);
      applyPlantOp(batch, db, fs);
      batch.set(fs.doc(db, 'catalog_meta', 'deleted_seeds'), {
        deletedIds: reconciled.firestoreDeletedIds,
        updatedAt: versionIso,
      });
      await batch.commit();
      broadcastCatalogUpdate();
      return true;
    } catch (err) {
      deletedSeedIdsRef.current = prevSet;
      restoreLocalStorageSnapshot(storageSnapshot);
      throw err;
    }
  };

  const reportLazyFirestoreError = async (
    error: unknown,
    op: 'create' | 'update' | 'delete' | 'write',
    path: string
  ) => {
    try {
      const { handleFirestoreError, OperationType } = await loadFirebaseCore();
      const map: Record<string, OperationType> = {
        create: OperationType.CREATE,
        update: OperationType.UPDATE,
        delete: OperationType.DELETE,
        write: OperationType.WRITE,
      };
      handleFirestoreError(error, map[op], path);
    } catch {
      console.error('Firestore Error:', path, error);
    }
  };

  // Admin Catalog Modification Handlers with Firestore 1MB Limit Protection, Trash Isolation (/trash_plants), & Atomic WriteBatch Rollback
  const handleAddPlant = async (newPlant: BrahmyamanPlant): Promise<boolean> => {
    const activeNewPlant: BrahmyamanPlant = { ...newPlant, status: 'active' };
    const prevPlants = plantsRef.current;
    const prevRemoteActive = remoteActivePlantsRef.current;
    const prevRemoteTrash = remoteTrashPlantsRef.current;
    const catalogStorageSnapshot = captureLocalStorageSnapshot([STORAGE_CATALOG_KEY]);
    const nextPlants = [activeNewPlant, ...prevPlants];
    plantsRef.current = nextPlants;
    if (prevRemoteActive !== null) {
      remoteActivePlantsRef.current = [
        activeNewPlant,
        ...prevRemoteActive.filter((p) => p.id !== activeNewPlant.id),
      ];
    }
    remoteTrashPlantsRef.current = prevRemoteTrash.filter((p) => p.id !== activeNewPlant.id);
    setPlants(nextPlants);
    safeSetLocalStorage(STORAGE_CATALOG_KEY, JSON.stringify(nextPlants));
    try {
      const sanitized = sanitizePlantForFirestore(activeNewPlant);
      const nextDeleted = Array.from(deletedSeedIdsRef.current).filter((id) => id !== activeNewPlant.id);
      const wasInTrash = prevRemoteTrash.some((p) => p.id === activeNewPlant.id);
      await commitPlantWithCatalogMetaBatch(nextDeleted, (batch, db, fs) => {
        batch.set(fs.doc(db, 'plants', activeNewPlant.id), sanitized);
        if (wasInTrash) {
          batch.delete(fs.doc(db, 'trash_plants', activeNewPlant.id));
        }
      });
      trackFirestoreWrite(1, 'plants');
      trackFirestoreWrite(1, 'catalog_meta');
      return true;
    } catch (e) {
      plantsRef.current = prevPlants;
      remoteActivePlantsRef.current = prevRemoteActive;
      remoteTrashPlantsRef.current = prevRemoteTrash;
      setPlants(prevPlants);
      restoreLocalStorageSnapshot(catalogStorageSnapshot);
      await reportLazyFirestoreError(e, 'create', `plants/${activeNewPlant.id}`);
      return false;
    }
  };

  const handleUpdatePlant = async (updatedPlant: BrahmyamanPlant): Promise<boolean> => {
    const isTrashed = updatedPlant.status === 'deleted';
    const normalizedPlant: BrahmyamanPlant = isTrashed
      ? { ...updatedPlant, status: 'deleted' }
      : { ...updatedPlant, status: 'active' };
    const targetCollection = isTrashed ? 'trash_plants' : 'plants';

    const prevPlants = plantsRef.current;
    const prevRemoteActive = remoteActivePlantsRef.current;
    const prevRemoteTrash = remoteTrashPlantsRef.current;
    const catalogStorageSnapshot = captureLocalStorageSnapshot([STORAGE_CATALOG_KEY]);
    const nextPlants = prevPlants.map((p) => (p.id === normalizedPlant.id ? normalizedPlant : p));
    plantsRef.current = nextPlants;
    if (!isTrashed && prevRemoteActive !== null) {
      const existsInRemote = prevRemoteActive.some((p) => p.id === normalizedPlant.id);
      remoteActivePlantsRef.current = existsInRemote
        ? prevRemoteActive.map((p) => (p.id === normalizedPlant.id ? normalizedPlant : p))
        : [...prevRemoteActive, normalizedPlant];
    } else if (isTrashed) {
      const existsInTrash = prevRemoteTrash.some((p) => p.id === normalizedPlant.id);
      remoteTrashPlantsRef.current = existsInTrash
        ? prevRemoteTrash.map((p) => (p.id === normalizedPlant.id ? normalizedPlant : p))
        : [...prevRemoteTrash, normalizedPlant];
    }
    setPlants(nextPlants);
    safeSetLocalStorage(STORAGE_CATALOG_KEY, JSON.stringify(nextPlants));
    try {
      const sanitized = sanitizePlantForFirestore(normalizedPlant);
      await commitPlantWithCatalogMetaBatch(Array.from(deletedSeedIdsRef.current), (batch, db, fs) => {
        batch.set(fs.doc(db, targetCollection, normalizedPlant.id), sanitized, { merge: true });
      });
      trackFirestoreWrite(1, 'plants');
      trackFirestoreWrite(1, 'catalog_meta');
      return true;
    } catch (e) {
      plantsRef.current = prevPlants;
      remoteActivePlantsRef.current = prevRemoteActive;
      remoteTrashPlantsRef.current = prevRemoteTrash;
      setPlants(prevPlants);
      restoreLocalStorageSnapshot(catalogStorageSnapshot);
      await reportLazyFirestoreError(e, 'update', `${targetCollection}/${normalizedPlant.id}`);
      return false;
    }
  };

  // Atomic Multi-Plant Batch Update (Used by One-Click Bug Fixer, Bulk Price Updater, and Batch Undo/Redo)
  const handleBatchUpdatePlants = async (updatedList: BrahmyamanPlant[]): Promise<boolean> => {
    if (updatedList.length === 0) return true;
    const normalizedMap = new Map<string, BrahmyamanPlant>();
    for (const item of updatedList) {
      const isTrashed = item.status === 'deleted';
      normalizedMap.set(
        item.id,
        isTrashed ? { ...item, status: 'deleted' } : { ...item, status: 'active' }
      );
    }

    const prevPlants = plantsRef.current;
    const prevRemoteActive = remoteActivePlantsRef.current;
    const prevRemoteTrash = remoteTrashPlantsRef.current;
    const catalogStorageSnapshot = captureLocalStorageSnapshot([STORAGE_CATALOG_KEY]);

    const nextPlants = prevPlants.map((p) => normalizedMap.get(p.id) || p);
    plantsRef.current = nextPlants;
    if (prevRemoteActive !== null) {
      const nextRemoteMap = new Map<string, BrahmyamanPlant>();
      for (const p of prevRemoteActive) {
        nextRemoteMap.set(p.id, normalizedMap.get(p.id) || p);
      }
      for (const [id, norm] of normalizedMap.entries()) {
        if (norm.status !== 'deleted') {
          nextRemoteMap.set(id, norm);
        }
      }
      remoteActivePlantsRef.current = Array.from(nextRemoteMap.values());
    }
    setPlants(nextPlants);
    safeSetLocalStorage(STORAGE_CATALOG_KEY, JSON.stringify(nextPlants));

    try {
      const entries = Array.from(normalizedMap.values());
      for (let start = 0; start < entries.length; start += 450) {
        const chunk = entries.slice(start, start + 450);
        await commitPlantWithCatalogMetaBatch(Array.from(deletedSeedIdsRef.current), (batch, db, fs) => {
          for (const item of chunk) {
            const targetCol = item.status === 'deleted' ? 'trash_plants' : 'plants';
            const sanitized = sanitizePlantForFirestore(item);
            batch.set(fs.doc(db, targetCol, item.id), sanitized, { merge: true });
          }
        });
        trackFirestoreWrite(chunk.length, 'plants');
        trackFirestoreWrite(1, 'catalog_meta');
      }
      return true;
    } catch (e) {
      plantsRef.current = prevPlants;
      remoteActivePlantsRef.current = prevRemoteActive;
      remoteTrashPlantsRef.current = prevRemoteTrash;
      setPlants(prevPlants);
      restoreLocalStorageSnapshot(catalogStorageSnapshot);
      await reportLazyFirestoreError(e, 'update', 'plants/batch-update');
      return false;
    }
  };

  // Soft Delete: Atomically move plant out of public /plants into Admin-only /trash_plants (hides from public!)
  const handleSoftDeletePlant = async (plantId: string): Promise<boolean> => {
    const prevPlants = plantsRef.current;
    const existingPlant = prevPlants.find((p) => p.id === plantId);
    if (!existingPlant) return false;

    const prevRemoteActive = remoteActivePlantsRef.current;
    const prevRemoteTrash = remoteTrashPlantsRef.current;
    const catalogStorageSnapshot = captureLocalStorageSnapshot([STORAGE_CATALOG_KEY]);
    const dt = getBengaliDateTime();
    const targetPlant: BrahmyamanPlant = {
      ...existingPlant,
      status: 'deleted',
      deletedAt: dt.iso,
      deletedAtBn: `${dt.dateBn} · ${dt.timeBn}`,
    };
    const nextPlants = prevPlants.map((p) => (p.id === plantId ? targetPlant : p));
    plantsRef.current = nextPlants;
    if (prevRemoteActive !== null) {
      remoteActivePlantsRef.current = prevRemoteActive.filter((p) => p.id !== plantId);
    }
    remoteTrashPlantsRef.current = [
      targetPlant,
      ...prevRemoteTrash.filter((p) => p.id !== plantId),
    ];
    setPlants(nextPlants);
    safeSetLocalStorage(STORAGE_CATALOG_KEY, JSON.stringify(nextPlants));

    try {
      const sanitized = sanitizePlantForFirestore(targetPlant);
      await commitPlantWithCatalogMetaBatch(Array.from(deletedSeedIdsRef.current), (batch, db, fs) => {
        batch.set(fs.doc(db, 'trash_plants', plantId), sanitized);
        batch.delete(fs.doc(db, 'plants', plantId));
      });
      trackFirestoreWrite(1, 'plants');
      trackFirestoreDelete(1, 'plants');
      trackFirestoreWrite(1, 'catalog_meta');
      return true;
    } catch (e) {
      plantsRef.current = prevPlants;
      remoteActivePlantsRef.current = prevRemoteActive;
      remoteTrashPlantsRef.current = prevRemoteTrash;
      setPlants(prevPlants);
      restoreLocalStorageSnapshot(catalogStorageSnapshot);
      await reportLazyFirestoreError(e, 'update', `trash_plants/${plantId}`);
      return false;
    }
  };

  // Restore plant atomically from Admin-only /trash_plants back into public /plants
  const handleRestorePlant = async (plantId: string): Promise<boolean> => {
    const prevPlants = plantsRef.current;
    const existingPlant = prevPlants.find((p) => p.id === plantId);
    if (!existingPlant) return false;

    const prevRemoteActive = remoteActivePlantsRef.current;
    const prevRemoteTrash = remoteTrashPlantsRef.current;
    const catalogStorageSnapshot = captureLocalStorageSnapshot([STORAGE_CATALOG_KEY]);
    const dt = getBengaliDateTime();
    const rest = { ...existingPlant };
    delete rest.deletedAt;
    delete rest.deletedAtBn;
    const targetPlant: BrahmyamanPlant = {
      ...rest,
      status: 'active',
      updatedAt: dt.iso,
      updatedAtBn: `${dt.dateBn} · ${dt.timeBn}`,
    };

    const nextPlants = prevPlants.map((p) => (p.id === plantId ? targetPlant : p));
    plantsRef.current = nextPlants;
    if (prevRemoteActive !== null) {
      remoteActivePlantsRef.current = [
        targetPlant,
        ...prevRemoteActive.filter((p) => p.id !== plantId),
      ];
    }
    remoteTrashPlantsRef.current = prevRemoteTrash.filter((p) => p.id !== plantId);
    setPlants(nextPlants);
    safeSetLocalStorage(STORAGE_CATALOG_KEY, JSON.stringify(nextPlants));

    try {
      const sanitized = sanitizePlantForFirestore(targetPlant);
      const updatedDeleted = Array.from(deletedSeedIdsRef.current).filter((id) => id !== plantId);
      await commitPlantWithCatalogMetaBatch(updatedDeleted, (batch, db, fs) => {
        batch.set(fs.doc(db, 'plants', plantId), sanitized);
        batch.delete(fs.doc(db, 'trash_plants', plantId));
      });
      trackFirestoreWrite(1, 'plants');
      trackFirestoreDelete(1, 'plants');
      trackFirestoreWrite(1, 'catalog_meta');
      removePermanentlyDeletedId(plantId);
      return true;
    } catch (e) {
      plantsRef.current = prevPlants;
      remoteActivePlantsRef.current = prevRemoteActive;
      remoteTrashPlantsRef.current = prevRemoteTrash;
      setPlants(prevPlants);
      restoreLocalStorageSnapshot(catalogStorageSnapshot);
      await reportLazyFirestoreError(e, 'update', `plants/${plantId}`);
      return false;
    }
  };

  // Permanent Delete: Atomically delete plant from /trash_plants (and /plants if still present) + record tombstone
  const handlePermanentDeletePlant = async (plantId: string): Promise<boolean> => {
    const prevPlants = plantsRef.current;
    const prevRemoteActive = remoteActivePlantsRef.current;
    const prevRemoteTrash = remoteTrashPlantsRef.current;
    try {
      const nextDeleted = new Set(deletedSeedIdsRef.current);
      nextDeleted.add(plantId);
      const existsInPublicPlants = prevRemoteActive?.some((p) => p.id === plantId) ?? false;
      await commitPlantWithCatalogMetaBatch(Array.from(nextDeleted), (batch, db, fs) => {
        batch.delete(fs.doc(db, 'trash_plants', plantId));
        if (existsInPublicPlants) {
          batch.delete(fs.doc(db, 'plants', plantId));
        }
      });
      trackFirestoreDelete(1, 'plants');
      trackFirestoreWrite(1, 'catalog_meta');
      addPermanentlyDeletedId(plantId);

      if (prevRemoteActive !== null) {
        remoteActivePlantsRef.current = prevRemoteActive.filter((p) => p.id !== plantId);
      }
      remoteTrashPlantsRef.current = prevRemoteTrash.filter((p) => p.id !== plantId);
      const nextPlants = prevPlants.filter((p) => p.id !== plantId);
      plantsRef.current = nextPlants;
      setPlants(nextPlants);
      safeSetLocalStorage(STORAGE_CATALOG_KEY, JSON.stringify(nextPlants));
      return true;
    } catch (e) {
      await reportLazyFirestoreError(e, 'delete', `trash_plants/${plantId}`);
      return false;
    }
  };

  // Empty entire Trash Bin across /trash_plants (and any legacy trashed docs in /plants)
  const handleEmptyTrash = async (): Promise<boolean> => {
    const prevPlants = plantsRef.current;
    const trashCollectionIds = remoteTrashPlantsRef.current.map((p) => p.id);
    const legacyActiveTrashIds = (remoteActivePlantsRef.current || [])
      .filter((p) => p.status === 'deleted' && !trashCollectionIds.includes(p.id))
      .map((p) => p.id);
    const localStateTrashIds = prevPlants
      .filter((p) => p.status === 'deleted')
      .map((p) => p.id);
    const trashedIds = Array.from(new Set([...trashCollectionIds, ...localStateTrashIds]));
    if (trashedIds.length === 0 && legacyActiveTrashIds.length === 0) return true;

    const ops = await createCatalogBatchOps();
    const result = await executeReliableTrashEmpty({
      trashedIds,
      legacyActiveTrashIds,
      prevDeletedSeedIds: Array.from(deletedSeedIdsRef.current),
      ops,
      pinnedSeedIds: DEFAULT_SEED_ID_SET,
      journalStore: createLocalStorageJournalStore(),
    });

    if (result.deletedIds.length > 0) {
      const deletedSet = new Set(result.deletedIds);
      for (const id of result.deletedIds) {
        addPermanentlyDeletedId(id);
      }
      deletedSeedIdsRef.current = new Set(result.nextDeletedSeedIds);
      safeSetLocalStorage(
        STORAGE_PERMANENTLY_DELETED_KEY,
        JSON.stringify(result.nextDeletedSeedIds)
      );
      safeSetLocalStorage(STORAGE_REMOTE_VERSION_KEY, new Date().toISOString());
      safeSetLocalStorage(STORAGE_CATALOG_SYNCED_AT_KEY, Date.now().toString());

      const nextPlants = prevPlants.filter((p) => !deletedSet.has(p.id));
      plantsRef.current = nextPlants;
      setPlants(nextPlants);
      safeSetLocalStorage(STORAGE_CATALOG_KEY, JSON.stringify(nextPlants));
      broadcastCatalogUpdate();
    }

    return result.ok;
  };

  const createCatalogBatchOps = async (): Promise<CatalogBatchOps> => {
    const [{ db, handleFirestoreError, OperationType }, fs] = await Promise.all([
      loadFirebaseCore(),
      loadFirestoreSdk(),
    ]);
    return {
      createBatch: () => {
        const batch = fs.writeBatch(db);
        return {
          setPlant: (id, data) => batch.set(fs.doc(db, 'plants', id), data),
          deletePlant: (id) => batch.delete(fs.doc(db, 'plants', id)),
          setTrashPlant: (id, data) => batch.set(fs.doc(db, 'trash_plants', id), data),
          deleteTrashPlant: (id) => batch.delete(fs.doc(db, 'trash_plants', id)),
          setDeletedSeedsMeta: (deletedIds, updatedAtIso) => {
            const reconciled = reconcileDeletedPlantIds(deletedIds, {
              pinnedSeedIds: DEFAULT_SEED_ID_SET,
            });
            batch.set(fs.doc(db, 'catalog_meta', 'deleted_seeds'), {
              deletedIds: reconciled.firestoreDeletedIds,
              updatedAt: updatedAtIso,
            });
          },
          commit: () => batch.commit(),
        };
      },
      onWriteTracked: (count) => trackFirestoreWrite(count, 'plants'),
      onDeleteTracked: (count) => trackFirestoreDelete(count, 'plants'),
      onError: (err, path) => handleFirestoreError(err, OperationType.WRITE, path),
    };
  };

  // Automatic browser-startup detection & idempotent recovery of incomplete multi-batch operations
  const handleStartupCatalogRecovery = async (): Promise<boolean> => {
    const journalStore = createLocalStorageJournalStore();
    const pending = getIncompleteCatalogOperationJournal(journalStore);
    if (!pending) {
      setStartupRecoveryStatus(null);
      return true;
    }

    const [{ auth }, ops] = await Promise.all([loadFirebaseCore(), createCatalogBatchOps()]);
    const res = await runStartupCatalogRecovery({
      isAdminAuthenticated: Boolean(auth.currentUser),
      ops,
      journalStore,
      pinnedSeedIds: DEFAULT_SEED_ID_SET,
    });
    setStartupRecoveryStatus(res.foundIncomplete ? res : null);

    if (res.foundIncomplete && res.ok) {
      const restoredDeleted = reconcileDeletedPlantIds(res.prevDeletedIds, {
        pinnedSeedIds: DEFAULT_SEED_ID_SET,
      }).allDeletedIds;
      deletedSeedIdsRef.current = new Set(restoredDeleted);
      safeSetLocalStorage(
        STORAGE_PERMANENTLY_DELETED_KEY,
        JSON.stringify(restoredDeleted)
      );
      safeSetLocalStorage(STORAGE_REMOTE_VERSION_KEY, new Date().toISOString());
      safeSetLocalStorage(STORAGE_CATALOG_SYNCED_AT_KEY, '0');
    }
    return res.ok;
  };

  useEffect(() => {
    let isCancelled = false;
    let unsubAuth: (() => void) | undefined;
    const journalStore = createLocalStorageJournalStore();

    const checkAndRecover = async (hasUser: boolean) => {
      const pending = getIncompleteCatalogOperationJournal(journalStore);
      if (!pending) {
        if (!isCancelled) setStartupRecoveryStatus(null);
        return;
      }

      const ops = await createCatalogBatchOps();
      const res = await runStartupCatalogRecovery({
        isAdminAuthenticated: hasUser,
        ops,
        journalStore,
        pinnedSeedIds: DEFAULT_SEED_ID_SET,
      });
      if (isCancelled) return;
      setStartupRecoveryStatus(res.foundIncomplete ? res : null);

      if (res.foundIncomplete && res.ok) {
        const restoredDeleted = reconcileDeletedPlantIds(res.prevDeletedIds, {
          pinnedSeedIds: DEFAULT_SEED_ID_SET,
        }).allDeletedIds;
        deletedSeedIdsRef.current = new Set(restoredDeleted);
        safeSetLocalStorage(
          STORAGE_PERMANENTLY_DELETED_KEY,
          JSON.stringify(restoredDeleted)
        );
        safeSetLocalStorage(STORAGE_REMOTE_VERSION_KEY, new Date().toISOString());
        safeSetLocalStorage(STORAGE_CATALOG_SYNCED_AT_KEY, '0');
      }
    };

    const bootAuthListener = () => {
      void Promise.all([loadFirebaseCore(), loadFirebaseAuthSdk()])
        .then(([{ auth }, { onAuthStateChanged }]) => {
          if (isCancelled) return;
          void checkAndRecover(Boolean(auth.currentUser));
          unsubAuth = onAuthStateChanged(auth, (user) => {
            if (!isCancelled) {
              setCurrentAuthUser(user);
            }
            void checkAndRecover(Boolean(user));
          });
        })
        .catch(() => {});
    };

    let delayTimer: ReturnType<typeof setTimeout> | null = null;
    if (currentRoute === 'admin' || getIncompleteCatalogOperationJournal(journalStore)) {
      bootAuthListener();
    } else {
      delayTimer = setTimeout(bootAuthListener, 250);
    }

    return () => {
      isCancelled = true;
      if (delayTimer !== null) clearTimeout(delayTimer);
      unsubAuth?.();
    };
  }, [currentRoute]);

  const handleResetCatalog = async (): Promise<boolean> => {
    try {
      const [{ db }, fs, batchOps] = await Promise.all([
        loadFirebaseCore(),
        loadFirestoreSdk(),
        createCatalogBatchOps(),
      ]);
      const priorRecovery = await recoverIncompleteCatalogOperation({
        ops: batchOps,
        pinnedSeedIds: DEFAULT_SEED_ID_SET,
      });
      if (priorRecovery.foundIncomplete && !priorRecovery.ok) {
        return false;
      }
      setStartupRecoveryStatus(null);

      const [activeSnap, trashSnap] = await Promise.all([
        fs.getDocs(fs.collection(db, 'plants')),
        fs.getDocs(fs.collection(db, 'trash_plants')),
      ]);
      trackFirestoreRead(
        (activeSnap.size || 1) + (trashSnap.size || 0),
        'plants',
        activeSnap.metadata.fromCache
      );

      const remoteDocsBackup = [
        ...activeSnap.docs.map((docSnap) => ({
          id: docSnap.id,
          data: docSnap.data() as Record<string, unknown>,
          collection: 'plants' as const,
        })),
        ...trashSnap.docs.map((docSnap) => ({
          id: docSnap.id,
          data: docSnap.data() as Record<string, unknown>,
          collection: 'trash_plants' as const,
        })),
      ];
      const prevDeletedIds = Array.from(deletedSeedIdsRef.current);

      const result = await executeReliableCatalogReset({
        remoteDocsBackup,
        prevDeletedIds,
        ops: batchOps,
        pinnedSeedIds: DEFAULT_SEED_ID_SET,
      });

      if (!result.ok) {
        if (result.recoveryAttempted && !result.recoverySucceeded) {
          const remainingSet = new Set(result.remainingRemoteIds);
          const remainingRemoteDocs = remoteDocsBackup
            .filter((item) => remainingSet.has(item.id))
            .map((item) => item.data as unknown as BrahmyamanPlant);
          remoteActivePlantsRef.current = remoteDocsBackup
            .filter((item) => remainingSet.has(item.id) && item.collection !== 'trash_plants')
            .map((item) => item.data as unknown as BrahmyamanPlant);
          remoteTrashPlantsRef.current = remoteDocsBackup
            .filter((item) => remainingSet.has(item.id) && item.collection === 'trash_plants')
            .map((item) => item.data as unknown as BrahmyamanPlant);
          remotePlantsRef.current = remainingRemoteDocs;
          const syncedFallback = mergeCatalogWithDeletedFilter(
            remainingRemoteDocs,
            deletedSeedIdsRef.current
          );
          plantsRef.current = syncedFallback;
          setPlants(syncedFallback);
          safeSetLocalStorage(STORAGE_CATALOG_KEY, JSON.stringify(syncedFallback));
        }
        return false;
      }

      localStorage.removeItem(STORAGE_PERMANENTLY_DELETED_KEY);
      deletedSeedIdsRef.current = new Set();
      remoteActivePlantsRef.current = [];
      remoteTrashPlantsRef.current = [];
      remotePlantsRef.current = [];
      plantsRef.current = BRAHMYAMAN_PLANTS;
      safeSetLocalStorage(STORAGE_CATALOG_KEY, JSON.stringify(BRAHMYAMAN_PLANTS));
      safeSetLocalStorage(STORAGE_REMOTE_VERSION_KEY, new Date().toISOString());
      safeSetLocalStorage(STORAGE_CATALOG_SYNCED_AT_KEY, Date.now().toString());
      setPlants(BRAHMYAMAN_PLANTS);
      broadcastCatalogUpdate();
      return true;
    } catch (e) {
      await reportLazyFirestoreError(e, 'delete', 'plants');
      return false;
    }
  };

  // Restore full catalog from JSON backup via Firestore WriteBatch + compensating recovery
  const handleImportCatalogBackup = async (
    restoredPlants: BrahmyamanPlant[],
    restoredDeletedIds?: string[]
  ): Promise<boolean> => {
    const batchOps = await createCatalogBatchOps();
    const priorRecovery = await recoverIncompleteCatalogOperation({
      ops: batchOps,
      pinnedSeedIds: DEFAULT_SEED_ID_SET,
    });
    if (priorRecovery.foundIncomplete && !priorRecovery.ok) {
      return false;
    }
    setStartupRecoveryStatus(null);

    const dt = getBengaliDateTime();
    const prevDeletedIds = Array.from(deletedSeedIdsRef.current);
    const prevStorageSnap = captureLocalStorageSnapshot([
      STORAGE_PERMANENTLY_DELETED_KEY,
      STORAGE_CATALOG_KEY,
      STORAGE_REMOTE_VERSION_KEY,
      STORAGE_CATALOG_SYNCED_AT_KEY,
    ]);

    const result = await executeReliableCatalogImport({
      rawPlants: restoredPlants,
      prevPlants: plantsRef.current,
      prevDeletedIds,
      restoredDeletedIds,
      sanitizePlant: sanitizePlantForFirestore,
      defaultIso: dt.iso,
      defaultBn: `${dt.dateBn} · ${dt.timeBn}`,
      ops: batchOps,
      pinnedSeedIds: DEFAULT_SEED_ID_SET,
    });

    if (result.ok) {
      deletedSeedIdsRef.current = new Set(result.nextDeletedIds);
      safeSetLocalStorage(
        STORAGE_PERMANENTLY_DELETED_KEY,
        JSON.stringify(result.nextDeletedIds)
      );
      plantsRef.current = result.mergedPlants;
      setPlants(result.mergedPlants);
      safeSetLocalStorage(STORAGE_CATALOG_KEY, JSON.stringify(result.mergedPlants));
      safeSetLocalStorage(STORAGE_REMOTE_VERSION_KEY, new Date().toISOString());
      safeSetLocalStorage(STORAGE_CATALOG_SYNCED_AT_KEY, Date.now().toString());
      broadcastCatalogUpdate();
    } else if (result.recoveryAttempted && !result.recoverySucceeded) {
      // Partial multi-batch failure where compensating recovery could not undo every batch:
      // synchronize local catalog state with whatever remains persisted rather than pretending success.
      deletedSeedIdsRef.current = new Set(result.nextDeletedIds);
      safeSetLocalStorage(
        STORAGE_PERMANENTLY_DELETED_KEY,
        JSON.stringify(result.nextDeletedIds)
      );
      plantsRef.current = result.mergedPlants;
      setPlants(result.mergedPlants);
      safeSetLocalStorage(STORAGE_CATALOG_KEY, JSON.stringify(result.mergedPlants));
    } else {
      restoreLocalStorageSnapshot(prevStorageSnap);
    }

    return result.ok;
  };

  // Filter only active (non-deleted) plants for the public customer storefront
  const activePlants = useMemo(() => plants.filter((p) => p.status !== 'deleted'), [plants]);
  const totalItemCount = inquiryItems.reduce((acc, it) => acc + it.quantity, 0);
  const totalEstimatePrice = useMemo(() => {
    return inquiryItems.reduce((sum, item) => {
      const livePlant = activePlants.find((p) => p.id === item.plantId);
      const matchedOpt =
        livePlant?.options.find((o) => o.labelBn === item.optionLabelBn) ||
        livePlant?.options[0];
      const unitPrice = matchedOpt && matchedOpt.price > 0 ? matchedOpt.price : item.price;
      return sum + unitPrice * item.quantity;
    }, 0);
  }, [inquiryItems, activePlants]);

  // Active Selected Plant for the Dedicated Item Window
  const selectedPlant = selectedPlantId
    ? activePlants.find((p) => p.id === selectedPlantId) ||
      plants.find((p) => p.id === selectedPlantId) ||
      null
    : null;

  const isMissingPlant = Boolean(selectedPlantId && !selectedPlant);
  const isNotFoundView =
    currentRoute === 'not_found' || hasInvalidViewParam || isMissingPlant;

  // Dynamic SEO title, meta description, OG tags, canonical URL, and Product JSON-LD
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const seoRoute: 'shop' | 'admin' | 'not_found' =
      currentRoute === 'admin'
        ? 'admin'
        : isNotFoundView
        ? 'not_found'
        : 'shop';
    const meta = buildSeoMetaForState({
      currentRoute: seoRoute,
      activeWindow,
      selectedPlant,
      lang,
      origin: window.location.origin,
    });
    applySeoMetadataToDocument(meta, lang);
  }, [currentRoute, isNotFoundView, activeWindow, selectedPlant, lang]);

  // If user is on the dedicated admin page route (/admin or #admin)
  if (currentRoute === 'admin') {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#EBF1E8] flex items-center justify-center p-6 font-sans-bn">
            <div className="bg-white border border-[#D5DFD1] rounded-2xl px-6 py-5 shadow-sm text-center space-y-2">
              <div className="w-7 h-7 border-3 border-[#1B8354] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-bold text-[#142318]">অ্যাডমিন প্যানেল লোড হচ্ছে...</p>
            </div>
          </div>
        }
      >
        <AdminPage
          lang={lang}
          plants={plants}
          onNavigateToShop={() => navigateTo('shop')}
          onAddPlant={handleAddPlant}
          onUpdatePlant={handleUpdatePlant}
          onBatchUpdatePlants={handleBatchUpdatePlants}
          onSoftDeletePlant={handleSoftDeletePlant}
          onRestorePlant={handleRestorePlant}
          onPermanentDeletePlant={handlePermanentDeletePlant}
          onEmptyTrash={handleEmptyTrash}
          onResetCatalog={handleResetCatalog}
          onImportCatalogBackup={handleImportCatalogBackup}
          startupRecoveryStatus={startupRecoveryStatus}
          onRetryStartupRecovery={handleStartupCatalogRecovery}
        />
      </Suspense>
    );
  }

  if (isNotFoundView) {
    return (
      <>
        <div className="min-h-screen flex flex-col bg-[#F4F7F1] text-[#122619]">
          <Header
            lang={lang}
            plants={activePlants}
            searchQuery={searchQuery}
            onSearchChange={(q) => {
              setSearchQuery(q);
              if (q.trim()) {
                handleNavigateWindow('catalog');
              }
            }}
            onToggleLang={handleToggleLang}
            inquiryCount={totalItemCount}
            onOpenInquiryBag={() => setIsCartModalOpen(true)}
            onSelectAudience={handleSelectAudience}
            onSelectPlant={handleOpenPlantDetail}
            onAddToInquiry={handleAddToInquiry}
            activeWindow="catalog"
            onNavigateWindow={handleNavigateWindow}
          />
          <main className="flex-1">
            <NotFoundPage
              lang={lang}
              missingPlantId={isMissingPlant ? selectedPlantId : null}
              onBackToCatalog={() => {
                setHasInvalidViewParam(false);
                setSelectedPlantId(null);
                setCurrentRoute('shop');
                setActiveWindow('catalog');
                if (typeof window !== 'undefined') {
                  window.history.pushState(null, '', '/');
                }
              }}
            />
          </main>
          <Footer
            lang={lang}
            onSelectAudience={(aud) => {
              handleSelectAudience(aud);
              handleNavigateWindow('catalog');
            }}
            onOpenAdmin={() => navigateTo('admin')}
            onNavigateWindow={handleNavigateWindow}
          />
        </div>
        <WhatsAppCartModal
          isOpen={isCartModalOpen}
          items={inquiryItems}
          plants={activePlants}
          lang={lang}
          onClose={() => setIsCartModalOpen(false)}
          onUpdateQty={handleUpdateQty}
          onRemoveItem={handleRemoveItem}
          onClearAll={handleClearAll}
        />
      </>
    );
  }

  // -------------------------------------------------------------
  // STOREFRONT + DEDICATED ITEM WINDOW (Storefront stays mounted hidden when viewing a plant so exact scroll & category state restore instantly!)
  // -------------------------------------------------------------
  return (
    <>
      {selectedPlant && (
        <div className="min-h-screen flex flex-col bg-[#F4F7F1] text-[#122619]">
          <Header
            lang={lang}
            plants={activePlants}
            searchQuery={searchQuery}
            onSearchChange={(q) => {
              setSearchQuery(q);
              if (q.trim()) {
                setSelectedPlantId(null);
                setActiveWindow('catalog');
              }
            }}
            onToggleLang={handleToggleLang}
            inquiryCount={totalItemCount}
            onOpenInquiryBag={() => setIsCartModalOpen(true)}
            onSelectAudience={handleSelectAudience}
            onSelectPlant={handleOpenPlantDetail}
            onAddToInquiry={handleAddToInquiry}
            activeWindow={activeWindow}
            onNavigateWindow={handleNavigateWindow}
          />

          <main className="flex-1">
            <PlantDetailWindow
              plant={selectedPlant}
              allPlants={activePlants}
              lang={lang}
              onBack={handleClosePlantDetail}
              onSelectPlant={handleOpenPlantDetail}
              onAddToInquiry={handleAddToInquiry}
              onOpenInquiryBag={() => setIsCartModalOpen(true)}
            />
          </main>

          <Footer
            lang={lang}
            onSelectAudience={(aud) => {
              handleSelectAudience(aud);
              handleNavigateWindow('catalog');
            }}
            onOpenAdmin={() => navigateTo('admin')}
            onNavigateWindow={handleNavigateWindow}
          />
        </div>
      )}

      {/* PRIMARY DEDICATED SECTIONS / WINDOWS (Preserved mounted for zero-animation exact scroll restoration) */}
      <div
        className={`min-h-screen flex flex-col bg-[#F4F7F1] text-[#122619] ${selectedPlant ? 'hidden' : ''}`}
      >
        <Header
          lang={lang}
          plants={activePlants}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onToggleLang={handleToggleLang}
          inquiryCount={totalItemCount}
          onOpenInquiryBag={() => setIsCartModalOpen(true)}
          onSelectAudience={handleSelectAudience}
          onSelectPlant={handleOpenPlantDetail}
          onAddToInquiry={handleAddToInquiry}
          activeWindow={activeWindow}
          onNavigateWindow={handleNavigateWindow}
        />

        <main className="flex-1">
          {/* WINDOW 1: PLANT CATALOG & CATEGORIES */}
          {activeWindow === 'catalog' && (
            <div>
              <HeroSection
                lang={lang}
                onSelectAudience={handleSelectAudience}
                onExploreCatalog={() => {
                  const el = document.getElementById('catalog');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                onOpenLocation={() => handleNavigateWindow('location')}
              />

              <CatalogSection
                plants={activePlants}
                lang={lang}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                activeAudience={activeAudience}
                onSelectAudience={setActiveAudience}
                onOpenPlantModal={handleOpenPlantDetail}
                onAddToInquiry={handleAddToInquiry}
                isVisible={!selectedPlant}
              />
            </div>
          )}

        {/* WINDOW 2: SEASONAL OFFERS & DEALS */}
        {activeWindow === 'offers' && (
          <div className="bg-[#EBF1E8] py-6 sm:py-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
              <div className="bg-white rounded-3xl border border-[#D5DFD1] p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#B34728] font-sans-bn mb-1.5">
                    কালশুলি নার্সারির বিশেষ মরশুমি সুবিধা
                  </p>
                  <h1 className="font-serif-bn text-2xl sm:text-4xl font-bold text-[#142318]">
                    চলতি মাসের সেরা ছাড় ও কম্বো অফার
                  </h1>
                  <p className="text-xs sm:text-sm text-[#526356] font-sans-bn mt-2">
                    পশ্চিমবঙ্গের স্থানীয় ঋতুভিত্তিক বিশেষ ছাড় এবং ছাদবাগানের জন্য প্রস্তুত কলমের গাছ।
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleNavigateWindow('catalog')}
                  className="px-4 py-2.5 rounded-xl bg-[#142318] hover:bg-[#1B8354] text-white text-xs font-bold transition-colors cursor-pointer shrink-0"
                >
                  সকল চারা ক্যাটালগ দেখুন ↗
                </button>
              </div>
            </div>

            <CurrentMonthBestBuysBanner
              lang={lang}
              plants={activePlants}
              onSelectPlant={handleOpenPlantDetail}
            />

            <SeasonalOffersSection
              lang={lang}
              plants={activePlants}
              onSelectPlant={handleOpenPlantDetail}
            />

            <SeasonalHighlightsBanner
              lang={lang}
              plants={activePlants}
              onSelectPlant={handleOpenPlantDetail}
            />
          </div>
        )}

        {/* WINDOW 3: CARE GUIDE & SOIL ADVICE */}
        {activeWindow === 'care' && (
          <div className="bg-[#EBF1E8] py-6 sm:py-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
              <div className="bg-white rounded-3xl border border-[#D5DFD1] p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1B8354] font-sans-bn mb-1.5">
                    কালশুলির অভিজ্ঞ মালীদের পরামর্শ
                  </p>
                  <h1 className="font-serif-bn text-2xl sm:text-4xl font-bold text-[#142318]">
                    গাছ পরিচর্যা ও মাটি তৈরির সহজ নিয়ম
                  </h1>
                  <p className="text-xs sm:text-sm text-[#526356] font-sans-bn mt-2">
                    বাঁকুড়ার কড়া রোদ ও লাল মাটিতে গাছ দীর্ঘজীবী রাখার বাস্তব নির্দেশিকা।
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleNavigateWindow('catalog')}
                  className="px-4 py-2.5 rounded-xl bg-[#142318] hover:bg-[#1B8354] text-white text-xs font-bold transition-colors cursor-pointer shrink-0"
                >
                  চারা ক্যাটালগে ফিরুন ↗
                </button>
              </div>
            </div>

            <CareGuideSection lang={lang} />
          </div>
        )}

        {/* WINDOW 4: REVIEWS & TESTIMONIALS */}
        {activeWindow === 'reviews' && (
          <div className="bg-[#EBF1E8] py-6 sm:py-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
              <div className="bg-white rounded-3xl border border-[#D5DFD1] p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#B45309] font-sans-bn mb-1.5">
                    গ্রাহকদের সন্তুষ্টি
                  </p>
                  <h1 className="font-serif-bn text-2xl sm:text-4xl font-bold text-[#142318]">
                    কালশুলি, পারসোলা, খাতড়া ও সিমলাপালের গ্রাহক রিভিউ
                  </h1>
                  <p className="text-xs sm:text-sm text-[#526356] font-sans-bn mt-2">
                    আমাদের নার্সারি থেকে নেওয়া চারাগাছ ও কলমের বাস্তব ফলাফল ও গ্রাহক প্রতিক্রিয়া।
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleNavigateWindow('catalog')}
                  className="px-4 py-2.5 rounded-xl bg-[#142318] hover:bg-[#1B8354] text-white text-xs font-bold transition-colors cursor-pointer shrink-0"
                >
                  চারা নির্বাচন করুন ↗
                </button>
              </div>
            </div>

            <TestimonialsSection lang={lang} />
          </div>
        )}

        {/* WINDOW 5: LOCATION & VISITING HOURS */}
        {activeWindow === 'location' && (
          <div className="bg-[#EBF1E8] py-6 sm:py-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
              <div className="bg-white rounded-3xl border border-[#D5DFD1] p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#785942] font-sans-bn mb-1.5">
                    সরাসরি পরিদর্শন
                  </p>
                  <h1 className="font-serif-bn text-2xl sm:text-4xl font-bold text-[#142318]">
                    কালশুলি নার্সারির ঠিকানা ও সময়সূচী
                  </h1>
                  <p className="text-xs sm:text-sm text-[#526356] font-sans-bn mt-2">
                    প্রতিদিন সকাল ৬:৩০ থেকে সন্ধ্যা ৬:৩০ পর্যন্ত খোলা থাকে। স্বশরীরে এসে সতেজ চারা বেছে নিন।
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleNavigateWindow('catalog')}
                  className="px-4 py-2.5 rounded-xl bg-[#142318] hover:bg-[#1B8354] text-white text-xs font-bold transition-colors cursor-pointer shrink-0"
                >
                  চারা ক্যাটালগ দেখুন ↗
                </button>
              </div>
            </div>

            <LocationSection lang={lang} />
          </div>
        )}
      </main>

      <Footer
        lang={lang}
        onSelectAudience={(aud) => {
          handleSelectAudience(aud);
          handleNavigateWindow('catalog');
        }}
        onOpenAdmin={() => navigateTo('admin')}
        onNavigateWindow={handleNavigateWindow}
      />

      {/* Desktop Floating Order Bag Summary Bar (Active when items are selected; hidden on mobile so it never covers hero text) */}
      {totalItemCount > 0 && !isCartModalOpen && !selectedPlant && (
        <div className="hidden md:block fixed right-6 bottom-6 z-30 pointer-events-none">
          <div className="max-w-md ml-auto bg-[#122619] text-white rounded-2xl shadow-2xl border border-[#2C4733] px-4 py-3 flex items-center justify-between gap-4 pointer-events-auto font-sans-bn animate-bag-pop">
            <div className="min-w-0">
              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                <span className="font-mono-num tabular-nums text-[#A3E635]">{totalItemCount}টি</span>
                <span>{lang === 'bn' ? 'চারা নির্বাচিত' : 'saplings selected'}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-num tabular-nums text-[#FFD8C2]">₹{totalEstimatePrice}</span>
              </p>
              <p className="text-xs text-[#A8BDB0] truncate mt-0.5">
                {totalEstimatePrice >= 250
                  ? 'খাতড়া/সিমলাপাল রুট ডেলিভারির জন্য যোগ্য ✓'
                  : `আর ₹${250 - totalEstimatePrice} হলে দূরবর্তী রুট ডেলিভারি উপযোগী`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsCartModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-[#15803D] hover:bg-[#166534] active:scale-95 text-white text-xs font-bold inline-flex items-center gap-1.5 shrink-0 transition-all cursor-pointer shadow-sm"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-current" />
              <span>{lang === 'bn' ? 'অর্ডার পাঠান' : 'Send Order'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
      </div>

      {/* WhatsApp Order Inquiry Builder Cart Drawer (Rendered outside hidden catalog container so it opens on plant detail views too) */}
      <WhatsAppCartModal
        isOpen={isCartModalOpen}
        items={inquiryItems}
        plants={activePlants}
        lang={lang}
        onClose={() => setIsCartModalOpen(false)}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveItem}
        onClearAll={handleClearAll}
      />
    </>
  );
}
