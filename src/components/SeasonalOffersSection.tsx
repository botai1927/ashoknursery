import { Sparkles, Tag, ArrowRight, MessageCircle } from 'lucide-react';
import { BrahmyamanPlant } from '../types/nursery';
import { NURSERY_CONTACT, PUJA_IMAGE } from '../data/brahmyamanCatalog';
import { resolvePlantImageUrl } from '../utils/imageUrl';

interface SeasonalOffersSectionProps {
  lang: 'bn' | 'en';
  plants: BrahmyamanPlant[];
  onSelectPlant: (plant: BrahmyamanPlant) => void;
}

export function SeasonalOffersSection({ lang, plants, onSelectPlant }: SeasonalOffersSectionProps) {
  // Pick featured seasonal offers (e.g. Kagzi lemon, Katimon Mango, Lotus tub, Winter roses)
  const offers = plants.filter((p) => p.status !== 'deleted').slice(0, 4);

  const getWhatsAppUrl = (plant: BrahmyamanPlant) => {
    const opt = plant.options?.[0] || { labelBn: 'গ্রো ব্যাগ চারা', price: 50 };
    const msg = encodeURIComponent(
      `নমস্কার, আমি কালশুলির ভ্রাম্যমাণ নার্সারি থেকে বর্তমান মরশুমের অফার "${plant.nameBn}" (${opt.labelBn} - ₹${opt.price}) নিতে আগ্রহী। বিস্তারিত জানাবেন কি?`
    );
    return `https://wa.me/${NURSERY_CONTACT.phoneRaw}?text=${msg}`;
  };

  return (
    <section id="section-offers" className="py-16 bg-gradient-to-b from-[#F3F6F1] to-[#E4ECE0] border-b border-[#D5DFD1] scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[#B34728] text-xs font-semibold mb-1.5 font-sans-bn">
              <Sparkles className="w-3.5 h-3.5" />
              <span>মরশুমের বিশেষ অফার · Seasonal Special Deals</span>
            </div>
            <h2 className="font-serif-bn text-2xl sm:text-4xl text-[#142318] font-normal tracking-tight">
              {lang === 'bn' ? 'চলতি মাসের সেরা ছাড় ও বিশেষ চারা সংগ্রহ' : 'This Month’s Best Nursery Deals & Offers'}
            </h2>
            <p className="text-xs sm:text-sm text-[#526356] mt-2 font-sans-bn max-w-2xl">
              {lang === 'bn'
                ? 'বাঁকুড়ার লাল মাটিতে বিশেষভাবে প্রস্তুত সতেজ ফল ও ফুলের কলম—সরাসরি নার্সারি দামে, কোনো মধ্যস্থতাকারী ছাড়াই।'
                : 'Direct nursery pricing on Bankura-acclimatized fruit grafts and sacred puja blooms.'}
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-[#CEDAC9] shadow-2xs shrink-0">
            <Tag className="w-4 h-4 text-[#B34728]" />
            <span className="text-xs font-semibold text-[#142318] font-sans-bn">
              {lang === 'bn' ? 'সরাসরি WhatsApp অর্ডার' : 'Direct WhatsApp Orders'}
            </span>
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-3 thin-horizontal-scroll sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-6 sm:overflow-visible sm:pb-0">
          {offers.map((plant) => {
            const baseOpt = plant.options?.[0] || {
              price: 50,
              containerType: 'পলি গ্রো ব্যাগ',
            };
            return (
              <div
                key={`offer-${plant.id}`}
                className="group w-[240px] sm:w-auto shrink-0 snap-start bg-white rounded-2xl border border-[#D5DFD1] hover:border-[#B34728]/60 overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between"
              >
                <div className="relative aspect-[4/3] bg-[#EBF1E8] overflow-hidden">
                  <img
                    src={resolvePlantImageUrl(plant.image, PUJA_IMAGE)}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full object-cover blur-xl opacity-35 scale-110 pointer-events-none select-none"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    decoding="async"
                  />
                  <img
                    src={resolvePlantImageUrl(plant.image, PUJA_IMAGE)}
                    alt={plant.nameBn}
                    className="relative z-10 w-full h-full object-contain group-hover:scale-104 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      if (target.src !== PUJA_IMAGE) target.src = PUJA_IMAGE;
                    }}
                  />
                  <div className="absolute top-3 left-3 z-20">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-semibold text-white ${plant.inStock !== false ? 'bg-[#B34728]' : 'bg-[#785942]'}`}>
                      {plant.inStock !== false ? (lang === 'bn' ? 'বিশেষ ছাড়' : 'Seasonal Deal') : (lang === 'bn' ? 'স্টক শেষ' : 'Sold Out')}
                    </span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-xs text-[#785942] font-sans-bn">{plant.category}</span>
                    <h3 className="font-serif-bn text-lg font-bold text-[#142318] group-hover:text-[#1B8354] transition-colors mt-0.5">
                      {plant.nameBn}
                    </h3>
                    <p className="text-xs text-[#526356] font-sans-bn mt-1 line-clamp-2">
                      {plant.descriptionBn}
                    </p>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-[#D5DFD1] flex items-center justify-between gap-2">
                    <div>
                      <span className="text-base font-bold text-[#B34728] tabular-nums font-mono-num">
                        ₹{baseOpt.price}
                      </span>
                      <span className="block text-xs text-[#785942]">{baseOpt.containerType}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <a
                        href={getWhatsAppUrl(plant)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366] text-[#128C7E] hover:text-white flex items-center justify-center transition-colors"
                        title="WhatsApp Order"
                      >
                        <MessageCircle className="w-4 h-4 fill-current" />
                      </a>
                      <button
                        type="button"
                        onClick={() => onSelectPlant(plant)}
                        className="px-3 py-1.5 rounded-xl bg-[#142318] hover:bg-[#1B3022] text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <span>{lang === 'bn' ? 'বিবরণ' : 'View'}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
