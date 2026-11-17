import type { FormEvent } from 'react';
import { AlertTriangle, CheckCircle2, RefreshCw, Trash2 } from 'lucide-react';
import { PUJA_IMAGE } from '../../data/brahmyamanCatalog';
import type { BrahmyamanPlant } from '../../types/nursery';
import { resolvePlantImageUrl } from '../../utils/imageUrl';
import type { AdminToast, ConfirmDialogState } from './adminTypes';

interface AdminModalsAndToastProps {
  quickPricePlant: BrahmyamanPlant | null;
  quickPriceValue: string;
  setQuickPriceValue: (v: string) => void;
  onCloseQuickPrice: () => void;
  onSubmitQuickPrice: (e: FormEvent) => void;
  isAdminSimpleView: boolean;
  confirmDialog: ConfirmDialogState | null;
  onCloseConfirmDialog: () => void;
  toast: AdminToast | null;
  onDismissToast: () => void;
}

export function AdminModalsAndToast({
  quickPricePlant,
  quickPriceValue,
  setQuickPriceValue,
  onCloseQuickPrice,
  onSubmitQuickPrice,
  isAdminSimpleView,
  confirmDialog,
  onCloseConfirmDialog,
  toast,
  onDismissToast,
}: AdminModalsAndToastProps) {
  return (
    <>
      {quickPricePlant && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-xl border border-[#E8E1D5]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E1D5]">
              <div className="flex items-center gap-2.5">
                <img
                  src={resolvePlantImageUrl(quickPricePlant.image, PUJA_IMAGE)}
                  alt={quickPricePlant.nameBn}
                  loading="lazy"
                  decoding="async"
                  className="w-10 h-10 rounded-xl object-cover border border-[#DDD5C7]"
                />
                <div>
                  <h3 className="font-serif-bn text-sm font-bold text-[#142318]">
                    {quickPricePlant.nameBn}
                  </h3>
                  <p className="text-xs text-[#785942] font-mono tabular-nums">
                    বর্তমান মূল্য: ₹{quickPricePlant.options[0]?.price}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onCloseQuickPrice}
                className="text-xs text-[#785942] hover:text-[#142318] p-1 cursor-pointer"
              >
                বন্ধ
              </button>
            </div>

            <form onSubmit={onSubmitQuickPrice} className="mt-4 space-y-3.5">
              <div>
                <label
                  className={`block font-bold text-[#142318] mb-1.5 ${
                    isAdminSimpleView ? 'text-base' : 'text-xs'
                  }`}
                >
                  নতুন বিক্রয়মূল্য লিখুন (₹)
                </label>
                <div className="relative">
                  <span
                    className={`absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-bold text-[#B34728] ${
                      isAdminSimpleView ? 'text-2xl' : 'text-base'
                    }`}
                  >
                    ₹
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    required
                    value={quickPriceValue}
                    onChange={(e) => setQuickPriceValue(e.target.value)}
                    className={`w-full pl-9 pr-3 border border-[#D5C9B8] rounded-xl font-mono tabular-nums font-bold text-[#142318] focus:outline-2 focus:outline-[#1B8354] focus:outline-offset-1 focus:border-[#1B8354] ${
                      isAdminSimpleView ? 'h-14 text-2xl' : 'h-12 text-lg'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[-10, -5, 5, 10].map((delta) => (
                  <button
                    key={delta}
                    type="button"
                    onClick={() => {
                      const cur = parseFloat(quickPriceValue) || 0;
                      const next = Math.max(1, Math.round(cur + delta));
                      setQuickPriceValue(next.toString());
                    }}
                    className={`rounded-xl font-mono tabular-nums font-bold border cursor-pointer transition-all active:scale-95 ${
                      delta < 0
                        ? 'bg-[#FEF2F2] border-[#FECACA] text-[#B34728] hover:bg-[#FEE2E2]'
                        : 'bg-[#F0FDF4] border-[#86EFAC] text-[#166534] hover:bg-[#DCFCE7]'
                    } ${isAdminSimpleView ? 'h-12 text-base' : 'h-10 text-sm'}`}
                  >
                    {delta > 0 ? `+₹${delta}` : `-₹${Math.abs(delta)}`}
                  </button>
                ))}
              </div>

              <div className="pt-2 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onCloseQuickPrice}
                  className={`flex-1 border border-[#D5C9B8] rounded-xl font-bold text-[#526356] cursor-pointer ${
                    isAdminSimpleView ? 'h-13 text-base' : 'h-11 text-xs'
                  }`}
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className={`flex-1 bg-[#1B8354] hover:bg-[#146c44] text-white rounded-xl font-bold cursor-pointer ${
                    isAdminSimpleView ? 'h-13 text-base' : 'h-11 text-xs'
                  }`}
                >
                  দাম সেভ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl border border-[#E8E1D5] space-y-4">
            <div className="flex items-start gap-3">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                  confirmDialog.isDanger
                    ? 'bg-[#FEF2F2] text-[#B34728]'
                    : 'bg-[#F0FDF4] text-[#1B8354]'
                }`}
              >
                {confirmDialog.type === 'soft_delete' ? (
                  <Trash2 className="w-5 h-5 text-[#B34728]" />
                ) : confirmDialog.type === 'permanent_delete' ? (
                  <AlertTriangle className="w-5 h-5 text-[#B34728]" />
                ) : confirmDialog.type === 'empty_trash' ? (
                  <Trash2 className="w-5 h-5 text-[#B34728]" />
                ) : (
                  <RefreshCw className="w-5 h-5 text-[#1B8354]" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-serif-bn text-base font-bold text-[#142318] leading-snug">
                  {confirmDialog.titleBn}
                </h3>
                <p className="text-xs text-[#526356] mt-1 leading-relaxed">
                  {confirmDialog.messageBn}
                </p>
              </div>
            </div>

            {confirmDialog.plant && (
              <div className="flex items-center gap-2.5 p-2.5 bg-[#FBF9F5] border border-[#E8E1D5] rounded-xl">
                <img
                  src={resolvePlantImageUrl(confirmDialog.plant.image, PUJA_IMAGE)}
                  alt={confirmDialog.plant.nameBn}
                  loading="lazy"
                  decoding="async"
                  className="w-10 h-10 rounded-lg object-cover border border-[#DDD5C7]"
                />
                <div className="min-w-0">
                  <p className="font-serif-bn text-xs font-bold text-[#142318] truncate">
                    {confirmDialog.plant.nameBn}
                  </p>
                  <p className="text-xs text-[#785942] tabular-nums">
                    মূল্য: ₹{confirmDialog.plant.options[0]?.price || 0} ·{' '}
                    {confirmDialog.plant.category}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={onCloseConfirmDialog}
                className="flex-1 h-11 border border-[#D5C9B8] hover:bg-[#FAF8F5] text-xs font-bold text-[#526356] rounded-xl transition-colors cursor-pointer"
              >
                {confirmDialog.cancelBtnBn || 'বাতিল'}
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className={`flex-1 h-11 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer ${
                  confirmDialog.isDanger
                    ? 'bg-[#B34728] hover:bg-[#8F351D]'
                    : 'bg-[#1B8354] hover:bg-[#146c44]'
                }`}
              >
                {confirmDialog.confirmBtnBn}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          role="status"
          aria-live="polite"
          data-testid="admin-toast-notification"
          className="fixed top-4 inset-x-4 z-50 max-w-lg mx-auto pointer-events-none"
        >
          <div
            className={`pointer-events-auto p-3.5 sm:p-4 rounded-2xl shadow-2xl border flex items-start justify-between gap-3 transition-all ${
              toast.type === 'error'
                ? 'bg-[#2B1210] border-[#F87171]/60 text-white'
                : toast.type === 'warning'
                ? 'bg-[#281C0E] border-[#FBBF24]/60 text-white'
                : toast.type === 'info'
                ? 'bg-[#142318] border-[#A3E635]/50 text-white'
                : 'bg-[#142318] border-[#34D399]/60 text-white'
            }`}
          >
            <div className="flex items-start gap-3 min-w-0">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  toast.type === 'error'
                    ? 'bg-[#DC2626] text-white'
                    : toast.type === 'warning'
                    ? 'bg-[#D97706] text-white'
                    : 'bg-[#1B8354] text-white'
                }`}
              >
                {toast.type === 'error' || toast.type === 'warning' ? (
                  <AlertTriangle className="w-4 h-4" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
              </div>
              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-xs font-extrabold tracking-wide uppercase px-1.5 py-0.5 rounded-md ${
                      toast.type === 'error'
                        ? 'bg-[#FEE2E2] text-[#991B1B]'
                        : toast.type === 'warning'
                        ? 'bg-[#FEF3C7] text-[#92400E]'
                        : 'bg-[#DCFCE7] text-[#166534]'
                    }`}
                  >
                    {toast.titleBn}
                  </span>
                  <span className="text-xs text-[#A8BDB0] font-mono tabular-nums">
                    {toast.timestampBn}
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-bold leading-snug text-white">
                  {toast.messageBn}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {toast.actionLabelBn && toast.onAction && (
                <button
                  type="button"
                  onClick={() => {
                    toast.onAction?.();
                    onDismissToast();
                  }}
                  className="px-2.5 py-1.5 bg-[#A3E635] hover:bg-[#86cf24] text-[#142318] text-xs font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                >
                  {toast.actionLabelBn}
                </button>
              )}
              <button
                type="button"
                aria-label="টোস্ট বার্তা বন্ধ করুন"
                onClick={onDismissToast}
                className="text-[#A8BDB0] hover:text-white p-1 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
