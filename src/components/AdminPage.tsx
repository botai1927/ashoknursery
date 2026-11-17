import { useState, useRef, useEffect, FormEvent, ChangeEvent, useMemo } from 'react';
import {
  Package,
  Plus,
  Trash2,
  Sparkles,
  ExternalLink,
  Loader2,
  Bot,
  Lock,
  LogOut,
  CheckCircle2,
  Mail,
  ArrowLeft,
  History,
  Smartphone,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  Database,
  Download,
  Eye,
  X,
  Cloud,
  Cpu,
  Menu,
  ShoppingBag,
  Percent,
  Star,
  QrCode,
  Undo2,
  Redo2,
  Activity,
  Layers,
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
  SPARK_DAILY_LIMITS,
  StoredMonitorState,
  getFirestoreUsageStats,
  subscribeFirestoreMonitor,
  trackFirestoreRead,
  trackFirestoreWrite,
  trackFirestoreDelete,
  formatBytesReadable,
} from '../utils/firestoreMonitor';
import {
  persistActivityLogEntry,
  sanitizeActivityLogForFirestore,
  type StartupCatalogRecoveryResult,
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
  saveLocalCustomerReviews,
  submitCustomerReview,
  updateCustomerReviewStatus,
  removeCustomerReview,
} from '../utils/customerReviewsStorage';
import {
  analyzeCatalogRootCauseDiagnostics,
  buildCatalogBugFixPlan,
} from '../utils/catalogBugFixer';

interface AdminPageProps {
  lang: 'bn' | 'en';
  plants: BrahmyamanPlant[];
  onNavigateToShop: () => void;
  onAddPlant: (plant: BrahmyamanPlant) => Promise<boolean> | void;
  onUpdatePlant: (plant: BrahmyamanPlant) => Promise<boolean> | void;
  onBatchUpdatePlants?: (plants: BrahmyamanPlant[]) => Promise<boolean> | void;
  onSoftDeletePlant: (plantId: string) => Promise<boolean> | void;
  onRestorePlant: (plantId: string) => Promise<boolean> | void;
  onPermanentDeletePlant: (plantId: string) => Promise<boolean> | void;
  onEmptyTrash: () => Promise<boolean> | void;
  onResetCatalog: () => Promise<boolean> | void;
  onImportCatalogBackup?: (
    plants: BrahmyamanPlant[],
    restoredDeletedIds?: string[]
  ) => Promise<boolean | void>;
  startupRecoveryStatus?: StartupCatalogRecoveryResult | null;
  onRetryStartupRecovery?: () => Promise<boolean>;
}

interface ConfirmDialogState {
  isOpen: boolean;
  type: 'soft_delete' | 'permanent_delete' | 'empty_trash' | 'reset_catalog' | 'custom_action';
  plant?: BrahmyamanPlant;
  titleBn: string;
  messageBn: string;
  confirmBtnBn: string;
  cancelBtnBn?: string;
  isDanger?: boolean;
  onConfirm: () => void;
}

export type AdminToastType = 'success' | 'error' | 'warning' | 'info';

interface AdminToast {
  id: string;
  titleBn: string;
  messageBn: string;
  type: AdminToastType;
  timestampBn: string;
  actionLabelBn?: string;
  onAction?: () => void;
}

const STORAGE_ACTIVITY_LOG = 'brahmyaman_admin_activity_log_v2';
const AUTHORIZED_ADMIN_EMAILS = [
  'apurbax3@gmail.com',
  'mahataapurba278@gmail.com',
  'amahata169@gmail.com',
];

function safeSetLocalStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch (err: any) {
    console.warn(`LocalStorage quota safe-guard for ${key}:`, err);
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        const lightweight = parsed.map((item: any) => ({
          ...item,
          image: typeof item.image === 'string' && item.image.length > 500 ? '' : item.image,
        }));
        localStorage.setItem(key, JSON.stringify(lightweight));
      }
    } catch {}
  }
}

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
  const [serverSecurityMeta, setServerSecurityMeta] = useState<{
    rateLimitMode: 'firestore-shared' | 'in-memory-fallback';
    rateLimitReason: string | null;
    hasExplicitServiceAccount: boolean;
    revocationMethod: string | null;
  }>({
    rateLimitMode: 'in-memory-fallback',
    rateLimitReason: null,
    hasExplicitServiceAccount: false,
    revocationMethod: null,
  });
  const [ownerEmailsList, setOwnerEmailsList] = useState<string[]>([
    'apurbax3@gmail.com',
    'mahataapurba278@gmail.com',
  ]);
  const [authorizedEmailsList, setAuthorizedEmailsList] = useState<string[]>(AUTHORIZED_ADMIN_EMAILS);
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
          `অননুমোদিত জিমেইল (${user.email || 'অজানা'})! শুধুমাত্র ${AUTHORIZED_ADMIN_EMAILS.join(' অথবা ')} ব্যবহার করুন।`;
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
          descriptionBn: 'ভ্রম্যমাণ নার্সারি কালশুলির পোর্টাল প্রস্তুত।',
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
শুধুমাত্র আপনার অনুমোদিত জিমেইল (${AUTHORIZED_ADMIN_EMAILS.join(' ও ')}) দিয়ে সুরক্ষিত।

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
            const raw = docSnap.data() as CustomerReviewItem & { gardenImage?: string };
            const normalized: CustomerReviewItem = {
              ...raw,
              id: raw.id || docSnap.id,
              photoUrl: raw.photoUrl || raw.gardenImage,
            };
            if (isRemovedFakeReview(normalized)) {
              deleteDoc(docSnap.ref).catch(() => {});
              return;
            }
            remoteReviews.push(normalized);
          });
          if (remoteReviews.length > 0) {
            setCustomerReviews((prev) => {
              const merged = new Map<string, CustomerReviewItem>();
              for (const item of remoteReviews) {
                if (!isRemovedFakeReview(item)) merged.set(item.id, item);
              }
              for (const local of prev) {
                if (!isRemovedFakeReview(local) && !merged.has(local.id)) {
                  merged.set(local.id, local);
                }
              }
              const sorted = Array.from(merged.values()).sort((a, b) =>
                (b.createdAt || '').localeCompare(a.createdAt || '')
              );
              saveLocalCustomerReviews(sorted);
              return sorted;
            });
          }
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
    const updated = await updateCustomerReviewStatus(reviewId, nextStatus);
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

  const dbHealthMetrics = useMemo(() => {
    let totalPlantBytes = 0;
    let largestPlantBytes = 0;
    let largestPlantName = '';
    let base64PhotoCount = 0;

    for (const plant of plants) {
      const bytes = new TextEncoder().encode(JSON.stringify(plant)).length;
      totalPlantBytes += bytes;
      if (bytes > largestPlantBytes) {
        largestPlantBytes = bytes;
        largestPlantName = plant.nameBn;
      }
      const hasBase64Slot = [
        plant.image,
        ...(Array.isArray(plant.images) ? plant.images : []),
      ].some((u) => typeof u === 'string' && u.startsWith('data:image'));
      if (hasBase64Slot) {
        base64PhotoCount += 1;
      }
    }

    const totalLogsBytes = new TextEncoder().encode(JSON.stringify(activityLogs)).length;
    const totalEstimatedBytes = totalPlantBytes + totalLogsBytes;
    const effectivePlantDocs = serverDocCounts.plants ?? plants.length;
    const effectiveLogsDocs = serverDocCounts.logs ?? activityLogs.length;
    const effectiveTotalDocs =
      serverDocCounts.total ?? effectivePlantDocs + effectiveLogsDocs + 1;

    const today = dbMonitorStats.today;
    const readsPct = Math.min(100, Math.round((today.serverReads / SPARK_DAILY_LIMITS.reads) * 100));
    const writesPct = Math.min(100, Math.round((today.writes / SPARK_DAILY_LIMITS.writes) * 100));
    const deletesPct = Math.min(100, Math.round((today.deletes / SPARK_DAILY_LIMITS.deletes) * 100));
    const storagePct = Math.min(
      100,
      Number(((totalEstimatedBytes / SPARK_DAILY_LIMITS.storageBytes) * 100).toFixed(2))
    );
    const largestDocPct = Math.min(
      100,
      Math.round((largestPlantBytes / SPARK_DAILY_LIMITS.maxDocBytes) * 100)
    );

    const readsPerFreshVisitor = Math.max(1, effectivePlantDocs + 1);
    const estimatedDailyVisitorCapacity = Math.floor(
      SPARK_DAILY_LIMITS.reads / readsPerFreshVisitor
    );

    const alerts: Array<{
      id: string;
      severity: 'critical' | 'warning';
      titleBn: string;
      detailBn: string;
      actionBn: string;
    }> = [];

    if (today.serverReads >= SPARK_DAILY_LIMITS.reads * 0.85) {
      alerts.push({
        id: 'reads-critical',
        severity: 'critical',
        titleBn: `জরুরি: দৈনিক রিড ${readsPct}% পূর্ণ (${today.serverReads.toLocaleString()}/৫০,০০০)`,
        detailBn:
          'আজকের Spark ফ্রি দৈনিক রিড সীমা প্রায় শেষ। লিমিট পার হলে ভিজিটররা নতুন আপডেট দেখতে সমস্যায় পড়বেন।',
        actionBn:
          'ক্যাটালগ ক্যাশিং চালু করুন অথবা Firebase Blaze প্ল্যানে বাজেট অ্যালার্ট সহ আপগ্রেড করুন।',
      });
    } else if (today.serverReads >= SPARK_DAILY_LIMITS.reads * 0.7) {
      alerts.push({
        id: 'reads-warning',
        severity: 'warning',
        titleBn: `সতর্কতা: দৈনিক রিড ${readsPct}% ছুঁয়েছে`,
        detailBn: `আজ ${today.serverReads.toLocaleString()} টি সার্ভার রিড হয়েছে (ফ্রি লিমিট ৫০,০০০/দিন)।`,
        actionBn: 'রিড অপ্টিমাইজেশন করলে একই ভিজিটরে ৫০ গুণ কম রিড খরচ হবে।',
      });
    }

    if (today.writes >= SPARK_DAILY_LIMITS.writes * 0.7) {
      alerts.push({
        id: 'writes-threshold',
        severity: today.writes >= SPARK_DAILY_LIMITS.writes * 0.85 ? 'critical' : 'warning',
        titleBn: `দৈনিক রাইট সীমা ${writesPct}% (${today.writes.toLocaleString()}/২০,০০০)`,
        detailBn: 'একই দিনে ঘনঘন ক্যাটালগ এডিট বা বেশি লগ লেখার কারণে রাইট সংখ্যা বাড়ছে।',
        actionBn: 'সব এডিট একসাথে সেরে সেভ করুন ও ব্যাকআপ রাখুন।',
      });
    }

    if (largestPlantBytes >= 750 * 1024) {
      alerts.push({
        id: 'doc-size-critical',
        severity: 'critical',
        titleBn: `১ MB ডকুমেন্ট সীমার কাছে: "${largestPlantName}" (${formatBytesReadable(
          largestPlantBytes
        )})`,
        detailBn:
          'Firestore-এ একটি ডকুমেন্টের সর্বোচ্চ সীমা ১ MB। এর বেশি হলে সেই চারা সেভ হওয়া বন্ধ হয়ে যাবে।',
        actionBn: 'এই চারার ছবিটি ছোট করে আপলোড করুন বা Cloudinary লিংক ব্যবহার করুন।',
      });
    } else if (largestPlantBytes >= 500 * 1024) {
      alerts.push({
        id: 'doc-size-warning',
        severity: 'warning',
        titleBn: `বড় ডকুমেন্ট সাইজ: "${largestPlantName}" (${formatBytesReadable(
          largestPlantBytes
        )})`,
        detailBn: 'মোবাইল ছবির সাইজ ৫০০ KB পেরিয়েছে (১ MB সীমার কাছাকাছি)।',
        actionBn: 'ছবি কমপ্রেস করে সেভ করলে ডেটা ট্রান্সফার দ্রুত ও নিরাপদ থাকবে।',
      });
    }

    if (effectiveLogsDocs >= 400) {
      alerts.push({
        id: 'logs-critical',
        severity: 'critical',
        titleBn: `অ্যাক্টিভিটি লগ অনেক জমেছে (${effectiveLogsDocs} টি ডকুমেন্ট)`,
        detailBn: 'পুরনো অ্যাক্টিভিটি লগ জমতে থাকায় অযথা স্টোরেজ ও রিড খরচ বাড়ছে।',
        actionBn: 'পুরনো লগ অটো-ক্লিনআপ চালু করুন (সর্বশেষ ১০০টি রেখে)।',
      });
    } else if (effectiveLogsDocs >= 150) {
      alerts.push({
        id: 'logs-warning',
        severity: 'warning',
        titleBn: `পুরনো অ্যাক্টিভিটি লগ বাড়ছে (${effectiveLogsDocs} টি ডকুমেন্ট)`,
        detailBn: 'লগ সংখ্যা ১৫০ ছাড়িয়েছে; দীর্ঘমেয়াদে হালকা রাখতে পুরনো লগ পরিষ্কার রাখা ভালো।',
        actionBn: 'প্রয়োজনে পুরনো লগ ক্লিনআপ নীতি চালু করুন।',
      });
    }

    if (base64PhotoCount >= 35) {
      alerts.push({
        id: 'base64-growth',
        severity: 'warning',
        titleBn: `${base64PhotoCount}টি মোবাইল ছবি সরাসরি ডাটাবেসে সেভ আছে`,
        detailBn:
          'বেশি মোবাইল ছবি Firestore-এ থাকলে প্রতি পেজ লোডে ব্যান্ডউইথ (১০ GiB/মাস) দ্রুত খরচ হয়।',
        actionBn: 'Cloudinary ট্যাবে গিয়ে ১-ক্লিকে সব Base64 ছবি মাইগ্রেট করুন।',
      });
    }

    if (estimatedDailyVisitorCapacity < 500) {
      alerts.push({
        id: 'visitor-headroom',
        severity: 'warning',
        titleBn: `দৈনিক ভিজিটর ক্যাপাসিটি কমছে (~${estimatedDailyVisitorCapacity} জন/দিন)`,
        detailBn: `মোট ${effectivePlantDocs}টি চারা থাকায় প্রতি নতুন ভিজিটরে ${readsPerFreshVisitor}টি রিড হচ্ছে।`,
        actionBn: 'রিড-সেভিং ক্যাশ চালু করলে এই সীমা কয়েক হাজার ভিজিটর পর্যন্ত বাড়বে।',
      });
    }

    const statusLevel: 'healthy' | 'warning' | 'critical' = alerts.some(
      (a) => a.severity === 'critical'
    )
      ? 'critical'
      : alerts.length > 0
      ? 'warning'
      : 'healthy';

    return {
      totalPlantBytes,
      totalLogsBytes,
      totalEstimatedBytes,
      largestPlantBytes,
      largestPlantName,
      largestDocPct,
      base64PhotoCount,
      effectivePlantDocs,
      effectiveLogsDocs,
      effectiveTotalDocs,
      readsPct,
      writesPct,
      deletesPct,
      storagePct,
      readsPerFreshVisitor,
      estimatedDailyVisitorCapacity,
      alerts,
      statusLevel,
    };
  }, [plants, activityLogs, dbMonitorStats, serverDocCounts]);

  const inlineImageAsDataUrl = async (rawSrc: string): Promise<string> => {
    const resolved = resolvePlantImageUrl(rawSrc, PUJA_IMAGE);
    if (!resolved) return '';
    if (resolved.startsWith('data:image/')) return resolved;

    const canvasAttempt = (): Promise<string | null> =>
      new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        const timeout = setTimeout(() => resolve(null), 6000);
        img.onload = () => {
          clearTimeout(timeout);
          try {
            const maxDim = 520;
            let w = img.naturalWidth || 400;
            let h = img.naturalHeight || 400;
            if (w > maxDim || h > maxDim) {
              if (w > h) {
                h = Math.max(1, Math.round((h * maxDim) / w));
                w = maxDim;
              } else {
                w = Math.max(1, Math.round((w * maxDim) / h));
                h = maxDim;
              }
            }
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              resolve(null);
              return;
            }
            ctx.drawImage(img, 0, 0, w, h);
            const encoded = canvas.toDataURL('image/jpeg', 0.72);
            resolve(encoded && encoded.startsWith('data:image/') ? encoded : null);
          } catch {
            resolve(null);
          }
        };
        img.onerror = () => {
          clearTimeout(timeout);
          resolve(null);
        };
        img.src = resolved;
      });

    const viaCanvas = await canvasAttempt();
    if (viaCanvas) return viaCanvas;

    try {
      const res = await fetch(resolved, { mode: 'cors' });
      if (res.ok) {
        const blob = await res.blob();
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () =>
            resolve(typeof reader.result === 'string' ? reader.result : '');
          reader.onerror = () => resolve('');
          reader.readAsDataURL(blob);
        });
        if (dataUrl.startsWith('data:image/')) return dataUrl;
      }
    } catch {}
    return resolved;
  };

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
      const esc = (s: string) =>
        (s || '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');

      const plantsEmbedded = await Promise.all(
        activePlants.map(async (p) => ({
          ...p,
          embeddedImg: await inlineImageAsDataUrl(p.image),
        }))
      );

      const dt = getBengaliDateTime();
      const cardsHtml = plantsEmbedded
        .map((p) => {
          const optsHtml = (p.options || [])
            .map(
              (o) =>
                `<div class="price-row"><span>${esc(o.labelBn)}</span><strong>₹${
                  o.price
                }</strong></div>`
            )
            .join('');
          return `<article class="card">
            <img src="${p.embeddedImg || ''}" alt="${esc(p.nameBn)}" />
            <div class="body">
              <div class="badges">
                <span class="cat">${esc(p.category)}</span>
                ${p.colorBn ? `<span class="clr">${esc(p.colorBn)}</span>` : ''}
                <span class="${p.inStock === false ? 'out' : 'in'}">${
            p.inStock === false ? 'স্টক শেষ' : 'স্টকে আছে'
          }</span>
              </div>
              <h2>${esc(p.nameBn)}</h2>
              <p class="en">${esc(p.nameEn)}${
            p.botanicalName ? ` · <em>${esc(p.botanicalName)}</em>` : ''
          }</p>
              <div class="prices">${optsHtml}</div>
              <p class="desc">${esc(p.descriptionBn)}</p>
              <div class="care">
                <div><strong>রোদ:</strong> ${esc(p.sunlightBn)}</div>
                <div><strong>জল:</strong> ${esc(p.wateringBn)}</div>
                <div><strong>মাটি:</strong> ${esc(p.soilTipBn)}</div>
              </div>
            </div>
          </article>`;
        })
        .join('\n');

      const htmlDoc = `<!DOCTYPE html>
<html lang="bn">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>ভ্রম্যমাণ নার্সারি - সম্পূর্ণ ফটো ও দাম ক্যাটালগ (${dt.dateBn})</title>
<style>
  body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 20px; background: #FAF7F2; color: #142318; }
  .top { max-width: 1100px; margin: 0 auto 20px; background: #142318; color: #fff; padding: 20px; border-radius: 16px; display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; }
  .top h1 { margin: 0 0 6px; font-size: 22px; }
  .top p { margin: 0; font-size: 13px; color: #CBE5D2; }
  .print-btn { background: #A3E635; color: #142318; border: 0; padding: 12px 18px; border-radius: 12px; font-weight: 700; font-size: 14px; cursor: pointer; }
  .grid { max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 16px; }
  .card { background: #fff; border: 1px solid #E8E1D5; border-radius: 16px; overflow: hidden; break-inside: avoid; box-shadow: 0 1px 4px rgba(0,0,0,0.05); }
  .card img { width: 100%; height: 210px; object-fit: cover; display: block; background: #EAE4D9; }
  .body { padding: 14px; }
  .badges { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; font-size: 11px; font-weight: 700; }
  .cat { background: #F5EFE6; color: #785942; padding: 3px 8px; border-radius: 99px; }
  .clr { background: #FEF3C7; color: #92400E; padding: 3px 8px; border-radius: 99px; }
  .in { background: #DCFCE7; color: #166534; padding: 3px 8px; border-radius: 99px; }
  .out { background: #FEE2E2; color: #991B1B; padding: 3px 8px; border-radius: 99px; }
  h2 { margin: 0 0 4px; font-size: 18px; }
  .en { margin: 0 0 10px; font-size: 12px; color: #526356; }
  .prices { background: #FFFBF5; border: 1px solid #EADBCC; border-radius: 10px; padding: 8px 10px; margin-bottom: 10px; }
  .price-row { display: flex; justify-content: space-between; font-size: 13px; padding: 3px 0; border-bottom: 1px dashed #EFE5D8; }
  .price-row:last-child { border-bottom: 0; }
  .price-row strong { color: #B34728; font-size: 15px; }
  .desc { font-size: 12.5px; line-height: 1.5; color: #273B2E; margin: 0 0 10px; }
  .care { font-size: 11.5px; color: #526356; background: #F7F5F0; padding: 8px 10px; border-radius: 10px; line-height: 1.55; }
  @media print { body { background: #fff; padding: 0; } .print-btn { display: none; } .card { box-shadow: none; } }
</style>
</head>
<body>
  <header class="top">
    <div>
      <h1>ভ্রম্যমাণ নার্সারি · অফলাইন ফটো ও দাম ক্যাটালগ</h1>
      <p>গ্রাম: কালশুলি, বাঁকুড়া, পিন ৭২২১৬০ · হোয়াটসঅ্যাপ/ফোন: +91 86094 17672 · মোট গাছ: ${
        plantsEmbedded.length
      } টি · তারিখ: ${esc(dt.dateBn)}</p>
    </div>
    <button class="print-btn" onclick="window.print()">প্রিন্ট / PDF সেভ করুন</button>
  </header>
  <main class="grid">${cardsHtml}</main>
</body>
</html>`;

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
      const { plantsToUpdate, candidateFixLogs } = buildCatalogBugFixPlan({
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
      <div className="min-h-screen bg-[#142318] text-[#E8EDE9] flex flex-col justify-between p-4 sm:p-6 font-sans-bn selection:bg-[#A3E635] selection:text-[#142318]">
        <div className="w-full max-w-md mx-auto flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={onNavigateToShop}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#213526] hover:bg-[#2e4735] text-xs font-semibold text-[#CBD5E1] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>নার্সারি ওয়েবসাইট</span>
          </button>
          <span className="text-[11px] text-[#A3E635] font-mono">Admin Portal</span>
        </div>

        <div className="w-full max-w-md mx-auto my-auto bg-white text-[#142318] rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#304836]">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-[#1B8354]/10 text-[#1B8354] flex items-center justify-center mx-auto mb-3 border border-[#1B8354]/20">
              <Smartphone className="w-7 h-7" />
            </div>
            <h1 className="font-serif-bn text-2xl font-bold tracking-tight text-[#142318]">
              ভ্রম্যমাণ নার্সারি · Admin ও Owner পোর্টাল
            </h1>
            <p className="text-sm text-[#526356] mt-1 font-medium">
              মোবাইল ও ডেস্কটপ থেকে গাছের ছবি, স্টক ও দাম বদলানোর সুরক্ষিত পোর্টাল
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-[#F5EFE6] border border-[#E8E1D5] rounded-2xl text-sm text-[#526356] space-y-2">
              <div className="flex items-center gap-2 text-[#142318] font-bold">
                <ShieldCheck className="w-5 h-5 text-[#1B8354] shrink-0" />
                <span>নিরাপদ Google অ্যাকাউন্ট যাচাই</span>
              </div>
              <p className="text-xs leading-relaxed">
                শুধুমাত্র অনুমোদিত Owner ও Admin Google অ্যাকাউন্ট দিয়েই প্রবেশ করা যাবে। অন্য কোনো পাসওয়ার্ড বা PIN মনে রাখার দরকার নেই।
              </p>
              <div className="pt-1 flex flex-wrap gap-1.5">
                {authorizedEmailsList.map((em) => (
                  <span
                    key={em}
                    className="inline-flex items-center gap-1 text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-white text-[#142318] border border-[#D5C9B8]"
                  >
                    <Mail className="w-3.5 h-3.5 text-[#1B8354]" />
                    <span>{em}</span>
                  </span>
                ))}
              </div>
            </div>

            {loginError && (
              <p className="text-sm text-[#B34728] font-semibold bg-[#B34728]/10 border border-[#B34728]/20 p-3 rounded-xl text-center">
                {loginError}
              </p>
            )}

            <button
              type="button"
              disabled={isAuthChecking || isVerifying}
              onClick={handleGoogleSignIn}
              className="w-full h-14 bg-[#142318] hover:bg-[#203425] active:scale-[0.99] disabled:opacity-60 text-white font-bold rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2.5 shadow-md text-base"
            >
              {isAuthChecking || isVerifying ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-[#A3E635]" />
                  <span>{isAuthChecking ? 'যাচাই করা হচ্ছে...' : 'Google লগইন চলছে...'}</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5 text-[#A3E635]" />
                  <span>Google দিয়ে লগইন করুন</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="text-center text-[11px] text-[#7B9584] py-3">
          ভ্রম্যমাণ নার্সারি, কালশুলি গ্রাম · বাঁকুড়া, ৭২২১৬০
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------- */
  /* SCREEN 2: ORGANIZED WORKSPACE SHELL                           */
  /* ------------------------------------------------------------- */
  const currentDateTime = getBengaliDateTime();

  const TAB_TO_SECTION_MAP: Record<AdminTab, AdminSection> = {
    inventory: 'catalog',
    add: 'catalog',
    logs: 'catalog',
    bulk_price: 'bulk',
    qr_tags: 'bulk',
    orders: 'bulk',
    reviews: 'bulk',
    trash: 'recovery',
    backup: 'recovery',
    undo_redo: 'recovery',
    diagnostics: 'diagnostics',
    api: 'diagnostics',
    chatbot: 'diagnostics',
    cloudinary: 'diagnostics',
    settings: 'diagnostics',
  };

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

  const ADMIN_SECTIONS_CONFIG: Array<{
    id: AdminSection;
    labelBn: string;
    shortLabelBn: string;
    descBn: string;
    icon: any;
    badge?: string | number | null;
  }> = [
    {
      id: 'catalog',
      labelBn: 'ক্যাটালগ পরিচালনা',
      shortLabelBn: 'ক্যাটালগ',
      descBn: 'গাছের ইনভেন্টরি, নতুন চারা ও আপলোড ইতিহাস',
      icon: Package,
      badge: `${activePlants.length}`,
    },
    {
      id: 'bulk',
      labelBn: 'বাল্ক অপারেশন ও বিক্রয়',
      shortLabelBn: 'বাল্ক ও বিক্রয়',
      descBn: 'বাল্ক দাম পরিবর্তন, QR ট্যাগ, অর্ডার ও রিভিউ',
      icon: Percent,
      badge:
        orderLogs.length > 0 || customerReviews.filter((r) => r.status === 'pending').length > 0
          ? `${orderLogs.length + customerReviews.filter((r) => r.status === 'pending').length}`
          : null,
    },
    {
      id: 'recovery',
      labelBn: 'ট্র্যাশ ও পুনরুদ্ধার',
      shortLabelBn: 'ট্র্যাশ/রিকভারি',
      descBn: 'মুছে ফেলা চারা (৩০ দিন), ব্যাকআপ ও রিস্টোর',
      icon: Trash2,
      badge: trashedPlants.length > 0 ? `${trashedPlants.length}` : null,
    },
    {
      id: 'diagnostics',
      labelBn: 'সিস্টেম ডায়াগনস্টিকস ও কোটা',
      shortLabelBn: 'ডায়াগনস্টিকস',
      descBn: 'ক্যাটালগ অডিট, ১-ক্লিক ফিক্স, AI কোটা ও ডাটাবেস',
      icon: Activity,
      badge: rootCauseDiagnostics.length > 0 ? `${rootCauseDiagnostics.length}` : null,
    },
  ];

  const navGroups = [
    {
      sectionId: 'catalog' as AdminSection,
      groupLabel: 'ক্যাটালগ পরিচালনা (Manage Catalog)',
      icon: Package,
      items: [
        {
          id: 'inventory' as AdminTab,
          label: 'সব গাছ (Inventory)',
          badge: `${activePlants.length}`,
          icon: Package,
          onClick: () => switchAdminTab('inventory'),
        },
        {
          id: 'add' as AdminTab,
          label: editingPlantId ? 'চারা এডিট ফর্ম' : '+ নতুন চারা যোগ',
          badge: null,
          icon: Plus,
          onClick: () => handleStartAddPlant(),
        },
        {
          id: 'logs' as AdminTab,
          label: 'আপলোড হিস্ট্রি (ডেট-টাইম)',
          badge: null,
          icon: History,
          onClick: () => switchAdminTab('logs'),
        },
      ],
    },
    {
      sectionId: 'bulk' as AdminSection,
      groupLabel: 'বাল্ক অপারেশন ও বিক্রয় (Bulk Operations)',
      icon: Percent,
      items: [
        {
          id: 'bulk_price' as AdminTab,
          label: 'বাল্ক দাম ও ছাড় আপডেটার',
          badge: null,
          icon: Percent,
          onClick: () => switchAdminTab('bulk_price'),
        },
        {
          id: 'qr_tags' as AdminTab,
          label: 'প্রিন্টেবল QR প্ল্যান্ট ট্যাগ',
          badge: null,
          icon: QrCode,
          onClick: () => switchAdminTab('qr_tags'),
        },
        {
          id: 'orders' as AdminTab,
          label: 'অর্ডার ও চাহিদা ট্র্যাকার',
          badge: orderLogs.length > 0 ? `${orderLogs.length}` : null,
          icon: ShoppingBag,
          onClick: () => switchAdminTab('orders'),
        },
        {
          id: 'reviews' as AdminTab,
          label: 'কাস্টমার রিভিউ ও গ্যালারি',
          badge:
            customerReviews.filter((r) => r.status === 'pending').length > 0
              ? `${customerReviews.filter((r) => r.status === 'pending').length}`
              : null,
          icon: Star,
          onClick: () => switchAdminTab('reviews'),
        },
      ],
    },
    {
      sectionId: 'recovery' as AdminSection,
      groupLabel: 'ট্র্যাশ ও পুনরুদ্ধার (Trash / Recovery)',
      icon: Trash2,
      items: [
        {
          id: 'trash' as AdminTab,
          label: 'ট্র্যাশ বিন (৩০ দিন)',
          badge: trashedPlants.length > 0 ? `${trashedPlants.length}` : null,
          icon: Trash2,
          onClick: () => switchAdminTab('trash'),
        },
        {
          id: 'backup' as AdminTab,
          label: 'ব্যাকআপ ও রিস্টোর',
          badge: null,
          icon: Download,
          onClick: () => switchAdminTab('backup'),
        },
        {
          id: 'undo_redo' as AdminTab,
          label: 'অ্যাকশন হিস্ট্রি ও অডিট',
          badge: undoStack.length > 0 ? `${undoStack.length}` : null,
          icon: History,
          onClick: () => switchAdminTab('undo_redo'),
        },
      ],
    },
    {
      sectionId: 'diagnostics' as AdminSection,
      groupLabel: 'সিস্টেম ডায়াগনস্টিকস (System Diagnostics)',
      icon: Activity,
      items: [
        {
          id: 'diagnostics' as AdminTab,
          label: 'ক্যাটালগ অডিট ও ১-ক্লিক ফিক্স',
          badge: rootCauseDiagnostics.length > 0 ? `${rootCauseDiagnostics.length}` : null,
          icon: Activity,
          onClick: () => switchAdminTab('diagnostics'),
        },
        {
          id: 'api' as AdminTab,
          label: 'Gemini AI ও ২৪ঘণ্টার কোটা',
          badge: null,
          icon: Cpu,
          onClick: () => switchAdminTab('api'),
        },
        {
          id: 'chatbot' as AdminTab,
          label: 'Gemini AI পরামর্শক',
          badge: null,
          icon: Bot,
          onClick: () => switchAdminTab('chatbot'),
        },
        {
          id: 'cloudinary' as AdminTab,
          label: 'Cloudinary মিডিয়া ও স্টোরেজ',
          badge:
            dbHealthMetrics.base64PhotoCount > 0
              ? `${dbHealthMetrics.base64PhotoCount}`
              : null,
          icon: Cloud,
          onClick: () => switchAdminTab('cloudinary'),
        },
        {
          id: 'settings' as AdminTab,
          label: 'নিরাপত্তা ও ডাটাবেস',
          badge:
            dbHealthMetrics.alerts.length > 0 ? `${dbHealthMetrics.alerts.length}` : null,
          icon: Lock,
          onClick: () => switchAdminTab('settings'),
        },
      ],
    },
  ];

  const activeNavGroup = navGroups.find((g) => g.sectionId === activeSection) || navGroups[0];

  const activeSectionMeta: Record<AdminTab, { titleBn: string; subtitleBn: string }> = {
    inventory: {
      titleBn: 'ক্যাটালগ ও ইনভেন্টরি (নতুন আপলোড সবার উপরে)',
      subtitleBn: `মোট ${activePlants.length} টি সক্রিয় চারা · সারি ওয়াইজ ডেট-টাইম লিস্ট ও দ্রুত ফিল্টার`,
    },
    add: {
      titleBn: editingPlantId ? 'চারার তথ্য ও ছবি সম্পাদনা' : 'নতুন চারা যোগ করুন',
      subtitleBn: 'ক্যামেরা, ৩-স্লট গ্যালারি, দাম ও Gemini AI অটো-ফিল',
    },
    logs: {
      titleBn: 'আপলোড করা চারার ডেট-টাইম লিস্ট ও হিস্ট্রি',
      subtitleBn: 'নতুন আপলোড করা চারা সবার উপরে সারি ওয়াইজ দেখুন ও ১-ক্লিকে এডিট করুন',
    },
    orders: {
      titleBn: 'হোয়াটসঅ্যাপ অর্ডার ও চাহিদা ট্র্যাকার',
      subtitleBn: 'সবচেয়ে বেশি চাহিদার চারা ও কাস্টমার অর্ডার/শেয়ার লিস্ট',
    },
    bulk_price: {
      titleBn: 'বাল্ক প্রাইস ও সিজনাল ডিসকাউন্ট আপডেটার',
      subtitleBn: 'বর্ষা বা শীতের মৌসুমে ১-ক্লিকে নির্দিষ্ট ক্যাটাগরির দাম শতকরা হারে কমান বা বাড়ান',
    },
    reviews: {
      titleBn: 'কাস্টমার রিভিউ ও বাগান গ্যালারি অনুমোদন',
      subtitleBn: 'ক্রেতাদের পাঠানো গাছের ছবি ও মতামত অনুমোদন করে ওয়েবসাইটে দেখান',
    },
    qr_tags: {
      titleBn: 'প্রিন্টেবল QR কোড প্ল্যান্ট ট্যাগ জেনারেটর',
      subtitleBn: 'নার্সারির টব বা চারার গায়ে লাগানোর জন্য নাম, দাম ও QR কোডসহ প্রিন্টেবল ট্যাগ',
    },
    trash: {
      titleBn: 'ডিজিটাল ট্র্যাশ বিন',
      subtitleBn: 'মুছে ফেলা চারা ৩০ দিন পর্যন্ত সুরক্ষিত থাকে',
    },
    chatbot: {
      titleBn: 'Google Gemini AI নার্সারি পরামর্শক',
      subtitleBn: 'Gemini AI দিয়ে ক্যাটালগ সমস্যা নির্ণয় ও গাছের পরিচর্যা পরামর্শ',
    },
    api: {
      titleBn: 'Gemini AI কনফিগারেশন ও কোটা স্ট্যাটাস',
      subtitleBn: 'Gemini ৪-স্লট কী পুল, অটো-রোটেশন ও সার্ভার ডায়াগনস্টিকস',
    },
    cloudinary: {
      titleBn: 'Cloudinary মিডিয়া ও স্টোরেজ কন্ট্রোল',
      subtitleBn: 'CDN ছবি লাইব্রেরি, Base64 মাইগ্রেশন ও অরফ্যান স্ক্যানার',
    },
    backup: {
      titleBn: 'ব্যাকআপ, অফলাইন ক্যাটালগ ও রিস্টোর',
      subtitleBn: 'JSON ব্যাকআপ, প্রিন্টযোগ্য ফটো ক্যাটালগ ও পুনরুদ্ধার',
    },
    settings: {
      titleBn: 'নিরাপত্তা, অ্যাকাউন্ট ও ডাটাবেস হেলথ',
      subtitleBn: 'অনুমোদিত অ্যাডমিন রোল ও Firestore কোটা মনিটর',
    },
    undo_redo: {
      titleBn: 'ক্যাটালগ আনডু ও রিডু হিস্ট্রি স্ট্যাক',
      subtitleBn: 'কোন কোন পরিবর্তন করা হয়েছে এবং ১-ক্লিকে কী আনডু বা রিডু করবেন তা দেখুন',
    },
    diagnostics: {
      titleBn: 'ক্যাটালগ অডিট ও ১-ক্লিক মেরামত কেন্দ্র',
      subtitleBn: 'ক্যাটালগের ভুলত্রুটি, রুট কজ বিশ্লেষণ, ডুপ্লিকেট স্ক্যান ও স্বয়ংক্রিয় মেরামত',
    },
  };

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#142318] flex flex-col font-sans-bn select-text overflow-x-hidden pb-44">
      {/* 1. STICKY TOP HEADER BAR */}
      <header className="sticky top-0 z-40 bg-[#142318] text-white border-b border-[#25392A]">
        <div className="max-w-7xl mx-auto px-3 sm:px-5 h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {/* Mobile Drawer Trigger */}
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(true)}
              aria-label="সব সেকশন মেনু খুলুন"
              className="lg:hidden inline-flex items-center justify-center w-9 h-9 rounded-xl bg-[#213526] hover:bg-[#2c4533] text-white cursor-pointer shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Contextual Internal Back Button */}
            {(tabHistory.length > 0 || mobileTab !== 'inventory') && (
              <button
                type="button"
                onClick={handleAdminBack}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#213526] hover:bg-[#2c4533] text-[#E8EDE9] hover:text-white text-xs font-bold transition-colors cursor-pointer shrink-0"
                title="আগের সেকশনে ফিরুন"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">পিছনে</span>
              </button>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-serif-bn font-bold text-sm sm:text-base text-white truncate">
                  ভ্রম্যমাণ নার্সারি
                </h1>
                <span className="text-[11px] font-mono font-bold text-[#A3E635] shrink-0">
                  · {isAdminSimpleView ? 'Admin' : 'Owner'}
                </span>
              </div>
              <p className="text-[10px] text-[#A8BDB0] font-mono truncate">
                {activeSectionMeta[mobileTab].titleBn} · {currentDateTime.relativeBn}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Quick Refresh Control */}
            <button
              type="button"
              disabled={isRefreshingAdmin}
              onClick={handleManualAdminRefresh}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#213526] hover:bg-[#2c4533] border border-[#304836] text-[#E8EDE9] text-xs font-bold transition-colors cursor-pointer"
              title="সকল ক্যাটালগ তথ্য ও ডাটাবেস স্ট্যাটাস রিফ্রেশ করুন"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-[#A3E635] ${
                  isRefreshingAdmin ? 'animate-spin' : ''
                }`}
              />
              <span className="hidden sm:inline">রিফ্রেশ</span>
            </button>

            {isOwner && (
              <button
                type="button"
                onClick={() => {
                  const next = !previewAdminMode;
                  setPreviewAdminMode(next);
                  if (next) setMobileTab('inventory');
                }}
                className={`inline-flex items-center gap-1 rounded-xl font-bold transition-colors cursor-pointer ${
                  previewAdminMode
                    ? 'px-3 py-1.5 bg-[#F59E0B] hover:bg-[#D97706] text-[#142318] text-xs'
                    : 'px-2.5 py-1.5 bg-[#213526] hover:bg-[#2c4533] text-[#A3E635] text-[11px] border border-[#304836]'
                }`}
                title="Admin বড়-ফন্ট ভিউ দেখুন বা Owner মোডে ফিরুন"
              >
                <Eye className="w-3.5 h-3.5 shrink-0" />
                <span>{previewAdminMode ? 'Owner মোড' : 'Admin ভিউ'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onNavigateToShop}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1B8354] hover:bg-[#146c44] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              title="পাবলিক নার্সারি ওয়েবসাইটে যান"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#A3E635]" />
              <span className="hidden sm:inline">ওয়েবসাইট</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="lg:hidden inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#B34728] text-xs font-bold rounded-xl transition-colors cursor-pointer"
              title="লগআউট করুন"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">লগআউট</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. MOBILE SLIDE-OVER NAVIGATION DRAWER */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/35 backdrop-blur-[1px]"
            onClick={() => setIsMobileDrawerOpen(false)}
          />
          <aside className="relative w-64 sm:w-72 max-w-[74vw] bg-white h-full shadow-2xl border-r border-[#E8E1D5] flex flex-col justify-between z-10 overflow-y-auto">
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E8E1D5]">
                <div>
                  <p className="font-serif-bn text-base font-bold text-[#142318]">
                    অ্যাডমিন নেভিগেশন
                  </p>
                  <p className="text-[11px] font-mono text-[#526356] truncate max-w-[190px]">
                    {verifiedEmail || firebaseUser?.email}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  aria-label="মেনু বন্ধ করুন"
                  className="w-8 h-8 rounded-lg bg-[#F5EFE6] text-[#142318] flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                {navGroups.map((group) => (
                  <div key={group.groupLabel} className="space-y-1">
                    <p className="px-2.5 text-[10px] font-bold text-[#785942] uppercase tracking-wider">
                      {group.groupLabel}
                    </p>
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = mobileTab === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={item.onClick}
                          className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                            isActive
                              ? 'bg-[#142318] text-white'
                              : 'text-[#142318] hover:bg-[#FAF8F5]'
                          }`}
                        >
                          <span className="flex items-center gap-2.5 truncate">
                            <Icon
                              className={`w-4 h-4 shrink-0 ${
                                isActive ? 'text-[#A3E635]' : 'text-[#1B8354]'
                              }`}
                            />
                            <span className="truncate">{item.label}</span>
                          </span>
                          {item.badge && (
                            <span
                              className={`font-mono tabular-nums text-[11px] ${
                                isActive ? 'text-[#A3E635]' : 'text-[#785942]'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-[#E8E1D5]">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-2.5 px-3 bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#B34728] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>লগআউট করুন</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* 3. WORKSPACE BODY: DESKTOP LEFT SIDEBAR + MAIN STAGE */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex gap-6 px-3 sm:px-5 pt-4 pb-32 lg:pb-8">
        {/* Desktop Persistent Left Sidebar (lg+) */}
        <aside className="hidden lg:flex w-60 shrink-0 flex-col justify-between bg-white border border-[#E8E1D5] rounded-2xl p-3.5 h-[calc(100dvh-5.25rem)] sticky top-18 overflow-y-auto">
          <div className="space-y-4">
            {navGroups.map((group) => (
              <div key={group.groupLabel} className="space-y-1">
                <p className="px-2.5 text-[10px] font-bold text-[#785942] uppercase tracking-wider">
                  {group.groupLabel}
                </p>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = mobileTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={item.onClick}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-[#142318] text-white'
                          : 'text-[#142318] hover:bg-[#FAF8F5]'
                      }`}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? 'text-[#A3E635]' : 'text-[#1B8354]'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </span>
                      {item.badge && (
                        <span
                          className={`font-mono tabular-nums text-[11px] ${
                            isActive ? 'text-[#A3E635]' : 'text-[#785942]'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-[#E8E1D5] space-y-2">
            <div className="px-2 text-[10px] text-[#526356] truncate font-mono">
              {verifiedEmail || firebaseUser?.email}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full py-2 px-3 bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#B34728] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>লগআউট</span>
            </button>
          </div>
        </aside>

        {/* Main Stage */}
        <main className="flex-1 min-w-0 space-y-4">
          {/* 4 PRIMARY WORKSPACES (SECTIONS) NAVIGATION */}
          <section className="bg-white border border-[#E8E1D5] rounded-2xl p-3 sm:p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#F0EAE1]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#785942]">
                  অ্যাডমিন বিভাগ (Workspaces)
                </span>
                <span className="text-[11px] text-[#A8BDB0] font-mono hidden sm:inline">
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
                          className={`text-[10px] truncate ${
                            isSecActive ? 'text-[#A8BDB0]' : 'text-[#785942]'
                          }`}
                        >
                          {sec.descBn}
                        </p>
                      </div>
                    </div>
                    {sec.badge && (
                      <span
                        className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
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
              <span className="text-[11px] font-bold text-[#785942] uppercase tracking-wider shrink-0 mr-1 hidden sm:inline">
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
                        className={`font-mono text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
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
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#1B8354] mb-0.5">
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
                      className="px-2.5 py-1 bg-[#991B1B] text-white text-[11px] font-bold rounded-lg cursor-pointer"
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
                      className="text-[11px] font-bold underline cursor-pointer"
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
                      className="px-2 py-0.5 bg-[#142318] text-white text-[10px] font-bold rounded-md cursor-pointer"
                    >
                      AI সমাধান
                    </button>
                    <button
                      type="button"
                      onClick={() => clearRuntimeIssues()}
                      className="text-[10px] font-bold underline cursor-pointer"
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

      {/* 4. QUICK PRICE EDIT MODAL */}
      {quickPricePlant && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-xl border border-[#E8E1D5]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E1D5]">
              <div className="flex items-center gap-2.5">
                <img
                  src={resolvePlantImageUrl(quickPricePlant.image, PUJA_IMAGE)}
                  alt={quickPricePlant.nameBn}
                  className="w-10 h-10 rounded-xl object-cover border border-[#DDD5C7]"
                />
                <div>
                  <h3 className="font-serif-bn text-sm font-bold text-[#142318]">
                    {quickPricePlant.nameBn}
                  </h3>
                  <p className="text-[11px] text-[#785942] font-mono tabular-nums">
                    বর্তমান মূল্য: ₹{quickPricePlant.options[0]?.price}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickPricePlant(null)}
                className="text-xs text-[#785942] hover:text-[#142318] p-1 cursor-pointer"
              >
                বন্ধ
              </button>
            </div>

            <form onSubmit={handleSaveQuickPrice} className="mt-4 space-y-3.5">
              <div>
                <label
                  className={`block font-bold text-[#142318] mb-1.5 ${
                    isAdminSimpleView ? 'text-base' : 'text-xs'
                  }`}
                >
                  নতুন বিক্রয়মূল্য লিখুন (₹)
                </label>
                <div className="relative">
                  <span
                    className={`absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-bold text-[#B34728] ${
                      isAdminSimpleView ? 'text-2xl' : 'text-base'
                    }`}
                  >
                    ₹
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    required
                    value={quickPriceValue}
                    onChange={(e) => setQuickPriceValue(e.target.value)}
                    className={`w-full pl-9 pr-3 border border-[#D5C9B8] rounded-xl font-mono tabular-nums font-bold text-[#142318] focus:outline-none focus:border-[#1B8354] ${
                      isAdminSimpleView ? 'h-14 text-2xl' : 'h-12 text-lg'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[-10, -5, 5, 10].map((delta) => (
                  <button
                    key={delta}
                    type="button"
                    onClick={() => {
                      const cur = parseFloat(quickPriceValue) || 0;
                      const next = Math.max(1, Math.round(cur + delta));
                      setQuickPriceValue(next.toString());
                    }}
                    className={`rounded-xl font-mono tabular-nums font-bold border cursor-pointer transition-all active:scale-95 ${
                      delta < 0
                        ? 'bg-[#FEF2F2] border-[#FECACA] text-[#B34728] hover:bg-[#FEE2E2]'
                        : 'bg-[#F0FDF4] border-[#86EFAC] text-[#166534] hover:bg-[#DCFCE7]'
                    } ${isAdminSimpleView ? 'h-12 text-base' : 'h-10 text-sm'}`}
                  >
                    {delta > 0 ? `+₹${delta}` : `-₹${Math.abs(delta)}`}
                  </button>
                ))}
              </div>

              <div className="pt-2 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setQuickPricePlant(null)}
                  className={`flex-1 border border-[#D5C9B8] rounded-xl font-bold text-[#526356] cursor-pointer ${
                    isAdminSimpleView ? 'h-13 text-base' : 'h-11 text-xs'
                  }`}
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className={`flex-1 bg-[#1B8354] hover:bg-[#146c44] text-white rounded-xl font-bold cursor-pointer ${
                    isAdminSimpleView ? 'h-13 text-base' : 'h-11 text-xs'
                  }`}
                >
                  দাম সেভ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. IN-APP CONFIRMATION MODAL */}
      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl border border-[#E8E1D5] space-y-4">
            <div className="flex items-start gap-3">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                  confirmDialog.isDanger
                    ? 'bg-[#FEF2F2] text-[#B34728]'
                    : 'bg-[#F0FDF4] text-[#1B8354]'
                }`}
              >
                {confirmDialog.type === 'soft_delete' ? (
                  <Trash2 className="w-5 h-5 text-[#B34728]" />
                ) : confirmDialog.type === 'permanent_delete' ? (
                  <AlertTriangle className="w-5 h-5 text-[#B34728]" />
                ) : confirmDialog.type === 'empty_trash' ? (
                  <Trash2 className="w-5 h-5 text-[#B34728]" />
                ) : (
                  <RefreshCw className="w-5 h-5 text-[#1B8354]" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-serif-bn text-base font-bold text-[#142318] leading-snug">
                  {confirmDialog.titleBn}
                </h3>
                <p className="text-xs text-[#526356] mt-1 leading-relaxed">
                  {confirmDialog.messageBn}
                </p>
              </div>
            </div>

            {confirmDialog.plant && (
              <div className="flex items-center gap-2.5 p-2.5 bg-[#FBF9F5] border border-[#E8E1D5] rounded-xl">
                <img
                  src={resolvePlantImageUrl(confirmDialog.plant.image, PUJA_IMAGE)}
                  alt={confirmDialog.plant.nameBn}
                  className="w-10 h-10 rounded-lg object-cover border border-[#DDD5C7]"
                />
                <div className="min-w-0">
                  <p className="font-serif-bn text-xs font-bold text-[#142318] truncate">
                    {confirmDialog.plant.nameBn}
                  </p>
                  <p className="text-[10px] text-[#785942] tabular-nums">
                    মূল্য: ₹{confirmDialog.plant.options[0]?.price || 0} ·{' '}
                    {confirmDialog.plant.category}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="flex-1 h-11 border border-[#D5C9B8] hover:bg-[#FAF8F5] text-xs font-bold text-[#526356] rounded-xl transition-colors cursor-pointer"
              >
                {confirmDialog.cancelBtnBn || 'বাতিল'}
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className={`flex-1 h-11 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer ${
                  confirmDialog.isDanger
                    ? 'bg-[#B34728] hover:bg-[#8F351D]'
                    : 'bg-[#1B8354] hover:bg-[#146c44]'
                }`}
              >
                {confirmDialog.confirmBtnBn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. IN-APP TOAST NOTIFICATION BANNER WITH CLEAR STATUS & UNDO */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          data-testid="admin-toast-notification"
          className="fixed top-4 inset-x-4 z-50 max-w-lg mx-auto pointer-events-none"
        >
          <div
            className={`pointer-events-auto p-3.5 sm:p-4 rounded-2xl shadow-2xl border flex items-start justify-between gap-3 transition-all ${
              toast.type === 'error'
                ? 'bg-[#2B1210] border-[#F87171]/60 text-white'
                : toast.type === 'warning'
                ? 'bg-[#281C0E] border-[#FBBF24]/60 text-white'
                : toast.type === 'info'
                ? 'bg-[#142318] border-[#A3E635]/50 text-white'
                : 'bg-[#142318] border-[#34D399]/60 text-white'
            }`}
          >
            <div className="flex items-start gap-3 min-w-0">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  toast.type === 'error'
                    ? 'bg-[#DC2626] text-white'
                    : toast.type === 'warning'
                    ? 'bg-[#D97706] text-white'
                    : 'bg-[#1B8354] text-white'
                }`}
              >
                {toast.type === 'error' || toast.type === 'warning' ? (
                  <AlertTriangle className="w-4 h-4" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
              </div>
              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-[11px] font-extrabold tracking-wide uppercase px-1.5 py-0.5 rounded-md ${
                      toast.type === 'error'
                        ? 'bg-[#FEE2E2] text-[#991B1B]'
                        : toast.type === 'warning'
                        ? 'bg-[#FEF3C7] text-[#92400E]'
                        : 'bg-[#DCFCE7] text-[#166534]'
                    }`}
                  >
                    {toast.titleBn}
                  </span>
                  <span className="text-[10px] text-[#A8BDB0] font-mono tabular-nums">
                    {toast.timestampBn}
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-bold leading-snug text-white">
                  {toast.messageBn}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {toast.actionLabelBn && toast.onAction && (
                <button
                  type="button"
                  onClick={() => {
                    toast.onAction?.();
                    setToast(null);
                  }}
                  className="px-2.5 py-1.5 bg-[#A3E635] hover:bg-[#86cf24] text-[#142318] text-[11px] font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                >
                  {toast.actionLabelBn}
                </button>
              )}
              <button
                type="button"
                aria-label="টোস্ট বার্তা বন্ধ করুন"
                onClick={() => setToast(null)}
                className="text-[#A8BDB0] hover:text-white p-1 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* 8. COMPACT 5-SLOT MOBILE BOTTOM BAR (Hidden on lg+ desktop where left sidebar is visible) */}
      <nav
        aria-label="Admin Mobile Bottom Navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 z-[9999] bg-white/95 backdrop-blur-md border-t border-[#E8E1D5] pt-1.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] px-2 shadow-2xl"
      >
        <div className="max-w-lg mx-auto grid grid-cols-5 gap-1">
          <button
            type="button"
            onClick={() => switchAdminSection('catalog')}
            className={`flex flex-col items-center justify-center rounded-xl py-1.5 transition-colors cursor-pointer ${
              activeSection === 'catalog' && mobileTab !== 'add'
                ? 'bg-[#EBF5EF] text-[#1B8354] font-bold'
                : 'text-[#526356] hover:text-[#142318]'
            }`}
          >
            <Package className="w-4 h-4 mb-0.5" />
            <span className="text-[10px] leading-tight">ক্যাটালগ</span>
          </button>

          <button
            type="button"
            onClick={handleStartAddPlant}
            className={`flex flex-col items-center justify-center rounded-xl py-1.5 transition-colors cursor-pointer ${
              mobileTab === 'add'
                ? 'bg-[#EBF5EF] text-[#1B8354] font-bold'
                : 'text-[#526356] hover:text-[#142318]'
            }`}
          >
            <Plus className="w-4 h-4 mb-0.5" />
            <span className="text-[10px] leading-tight">+ নতুন</span>
          </button>

          <button
            type="button"
            onClick={() => switchAdminSection('bulk')}
            className={`flex flex-col items-center justify-center rounded-xl py-1.5 transition-colors cursor-pointer ${
              activeSection === 'bulk'
                ? 'bg-[#EBF5EF] text-[#1B8354] font-bold'
                : 'text-[#526356] hover:text-[#142318]'
            }`}
          >
            <Percent className="w-4 h-4 mb-0.5" />
            <span className="text-[10px] leading-tight">বাল্ক</span>
          </button>

          <button
            type="button"
            onClick={() => switchAdminSection('recovery')}
            className={`flex flex-col items-center justify-center rounded-xl py-1.5 transition-colors cursor-pointer ${
              activeSection === 'recovery'
                ? 'bg-[#EBF5EF] text-[#1B8354] font-bold'
                : 'text-[#526356] hover:text-[#142318]'
            }`}
          >
            <Trash2 className="w-4 h-4 mb-0.5" />
            <span className="text-[10px] leading-tight">ট্র্যাশ</span>
          </button>

          <button
            type="button"
            onClick={() => switchAdminSection('diagnostics')}
            className={`flex flex-col items-center justify-center rounded-xl py-1.5 transition-colors cursor-pointer ${
              activeSection === 'diagnostics'
                ? 'bg-[#EBF5EF] text-[#1B8354] font-bold'
                : 'text-[#526356] hover:text-[#142318]'
            }`}
          >
            <Activity className="w-4 h-4 mb-0.5" />
            <span className="text-[10px] leading-tight">ডায়াগনস্টিকস</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
