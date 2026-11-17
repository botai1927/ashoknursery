import { useState } from 'react';
import {
  Menu,
  MessageCircle,
  Phone,
  X,
  MapPin,
  Sparkles,
  Layers,
  Apple,
  Flower2,
  TreePine,
  Sprout,
  BookOpen,
  Star,
  Mic,
} from 'lucide-react';
import { NURSERY_CONTACT } from '../data/brahmyamanCatalog';
import { AudienceTag, BrahmyamanPlant, PlantPotOption } from '../types/nursery';
import { LiveSearchBox } from './LiveSearchBox';

export type WindowViewKey = 'catalog' | 'offers' | 'care' | 'reviews' | 'location';

interface HeaderProps {
  lang: 'bn' | 'en';
  plants: BrahmyamanPlant[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onToggleLang: () => void;
  inquiryCount: number;
  onOpenInquiryBag: () => void;
  onSelectAudience: (audience: AudienceTag) => void;
  onSelectPlant: (plant: BrahmyamanPlant) => void;
  onAddToInquiry: (plant: BrahmyamanPlant, option: PlantPotOption) => void;
  activeWindow?: WindowViewKey;
  onNavigateWindow?: (window: WindowViewKey) => void;
}

export function Header({
  lang,
  plants,
  searchQuery,
  onSearchChange,
  onToggleLang,
  inquiryCount,
  onOpenInquiryBag,
  onSelectAudience,
  onSelectPlant,
  onAddToInquiry,
  activeWindow = 'catalog',
  onNavigateWindow,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (windowKey: WindowViewKey, audience?: AudienceTag) => {
    setMobileMenuOpen(false);
    if (onNavigateWindow) {
      onNavigateWindow(windowKey);
    }
    if (audience) {
      onSelectAudience(audience);
      if (audience === 'all') {
        window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  };

  const handleSearchInput = (value: string) => {
    onSearchChange(value);
    if (value.trim() && onNavigateWindow && activeWindow !== 'catalog') {
      onNavigateWindow('catalog');
    }
  };

  const handleSubmitSearch = () => {
    if (onNavigateWindow && activeWindow !== 'catalog') {
      onNavigateWindow('catalog');
    }
    window.requestAnimationFrame(() => {
      const anchor =
        document.getElementById('catalog-content-anchor') ||
        document.getElementById('catalog');
      if (anchor) {
        anchor.scrollIntoView({ behavior: 'smooth' });
      }
    });
  };

  return (
    <header className="sticky top-0 z-40 bg-[#F4F7F1]/95 backdrop-blur-md border-b border-[#D5DFD1]">
      {/* Desktop Top Customer Trust Strip (hidden on narrow mobile to keep sticky bar slim) */}
      <div className="hidden sm:flex bg-[#122619] text-[#E8EDE9] px-4 sm:px-8 py-1.5 text-[11px] font-sans-bn items-center justify-between">
        <div className="flex items-center gap-2 truncate">
          <span className="truncate">{NURSERY_CONTACT.sublineBn}</span>
        </div>

        <div className="flex items-center gap-4 text-[#A8BDB0] shrink-0">
          <span>সকাল ৬:৩০ – সন্ধ্যা ৬:৩০</span>
          <span aria-hidden="true">·</span>
          <span>কালশুলি, পারসোলা, খাতড়া, সিমলাপাল</span>
          <span aria-hidden="true">·</span>
          <a
            href={`tel:${NURSERY_CONTACT.phone}`}
            className="text-[#FFD8C2] hover:text-white font-mono-num font-medium tabular-nums"
          >
            {NURSERY_CONTACT.phone}
          </a>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 sm:h-16 flex items-center justify-between gap-3 lg:gap-5">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              onSearchChange('');
              handleNavClick('catalog', 'all');
            }}
            className="group flex flex-col text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#15803D] rounded cursor-pointer"
          >
            <span className="font-serif-bn text-lg sm:text-2xl font-bold tracking-tight text-[#122619] group-hover:text-[#15803D] transition-colors whitespace-nowrap leading-none">
              ভ্রম্যমাণ নার্সারি
            </span>
            <span className="text-[10px] sm:text-[11px] font-sans-bn text-[#785942] mt-0.5 flex items-center gap-1 font-medium">
              <MapPin className="w-2.5 h-2.5 text-[#B84423]" />
              <span>কালশুলি · বাঁকুড়া</span>
            </span>
          </button>
        </div>

        {/* Zone 2: Bilingual Live Search Bar with Suggestions (Desktop) */}
        <div className="flex-1 max-w-md hidden md:block">
          <LiveSearchBox
            variant="header-desktop"
            plants={plants}
            lang={lang}
            value={searchQuery}
            onChange={handleSearchInput}
            onSelectPlant={onSelectPlant}
            onAddToInquiry={onAddToInquiry}
            onSubmitSearch={handleSubmitSearch}
            suggestionLimit={6}
          />
        </div>

        {/* Zone 3: Clean Text-First Window Navigation */}
        <nav
          aria-label="Primary Windows Navigation"
          className="hidden lg:flex items-center gap-4 xl:gap-5 text-xs xl:text-[13px] font-semibold text-[#526356] font-sans-bn"
        >
          {[
            { key: 'catalog' as WindowViewKey, bn: 'ক্যাটালগ', en: 'Catalog' },
            { key: 'offers' as WindowViewKey, bn: 'অফার ও ডিল', en: 'Offers' },
            { key: 'care' as WindowViewKey, bn: 'যত্নের নিয়ম', en: 'Care Guide' },
            { key: 'reviews' as WindowViewKey, bn: 'রিভিউ', en: 'Reviews' },
            { key: 'location' as WindowViewKey, bn: 'ঠিকানা', en: 'Location' },
          ].map((item) => {
            const isActive = activeWindow === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleNavClick(item.key, item.key === 'catalog' ? 'all' : undefined)}
                className={`relative py-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'text-[#122619] font-bold'
                    : 'text-[#526356] hover:text-[#122619]'
                }`}
              >
                {lang === 'bn' ? item.bn : item.en}
                {isActive && (
                  <span className="absolute left-0 right-0 -bottom-0.5 h-0.5 bg-[#15803D] rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 4: Language + Order Bag CTA + Compact Side Menu Trigger */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onToggleLang}
            aria-label="Toggle language"
            className="px-2.5 py-1.5 rounded-lg border border-[#CEDAC9] bg-white text-xs font-semibold text-[#122619] hover:bg-[#E4ECE0] transition-colors cursor-pointer active:scale-95"
          >
            {lang === 'bn' ? 'EN' : 'বাংলা'}
          </button>

          <button
            type="button"
            onClick={onOpenInquiryBag}
            aria-label={`Open WhatsApp order list with ${inquiryCount} items`}
            className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-2 bg-[#15803D] hover:bg-[#166534] active:scale-95 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            <span className="whitespace-nowrap hidden sm:inline">
              {lang === 'bn' ? 'অর্ডার তালিকা' : 'Order List'}
            </span>
            <span className="min-w-5 h-5 px-1 rounded-full bg-white text-[#15803D] text-xs font-bold inline-flex items-center justify-center tabular-nums font-mono-num">
              {inquiryCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle side navigation panel"
            aria-expanded={mobileMenuOpen}
            className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl border border-[#CEDAC9] bg-white text-[#142318] hover:bg-[#E4ECE0] cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Slim Mobile Live Search Row */}
      <div className="md:hidden px-4 pb-2.5">
        <LiveSearchBox
          variant="header-mobile"
          plants={plants}
          lang={lang}
          value={searchQuery}
          onChange={handleSearchInput}
          onSelectPlant={onSelectPlant}
          onAddToInquiry={onAddToInquiry}
          onSubmitSearch={handleSubmitSearch}
          suggestionLimit={6}
        />
      </div>

      {/* Compact Partial-Width Right Side Panel (keeps main website visible alongside) */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex justify-end items-start">
          {/* Light click-away backdrop so the page content remains clearly visible */}
          <div
            className="fixed inset-0 bg-[#142318]/25 backdrop-blur-[1px]"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          <aside
            aria-label="Side navigation panel"
            className="relative z-10 mt-14 mr-2.5 sm:mr-4 w-[258px] sm:w-[290px] max-w-[72vw] max-h-[calc(100dvh-4.5rem)] rounded-2xl border border-[#CEDAC9] bg-[#F3F6F1] shadow-2xl overflow-y-auto font-sans-bn"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between px-3.5 py-2.5 bg-[#EBF1E8] border-b border-[#D5DFD1]">
              <span className="text-xs font-bold text-[#142318]">
                {lang === 'bn' ? 'মেনু ও বিভাগসমূহ' : 'Menu & Categories'}
              </span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close side menu"
                className="w-8 h-8 rounded-lg bg-white border border-[#CEDAC9] text-[#142318] hover:bg-[#E4ECE0] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 space-y-3">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-[#785942] uppercase tracking-wider px-2">
                  {lang === 'bn' ? 'গাছপালার বিভাগসমূহ' : 'Plant Categories'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onSearchChange('');
                    handleNavClick('catalog', 'all');
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-bold text-[#142318] hover:bg-[#E4ECE0] flex items-center gap-2 cursor-pointer"
                >
                  <Layers className="w-4 h-4 text-[#142318] shrink-0" />
                  <span className="truncate">সকল চারাগাছ (All Plants)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavClick('catalog', 'fruit')}
                  className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-semibold text-[#B45309] hover:bg-[#E4ECE0] flex items-center gap-2 cursor-pointer"
                >
                  <Apple className="w-4 h-4 text-[#B45309] shrink-0" />
                  <span className="truncate">ফলের গাছ ও কলম</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavClick('catalog', 'puja')}
                  className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-semibold text-[#B34728] hover:bg-[#E4ECE0] flex items-center gap-2 cursor-pointer"
                >
                  <Flower2 className="w-4 h-4 text-[#B34728] shrink-0" />
                  <span className="truncate">নিত্য পূজার ফুল ও বেলপাতা</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavClick('catalog', 'flower')}
                  className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-semibold text-[#1B8354] hover:bg-[#E4ECE0] flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-[#1B8354] shrink-0" />
                  <span className="truncate">ছাদ ও বারান্দার ফুলগাছ</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavClick('catalog', 'foliage')}
                  className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-semibold text-[#142318] hover:bg-[#E4ECE0] flex items-center gap-2 cursor-pointer"
                >
                  <TreePine className="w-4 h-4 text-[#142318] shrink-0" />
                  <span className="truncate">গাছপালা, পাম ও শো-প্ল্যান্ট</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavClick('catalog', 'herbal')}
                  className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-semibold text-[#785942] hover:bg-[#E4ECE0] flex items-center gap-2 cursor-pointer"
                >
                  <Sprout className="w-4 h-4 text-[#785942] shrink-0" />
                  <span className="truncate">মসলা ও ভেষজ গাছ</span>
                </button>
              </div>

              <div className="pt-2 border-t border-[#D5DFD1] space-y-1">
                <p className="text-[10px] font-bold text-[#785942] uppercase tracking-wider px-2">
                  {lang === 'bn' ? 'অন্যান্য বিভাগ' : 'More'}
                </p>
                <button
                  type="button"
                  onClick={() => handleNavClick('offers')}
                  className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-bold text-[#B34728] hover:bg-[#E4ECE0] flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-[#B34728] shrink-0" />
                  <span className="truncate">চলতি মাসের অফার ও ডিল</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavClick('care')}
                  className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-semibold text-[#1B8354] hover:bg-[#E4ECE0] flex items-center gap-2 cursor-pointer"
                >
                  <BookOpen className="w-4 h-4 text-[#1B8354] shrink-0" />
                  <span className="truncate">মাটি তৈরি ও পরিচর্যা</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavClick('reviews')}
                  className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-semibold text-[#B45309] hover:bg-[#E4ECE0] flex items-center gap-2 cursor-pointer"
                >
                  <Star className="w-4 h-4 text-[#B45309] shrink-0" />
                  <span className="truncate">গ্রাহকদের রিভিউ</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavClick('location')}
                  className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-semibold text-[#785942] hover:bg-[#E4ECE0] flex items-center gap-2 cursor-pointer"
                >
                  <MapPin className="w-4 h-4 text-[#785942] shrink-0" />
                  <span className="truncate">নার্সারির ঠিকানা ও ম্যাপ</span>
                </button>

                <div className="pt-2 grid grid-cols-2 gap-1.5">
                  <a
                    href={`tel:${NURSERY_CONTACT.phone}`}
                    className="py-2 px-2 rounded-xl border border-[#CEDAC9] bg-white text-[#142318] text-[11px] font-bold flex items-center justify-center gap-1"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#1B8354]" />
                    <span>কল করুন</span>
                  </a>
                  <a
                    href={`https://wa.me/${NURSERY_CONTACT.phoneRaw}?text=${encodeURIComponent(
                      'নমস্কার অশোকদা, আমি কালশুলির নার্সারি থেকে মুখে বলে (Voice Note) চারাগাছ অর্ডার করতে চাই।'
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-2 rounded-xl bg-[#1B8354] hover:bg-[#146c44] text-white text-[11px] font-bold flex items-center justify-center gap-1"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>ভয়েস অর্ডার</span>
                  </a>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </header>
  );
}
