import { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, MessageCircle, Trash2, Plus, Minus, ArrowRight, ShoppingBag, Mic, ShieldCheck, AlertCircle, Copy, Check, Clock, Truck } from 'lucide-react';
import { WhatsAppInquiryItem, BrahmyamanPlant } from '../types/nursery';
import { NURSERY_CONTACT, PUJA_IMAGE } from '../data/brahmyamanCatalog';
import { resolvePlantImageUrl } from '../utils/imageUrl';
import { recordWhatsAppInquiryLog } from '../utils/whatsappOrderTracker';

interface WhatsAppCartModalProps {
  isOpen: boolean;
  items: WhatsAppInquiryItem[];
  plants: BrahmyamanPlant[];
  lang: 'bn' | 'en';
  onClose: () => void;
  onUpdateQty: (index: number, delta: number) => void;
  onRemoveItem: (index: number) => void;
  onClearAll: () => void;
}

export function WhatsAppCartModal({
  isOpen,
  items,
  plants,
  lang,
  onClose,
  onUpdateQty,
  onRemoveItem,
  onClearAll,
}: WhatsAppCartModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [selectedZone, setSelectedZone] = useState<'kalsuli' | 'parsola' | 'khatra' | 'simlapal'>('kalsuli');
  const [customLocality, setCustomLocality] = useState('');
  const [pickupPreference, setPickupPreference] = useState<'pickup' | 'delivery'>('pickup');
  const [specialNote, setSpecialNote] = useState('');
  const [copiedOrderText, setCopiedOrderText] = useState(false);

  const resolvedItems = useMemo(() => {
    return items.map((item) => {
      const livePlant = plants.find((p) => p.id === item.plantId);
      const matchedOpt =
        livePlant?.options.find((o) => o.labelBn === item.optionLabelBn) ||
        livePlant?.options[0];
      const livePrice =
        matchedOpt && matchedOpt.price > 0 ? matchedOpt.price : item.price;
      return {
        ...item,
        nameBn: livePlant?.nameBn || item.nameBn,
        nameEn: livePlant?.nameEn || item.nameEn,
        image: livePlant?.image || '',
        price: livePrice,
        priceChanged: livePrice !== item.price,
        isOutOfStock: livePlant ? livePlant.inStock === false : false,
      };
    });
  }, [items, plants]);

  const totalEstimate = useMemo(
    () => resolvedItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [resolvedItems]
  );

  const zoneNames: Record<string, string> = {
    kalsuli: 'কালশুলি (নার্সারি এলাকা)',
    parsola: 'পারসোলা',
    khatra: 'খাতড়া শহর/গ্রাম',
    simlapal: 'সিমলাপাল',
  };

  const orderMessage = useMemo(() => {
    const orderLines = resolvedItems
      .map(
        (it, idx) =>
          `${idx + 1}. ${it.nameBn} (${it.optionLabelBn}) × ${it.quantity} = ₹${it.price * it.quantity}${
            it.isOutOfStock ? ' [স্টক শেষ — প্রাপ্যতা জিজ্ঞাসা]' : ''
          }`
      )
      .join('\n');

    return `নমস্কার ভ্রম্যমাণ নার্সারি (কালশুলি, বাঁকুড়া),
আমি আপনার নার্সারি থেকে নিম্নলিখিত চারাগাছ ও কলম অর্ডার/জিজ্ঞাসা করতে চাই:

${orderLines}

মোট আনুমানিক মূল্য: ₹${totalEstimate}
গ্রাহকের নাম: ${customerName.trim() || 'উল্লেখ নেই'}
ডেলিভারি অঞ্চল: ${zoneNames[selectedZone]}${customLocality.trim() ? ` (${customLocality.trim()})` : ''}
সংগ্রহের ধরণ: ${
      pickupPreference === 'pickup'
        ? 'কালশুলির নার্সারি থেকে সরাসরি সংগ্রহ'
        : `হোম ডেলিভারি (${selectedZone === 'khatra' || selectedZone === 'simlapal' ? 'মঙ্গলবার/শুক্রবার সাপ্তাহিক রুট' : 'লোকাল ডেলিভারি'})`
    }${specialNote.trim() ? `\nবিশেষ অনুরোধ: ${specialNote.trim()}` : ''}
চারার অবস্থা: ডেলিভারির পূর্বে WhatsApp-এ চারার তাজা ছবি দেখে নিতে চাই।

অনুগ্রহ করে অর্ডার নিশ্চিত করুন। ধন্যবাদ!`;
  }, [resolvedItems, totalEstimate, customerName, selectedZone, customLocality, pickupPreference, specialNote]);

  const whatsappOrderUrl = useMemo(
    () => `https://wa.me/${NURSERY_CONTACT.phoneRaw}?text=${encodeURIComponent(orderMessage)}`,
    [orderMessage]
  );

  const voiceOrderUrl = useMemo(() => {
    const msg = encodeURIComponent(
      `নমস্কার, ভ্রম্যমাণ নার্সারি (কালশুলি)। আমি মুখে বলে চারাগাছ অর্ডার করতে চাই। অনুগ্রহ করে এই চ্যাটে একটু শুনবেন।`
    );
    return `https://wa.me/${NURSERY_CONTACT.phoneRaw}?text=${msg}`;
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isDistantZone = selectedZone === 'khatra' || selectedZone === 'simlapal';
  const isBelowMinimum = isDistantZone && pickupPreference === 'delivery' && totalEstimate < 250;

  const handleCopyOrderText = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(orderMessage);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = orderMessage;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedOrderText(true);
      setTimeout(() => setCopiedOrderText(false), 2500);
    } catch {
      setCopiedOrderText(false);
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-title"
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-[#121914]/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white border border-[#D5DFD1] rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#D5DFD1] bg-[#F3F6F1] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#1B8354]/15 flex items-center justify-center text-[#1B8354]">
              <MessageCircle className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 id="cart-title" className="font-serif-bn text-lg font-bold text-[#142318]">
                {lang === 'bn' ? 'WhatsApp অর্ডার তালিকা' : 'WhatsApp Order List'}
              </h3>
              <p className="text-[11px] text-[#785942] font-sans-bn -mt-0.5">
                কালশুলি, পারসোলা, খাতড়া ও সিমলাপাল অঞ্চল
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[#526356] hover:text-[#142318] hover:bg-[#E4ECE0] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 font-sans-bn">
          {resolvedItems.length === 0 ? (
            <div className="py-10 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#E4ECE0] flex items-center justify-center mx-auto text-[#785942]">
                <ShoppingBag className="w-7 h-7 stroke-[1.5]" />
              </div>
              <div>
                <p className="font-serif-bn text-lg text-[#142318] font-bold">
                  {lang === 'bn' ? 'আপনার অর্ডার তালিকায় কোনো গাছ নেই' : 'Your order list is empty'}
                </p>
                <p className="text-xs text-[#526356] mt-1 max-w-xs mx-auto">
                  {lang === 'bn'
                    ? 'ক্যাটালগ থেকে পছন্দের চারাগাছ বেছে নিন অথবা সরাসরি মুখে বলে ভয়েস মেসেজ পাঠান।'
                    : 'Add saplings from catalog or send a quick voice message over WhatsApp.'}
                </p>
              </div>

              {/* Quick Voice Order Alternative */}
              <a
                href={voiceOrderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1B8354] hover:bg-[#146c44] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Mic className="w-4 h-4" />
                <span>মুখে বলে ভয়েস মেসেজে অর্ডার পাঠান</span>
              </a>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Item List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-[#785942]">
                  <span>নির্বাচিত চারা ও কলম ({resolvedItems.length})</span>
                  <button
                    type="button"
                    onClick={onClearAll}
                    className="text-[#B34728] hover:underline cursor-pointer"
                  >
                    সব মুছুন
                  </button>
                </div>

                <div className="divide-y divide-[#DFE7DC] border border-[#D5DFD1] rounded-2xl overflow-hidden bg-[#F3F6F1]">
                  {resolvedItems.map((item, index) => (
                    <div
                      key={`${item.plantId}-${item.optionLabelBn}`}
                      className="p-3.5 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="w-10 h-10 rounded-lg bg-white border border-[#D5DFD1] overflow-hidden shrink-0">
                        <img
                          src={resolvePlantImageUrl(item.image, PUJA_IMAGE)}
                          alt={item.nameBn}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            if (target.src !== PUJA_IMAGE) target.src = PUJA_IMAGE;
                          }}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <p className="font-semibold text-[#142318] truncate text-sm font-serif-bn">
                            {item.nameBn}
                          </p>
                          {item.isOutOfStock && (
                            <span className="px-1.5 py-0.5 rounded bg-[#B34728]/15 text-[#B34728] text-[10px] font-bold shrink-0">
                              স্টক শেষ
                            </span>
                          )}
                        </div>
                        <p className="text-[#785942] text-[11px] truncate">
                          {item.optionLabelBn} · ₹{item.price}
                          {item.priceChanged && (
                            <span className="text-[#1B8354] font-semibold ml-1">(আপডেটেড দাম)</span>
                          )}
                        </p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="inline-flex items-center border border-[#CEDAC9] rounded-lg bg-white h-7">
                          <button
                            type="button"
                            onClick={() => onUpdateQty(index, -1)}
                            className="w-6 h-full flex items-center justify-center text-[#526356] hover:text-[#142318] cursor-pointer"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold tabular-nums font-mono-num">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQty(index, 1)}
                            className="w-6 h-full flex items-center justify-center text-[#526356] hover:text-[#142318] cursor-pointer"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="text-right w-14">
                          <span className="font-bold text-[#B34728] tabular-nums font-mono-num">
                            ₹{item.price * item.quantity}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => onRemoveItem(index)}
                          className="text-[#785942] hover:text-[#B34728] p-1 cursor-pointer"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3.5 bg-[#E4ECE0]/80 rounded-2xl flex items-center justify-between text-sm font-bold text-[#142318]">
                  <span>মোট আনুমানিক মূল্য</span>
                  <span className="text-lg text-[#B34728] tabular-nums font-mono-num font-bold">
                    ₹{totalEstimate}
                  </span>
                </div>
              </div>

              {/* Delivery Zone Selector & Unit Economics Safe Guard */}
              <div className="space-y-3 pt-2 border-t border-[#D5DFD1]">
                <label className="block text-xs font-bold text-[#142318]">
                  আপনার ডেলিভারি অঞ্চল বেছে নিন (Zone):
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'kalsuli', label: 'কালশুলি (নার্সারি)', note: 'কোনো ন্যূনতম সীমা নেই' },
                    { id: 'parsola', label: 'পারসোলা', note: 'লোকাল ডেলিভারি' },
                    { id: 'khatra', label: 'খাতড়া', note: 'ন্যূনতম ₹২৫০ (রুট ডেলিভারি)' },
                    { id: 'simlapal', label: 'সিমলাপাল', note: 'ন্যূনতম ₹২৫০ (রুট ডেলিভারি)' },
                  ].map((z) => (
                    <button
                      key={z.id}
                      type="button"
                      onClick={() => setSelectedZone(z.id as any)}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                        selectedZone === z.id
                          ? 'border-[#1B8354] bg-[#1B8354]/10 text-[#142318] font-bold shadow-2xs'
                          : 'border-[#D5DFD1] bg-white text-[#526356] hover:border-[#142318]'
                      }`}
                    >
                      <span className="block">{z.label}</span>
                      <span className="text-[10px] text-[#785942] block mt-0.5">{z.note}</span>
                    </button>
                  ))}
                </div>

                {/* Delivery Threshold Progress Meter for Khatra / Simlapal */}
                {isDistantZone && pickupPreference === 'delivery' && (
                  <div
                    className={`p-3 rounded-xl border text-xs ${
                      isBelowMinimum
                        ? 'bg-amber-50 border-amber-200 text-amber-900'
                        : 'bg-[#1B8354]/[0.07] border-[#1B8354]/30 text-[#142318]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="inline-flex items-center gap-1.5 font-bold">
                        {isBelowMinimum ? (
                          <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        ) : (
                          <Truck className="w-3.5 h-3.5 text-[#1B8354] shrink-0" />
                        )}
                        <span>
                          {isBelowMinimum
                            ? `হোম ডেলিভারির জন্য আর ₹${250 - totalEstimate} প্রয়োজন`
                            : 'খাতড়া ও সিমলাপাল রুট ডেলিভারির জন্য যোগ্য ✓'}
                        </span>
                      </span>
                      <span className="font-mono-num font-bold text-[11px] tabular-nums">
                        ₹{Math.min(totalEstimate, 250)} / ₹250
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-black/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isBelowMinimum ? 'bg-amber-600' : 'bg-[#1B8354]'
                        }`}
                        style={{ width: `${Math.min(100, Math.round((totalEstimate / 250) * 100))}%` }}
                      />
                    </div>
                    {isBelowMinimum && (
                      <p className="text-[11px] mt-1.5 text-amber-800">
                        অথবা "কালশুলি নার্সারি থেকে নেব" বেছে নিলে কোনো ন্যূনতম সীমা নেই।
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Customer Info Form */}
              <div className="space-y-3 pt-2 border-t border-[#D5DFD1]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="customer-name" className="block text-[11px] text-[#526356] mb-1 font-medium">
                      আপনার নাম (Your Name)
                    </label>
                    <input
                      id="customer-name"
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="যেমন: শুভাশিস মণ্ডল"
                      className="w-full h-9 px-3 border border-[#CEDAC9] rounded-xl text-xs text-[#142318] focus:outline-none focus:ring-2 focus:ring-[#1B8354]"
                    />
                  </div>
                  <div>
                    <label htmlFor="customer-loc" className="block text-[11px] text-[#526356] mb-1 font-medium">
                      গ্রামের বিস্তারিত পাড়া / ল্যান্ডমার্ক
                    </label>
                    <input
                      id="customer-loc"
                      type="text"
                      value={customLocality}
                      onChange={(e) => setCustomLocality(e.target.value)}
                      placeholder="যেমন: বটতলা মোড় / পোস্ট অফিসের পাশে"
                      className="w-full h-9 px-3 border border-[#CEDAC9] rounded-xl text-xs text-[#142318] focus:outline-none focus:ring-2 focus:ring-[#1B8354]"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="customer-note" className="block text-[11px] text-[#526356] mb-1 font-medium">
                    বিশেষ অনুরোধ / সময় (ঐচ্ছিক)
                  </label>
                  <input
                    id="customer-note"
                    type="text"
                    value={specialNote}
                    onChange={(e) => setSpecialNote(e.target.value)}
                    placeholder="যেমন: ভালো কলম দেবেন, বিকাল ৪টার পর ডেলিভারি হলে সুবিধা..."
                    className="w-full h-9 px-3 border border-[#CEDAC9] rounded-xl text-xs text-[#142318] focus:outline-none focus:ring-2 focus:ring-[#1B8354]"
                  />
                </div>

                {/* Pickup or Delivery Option */}
                <div>
                  <label className="block text-[11px] text-[#526356] mb-1.5 font-medium">
                    গাছ সংগ্রহের পদ্ধতি:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPickupPreference('pickup')}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-colors cursor-pointer ${
                        pickupPreference === 'pickup'
                          ? 'border-[#1B8354] bg-[#1B8354]/[0.08] text-[#142318] font-bold'
                          : 'border-[#D5DFD1] bg-white text-[#526356]'
                      }`}
                    >
                      <span className="block">কালশুলি নার্সারি থেকে নেব</span>
                      <span className="block text-[10px] text-[#785942] mt-0.5">স্বশরীরে এসে দেখে পছন্দ</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPickupPreference('delivery')}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-colors cursor-pointer ${
                        pickupPreference === 'delivery'
                          ? 'border-[#1B8354] bg-[#1B8354]/[0.08] text-[#142318] font-bold'
                          : 'border-[#D5DFD1] bg-white text-[#526356]'
                      }`}
                    >
                      <span className="block">হোম ডেলিভারি চাই</span>
                      <span className="block text-[10px] text-[#785942] mt-0.5">নিরাপদ রুট ডেলিভারি</span>
                    </button>
                  </div>
                </div>

                {/* Living Plant, Transit Root-Ball Safety, COD Confirmation & 15-min Response Guarantee */}
                <div className="p-3.5 bg-[#EBF1E8] border border-[#D5DFD1] rounded-xl space-y-1.5 text-xs text-[#785942]">
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#1B8354] shrink-0 mt-0.5" />
                    <span>
                      <strong>বাস্তব ছবি ও শিকড় সুরক্ষা:</strong> ডেলিভারির পূর্বে চারার বর্তমান ছবি WhatsApp-এ পাঠানো হবে এবং রাস্তায় মাটির বল অক্ষত রাখতে ভেজা কোকোপিট ও চটের প্যাকিং দেওয়া হয়।
                    </span>
                  </div>
                  <p className="text-[11px] text-[#526356] pl-6 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#1B8354] shrink-0" />
                    <span>{NURSERY_CONTACT.responsePromiseBn} ডেলিভারির আগে ফোনে নিশ্চিত হয়ে তবেই গাড়ি ছাড়া হয় (COD যাচাই)।</span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {resolvedItems.length > 0 && (
          <div className="px-6 py-4 bg-[#F3F6F1] border-t border-[#D5DFD1] space-y-2">
            <a
              href={whatsappOrderUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                void recordWhatsAppInquiryLog({
                  eventType: 'cart_order',
                  items: resolvedItems.map((it) => {
                    const matched = plants.find((p) => p.id === it.plantId);
                    return {
                      plantId: it.plantId,
                      plantNameBn: it.nameBn,
                      category: matched?.category || 'চারাগাছ',
                      optionLabelBn: it.optionLabelBn,
                      unitPrice: it.price,
                      quantity: it.quantity,
                      image: it.image,
                    };
                  }),
                  customerName: customerName.trim() || undefined,
                  deliveryZoneBn: `${zoneNames[selectedZone]}${
                    customLocality.trim() ? ` (${customLocality.trim()})` : ''
                  }`,
                  pickupPreference,
                });
              }}
              className="w-full py-3.5 px-4 bg-[#1B8354] hover:bg-[#146c44] text-white text-sm font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <MessageCircle className="w-5 h-5 fill-current" />
              <span>WhatsApp-এ সরাসরি অর্ডার পাঠান</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <a
                href={voiceOrderUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  void recordWhatsAppInquiryLog({
                    eventType: 'voice_order',
                    items: resolvedItems.map((it) => {
                      const matched = plants.find((p) => p.id === it.plantId);
                      return {
                        plantId: it.plantId,
                        plantNameBn: it.nameBn,
                        category: matched?.category || 'চারাগাছ',
                        optionLabelBn: it.optionLabelBn,
                        unitPrice: it.price,
                        quantity: it.quantity,
                        image: it.image,
                      };
                    }),
                    customerName: customerName.trim() || undefined,
                    deliveryZoneBn: zoneNames[selectedZone],
                    pickupPreference,
                  });
                }}
                className="w-full py-2.5 px-3 bg-white hover:bg-[#E4ECE0] text-[#142318] border border-[#CEDAC9] text-xs font-semibold rounded-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Mic className="w-3.5 h-3.5 text-[#B34728] shrink-0" />
                <span className="truncate">মুখে বলে ভয়েস অর্ডার</span>
              </a>

              <button
                type="button"
                onClick={handleCopyOrderText}
                className={`w-full py-2.5 px-3 border text-xs font-semibold rounded-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  copiedOrderText
                    ? 'bg-[#142318] border-[#142318] text-white'
                    : 'bg-white hover:bg-[#E4ECE0] text-[#142318] border-[#CEDAC9]'
                }`}
              >
                {copiedOrderText ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#A3E635] shrink-0" />
                    <span>অর্ডার বার্তা কপি হয়েছে ✓</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#1B8354] shrink-0" />
                    <span>অর্ডার বার্তা কপি করুন</span>
                  </>
                )}
              </button>
            </div>

            <div className="text-center text-[11px] text-[#785942] pt-1">
              যেকোনো জরুরি প্রয়োজনে কল:{' '}
              <a href={`tel:${NURSERY_CONTACT.phone}`} className="font-mono-num font-bold text-[#142318] hover:underline">
                {NURSERY_CONTACT.phone}
              </a>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
