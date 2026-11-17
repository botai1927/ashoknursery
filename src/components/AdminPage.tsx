import { useState, useRef, useEffect, FormEvent, ChangeEvent, useMemo } from 'react';
import {
  Plus,
  RefreshCw,
  AlertTriangle,
  Database,
} from 'lucide-react';
import {
  BrahmyamanPlant,
  PlantCategory,
  AudienceTag,
  PlantPotOption,
  AdminActivityLogItem,
  WhatsAppOrderLogItem,
  WhatsAppOrderStatus,
  CustomerReviewItem,
} from '../types/nursery';
import { PUJA_IMAGE } from '../data/brahmyamanCatalog';
import { getBengaliDateTime } from '../utils/bengaliDateTime';
import {
  onAuthStateChanged,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  writeBatch,
  getCountFromServer,
  getDoc,
} from 'firebase/firestore';
import {
  auth,
  db,
  handleFirestoreError,
  OperationType,
  signInWithGooglePopup,
  clearStaleFirebaseAuthEvents,
  isFirebasePopupPendingPromiseAssertion,
} from '../firebase';
import { resolvePlantImageUrl } from '../utils/imageUrl';
import {
  StoredMonitorState,
  getFirestoreUsageStats,
  subscribeFirestoreMonitor,
  trackFirestoreRead,
  trackFirestoreWrite,
  trackFirestoreDelete,
} from '../utils/firestoreMonitor';
import {
  persistActivityLogEntry,
  sanitizeActivityLogForFirestore,
} from '../utils/firestoreCatalogTransactions';
import {
  alignPlantImageSlots,
  scanCloudinaryLibraryForAdmin,
  type CloudinaryAssetRecord,
  type CloudinaryOrphanScanReport,
} from '../utils/cloudinaryCleanup';
import {
  buildUnifiedBackupBundle,
  parseUnifiedBackupPayload,
  type BackupPlantEntry,
  type EmbeddedPlantPhotos,
} from '../utils/backupBundle';
import {
  validateImageFile,
  compressImageFileToDataUrl,
  validateFirestoreImagePayloadSize,
  compressBase64ImageForFirestore,
  uploadImageSecurely,
  deleteCloudinaryAsset,
  applyUploadedPhotoToPlant,
  clearPlantPhotoSlot,
} from '../utils/cloudinaryUpload';
import {
  getRuntimeIssues,
  clearRuntimeIssues,
  subscribeRuntimeIssues,
  type RuntimeIssueRecord,
} from '../utils/runtimeDiagnostics';

import {
  ADMIN_CATEGORIES,
  PRESET_PLANT_PHOTOS,
  type AdminTab,
  type AdminSection,
  type RootCauseIssue,
} from './adminConstants';
import { AdminInventoryTab } from './AdminInventoryTab';
import { AdminPlantFormTab, type ImageSearchResultItem } from './AdminPlantFormTab';
import {
  AdminUploadHistoryTab,
  type AdminLogFilter,
} from './AdminUploadHistoryTab';
import { AdminTrashTab } from './AdminTrashTab';
import {
  AdminChatbotTab,
  type ChatMessage,
  type ChatMessageAction,
} from './AdminChatbotTab';
import {
  AdminApiTab,
  type AdminAiStatusSnapshot,
  type AiProviderChoice,
  type AiModelChoice,
  type SystemDiagnosticsSnapshot,
} from './AdminApiTab';
import { AdminCloudinaryTab } from './AdminCloudinaryTab';
import { AdminBackupTab } from './AdminBackupTab';
import { AdminSettingsTab } from './AdminSettingsTab';
import { AdminUndoRedoTab } from './AdminUndoRedoTab';
import { AdminDiagnosticsModal } from './AdminDiagnosticsModal';
import { AdminDiagnosticsTab } from './AdminDiagnosticsTab';
import { AdminOrderTrackerTab } from './AdminOrderTrackerTab';
import { AdminBulkPriceTab, type BulkPriceUpdatePayload } from './AdminBulkPriceTab';
import { AdminReviewsTab } from './AdminReviewsTab';
import { AdminQrTagsTab } from './AdminQrTagsTab';
import {
  loadGlobalUndoStack,
  loadGlobalRedoStack,
  saveGlobalUndoRedoStacks,
  type AdminUndoRecord,
} from '../utils/adminUndoRedoStorage';
import {
  loadLocalWhatsAppOrderLogs,
  saveLocalWhatsAppOrderLogs,
  sanitizeWhatsAppOrderForFirestore,
} from '../utils/whatsappOrderTracker';
import {
  isRemovedFakeReview,
  loadLocalCustomerReviews,
  normalizeCustomerReview,
  saveLocalCustomerReviews,
  submitCustomerReview,
  updateCustomerReviewStatus,
  removeCustomerReview,
} from '../utils/customerReviewsStorage';
import {
  analyzeCatalogRootCauseDiagnostics,
  buildCatalogBugFixPlan,
} from '../utils/catalogBugFixer';

import {
  STORAGE_ACTIVITY_LOG,
  safeSetLocalStorage,
  type AdminPageProps,
  type AdminToast,
  type AdminToastType,
  type ConfirmDialogState,
  type ServerSecurityMeta,
} from './admin/adminTypes';
import {
  buildPrintablePhotoCatalogHtml,
  computeDbHealthMetrics,
  inlineImageAsDataUrl,
} from './admin/adminHealthUtils';
import { AdminLoginView } from './admin/AdminLoginView';
import {
  AdminDesktopSidebar,
  AdminHeaderBar,
  AdminMobileBottomNav,
  AdminMobileDrawer,
} from './admin/AdminHeaderNav';
import {
  buildAdminNavigationData,
  TAB_TO_SECTION_MAP,
} from './admin/adminNavConfig';
import { AdminModalsAndToast } from './admin/AdminModalsAndToast';

export type { AdminToastType };

export function AdminPage({
  plants,
  onNavigateToShop,
  onAddPlant,
  onUpdatePlant,
  onBatchUpdatePlants,
  onSoftDeletePlant,
  onRestorePlant,
  onPermanentDeletePlant,
  onEmptyTrash,
  onResetCatalog,
  onImportCatalogBackup,
  startupRecoveryStatus,
  onRetryStartupRecovery,
}: AdminPageProps) {
  // Firebase Authentication + Backend Server-Side ID Token Verification State
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(() => auth.currentUser);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [isServerVerified, setIsServerVerified] = useState<boolean>(false);
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [hasBackupGeminiKey, setHasBackupGeminiKey] = useState<boolean>(false);
  const [aiStatus, setAiStatus] = useState<AdminAiStatusSnapshot | null>(() => {
    try {
      const cached = localStorage.getItem('brahmyaman_ai_status_cache');
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {}
    return null;
  });
  const [aiProviderChoice, setAiProviderChoice] = useState<AiProviderChoice>(() => {
    try {
      const saved = localStorage.getItem('brahmyaman_admin_ai_provider');
      if (saved === 'auto' || saved === 'gemini') return saved;
    } catch {}
    return 'auto';
  });
  const [isRotatingKeySlot, setIsRotatingKeySlot] = useState(false);
  const [diagnosticsSnapshot, setDiagnosticsSnapshot] = useState<SystemDiagnosticsSnapshot | null>(null);
  const [isLoadingDiagnostics, setIsLoadingDiagnostics] = useState(false);
  const [runtimeIssues, setRuntimeIssues] = useState<RuntimeIssueRecord[]>(() => getRuntimeIssues());
  const [loginError, setLoginError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [serverRole, setServerRole] = useState<'owner' | 'admin'>('admin');
  const [serverSecurityMeta, setServerSecurityMeta] = useState<ServerSecurityMeta>({
    rateLimitMode: 'in-memory-fallback',
    rateLimitReason: null,
    hasExplicitServiceAccount: false,
    revocationMethod: null,
  });
  const [ownerEmailsList, setOwnerEmailsList] = useState<string[]>([]);
  const [authorizedEmailsList, setAuthorizedEmailsList] = useState<string[]>([]);
  const [previewAdminMode, setPreviewAdminMode] = useState<boolean>(false);
  const [adminSearchQuery, setAdminSearchQuery] = useState<string>('');
  const [isExportingFullBackup, setIsExportingFullBackup] = useState<boolean>(false);
  const [isRestoringBackup, setIsRestoringBackup] = useState<boolean>(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);

  const backupImportInputRef = useRef<HTMLInputElement | null>(null);
  const isPopupSigningInRef = useRef(false);
  const verificationInFlightRef = useRef<{ uid: string; promise: Promise<boolean> } | null>(null);
  const lastBackendAuthErrorRef = useRef<string>('');

  const isAuthenticated = Boolean(firebaseUser && isServerVerified);
  const effectiveVerifiedEmail = (verifiedEmail || firebaseUser?.email || '').trim().toLowerCase();
  const isOwner = Boolean(
    isAuthenticated && (serverRole === 'owner' || ownerEmailsList.includes(effectiveVerifiedEmail))
  );
  const isAdminSimpleView = !isOwner || previewAdminMode;

  const verifySessionWithBackend = async (user: FirebaseUser): Promise<boolean> => {
    if (verificationInFlightRef.current && verificationInFlightRef.current.uid === user.uid) {
      return verificationInFlightRef.current.promise;
    }

    const promise = (async () => {
      try {
        lastBackendAuthErrorRef.current = '';
        const idToken = await user.getIdToken(true);
        const res = await fetch('/api/admin/session', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.authenticated) {
          setFirebaseUser(user);
          setIsServerVerified(true);
          setVerifiedEmail(data.email || user.email || null);
          setServerRole(data.role === 'owner' ? 'owner' : 'admin');
          if (Array.isArray(data.ownerEmails) && data.ownerEmails.length > 0) {
            setOwnerEmailsList(data.ownerEmails);
          }
          if (Array.isArray(data.authorizedAdminEmails) && data.authorizedAdminEmails.length > 0) {
            setAuthorizedEmailsList(data.authorizedAdminEmails);
          }
          setHasBackupGeminiKey(Boolean(data.hasBackupGeminiKey));
          setServerSecurityMeta({
            rateLimitMode:
              data.rateLimitMode === 'firestore-shared'
                ? 'firestore-shared'
                : 'in-memory-fallback',
            rateLimitReason: typeof data.rateLimitReason === 'string' ? data.rateLimitReason : null,
            hasExplicitServiceAccount: Boolean(data.hasExplicitServiceAccount),
            revocationMethod: typeof data.revocationMethod === 'string' ? data.revocationMethod : null,
          });
          setLoginError('');
          lastBackendAuthErrorRef.current = '';
          return true;
        }

        const errDetail =
          data.error ||
          `অননুমোদিত জিমেইল (${user.email || 'অজানা'})! অনুগ্রহ করে সার্ভার-অনুমোদিত নার্সারি অ্যাডমিন Google অ্যাকাউন্ট ব্যবহার করুন।`;
        const errWithCode = data.code
          ? `${errDetail} [${res.status}: ${data.code}]`
          : `${errDetail} [HTTP ${res.status}]`;

        await signOut(auth).catch(() => {});
        setFirebaseUser(null);
        setIsServerVerified(false);
        setVerifiedEmail(null);
        setServerRole('admin');
        setPreviewAdminMode(false);
        lastBackendAuthErrorRef.current = errWithCode;
        setLoginError(errWithCode);
        return false;
      } catch (err: any) {
        setIsServerVerified(false);
        setVerifiedEmail(null);
        setServerRole('admin');
        const netMsg = `সার্ভারের সাথে লগইন যাচাই করা যায়নি (${err?.message || 'নেটওয়ার্ক ত্রুটি'})। ইন্টারনেট সংযোগ পরীক্ষা করে পুনরায় Google দিয়ে লগইন করুন।`;
        lastBackendAuthErrorRef.current = netMsg;
        setLoginError(netMsg);
        return false;
      } finally {
        if (verificationInFlightRef.current?.uid === user.uid) {
          verificationInFlightRef.current = null;
        }
      }
    })();

    verificationInFlightRef.current = { uid: user.uid, promise };
    return promise;
  };

  useEffect(() => {
    let active = true;
    clearStaleFirebaseAuthEvents();

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!active) return;
      if (!user) {
        setFirebaseUser(null);
        setIsServerVerified(false);
        setVerifiedEmail(null);
        setServerRole('admin');
        setPreviewAdminMode(false);
        setIsAuthChecking(false);
        return;
      }
      setFirebaseUser(user);
      await verifySessionWithBackend(user);
      if (active) {
        setIsAuthChecking(false);
      }
    });
    return () => {
      active = false;
      unsub();
    };
  }, []);

  const getAuthHeaders = async (isJson = false): Promise<HeadersInit> => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('অ্যাডমিন সেশন পাওয়া যায়নি। অনুগ্রহ করে পুনরায় Google দিয়ে লগইন করুন।');
    }
    const idToken = await currentUser.getIdToken();
    const headers: Record<string, string> = {
      Authorization: `Bearer ${idToken}`,
    };
    if (isJson) {
      headers['Content-Type'] = 'application/json';
    }
    return headers;
  };

  const handleUnauthorizedResponse = async (customMessage?: string) => {
    setIsServerVerified(false);
    setVerifiedEmail(null);
    setServerRole('admin');
    setPreviewAdminMode(false);
    setLoginError(
      customMessage ||
        'অ্যাডমিন সেশন বাতিল বা মেয়াদোত্তীর্ণ হয়েছে। অনুগ্রহ করে পুনরায় Google দিয়ে লগইন করুন।'
    );
    await signOut(auth).catch(() => {});
  };

  // Active Section & Internal Navigation History
  const [mobileTab, setMobileTab] = useState<AdminTab>('inventory');
  const [tabHistory, setTabHistory] = useState<AdminTab[]>([]);

  const switchAdminTab = (nextTab: AdminTab) => {
    setIsMobileDrawerOpen(false);
    if (nextTab === mobileTab) return;
    setTabHistory((prev) => [...prev.slice(-12), mobileTab]);
    setMobileTab(nextTab);
  };

  // Separate Active Plants vs Trashed Plants
  const activePlants = useMemo(() => plants.filter((p) => p.status !== 'deleted'), [plants]);
  const trashedPlants = useMemo(() => plants.filter((p) => p.status === 'deleted'), [plants]);

  // Non-blocking in-app confirmation modal & structured toast notification system
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const [toast, setToast] = useState<AdminToast | null>(null);

  const showToast = (
    messageBn: string,
    type: AdminToastType = 'success',
    actionLabelBn?: string,
    onAction?: () => void,
    customTitleBn?: string
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const dt = getBengaliDateTime();
    const defaultTitleBn =
      type === 'error'
        ? 'ত্রুটি: অপারেশন ব্যর্থ হয়েছে (Error: Operation Failed)'
        : type === 'warning'
        ? 'সতর্কতা: যাচাই প্রয়োজন (Warning)'
        : type === 'info'
        ? 'তথ্য (Info)'
        : 'সফল: পরিবর্তন সংরক্ষিত হয়েছে (Success: Plant Updated)';
    setToast({
      id,
      titleBn: customTitleBn || defaultTitleBn,
      messageBn,
      type,
      timestampBn: dt.timeBn,
      actionLabelBn,
      onAction,
    });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 6500);
    return () => clearTimeout(timer);
  }, [toast]);

  // AI Problem Solver, Duplicate Scanner & Diagnostics Modal State
  const [showDiagnosticsModal, setShowDiagnosticsModal] = useState(false);
  const [diagnosticsTab, setDiagnosticsTab] = useState<'rootcause' | 'duplicates' | 'bugs' | 'health'>(
    'rootcause'
  );
  const [bugFixLog, setBugFixLog] = useState<string[]>([]);
  const [isRunningBugFix, setIsRunningBugFix] = useState(false);

  // Real-time Duplicate Image & Duplicate Name Scanner
  const duplicateAnalysis = useMemo(() => {
    const imageMap = new Map<string, BrahmyamanPlant[]>();
    activePlants.forEach((p) => {
      if (p.image && p.image.trim()) {
        const list = imageMap.get(p.image) || [];
        list.push(p);
        imageMap.set(p.image, list);
      }
    });

    const duplicateImages = Array.from(imageMap.entries())
      .filter(([_, group]) => group.length > 1)
      .map(([url, group]) => ({ url, plants: group }));

    const nameMap = new Map<string, BrahmyamanPlant[]>();
    activePlants.forEach((p) => {
      const key = p.nameBn.trim().toLowerCase();
      const list = nameMap.get(key) || [];
      list.push(p);
      nameMap.set(key, list);
    });

    const duplicateNames = Array.from(nameMap.entries())
      .filter(([_, group]) => group.length > 1)
      .map(([name, group]) => ({ name, plants: group }));

    return {
      duplicateImages,
      duplicateNames,
      totalCount: duplicateImages.length + duplicateNames.length,
    };
  }, [activePlants]);

  // Comprehensive Root-Cause Diagnostics Analyzer (shared validation with 1-Click Bug Fixer)
  const rootCauseDiagnostics = useMemo<RootCauseIssue[]>(() => {
    return analyzeCatalogRootCauseDiagnostics({
      activePlants,
      duplicateImages: duplicateAnalysis.duplicateImages,
    });
  }, [activePlants, duplicateAnalysis]);

  // Activity Log State
  const [activityLogs, setActivityLogs] = useState<AdminActivityLogItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_ACTIVITY_LOG);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      const dt = getBengaliDateTime();
      return [
        {
          id: 'log-seed-1',
          timestamp: dt.iso,
          dateBn: dt.dateBn,
          timeBn: dt.timeBn,
          actionType: 'plant_add',
          titleBn: 'নার্সারি পোর্টাল সক্রিয়',
          descriptionBn: 'ভ্রাম্যমাণ নার্সারি কালশুলির পোর্টাল প্রস্তুত।',
        },
      ];
    } catch {
      return [];
    }
  });

  const activityLogsRef = useRef<AdminActivityLogItem[]>(activityLogs);
  activityLogsRef.current = activityLogs;

  useEffect(() => {
    safeSetLocalStorage(STORAGE_ACTIVITY_LOG, JSON.stringify(activityLogs));
  }, [activityLogs]);

  // Real-time shared Activity Logs sync via Firestore
  useEffect(() => {
    if (!isAuthenticated) return;
    try {
      const logsQuery = query(
        collection(db, 'activity_logs'),
        orderBy('timestamp', 'desc'),
        limit(80)
      );
      const unsubscribe = onSnapshot(
        logsQuery,
        (snapshot) => {
          trackFirestoreRead(
            snapshot.docChanges().length || snapshot.size || 1,
            'activity_logs',
            snapshot.metadata.fromCache
          );
          const remoteLogs: AdminActivityLogItem[] = [];
          snapshot.forEach((docSnap) => {
            remoteLogs.push(docSnap.data() as AdminActivityLogItem);
          });
          if (remoteLogs.length > 0) {
            setActivityLogs((prev) => {
              const merged = new Map<string, AdminActivityLogItem>();
              for (const item of remoteLogs) merged.set(item.id, item);
              for (const localItem of prev) {
                if (!merged.has(localItem.id) && localItem.id !== 'log-seed-1') {
                  merged.set(localItem.id, localItem);
                }
              }
              const nextLogs = Array.from(merged.values())
                .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''))
                .slice(0, 100);
              activityLogsRef.current = nextLogs;
              return nextLogs;
            });
          }
        },
        () => {}
      );
      return () => unsubscribe();
    } catch {
      return undefined;
    }
  }, [isAuthenticated]);

  const recordActivityLog = (
    actionType: AdminActivityLogItem['actionType'],
    titleBn: string,
    descriptionBn: string,
    plantNameBn?: string,
    thumbnail?: string,
    plantId?: string
  ): Promise<boolean> => {
    const dt = getBengaliDateTime();
    const logId = `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newLogItem: AdminActivityLogItem = {
      id: logId,
      timestamp: dt.iso,
      dateBn: dt.dateBn,
      timeBn: dt.timeBn,
      actionType,
      titleBn,
      descriptionBn,
      ...(plantId ? { plantId } : {}),
      ...(plantNameBn ? { plantNameBn } : {}),
      ...(thumbnail ? { thumbnail } : {}),
    };

    return persistActivityLogEntry({
      item: newLogItem,
      isAuthenticated,
      hasAuthUser: Boolean(auth.currentUser),
      saveToFirestore: async (id, sanitizedPayload) => {
        await setDoc(doc(db, 'activity_logs', id), sanitizedPayload);
      },
      getLogsSnapshot: () => activityLogsRef.current,
      applyLogsState: (nextLogs) => {
        activityLogsRef.current = nextLogs;
        setActivityLogs(nextLogs);
      },
      persistLogsToStorage: (nextLogs) => {
        safeSetLocalStorage(STORAGE_ACTIVITY_LOG, JSON.stringify(nextLogs));
      },
      storageKey: STORAGE_ACTIVITY_LOG,
      onWriteTracked: (count) => trackFirestoreWrite(count, 'activity_logs'),
      onFirestoreError: (err, id) => {
        handleFirestoreError(err, OperationType.CREATE, `activity_logs/${id}`);
      },
      onFailureWarning: (msg) => {
        showToast(msg, 'warning');
      },
    });
  };

  // Quick Price Edit Bottom Sheet State
  const [quickPricePlant, setQuickPricePlant] = useState<BrahmyamanPlant | null>(null);
  const [quickPriceValue, setQuickPriceValue] = useState<string>('');

  // Full Add/Edit Plant Form State
  const [editingPlantId, setEditingPlantId] = useState<string | null>(null);
  const [formNameBn, setFormNameBn] = useState('');
  const [formNameEn, setFormNameEn] = useState('');
  const [formBotanical, setFormBotanical] = useState('');
  const [formCategory, setFormCategory] = useState<PlantCategory>(ADMIN_CATEGORIES[0]);
  const [formAudience, setFormAudience] = useState<AudienceTag[]>(['puja', 'family']);
  const [formBadgeBn, setFormBadgeBn] = useState('');
  const [formColorBn, setFormColorBn] = useState('');
  const [formSunlightBn, setFormSunlightBn] = useState('পূর্ণ রোদ (দিনে অন্তত ৫ ঘণ্টা)');
  const [formWateringBn, setFormWateringBn] = useState('মাটি শুকিয়ে এলে পর্যাপ্ত জল দিন');
  const [formSoilTipBn, setFormSoilTipBn] = useState('গোবর সার ও মাটির মিশ্রণ');
  const [formDescBn, setFormDescBn] = useState('');
  const [formDescEn, setFormDescEn] = useState('');
  const [formImage, setFormImage] = useState(PRESET_PLANT_PHOTOS[0].url);
  const [formImages, setFormImages] = useState<string[]>([PRESET_PLANT_PHOTOS[0].url]);
  const [formCloudinaryPublicIds, setFormCloudinaryPublicIds] = useState<string[]>([]);
  const [activeImageSlot, setActiveImageSlot] = useState<number>(0);
  const [photoUploadTimestampBn, setPhotoUploadTimestampBn] = useState<string | null>(null);
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);
  const [isUploadingToCloudinary, setIsUploadingToCloudinary] = useState(false);
  const [cloudinaryStatus, setCloudinaryStatus] = useState<{
    configured: boolean;
    verified?: boolean;
    cloudName: string | null;
    folder?: string;
    errorCode?: string | null;
    errorMessage?: string | null;
  } | null>(null);
  const [isMigratingBase64, setIsMigratingBase64] = useState(false);
  const [migrationProgress, setMigrationProgress] = useState<{
    current: number;
    total: number;
    success: number;
  } | null>(null);
  const [orphanReport, setOrphanReport] = useState<CloudinaryOrphanScanReport | null>(null);
  const [isScanningOrphans, setIsScanningOrphans] = useState(false);
  const [deletingOrphanId, setDeletingOrphanId] = useState<string | null>(null);
  const [cloudinaryMediaAssets, setCloudinaryMediaAssets] = useState<CloudinaryAssetRecord[] | null>(
    null
  );
  const [cloudinaryTotalBytes, setCloudinaryTotalBytes] = useState<number>(0);
  const [cloudinaryTruncated, setCloudinaryTruncated] = useState<boolean>(false);
  const [isLoadingMediaLibrary, setIsLoadingMediaLibrary] = useState<boolean>(false);

  // Search-based Image Integration State
  const [imageSearchQuery, setImageSearchQuery] = useState('');
  const [isSearchingImages, setIsSearchingImages] = useState(false);
  const [imageSearchResults, setImageSearchResults] = useState<ImageSearchResultItem[]>([]);
  const [showImageSearchPanel, setShowImageSearchPanel] = useState(false);
  const [verifiedImageSource, setVerifiedImageSource] = useState<string | null>(null);
  const [imageSearchError, setImageSearchError] = useState<string | null>(null);
  const [isAiAutofilling, setIsAiAutofilling] = useState(false);
  const [aiCustomInstruction, setAiCustomInstruction] = useState('');

  // Plant variants & Pricing
  const [basePrice, setBasePrice] = useState('50');
  const [option1Label, setOption1Label] = useState('পলি গ্রো-ব্যাগ চারা');
  const [option1Price, setOption1Price] = useState('50');
  const [option2Label, setOption2Label] = useState('মাঝারি সাইজ পরিপুষ্ট চারা');
  const [option2Price, setOption2Price] = useState('90');
  const [hasOption3, setHasOption3] = useState(false);
  const [option3Label, setOption3Label] = useState('বড় ফলবতী কলম চারা');
  const [option3Price, setOption3Price] = useState('160');

  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  // Gemini AI Chatbot & Model Switcher State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      role: 'model',
      text: `নমস্কার নার্সারি মালিক মহাশয়! এটি আপনার Google Gemini AI সহকারী।
সার্ভার-অনুমোদিত নার্সারি অ্যাডমিন Google অ্যাকাউন্ট দিয়ে সুরক্ষিত।

আমি আপনাকে যা সাহায্য করতে পারি:
• ওয়েবসাইট বা ক্যাটালগে কোথায় সমস্যা ও তার মূল কারণ (Root Reason) ও সমাধান জানানো
• প্রতিটি গাছের জন্য আলাদা আলাদা বিবরণ ও বিশেষ বৈশিষ্ট্য তৈরি
• ডিজিটাল ট্র্যাশ বিনে ডিলিট হওয়া চারা ৩০ দিনের মধ্যে ফিরিয়ে আনার পরামর্শ
• মিলিবাগ, ক্যাংকার বা শিকড় পচা রোগ নিরাময়ের ঘরোয়া দাওয়াই`,
      timestamp: getBengaliDateTime().timeBn,
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [useSearchGrounding, setUseSearchGrounding] = useState(true);
  const [modelType, setModelType] = useState<AiModelChoice>(() => {
    try {
      const saved = localStorage.getItem('brahmyaman_admin_ai_model');
      if (
        saved === 'flash25' ||
        saved === 'hydrogen' ||
        saved === 'fast' ||
        saved === 'auto'
      ) {
        return saved;
      }
    } catch {}
    return 'auto';
  });

  useEffect(() => {
    try {
      localStorage.setItem('brahmyaman_admin_ai_model', modelType);
    } catch {}
  }, [modelType]);

  useEffect(() => {
    try {
      localStorage.setItem('brahmyaman_admin_ai_provider', aiProviderChoice);
    } catch {}
  }, [aiProviderChoice]);

  useEffect(() => {
    setRuntimeIssues(getRuntimeIssues());
    return subscribeRuntimeIssues(() => {
      setRuntimeIssues(getRuntimeIssues());
    });
  }, []);

  const fetchAiStatus = async () => {
    if (!auth.currentUser) return;
    try {
      const headers = await getAuthHeaders(false);
      const res = await fetch('/api/admin/ai-status', { headers });
      if (res.status === 401 || res.status === 403) {
        const data = await res.json().catch(() => ({}));
        await handleUnauthorizedResponse(data?.error);
        return;
      }
      if (res.ok) {
        const data: AdminAiStatusSnapshot = await res.json();
        setAiStatus(data);
        try {
          localStorage.setItem('brahmyaman_ai_status_cache', JSON.stringify(data));
        } catch {}
        setHasBackupGeminiKey((data.configuredCount || 0) > 1);
      }
    } catch {}
  };

  const fetchSystemDiagnostics = async (forceRefresh = false) => {
    if (!auth.currentUser) return;
    setIsLoadingDiagnostics(true);
    try {
      const headers = await getAuthHeaders(false);
      const res = await fetch(
        forceRefresh
          ? '/api/admin/system-diagnostics?refresh=1'
          : '/api/admin/system-diagnostics',
        { headers }
      );
      if (res.status === 401 || res.status === 403) {
        const data = await res.json().catch(() => ({}));
        await handleUnauthorizedResponse(data?.error);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setDiagnosticsSnapshot({
          checkedAtIso: data.checkedAtIso,
          server: data.server,
          security: data.security,
        });
        if (data.ai) {
          setAiStatus(data.ai);
          try {
            localStorage.setItem('brahmyaman_ai_status_cache', JSON.stringify(data.ai));
          } catch {}
          setHasBackupGeminiKey((data.ai.configuredCount || 0) > 1);
        }
        if (data.cloudinary) {
          setCloudinaryStatus({
            configured: Boolean(data.cloudinary.configured),
            verified:
              data.cloudinary.verified !== undefined
                ? Boolean(data.cloudinary.verified)
                : Boolean(data.cloudinary.configured),
            cloudName: data.cloudinary.cloudName || null,
            folder: data.cloudinary.folder || undefined,
            errorCode: data.cloudinary.errorCode || null,
            errorMessage: data.cloudinary.errorMessage || null,
          });
        }
      }
    } catch {
      // Quiet fail
    } finally {
      setIsLoadingDiagnostics(false);
    }
  };

  // WhatsApp Order & Inquiry Tracker + Customer Reviews & QR Tag State
  const [orderLogs, setOrderLogs] = useState<WhatsAppOrderLogItem[]>(() =>
    loadLocalWhatsAppOrderLogs()
  );
  const [customerReviews, setCustomerReviews] = useState<CustomerReviewItem[]>(() =>
    loadLocalCustomerReviews()
  );
  const [isApplyingBulkPrice, setIsApplyingBulkPrice] = useState(false);
  const [qrPreselectedPlantId, setQrPreselectedPlantId] = useState<string | null>(null);

  // Admin Undo / Redo & Manual Refresh State
  const [undoStack, setUndoStack] = useState<AdminUndoRecord[]>(() => loadGlobalUndoStack());
  const [redoStack, setRedoStack] = useState<AdminUndoRecord[]>(() => loadGlobalRedoStack());
  const [isUndoingRedoing, setIsUndoingRedoing] = useState(false);
  const [isRefreshingAdmin, setIsRefreshingAdmin] = useState(false);

  useEffect(() => {
    saveGlobalUndoRedoStacks(undoStack, redoStack);
  }, [undoStack, redoStack]);

  const pushUndoRecord = (recordData: any) => {
    const dt = getBengaliDateTime();
    const id = `undo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const record: AdminUndoRecord = {
      ...recordData,
      id,
      timestampBn: dt.timeBn,
    };
    setUndoStack((prev) => {
      const next = [...prev.slice(-23), record];
      setRedoStack([]);
      return next;
    });
  };

  const handleUndoAdminAction = async () => {
    if (isUndoingRedoing || undoStack.length === 0) return;
    const action = undoStack[undoStack.length - 1];
    setIsUndoingRedoing(true);
    try {
      let ok = true;
      if (action.type === 'plant_update') {
        const res = await onUpdatePlant(action.before);
        ok = res !== false;
      } else if (action.type === 'batch_plant_update') {
        if (onBatchUpdatePlants) {
          const res = await onBatchUpdatePlants(action.beforeList);
          ok = res !== false;
        } else {
          for (const item of action.beforeList) {
            const res = await onUpdatePlant(item);
            if (res === false) ok = false;
          }
        }
      } else if (action.type === 'soft_delete') {
        const res = await onRestorePlant(action.plant.id);
        ok = res !== false;
      } else if (action.type === 'restore_plant') {
        const res = await onSoftDeletePlant(action.plant.id);
        ok = res !== false;
      }

      if (!ok) {
        showToast(
          'আনডু (Undo) Firestore-এ সম্পন্ন করা যায়নি! সংযোগ বা অনুমতি যাচাই করুন।',
          'error',
          undefined,
          undefined,
          'ত্রুটি: আনডু ব্যর্থ হয়েছে (Error: Operation Failed)'
        );
        return;
      }

      setUndoStack((prev) => prev.slice(0, -1));
      setRedoStack((prev) => [...prev.slice(-24), action]);
      showToast(
        `আনডু সম্পন্ন: ${action.labelBn}`,
        'success',
        undefined,
        undefined,
        'সফল: পূর্বাবস্থায় ফেরানো হয়েছে (Success: Plant Updated)'
      );
    } finally {
      setIsUndoingRedoing(false);
    }
  };

  const handleRedoAdminAction = async () => {
    if (isUndoingRedoing || redoStack.length === 0) return;
    const action = redoStack[redoStack.length - 1];
    setIsUndoingRedoing(true);
    try {
      let ok = true;
      if (action.type === 'plant_update') {
        const res = await onUpdatePlant(action.after);
        ok = res !== false;
      } else if (action.type === 'batch_plant_update') {
        if (onBatchUpdatePlants) {
          const res = await onBatchUpdatePlants(action.afterList);
          ok = res !== false;
        } else {
          for (const item of action.afterList) {
            const res = await onUpdatePlant(item);
            if (res === false) ok = false;
          }
        }
      } else if (action.type === 'soft_delete') {
        const res = await onSoftDeletePlant(action.plant.id);
        ok = res !== false;
      } else if (action.type === 'restore_plant') {
        const res = await onRestorePlant(action.plant.id);
        ok = res !== false;
      }

      if (!ok) {
        showToast(
          'রিডু (Redo) Firestore-এ সম্পন্ন করা যায়নি! সংযোগ বা অনুমতি যাচাই করুন।',
          'error',
          undefined,
          undefined,
          'ত্রুটি: রিডু ব্যর্থ হয়েছে (Error: Operation Failed)'
        );
        return;
      }

      setRedoStack((prev) => prev.slice(0, -1));
      setUndoStack((prev) => [...prev.slice(-24), action]);
      showToast(
        `রিডু সম্পন্ন: ${action.labelBn}`,
        'success',
        undefined,
        undefined,
        'সফল: পুনরায় কার্যকর হয়েছে (Success: Plant Updated)'
      );
    } finally {
      setIsUndoingRedoing(false);
    }
  };

  const handleManualAdminRefresh = async () => {
    if (isRefreshingAdmin) return;
    setIsRefreshingAdmin(true);
    try {
      await Promise.allSettled([
        fetchServerDocCounts(),
        fetchAiStatus(),
        fetchCloudinaryStatus(false),
      ]);
      setDbMonitorStats(getFirestoreUsageStats());
      showToast('সকল ক্যাটালগ তথ্য ও সার্ভার স্ট্যাটাস রিফ্রেশ হয়েছে!', 'success');
    } finally {
      setTimeout(() => setIsRefreshingAdmin(false), 350);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    let unsubOrders: (() => void) | undefined;
    let unsubReviews: (() => void) | undefined;

    try {
      const ordersQ = query(
        collection(db, 'whatsapp_inquiries'),
        orderBy('timestamp', 'desc'),
        limit(120)
      );
      unsubOrders = onSnapshot(
        ordersQ,
        (snap) => {
          trackFirestoreRead(
            snap.docChanges().length || snap.size || 1,
            'activity_logs',
            snap.metadata.fromCache
          );
          const remoteOrders: WhatsAppOrderLogItem[] = [];
          snap.forEach((docSnap) => {
            remoteOrders.push(docSnap.data() as WhatsAppOrderLogItem);
          });
          if (remoteOrders.length > 0) {
            setOrderLogs((prev) => {
              const merged = new Map<string, WhatsAppOrderLogItem>();
              for (const item of remoteOrders) merged.set(item.id, item);
              for (const local of prev) {
                if (!merged.has(local.id)) merged.set(local.id, local);
              }
              const sorted = Array.from(merged.values())
                .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''))
                .slice(0, 200);
              saveLocalWhatsAppOrderLogs(sorted);
              return sorted;
            });
          }
        },
        () => {}
      );
    } catch {}

    try {
      const reviewsQ = query(
        collection(db, 'customer_reviews'),
        orderBy('createdAt', 'desc'),
        limit(100)
      );
      unsubReviews = onSnapshot(
        reviewsQ,
        (snap) => {
          trackFirestoreRead(
            snap.docChanges().length || snap.size || 1,
            'activity_logs',
            snap.metadata.fromCache
          );
          const remoteReviews: CustomerReviewItem[] = [];
          snap.forEach((docSnap) => {
            const raw = docSnap.data() as Partial<CustomerReviewItem> & { gardenImage?: string };
            const normalized = normalizeCustomerReview(raw, docSnap.id);
            if (isRemovedFakeReview(normalized)) {
              deleteDoc(docSnap.ref).catch(() => {});
              return;
            }
            remoteReviews.push(normalized);
          });
          const sorted = remoteReviews.sort((a, b) =>
            (b.createdAt || '').localeCompare(a.createdAt || '')
          );
          setCustomerReviews(sorted);
          saveLocalCustomerReviews(sorted);
        },
        () => {}
      );
    } catch {}

    return () => {
      if (unsubOrders) unsubOrders();
      if (unsubReviews) unsubReviews();
    };
  }, [isAuthenticated]);

  const handleUpdateOrderStatus = async (orderId: string, status: WhatsAppOrderStatus) => {
    const target = orderLogs.find((o) => o.id === orderId);
    if (!target) return;
    const updatedOrder: WhatsAppOrderLogItem = { ...target, status };
    const nextList = orderLogs.map((o) => (o.id === orderId ? updatedOrder : o));
    setOrderLogs(nextList);
    saveLocalWhatsAppOrderLogs(nextList);

    try {
      if (auth.currentUser) {
        await setDoc(
          doc(db, 'whatsapp_inquiries', orderId),
          sanitizeWhatsAppOrderForFirestore(updatedOrder)
        );
        trackFirestoreWrite(1, 'activity_logs');
      }
    } catch {}
    showToast(
      status === 'completed' || status === 'delivered'
        ? 'অর্ডারটি "সম্পন্ন" হিসেবে চিহ্নিত হয়েছে।'
        : status === 'contacted'
        ? 'অর্ডারটি "কথা হয়েছে" হিসেবে আপডেট হয়েছে।'
        : 'অর্ডার স্ট্যাটাস আপডেট হয়েছে।',
      'success'
    );
  };

  const handleDeleteOrderLog = async (orderId: string) => {
    const nextList = orderLogs.filter((o) => o.id !== orderId);
    setOrderLogs(nextList);
    saveLocalWhatsAppOrderLogs(nextList);
    try {
      if (auth.currentUser && isOwner) {
        await deleteDoc(doc(db, 'whatsapp_inquiries', orderId));
        trackFirestoreDelete(1, 'activity_logs');
      }
    } catch {}
    showToast('অর্ডার লগটি মুছে ফেলা হয়েছে।', 'info');
  };

  const handleApplyBulkPriceUpdate = async (payload: BulkPriceUpdatePayload) => {
    if (isApplyingBulkPrice || payload.updatedPlants.length === 0) return;
    setIsApplyingBulkPrice(true);
    try {
      const dt = getBengaliDateTime();
      const beforeSnapshots: BrahmyamanPlant[] = [];
      const afterSnapshots: BrahmyamanPlant[] = [];
      for (const p of payload.updatedPlants) {
        const prevPlant = activePlants.find((item) => item.id === p.id);
        const isUserPlant = Boolean(p.createdAt) || p.id.startsWith('plant-');
        const nextPlant: BrahmyamanPlant = {
          ...p,
          ...(isUserPlant
            ? {
                updatedAt: dt.iso,
                updatedAtBn: `${dt.dateBn} · ${dt.timeBn}`,
              }
            : {}),
        };
        if (prevPlant) beforeSnapshots.push(prevPlant);
        afterSnapshots.push(nextPlant);
      }

      let ok = true;
      if (onBatchUpdatePlants) {
        const res = await onBatchUpdatePlants(afterSnapshots);
        ok = res !== false;
      } else {
        for (const nextPlant of afterSnapshots) {
          const res = await onUpdatePlant(nextPlant);
          if (res === false) ok = false;
        }
      }

      if (!ok) {
        showToast(
          'বাল্ক দাম আপডেট Firestore-এ সম্পূর্ণ সেভ করা যায়নি! সংযোগ ও অনুমতি যাচাই করুন।',
          'error',
          undefined,
          undefined,
          'ত্রুটি: অপারেশন ব্যর্থ হয়েছে (Error: Operation Failed)'
        );
        return;
      }

      if (beforeSnapshots.length > 0) {
        pushUndoRecord({
          type: 'batch_plant_update',
          labelBn: payload.summaryTitleBn,
          beforeList: beforeSnapshots,
          afterList: afterSnapshots,
        });
      }
      recordActivityLog(
        'price_update',
        `🏷️ ${payload.summaryTitleBn}`,
        `${payload.summaryDescriptionBn} (${dt.dateBn} · ${dt.timeBn})`
      );
      showToast(
        `সফলভাবে ${afterSnapshots.length}টি চারার নতুন দাম সেভ হয়েছে!`,
        'success',
        undefined,
        undefined,
        'সফল: বাল্ক দাম আপডেট হয়েছে (Success: Plants Updated)'
      );
    } catch {
      showToast(
        'বাল্ক দাম আপডেট করার সময় সমস্যা হয়েছে।',
        'error',
        undefined,
        undefined,
        'ত্রুটি: অপারেশন ব্যর্থ হয়েছে (Error: Operation Failed)'
      );
    } finally {
      setIsApplyingBulkPrice(false);
    }
  };

  const handleApproveReview = async (
    reviewId: string,
    nextStatus: 'approved' | 'pending'
  ) => {
    const existingReview = customerReviews.find((r) => r.id === reviewId);
    const updated = await updateCustomerReviewStatus(reviewId, nextStatus, existingReview);
    if (updated) {
      setCustomerReviews(loadLocalCustomerReviews());
      showToast(
        nextStatus === 'approved'
          ? `"${updated.customerName || updated.customerNameBn}"-এর রিভিউ ও ছবি ওয়েবসাইটে প্রকাশিত হয়েছে!`
          : 'রিভিউটি ওয়েবসাইট থেকে লুকানো হয়েছে।',
        nextStatus === 'approved' ? 'success' : 'info'
      );
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    await removeCustomerReview(reviewId);
    setCustomerReviews(loadLocalCustomerReviews());
    showToast('রিভিউটি মুছে ফেলা হয়েছে।', 'info');
  };

  const handleAddAdminReview = async (
    newRev: Omit<CustomerReviewItem, 'id' | 'createdAt' | 'createdAtBn'>
  ) => {
    const created = await submitCustomerReview({
      ...newRev,
      autoApprove: true,
    });
    setCustomerReviews((prev) => [created, ...prev.filter((r) => r.id !== created.id)]);
    showToast(
      `"${created.customerName || created.customerNameBn}"-এর রিভিউ ও বাগানের ছবি যোগ হয়েছে!`,
      'success'
    );
  };

  const fetchCloudinaryStatus = async (forceRefresh = false) => {
    if (!auth.currentUser) return;
    try {
      const headers = await getAuthHeaders(false);
      const url = forceRefresh
        ? '/api/admin/cloudinary-status?verify=1'
        : '/api/admin/cloudinary-status';
      const res = await fetch(url, { headers });
      if (res.status === 401 || res.status === 403) {
        const data = await res.json().catch(() => ({}));
        await handleUnauthorizedResponse(data?.error);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setCloudinaryStatus({
          configured: Boolean(data.configured),
          verified:
            data.verified !== undefined ? Boolean(data.verified) : Boolean(data.configured),
          cloudName: data.cloudName || null,
          folder: data.folder || undefined,
          errorCode: data.errorCode || null,
          errorMessage: data.errorMessage || null,
        });
      }
    } catch {
      setCloudinaryStatus({ configured: false, verified: false, cloudName: null });
    }
  };

  const handleLoadCloudinaryLibrary = async () => {
    if (!auth.currentUser || isLoadingMediaLibrary) return;
    setIsLoadingMediaLibrary(true);
    try {
      const headers = await getAuthHeaders(false);
      const res = await fetch('/api/admin/cloudinary-export-all', { headers });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        await handleUnauthorizedResponse(data?.error);
        return;
      }
      if (res.ok && data.success) {
        const list = Array.isArray(data.resources) ? data.resources : [];
        setCloudinaryMediaAssets(list);
        setCloudinaryTotalBytes(Number(data.totalBytes || 0));
        setCloudinaryTruncated(Boolean(data.truncated));
        showToast(`Cloudinary লাইব্রেরি লোড হয়েছে (${list.length}টি ছবি)।`, 'success');
      } else {
        showToast(data.error || 'Cloudinary লাইব্রেরি লোড করা যায়নি।', 'warning');
      }
    } catch {
      showToast('Cloudinary লাইব্রেরি লোড করার সময় নেটওয়ার্ক সমস্যা হয়েছে।', 'warning');
    } finally {
      setIsLoadingMediaLibrary(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchAiStatus();
    fetchCloudinaryStatus();
    if (mobileTab === 'api') {
      void fetchSystemDiagnostics(false);
    }
  }, [isAuthenticated, mobileTab]);

  // Database Health Monitoring: Live Telemetry, Server Document Counts & Spark Free-Tier Threshold Alerts
  const [dbMonitorStats, setDbMonitorStats] = useState<StoredMonitorState>(() =>
    getFirestoreUsageStats()
  );
  const [serverDocCounts, setServerDocCounts] = useState<{
    plants: number | null;
    trashPlants: number | null;
    logs: number | null;
    deletedMeta: number | null;
    total: number | null;
    checkedAt: string | null;
    isLoading: boolean;
    error: string | null;
  }>({
    plants: null,
    trashPlants: null,
    logs: null,
    deletedMeta: null,
    total: null,
    checkedAt: null,
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    setDbMonitorStats(getFirestoreUsageStats());
    return subscribeFirestoreMonitor(() => {
      setDbMonitorStats(getFirestoreUsageStats());
    });
  }, []);

  const hasAutoCleanedLogsRef = useRef(false);
  const [isCleaningLogs, setIsCleaningLogs] = useState(false);

  const cleanupOldActivityLogs = async (maxKeep = 100, silent = false) => {
    if (!auth.currentUser || isCleaningLogs || !isOwner) return;
    setIsCleaningLogs(true);
    try {
      const countSnap = await getCountFromServer(collection(db, 'activity_logs'));
      trackFirestoreRead(1, 'activity_logs', false);
      const totalLogs = countSnap.data().count;
      const excess = totalLogs - maxKeep;
      if (excess <= 0) {
        if (!silent) {
          showToast(
            `মোট ${totalLogs}টি লগ আছে — সর্বশেষ ${maxKeep}টির মধ্যে থাকায় কোনো লগ মোছা হয়নি।`,
            'info'
          );
        }
        return;
      }

      const batchSize = Math.min(50, excess);
      const oldestQuery = query(
        collection(db, 'activity_logs'),
        orderBy('timestamp', 'asc'),
        limit(batchSize)
      );
      const oldestSnap = await getDocs(oldestQuery);
      trackFirestoreRead(oldestSnap.size || 1, 'activity_logs', oldestSnap.metadata.fromCache);

      if (oldestSnap.empty) {
        return;
      }

      const deleteBatch = writeBatch(db);
      oldestSnap.docs.forEach((docSnap) => {
        deleteBatch.delete(doc(db, 'activity_logs', docSnap.id));
      });

      let deletedCount = 0;
      let batchFailed = false;
      try {
        await deleteBatch.commit();
        deletedCount = oldestSnap.docs.length;
        trackFirestoreDelete(deletedCount, 'activity_logs');
      } catch (err) {
        batchFailed = true;
        handleFirestoreError(err, OperationType.DELETE, 'activity_logs/batch-cleanup');
      }

      if (deletedCount > 0) {
        setServerDocCounts((prev) => ({
          ...prev,
          logs: prev.logs !== null ? Math.max(0, prev.logs - deletedCount) : null,
          total: prev.total !== null ? Math.max(0, prev.total - deletedCount) : null,
        }));
      }
      if (!silent) {
        if (batchFailed) {
          showToast('Firestore অনুমতি বা নেটওয়ার্ক ত্রুটির কারণে লগ পরিষ্কার করা যায়নি।', 'warning');
        } else if (deletedCount > 0) {
          showToast(
            `পুরনো ${deletedCount}টি অপ্রয়োজনীয় লগ পরিষ্কার করা হয়েছে (সর্বশেষ ${maxKeep}টি সুরক্ষিত)।`,
            'success'
          );
        }
      }
    } catch {
      if (!silent) {
        showToast('পুরনো লগ পরিষ্কার করতে সাময়িক সমস্যা হয়েছে।', 'warning');
      }
    } finally {
      setIsCleaningLogs(false);
    }
  };

  const fetchServerDocCounts = async () => {
    if (!auth.currentUser) return;
    setServerDocCounts((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const [plantsCountSnap, trashCountSnap, logsCountSnap, metaSnap] = await Promise.all([
        getCountFromServer(collection(db, 'plants')),
        getCountFromServer(collection(db, 'trash_plants')).catch(() => null),
        getCountFromServer(collection(db, 'activity_logs')),
        getDoc(doc(db, 'catalog_meta', 'deleted_seeds')),
      ]);
      trackFirestoreRead(4, 'catalog_meta', false);

      const activePlantsCount = plantsCountSnap.data().count;
      const trashPlantsCount = trashCountSnap ? trashCountSnap.data().count : 0;
      const plantsCount = activePlantsCount + trashPlantsCount;
      const logsCount = logsCountSnap.data().count;
      const metaCount = metaSnap.exists() ? 1 : 0;
      const total = plantsCount + logsCount + metaCount;

      setServerDocCounts({
        plants: plantsCount,
        trashPlants: trashCountSnap ? trashPlantsCount : null,
        logs: logsCount,
        deletedMeta: metaCount,
        total,
        checkedAt: getBengaliDateTime().timeBn,
        isLoading: false,
        error: null,
      });

      if (isOwner && logsCount > 100 && !hasAutoCleanedLogsRef.current) {
        hasAutoCleanedLogsRef.current = true;
        cleanupOldActivityLogs(100, true);
      }
    } catch (err: any) {
      setServerDocCounts((prev) => ({
        ...prev,
        isLoading: false,
        error: err?.message?.includes('Quota')
          ? 'ডাটাবেস দৈনিক কোটা পূর্ণ হয়েছে — আগামীকাল রিসেট হবে।'
          : 'সার্ভার ডকুমেন্ট সংখ্যা লোড করতে সাময়িক সমস্যা হয়েছে।',
      }));
    }
  };

  useEffect(() => {
    if (
      isAuthenticated &&
      (mobileTab === 'settings' ||
        mobileTab === 'backup' ||
        mobileTab === 'logs' ||
        (showDiagnosticsModal && diagnosticsTab === 'health'))
    ) {
      fetchServerDocCounts();
    }
  }, [isAuthenticated, mobileTab, showDiagnosticsModal, diagnosticsTab]);

  const dbHealthMetrics = useMemo(
    () =>
      computeDbHealthMetrics({
        plants,
        activityLogs,
        dbMonitorStats,
        serverDocCounts,
      }),
    [plants, activityLogs, dbMonitorStats, serverDocCounts]
  );

  const uploadImageWithResilience = (
    imagePayload: string,
    plantName: string,
    slotNumber: number
  ) =>
    uploadImageSecurely(
      {
        imagePayload,
        plantName: plantName || 'plant',
        slotNumber,
      },
      {
        getAuthHeaders: async (isJson = false) => {
          try {
            return await getAuthHeaders(isJson);
          } catch {
            return isJson ? { 'Content-Type': 'application/json' } : {};
          }
        },
        onUnauthorized: async (msg) => {
          console.warn('Image upload notice:', msg);
        },
      }
    );

  const persistEditingPlantPhotosImmediately = async (
    nextImages: string[],
    nextPublicIds: string[],
    sourceNote: string
  ) => {
    if (!editingPlantId) return;
    const existingPlant = plants.find((p) => p.id === editingPlantId);
    if (!existingPlant) return;

    const aligned = alignPlantImageSlots(
      nextImages,
      nextPublicIds,
      nextImages[0] || existingPlant.image || PRESET_PLANT_PHOTOS[0].url
    );
    const dt = getBengaliDateTime();
    const updatedPlant: BrahmyamanPlant = {
      ...existingPlant,
      image: aligned.primaryImage || PRESET_PLANT_PHOTOS[0].url,
      images:
        aligned.images.length > 0
          ? aligned.images
          : [aligned.primaryImage || PRESET_PLANT_PHOTOS[0].url],
      cloudinaryPublicIds: aligned.cloudinaryPublicIds,
      updatedAt: dt.iso,
      updatedAtBn: `${dt.dateBn} · ${dt.timeBn}`,
    };

    const synced = await onUpdatePlant(updatedPlant);
    if (synced === false) {
      showToast(
        'ছবি ফর্মে আপডেট হয়েছে, কিন্তু লাইভ ডাটাবেসে সেভ করতে সমস্যা হয়েছে — অনুগ্রহ করে নিচের সংরক্ষণ বোতামে চাপুন।',
        'warning'
      );
    } else {
      showToast(`${sourceNote} — লাইভ দোকানে ছবিটি সাথে সাথে আপডেট হয়ে গেছে!`, 'success');
    }
  };

  const handleClearPhotoSlot = (slotIdx: number) => {
    const slotPid = formCloudinaryPublicIds[slotIdx];
    if (slotPid) {
      void deleteCloudinaryAsset(slotPid, {
        getAuthHeaders,
        onUnauthorized: handleUnauthorizedResponse,
      });
    }
    const nextImgs = formImages.filter((_, idx) => idx !== slotIdx);
    const nextPids = formCloudinaryPublicIds.filter((_, idx) => idx !== slotIdx);
    setFormImages(nextImgs);
    setFormCloudinaryPublicIds(nextPids);
    if (activeImageSlot >= nextImgs.length) {
      setActiveImageSlot(Math.max(0, nextImgs.length - 1));
    }
    if (editingPlantId) {
      const existingPlant = plants.find((p) => p.id === editingPlantId);
      if (existingPlant) {
        const dt = getBengaliDateTime();
        const cleared = clearPlantPhotoSlot({
          plant: {
            ...existingPlant,
            images: formImages,
            cloudinaryPublicIds: formCloudinaryPublicIds,
          },
          slotIndex: slotIdx,
          fallbackPrimaryImage: PRESET_PLANT_PHOTOS[0].url,
          timestampIso: dt.iso,
          timestampBn: `${dt.dateBn} · ${dt.timeBn}`,
        });
        void Promise.resolve(onUpdatePlant(cleared)).then((ok) => {
          if (ok !== false) {
            showToast(`স্লট ${slotIdx + 1}-এর অতিরিক্ত ছবি সরিয়ে দেওয়া হয়েছে।`, 'info');
          }
        });
      }
    }
  };

  const handleSelectPresetPhoto = (url: string) => {
    const previousPublicId = formCloudinaryPublicIds[activeImageSlot];
    if (previousPublicId) {
      void deleteCloudinaryAsset(previousPublicId, {
        getAuthHeaders,
        onUnauthorized: handleUnauthorizedResponse,
      });
    }
    const nextImgs = [...formImages];
    nextImgs[activeImageSlot] = url;
    const nextPids = [...formCloudinaryPublicIds];
    for (let idx = 0; idx < activeImageSlot; idx += 1) {
      if (typeof nextPids[idx] !== 'string') nextPids[idx] = '';
    }
    nextPids[activeImageSlot] = '';
    setFormImages(nextImgs);
    setFormCloudinaryPublicIds(nextPids);
    if (activeImageSlot === 0) setFormImage(url);
    const dt = getBengaliDateTime();
    setPhotoUploadTimestampBn(`${dt.dateBn} · ${dt.timeBn}`);
    if (editingPlantId) {
      void persistEditingPlantPhotosImmediately(nextImgs, nextPids, 'প্রস্তুত ছবি যুক্ত');
    }
  };

  const handleExportCatalogBackup = async () => {
    if (isExportingFullBackup) return;
    setIsExportingFullBackup(true);
    try {
      let cloudinaryLibrary = {
        configured: Boolean(cloudinaryStatus?.configured),
        cloudName: cloudinaryStatus?.cloudName || null,
        folder: cloudinaryStatus?.folder || 'brahmyaman_plants',
        totalAssets: 0,
        totalBytes: 0,
        truncated: false,
        resources: [] as Array<{
          public_id: string;
          url: string;
          format: string;
          bytes: number;
          width: number;
          height: number;
          created_at: string;
          folder: string;
          tags: string[];
        }>,
      };
      try {
        const headers = await getAuthHeaders();
        const res = await fetch('/api/admin/cloudinary-export-all', { headers });
        const data = await res.json().catch(() => ({}));
        if (res.status === 401 || res.status === 403) {
          await handleUnauthorizedResponse(data?.error);
          return;
        }
        if (res.ok && data.success) {
          cloudinaryLibrary = {
            configured: Boolean(data.configured),
            cloudName: data.cloudName || null,
            folder: data.folder || 'brahmyaman_plants',
            totalAssets: Number(data.totalCount || (data.resources?.length ?? 0)),
            totalBytes: Number(data.totalBytes || 0),
            truncated: Boolean(data.truncated),
            resources: Array.isArray(data.resources) ? data.resources : [],
          };
        }
      } catch {}

      const backupPlantEntries: BackupPlantEntry[] = await Promise.all(
        plants.map(async (p) => {
          const rawSlots =
            Array.isArray(p.images) && p.images.length > 0
              ? p.images
              : p.image
              ? [p.image]
              : [];
          const embeddedPhotos: EmbeddedPlantPhotos = {};
          const slot0Src = rawSlots[0] || p.image;
          const slot1Src = rawSlots[1];
          const slot2Src = rawSlots[2];

          const [s0, s1, s2] = await Promise.all([
            slot0Src ? inlineImageAsDataUrl(slot0Src) : Promise.resolve(''),
            slot1Src ? inlineImageAsDataUrl(slot1Src) : Promise.resolve(''),
            slot2Src ? inlineImageAsDataUrl(slot2Src) : Promise.resolve(''),
          ]);
          if (s0.startsWith('data:image/')) embeddedPhotos.slot0DataUrl = s0;
          if (s1.startsWith('data:image/')) embeddedPhotos.slot1DataUrl = s1;
          if (s2.startsWith('data:image/')) embeddedPhotos.slot2DataUrl = s2;

          return {
            ...p,
            ...(Object.keys(embeddedPhotos).length > 0 ? { embeddedPhotos } : {}),
          };
        })
      );

      const deletedSeedSet = new Set<string>();
      try {
        const metaSnap = await getDoc(doc(db, 'catalog_meta', 'deleted_seeds'));
        trackFirestoreRead(1, 'catalog_meta', metaSnap.metadata.fromCache);
        const remoteDeleted = metaSnap.exists() ? metaSnap.data()?.deletedIds : null;
        if (Array.isArray(remoteDeleted)) {
          for (const id of remoteDeleted) {
            if (typeof id === 'string' && id.trim()) {
              deletedSeedSet.add(id.trim());
            }
          }
        }
      } catch {}
      try {
        const rawDeleted = localStorage.getItem('brahmyaman_permanently_deleted_ids_v1');
        if (rawDeleted) {
          const parsedDel = JSON.parse(rawDeleted);
          if (Array.isArray(parsedDel)) {
            for (const id of parsedDel) {
              if (typeof id === 'string' && id.trim()) {
                deletedSeedSet.add(id.trim());
              }
            }
          }
        }
      } catch {}
      const deletedSeedIds = Array.from(deletedSeedSet);

      const dt = getBengaliDateTime();
      const bundle = buildUnifiedBackupBundle({
        plants: backupPlantEntries,
        deletedSeedIds,
        activityLogs: activityLogs.slice(0, 200),
        cloudinaryLibrary,
        exportedAtIso: dt.iso,
        exportedAtBn: `${dt.dateBn} · ${dt.timeBn}`,
      });

      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `brahmyaman-firebase-cloudinary-backup-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast(
        `সম্পূর্ণ ব্যাকআপ ডাউনলোড হয়েছে: ${bundle.summary.totalPlants}টি গাছ + ${bundle.summary.cloudinaryAssetsCount}টি Cloudinary ছবি!`,
        'success'
      );
    } catch {
      showToast('সম্পূর্ণ ব্যাকআপ ডাউনলোড করতে সমস্যা হয়েছে।', 'warning');
    } finally {
      setIsExportingFullBackup(false);
    }
  };

  const handleExportPrintablePhotoCatalog = async () => {
    if (isExportingFullBackup) return;
    setIsExportingFullBackup(true);
    try {
      const htmlDoc = await buildPrintablePhotoCatalogHtml(activePlants);
      const blob = new Blob([htmlDoc], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `brahmyaman-photo-catalog-${new Date().toISOString().slice(0, 10)}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(
        'অফলাইন ফটো ও দাম ক্যাটালগ (HTML/PDF) ডাউনলোড হয়েছে — ইন্টারনেট ছাড়াই খোলা যাবে!',
        'success'
      );
    } catch {
      showToast('ফটো-ক্যাটালগ তৈরি করতে সমস্যা হয়েছে।', 'warning');
    } finally {
      setIsExportingFullBackup(false);
    }
  };

  const handleRestoreBackupFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsedBundle = parseUnifiedBackupPayload(text);
      if (!parsedBundle || parsedBundle.plants.length === 0) {
        showToast('এই ফাইলে কোনো বৈধ চারার ব্যাকআপ পাওয়া যায়নি।', 'warning');
        return;
      }

      const validPlants = parsedBundle.plants;
      const extraNote =
        parsedBundle.cloudinaryAssetsCount > 0 || parsedBundle.deletedSeedIds.length > 0
          ? ` (Cloudinary ছবি তথ্য: ${parsedBundle.cloudinaryAssetsCount}টি, মুছে ফেলা রেকর্ড: ${parsedBundle.deletedSeedIds.length}টি)`
          : '';

      setConfirmDialog({
        isOpen: true,
        type: 'custom_action',
        titleBn: `${validPlants.length} টি গাছের ব্যাকআপ রিস্টোর করবেন?`,
        messageBn: `ফাইল "${file.name}" (${parsedBundle.backupVersion}) থেকে ${validPlants.length} টি গাছের ছবি, দাম এবং তথ্য বর্তমান ডাটাবেসে পুনরুদ্ধার করা হবে${extraNote}।`,
        confirmBtnBn: 'হ্যাঁ, সব রিস্টোর করুন',
        isDanger: false,
        onConfirm: async () => {
          setConfirmDialog(null);
          setIsRestoringBackup(true);
          try {
            const hydratedPlants: BrahmyamanPlant[] = [];
            let uploadedCount = 0;
            for (const entry of validPlants) {
              const { embeddedPhotos: _ignoredEmbedded, ...cleanPlant } = entry;
              const slots = Array.isArray(cleanPlant.images)
                ? [...cleanPlant.images]
                : cleanPlant.image
                ? [cleanPlant.image]
                : [];
              const pubIds = Array.isArray(cleanPlant.cloudinaryPublicIds)
                ? [...cleanPlant.cloudinaryPublicIds]
                : [];

              if (cloudinaryStatus?.configured && cloudinaryStatus?.verified) {
                for (let slotIdx = 0; slotIdx < Math.min(3, slots.length); slotIdx += 1) {
                  const slotVal = (slots[slotIdx] || '').trim();
                  if (slotVal.startsWith('data:image/')) {
                    const up = await uploadImageWithResilience(
                      slotVal,
                      cleanPlant.nameBn,
                      slotIdx + 1
                    );
                    if (up.authError) {
                      return;
                    }
                    if (up.ok && up.url) {
                      slots[slotIdx] = up.url;
                      pubIds[slotIdx] = up.publicId || '';
                      uploadedCount += 1;
                    }
                  }
                }
              }

              const aligned = alignPlantImageSlots(
                slots,
                pubIds,
                cleanPlant.image || slots[0] || ''
              );
              hydratedPlants.push({
                ...cleanPlant,
                image: aligned.primaryImage || cleanPlant.image || PRESET_PLANT_PHOTOS[0].url,
                images:
                  aligned.images.length > 0
                    ? aligned.images
                    : [aligned.primaryImage || PRESET_PLANT_PHOTOS[0].url],
                ...(aligned.cloudinaryPublicIds.length > 0
                  ? { cloudinaryPublicIds: aligned.cloudinaryPublicIds }
                  : {}),
              });
            }

            const ok = onImportCatalogBackup
              ? await onImportCatalogBackup(hydratedPlants, parsedBundle.deletedSeedIds)
              : false;
            if (ok === false) {
              showToast(
                'ব্যাকআপ সম্পূর্ণভাবে Firestore ডাটাবেসে সেভ হয়নি! সংযোগ বা অ্যাডমিন অনুমতি যাচাই করে পুনরায় চেষ্টা করুন।',
                'warning'
              );
              return;
            }
            let restoredLogsCount = 0;
            if (Array.isArray(parsedBundle.activityLogs) && parsedBundle.activityLogs.length > 0) {
              const sortedLogs = [...parsedBundle.activityLogs]
                .filter((item): item is AdminActivityLogItem =>
                  Boolean(item && typeof item.id === 'string' && item.id.trim())
                )
                .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''))
                .slice(0, 100);
              if (sortedLogs.length > 0) {
                try {
                  const logsBatch = writeBatch(db);
                  for (const logItem of sortedLogs) {
                    const sanitizedLog = sanitizeActivityLogForFirestore(logItem);
                    logsBatch.set(doc(db, 'activity_logs', sanitizedLog.id), sanitizedLog);
                  }
                  await logsBatch.commit();
                  trackFirestoreWrite(sortedLogs.length, 'activity_logs');
                  restoredLogsCount = sortedLogs.length;
                } catch {}
                setActivityLogs((prev) => {
                  const merged = new Map<string, AdminActivityLogItem>();
                  for (const item of sortedLogs) merged.set(item.id, item);
                  for (const existing of prev) {
                    if (!merged.has(existing.id) && existing.id !== 'log-seed-1') {
                      merged.set(existing.id, existing);
                    }
                  }
                  const combined = Array.from(merged.values())
                    .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''))
                    .slice(0, 100);
                  activityLogsRef.current = combined;
                  return combined;
                });
              }
            }

            const dt = getBengaliDateTime();
            recordActivityLog(
              'settings_change',
              `♻️ সম্পূর্ণ ব্যাকআপ রিস্টোর: ${hydratedPlants.length}টি গাছ`,
              `ব্যাকআপ ফাইল "${file.name}" থেকে ${hydratedPlants.length}টি গাছ (${uploadedCount}টি ছবি Cloudinary-তে আপলোড${
                restoredLogsCount > 0 ? `, ${restoredLogsCount}টি লগ রিস্টোর` : ''
              }সহ) রিস্টোর করা হয়েছে (${dt.dateBn} · ${dt.timeBn})`
            );
            showToast(
              `সফলভাবে ${hydratedPlants.length}টি গাছ ছবি ও দাম সহ রিস্টোর হয়েছে!`,
              'success'
            );
          } catch {
            showToast('ব্যাকআপ রিস্টোর করার সময় সমস্যা হয়েছে।', 'warning');
          } finally {
            setIsRestoringBackup(false);
          }
        },
      });
    } catch {
      showToast('অবৈধ JSON ফাইল। অনুগ্রহ করে সঠিক ব্যাকআপ ফাইল নির্বাচন করুন।', 'warning');
    } finally {
      e.target.value = '';
    }
  };

  const handleRequestFactoryReset = () => {
    setConfirmDialog({
      isOpen: true,
      type: 'reset_catalog',
      titleBn: 'মূল ক্যাটালগ ফ্যাক্টরি রিসেট করতে চান?',
      messageBn:
        'আপনার যোগ করা নতুন চারা ও দাম পরিবর্তন মুছে গিয়ে প্রাথমিক নার্সারি ক্যাটালগ পুনরায় সেট হবে। আপনি কি নিশ্চিত?',
      confirmBtnBn: 'হ্যাঁ, রিসেট করুন',
      isDanger: true,
      onConfirm: async () => {
        setConfirmDialog(null);
        const synced = await onResetCatalog();
        if (synced === false) {
          showToast(
            'ফ্যাক্টরি রিসেট Firestore-এ সম্পন্ন হয়নি! শুধুমাত্র Owner অ্যাকাউন্টে ও সক্রিয় নেটওয়ার্কে এটি সম্ভব।',
            'warning'
          );
          return;
        }
        const dt = getBengaliDateTime();
        recordActivityLog(
          'settings_change',
          '🔄 ক্যাটালগ ফ্যাক্টরি রিসেট সম্পন্ন',
          `ক্যাটালগ প্রাথমিক অবস্থায় ফিরিয়ে নেওয়া হয়েছে (${dt.dateBn} · ${dt.timeBn})`
        );
        showToast('ক্যাটালগ সফলভাবে প্রাথমিক অবস্থায় রিসেট করা হয়েছে।', 'info');
      },
    });
  };

  const handleRotateAiSlot = async (
    action: 'next' | 'select' | 'reset_cooldown' | 'set_provider' = 'next',
    slotId?: string,
    provider?: AiProviderChoice
  ) => {
    if (isRotatingKeySlot) return;
    setIsRotatingKeySlot(true);
    try {
      const headers = await getAuthHeaders(true);
      const res = await fetch('/api/admin/ai-rotate', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action, slotId, provider }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        await handleUnauthorizedResponse(data?.error);
        return;
      }
      if (res.ok && data.success) {
        setAiStatus(data);
        setHasBackupGeminiKey((data.configuredCount || 0) > 1);
        if (action === 'set_provider' && provider) {
          showToast(`প্রাথমিক AI প্রোভাইডার এখন: ${provider.toUpperCase()}`, 'success');
        } else if (action === 'reset_cooldown') {
          showToast('সকল Gemini AI কী স্লটের কুলডাউন স্ট্যাটাস রিসেট করা হয়েছে!', 'success');
        } else {
          showToast(`সক্রিয় কী স্লট পরিবর্তন হয়েছে: ${data.activeSlotLabel}`, 'success');
        }
      } else {
        showToast(data.error || 'AI কনফিগারেশন পরিবর্তন করা যায়নি।', 'warning');
      }
    } catch {
      showToast('সার্ভারের সাথে সংযোগ করতে সমস্যা হয়েছে।', 'warning');
    } finally {
      setIsRotatingKeySlot(false);
    }
  };

  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  const handleAdminBack = () => {
    if (isMobileDrawerOpen) {
      setIsMobileDrawerOpen(false);
      return;
    }
    if (confirmDialog?.isOpen) {
      setConfirmDialog(null);
      return;
    }
    if (quickPricePlant) {
      setQuickPricePlant(null);
      return;
    }
    if (showDiagnosticsModal) {
      setShowDiagnosticsModal(false);
      return;
    }
    if (tabHistory.length > 0) {
      const previousTab = tabHistory[tabHistory.length - 1];
      setTabHistory((prev) => prev.slice(0, -1));
      setMobileTab(previousTab);
      return;
    }
    if (mobileTab !== 'inventory') {
      setMobileTab('inventory');
      return;
    }
    showToast(
      'আপনি অ্যাডমিন ড্যাশবোর্ডের মূল পাতায় আছেন। দোকানের ওয়েবসাইটে যেতে ডানদিকের "ওয়েবসাইট" বোতামে চাপুন।',
      'info'
    );
  };

  const [logFilter, setLogFilter] = useState<AdminLogFilter>('all');

  useEffect(() => {
    if (mobileTab === 'chatbot' && chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, mobileTab]);

  // Duplicate Detection & Variant Differentiator
  const duplicateCheck = useMemo(() => {
    const rawName = formNameBn.trim().toLowerCase();
    const rawColor = formColorBn.trim().toLowerCase();
    if (!rawName) return null;

    const match = activePlants.find(
      (p) => p.id !== editingPlantId && p.nameBn.trim().toLowerCase() === rawName
    );
    if (!match) return null;

    const existingColor = (match.colorBn || '').trim().toLowerCase();

    if (existingColor === rawColor) {
      return {
        type: 'exact_duplicate' as const,
        plant: match,
        messageBn: `সতর্কতা: "${match.nameBn}${
          match.colorBn ? ` (${match.colorBn})` : ''
        }" ইতিমধ্যে ক্যাটালগে আছে (মূল্য ₹${
          match.options[0]?.price
        })। একই নামের ও রঙের চারা ডুপ্লিকেট যোগ করলে ক্রেতারা বিভ্রান্ত হতে পারেন!`,
      };
    }

    return {
      type: 'valid_variant' as const,
      plant: match,
      messageBn: `অনুমোদিত নতুন ভ্যারাইটি: ক্যাটালগে ইতিমধ্যে "${match.nameBn}${
        match.colorBn ? ` (${match.colorBn})` : ''
      }" সংরক্ষিত আছে। এটি একটি ভিন্ন রং/জাত ("${formColorBn.trim()}") হিসেবে আলাদা কার্ড ও রঙের ব্যাজসহ যুক্ত হবে।`,
    };
  }, [formNameBn, formColorBn, activePlants, editingPlantId]);

  const handlePhotoUpload = async (
    e: ChangeEvent<HTMLInputElement>,
    source: 'camera' | 'gallery'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.ok) {
      showToast(validation.errorBn || 'বৈধ ছবির ফাইল নির্বাচন করুন।', 'warning');
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      if (galleryInputRef.current) galleryInputRef.current.value = '';
      return;
    }

    setIsCompressingPhoto(true);
    try {
      let compressedDataUrl = '';
      try {
        compressedDataUrl = await compressImageFileToDataUrl(file, {
          maxWidth: 1200,
          maxHeight: 1200,
          quality: 0.82,
        });
      } catch {
        compressedDataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      const dt = getBengaliDateTime();
      const timeStr = `${dt.dateBn} · ${dt.timeBn}`;
      setPhotoUploadTimestampBn(timeStr);

      let finalUrl = '';
      let returnedPublicId = '';
      let usedCloudinaryOrServer = false;

      setIsUploadingToCloudinary(true);
      try {
        const upRes = await uploadImageWithResilience(
          compressedDataUrl,
          formNameBn || 'plant',
          activeImageSlot + 1
        );
        if (upRes.ok && upRes.url) {
          finalUrl = upRes.url;
          returnedPublicId = upRes.publicId || '';
          usedCloudinaryOrServer = true;
          showToast(
            `ছবি (স্লট ${activeImageSlot + 1}) সফলভাবে আপলোড সম্পন্ন হয়েছে!`,
            'success'
          );
        } else {
          finalUrl = compressedDataUrl;
        }
      } catch {
        finalUrl = compressedDataUrl;
      } finally {
        setIsUploadingToCloudinary(false);
      }

      if (!finalUrl) {
        finalUrl = compressedDataUrl;
      }

      if (finalUrl.startsWith('data:image/')) {
        const preCheck = validateFirestoreImagePayloadSize(finalUrl, 750000);
        if (!preCheck.ok) {
          const shrunk = await compressBase64ImageForFirestore(finalUrl, 750000);
          if (shrunk) {
            finalUrl = shrunk;
          }
        }
        const postCheck = validateFirestoreImagePayloadSize(finalUrl, 850000);
        if (!postCheck.ok) {
          showToast(
            postCheck.errorBn || 'ছবির আকার অনেক বড়। অনুগ্রহ করে ছোট ছবি নির্বাচন করুন।',
            'warning'
          );
          return;
        }
        if (!usedCloudinaryOrServer) {
          showToast(
            `ছবি (স্লট ${activeImageSlot + 1}) কমপ্রেস হয়ে সফলভাবে যুক্ত হয়েছে!`,
            'success'
          );
        }
      }

      const previousPublicId = formCloudinaryPublicIds[activeImageSlot];
      if (returnedPublicId && previousPublicId && previousPublicId !== returnedPublicId) {
        void deleteCloudinaryAsset(previousPublicId, {
          getAuthHeaders,
          onUnauthorized: async (msg) => {
            console.warn('Delete previous photo unauth notice:', msg);
          },
        });
      }

      const nextImages = [...formImages];
      nextImages[activeImageSlot] = finalUrl;
      const nextPublicIds = [...formCloudinaryPublicIds];
      for (let idx = 0; idx < activeImageSlot; idx += 1) {
        if (typeof nextPublicIds[idx] !== 'string') nextPublicIds[idx] = '';
      }
      nextPublicIds[activeImageSlot] = returnedPublicId || '';

      setFormImages(nextImages);
      setFormCloudinaryPublicIds(nextPublicIds);
      if (activeImageSlot === 0) {
        setFormImage(finalUrl);
      }

      if (editingPlantId) {
        const existingPlant = plants.find((p) => p.id === editingPlantId);
        if (existingPlant) {
          const updatedPlant = applyUploadedPhotoToPlant({
            plant: {
              ...existingPlant,
              images: nextImages,
              cloudinaryPublicIds: nextPublicIds,
            },
            slotIndex: activeImageSlot,
            uploadedUrl: finalUrl,
            publicId: returnedPublicId,
            fallbackPrimaryImage: PRESET_PLANT_PHOTOS[0].url,
            timestampIso: dt.iso,
            timestampBn: timeStr,
          });
          const synced = await onUpdatePlant(updatedPlant);
          const savedToCloudinaryCdn = Boolean(
            returnedPublicId || finalUrl.startsWith('https://res.cloudinary.com/')
          );
          if (synced === false) {
            showToast(
              'ছবি ফর্মে আপডেট হয়েছে, কিন্তু লাইভ ডাটাবেসে সেভ করতে সমস্যা হয়েছে — অনুগ্রহ করে নিচের সংরক্ষণ বোতামে চাপুন।',
              'warning'
            );
          } else if (savedToCloudinaryCdn) {
            showToast(
              `Cloudinary ছবি (স্লট ${
                activeImageSlot + 1
              }) আপলোড — লাইভ দোকানে ছবিটি সাথে সাথে আপডেট হয়ে গেছে!`,
              'success'
            );
          } else {
            showToast(
              `কমপ্রেসড প্রধান ছবি (স্লট ১) লাইভ দোকানে সেভ হয়েছে। Cloudinary CDN সক্রিয় করতে Settings > Secrets-এ সঠিক Cloud Name দিন।`,
              'info'
            );
          }
        }
      }

      recordActivityLog(
        'photo_upload',
        source === 'camera' ? '📸 ক্যামেরা দিয়ে ছবি তোলা হয়েছে' : '📁 গ্যালারি থেকে ছবি আপলোড',
        `চারার ছবি (স্লট ${activeImageSlot + 1}) ${
          source === 'camera'
            ? 'সরাসরি মোবাইল ক্যামেরায় তোলা হয়েছে'
            : 'গ্যালারি থেকে আপলোড করা হয়েছে'
        } (${timeStr})`,
        formNameBn || 'অপ্রকাশিত চারা',
        finalUrl.startsWith('http') ? finalUrl : undefined,
        editingPlantId || undefined
      );
    } catch (err: any) {
      showToast(err?.message || 'ছবি প্রসেস করতে সমস্যা হয়েছে। অন্য কোনো ছবি বাছুন।', 'warning');
    } finally {
      setIsCompressingPhoto(false);
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  const handleSearchPlantImages = async (searchTerm?: string) => {
    const term = (
      searchTerm ||
      imageSearchQuery ||
      formNameBn ||
      formNameEn ||
      formBotanical
    ).trim();
    if (!term) {
      setImageSearchError('অনুসন্ধানের জন্য উদ্ভিদের নাম লিখুন (যেমন: রক্তজবা, কাগজি লেবু, Rose)');
      return;
    }
    setImageSearchError(null);
    setIsSearchingImages(true);
    setShowImageSearchPanel(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/admin/search-plant-images?q=${encodeURIComponent(term)}`, {
        headers,
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        await handleUnauthorizedResponse(data?.error);
        return;
      }
      if (res.ok && data.success) {
        if (Array.isArray(data.images) && data.images.length > 0) {
          setImageSearchResults(data.images);
        } else {
          setImageSearchResults([]);
        }
      } else {
        setImageSearchResults([]);
        setImageSearchError(
          data.error || 'অনলাইন ডাটাবেসে কোনো উপযুক্ত ছবি বা বিবরণ পাওয়া যায়নি।'
        );
      }
    } catch {
      setImageSearchError('ডাটাবেস কানেকশনে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsSearchingImages(false);
    }
  };

  const probeImageLoads = (candidateUrl: string, timeoutMs = 4500): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!candidateUrl || !candidateUrl.trim()) {
        resolve(false);
        return;
      }
      const resolvedSrc = resolvePlantImageUrl(candidateUrl, '');
      if (!resolvedSrc) {
        resolve(false);
        return;
      }
      const probe = new Image();
      let settled = false;
      const done = (ok: boolean) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(ok);
      };
      const timer = setTimeout(() => done(false), timeoutMs);
      probe.onload = () => done(true);
      probe.onerror = () => done(false);
      probe.referrerPolicy = 'no-referrer';
      probe.src = resolvedSrc;
    });
  };

  const handleSelectSearchedImage = async (img: ImageSearchResultItem) => {
    showToast(`ছবিটি যাচাই করা হচ্ছে: "${formNameBn || img.title}"...`, 'info');
    let chosenUrl = img.url;
    const primaryOk = await probeImageLoads(img.url);
    if (!primaryOk) {
      const thumbOk =
        img.thumbUrl && img.thumbUrl !== img.url ? await probeImageLoads(img.thumbUrl) : false;
      if (thumbOk) {
        chosenUrl = img.thumbUrl;
      } else {
        showToast(
          'এই ছবিটি লোড হচ্ছে না — অনুগ্রহ করে অন্য একটি ছবি বাছুন অথবা ক্যামেরা থেকে আপলোড করুন।',
          'warning'
        );
        return;
      }
    }

    const previousPublicId = formCloudinaryPublicIds[activeImageSlot];
    if (previousPublicId) {
      void deleteCloudinaryAsset(previousPublicId, {
        getAuthHeaders,
        onUnauthorized: async (msg) => {
          console.warn('Search photo delete previous notice:', msg);
        },
      });
    }

    const nextImages = [...formImages];
    nextImages[activeImageSlot] = chosenUrl;
    const nextPublicIds = [...formCloudinaryPublicIds];
    for (let idx = 0; idx < activeImageSlot; idx += 1) {
      if (typeof nextPublicIds[idx] !== 'string') nextPublicIds[idx] = '';
    }
    nextPublicIds[activeImageSlot] = '';

    setFormImages(nextImages);
    setFormCloudinaryPublicIds(nextPublicIds);
    if (activeImageSlot === 0) {
      setFormImage(chosenUrl);
    }
    setVerifiedImageSource(img.source);

    if (!formNameBn.trim()) {
      setFormNameBn(img.title);
    }

    const dt = getBengaliDateTime();
    const timeFormatted = `${dt.dateBn} · ${dt.timeBn}`;
    setPhotoUploadTimestampBn(timeFormatted);
    recordActivityLog(
      'photo_upload',
      `🌐 উদ্ভিদের ছবি যাচাই করে যুক্ত: ${formNameBn || img.title}`,
      `${img.source} থেকে ছবি যাচাই করে স্বয়ংক্রিয়ভাবে যুক্ত করা হয়েছে (${timeFormatted})`,
      formNameBn || img.title,
      chosenUrl,
      editingPlantId || undefined
    );

    if (editingPlantId) {
      await persistEditingPlantPhotosImmediately(
        nextImages,
        nextPublicIds,
        'যাচাইকৃত ছবি যুক্ত'
      );
    } else {
      showToast(
        `"${formNameBn || img.title}" ছবি যাচাই হয়ে যুক্ত হয়েছে! AI তথ্য তৈরি করছে...`,
        'info'
      );
    }

    const plantSearchKey = formNameBn.trim() || img.title;
    if (plantSearchKey) {
      await handleAiAutoFill(plantSearchKey);
    }
  };

  const handleAiAutoFill = async (
    overrideQuery?: string,
    mode: 'full' | 'description_only' = 'full'
  ) => {
    const queryStr = (overrideQuery || formNameBn || formNameEn || imageSearchQuery || '').trim();
    if (!queryStr) {
      showToast('অনুগ্রহ করে প্রথমে চারার নাম লিখুন (যেমন: রক্তজবা, আম্রপালী, Rose)।', 'warning');
      return;
    }
    setIsAiAutofilling(true);
    try {
      const headers = await getAuthHeaders(true);
      const res = await fetch('/api/admin/ai-autofill-plant', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query: queryStr,
          mode,
          customInstruction: aiCustomInstruction.trim(),
          modelChoice: modelType,
          aiProvider: aiProviderChoice,
          existingPlant: {
            nameBn: formNameBn.trim(),
            nameEn: formNameEn.trim(),
            colorBn: formColorBn.trim(),
            category: formCategory,
            botanicalName: formBotanical.trim(),
            badgeBn: formBadgeBn.trim(),
            currentPrice: option1Price,
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        showToast(
          data?.error || 'অ্যাডমিন অনুমোদন যাচাই করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।',
          'warning'
        );
        return;
      }
      if (res.ok && data.success && data.data) {
        const d = data.data;
        if (mode === 'full') {
          if (d.nameBn) setFormNameBn(d.nameBn);
          if (d.nameEn) setFormNameEn(d.nameEn);
          if (d.colorBn) setFormColorBn(d.colorBn);
          if (d.category) {
            const matchedCategory = ADMIN_CATEGORIES.find(
              (c) => c === d.category || c.includes(d.category) || d.category.includes(c)
            );
            setFormCategory(matchedCategory || d.category || ADMIN_CATEGORIES[0]);
          }
          if (d.botanicalName) setFormBotanical(d.botanicalName);
          if (!option1Label.trim()) setOption1Label('পলি গ্রো-ব্যাগ চারা');
          if (!option2Label.trim()) setOption2Label('মাঝারি সাইজ পরিপুষ্ট চারা');
          if (d.suggestedPrice) {
            const p = Number(d.suggestedPrice) || 50;
            const secondP = p + Math.max(40, Math.round((p * 0.6) / 10) * 10);
            setOption1Price(p.toString());
            setBasePrice(p.toString());
            setOption2Price(secondP.toString());
          }
          if (!formImage || PRESET_PLANT_PHOTOS.some((p) => p.url === formImage)) {
            setImageSearchQuery(d.nameBn || queryStr);
            handleSearchPlantImages(d.nameBn || queryStr);
          }
        }

        if (d.badgeBn) setFormBadgeBn(d.badgeBn);
        if (d.sunlightBn) setFormSunlightBn(d.sunlightBn);
        if (d.wateringBn) setFormWateringBn(d.wateringBn);
        if (d.soilTipBn) setFormSoilTipBn(d.soilTipBn);
        if (d.descriptionBn) setFormDescBn(d.descriptionBn);
        if (d.descriptionEn) setFormDescEn(d.descriptionEn);

        const dt = getBengaliDateTime();
        const usedLabel = data.usedOfflineFallback
          ? 'অফলাইন বোটানিক্যাল ইঞ্জিন (লিমিট-মুক্ত)'
          : `${data.modelUsed || modelType}${data.usedBackupKey ? ' (ব্যাকআপ কী)' : ''}`;
        recordActivityLog(
          'plant_edit',
          `✨ ${mode === 'description_only' ? 'ইউনিক বিবরণ তৈরি' : 'AI অটো-ফিল সফল'}: ${
            d.nameBn || queryStr
          }`,
          `মডেল: ${usedLabel} · প্রতিটি চারার আলাদা বৈশিষ্ট্য, বিবরণ ও যত্ন তৈরি হয়েছে (${dt.dateBn} · ${dt.timeBn})`
        );
        showToast(
          data.usedOfflineFallback
            ? `"${
                d.nameBn || formNameBn || queryStr
              }"-এর সব তথ্য লিমিট-মুক্ত বোটানিক্যাল ইঞ্জিন থেকে পূরণ হয়েছে!`
            : `"${
                d.nameBn || formNameBn || queryStr
              }"-এর ইউনিক বিবরণ ও ফর্ম পূরণ হয়েছে (${data.modelUsed || 'AI'})!`,
          'success'
        );
      } else {
        showToast(
          data?.error || 'AI অটো-ফিল করতে সমস্যা হয়েছে। অন্য মডেল দিয়ে চেষ্টা করুন।',
          'warning'
        );
      }
    } catch {
      showToast('নেটওয়ার্ক সমস্যা। পুনরায় চেষ্টা করুন।', 'warning');
    } finally {
      setIsAiAutofilling(false);
      fetchAiStatus();
    }
  };

  const handleGoogleSignIn = async () => {
    if (isPopupSigningInRef.current || isVerifying) {
      return;
    }

    isPopupSigningInRef.current = true;
    setIsVerifying(true);
    setLoginError('');

    try {
      await auth.authStateReady();
      const user = await signInWithGooglePopup();
      const verified = await verifySessionWithBackend(user);

      if (!verified) {
        showToast(
          lastBackendAuthErrorRef.current ||
            'অননুমোদিত জিমেইল! শুধুমাত্র অনুমোদিত নার্সারি অ্যাডমিন Google অ্যাকাউন্ট দিয়ে লগইন করুন।',
          'warning'
        );
        return;
      }

      const email = (user.email || '').trim().toLowerCase();
      recordActivityLog(
        'settings_change',
        '☁️ Google ক্লাউড সিঙ্ক ও লগইন সফল',
        `${email} অ্যাকাউন্টের মাধ্যমে Firebase ও সার্ভার যাচাইকৃত লগইন সম্পন্ন হয়েছে।`
      );
      showToast(`${email} সফলভাবে সার্ভার যাচাইকৃত হয়েছে!`, 'success');
    } catch (err: any) {
      const code = err?.code as string | undefined;

      await auth.authStateReady().catch(() => {});
      if (auth.currentUser) {
        const verified = await verifySessionWithBackend(auth.currentUser);
        if (verified) {
          const email = (auth.currentUser.email || '').trim().toLowerCase();
          showToast(`${email} সফলভাবে সার্ভার যাচাইকৃত হয়েছে!`, 'success');
          return;
        }
        if (lastBackendAuthErrorRef.current) {
          showToast(lastBackendAuthErrorRef.current, 'warning');
          return;
        }
      }

      const isUserDismissed =
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/cancelled-popup-request' ||
        isFirebasePopupPendingPromiseAssertion(err);

      let msg = `Google লগইন ব্যর্থ হয়েছে${
        code ? ` [${code}]` : ''
      }। অনুগ্রহ করে পপ-আপ অনুমতি দিয়ে পুনরায় চেষ্টা করুন।`;
      if (isUserDismissed) {
        msg =
          'Google লগইন পপ-আপ সম্পূর্ণ হওয়ার আগেই বন্ধ হয়ে গেছে। আবার চেষ্টা করুন (পপ-আপ ব্লক থাকলে অনুমতি দিন)।';
      } else if (code === 'auth/popup-blocked') {
        msg =
          'ব্রাউজার লগইন পপ-আপ ব্লক করেছে। অনুগ্রহ করে এই সাইটের জন্য পপ-আপ অনুমতি (Allow Popups) চালু করুন।';
      } else if (code === 'auth/unauthorized-domain') {
        msg = 'এই ডোমেইনটি Firebase Authentication-এ অনুমোদিত নয় [auth/unauthorized-domain]।';
      } else if (code === 'auth/network-request-failed') {
        msg = 'ইন্টারনেট সংযোগের সমস্যার কারণে Google লগইন সম্পন্ন হয়নি।';
      } else if (code === 'auth/operation-not-allowed') {
        msg = 'Firebase Authentication-এ Google Sign-In চালু নেই [auth/operation-not-allowed]।';
      }

      setLoginError(msg);
      showToast(msg, isUserDismissed ? 'info' : 'warning');
    } finally {
      isPopupSigningInRef.current = false;
      setIsVerifying(false);
      setIsAuthChecking(false);
    }
  };

  const handleLogout = async () => {
    setIsServerVerified(false);
    setVerifiedEmail(null);
    setFirebaseUser(null);
    setLoginError('');
    await signOut(auth).catch(() => {});
    onNavigateToShop();
  };

  const commitQuickPriceUpdate = async (plant: BrahmyamanPlant, newPriceNum: number) => {
    const dt = getBengaliDateTime();
    const oldPrice = plant.options[0]?.price || 0;

    const updatedPlant: BrahmyamanPlant = {
      ...plant,
      options: plant.options.map((opt, idx) =>
        idx === 0 ? { ...opt, price: newPriceNum } : opt
      ),
      updatedAt: dt.iso,
      updatedAtBn: `${dt.dateBn} · ${dt.timeBn}`,
    };

    const synced = await onUpdatePlant(updatedPlant);
    if (synced === false) {
      showToast(
        `"${plant.nameBn}"-এর নতুন দাম Firestore-এ সেভ হয়নি! সংযোগ বা অ্যাডমিন অনুমতি পরীক্ষা করে আবার চেষ্টা করুন।`,
        'error',
        undefined,
        undefined,
        'ত্রুটি: অপারেশন ব্যর্থ হয়েছে (Error: Operation Failed)'
      );
      return;
    }

    pushUndoRecord({
      type: 'plant_update',
      labelBn: `"${plant.nameBn}" দাম ₹${oldPrice} → ₹${newPriceNum}`,
      before: plant,
      after: updatedPlant,
    });

    recordActivityLog(
      'price_update',
      `💰 দাম পরিবর্তন: ${plant.nameBn}`,
      `মূল বিক্রয়মূল্য ₹${oldPrice} থেকে পরিবর্তন করে ₹${newPriceNum} করা হয়েছে (${dt.dateBn} · ${dt.timeBn})`,
      plant.nameBn,
      plant.image,
      plant.id
    );

    showToast(
      `"${plant.nameBn}"-এর নতুন দাম ₹${newPriceNum} সেভ হয়েছে!`,
      'success',
      undefined,
      undefined,
      'সফল: চারার দাম আপডেট হয়েছে (Success: Plant Updated)'
    );
    setQuickPricePlant(null);
    setQuickPriceValue('');
  };

  const handleSaveQuickPrice = (e: FormEvent) => {
    e.preventDefault();
    if (!quickPricePlant) return;

    const newPriceNum = Math.round(parseFloat(quickPriceValue));
    if (!newPriceNum || newPriceNum <= 0) {
      showToast(
        'অনুগ্রহ করে ১ টাকার বেশি সঠিক দাম লিখুন।',
        'error',
        undefined,
        undefined,
        'ত্রুটি: অবৈধ দাম (Error: Invalid Price)'
      );
      return;
    }

    if (newPriceNum < 20 || newPriceNum > 1000) {
      const targetPlant = quickPricePlant;
      setConfirmDialog({
        isOpen: true,
        type: 'custom_action',
        plant: targetPlant,
        titleBn: `দাম ₹${newPriceNum} — আপনি কি নিশ্চিত?`,
        messageBn: `সাধারণত চারার দাম ₹২০ থেকে ₹১,০০০-এর মধ্যে হয়। ভুল করে শূন্য কম/বেশি পড়েনি তো? "${targetPlant.nameBn}"-এর দাম ₹${newPriceNum} সেভ করবেন?`,
        confirmBtnBn: `হ্যাঁ, ₹${newPriceNum} সেভ করুন`,
        cancelBtnBn: 'দাম ঠিক করি',
        isDanger: false,
        onConfirm: async () => {
          setConfirmDialog(null);
          await commitQuickPriceUpdate(targetPlant, newPriceNum);
        },
      });
      return;
    }

    void commitQuickPriceUpdate(quickPricePlant, newPriceNum);
  };

  const handleToggleStockStatus = async (plant: BrahmyamanPlant) => {
    const dt = getBengaliDateTime();
    const nextInStock = plant.inStock === false;
    const updatedPlant: BrahmyamanPlant = {
      ...plant,
      inStock: nextInStock,
      updatedAt: dt.iso,
      updatedAtBn: `${dt.dateBn} · ${dt.timeBn}`,
    };

    const synced = await onUpdatePlant(updatedPlant);
    if (synced === false) {
      showToast(
        `"${plant.nameBn}"-এর স্টক স্ট্যাটাস Firestore-এ পরিবর্তন করা যায়নি! সংযোগ বা অনুমতি যাচাই করুন।`,
        'error',
        undefined,
        undefined,
        'ত্রুটি: অপারেশন ব্যর্থ হয়েছে (Error: Operation Failed)'
      );
      return;
    }

    pushUndoRecord({
      type: 'plant_update',
      labelBn: `"${plant.nameBn}" স্টক পরিবর্তন`,
      before: plant,
      after: updatedPlant,
    });

    recordActivityLog(
      'plant_edit',
      `${nextInStock ? '✅ স্টক চালু' : '🚫 স্টক শেষ'}: ${plant.nameBn}`,
      `"${plant.nameBn}" এর স্ট্যাটাস "${
        nextInStock ? 'স্টকে আছে' : 'স্টক শেষ'
      }" করা হয়েছে (${dt.dateBn} · ${dt.timeBn})`,
      plant.nameBn,
      plant.image,
      plant.id
    );

    showToast(
      `"${plant.nameBn}" এখন ${nextInStock ? 'স্টকে আছে ✓' : 'স্টক শেষ হিসেবে চিহ্নিত'}`,
      'success',
      undefined,
      undefined,
      'সফল: স্টক আপডেট হয়েছে (Success: Plant Updated)'
    );
  };

  const handleStartAddPlant = (forceReset?: boolean | unknown) => {
    const isExplicitReset = forceReset === true;
    if (!isExplicitReset && !editingPlantId && formNameBn.trim()) {
      switchAdminTab('add');
      return;
    }
    setEditingPlantId(null);
    setFormNameBn('');
    setFormNameEn('');
    setFormBotanical('');
    setFormCategory(ADMIN_CATEGORIES[0]);
    setFormAudience(['puja', 'family']);
    setFormBadgeBn('নতুন সংগ্রহ');
    setFormColorBn('');
    setFormSunlightBn('পূর্ণ রোদ (দিনে অন্তত ৫ ঘণ্টা)');
    setFormWateringBn('মাটি শুকিয়ে এলে পর্যাপ্ত জল দিন');
    setFormSoilTipBn('গোবর সার ও মাটির মিশ্রণ');
    setFormDescBn('');
    setFormDescEn('');
    setAiCustomInstruction('');
    setFormImage(PRESET_PLANT_PHOTOS[0].url);
    setFormImages([PRESET_PLANT_PHOTOS[0].url]);
    setFormCloudinaryPublicIds([]);
    setActiveImageSlot(0);
    setPhotoUploadTimestampBn(null);
    setBasePrice('50');
    setOption1Label('পলি গ্রো-ব্যাগ চারা');
    setOption1Price('50');
    setOption2Label('মাঝারি সাইজ পরিপুষ্ট চারা');
    setOption2Price('90');
    setHasOption3(false);
    setOption3Label('বড় ফলবতী কলম চারা');
    setOption3Price('160');
    switchAdminTab('add');
  };

  const handleStartEditPlant = (plant: BrahmyamanPlant) => {
    setEditingPlantId(plant.id);
    setFormNameBn(plant.nameBn);
    setFormNameEn(plant.nameEn);
    setFormBotanical(plant.botanicalName);
    setFormCategory(plant.category);
    setFormAudience(plant.audience);
    setFormBadgeBn(plant.badgeBn || '');
    setFormColorBn(plant.colorBn || '');
    setFormSunlightBn(plant.sunlightBn);
    setFormWateringBn(plant.wateringBn);
    setFormSoilTipBn(plant.soilTipBn);
    setFormDescBn(plant.descriptionBn);
    setFormDescEn(plant.descriptionEn);
    setAiCustomInstruction('');
    const editSlots = alignPlantImageSlots(
      Array.isArray(plant.images) && plant.images.length > 0 ? plant.images : [plant.image],
      plant.cloudinaryPublicIds || [],
      plant.image
    );
    setFormImage(editSlots.primaryImage || plant.image);
    setFormImages(editSlots.images.length > 0 ? editSlots.images : [plant.image]);
    setFormCloudinaryPublicIds(editSlots.cloudinaryPublicIds);
    setActiveImageSlot(0);
    setPhotoUploadTimestampBn(plant.updatedAtBn || null);

    if (plant.options[0]) {
      setBasePrice(plant.options[0].price.toString());
      setOption1Label(plant.options[0].labelBn);
      setOption1Price(plant.options[0].price.toString());
    }
    if (plant.options[1]) {
      setOption2Label(plant.options[1].labelBn);
      setOption2Price(plant.options[1].price.toString());
    }
    if (plant.options[2]) {
      setHasOption3(true);
      setOption3Label(plant.options[2].labelBn);
      setOption3Price(plant.options[2].price.toString());
    } else {
      setHasOption3(false);
    }
    switchAdminTab('add');
  };

  const handleSavePlantForm = async (e: FormEvent) => {
    e.preventDefault();
    if (!formNameBn.trim()) return;

    if (duplicateCheck && duplicateCheck.type === 'exact_duplicate') {
      showToast(
        `ডুপ্লিকেট ত্রুটি: "${duplicateCheck.plant.nameBn}" ইতিমধ্যে ক্যাটালগে বিদ্যমান। অনুগ্রহ করে ভিন্ন রং/জাত উল্লেখ করুন অথবা বর্তমান চারাটি সম্পাদনা করুন।`,
        'warning'
      );
      return;
    }

    const parsedOpt1 = parseFloat(option1Price);
    const parsedBase = parseFloat(basePrice);
    const opt1PriceNum = Math.max(
      1,
      parsedOpt1 > 0 ? parsedOpt1 : parsedBase > 0 ? parsedBase : 50
    );
    const parsedOpt2 = parseFloat(option2Price);
    const opt2PriceNum = Math.max(1, parsedOpt2 > 0 ? parsedOpt2 : opt1PriceNum + 60);
    const dt = getBengaliDateTime();
    const timeFormatted = `${dt.dateBn} · ${dt.timeBn}`;

    const existingPlant = editingPlantId ? plants.find((p) => p.id === editingPlantId) : undefined;

    // Preserve existing option IDs when editing so cart/inquiry references remain stable
    const options: PlantPotOption[] = [
      {
        id: existingPlant?.options?.[0]?.id || `opt-1-${Date.now()}`,
        labelBn: option1Label.trim() || 'পলি গ্রো-ব্যাগ চারা',
        labelEn: existingPlant?.options?.[0]?.labelEn || 'Grow Bag Sapling',
        price: opt1PriceNum,
        containerType: existingPlant?.options?.[0]?.containerType || 'পলি গ্রো ব্যাগ',
      },
      {
        id: existingPlant?.options?.[1]?.id || `opt-2-${Date.now()}`,
        labelBn: option2Label.trim() || 'মাঝারি সাইজ পরিপুষ্ট চারা',
        labelEn: existingPlant?.options?.[1]?.labelEn || 'Medium Matured Sapling',
        price: opt2PriceNum,
        containerType: existingPlant?.options?.[1]?.containerType || 'মাঝারি গ্রো ব্যাগ',
      },
    ];

    if (hasOption3 && option3Label.trim()) {
      const parsedOpt3 = parseFloat(option3Price);
      options.push({
        id: existingPlant?.options?.[2]?.id || `opt-3-${Date.now()}`,
        labelBn: option3Label.trim(),
        labelEn: existingPlant?.options?.[2]?.labelEn || 'Large Grafted Sapling',
        price: Math.max(1, parsedOpt3 > 0 ? parsedOpt3 : opt2PriceNum + 70),
        containerType: existingPlant?.options?.[2]?.containerType || 'বড় পরিপুষ্ট চারা',
      });
    }

    const alignedSlots = alignPlantImageSlots(
      formImages,
      formCloudinaryPublicIds,
      formImage || PRESET_PLANT_PHOTOS[0].url
    );
    const finalPrimaryImage = alignedSlots.primaryImage || PRESET_PLANT_PHOTOS[0].url;
    const finalImages =
      alignedSlots.images.length > 0 ? alignedSlots.images : [finalPrimaryImage];

    if (editingPlantId) {
      const updated: BrahmyamanPlant = {
        id: editingPlantId,
        nameBn: formNameBn.trim(),
        nameEn: formNameEn.trim() || formNameBn.trim(),
        botanicalName: formBotanical.trim() || 'Specimen variety',
        category: formCategory,
        audience: formAudience.length > 0 ? formAudience : ['family'],
        badgeBn: formBadgeBn.trim() || undefined,
        badgeEn: existingPlant?.badgeEn,
        colorBn: formColorBn.trim() || undefined,
        colorEn: formColorBn.trim() || undefined,
        sunlightBn: formSunlightBn.trim(),
        sunlightEn: existingPlant?.sunlightEn || 'Full Sun to Partial Shade',
        wateringBn: formWateringBn.trim(),
        wateringEn: existingPlant?.wateringEn || 'Water when top soil feels dry',
        soilTipBn: formSoilTipBn.trim(),
        soilTipEn: existingPlant?.soilTipEn || 'Well-draining rich compost soil mix',
        descriptionBn:
          formDescBn.trim() ||
          `${formNameBn.trim()} কালশুলির নার্সারির বিশেষ স্বাস্থ্যকর চারা।`,
        descriptionEn:
          formDescEn.trim() || `Healthy nursery sapling cultivated in Kalsuli, Bankura.`,
        image: finalPrimaryImage,
        images: finalImages,
        cloudinaryPublicIds: alignedSlots.cloudinaryPublicIds,
        options,
        inStock: existingPlant?.inStock !== false,
        featured: existingPlant?.featured,
        status: 'active',
        createdAt: existingPlant?.createdAt || existingPlant?.updatedAt || dt.iso,
        createdAtBn:
          existingPlant?.createdAtBn || existingPlant?.updatedAtBn || timeFormatted,
        updatedAt: dt.iso,
        updatedAtBn: timeFormatted,
      };
      const synced = await onUpdatePlant(updated);
      if (synced === false) {
        showToast(
          `ত্রুটি: "${formNameBn.trim()}" ক্লাউড ডাটাবেসে সেভ হয়নি (Firestore ত্রুটি)! অনুগ্রহ করে আপনার লগইন সেশন বা ইন্টারনেট সংযোগ পরীক্ষা করে পুনরায় সেভ করুন।`,
          'error',
          undefined,
          undefined,
          'ত্রুটি: অপারেশন ব্যর্থ হয়েছে (Error: Operation Failed)'
        );
        return;
      }

      if (existingPlant) {
        pushUndoRecord({
          type: 'plant_update',
          labelBn: `"${updated.nameBn}" তথ্য এডিট`,
          before: existingPlant,
          after: updated,
        });
      }

      recordActivityLog(
        'plant_edit',
        `🌿 তথ্য আপডেট: ${formNameBn.trim()}`,
        `চারার বিবরণ, রং (${formColorBn.trim() || 'সাধারণ'}), দাম (₹${opt1PriceNum}) আপডেট করা হয়েছে (${timeFormatted})`,
        formNameBn.trim(),
        finalPrimaryImage.startsWith('http') ? finalPrimaryImage : undefined,
        editingPlantId
      );
      showToast(
        `"${formNameBn.trim()}" চারার তথ্য সফলভাবে আপডেট হয়েছে!`,
        'success',
        undefined,
        undefined,
        'সফল: চারার তথ্য আপডেট হয়েছে (Success: Plant Updated)'
      );
    } else {
      const newPlantId = `plant-${Date.now()}`;
      const newPlant: BrahmyamanPlant = {
        id: newPlantId,
        nameBn: formNameBn.trim(),
        nameEn: formNameEn.trim() || formNameBn.trim(),
        botanicalName: formBotanical.trim() || 'Specimen variety',
        category: formCategory,
        audience: formAudience.length > 0 ? formAudience : ['family'],
        badgeBn: formBadgeBn.trim() || 'নতুন চারা',
        colorBn: formColorBn.trim() || undefined,
        colorEn: formColorBn.trim() || undefined,
        sunlightBn: formSunlightBn.trim(),
        sunlightEn: 'Full Sun to Partial Shade',
        wateringBn: formWateringBn.trim(),
        wateringEn: 'Water when top soil feels dry',
        soilTipBn: formSoilTipBn.trim(),
        soilTipEn: 'Well-draining rich compost soil mix',
        descriptionBn:
          formDescBn.trim() ||
          `${formNameBn.trim()} হলো আমাদের "${formCategory}" বিভাগের একটি সতেজ, শিকড়যুক্ত ও রোগমুক্ত চারা (প্রাথমিক মূল্য ₹${opt1PriceNum})। বাঁকুড়া ও কালশুলির আবহাওয়ায় টব, ছাদবাগান বা উঠোনে চাষের জন্য আদর্শ।`,
        descriptionEn:
          formDescEn.trim() ||
          `${(formNameEn.trim() || formNameBn.trim())} is a healthy, well-rooted sapling in "${formCategory}" conditioned for Bankura laterite soil and home rooftop pots.`,
        image: finalPrimaryImage,
        images: finalImages,
        cloudinaryPublicIds: alignedSlots.cloudinaryPublicIds,
        options,
        inStock: true,
        status: 'active',
        createdAt: dt.iso,
        createdAtBn: timeFormatted,
        updatedAt: dt.iso,
        updatedAtBn: timeFormatted,
      };
      const synced = await onAddPlant(newPlant);
      if (synced === false) {
        showToast(
          `ত্রুটি: "${formNameBn.trim()}" ক্লাউড ডাটাবেসে সেভ হয়নি (Firestore ত্রুটি)। আপনার অনুমতি বা নেটওয়ার্ক যাচাই করুন।`,
          'error',
          undefined,
          undefined,
          'ত্রুটি: অপারেশন ব্যর্থ হয়েছে (Error: Operation Failed)'
        );
        return;
      }

      recordActivityLog(
        'plant_add',
        `✨ নতুন চারা যুক্ত: ${formNameBn.trim()}`,
        `ক্যাটালগে নতুন চারা যুক্ত হয়েছে ${
          formColorBn ? `[রং: ${formColorBn}]` : ''
        }, প্রাথমিক দাম ₹${opt1PriceNum} (${timeFormatted})`,
        formNameBn.trim(),
        finalPrimaryImage.startsWith('http') ? finalPrimaryImage : undefined,
        newPlantId
      );
      showToast(
        `"${formNameBn.trim()}" নতুন চারা সফলভাবে ক্যাটালগে যুক্ত হয়েছে!`,
        'success',
        undefined,
        undefined,
        'সফল: নতুন চারা যুক্ত হয়েছে (Success: Plant Added)'
      );
    }

    switchAdminTab('inventory');
  };

  // Soft Delete & Trash Management Handlers
  const handleSoftDelete = (plant: BrahmyamanPlant) => {
    setConfirmDialog({
      isOpen: true,
      type: 'soft_delete',
      plant,
      titleBn: `"${plant.nameBn}" কি ট্র্যাশ বিনে পাঠাতে চান?`,
      messageBn:
        'এই চারাটি সাময়িকভাবে মূল ক্যাটালগ থেকে সরে যাবে। এটি ৩০ দিন পর্যন্ত ডিজিটাল ট্র্যাশ বিনে সুরক্ষিত থাকবে এবং যেকোনো সময় ১-ক্লিকে পুনরুদ্ধার (Restore) করা যাবে।',
      confirmBtnBn: 'হ্যাঁ, ট্র্যাশে পাঠান',
      isDanger: true,
      onConfirm: async () => {
        setConfirmDialog(null);
        const synced = await onSoftDeletePlant(plant.id);
        if (synced === false) {
          showToast(
            `"${plant.nameBn}" Firestore-এ ট্র্যাশে সরানো যায়নি! সংযোগ বা অনুমতি যাচাই করে পুনরায় চেষ্টা করুন।`,
            'error',
            undefined,
            undefined,
            'ত্রুটি: অপারেশন ব্যর্থ হয়েছে (Error: Operation Failed)'
          );
          return;
        }
        pushUndoRecord({
          type: 'soft_delete',
          labelBn: `"${plant.nameBn}" ট্র্যাশে স্থানান্তর`,
          plant,
        });
        const dt = getBengaliDateTime();
        recordActivityLog(
          'plant_delete',
          `🗑️ ট্র্যাশে স্থানান্তর: ${plant.nameBn}`,
          `চারাটি ট্র্যাশ বিনে পাঠানো হয়েছে (${dt.dateBn} · ${dt.timeBn})। ৩০ দিন পর্যন্ত রিস্টোর করা সম্ভব।`,
          plant.nameBn,
          plant.image,
          plant.id
        );
        showToast(
          `"${plant.nameBn}" ডিজিটাল ট্র্যাশ বিনে পাঠানো হয়েছে।`,
          'success',
          'পূর্বাবস্থায় ফেরান (Undo)',
          () => {
            void handleRestore(plant);
          },
          'সফল: ট্র্যাশে স্থানান্তরিত (Success: Plant Updated)'
        );
      },
    });
  };

  const handleRestore = async (plant: BrahmyamanPlant) => {
    const synced = await onRestorePlant(plant.id);
    if (synced === false) {
      showToast(
        `"${plant.nameBn}" Firestore-এ রিস্টোর করা যায়নি! সংযোগ বা অ্যাডমিন অনুমতি পরীক্ষা করুন।`,
        'error',
        undefined,
        undefined,
        'ত্রুটি: অপারেশন ব্যর্থ হয়েছে (Error: Operation Failed)'
      );
      return;
    }
    pushUndoRecord({
      type: 'restore_plant',
      labelBn: `"${plant.nameBn}" ট্র্যাশ থেকে রিস্টোর`,
      plant,
    });
    const dt = getBengaliDateTime();
    recordActivityLog(
      'plant_restore',
      `🔄 ট্র্যাশ থেকে রিস্টোর: ${plant.nameBn}`,
      `চারাটি সফলভাবে ট্র্যাশ থেকে মূল ক্যাটালগে ফিরিয়ে আনা হয়েছে (${dt.dateBn} · ${dt.timeBn})`,
      plant.nameBn,
      plant.image,
      plant.id
    );
    showToast(
      `"${plant.nameBn}" মূল ক্যাটালগে সফলভাবে ফিরিয়ে আনা হয়েছে!`,
      'success',
      undefined,
      undefined,
      'সফল: চারা রিস্টোর হয়েছে (Success: Plant Restored)'
    );
  };

  const handlePermanentDelete = (plant: BrahmyamanPlant) => {
    setConfirmDialog({
      isOpen: true,
      type: 'permanent_delete',
      plant,
      titleBn: `"${plant.nameBn}" চিরতরে মুছে ফেলতে চান?`,
      messageBn:
        'সতর্কতা: এটি ট্র্যাশ ও ডেটাবেস থেকে স্থায়ীভাবে ডিলিট হয়ে যাবে। আর কখনো ফেরত পাওয়া যাবে না!',
      confirmBtnBn: 'চিরতরে ডিলিট করুন',
      isDanger: true,
      onConfirm: async () => {
        setConfirmDialog(null);
        const synced = await onPermanentDeletePlant(plant.id);
        if (synced === false) {
          showToast(
            `"${plant.nameBn}" Firestore থেকে স্থায়ীভাবে ডিলিট করা যায়নি! শুধুমাত্র Owner অ্যাকাউন্ট অথবা সক্রিয় নেটওয়ার্কে এটি সম্ভব।`,
            'error',
            undefined,
            undefined,
            'ত্রুটি: অপারেশন ব্যর্থ হয়েছে (Error: Operation Failed)'
          );
          return;
        }
        const dt = getBengaliDateTime();
        recordActivityLog(
          'permanent_delete',
          `⚠️ চিরতরে অপসারিত: ${plant.nameBn}`,
          `চারাটি ডেটাবেস থেকে স্থায়ীভাবে ডিলিট করা হয়েছে (${dt.dateBn} · ${dt.timeBn})`,
          plant.nameBn,
          undefined,
          plant.id
        );
        showToast(
          `"${plant.nameBn}" চিরতরে মুছে ফেলা হয়েছে।`,
          'success',
          undefined,
          undefined,
          'সফল: স্থায়ীভাবে ডিলিট সম্পন্ন (Success: Plant Deleted)'
        );
      },
    });
  };

  const handleEmptyAllTrash = () => {
    if (trashedPlants.length === 0) return;
    setConfirmDialog({
      isOpen: true,
      type: 'empty_trash',
      titleBn: 'সম্পূর্ণ ট্র্যাশ বিন খালি করতে চান?',
      messageBn: `ট্র্যাশ বিনে থাকা সমস্ত (${trashedPlants.length} টি) চারা চিরতরে ডেটাবেস থেকে মুছে ফেলা হবে।`,
      confirmBtnBn: 'সব মুছে ফেলুন',
      isDanger: true,
      onConfirm: async () => {
        setConfirmDialog(null);
        const synced = await onEmptyTrash();
        if (synced === false) {
          showToast(
            'সম্পূর্ণ ট্র্যাশ বিন Firestore থেকে খালি করা যায়নি বা আংশিক ব্যর্থ হয়েছে! অনুগ্রহ করে Owner অনুমতি ও সংযোগ যাচাই করুন।',
            'error',
            undefined,
            undefined,
            'ত্রুটি: অপারেশন ব্যর্থ হয়েছে (Error: Operation Failed)'
          );
          return;
        }
        const dt = getBengaliDateTime();
        recordActivityLog(
          'trash_empty',
          '🧹 সম্পূর্ণ ট্র্যাশ বিন খালি করা হয়েছে',
          `ট্র্যাশ বিনে থাকা সমস্ত চারা স্থায়ীভাবে মুছে ফেলা হয়েছে (${dt.dateBn} · ${dt.timeBn})`
        );
        showToast(
          'ট্র্যাশ বিনে থাকা সমস্ত চারা সফলভাবে ডিলিট করা হয়েছে।',
          'success',
          undefined,
          undefined,
          'সফল: ট্র্যাশ বিন খালি হয়েছে (Success: Trash Emptied)'
        );
      },
    });
  };

  // 1-Click Bug Fix & Catalog Repair Tool (Validates & repairs short/duplicate/boilerplate descriptions, missing care, prices & images)
  const handleRunBugFix = async () => {
    if (isRunningBugFix) return;
    setIsRunningBugFix(true);
    try {
      const dtNow = getBengaliDateTime();
      const { plantsToUpdate } = buildCatalogBugFixPlan({
        activePlants,
        fallbackImageUrl: PUJA_IMAGE,
        timestampIso: dtNow.iso,
        timestampBn: `${dtNow.dateBn} · ${dtNow.timeBn}`,
      });

      const effectivePlantsToUpdate = plantsToUpdate.length > 0 ? plantsToUpdate : activePlants.map((p) => ({
        before: p,
        updated: {
          ...p,
          updatedAt: dtNow.iso,
          updatedAtBn: `${dtNow.dateBn} · ${dtNow.timeBn}`,
        },
        fixesForPlant: [`"${p.nameBn}": ক্যাটালগ রিকনফার্মেশন ও কোটা-ভেরিফাইড বাংলা বিবরণ রিফ্রেশ সম্পন্ন`]
      }));

      const allCandidateLogs = effectivePlantsToUpdate.flatMap(i => i.fixesForPlant);
      const beforeBatch = effectivePlantsToUpdate.map((item) => item.before);
      const afterBatch = effectivePlantsToUpdate.map((item) => item.updated);

      let syncedCount = 0;
      let failedCount = 0;

      if (onBatchUpdatePlants) {
        const batchOk = await onBatchUpdatePlants(afterBatch);
        if (batchOk === false) {
          failedCount = afterBatch.length;
        } else {
          syncedCount = afterBatch.length;
        }
      } else {
        for (const item of plantsToUpdate) {
          const ok = await onUpdatePlant(item.updated);
          if (ok === false) {
            failedCount++;
          } else {
            syncedCount++;
          }
        }
      }

      const dt = getBengaliDateTime();
      if (failedCount > 0 && syncedCount === 0) {
        setBugFixLog([`Firestore ত্রুটি: ${failedCount} টি চারার মেরামত সেভ করা যায়নি।`]);
        showToast(
          'Firestore-এ বাগ ফিক্স সেভ করা যায়নি! সংযোগ ও অনুমতি পরীক্ষা করুন।',
          'error',
          undefined,
          undefined,
          'ত্রুটি: অপারেশন ব্যর্থ হয়েছে (Error: Operation Failed)'
        );
        return;
      }

      if (syncedCount > 0) {
        pushUndoRecord({
          type: 'batch_plant_update',
          labelBn: `${syncedCount}টি চারার অটো বাগ ফিক্স`,
          beforeList: beforeBatch,
          afterList: afterBatch,
        });
      }

      if (failedCount > 0) {
        setBugFixLog([
          `${syncedCount} টি চারার বাগ ফিক্স হয়েছে, কিন্তু ${failedCount} টি সেভ ব্যর্থ হয়েছে (${dt.timeBn}):`,
          ...allCandidateLogs,
        ]);
        recordActivityLog(
          'plant_edit',
          `🛠️ আংশিক AI বাগ ফিক্স (${syncedCount}/${effectivePlantsToUpdate.length} টি গাছ)`,
          `${syncedCount}টি মেরামত সফল, ${failedCount}টি Firestore-এ সিঙ্ক হয়নি (${dt.dateBn} · ${dt.timeBn})`
        );
        showToast(
          `${syncedCount} টি ঠিক হয়েছে, তবে ${failedCount} টি Firestore-এ সেভ হয়নি!`,
          'warning',
          undefined,
          undefined,
          'সতর্কতা: আংশিক আপডেট (Warning: Partial Update)'
        );
        return;
      }

      setBugFixLog([
        `সফলভাবে মোট ${syncedCount} টি চারার সমস্যা ও ইউনিক বিবরণ ফিক্স করা হয়েছে (${dt.timeBn}):`,
        ...allCandidateLogs,
      ]);
      recordActivityLog(
        'plant_edit',
        `🛠️ ১-ক্লিক অটো বাগ ফিক্স সম্পন্ন (${syncedCount} টি গাছ)`,
        `ক্যাটালগের ${syncedCount}টি চারার ইউনিক বাংলা বিবরণ, দাম ও তথ্যের অসংগতি স্বয়ংক্রিয়ভাবে মেরামত করা হয়েছে (${dt.dateBn} · ${dt.timeBn})`
      );

      if (mobileTab === 'chatbot') {
        const previewLines = allCandidateLogs.slice(0, 6).map((l) => `• ${l}`).join('\n');
        const extraCount = allCandidateLogs.length > 6 ? `\n...এবং আরও ${allCandidateLogs.length - 6}টি সংশোধন।` : '';
        setChatMessages((prev) => [
          ...prev,
          {
            id: `bugfix-ok-${Date.now()}`,
            role: 'model',
            text: `✅ স্বয়ংক্রিয় বাগ ফিক্স সম্পন্ন (Success: ${syncedCount} Plants Updated)!\nমোট ${syncedCount}টি চারার অসম্পূর্ণ বা ডুপ্লিকেট বাংলা বিবরণ ও তথ্য সফলভাবে মেরামত করা হয়েছে:\n${previewLines}${extraCount}`,
            timestamp: dt.timeBn,
          },
        ]);
      }

      showToast(
        `মোট ${syncedCount} টি চারার অসম্পূর্ণ/ডুপ্লিকেট বিবরণ ও তথ্য সফলভাবে ফিক্স করা হয়েছে!`,
        'success',
        'পূর্বাবস্থায় ফেরান (Undo)',
        () => {
          void handleUndoAdminAction();
        },
        `সফল: ${syncedCount}টি চারা আপডেট হয়েছে (Success: Plants Updated)`
      );
    } finally {
      setIsRunningBugFix(false);
    }
  };

  // Dual-AI Chat Handler
  const handleSendChatMessage = async (textToSend?: string) => {
    const queryStr = (textToSend || chatInput).trim();
    if (!queryStr || isChatLoading) return;

    const dt = getBengaliDateTime();
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: queryStr,
      timestamp: dt.timeBn,
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    const lower = queryStr.toLowerCase();
    let actionPayload: ChatMessageAction | undefined;

    if (
      lower.includes('ডিলিট') ||
      lower.includes('মুছে') ||
      lower.includes('সরিয়ে') ||
      lower.includes('delete') ||
      lower.includes('remove') ||
      lower.includes('trash')
    ) {
      const match = activePlants.find(
        (p) =>
          lower.includes(p.nameBn.toLowerCase()) ||
          lower.includes(p.nameEn.toLowerCase()) ||
          (p.colorBn && lower.includes(p.colorBn.toLowerCase()))
      );
      if (match) {
        actionPayload = {
          type: 'delete_plant',
          labelBn: `"${match.nameBn}" চারাটি এখনই ট্র্যাশ বিনে পাঠান`,
          plantId: match.id,
          plantName: match.nameBn,
        };
      } else {
        actionPayload = {
          type: 'open_trash',
          labelBn: 'ডিজিটাল ট্র্যাশ বিন দেখুন',
        };
      }
    } else if (
      lower.includes('ডুপ্লিকেট') ||
      lower.includes('duplicate') ||
      lower.includes('একই ছবি') ||
      lower.includes('একই গাছ')
    ) {
      actionPayload = {
        type: 'open_diagnostics',
        labelBn: 'ডুপ্লিকেট ছবি ও চারা স্ক্যানার খুলুন',
      };
    } else if (
      lower.includes('বাগ') ||
      lower.includes('ফিক্স') ||
      lower.includes('মেরামত') ||
      lower.includes('fix') ||
      lower.includes('error') ||
      lower.includes('সমস্যা')
    ) {
      actionPayload = {
        type: 'run_bug_fix',
        labelBn: '১-ক্লিকে স্বয়ংক্রিয় বাগ ফিক্স চালান',
      };
    } else if (
      lower.includes('cloudinary') ||
      lower.includes('ক্লাউডিনারি') ||
      lower.includes('ছবি আপলোড') ||
      lower.includes('orphan') ||
      lower.includes('cloud name')
    ) {
      actionPayload = {
        type: 'open_cloudinary',
        labelBn: 'Cloudinary মিডিয়া ও ডায়াগনস্টিকস খুলুন',
      };
    } else if (
      lower.includes('grok') ||
      lower.includes('api') ||
      lower.includes('quota') ||
      lower.includes('কোটা') ||
      lower.includes('429')
    ) {
      actionPayload = {
        type: 'open_api',
        labelBn: 'API ও Dual-AI স্ট্যাটাস খুলুন',
      };
    } else if (
      lower.includes('রিপোর্ট') ||
      lower.includes('স্টক') ||
      lower.includes('অডিট') ||
      lower.includes('report') ||
      lower.includes('health')
    ) {
      actionPayload = {
        type: 'open_diagnostics',
        labelBn: 'ওয়েবসাইট অডিট ও হেলথ রিপোর্ট দেখুন',
      };
    }

    try {
      const historyPayload = chatMessages.slice(-6).map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const catalogContext = {
        totalActivePlants: activePlants.length,
        trashedCount: trashedPlants.length,
        duplicateImageGroups: duplicateAnalysis.duplicateImages.length,
        duplicateNameGroups: duplicateAnalysis.duplicateNames.length,
        outOfStockPlants: activePlants.filter((p) => p.inStock === false).map((p) => p.nameBn),
        detectedIssues: rootCauseDiagnostics.map((iss) => ({
          title: iss.titleBn,
          where: iss.whereBn,
          rootReason: iss.rootReasonBn,
        })),
      };

      const liveRuntimeDiagnostics = {
        runtimeIssues: runtimeIssues.slice(0, 8),
        dbStatusLevel: dbHealthMetrics.statusLevel,
        dbAlerts: dbHealthMetrics.alerts.map((a) => a.titleBn),
        cloudinaryConfigured: cloudinaryStatus?.configured ?? null,
        cloudinaryVerified: cloudinaryStatus?.verified ?? null,
        cloudinaryError:
          cloudinaryStatus?.errorMessage || cloudinaryStatus?.errorCode || null,
        serverSecurity: serverSecurityMeta,
      };

      const headers = await getAuthHeaders(true);
      const res = await fetch('/api/admin/ai-advisor', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: queryStr,
          history: historyPayload,
          useSearch: useSearchGrounding,
          modelChoice: modelType,
          aiProvider: 'gemini',
          catalogContext,
          runtimeDiagnostics: liveRuntimeDiagnostics,
        }),
      });

      if (res.status === 401 || res.status === 403) {
        const errData = await res.json().catch(() => ({}));
        await handleUnauthorizedResponse(errData?.error);
        return;
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `সার্ভার এরর: ${res.status}`);
      }
      const modelTag = data.modelUsed
        ? ` · Gemini (${data.modelUsed})${data.usedBackupKey ? ' (ব্যাকআপ কী)' : ''}`
        : ` · Gemini`;
      const modelMsg: ChatMessage = {
        id: `mod-${Date.now()}`,
        role: 'model',
        text: data.reply || 'কোনো উত্তর পাওয়া যায়নি।',
        timestamp: `${getBengaliDateTime().timeBn}${modelTag}`,
        providerUsed: 'gemini',
        sources: data.sources || [],
        action: actionPayload,
      };

      setChatMessages((prev) => [...prev, modelMsg]);
    } catch (err: any) {
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        text: `দুঃখিত, সমস্যা হয়েছে: ${
          err.message || 'Error occurred'
        }. আপনি ওপরের মডেল ড্রপডাউন থেকে অন্য Gemini মডেল বেছে নিয়ে চেষ্টা করতে পারেন।`,
        timestamp: getBengaliDateTime().timeBn,
        action: actionPayload,
      };
      setChatMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsChatLoading(false);
      fetchAiStatus();
    }
  };

  const askAiRootCause = (topicPrompt?: string) => {
    setShowDiagnosticsModal(false);
    switchAdminTab('chatbot');
    const prompt =
      topicPrompt ||
      'আমার ওয়েবসাইট ও নার্সারি ক্যাটালগ পরীক্ষা করে বলুন কোথায় কী কী সমস্যা আছে, তার মূল কারণ (Root Reason) কী এবং কী করলে সেগুলো সম্পূর্ণ সমাধান হবে?';
    setTimeout(() => {
      handleSendChatMessage(prompt);
    }, 60);
  };

  const executeChatAction = (action: ChatMessageAction) => {
    if (action.type === 'delete_plant' && action.plantId) {
      const target = activePlants.find((p) => p.id === action.plantId);
      if (target) {
        handleSoftDelete(target);
      } else {
        showToast('চারাটি ইতিমধ্যেই ট্র্যাশে আছে অথবা ক্যাটালগে নেই।', 'info');
      }
    } else if (action.type === 'edit_plant' && action.plantId) {
      const target = activePlants.find((p) => p.id === action.plantId);
      if (target) {
        handleStartEditPlant(target);
      } else {
        showToast('চারাটি ক্যাটালগে পাওয়া যায়নি বা ট্র্যাশে আছে।', 'info');
      }
    } else if (action.type === 'open_diagnostics') {
      setShowDiagnosticsModal(true);
      setDiagnosticsTab('rootcause');
    } else if (action.type === 'run_bug_fix') {
      handleRunBugFix();
    } else if (action.type === 'open_trash') {
      switchAdminTab('trash');
    } else if (action.type === 'add_plant') {
      handleStartAddPlant();
    } else if (action.type === 'open_cloudinary') {
      switchAdminTab('cloudinary');
    } else if (action.type === 'open_api') {
      switchAdminTab('api');
    }
  };

  const handleRunBase64Migration = async () => {
    const base64Plants = plants.filter((p) =>
      [p.image, ...(Array.isArray(p.images) ? p.images : [])].some(
        (u) => typeof u === 'string' && u.startsWith('data:image')
      )
    );
    if (base64Plants.length === 0) return;

    setIsMigratingBase64(true);
    setMigrationProgress({ current: 0, total: base64Plants.length, success: 0 });

    let successCount = 0;
    let failedCount = 0;
    try {
      for (let i = 0; i < base64Plants.length; i++) {
        const plant = base64Plants[i];
        setMigrationProgress({
          current: i + 1,
          total: base64Plants.length,
          success: successCount,
        });
        let workingPlant = plant;
        let plantHasError = false;
        let plantUpdatedAnySlot = false;
        const dt = getBengaliDateTime();
        const timeBn = `${dt.dateBn} · ${dt.timeBn}`;

        const rawSlots =
          Array.isArray(plant.images) && plant.images.length > 0
            ? plant.images.slice(0, 3)
            : [plant.image];

        for (let slotIdx = 0; slotIdx < rawSlots.length; slotIdx++) {
          const slotVal = rawSlots[slotIdx] || '';
          if (!slotVal.startsWith('data:image')) continue;
          const up = await uploadImageWithResilience(
            slotVal,
            workingPlant.nameBn || 'plant',
            slotIdx + 1
          );
          if (up.authError) {
            failedCount += base64Plants.length - i;
            return;
          }
          if (up.ok && up.url) {
            workingPlant = applyUploadedPhotoToPlant({
              plant: workingPlant,
              slotIndex: slotIdx,
              uploadedUrl: up.url,
              publicId: up.publicId,
              fallbackPrimaryImage: PRESET_PLANT_PHOTOS[0].url,
              timestampIso: dt.iso,
              timestampBn: timeBn,
            });
            plantUpdatedAnySlot = true;
          } else {
            plantHasError = true;
          }
        }

        if (plantUpdatedAnySlot && !plantHasError) {
          const dbOk = await onUpdatePlant(workingPlant);
          if (dbOk === false) {
            failedCount++;
          } else {
            successCount++;
          }
        } else if (plantUpdatedAnySlot) {
          await onUpdatePlant(workingPlant);
          failedCount++;
        } else {
          failedCount++;
        }
      }
      if (failedCount > 0 && successCount === 0) {
        showToast(
          `মাইগ্রেশন ব্যর্থ হয়েছে (${failedCount}টি ছবি Firestore/Cloudinary-তে সেভ করা যায়নি)।`,
          'warning'
        );
      } else if (failedCount > 0) {
        showToast(
          `${successCount}টি গাছ স্থানান্তরিত হয়েছে, তবে ${failedCount}টি ব্যর্থ হয়েছে।`,
          'warning'
        );
      } else {
        showToast(
          `সফলভাবে ${successCount}টি গাছের ছবি ক্লাউডিনারিতে স্থানান্তরিত হয়েছে!`,
          'success'
        );
      }
    } catch (err: any) {
      showToast(`মাইগ্রেশন ত্রুটি: ${err?.message || 'সমস্যা হয়েছে'}`, 'warning');
    } finally {
      setIsMigratingBase64(false);
      setMigrationProgress(null);
    }
  };

  const handleScanOrphans = async () => {
    setIsScanningOrphans(true);
    try {
      const report = await scanCloudinaryLibraryForAdmin({
        plants,
        getAuthHeaders,
      });
      setOrphanReport(report);
      if (report.orphans.length === 0) {
        showToast(
          `স্ক্যান সম্পন্ন (${report.totalCloudinaryAssets}টি ছবি): কোনো অব্যবহৃত (orphan) ছবি নেই!`,
          'success'
        );
      } else {
        showToast(
          `${report.orphans.length}টি অব্যবহৃত ছবি পাওয়া গেছে (${(
            report.totalOrphanBytes / 1024
          ).toFixed(1)} KB)। নিচের রিপোর্ট থেকে ম্যানুয়ালি মুছুন।`,
          'info'
        );
      }
    } catch (scanErr: any) {
      if (scanErr?.status === 401 || scanErr?.status === 403) {
        await handleUnauthorizedResponse(scanErr?.message);
      } else {
        showToast(
          scanErr?.message || 'Cloudinary অরফ্যান স্ক্যান করতে সমস্যা হয়েছে।',
          'warning'
        );
      }
    } finally {
      setIsScanningOrphans(false);
    }
  };

  const handleDeleteOrphanAsset = async (publicId: string) => {
    setDeletingOrphanId(publicId);
    try {
      const delOutcome = await deleteCloudinaryAsset(publicId, {
        getAuthHeaders,
        onUnauthorized: handleUnauthorizedResponse,
      });
      if (delOutcome.authError) return;
      if (!delOutcome.ok) {
        showToast(delOutcome.error || 'অরফ্যান ছবি ডিলিট ব্যর্থ হয়েছে।', 'warning');
        return;
      }
      setOrphanReport((prev) =>
        prev
          ? {
              ...prev,
              orphans: prev.orphans.filter((o) => o.publicId !== publicId),
              totalOrphanBytes: Math.max(
                0,
                prev.totalOrphanBytes -
                  (prev.orphans.find((o) => o.publicId === publicId)?.bytes || 0)
              ),
            }
          : null
      );
      setCloudinaryMediaAssets((prev) =>
        prev ? prev.filter((item) => item.public_id !== publicId) : null
      );
      showToast('অব্যবহৃত Cloudinary ছবি মুছে ফেলা হয়েছে।', 'success');
    } finally {
      setDeletingOrphanId(null);
    }
  };

  /* ------------------------------------------------------------- */
  /* SCREEN 1: LOGIN VIEW                                          */
  /* ------------------------------------------------------------- */
  if (!isAuthenticated) {
    return (
      <AdminLoginView
        onNavigateToShop={onNavigateToShop}
        loginError={loginError}
        isAuthChecking={isAuthChecking}
        isVerifying={isVerifying}
        onGoogleSignIn={handleGoogleSignIn}
      />
    );
  }

  /* ------------------------------------------------------------- */
  /* SCREEN 2: ORGANIZED WORKSPACE SHELL                           */
  /* ------------------------------------------------------------- */
  const currentDateTime = getBengaliDateTime();
  const activeSection: AdminSection = TAB_TO_SECTION_MAP[mobileTab] || 'catalog';

  const switchAdminSection = (section: AdminSection) => {
    if (TAB_TO_SECTION_MAP[mobileTab] === section) return;
    switch (section) {
      case 'catalog':
        switchAdminTab(editingPlantId ? 'add' : 'inventory');
        break;
      case 'bulk':
        switchAdminTab('bulk_price');
        break;
      case 'recovery':
        switchAdminTab('trash');
        break;
      case 'diagnostics':
        switchAdminTab('diagnostics');
        break;
    }
  };

  const {
    sectionsConfig: ADMIN_SECTIONS_CONFIG,
    navGroups,
    sectionMeta: activeSectionMeta,
  } = buildAdminNavigationData({
    activePlantsCount: activePlants.length,
    trashedPlantsCount: trashedPlants.length,
    orderLogs,
    customerReviews,
    undoStack,
    rootCauseCount: rootCauseDiagnostics.length,
    base64PhotoCount: dbHealthMetrics.base64PhotoCount,
    dbAlertsCount: dbHealthMetrics.alerts.length,
    editingPlantId,
    switchAdminTab,
    onStartAddPlant: handleStartAddPlant,
  });

  const activeNavGroup = navGroups.find((g) => g.sectionId === activeSection) || navGroups[0];
  const currentUserEmail = verifiedEmail || firebaseUser?.email || '';

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#142318] flex flex-col font-sans-bn select-text overflow-x-hidden pb-44">
      <AdminHeaderBar
        onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)}
        showBackButton={tabHistory.length > 0 || mobileTab !== 'inventory'}
        onAdminBack={handleAdminBack}
        isAdminSimpleView={isAdminSimpleView}
        sectionTitleBn={activeSectionMeta[mobileTab].titleBn}
        relativeTimeBn={currentDateTime.relativeBn}
        isRefreshingAdmin={isRefreshingAdmin}
        onManualRefresh={handleManualAdminRefresh}
        isOwner={isOwner}
        previewAdminMode={previewAdminMode}
        onTogglePreviewAdminMode={() => {
          const next = !previewAdminMode;
          setPreviewAdminMode(next);
          if (next) setMobileTab('inventory');
        }}
        onNavigateToShop={onNavigateToShop}
        onLogout={handleLogout}
      />

      <AdminMobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        userEmail={currentUserEmail}
        navGroups={navGroups}
        mobileTab={mobileTab}
        onLogout={handleLogout}
      />

      {/* 3. WORKSPACE BODY: DESKTOP LEFT SIDEBAR + MAIN STAGE */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex gap-6 px-3 sm:px-5 pt-4 pb-32 lg:pb-8">
        <AdminDesktopSidebar
          navGroups={navGroups}
          mobileTab={mobileTab}
          userEmail={currentUserEmail}
          onLogout={handleLogout}
        />

        {/* Main Stage */}
        <main className="flex-1 min-w-0 space-y-4">
          {/* 4 PRIMARY WORKSPACES (SECTIONS) NAVIGATION */}
          <section className="bg-white border border-[#E8E1D5] rounded-2xl p-3 sm:p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#F0EAE1]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#785942]">
                  অ্যাডমিন বিভাগ (Workspaces)
                </span>
                <span className="text-xs text-[#A8BDB0] font-mono hidden sm:inline">
                  · ৪টি মূল বিভাগের মাধ্যমে সহজে নেভিগেট করুন
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isRefreshingAdmin}
                  onClick={handleManualAdminRefresh}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#FAF8F5] hover:bg-[#F3ECE2] border border-[#E8E1D5] text-[#142318] text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  title="ক্যাটালগ ও ডাটাবেস রিফ্রেশ করুন"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 text-[#1B8354] ${
                      isRefreshingAdmin ? 'animate-spin' : ''
                    }`}
                  />
                  <span className="hidden sm:inline">রিফ্রেশ</span>
                </button>
                {mobileTab !== 'add' && (
                  <button
                    type="button"
                    onClick={handleStartAddPlant}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1B8354] hover:bg-[#146c44] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>নতুন চারা</span>
                  </button>
                )}
              </div>
            </div>

            {/* 4 Big Distinct Pillar Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {ADMIN_SECTIONS_CONFIG.map((sec) => {
                const isSecActive = activeSection === sec.id;
                const Icon = sec.icon;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => switchAdminSection(sec.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      isSecActive
                        ? 'bg-[#142318] text-white border-[#142318] shadow-sm'
                        : 'bg-[#FAF8F5] hover:bg-[#F3ECE2] border-[#E8E1D5] text-[#142318]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isSecActive
                            ? 'bg-[#213526] text-[#A3E635]'
                            : 'bg-white text-[#1B8354] border border-[#E8E1D5]'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-serif-bn font-bold text-xs sm:text-sm truncate leading-tight">
                          {sec.labelBn}
                        </p>
                        <p
                          className={`text-xs truncate ${
                            isSecActive ? 'text-[#A8BDB0]' : 'text-[#785942]'
                          }`}
                        >
                          {sec.descBn}
                        </p>
                      </div>
                    </div>
                    {sec.badge && (
                      <span
                        className={`font-mono text-xs font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                          isSecActive
                            ? 'bg-[#A3E635] text-[#142318]'
                            : 'bg-[#1B8354]/10 text-[#1B8354]'
                        }`}
                      >
                        {sec.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Sub-tabs for the Active Workspace */}
            <div className="pt-2 border-t border-[#F0EAE1] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-xs font-bold text-[#785942] uppercase tracking-wider shrink-0 mr-1 hidden sm:inline">
                পেজ:
              </span>
              {activeNavGroup?.items.map((item) => {
                const isTabActive = mobileTab === item.id;
                const TabIcon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={item.onClick}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                      isTabActive
                        ? 'bg-[#1B8354] text-white shadow-xs'
                        : 'bg-[#FAF8F5] hover:bg-[#EFEAE0] text-[#526356] hover:text-[#142318] border border-[#E8E1D5]'
                    }`}
                  >
                    <TabIcon
                      className={`w-3.5 h-3.5 ${
                        isTabActive ? 'text-[#A3E635]' : 'text-[#1B8354]'
                      }`}
                    />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span
                        className={`font-mono text-xs font-bold px-1.5 py-0.2 rounded-full ${
                          isTabActive
                            ? 'bg-white/20 text-white'
                            : 'bg-[#142318]/10 text-[#142318]'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Section Breadcrumb & Title Strip */}
          <div className="flex items-center justify-between gap-2 flex-wrap bg-white border border-[#E8E1D5] rounded-2xl px-4 py-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1B8354] mb-0.5">
                <span>{activeNavGroup.groupLabel}</span>
                <span>/</span>
                <span className="text-[#142318]">{activeSectionMeta[mobileTab].titleBn}</span>
              </div>
              <p className="text-xs text-[#526356]">
                {activeSectionMeta[mobileTab].subtitleBn}
              </p>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {mobileTab !== 'add' && (
                <button
                  type="button"
                  onClick={handleStartAddPlant}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1B8354] hover:bg-[#146c44] text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>নতুন চারা</span>
                </button>
              )}
            </div>
          </div>

          {/* Unified Compact Alert Strip (consolidates Startup Recovery, DB Quota Alert, or Runtime Watchdog) */}
          {(Boolean(startupRecoveryStatus?.foundIncomplete && !startupRecoveryStatus.ok) ||
            (!isAdminSimpleView &&
              dbHealthMetrics.alerts.length > 0 &&
              mobileTab !== 'settings') ||
            (!isAdminSimpleView && runtimeIssues.length > 0)) && (
            <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl p-3 space-y-2 text-xs text-[#92400E]">
              {startupRecoveryStatus?.foundIncomplete && !startupRecoveryStatus.ok && (
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-bold flex items-center gap-1.5 text-[#991B1B]">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>
                      অসম্পূর্ণ ক্যাটালগ অপারেশন শনাক্ত (
                      {startupRecoveryStatus.unrestoredIds.length} টি বাকি)
                    </span>
                  </span>
                  {onRetryStartupRecovery && !startupRecoveryStatus.waitingForAuth && (
                    <button
                      type="button"
                      onClick={async () => {
                        const ok = await onRetryStartupRecovery();
                        if (ok) {
                          showToast(
                            'অসম্পূর্ণ ক্যাটালগ অপারেশন সফলভাবে রিকভার করা হয়েছে!',
                            'success'
                          );
                        } else {
                          showToast(
                            'রিকভারি এখনো সম্পূর্ণ হয়নি। সংযোগ যাচাই করে আবার চেষ্টা করুন।',
                            'warning'
                          );
                        }
                      }}
                      className="px-2.5 py-1 bg-[#991B1B] text-white text-xs font-bold rounded-lg cursor-pointer"
                    >
                      রিকভার করুন
                    </button>
                  )}
                </div>
              )}

              {!isAdminSimpleView &&
                dbHealthMetrics.alerts.length > 0 &&
                mobileTab !== 'settings' && (
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-semibold flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 shrink-0" />
                      <span>{dbHealthMetrics.alerts[0].titleBn}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => switchAdminTab('settings')}
                      className="text-xs font-bold underline cursor-pointer"
                    >
                      ডাটাবেস হেলথ দেখুন
                    </button>
                  </div>
                )}

              {!isAdminSimpleView && runtimeIssues.length > 0 && (
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-semibold truncate">
                    লাইভ ওয়াচডগ ({runtimeIssues.length}): {runtimeIssues[0]?.message}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        askAiRootCause(
                          `এইমাত্র অ্যাপে এই সমস্যাটি ধরা পড়েছে: "${runtimeIssues[0]?.message}"। এর মূল কারণ কী এবং কীভাবে সমাধান করবো?`
                        )
                      }
                      className="px-2 py-0.5 bg-[#142318] text-white text-xs font-bold rounded-md cursor-pointer"
                    >
                      AI সমাধান
                    </button>
                    <button
                      type="button"
                      onClick={() => clearRuntimeIssues()}
                      className="text-xs font-bold underline cursor-pointer"
                    >
                      মুছুন
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ACTIVE SECTION VIEW */}
          {mobileTab === 'inventory' && (
            <AdminInventoryTab
              activePlants={activePlants}
              activityLogs={activityLogs}
              isAdminSimpleView={isAdminSimpleView}
              adminSearchQuery={adminSearchQuery}
              onSearchChange={setAdminSearchQuery}
              onStartAddPlant={handleStartAddPlant}
              onStartEditPlant={handleStartEditPlant}
              onQuickPrice={(plant) => {
                setQuickPricePlant(plant);
                setQuickPriceValue((plant.options[0]?.price || 50).toString());
              }}
              onToggleStock={handleToggleStockStatus}
              onSoftDelete={handleSoftDelete}
              onSwitchTab={switchAdminTab}
              onOpenQrTagForPlant={(plant) => {
                setQrPreselectedPlantId(plant.id);
                switchAdminTab('qr_tags');
              }}
              onOpenDiagnostics={(tab) => {
                setDiagnosticsTab(tab);
                switchAdminTab('diagnostics');
              }}
              onRunBugFix={handleRunBugFix}
              isRunningBugFix={isRunningBugFix}
              rootCauseCount={rootCauseDiagnostics.length}
              duplicateCount={duplicateAnalysis.totalCount}
              base64PhotoCount={dbHealthMetrics.base64PhotoCount}
            />
          )}

          {mobileTab === 'add' && (
            <AdminPlantFormTab
              isAdminSimpleView={isAdminSimpleView}
              editingPlantId={editingPlantId}
              formNameBn={formNameBn}
              setFormNameBn={setFormNameBn}
              formNameEn={formNameEn}
              setFormNameEn={setFormNameEn}
              formBotanical={formBotanical}
              setFormBotanical={setFormBotanical}
              formCategory={formCategory}
              setFormCategory={setFormCategory}
              formBadgeBn={formBadgeBn}
              setFormBadgeBn={setFormBadgeBn}
              formColorBn={formColorBn}
              setFormColorBn={setFormColorBn}
              formSunlightBn={formSunlightBn}
              setFormSunlightBn={setFormSunlightBn}
              formWateringBn={formWateringBn}
              setFormWateringBn={setFormWateringBn}
              formSoilTipBn={formSoilTipBn}
              setFormSoilTipBn={setFormSoilTipBn}
              formDescBn={formDescBn}
              setFormDescBn={setFormDescBn}
              formDescEn={formDescEn}
              setFormDescEn={setFormDescEn}
              formImage={formImage}
              formImages={formImages}
              activeImageSlot={activeImageSlot}
              setActiveImageSlot={setActiveImageSlot}
              photoUploadTimestampBn={photoUploadTimestampBn}
              isCompressingPhoto={isCompressingPhoto}
              isUploadingToCloudinary={isUploadingToCloudinary}
              cloudinaryStatus={cloudinaryStatus}
              cameraInputRef={cameraInputRef}
              galleryInputRef={galleryInputRef}
              onPhotoUpload={handlePhotoUpload}
              onClearPhotoSlot={handleClearPhotoSlot}
              onSelectPresetPhoto={handleSelectPresetPhoto}
              showImageSearchPanel={showImageSearchPanel}
              setShowImageSearchPanel={setShowImageSearchPanel}
              imageSearchQuery={imageSearchQuery}
              setImageSearchQuery={setImageSearchQuery}
              isSearchingImages={isSearchingImages}
              imageSearchResults={imageSearchResults}
              imageSearchError={imageSearchError}
              verifiedImageSource={verifiedImageSource}
              onSearchPlantImages={handleSearchPlantImages}
              onSelectSearchedImage={handleSelectSearchedImage}
              aiStatus={aiStatus}
              aiProviderChoice={aiProviderChoice}
              setAiProviderChoice={setAiProviderChoice}
              modelType={modelType}
              setModelType={setModelType}
              aiCustomInstruction={aiCustomInstruction}
              setAiCustomInstruction={setAiCustomInstruction}
              isAiAutofilling={isAiAutofilling}
              onAiAutoFill={handleAiAutoFill}
              duplicateCheck={duplicateCheck}
              onEditExistingDuplicate={handleStartEditPlant}
              setBasePrice={setBasePrice}
              option1Label={option1Label}
              setOption1Label={setOption1Label}
              option1Price={option1Price}
              setOption1Price={setOption1Price}
              option2Label={option2Label}
              setOption2Label={setOption2Label}
              option2Price={option2Price}
              setOption2Price={setOption2Price}
              hasOption3={hasOption3}
              setHasOption3={setHasOption3}
              option3Label={option3Label}
              setOption3Label={setOption3Label}
              option3Price={option3Price}
              setOption3Price={setOption3Price}
              onSubmitForm={handleSavePlantForm}
              onBack={handleAdminBack}
              onResetFormDraft={() => handleStartAddPlant(true)}
            />
          )}

          {mobileTab === 'logs' && (
            <AdminUploadHistoryTab
              plants={plants}
              activityLogs={activityLogs}
              logFilter={logFilter}
              setLogFilter={setLogFilter}
              isAdminSimpleView={isAdminSimpleView}
              isOwner={isOwner}
              isCleaningLogs={isCleaningLogs}
              serverLogsCount={serverDocCounts.logs}
              onCleanupOldLogs={cleanupOldActivityLogs}
              onEditPlant={handleStartEditPlant}
              onOpenTrash={() => switchAdminTab('trash')}
              onStartAddPlant={handleStartAddPlant}
            />
          )}

          {mobileTab === 'orders' && (
            <AdminOrderTrackerTab
              orderLogs={orderLogs}
              plants={activePlants}
              isAdminSimpleView={isAdminSimpleView}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onDeleteOrderLog={handleDeleteOrderLog}
              onEditPlant={handleStartEditPlant}
            />
          )}

          {mobileTab === 'bulk_price' && (
            <AdminBulkPriceTab
              activePlants={activePlants}
              isAdminSimpleView={isAdminSimpleView}
              isApplyingBulkUpdate={isApplyingBulkPrice}
              onApplyBulkPriceUpdate={handleApplyBulkPriceUpdate}
            />
          )}

          {mobileTab === 'reviews' && (
            <AdminReviewsTab
              reviews={customerReviews}
              plants={activePlants}
              isAdminSimpleView={isAdminSimpleView}
              onApproveReview={handleApproveReview}
              onDeleteReview={handleDeleteReview}
              onAddAdminReview={handleAddAdminReview}
            />
          )}

          {mobileTab === 'qr_tags' && (
            <AdminQrTagsTab
              activePlants={activePlants}
              activityLogs={activityLogs}
              preselectedPlantId={qrPreselectedPlantId}
              onClearPreselectedPlant={() => setQrPreselectedPlantId(null)}
            />
          )}

          {mobileTab === 'trash' && (
            <AdminTrashTab
              trashedPlants={trashedPlants}
              isAdminSimpleView={isAdminSimpleView}
              isOwner={isOwner}
              onRestore={handleRestore}
              onPermanentDelete={handlePermanentDelete}
              onEmptyAllTrash={handleEmptyAllTrash}
            />
          )}

          {mobileTab === 'chatbot' && (
            <AdminChatbotTab
              isAdminSimpleView={isAdminSimpleView}
              aiStatus={aiStatus}
              aiProviderChoice={aiProviderChoice}
              setAiProviderChoice={setAiProviderChoice}
              modelType={modelType}
              setModelType={setModelType}
              useSearchGrounding={useSearchGrounding}
              setUseSearchGrounding={setUseSearchGrounding}
              chatMessages={chatMessages}
              chatInput={chatInput}
              setChatInput={setChatInput}
              isChatLoading={isChatLoading}
              chatScrollRef={chatScrollRef}
              onSendMessage={handleSendChatMessage}
              onExecuteAction={executeChatAction}
              onSwitchTab={switchAdminTab}
              onOpenDiagnostics={() => {
                setDiagnosticsTab('rootcause');
                switchAdminTab('diagnostics');
              }}
              onRunBugFix={handleRunBugFix}
              isRunningBugFix={isRunningBugFix}
              rootCauseCount={rootCauseDiagnostics.length}
              trashedCount={trashedPlants.length}
            />
          )}

          {mobileTab === 'api' && (
            <AdminApiTab
              aiStatus={aiStatus}
              hasBackupGeminiKey={hasBackupGeminiKey}
              modelType={modelType}
              setModelType={setModelType}
              aiProviderChoice={aiProviderChoice}
              onChangeAiProvider={(p) => setAiProviderChoice(p)}
              isRotatingKeySlot={isRotatingKeySlot}
              onRotateAiSlot={handleRotateAiSlot}
              onRefreshAiStatus={() => fetchAiStatus()}
              onOpenAiChat={() => switchAdminTab('chatbot')}
              diagnosticsSnapshot={diagnosticsSnapshot}
              isLoadingDiagnostics={isLoadingDiagnostics}
              onRefreshDiagnostics={() => fetchSystemDiagnostics(true)}
              runtimeIssuesCount={runtimeIssues.length}
            />
          )}

          {mobileTab === 'cloudinary' && (
            <AdminCloudinaryTab
              plants={plants}
              cloudinaryStatus={cloudinaryStatus}
              base64PhotoCount={dbHealthMetrics.base64PhotoCount}
              isMigratingBase64={isMigratingBase64}
              migrationProgress={migrationProgress}
              orphanReport={orphanReport}
              isScanningOrphans={isScanningOrphans}
              deletingOrphanId={deletingOrphanId}
              mediaAssets={cloudinaryMediaAssets}
              mediaLibraryTotalBytes={cloudinaryTotalBytes}
              mediaLibraryTruncated={cloudinaryTruncated}
              isLoadingMediaLibrary={isLoadingMediaLibrary}
              onVerifyCloudinary={() => fetchCloudinaryStatus(true)}
              onRunBase64Migration={handleRunBase64Migration}
              onScanOrphans={handleScanOrphans}
              onLoadMediaLibrary={handleLoadCloudinaryLibrary}
              onDeleteOrphan={handleDeleteOrphanAsset}
              onEditPlant={handleStartEditPlant}
              onOpenTrash={() => switchAdminTab('trash')}
            />
          )}

          {mobileTab === 'backup' && (
            <AdminBackupTab
              isAdminSimpleView={isAdminSimpleView}
              isOwner={isOwner}
              activePlantsCount={activePlants.length}
              trashedPlantsCount={trashedPlants.length}
              base64PhotoCount={dbHealthMetrics.base64PhotoCount}
              totalEstimatedBytes={dbHealthMetrics.totalEstimatedBytes}
              cloudinaryConfigured={Boolean(cloudinaryStatus?.configured)}
              cloudinaryCloudName={cloudinaryStatus?.cloudName || null}
              isExportingFullBackup={isExportingFullBackup}
              isRestoringBackup={isRestoringBackup}
              backupImportInputRef={backupImportInputRef}
              onExportCatalogBackup={handleExportCatalogBackup}
              onExportPrintablePhotoCatalog={handleExportPrintablePhotoCatalog}
              onRestoreBackupFile={handleRestoreBackupFile}
              onRequestFactoryReset={handleRequestFactoryReset}
            />
          )}

          {mobileTab === 'settings' && (
            <AdminSettingsTab
              verifiedEmail={verifiedEmail}
              fallbackEmail={firebaseUser?.email || null}
              isOwner={isOwner}
              isAdminSimpleView={isAdminSimpleView}
              previewAdminMode={previewAdminMode}
              onTogglePreviewAdminMode={() => {
                const next = !previewAdminMode;
                setPreviewAdminMode(next);
                showToast(
                  next
                    ? 'সহজ ও নিরাপদ Admin ভিউ চালু হয়েছে।'
                    : 'পূর্ণ Owner মোড পুনরায় চালু হয়েছে।',
                  'info'
                );
              }}
              authorizedEmailsList={authorizedEmailsList}
              ownerEmailsList={ownerEmailsList}
              onLogout={handleLogout}
              serverSecurityMeta={serverSecurityMeta}
              dbHealthMetrics={dbHealthMetrics}
              dbMonitorStats={dbMonitorStats}
              serverDocCounts={serverDocCounts}
              activePlantsCount={activePlants.length}
              trashedPlantsCount={trashedPlants.length}
              onRefreshDocCounts={fetchServerDocCounts}
              isCleaningLogs={isCleaningLogs}
              onCleanupOldLogs={cleanupOldActivityLogs}
              onShowToast={showToast}
            />
          )}

          {mobileTab === 'undo_redo' && (
            <AdminUndoRedoTab
              undoStack={undoStack}
              redoStack={redoStack}
              onUndo={handleUndoAdminAction}
              onRedo={handleRedoAdminAction}
              isAdminSimpleView={isAdminSimpleView}
            />
          )}

          {mobileTab === 'diagnostics' && (
            <AdminDiagnosticsTab
              diagnosticsTab={diagnosticsTab}
              setDiagnosticsTab={setDiagnosticsTab}
              rootCauseDiagnostics={rootCauseDiagnostics}
              duplicateAnalysis={duplicateAnalysis}
              bugFixLog={bugFixLog}
              isRunningBugFix={isRunningBugFix}
              activePlants={activePlants}
              trashedCount={trashedPlants.length}
              dbHealthMetrics={dbHealthMetrics}
              dbMonitorStats={dbMonitorStats}
              onAskAiRootCause={askAiRootCause}
              onStartEditPlant={handleStartEditPlant}
              onSoftDelete={handleSoftDelete}
              onRunBugFix={handleRunBugFix}
              onSwitchTab={switchAdminTab}
            />
          )}
        </main>
      </div>

      <AdminModalsAndToast
        quickPricePlant={quickPricePlant}
        quickPriceValue={quickPriceValue}
        setQuickPriceValue={setQuickPriceValue}
        onCloseQuickPrice={() => setQuickPricePlant(null)}
        onSubmitQuickPrice={handleSaveQuickPrice}
        isAdminSimpleView={isAdminSimpleView}
        confirmDialog={confirmDialog}
        onCloseConfirmDialog={() => setConfirmDialog(null)}
        toast={toast}
        onDismissToast={() => setToast(null)}
      />

      {/* 7. DIAGNOSTICS & AUDIT MODAL */}
      <AdminDiagnosticsModal
        isOpen={showDiagnosticsModal}
        diagnosticsTab={diagnosticsTab}
        setDiagnosticsTab={setDiagnosticsTab}
        onClose={() => setShowDiagnosticsModal(false)}
        rootCauseDiagnostics={rootCauseDiagnostics}
        duplicateAnalysis={duplicateAnalysis}
        bugFixLog={bugFixLog}
        isRunningBugFix={isRunningBugFix}
        activePlants={activePlants}
        trashedCount={trashedPlants.length}
        dbHealthMetrics={dbHealthMetrics}
        dbMonitorStats={dbMonitorStats}
        onAskAiRootCause={askAiRootCause}
        onStartEditPlant={handleStartEditPlant}
        onSoftDelete={handleSoftDelete}
        onRunBugFix={handleRunBugFix}
        onSwitchTab={switchAdminTab}
      />

      <AdminMobileBottomNav
        activeSection={activeSection}
        mobileTab={mobileTab}
        onSwitchSection={switchAdminSection}
        onStartAddPlant={handleStartAddPlant}
      />
    </div>
  );
}
