import {
  Sparkles,
  Bot,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  Database,
  Loader2,
  Wrench,
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

interface AdminDiagnosticsModalProps {
  isOpen: boolean;
  diagnosticsTab: 'rootcause' | 'duplicates' | 'bugs' | 'health';
  setDiagnosticsTab: (tab: 'rootcause' | 'duplicates' | 'bugs' | 'health') => void;
  onClose: () => void;
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

export function AdminDiagnosticsModal({
  isOpen,
  diagnosticsTab,
  setDiagnosticsTab,
  onClose,
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
}: AdminDiagnosticsModalProps) {
  if (!isOpen) return null;

  const autoFixableCount = rootCauseDiagnostics.filter((i) => i.canAutoBugFix).length;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white rounded-2xl p-5 shadow-2xl border border-[#E8E1D5] max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E8E1D5]">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#1B8354] text-white flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#A3E635]" />
            </div>
            <div>
              <h2 className="font-serif-bn text-base font-bold text-[#142318]">
                ক্যাটালগ অডিট ও বাগ ফিক্স কেন্দ্র
              </h2>
              <p className="text-xs text-[#785942]">
                ডুপ্লিকেট স্ক্যান, মূল কারণ বিশ্লেষণ ও ১-ক্লিক মেরামত
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-[#785942] hover:text-[#142318] font-bold px-2 py-1 cursor-pointer"
          >
            বন্ধ
          </button>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-[#F5EFE6] rounded-xl my-3 shrink-0">
          {(
            [
              { id: 'rootcause', label: `কারণ (${rootCauseDiagnostics.length})` },
              { id: 'duplicates', label: `ডুপ্লিকেট (${duplicateAnalysis.totalCount})` },
              { id: 'bugs', label: `বাগ ফিক্স${bugFixLog.length > 0 ? ' ✓' : ''}` },
              { id: 'health', label: 'হেলথ' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setDiagnosticsTab(t.id)}
              className={`py-1.5 px-1 text-xs font-bold rounded-lg transition-colors cursor-pointer text-center truncate tabular-nums ${
                diagnosticsTab === t.id
                  ? t.id === 'rootcause'
                    ? 'bg-[#B34728] text-white'
                    : 'bg-white text-[#142318] shadow-2xs'
                  : 'text-[#785942] hover:text-[#142318]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto space-y-3 text-xs pr-1">
          {diagnosticsTab === 'rootcause' && (
            <div className="space-y-3">
              <div className="p-3 bg-[#FFF8F6] border border-[#FCD5CC] rounded-xl flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-bold text-[#142318]">কোথায় সমস্যা ও মূল কারণ কী?</p>
                  <p className="text-xs text-[#526356]">
                    সম্পূর্ণ ক্যাটালগ স্ক্যান ফলাফল ({activePlants.length}টি সক্রিয় চারা):
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {autoFixableCount > 0 && (
                    <button
                      type="button"
                      disabled={isRunningBugFix}
                      onClick={onRunBugFix}
                      className="px-2.5 py-1.5 bg-[#1B8354] hover:bg-[#146c44] disabled:opacity-60 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {isRunningBugFix ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Wrench className="w-3.5 h-3.5 text-[#A3E635]" />
                      )}
                      <span>
                        {isRunningBugFix
                          ? 'মেরামত চলছে...'
                          : '১-ক্লিকে স্বয়ংক্রিয় বাগ ফিক্স চালান'}
                      </span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onAskAiRootCause()}
                    className="px-2.5 py-1.5 bg-[#142318] hover:bg-[#203425] text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Bot className="w-3.5 h-3.5 text-[#A3E635]" />
                    <span>AI ব্যাখ্যা</span>
                  </button>
                </div>
              </div>

              {bugFixLog.length > 0 && (
                <div className="p-3 bg-[#F0FDF4] border border-[#86EFAC] rounded-xl space-y-1.5 text-xs">
                  <p className="font-bold text-[#166534] flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 shrink-0 text-[#1B8354]" />
                    <span>বাগ ফিক্স ফলাফল (Success: Catalog Validated & Updated):</span>
                  </p>
                  <div className="max-h-36 overflow-y-auto space-y-1 pr-1 font-mono text-[10.5px]">
                    {bugFixLog.map((log, i) => (
                      <p key={i} className="text-[#15803D] flex items-start gap-1">
                        <span className="shrink-0">✓</span>
                        <span>{log}</span>
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {rootCauseDiagnostics.length === 0 ? (
                <div className="py-8 text-center text-[#526356] space-y-2">
                  <ShieldCheck className="w-10 h-10 text-[#1B8354] mx-auto" />
                  <p className="font-bold text-sm text-[#142318]">কোনো সমস্যা ধরা পড়েনি!</p>
                  <p className="text-xs">সব চারার বিবরণ, ছবি, দাম ও যত্ন সঠিকভাবে সেট করা আছে।</p>
                </div>
              ) : (
                rootCauseDiagnostics.map((issue) => (
                  <div
                    key={issue.id}
                    className={`p-3.5 rounded-xl border space-y-2 ${
                      issue.severity === 'high'
                        ? 'bg-[#FEF2F2] border-[#FCA5A5]'
                        : issue.severity === 'medium'
                        ? 'bg-[#FFFBEB] border-[#FDE68A]'
                        : 'bg-[#FBF9F5] border-[#E8E1D5]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-serif-bn text-xs sm:text-sm font-bold text-[#142318]">
                        {issue.titleBn}
                      </h4>
                      <span
                        className={`text-xs font-bold shrink-0 ${
                          issue.severity === 'high'
                            ? 'text-[#B34728]'
                            : issue.severity === 'medium'
                            ? 'text-[#B45309]'
                            : 'text-[#1B8354]'
                        }`}
                      >
                        {issue.severity === 'high'
                          ? 'জরুরি'
                          : issue.severity === 'medium'
                          ? 'গুরুত্বপূর্ণ'
                          : 'পরামর্শ'}
                      </span>
                    </div>

                    <p className="text-xs text-[#142318]">
                      <strong>কোথায়: </strong>
                      {issue.whereBn}
                    </p>
                    <p className="text-xs text-[#526356] leading-relaxed">
                      <strong className="text-[#B34728]">কারণ: </strong>
                      {issue.rootReasonBn}
                    </p>
                    <p className="text-xs text-[#166534] leading-relaxed">
                      <strong>সমাধান: </strong>
                      {issue.solutionBn}
                    </p>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {issue.plantToEdit && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onStartEditPlant(issue.plantToEdit!);
                          }}
                          className="px-2.5 py-1 bg-[#1B8354] hover:bg-[#146c44] text-white text-xs font-bold rounded-lg cursor-pointer"
                        >
                          &ldquo;{issue.plantToEdit.nameBn}&rdquo; এডিট করুন
                        </button>
                      )}
                      {issue.canAutoBugFix && (
                        <button
                          type="button"
                          disabled={isRunningBugFix}
                          onClick={onRunBugFix}
                          className="px-2.5 py-1 bg-[#142318] hover:bg-[#203425] disabled:opacity-60 text-white text-xs font-bold rounded-lg inline-flex items-center gap-1 cursor-pointer"
                        >
                          {isRunningBugFix && <Loader2 className="w-3 h-3 animate-spin" />}
                          <span>
                            {isRunningBugFix
                              ? 'মেরামত চলছে...'
                              : '১-ক্লিকে স্বয়ংক্রিয় বাগ ফিক্স চালান'}
                          </span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          onAskAiRootCause(
                            `এই সমস্যাটি বিস্তারিত ব্যাখ্যা করুন — "${issue.titleBn}" (${issue.whereBn})। মূল কারণ কী এবং স্থায়ী সমাধান কীভাবে করবো?`
                          )
                        }
                        className="px-2.5 py-1 bg-white border border-[#D5C9B8] text-[#142318] text-xs font-bold rounded-lg cursor-pointer"
                      >
                        AI-কে জিজ্ঞেস করুন
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {diagnosticsTab === 'duplicates' && (
            <div className="space-y-3">
              <div className="p-3 bg-[#FBF9F5] rounded-xl border border-[#E8E1D5] space-y-1">
                <p className="font-bold text-[#142318]">ডুপ্লিকেট ছবি ও চারা বিশ্লেষণ:</p>
                <p className="text-xs text-[#526356] tabular-nums">
                  {duplicateAnalysis.totalCount === 0
                    ? 'আপনার ক্যাটালগের সব ছবি ও নাম সম্পূর্ণ ইউনিক। কোনো ডুপ্লিকেট পাওয়া যায়নি।'
                    : `মোট ${duplicateAnalysis.duplicateImages.length} টি একই ছবি গ্রুপ এবং ${duplicateAnalysis.duplicateNames.length} টি একই নামের গ্রুপ পাওয়া গেছে।`}
                </p>
              </div>

              {duplicateAnalysis.duplicateImages.map((group, idx) => (
                <div key={idx} className="p-3 bg-white border border-[#FCD5CC] rounded-xl space-y-2">
                  <div className="flex items-center gap-2">
                    <img
                      src={resolvePlantImageUrl(group.url, PUJA_IMAGE)}
                      alt="duplicate"
                      className="w-12 h-12 rounded-xl object-cover border border-[#DDD5C7]"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-[#B34728]">
                        একই ছবি ব্যবহৃত গাছ ({group.plants.length} টি):
                      </p>
                      <p className="text-xs text-[#526356] truncate">
                        {group.plants.map((p) => p.nameBn).join(', ')}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1.5 pt-1">
                    {group.plants.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between gap-2 p-2 bg-[#FAF8F5] rounded-lg"
                      >
                        <span className="font-bold truncate text-xs tabular-nums">
                          {p.nameBn} {p.colorBn ? `(${p.colorBn})` : ''} · ₹{p.options[0]?.price}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            onSoftDelete(p);
                            onClose();
                          }}
                          className="px-2 py-1 bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#B34728] text-xs font-bold rounded-md cursor-pointer shrink-0"
                        >
                          ট্র্যাশে পাঠান
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {duplicateAnalysis.totalCount === 0 && (
                <div className="py-8 text-center text-[#526356] space-y-2">
                  <ShieldCheck className="w-10 h-10 text-[#1B8354] mx-auto" />
                  <p className="font-bold text-sm text-[#142318]">সবকিছু ঠিক আছে!</p>
                </div>
              )}
            </div>
          )}

          {diagnosticsTab === 'bugs' && (
            <div className="space-y-3">
              <div className="p-3 bg-[#F0FDF4] border border-[#86EFAC] rounded-xl flex items-center justify-between gap-2">
                <div>
                  <p className="font-bold text-[#166534]">স্বয়ংক্রিয় বাগ ফিক্সার</p>
                  <p className="text-xs text-[#15803D]">
                    অসম্পূর্ণ/ডুপ্লিকেট বিবরণ, শূন্য মূল্য, ছবিহীন চারা ও যত্ন নির্দেশাবলীর ত্রুটি ১-ক্লিকে মেরামত
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isRunningBugFix}
                  onClick={onRunBugFix}
                  className="px-3 py-1.5 bg-[#1B8354] hover:bg-[#146c44] disabled:opacity-60 text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  {isRunningBugFix && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isRunningBugFix ? 'মেরামত চলছে...' : 'এখনই ফিক্স করুন'}</span>
                </button>
              </div>

              {bugFixLog.length > 0 && (
                <div className="p-3 bg-[#FAF8F5] border border-[#E8E1D5] rounded-xl space-y-1.5 font-mono text-xs">
                  <p className="font-bold text-[#142318] font-sans-bn">মেরামত ফলাফল:</p>
                  {bugFixLog.map((log, i) => (
                    <p key={i} className="text-[#1B8354] flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 shrink-0" />
                      <span>{log}</span>
                    </p>
                  ))}
                </div>
              )}

              <div className="p-3 bg-white border border-[#E8E1D5] rounded-xl space-y-1.5 text-xs text-[#526356]">
                <p className="font-bold text-[#142318]">স্বয়ংক্রিয় চেকপয়েন্ট তালিকা:</p>
                <p>১. প্রতিটি চারার ইউনিক ও বিস্তারিত বাংলা বিবরণ (৪৫+ অক্ষর, ডুপ্লিকেটমুক্ত) নিশ্চিতকরণ</p>
                <p>২. প্রতিটি চারার অন্তত একটি ভ্যালিড মূল্য (₹৫০+) ও পলি গ্রো-ব্যাগ অপশন যুক্তকরণ</p>
                <p>৩. রোদ, মাটি, জল, ইংরেজি বিবরণ (EN) ও বৈজ্ঞানিক নামের মানসম্মত রূপায়ন</p>
              </div>
            </div>
          )}

          {diagnosticsTab === 'health' && (
            <div className="space-y-3">
              {dbHealthMetrics.alerts.length > 0 && (
                <div className="p-3 bg-[#FEF2F2] border border-[#FCA5A5] rounded-xl space-y-1 text-[#991B1B]">
                  <p className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>ডাটাবেস সতর্কতা ({dbHealthMetrics.alerts.length}টি):</span>
                  </p>
                  <p className="text-xs">{dbHealthMetrics.alerts[0].titleBn}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-[#FBF9F5] border border-[#E8E1D5] rounded-xl">
                  <p className="text-xs text-[#785942] font-bold">মোট সক্রিয় চারা</p>
                  <p className="text-xl font-bold font-mono tabular-nums text-[#1B8354]">
                    {activePlants.length} টি
                  </p>
                </div>
                <div className="p-3 bg-[#FBF9F5] border border-[#E8E1D5] rounded-xl">
                  <p className="text-xs text-[#785942] font-bold">মোট সার্ভার ডকুমেন্ট</p>
                  <p className="text-xl font-bold font-mono tabular-nums text-[#142318]">
                    {dbHealthMetrics.effectiveTotalDocs} টি
                  </p>
                </div>
                <div className="p-3 bg-[#FBF9F5] border border-[#E8E1D5] rounded-xl">
                  <p className="text-xs text-[#785942] font-bold">আজকের রিড / রাইট</p>
                  <p className="text-sm font-bold font-mono tabular-nums text-[#142318] mt-0.5">
                    {dbMonitorStats.today.serverReads} R · {dbMonitorStats.today.writes} W
                  </p>
                </div>
                <div className="p-3 bg-[#FBF9F5] border border-[#E8E1D5] rounded-xl">
                  <p className="text-xs text-[#785942] font-bold">মোট সাইজ / ট্র্যাশ</p>
                  <p className="text-sm font-bold font-mono tabular-nums text-[#142318] mt-0.5">
                    {formatBytesReadable(dbHealthMetrics.totalEstimatedBytes)} · {trashedCount} ট্র্যাশ
                  </p>
                </div>
              </div>

              <div className="p-3 bg-white border border-[#E8E1D5] rounded-xl space-y-2">
                <p className="font-bold text-[#142318]">ক্যাটেগরি অনুযায়ী চারার সংখ্যা:</p>
                {ADMIN_CATEGORIES.map((cat) => {
                  const count = activePlants.filter((p) => p.category === cat).length;
                  return (
                    <div key={cat} className="flex items-center justify-between text-xs">
                      <span className="text-[#526356] truncate">{cat}</span>
                      <span className="font-bold font-mono tabular-nums text-[#142318]">{count} টি</span>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSwitchTab('settings');
                }}
                className="w-full py-2.5 px-3 bg-[#142318] hover:bg-[#203425] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Database className="w-3.5 h-3.5 text-[#A3E635]" />
                <span>বিস্তারিত নিরাপত্তা ও ডাটাবেস হেলথ খুলুন</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
