import type {
  BrahmyamanPlant,
  PlantPotOption,
} from '../../types/nursery';
import type { StartupCatalogRecoveryResult } from '../../utils/firestoreCatalogTransactions';

export interface AdminPageProps {
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

export interface ConfirmDialogState {
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

export interface AdminToast {
  id: string;
  titleBn: string;
  messageBn: string;
  type: AdminToastType;
  timestampBn: string;
  actionLabelBn?: string;
  onAction?: () => void;
}

export interface ServerSecurityMeta {
  rateLimitMode: 'firestore-shared' | 'in-memory-fallback';
  rateLimitReason: string | null;
  hasExplicitServiceAccount: boolean;
  revocationMethod: string | null;
}

export interface ServerDocCounts {
  plants: number | null;
  trashPlants: number | null;
  logs: number | null;
  deletedMeta: number | null;
  total: number | null;
  checkedAt: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface CloudinaryStatusState {
  configured: boolean;
  verified?: boolean;
  cloudName: string | null;
  folder?: string;
  errorCode?: string | null;
  errorMessage?: string | null;
}

export interface DbHealthAlert {
  id: string;
  severity: 'critical' | 'warning';
  titleBn: string;
  detailBn: string;
  actionBn: string;
}

export interface DbHealthMetrics {
  totalPlantBytes: number;
  totalLogsBytes: number;
  totalEstimatedBytes: number;
  largestPlantBytes: number;
  largestPlantName: string;
  largestDocPct: number;
  base64PhotoCount: number;
  effectivePlantDocs: number;
  effectiveLogsDocs: number;
  effectiveTotalDocs: number;
  readsPct: number;
  writesPct: number;
  deletesPct: number;
  storagePct: number;
  readsPerFreshVisitor: number;
  estimatedDailyVisitorCapacity: number;
  alerts: DbHealthAlert[];
  statusLevel: 'healthy' | 'warning' | 'critical';
}

export const STORAGE_ACTIVITY_LOG = 'brahmyaman_admin_activity_log_v2';

export function safeSetLocalStorage(key: string, value: string) {
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

export type { PlantPotOption };
