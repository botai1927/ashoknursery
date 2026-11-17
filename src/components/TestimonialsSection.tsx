import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import {
  Star,
  Quote,
  CheckCircle2,
  MapPin,
  Camera,
  Plus,
  Send,
  X,
} from 'lucide-react';
import { PUJA_IMAGE } from '../data/brahmyamanCatalog';
import { resolvePlantImageUrl } from '../utils/imageUrl';
import type { CustomerReviewItem } from '../types/nursery';
import {
  loadLocalCustomerReviews,
  submitCustomerReview,
} from '../utils/customerReviewsStorage';

interface TestimonialsSectionProps {
  lang: 'bn' | 'en';
}

export function TestimonialsSection({ lang }: TestimonialsSectionProps) {
  const [allReviews, setAllReviews] = useState<CustomerReviewItem[]>(() =>
    loadLocalCustomerReviews()
  );
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [locationBn, setLocationBn] = useState('');
  const [plantNameBn, setPlantNameBn] = useState('');
  const [commentBn, setCommentBn] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [photoUrl, setPhotoUrl] = useState('');
  const [submittedNotice, setSubmittedNotice] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const sync = () => setAllReviews(loadLocalCustomerReviews());
    window.addEventListener('brahmyaman-reviews-updated', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('brahmyaman-reviews-updated', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const approvedReviews = allReviews.filter((r) => r.status === 'approved');

  const handlePhotoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPhotoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleReviewSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !commentBn.trim()) return;
    await submitCustomerReview({
      customerName: customerName.trim(),
      locationBn: locationBn.trim() || 'বাঁকুড়া',
      plantNameBn: plantNameBn.trim() || 'নার্সারি চারা',
      rating,
      commentBn: commentBn.trim(),
      photoUrl: photoUrl || undefined,
      status: 'pending',
    });
    setCustomerName('');
    setLocationBn('');
    setPlantNameBn('');
    setCommentBn('');
    setPhotoUrl('');
    setShowSubmitForm(false);
    setSubmittedNotice(true);
    setTimeout(() => setSubmittedNotice(false), 6000);
  };

  return (
    <section
      id="section-testimonials"
      className="py-16 bg-[#EBF1E8] border-b border-[#D5DFD1] scroll-mt-16"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1B8354]/10 text-[#1B8354] text-xs font-semibold mb-2 font-sans-bn">
            <Quote className="w-3.5 h-3.5" />
            <span>গ্রাহকদের অভিজ্ঞতা ও বাগান গ্যালারি · Customer Reviews</span>
          </div>
          <h2 className="font-serif-bn text-2xl sm:text-4xl text-[#142318] font-normal tracking-tight">
            {lang === 'bn'
              ? 'কালশুলি, পারসোলা, খাতড়া ও সিমলাপালের উদ্যানপ্রেমীদের মতামত'
              : 'Feedback from Gardeners in Kalsuli, Parsola, Khatra & Simlapal'}
          </h2>
          <p className="text-xs sm:text-sm text-[#526356] mt-2 font-sans-bn">
            {lang === 'bn'
              ? 'আমাদের নার্সারির সতেজ চারা ও কলমের গাছ নিয়ে ছাদবাগান ও পুজো সাজিয়েছেন যারা, তাদের বাস্তব ছবি ও অভিজ্ঞতা।'
              : 'Real photos and feedback from local gardeners who trust our family nursery.'}
          </p>

          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={() => setShowSubmitForm((prev) => !prev)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1B8354] hover:bg-[#146c44] text-white text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer font-sans-bn"
            >
              {showSubmitForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>
                {showSubmitForm
                  ? 'ফর্ম বন্ধ করুন'
                  : 'আপনার বাগানের গাছের ছবি ও মতামত পাঠান'}
              </span>
            </button>
          </div>

          {submittedNotice && (
            <div className="mt-4 p-3 rounded-xl bg-[#F0FDF4] border border-[#86EFAC] text-xs font-bold text-[#166534] font-sans-bn">
              ধন্যবাদ! আপনার রিভিউ ও গাছের ছবি জমা হয়েছে। অ্যাডমিন অনুমোদনের পর ওয়েবসাইটে প্রকাশিত হবে।
            </div>
          )}
        </div>

        {/* Customer Review & Garden Photo Submission Drawer */}
        {showSubmitForm && (
          <form
            onSubmit={handleReviewSubmit}
            className="max-w-2xl mx-auto mb-10 bg-white border border-[#D5DFD1] rounded-2xl p-5 sm:p-6 shadow-sm space-y-4 font-sans-bn"
          >
            <h3 className="font-serif-bn text-lg font-bold text-[#142318]">
              আপনার ছাদবাগান বা উঠোনের গাছের ছবি ও মতামত শেয়ার করুন
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#142318] mb-1">
                  আপনার নাম *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="যেমন: অরিন্দম সেন"
                  className="w-full h-10 px-3 bg-[#F3F6F1] border border-[#CEDAC9] rounded-xl text-xs text-[#142318]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#142318] mb-1">
                  আপনার গ্রাম / শহর
                </label>
                <input
                  type="text"
                  value={locationBn}
                  onChange={(e) => setLocationBn(e.target.value)}
                  placeholder="যেমন: খাতড়া, বাঁকুড়া"
                  className="w-full h-10 px-3 bg-[#F3F6F1] border border-[#CEDAC9] rounded-xl text-xs text-[#142318]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#142318] mb-1">
                  কোন গাছ নিয়েছিলেন?
                </label>
                <input
                  type="text"
                  value={plantNameBn}
                  onChange={(e) => setPlantNameBn(e.target.value)}
                  placeholder="যেমন: আম্রপালী আম, রক্তজবা"
                  className="w-full h-10 px-3 bg-[#F3F6F1] border border-[#CEDAC9] rounded-xl text-xs text-[#142318]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#142318] mb-1">
                আপনার অভিজ্ঞতা লিখুন *
              </label>
              <textarea
                rows={3}
                required
                value={commentBn}
                onChange={(e) => setCommentBn(e.target.value)}
                placeholder="গাছের বৃদ্ধি, ফুল বা ফল কেমন হচ্ছে তা জানান..."
                className="w-full p-3 bg-[#F3F6F1] border border-[#CEDAC9] rounded-xl text-xs text-[#142318]"
              />
            </div>

            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2 bg-[#F3F6F1] hover:bg-[#E4ECE0] border border-[#CEDAC9] rounded-xl text-xs font-bold text-[#142318] inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-[#1B8354]" />
                  <span>{photoUrl ? 'গাছের ছবি যুক্ত হয়েছে ✓' : 'গাছের ছবি যোগ করুন'}</span>
                </button>

                <select
                  aria-label="রেটিং"
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="h-9 px-2.5 bg-[#F3F6F1] border border-[#CEDAC9] rounded-xl text-xs font-bold text-[#142318]"
                >
                  <option value={5}>★★★★★ (৫ স্টার)</option>
                  <option value={4}>★★★★☆ (৪ স্টার)</option>
                </select>
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-[#1B8354] hover:bg-[#146c44] text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>রিভিউ জমা দিন</span>
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {approvedReviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white rounded-2xl border border-[#D5DFD1] p-6 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-1 text-[#F59E0B] mb-4">
                  {[...Array(Math.min(5, Math.max(1, rev.rating || 5)))].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>

                {rev.photoUrl && (
                  <div className="mb-4 aspect-[16/10] rounded-xl overflow-hidden bg-[#EBF1E8] border border-[#D5DFD1]">
                    <img
                      src={resolvePlantImageUrl(rev.photoUrl, PUJA_IMAGE)}
                      alt={rev.plantNameBn || rev.customerName}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}

                <p className="font-serif-bn text-sm sm:text-base text-[#142318] leading-relaxed italic mb-6">
                  "{rev.commentBn}"
                </p>
              </div>

              <div>
                <div className="pt-4 border-t border-[#DFE7DC] flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-serif-bn font-bold text-sm text-[#142318]">
                      {rev.customerName}
                    </h3>
                    <p className="text-[11px] text-[#785942] flex items-center gap-1 font-sans-bn">
                      <MapPin className="w-3 h-3 text-[#B34728]" />
                      <span>{rev.locationBn}</span>
                    </p>
                  </div>

                  {rev.plantNameBn && (
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#1B8354] bg-[#1B8354]/10 px-2.5 py-1 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{rev.plantNameBn}</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
