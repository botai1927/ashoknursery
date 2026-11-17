import { MessageCircle, Phone, MapPin, ArrowDown, ShieldCheck, Camera, Sprout } from 'lucide-react';
import { HERO_IMAGE, NURSERY_CONTACT } from '../data/brahmyamanCatalog';
import { FallingLeaves } from './FallingLeaves';
import { AudienceTag } from '../types/nursery';

interface HeroSectionProps {
  lang: 'bn' | 'en';
  onSelectAudience: (audience: AudienceTag) => void;
  onExploreCatalog: () => void;
  onOpenLocation: () => void;
}

export function HeroSection({
  lang,
  onSelectAudience,
  onExploreCatalog,
  onOpenLocation,
}: HeroSectionProps) {
  const whatsappMessage = encodeURIComponent(
    'নমস্কার, আমি কালশুলির ভ্রাম্যমাণ নার্সারি থেকে সতেজ চারাগাছ ও ফলের কলম সম্পর্কে জানতে ও অর্ডার করতে চাই।'
  );
  const whatsappUrl = `https://wa.me/${NURSERY_CONTACT.phoneRaw}?text=${whatsappMessage}`;

  const quickCategories: Array<{ id: AudienceTag; labelBn: string; labelEn: string }> = [
    { id: 'fruit', labelBn: 'ফলের গাছ ও কলম', labelEn: 'Fruit Grafts' },
    { id: 'puja', labelBn: 'নিত্য পূজার ফুল', labelEn: 'Puja Flowers' },
    { id: 'flower', labelBn: 'ছাদ ও বারান্দার ফুল', labelEn: 'Terrace Blooms' },
    { id: 'herbal', labelBn: 'মসলা ও ভেষজ', labelEn: 'Herbs & Spices' },
  ];

  return (
    <section className="relative w-full min-h-[270px] sm:min-h-[325px] lg:min-h-[370px] flex items-center justify-center overflow-hidden bg-[#122619] text-white">
      {/* Background Image Container with Subtle Ambient Motion */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
        <img
          src={HERO_IMAGE}
          alt="Brahmyaman Nursery in Kalsuli village, Bankura with potted plants and red laterite soil"
          className="w-full h-full object-cover object-center animate-kenburns scale-105"
          referrerPolicy="no-referrer"
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D1C12] via-[#122619]/78 to-[#163120]/52" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(163,230,53,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_28%,rgba(10,20,14,0.72)_100%)]" />
      </div>

      <FallingLeaves className="opacity-65" />

      {/* Immediate, High-Contrast Focal Content */}
      <div className="relative z-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-9 text-center flex flex-col items-center w-full">
        {/* Clean Eyebrow */}
        <p className="text-xs sm:text-xs font-sans-bn font-semibold uppercase tracking-[0.16em] text-[#FFD8C2] mb-2">
          {lang === 'bn'
            ? 'কালশুলি গ্রাম · বাঁকুড়া, ৭২২১৬০ · পারিবারিক নার্সারি'
            : 'Kalsuli Village · Bankura, 722160 · Family Nursery'}
        </p>

        {/* Zero-Delay Main Headline */}
        <h1
          className="font-serif-bn font-normal text-2xl sm:text-4xl lg:text-[46px] tracking-tight leading-[1.18] text-[#FDFBF7] max-w-3xl"
          style={{ textWrap: 'balance' }}
        >
          {lang === 'bn' ? (
            <>
              <span className="text-[#FFD8C2]">মাটির টানে</span>{' '}
              <span className="text-[#A3E635] font-semibold">সবুজ প্রাণে</span>,
              <br className="hidden sm:inline" /> ঘরের উঠোন ও ছাদবাগান
            </>
          ) : (
            <>
              <span className="text-[#FFD8C2]">Earthy Roots,</span>{' '}
              <span className="text-[#A3E635] font-semibold">Living Green</span> for Your Home &amp; Rooftop
            </>
          )}
        </h1>

        <p className="mt-2 max-w-xl font-sans-bn text-xs sm:text-sm text-[#E2E8E4] leading-relaxed">
          {lang === 'bn'
            ? 'বাঁকুড়ার লাল মাটি ও রোদে পরীক্ষিত সুস্থ শিকড়যুক্ত কলম ও ফুলের চারা — সরাসরি নার্সারি দামে।'
            : NURSERY_CONTACT.sublineEn}
        </p>

        {/* 1-Tap Popular Category Shortcuts (Horizontal Strip) */}
        <div className="mt-4 flex items-center justify-start sm:justify-center gap-2 font-sans-bn overflow-x-auto no-scrollbar max-w-full pb-1">
          {quickCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectAudience(cat.id)}
              className="px-3 py-1.5 rounded-lg bg-[#1A2E21]/85 hover:bg-[#15803D] hover:-translate-y-0.5 active:scale-95 text-[#E8EDE9] hover:text-white border border-white/15 hover:border-[#A3E635]/50 text-xs font-medium transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              {lang === 'bn' ? cat.labelBn : cat.labelEn}
            </button>
          ))}
        </div>

        {/* Primary CTA Row */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5 w-full max-w-md">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 min-w-[180px] inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#15803D] hover:bg-[#166534] hover:-translate-y-0.5 active:scale-[0.98] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-lg shadow-[#15803D]/30 transition-all cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            <span>{lang === 'bn' ? 'WhatsApp-এ সরাসরি অর্ডার' : 'Direct WhatsApp Order'}</span>
          </a>

          <a
            href={`tel:${NURSERY_CONTACT.phone}`}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-[#1E3325]/90 hover:bg-[#294433] hover:-translate-y-0.5 active:scale-[0.98] text-[#FDFBF7] border border-white/15 text-xs sm:text-sm font-medium rounded-xl transition-all cursor-pointer"
            aria-label="Call Brahmyaman Nursery"
          >
            <Phone className="w-4 h-4 text-[#A3E635]" />
            <span className="tabular-nums font-mono-num">{NURSERY_CONTACT.phone}</span>
          </a>
        </div>

        {/* Ethical Trust Reassurance Strip (Clean stacked grid on mobile, 3-col on Tablet+) */}
        <div className="mt-5 pt-4 border-t border-white/15 w-full max-w-3xl grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 text-left font-sans-bn">
          <div className="flex items-start gap-2.5 bg-white/8 sm:bg-transparent rounded-xl px-3 py-2.5 sm:p-0">
            <Sprout className="w-4 h-4 text-[#A3E635] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-[#FDFBF7]">
                {lang === 'bn' ? 'বাঁকুড়ার মাটিতে তৈরি চারা' : 'Acclimatized in Bankura Soil'}
              </p>
              <p className="text-xs text-[#CBD5E1] leading-snug">
                {lang === 'bn' ? 'কড়া রোদে সহনশীল কলম ও চারা' : 'Sun-hardy & early grafts'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 bg-white/8 sm:bg-transparent rounded-xl px-3 py-2.5 sm:p-0">
            <Camera className="w-4 h-4 text-[#FFD8C2] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-[#FDFBF7]">
                {lang === 'bn' ? 'পাঠানোর আগে আসল ছবি' : 'Live Photo Before Dispatch'}
              </p>
              <p className="text-xs text-[#CBD5E1] leading-snug">
                {lang === 'bn' ? 'চারা দেখে অর্ডার নিশ্চিত করুন' : 'Inspect sapling on WhatsApp'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 bg-white/8 sm:bg-transparent rounded-xl px-3 py-2.5 sm:p-0">
            <ShieldCheck className="w-4 h-4 text-[#A3E635] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-[#FDFBF7]">
                {lang === 'bn' ? 'অক্ষত শিকড় ডেলিভারি' : 'Intact Root-Ball Delivery'}
              </p>
              <p className="text-xs text-[#CBD5E1] leading-snug">
                {lang === 'bn' ? 'কালশুলি, পারসোলা, খাতড়া ও সিমলাপাল' : 'Kalsuli, Parsola, Khatra'}
              </p>
            </div>
          </div>
        </div>

        {/* Subtle Map & Browse Footer */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-xs text-[#CBD5E1] font-sans-bn">
          <button
            type="button"
            onClick={onOpenLocation}
            className="inline-flex items-center gap-1.5 text-[#FFD8C2] hover:text-white underline underline-offset-4 transition-colors cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5 text-[#FF8A65]" />
            <span>{lang === 'bn' ? 'কালশুলি নার্সারির ঠিকানা ও ম্যাপ' : 'Location & Google Maps'}</span>
          </button>
          <span aria-hidden="true" className="text-white/30">·</span>
          <button
            type="button"
            onClick={onExploreCatalog}
            className="inline-flex items-center gap-1.5 text-[#E2E8F0] hover:text-white hover:underline underline-offset-4 transition-colors cursor-pointer"
          >
            <ArrowDown className="w-3.5 h-3.5 text-[#A3E635]" />
            <span>{lang === 'bn' ? 'চারা ক্যাটালগ দেখুন' : 'Browse full catalog'}</span>
          </button>
        </div>
      </div>
    </section>
  );
}
