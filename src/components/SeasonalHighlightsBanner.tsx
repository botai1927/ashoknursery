import { useState } from 'react';
import { Sparkles, ArrowRight, X } from 'lucide-react';
import { SEASONAL_HIGHLIGHTS, SeasonalHighlight, BRAHMYAMAN_PLANTS, PUJA_IMAGE } from '../data/brahmyamanCatalog';
import { BrahmyamanPlant } from '../types/nursery';
import { resolvePlantImageUrl } from '../utils/imageUrl';

interface SeasonalHighlightsBannerProps {
  lang: 'bn' | 'en';
  plants?: BrahmyamanPlant[];
  onSelectPlant: (plant: BrahmyamanPlant) => void;
}

export function SeasonalHighlightsBanner({ lang, plants, onSelectPlant }: SeasonalHighlightsBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const handleClickItem = (highlight: SeasonalHighlight) => {
    const sourceList = plants && plants.length > 0 ? plants : BRAHMYAMAN_PLANTS;
    const matched = sourceList.find((p) => p.id === highlight.plantId);
    if (matched) {
      onSelectPlant(matched);
    }
  };

  return (
    <aside
      aria-label="Seasonal highlights banner"
      className="bg-[#EBF1E8] border-b border-[#D5DFD1] text-[#142318] py-4 sm:py-5 transition-all"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Banner Header Row */}
        <div className="flex items-center justify-between gap-4 mb-3.5">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-[#B34728]/15 text-[#B34728] flex items-center justify-center shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <div>
              <h2 className="font-serif-bn text-sm sm:text-base font-bold text-[#142318] flex items-center gap-2">
                <span>{lang === 'bn' ? 'বর্তমান মরশুমের বিশেষ সম্ভার' : 'Current Seasonal Highlights'}</span>
                <span className="hidden sm:inline text-xs font-sans-bn font-normal text-[#785942]">
                  · {lang === 'bn' ? 'কালশুলির নার্সারিতে এখন ফল ও কুঁড়িসহ প্রস্তুত' : 'Ready with blooms & fruit grafts in Kalsuli'}
                </span>
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            aria-label="Dismiss seasonal highlights banner"
            className="text-[#785942] hover:text-[#142318] p-1.5 rounded-lg hover:bg-[#DCE7D7] transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 4 Earthy Cards Horizontal / Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {SEASONAL_HIGHLIGHTS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleClickItem(item)}
              className="group text-left p-2.5 sm:p-3 rounded-xl bg-white/85 hover:bg-white border border-[#D5DFD1] hover:border-[#B34728]/60 shadow-xs hover:shadow-sm transition-all duration-200 cursor-pointer flex items-center gap-3"
            >
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-lg overflow-hidden bg-[#E4ECE0] shrink-0 border border-[#D5DFD1]">
                <img
                  src={resolvePlantImageUrl(item.image, PUJA_IMAGE)}
                  alt={item.titleBn}
                  className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    if (target.src !== PUJA_IMAGE) target.src = PUJA_IMAGE;
                  }}
                />
              </div>

              <div className="min-w-0 flex-1">
                <span className="block text-xs font-semibold text-[#B34728] truncate font-sans-bn">
                  {lang === 'bn' ? item.tagBn : item.tagEn}
                </span>
                <p className="font-serif-bn text-xs sm:text-sm font-bold text-[#142318] group-hover:text-[#1B8354] transition-colors truncate mt-0.5">
                  {lang === 'bn' ? item.titleBn : item.titleEn}
                </p>
                <div className="flex items-center justify-between text-xs font-sans-bn text-[#785942] mt-0.5">
                  <span className="font-mono-num font-semibold text-[#142318]">
                    {lang === 'bn' ? item.priceNoteBn : item.priceNoteEn}
                  </span>
                  <ArrowRight className="w-3 h-3 text-[#B34728] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
