import {
  Sparkles,
  Bot,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  Database,
  Loader2,
  Wrench,
  Search,
  Activity,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import type { BrahmyamanPlant } from '../types/nursery';
import { PUJA_IMAGE } from '../data/brahmyamanCatalog';
import { resolvePlantImageUrl } from '../utils/imageUrl';
import { formatBytesReadable, type StoredMonitorState } from '../utils/firestoreMonitor';
import { ADMIN_CATEGORIES, type AdminTab, type RootCauseIssue } from './adminConstants';
import type { DbHealthMetrics } from './AdminSettingsTab';

interface DuplicateAnalysis {
  duplicateImages: Array<{ url: string; plants: BrahmyamanPlant[] }>;
  duplicateNames: Array<{ name: string; plants: BrahmyamanPlant[] }>;
  totalCount: number;
}

interface AdminDiagnosticsTabProps {
  diagnosticsTab: 'rootcause' | 'duplicates' | 'bugs' | 'health';
  setDiagnosticsTab: (tab: 'rootcause' | 'duplicates' | 'bugs' | 'health') => void;
  rootCauseDiagnostics: RootCauseIssue[];
  duplicateAnalysis: DuplicateAnalysis;
  bugFixLog: string[];
  isRunningBugFix?: boolean;
  activePlants: BrahmyamanPlant[];
  trashedCount: number;
  dbHealthMetrics: DbHealthMetrics;
  dbMonitorStats: StoredMonitorState;
  onAskAiRootCause: (prompt?: string) => void;
  onStartEditPlant: (plant: BrahmyamanPlant) => void;
  onSoftDelete: (plant: BrahmyamanPlant) => void;
  onRunBugFix: () => void;
  onSwitchTab: (tab: AdminTab) => void;
}

export function AdminDiagnosticsTab({
  diagnosticsTab,
  setDiagnosticsTab,
  rootCauseDiagnostics,
  duplicateAnalysis,
  bugFixLog,
  isRunningBugFix = false,
  activePlants,
  trashedCount,
  dbHealthMetrics,
  dbMonitorStats,
  onAskAiRootCause,
  onStartEditPlant,
  onSoftDelete,
  onRunBugFix,
  onSwitchTab,
}: AdminDiagnosticsTabProps) {
  const autoFixableCount = rootCauseDiagnostics.filter((i) => i.canAutoBugFix).length;

  return (
    <div className="space-y-4">
      {/* 1. Header Overview & 1-Click Action Hero */}
      <section className="bg-white border border-[#E8E1D5] rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#142318] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Activity className="w-6 h-6 text-[#A3E635]" />
            </div>
            <div>
              <h2 className="font-serif-bn text-lg sm:text-xl font-bold text-[#142318]">
                ক্যাটালগ অডিট ও সিস্টেম ডায়াগনস্টিকস
              </h2>
              <p className="text-xs text-[#526356] mt-0.5">
                সরাসরি ক্যাটালগ স্ক্যান, মূল কারণ নির্ণয়, ডুপ্লিকেট শনাক্তকরণ ও ১-ক্লিকে ডাটাবেস মেরামত
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              disabled={isRunningBugFix}
              onClick={onRunBugFix}
              className="px-4 py-2.5 bg-[#1B8354] hover:bg-[#146c44] active:scale-95 disabled:opacity-60 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
            >
              {isRunningBugFix ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Wrench className="w-4 h-4 text-[#A3E635]" />
              )}
              <span>{isRunningBugFix ? 'স্বয়ংক্রিয় মেরামত চলছে...' : '১-ক্লিকে মেরামত চালান'}</span>
            </button>

            <button
              type="button"
              onClick={() => onAskAiRootCause()}
              className="px-3 py-2.5 bg-[#FAF8F5] hover:bg-[#F3ECE2] border border-[#E8E1D5] text-[#142318] rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Bot className="w-4 h-4 text-[#1B8354]" />
              <span>AI সমস্যা বিশ্লেষণ</span>
            </button>
          </div>
        </div>

        {/* Diagnostic KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-[#F0EAE1]">
          <button
            type="button"
            onClick={() => setDiagnosticsTab('rootcause')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              diagnosticsTab === 'rootcause'
                ? 'bg-[#142318] text-white border-[#142318]'
                : 'bg-[#FAF8F5] hover:bg-[#F3ECE2] border-[#E8E1D5] text-[#142318]'
            }`}
          >
            <p className={`text-[11px] font-bold ${diagnosticsTab === 'rootcause' ? 'text-[#A3E635]' : 'text-[#785942]'}`}>
              সমস্যা ও মূল কারণ
            </p>
            <p className={`text-xl font-bold font-mono tabular-nums ${rootCauseDiagnostics.length > 0 && diagnosticsTab !== 'rootcause' ? 'text-[#B34728]' : ''}`}>
              {rootCauseDiagnostics.length} টি
            </p>
          </button>

          <button
            type="button"
            onClick={() => setDiagnosticsTab('duplicates')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              diagnosticsTab === 'duplicates'
                ? 'bg-[#142318] text-white border-[#142318]'
                : 'bg-[#FAF8F5] hover:bg-[#F3ECE2] border-[#E8E1D5] text-[#142318]'
            }`}
          >
            <p className={`text-[11px] font-bold ${diagnosticsTab === 'duplicates' ? 'text-[#A3E635]' : 'text-[#785942]'}`}>
              ডুপ্লিকেট গ্রুপ
            </p>
            <p className="text-xl font-bold font-mono tabular-nums">
              {duplicateAnalysis.totalCount} টি
            </p>
          </button>

          <button
            type="button"
            onClick={() => setDiagnosticsTab('bugs')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              diagnosticsTab === 'bugs'
                ? 'bg-[#142318] text-white border-[#142318]'
                : 'bg-[#FAF8F5] hover:bg-[#F3ECE2] border-[#E8E1D5] text-[#142318]'
            }`}
          >
            <p className={`text-[11px] font-bold ${diagnosticsTab === 'bugs' ? 'text-[#A3E635]' : 'text-[#785942]'}`}>
              অটো ফিক্স স্ট্যাটাস
            </p>
            <p className="text-xl font-bold font-mono tabular-nums text-[#1B8354]">
              {bugFixLog.length > 0 ? 'সম্পন্ন ✓' : 'প্রস্তুত'}
            </p>
          </button>

          <button
            type="button"
            onClick={() => setDiagnosticsTab('health')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              diagnosticsTab === 'health'
                ? 'bg-[#142318] text-white border-[#142318]'
                : 'bg-[#FAF8F5] hover:bg-[#F3ECE2] border-[#E8E1D5] text-[#142318]'
            }`}
          >
            <p className={`text-[11px] font-bold ${diagnosticsTab === 'health' ? 'text-[#A3E635]' : 'text-[#785942]'}`}>
              ডাটাবেস হেলথ
            </p>
            <p className="text-xl font-bold font-mono tabular-nums text-[#1B8354]">
              {activePlants.length} টি সক্রিয়
            </p>
          </button>
        </div>
      </section>

      {/* 2. Detailed Diagnostic Views */}
      {diagnosticsTab === 'rootcause' && (
        <section className="bg-white border border-[#E8E1D5] rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap pb-3 border-b border-[#F0EAE1]">
            <div>
              <h3 className="font-serif-bn text-base sm:text-lg font-bold text-[#142318]">
                শনাক্ত হওয়া সমস্যা ও মূল কারণ বিশ্লেষণ ({rootCauseDiagnostics.length} টি)
              </h3>
              <p className="text-xs text-[#526356]">
                ক্যাটালগের বিবরণ, দাম, ছবি ও যত্ন ফিল্ডের স্বয়ংক্রিয় অডিট
              </p>
            </div>
            {autoFixableCount > 0 && (
              <span className="text-xs font-bold text-[#1B8354] bg-[#EBF5EF] px-2.5 py-1 rounded-lg">
                ✓ {autoFixableCount} টি সমস্যা ১-ক্লিকে মেরামতযোগ্য
              </span>
            )}
          </div>

          {bugFixLog.length > 0 && (
            <div className="p-4 bg-[#F0FDF4] border border-[#86EFAC] rounded-xl space-y-2">
              <p className="font-bold text-sm text-[#166534] flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[#1B8354] shrink-0" />
                <span>সাম্প্রতিক স্বয়ংক্রিয় মেরামত লগ (Catalog Validated & Updated):</span>
              </p>
              <div className="max-h-48 overflow-y-auto space-y-1 font-mono text-xs pr-1">
                {bugFixLog.map((log, i) => (
                  <p key={i} className="text-[#15803D] flex items-start gap-1.5">
                    <span className="shrink-0 font-bold">✓</span>
                    <span>{log}</span>
                  </p>
                ))}
              </div>
            </div>
          )}

          {rootCauseDiagnostics.length === 0 ? (
            <div className="py-12 text-center text-[#526356] space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#EBF5EF] text-[#1B8354] flex items-center justify-center mx-auto">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h4 className="font-serif-bn text-lg font-bold text-[#142318]">
                ক্যাটালগে কোনো অসঙ্গতি বা সমস্যা পাওয়া যায়নি!
              </h4>
              <p className="text-xs max-w-md mx-auto">
                আপনার সমস্ত সক্রিয় চারার বাংলা বিবরণ, ইংরেজি বিবরণ, সঠিক মূল্য এবং যত্নের টিপস সম্পূর্ণ নির্ভুলভাবে সেট করা আছে।
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {rootCauseDiagnostics.map((issue) => (
                <div
                  key={issue.id}
                  className={`p-4 rounded-xl border space-y-2.5 transition-all ${
                    issue.severity === 'high'
                      ? 'bg-[#FEF2F2] border-[#FCA5A5]'
                      : issue.severity === 'medium'
                      ? 'bg-[#FFFBEB] border-[#FDE68A]'
                      : 'bg-[#FBF9F5] border-[#E8E1D5]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="font-serif-bn text-sm sm:text-base font-bold text-[#142318]">
                      {issue.titleBn}
                    </h4>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                        issue.severity === 'high'
                          ? 'bg-[#FEE2E2] text-[#B34728]'
                          : issue.severity === 'medium'
                          ? 'bg-[#FEF3C7] text-[#B45309]'
                          : 'bg-[#DCFCE7] text-[#166534]'
                      }`}
                    >
                      {issue.severity === 'high'
                        ? 'জরুরি সমাধান প্রয়োজন'
                        : issue.severity === 'medium'
                        ? 'গুরুত্বপূর্ণ'
                        : 'পরামর্শ'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div className="p-2.5 bg-white/80 rounded-lg border border-black/5">
                      <span className="font-bold text-[#142318] block mb-0.5">কোথায় সমস্যা:</span>
                      <p className="text-[#526356]">{issue.whereBn}</p>
                    </div>
                    <div className="p-2.5 bg-white/80 rounded-lg border border-black/5">
                      <span className="font-bold text-[#B34728] block mb-0.5">মূল কারণ (Root Cause):</span>
                      <p className="text-[#526356] leading-relaxed">{issue.rootReasonBn}</p>
                    </div>
                    <div className="p-2.5 bg-white/80 rounded-lg border border-black/5">
                      <span className="font-bold text-[#166534] block mb-0.5">স্থায়ী সমাধান:</span>
                      <p className="text-[#526356] leading-relaxed">{issue.solutionBn}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    {issue.plantToEdit && (
                      <button
                        type="button"
                        onClick={() => onStartEditPlant(issue.plantToEdit!)}
                        className="px-3 py-1.5 bg-[#1B8354] hover:bg-[#146c44] text-white text-xs font-bold rounded-lg cursor-pointer"
                      >
                        &ldquo;{issue.plantToEdit.nameBn}&rdquo; এডিট ফর্ম খুলুন
                      </button>
                    )}
                    {issue.canAutoBugFix && (
                      <button
                        type="button"
                        disabled={isRunningBugFix}
                        onClick={onRunBugFix}
                        className="px-3 py-1.5 bg-[#142318] hover:bg-[#203425] disabled:opacity-60 text-white text-xs font-bold rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        {isRunningBugFix && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        <span>{isRunningBugFix ? 'মেরামত চলছে...' : '১-ক্লিকে মেরামত'}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        onAskAiRootCause(
                          `এই সমস্যাটি বিস্তারিত ব্যাখ্যা করুন — "${issue.titleBn}" (${issue.whereBn})। মূল কারণ কী এবং স্থায়ী সমাধান কীভাবে করবো?`
                        )
                      }
                      className="px-3 py-1.5 bg-white border border-[#D5C9B8] text-[#142318] text-xs font-bold rounded-lg cursor-pointer"
                    >
                      AI পরামর্শ নিন
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {diagnosticsTab === 'duplicates' && (
        <section className="bg-white border border-[#E8E1D5] rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="pb-3 border-b border-[#F0EAE1]">
            <h3 className="font-serif-bn text-base sm:text-lg font-bold text-[#142318]">
              ডুপ্লিকেট ছবি ও নামের স্ক্যানার
            </h3>
            <p className="text-xs text-[#526356] mt-0.5">
              একই ছবি একাধিক গাছে ব্যবহৃত হয়েছে কিনা বা একই নামের পুনরাবৃত্তি রয়েছে কিনা তা পরীক্ষা করুন
            </p>
          </div>

          {duplicateAnalysis.totalCount === 0 ? (
            <div className="py-12 text-center text-[#526356] space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#EBF5EF] text-[#1B8354] flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h4 className="font-serif-bn text-lg font-bold text-[#142318]">
                কোনো ডুপ্লিকেট ছবি বা নাম পাওয়া যায়নি!
              </h4>
              <p className="text-xs max-w-md mx-auto">
                আপনার ক্যাটালগের সব ছবি ও নাম সম্পূর্ণ ইউনিক।
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {duplicateAnalysis.duplicateImages.map((group, idx) => (
                <div key={idx} className="p-4 bg-white border border-[#FCD5CC] rounded-2xl space-y-3 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <img
                      src={resolvePlantImageUrl(group.url, PUJA_IMAGE)}
                      alt="duplicate"
                      className="w-14 h-14 rounded-xl object-cover border border-[#DDD5C7]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-serif-bn text-sm font-bold text-[#B34728]">
                        একই ছবি ব্যবহৃত গাছসমূহ ({group.plants.length} টি চারা):
                      </p>
                      <p className="text-xs text-[#526356] truncate">
                        {group.plants.map((p) => p.nameBn).join(', ')}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1 border-t border-[#F0EAE1]">
                    {group.plants.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between gap-3 p-2.5 bg-[#FAF8F5] rounded-xl text-xs"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-[#142318] truncate">
                            {p.nameBn} {p.colorBn ? `(${p.colorBn})` : ''}
                          </p>
                          <p className="text-[11px] text-[#785942] font-mono">
                            মূল্য: ₹{p.options[0]?.price || 0} · বিভাগ: {p.category}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => onStartEditPlant(p)}
                            className="px-2.5 py-1 bg-[#1B8354] hover:bg-[#146c44] text-white text-[11px] font-bold rounded-lg cursor-pointer"
                          >
                            এডিট
                          </button>
                          <button
                            type="button"
                            onClick={() => onSoftDelete(p)}
                            className="px-2.5 py-1 bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#B34728] text-[11px] font-bold rounded-lg cursor-pointer"
                          >
                            ট্র্যাশে পাঠান
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {diagnosticsTab === 'bugs' && (
        <section className="bg-white border border-[#E8E1D5] rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="p-4 bg-[#F0FDF4] border border-[#86EFAC] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-serif-bn text-base sm:text-lg font-bold text-[#166534]">
                স্বয়ংক্রিয় বাগ ফিক্সার ও ক্যাটালগ অডিটর
              </h3>
              <p className="text-xs text-[#15803D] mt-0.5">
                অসম্পূর্ণ বিবরণ, শূন্য মূল্য, ছবিবিহীন চারা ও ভুল যত্ন নির্দেশাবলী ১-ক্লিকে মেরামত ও Firestore-এ সেভ করে
              </p>
            </div>
            <button
              type="button"
              disabled={isRunningBugFix}
              onClick={onRunBugFix}
              className="px-4 py-2.5 bg-[#1B8354] hover:bg-[#146c44] disabled:opacity-60 text-white text-xs sm:text-sm font-bold rounded-xl inline-flex items-center gap-2 cursor-pointer shrink-0 shadow-xs"
            >
              {isRunningBugFix && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isRunningBugFix ? 'মেরামত চলছে...' : 'এখনই ফিক্স চালান'}</span>
            </button>
          </div>

          {bugFixLog.length > 0 && (
            <div className="p-4 bg-[#FAF8F5] border border-[#E8E1D5] rounded-2xl space-y-2 font-mono text-xs">
              <p className="font-bold text-[#142318] font-sans-bn">সাম্প্রতিক মেরামত ফলাফল:</p>
              <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
                {bugFixLog.map((log, i) => (
                  <p key={i} className="text-[#1B8354] flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{log}</span>
                  </p>
                ))}
              </div>
            </div>
          )}

          <div className="p-4 bg-white border border-[#E8E1D5] rounded-2xl space-y-2 text-xs text-[#526356]">
            <p className="font-bold text-sm text-[#142318]">স্বয়ংক্রিয় অডিট ও চেকের নিয়মনীতি:</p>
            <p className="flex items-start gap-2">
              <span className="font-bold text-[#1B8354]">১.</span>
              <span>প্রতিটি চারার ইউনিক ও বিশদ বাংলা বিবরণ (বাঁকুড়ার জলবায়ু ও মাটির উপযোগী যত্নসহ) নিশ্চিতকরণ</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="font-bold text-[#1B8354]">২.</span>
              <span>প্রতিটি চারার অন্তত একটি ভ্যালিড মূল্য (ন্যূনতম ₹৩০-₹৫০) ও গ্রো-ব্যাগ সাইজ সেট করা</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="font-bold text-[#1B8354]">৩.</span>
              <span>সূর্যের আলো, জল দেওয়ার পরিমাণ, মাটির মিশ্রণ ও বৈজ্ঞানিক নামের মানসম্মত রূপায়ন</span>
            </p>
          </div>
        </section>
      )}

      {diagnosticsTab === 'health' && (
        <section className="bg-white border border-[#E8E1D5] rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="pb-3 border-b border-[#F0EAE1]">
            <h3 className="font-serif-bn text-base sm:text-lg font-bold text-[#142318]">
              ডাটাবেস ও সিস্টেম হেলথ রিপোর্ট
            </h3>
            <p className="text-xs text-[#526356] mt-0.5">
              Firestore রিড/রাইট কোটা, মোট সাইজ এবং ক্যাটাগরি বিশ্লেষণ
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 bg-[#FBF9F5] border border-[#E8E1D5] rounded-xl">
              <p className="text-xs text-[#785942] font-bold">মোট সক্রিয় চারা</p>
              <p className="text-2xl font-bold font-mono tabular-nums text-[#1B8354] mt-1">
                {activePlants.length} টি
              </p>
            </div>
            <div className="p-4 bg-[#FBF9F5] border border-[#E8E1D5] rounded-xl">
              <p className="text-xs text-[#785942] font-bold">মোট সার্ভার ডকুমেন্ট</p>
              <p className="text-2xl font-bold font-mono tabular-nums text-[#142318] mt-1">
                {dbHealthMetrics.effectiveTotalDocs} টি
              </p>
            </div>
            <div className="p-4 bg-[#FBF9F5] border border-[#E8E1D5] rounded-xl">
              <p className="text-xs text-[#785942] font-bold">আজকের রিড / রাইট</p>
              <p className="text-lg font-bold font-mono tabular-nums text-[#142318] mt-1">
                {dbMonitorStats.today.serverReads} R · {dbMonitorStats.today.writes} W
              </p>
            </div>
            <div className="p-4 bg-[#FBF9F5] border border-[#E8E1D5] rounded-xl">
              <p className="text-xs text-[#785942] font-bold">মোট সাইজ / ট্র্যাশ</p>
              <p className="text-lg font-bold font-mono tabular-nums text-[#142318] mt-1">
                {formatBytesReadable(dbHealthMetrics.totalEstimatedBytes)} · {trashedCount} ট্র্যাশ
              </p>
            </div>
          </div>

          <div className="p-4 bg-[#FAF8F5] border border-[#E8E1D5] rounded-xl space-y-2.5">
            <p className="font-bold text-sm text-[#142318]">ক্যাটাগরি অনুযায়ী চারার বিভাজন:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {ADMIN_CATEGORIES.map((cat) => {
                const count = activePlants.filter((p) => p.category === cat).length;
                return (
                  <div key={cat} className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-[#E8E1D5]">
                    <span className="text-[#526356] font-medium truncate">{cat}</span>
                    <span className="font-bold font-mono tabular-nums text-[#142318]">{count} টি</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onSwitchTab('api')}
              className="flex-1 py-3 px-4 bg-[#142318] hover:bg-[#203425] text-white text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer"
            >
              <Activity className="w-4 h-4 text-[#A3E635]" />
              <span>Gemini AI কোটা ও ২৪ ঘণ্টার হিস্ট্রি দেখুন</span>
            </button>
            <button
              type="button"
              onClick={() => onSwitchTab('settings')}
              className="py-3 px-4 bg-white hover:bg-[#FAF8F5] border border-[#E8E1D5] text-[#142318] text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer"
            >
              <Database className="w-4 h-4 text-[#1B8354]" />
              <span>নিরাপত্তা সেটিংস</span>
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
