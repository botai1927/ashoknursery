import { useMemo, useState, useEffect } from 'react';
import {
  Plus,
  Search,
  X,
  Edit2,
  Trash2,
  Bot,
  Download,
  History,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Globe,
  Clock,
  ArrowUpDown,
  List,
  LayoutGrid,
  QrCode,
  Sparkles,
} from 'lucide-react';
import type { AdminActivityLogItem, BrahmyamanPlant, PlantCategory } from '../types/nursery';
import { PUJA_IMAGE } from '../data/brahmyamanCatalog';
import { resolvePlantImageUrl } from '../utils/imageUrl';
import { classifyPlantsByUpload } from '../utils/plantUploadSort';
import { ADMIN_CATEGORIES, type AdminTab } from './adminConstants';

type StockFilter = 'all' | 'uploaded_only' | 'in_stock' | 'out_of_stock' | 'cloudinary' | 'base64';
type SortOption = 'recent' | 'price_asc' | 'price_desc' | 'name_asc';
type ViewLayout = 'row' | 'grid';

interface AdminInventoryTabProps {
  activePlants: BrahmyamanPlant[];
  activityLogs?: AdminActivityLogItem[];
  isAdminSimpleView: boolean;
  adminSearchQuery: string;
  onSearchChange: (q: string) => void;
  onStartAddPlant: () => void;
  onStartEditPlant: (plant: BrahmyamanPlant) => void;
  onQuickPrice: (plant: BrahmyamanPlant) => void;
  onToggleStock: (plant: BrahmyamanPlant) => void;
  onSoftDelete: (plant: BrahmyamanPlant) => void;
  onSwitchTab: (tab: AdminTab) => void;
  onOpenDiagnostics: (tab: 'rootcause' | 'duplicates' | 'bugs' | 'health') => void;
  onRunBugFix: () => void;
  isRunningBugFix?: boolean;
  onOpenQrTagForPlant?: (plant: BrahmyamanPlant) => void;
  rootCauseCount: number;
  duplicateCount: number;
  base64PhotoCount: number;
}

export function AdminInventoryTab({
  activePlants,
  activityLogs = [],
  isAdminSimpleView,
  adminSearchQuery,
  onSearchChange,
  onStartAddPlant,
  onStartEditPlant,
  onQuickPrice,
  onToggleStock,
  onSoftDelete,
  onSwitchTab,
  onOpenDiagnostics,
  onRunBugFix,
  isRunningBugFix = false,
  onOpenQrTagForPlant,
  rootCauseCount,
  duplicateCount,
  base64PhotoCount,
}: AdminInventoryTabProps) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | PlantCategory>('all');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [viewLayout, setViewLayout] = useState<ViewLayout>('row');
  const [visibleLimit, setVisibleLimit] = useState<number>(40);

  // Reset pagination when filters change so results appear immediately at top
  useEffect(() => {
    setVisibleLimit(40);
  }, [adminSearchQuery, selectedCategory, stockFilter, sortBy]);

  // Classify plants so genuine admin-uploaded/edited plants ("টিউলিপ", "জাম", etc.)
  // are accurately separated from bulk auto-fixed static seeds and sorted newest first
  const uploadInfoMap = useMemo(
    () => classifyPlantsByUpload(activePlants, activityLogs),
    [activePlants, activityLogs]
  );

  const metrics = useMemo(() => {
    let outOfStock = 0;
    let cloudinaryCount = 0;
    let uploadedCount = 0;
    let activeBase64Count = 0;
    for (const p of activePlants) {
      if (p.inStock === false) outOfStock += 1;
      const slots = [p.image, ...(Array.isArray(p.images) ? p.images : [])];
      if (slots.some((u) => typeof u === 'string' && u.startsWith('https://res.cloudinary.com/'))) {
        cloudinaryCount += 1;
      }
      if (slots.some((u) => typeof u === 'string' && u.startsWith('data:image'))) {
        activeBase64Count += 1;
      }
      if (uploadInfoMap.get(p.id)?.isUserUploaded) {
        uploadedCount += 1;
      }
    }
    const trashedBase64Count = Math.max(0, base64PhotoCount - activeBase64Count);
    return {
      total: activePlants.length,
      inStock: activePlants.length - outOfStock,
      outOfStock,
      cloudinaryCount,
      uploadedCount,
      activeBase64Count,
      trashedBase64Count,
    };
  }, [activePlants, uploadInfoMap, base64PhotoCount]);

  const applyQuickKpiFilter = (nextFilter: StockFilter) => {
    setStockFilter((prev) => (prev === nextFilter && nextFilter !== 'all' ? 'all' : nextFilter));
    setSelectedCategory('all');
    if (adminSearchQuery.trim()) {
      onSearchChange('');
    }
  };

  const filteredPlants = useMemo(() => {
    const q = adminSearchQuery.trim().toLowerCase();
    const list = activePlants.filter((p) => {
      if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
      if (stockFilter === 'uploaded_only') {
        const info = uploadInfoMap.get(p.id);
        if (!info?.isUserUploaded) return false;
      }
      if (stockFilter === 'in_stock' && p.inStock === false) return false;
      if (stockFilter === 'out_of_stock' && p.inStock !== false) return false;
      if (stockFilter === 'cloudinary') {
        const hasCloudinary = [p.image, ...(Array.isArray(p.images) ? p.images : [])].some(
          (u) => typeof u === 'string' && u.startsWith('https://res.cloudinary.com/')
        );
        if (!hasCloudinary) return false;
      }
      if (stockFilter === 'base64') {
        const hasBase64 = [p.image, ...(Array.isArray(p.images) ? p.images : [])].some(
          (u) => typeof u === 'string' && u.startsWith('data:image')
        );
        if (!hasBase64) return false;
      }
      if (!q) return true;
      const info = uploadInfoMap.get(p.id);
      return (
        p.nameBn.toLowerCase().includes(q) ||
        (p.nameEn || '').toLowerCase().includes(q) ||
        (p.colorBn || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q) ||
        (info?.uploadDateTimeBn || '').toLowerCase().includes(q)
      );
    });

    if (sortBy === 'price_asc') {
      return [...list].sort((a, b) => (a.options[0]?.price || 0) - (b.options[0]?.price || 0));
    }
    if (sortBy === 'price_desc') {
      return [...list].sort((a, b) => (b.options[0]?.price || 0) - (a.options[0]?.price || 0));
    }
    if (sortBy === 'name_asc') {
      return [...list].sort((a, b) => a.nameBn.localeCompare(b.nameBn, 'bn'));
    }

    // 'recent' (Default):
    // 1. All Admin-uploaded / edited plants come FIRST at the very top,
    //    sorted strictly by upload/edit Date & Time (Newest first).
    // 2. Untouched static catalog seeds follow below in stable order.
    return [...list].sort((a, b) => {
      const infoA = uploadInfoMap.get(a.id);
      const infoB = uploadInfoMap.get(b.id);
      const upA = Boolean(infoA?.isUserUploaded);
      const upB = Boolean(infoB?.isUserUploaded);

      if (upA !== upB) {
        return upA ? -1 : 1;
      }
      if (upA && upB) {
        const msDiff = (infoB?.uploadTimestampMs || 0) - (infoA?.uploadTimestampMs || 0);
        if (msDiff !== 0) return msDiff;
      }
      return 0;
    });
  }, [activePlants, adminSearchQuery, selectedCategory, stockFilter, sortBy, uploadInfoMap]);

  const visiblePlants = useMemo(
    () => (visibleLimit >= filteredPlants.length ? filteredPlants : filteredPlants.slice(0, visibleLimit)),
    [filteredPlants, visibleLimit]
  );

  const hasActiveFilters =
    Boolean(adminSearchQuery.trim()) || selectedCategory !== 'all' || stockFilter !== 'all';

  if (isAdminSimpleView) {
    return (
      <div className="space-y-4">
        {/* Simple Mode Summary & Primary CTA */}
        <section className="bg-white border border-[#E8E1D5] rounded-2xl p-4 sm:p-5 space-y-3.5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="font-serif-bn text-lg sm:text-xl font-bold text-[#142318]">
                মোট সক্রিয় গাছ:{' '}
                <span className="font-mono tabular-nums text-[#1B8354]">{metrics.total} টি</span>
                <span className="text-sm text-[#526356] font-normal ml-2">
                  (নতুন আপলোড: {metrics.uploadedCount} টি)
                </span>
              </h2>
              <p className="text-sm text-[#526356] mt-0.5">
                নতুন আপলোড করা চারাগুলো ডেট-টাইম অনুযায়ী সবার উপরে সাজানো আছে
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#166534]">
              <ShieldCheck className="w-4 h-4 text-[#1B8354]" />
              <span>নিরাপদ Admin মোড</span>
            </span>
          </div>

          <button
            type="button"
            onClick={onStartAddPlant}
            className="w-full h-14 bg-[#1B8354] hover:bg-[#146c44] active:scale-[0.99] text-white text-lg font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Plus className="w-6 h-6" />
            <span>নতুন গাছ যোগ করুন</span>
          </button>

          {/* 1-Tap Quick Admin Tools Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <button
              type="button"
              onClick={() => onSwitchTab('orders')}
              className="min-h-[48px] px-3 py-2 bg-[#142318] hover:bg-[#203425] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#A3E635] shrink-0" />
              <span>অর্ডার ও চাহিদা</span>
            </button>

            <button
              type="button"
              onClick={() => onSwitchTab('logs')}
              className="min-h-[48px] px-3 py-2 bg-[#FAF8F5] hover:bg-[#EFEAE0] border border-[#E8E1D5] text-[#142318] rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <History className="w-4 h-4 text-[#1B8354] shrink-0" />
              <span>আপলোড লিস্ট ({metrics.uploadedCount})</span>
            </button>

            <button
              type="button"
              onClick={() => onSwitchTab('bulk_price')}
              className="min-h-[48px] px-3 py-2 bg-[#FAF8F5] hover:bg-[#EFEAE0] border border-[#E8E1D5] text-[#142318] rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#1B8354] shrink-0" />
              <span>বাল্ক ছাড়/দাম</span>
            </button>

            <button
              type="button"
              onClick={() => onSwitchTab('chatbot')}
              className="min-h-[48px] px-3 py-2 bg-[#FAF8F5] hover:bg-[#EFEAE0] border border-[#E8E1D5] text-[#142318] rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Bot className="w-4 h-4 text-[#1B8354] shrink-0" />
              <span>Gemini AI</span>
            </button>
          </div>
        </section>

        {/* Simple Search + Uploaded Filter Toggle */}
        <div className="space-y-2.5">
          <div className="relative">
            <Search className="w-5 h-5 text-[#1B8354] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={adminSearchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="গাছের নাম লিখে খুঁজুন... (যেমন: টিউলিপ, জাম, জবা)"
              className="w-full h-14 pl-12 pr-12 bg-white border border-[#D5C9B8] focus:border-[#1B8354] rounded-xl text-base sm:text-lg font-semibold text-[#142318] focus:outline-none"
            />
            {adminSearchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="খোঁজা মুছুন"
                className="w-10 h-10 rounded-lg bg-[#F5EFE6] text-[#142318] flex items-center justify-center absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: 'all', label: `সব চারা (${metrics.total}) — নতুন উপরে` },
                { id: 'uploaded_only', label: `শুধু আপলোড করা চারা (${metrics.uploadedCount})` },
                { id: 'in_stock', label: `স্টকে আছে (${metrics.inStock})` },
                { id: 'out_of_stock', label: `স্টক শেষ (${metrics.outOfStock})` },
              ] as const
            ).map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => setStockFilter(btn.id)}
                className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-bold cursor-pointer border transition-colors ${
                  stockFilter === btn.id
                    ? 'bg-[#142318] text-white border-[#142318]'
                    : 'bg-white text-[#526356] border-[#E8E1D5] hover:border-[#1B8354]'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Simple Row Cards */}
        {visiblePlants.length === 0 ? (
          <div className="bg-white border border-[#E8E1D5] rounded-2xl p-8 text-center space-y-2">
            <p className="text-lg font-bold text-[#142318]">কোনো গাছ খুঁজে পাওয়া যায়নি</p>
            <p className="text-sm text-[#526356]">অন্য নাম লিখে দেখুন অথবা সার্চ বক্স খালি করুন।</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visiblePlants.map((plant, idx) => {
              const info = uploadInfoMap.get(plant.id);
              return (
                <div
                  key={plant.id}
                  className={`bg-white border rounded-2xl p-4 space-y-3.5 ${
                    info?.isUserUploaded ? 'border-[#1B8354]/50 bg-[#FBFDFC]' : 'border-[#E8E1D5]'
                  }`}
                >
                  <div className="flex gap-3.5 items-center">
                    <div className="w-22 h-22 rounded-xl overflow-hidden bg-[#EAE4D9] shrink-0 border border-[#DDD5C7] relative">
                      <img
                        src={resolvePlantImageUrl(plant.image, PUJA_IMAGE)}
                        alt={plant.nameBn}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-1 left-1 bg-[#142318]/85 text-white font-mono text-[10px] font-bold px-1.5 py-0.5 rounded">
                        #{idx + 1}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-serif-bn text-xl font-bold text-[#142318] leading-snug">
                          {plant.nameBn}
                        </h3>
                        <span className="font-mono tabular-nums text-2xl font-extrabold text-[#B34728] shrink-0">
                          ₹{plant.options[0]?.price || 0}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#526356]">
                        {info?.isUserUploaded && (
                          <span className="px-2 py-0.5 rounded-md bg-[#EBF5EF] text-[#14532D] font-bold">
                            ✓ {info.uploadBadgeBn}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 font-mono text-[#142318] font-semibold">
                          <Clock className="w-3.5 h-3.5 text-[#1B8354]" />
                          <span>{info?.uploadDateTimeBn || 'মূল ক্যাটালগ'}</span>
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#526356]">
                        <span>{plant.category}</span>
                        {plant.colorBn && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-semibold text-[#785942]">{plant.colorBn}</span>
                          </>
                        )}
                        <span aria-hidden="true">·</span>
                        <span
                          className={`font-bold ${
                            plant.inStock !== false ? 'text-[#166534]' : 'text-[#991B1B]'
                          }`}
                        >
                          {plant.inStock !== false ? '✓ স্টকে আছে' : '✗ স্টক শেষ'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 2x2 Big Touch Buttons */}
                  <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-[#F0EAE1]">
                    <button
                      type="button"
                      onClick={() => onQuickPrice(plant)}
                      className="min-h-[50px] px-3 bg-[#FFF8F0] hover:bg-[#FDECD8] border border-[#EADBCC] text-[#142318] rounded-xl text-base font-bold transition-colors cursor-pointer"
                    >
                      দাম বদলান
                    </button>

                    <button
                      type="button"
                      onClick={() => onToggleStock(plant)}
                      className={`min-h-[50px] px-3 rounded-xl text-base font-bold border transition-colors cursor-pointer ${
                        plant.inStock !== false
                          ? 'bg-[#F0FDF4] hover:bg-[#DCFCE7] border-[#86EFAC] text-[#166534]'
                          : 'bg-[#FEF2F2] hover:bg-[#FEE2E2] border-[#FCA5A5] text-[#991B1B]'
                      }`}
                    >
                      {plant.inStock !== false ? '✓ স্টক আছে' : 'স্টক শেষ'}
                    </button>

                    <button
                      type="button"
                      onClick={() => onStartEditPlant(plant)}
                      className="min-h-[50px] px-3 bg-[#EBF5EF] hover:bg-[#D5EBDC] border border-[#BFE2CC] text-[#14532D] rounded-xl text-base font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Edit2 className="w-5 h-5" />
                      <span>এডিট ও ছবি</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onSoftDelete(plant)}
                      className="min-h-[50px] px-3 bg-[#FEF2F2] hover:bg-[#FEE2E2] border border-[#FECACA] text-[#B34728] rounded-xl text-base font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-5 h-5" />
                      <span>ট্র্যাশে সরান</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filteredPlants.length > visiblePlants.length && (
          <div className="flex items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setVisibleLimit((prev) => prev + 40)}
              className="min-h-[48px] px-5 bg-white hover:bg-[#FAF8F5] border border-[#D5C9B8] text-[#142318] text-sm font-bold rounded-xl cursor-pointer"
            >
              আরও ৪০টি দেখুন ({filteredPlants.length - visiblePlants.length} টি বাকি)
            </button>
          </div>
        )}
      </div>
    );
  }

  /* ===================================================================== */
  /* OWNER CRISP WORKSPACE VIEW (ROW-BY-ROW LIST DEFAULT + UPLOADED FIRST) */
  /* ===================================================================== */
  return (
    <div className="space-y-4">
      {/* 1. Interactive 1-Click KPI Summary Filter Strip + Primary Action */}
      <section className="bg-white border border-[#E8E1D5] rounded-2xl p-4 space-y-3.5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 flex-1 min-w-[260px]">
            <button
              type="button"
              onClick={() => applyQuickKpiFilter('all')}
              className={`text-left px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                stockFilter === 'all'
                  ? 'bg-[#142318] text-white border-[#142318] shadow-2xs'
                  : 'bg-[#FAF8F5] hover:bg-[#F3ECE2] text-[#142318] border-[#E8E1D5]'
              }`}
              title="সব সক্রিয় চারা দেখুন"
            >
              <p
                className={`text-[11px] font-bold ${
                  stockFilter === 'all' ? 'text-[#A3E635]' : 'text-[#785942]'
                }`}
              >
                সক্রিয় চারা
              </p>
              <p className="font-mono tabular-nums text-xl font-bold">{metrics.total}</p>
            </button>

            <button
              type="button"
              onClick={() => applyQuickKpiFilter('uploaded_only')}
              className={`text-left px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                stockFilter === 'uploaded_only'
                  ? 'bg-[#1B8354] text-white border-[#1B8354] shadow-2xs'
                  : 'bg-[#EBF5EF]/70 hover:bg-[#EBF5EF] text-[#142318] border-[#BFE2CC]'
              }`}
              title="শুধু আপনার আপলোড করা চারাগুলো দেখুন"
            >
              <p
                className={`text-[11px] font-bold ${
                  stockFilter === 'uploaded_only' ? 'text-white' : 'text-[#1B8354]'
                }`}
              >
                আপলোড করা চারা
              </p>
              <p
                className={`font-mono tabular-nums text-xl font-bold ${
                  stockFilter === 'uploaded_only' ? 'text-white' : 'text-[#1B8354]'
                }`}
              >
                {metrics.uploadedCount}
              </p>
            </button>

            <button
              type="button"
              onClick={() => applyQuickKpiFilter('in_stock')}
              className={`text-left px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                stockFilter === 'in_stock'
                  ? 'bg-[#166534] text-white border-[#166534] shadow-2xs'
                  : 'bg-[#FAF8F5] hover:bg-[#F3ECE2] text-[#142318] border-[#E8E1D5]'
              }`}
              title="স্টকে থাকা চারাগুলো দেখুন"
            >
              <p
                className={`text-[11px] font-bold ${
                  stockFilter === 'in_stock' ? 'text-[#A3E635]' : 'text-[#785942]'
                }`}
              >
                স্টকে আছে
              </p>
              <p className="font-mono tabular-nums text-xl font-bold">{metrics.inStock}</p>
            </button>

            <button
              type="button"
              onClick={() => applyQuickKpiFilter('out_of_stock')}
              className={`text-left px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                stockFilter === 'out_of_stock'
                  ? 'bg-[#B34728] text-white border-[#B34728] shadow-2xs'
                  : 'bg-[#FAF8F5] hover:bg-[#F3ECE2] text-[#142318] border-[#E8E1D5]'
              }`}
              title="স্টক শেষ হওয়া চারাগুলো দেখুন"
            >
              <p
                className={`text-[11px] font-bold ${
                  stockFilter === 'out_of_stock' ? 'text-white' : 'text-[#785942]'
                }`}
              >
                স্টক শেষ
              </p>
              <p
                className={`font-mono tabular-nums text-xl font-bold ${
                  stockFilter === 'out_of_stock'
                    ? 'text-white'
                    : metrics.outOfStock > 0
                    ? 'text-[#B34728]'
                    : 'text-[#142318]'
                }`}
              >
                {metrics.outOfStock}
              </p>
            </button>

            <button
              type="button"
              onClick={() => applyQuickKpiFilter('cloudinary')}
              className={`text-left px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                stockFilter === 'cloudinary'
                  ? 'bg-[#142318] text-white border-[#142318] shadow-2xs'
                  : 'bg-[#FAF8F5] hover:bg-[#F3ECE2] text-[#142318] border-[#E8E1D5]'
              }`}
              title="Cloudinary লিংকে যুক্ত ছবির চারাগুলো দেখুন"
            >
              <p
                className={`text-[11px] font-bold ${
                  stockFilter === 'cloudinary' ? 'text-[#A3E635]' : 'text-[#785942]'
                }`}
              >
                Cloudinary ছবি
              </p>
              <p
                className={`font-mono tabular-nums text-xl font-bold ${
                  stockFilter === 'cloudinary' ? 'text-white' : 'text-[#1B8354]'
                }`}
              >
                {metrics.cloudinaryCount}
              </p>
            </button>

            <button
              type="button"
              onClick={() => applyQuickKpiFilter('base64')}
              className={`text-left px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                stockFilter === 'base64'
                  ? 'bg-[#D97706] text-white border-[#D97706] shadow-2xs'
                  : 'bg-[#FAF8F5] hover:bg-[#F3ECE2] text-[#142318] border-[#E8E1D5]'
              }`}
              title="সরাসরি মেমরিতে থাকা Base64 ছবির চারা ফিল্টার করুন"
            >
              <p
                className={`text-[11px] font-bold ${
                  stockFilter === 'base64' ? 'text-white' : 'text-[#785942]'
                }`}
              >
                Base64 বাকি
              </p>
              <div className="flex items-baseline gap-1.5">
                <span
                  className={`font-mono tabular-nums text-xl font-bold ${
                    stockFilter === 'base64'
                      ? 'text-white'
                      : metrics.activeBase64Count > 0
                      ? 'text-[#D97706]'
                      : 'text-[#142318]'
                  }`}
                >
                  {metrics.activeBase64Count}
                </span>
                {metrics.trashedBase64Count > 0 && (
                  <span
                    className={`text-[10px] font-mono ${
                      stockFilter === 'base64' ? 'text-white/90' : 'text-[#785942]'
                    }`}
                  >
                    (+ট্র্যাশে {metrics.trashedBase64Count})
                  </span>
                )}
              </div>
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={onStartAddPlant}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#1B8354] hover:bg-[#146c44] active:scale-95 text-white text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন গাছ যোগ</span>
            </button>
          </div>
        </div>

        {/* Crisp Inline Catalog Audit & Bug-Fix Toolbar */}
        <div className="pt-3 border-t border-[#F0EAE1] flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] text-[#526356] font-medium">
            ক্যাটালগ অডিট ও মেরামত সরঞ্জাম:
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => onOpenDiagnostics('rootcause')}
              className="px-2.5 py-1.5 bg-[#FAF8F5] hover:bg-[#F3ECE2] border border-[#E8E1D5] text-[#142318] rounded-lg text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <AlertTriangle
                className={`w-3.5 h-3.5 ${rootCauseCount > 0 ? 'text-[#B34728]' : 'text-[#1B8354]'}`}
              />
              <span className="tabular-nums">সমস্যা ও কারণ ({rootCauseCount})</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenDiagnostics('duplicates')}
              className="px-2.5 py-1.5 bg-[#FAF8F5] hover:bg-[#F3ECE2] border border-[#E8E1D5] text-[#142318] rounded-lg text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Search className="w-3.5 h-3.5 text-[#1B8354]" />
              <span className="tabular-nums">ডুপ্লিকেট ({duplicateCount})</span>
            </button>

            <button
              type="button"
              disabled={isRunningBugFix}
              onClick={onRunBugFix}
              className="px-2.5 py-1.5 bg-[#EBF5EF] hover:bg-[#D5EBDC] disabled:opacity-60 border border-[#BFE2CC] text-[#14532D] rounded-lg text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRunningBugFix ? 'animate-spin' : ''}`} />
              <span>{isRunningBugFix ? 'মেরামত চলছে...' : 'অটো বাগ ফিক্স'}</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenDiagnostics('health')}
              className="px-2.5 py-1.5 bg-[#FAF8F5] hover:bg-[#F3ECE2] border border-[#E8E1D5] text-[#142318] rounded-lg text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Globe className="w-3.5 h-3.5 text-[#1B8354]" />
              <span>হেলথ রিপোর্ট</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Search, Category, Stock Filter, Sort & Row/Grid Switcher Bar */}
      <section className="bg-white border border-[#E8E1D5] rounded-2xl p-3 space-y-2.5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
          <div className="relative md:col-span-5">
            <Search className="w-4 h-4 text-[#785942] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={adminSearchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="নাম (যেমন: টিউলিপ, জাম), রং বা তারিখ দিয়ে খুঁজুন..."
              className="w-full h-10 pl-9 pr-9 bg-[#FAF8F5] border border-[#E8E1D5] focus:border-[#1B8354] rounded-xl text-xs text-[#142318] focus:outline-none"
            />
            {adminSearchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="খোঁজা মুছুন"
                className="text-[#785942] hover:text-[#142318] absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="md:col-span-3">
            <select
              aria-label="বিভাগ ফিল্টার"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as 'all' | PlantCategory)}
              className="w-full h-10 px-2.5 bg-[#FAF8F5] border border-[#E8E1D5] focus:border-[#1B8354] rounded-xl text-xs font-semibold text-[#142318] focus:outline-none"
            >
              <option value="all">সকল বিভাগ ({metrics.total})</option>
              {ADMIN_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 relative">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#785942] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              aria-label="সাজানোর ক্রম"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full h-10 pl-8 pr-2 bg-[#FAF8F5] border border-[#E8E1D5] focus:border-[#1B8354] rounded-xl text-xs font-semibold text-[#142318] focus:outline-none"
            >
              <option value="recent">নতুন আপলোড উপরে (ডেট-টাইম)</option>
              <option value="price_asc">দাম: কম থেকে বেশি</option>
              <option value="price_desc">দাম: বেশি থেকে কম</option>
              <option value="name_asc">নাম (ক → হ)</option>
            </select>
          </div>

          {/* Layout Toggle: সারি ওয়াইজ লিস্ট (Default) vs গ্রিড */}
          <div className="md:col-span-2 flex items-center gap-1 p-1 bg-[#F5EFE6] rounded-xl h-10">
            <button
              type="button"
              onClick={() => setViewLayout('row')}
              className={`flex-1 h-full rounded-lg text-[11px] font-bold inline-flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                viewLayout === 'row'
                  ? 'bg-[#142318] text-white shadow-2xs'
                  : 'text-[#526356] hover:text-[#142318]'
              }`}
              title="সারি ওয়াইজ লিস্ট ভিউ"
            >
              <List className="w-3.5 h-3.5" />
              <span>সারি লিস্ট</span>
            </button>
            <button
              type="button"
              onClick={() => setViewLayout('grid')}
              className={`flex-1 h-full rounded-lg text-[11px] font-bold inline-flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                viewLayout === 'grid'
                  ? 'bg-[#142318] text-white shadow-2xs'
                  : 'text-[#526356] hover:text-[#142318]'
              }`}
              title="গ্রিড ভিউ"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>গ্রিড</span>
            </button>
          </div>
        </div>

        {/* Segmented Stock / Uploaded / Photo Storage Filters */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="inline-flex items-center gap-1 p-1 bg-[#F5EFE6] rounded-xl overflow-x-auto max-w-full">
            {(
              [
                { id: 'all', label: `সব (${metrics.total}) — নতুন উপরে` },
                { id: 'uploaded_only', label: `শুধু আপলোড করা চারা (${metrics.uploadedCount})` },
                { id: 'in_stock', label: `স্টক আছে (${metrics.inStock})` },
                { id: 'out_of_stock', label: `স্টক শেষ (${metrics.outOfStock})` },
                { id: 'cloudinary', label: `Cloudinary (${metrics.cloudinaryCount})` },
                { id: 'base64', label: `Base64 (${metrics.activeBase64Count})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStockFilter(tab.id)}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums ${
                  stockFilter === tab.id
                    ? 'bg-white text-[#142318] shadow-2xs'
                    : 'text-[#526356] hover:text-[#142318]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-[#526356] tabular-nums">
            <span>
              দেখানো হচ্ছে <strong className="text-[#142318]">{visiblePlants.length}</strong> /{' '}
              {filteredPlants.length} টি
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  onSearchChange('');
                  setSelectedCategory('all');
                  setStockFilter('all');
                }}
                className="text-[#B34728] font-bold hover:underline cursor-pointer"
              >
                ফিল্টার মুছুন
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 3. Plant List: Default Row-by-Row (সারি ওয়াইজ) or 2-Column Grid */}
      {visiblePlants.length === 0 ? (
        <div className="bg-white border border-[#E8E1D5] rounded-2xl p-8 text-center space-y-3">
          {stockFilter === 'base64' && metrics.activeBase64Count === 0 && metrics.trashedBase64Count > 0 ? (
            <>
              <p className="font-serif-bn text-base font-bold text-[#142318]">
                সক্রিয় ক্যাটালগে কোনো Base64 চারা নেই (০ টি) — সব চারা অপ্টিমাইজড!
              </p>
              <p className="text-xs text-[#526356] max-w-md mx-auto">
                বাকি <strong className="text-[#D97706]">{metrics.trashedBase64Count} টি</strong> Base64 ছবির চারা বর্তমানে{' '}
                <strong>ট্র্যাশ বিন (Trash Bin)</strong>-এ রয়েছে। আপনি চাইলে ট্র্যাশ বিনে গিয়ে সেগুলো দেখতে পারেন অথবা Cloudinary মিডিয়া থেকে ১-ক্লিকে মাইগ্রেট করতে পারেন।
              </p>
              <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => onSwitchTab('trash')}
                  className="px-3.5 py-2 bg-[#142318] hover:bg-[#203425] text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  ট্র্যাশ বিন খুলুন ({metrics.trashedBase64Count})
                </button>
                <button
                  type="button"
                  onClick={() => onSwitchTab('cloudinary')}
                  className="px-3.5 py-2 bg-[#EBF5EF] hover:bg-[#D5EBDC] text-[#14532D] border border-[#BFE2CC] text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cloudinary মিডিয়া খুলুন
                </button>
                <button
                  type="button"
                  onClick={() => setStockFilter('all')}
                  className="px-3.5 py-2 bg-[#FAF8F5] hover:bg-[#F3ECE2] text-[#526356] border border-[#E8E1D5] text-xs font-bold rounded-xl cursor-pointer"
                >
                  সব চারা দেখুন
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="font-serif-bn text-base font-bold text-[#142318]">
                এই অনুসন্ধান বা ফিল্টারে কোনো চারা পাওয়া যায়নি
              </p>
              <p className="text-xs text-[#526356]">
                সার্চ টেক্সট বা বিভাগ পরিবর্তন করে আবার দেখুন অথবা ফিল্টার মুছে সব চারা দেখুন।
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => {
                    onSearchChange('');
                    setSelectedCategory('all');
                    setStockFilter('all');
                  }}
                  className="px-4 py-2 bg-[#142318] text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  সব ফিল্টার মুছুন ({metrics.total} টি চারা দেখুন)
                </button>
              )}
            </>
          )}
        </div>
      ) : viewLayout === 'row' ? (
        <div className="bg-white border border-[#E8E1D5] rounded-2xl overflow-hidden divide-y divide-[#EFEAE0]">
          {/* Table Header Row on Desktop */}
          <div className="hidden lg:grid lg:grid-cols-12 gap-3 px-4 py-2.5 bg-[#FAF8F5] text-[11px] font-bold text-[#526356]">
            <div className="col-span-5">ক্রম · চারার নাম, বিভাগ ও রং</div>
            <div className="col-span-3">আপলোড তারিখ ও সময় (Date &amp; Time)</div>
            <div className="col-span-1 text-right">দাম (₹)</div>
            <div className="col-span-3 text-right">অ্যাকশন (দাম · স্টক · QR · এডিট)</div>
          </div>

          {visiblePlants.map((plant, index) => {
            const info = uploadInfoMap.get(plant.id);
            const isUploaded = Boolean(info?.isUserUploaded);
            const isBase64 = typeof plant.image === 'string' && plant.image.startsWith('data:image/');

            return (
              <div
                key={plant.id}
                className={`p-3 sm:px-4 sm:py-3 transition-colors hover:bg-[#FAF8F5] flex flex-col lg:grid lg:grid-cols-12 gap-3 lg:items-center ${
                  isUploaded ? 'bg-[#F8FCF9]' : 'bg-white'
                }`}
              >
                {/* Col 1-5: Serial + Thumbnail + Name + Category */}
                <div className="lg:col-span-5 flex items-center gap-3 min-w-0">
                  <span
                    className={`w-7 h-7 rounded-lg font-mono tabular-nums text-xs font-bold flex items-center justify-center shrink-0 ${
                      isUploaded
                        ? 'bg-[#1B8354] text-white'
                        : 'bg-[#F5EFE6] text-[#526356]'
                    }`}
                  >
                    {index + 1}
                  </span>

                  <div className="w-13 h-13 rounded-xl overflow-hidden bg-[#EAE4D9] shrink-0 border border-[#DDD5C7] relative">
                    <img
                      src={resolvePlantImageUrl(plant.image, PUJA_IMAGE)}
                      alt={plant.nameBn}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {isBase64 && (
                      <span className="absolute bottom-0 inset-x-0 bg-black/75 text-white text-[8px] text-center py-0.5 font-bold">
                        Base64
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-serif-bn text-sm sm:text-base font-bold text-[#142318] truncate">
                        {plant.nameBn}
                      </h3>
                      {isUploaded && (
                        <span className="px-1.5 py-0.5 rounded bg-[#EBF5EF] border border-[#BFE2CC] text-[10px] font-bold text-[#14532D] shrink-0">
                          ✓ {info?.uploadBadgeBn}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center flex-wrap gap-x-1.5 gap-y-0.5 text-[11px] text-[#526356] mt-0.5">
                      <span className="truncate max-w-[150px]">{plant.nameEn}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-medium text-[#142318]">{plant.category}</span>
                      {plant.colorBn && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-semibold text-[#785942]">{plant.colorBn}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Col 6-8: Upload Date & Time */}
                <div className="lg:col-span-3 flex items-center justify-between lg:justify-start gap-2 text-xs">
                  <div className="inline-flex items-center gap-1.5 font-mono tabular-nums text-[11px]">
                    <Clock
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isUploaded ? 'text-[#1B8354]' : 'text-[#785942]'
                      }`}
                    />
                    <span className={isUploaded ? 'font-bold text-[#142318]' : 'text-[#526356]'}>
                      {info?.uploadDateTimeBn || 'মূল ক্যাটালগ'}
                    </span>
                  </div>

                  <span className="lg:hidden font-mono tabular-nums text-sm font-extrabold text-[#B34728]">
                    ₹{plant.options[0]?.price || 0}
                  </span>
                </div>

                {/* Col 9: Price (Desktop) */}
                <div className="hidden lg:block lg:col-span-1 text-right">
                  <span className="font-mono tabular-nums text-sm font-extrabold text-[#B34728]">
                    ₹{plant.options[0]?.price || 0}
                  </span>
                </div>

                {/* Col 10-12: Actions */}
                <div className="lg:col-span-3 flex items-center justify-end gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => onQuickPrice(plant)}
                    className="py-1.5 px-2.5 bg-[#F5EFE6] hover:bg-[#EBDDCB] text-[#142318] rounded-lg text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap"
                  >
                    দাম (₹)
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleStock(plant)}
                    className={`py-1.5 px-2.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap ${
                      plant.inStock !== false
                        ? 'bg-[#EBF5EF] hover:bg-[#D5EBDC] text-[#166534]'
                        : 'bg-[#FEE2E2] hover:bg-[#FECACA] text-[#991B1B]'
                    }`}
                  >
                    {plant.inStock !== false ? '✓ স্টক' : 'স্টক শেষ'}
                  </button>

                  {onOpenQrTagForPlant && (
                    <button
                      type="button"
                      onClick={() => onOpenQrTagForPlant(plant)}
                      className="p-1.5 bg-[#FAF8F5] hover:bg-[#E8E1D5] border border-[#D5C9B8] text-[#142318] rounded-lg transition-colors cursor-pointer"
                      title="এই গাছের QR কোড ট্যাগ প্রিন্ট করুন"
                    >
                      <QrCode className="w-4 h-4 text-[#1B8354]" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onStartEditPlant(plant)}
                    className="py-1.5 px-2.5 bg-[#EBF5EF] hover:bg-[#D5EBDC] text-[#14532D] rounded-lg text-[11px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                    title="ছবি ও বিবরণ সম্পাদনা"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>এডিট</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSoftDelete(plant)}
                    className="p-1.5 bg-[#FBEBEB] hover:bg-[#F7D4D4] text-[#B34728] rounded-lg transition-colors cursor-pointer"
                    title="ট্র্যাশ বিনে পাঠান (৩০ দিন ফেরতযোগ্য)"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          {visiblePlants.map((plant, index) => {
            const info = uploadInfoMap.get(plant.id);
            const isUploaded = Boolean(info?.isUserUploaded);
            const isBase64 = typeof plant.image === 'string' && plant.image.startsWith('data:image/');
            return (
              <div
                key={plant.id}
                className={`bg-white border hover:border-[#C5D5C8] rounded-2xl p-3.5 transition-colors flex gap-3 items-start ${
                  isUploaded ? 'border-[#1B8354]/40 bg-[#FBFDFC]' : 'border-[#E8E1D5]'
                }`}
              >
                <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-[#EAE4D9] shrink-0 border border-[#DDD5C7] relative">
                  <img
                    src={resolvePlantImageUrl(plant.image, PUJA_IMAGE)}
                    alt={plant.nameBn}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <span className="absolute top-1 left-1 bg-[#142318]/80 text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded">
                    #{index + 1}
                  </span>
                  {isBase64 && (
                    <span className="absolute bottom-0 inset-x-0 bg-black/75 text-white text-[9px] text-center py-0.5 font-bold">
                      Base64
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <h3 className="font-serif-bn text-sm sm:text-base font-bold text-[#142318] truncate">
                        {plant.nameBn}
                      </h3>
                      {isUploaded && (
                        <span className="px-1.5 py-0.5 rounded bg-[#EBF5EF] text-[9px] font-bold text-[#14532D] shrink-0">
                          {info?.uploadBadgeBn}
                        </span>
                      )}
                    </div>
                    <span className="font-mono tabular-nums text-sm sm:text-base font-bold text-[#B34728] shrink-0">
                      ₹{plant.options[0]?.price || 0}
                    </span>
                  </div>

                  <div className="flex items-center flex-wrap gap-x-1.5 gap-y-0.5 text-[11px] text-[#526356] mt-0.5">
                    <span className="truncate max-w-[160px]">{plant.nameEn}</span>
                    <span aria-hidden="true">·</span>
                    <span className="truncate">{plant.category}</span>
                    {plant.colorBn && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-[#785942]">{plant.colorBn}</span>
                      </>
                    )}
                  </div>

                  <p className="text-[10px] text-[#142318] font-mono flex items-center gap-1 mt-1 truncate tabular-nums">
                    <Clock className="w-3 h-3 text-[#1B8354] shrink-0" />
                    <span>{info?.uploadDateTimeBn || 'মূল ক্যাটালগ'}</span>
                  </p>

                  <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-[#F3ECE2]">
                    <button
                      type="button"
                      onClick={() => onQuickPrice(plant)}
                      className="flex-1 py-1.5 px-2.5 bg-[#F5EFE6] hover:bg-[#EBDDCB] text-[#142318] rounded-lg text-xs font-bold transition-colors cursor-pointer text-center whitespace-nowrap"
                    >
                      দাম (₹)
                    </button>

                    <button
                      type="button"
                      onClick={() => onToggleStock(plant)}
                      className={`py-1.5 px-2.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        plant.inStock !== false
                          ? 'bg-[#EBF5EF] hover:bg-[#D5EBDC] text-[#166534]'
                          : 'bg-[#FEE2E2] hover:bg-[#FECACA] text-[#991B1B]'
                      }`}
                    >
                      {plant.inStock !== false ? '✓ স্টক আছে' : 'স্টক শেষ'}
                    </button>

                    <button
                      type="button"
                      onClick={() => onStartEditPlant(plant)}
                      className="p-1.5 bg-[#EBF5EF] hover:bg-[#D5EBDC] text-[#1B8354] rounded-lg transition-colors cursor-pointer shrink-0"
                      title="ছবি ও বিবরণ সম্পাদনা"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onSoftDelete(plant)}
                      className="p-1.5 bg-[#FBEBEB] hover:bg-[#F7D4D4] text-[#B34728] rounded-lg transition-colors cursor-pointer shrink-0"
                      title="ট্র্যাশ বিনে পাঠান (৩০ দিন ফেরতযোগ্য)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Pagination Footer */}
      {filteredPlants.length > visiblePlants.length && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => setVisibleLimit((prev) => prev + 40)}
            className="px-4 py-2 bg-white hover:bg-[#FAF8F5] border border-[#D5C9B8] text-[#142318] text-xs font-bold rounded-xl cursor-pointer tabular-nums"
          >
            আরও ৪০টি দেখুন ({filteredPlants.length - visiblePlants.length} টি বাকি)
          </button>
          <button
            type="button"
            onClick={() => setVisibleLimit(filteredPlants.length)}
            className="px-4 py-2 bg-[#142318] hover:bg-[#203425] text-white text-xs font-bold rounded-xl cursor-pointer tabular-nums"
          >
            সব দেখুন ({filteredPlants.length})
          </button>
        </div>
      )}
    </div>
  );
}
