import { Sprout, ArrowLeft, Phone, MessageCircle } from 'lucide-react';
import { NURSERY_CONTACT } from '../data/brahmyamanCatalog';

interface NotFoundPageProps {
  lang: 'bn' | 'en';
  missingPlantId?: string | null;
  onBackToCatalog: () => void;
}

export function NotFoundPage({
  lang,
  missingPlantId,
  onBackToCatalog,
}: NotFoundPageProps) {
  const inquiryUrl = `https://wa.me/${NURSERY_CONTACT.phoneRaw}?text=${encodeURIComponent(
    missingPlantId
      ? `নমস্কার ভ্রাম্যমাণ নার্সারি, ওয়েবসাইটে '${missingPlantId}' চারাটি খুঁজছিলাম — এটি কি এখন পাওয়া যাবে?`
      : 'নমস্কার ভ্রাম্যমাণ নার্সারি, আমি চারাগাছের তালিকা ও দাম জানতে চাই।'
  )}`;

  return (
    <section className="max-w-2xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center font-sans-bn">
      <div className="bg-white border border-[#D5DFD1] rounded-3xl p-8 sm:p-10 shadow-sm space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-[#EBF1E8] text-[#1B8354] flex items-center justify-center mx-auto">
          <Sprout className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B34728]">
            ৪০৪ · Error 404
          </p>
          <h1 className="font-serif-bn text-2xl sm:text-3xl font-bold text-[#142318]">
            {lang === 'bn'
              ? missingPlantId
                ? 'এই চারাগাছটি বর্তমানে পাওয়া যায়নি'
                : 'দুঃখিত, পাতাটি খুঁজে পাওয়া যায়নি'
              : missingPlantId
              ? 'This sapling listing could not be found'
              : 'Sorry, this page could not be found'}
          </h1>
          <p className="text-sm text-[#526356] max-w-md mx-auto leading-relaxed">
            {lang === 'bn'
              ? missingPlantId
                ? `আপনি যে চারাটি খুঁজছেন (${missingPlantId}) সেটি হয়তো সরানো হয়েছে বা স্টক আপডেট হয়েছে। ক্যাটালগে অন্য সতেজ চারা দেখুন অথবা WhatsApp-এ জিজ্ঞাসা করুন।`
                : 'আপনি যে ঠিকানায় এসেছেন সেটি সঠিক নয় অথবা সরিয়ে নেওয়া হয়েছে। নিচের বাটনে ক্লিক করে মূল চারাগাছের ক্যাটালগে ফিরে যান।'
              : 'The page or sapling link may have moved or been updated. Return to our live nursery catalog or contact us directly on WhatsApp.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onBackToCatalog}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#142318] hover:bg-[#1B8354] text-white text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{lang === 'bn' ? 'সকল চারা ক্যাটালগ দেখুন' : 'Back to Nursery Catalog'}</span>
          </button>

          <a
            href={inquiryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#1B8354]/10 hover:bg-[#1B8354]/20 text-[#142318] border border-[#1B8354]/30 text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-[#1B8354]" />
            <span>{lang === 'bn' ? 'WhatsApp-এ জিজ্ঞাসা করুন' : 'Ask on WhatsApp'}</span>
          </a>
        </div>

        <p className="text-xs text-[#785942] pt-2 border-t border-[#E8EFE4]">
          কালশুলি, লক্ষ্মীসাগর, বাঁকুড়া ৭২২১৬০ ·{' '}
          <a
            href={`tel:${NURSERY_CONTACT.phone}`}
            className="inline-flex items-center gap-1 font-mono font-bold text-[#142318] hover:underline"
          >
            <Phone className="w-3.5 h-3.5 text-[#1B8354]" />
            <span>{NURSERY_CONTACT.phone}</span>
          </a>
        </p>
      </div>
    </section>
  );
}
