import { useState, useRef } from 'react';
import { MapPin, Phone, MessageCircle } from 'lucide-react';
import { NURSERY_CONTACT } from '../data/brahmyamanCatalog';
import { AudienceTag } from '../types/nursery';
import { WindowViewKey } from './Header';

interface FooterProps {
  lang: 'bn' | 'en';
  onSelectAudience: (audience: AudienceTag) => void;
  onOpenAdmin: () => void;
  onNavigateWindow?: (window: WindowViewKey) => void;
}

export function Footer({ lang, onSelectAudience, onOpenAdmin, onNavigateWindow }: FooterProps) {
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<any>(null);

  const handleSecretClick = () => {
    clickCountRef.current += 1;
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);

    if (clickCountRef.current >= 3) {
      clickCountRef.current = 0;
      onOpenAdmin();
    } else {
      clickTimerRef.current = setTimeout(() => {
        clickCountRef.current = 0;
      }, 1500);
    }
  };

  const handleCategoryClick = (audience: AudienceTag) => {
    onSelectAudience(audience);
    if (onNavigateWindow) {
      onNavigateWindow('catalog');
    }
    const el = document.getElementById('catalog');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#141F17] text-[#E8EDE9] border-t border-[#25352A] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-[#25352A]">
          {/* Brand Col */}
          <div className="md:col-span-5 space-y-3">
            <p className="font-serif-bn text-2xl font-bold text-white tracking-wide">
              ভ্রম্যমাণ নার্সারি
            </p>
            <p className="text-xs text-[#A3E635] font-sans-bn font-medium">
              Brahmyaman Nursery · Kalsuli, Bankura
            </p>
            <p className="text-xs text-[#A8BDB0] font-sans-bn leading-relaxed max-w-sm">
              {NURSERY_CONTACT.sublineBn}
            </p>
            <div className="pt-2 text-xs font-sans-bn text-[#CBD5E1] space-y-1">
              <p className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#FF8A65]" />
                <span>কালশুলি গ্রাম, ডাকঘর: কালশুলি, বাঁকুড়া — ৭২২১৬০</span>
              </p>
              <p className="flex items-center gap-2 flex-wrap">
                <Phone className="w-3.5 h-3.5 text-[#A3E635]" />
                <a href={`tel:${NURSERY_CONTACT.phone}`} className="font-mono-num hover:text-white">
                  {NURSERY_CONTACT.phone}
                </a>
              </p>
              <p className="text-[11px] text-[#A8BDB0]">
                {NURSERY_CONTACT.visitingHoursBn} · ১৫ মিনিটে উত্তর
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3 space-y-2.5 font-sans-bn">
            <p className="text-xs font-bold uppercase tracking-wider text-white">
              {lang === 'bn' ? 'গাছপালার বিভাগ' : 'Plant Categories'}
            </p>
            <ul className="space-y-1.5 text-xs text-[#A8BDB0]">
              <li>
                <button
                  type="button"
                  onClick={() => handleCategoryClick('fruit')}
                  className="hover:text-white cursor-pointer"
                >
                  ছাদবাগানের ফল ও কলম
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleCategoryClick('puja')}
                  className="hover:text-white cursor-pointer"
                >
                  পূজার ফুল ও পবিত্র বেলপাতা
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleCategoryClick('flower')}
                  className="hover:text-white cursor-pointer"
                >
                  ছাদ ও বারান্দার ফুলগাছ
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleCategoryClick('foliage')}
                  className="hover:text-white cursor-pointer"
                >
                  গাছপালা, পাম ও শো-প্ল্যান্ট
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleCategoryClick('herbal')}
                  className="hover:text-white cursor-pointer"
                >
                  মসলা ও ভেষজ গাছ
                </button>
              </li>
            </ul>
          </div>

          {/* Direct Ordering & Map */}
          <div className="md:col-span-4 space-y-2.5 font-sans-bn">
            <p className="text-xs font-bold uppercase tracking-wider text-white">
              {lang === 'bn' ? 'যোগাযোগ ও সরাসরি অর্ডার' : 'Direct Contact & Order'}
            </p>
            <div className="space-y-2 text-xs text-[#A8BDB0]">
              <p>WhatsApp বা সরাসরি ফোনে অর্ডার গৃহীত হয়।</p>
              <div className="pt-2 flex flex-wrap gap-2">
                <a
                  href={`https://wa.me/${NURSERY_CONTACT.phoneRaw}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1B8354] hover:bg-[#146c44] text-white font-semibold transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5 fill-current" />
                  <span>WhatsApp অর্ডার</span>
                </a>
                <a
                  href={NURSERY_CONTACT.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#273B2E] hover:bg-[#344D3D] text-[#FFD8C2] font-semibold transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#FF8A65]" />
                  <span>গুগল ম্যাপ লিংক</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#7B9584] font-sans-bn text-center sm:text-left select-none">
          <p>
            <span
              onClick={handleSecretClick}
              className="cursor-default transition-colors hover:text-[#9FB7A7]"
              title=""
            >
              ©
            </span>{' '}
            {new Date().getFullYear()} ভ্রম্যমাণ নার্সারি (Brahmyaman Nursery), কালশুলি, বাঁকুড়া। সর্বস্বত্ব সংরক্ষিত।
          </p>
          
          <div className="flex items-center gap-2">
            <span>পারিবারিক যত্ন ও ন্যায্য মূল্যের প্রতিশ্রুতি।</span>
            <span className="text-[#2F4435]">·</span>
            <span>কালশুলি, পারসোলা, খাতড়া ও সিমলাপাল</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
