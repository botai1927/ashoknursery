import type { BrahmyamanPlant } from '../types/nursery';

export interface CloudinaryAssetRecord {
  public_id: string;
  url: string;
  format?: string;
  bytes: number;
  width?: number;
  height?: number;
  created_at?: string;
  folder?: string;
  tags?: string[];
}

export interface AlignedPlantImageSlots {
  primaryImage: string;
  images: string[];
  cloudinaryPublicIds: string[];
}

/**
 * Extracts a Cloudinary public_id from a standard `https://res.cloudinary.com/<cloud>/image/upload/...` URL.
 * Returns empty string for non-Cloudinary URLs, local assets, or malformed strings.
 */
export function extractCloudinaryPublicIdFromUrl(url: unknown): string {
  if (typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed.startsWith('https://res.cloudinary.com/')) return '';

  try {
    const parsed = new URL(trimmed);
    const parts = parsed.pathname.split('/').filter(Boolean);
    const uploadIdx = parts.indexOf('upload');
    if (uploadIdx === -1 || uploadIdx + 1 >= parts.length) return '';

    let cursor = uploadIdx + 1;
    // Skip optional Cloudinary transformation segments (e.g. w_1400,h_1400,c_limit,q_auto:good,f_auto)
    while (
      cursor < parts.length &&
      parts[cursor].includes(',') &&
      !/^v\d+$/.test(parts[cursor])
    ) {
      cursor += 1;
    }
    // Skip optional version segment (v1234567890)
    if (cursor < parts.length && /^v\d+$/.test(parts[cursor])) {
      cursor += 1;
    }

    if (cursor >= parts.length) return '';
    const joined = decodeURIComponent(parts.slice(cursor).join('/'));
    // Strip trailing file extension (.webp, .jpg, .png, etc.)
    return joined.replace(/\.[a-zA-Z0-9]{2,5}$/, '').trim();
  } catch {
    return '';
  }
}

/**
 * Normalizes plant `images` and `cloudinaryPublicIds` so slot indices stay strictly 1-to-1 aligned (max 3 slots).
 * Prevents non-Cloudinary presets or sparse slots from shifting another slot's public_id onto the wrong index.
 */
export function alignPlantImageSlots(
  rawImages: Array<string | undefined | null>,
  rawPublicIds: Array<string | undefined | null> = [],
  fallbackPrimaryImage = ''
): AlignedPlantImageSlots {
  const maxSlots = 3;
  const alignedImages: string[] = [];
  const alignedPublicIds: string[] = [];

  for (let i = 0; i < maxSlots; i += 1) {
    const candidateImg = typeof rawImages[i] === 'string' ? rawImages[i]!.trim() : '';
    if (!candidateImg) continue;

    const extractedFromUrl = extractCloudinaryPublicIdFromUrl(candidateImg);
    const candidatePid = typeof rawPublicIds[i] === 'string' ? rawPublicIds[i]!.trim() : '';

    let resolvedPid = '';
    if (extractedFromUrl) {
      resolvedPid = extractedFromUrl;
    } else if (
      candidatePid &&
      !candidateImg.startsWith('data:image') &&
      !candidateImg.startsWith('/assets/')
    ) {
      // Preserve legacy explicit public_id if URL is already non-local custom delivery
      resolvedPid = candidateImg.includes('cloudinary.com') ? candidatePid : '';
    }

    alignedImages.push(candidateImg);
    alignedPublicIds.push(resolvedPid);
  }

  if (alignedImages.length === 0 && fallbackPrimaryImage.trim()) {
    const cleanPrimary = fallbackPrimaryImage.trim();
    alignedImages.push(cleanPrimary);
    alignedPublicIds.push(extractCloudinaryPublicIdFromUrl(cleanPrimary));
  }

  // Trim trailing empty placeholders so Firestore documents stay compact while preserving slot index alignment
  while (
    alignedPublicIds.length > 0 &&
    alignedPublicIds[alignedPublicIds.length - 1] === ''
  ) {
    alignedPublicIds.pop();
  }

  return {
    primaryImage: alignedImages[0] || fallbackPrimaryImage.trim(),
    images: alignedImages.slice(0, maxSlots),
    cloudinaryPublicIds: alignedPublicIds.slice(0, maxSlots),
  };
}

export interface CatalogCloudinaryReferences {
  activePublicIds: Set<string>;
  trashedPublicIds: Set<string>;
  allCatalogPublicIds: Set<string>;
}

/**
 * Collects every Cloudinary public_id referenced by active vs trashed catalog plants,
 * checking both `cloudinaryPublicIds[]` and URLs in `image` / `images[]`.
 */
export function collectReferencedCloudinaryPublicIds(
  plants: BrahmyamanPlant[]
): CatalogCloudinaryReferences {
  const activePublicIds = new Set<string>();
  const trashedPublicIds = new Set<string>();

  for (const plant of plants) {
    if (!plant) continue;
    const targetSet = plant.status === 'deleted' ? trashedPublicIds : activePublicIds;

    if (Array.isArray(plant.cloudinaryPublicIds)) {
      for (const pid of plant.cloudinaryPublicIds) {
        if (typeof pid === 'string' && pid.trim()) {
          targetSet.add(pid.trim());
        }
      }
    }

    const fromPrimary = extractCloudinaryPublicIdFromUrl(plant.image);
    if (fromPrimary) targetSet.add(fromPrimary);

    if (Array.isArray(plant.images)) {
      for (const img of plant.images) {
        const fromSlot = extractCloudinaryPublicIdFromUrl(img);
        if (fromSlot) targetSet.add(fromSlot);
      }
    }
  }

  // If a public_id is used by at least one active plant, do not classify it as trashed-only
  for (const activeId of activePublicIds) {
    trashedPublicIds.delete(activeId);
  }

  const allCatalogPublicIds = new Set<string>([
    ...activePublicIds,
    ...trashedPublicIds,
  ]);

  return { activePublicIds, trashedPublicIds, allCatalogPublicIds };
}

export interface CloudinaryOrphanItem {
  publicId: string;
  url: string;
  bytes: number;
  format: string;
  createdAt: string;
  width?: number;
  height?: number;
  inTrashOnly: boolean;
}

export interface CloudinaryOrphanScanReport {
  scannedAtIso: string;
  totalCloudinaryAssets: number;
  activeReferencedCount: number;
  trashedOnlyAssets: CloudinaryOrphanItem[];
  orphans: CloudinaryOrphanItem[];
  totalOrphanBytes: number;
  totalTrashedOnlyBytes: number;
  truncated: boolean;
  summaryText: string;
}

export type CloudinaryResourcePageFetcher = (cursor?: string) => Promise<{
  resources: CloudinaryAssetRecord[];
  next_cursor?: string | null;
}>;

/**
 * Scans the Cloudinary library (paginated, read-only) and identifies public IDs no longer
 * referenced by any active plant in the Firestore catalog. Produces a manual deletion summary report.
 */
export async function scanCloudinaryOrphans(params: {
  plants: BrahmyamanPlant[];
  fetchResourcePage: CloudinaryResourcePageFetcher;
  maxPages?: number;
}): Promise<CloudinaryOrphanScanReport> {
  const { plants, fetchResourcePage, maxPages = 5 } = params;
  const refs = collectReferencedCloudinaryPublicIds(plants);

  const allAssets: CloudinaryAssetRecord[] = [];
  const seenIds = new Set<string>();
  let cursor: string | undefined = undefined;
  let truncated = false;

  for (let page = 0; page < maxPages; page += 1) {
    const res = await fetchResourcePage(cursor);
    const list = Array.isArray(res?.resources) ? res.resources : [];
    for (const item of list) {
      if (item && typeof item.public_id === 'string' && !seenIds.has(item.public_id)) {
        seenIds.add(item.public_id);
        allAssets.push(item);
      }
    }

    if (res?.next_cursor) {
      if (page + 1 >= maxPages) {
        truncated = true;
      } else {
        cursor = res.next_cursor;
      }
    } else {
      break;
    }
  }

  const orphans: CloudinaryOrphanItem[] = [];
  const trashedOnlyAssets: CloudinaryOrphanItem[] = [];
  let totalOrphanBytes = 0;
  let totalTrashedOnlyBytes = 0;
  let activeReferencedCount = 0;

  for (const asset of allAssets) {
    const pid = asset.public_id.trim();
    if (refs.activePublicIds.has(pid)) {
      activeReferencedCount += 1;
      continue;
    }

    const item: CloudinaryOrphanItem = {
      publicId: pid,
      url: asset.url,
      bytes: Number(asset.bytes) || 0,
      format: asset.format || 'webp',
      createdAt: asset.created_at || '',
      width: asset.width,
      height: asset.height,
      inTrashOnly: refs.trashedPublicIds.has(pid),
    };

    if (item.inTrashOnly) {
      trashedOnlyAssets.push(item);
      totalTrashedOnlyBytes += item.bytes;
    } else {
      orphans.push(item);
      totalOrphanBytes += item.bytes;
    }
  }

  const report: CloudinaryOrphanScanReport = {
    scannedAtIso: new Date().toISOString(),
    totalCloudinaryAssets: allAssets.length,
    activeReferencedCount,
    trashedOnlyAssets,
    orphans,
    totalOrphanBytes,
    totalTrashedOnlyBytes,
    truncated,
    summaryText: '',
  };
  report.summaryText = formatOrphanSummaryReport(report);
  return report;
}

export function formatOrphanSummaryReport(report: CloudinaryOrphanScanReport): string {
  const orphanKb = (report.totalOrphanBytes / 1024).toFixed(1);
  const trashedKb = (report.totalTrashedOnlyBytes / 1024).toFixed(1);
  const lines: string[] = [
    `Cloudinary Orphan Audit (${report.scannedAtIso})`,
    `Total scanned assets: ${report.totalCloudinaryAssets}${report.truncated ? ' (truncated at page cap)' : ''}`,
    `Referenced by active plants: ${report.activeReferencedCount}`,
    `Referenced only in Trash (keep until permanently deleted): ${report.trashedOnlyAssets.length} (${trashedKb} KB)`,
    `Orphan assets (unreferenced by any plant): ${report.orphans.length} (${orphanKb} KB reclaimable)`,
  ];

  if (report.orphans.length > 0) {
    lines.push('Orphan public IDs for manual review/deletion:');
    for (const o of report.orphans) {
      lines.push(`- ${o.publicId} (${(o.bytes / 1024).toFixed(1)} KB, ${o.format}) ${o.url}`);
    }
  }

  return lines.join('\n');
}

/**
 * Convenience browser helper calling `/api/admin/cloudinary-resources` with Firebase Bearer headers.
 */
export async function scanCloudinaryLibraryForAdmin(params: {
  plants: BrahmyamanPlant[];
  getAuthHeaders: () => Promise<HeadersInit>;
  folder?: string;
}): Promise<CloudinaryOrphanScanReport> {
  const { plants, getAuthHeaders, folder } = params;
  return scanCloudinaryOrphans({
    plants,
    fetchResourcePage: async (cursor) => {
      const headers = await getAuthHeaders();
      const qs = new URLSearchParams();
      if (folder) qs.set('folder', folder);
      if (cursor) qs.set('cursor', cursor);

      const res = await fetch(`/api/admin/cloudinary-resources?${qs.toString()}`, {
        headers,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        const err: any = new Error(data?.error || 'Cloudinary অডিট স্ক্যান ব্যর্থ হয়েছে');
        err.status = res.status;
        throw err;
      }
      return {
        resources: Array.isArray(data.resources) ? data.resources : [],
        next_cursor: data.next_cursor || null,
      };
    },
  });
}
