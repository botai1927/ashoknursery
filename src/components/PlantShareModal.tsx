import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  Loader2,
  MessageCircle,
  Share2,
  Smartphone,
  X,
} from 'lucide-react';
import { BrahmyamanPlant, PlantPotOption } from '../types/nursery';
import { PUJA_IMAGE } from '../data/brahmyamanCatalog';
import { resolvePlantImageUrl } from '../utils/imageUrl';
import {
  buildPlantShareText,
  buildWhatsAppShareUrl,
  copyShareText,
  downloadPlantPhoto,
  sharePlantViaWebShare,
} from '../utils/plantShare';
import { recordWhatsAppInquiryLog } from '../utils/whatsappOrderTracker';

interface PlantShareModalProps {
  plant: BrahmyamanPlant;
  selectedOption?: PlantPotOption;
  photoSrc?: string;
  lang: 'bn' | 'en';
  onClose: () => void;
}

export function PlantShareModal({
  plant,
  selectedOption,
  photoSrc,
  lang,
  onClose,
}: PlantShareModalProps) {
  const [nativeSharing, setNativeSharing] = useState(false);
  const [copiedDetails, setCopiedDetails] = useState(false);
  const [downloadedPhoto, setDownloadedPhoto] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : undefined;

  const activePhotoSrc = useMemo(
    () => resolvePlantImageUrl(photoSrc || plant.image, PUJA_IMAGE),
    [photoSrc, plant.image]
  );

  const activeOption =
    selectedOption ||
    plant.options[0] || {
      id: 'opt-def',
      labelBn: 'পলি গ্রো-ব্যাগ চারা',
      labelEn: 'Polybag Sapling',
      price: 50,
      containerType: 'পলি গ্রো ব্যাগ',
    };

  const shareBundle = useMemo(
    () =>
      buildPlantShareText({
        plant,
        selectedOption: activeOption,
        photoUrl: activePhotoSrc,
        lang,
        origin,
      }),
    [plant, activeOption, activePhotoSrc, lang, origin]
  );

  const whatsappShareUrl = useMemo(
    () => buildWhatsAppShareUrl(shareBundle.text),
    [shareBundle.text]
  );

  const supportsNativeShare =
    typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [onClose]);

  const handleNativePhotoShare = async () => {
    setNativeSharing(true);
    setStatusMessage(null);
    try {
      const outcome = await sharePlantViaWebShare({
        plant,
        selectedOption: activeOption,
        photoUrl: activePhotoSrc,
        lang,
        origin,
      });
      if (outcome.ok) {
        void recordWhatsAppInquiryLog({
          eventType: 'photo_share',
          items: [
            {
              plantId: plant.id,
              plantNameBn: plant.nameBn,
              category: plant.category,
              optionLabelBn: activeOption.labelBn,
              unitPrice: activeOption.price,
              quantity: 1,
              image: activePhotoSrc,
            },
          ],
        });
        setStatusMessage(
          outcome.messageBn ||
            (lang === 'bn' ? 'সফলভাবে শেয়ার করা হয়েছে!' : 'Shared successfully!')
        );
      } else if (outcome.fallbackRequired) {
        setStatusMessage(
          lang === 'bn'
            ? 'এই ব্রাউজারে সরাসরি ফাইল শেয়ার বন্ধ আছে — নিচের WhatsApp বাটনে ট্যাপ করুন।'
            : 'Direct file share is restricted here — use the WhatsApp button below.'
        );
      }
    } finally {
      setNativeSharing(false);
    }
  };

  const handleCopyDetails = async () => {
    const ok = await copyShareText(shareBundle.text);
    if (ok) {
      setCopiedDetails(true);
      setStatusMessage(
        lang === 'bn'
          ? 'ছবির লিংক ও গাছের সব বিবরণ কপি হয়েছে!'
          : 'Photo link and plant details copied!'
      );
      setTimeout(() => setCopiedDetails(false), 2200);
    }
  };

  const handleDownloadPhoto = async () => {
    const ok = await downloadPlantPhoto(
      activePhotoSrc,
      plant.nameEn || plant.nameBn || plant.id
    );
    if (ok) {
      setDownloadedPhoto(true);
      setStatusMessage(
        lang === 'bn'
          ? 'চারার ছবি ডিভাইসে সেভ হয়েছে — এবার WhatsApp-এ সরাসরি পাঠাতে পারবেন।'
          : 'Photo saved to your device.'
      );
      setTimeout(() => setDownloadedPhoto(false), 2200);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] bg-[#0D1710]/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 font-sans-bn"
      role="dialog"
      aria-modal="true"
      aria-label={lang === 'bn' ? 'ছবি ও বিবরণ শেয়ার করুন' : 'Share Photo & Details'}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md bg-[#F8FAF7] rounded-t-3xl sm:rounded-3xl border border-[#D5DFD1] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="px-5 py-4 bg-[#EBF1E8] border-b border-[#D5DFD1] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#1B8354]/15 text-[#1B8354] flex items-center justify-center shrink-0">
              <Share2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-serif-bn font-bold text-base text-[#142318] truncate">
                {lang === 'bn'
                  ? 'ছবি ও চারাগাছের তথ্য শেয়ার করুন'
                  : 'Share Photo & Plant Details'}
              </h3>
              <p className="text-[11px] text-[#4C6252] truncate">
                {lang === 'bn'
                  ? 'বন্ধু, পরিবার বা বাগান গ্রুপে WhatsApp-এ পাঠান'
                  : 'Send photo & complete details on WhatsApp'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white border border-[#CEDAC9] hover:bg-[#142318] hover:text-white text-[#142318] flex items-center justify-center cursor-pointer shrink-0 transition-colors"
            aria-label={lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Product + Photo Preview Card */}
          <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-white border border-[#D5DFD1] shadow-2xs">
            <div className="w-20 h-20 rounded-xl bg-[#EBF1E8] border border-[#D5DFD1] overflow-hidden shrink-0 flex items-center justify-center p-1">
              <img
                src={activePhotoSrc}
                alt={plant.nameBn}
                className="max-h-full max-w-full object-contain"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  if (target.src !== PUJA_IMAGE) {
                    target.src = PUJA_IMAGE;
                  }
                }}
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold text-[#1B8354] truncate">
                {plant.category}
              </p>
              <h4 className="font-serif-bn font-bold text-base text-[#142318] truncate">
                {lang === 'bn' ? plant.nameBn : plant.nameEn}
              </h4>
              <p className="text-[11px] text-[#526857] italic truncate">
                {plant.botanicalName}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-sm font-bold text-[#B34728] font-mono-num tabular-nums">
                  ₹{activeOption.price}
                </span>
                <span className="text-[11px] text-[#4C6252] truncate">
                  · {lang === 'bn' ? activeOption.labelBn : activeOption.labelEn}
                </span>
              </div>
            </div>
          </div>

          {/* Primary Share Actions */}
          <div className="space-y-2.5">
            {supportsNativeShare && (
              <button
                type="button"
                onClick={handleNativePhotoShare}
                disabled={nativeSharing}
                className="w-full py-3 px-4 rounded-2xl bg-[#142318] hover:bg-[#1B8354] disabled:opacity-60 text-white text-xs sm:text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {nativeSharing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Smartphone className="w-4 h-4" />
                )}
                <span>
                  {lang === 'bn'
                    ? 'ছবিসহ মোবাইল অ্যাপে শেয়ার করুন (WhatsApp / অন্যান্য)'
                    : 'Share Photo File + Details (WhatsApp / Apps)'}
                </span>
              </button>
            )}

            <a
              href={whatsappShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                void recordWhatsAppInquiryLog({
                  eventType: 'photo_share',
                  items: [
                    {
                      plantId: plant.id,
                      plantNameBn: plant.nameBn,
                      category: plant.category,
                      optionLabelBn: activeOption.labelBn,
                      unitPrice: activeOption.price,
                      quantity: 1,
                      image: activePhotoSrc,
                    },
                  ],
                });
              }}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#25D366] hover:bg-[#1FB858] text-[#0B2214] text-xs sm:text-sm font-bold shadow-md shadow-[#25D366]/20 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>
                {lang === 'bn'
                  ? 'WhatsApp-এ ছবি ও বিবরণ শেয়ার করুন'
                  : 'Share Photo & Product Details on WhatsApp'}
              </span>
            </a>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleCopyDetails}
                className="py-2.5 px-3 rounded-xl bg-white border border-[#CEDAC9] hover:border-[#142318] text-xs font-bold text-[#142318] inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                {copiedDetails ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#1B8354]" />
                    <span className="text-[#1B8354]">
                      {lang === 'bn' ? 'কপি হয়েছে!' : 'Copied!'}
                    </span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#4C6252]" />
                    <span>{lang === 'bn' ? 'বিবরণ কপি করুন' : 'Copy Details'}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownloadPhoto}
                className="py-2.5 px-3 rounded-xl bg-white border border-[#CEDAC9] hover:border-[#142318] text-xs font-bold text-[#142318] inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                {downloadedPhoto ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#1B8354]" />
                    <span className="text-[#1B8354]">
                      {lang === 'bn' ? 'সেভ হয়েছে!' : 'Saved!'}
                    </span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5 text-[#B45309]" />
                    <span>{lang === 'bn' ? 'ছবি সেভ করুন' : 'Save Photo'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {statusMessage && (
            <div className="p-2.5 rounded-xl bg-[#1B8354]/10 border border-[#1B8354]/30 text-xs font-semibold text-[#142318] text-center">
              {statusMessage}
            </div>
          )}

          {/* Message Preview */}
          <div className="space-y-1.5">
            <span className="block text-[11px] font-bold text-[#4C6252]">
              {lang === 'bn'
                ? 'WhatsApp-এ যা পাঠানো হবে (প্রিভিউ):'
                : 'Message preview for WhatsApp:'}
            </span>
            <pre className="p-3 rounded-2xl bg-white border border-[#D5DFD1] text-[11px] leading-relaxed text-[#2D4033] whitespace-pre-wrap font-sans-bn max-h-40 overflow-y-auto">
              {shareBundle.text}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
