import { useState, useEffect } from 'react';
import { Sparkles, X, Calendar, ArrowRight, ShieldCheck, Sun, MapPin, MessageCircle } from 'lucide-react';
import { BrahmyamanPlant } from '../types/nursery';
import { NURSERY_CONTACT, PUJA_IMAGE, lemonImg, roseImg, lotusImg } from '../data/brahmyamanCatalog';
import { resolvePlantImageUrl } from '../utils/imageUrl';

interface CurrentMonthBestBuysBannerProps {
  lang: 'bn' | 'en';
  plants: BrahmyamanPlant[];
  onSelectPlant: (plant: BrahmyamanPlant) => void;
}

export function CurrentMonthBestBuysBanner({ lang, plants, onSelectPlant }: CurrentMonthBestBuysBannerProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [currentMonthName, setCurrentMonthName] = useState({ bn: 'নভেম্বর - ডিসেম্বর', en: 'November - December' });

  useEffect(() => {
    const month = new Date().getMonth(); // 0-11
    if (month === 10 || month === 11) {
      setCurrentMonthName({ bn: 'নভেম্বর - ডিসেম্বর (শীতকালীন চারা রোপণ মরশুম)', en: 'November - December (Winter Planting Season)' });
    } else if (month === 0 || month === 1) {
      setCurrentMonthName({ bn: 'জানুয়ারি - ফেব্রুয়ারি (বসন্ত ও গোলাপ ফুল বাহার)', en: 'January - February (Spring & Rose Season)' });
    } else if (month >= 2 && month <= 5) {
      setCurrentMonthName({ bn: 'গ্রীষ্মকাল (মাটি ও ছায়াতরু পরিচর্যা)', en: 'Summer Season (Shade & Watering Care)' });
    } else {
      setCurrentMonthName({ bn: 'বর্ষাকাল (ফল ও কলম চারা রোপণের সেরা সময়)', en: 'Monsoon Season (Best Time for Fruit Grafts)' });
    }
  }, []);

  if (!isOpen) return null;

  // Pick 3 highlighted best buys for current season
  const featuredBestBuys = plants.filter((p) => p.status !== 'deleted').slice(0, 3);

  const getWhatsAppUrl = (plant: BrahmyamanPlant) => {
    const opt = plant.options?.[0] || { labelBn: 'গ্রো ব্যাগ চারা', price: 50 };
    const msg = encodeURIComponent(
      `নমস্কার, আমি কালশুলির ভ্রম্যমাণ নার্সারি থেকে চলতি মাসের সেরা চারা "${plant.nameBn}" (${opt.labelBn} - ₹${opt.price}) নিতে আগ্রহী। বিস্তারিত জানাবেন কি?`
    );
    return `https://wa.me/${NURSERY_CONTACT.phoneRaw}?text=${msg}`;
  };

  return (
    <aside aria-label="Current Month Best Buys" className="bg-[#142318] text-[#E8EDE9] border-b border-[#2D4734] py-4 px-4 sm:px-6 lg:px-8 relative shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Left info badge & title */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1B8354]/20 text-[#A3E635] flex items-center justify-center shrink-0 border border-[#1B8354]/40">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md bg-[#A3E635] text-[#142318] text-[10px] font-bold tracking-wide">
                চলতি মাসের সেরা চারা (Best Buys)
              </span>
              <span className="text-xs text-[#CBD5E1] font-mono flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#A3E635]" />
                <span>{lang === 'bn' ? currentMonthName.bn : currentMonthName.en}</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#E8EDE9] mt-1 font-sans-bn">
              {lang === 'bn'
                ? 'পশ্চিমবঙ্গের বাঁকুড়া ও রাঢ় বাংলার মাটিতে বিশেষভাবে পরীক্ষিত এবং দ্রুত ফল ও ফুল দেওয়া সেরা চারাগুলো সরাসরি নার্সারি দামে সংগ্রহ করুন।'
                : 'West Bengal seasonal calendar: Hand-selected hardy fruit grafts and winter bloomers acclimatized in Bankura.'}
            </p>
          </div>
        </div>

        {/* Center Quick Chips / Products */}
        <div className="flex items-center gap-3 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0 scrollbar-none">
          {featuredBestBuys.map((plant) => {
            const baseOpt = plant.options?.[0] || {
              price: 50,
              containerType: 'পলি গ্রো ব্যাগ',
            };
            return (
              <div
                key={`best-buy-${plant.id}`}
                className="bg-[#1C3322] hover:bg-[#25422D] border border-[#2D4734] rounded-xl p-2.5 flex items-center gap-3 shrink-0 transition-all shadow-xs min-w-[220px]"
              >
                <div className="w-12 h-12 rounded-lg bg-white/10 overflow-hidden shrink-0 border border-white/10">
                  <img
                    src={resolvePlantImageUrl(plant.image, PUJA_IMAGE)}
                    alt={plant.nameBn}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      if (target.src !== PUJA_IMAGE) target.src = PUJA_IMAGE;
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-bold text-white truncate font-serif-bn">{plant.nameBn}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-mono font-bold text-[#A3E635]">₹{baseOpt.price}</span>
                    <span className="text-[10px] text-[#94A3B8] truncate">{baseOpt.containerType}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <a
                    href={getWhatsAppUrl(plant)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-7 h-7 rounded-lg bg-[#25D366] text-[#142318] flex items-center justify-center hover:scale-105 transition-transform"
                    title="WhatsApp Order"
                  >
                    <MessageCircle className="w-3.5 h-3.5 fill-current" />
                  </a>
                  <button
                    type="button"
                    onClick={() => onSelectPlant(plant)}
                    className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                    title="View"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="absolute top-2 right-2 sm:relative sm:top-auto sm:right-auto text-[#94A3B8] hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Close banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
