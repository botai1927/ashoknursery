import { Trash2, ShieldCheck, Clock, RefreshCw } from 'lucide-react';
import type { BrahmyamanPlant } from '../types/nursery';
import { PUJA_IMAGE } from '../data/brahmyamanCatalog';
import { resolvePlantImageUrl } from '../utils/imageUrl';
import { calculateTrashDaysRemaining } from '../utils/bengaliDateTime';

interface AdminTrashTabProps {
  trashedPlants: BrahmyamanPlant[];
  isAdminSimpleView: boolean;
  isOwner: boolean;
  onRestore: (plant: BrahmyamanPlant) => void;
  onPermanentDelete: (plant: BrahmyamanPlant) => void;
  onEmptyAllTrash: () => void;
}

export function AdminTrashTab({
  trashedPlants,
  isAdminSimpleView,
  isOwner,
  onRestore,
  onPermanentDelete,
  onEmptyAllTrash,
}: AdminTrashTabProps) {
  return (
    <div className="space-y-4">
      <section className="bg-white border border-[#F3C7BC] rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FEF2F2] text-[#B34728] flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif-bn text-base sm:text-lg font-bold text-[#142318]">
                ডিজিটাল ট্র্যাশ বিন ({trashedPlants.length} টি)
              </h2>
              <p className="text-[11px] text-[#785942]">
                মুছে ফেলা চারা ৩০ দিন পর্যন্ত সুরক্ষিত থাকে এবং যেকোনো সময় রিস্টোর করা যায়
              </p>
            </div>
          </div>

          {isOwner && !isAdminSimpleView && trashedPlants.length > 0 && (
            <button
              type="button"
              onClick={onEmptyAllTrash}
              className="px-3.5 py-2 bg-[#B34728] hover:bg-[#8F351D] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0"
            >
              ট্র্যাশ খালি করুন
            </button>
          )}
        </div>

        <p className={`text-[#526356] leading-relaxed ${isAdminSimpleView ? 'text-sm' : 'text-xs'}`}>
          <strong className="text-[#142318]">৩০ দিনের নিরাপত্তা:</strong>{' '}
          {isAdminSimpleView
            ? 'ভুল করে কোনো গাছ ট্র্যাশে চলে গেলে নিচের সবুজ "ফিরিয়ে আনুন" বোতামে চাপ দিলেই আবার দোকানে ফিরে আসবে। স্থায়ীভাবে ডিলিট শুধুমাত্র Owner করতে পারেন।'
            : 'ট্র্যাশে থাকা গাছ পাবলিক ওয়েবসাইটে দেখানো হয় না। ৩০ দিন পূর্ণ হলে স্বয়ংক্রিয়ভাবে ক্যাটালগ থেকে বাদ পড়ে; Cloudinary-র অব্যবহৃত ছবি পরিষ্কার করতে Cloudinary মিডিয়া ট্যাবের "অরফ্যান স্ক্যান" ব্যবহার করুন।'}
        </p>
      </section>

      {trashedPlants.length === 0 ? (
        <div className="bg-white border border-[#E8E1D5] rounded-2xl p-10 text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#F0FDF4] text-[#1B8354] flex items-center justify-center mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className={`font-serif-bn font-bold text-[#142318] ${isAdminSimpleView ? 'text-xl' : 'text-base'}`}>
            ট্র্যাশ বিন সম্পূর্ণ খালি
          </h3>
          <p className={isAdminSimpleView ? 'text-sm text-[#526356]' : 'text-xs text-[#526356]'}>
            কোনো চারা ট্র্যাশে নেই। আপনার সমস্ত গাছ ক্যাটালগে সক্রিয় রয়েছে।
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {trashedPlants.map((plant) => {
            const { daysRemainingBn } = calculateTrashDaysRemaining(plant.deletedAt);
            return (
              <div
                key={plant.id}
                className="bg-white border border-[#F3C7BC] rounded-2xl p-4 flex flex-col sm:flex-row gap-3 sm:items-center justify-between"
              >
                <div className="flex gap-3 items-center min-w-0">
                  <div
                    className={`${
                      isAdminSimpleView ? 'w-20 h-20' : 'w-16 h-16'
                    } rounded-xl overflow-hidden bg-[#EAE4D9] shrink-0 border border-[#DDD5C7] grayscale opacity-85`}
                  >
                    <img
                      src={resolvePlantImageUrl(plant.image, PUJA_IMAGE)}
                      alt={plant.nameBn}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <h3
                      className={`font-serif-bn font-bold text-[#142318] truncate ${
                        isAdminSimpleView ? 'text-lg' : 'text-sm sm:text-base'
                      }`}
                    >
                      {plant.nameBn}
                    </h3>

                    <div className="flex items-center flex-wrap gap-x-1.5 text-[11px] text-[#785942] tabular-nums">
                      <span className="font-mono font-bold text-[#142318]">
                        ₹{plant.options[0]?.price || 0}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{plant.category}</span>
                      {plant.colorBn && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{plant.colorBn}</span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap text-[11px] tabular-nums">
                      <span className="inline-flex items-center gap-1 font-bold text-[#B34728]">
                        <Clock className="w-3 h-3" />
                        <span>আর {daysRemainingBn} দিন বাকি</span>
                      </span>
                      <span aria-hidden="true" className="text-[#D5C9B8]">
                        ·
                      </span>
                      <span className="text-[#526356]">
                        {plant.deletedAtBn ? `ট্র্যাশে: ${plant.deletedAtBn}` : 'সাম্প্রতিক'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#F5EAE7]">
                  <button
                    type="button"
                    onClick={() => onRestore(plant)}
                    className={`flex-1 sm:flex-initial bg-[#1B8354] hover:bg-[#146c44] text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
                      isAdminSimpleView ? 'h-12 px-5 text-base' : 'h-9 px-3.5 text-xs'
                    }`}
                  >
                    <RefreshCw className={isAdminSimpleView ? 'w-5 h-5' : 'w-3.5 h-3.5'} />
                    <span>ফিরিয়ে আনুন</span>
                  </button>

                  {isOwner && !isAdminSimpleView && (
                    <button
                      type="button"
                      onClick={() => onPermanentDelete(plant)}
                      className="h-9 px-3 bg-[#FBEBEB] hover:bg-[#F7D4D4] text-[#B34728] rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                      title="চিরতরে মুছুন"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>চিরতরে মুছুন</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
