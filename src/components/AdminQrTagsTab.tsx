import { useMemo, useState } from 'react';
import {
  QrCode,
  Printer,
  Download,
  Search,
  CheckSquare,
  Square,
  X,
} from 'lucide-react';
import type { AdminActivityLogItem, BrahmyamanPlant, PlantCategory } from '../types/nursery';
import { ADMIN_CATEGORIES } from './adminConstants';
import { classifyPlantsByUpload } from '../utils/plantUploadSort';
import {
  buildPlantPublicUrl,
  buildPrintableQrTagSheetHtml,
  generateQrCodeDataUrl,
} from '../utils/qrCodeSvg';

interface AdminQrTagsTabProps {
  activePlants: BrahmyamanPlant[];
  activityLogs?: AdminActivityLogItem[];
  preselectedPlantId?: string | null;
  onClearPreselectedPlant?: () => void;
}

export function AdminQrTagsTab({
  activePlants,
  activityLogs = [],
  preselectedPlantId,
  onClearPreselectedPlant,
}: AdminQrTagsTabProps) {
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'uploaded_only' | PlantCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [layoutMode, setLayoutMode] = useState<'compact_12' | 'large_6'>('compact_12');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() =>
    preselectedPlantId ? new Set([preselectedPlantId]) : new Set()
  );

  const uploadInfoMap = useMemo(
    () => classifyPlantsByUpload(activePlants, activityLogs),
    [activePlants, activityLogs]
  );

  const filteredPlants = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return activePlants.filter((p) => {
      if (categoryFilter === 'uploaded_only') {
        if (!uploadInfoMap.get(p.id)?.isUserUploaded) return false;
      } else if (categoryFilter !== 'all' && p.category !== categoryFilter) {
        return false;
      }
      if (!q) return true;
      return (
        p.nameBn.toLowerCase().includes(q) ||
        (p.nameEn || '').toLowerCase().includes(q) ||
        (p.colorBn || '').toLowerCase().includes(q)
      );
    });
  }, [activePlants, categoryFilter, searchQuery, uploadInfoMap]);

  const plantsToPrint = useMemo(() => {
    if (preselectedPlantId) {
      const single = activePlants.find((p) => p.id === preselectedPlantId);
      if (single) return [single];
    }
    if (selectedIds.size > 0) {
      return activePlants.filter((p) => selectedIds.has(p.id));
    }
    return filteredPlants.slice(0, 24);
  }, [activePlants, filteredPlants, preselectedPlantId, selectedIds]);

  const togglePlantSelection = (id: string) => {
    if (preselectedPlantId && onClearPreselectedPlant) {
      onClearPreselectedPlant();
    }
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handlePrintSheet = () => {
    if (plantsToPrint.length === 0) return;
    const html = buildPrintableQrTagSheetHtml(plantsToPrint, { layout: layoutMode });
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.src = blobUrl;
    document.body.appendChild(iframe);

    iframe.onload = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch {
        // Fallback download if iframe print is blocked
        handleDownloadHtml();
      }
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
        iframe.remove();
      }, 60000);
    };
  };

  const handleDownloadHtml = () => {
    if (plantsToPrint.length === 0) return;
    const html = buildPrintableQrTagSheetHtml(plantsToPrint, { layout: layoutMode });
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brahmyaman-qr-tags-${plantsToPrint.length}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Header & Print Controls */}
      <section className="bg-white border border-[#E8E1D5] rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#1B8354]/10 text-[#1B8354] flex items-center justify-center shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif-bn text-base sm:text-lg font-bold text-[#142318]">
                প্রিন্টেবল QR কোড প্ল্যান্ট ট্যাগ জেনারেটর
              </h2>
              <p className="text-xs text-[#526356]">
                নার্সারির টব বা চারার গায়ে লাগানোর জন্য ১-ক্লিকে প্রতিটি গাছের নাম, দাম (₹), পরিচর্যা ও স্ক্যানযোগ্য QR কোড তৈরি করুন
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handlePrintSheet}
              disabled={plantsToPrint.length === 0}
              className="px-4 py-2.5 bg-[#1B8354] hover:bg-[#146c44] disabled:opacity-45 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>প্রিন্ট করুন ({plantsToPrint.length} টি ট্যাগ)</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadHtml}
              disabled={plantsToPrint.length === 0}
              className="px-3.5 py-2.5 bg-[#142318] hover:bg-[#203425] disabled:opacity-45 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#A3E635]" />
              <span>প্রিন্ট ফাইল ডাউনলোড</span>
            </button>
          </div>
        </div>

        {preselectedPlantId && (
          <div className="p-3 bg-[#EBF5EF] border border-[#BFE2CC] rounded-xl flex items-center justify-between gap-2 text-xs text-[#14532D]">
            <span className="font-bold">
              নির্দিষ্ট ১টি চারার QR ট্যাগ নির্বাচিত: {plantsToPrint[0]?.nameBn}
            </span>
            <button
              type="button"
              onClick={onClearPreselectedPlant}
              className="px-2.5 py-1 bg-white rounded-lg text-xs font-bold text-[#142318] cursor-pointer"
            >
              সব চারার ট্যাগ দেখুন
            </button>
          </div>
        )}

        {/* Filter & Layout Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          <div className="relative sm:col-span-5">
            <Search className="w-4 h-4 text-[#785942] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="চারার নাম লিখে খুঁজুন (যেমন: টিউলিপ, জাম, জবা)..."
              className="w-full h-10 pl-9 pr-8 bg-[#FAF8F5] border border-[#E8E1D5] rounded-xl text-xs text-[#142318]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#785942] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="sm:col-span-4">
            <select
              aria-label="ক্যাটাগরি ফিল্টার"
              value={categoryFilter}
              onChange={(e) =>
                setCategoryFilter(e.target.value as 'all' | 'uploaded_only' | PlantCategory)
              }
              className="w-full h-10 px-3 bg-[#FAF8F5] border border-[#E8E1D5] rounded-xl text-xs font-bold text-[#142318]"
            >
              <option value="all">সকল বিভাগ ({activePlants.length})</option>
              <option value="uploaded_only">শুধু নতুন আপলোড করা চারা</option>
              {ADMIN_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              aria-label="ট্যাগ সাইজ"
              value={layoutMode}
              onChange={(e) => setLayoutMode(e.target.value as 'compact_12' | 'large_6')}
              className="w-full h-10 px-3 bg-[#FAF8F5] border border-[#E8E1D5] rounded-xl text-xs font-bold text-[#142318]"
            >
              <option value="compact_12">কমপ্যাক্ট ট্যাগ (প্রতি A4 পেজে ১২টি)</option>
              <option value="large_6">বড় টব ডিসপ্লে ট্যাগ (প্রতি A4 পেজে ৬টি)</option>
            </select>
          </div>
        </div>

        {/* Selection Toolbar */}
        <div className="flex items-center justify-between gap-2 flex-wrap text-xs text-[#526356]">
          <span>
            নির্বাচিত ট্যাগ:{' '}
            <strong className="text-[#142318]">
              {selectedIds.size > 0
                ? `${selectedIds.size} টি (ম্যানুয়াল)`
                : `প্রথম ${plantsToPrint.length} টি`}
            </strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedIds(new Set(filteredPlants.slice(0, 24).map((p) => p.id)))}
              className="text-[#1B8354] font-bold hover:underline cursor-pointer"
            >
              প্রথম ২৪টি সিলেক্ট করুন
            </button>
            {selectedIds.size > 0 && (
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="text-[#B34728] font-bold hover:underline cursor-pointer"
              >
                সিলেকশন মুছুন
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Live Preview Grid of Printable QR Plant Tags */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filteredPlants.slice(0, 24).map((plant) => {
          const isSelected = preselectedPlantId === plant.id || selectedIds.has(plant.id);
          const qrDataUrl = generateQrCodeDataUrl(buildPlantPublicUrl(plant.id), {
            sizePx: 140,
          });
          const price = plant.options?.[0]?.price || 50;

          return (
            <div
              key={plant.id}
              onClick={() => togglePlantSelection(plant.id)}
              className={`bg-white border-2 rounded-2xl p-3.5 transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                isSelected
                  ? 'border-[#1B8354] bg-[#F8FCF9] shadow-xs'
                  : 'border-[#E8E1D5] hover:border-[#1B8354]/50'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-dashed border-[#D5C9B8]">
                <div>
                  <p className="font-serif-bn text-xs font-extrabold text-[#142318]">
                    ভ্রাম্যমাণ নার্সারি
                  </p>
                  <p className="text-xs text-[#526356]">সুস্থ ও শিকড়যুক্ত চারা</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded bg-[#EBF5EF] text-[#14532D] text-xs font-bold">
                    {plant.category}
                  </span>
                  {isSelected ? (
                    <CheckSquare className="w-4 h-4 text-[#1B8354]" />
                  ) : (
                    <Square className="w-4 h-4 text-[#785942]" />
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-1">
                  <h3 className="font-serif-bn text-base font-extrabold text-[#142318] leading-snug truncate">
                    {plant.nameBn}
                  </h3>
                  <p className="text-xs text-[#526356] truncate">
                    {plant.nameEn}
                    {plant.colorBn ? ` · ${plant.colorBn}` : ''}
                  </p>
                  <div className="inline-block px-2.5 py-0.5 rounded-lg bg-[#FFF8F0] border border-[#EADBCC] font-mono text-base font-extrabold text-[#B34728]">
                    ₹{price}
                  </div>
                  <p className="text-xs text-[#374151] leading-snug">
                    রোদ: {plant.sunlightBn || 'পর্যাপ্ত রোদ'} · জল:{' '}
                    {plant.wateringBn || 'পরিমিত'}
                  </p>
                </div>

                <div className="flex flex-col items-center shrink-0">
                  <img
                    src={qrDataUrl}
                    alt={`QR ${plant.nameBn}`}
                    className="w-22 h-22 rounded-lg border border-[#D5C9B8] bg-white p-1"
                    loading="lazy"
                    decoding="async"
                  />
                  <span className="text-xs font-bold text-[#14532D] mt-0.5">
                    স্ক্যান করে দেখুন
                  </span>
                </div>
              </div>

              <div className="pt-1.5 border-t border-[#EFEAE0] flex items-center justify-between text-xs text-[#526356] font-mono">
                <span>হোয়াটসঅ্যাপ: +91 86094 17672</span>
                <span>ID: {plant.id.slice(0, 12)}</span>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
