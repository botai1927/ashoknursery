import { useState, useMemo, useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';
import {
  Search,
  MessageCircle,
  Plus,
  Check,
  Sun,
  Droplets,
  Sparkles,
  X,
  Flower2,
  Apple,
  TreePine,
  Layers,
  Filter,
  Sprout,
  ArrowUpDown,
  ArrowLeft,
  Share2,
  ArrowLeftRight,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { BrahmyamanPlant, PlantPotOption, AudienceTag } from '../types/nursery';
import { NURSERY_CONTACT, PUJA_IMAGE, FRUIT_IMAGE, ROOFTOP_IMAGE } from '../data/brahmyamanCatalog';
import { resolvePlantImageUrl } from '../utils/imageUrl';
import { LiveSearchBox } from './LiveSearchBox';
import { PlantShareModal } from './PlantShareModal';
import { sortPlantsWithUploadsFirst } from '../utils/plantUploadSort';
import { recordWhatsAppInquiryLog } from '../utils/whatsappOrderTracker';
import {
  CategoryViewKey,
  isFruitPlant,
  isPoojaPlant,
  isFlowerPlant,
  isFoliagePlant,
  isHerbalPlant,
  searchAndRankPlants,
} from '../utils/plantSearch';

export type { CategoryViewKey };

type SortOrder = 'default' | 'price-asc' | 'price-desc';
type CatalogScrollMode = 'horizontal' | 'vertical';

const SCROLL_MODE_STORAGE_KEY = 'brahmyaman_catalog_scroll_mode';
const railScrollLeftMap = new Map<string, number>();

function HorizontalPlantRail({
  railKey,
  isVisible = true,
  title,
  subtitle,
  count,
  accentClass = 'text-[#122619]',
  onViewAll,
  lang,
  children,
}: {
  railKey: string;
  isVisible?: boolean;
  title: string;
  subtitle?: string;
  count?: number;
  accentClass?: string;
  onViewAll?: () => void;
  lang: 'bn' | 'en';
  children: ReactNode;
}) {
  const railRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const el = railRef.current;
    if (!el || !isVisible) return;
    const savedLeft = railScrollLeftMap.get(railKey);
    if (typeof savedLeft === 'number' && savedLeft > 0) {
      el.scrollLeft = savedLeft;
    }
  }, [railKey, isVisible]);

  const handleRailScroll = () => {
    const el = railRef.current;
    if (el && isVisible) {
      railScrollLeftMap.set(railKey, el.scrollLeft);
    }
  };

  const handleStep = (direction: -1 | 1) => {
    const el = railRef.current;
    if (!el) return;
    const step = Math.max(260, Math.round(el.clientWidth * 0.78));
    el.scrollBy({ left: direction * step, behavior: 'smooth' });
  };

  return (
    <section className="space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex items-baseline gap-2 flex-wrap">
          <h3 className={`font-serif-bn text-base sm:text-xl font-bold truncate ${accentClass}`}>
            {title}
          </h3>
          {typeof count === 'number' && (
            <span className="text-xs font-mono-num font-semibold text-[#785942] tabular-nums">
              ({count})
            </span>
          )}
          {subtitle && (
            <span className="hidden md:inline text-xs text-[#4C6252] font-sans-bn truncate">
              · {subtitle}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onViewAll && (
            <button
              type="button"
              onClick={onViewAll}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-[#15803D] hover:bg-[#E4ECE0] active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              {lang === 'bn' ? 'সব দেখুন →' : 'See all →'}
            </button>
          )}
          <button
            type="button"
            onClick={() => handleStep(-1)}
            aria-label={lang === 'bn' ? 'বামে স্ক্রল করুন' : 'Scroll left'}
            className="w-8 h-8 rounded-full border border-[#CEDAC9] bg-white hover:bg-[#122619] text-[#122619] hover:text-white active:scale-90 flex items-center justify-center transition-all shadow-2xs cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleStep(1)}
            aria-label={lang === 'bn' ? 'ডানে স্ক্রল করুন' : 'Scroll right'}
            className="w-8 h-8 rounded-full border border-[#CEDAC9] bg-white hover:bg-[#122619] text-[#122619] hover:text-white active:scale-90 flex items-center justify-center transition-all shadow-2xs cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="relative">
        <div
          ref={railRef}
          onScroll={handleRailScroll}
          className="flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-3 thin-horizontal-scroll"
        >
          {children}
        </div>
        {/* Subtle right-edge botanical mist fade cueing additional saplings */}
        <div
          aria-hidden="true"
          className="pointer-events-none hidden sm:block absolute top-0 right-0 bottom-3 w-8 bg-gradient-to-l from-[#F4F7F1]/85 to-transparent"
        />
      </div>
    </section>
  );
}

interface CatalogSectionProps {
  plants: BrahmyamanPlant[];
  lang: 'bn' | 'en';
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeAudience: AudienceTag;
  onSelectAudience: (audience: AudienceTag) => void;
  onOpenPlantModal: (plant: BrahmyamanPlant) => void;
  onAddToInquiry: (plant: BrahmyamanPlant, option: PlantPotOption) => void;
  isVisible?: boolean;
}

export function CatalogSection({
  plants,
  lang,
  searchQuery,
  onSearchChange,
  activeAudience,
  onSelectAudience,
  onOpenPlantModal,
  onAddToInquiry,
  isVisible = true,
}: CatalogSectionProps) {
  const [justAddedId, setJustAddedId] = useState<string | null>(null);
  const [shareTargetPlant, setShareTargetPlant] = useState<{
    plant: BrahmyamanPlant;
    photoSrc: string;
  } | null>(null);
  const [selectedColorFilter, setSelectedColorFilter] = useState<string>('all');
  const [activeCategory, setActiveCategory] = useState<CategoryViewKey>('all');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [under100Only, setUnder100Only] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>('default');
  const [scrollMode, setScrollMode] = useState<CatalogScrollMode>(() => {
    try {
      const saved = localStorage.getItem(SCROLL_MODE_STORAGE_KEY);
      if (saved === 'vertical' || saved === 'horizontal') return saved;
    } catch {
      // Ignore storage access failure
    }
    return 'horizontal';
  });

  const handleChangeScrollMode = (mode: CatalogScrollMode) => {
    setScrollMode(mode);
    try {
      localStorage.setItem(SCROLL_MODE_STORAGE_KEY, mode);
    } catch {
      // Ignore storage access failure
    }
  };

  // Sync external activeAudience to local activeCategory
  useEffect(() => {
    if (activeAudience === 'puja') {
      setActiveCategory('puja');
    } else if (activeAudience === 'fruit' || activeAudience === 'rooftop') {
      setActiveCategory('fruit');
    } else if (activeAudience === 'flower') {
      setActiveCategory('flower');
    } else if (activeAudience === 'foliage' || activeAudience === 'family') {
      setActiveCategory('foliage');
    } else if (activeAudience === 'herbal') {
      setActiveCategory('herbal');
    } else if (activeAudience === 'all') {
      setActiveCategory('all');
    }
  }, [activeAudience]);

  const handleCategoryTabClick = (cat: CategoryViewKey) => {
    setActiveCategory(cat);
    onSelectAudience(cat as AudienceTag);
    if (searchQuery.trim()) {
      onSearchChange('');
    }
    const el = document.getElementById('catalog-content-anchor') || document.getElementById('catalog');
    if (el) {
      const rect = el.getBoundingClientRect();
      // Only adjust viewport if catalog section header is scrolled off-screen; avoid jarring auto-scroll jumps!
      if (rect.top < -40 || rect.top > window.innerHeight * 0.65) {
        el.scrollIntoView({ behavior: 'instant' as ScrollBehavior });
      }
    }
  };

  const handleAddClick = (plant: BrahmyamanPlant) => {
    const defaultOption = plant.options[0];
    if (!defaultOption) return;
    onAddToInquiry(plant, defaultOption);
    setJustAddedId(plant.id);
    setTimeout(() => {
      setJustAddedId((curr) => (curr === plant.id ? null : curr));
    }, 1400);
  };

  const getSingleItemWhatsAppUrl = (plant: BrahmyamanPlant) => {
    const defaultOpt = plant.options[0] || { labelBn: 'গ্রো ব্যাগ চারা', price: 50 };
    const msg =
      plant.inStock === false
        ? encodeURIComponent(
            `নমস্কার, আমি কালশুলির ব্রাহ্ম্যমাণ নার্সারি থেকে "${plant.nameBn}" চারাটি (বর্তমানে স্টক শেষ দেখানো হচ্ছে) কবে আবার পাওয়া যাবে তা জানতে আগ্রহী।`
          )
        : encodeURIComponent(
            `নমস্কার, আমি কালশুলির ব্রাহ্ম্যমাণ নার্সারি থেকে "${plant.nameBn}" (${defaultOpt.labelBn} - ₹${defaultOpt.price}) চারা নিতে আগ্রহী। এর প্রাপ্যতা ও বিস্তারিত জানাবেন কি?`
          );
    return `https://wa.me/${NURSERY_CONTACT.phoneRaw}?text=${msg}`;
  };

  // Category lists
  const fruitList = useMemo(() => plants.filter(isFruitPlant), [plants]);
  const poojaList = useMemo(() => plants.filter(isPoojaPlant), [plants]);
  const herbalList = useMemo(() => plants.filter(isHerbalPlant), [plants]);
  const flowerList = useMemo(() => plants.filter(isFlowerPlant), [plants]);
  const foliageList = useMemo(() => plants.filter(isFoliagePlant), [plants]);

  const flowerColors = [
    { id: 'all', labelBn: 'সকল রং', labelEn: 'All Colors' },
    { id: 'লাল', labelBn: 'লাল', labelEn: 'Red' },
    { id: 'হলুদ', labelBn: 'হলুদ', labelEn: 'Yellow' },
    { id: 'গোলাপি', labelBn: 'গোলাপি', labelEn: 'Pink' },
    { id: 'সাদা', labelBn: 'সাদা', labelEn: 'White' },
    { id: 'বাই কালার', labelBn: 'বাই-কালার', labelEn: 'Bi-Color' },
  ];

  const filteredFlowerList = useMemo(() => {
    if (selectedColorFilter === 'all') return flowerList;
    return flowerList.filter((p) => {
      const c = `${p.colorBn || ''} ${p.nameBn} ${p.descriptionBn}`.toLowerCase();
      return c.includes(selectedColorFilter.toLowerCase());
    });
  }, [flowerList, selectedColorFilter]);

  // Smart Ranked Search
  const searchAnalysis = useMemo(
    () => searchAndRankPlants(plants, searchQuery),
    [plants, searchQuery]
  );

  // Base list + Quick Psychological Conversion Filters & Sorting
  const displayedPlants = useMemo(() => {
    let base: BrahmyamanPlant[];
    if (searchAnalysis.isSearching) {
      base = searchAnalysis.results;
    } else {
      switch (activeCategory) {
        case 'fruit':
          base = fruitList;
          break;
        case 'puja':
          base = poojaList;
          break;
        case 'flower':
          base = filteredFlowerList;
          break;
        case 'foliage':
          base = foliageList;
          break;
        case 'herbal':
          base = herbalList;
          break;
        case 'all':
        default:
          base = plants;
          break;
      }
    }

    let filtered = base;
    if (onlyInStock) {
      filtered = filtered.filter((p) => p.inStock !== false);
    }
    if (under100Only) {
      filtered = filtered.filter((p) => (p.options[0]?.price || 50) <= 100);
    }

    if (sortOrder === 'price-asc') {
      return [...filtered].sort((a, b) => (a.options[0]?.price || 50) - (b.options[0]?.price || 50));
    }
    if (sortOrder === 'price-desc') {
      return [...filtered].sort((a, b) => (b.options[0]?.price || 50) - (a.options[0]?.price || 50));
    }
    if (!searchAnalysis.isSearching) {
      return sortPlantsWithUploadsFirst(filtered);
    }
    return filtered;
  }, [
    searchAnalysis,
    activeCategory,
    fruitList,
    poojaList,
    filteredFlowerList,
    foliageList,
    herbalList,
    plants,
    onlyInStock,
    under100Only,
    sortOrder,
  ]);

  const categoryMeta: Record<
    CategoryViewKey,
    { titleBn: string; titleEn: string; descBn: string; descEn: string; icon: any; count: number }
  > = {
    all: {
      titleBn: 'সকল চারাগাছ ও কলমের সংগ্রহ',
      titleEn: 'All Available Saplings & Grafts',
      descBn: 'কালশুলি নার্সারিতে প্রস্তুত সুস্থ শিকড়ের সব চারাগাছ—ফল, ফুল, নিত্য পূজা ও শো-প্ল্যান্ট।',
      descEn: 'Authentic healthy saplings and fruit grafts nurtured in Kalsuli village.',
      icon: Layers,
      count: plants.length,
    },
    fruit: {
      titleBn: 'ছাদবাগানের ফল ও কলম',
      titleEn: 'Rooftop Fruit Grafts & Orchard Saplings',
      descBn: 'আম্রপালী আম, বারোমাসি কাগজি লেবু, থাই পেয়ারা, G9 কলা ও ডালিম—টবেও দ্রুত ফলন উপযোগী।',
      descEn: 'Authentic dwarf banana, Kagzi lemon, sweet pomegranate, and Amrapali mango grafts.',
      icon: Apple,
      count: fruitList.length,
    },
    puja: {
      titleBn: 'নিত্য দেবপূজার পবিত্র ফুল ও বেলপাতা',
      titleEn: 'Sacred Flowers & Holy Plants for Daily Puja',
      descBn: 'প্রতিদিন সকালে নিজের গাছের টাটকা রক্তজবা, নীল অপরাজিতা, কৃষ্ণ তুলসী ও ত্রিমুখী বেলপাতা নিবেদন করুন।',
      descEn: 'Fresh homegrown red hibiscus, blue aparajita, sacred tulsi, and bael leaves for daily worship.',
      icon: Flower2,
      count: poojaList.length,
    },
    flower: {
      titleBn: 'ছাদ ও বারান্দার ফুলগাছ',
      titleEn: 'Vibrant Bougainvillea, Roses & Seasonal Blooms',
      descBn: 'কাশ্মীরি গোলাপ, বহুবর্ণিল বাগানবিলাস, মরু গোলাপ (Adenium), চন্দ্রমল্লিকা ও রঙ্গন।',
      descEn: 'Drought-hardy hybrid roses, adeniums, chrysanthemums, and bougainvillea for sunny terraces.',
      icon: Sparkles,
      count: flowerList.length,
    },
    foliage: {
      titleBn: 'গাছপালা, পাম ও শো-প্ল্যান্ট',
      titleEn: 'Palms, Crotons & Low-Maintenance Foliage',
      descBn: 'লাকি ব্যাম্বু, র‍্যাবিশ পাম, বাহারি ক্রোটন, স্নেক প্ল্যান্ট ও ঝাউ গাছ—ঘরের বাতাস রাখে সতেজ।',
      descEn: 'Natural air purifiers and hardy foliage with minimal maintenance.',
      icon: TreePine,
      count: foliageList.length,
    },
    herbal: {
      titleBn: 'সুগন্ধি মসলা ও ভেষজ গাছ',
      titleEn: 'Aromatic Spices & Healing Herbal Plants',
      descBn: 'বাড়ির বাগানের জন্য সুগন্ধি দারুচিনি, এলাচ, তেজপাতা ও ভেষজ কারিপাতা চারা।',
      descEn: 'Homegrown cinnamon, cardamom, and bay leaf saplings.',
      icon: Sprout,
      count: herbalList.length,
    },
  };

  const currentMeta = categoryMeta[activeCategory];

  const FALLBACK_CATEGORY_IMAGES: Record<string, string> = {
    'ছাদবাগানের ফল ও কলম': FRUIT_IMAGE,
    'পূজার ফুল ও পবিত্র গাছ': PUJA_IMAGE,
    'ছাদ ও বারান্দার ফুল': ROOFTOP_IMAGE,
    'গাছপালা ও শো-প্ল্যান্ট': ROOFTOP_IMAGE,
    'মসলা ও ভেষজ গাছ': PUJA_IMAGE,
    'গৃহস্থ ও ঔষধি গাছ': PUJA_IMAGE,
  };

  const renderPlantCard = (
    plant: BrahmyamanPlant,
    index: number,
    layoutVariant: 'rail' | 'grid' = 'rail'
  ) => {
    const baseOption = plant.options[0] || {
      price: 50,
      labelBn: 'গ্রো ব্যাগ চারা',
      containerType: 'পলি গ্রো ব্যাগ',
    };
    const isAdded = justAddedId === plant.id;
    const isPriority = index < 6;
    const fallbackSrc = FALLBACK_CATEGORY_IMAGES[plant.category] || PUJA_IMAGE;
    const isOutOfStock = plant.inStock === false;
    const isRail = layoutVariant === 'rail';

    return (
      <article
        key={plant.id}
        className={`botanical-card group bg-white rounded-2xl border border-[#DCE6D7] hover:border-[#15803D]/55 overflow-hidden shadow-[0_2px_10px_-4px_rgba(18,38,25,0.07)] flex flex-col justify-between ${
          isRail
            ? 'w-[224px] sm:w-[254px] lg:w-[272px] shrink-0 snap-start'
            : 'min-w-0'
        }`}
      >
        {/* Clean Sunlit Botanical Specimen Image Frame */}
        <div
          onClick={() => onOpenPlantModal(plant)}
          className={`relative bg-gradient-to-b from-[#EDF4EA] to-[#F7FAF5] flex items-center justify-center overflow-hidden border-b border-[#E3ECE0] cursor-pointer ${
            isRail ? 'aspect-[4/3] p-2.5' : 'aspect-[4/3] p-2 sm:p-3'
          }`}
        >
          <img
            src={resolvePlantImageUrl(plant.image, fallbackSrc)}
            alt={plant.nameBn}
            loading={isPriority ? 'eager' : 'lazy'}
            fetchPriority={isPriority ? 'high' : 'auto'}
            decoding="async"
            className={`max-h-full max-w-full object-contain mx-auto transition-transform duration-500 ease-out group-hover:scale-[1.06] drop-shadow-2xs ${
              isOutOfStock ? 'opacity-70 grayscale-[20%]' : ''
            }`}
            referrerPolicy="no-referrer"
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              if (target.src !== fallbackSrc) {
                target.src = fallbackSrc;
              }
            }}
          />

          {/* Single Clean Status Tag (Max 1 Corner Label per Card) */}
          {isOutOfStock ? (
            <div className="absolute top-2 left-2 z-10 pointer-events-none">
              <span className="px-2 py-0.5 rounded-md bg-[#B84423] text-white text-[10px] font-semibold shadow-2xs">
                {lang === 'bn' ? 'স্টক শেষ' : 'Out of Stock'}
              </span>
            </div>
          ) : plant.badgeBn ? (
            <div className="absolute top-2 left-2 z-10 pointer-events-none">
              <span className="px-2 py-0.5 rounded-md bg-[#122619]/90 text-[#F4F7F1] text-[10px] font-semibold shadow-2xs">
                {lang === 'bn' ? plant.badgeBn : plant.badgeEn}
              </span>
            </div>
          ) : null}

          {/* Quick Share Icon Button on Photo Corner */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShareTargetPlant({
                plant,
                photoSrc: resolvePlantImageUrl(plant.image, fallbackSrc),
              });
            }}
            className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-white/95 hover:bg-[#25D366] text-[#122619] hover:text-[#0B2214] border border-[#CEDAC9] hover:border-[#25D366] shadow-xs flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
            title={
              lang === 'bn'
                ? 'ছবি ও বিবরণ WhatsApp-এ শেয়ার করুন'
                : 'Share photo & details on WhatsApp'
            }
            aria-label={
              lang === 'bn'
                ? `${plant.nameBn} ছবি শেয়ার করুন`
                : `Share ${plant.nameEn} photo`
            }
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card Body */}
        <div
          className={`flex-1 flex flex-col justify-between ${
            isRail ? 'p-3 sm:p-4' : 'p-2.5 sm:p-4'
          }`}
        >
          <div>
            {/* Unboxed Botanical Metadata + Vitality Dot */}
            <div className="flex items-center justify-between gap-1 text-[10px] sm:text-[11px] text-[#785942] font-sans-bn mb-0.5">
              <span className="truncate">{plant.category}</span>
              {!isOutOfStock && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#15803D] shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" aria-hidden="true" />
                  <span className="hidden sm:inline">{lang === 'bn' ? 'সতেজ' : 'Fresh'}</span>
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => onOpenPlantModal(plant)}
              className="text-left w-full cursor-pointer"
            >
              <h3
                className={`font-serif-bn font-bold text-[#122619] group-hover:text-[#15803D] transition-colors leading-snug line-clamp-1 ${
                  isRail ? 'text-base sm:text-[17px]' : 'text-sm sm:text-base'
                }`}
              >
                {lang === 'bn' ? plant.nameBn : plant.nameEn}
                {plant.colorBn && (
                  <span className="ml-1 text-[11px] font-sans-bn font-medium text-[#785942]">
                    ({plant.colorBn})
                  </span>
                )}
              </h3>
            </button>

            <p className="text-[11px] text-[#526356] font-sans-bn mt-0.5 truncate">
              {lang === 'bn' ? plant.nameEn : plant.nameBn}
            </p>

            <p className="hidden sm:line-clamp-2 text-xs text-[#4C6252] font-sans-bn mt-1.5 leading-relaxed">
              {lang === 'bn' ? plant.descriptionBn : plant.descriptionEn}
            </p>

            {/* Unboxed Sunlight & Watering Micro-Row */}
            <div className="mt-2 pt-2 border-t border-[#E3ECE0] grid grid-cols-2 gap-1.5 text-[10px] sm:text-[11px] font-sans-bn text-[#4C6252]">
              <div className="flex items-center gap-1 truncate">
                <Sun className="w-3 h-3 text-[#B45309] shrink-0" />
                <span className="truncate">{plant.sunlightBn}</span>
              </div>
              <div className="flex items-center gap-1 truncate">
                <Droplets className="w-3 h-3 text-[#0369A1] shrink-0" />
                <span className="truncate">{plant.wateringBn}</span>
              </div>
            </div>
          </div>

          {/* Pricing & Clear Action Pair */}
          <div className="mt-2.5 sm:mt-3 pt-2.5 border-t border-[#DCE6D7] flex items-center justify-between gap-1.5">
            <div className="min-w-0">
              <div className="text-base sm:text-lg font-bold text-[#B84423] tabular-nums font-mono-num leading-tight">
                ₹{baseOption.price}
              </div>
              <div className="text-[10px] sm:text-[11px] text-[#785942] font-sans-bn truncate max-w-[90px] sm:max-w-[120px]">
                {baseOption.labelBn || 'গ্রো ব্যাগ'}
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <a
                href={getSingleItemWhatsAppUrl(plant)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  void recordWhatsAppInquiryLog({
                    eventType: 'direct_order',
                    items: [
                      {
                        plantId: plant.id,
                        plantNameBn: plant.nameBn,
                        category: plant.category,
                        optionLabelBn: baseOption.labelBn || 'গ্রো ব্যাগ চারা',
                        unitPrice: baseOption.price || 50,
                        quantity: 1,
                        image: plant.image,
                      },
                    ],
                  });
                }}
                title={lang === 'bn' ? 'WhatsApp-এ সরাসরি অর্ডার করুন' : 'Order on WhatsApp'}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366] text-[#128C7E] hover:text-white active:scale-90 flex items-center justify-center transition-all cursor-pointer"
                aria-label={`Order ${plant.nameBn} on WhatsApp`}
              >
                <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
              </a>

              <button
                type="button"
                onClick={() => handleAddClick(plant)}
                className={`inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-semibold transition-all active:scale-95 cursor-pointer whitespace-nowrap shrink-0 ${
                  isAdded
                    ? 'bg-[#122619] text-[#A3E635] scale-[1.03]'
                    : 'bg-[#15803D] hover:bg-[#166534] text-white shadow-2xs'
                }`}
              >
                {isAdded ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'যুক্ত' : 'Added'}</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'ব্যাগে' : 'Add'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </article>
    );
  };

  return (
    <div id="catalog" className="bg-[#F4F7F1] border-t border-[#DCE6D7]">
      {/* Category Navigation Bar */}
      <div className="bg-[#EBF1E8] border-b border-[#D5DFD1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scrollbar-none" role="tablist" aria-label="Plant Categories">
            <button
              type="button"
              role="tab"
              aria-selected={activeCategory === 'all' && !searchAnalysis.isSearching}
              onClick={() => handleCategoryTabClick('all')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeCategory === 'all' && !searchAnalysis.isSearching
                  ? 'bg-[#142318] text-white shadow-xs'
                  : 'bg-white border border-[#CEDAC9] text-[#526356] hover:text-[#142318]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'সকল গাছ' : 'All'}</span>
              <span className="text-[10px] opacity-75 font-mono-num">({plants.length})</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeCategory === 'fruit' && !searchAnalysis.isSearching}
              onClick={() => handleCategoryTabClick('fruit')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeCategory === 'fruit' && !searchAnalysis.isSearching
                  ? 'bg-[#B45309] text-white shadow-xs'
                  : 'bg-white border border-[#CEDAC9] text-[#526356] hover:text-[#B45309]'
              }`}
            >
              <Apple className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'ফলের গাছ ও কলম' : 'Fruits & Grafts'}</span>
              <span className="text-[10px] opacity-75 font-mono-num">({fruitList.length})</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeCategory === 'puja' && !searchAnalysis.isSearching}
              onClick={() => handleCategoryTabClick('puja')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeCategory === 'puja' && !searchAnalysis.isSearching
                  ? 'bg-[#B34728] text-white shadow-xs'
                  : 'bg-white border border-[#CEDAC9] text-[#526356] hover:text-[#B34728]'
              }`}
            >
              <Flower2 className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'পূজার ফুল ও বেলপাতা' : 'Puja Plants'}</span>
              <span className="text-[10px] opacity-75 font-mono-num">({poojaList.length})</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeCategory === 'flower' && !searchAnalysis.isSearching}
              onClick={() => handleCategoryTabClick('flower')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeCategory === 'flower' && !searchAnalysis.isSearching
                  ? 'bg-[#1B8354] text-white shadow-xs'
                  : 'bg-white border border-[#CEDAC9] text-[#526356] hover:text-[#1B8354]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'ফুলগাছ' : 'Flowers'}</span>
              <span className="text-[10px] opacity-75 font-mono-num">({flowerList.length})</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeCategory === 'foliage' && !searchAnalysis.isSearching}
              onClick={() => handleCategoryTabClick('foliage')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeCategory === 'foliage' && !searchAnalysis.isSearching
                  ? 'bg-[#142318] text-white shadow-xs'
                  : 'bg-white border border-[#CEDAC9] text-[#526356] hover:text-[#142318]'
              }`}
            >
              <TreePine className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'শো-প্ল্যান্ট ও পাম' : 'Foliage'}</span>
              <span className="text-[10px] opacity-75 font-mono-num">({foliageList.length})</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeCategory === 'herbal' && !searchAnalysis.isSearching}
              onClick={() => handleCategoryTabClick('herbal')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeCategory === 'herbal' && !searchAnalysis.isSearching
                  ? 'bg-[#785942] text-white shadow-xs'
                  : 'bg-white border border-[#CEDAC9] text-[#526356] hover:text-[#785942]'
              }`}
            >
              <Sprout className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'মসলা ও ভেষজ' : 'Herbs'}</span>
              <span className="text-[10px] opacity-75 font-mono-num">({herbalList.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Anchor for smooth scroll */}
      <div id="catalog-content-anchor" className="scroll-mt-24" />

      {/* Main Catalog Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-7">
        {/* Catalog Inline Live Search Input + Dropdown Suggestions */}
        <div className="mb-4">
          <div className="max-w-2xl">
            <label className="block text-[11px] font-bold text-[#4C6252] uppercase tracking-wider mb-1 font-sans-bn">
              {lang === 'bn'
                ? 'ক্যাটালগে তাৎক্ষণিক খুঁজুন (টাইপ করলেই নিচে নাম দেখাবে)'
                : 'Quick Catalog Search (Live Suggestions)'}
            </label>
            <LiveSearchBox
              variant="catalog"
              plants={plants}
              lang={lang}
              value={searchQuery}
              onChange={onSearchChange}
              onSelectPlant={onOpenPlantModal}
              onAddToInquiry={onAddToInquiry}
              onSubmitSearch={() => {
                const anchor = document.getElementById('catalog-content-anchor');
                if (anchor) anchor.scrollIntoView({ behavior: 'smooth' });
              }}
              suggestionLimit={8}
            />
          </div>
        </div>

        {/* Search Status Banner (rendered right at the top when searching!) */}
        {searchAnalysis.isSearching ? (
          <div className="mb-4 p-4 sm:p-5 bg-[#E4ECE0] rounded-2xl border border-[#D5DFD1] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1B8354] font-sans-bn">
                <Search className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'তাৎক্ষণিক অনুসন্ধান ফলাফল' : 'Instant Search Results'}</span>
              </div>
              <h2 className="font-serif-bn text-xl sm:text-2xl font-bold text-[#142318] mt-0.5">
                "{searchQuery}" —{' '}
                <span className="text-[#1B8354] font-mono-num tabular-nums">
                  {displayedPlants.length}
                </span>{' '}
                {lang === 'bn' ? 'টি চারা পাওয়া গেছে' : 'saplings found'}
              </h2>
            </div>

            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#142318] hover:bg-[#233527] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'অনুসন্ধান বন্ধ করে হোম দেখুন' : 'Clear & Back to Home'}</span>
            </button>
          </div>
        ) : (
          <div className="mb-4 pb-3.5 border-b border-[#D5DFD1]">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1B8354] font-sans-bn">
                  {currentMeta.titleEn}
                </p>
                <h2 className="font-serif-bn text-xl sm:text-3xl text-[#142318] font-bold tracking-tight mt-0.5">
                  {lang === 'bn' ? currentMeta.titleBn : currentMeta.titleEn}
                </h2>
                <p className="text-xs sm:text-sm text-[#526356] mt-0.5 max-w-2xl leading-relaxed font-sans-bn">
                  {lang === 'bn' ? currentMeta.descBn : currentMeta.descEn}
                </p>
              </div>

              <div className="text-xs font-semibold text-[#785942] font-sans-bn shrink-0">
                <span className="font-mono-num font-bold text-[#142318] tabular-nums">
                  {displayedPlants.length}
                </span>{' '}
                {lang === 'bn' ? 'টি চারা প্রদর্শিত হচ্ছে' : 'saplings shown'}
              </div>
            </div>

            {activeCategory === 'flower' && (
              <div className="mt-3 pt-3 border-t border-[#DFE7DC] flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <span className="text-xs font-semibold text-[#785942] flex items-center gap-1 shrink-0 font-sans-bn">
                  <Filter className="w-3 h-3 text-[#B34728]" />
                  <span>{lang === 'bn' ? 'রং:' : 'Color:'}</span>
                </span>
                {flowerColors.map((clr) => (
                  <button
                    key={clr.id}
                    type="button"
                    onClick={() => setSelectedColorFilter(clr.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                      selectedColorFilter === clr.id
                        ? 'bg-[#142318] text-white'
                        : 'bg-white border border-[#CEDAC9] text-[#526356] hover:text-[#142318]'
                    }`}
                  >
                    {lang === 'bn' ? clr.labelBn : clr.labelEn}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Buyer Decision Toolbar: Scroll Direction Toggle + Quick Filters + Price Sort */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2.5 font-sans-bn">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar max-w-full pb-0.5">
            {/* Scroll Direction Switcher (Horizontal Rail vs Vertical Grid) */}
            <div
              role="group"
              aria-label={lang === 'bn' ? 'স্ক্রল করার ধরন' : 'Scroll direction'}
              className="inline-flex items-center p-0.5 rounded-xl border border-[#CEDAC9] bg-white shadow-2xs shrink-0"
            >
              <button
                type="button"
                onClick={() => handleChangeScrollMode('horizontal')}
                aria-pressed={scrollMode === 'horizontal'}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  scrollMode === 'horizontal'
                    ? 'bg-[#142318] text-white shadow-2xs'
                    : 'text-[#526356] hover:text-[#142318]'
                }`}
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'সাইডে স্ক্রল' : 'Horizontal'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleChangeScrollMode('vertical')}
                aria-pressed={scrollMode === 'vertical'}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  scrollMode === 'vertical'
                    ? 'bg-[#142318] text-white shadow-2xs'
                    : 'text-[#526356] hover:text-[#142318]'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'লম্বালম্বি' : 'Vertical'}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setOnlyInStock((v) => !v)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                onlyInStock
                  ? 'bg-[#1B8354] text-white border-[#1B8354]'
                  : 'bg-white text-[#526356] border-[#CEDAC9] hover:border-[#142318]'
              }`}
            >
              {lang === 'bn' ? '✓ শুধু স্টকে আছে' : '✓ In Stock Only'}
            </button>

            <button
              type="button"
              onClick={() => setUnder100Only((v) => !v)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                under100Only
                  ? 'bg-[#B34728] text-white border-[#B34728]'
                  : 'bg-white text-[#526356] border-[#CEDAC9] hover:border-[#142318]'
              }`}
            >
              {lang === 'bn' ? '₹১০০-এর মধ্যে' : 'Under ₹100'}
            </button>

            {(onlyInStock || under100Only || sortOrder !== 'default') && (
              <button
                type="button"
                onClick={() => {
                  setOnlyInStock(false);
                  setUnder100Only(false);
                  setSortOrder('default');
                }}
                className="px-2.5 py-1.5 text-xs text-[#785942] hover:text-[#142318] inline-flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
              >
                <X className="w-3 h-3" />
                <span>{lang === 'bn' ? 'রিসেট' : 'Reset'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#785942]" />
            <label htmlFor="catalog-sort" className="sr-only">
              Sort saplings
            </label>
            <select
              id="catalog-sort"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as SortOrder)}
              className="h-9 px-3 rounded-xl border border-[#CEDAC9] bg-white text-xs font-semibold text-[#142318] focus:outline-none focus:ring-2 focus:ring-[#1B8354] cursor-pointer"
            >
              <option value="default">{lang === 'bn' ? 'জনপ্রিয় ও সঠিক ক্রম' : 'Relevance'}</option>
              <option value="price-asc">{lang === 'bn' ? 'দাম: কম থেকে বেশি (₹↑)' : 'Price: Low to High'}</option>
              <option value="price-desc">{lang === 'bn' ? 'দাম: বেশি থেকে কম (₹↓)' : 'Price: High to Low'}</option>
            </select>
          </div>
        </div>

        {/* Plant Catalog Display: Horizontal Side-Scroll Rails OR Compact Vertical Grid */}
        {displayedPlants.length === 0 ? (
          <div className="py-12 text-center bg-white rounded-2xl border border-[#D5DFD1] p-6 max-w-md mx-auto">
            <p className="font-serif-bn text-xl text-[#142318] font-bold">
              {lang === 'bn' ? 'কোনো চারাগাছ পাওয়া যায়নি' : 'No matching saplings found'}
            </p>
            <p className="text-xs text-[#526356] mt-2 font-sans-bn">
              {lang === 'bn'
                ? 'ফিল্টার সরিয়ে দেখুন অথবা নিচের জনপ্রিয় বিভাগ থেকে বেছে নিন।'
                : 'Try clearing filters or choose one of the categories below.'}
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onSearchChange('');
                  setOnlyInStock(false);
                  setUnder100Only(false);
                  handleCategoryTabClick('fruit');
                }}
                className="px-3 py-1.5 rounded-xl bg-[#B45309] text-white text-xs font-semibold cursor-pointer"
              >
                ফলের কলম দেখুন
              </button>
              <button
                type="button"
                onClick={() => {
                  onSearchChange('');
                  setOnlyInStock(false);
                  setUnder100Only(false);
                  handleCategoryTabClick('puja');
                }}
                className="px-3 py-1.5 rounded-xl bg-[#B34728] text-white text-xs font-semibold cursor-pointer"
              >
                পূজার ফুল দেখুন
              </button>
              <button
                type="button"
                onClick={() => {
                  onSearchChange('');
                  setOnlyInStock(false);
                  setUnder100Only(false);
                  handleCategoryTabClick('all');
                }}
                className="px-3 py-1.5 rounded-xl bg-[#142318] text-white text-xs font-semibold cursor-pointer"
              >
                সব গাছ দেখুন
              </button>
            </div>
          </div>
        ) : scrollMode === 'horizontal' ? (
          activeCategory === 'all' &&
          !searchAnalysis.isSearching &&
          !onlyInStock &&
          !under100Only &&
          sortOrder === 'default' ? (
            <div className="space-y-7">
              {[
                {
                  key: 'fruit' as CategoryViewKey,
                  titleBn: 'ছাদবাগানের ফল ও কলম',
                  titleEn: 'Fruit Grafts & Saplings',
                  subtitleBn: 'আম, কাগজি লেবু, পেয়ারা, ডালিম',
                  accentClass: 'text-[#B45309]',
                  list: sortPlantsWithUploadsFirst(fruitList),
                },
                {
                  key: 'puja' as CategoryViewKey,
                  titleBn: 'নিত্য পূজার ফুল ও বেলপাতা',
                  titleEn: 'Daily Puja Blooms & Bael',
                  subtitleBn: 'রক্তজবা, অপরাজিতা, তুলসী ও বেলপাতা',
                  accentClass: 'text-[#B34728]',
                  list: sortPlantsWithUploadsFirst(poojaList),
                },
                {
                  key: 'flower' as CategoryViewKey,
                  titleBn: 'ছাদ ও বারান্দার ফুলগাছ',
                  titleEn: 'Terrace Roses & Blooms',
                  subtitleBn: 'গোলাপ, বাগানবিলাস, অ্যাডেনিয়াম',
                  accentClass: 'text-[#1B8354]',
                  list: sortPlantsWithUploadsFirst(flowerList),
                },
                {
                  key: 'foliage' as CategoryViewKey,
                  titleBn: 'গাছপালা, পাম ও শো-প্ল্যান্ট',
                  titleEn: 'Palms & Foliage Plants',
                  subtitleBn: 'লাকি ব্যাম্বু, র‍্যাবিশ পাম, স্নেক প্ল্যান্ট',
                  accentClass: 'text-[#142318]',
                  list: sortPlantsWithUploadsFirst(foliageList),
                },
                {
                  key: 'herbal' as CategoryViewKey,
                  titleBn: 'মসলা ও ভেষজ গাছ',
                  titleEn: 'Spices & Herbal Plants',
                  subtitleBn: 'দারুচিনি, এলাচ, তেজপাতা, কারিপাতা',
                  accentClass: 'text-[#785942]',
                  list: sortPlantsWithUploadsFirst(herbalList),
                },
              ]
                .filter((rail) => rail.list.length > 0)
                .map((rail) => (
                  <HorizontalPlantRail
                    key={rail.key}
                    railKey={`cat-${rail.key}`}
                    isVisible={isVisible}
                    title={lang === 'bn' ? rail.titleBn : rail.titleEn}
                    subtitle={lang === 'bn' ? rail.subtitleBn : undefined}
                    count={rail.list.length}
                    accentClass={rail.accentClass}
                    onViewAll={() => handleCategoryTabClick(rail.key)}
                    lang={lang}
                  >
                    {rail.list.map((plant, idx) => renderPlantCard(plant, idx, 'rail'))}
                  </HorizontalPlantRail>
                ))}
            </div>
          ) : (
            <HorizontalPlantRail
              railKey={`filtered-${activeCategory}-${searchQuery ? 'search' : 'browse'}`}
              isVisible={isVisible}
              title={
                searchAnalysis.isSearching
                  ? lang === 'bn'
                    ? `"${searchQuery}" ফলাফল`
                    : `Results for "${searchQuery}"`
                  : lang === 'bn'
                  ? currentMeta.titleBn
                  : currentMeta.titleEn
              }
              subtitle={lang === 'bn' ? 'পাশে স্ক্রল করে সব চারা দেখুন' : 'Swipe or click arrows to browse'}
              count={displayedPlants.length}
              lang={lang}
            >
              {displayedPlants.map((plant, idx) => renderPlantCard(plant, idx, 'rail'))}
            </HorizontalPlantRail>
          )
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {displayedPlants.map((plant, idx) => renderPlantCard(plant, idx, 'grid'))}
          </div>
        )}

        {/* Bottom Quick Switcher */}
        <div className="mt-12 pt-6 border-t border-[#D5DFD1] flex flex-col sm:flex-row items-center justify-between gap-4 font-sans-bn">
          <p className="text-xs text-[#526356]">
            কালশুলি, পারসোলা, খাতড়া ও সিমলাপাল জুড়ে নিরাপদ শিকড় ডেলিভারি।
          </p>

          <div className="flex items-center gap-3 flex-wrap justify-center">
            <span className="text-xs font-bold text-[#785942]">অন্য বিভাগ:</span>
            {activeCategory !== 'fruit' && (
              <button
                type="button"
                onClick={() => handleCategoryTabClick('fruit')}
                className="text-xs font-semibold text-[#B45309] hover:underline cursor-pointer"
              >
                ফলের কলম
              </button>
            )}
            {activeCategory !== 'puja' && (
              <button
                type="button"
                onClick={() => handleCategoryTabClick('puja')}
                className="text-xs font-semibold text-[#B34728] hover:underline cursor-pointer"
              >
                পূজার ফুল
              </button>
            )}
            {activeCategory !== 'flower' && (
              <button
                type="button"
                onClick={() => handleCategoryTabClick('flower')}
                className="text-xs font-semibold text-[#1B8354] hover:underline cursor-pointer"
              >
                ফুলগাছ
              </button>
            )}
            {activeCategory !== 'foliage' && (
              <button
                type="button"
                onClick={() => handleCategoryTabClick('foliage')}
                className="text-xs font-semibold text-[#142318] hover:underline cursor-pointer"
              >
                শো-প্ল্যান্ট
              </button>
            )}
            {activeCategory !== 'herbal' && (
              <button
                type="button"
                onClick={() => handleCategoryTabClick('herbal')}
                className="text-xs font-semibold text-[#785942] hover:underline cursor-pointer"
              >
                মসলা ও ভেষজ
              </button>
            )}
            {activeCategory !== 'all' && (
              <button
                type="button"
                onClick={() => handleCategoryTabClick('all')}
                className="text-xs font-bold text-[#142318] hover:underline ml-1 cursor-pointer"
              >
                সকল গাছ দেখুন ↗
              </button>
            )}
          </div>
        </div>
      </main>

      {shareTargetPlant && (
        <PlantShareModal
          plant={shareTargetPlant.plant}
          photoSrc={shareTargetPlant.photoSrc}
          lang={lang}
          onClose={() => setShareTargetPlant(null)}
        />
      )}
    </div>
  );
}
