import { useState, useMemo, useEffect, useLayoutEffect, useRef, PointerEvent as ReactPointerEvent } from 'react';
import {
  ArrowLeft,
  MessageCircle,
  Phone,
  Check,
  Plus,
  Sun,
  Droplets,
  Sprout,
  ShieldCheck,
  Share2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Sparkles,
  MapPin,
  Camera,
  Mic,
  Truck,
  ZoomIn,
  RotateCcw,
  Maximize2,
  X,
} from 'lucide-react';
import { BrahmyamanPlant, PlantPotOption } from '../types/nursery';
import { NURSERY_CONTACT, PUJA_IMAGE } from '../data/brahmyamanCatalog';
import { resolvePlantImageUrl } from '../utils/imageUrl';
import { PlantShareModal } from './PlantShareModal';
import { recordWhatsAppInquiryLog } from '../utils/whatsappOrderTracker';
import {
  loadLocalCustomerReviews,
  submitCustomerReview,
} from '../utils/customerReviewsStorage';
import type { CustomerReviewItem } from '../types/nursery';

interface PlantDetailWindowProps {
  plant: BrahmyamanPlant;
  allPlants: BrahmyamanPlant[];
  lang: 'bn' | 'en';
  onBack: () => void;
  onSelectPlant: (plant: BrahmyamanPlant) => void;
  onAddToInquiry: (plant: BrahmyamanPlant, option: PlantPotOption) => void;
  onOpenInquiryBag: () => void;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.5;

export function PlantDetailWindow({
  plant,
  allPlants,
  lang,
  onBack,
  onSelectPlant,
  onAddToInquiry,
  onOpenInquiryBag,
}: PlantDetailWindowProps) {
  const [selectedOption, setSelectedOption] = useState<PlantPotOption>(
    plant.options[0] || {
      id: 'opt-def',
      labelBn: 'পলি গ্রো-ব্যাগ চারা',
      labelEn: 'Polybag Sapling',
      price: 50,
      containerType: 'পলি গ্রো ব্যাগ',
    }
  );
  const [isAdded, setIsAdded] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedGalleryIdx, setSelectedGalleryIdx] = useState(0);

  // Photo Zoom-In / Zoom-Out & Pan State
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const panStartRef = useRef<{ x: number; y: number; originX: number; originY: number } | null>(null);
  const didDragRef = useRef(false);

  // Multi-pointer touch pinch & wheel zoom refs
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const initialPinchDistRef = useRef<number | null>(null);
  const initialScaleRef = useRef<number>(1);

  // Expanded Related Suggestions State
  const [showAllRelated, setShowAllRelated] = useState(false);
  const [justAddedRelId, setJustAddedRelId] = useState<string | null>(null);

  // Customer Reviews & Garden Photos for this plant
  const [allReviews, setAllReviews] = useState<CustomerReviewItem[]>(() =>
    loadLocalCustomerReviews()
  );
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [revName, setRevName] = useState('');
  const [revLocation, setRevLocation] = useState('');
  const [revComment, setRevComment] = useState('');
  const [revPhotoUrl, setRevPhotoUrl] = useState('');
  const [revSubmittedMsg, setRevSubmittedMsg] = useState(false);

  useEffect(() => {
    const sync = () => setAllReviews(loadLocalCustomerReviews());
    window.addEventListener('brahmyaman-reviews-updated', sync);
    return () => window.removeEventListener('brahmyaman-reviews-updated', sync);
  }, []);

  const plantMatchingReviews = useMemo(() => {
    const approved = allReviews.filter((r) => r.status === 'approved');
    const exact = approved.filter(
      (r) =>
        r.plantId === plant.id ||
        (r.plantNameBn && r.plantNameBn.includes(plant.nameBn))
    );
    if (exact.length >= 2) return exact.slice(0, 4);
    const others = approved.filter((r) => !exact.some((e) => e.id === r.id));
    return [...exact, ...others].slice(0, 3);
  }, [allReviews, plant.id, plant.nameBn]);

  // Gallery of up to 3 images (preserves backward compatibility with plant.image)
  const plantImages = useMemo(() => {
    if (Array.isArray(plant.images) && plant.images.length > 0) {
      return plant.images.filter(Boolean);
    }
    return [plant.image || ''];
  }, [plant.images, plant.image]);

  const activePhotoSrc = useMemo(
    () => resolvePlantImageUrl(plantImages[selectedGalleryIdx] || plant.image, PUJA_IMAGE),
    [plantImages, selectedGalleryIdx, plant.image]
  );

  // Reset scroll instantaneously before paint, plus zoom, gallery slot, and options whenever selected plant changes
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [plant.id]);

  useEffect(() => {
    setSelectedGalleryIdx(0);
    setZoomScale(1);
    setPanOffset({ x: 0, y: 0 });
    setIsLightboxOpen(false);
    setIsShareModalOpen(false);
    setShowAllRelated(false);
    setSelectedOption(
      plant.options[0] || {
        id: 'opt-def',
        labelBn: 'পলি গ্রো-ব্যাগ চারা',
        labelEn: 'Polybag Sapling',
        price: 50,
        containerType: 'পলি গ্রো ব্যাগ',
      }
    );
    setIsAdded(false);
  }, [plant.id]);

  // Reset zoom & pan cleanly whenever switching gallery photo slot
  useEffect(() => {
    setZoomScale(1);
    setPanOffset({ x: 0, y: 0 });
  }, [selectedGalleryIdx]);

  // Keyboard Escape handling: closes share modal -> lightbox -> resets zoom -> returns to catalog
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (isShareModalOpen) {
        setIsShareModalOpen(false);
      } else if (isLightboxOpen) {
        setIsLightboxOpen(false);
      } else if (zoomScale > 1) {
        setZoomScale(1);
        setPanOffset({ x: 0, y: 0 });
      } else {
        onBack();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isShareModalOpen, isLightboxOpen, zoomScale, onBack]);

  const applyZoom = (nextScale: number) => {
    const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(nextScale.toFixed(2))));
    setZoomScale(clamped);
    if (clamped <= 1) {
      setPanOffset({ x: 0, y: 0 });
    }
  };

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointersRef.current.size === 2) {
      const pts = Array.from(pointersRef.current.values());
      initialPinchDistRef.current = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      initialScaleRef.current = zoomScale;
    } else if (pointersRef.current.size === 1 && zoomScale > 1) {
      didDragRef.current = false;
      setIsPanning(true);
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        originX: panOffset.x,
        originY: panOffset.y,
      };
    }
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (pointersRef.current.has(e.pointerId)) {
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    if (pointersRef.current.size === 2 && initialPinchDistRef.current !== null) {
      const pts = Array.from(pointersRef.current.values());
      const currentDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const factor = currentDist / initialPinchDistRef.current;
      const newScale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, initialScaleRef.current * factor));
      setZoomScale(Number(newScale.toFixed(2)));
      didDragRef.current = true;
      return;
    }

    if (isPanning && panStartRef.current && zoomScale > 1 && pointersRef.current.size === 1) {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        didDragRef.current = true;
      }
      const maxPan = (zoomScale - 1) * 180;
      setPanOffset({
        x: Math.max(-maxPan, Math.min(maxPan, panStartRef.current.originX + dx)),
        y: Math.max(-maxPan, Math.min(maxPan, panStartRef.current.originY + dy)),
      });
    }
  };

  const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) {
      initialPinchDistRef.current = null;
    }
    if (pointersRef.current.size === 0) {
      setIsPanning(false);
      panStartRef.current = null;
    }
  };

  // Standard Browser Touch Event handlers for pinch-to-zoom and pan
  const touchStartDistRef = useRef<number | null>(null);
  const touchStartScaleRef = useRef<number>(1);
  const touchPanStartRef = useRef<{ x: number; y: number; originX: number; originY: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDistRef.current = dist;
      touchStartScaleRef.current = zoomScale;
    } else if (e.touches.length === 1 && zoomScale > 1) {
      touchPanStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        originX: panOffset.x,
        originY: panOffset.y,
      };
      setIsPanning(true);
      didDragRef.current = false;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && touchStartDistRef.current !== null) {
      e.preventDefault();
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = currentDist / touchStartDistRef.current;
      const newScale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, touchStartScaleRef.current * factor));
      setZoomScale(Number(newScale.toFixed(2)));
      didDragRef.current = true;
      return;
    }

    if (e.touches.length === 1 && isPanning && touchPanStartRef.current && zoomScale > 1) {
      const dx = e.touches[0].clientX - touchPanStartRef.current.x;
      const dy = e.touches[0].clientY - touchPanStartRef.current.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        didDragRef.current = true;
      }
      const maxPan = (zoomScale - 1) * 200;
      setPanOffset({
        x: Math.max(-maxPan, Math.min(maxPan, touchPanStartRef.current.originX + dx)),
        y: Math.max(-maxPan, Math.min(maxPan, touchPanStartRef.current.originY + dy)),
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length < 2) {
      touchStartDistRef.current = null;
    }
    if (e.touches.length === 0) {
      setIsPanning(false);
      touchPanStartRef.current = null;
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.25 : -0.25;
    const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoomScale + delta));
    setZoomScale(Number(next.toFixed(2)));
    if (next <= 1) setPanOffset({ x: 0, y: 0 });
  };

  const handleImageClick = () => {
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }
    if (zoomScale === 1) {
      applyZoom(2);
    } else {
      applyZoom(1);
    }
  };

  const handleAdd = () => {
    onAddToInquiry(plant, selectedOption);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const whatsappOrderUrl = useMemo(() => {
    const msg =
      plant.inStock === false
        ? encodeURIComponent(
            `নমস্কার ব্রাহ্ম্যমাণ নার্সারি (কালশুলি, বাঁকুড়া), আমি "${plant.nameBn}" (${selectedOption.labelBn} - ₹${selectedOption.price}) চারাটি (বর্তমানে স্টক শেষ দেখানো হচ্ছে) কবে আবার পাওয়া যাবে তা জানতে আগ্রহী।`
          )
        : encodeURIComponent(
            `নমস্কার ব্রাহ্ম্যমাণ নার্সারি (কালশুলি, বাঁকুড়া), আমি "${plant.nameBn}" (${selectedOption.labelBn} - ₹${selectedOption.price}) চারা নিতে আগ্রহী। এর প্রাপ্যতা ও ডেলিভারি সম্পর্কে জানাবেন কি?`
          );
    return `https://wa.me/${NURSERY_CONTACT.phoneRaw}?text=${msg}`;
  }, [plant, selectedOption]);

  // Content-wise similarity scorer: prioritizes same category, shared audience tags, sunlight, color & price proximity
  const rankedRelatedPlants = useMemo(() => {
    const baseAudience = new Set(Array.isArray(plant.audience) ? plant.audience : []);
    const basePrice = plant.options[0]?.price || 80;
    const baseSun = (plant.sunlightBn || '').trim();
    const baseColor = (plant.colorBn || '').trim();

    return allPlants
      .filter((p) => p.id !== plant.id && p.status !== 'deleted')
      .map((candidate) => {
        let score = 0;
        if (candidate.category === plant.category) score += 12;

        const candAudience = Array.isArray(candidate.audience) ? candidate.audience : [];
        let sharedAudienceCount = 0;
        for (const tag of candAudience) {
          if (baseAudience.has(tag)) sharedAudienceCount += 1;
        }
        score += sharedAudienceCount * 4;

        if (baseSun && candidate.sunlightBn && candidate.sunlightBn.trim() === baseSun) {
          score += 2;
        }
        if (baseColor && candidate.colorBn && candidate.colorBn.trim() === baseColor) {
          score += 2;
        }

        const candPrice = candidate.options[0]?.price || 80;
        if (Math.abs(candPrice - basePrice) <= 60) {
          score += 1;
        }

        if (candidate.inStock !== false) {
          score += 0.5;
        }

        return {
          plant: candidate,
          score,
          sameCategory: candidate.category === plant.category,
        };
      })
      .filter((entry) => entry.score >= 3)
      .sort((a, b) => b.score - a.score)
      .slice(0, 24);
  }, [allPlants, plant]);

  const visibleRelatedPlants = showAllRelated
    ? rankedRelatedPlants
    : rankedRelatedPlants.slice(0, 12);

  // Next and Previous Plant in catalog
  const currentIndex = allPlants.findIndex((p) => p.id === plant.id);
  const prevPlant = currentIndex > 0 ? allPlants[currentIndex - 1] : null;
  const nextPlant = currentIndex < allPlants.length - 1 ? allPlants[currentIndex + 1] : null;

  return (
    <div className="min-h-screen bg-[#F3F6F1] text-[#142318] pb-24">
      {/* ------------------------------------------------------------- */}
      {/* ALWAYS-VISIBLE SUB-HEADER BACK BAR (Never hides behind Header) */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-[#EBF1E8] border-b border-[#D5DFD1]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#142318] hover:bg-[#1B8354] text-white text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer shrink-0 whitespace-nowrap"
              aria-label="Back to Plant Catalog"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              <span>{lang === 'bn' ? 'ফিরে যান (ক্যাটালগ)' : 'Back to Catalog'}</span>
            </button>

            {/* Clean Typographic Breadcrumb */}
            <div className="hidden md:flex items-center gap-2 text-xs text-[#4C6252] font-sans-bn truncate">
              <button
                type="button"
                onClick={onBack}
                className="hover:text-[#142318] hover:underline cursor-pointer"
              >
                ক্যাটালগ
              </button>
              <span aria-hidden="true">/</span>
              <span className="font-semibold text-[#1B8354] truncate">{plant.category}</span>
              <span aria-hidden="true">/</span>
              <span className="text-[#142318] font-bold truncate max-w-[220px]">{plant.nameBn}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              title="ছবি ও বিস্তারিত WhatsApp-এ শেয়ার করুন"
              className="px-3 py-2 rounded-xl border border-[#CEDAC9] bg-white text-[#142318] hover:border-[#25D366] hover:bg-[#25D366]/10 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Share2 className="w-3.5 h-3.5 text-[#1B8354]" />
              <span className="hidden sm:inline">{lang === 'bn' ? 'শেয়ার' : 'Share'}</span>
            </button>

            <a
              href={`tel:${NURSERY_CONTACT.phone}`}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#CEDAC9] bg-white text-xs font-medium text-[#142318] hover:bg-[#EBF1E8]"
            >
              <Phone className="w-3.5 h-3.5 text-[#1B8354]" />
              <span className="font-mono-num">{NURSERY_CONTACT.phone}</span>
            </a>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MAIN DEDICATED ITEM WINDOW CONTAINER                           */}
      {/* ------------------------------------------------------------- */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* ========================================================= */}
          {/* LEFT WINDOW PANE: ZOOMABLE PHOTO GALLERY (DESKTOP STICKY) */}
          {/* ========================================================= */}
          <div className="lg:col-span-6 lg:sticky lg:top-24 space-y-4">
            <div className="bg-white rounded-3xl border border-[#D5DFD1] p-4 sm:p-6 shadow-sm flex flex-col items-center justify-center relative">
              {/* Top Row: Category context + Stock */}
              <div className="w-full flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-semibold text-[#526857] font-sans-bn">
                  {plant.badgeBn ? (lang === 'bn' ? plant.badgeBn : plant.badgeEn) : plant.category}
                </span>

                <span
                  className={`px-2.5 py-0.5 rounded-md text-xs font-semibold ${
                    plant.inStock !== false
                      ? 'bg-[#1B8354]/12 text-[#1B8354]'
                      : 'bg-[#B34728] text-white'
                  }`}
                >
                  {plant.inStock !== false
                    ? lang === 'bn'
                      ? 'স্টকে আছে'
                      : 'In Stock'
                    : lang === 'bn'
                    ? 'স্টক শেষ · জিজ্ঞাসা করুন'
                    : 'Out of Stock'}
                </span>
              </div>

              {/* Interactive Zoomable Image Showcase */}
              <div
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchEnd}
                onClick={handleImageClick}
                className={`w-full aspect-[4/3] sm:aspect-square max-h-[460px] bg-[#EBF1E8] rounded-2xl flex items-center justify-center p-3 sm:p-5 relative border border-[#D5DFD1] overflow-hidden select-none touch-none ${
                  zoomScale > 1
                    ? isPanning
                      ? 'cursor-grabbing'
                      : 'cursor-grab'
                    : 'cursor-zoom-in'
                }`}
                title={
                  zoomScale > 1
                    ? 'টেনে ছবি সরিয়ে দেখুন অথবা ক্লিক করে রিসেট করুন'
                    : 'ক্লিক বা "+" বোতাম চেপে জুম ইন করুন'
                }
              >
                <img
                  src={activePhotoSrc}
                  alt={`${plant.nameBn} - ছবি ${selectedGalleryIdx + 1}`}
                  draggable={false}
                  style={{
                    transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomScale})`,
                    transition: isPanning ? 'none' : 'transform 220ms cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                  className="max-h-full max-w-full object-contain mx-auto drop-shadow-md pointer-events-none"
                  referrerPolicy="no-referrer"
                  loading={selectedGalleryIdx === 0 ? 'eager' : 'lazy'}
                  fetchPriority={selectedGalleryIdx === 0 ? 'high' : 'auto'}
                  decoding="async"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    if (target.src !== PUJA_IMAGE) {
                      target.src = PUJA_IMAGE;
                    }
                  }}
                />

                {/* Left/Right Navigation Chevrons when multiple photos exist */}
                {plantImages.length > 1 && zoomScale === 1 && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedGalleryIdx((prev) =>
                          prev > 0 ? prev - 1 : plantImages.length - 1
                        );
                      }}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/95 hover:bg-white text-[#142318] shadow-md flex items-center justify-center transition-opacity cursor-pointer"
                      aria-label="Previous photo"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedGalleryIdx((prev) =>
                          prev < plantImages.length - 1 ? prev + 1 : 0
                        );
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/95 hover:bg-white text-[#142318] shadow-md flex items-center justify-center transition-opacity cursor-pointer"
                      aria-label="Next photo"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}

                {/* Direct On-Photo Share Overlay Button */}
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsShareModalOpen(true);
                  }}
                  className="absolute top-2.5 right-2.5 z-20 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/95 hover:bg-[#25D366] text-[#142318] hover:text-[#0B2214] border border-[#CEDAC9] hover:border-[#25D366] shadow-md text-xs font-bold font-sans-bn cursor-pointer transition-colors"
                  aria-label={lang === 'bn' ? 'ছবি ও তথ্য WhatsApp-এ শেয়ার করুন' : 'Share photo & details'}
                  title={lang === 'bn' ? 'ছবি ও বিস্তারিত WhatsApp-এ শেয়ার করুন' : 'Share photo & details on WhatsApp'}
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'ছবি শেয়ার' : 'Share'}</span>
                </button>

                {/* Helper hint badge when zoomed */}
                {zoomScale > 1 && (
                  <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-[#142318]/85 text-white text-[11px] font-sans-bn pointer-events-none">
                    আঙুল বা মাউস দিয়ে টেনে চারপাশ দেখুন
                  </div>
                )}
              </div>

              {/* Dedicated Natural Touch Zoom & Reset Bar */}
              <div className="w-full mt-3 flex flex-wrap items-center justify-between gap-2 bg-[#F3F6F1] border border-[#D5DFD1] rounded-xl px-3 py-2 font-sans-bn">
                <div className="flex items-center gap-2 text-xs text-[#526857]">
                  <ZoomIn className="w-4 h-4 text-[#1B8354]" />
                  <span>দুটি আঙুলে জুম করুন (Pinch) অথবা ক্লিক করে টগল করুন</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="min-w-[48px] text-center text-xs font-bold font-mono-num tabular-nums text-[#142318]">
                    {Math.round(zoomScale * 100)}%
                  </span>

                  {zoomScale > 1 && (
                    <button
                      type="button"
                      onClick={() => applyZoom(1)}
                      className="px-2.5 h-8 rounded-lg bg-white border border-[#CEDAC9] hover:border-[#142318] text-xs font-semibold text-[#142318] inline-flex items-center gap-1 cursor-pointer transition-colors"
                      title="স্বাভাবিক আকারে ফেরان"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>রিসেট</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsLightboxOpen(true)}
                    className="px-3 h-8 rounded-lg bg-white border border-[#CEDAC9] hover:bg-[#142318] hover:text-white text-xs font-semibold text-[#142318] inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>ফুলস্ক্রিন</span>
                  </button>
                </div>
              </div>

              {/* Multi-Photo Gallery Selector (Loads 2nd and 3rd photos only when clicked/viewed) */}
              {plantImages.length > 1 && (
                <div className="w-full grid grid-cols-3 gap-2 pt-3">
                  {plantImages.map((imgUrl, idx) => {
                    const isSelected = selectedGalleryIdx === idx;
                    const slotLabels = [
                      lang === 'bn' ? '১. মূল চারা' : '1. Main Plant',
                      lang === 'bn' ? '২. পাতা / ফুল' : '2. Foliage / Flower',
                      lang === 'bn' ? '৩. টব / শিকড়' : '3. Root-ball / Pot',
                    ];
                    return (
                      <button
                        key={`thumb-${idx}`}
                        type="button"
                        onClick={() => setSelectedGalleryIdx(idx)}
                        className={`p-1.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                          isSelected
                            ? 'border-[#1B8354] bg-[#1B8354]/10 shadow-2xs ring-1 ring-[#1B8354]'
                            : 'border-[#D5DFD1] bg-[#F3F6F1] hover:bg-white'
                        }`}
                      >
                        <div className="w-9 h-9 rounded-lg bg-white overflow-hidden shrink-0 border border-[#D5DFD1] flex items-center justify-center">
                          <img
                            src={resolvePlantImageUrl(imgUrl, PUJA_IMAGE)}
                            alt=""
                            className="w-full h-full object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                        </div>
                        <span className="text-[10px] font-bold text-[#142318] font-sans-bn truncate">
                          {slotLabels[idx] || `ছবি ${idx + 1}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Image Footer Info */}
              <div className="w-full mt-3 pt-3 border-t border-[#DFE7DC] flex items-center justify-between text-xs text-[#526857] font-sans-bn">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#B34728]" />
                  <span>কালশুলি নার্সারিতে প্রস্তুত খাঁটি চারা</span>
                </div>
                <div className="flex items-center gap-1 text-[#1B8354] font-semibold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>সুস্থ শিকড়যুক্ত</span>
                </div>
              </div>
            </div>

            {/* Quick Next/Previous Plant Navigation */}
            <div className="flex items-center justify-between gap-3 pt-1">
              {prevPlant ? (
                <button
                  type="button"
                  onClick={() => onSelectPlant(prevPlant)}
                  className="flex-1 inline-flex items-center gap-1.5 p-3 rounded-xl bg-white border border-[#CEDAC9] hover:border-[#142318] text-xs font-semibold text-[#142318] transition-colors cursor-pointer truncate"
                >
                  <ChevronLeft className="w-4 h-4 shrink-0" />
                  <span className="truncate">আগের চারা: {prevPlant.nameBn}</span>
                </button>
              ) : (
                <div className="flex-1" />
              )}

              {nextPlant ? (
                <button
                  type="button"
                  onClick={() => onSelectPlant(nextPlant)}
                  className="flex-1 inline-flex items-center justify-end gap-1.5 p-3 rounded-xl bg-white border border-[#CEDAC9] hover:border-[#142318] text-xs font-semibold text-[#142318] transition-colors cursor-pointer truncate"
                >
                  <span className="truncate">পরের চারা: {nextPlant.nameBn}</span>
                  <ChevronRight className="w-4 h-4 shrink-0" />
                </button>
              ) : (
                <div className="flex-1" />
              )}
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT WINDOW PANE: DETAILS, SPECIFICATIONS & ACTIONS       */}
          {/* ========================================================= */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white rounded-3xl border border-[#D5DFD1] p-6 sm:p-8 shadow-sm space-y-6">
              {/* Category & Title */}
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#526857] mb-1.5 font-sans-bn flex-wrap">
                  <span>{plant.category}</span>
                  <span aria-hidden="true">·</span>
                  <span className="italic font-mono font-normal text-[#4C6252]">
                    {plant.botanicalName}
                  </span>
                </div>

                <div className="flex items-baseline gap-2.5 flex-wrap">
                  <h1 className="font-serif-bn text-2xl sm:text-4xl font-bold text-[#142318] leading-tight">
                    {plant.nameBn}
                  </h1>
                  {plant.colorBn && (
                    <span className="text-xs font-semibold text-[#526857] font-sans-bn">
                      ({plant.colorBn})
                    </span>
                  )}
                </div>

                <p className="text-sm font-sans-bn text-[#526857] mt-1 font-medium">
                  {plant.nameEn}
                </p>
              </div>

              {/* Price Banner */}
              <div className="p-4 rounded-2xl bg-[#F3F6F1] border border-[#D5DFD1] flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-[#526857] font-semibold block">
                    নির্ধারিত নার্সারি মূল্য:
                  </span>
                  <div className="text-2xl sm:text-3xl font-bold text-[#B34728] font-mono-num tabular-nums">
                    ₹{selectedOption.price}
                  </div>
                </div>

                <div className="text-right font-sans-bn">
                  <span className="inline-block px-2.5 py-1 rounded-md bg-[#1B8354]/12 text-[#1B8354] text-xs font-bold">
                    {selectedOption.labelBn}
                  </span>
                  <p className="text-[11px] text-[#526356] mt-0.5">ন্যায্য নার্সারি দর</p>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h3 className="font-serif-bn font-bold text-base text-[#142318]">
                  {lang === 'bn' ? 'গাছটির বিবরণ ও বৈশিষ্ট্য:' : 'Plant Description:'}
                </h3>
                <p className="text-xs sm:text-sm text-[#425547] font-sans-bn leading-relaxed">
                  {lang === 'bn' ? plant.descriptionBn : plant.descriptionEn}
                </p>
              </div>

              {/* Container / Sapling Size Options */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-[#142318] font-sans-bn">
                  {lang === 'bn'
                    ? 'চারার সাইজ ও গ্রো ব্যাগ বেছে নিন:'
                    : 'Select Sapling & Container Size:'}
                </label>
                <div className="grid grid-cols-1 gap-2.5">
                  {plant.options.map((opt) => {
                    const isSelected = opt.id === selectedOption.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSelectedOption(opt)}
                        className={`w-full text-left p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#1B8354] bg-[#1B8354]/[0.06] shadow-2xs'
                            : 'border-[#D5DFD1] bg-white hover:border-[#142318]'
                        }`}
                      >
                        <div>
                          <p className="text-xs sm:text-sm font-bold text-[#142318] font-sans-bn">
                            {lang === 'bn' ? opt.labelBn : opt.labelEn}
                          </p>
                          <p className="text-[11px] text-[#526857] font-sans-bn mt-0.5">
                            {opt.containerType}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-[#B34728] font-mono-num tabular-nums">
                            ₹{opt.price}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* BUYER GUIDANCE MODULE */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#EBF1E8] border border-[#D5DFD1] space-y-3.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#142318] font-sans-bn">
                  <Sparkles className="w-4 h-4 text-[#B45309]" />
                  <span>কেনার আগে জেনে নিন · রোপণ নির্দেশিকা</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-sans-bn">
                  <div className="p-3 bg-white rounded-xl border border-[#D5DFD1]">
                    <div className="flex items-center gap-1.5 text-[#B45309] font-bold mb-1">
                      <Sun className="w-3.5 h-3.5" />
                      <span>রোদ ও আলো</span>
                    </div>
                    <p className="text-[#425547] leading-snug">{plant.sunlightBn}</p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-[#D5DFD1]">
                    <div className="flex items-center gap-1.5 text-[#0369A1] font-bold mb-1">
                      <Droplets className="w-3.5 h-3.5" />
                      <span>জল দেওয়ার নিয়ম</span>
                    </div>
                    <p className="text-[#425547] leading-snug">{plant.wateringBn}</p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-[#D5DFD1] sm:col-span-2">
                    <div className="flex items-center gap-1.5 text-[#1B8354] font-bold mb-1">
                      <Sprout className="w-3.5 h-3.5" />
                      <span>মাটি ও সারের মিশ্রণ</span>
                    </div>
                    <p className="text-[#425547] leading-snug">{plant.soilTipBn}</p>
                  </div>
                </div>
              </div>

              {/* PRIMARY ACTION BUTTONS */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <a
                    href={whatsappOrderUrl}
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
                            optionLabelBn: selectedOption.labelBn,
                            unitPrice: selectedOption.price,
                            quantity: 1,
                            image: plant.image,
                          },
                        ],
                      });
                    }}
                    className="w-full flex-1 inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-[#1B8354] hover:bg-[#146c44] text-white text-sm font-bold shadow-md shadow-[#1B8354]/25 transition-all cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 fill-current" />
                    <span>WhatsApp-এ সরাসরি অর্ডার করুন</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleAdd}
                    className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl border text-sm font-bold transition-all cursor-pointer ${
                      isAdded
                        ? 'bg-[#142318] text-white border-[#142318]'
                        : 'border-[#142318] bg-white text-[#142318] hover:bg-[#142318] hover:text-white'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>তালিকায় যুক্ত হয়েছে!</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>অর্ডার তালিকায় যোগ করুন</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Secondary Quick WhatsApp Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <a
                    href={`https://wa.me/${NURSERY_CONTACT.phoneRaw}?text=${encodeURIComponent(
                      `নমস্কার অশোকদা, আমি কালশুলির নার্সারি থেকে "${plant.nameBn}" এর বর্তমান চারাটির একটি টাটকা ছবি WhatsApp-এ দেখে নিতে চাই।`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-[#CEDAC9] bg-white hover:bg-[#EBF1E8] text-xs font-semibold text-[#142318] transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5 text-[#1B8354]" />
                    <span>চারার বর্তমান ছবি দেখতে চান?</span>
                  </a>

                  <a
                    href={`https://wa.me/${NURSERY_CONTACT.phoneRaw}?text=${encodeURIComponent(
                      `নমস্কার অশোকদা, আমি "${plant.nameBn}" চারাটি মুখে বলে (Voice Note) বুক করতে চাই।`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      void recordWhatsAppInquiryLog({
                        eventType: 'voice_order',
                        items: [
                          {
                            plantId: plant.id,
                            plantNameBn: plant.nameBn,
                            category: plant.category,
                            optionLabelBn: selectedOption.labelBn,
                            unitPrice: selectedOption.price,
                            quantity: 1,
                            image: plant.image,
                          },
                        ],
                      });
                    }}
                    className="inline-flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-[#CEDAC9] bg-white hover:bg-[#EBF1E8] text-xs font-semibold text-[#B34728] transition-colors"
                  >
                    <Mic className="w-3.5 h-3.5 text-[#B34728]" />
                    <span>মুখে বলে ভয়েস অর্ডারের খোঁজ</span>
                  </a>
                </div>

                <div className="flex items-center justify-between text-xs text-[#526857] font-sans-bn pt-2">
                  <span>কালশুলি, পারসোলা, খাতড়া ও সিমলাপাল পরিষেবা</span>
                  <button
                    type="button"
                    onClick={onOpenInquiryBag}
                    className="text-[#1B8354] font-bold hover:underline cursor-pointer"
                  >
                    অর্ডার তালিকা দেখুন ↗
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* CUSTOMER GARDEN PHOTOS & REVIEWS ON EVERY PLANT PAGE       */}
        {/* ========================================================= */}
        <div className="mt-12 pt-8 border-t border-[#D5DFD1] space-y-5 font-sans-bn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-serif-bn text-xl sm:text-2xl font-bold text-[#142318]">
                ক্রেতাদের বাগান গ্যালারি ও রিভিউ ({plant.nameBn})
              </h3>
              <p className="text-xs text-[#4C6252] mt-0.5">
                আমাদের নার্সারি থেকে চারা নিয়ে ক্রেতাদের ছাদবাগান ও উঠোনে ফোটা বাস্তব ছবি ও অভিজ্ঞতা
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowReviewForm((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1B8354] hover:bg-[#146c44] text-white text-xs font-bold cursor-pointer self-start sm:self-auto"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>
                {showReviewForm
                  ? 'ফর্ম বন্ধ করুন'
                  : 'আপনার গাছের ছবি ও রিভিউ যোগ করুন'}
              </span>
            </button>
          </div>

          {revSubmittedMsg && (
            <div className="p-3 rounded-xl bg-[#F0FDF4] border border-[#86EFAC] text-xs font-bold text-[#166534]">
              ধন্যবাদ! আপনার বাগানের ছবি ও মতামত জমা হয়েছে — অ্যাডমিন অনুমোদনের পর এখানে প্রকাশিত হবে।
            </div>
          )}

          {showReviewForm && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!revName.trim() || !revComment.trim()) return;
                await submitCustomerReview({
                  plantId: plant.id,
                  plantNameBn: plant.nameBn,
                  customerName: revName.trim(),
                  locationBn: revLocation.trim() || 'বাঁকুড়া',
                  rating: 5,
                  commentBn: revComment.trim(),
                  photoUrl: revPhotoUrl || undefined,
                  status: 'pending',
                });
                setRevName('');
                setRevLocation('');
                setRevComment('');
                setRevPhotoUrl('');
                setShowReviewForm(false);
                setRevSubmittedMsg(true);
                setTimeout(() => setRevSubmittedMsg(false), 6000);
              }}
              className="bg-white border border-[#D5DFD1] rounded-2xl p-4 sm:p-5 space-y-3 shadow-2xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  value={revName}
                  onChange={(e) => setRevName(e.target.value)}
                  placeholder="আপনার নাম *"
                  className="h-10 px-3 bg-[#F3F6F1] border border-[#CEDAC9] rounded-xl text-xs text-[#142318]"
                />
                <input
                  type="text"
                  value={revLocation}
                  onChange={(e) => setRevLocation(e.target.value)}
                  placeholder="আপনার গ্রাম বা শহর (যেমন: বিষ্ণুপুর, খাতড়া)"
                  className="h-10 px-3 bg-[#F3F6F1] border border-[#CEDAC9] rounded-xl text-xs text-[#142318]"
                />
              </div>

              <textarea
                rows={2}
                required
                value={revComment}
                onChange={(e) => setRevComment(e.target.value)}
                placeholder={`${plant.nameBn} চারাটি আপনার বাগানে কেমন বাড়ছে তা লিখুন *`}
                className="w-full p-3 bg-[#F3F6F1] border border-[#CEDAC9] rounded-xl text-xs text-[#142318]"
              />

              <div className="flex items-center justify-between gap-2 flex-wrap">
                <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#F3F6F1] hover:bg-[#E4ECE0] border border-[#CEDAC9] rounded-xl text-xs font-bold text-[#142318] cursor-pointer">
                  <Camera className="w-3.5 h-3.5 text-[#1B8354]" />
                  <span>{revPhotoUrl ? 'বাগানের ছবি যুক্ত হয়েছে ✓' : 'বাগানের ছবি আপলোড করুন'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const reader = new FileReader();
                      reader.onload = () => {
                        if (typeof reader.result === 'string') setRevPhotoUrl(reader.result);
                      };
                      reader.readAsDataURL(f);
                    }}
                    className="hidden"
                  />
                </label>

                <button
                  type="submit"
                  className="px-4 py-2 bg-[#142318] hover:bg-[#1B8354] text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  রিভিউ পাঠান
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plantMatchingReviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-white border border-[#D5DFD1] rounded-2xl p-4 flex flex-col justify-between gap-3"
              >
                <div className="space-y-2">
                  {rev.photoUrl && (
                    <div className="aspect-[16/10] rounded-xl overflow-hidden bg-[#EBF1E8] border border-[#D5DFD1]">
                      <img
                        src={resolvePlantImageUrl(rev.photoUrl, PUJA_IMAGE)}
                        alt={rev.plantNameBn || rev.customerName}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <p className="font-serif-bn text-xs sm:text-sm text-[#142318] italic leading-relaxed">
                    "{rev.commentBn}"
                  </p>
                </div>

                <div className="pt-2 border-t border-[#EBF1E8] flex items-center justify-between text-[11px]">
                  <div>
                    <p className="font-bold text-[#142318]">{rev.customerName}</p>
                    <p className="text-[#526857]">{rev.locationBn}</p>
                  </div>
                  {rev.plantNameBn && (
                    <span className="px-2 py-0.5 rounded-full bg-[#1B8354]/10 text-[#1B8354] text-[10px] font-bold">
                      ✓ {rev.plantNameBn}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ========================================================= */}
        {/* EXPANDED RELATED PLANTS SECTION (CONTENT-SIMILARITY RANKED) */}
        {/* ========================================================= */}
        {visibleRelatedPlants.length > 0 && (
          <div className="mt-14 pt-10 border-t border-[#D5DFD1]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="font-serif-bn text-xl sm:text-2xl font-bold text-[#142318]">
                  একই ধরন ও বিভাগের আরও চারা ({rankedRelatedPlants.length}টি)
                </h3>
                <p className="text-xs text-[#4C6252] font-sans-bn mt-0.5">
                  আপনার নির্বাচিত চারাটির বিভাগ ({plant.category}), রোদ ও চাহিদা অনুযায়ী সাজানো
                </p>
              </div>

              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#CEDAC9] hover:border-[#142318] text-xs font-bold text-[#142318] transition-colors cursor-pointer self-start sm:self-auto"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>সকল চারা ক্যাটালগে ফিরুন</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {visibleRelatedPlants.map(({ plant: rel, sameCategory }) => {
                const defaultOpt = rel.options[0] || {
                  id: `${rel.id}-def`,
                  labelBn: 'গ্রো ব্যাগ চারা',
                  labelEn: 'Polybag Sapling',
                  price: 50,
                  containerType: 'পলি গ্রো ব্যাগ',
                };
                const isRelAdded = justAddedRelId === rel.id;

                return (
                  <div
                    key={rel.id}
                    onClick={() => onSelectPlant(rel)}
                    className="group bg-white rounded-2xl border border-[#D5DFD1] hover:border-[#1B8354] p-3 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="aspect-[4/3] bg-[#EBF1E8] rounded-xl flex items-center justify-center p-2 mb-2.5 overflow-hidden">
                        <img
                          src={resolvePlantImageUrl(rel.image, PUJA_IMAGE)}
                          alt={rel.nameBn}
                          className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          decoding="async"
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            if (target.src !== PUJA_IMAGE) {
                              target.src = PUJA_IMAGE;
                            }
                          }}
                        />
                      </div>

                      <p className="text-[11px] text-[#526857] font-sans-bn truncate mb-0.5">
                        {sameCategory ? rel.category : `অনুরূপ পছন্দ · ${rel.category}`}
                      </p>

                      <h4 className="font-serif-bn font-bold text-sm text-[#142318] group-hover:text-[#1B8354] transition-colors truncate">
                        {rel.nameBn}
                      </h4>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-[#EBF1E8]">
                      <p className="text-sm font-bold text-[#B34728] font-mono-num tabular-nums">
                        ₹{defaultOpt.price}
                      </p>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToInquiry(rel, defaultOpt);
                          setJustAddedRelId(rel.id);
                          setTimeout(() => {
                            setJustAddedRelId((curr) => (curr === rel.id ? null : curr));
                          }, 1200);
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer ${
                          isRelAdded
                            ? 'bg-[#142318] text-white'
                            : 'bg-[#EBF1E8] hover:bg-[#1B8354] text-[#142318] hover:text-white'
                        }`}
                        title="তালিকায় যোগ করুন"
                      >
                        {isRelAdded ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                        <span>{isRelAdded ? 'যুক্ত' : 'যোগ'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {rankedRelatedPlants.length > 12 && (
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={() => setShowAllRelated((prev) => !prev)}
                  className="px-5 py-2.5 rounded-xl bg-white border border-[#CEDAC9] hover:border-[#142318] text-xs font-bold text-[#142318] shadow-2xs transition-colors cursor-pointer"
                >
                  {showAllRelated
                    ? 'কম চারা দেখুন'
                    : `আরও সম্পর্কিত চারা দেখুন (+${rankedRelatedPlants.length - 12}টি)`}
                </button>
              </div>
            )}

            {/* Bottom Back Bar */}
            <div className="mt-10 flex justify-center">
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#142318] hover:bg-[#1B8354] text-white text-sm font-bold shadow-sm transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{lang === 'bn' ? 'সকল চারা ক্যাটালগে ফিরে যান' : 'Back to All Plants'}</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Sticky Quick Purchase + Back Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#F3F6F1]/95 backdrop-blur-md border-t border-[#D5DFD1] px-3 py-2.5 shadow-lg">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-white border border-[#CEDAC9] text-[#142318] flex items-center justify-center shrink-0 cursor-pointer"
            aria-label={lang === 'bn' ? 'ফিরে যান' : 'Back'}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-[#526857] font-sans-bn truncate">{selectedOption.labelBn}</p>
            <p className="text-lg font-bold text-[#B34728] font-mono-num tabular-nums leading-none">
              ₹{selectedOption.price}
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleAdd}
              className={`px-3 py-2.5 rounded-xl border text-xs font-bold inline-flex items-center gap-1 cursor-pointer ${
                isAdded
                  ? 'bg-[#142318] text-white border-[#142318]'
                  : 'bg-white text-[#142318] border-[#142318]'
              }`}
            >
              {isAdded ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              <span>{isAdded ? (lang === 'bn' ? 'যুক্ত' : 'Added') : (lang === 'bn' ? '+ ব্যাগ' : 'Add')}</span>
            </button>
            <a
              href={whatsappOrderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2.5 rounded-xl bg-[#1B8354] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-current" />
              <span>{lang === 'bn' ? 'অর্ডার' : 'Order'}</span>
            </a>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* FULLSCREEN PHOTO ZOOM LIGHTBOX MODAL                      */}
      {/* ========================================================= */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#0D1710]/95 backdrop-blur-sm flex flex-col justify-between p-4 sm:p-6 font-sans-bn"
          role="dialog"
          aria-modal="true"
          aria-label={plant.nameBn}
        >
          {/* Lightbox Top Bar */}
          <div className="flex items-center justify-between gap-4 text-white">
            <div className="min-w-0">
              <h4 className="font-serif-bn font-bold text-base sm:text-xl truncate">{plant.nameBn}</h4>
              <p className="text-xs text-[#C6D6CA] truncate">
                ছবি {selectedGalleryIdx + 1} / {plantImages.length} · জুম: {Math.round(zoomScale * 100)}%
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsShareModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-[#25D366] hover:bg-[#1FB858] text-[#0B2214] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Share2 className="w-4 h-4" />
                <span>{lang === 'bn' ? 'WhatsApp শেয়ার' : 'Share'}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
                <span>বন্ধ করুন</span>
              </button>
            </div>
          </div>

          {/* Lightbox Zoomable Viewport */}
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onClick={handleImageClick}
            className={`relative flex-1 my-3 flex items-center justify-center overflow-hidden rounded-2xl touch-none select-none ${
              zoomScale > 1
                ? isPanning
                  ? 'cursor-grabbing'
                  : 'cursor-grab'
                : 'cursor-zoom-in'
            }`}
          >
            <img
              src={activePhotoSrc}
              alt={plant.nameBn}
              draggable={false}
              style={{
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomScale})`,
                transition: isPanning ? 'none' : 'transform 220ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              className="max-h-full max-w-full object-contain pointer-events-none"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Lightbox Bottom Zoom & Gallery Controls */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {plantImages.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setSelectedGalleryIdx((prev) => (prev > 0 ? prev - 1 : plantImages.length - 1))
                }
                className="w-11 h-11 rounded-xl bg-white/15 hover:bg-white/25 text-white flex items-center justify-center cursor-pointer"
                aria-label="Previous photo"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

          {/* Lightbox Bottom Touch Zoom & Gallery Controls */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-white">
            {plantImages.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setSelectedGalleryIdx((prev) => (prev > 0 ? prev - 1 : plantImages.length - 1))
                }
                className="h-11 px-4 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                aria-label="Previous photo"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>আগের ছবি</span>
              </button>
            )}

            <div className="px-4 py-2 rounded-xl bg-white/10 text-xs font-semibold inline-flex items-center gap-2">
              <ZoomIn className="w-4 h-4 text-[#A3E635]" />
              <span>দুটি আঙুলে জুম করুন বা ক্লিক করুন · {Math.round(zoomScale * 100)}%</span>
            </div>

            {zoomScale > 1 && (
              <button
                type="button"
                onClick={() => applyZoom(1)}
                className="h-11 px-4 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>স্বাভাবিক আকার</span>
              </button>
            )}

            {plantImages.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setSelectedGalleryIdx((prev) => (prev < plantImages.length - 1 ? prev + 1 : 0))
                }
                className="h-11 px-4 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                aria-label="Next photo"
              >
                <span>পরের ছবি</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

            {plantImages.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setSelectedGalleryIdx((prev) => (prev < plantImages.length - 1 ? prev + 1 : 0))
                }
                className="w-11 h-11 rounded-xl bg-white/15 hover:bg-white/25 text-white flex items-center justify-center cursor-pointer"
                aria-label="Next photo"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Share Photo & Product Details Modal */}
      {isShareModalOpen && (
        <PlantShareModal
          plant={plant}
          selectedOption={selectedOption}
          photoSrc={activePhotoSrc}
          lang={lang}
          onClose={() => setIsShareModalOpen(false)}
        />
      )}
    </div>
  );
}
