import { useMemo, useState } from 'react';
import {
  Percent,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  Tag,
  CloudRain,
  Sun,
  Loader2,
} from 'lucide-react';
import type { BrahmyamanPlant, PlantCategory } from '../types/nursery';
import { ADMIN_CATEGORIES } from './adminConstants';
import { resolvePlantImageUrl } from '../utils/imageUrl';
import { PUJA_IMAGE } from '../data/brahmyamanCatalog';

export type BulkPriceMode =
  | 'percent_discount'
  | 'percent_increase'
  | 'flat_discount'
  | 'flat_increase';

export type PriceRoundingRule = 'nearest_5' | 'nearest_1';

export interface BulkPriceUpdatePayload {
  updatedPlants: BrahmyamanPlant[];
  summaryTitleBn: string;
  summaryDescriptionBn: string;
}

interface AdminBulkPriceTabProps {
  activePlants: BrahmyamanPlant[];
  isAdminSimpleView: boolean;
  isApplyingBulkUpdate: boolean;
  onApplyBulkPriceUpdate: (payload: BulkPriceUpdatePayload) => Promise<void>;
}

function calculateAdjustedPrice(
  oldPrice: number,
  mode: BulkPriceMode,
  value: number,
  rounding: PriceRoundingRule
): number {
  const base = Math.max(1, Number(oldPrice) || 50);
  const v = Math.max(0, Number(value) || 0);
  if (v === 0) return base;

  let raw = base;
  if (mode === 'percent_discount') {
    raw = base * (1 - Math.min(85, v) / 100);
  } else if (mode === 'percent_increase') {
    raw = base * (1 + Math.min(200, v) / 100);
  } else if (mode === 'flat_discount') {
    raw = base - v;
  } else if (mode === 'flat_increase') {
    raw = base + v;
  }

  const clamped = Math.max(10, raw);
  if (rounding === 'nearest_5') {
    return Math.max(10, Math.round(clamped / 5) * 5);
  }
  return Math.max(10, Math.round(clamped));
}

export function AdminBulkPriceTab({
  activePlants,
  isAdminSimpleView,
  isApplyingBulkUpdate,
  onApplyBulkPriceUpdate,
}: AdminBulkPriceTabProps) {
  const [targetCategory, setTargetCategory] = useState<'all' | PlantCategory>('all');
  const [mode, setMode] = useState<BulkPriceMode>('percent_discount');
  const [amountStr, setAmountStr] = useState<string>('10');
  const [rounding, setRounding] = useState<PriceRoundingRule>('nearest_5');
  const [seasonalBadgeBn, setSeasonalBadgeBn] = useState<string>('');
  const [clearBadge, setClearBadge] = useState<boolean>(false);

  const numericAmount = Math.max(0, Number(amountStr) || 0);

  const matchingPlants = useMemo(() => {
    return activePlants.filter((p) => {
      if (targetCategory !== 'all' && p.category !== targetCategory) return false;
      return true;
    });
  }, [activePlants, targetCategory]);

  const previewItems = useMemo(() => {
    return matchingPlants.map((plant) => {
      const oldPrimary = plant.options?.[0]?.price || 50;
      const newOptions = (plant.options || []).map((opt) => ({
        ...opt,
        price: calculateAdjustedPrice(opt.price, mode, numericAmount, rounding),
      }));
      const newPrimary = newOptions[0]?.price || oldPrimary;
      const nextBadge = clearBadge
        ? ''
        : seasonalBadgeBn.trim()
        ? seasonalBadgeBn.trim()
        : plant.badgeBn || '';

      return {
        plant,
        oldPrimary,
        newPrimary,
        diff: newPrimary - oldPrimary,
        newOptions,
        nextBadge,
      };
    });
  }, [matchingPlants, mode, numericAmount, rounding, seasonalBadgeBn, clearBadge]);

  const changedCount = useMemo(
    () =>
      previewItems.filter(
        (item) => item.diff !== 0 || item.nextBadge !== (item.plant.badgeBn || '')
      ).length,
    [previewItems]
  );

  const applyPreset = (preset: {
    category: 'all' | PlantCategory;
    mode: BulkPriceMode;
    amount: string;
    badge: string;
  }) => {
    setTargetCategory(preset.category);
    setMode(preset.mode);
    setAmountStr(preset.amount);
    setSeasonalBadgeBn(preset.badge);
    setClearBadge(false);
  };

  const handleConfirmApply = async () => {
    if (changedCount === 0 || isApplyingBulkUpdate) return;

    const updatedPlants: BrahmyamanPlant[] = previewItems
      .filter((item) => item.diff !== 0 || item.nextBadge !== (item.plant.badgeBn || ''))
      .map((item) => ({
        ...item.plant,
        options: item.newOptions,
        badgeBn: item.nextBadge,
      }));

    const catLabel = targetCategory === 'all' ? 'সকল বিভাগের' : `'${targetCategory}' বিভাগের`;
    const modeLabel =
      mode === 'percent_discount'
        ? `${numericAmount}% ছাড়`
        : mode === 'percent_increase'
        ? `${numericAmount}% বৃদ্ধি`
        : mode === 'flat_discount'
        ? `₹${numericAmount} ছাড়`
        : `₹${numericAmount} বৃদ্ধি`;

    await onApplyBulkPriceUpdate({
      updatedPlants,
      summaryTitleBn: `বাল্ক দাম ও ছাড় আপডেট: ${updatedPlants.length} টি চারা`,
      summaryDescriptionBn: `${catLabel} ${updatedPlants.length} টি চারার দামে ${modeLabel} প্রয়োগ করা হয়েছে${
        seasonalBadgeBn.trim() ? ` (ট্যাগ: ${seasonalBadgeBn.trim()})` : ''
      }।`,
    });
  };

  return (
    <div className="space-y-4">
      {/* Header & 1-Click Seasonal Offer Presets */}
      <section className="bg-white border border-[#E8E1D5] rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-[#B34728]/10 text-[#B34728] flex items-center justify-center shrink-0">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <h2
              className={`font-serif-bn font-bold text-[#142318] ${
                isAdminSimpleView ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'
              }`}
            >
              বাল্ক প্রাইস ও সিজনাল ডিসকাউন্ট আপডেটার
            </h2>
            <p className="text-xs text-[#526356]">
              বর্ষা বা শীতের মৌসুমে ১-ক্লিকে নির্দিষ্ট ক্যাটাগরির (যেমন সব ফুলের বা ফলের চারার) দাম শতকরা (%) বা টাকায় (₹) কমান বা বাড়ান
            </p>
          </div>
        </div>

        {/* 1-Click Seasonal Presets */}
        <div className="p-3.5 bg-[#FAF8F5] border border-[#E8E1D5] rounded-2xl space-y-2">
          <p className="text-xs font-bold text-[#142318] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#1B8354]" />
            <span>১-ক্লিক মৌসুমি অফার প্রিসেট (Seasonal Presets):</span>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() =>
                applyPreset({
                  category: 'ছাদবাগানের ফল ও কলম',
                  mode: 'percent_discount',
                  amount: '15',
                  badge: 'বর্ষা স্পেশাল ১৫% ছাড়',
                })
              }
              className="p-3 bg-white hover:bg-[#F0FDF4] border border-[#D5C9B8] hover:border-[#1B8354] rounded-xl text-left transition-all cursor-pointer"
            >
              <p className="text-xs font-bold text-[#142318] flex items-center gap-1.5">
                <CloudRain className="w-3.5 h-3.5 text-[#1B8354]" />
                <span>বর্ষার ফলের চারা ১৫% ছাড়</span>
              </p>
              <p className="text-xs text-[#526356] mt-0.5">
                সব ‘ছাদবাগানের ফল ও কলম’-এ ১৫% দাম কমানো ও বর্ষা অফার ব্যাজ
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                applyPreset({
                  category: 'ছাদ ও বারান্দার ফুল',
                  mode: 'percent_discount',
                  amount: '10',
                  badge: 'শীতের পুষ্প মেলা ছাড়',
                })
              }
              className="p-3 bg-white hover:bg-[#FFFBEB] border border-[#D5C9B8] hover:border-[#B34728] rounded-xl text-left transition-all cursor-pointer"
            >
              <p className="text-xs font-bold text-[#142318] flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-[#B34728]" />
                <span>শীতের ফুল ও জবা ১০% ছাড়</span>
              </p>
              <p className="text-xs text-[#526356] mt-0.5">
                সব ‘ছাদ ও বারান্দার ফুল’ চারায় ১০% ছাড় ও শীতের ব্যাজ
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                applyPreset({
                  category: 'all',
                  mode: 'flat_discount',
                  amount: '10',
                  badge: 'নার্সারি উৎসব অফার',
                })
              }
              className="p-3 bg-white hover:bg-[#FAF8F5] border border-[#D5C9B8] hover:border-[#142318] rounded-xl text-left transition-all cursor-pointer"
            >
              <p className="text-xs font-bold text-[#142318] flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#1B8354]" />
                <span>সব চারায় ₹১০ ফ্ল্যাট ছাড়</span>
              </p>
              <p className="text-xs text-[#526356] mt-0.5">
                পুরো ক্যাটালগের প্রতিটি চারায় ₹১০ ছাড় প্রয়োগ
              </p>
            </button>
          </div>
        </div>

        {/* Custom Configuration Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-bold text-[#142318] mb-1">
              ১. কোন বিভাগের চারা?
            </label>
            <select
              value={targetCategory}
              onChange={(e) => setTargetCategory(e.target.value as 'all' | PlantCategory)}
              className="w-full h-10 px-3 bg-[#FAF8F5] border border-[#D5C9B8] rounded-xl text-xs font-bold text-[#142318]"
            >
              <option value="all">সকল বিভাগ ({activePlants.length} টি চারা)</option>
              {ADMIN_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#142318] mb-1">
              ২. পরিবর্তনের ধরন:
            </label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as BulkPriceMode)}
              className="w-full h-10 px-3 bg-[#FAF8F5] border border-[#D5C9B8] rounded-xl text-xs font-bold text-[#142318]"
            >
              <option value="percent_discount">শতকরা ছাড় (% কমান)</option>
              <option value="percent_increase">শতকরা বৃদ্ধি (% বাড়ান)</option>
              <option value="flat_discount">টাকায় ছাড় (₹ কমান)</option>
              <option value="flat_increase">টাকায় বৃদ্ধি (₹ বাড়ান)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#142318] mb-1">
              ৩. কত {mode.startsWith('percent') ? 'শতাংশ (%)' : 'টাকা (₹)'}?
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={0}
                max={200}
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-[#D5C9B8] rounded-xl font-mono font-bold text-sm text-[#B34728]"
              />
              {[5, 10, 15, 20].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setAmountStr(String(v))}
                  className={`h-10 px-2.5 rounded-xl font-mono text-xs font-bold border cursor-pointer ${
                    Number(amountStr) === v
                      ? 'bg-[#142318] text-white border-[#142318]'
                      : 'bg-[#FAF8F5] text-[#142318] border-[#D5C9B8]'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#142318] mb-1">
              ৪. খুচরো দাম রাউন্ডিং:
            </label>
            <select
              value={rounding}
              onChange={(e) => setRounding(e.target.value as PriceRoundingRule)}
              className="w-full h-10 px-3 bg-[#FAF8F5] border border-[#D5C9B8] rounded-xl text-xs font-bold text-[#142318]"
            >
              <option value="nearest_5">₹৫ বা ₹১০-এর গুণিতকে (যেমন ₹৪৫, ₹৫০)</option>
              <option value="nearest_1">হুবহু পূর্ণ সংখ্যায় (₹১ হিসেবে)</option>
            </select>
          </div>
        </div>

        {/* Optional Seasonal Offer Badge Input */}
        <div className="p-3 bg-[#FFFBF5] border border-[#EADBCC] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex-1 space-y-1">
            <label className="block text-xs font-bold text-[#142318]">
              মৌসুমি অফার ব্যাজ যুক্ত করুন (ঐচ্ছিক):
            </label>
            <input
              type="text"
              disabled={clearBadge}
              value={seasonalBadgeBn}
              onChange={(e) => setSeasonalBadgeBn(e.target.value)}
              placeholder="যেমন: বর্ষা স্পেশাল ছাড়, শীতের অফার (খালি রাখলে আগের ব্যাজ থাকবে)"
              className="w-full h-9 px-3 bg-white border border-[#D5C9B8] rounded-lg text-xs text-[#142318] disabled:opacity-50"
            />
          </div>

          <label className="inline-flex items-center gap-1.5 text-xs font-bold text-[#B34728] cursor-pointer shrink-0 pt-2 sm:pt-4">
            <input
              type="checkbox"
              checked={clearBadge}
              onChange={(e) => {
                setClearBadge(e.target.checked);
                if (e.target.checked) setSeasonalBadgeBn('');
              }}
              className="rounded text-[#B34728]"
            />
            <span>আগের অফার ব্যাজ সরান</span>
          </label>
        </div>

        {/* Submit / Apply Bar */}
        <div className="pt-2 border-t border-[#E8E1D5] flex items-center justify-between gap-3 flex-wrap">
          <div className="text-xs text-[#526356]">
            প্রভাবিত চারা:{' '}
            <strong className="font-mono text-[#142318]">{changedCount} টি</strong> (মোট{' '}
            {matchingPlants.length} টির মধ্যে)
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setAmountStr('0');
                setSeasonalBadgeBn('');
                setClearBadge(false);
              }}
              className="px-3.5 py-2.5 bg-[#FAF8F5] hover:bg-[#EFEAE0] border border-[#D5C9B8] rounded-xl text-xs font-bold text-[#142318] inline-flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>রিসেট</span>
            </button>

            <button
              type="button"
              disabled={changedCount === 0 || isApplyingBulkUpdate}
              onClick={handleConfirmApply}
              className="px-5 py-2.5 bg-[#1B8354] hover:bg-[#146c44] disabled:opacity-45 text-white rounded-xl text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {isApplyingBulkUpdate ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-[#A3E635]" />
              )}
              <span>
                {isApplyingBulkUpdate
                  ? 'ডাটাবেসে সেভ হচ্ছে...'
                  : `${changedCount} টি চারার নতুন দাম সেভ করুন`}
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Live Before / After Price Preview Table */}
      <section className="bg-white border border-[#E8E1D5] rounded-2xl overflow-hidden">
        <div className="px-4 py-3 bg-[#FAF8F5] border-b border-[#E8E1D5] flex items-center justify-between">
          <h3 className="font-serif-bn text-sm font-bold text-[#142318]">
            লাইভ প্রিভিউ তালিকা (আগের দাম বনাম নতুন দাম)
          </h3>
          <span className="text-xs font-mono text-[#526356]">
            প্রথম ৫০টি চারার প্রিভিউ
          </span>
        </div>

        <div className="divide-y divide-[#EFEAE0] max-h-[460px] overflow-y-auto">
          {previewItems.slice(0, 50).map((item, idx) => (
            <div
              key={item.plant.id}
              className="px-4 py-2.5 flex items-center justify-between gap-3 text-xs hover:bg-[#FAF8F5]"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="font-mono text-xs text-[#785942] w-6">#{idx + 1}</span>
                <img
                  src={resolvePlantImageUrl(item.plant.image, PUJA_IMAGE)}
                  alt={item.plant.nameBn}
                  className="w-9 h-9 rounded-lg object-cover border border-[#DDD5C7] shrink-0"
                  loading="lazy"
                  decoding="async"
                />
                <div className="min-w-0">
                  <p className="font-serif-bn font-bold text-[#142318] truncate">
                    {item.plant.nameBn}
                  </p>
                  <p className="text-xs text-[#526356]">
                    {item.plant.category}
                    {item.nextBadge ? ` · ব্যাজ: ${item.nextBadge}` : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 font-mono tabular-nums shrink-0">
                <span className="text-[#785942] line-through">₹{item.oldPrimary}</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#526356]" />
                <span className="text-sm font-extrabold text-[#1B8354]">₹{item.newPrimary}</span>
                {item.diff !== 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                      item.diff < 0
                        ? 'bg-[#EBF5EF] text-[#14532D]'
                        : 'bg-[#FEF2F2] text-[#991B1B]'
                    }`}
                  >
                    {item.diff > 0 ? `+₹${item.diff}` : `-₹${Math.abs(item.diff)}`}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
