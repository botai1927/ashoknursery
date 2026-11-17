import { MapPin, Phone, MessageCircle, Clock, Navigation, CheckCircle2, ShieldCheck } from 'lucide-react';
import { NURSERY_CONTACT } from '../data/brahmyamanCatalog';

interface LocationSectionProps {
  lang: 'bn' | 'en';
}

export function LocationSection({ lang }: LocationSectionProps) {
  const whatsappUrl = `https://wa.me/${NURSERY_CONTACT.phoneRaw}?text=${encodeURIComponent(
    'নমস্কার, আমি কালশুলির ভ্রাম্যমাণ নার্সারির লোকেশন ও পরিদর্শন সময় নিয়ে জানতে চাই।'
  )}`;

  return (
    <section id="location-section" className="py-14 sm:py-20 bg-white border-t border-[#D5DFD1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Direct Address & Contact Card */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B34728]/10 text-[#B34728] text-xs font-semibold mb-2 font-sans-bn">
                <MapPin className="w-3.5 h-3.5" />
                <span>কালশুলি, বাঁকুড়া · Kalsuli, Bankura</span>
              </div>
              <h2
                className="font-serif-bn text-2xl sm:text-4xl text-[#142318] font-normal tracking-tight"
                style={{ textWrap: 'balance' }}
              >
                {lang === 'bn' ? 'নার্সারিতে সরাসরি আসুন অথবা WhatsApp-এ অর্ডার করুন' : 'Visit Us in Kalsuli or Order via WhatsApp'}
              </h2>
              {/* Exact subline */}
              <p className="text-xs sm:text-sm font-semibold text-[#B34728] font-sans-bn mt-2">
                {NURSERY_CONTACT.sublineBn}
              </p>
              <p className="text-xs sm:text-sm text-[#526356] font-sans-bn mt-2 leading-relaxed">
                {lang === 'bn'
                  ? 'কালশুলি গ্রামে অবস্থিত আমাদের পারিবারিক নার্সারিতে নিজে উপস্থিত হয়ে সতেজ চারা ও কলমের গাছ পছন্দ করতে পারেন, কিংবা ফোনে সরাসরি জানিয়ে বাড়ি বসেই বুক করতে পারেন।'
                  : 'Come by our family grounds in Kalsuli village to handpick your plants and grafted saplings, or book directly over phone and WhatsApp.'}
              </p>
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1B8354]/10 text-[#1B8354] text-xs font-semibold font-sans-bn">
                <span>🚚 পরিষেবা অঞ্চল: কালশুলি, পারসোলা, খাতড়া ও সিমলাপাল</span>
              </div>
            </div>

            {/* Address Details Box */}
            <div className="p-6 rounded-2xl bg-[#F3F6F1] border border-[#D5DFD1] space-y-4 font-sans-bn text-xs sm:text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#B34728] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#142318]">ঠিকানা (Address)</p>
                  <p className="text-[#526356] mt-0.5">
                    গ্রাম ও ডাকঘর: কালশুলি, জেলা: বাঁকুড়া, পশ্চিমবঙ্গ, পিনকোড: ৭২২১৬০
                  </p>
                  <p className="text-[#785942] text-xs mt-0.5">
                    Kalsuli Village, Bankura, West Bengal - 722160
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-[#1B8354] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#142318]">পরিদর্শন সময় (Visiting Hours)</p>
                  <p className="text-[#526356] mt-0.5">{NURSERY_CONTACT.visitingHoursBn}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-[#0369A1] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-[#142318]">সরাসরি ফোন ও WhatsApp</p>
                  <a href={`tel:${NURSERY_CONTACT.phone}`} className="text-[#142318] font-bold font-mono-num text-sm hover:text-[#1B8354] inline-block">
                    {NURSERY_CONTACT.phone}
                  </a>
                  <p className="text-xs text-[#1B8354] font-semibold">
                    ⏱️ {NURSERY_CONTACT.responsePromiseBn}
                  </p>
                </div>
              </div>
            </div>

            {/* Direct Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <a
                href={NURSERY_CONTACT.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#142318] hover:bg-[#233327] text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                <Navigation className="w-4 h-4 text-[#A3E635]" />
                <span>গুগল ম্যাপে লোকেশন দেখুন (Google Maps)</span>
              </a>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#1B8354] hover:bg-[#146c44] text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>WhatsApp চ্যাট</span>
              </a>
            </div>
          </div>

          {/* Right Column: Authentic Map Card & Fair Practice Values */}
          <div className="lg:col-span-6 space-y-6">
            <div className="p-6 sm:p-8 rounded-2xl bg-[#EBF1E8] border border-[#D5DFD1] space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif-bn text-xl font-bold text-[#142318]">
                    {lang === 'bn' ? 'কীভাবে পৌঁছাবেন?' : 'How to Reach Us?'}
                  </h3>
                  <p className="text-xs text-[#785942] font-sans-bn mt-0.5">
                    কালশুলি গ্রাম, বাঁকুড়া (Kalsuli Village)
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#B34728] shadow-xs">
                  <MapPin className="w-5 h-5" />
                </div>
              </div>

              <div className="space-y-3 font-sans-bn text-xs sm:text-sm text-[#526356]">
                <p className="leading-relaxed">
                  • বাঁকুড়া শহর থেকে কালশুলি আসার সহজ পথ রয়েছে। স্থানীয় টোটো বা বাইক/গাড়িতে সহজেই নার্সারির সামনে চলে আসা যায়।
                </p>
                <p className="leading-relaxed">
                  • <strong className="text-[#142318]">সাপ্তাহিক রুট ডেলিভারি (মঙ্গল ও শুক্রবার):</strong> খাতড়া ও সিমলাপাল দূরবর্তী হওয়ায় ন্যূনতম ₹২৫০-এর অর্ডারে ভ্যান/অটো রুটে সুরক্ষিতভাবে চারা পৌঁছে দেওয়া হয়।
                </p>
                <p className="leading-relaxed">
                  • আসার পূর্বে ফোন বা WhatsApp করে জানালে পছন্দের চারা ও কলমের গাছ আগে থেকেই প্রস্তুত রাখা সম্ভব হয়।
                </p>
              </div>

              <div className="pt-4 border-t border-[#CEDAC9] space-y-3">
                <p className="text-xs font-bold text-[#142318] uppercase tracking-wider font-sans-bn">
                  {lang === 'bn' ? 'আমাদের নার্সারির অঙ্গীকার (Our Promise):' : 'Our Promise:'}
                </p>
                <div className="space-y-2 font-sans-bn text-xs sm:text-sm text-[#142318]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#1B8354] shrink-0" />
                    <span>১০০% সুস্থ শিকড় ও বাঁকুড়ার মাটিতে মানানসই জাত</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#1B8354] shrink-0" />
                    <span>কোনো দালালি বা মধ্যস্থতাকারী নেই — সরাসরি নার্সারির ন্যায্য দাম</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#B34728] shrink-0" />
                    <span>গাছের রোপণ ও মাটি তৈরির সম্পূর্ণ প্রাথমিক পরামর্শ বিনামূল্যে</span>
                  </div>
                </div>
              </div>

              <a
                href={NURSERY_CONTACT.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center py-2.5 px-4 bg-white hover:bg-[#E4ECE0] border border-[#CEDAC9] text-xs sm:text-sm font-semibold text-[#142318] rounded-xl transition-colors cursor-pointer"
              >
                https://maps.app.goo.gl/zLQBxPHZKqK9ofLJ8 ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
