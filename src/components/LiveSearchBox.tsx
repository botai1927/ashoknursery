import { useState, useRef, useEffect, useMemo, useId } from 'react';
import { Search, X, Plus, Check, ArrowRight, Sprout } from 'lucide-react';
import { BrahmyamanPlant, PlantPotOption } from '../types/nursery';
import { PUJA_IMAGE } from '../data/brahmyamanCatalog';
import {
  extractCatalogSearchSuggestions,
  findMatchingHighlightSegments,
} from '../utils/plantSearch';
import { resolvePlantImageUrl } from '../utils/imageUrl';

export const POPULAR_SEARCHES = [
  { labelBn: 'আম', labelEn: 'Mango' },
  { labelBn: 'লেবু', labelEn: 'Lemon' },
  { labelBn: 'রক্তজবা', labelEn: 'Hibiscus' },
  { labelBn: 'গোলাপ', labelEn: 'Rose' },
  { labelBn: 'তুলসী', labelEn: 'Tulsi' },
  { labelBn: 'বেলপাতা', labelEn: 'Bael' },
  { labelBn: 'পদ্ম', labelEn: 'Lotus' },
];

interface LiveSearchBoxProps {
  plants: BrahmyamanPlant[];
  lang: 'bn' | 'en';
  value: string;
  onChange: (value: string) => void;
  onSelectPlant: (plant: BrahmyamanPlant) => void;
  onAddToInquiry: (plant: BrahmyamanPlant, option: PlantPotOption) => void;
  onSubmitSearch?: () => void;
  placeholder?: string;
  variant?: 'header-desktop' | 'header-mobile' | 'catalog';
  suggestionLimit?: number;
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  const segments = findMatchingHighlightSegments(text, query);
  return (
    <>
      {segments.map((seg, i) =>
        seg.matched ? (
          <mark
            key={i}
            className="bg-[#1B8354]/18 text-[#142318] font-bold rounded-[3px] px-0.5 not-italic"
          >
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </>
  );
}

export function LiveSearchBox({
  plants,
  lang,
  value,
  onChange,
  onSelectPlant,
  onAddToInquiry,
  onSubmitSearch,
  placeholder,
  variant = 'catalog',
  suggestionLimit = 8,
}: LiveSearchBoxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const { totalMatches, suggestions } = useMemo(
    () => extractCatalogSearchSuggestions(plants, value, suggestionLimit),
    [plants, value, suggestionLimit]
  );

  // Reset highlighted option whenever query changes
  useEffect(() => {
    setActiveIndex(-1);
  }, [value]);

  // Close dropdown when clicking outside this search box
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleInputChange = (nextValue: string) => {
    onChange(nextValue);
    setIsOpen(true);
  };

  const handlePickPlant = (plant: BrahmyamanPlant) => {
    setIsOpen(false);
    setActiveIndex(-1);
    onSelectPlant(plant);
  };

  const handlePickPopularChip = (term: string) => {
    onChange(term);
    setIsOpen(false);
    onSubmitSearch?.();
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isOpen && activeIndex >= 0 && suggestions[activeIndex]) {
      handlePickPlant(suggestions[activeIndex]);
      return;
    }
    setIsOpen(false);
    onSubmitSearch?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (!value.trim() || suggestions.length === 0) {
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen(true);
      setActiveIndex((prev) => (prev + 1 >= suggestions.length ? 0 : prev + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIsOpen(true);
      setActiveIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
    }
  };

  const handleQuickAdd = (e: React.MouseEvent, plant: BrahmyamanPlant) => {
    e.stopPropagation();
    const defaultOpt = plant.options[0];
    if (!defaultOpt) return;
    onAddToInquiry(plant, defaultOpt);
    setJustAddedId(plant.id);
    setTimeout(() => {
      setJustAddedId((curr) => (curr === plant.id ? null : curr));
    }, 1200);
  };

  const inputSizeClass =
    variant === 'header-mobile'
      ? 'h-9 pl-8.5 pr-8 text-xs'
      : variant === 'header-desktop'
      ? 'h-10 pl-9.5 pr-8 text-xs sm:text-sm'
      : 'h-11 sm:h-12 pl-10.5 pr-10 text-xs sm:text-sm shadow-2xs';

  const defaultPlaceholder =
    lang === 'bn'
      ? variant === 'catalog'
        ? 'গাছের নাম, রঙ বা ধরন লিখুন (যেমন: আম, লেবু, গোলাপ, joba, tulsi)...'
        : 'চারা খুঁজুন (আম, লেবু, গোলাপ, joba, tulsi)...'
      : 'Search saplings (Mango, Lemon, Rose, Tulsi)...';

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleFormSubmit} className="relative w-full">
        <Search
          className={`text-[#526857] absolute top-1/2 -translate-y-1/2 pointer-events-none ${
            variant === 'header-mobile'
              ? 'w-3.5 h-3.5 left-3'
              : variant === 'catalog'
              ? 'w-4 h-4 left-3.5'
              : 'w-4 h-4 left-3.5'
          }`}
        />
        <input
          type="search"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            isOpen && activeIndex >= 0 && suggestions[activeIndex]
              ? `${listboxId}-opt-${suggestions[activeIndex].id}`
              : undefined
          }
          value={value}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || defaultPlaceholder}
          aria-label={lang === 'bn' ? 'চারাগাছ অনুসন্ধান' : 'Search plant catalog'}
          className={`w-full ${inputSizeClass} bg-white border border-[#CEDAC9] rounded-xl text-[#142318] placeholder:text-[#7D9182] focus:outline-none focus:ring-2 focus:ring-[#1B8354] focus:border-[#1B8354] font-sans-bn transition-shadow`}
        />
        {value && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              onChange('');
              setActiveIndex(-1);
              setIsOpen(true);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full hover:bg-[#EBF1E8] text-[#526857] hover:text-[#142318] flex items-center justify-center cursor-pointer transition-colors"
            aria-label={lang === 'bn' ? 'সার্চ মুছুন' : 'Clear search'}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </form>

      {/* Live Search Suggestions Dropdown */}
      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          aria-label={lang === 'bn' ? 'সম্ভাব্য গাছের সাজেশন' : 'Live plant search suggestions'}
          className="absolute left-0 right-0 top-full mt-2 bg-white border border-[#CEDAC9] rounded-2xl shadow-xl z-50 overflow-hidden font-sans-bn"
        >
          {!value.trim() ? (
            <div className="p-3.5">
              <div className="flex items-center justify-between gap-2 mb-2">
                <p className="text-[11px] font-semibold text-[#526857] flex items-center gap-1.5">
                  <Sprout className="w-3.5 h-3.5 text-[#1B8354]" />
                  <span>{lang === 'bn' ? 'জনপ্রিয় চারা খুঁজুন:' : 'Popular searches:'}</span>
                </p>
                <span className="text-[10px] font-mono-num text-[#526857]">
                  {plants.length} {lang === 'bn' ? 'টি চারা' : 'plants'}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_SEARCHES.map((item) => (
                  <button
                    key={item.labelEn}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() =>
                      handlePickPopularChip(lang === 'bn' ? item.labelBn : item.labelEn)
                    }
                    className="px-2.5 py-1 rounded-lg bg-[#EBF1E8] hover:bg-[#142318] hover:text-white border border-[#DFE7DC] text-xs font-medium text-[#142318] transition-colors cursor-pointer"
                  >
                    {lang === 'bn' ? item.labelBn : item.labelEn}
                  </button>
                ))}
              </div>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-xs font-semibold text-[#142318]">
                {lang === 'bn'
                  ? `"${value}" নামের কোনো চারা পাওয়া যায়নি`
                  : `No saplings found for "${value}"`}
              </p>
              <p className="text-[11px] text-[#526356] mt-0.5">
                {lang === 'bn'
                  ? 'আম, লেবু, গোলাপ, জবা বা তুলসী লিখে দেখুন'
                  : 'Try mango, lemon, rose, hibiscus, or tulsi'}
              </p>
            </div>
          ) : (
            <div>
              <div className="px-3.5 py-2 bg-[#EBF1E8] border-b border-[#DFE7DC] flex items-center justify-between text-[11px] text-[#4C6252]">
                <span className="font-semibold">
                  {lang === 'bn'
                    ? `সম্ভাব্য গাছের নাম (${totalMatches}টি মিল)`
                    : `Matching plants (${totalMatches} found)`}
                </span>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setIsOpen(false);
                    onSubmitSearch?.();
                  }}
                  className="text-[#1B8354] font-bold hover:underline cursor-pointer"
                >
                  {lang === 'bn' ? 'সব দেখুন' : 'View all'}
                </button>
              </div>

              <ul className="divide-y divide-[#E5ECE2] max-h-80 overflow-y-auto">
                {suggestions.map((plant, idx) => {
                  const baseOpt = plant.options[0];
                  const isAdded = justAddedId === plant.id;
                  const isActive = idx === activeIndex;
                  return (
                    <li
                      key={`suggestion-${plant.id}`}
                      id={`${listboxId}-opt-${plant.id}`}
                      role="option"
                      aria-selected={isActive}
                    >
                      <div
                        onMouseDown={(e) => e.preventDefault()}
                        onMouseEnter={() => setActiveIndex(idx)}
                        onClick={() => handlePickPlant(plant)}
                        className={`px-3.5 py-2.5 flex items-center gap-3 transition-colors cursor-pointer ${
                          isActive ? 'bg-[#E4ECE0]' : 'hover:bg-[#EBF1E8]'
                        }`}
                      >
                        <div className="w-11 h-11 rounded-lg bg-[#E4ECE0] border border-[#D5DFD1] overflow-hidden shrink-0 flex items-center justify-center">
                          <img
                            src={resolvePlantImageUrl(plant.image, PUJA_IMAGE)}
                            alt={plant.nameBn}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              const target = e.currentTarget as HTMLImageElement;
                              if (target.src !== PUJA_IMAGE) target.src = PUJA_IMAGE;
                            }}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-serif-bn text-sm font-bold text-[#142318] truncate">
                            <HighlightedText
                              text={lang === 'bn' ? plant.nameBn : plant.nameEn}
                              query={value}
                            />
                            {plant.colorBn && (
                              <span className="ml-1.5 text-[11px] font-sans-bn font-normal text-[#526857]">
                                ({plant.colorBn})
                              </span>
                            )}
                          </p>
                          <div className="flex items-center gap-1.5 text-[11px] text-[#526356] truncate">
                            <span className="truncate">
                              <HighlightedText
                                text={lang === 'bn' ? plant.nameEn : plant.nameBn}
                                query={value}
                              />
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="truncate">{plant.category}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono-num font-bold text-[#B34728] tabular-nums shrink-0">
                              ₹{baseOpt?.price || 50}
                            </span>
                            {plant.inStock === false && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="text-[#B34728] font-medium shrink-0">
                                  {lang === 'bn' ? 'স্টক শেষ' : 'Out of stock'}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={(e) => handleQuickAdd(e, plant)}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 shrink-0 transition-colors cursor-pointer ${
                            isAdded
                              ? 'bg-[#142318] text-white'
                              : 'bg-[#1B8354]/12 text-[#1B8354] hover:bg-[#1B8354] hover:text-white'
                          }`}
                        >
                          {isAdded ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                          <span>
                            {isAdded
                              ? lang === 'bn'
                                ? 'যুক্ত'
                                : 'Added'
                              : lang === 'bn'
                              ? 'ব্যাগ'
                              : 'Add'}
                          </span>
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {totalMatches > suggestions.length && (
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setIsOpen(false);
                    onSubmitSearch?.();
                  }}
                  className="w-full py-2.5 px-4 bg-[#EBF1E8] hover:bg-[#DCE7D7] border-t border-[#D5DFD1] text-xs font-semibold text-[#142318] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>
                    {lang === 'bn'
                      ? `আরও ${totalMatches - suggestions.length}টি ফলাফল নিচে দেখুন`
                      : `Show ${totalMatches - suggestions.length} more matches below`}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
