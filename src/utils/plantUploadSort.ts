import type { AdminActivityLogItem, BrahmyamanPlant } from '../types/nursery';
import { getBengaliDateTime } from './bengaliDateTime';

export interface ClassifiedPlantUploadInfo {
  plant: BrahmyamanPlant;
  /** True when this plant was added, photo-uploaded, or individually edited by the Admin */
  isUserUploaded: boolean;
  /** Upload/update epoch milliseconds (0 for untouched static seed catalog items) */
  uploadTimestampMs: number;
  /** Formatted Bengali Date & Time string for display in row-by-row lists */
  uploadDateTimeBn: string;
  /** Human-readable source label in Bengali */
  uploadSourceLabelBn: 'নতুন সংযোজন' | 'ছবি/তথ্য আপলোড' | 'মূল ক্যাটালগ';
  /** Short badge label in Bengali */
  uploadBadgeBn: 'নতুন সংযোজন' | 'আপলোড করা' | 'মূল ক্যাটালগ';
}

function isStaticSeedId(id?: string): boolean {
  if (!id || typeof id !== 'string') return false;
  const trimmed = id.trim();
  return trimmed.startsWith('ashoke-') || trimmed.startsWith('brahmyaman-');
}

function parseIsoMs(iso?: string): number {
  if (!iso || typeof iso !== 'string') return 0;
  const ms = Date.parse(iso.trim());
  return Number.isFinite(ms) && ms > 0 ? ms : 0;
}

function parseEpochFromPlantId(id?: string): number {
  if (!id || typeof id !== 'string') return 0;
  const match = id.trim().match(/^plant-(\d{10,15})/);
  if (!match) return 0;
  const num = Number(match[1]);
  return Number.isFinite(num) && num > 1_000_000_000_000 ? num : 0;
}

function hasCustomUploadedPhoto(plant: BrahmyamanPlant): boolean {
  const slots = [plant.image, ...(Array.isArray(plant.images) ? plant.images : [])].filter(
    (s): s is string => typeof s === 'string' && s.trim().length > 0
  );
  if (
    slots.some((s) => s.startsWith('https://res.cloudinary.com/') || s.startsWith('data:image/'))
  ) {
    return true;
  }
  if (
    Array.isArray(plant.cloudinaryPublicIds) &&
    plant.cloudinaryPublicIds.some((pid) => typeof pid === 'string' && pid.trim().length > 0)
  ) {
    return true;
  }
  return false;
}

/**
 * Detects bulk auto-bug-fix timestamps that were stamped onto many static seed plants at once
 * (`handleRunBugFix` previously stamped `updatedAt` on all static seeds in a single batch).
 */
function findBulkAutoFixTimestamps(plants: BrahmyamanPlant[]): Set<string> {
  const counts = new Map<string, number>();
  for (const p of plants) {
    if (!isStaticSeedId(p.id)) continue;
    if (p.createdAt) continue;
    const key = (p.updatedAtBn || p.updatedAt || '').trim();
    if (!key) continue;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const bulkKeys = new Set<string>();
  for (const [key, count] of counts.entries()) {
    // If 5 or more static seed plants share the exact same updatedAtBn/updatedAt without createdAt,
    // that timestamp came from a bulk auto-bug-fix pass, not an individual admin upload.
    if (count >= 5) {
      bulkKeys.add(key);
    }
  }
  return bulkKeys;
}

/**
 * Classifies every plant into a `Map<string, ClassifiedPlantUploadInfo>` (keyed by `plant.id`) so that:
 * 1. Newly uploaded or admin-edited plants (e.g. "টিউলিপ", "জাম", or any plant with a Cloudinary/custom photo)
 *    ALWAYS appear at the top (`isUserUploaded = true`), sorted strictly by Date & Time (newest first).
 * 2. Untouched static seed plants (`ashoke-*` / `brahmyaman-*`) never jump ahead of admin-uploaded plants
 *    even if an earlier Auto Bug Fix stamped a bulk `updatedAt` on them.
 */
export function classifyPlantsByUpload(
  plants: BrahmyamanPlant[],
  activityLogs: AdminActivityLogItem[] = []
): Map<string, ClassifiedPlantUploadInfo> {
  const bulkAutoFixKeys = findBulkAutoFixTimestamps(plants);

  // Index individual plant activity logs (plant_add, photo_upload, price_update, or single-plant plant_edit)
  const latestLogByPlantId = new Map<string, { ms: number; dateTimeBn: string }>();
  const latestLogByName = new Map<string, { ms: number; dateTimeBn: string }>();

  for (const log of activityLogs) {
    if (
      log.actionType !== 'plant_add' &&
      log.actionType !== 'photo_upload' &&
      log.actionType !== 'price_update' &&
      log.actionType !== 'plant_edit'
    ) {
      continue;
    }
    if (log.titleBn.includes('বাগ ফিক্স') || log.titleBn.includes('বাল্ক দাম')) continue;

    const ms = parseIsoMs(log.timestamp);
    const dtBn =
      log.dateBn && log.timeBn
        ? `${log.dateBn} · ${log.timeBn}`
        : log.dateBn || (ms > 0 ? getBengaliDateTime(new Date(ms)).fullText : '');

    if (log.plantId) {
      const prev = latestLogByPlantId.get(log.plantId);
      if (!prev || ms >= prev.ms) {
        latestLogByPlantId.set(log.plantId, { ms, dateTimeBn: dtBn });
      }
    }
    if (log.plantNameBn) {
      const nameKey = log.plantNameBn.trim().toLowerCase();
      const prev = latestLogByName.get(nameKey);
      if (!prev || ms >= prev.ms) {
        latestLogByName.set(nameKey, { ms, dateTimeBn: dtBn });
      }
    }
  }

  const resultMap = new Map<string, ClassifiedPlantUploadInfo>();

  for (const plant of plants) {
    const isSeed = isStaticSeedId(plant.id);
    const isCustomAdded = !isSeed;
    const customPhoto = hasCustomUploadedPhoto(plant);
    const hasCreatedField = Boolean(plant.createdAt && plant.createdAt.trim());
    const logMatch =
      latestLogByPlantId.get(plant.id) ||
      latestLogByName.get(plant.nameBn.trim().toLowerCase());

    const rawUpdatedKey = (plant.updatedAtBn || plant.updatedAt || '').trim();
    const isBulkAutoFixTimestamp = Boolean(
      isSeed && !hasCreatedField && bulkAutoFixKeys.has(rawUpdatedKey)
    );

    const hasGenuineIndividualTimestamp =
      Boolean(plant.updatedAt && !isBulkAutoFixTimestamp) || hasCreatedField;

    const isUserUploaded =
      isCustomAdded ||
      customPhoto ||
      hasCreatedField ||
      Boolean(logMatch) ||
      hasGenuineIndividualTimestamp;

    if (!isUserUploaded) {
      resultMap.set(plant.id, {
        plant,
        isUserUploaded: false,
        uploadTimestampMs: 0,
        uploadDateTimeBn: 'মূল ক্যাটালগ চারা',
        uploadSourceLabelBn: 'মূল ক্যাটালগ',
        uploadBadgeBn: 'মূল ক্যাটালগ',
      });
      continue;
    }

    const createdMs = parseIsoMs(plant.createdAt);
    const updatedMs = isBulkAutoFixTimestamp ? 0 : parseIsoMs(plant.updatedAt);
    const idEpochMs = parseEpochFromPlantId(plant.id);
    const logMs = logMatch?.ms || 0;

    const bestMs = Math.max(updatedMs, createdMs, logMs, idEpochMs, 1);

    let uploadDateTimeBn = '';
    if (!isBulkAutoFixTimestamp && plant.updatedAtBn && plant.updatedAtBn.trim()) {
      uploadDateTimeBn = plant.updatedAtBn.trim();
    } else if (plant.createdAtBn && plant.createdAtBn.trim()) {
      uploadDateTimeBn = plant.createdAtBn.trim();
    } else if (logMatch?.dateTimeBn) {
      uploadDateTimeBn = logMatch.dateTimeBn;
    } else if (bestMs > 1_000_000_000_000) {
      uploadDateTimeBn = getBengaliDateTime(new Date(bestMs)).fullText;
    } else {
      uploadDateTimeBn = 'আপলোড করা চারা';
    }

    resultMap.set(plant.id, {
      plant,
      isUserUploaded: true,
      uploadTimestampMs: bestMs,
      uploadDateTimeBn,
      uploadSourceLabelBn: isCustomAdded ? 'নতুন সংযোজন' : 'ছবি/তথ্য আপলোড',
      uploadBadgeBn: isCustomAdded ? 'নতুন সংযোজন' : 'আপলোড করা',
    });
  }

  return resultMap;
}

/**
 * Sorts a list of plants so that ALL user-uploaded / user-edited plants appear at the VERY TOP
 * in strict reverse-chronological order (Newest Upload First), followed by default static catalog plants
 * in their original order.
 */
export function sortPlantsWithUploadsFirst(
  plants: BrahmyamanPlant[],
  activityLogs: AdminActivityLogItem[] = []
): BrahmyamanPlant[] {
  const infoMap = classifyPlantsByUpload(plants, activityLogs);
  const originalIndex = new Map<string, number>();
  plants.forEach((p, idx) => originalIndex.set(p.id, idx));

  return [...plants].sort((a, b) => {
    const infoA = infoMap.get(a.id);
    const infoB = infoMap.get(b.id);
    const upA = Boolean(infoA?.isUserUploaded);
    const upB = Boolean(infoB?.isUserUploaded);

    if (upA !== upB) {
      return upA ? -1 : 1;
    }
    if (upA && upB) {
      const msDiff = (infoB?.uploadTimestampMs || 0) - (infoA?.uploadTimestampMs || 0);
      if (msDiff !== 0) return msDiff;
      return b.id.localeCompare(a.id);
    }
    return (originalIndex.get(a.id) ?? 9999) - (originalIndex.get(b.id) ?? 9999);
  });
}
