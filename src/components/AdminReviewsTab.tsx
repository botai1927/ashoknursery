import { ChangeEvent, FormEvent, useRef, useState } from 'react';
import {
  Star,
  CheckCircle2,
  Trash2,
  Plus,
  Camera,
  MapPin,
  Clock,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import type { BrahmyamanPlant, CustomerReviewItem } from '../types/nursery';
import { resolvePlantImageUrl } from '../utils/imageUrl';
import { PUJA_IMAGE } from '../data/brahmyamanCatalog';
import {
  validateImageFile,
  compressImageFileToDataUrl,
} from '../utils/cloudinaryUpload';

interface AdminReviewsTabProps {
  reviews: CustomerReviewItem[];
  plants: BrahmyamanPlant[];
  isAdminSimpleView: boolean;
  onApproveReview: (reviewId: string, nextStatus: 'approved' | 'pending') => void;
  onDeleteReview: (reviewId: string) => void;
  onAddAdminReview: (newReview: Omit<CustomerReviewItem, 'id' | 'createdAt' | 'createdAtBn'>) => void;
}

export function AdminReviewsTab({
  reviews,
  plants,
  isAdminSimpleView,
  onApproveReview,
  onDeleteReview,
  onAddAdminReview,
}: AdminReviewsTabProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [showAddForm, setShowAddForm] = useState(false);

  const [customerName, setCustomerName] = useState('');
  const [locationBn, setLocationBn] = useState('বিষ্ণুপুর, বাঁকুড়া');
  const [selectedPlantId, setSelectedPlantId] = useState<string>('');
  const [rating, setRating] = useState<number>(5);
  const [commentBn, setCommentBn] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const pendingCount = reviews.filter((r) => r.status === 'pending').length;
  const approvedCount = reviews.filter((r) => r.status === 'approved').length;

  const filteredReviews = reviews.filter((r) => {
    if (filter === 'pending') return r.status === 'pending';
    if (filter === 'approved') return r.status === 'approved';
    return true;
  });

  const handlePhotoFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError(null);
    const check = validateImageFile(file);
    if (!check.ok) {
      setPhotoError(check.errorBn || 'শুধুমাত্র বৈধ ছবির ফাইল (JPG, PNG, WebP) আপলোড করা যাবে।');
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
      setPhotoError(err?.message || 'ছবি প্রসেস করা যায়নি।');
      e.target.value = '';
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !commentBn.trim()) return;
    const matchedPlant = plants.find((p) => p.id === selectedPlantId);
    onAddAdminReview({
      plantId: matchedPlant?.id,
      plantNameBn: matchedPlant?.nameBn || 'নার্সারি চারা',
      customerName: customerName.trim(),
      locationBn: locationBn.trim() || 'বাঁকুড়া',
      rating,
      commentBn: commentBn.trim(),
      photoUrl: photoUrl.trim() || undefined,
      status: 'approved',
    });
    setCustomerName('');
    setCommentBn('');
    setPhotoUrl('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-4">
      {/* Header & Summary */}
      <section className="bg-white border border-[#E8E1D5] rounded-2xl p-4 sm:p-5 space-y-3.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#1B8354]/10 text-[#1B8354] flex items-center justify-center shrink-0">
              <Star className="w-5 h-5" />
            </div>
            <div>
              <h2
                className={`font-serif-bn font-bold text-[#142318] ${
                  isAdminSimpleView ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'
                }`}
              >
                কাস্টমার রিভিউ ও বাগান গ্যালারি অনুমোদন কেন্দ্র
              </h2>
              <p className="text-xs text-[#526356]">
                ক্রেতাদের পাঠানো গাছের ছবি ও রিভিউ ১-ক্লিকে অনুমোদন করুন যাতে প্রতিটি গাছের পেজে ও রিভিউ গ্যালারিতে দেখা যায়
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAddForm((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#1B8354] hover:bg-[#146c44] text-white text-xs font-bold rounded-xl cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{showAddForm ? 'ফর্ম বন্ধ করুন' : 'নতুন কাস্টমার রিভিউ যোগ'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {(
            [
              { id: 'all', label: `সব রিভিউ (${reviews.length})` },
              { id: 'pending', label: `অনুমোদনের অপেক্ষায় (${pendingCount})` },
              { id: 'approved', label: `প্রকাশিত (${approvedCount})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer border transition-colors ${
                filter === tab.id
                  ? 'bg-[#142318] text-white border-[#142318]'
                  : 'bg-[#FAF8F5] text-[#526356] border-[#E8E1D5] hover:bg-[#F3ECE2]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Direct Add Review Form */}
        {showAddForm && (
          <form
            onSubmit={handleSubmit}
            className="p-4 bg-[#FAF8F5] border border-[#D5C9B8] rounded-2xl space-y-3"
          >
            <h3 className="font-serif-bn text-sm font-bold text-[#142318] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#1B8354]" />
              <span>নতুন কাস্টমার রিভিউ ও বাগানের ছবি যোগ করুন</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-[#142318] mb-1">
                  ক্রেতার নাম *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="যেমন: সুব্রত মুখার্জি"
                  className="w-full h-9 px-3 bg-white border border-[#D5C9B8] rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#142318] mb-1">
                  এলাকা / ঠিকানা
                </label>
                <input
                  type="text"
                  value={locationBn}
                  onChange={(e) => setLocationBn(e.target.value)}
                  placeholder="যেমন: কোতুলপুর, বাঁকুড়া"
                  className="w-full h-9 px-3 bg-white border border-[#D5C9B8] rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#142318] mb-1">
                  কোন গাছ? (ঐচ্ছিক)
                </label>
                <select
                  value={selectedPlantId}
                  onChange={(e) => setSelectedPlantId(e.target.value)}
                  className="w-full h-9 px-2.5 bg-white border border-[#D5C9B8] rounded-xl text-xs font-semibold"
                >
                  <option value="">সাধারণ নার্সারি রিভিউ</option>
                  {plants.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nameBn} ({p.category})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#142318] mb-1">
                ক্রেতার মতামত *
              </label>
              <textarea
                rows={2}
                required
                value={commentBn}
                onChange={(e) => setCommentBn(e.target.value)}
                placeholder="চারার মান, ফুল/ফল ও নার্সারির পরিষেবা নিয়ে ক্রেতার অভিজ্ঞতা..."
                className="w-full p-2.5 bg-white border border-[#D5C9B8] rounded-xl text-xs"
              />
            </div>

            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/heic,image/heif"
                  onChange={handlePhotoFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-white border border-[#D5C9B8] rounded-xl text-xs font-bold text-[#142318] inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 text-[#1B8354]" />
                  <span>{photoUrl ? 'ছবি যুক্ত হয়েছে ✓' : 'বাগানের ছবি যুক্ত করুন'}</span>
                </button>

                <select
                  aria-label="রেটিং"
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="h-8 px-2 bg-white border border-[#D5C9B8] rounded-lg text-xs font-bold text-[#142318]"
                >
                  <option value={5}>★★★★★ (৫/৫)</option>
                  <option value={4}>★★★★☆ (৪/৫)</option>
                </select>
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-[#1B8354] hover:bg-[#146c44] text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                সরাসরি ওয়েবসাইটে প্রকাশ করুন
              </button>
            </div>
            {photoError && (
              <p className="text-xs font-bold text-[#B34728]">{photoError}</p>
            )}
          </form>
        )}
      </section>

      {/* Review List */}
      <div className="space-y-2.5">
        {filteredReviews.length === 0 ? (
          <div className="bg-white border border-[#E8E1D5] rounded-2xl p-8 text-center text-xs text-[#785942]">
            এই ফিল্টারে কোনো কাস্টমার রিভিউ নেই।
          </div>
        ) : (
          filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className={`bg-white border rounded-2xl p-4 flex flex-col sm:flex-row gap-3.5 items-start justify-between ${
                rev.status === 'pending'
                  ? 'border-[#F59E0B] bg-[#FFFDF7]'
                  : 'border-[#E8E1D5]'
              }`}
            >
              <div className="flex gap-3 items-start flex-1 min-w-0">
                {rev.photoUrl && (
                  <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-[#EAE4D9] border border-[#DDD5C7] shrink-0">
                    <img
                      src={resolvePlantImageUrl(rev.photoUrl, PUJA_IMAGE)}
                      alt={rev.plantNameBn || rev.customerName}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-serif-bn text-sm font-bold text-[#142318]">
                      {rev.customerName}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-[#526356]">
                      <MapPin className="w-3 h-3 text-[#1B8354]" />
                      <span>{rev.locationBn}</span>
                    </span>
                    {rev.plantNameBn && (
                      <span className="px-2 py-0.5 rounded bg-[#EBF5EF] text-[#14532D] text-xs font-bold">
                        চারা: {rev.plantNameBn}
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-bold ${
                        rev.status === 'approved'
                          ? 'bg-[#F0FDF4] text-[#166534]'
                          : 'bg-[#FEF3C7] text-[#92400E]'
                      }`}
                    >
                      {rev.status === 'approved' ? '✓ প্রকাশিত' : '⏳ অনুমোদনের অপেক্ষায়'}
                    </span>
                  </div>

                  <p className="text-xs text-[#142318] leading-relaxed">{rev.commentBn}</p>

                  <p className="text-xs font-mono text-[#785942] flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#1B8354]" />
                    <span>{rev.createdAtBn}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                {rev.status === 'pending' ? (
                  <button
                    type="button"
                    onClick={() => onApproveReview(rev.id, 'approved')}
                    className="px-3 py-1.5 bg-[#1B8354] hover:bg-[#146c44] text-white rounded-xl text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>অনুমোদন করুন</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onApproveReview(rev.id, 'pending')}
                    className="px-3 py-1.5 bg-[#FAF8F5] hover:bg-[#EFEAE0] border border-[#D5C9B8] text-[#526356] rounded-xl text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>লুকান</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onDeleteReview(rev.id)}
                  className="p-2 bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#B34728] rounded-xl cursor-pointer"
                  title="রিভিউ মুছুন"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
