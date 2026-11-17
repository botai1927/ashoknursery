import { ArrowRight, Flower2, Home, SunMedium } from 'lucide-react';
import { AudienceTag } from '../types/nursery';
import { PUJA_IMAGE, FRUIT_IMAGE, ROOFTOP_IMAGE } from '../data/brahmyamanCatalog';

interface AudienceShowcaseProps {
  lang: 'bn' | 'en';
  onSelectAudience: (tag: AudienceTag) => void;
}

export function AudienceShowcase({ lang, onSelectAudience }: AudienceShowcaseProps) {
  const cards = [
    {
      id: 'puja' as AudienceTag,
      titleBn: 'নিত্য দেবপূজার পবিত্র ফুল ও বেলপাতা',
      titleEn: 'Sacred Flowers & Holy Bilwapatra for Daily Puja',
      subBn: 'রক্তজবা, কৃষ্ণ তুলসী, ত্রিমুখী বেলপাতা, শিউলি ও অপরাজিতা',
      subEn: 'Red Hibiscus, Sacred Tulsi, Shiva Bael, Shiuli & Aparajita',
      descBn:
        'প্রতিদিন সকালে নিজের গাছের টাটকা ফুল ও অক্ষত বেলপাতা দিয়ে ঠাকুরের পুজো দেওয়ার আনন্দই আলাদা। আমাদের চারাগুলো সুস্থ শিকড়ে দ্রুত কুঁড়ি দেওয়ার জন্য বিশেষ পরিচর্যায় তৈরি।',
      descEn:
        'Experience the spiritual joy of offering fresh, homegrown sacred flowers and clean trifoliate bael leaves for your daily home puja altar.',
      image: PUJA_IMAGE,
      btnBn: 'পূজার গাছগুলো দেখুন',
      btnEn: 'View Puja Plants',
      accentColor: 'border-[#B34728]/40 hover:border-[#B34728]',
      badgeBg: 'bg-[#B34728] text-white',
      badgeText: 'নিত্য পুজো',
      icon: Flower2,
    },
    {
      id: 'rooftop' as AudienceTag,
      titleBn: 'ছাদবাগানের বারোমাসি ফল ও রঙিন বাগানবিলাস',
      titleEn: 'Rooftop Fruit Grafts & Cascading Bougainvillea',
      subBn: 'বারোমাসি কাগজি লেবু, আম্রপালী ও কাটিমন আম, থাই পেয়ারা, এডেনিয়াম',
      subEn: 'All-season Lemon, Katimon Mango, Thai Guava, Bougainvillea',
      descBn:
        'ছাদের খাঁ খাঁ রোদে ছাদবাগানে ফলানো উপযোগী ছোট আকারের কলমের ফলের গাছ। কম মাটিতেই সারা বছর প্রচুর লেবু, ডালিম ও মিষ্টি আম ধরে। সাথে বহু রঙের চোখজুড়ানো বাগানবিলাস।',
      descEn:
        'Compact grafted saplings specially hardened for blazing rooftop sunshine in containers. Enjoy year-round lemons, sweet mangoes, and vibrant blooms.',
      image: ROOFTOP_IMAGE,
      btnBn: 'ছাদবাগানের তালিকা দেখুন',
      btnEn: 'View Rooftop Collection',
      accentColor: 'border-[#2D6A4F]/40 hover:border-[#2D6A4F]',
      badgeBg: 'bg-[#2D6A4F] text-white',
      badgeText: 'ছাদবাগান',
      icon: SunMedium,
    },
    {
      id: 'family' as AudienceTag,
      titleBn: 'পারিবারিক উঠোন, সীমানা ও গৃহস্থের বাগান',
      titleEn: 'Local Village & Town Family Courtyard Gardens',
      subBn: 'ছায়াতরু, মিষ্টি দেশি ফল, ভেষজ ও সুগন্ধি মসলা চারা',
      subEn: 'Shade trees, sweet country fruits, herbal plants & aromatic spices',
      descBn:
        'কালশুলি ও আশপাশের প্রতিটি পরিবারের উঠোনে সবুজ প্রাণ। কোনো কৃত্রিম কেমিক্যাল ছাড়া সহজ পরিচর্যায় দীর্ঘস্থায়ীভাবে বেড়ে ওঠার খাঁটি দেশি চারা ও কলমের গাছ।',
      descEn:
        'Bred with natural resilience for the red laterite soil of Bankura. Sustainable native saplings, organic nutrition, and healthy root systems for families.',
      image: FRUIT_IMAGE,
      btnBn: 'পারিবারিক গাছ দেখুন',
      btnEn: 'View Family Garden Plants',
      accentColor: 'border-[#785942]/40 hover:border-[#785942]',
      badgeBg: 'bg-[#785942] text-white',
      badgeText: 'গৃহস্থ বাগান',
      icon: Home,
    },
  ];

  return (
    <section className="py-14 sm:py-20 bg-[#EBF1E8] border-b border-[#D5DFD1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs font-semibold tracking-wider text-[#B34728] uppercase font-sans-bn">
            {lang === 'bn' ? 'কাদের জন্য আমাদের নার্সারি?' : 'Curated for Bankura’s Gardeners'}
          </p>
          <h2
            className="font-serif-bn text-2xl sm:text-4xl text-[#142318] font-normal tracking-tight mt-1.5"
            style={{ textWrap: 'balance' }}
          >
            {lang === 'bn'
              ? 'পূজার উপচার, ছাদের বাগান কিংবা পারিবারিক উঠোন'
              : 'Sacred Puja Offerings, Terrace Gardens & Family Courtyards'}
          </h2>
          <p className="text-sm sm:text-base text-[#526356] mt-3 font-sans-bn leading-relaxed">
            {lang === 'bn'
              ? 'কালশুলির লাল মাটির জলবায়ুতে অভ্যস্ত চারা—সহজ পরিচর্যায় বাঁকুড়ার ঘরে ঘরে দীর্ঘায়ু হয়।'
              : 'Acclimatized directly in Kalsuli’s natural environment to thrive without chemical fuss.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                className={`group bg-white rounded-2xl border ${card.accentColor} overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between`}
              >
                <div>
                  {/* Photo Banner with subtle zoom */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-[#DCE7D7]">
                    <img
                      src={card.image}
                      alt={card.titleBn}
                      className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                    <div className="absolute top-3 left-3">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shadow-xs ${card.badgeBg}`}>
                        <Icon className="w-3.5 h-3.5" />
                        <span>{card.badgeText}</span>
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6">
                    <h3 className="font-serif-bn text-xl font-bold text-[#142318] group-hover:text-[#1B8354] transition-colors leading-snug">
                      {lang === 'bn' ? card.titleBn : card.titleEn}
                    </h3>
                    <p className="text-xs font-semibold text-[#B34728] mt-1.5 font-sans-bn">
                      {lang === 'bn' ? card.subBn : card.subEn}
                    </p>
                    <p className="text-sm text-[#526356] mt-3 font-sans-bn leading-relaxed">
                      {lang === 'bn' ? card.descBn : card.descEn}
                    </p>
                  </div>
                </div>

                <div className="px-6 pb-6 pt-2">
                  <button
                    type="button"
                    onClick={() => onSelectAudience(card.id)}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-[#CEDAC9] bg-[#F3F6F1] hover:bg-[#142318] hover:text-white text-[#142318] text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer"
                  >
                    <span>{lang === 'bn' ? card.btnBn : card.btnEn}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
