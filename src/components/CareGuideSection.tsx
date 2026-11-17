import { useState } from 'react';
import { Sparkles, Sun, Droplets, Shovel, ShieldCheck } from 'lucide-react';
import { CARE_TIPS_DATA } from '../data/brahmyamanCatalog';

interface CareGuideSectionProps {
  lang: 'bn' | 'en';
}

export function CareGuideSection({ lang }: CareGuideSectionProps) {
  const [selectedTipId, setSelectedTipId] = useState(CARE_TIPS_DATA[0].id);

  const activeTip =
    CARE_TIPS_DATA.find((t) => t.id === selectedTipId) ?? CARE_TIPS_DATA[0];

  const getIcon = (id: string) => {
    switch (id) {
      case 'tip-2':
      case 'bankura-summer':
        return Sun;
      case 'tip-3':
      case 'puja-blooms':
        return Droplets;
      case 'tip-4':
        return ShieldCheck;
      case 'tip-1':
      case 'soil-preparation':
      default:
        return Shovel;
    }
  };

  return (
    <section id="care-section" className="py-14 sm:py-20 bg-[#EBF1E8] border-t border-[#D5DFD1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <p className="text-xs font-semibold tracking-wider text-[#B34728] uppercase font-sans-bn">
            {lang === 'bn' ? 'বাঁকুড়ার মাটির সহজ পরিচর্যা' : 'Local Soil & Climate Guidance'}
          </p>
          <h2
            className="font-serif-bn text-2xl sm:text-4xl text-[#142318] font-normal tracking-tight mt-1.5"
            style={{ textWrap: 'balance' }}
          >
            {lang === 'bn'
              ? 'ছাদের কড়া রোদ ও লাল মাটিতে গাছ বাঁচিয়ে রাখার গোপন সূত্র'
              : 'Proven Care for Bankura Heat & Red Laterite Soil'}
          </h2>
          <p className="text-xs sm:text-sm text-[#526356] mt-2.5 font-sans-bn leading-relaxed">
            {lang === 'bn'
              ? 'আমাদের কালশুলির নার্সারির বাস্তব অভিজ্ঞতা থেকে সংকলিত সহজ নিয়ম।'
              : 'Practical advice drawn from years of greenhouse tending in Kalsuli village.'}
          </p>
        </div>

        {/* 3-Tab Selector */}
        <div className="flex flex-wrap justify-center gap-2 p-1.5 bg-[#DCE7D7] rounded-2xl max-w-2xl mx-auto mb-8">
          {CARE_TIPS_DATA.map((tip) => {
            const Icon = getIcon(tip.id);
            const isSelected = tip.id === activeTip.id;
            return (
              <button
                key={tip.id}
                type="button"
                onClick={() => setSelectedTipId(tip.id)}
                className={`flex-1 min-w-[160px] inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white text-[#142318] shadow-xs'
                    : 'text-[#526356] hover:text-[#142318]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-[#B34728]' : 'text-[#785942]'}`} />
                <span className="truncate">{lang === 'bn' ? tip.targetBn : tip.targetEn}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Care Tip Card */}
        <div className="bg-white border border-[#D5DFD1] rounded-2xl p-6 sm:p-10 max-w-4xl mx-auto shadow-xs">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1B8354]/10 text-[#1B8354] text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? activeTip.targetBn : activeTip.targetEn}</span>
          </div>

          <h3 className="font-serif-bn text-xl sm:text-2xl font-bold text-[#142318] mb-3">
            {lang === 'bn' ? activeTip.titleBn : activeTip.titleEn}
          </h3>

          <p className="text-xs sm:text-sm text-[#526356] font-sans-bn leading-relaxed mb-6">
            {lang === 'bn' ? activeTip.descBn : activeTip.descEn}
          </p>

          <div className="pt-6 border-t border-[#DFE7DC] space-y-4 font-sans-bn">
            <p className="text-xs font-bold uppercase tracking-wider text-[#B34728]">
              {lang === 'bn' ? 'জরুরি ৩টি নিয়ম (Essential Checklist):' : 'Essential 3 Rules:'}
            </p>
            <div className="space-y-3">
              {(lang === 'bn' ? activeTip.bulletPointsBn : activeTip.bulletPointsEn).map(
                (point, idx) => (
                  <div key={idx} className="flex items-start gap-3.5 text-xs sm:text-sm text-[#142318]">
                    <span className="w-6 h-6 rounded-full bg-[#E4ECE0] text-[#B34728] font-bold font-mono-num text-xs flex items-center justify-center shrink-0 mt-0.5">
                      0{idx + 1}
                    </span>
                    <p className="leading-relaxed flex-1">{point}</p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
