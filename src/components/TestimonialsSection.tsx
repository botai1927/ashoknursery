import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import {
  Star,
  Quote,
  CheckCircle2,
  MapPin,
  Camera,
  Plus,
  Send,
  X,
  AlertCircle,
} from 'lucide-react';
import { loadFirebaseAuthSdk, loadFirebaseCore } from '../firebaseLazy';
import { ReviewGoogleAuthBanner } from './ReviewGoogleAuthBanner';
import { PUJA_IMAGE } from '../data/brahmyamanCatalog';
import { resolvePlantImageUrl } from '../utils/imageUrl';
import type { CustomerReviewItem } from '../types/nursery';
import {
  loadLocalCustomerReviews,
  subscribeToApprovedCustomerReviews,
  submitCustomerReview,
} from '../utils/customerReviewsStorage';
import {
  validateImageFile,
  compressImageFileToDataUrl,
} from '../utils/cloudinaryUpload';
import {
  createBengaliMathPuzzle,
  normalizeBengaliNumberInput,
} from '../utils/publicChallengeClient';

interface TestimonialsSectionProps {
  lang: 'bn' | 'en';
}

export function TestimonialsSection({ lang }: TestimonialsSectionProps) {
  const [approvedReviews, setApprovedReviews] = useState<CustomerReviewItem[]>(() =>
    loadLocalCustomerReviews().filter((r) => r.status === 'approved')
  );
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [locationBn, setLocationBn] = useState('');
  const [plantNameBn, setPlantNameBn] = useState('');
  const [commentBn, setCommentBn] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [photoUrl, setPhotoUrl] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [mathPuzzle, setMathPuzzle] = useState(() => createBengaliMathPuzzle());
  const [mathInput, setMathInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedNotice, setSubmittedNotice] = useState(false);
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let disposed = false;
    let unsubscribeAuth: (() => void) | undefined;
    void Promise.all([loadFirebaseCore(), loadFirebaseAuthSdk()])
      .then(([{ auth }, { onAuthStateChanged }]) => {
        if (disposed) return;
        setAuthUser(auth.currentUser);
        unsubscribeAuth = onAuthStateChanged(auth, (user) => {
          if (disposed) return;
          setAuthUser(user);
          if (user?.displayName) {
            setCustomerName((prev) => (prev.trim() ? prev : user.displayName || ''));
          }
        });
      })
      .catch(() => {});

    const unsubscribeFirestore = subscribeToApprovedCustomerReviews((remoteApproved) => {
      setApprovedReviews(remoteApproved);
    });
    const syncLocal = () =>
      setApprovedReviews(loadLocalCustomerReviews().filter((r) => r.status === 'approved'));
    window.addEventListener('brahmyaman-reviews-updated', syncLocal);
    window.addEventListener('storage', syncLocal);
    return () => {
      disposed = true;
      unsubscribeAuth?.();
      unsubscribeFirestore();
      window.removeEventListener('brahmyaman-reviews-updated', syncLocal);
      window.removeEventListener('storage', syncLocal);
    };
  }, []);

  const handlePhotoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubmitError(null);
    const check = validateImageFile(file);
    if (!check.ok) {
      setSubmitError(check.errorBn || 'শুধুমাত্র বৈধ ছবি (JPG, PNG, WebP) আপলোড করা যাবে।');
      e.target.value = '';
      return;
    }
    try {
      const compressed = await compressImageFileToDataUrl(file, {
        maxWidth: 900,
        maxHeight: 900,
        quality: 0.78,
      });
      setPhotoUrl(compressed);
    } catch (err: any) {
      setSubmitError(err?.message || 'ছবি প্রসেস করা যায়নি। আরেকটি ছবি চেষ্টা করুন।');
      e.target.value = '';
    }
  };

  const handleReviewSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!authUser) {
      setSubmitError('রিভিউ জমা দিতে আগে Google অ্যাকাউন্ট দিয়ে সাইন-ইন করুন।');
      return;
    }
    if (!customerName.trim() || !commentBn.trim() || isSubmitting) return;
    const parsedAnswer = normalizeBengaliNumberInput(mathInput);
    if (parsedAnswer === null || parsedAnswer !== mathPuzzle.answer) {
      setSubmitError('সহজ যোগফলের উত্তরটি সঠিক হয়নি। অনুগ্রহ করে আবার লিখুন।');
      setMathPuzzle(createBengaliMathPuzzle());
      setMathInput('');
      return;
    }
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await submitCustomerReview({
        customerName: customerName.trim(),
        locationBn: locationBn.trim() || 'বাঁকুড়া',
        plantNameBn: plantNameBn.trim() || 'নার্সারি চারা',
        rating,
        commentBn: commentBn.trim(),
        photoUrl: photoUrl || undefined,
        status: 'pending',
        honeypot,
      });
      setCustomerName('');
      setLocationBn('');
      setPlantNameBn('');
      setCommentBn('');
      setPhotoUrl('');
      setHoneypot('');
      setMathInput('');
      setMathPuzzle(createBengaliMathPuzzle());
      setShowSubmitForm(false);
      setSubmittedNotice(true);
      setTimeout(() => setSubmittedNotice(false), 6000);
    } catch (err: any) {
      setSubmitError(err?.message || 'রিভিউ জমা দেওয়া যায়নি। কিছুক্ষণ পর আবার চেষ্টা করুন।');
    } finally {
      setIsSubmitting(false);
    }
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
              onClick={() => {
                setSubmitError(null);
                setShowSubmitForm((prev) => !prev);
              }}
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
          <div className="max-w-2xl mx-auto mb-10 bg-white border border-[#D5DFD1] rounded-2xl p-5 sm:p-6 shadow-sm space-y-4 font-sans-bn">
            <h3 className="font-serif-bn text-lg font-bold text-[#142318]">
              আপনার ছাদবাগান বা উঠোনের গাছের ছবি ও মতামত শেয়ার করুন
            </h3>

            <ReviewGoogleAuthBanner
              user={authUser}
              onUserSignedIn={(signedIn) => {
                setAuthUser(signedIn);
                setSubmitError(null);
                if (signedIn.displayName) {
                  setCustomerName((prev) => (prev.trim() ? prev : signedIn.displayName || ''));
                }
              }}
            />

            {authUser && (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                {/* Anti-bot honeypot field */}
                <div className="sr-only" aria-hidden="true">
                  <label htmlFor="review-website-hp">Website</label>
                  <input
                    id="review-website-hp"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                  />
                </div>

                {submitError && (
                  <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs font-bold text-[#B34728] flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#142318] mb-1">
                      আপনার নাম *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={120}
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
                      maxLength={160}
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
                      maxLength={200}
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
                    maxLength={1500}
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
                      accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/heic,image/heif"
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

                    <label className="inline-flex items-center gap-1.5 bg-[#F3F6F1] border border-[#CEDAC9] rounded-xl px-2.5 h-9 text-xs font-bold text-[#142318]">
                      <span>যাচাই: {mathPuzzle.questionBn}</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        required
                        maxLength={4}
                        value={mathInput}
                        onChange={(e) => setMathInput(e.target.value)}
                        placeholder="উত্তর"
                        className="w-12 h-7 px-1.5 bg-white border border-[#CEDAC9] rounded-lg text-center text-xs font-bold text-[#142318]"
                      />
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-[#1B8354] hover:bg-[#146c44] disabled:opacity-60 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'জমা হচ্ছে...' : 'রিভিউ জমা দিন'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {approvedReviews.length === 0 ? (
          <div className="max-w-xl mx-auto bg-white rounded-2xl border border-[#D5DFD1] p-6 sm:p-8 text-center space-y-3 font-sans-bn">
            <p className="font-serif-bn text-lg font-bold text-[#142318]">
              {lang === 'bn'
                ? 'এখনও কোনো প্রকাশিত ক্রেতা রিভিউ নেই'
                : 'No published customer reviews yet'}
            </p>
            <p className="text-xs sm:text-sm text-[#526356] leading-relaxed">
              {lang === 'bn'
                ? 'আমাদের নার্সারি থেকে চারা নিয়ে আপনার বাগানে কেমন বাড়ছে তার আসল ছবি ও অভিজ্ঞতা উপরের বোতামে ক্লিক করে পাঠাতে পারেন।'
                : 'Purchased saplings from our Kalsuli nursery? Share a real photo and your honest feedback using the button above.'}
            </p>
          </div>
        ) : (
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
                        decoding="async"
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
                      <p className="text-xs text-[#785942] flex items-center gap-1 font-sans-bn">
                        <MapPin className="w-3 h-3 text-[#B34728]" />
                        <span>{rev.locationBn}</span>
                      </p>
                    </div>

                    {rev.plantNameBn && (
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#1B8354] bg-[#1B8354]/10 px-2.5 py-1 rounded-full">
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
        )}
      </div>
    </section>
  );
}
