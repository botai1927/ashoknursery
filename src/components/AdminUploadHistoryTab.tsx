import { useMemo, useState } from 'react';
import {
  History,
  Clock,
  Camera,
  DollarSign,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Lock,
  Search,
  Cloud,
  Database,
  Image as ImageIcon,
  Calendar,
  X,
  CheckCircle2,
} from 'lucide-react';
import type { AdminActivityLogItem, BrahmyamanPlant } from '../types/nursery';
import { resolvePlantImageUrl } from '../utils/imageUrl';
import { classifyPlantsByUpload } from '../utils/plantUploadSort';
import { PUJA_IMAGE } from '../data/brahmyamanCatalog';
import { AdminActivityLog } from './AdminActivityLog';

export type AdminLogFilter = 'all' | 'photo' | 'price' | 'plant' | 'trash';
type HistorySubView = 'plants' | 'logs';
type UploadScopeFilter = 'uploaded_only' | 'all' | 'cloudinary' | 'base64';

interface AdminUploadHistoryTabProps {
  plants: BrahmyamanPlant[];
  activityLogs: AdminActivityLogItem[];
  logFilter: AdminLogFilter;
  setLogFilter: (filter: AdminLogFilter) => void;
  isAdminSimpleView: boolean;
  isOwner: boolean;
  isCleaningLogs: boolean;
  serverLogsCount: number | null;
  onCleanupOldLogs: (maxKeep?: number, silent?: boolean) => void;
  onEditPlant: (plant: BrahmyamanPlant) => void;
  onOpenTrash: () => void;
  onStartAddPlant: () => void;
}

function getPlantPhotoStorageKind(plant: BrahmyamanPlant): 'cloudinary' | 'base64' | 'preset' {
  const slots = [plant.image, ...(Array.isArray(plant.images) ? plant.images : [])].filter(
    (s): s is string => typeof s === 'string' && s.trim().length > 0
  );
  if (slots.some((s) => s.startsWith('https://res.cloudinary.com/'))) {
    return 'cloudinary';
  }
  if (slots.some((s) => s.startsWith('data:image/'))) {
    return 'base64';
  }
  return 'preset';
}

export function AdminUploadHistoryTab({
  plants,
  activityLogs,
  logFilter,
  setLogFilter,
  isAdminSimpleView,
  isOwner,
  isCleaningLogs,
  serverLogsCount,
  onCleanupOldLogs,
  onEditPlant,
  onOpenTrash,
  onStartAddPlant,
}: AdminUploadHistoryTabProps) {
  const [subView, setSubView] = useState<HistorySubView>('plants');
  const [historySearch, setHistorySearch] = useState('');
  const [scopeFilter, setScopeFilter] = useState<UploadScopeFilter>('uploaded_only');
  const [visiblePlantCount, setVisiblePlantCount] = useState<number>(50);

  const uploadInfoMap = useMemo(
    () => classifyPlantsByUpload(plants, activityLogs),
    [plants, activityLogs]
  );

  const plantByIdMap = useMemo(() => {
    const map = new Map<string, BrahmyamanPlant>();
    for (const p of plants) {
      map.set(p.id, p);
    }
    return map;
  }, [plants]);

  const plantByNameMap = useMemo(() => {
    const map = new Map<string, BrahmyamanPlant>();
    for (const p of plants) {
      const key = p.nameBn.trim().toLowerCase();
      if (!map.has(key) || p.status !== 'deleted') {
        map.set(key, p);
      }
    }
    return map;
  }, [plants]);

  const resolvePlantForLog = (log: AdminActivityLogItem): BrahmyamanPlant | undefined => {
    if (log.plantId && plantByIdMap.has(log.plantId)) {
      return plantByIdMap.get(log.plantId);
    }
    if (log.plantNameBn) {
      const normalized = log.plantNameBn.trim().toLowerCase();
      if (plantByNameMap.has(normalized)) {
        return plantByNameMap.get(normalized);
      }
    }
    return undefined;
  };

  const uploadCounts = useMemo(() => {
    let uploadedOnly = 0;
    let cloudinary = 0;
    let base64 = 0;
    for (const p of plants) {
      if (uploadInfoMap.get(p.id)?.isUserUploaded) {
        uploadedOnly += 1;
      }
      const kind = getPlantPhotoStorageKind(p);
      if (kind === 'cloudinary') cloudinary += 1;
      else if (kind === 'base64') base64 += 1;
    }
    return { uploadedOnly, cloudinary, base64, total: plants.length };
  }, [plants, uploadInfoMap]);

  // Chronological row-by-row list sorted strictly by genuine upload/edit Date & Time (newest first)
  const sortedUploadPlants = useMemo(() => {
    const q = historySearch.trim().toLowerCase();
    return [...plants]
      .filter((p) => {
        const info = uploadInfoMap.get(p.id);
        if (scopeFilter === 'uploaded_only' && !info?.isUserUploaded) {
          return false;
        }
        if (scopeFilter === 'cloudinary' && getPlantPhotoStorageKind(p) !== 'cloudinary') {
          return false;
        }
        if (scopeFilter === 'base64' && getPlantPhotoStorageKind(p) !== 'base64') {
          return false;
        }
        if (!q) return true;
        return (
          p.nameBn.toLowerCase().includes(q) ||
          (p.nameEn || '').toLowerCase().includes(q) ||
          (p.colorBn || '').toLowerCase().includes(q) ||
          (info?.uploadDateTimeBn || '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const infoA = uploadInfoMap.get(a.id);
        const infoB = uploadInfoMap.get(b.id);
        const upA = Boolean(infoA?.isUserUploaded);
        const upB = Boolean(infoB?.isUserUploaded);
        if (upA !== upB) return upA ? -1 : 1;
        const msDiff = (infoB?.uploadTimestampMs || 0) - (infoA?.uploadTimestampMs || 0);
        if (msDiff !== 0) return msDiff;
        return 0;
      });
  }, [plants, historySearch, scopeFilter, uploadInfoMap]);

  const filteredLogs = useMemo(() => {
    const q = historySearch.trim().toLowerCase();
    return activityLogs.filter((log) => {
      if (logFilter === 'photo' && log.actionType !== 'photo_upload') return false;
      if (logFilter === 'price' && log.actionType !== 'price_update') return false;
      if (logFilter === 'plant' && log.actionType !== 'plant_add' && log.actionType !== 'plant_edit') {
        return false;
      }
      if (
        logFilter === 'trash' &&
        log.actionType !== 'plant_delete' &&
        log.actionType !== 'plant_restore' &&
        log.actionType !== 'permanent_delete' &&
        log.actionType !== 'trash_empty'
      ) {
        return false;
      }
      if (!q) return true;
      return (
        log.titleBn.toLowerCase().includes(q) ||
        log.descriptionBn.toLowerCase().includes(q) ||
        (log.plantNameBn || '').toLowerCase().includes(q) ||
        log.dateBn.toLowerCase().includes(q)
      );
    });
  }, [activityLogs, logFilter, historySearch]);

  return (
    <div className="space-y-3">
      {/* Header & Sub-View Switcher */}
      <div className="bg-white border border-[#E8E1D5] rounded-2xl p-3.5 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#1B8354]/10 text-[#1B8354] flex items-center justify-center shrink-0">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2
                className={`font-serif-bn font-bold text-[#142318] ${
                  isAdminSimpleView ? 'text-base sm:text-lg' : 'text-sm sm:text-base'
                }`}
              >
                আপলোড করা চারার সারি ওয়াইজ (Row-by-Row) তালিকা ও লগ
              </h2>
              <p className="text-[11px] text-[#526356]">
                নতুন আপলোড করা চারা (যেমন টিউলিপ, জাম ইত্যাদি) ডেট ও টাইম অনুযায়ী সবার উপরে দেখুন এবং ১-ক্লিকে এডিট করুন
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onStartAddPlant}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#1B8354] hover:bg-[#146c44] text-white text-xs font-bold cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>নতুন চারা আপলোড</span>
          </button>
        </div>

        {/* Sub-view switcher */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setSubView('plants')}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
              subView === 'plants'
                ? 'bg-[#142318] text-white border-[#142318] shadow-xs'
                : 'bg-[#FAF8F5] text-[#526356] border-[#E8E1D5] hover:bg-[#F3ECE2]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-[#A3E635]" />
            <span>আপলোড করা চারার লিস্ট ({uploadCounts.uploadedOnly})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubView('logs')}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
              subView === 'logs'
                ? 'bg-[#142318] text-white border-[#142318] shadow-xs'
                : 'bg-[#FAF8F5] text-[#526356] border-[#E8E1D5] hover:bg-[#F3ECE2]'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-[#A3E635]" />
            <span>অ্যাক্টিভিটি লগ ({serverLogsCount ?? activityLogs.length})</span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#785942] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={historySearch}
            onChange={(e) => setHistorySearch(e.target.value)}
            placeholder={
              subView === 'plants'
                ? 'চারার নাম (টিউলিপ, জাম...), রং বা তারিখ দিয়ে খুঁজুন...'
                : 'লগের শিরোনাম, গাছের নাম বা তারিখ দিয়ে খুঁজুন...'
            }
            className="w-full h-10 pl-9 pr-9 bg-[#FAF8F5] border border-[#E8E1D5] focus:border-[#1B8354] rounded-xl text-xs text-[#142318] focus:outline-none"
          />
          {historySearch && (
            <button
              type="button"
              onClick={() => setHistorySearch('')}
              aria-label="খোঁজা মুছুন"
              className="text-[#785942] hover:text-[#142318] absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {subView === 'plants' ? (
          <div className="inline-flex gap-1 p-1 bg-[#F5EFE6] rounded-xl overflow-x-auto scrollbar-none max-w-full">
            {(
              [
                {
                  id: 'uploaded_only',
                  label: `শুধু আপলোড করা চারা (${uploadCounts.uploadedOnly}) — ডেট-টাইম লিস্ট`,
                },
                { id: 'all', label: `সব ক্যাটালগ চারা (${uploadCounts.total})` },
                { id: 'cloudinary', label: `Cloudinary (${uploadCounts.cloudinary})` },
                { id: 'base64', label: `Base64 (${uploadCounts.base64})` },
              ] as const
            ).map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => {
                  setScopeFilter(btn.id);
                  setVisiblePlantCount(50);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer shrink-0 tabular-nums transition-colors ${
                  scopeFilter === btn.id
                    ? 'bg-white text-[#142318] shadow-2xs'
                    : 'text-[#526356] hover:text-[#142318]'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="inline-flex gap-1 p-1 bg-[#F5EFE6] rounded-xl overflow-x-auto scrollbar-none max-w-full">
              {(
                [
                  { id: 'all', label: `সব (${activityLogs.length})` },
                  { id: 'photo', label: 'ছবি আপলোড' },
                  { id: 'price', label: 'দাম পরিবর্তন' },
                  { id: 'plant', label: 'চারা সম্পাদনা' },
                  { id: 'trash', label: 'ট্র্যাশ ও রিস্টোর' },
                ] as const
              ).map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setLogFilter(chip.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors shrink-0 tabular-nums ${
                    logFilter === chip.id
                      ? 'bg-white text-[#142318] shadow-2xs'
                      : 'text-[#526356] hover:text-[#142318]'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {isOwner && !isAdminSimpleView && (serverLogsCount ?? activityLogs.length) > 80 && (
              <button
                type="button"
                disabled={isCleaningLogs}
                onClick={() => onCleanupOldLogs(100, false)}
                className="px-2.5 py-1 bg-[#FAF8F5] hover:bg-[#F0EAE1] border border-[#D5C9B8] rounded-lg text-[10px] font-bold text-[#142318] cursor-pointer disabled:opacity-50"
              >
                {isCleaningLogs ? 'ক্লিন হচ্ছে...' : 'পুরনো ক্লিন'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* VIEW 1: PROPER ROW-BY-ROW CHRONOLOGICAL PLANT UPLOAD LIST */}
      {subView === 'plants' && (
        <div className="bg-white border border-[#E8E1D5] rounded-2xl overflow-hidden">
          {sortedUploadPlants.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <p className="text-sm font-bold text-[#142318]">
                {scopeFilter === 'uploaded_only'
                  ? 'এখনো আলাদাভাবে কোনো নতুন চারা আপলোড করা হয়নি বা অনুসন্ধানে মেলেনি।'
                  : 'এই ফিল্টারে কোনো চারা পাওয়া যায়নি।'}
              </p>
              {scopeFilter === 'uploaded_only' && (
                <button
                  type="button"
                  onClick={() => setScopeFilter('all')}
                  className="px-3.5 py-1.5 bg-[#FAF8F5] hover:bg-[#EFEAE0] border border-[#D5C9B8] rounded-xl text-xs font-bold text-[#142318] cursor-pointer"
                >
                  সব ক্যাটালগ চারা দেখুন ({uploadCounts.total})
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-[#EFEAE0]">
              <div className="hidden md:grid md:grid-cols-12 gap-3 px-4 py-2.5 bg-[#FAF8F5] text-[11px] font-bold text-[#526356]">
                <div className="col-span-5">ক্রম · চারার নাম ও বিভাগ</div>
                <div className="col-span-4">আপলোড তারিখ ও সময় (Date &amp; Time)</div>
                <div className="col-span-1 text-right">দাম (₹)</div>
                <div className="col-span-2 text-right">অ্যাকশন</div>
              </div>

              {sortedUploadPlants.slice(0, visiblePlantCount).map((plant, idx) => {
                const info = uploadInfoMap.get(plant.id);
                const isUploaded = Boolean(info?.isUserUploaded);
                const kind = getPlantPhotoStorageKind(plant);
                const isTrashed = plant.status === 'deleted';
                const price = plant.options?.[0]?.price || 0;

                return (
                  <div
                    key={plant.id}
                    className={`p-3 sm:px-4 sm:py-3 flex flex-col md:grid md:grid-cols-12 gap-3 md:items-center transition-colors hover:bg-[#FAF8F5] ${
                      isTrashed
                        ? 'bg-[#FFFDFD]'
                        : isUploaded
                        ? 'bg-[#F8FCF9]'
                        : 'bg-white'
                    }`}
                  >
                    {/* Col 1-5: Serial + Thumbnail + Name */}
                    <div className="md:col-span-5 flex items-center gap-3 min-w-0">
                      <span
                        className={`w-7 h-7 rounded-lg font-mono tabular-nums text-xs font-bold flex items-center justify-center shrink-0 ${
                          isUploaded
                            ? 'bg-[#1B8354] text-white'
                            : 'bg-[#F5EFE6] text-[#526356]'
                        }`}
                      >
                        {idx + 1}
                      </span>

                      <div className="w-13 h-13 rounded-xl overflow-hidden bg-[#EAE4D9] border border-[#DDD5C7] shrink-0">
                        <img
                          src={resolvePlantImageUrl(plant.image, PUJA_IMAGE)}
                          alt={plant.nameBn}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3
                            className={`font-serif-bn font-bold text-[#142318] truncate ${
                              isAdminSimpleView ? 'text-base' : 'text-sm'
                            }`}
                          >
                            {plant.nameBn}
                          </h3>
                          {isUploaded && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#EBF5EF] border border-[#BFE2CC] text-[10px] font-bold text-[#14532D]">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              <span>{info?.uploadBadgeBn}</span>
                            </span>
                          )}
                          {isTrashed && (
                            <span className="text-[11px] font-bold text-[#991B1B]">· ট্র্যাশে</span>
                          )}
                        </div>

                        <div className="flex items-center flex-wrap gap-1.5 text-[11px] text-[#526356] mt-0.5">
                          <span>{plant.category}</span>
                          {plant.colorBn && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-semibold text-[#785942]">{plant.colorBn}</span>
                            </>
                          )}
                          <span aria-hidden="true">·</span>
                          {kind === 'cloudinary' ? (
                            <span className="inline-flex items-center gap-1 text-[#166534] font-semibold">
                              <Cloud className="w-3 h-3" />
                              <span>Cloudinary</span>
                            </span>
                          ) : kind === 'base64' ? (
                            <span className="inline-flex items-center gap-1 text-[#B34728] font-semibold">
                              <Database className="w-3 h-3" />
                              <span>Base64</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[#785942]">
                              <ImageIcon className="w-3 h-3" />
                              <span>স্ট্যান্ডার্ড</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Col 6-9: Upload Date & Time */}
                    <div className="md:col-span-4 flex items-center justify-between md:justify-start gap-2">
                      <div className="inline-flex items-center gap-1.5 font-mono tabular-nums text-xs">
                        <Clock className="w-3.5 h-3.5 text-[#1B8354] shrink-0" />
                        <span className="font-bold text-[#142318]">
                          {info?.uploadDateTimeBn || 'প্রাথমিক ক্যাটালগ চারা'}
                        </span>
                      </div>

                      <span className="md:hidden font-mono tabular-nums text-sm font-bold text-[#B34728]">
                        ₹{price}
                      </span>
                    </div>

                    {/* Col 10: Price */}
                    <div className="hidden md:block md:col-span-1 text-right">
                      <span className="font-mono tabular-nums text-sm font-bold text-[#B34728]">
                        ₹{price}
                      </span>
                    </div>

                    {/* Col 11-12: Direct Edit Button */}
                    <div className="md:col-span-2 flex justify-end">
                      {isTrashed ? (
                        <button
                          type="button"
                          onClick={onOpenTrash}
                          className="px-3 py-2 rounded-xl bg-[#FEF2F2] hover:bg-[#FEE2E2] border border-[#FCA5A5] text-[#B34728] text-xs font-bold shrink-0 cursor-pointer"
                        >
                          ট্র্যাশ দেখুন
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onEditPlant(plant)}
                          className={`px-3 rounded-xl bg-[#EBF5EF] hover:bg-[#D5EBDC] border border-[#BFE2CC] text-[#14532D] font-bold flex items-center gap-1 shrink-0 cursor-pointer transition-colors ${
                            isAdminSimpleView ? 'min-h-[44px] text-sm' : 'py-2 text-xs'
                          }`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>সরাসরি এডিট</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {sortedUploadPlants.length > visiblePlantCount && (
                <div className="p-3 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => setVisiblePlantCount((prev) => prev + 50)}
                    className="px-4 py-2 bg-white hover:bg-[#FAF8F5] border border-[#D5C9B8] text-[#142318] text-xs font-bold rounded-xl cursor-pointer tabular-nums"
                  >
                    আরও ৫০টি দেখুন ({sortedUploadPlants.length - visiblePlantCount} টি বাকি)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {subView === 'logs' && (
        <AdminActivityLog
          activityLogs={activityLogs}
          onCleanupOldLogs={onCleanupOldLogs}
        />
      )}
    </div>
  );
}
