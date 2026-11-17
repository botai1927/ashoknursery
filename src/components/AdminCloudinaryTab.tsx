import { useMemo, useState } from 'react';
import {
  Cloud,
  RefreshCw,
  Upload,
  Search,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Image as ImageIcon,
  FolderOpen,
  X,
} from 'lucide-react';
import type { BrahmyamanPlant } from '../types/nursery';
import {
  collectReferencedCloudinaryPublicIds,
  extractCloudinaryPublicIdFromUrl,
  type CloudinaryAssetRecord,
  type CloudinaryOrphanScanReport,
} from '../utils/cloudinaryCleanup';
import { resolvePlantImageUrl } from '../utils/imageUrl';
import { PUJA_IMAGE } from '../data/brahmyamanCatalog';

type AssetFilter = 'all' | 'active' | 'trash' | 'orphan';

interface AdminCloudinaryTabProps {
  plants: BrahmyamanPlant[];
  cloudinaryStatus: {
    configured: boolean;
    verified?: boolean;
    cloudName: string | null;
    folder?: string;
    errorCode?: string | null;
    errorMessage?: string | null;
  } | null;
  base64PhotoCount: number;
  isMigratingBase64: boolean;
  migrationProgress: { current: number; total: number; success: number } | null;
  orphanReport: CloudinaryOrphanScanReport | null;
  isScanningOrphans: boolean;
  deletingOrphanId: string | null;
  mediaAssets: CloudinaryAssetRecord[] | null;
  mediaLibraryTotalBytes: number;
  mediaLibraryTruncated: boolean;
  isLoadingMediaLibrary: boolean;
  onVerifyCloudinary: () => void;
  onRunBase64Migration: () => void;
  onScanOrphans: () => void;
  onLoadMediaLibrary: () => void;
  onDeleteOrphan: (publicId: string) => void;
  onEditPlant: (plant: BrahmyamanPlant) => void;
  onOpenTrash: () => void;
}

export function AdminCloudinaryTab({
  plants,
  cloudinaryStatus,
  base64PhotoCount,
  isMigratingBase64,
  migrationProgress,
  orphanReport,
  isScanningOrphans,
  deletingOrphanId,
  mediaAssets,
  mediaLibraryTotalBytes,
  mediaLibraryTruncated,
  isLoadingMediaLibrary,
  onVerifyCloudinary,
  onRunBase64Migration,
  onScanOrphans,
  onLoadMediaLibrary,
  onDeleteOrphan,
  onEditPlant,
  onOpenTrash,
}: AdminCloudinaryTabProps) {
  const [assetFilter, setAssetFilter] = useState<AssetFilter>('all');
  const [assetSearch, setAssetSearch] = useState('');

  const catalogAudit = useMemo(() => {
    let cloudinaryPlantCount = 0;
    const nonCloudinaryPlants: Array<{ plant: BrahmyamanPlant; reason: 'base64' | 'preset' }> = [];

    for (const p of plants) {
      if (p.status === 'deleted') continue;
      const slots = [p.image, ...(Array.isArray(p.images) ? p.images : [])].filter(
        (u): u is string => typeof u === 'string' && u.trim().length > 0
      );
      if (slots.some((u) => u.startsWith('https://res.cloudinary.com/'))) {
        cloudinaryPlantCount += 1;
      } else if (slots.some((u) => u.startsWith('data:image/'))) {
        nonCloudinaryPlants.push({ plant: p, reason: 'base64' });
      } else {
        nonCloudinaryPlants.push({ plant: p, reason: 'preset' });
      }
    }

    return {
      cloudinaryPlantCount,
      nonCloudinaryPlants,
    };
  }, [plants]);

  // Map public_id -> plants referencing it (so Media Library can show plant names + direct Edit!)
  const publicIdToPlants = useMemo(() => {
    const map = new Map<string, BrahmyamanPlant[]>();
    const addLink = (pid: string, plant: BrahmyamanPlant) => {
      const clean = pid.trim();
      if (!clean) return;
      const list = map.get(clean) || [];
      if (!list.some((item) => item.id === plant.id)) {
        list.push(plant);
        map.set(clean, list);
      }
    };

    for (const p of plants) {
      if (Array.isArray(p.cloudinaryPublicIds)) {
        for (const pid of p.cloudinaryPublicIds) {
          if (typeof pid === 'string') addLink(pid, p);
        }
      }
      const primaryPid = extractCloudinaryPublicIdFromUrl(p.image);
      if (primaryPid) addLink(primaryPid, p);
      if (Array.isArray(p.images)) {
        for (const u of p.images) {
          const slotPid = extractCloudinaryPublicIdFromUrl(u);
          if (slotPid) addLink(slotPid, p);
        }
      }
    }
    return map;
  }, [plants]);

  const refSets = useMemo(() => collectReferencedCloudinaryPublicIds(plants), [plants]);

  const enrichedAssets = useMemo(() => {
    if (!mediaAssets) return [];
    const q = assetSearch.trim().toLowerCase();
    return mediaAssets
      .map((asset) => {
        const pid = asset.public_id.trim();
        const linked = publicIdToPlants.get(pid) || [];
        const status: 'active' | 'trash' | 'orphan' = refSets.activePublicIds.has(pid)
          ? 'active'
          : refSets.trashedPublicIds.has(pid)
          ? 'trash'
          : 'orphan';
        return {
          asset,
          linked,
          status,
        };
      })
      .filter((entry) => {
        if (assetFilter !== 'all' && entry.status !== assetFilter) return false;
        if (!q) return true;
        return (
          entry.asset.public_id.toLowerCase().includes(q) ||
          entry.linked.some((p) => p.nameBn.toLowerCase().includes(q) || p.nameEn.toLowerCase().includes(q))
        );
      });
  }, [mediaAssets, publicIdToPlants, refSets, assetFilter, assetSearch]);

  const assetStatusCounts = useMemo(() => {
    if (!mediaAssets) return { all: 0, active: 0, trash: 0, orphan: 0 };
    let active = 0;
    let trash = 0;
    let orphan = 0;
    for (const asset of mediaAssets) {
      const pid = asset.public_id.trim();
      if (refSets.activePublicIds.has(pid)) active += 1;
      else if (refSets.trashedPublicIds.has(pid)) trash += 1;
      else orphan += 1;
    }
    return { all: mediaAssets.length, active, trash, orphan };
  }, [mediaAssets, refSets]);

  const formatKb = (bytes: number) =>
    bytes >= 1024 * 1024
      ? `${(bytes / (1024 * 1024)).toFixed(2)} MB`
      : `${(bytes / 1024).toFixed(1)} KB`;

  return (
    <div className="space-y-4">
      {/* 1. Connection & Health Card */}
      <div className="bg-white border border-[#E8E1D5] rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#1B8354]/10 text-[#1B8354] flex items-center justify-center shrink-0">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif-bn text-base sm:text-lg font-bold text-[#142318]">
                Cloudinary মিডিয়া ও স্টোরেজ কন্ট্রোল
              </h2>
              <p className="text-xs text-[#526356]">
                {cloudinaryStatus === null
                  ? 'সার্ভার সংযোগ যাচাই করা হচ্ছে...'
                  : !cloudinaryStatus.configured
                  ? 'Cloudinary Secret কনফিগার করা নেই'
                  : cloudinaryStatus.verified === false
                  ? cloudinaryStatus.errorMessage ||
                    `Cloud Name "${cloudinaryStatus.cloudName || ''}" যাচাই ব্যর্থ`
                  : `সংযুক্ত ও যাচাইকৃত: ${cloudinaryStatus.cloudName} · ফোল্ডার: ${
                      cloudinaryStatus.folder || 'brahmyaman_plants'
                    }`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`text-xs font-bold ${
                cloudinaryStatus === null
                  ? 'text-[#B45309]'
                  : !cloudinaryStatus.configured || cloudinaryStatus.verified === false
                  ? 'text-[#B34728]'
                  : 'text-[#1B8354]'
              }`}
            >
              {cloudinaryStatus === null
                ? 'পরীক্ষায়...'
                : !cloudinaryStatus.configured
                ? 'কনফিগার নেই'
                : cloudinaryStatus.verified === false
                ? 'সংযোগ ত্রুটি'
                : '✓ সক্রিয়'}
            </span>

            <button
              type="button"
              onClick={onVerifyCloudinary}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#FAF8F5] hover:bg-[#F0EAE1] border border-[#D5C9B8] text-xs font-bold text-[#142318] cursor-pointer"
            >
              <RefreshCw className="w-3 h-3 text-[#1B8354]" />
              <span>পুনরায় যাচাই</span>
            </button>
          </div>
        </div>

        {/* Error Root Cause Advice */}
        {cloudinaryStatus?.configured && cloudinaryStatus.verified === false && (
          <div className="p-3 rounded-2xl bg-[#FEF2F2] border border-[#FCA5A5] text-xs text-[#991B1B] space-y-1 leading-relaxed">
            <p className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Cloudinary সংযোগ ত্রুটি ({cloudinaryStatus.errorCode || 'VERIFY_FAILED'})</span>
            </p>
            <p className="text-xs">
              আপনার Cloudinary Dashboard &gt; Product Environment থেকে হুবহু ছোট হাতের{' '}
              <strong>Cloud Name</strong> (যেমন: <code>hgk8vecf</code> — বানানে <code>hkg8vecf</code> টাইপো নেই তো মিলিয়ে নিন),{' '}
              <strong>API Key</strong> ও <strong>API Secret</strong> Settings &gt; Secrets-এ আপডেট করুন। বর্তমান:{' '}
              <code>{cloudinaryStatus.cloudName || 'খালি'}</code>।
            </p>
          </div>
        )}

        {/* 4 Summary Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="p-3 bg-[#FBF9F5] border border-[#E8E1D5] rounded-2xl">
            <p className="text-xs font-bold text-[#785942]">Cloudinary ফাইল</p>
            <p className="font-mono text-lg font-bold text-[#142318]">
              {mediaAssets ? `${mediaAssets.length} টি` : '—'}
            </p>
            <p className="text-xs text-[#526356]">
              {mediaAssets ? formatKb(mediaLibraryTotalBytes) : 'লাইব্রেরি লোড করুন'}
            </p>
          </div>

          <div className="p-3 bg-[#FBF9F5] border border-[#E8E1D5] rounded-2xl">
            <p className="text-xs font-bold text-[#785942]">ক্লাউড-যুক্ত চারা</p>
            <p className="font-mono text-lg font-bold text-[#1B8354]">
              {catalogAudit.cloudinaryPlantCount} টি
            </p>
            <p className="text-xs text-[#526356]">দ্রুত WebP/AVIF ডেলিভারি</p>
          </div>

          <div className="p-3 bg-[#FBF9F5] border border-[#E8E1D5] rounded-2xl">
            <p className="text-xs font-bold text-[#785942]">ভারী Base64 চারা</p>
            <p
              className={`font-mono text-lg font-bold ${
                base64PhotoCount > 0 ? 'text-[#B34728]' : 'text-[#1B8354]'
              }`}
            >
              {base64PhotoCount} টি
            </p>
            <p className="text-xs text-[#526356]">
              {base64PhotoCount > 0 ? 'ক্লাউডে মাইগ্রেট যোগ্য' : 'সব হালকা ও অপ্টিমাইজড'}
            </p>
          </div>

          <div className="p-3 bg-[#FBF9F5] border border-[#E8E1D5] rounded-2xl">
            <p className="text-xs font-bold text-[#785942]">স্ট্যান্ডার্ড/অন্য ছবি</p>
            <p className="font-mono text-lg font-bold text-[#142318]">
              {catalogAudit.nonCloudinaryPlants.filter((i) => i.reason === 'preset').length} টি
            </p>
            <p className="text-xs text-[#526356]">নিজস্ব ছবির অপেক্ষায়</p>
          </div>
        </div>

        {/* One-Click Migration Action */}
        {base64PhotoCount > 0 ? (
          <div className="pt-2 border-t border-[#F0EAE1] space-y-2">
            <p className="text-xs font-bold text-[#B34728]">
              {base64PhotoCount}টি চারার ছবি সরাসরি Firestore-এ Base64 হিসেবে রয়েছে — Cloudinary-তে নিলে সাইট অনেক দ্রুত লোড হবে:
            </p>
            <button
              type="button"
              disabled={isMigratingBase64 || !cloudinaryStatus?.configured || cloudinaryStatus?.verified === false}
              onClick={onRunBase64Migration}
              className="w-full py-2.5 px-3 rounded-xl bg-[#1B8354] hover:bg-[#146c44] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isMigratingBase64 ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#A3E635]" />
                  <span>
                    ছবি স্থানান্তর হচ্ছে... ({migrationProgress?.current || 0} / {migrationProgress?.total || 0})
                  </span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>সকল Base64 ছবি Cloudinary-তে স্থানান্তর করুন (1-Click)</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="p-2.5 rounded-xl bg-[#F0FDF4] border border-[#86EFAC] text-xs text-[#166534] font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#1B8354] shrink-0" />
            <span>ডাটাবেসে কোনো ভারী Base64 ছবি জমে নেই — সব ছবি হালকা ফরম্যাটে আছে।</span>
          </div>
        )}
      </div>

      {/* 2. Full Cloudinary Media Library & Orphan Scanner */}
      {cloudinaryStatus?.configured && cloudinaryStatus?.verified !== false && (
        <div className="bg-white border border-[#E8E1D5] rounded-2xl p-4 sm:p-5 space-y-3.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-[#1B8354]" />
              <div>
                <h3 className="font-serif-bn text-sm sm:text-base font-bold text-[#142318]">
                  Cloudinary মিডিয়া লাইব্রেরি ও অরফ্যান ম্যানেজার
                </h3>
                <p className="text-xs text-[#526356]">
                  কোন ছবি কোন চারায় ব্যবহৃত হচ্ছে দেখুন, এডিট করুন বা অব্যবহৃত ছবি মুছে স্পেস খালি করুন
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                disabled={isLoadingMediaLibrary}
                onClick={onLoadMediaLibrary}
                className="px-3 py-1.5 rounded-xl bg-[#142318] hover:bg-[#203425] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isLoadingMediaLibrary ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#A3E635]" />
                ) : (
                  <ImageIcon className="w-3.5 h-3.5 text-[#A3E635]" />
                )}
                <span>{mediaAssets ? 'লাইব্রেরি রিফ্রেশ' : 'সব ছবি লোড করুন'}</span>
              </button>

              <button
                type="button"
                disabled={isScanningOrphans}
                onClick={onScanOrphans}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAF8F5] border border-[#D5C9B8] text-[#142318] text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isScanningOrphans ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1B8354]" />
                ) : (
                  <Search className="w-3.5 h-3.5 text-[#1B8354]" />
                )}
                <span>অরফ্যান স্ক্যান</span>
              </button>
            </div>
          </div>

          {mediaAssets && (
            <div className="space-y-3">
              {/* Filter & Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-[#785942] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={assetSearch}
                  onChange={(e) => setAssetSearch(e.target.value)}
                  placeholder="ফাইল আইডি (public_id) বা চারার নাম দিয়ে খুঁজুন..."
                  className="w-full h-9 pl-9 pr-9 bg-[#FAF8F5] border border-[#E8E1D5] focus:border-[#1B8354] rounded-xl text-xs text-[#142318] focus:outline-2 focus:outline-[#1B8354] focus:outline-offset-1"
                />
                {assetSearch && (
                  <button
                    type="button"
                    onClick={() => setAssetSearch('')}
                    aria-label="খোঁজা মুছুন"
                    className="text-[#785942] hover:text-[#142318] absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="inline-flex gap-1 p-1 bg-[#F5EFE6] rounded-xl overflow-x-auto scrollbar-none max-w-full">
                {(
                  [
                    { id: 'all', label: `সব (${assetStatusCounts.all})` },
                    { id: 'active', label: `সক্রিয় (${assetStatusCounts.active})` },
                    { id: 'trash', label: `ট্র্যাশ (${assetStatusCounts.trash})` },
                    { id: 'orphan', label: `অরফ্যান (${assetStatusCounts.orphan})` },
                  ] as const
                ).map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => setAssetFilter(chip.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer shrink-0 tabular-nums transition-colors ${
                      assetFilter === chip.id
                        ? 'bg-white text-[#142318] shadow-2xs'
                        : 'text-[#526356] hover:text-[#142318]'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {mediaLibraryTruncated && (
                <p className="text-xs text-[#785942]">দ্রষ্টব্য: প্রথম ৫০০টি ছবি প্রদর্শিত হচ্ছে।</p>
              )}

              {enrichedAssets.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#785942] bg-[#FAF8F5] rounded-xl border border-[#E8E1D5]">
                  এই ফিল্টারে কোনো Cloudinary ছবি পাওয়া যায়নি।
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[520px] overflow-y-auto pr-0.5">
                  {enrichedAssets.map(({ asset, linked, status }) => {
                    const activePlant = linked.find((p) => p.status !== 'deleted');
                    return (
                      <div
                        key={asset.public_id}
                        className="p-2.5 bg-[#FAF8F5] border border-[#E8E1D5] rounded-xl flex gap-2.5 items-center"
                      >
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#EAE4D9] border border-[#DDD5C7] shrink-0">
                          <img
                            src={asset.url}
                            alt={asset.public_id}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-1 text-xs">
                            <span
                              className={`font-bold ${
                                status === 'active'
                                  ? 'text-[#166534]'
                                  : status === 'trash'
                                  ? 'text-[#B45309]'
                                  : 'text-[#B34728]'
                              }`}
                            >
                              {status === 'active'
                                ? 'সক্রিয় গাছে যুক্ত'
                                : status === 'trash'
                                ? 'ট্র্যাশ গাছে'
                                : 'অরফ্যান (অব্যবহৃত)'}
                            </span>
                            <span className="font-mono tabular-nums text-[#526356]">
                              {formatKb(asset.bytes || 0)}
                            </span>
                          </div>

                          <p className="text-xs font-mono text-[#526356] truncate" title={asset.public_id}>
                            {asset.public_id}
                          </p>

                          <div className="flex items-center justify-between gap-1.5">
                            {linked.length > 0 ? (
                              <span className="text-xs font-bold text-[#142318] truncate">
                                {linked.map((p) => p.nameBn).join(', ')}
                              </span>
                            ) : (
                              <span className="text-xs text-[#B34728]">কোনো চারার সাথে যুক্ত নয়</span>
                            )}

                            {activePlant ? (
                              <button
                                type="button"
                                onClick={() => onEditPlant(activePlant)}
                                className="px-2 py-1 rounded-lg bg-[#EBF5EF] hover:bg-[#D5EBDC] text-[#14532D] text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>এডিট</span>
                              </button>
                            ) : status === 'trash' ? (
                              <button
                                type="button"
                                onClick={onOpenTrash}
                                className="px-2 py-1 rounded-lg bg-[#FEF3C7] text-[#92400E] text-xs font-bold shrink-0 cursor-pointer"
                              >
                                ট্র্যাশ
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={deletingOrphanId === asset.public_id}
                                onClick={() => onDeleteOrphan(asset.public_id)}
                                className="px-2 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer disabled:opacity-50"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>{deletingOrphanId === asset.public_id ? '...' : 'মুছুন'}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Compact Orphan Report Summary if orphan scan was run separately */}
          {orphanReport && (
            <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E8E1D5] space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold text-[#142318] flex-wrap gap-1">
                <span>
                  অরফ্যান স্ক্যান: মোট {orphanReport.totalCloudinaryAssets} | সক্রিয়:{' '}
                  {orphanReport.activeReferencedCount} | ট্র্যাশ: {orphanReport.trashedOnlyAssets.length} | অরফ্যান:{' '}
                  {orphanReport.orphans.length}
                </span>
                <span className="text-[#785942]">{formatKb(orphanReport.totalOrphanBytes)}</span>
              </div>
              {orphanReport.orphans.length > 0 && (
                <div className="max-h-40 overflow-y-auto space-y-1 pt-1">
                  {orphanReport.orphans.map((orphan) => (
                    <div
                      key={orphan.publicId}
                      className="flex items-center justify-between gap-2 bg-white px-2.5 py-1.5 rounded-xl border border-[#E8E1D5]"
                    >
                      <span className="truncate text-xs font-mono text-[#526356]">
                        {orphan.publicId} ({(orphan.bytes / 1024).toFixed(1)} KB)
                      </span>
                      <button
                        type="button"
                        disabled={deletingOrphanId === orphan.publicId}
                        onClick={() => onDeleteOrphan(orphan.publicId)}
                        className="px-2 py-0.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold shrink-0 cursor-pointer disabled:opacity-50"
                      >
                        {deletingOrphanId === orphan.publicId ? '...' : 'ডিলিট'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 3. Non-Cloudinary Plant Audit (Quick Edit Prompt) */}
      {catalogAudit.nonCloudinaryPlants.length > 0 && (
        <div className="bg-white border border-[#E8E1D5] rounded-2xl p-4 sm:p-5 space-y-3">
          <div>
            <h3 className="font-serif-bn text-sm font-bold text-[#142318]">
              এখনো Cloudinary-তে নেই এমন চারা ({catalogAudit.nonCloudinaryPlants.length} টি)
            </h3>
            <p className="text-xs text-[#526356]">
              নিচের চারাগুলোতে ক্লিক করে আপনার নার্সারির আসল ছবি সরাসরি Cloudinary-তে আপলোড করতে পারেন
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
            {catalogAudit.nonCloudinaryPlants.slice(0, 30).map(({ plant, reason }) => (
              <div
                key={plant.id}
                className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[#FAF8F5] border border-[#E8E1D5]"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <img
                    src={resolvePlantImageUrl(plant.image, PUJA_IMAGE)}
                    alt={plant.nameBn}
                    className="w-10 h-10 rounded-lg object-cover bg-[#EAE4D9] shrink-0"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#142318] truncate">{plant.nameBn}</p>
                    <p className="text-xs text-[#785942]">
                      {reason === 'base64' ? 'Base64 ছবি' : 'ডিফল্ট টেমপ্লেট'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onEditPlant(plant)}
                  className="px-2.5 py-1 rounded-lg bg-[#EBF5EF] hover:bg-[#D5EBDC] text-[#14532D] text-xs font-bold shrink-0 cursor-pointer"
                >
                  ছবি বদলান
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
