import { useState, useMemo, useEffect } from 'react';
import {
  Search,
  MessageCircle,
  Plus,
  Check,
  Sun,
  Clock,
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
  LayoutGrid,
  Rows3,
} from 'lucide-react';
import { BrahmyamanPlant, PlantPotOption, AudienceTag } from '../types/nursery';
import { NURSERY_CONTACT, PUJA_IMAGE, FRUIT_IMAGE, ROOFTOP_IMAGE } from '../data/brahmyamanCatalog';
import { resolvePlantImageUrl } from '../utils/imageUrl';
import { PlantShareModal } from './PlantShareModal';
import { sortPlantsWithUploadsFirst } from '../utils/plantUploadSort';
import { recordWhatsAppInquiryLog } from '../utils/whatsappOrderTracker';
import { getPlantGrowthInfo } from '../utils/plantMetadata';
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
  const [viewMode, setViewMode] = useState<'grid' | 'horizontal'>(() => {
    try {
      const saved = sessionStorage.getItem('brahmyaman_catalog_view_mode');
      return saved === 'horizontal' ? 'horizontal' : 'grid';
    } catch {
      return 'grid';
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem('brahmyaman_catalog_view_mode', viewMode);
    } catch {}
  }, [viewMode]);

  void isVisible;

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
            `নমস্কার, আমি কালশুলির ভ্রাম্যমাণ নার্সারি থেকে "${plant.nameBn}" চারাটি (বর্তমানে স্টক শেষ দেখানো হচ্ছে) কবে আবার পাওয়া যাবে তা জানতে আগ্রহী।`
          )
        : encodeURIComponent(
            `নমস্কার, আমি কালশুলির ভ্রাম্যমাণ নার্সারি থেকে "${plant.nameBn}" (${defaultOpt.labelBn} - ₹${defaultOpt.price}) চারা নিতে আগ্রহী। এর প্রাপ্যতা ও বিস্তারিত জানাবেন কি?`
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
    isHorizontalRail = false,
    isPrioritySection = false
  ) => {
    const baseOption = plant.options[0] || {
      id: `${plant.id}-def`,
      price: 50,
      labelBn: 'গ্রো ব্যাগ চারা',
      labelEn: 'Grow Bag Sapling',
      containerType: 'পলি গ্রো ব্যাগ',
    };
    const growth = getPlantGrowthInfo(plant, baseOption);
    const isAdded = justAddedId === plant.id;
    const isPriority = isPrioritySection && index < 2;
    const fallbackSrc = FALLBACK_CATEGORY_IMAGES[plant.category] || PUJA_IMAGE;
    const isOutOfStock = plant.inStock === false;

    return (
      <article
        key={plant.id}
        className={`botanical-card group bg-white rounded-2xl border border-[#DCE6D7] hover:border-[#15803D]/55 overflow-hidden shadow-[0_2px_10px_-4px_rgba(18,38,25,0.08)] flex flex-col justify-between min-w-0 ${
          isHorizontalRail
            ? 'shrink-0 w-[68vw] sm:w-[270px] md:w-[290px] snap-start'
            : ''
        }`}
      >
        {/* Clean Sunlit Botanical Specimen Image Frame */}
        <div
          onClick={() => onOpenPlantModal(plant)}
          className="relative aspect-[4/3] p-2 sm:p-3 bg-gradient-to-b from-[#EDF4EA] to-[#F7FAF5] flex items-center justify-center overflow-hidden border-b border-[#E3ECE0] cursor-pointer"
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

          {/* Single Clean Status Tag */}
          {isOutOfStock ? (
            <div className="absolute top-2 left-2 z-10 pointer-events-none">
              <span className="px-2 py-0.5 rounded-md bg-[#B84423] text-white text-xs sm:text-xs font-semibold shadow-2xs">
                {lang === 'bn' ? 'স্টক শেষ' : 'Out of Stock'}
              </span>
            </div>
          ) : plant.badgeBn ? (
            <div className="absolute top-2 left-2 z-10 pointer-events-none max-w-[75%]">
              <span className="inline-block truncate max-w-full px-2 py-0.5 rounded-md bg-[#122619]/90 text-[#F4F7F1] text-xs sm:text-xs font-semibold shadow-2xs">
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

        {/* Card Body — Bigger, Mobile-Friendly Readable Typography */}
        <div className="flex-1 flex flex-col justify-between p-3 sm:p-4 gap-2.5">
          <div>
            <div className="flex items-center justify-between gap-1 text-xs sm:text-xs text-[#785942] font-sans-bn mb-1">
              <span className="truncate font-medium">{plant.category}</span>
              {!isOutOfStock && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#15803D] shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" aria-hidden="true" />
                  <span>{lang === 'bn' ? 'সতেজ' : 'Fresh'}</span>
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => onOpenPlantModal(plant)}
              className="text-left w-full cursor-pointer"
            >
              <h3 className="font-serif-bn font-bold text-[#122619] group-hover:text-[#15803D] transition-colors leading-snug text-[15px] sm:text-[18px] line-clamp-2">
                {lang === 'bn' ? plant.nameBn : plant.nameEn}
              </h3>
            </button>

            <p className="text-xs sm:text-xs text-[#526356] font-sans-bn mt-0.5 truncate">
              {lang === 'bn' ? plant.nameEn : plant.nameBn}
              {plant.colorBn ? ` · ${plant.colorBn}` : ''}
            </p>

            {/* Unique Description Visible on Mobile & Desktop */}
            <p className="line-clamp-2 text-[12px] sm:text-[13px] text-[#3E5344] font-sans-bn mt-1.5 leading-snug">
              {lang === 'bn' ? plant.descriptionBn : plant.descriptionEn}
            </p>

            {/* Size/Age + Days-to-Fruit/Bloom Metadata */}
            <div className="mt-2.5 pt-2 border-t border-[#E3ECE0] space-y-1 text-xs sm:text-xs font-sans-bn">
              <div className="flex items-center gap-1.5 text-[#142318] font-semibold">
                <Sprout className="w-3.5 h-3.5 text-[#15803D] shrink-0" />
                <span className="truncate">
                  {lang === 'bn' ? growth.sizeAgeBn : growth.sizeAgeEn}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[#B45309] font-semibold">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">
                  {lang === 'bn' ? growth.harvestOrBloomBn : growth.harvestOrBloomEn}
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-[#4C6252]">
                <Sun className="w-3.5 h-3.5 text-[#B45309] shrink-0" />
                <span className="truncate">{plant.sunlightBn}</span>
              </div>
            </div>
          </div>

          {/* Pricing + Large WhatsApp Button & Cart Add Action */}
          <div className="pt-2.5 border-t border-[#DCE6D7] space-y-2">
            <div className="flex items-baseline justify-between gap-2 flex-wrap">
              <div className="text-lg sm:text-xl font-bold text-[#B84423] tabular-nums font-mono-num leading-none">
                ₹{baseOption.price}
              </div>
              <div className="text-xs sm:text-xs font-semibold text-[#526857] font-sans-bn truncate max-w-full">
                {lang === 'bn' ? baseOption.labelBn : baseOption.labelEn}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch gap-1.5">
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
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#15803D] hover:bg-[#166534] active:scale-[0.98] text-white text-xs sm:text-[13px] font-bold shadow-xs transition-all cursor-pointer"
                aria-label={`Order ${plant.nameBn} on WhatsApp`}
              >
                <MessageCircle className="w-4 h-4 fill-current shrink-0" />
                <span className="whitespace-nowrap">
                  {lang === 'bn' ? 'WhatsApp অর্ডার' : 'WhatsApp Order'}
                </span>
              </a>

              <button
                type="button"
                onClick={() => handleAddClick(plant)}
                className={`inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 cursor-pointer whitespace-nowrap shrink-0 ${
                  isAdded
                    ? 'bg-[#122619] text-[#A3E635] border-[#122619]'
                    : 'bg-[#F4F7F1] hover:bg-[#E4ECE0] text-[#122619] border-[#CEDAC9]'
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
                    <span>{lang === 'bn' ? 'ব্যাগ' : 'Cart'}</span>
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
              <span className="text-xs opacity-75 font-mono-num">({plants.length})</span>
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
              <span className="text-xs opacity-75 font-mono-num">({fruitList.length})</span>
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
              <span className="text-xs opacity-75 font-mono-num">({poojaList.length})</span>
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
              <span className="text-xs opacity-75 font-mono-num">({flowerList.length})</span>
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
              <span className="text-xs opacity-75 font-mono-num">({foliageList.length})</span>
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
              <span className="text-xs opacity-75 font-mono-num">({herbalList.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Anchor for smooth scroll */}
      <div id="catalog-content-anchor" className="scroll-mt-24" />

      {/* Main Catalog Area (Single Header Search kept — no duplicate inline search here) */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-7">

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
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1B8354] font-sans-bn">
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

        {/* Buyer Decision Toolbar: Quick Filters + Price Sort */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2.5 font-sans-bn">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar max-w-full pb-0.5">
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

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {/* View Mode Toggle: 2-Col Grid vs Horizontal Scrolling Line */}
            <div
              role="group"
              aria-label={lang === 'bn' ? 'তালিকা দেখার ধরন' : 'Catalog layout'}
              className="inline-flex items-center p-0.5 rounded-xl border border-[#CEDAC9] bg-white shadow-2xs"
            >
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                aria-pressed={viewMode === 'grid'}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  viewMode === 'grid'
                    ? 'bg-[#122619] text-white'
                    : 'text-[#526356] hover:text-[#122619]'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'গ্রিড' : 'Grid'}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('horizontal')}
                aria-pressed={viewMode === 'horizontal'}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                  viewMode === 'horizontal'
                    ? 'bg-[#15803D] text-white'
                    : 'text-[#526356] hover:text-[#122619]'
                }`}
              >
                <Rows3 className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'হরিজন্টাল লাইন' : 'Horizontal'}</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#785942]" />
              <label htmlFor="catalog-sort" className="sr-only">
                Sort saplings
              </label>
              <select
                id="catalog-sort"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                className="h-9 px-3 rounded-xl border border-[#CEDAC9] bg-white text-xs font-semibold text-[#142318] focus:outline-2 focus:outline-[#1B8354] focus:outline-offset-1 focus:ring-2 focus:ring-[#1B8354] cursor-pointer"
              >
                <option value="default">{lang === 'bn' ? 'জনপ্রিয় ও সঠিক ক্রম' : 'Relevance'}</option>
                <option value="price-asc">{lang === 'bn' ? 'দাম: কম থেকে বেশি (₹↑)' : 'Price: Low to High'}</option>
                <option value="price-desc">{lang === 'bn' ? 'দাম: বেশি থেকে কম (₹↓)' : 'Price: High to Low'}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Plant Catalog Display: Responsive 2-Col Mobile / 3-4 Col Desktop Grids */}
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
        ) : activeCategory === 'all' &&
          !searchAnalysis.isSearching &&
          !onlyInStock &&
          !under100Only &&
          sortOrder === 'default' ? (
          <div className="space-y-8">
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
                subtitleBn: 'লাকি ব্যাম্বু, র‍্যাফিস পাম, স্নেক প্ল্যান্ট',
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
              .filter((section) => section.list.length > 0)
              .map((section, sectionIdx) => (
                <section key={section.key} className="space-y-3">
                  <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-[#DCE6D7]">
                    <div className="min-w-0 flex items-baseline gap-2 flex-wrap">
                      <h3 className={`font-serif-bn text-lg sm:text-2xl font-bold ${section.accentClass}`}>
                        {lang === 'bn' ? section.titleBn : section.titleEn}
                      </h3>
                      <span className="text-xs font-mono-num font-semibold text-[#785942] tabular-nums">
                        ({section.list.length})
                      </span>
                      <span className="hidden md:inline text-xs text-[#4C6252] font-sans-bn">
                        · {section.subtitleBn}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {viewMode === 'horizontal' && (
                        <span className="hidden sm:inline text-xs font-medium text-[#785942] font-sans-bn">
                          {lang === 'bn' ? '← ডানে স্লাইড করুন →' : '← Slide →'}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleCategoryTabClick(section.key)}
                        className="px-3 py-1.5 rounded-xl bg-white border border-[#CEDAC9] hover:border-[#15803D] text-xs font-bold text-[#15803D] active:scale-95 transition-all cursor-pointer whitespace-nowrap shrink-0"
                      >
                        {lang === 'bn' ? 'সব দেখুন →' : 'See all →'}
                      </button>
                    </div>
                  </div>

                  {viewMode === 'horizontal' ? (
                    <div className="flex gap-3 sm:gap-5 overflow-x-auto snap-x snap-mandatory pb-3 scrollbar-thin">
                      {section.list.map((plant, idx) => renderPlantCard(plant, idx, true, sectionIdx === 0))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                      {section.list.map((plant, idx) => renderPlantCard(plant, idx, false, sectionIdx === 0))}
                    </div>
                  )}
                </section>
              ))}
          </div>
        ) : viewMode === 'horizontal' ? (
          <div className="flex gap-3 sm:gap-5 overflow-x-auto snap-x snap-mandatory pb-3 scrollbar-thin">
            {displayedPlants.map((plant, idx) => renderPlantCard(plant, idx, true, true))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {displayedPlants.map((plant, idx) => renderPlantCard(plant, idx, false, true))}
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
