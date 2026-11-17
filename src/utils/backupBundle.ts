import type { AdminActivityLogItem, BrahmyamanPlant, PlantPotOption } from '../types/nursery';
import {
  alignPlantImageSlots,
  extractCloudinaryPublicIdFromUrl,
  type CloudinaryAssetRecord,
} from './cloudinaryCleanup';

export const UNIFIED_BACKUP_VERSION = '3.0-firebase-cloudinary-complete' as const;

export interface EmbeddedPlantPhotos {
  slot0DataUrl?: string;
  slot1DataUrl?: string;
  slot2DataUrl?: string;
}

export interface BackupPlantEntry extends BrahmyamanPlant {
  embeddedPhotos?: EmbeddedPlantPhotos;
}

export interface BackupCloudinaryAssetEntry extends CloudinaryAssetRecord {
  linkedPlantIds: string[];
  isOrphan: boolean;
}

export interface UnifiedBackupBundle {
  backupVersion: typeof UNIFIED_BACKUP_VERSION;
  exportedAt: string;
  exportedAtBn: string;
  summary: {
    totalPlants: number;
    activePlants: number;
    trashPlants: number;
    deletedSeedIdsCount: number;
    cloudinaryAssetsCount: number;
    cloudinaryTotalBytes: number;
    cloudinaryLinkedAssetsCount: number;
    cloudinaryOrphanAssetsCount: number;
    cloudinaryTruncated: boolean;
    activityLogsCount: number;
  };
  siteProfile: {
    nurseryNameBn: string;
    nurseryNameEn: string;
    locationBn: string;
    locationEn: string;
    pinCode: string;
    phone: string;
    whatsappNumber: string;
    mapUrl: string;
    visitingHoursBn: string;
    visitingHoursEn: string;
    serviceLocationsBn: string;
    serviceLocationsEn: string;
    categories: string[];
  };
  firebaseCatalog: {
    plants: BackupPlantEntry[];
    deletedSeedIds: string[];
    activityLogs: AdminActivityLogItem[];
  };
  cloudinaryMediaLibrary: {
    configured: boolean;
    cloudName: string | null;
    folder: string;
    totalAssets: number;
    totalBytes: number;
    truncated: boolean;
    linkedAssetsCount: number;
    orphanAssetsCount: number;
    resources: BackupCloudinaryAssetEntry[];
  };
  aiRebuildBlueprint: {
    purpose: string;
    recommendedStack: string[];
    dataSchemaNotes: Record<string, string>;
    rebuildPromptForNextAI: string;
  };
}

export interface ParsedUnifiedBackup {
  backupVersion: string;
  plants: BackupPlantEntry[];
  deletedSeedIds: string[];
  activityLogs: AdminActivityLogItem[];
  cloudinaryAssetsCount: number;
}

const ALLOWED_FIRESTORE_PLANT_FIELDS = new Set<string>([
  'id',
  'nameBn',
  'nameEn',
  'botanicalName',
  'category',
  'audience',
  'badgeBn',
  'badgeEn',
  'colorBn',
  'colorEn',
  'sunlightBn',
  'sunlightEn',
  'wateringBn',
  'wateringEn',
  'soilTipBn',
  'soilTipEn',
  'descriptionBn',
  'descriptionEn',
  'image',
  'images',
  'cloudinaryPublicIds',
  'options',
  'featured',
  'inStock',
  'createdAt',
  'createdAtBn',
  'updatedAt',
  'updatedAtBn',
  'status',
  'deletedAt',
  'deletedAtBn',
]);

function getUtf8Bytes(input: string): number {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(input).length;
  }
  return Buffer.byteLength(input, 'utf8');
}

function clampString(val: unknown, maxLen: number): string | undefined {
  if (typeof val !== 'string') return undefined;
  const trimmed = val.trim();
  return trimmed.length > maxLen ? trimmed.slice(0, maxLen) : trimmed;
}

function sanitizePlantId(rawId: unknown): string {
  const base = typeof rawId === 'string' ? rawId.trim() : '';
  const cleaned = base.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 128);
  return cleaned || `plant-${Date.now()}`;
}

function sanitizeOptionsForFirestore(rawOptions: unknown): PlantPotOption[] {
  const list = Array.isArray(rawOptions) ? rawOptions : [];
  const sanitized: PlantPotOption[] = [];

  for (let i = 0; i < list.length && sanitized.length < 10; i++) {
    const item = list[i] as any;
    if (!item || typeof item !== 'object') continue;
    const rawPrice = Number(item.price);
    const price = Number.isFinite(rawPrice) && rawPrice > 0 ? Math.round(rawPrice) : 0;
    if (price <= 0) continue;

    sanitized.push({
      id: sanitizePlantId(item.id || `opt-${i + 1}`),
      labelBn: clampString(item.labelBn, 120) || 'মাঝারি গ্রো ব্যাগ চারা',
      labelEn: clampString(item.labelEn, 120) || 'Medium Grow Bag',
      price,
      containerType: (clampString(item.containerType, 60) || 'পলি গ্রো ব্যাগ') as PlantPotOption['containerType'],
    });
  }

  if (sanitized.length === 0) {
    sanitized.push({
      id: 'opt-default',
      labelBn: 'মাঝারি গ্রো ব্যাগ চারা',
      labelEn: 'Medium Grow Bag',
      price: 50,
      containerType: 'পলি গ্রো ব্যাগ',
    });
  }

  return sanitized;
}

/**
 * Strict sanitizer aligned 1-to-1 with `firestore.rules` `isValidPlant`:
 * - Strips any unknown metadata keys (e.g. `embeddedPhotos`)
 * - Enforces valid document ID characters and string size caps
 * - Guarantees >= 1 pot option with positive numeric price
 * - Enforces slot alignment between `images` (<= 3) and `cloudinaryPublicIds` (<= 3)
 * - Ensures secondary slots `images[1..2]` strictly satisfy `<= 2048` bytes and whole doc stays < 880 KB
 */
export function sanitizePlantForFirestore(plant: BrahmyamanPlant | BackupPlantEntry): Record<string, any> {
  const raw = plant as Record<string, any>;
  const cleanObj: Record<string, any> = {};

  for (const [key, val] of Object.entries(raw)) {
    if (val !== undefined && ALLOWED_FIRESTORE_PLANT_FIELDS.has(key)) {
      cleanObj[key] = val;
    }
  }

  cleanObj.id = sanitizePlantId(raw.id);
  cleanObj.nameBn = clampString(raw.nameBn, 300) || 'নামহীন চারা';
  cleanObj.category = clampString(raw.category, 150) || 'ছাদ ও বারান্দার ফুল';
  cleanObj.options = sanitizeOptionsForFirestore(raw.options);

  const stringBounds: Array<[string, number]> = [
    ['nameEn', 300],
    ['botanicalName', 200],
    ['badgeBn', 120],
    ['badgeEn', 120],
    ['colorBn', 120],
    ['colorEn', 120],
    ['sunlightBn', 300],
    ['sunlightEn', 300],
    ['wateringBn', 300],
    ['wateringEn', 300],
    ['soilTipBn', 300],
    ['soilTipEn', 300],
    ['descriptionBn', 3000],
    ['descriptionEn', 3000],
    ['createdAt', 100],
    ['createdAtBn', 200],
    ['updatedAt', 100],
    ['updatedAtBn', 200],
    ['deletedAt', 100],
    ['deletedAtBn', 200],
  ];

  for (const [field, maxLen] of stringBounds) {
    if (field in cleanObj) {
      const clamped = clampString(cleanObj[field], maxLen);
      if (clamped !== undefined) {
        cleanObj[field] = clamped;
      } else {
        delete cleanObj[field];
      }
    }
  }

  if (Array.isArray(cleanObj.audience)) {
    cleanObj.audience = cleanObj.audience
      .filter((a: unknown): a is string => typeof a === 'string' && a.trim().length > 0)
      .map((a: string) => a.trim().slice(0, 50))
      .slice(0, 10);
  } else {
    delete cleanObj.audience;
  }

  if (typeof cleanObj.featured !== 'boolean') delete cleanObj.featured;
  if (typeof cleanObj.inStock !== 'boolean') delete cleanObj.inStock;
  if (cleanObj.status !== 'active' && cleanObj.status !== 'deleted') {
    delete cleanObj.status;
  }

  // Normalize image & slots strictly to firestore.rules limits
  if (typeof cleanObj.image !== 'string') {
    cleanObj.image = '';
  } else {
    cleanObj.image = cleanObj.image.trim();
    if (cleanObj.image.length > 850000) {
      cleanObj.image = '';
    }
  }

  const rawImagesInput = Array.isArray(cleanObj.images)
    ? cleanObj.images
    : cleanObj.image
    ? [cleanObj.image]
    : [];

  const primaryIsCloudinary = cleanObj.image.startsWith('https://res.cloudinary.com/');

  const filteredSlotImages = rawImagesInput
    .slice(0, 3)
    .map((img: unknown, idx: number) => {
      if (typeof img !== 'string') return '';
      const trimmed = img.trim();
      if (!trimmed) return '';
      if (idx === 0 && trimmed.length > 850000) return '';
      if (idx > 0 && trimmed.length > 2048) return '';
      if (primaryIsCloudinary && trimmed.startsWith('data:image')) return '';
      return trimmed;
    });

  const aligned = alignPlantImageSlots(
    filteredSlotImages,
    Array.isArray(cleanObj.cloudinaryPublicIds) ? cleanObj.cloudinaryPublicIds : [],
    cleanObj.image
  );

  // Enforce firestore.rules limits even after primary-slot shift inside alignPlantImageSlots
  const safeAlignedImages = aligned.images.slice(0, 3).map((img, idx) => {
    if (idx === 0) return img.length <= 850000 ? img : '';
    return img.length <= 2048 ? img : '';
  });

  const finalAligned = alignPlantImageSlots(
    safeAlignedImages,
    aligned.cloudinaryPublicIds,
    cleanObj.image
  );

  if (finalAligned.images.length > 0) {
    cleanObj.images = finalAligned.images;
    if (!cleanObj.image) {
      cleanObj.image = finalAligned.primaryImage;
    }
  } else {
    cleanObj.images = [];
  }

  if (finalAligned.cloudinaryPublicIds.length > 0) {
    cleanObj.cloudinaryPublicIds = finalAligned.cloudinaryPublicIds
      .slice(0, 3)
      .map((id) => String(id).slice(0, 300));
  } else {
    delete cleanObj.cloudinaryPublicIds;
  }

  // Ensure total document size never breaches Firestore's 1MB cap (keeping safe limit under 880KB)
  let approxBytes = getUtf8Bytes(JSON.stringify(cleanObj));
  if (approxBytes > 880000) {
    // If total doc exceeds 880KB, progressively strip secondary base64 images first
    if (Array.isArray(cleanObj.images) && cleanObj.images.length > 1) {
      for (let s = cleanObj.images.length - 1; s >= 1; s--) {
        if (cleanObj.images[s]?.startsWith('data:image')) {
          cleanObj.images[s] = '';
          approxBytes = getUtf8Bytes(JSON.stringify(cleanObj));
          if (approxBytes <= 880000) break;
        }
      }
    }
    // If still oversized, check primary image
    if (approxBytes > 880000 && typeof cleanObj.image === 'string' && cleanObj.image.startsWith('data:image')) {
      cleanObj.image = '';
      if (Array.isArray(cleanObj.images) && cleanObj.images[0]?.startsWith('data:image')) {
        cleanObj.images[0] = '';
      }
    }
    // Realign slots cleanly
    const reAligned = alignPlantImageSlots(
      Array.isArray(cleanObj.images) ? cleanObj.images : [],
      Array.isArray(cleanObj.cloudinaryPublicIds) ? cleanObj.cloudinaryPublicIds : [],
      typeof cleanObj.image === 'string' ? cleanObj.image : ''
    );
    cleanObj.images = reAligned.images;
    cleanObj.image = reAligned.primaryImage || '';
    if (reAligned.cloudinaryPublicIds.length > 0) {
      cleanObj.cloudinaryPublicIds = reAligned.cloudinaryPublicIds;
    } else {
      delete cleanObj.cloudinaryPublicIds;
    }
  }

  return cleanObj;
}

export function buildUnifiedBackupBundle(params: {
  plants: BackupPlantEntry[];
  deletedSeedIds: string[];
  activityLogs: AdminActivityLogItem[];
  cloudinaryLibrary: {
    configured: boolean;
    cloudName: string | null;
    folder: string;
    totalAssets: number;
    totalBytes: number;
    truncated: boolean;
    resources: CloudinaryAssetRecord[];
  };
  exportedAtIso: string;
  exportedAtBn: string;
}): UnifiedBackupBundle {
  const {
    plants,
    deletedSeedIds,
    activityLogs,
    cloudinaryLibrary,
    exportedAtIso,
    exportedAtBn,
  } = params;

  // Build map from Cloudinary public_id -> array of plant IDs using it
  const publicIdToPlantIds = new Map<string, Set<string>>();
  const recordLink = (publicId: string, plantId: string) => {
    const clean = (publicId || '').trim();
    if (!clean) return;
    if (!publicIdToPlantIds.has(clean)) {
      publicIdToPlantIds.set(clean, new Set());
    }
    publicIdToPlantIds.get(clean)!.add(plantId);
  };

  for (const p of plants) {
    if (Array.isArray(p.cloudinaryPublicIds)) {
      for (const pid of p.cloudinaryPublicIds) {
        recordLink(pid, p.id);
      }
    }
    if (p.image) {
      recordLink(extractCloudinaryPublicIdFromUrl(p.image), p.id);
    }
    if (Array.isArray(p.images)) {
      for (const imgUrl of p.images) {
        recordLink(extractCloudinaryPublicIdFromUrl(imgUrl), p.id);
      }
    }
  }

  const annotatedResources: BackupCloudinaryAssetEntry[] = cloudinaryLibrary.resources.map((asset) => {
    const linkedIds = Array.from(publicIdToPlantIds.get(asset.public_id) || []);
    return {
      ...asset,
      linkedPlantIds: linkedIds,
      isOrphan: linkedIds.length === 0,
    };
  });

  const linkedAssetsCount = annotatedResources.filter((r) => !r.isOrphan).length;
  const orphanAssetsCount = annotatedResources.filter((r) => r.isOrphan).length;
  const activePlants = plants.filter((p) => p.status !== 'deleted').length;
  const trashPlants = plants.filter((p) => p.status === 'deleted').length;

  const categories = Array.from(
    new Set(plants.map((p) => p.category).filter((c): c is BrahmyamanPlant['category'] => Boolean(c)))
  );

  return {
    backupVersion: UNIFIED_BACKUP_VERSION,
    exportedAt: exportedAtIso,
    exportedAtBn,
    summary: {
      totalPlants: plants.length,
      activePlants,
      trashPlants,
      deletedSeedIdsCount: deletedSeedIds.length,
      cloudinaryAssetsCount: cloudinaryLibrary.totalAssets,
      cloudinaryTotalBytes: cloudinaryLibrary.totalBytes,
      cloudinaryLinkedAssetsCount: linkedAssetsCount,
      cloudinaryOrphanAssetsCount: orphanAssetsCount,
      cloudinaryTruncated: cloudinaryLibrary.truncated,
      activityLogsCount: activityLogs.length,
    },
    siteProfile: {
      nurseryNameBn: 'ব্রাহ্ম্যমাণ নার্সারি',
      nurseryNameEn: 'Brahmyaman Nursery',
      locationBn: 'কালশুলি, বাঁকুড়া, পশ্চিমবঙ্গ - ৭২২১৬০',
      locationEn: 'Kalsuli, Bankura, West Bengal - 722160',
      pinCode: '722160',
      phone: '+918609417672',
      whatsappNumber: '918609417672',
      mapUrl: 'https://maps.app.goo.gl/zLQBxPHZKqK9ofLJ8',
      visitingHoursBn: 'প্রতিদিন সকাল ৬:৩০ – সন্ধ্যা ৬:৩০',
      visitingHoursEn: 'Daily 6:30 AM – 6:30 PM',
      serviceLocationsBn: 'কালশুলি, পারসোলা, খাতড়া ও সিমলাপাল',
      serviceLocationsEn: 'Kalsuli, Parsola, Khatra & Simlapal',
      categories,
    },
    firebaseCatalog: {
      plants,
      deletedSeedIds,
      activityLogs,
    },
    cloudinaryMediaLibrary: {
      configured: cloudinaryLibrary.configured,
      cloudName: cloudinaryLibrary.cloudName,
      folder: cloudinaryLibrary.folder,
      totalAssets: cloudinaryLibrary.totalAssets,
      totalBytes: cloudinaryLibrary.totalBytes,
      truncated: cloudinaryLibrary.truncated,
      linkedAssetsCount,
      orphanAssetsCount,
      resources: annotatedResources,
    },
    aiRebuildBlueprint: {
      purpose:
        'Complete portable snapshot of Brahmyaman Nursery (Firebase catalog, prices, Bengali/English details, Cloudinary URLs + offline Base64 embeddedPhotos, tombstones, and media manifest) for 1-click site restoration or rebuilding with any future AI.',
      recommendedStack: [
        'React + TypeScript + Vite + Tailwind CSS',
        'Firebase Firestore (`plants`, `catalog_meta/deleted_seeds`, `activity_logs`)',
        'Firebase Auth (verified Admin & Owner email allowlists)',
        'Cloudinary media storage (`brahmyaman_plants` folder, max 3 photo slots per plant)',
        'WhatsApp Inquiry Cart Checkout (direct wa.me deep-linking without payment gateway)',
      ],
      dataSchemaNotes: {
        plantsCollection:
          'Each entry in `firebaseCatalog.plants` holds plant ID, Bengali/English names, category, care tips, `options[]` pricing tiers, `image` + `images[]` (up to 3 slots), `cloudinaryPublicIds[]`, and `embeddedPhotos` (`slot0DataUrl`, `slot1DataUrl`, `slot2DataUrl`) for offline zero-loss photo recovery.',
        deletedSeedIds:
          'Tombstone IDs stored in `catalog_meta/deleted_seeds` so permanently deleted built-in saplings never resurrect.',
        cloudinaryMediaLibrary:
          'Complete manifest of uploaded Cloudinary image assets, dimensions, tags, and `linkedPlantIds` mapping.',
      },
      rebuildPromptForNextAI:
        'Build a bilingual (Bengali + English) Nursery Storefront & Admin Inventory web application for Brahmyaman Nursery (Kalsuli, Bankura, 722160) using this JSON backup. Import all items from `firebaseCatalog.plants` (including names, categories, care tips, `options` pot prices, and photos—preferring `embeddedPhotos` data URLs or uploading them to Cloudinary if `image` URL is unreachable), preserve `deletedSeedIds` tombstones, configure WhatsApp ordering to `+918609417672`, and provide an Admin panel for CRUD + Cloudinary uploads + full JSON backup/restore.',
    },
  };
}

/**
 * Rehydrates an entry from v1 / v2 / v3 backup JSON:
 * Uses `embeddedPhotos` (`slot0DataUrl`..`slot2DataUrl`) as offline fallback when URL is missing,
 * while preserving the primary Cloudinary URL when available.
 */
function normalizeImportedPlant(raw: any): BackupPlantEntry | null {
  if (!raw || typeof raw !== 'object') return null;
  if (typeof raw.id !== 'string' || !raw.id.trim()) return null;
  if (typeof raw.nameBn !== 'string' || !raw.nameBn.trim()) return null;
  if (!Array.isArray(raw.options) || raw.options.length === 0) return null;

  const entry: BackupPlantEntry = { ...raw };
  const embedded = raw.embeddedPhotos as EmbeddedPlantPhotos | undefined;

  if (embedded && typeof embedded === 'object') {
    const slotUrls = Array.isArray(entry.images) ? [...entry.images] : entry.image ? [entry.image] : [];
    if ((!entry.image || !entry.image.trim()) && embedded.slot0DataUrl) {
      entry.image = embedded.slot0DataUrl;
    }
    const hydratedSlots: string[] = [];
    const fallbackSlots = [embedded.slot0DataUrl, embedded.slot1DataUrl, embedded.slot2DataUrl];
    const slotCount = Math.max(slotUrls.length, fallbackSlots.filter(Boolean).length);
    for (let i = 0; i < Math.min(3, slotCount); i++) {
      const cur = typeof slotUrls[i] === 'string' ? slotUrls[i].trim() : '';
      const fb = typeof fallbackSlots[i] === 'string' ? fallbackSlots[i]!.trim() : '';
      hydratedSlots.push(cur || fb || '');
    }
    const nonEmpty = hydratedSlots.filter(Boolean);
    if (nonEmpty.length > 0) {
      entry.images = hydratedSlots;
      if (!entry.image || !entry.image.trim()) {
        entry.image = nonEmpty[0];
      }
    }
  }

  return entry;
}

export function parseUnifiedBackupPayload(rawText: string): ParsedUnifiedBackup | null {
  let parsed: any;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return null;
  }

  let rawPlants: any[] | null = null;
  let deletedSeedIds: string[] = [];
  let activityLogs: AdminActivityLogItem[] = [];
  let cloudinaryAssetsCount = 0;
  let backupVersion = '1.0-array';

  if (Array.isArray(parsed)) {
    rawPlants = parsed;
    backupVersion = '1.0-array';
  } else if (parsed && typeof parsed === 'object') {
    if (parsed.firebaseCatalog && Array.isArray(parsed.firebaseCatalog.plants)) {
      backupVersion = String(parsed.backupVersion || UNIFIED_BACKUP_VERSION);
      rawPlants = parsed.firebaseCatalog.plants;
      if (Array.isArray(parsed.firebaseCatalog.deletedSeedIds)) {
        deletedSeedIds = parsed.firebaseCatalog.deletedSeedIds.filter(
          (id: unknown): id is string => typeof id === 'string' && id.trim().length > 0
        );
      }
      if (Array.isArray(parsed.firebaseCatalog.activityLogs)) {
        activityLogs = parsed.firebaseCatalog.activityLogs;
      }
      if (parsed.cloudinaryMediaLibrary && Array.isArray(parsed.cloudinaryMediaLibrary.resources)) {
        cloudinaryAssetsCount = parsed.cloudinaryMediaLibrary.resources.length;
      }
    } else if (Array.isArray(parsed.plants)) {
      backupVersion = String(parsed.backupVersion || '2.0-catalog');
      rawPlants = parsed.plants;
    }
  }

  if (!rawPlants) return null;

  const plants = rawPlants
    .map(normalizeImportedPlant)
    .filter((p): p is BackupPlantEntry => p !== null);

  if (plants.length === 0) return null;

  return {
    backupVersion,
    plants,
    deletedSeedIds,
    activityLogs,
    cloudinaryAssetsCount,
  };
}
