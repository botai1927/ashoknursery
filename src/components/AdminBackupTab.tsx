import { ChangeEvent, RefObject } from 'react';
import {
  Download,
  Printer,
  FileText,
  Loader2,
  AlertTriangle,
  ShieldCheck,
  Database,
  Cloud,
} from 'lucide-react';
import { formatBytesReadable } from '../utils/firestoreMonitor';

interface AdminBackupTabProps {
  isAdminSimpleView: boolean;
  isOwner: boolean;
  activePlantsCount: number;
  trashedPlantsCount: number;
  base64PhotoCount: number;
  totalEstimatedBytes: number;
  cloudinaryConfigured: boolean;
  cloudinaryCloudName: string | null;
  isExportingFullBackup: boolean;
  isRestoringBackup: boolean;
  backupImportInputRef: RefObject<HTMLInputElement | null>;
  onExportCatalogBackup: () => void;
  onExportPrintablePhotoCatalog: () => void;
  onRestoreBackupFile: (e: ChangeEvent<HTMLInputElement>) => void;
  onRequestFactoryReset: () => void;
}

export function AdminBackupTab({
  isAdminSimpleView,
  isOwner,
  activePlantsCount,
  trashedPlantsCount,
  base64PhotoCount,
  totalEstimatedBytes,
  cloudinaryConfigured,
  cloudinaryCloudName,
  isExportingFullBackup,
  isRestoringBackup,
  backupImportInputRef,
  onExportCatalogBackup,
  onExportPrintablePhotoCatalog,
  onRestoreBackupFile,
  onRequestFactoryReset,
}: AdminBackupTabProps) {
  return (
    <div className="space-y-4">
      {/* Overview Card */}
      <section className="bg-white border border-[#E8E1D5] rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#1B8354]/10 text-[#1B8354] flex items-center justify-center shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif-bn text-base sm:text-lg font-bold text-[#142318]">
                ব্যাকআপ, অফলাইন ক্যাটালগ ও রিস্টোর কেন্দ্র
              </h2>
              <p className="text-xs text-[#526356]">
                সমস্ত গাছের দাম, ছবি, Cloudinary লিংক ও কাজের ইতিহাস এক ক্লিকে নিজের ফোনে সংরক্ষণ করুন
              </p>
            </div>
          </div>
        </div>

        {/* Summary Stats (Unboxed hairline grid, tabular numbers) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[#F0EAE1] text-xs">
          <div>
            <p className="text-xs text-[#785942]">মোট সক্রিয় + ট্র্যাশ</p>
            <p className="font-mono tabular-nums text-base font-bold text-[#142318]">
              {activePlantsCount + trashedPlantsCount} টি
            </p>
          </div>
          <div>
            <p className="text-xs text-[#785942]">ডাটাবেস সাইজ</p>
            <p className="font-mono tabular-nums text-base font-bold text-[#142318]">
              {formatBytesReadable(totalEstimatedBytes)}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#785942]">Cloudinary</p>
            <p className="font-semibold text-sm text-[#1B8354] flex items-center gap-1 mt-0.5">
              <Cloud className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{cloudinaryConfigured ? cloudinaryCloudName || 'সংযুক্ত' : 'অসংযুক্ত'}</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-[#785942]">Base64 অফলাইন ছবি</p>
            <p className="font-mono tabular-nums text-base font-bold text-[#142318]">
              {base64PhotoCount} টি
            </p>
          </div>
        </div>
      </section>

      {/* Export & Offline PDF Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-[#E8E1D5] rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#142318]">
              <Database className="w-4 h-4 text-[#1B8354]" />
              <h3 className="font-serif-bn text-sm sm:text-base font-bold">
                সম্পূর্ণ Firebase + Cloudinary ব্যাকআপ (JSON)
              </h3>
            </div>
            <p className={`text-[#526356] leading-relaxed ${isAdminSimpleView ? 'text-sm' : 'text-xs'}`}>
              সব চারা, দাম, ৩-স্লট ছবি (এমবেডেড অফলাইন কপিসহ), ডিলিট হিস্ট্রি ও Cloudinary মিডিয়া রেকর্ড ১টি ফাইলে ডাউনলোড হবে।
            </p>
          </div>

          <button
            type="button"
            disabled={isExportingFullBackup}
            onClick={onExportCatalogBackup}
            className={`w-full px-4 bg-[#142318] hover:bg-[#203425] disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer ${
              isAdminSimpleView ? 'min-h-[50px] text-sm py-3' : 'py-2.5 text-xs'
            }`}
          >
            {isExportingFullBackup ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#A3E635]" />
            ) : (
              <Download className="w-4 h-4 text-[#A3E635]" />
            )}
            <span>সম্পূর্ণ JSON ব্যাকআপ ডাউনলোড</span>
          </button>
        </div>

        <div className="bg-white border border-[#E8E1D5] rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#142318]">
              <Printer className="w-4 h-4 text-[#1B8354]" />
              <h3 className="font-serif-bn text-sm sm:text-base font-bold">
                অফলাইন ফটো ও দাম ক্যাটালগ (HTML / PDF)
              </h3>
            </div>
            <p className={`text-[#526356] leading-relaxed ${isAdminSimpleView ? 'text-sm' : 'text-xs'}`}>
              ইন্টারনেট ছাড়াই দোকানে বা কাস্টমারের সামনে ফোনে খুলে ছবি ও দাম দেখানোর জন্য প্রিন্টযোগ্য ফাইল তৈরি করে।
            </p>
          </div>

          <button
            type="button"
            disabled={isExportingFullBackup}
            onClick={onExportPrintablePhotoCatalog}
            className={`w-full px-4 bg-[#1B8354] hover:bg-[#146c44] disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer ${
              isAdminSimpleView ? 'min-h-[50px] text-sm py-3' : 'py-2.5 text-xs'
            }`}
          >
            <Printer className="w-4 h-4 text-[#A3E635]" />
            <span>অফলাইন ফটো-ক্যাটালগ ডাউনলোড</span>
          </button>
        </div>
      </section>

      {/* Restore Section */}
      <section className="bg-white border border-[#E8E1D5] rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-2 text-[#142318]">
          <ShieldCheck className="w-4 h-4 text-[#1B8354]" />
          <h3 className="font-serif-bn text-sm sm:text-base font-bold">
            আগের ব্যাকআপ ফাইল থেকে পুনরুদ্ধার (Restore)
          </h3>
        </div>
        <p className={`text-[#526356] leading-relaxed ${isAdminSimpleView ? 'text-sm' : 'text-xs'}`}>
          আগে ডাউনলোড করা যেকোনো JSON ব্যাকআপ আপলোড করলে সব গাছ, দাম ও লগ ফিরে আসবে (Cloudinary সক্রিয় থাকলে ছবিগুলো স্বয়ংক্রিয়ভাবে CDN-এ উঠে যাবে)।
        </p>

        <input
          ref={backupImportInputRef}
          type="file"
          accept=".json,application/json"
          onChange={onRestoreBackupFile}
          className="hidden"
        />

        <button
          type="button"
          disabled={isRestoringBackup}
          onClick={() => backupImportInputRef.current?.click()}
          className={`w-full sm:w-auto px-5 bg-[#FAF8F5] hover:bg-[#F3ECE2] border border-[#D5C9B8] text-[#142318] font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
            isAdminSimpleView ? 'min-h-[50px] text-sm py-3' : 'py-2.5 text-xs'
          }`}
        >
          {isRestoringBackup ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#1B8354]" />
          ) : (
            <FileText className="w-4 h-4 text-[#1B8354]" />
          )}
          <span>{isRestoringBackup ? 'রিস্টোর চলছে...' : 'ব্যাকআপ JSON ফাইল বাছুন ও রিস্টোর করুন'}</span>
        </button>
      </section>

      {/* Danger Zone: Factory Reset (Owner Only) */}
      {isOwner && !isAdminSimpleView && (
        <section className="bg-[#FFF8F6] border border-[#FCA5A5] rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="space-y-1">
              <p className="text-sm font-bold text-[#991B1B] flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>সতর্কতা অঞ্চল: মূল ক্যাটালগ ফ্যাক্টরি রিসেট</span>
              </p>
              <p className="text-xs text-[#7F1D1D] leading-relaxed">
                এটি ব্যবহার করলে আপনার সব কাস্টম যোগ করা চারা ও দাম বদলানো তথ্য মুছে গিয়ে প্রাথমিক নার্সারি ক্যাটালগ পুনরায় সেট হবে। রিসেট করার আগে অবশ্যই উপরে একটি JSON ব্যাকআপ ডাউনলোড করে রাখুন।
              </p>
            </div>

            <button
              type="button"
              onClick={onRequestFactoryReset}
              className="px-4 py-2 bg-[#B34728] hover:bg-[#8F351D] text-white text-xs font-bold rounded-xl cursor-pointer shrink-0 whitespace-nowrap"
            >
              ফ্যাক্টরি রিসেট করুন
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
