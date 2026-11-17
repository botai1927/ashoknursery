import {
  Sparkles,
  RefreshCw,
  Bot,
  ShieldCheck,
  Cpu,
  Activity,
} from 'lucide-react';

export type AiProviderChoice = 'auto' | 'gemini';
export type AiModelChoice = 'auto' | 'flash25' | 'fast' | 'hydrogen';

export interface GeminiSlotSnapshot {
  slotId: string;
  envVarName: string;
  labelBn: string;
  configured: boolean;
  isActive: boolean;
  status: 'ready' | 'cooldown' | 'exhausted' | 'invalid' | 'unconfigured';
  cooldownSecondsRemaining: number;
  requestsTotal: number;
  requestsThisMinute: number;
  minuteRateLimit: number;
  lastUsedAt: string | null;
  lastUsedModel: string | null;
  lastErrorBn: string | null;
}

export interface AdminAiStatusSnapshot {
  preferredProvider?: AiProviderChoice;
  activeSlotId: string | null;
  activeSlotLabel: string;
  activeEnvVar: string | null;
  configuredCount: number;
  totalSlots: number;
  minuteRateLimit: number;
  requestsThisMinute: number;
  activeSlotCooldownSec: number;
  slots: GeminiSlotSnapshot[];
}

export interface SystemDiagnosticsSnapshot {
  checkedAtIso: string;
  server: {
    uptimeSec: number;
    nodeVersion: string;
    memoryRssMb: number;
  };
  security: {
    rateLimitMode: string;
    rateLimitReason: string | null;
    hasExplicitServiceAccount: boolean;
    authRevocationMode: string;
  };
}

interface AdminApiTabProps {
  aiStatus: AdminAiStatusSnapshot | null;
  hasBackupGeminiKey: boolean;
  modelType: AiModelChoice;
  setModelType: (m: AiModelChoice) => void;
  aiProviderChoice?: AiProviderChoice;
  onChangeAiProvider?: (provider: AiProviderChoice) => void;
  isRotatingKeySlot: boolean;
  onRotateAiSlot: (
    action: 'next' | 'select' | 'reset_cooldown' | 'set_provider',
    slotId?: string,
    provider?: AiProviderChoice
  ) => void;
  onRefreshAiStatus: () => void;
  onOpenAiChat: () => void;
  diagnosticsSnapshot: SystemDiagnosticsSnapshot | null;
  isLoadingDiagnostics: boolean;
  onRefreshDiagnostics: () => void;
  runtimeIssuesCount: number;
}

export function AdminApiTab({
  aiStatus,
  hasBackupGeminiKey: _hasBackupGeminiKey,
  modelType,
  setModelType,
  isRotatingKeySlot,
  onRotateAiSlot,
  onRefreshAiStatus,
  onOpenAiChat,
  diagnosticsSnapshot,
  isLoadingDiagnostics,
  onRefreshDiagnostics,
  runtimeIssuesCount,
}: AdminApiTabProps) {
  const isAiStatusLoading = aiStatus === null;
  const slotsToShow: GeminiSlotSnapshot[] = aiStatus?.slots || [];

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-white border border-[#E8E1D5] rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2.5 text-[#142318]">
            <div className="w-9 h-9 rounded-2xl bg-[#1B8354]/10 text-[#1B8354] flex items-center justify-center shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif-bn text-base sm:text-lg font-bold">
                Google Gemini AI কনফিগারেশন ও কোটা স্ট্যাটাস
              </h2>
              <p className="text-[11px] text-[#526356]">
                ৪-স্লট Gemini API Key রোটেশন পুল ও সার্ভার ডায়াগনস্টিকস — সব Secret সার্ভার সাইডে সুরক্ষিত
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => {
                onRefreshAiStatus();
                onRefreshDiagnostics();
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#FAF8F5] hover:bg-[#F0EAE1] border border-[#D5C9B8] rounded-xl text-[11px] font-bold text-[#142318] cursor-pointer"
            >
              <RefreshCw className="w-3 h-3 text-[#1B8354]" />
              <span>রিফ্রেশ</span>
            </button>

            <button
              type="button"
              onClick={onOpenAiChat}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#142318] hover:bg-[#203425] text-white rounded-xl text-[11px] font-bold cursor-pointer"
            >
              <Bot className="w-3.5 h-3.5 text-[#A3E635]" />
              <span>Gemini AI চ্যাট খুলুন</span>
            </button>
          </div>
        </div>
      </div>

      {/* Gemini 4-Slot Pool & Rate Meter */}
      <div className="bg-white border border-[#E8E1D5] rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-2 text-[#142318]">
          <Sparkles className="w-5 h-5 text-[#1B8354]" />
          <div>
            <h3 className="font-serif-bn text-sm sm:text-base font-bold">
              Gemini মাল্টি-স্লট কী পুল ও কোটা মিটার
            </h3>
            <p className="text-[11px] text-[#526356]">
              একটি কী-তে কোটা পূর্ণ (429) হলে স্বয়ংক্রিয়ভাবে পরের কী-তে রোটেশন হয়
            </p>
          </div>
        </div>

        <div className="p-3.5 bg-[#FBF9F5] border border-[#E8E1D5] rounded-xl space-y-2.5">
          <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
            <span className="font-bold text-[#142318]">
              সক্রিয় কী স্লট:{' '}
              <span className="text-[#1B8354]">
                {isAiStatusLoading ? 'লোড হচ্ছে...' : aiStatus.activeSlotLabel}
              </span>
            </span>
            <span
              className={`text-xs font-bold tabular-nums ${
                isAiStatusLoading
                  ? 'text-[#785942]'
                  : (aiStatus?.activeSlotCooldownSec || 0) > 0
                  ? 'text-[#B34728]'
                  : 'text-[#1B8354]'
              }`}
            >
              {isAiStatusLoading
                ? 'যাচাই চলছে...'
                : (aiStatus?.activeSlotCooldownSec || 0) > 0
                ? `কোটা বিরতি (${aiStatus?.activeSlotCooldownSec}s)`
                : '✓ সক্রিয় ও প্রস্তুত'}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] text-[#526356]">
              <span>প্রতি মিনিটের ব্যবহারের হার:</span>
              <span className="font-mono tabular-nums font-bold text-[#142318]">
                {isAiStatusLoading
                  ? '—'
                  : `${aiStatus?.requestsThisMinute ?? 0} / ${aiStatus?.minuteRateLimit ?? 25} অনুরোধ/মিনিট`}
              </span>
            </div>
            <div className="w-full h-2 bg-[#E8E1D5] rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  (aiStatus?.requestsThisMinute || 0) >= 20 ? 'bg-[#B34728]' : 'bg-[#1B8354]'
                }`}
                style={{
                  width: `${
                    isAiStatusLoading
                      ? 0
                      : Math.min(
                          100,
                          Math.round(
                            ((aiStatus?.requestsThisMinute || 0) / (aiStatus?.minuteRateLimit || 25)) * 100
                          )
                        )
                  }%`,
                }}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              disabled={isAiStatusLoading || isRotatingKeySlot || (aiStatus?.configuredCount || 0) <= 1}
              onClick={() => onRotateAiSlot('next')}
              className="px-3 py-1.5 bg-[#142318] hover:bg-[#203425] disabled:opacity-45 text-white text-[11px] font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 text-[#A3E635] ${isRotatingKeySlot ? 'animate-spin' : ''}`} />
              <span>পরবর্তী ব্যাকআপ কী-তে রোটেট করুন</span>
            </button>
            <button
              type="button"
              disabled={isAiStatusLoading || isRotatingKeySlot}
              onClick={() => onRotateAiSlot('reset_cooldown')}
              className="px-3 py-1.5 bg-white hover:bg-[#F5EFE6] border border-[#D5C9B8] text-[#142318] text-[11px] font-bold rounded-xl cursor-pointer disabled:opacity-45"
            >
              সব কোটা/কুলডাউন রিসেট
            </button>
          </div>
        </div>

        {/* 4 Slots Grid */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-[#142318] tabular-nums">
            সার্ভার Secret স্লট তালিকা ({isAiStatusLoading ? '—' : `${aiStatus.configuredCount}/${aiStatus.totalSlots} যুক্ত`}):
          </p>
          {isAiStatusLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[1, 2, 3, 4].map((idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-[#E8E1D5] bg-[#FAF8F5] space-y-2 animate-pulse"
                >
                  <div className="flex justify-between">
                    <div className="h-3.5 w-28 bg-[#E8E1D5] rounded" />
                    <div className="h-3.5 w-14 bg-[#E8E1D5] rounded" />
                  </div>
                  <div className="h-3 w-36 bg-[#EAE4D9] rounded" />
                  <div className="h-3 w-24 bg-[#EAE4D9] rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {slotsToShow.map((slot) => (
                <div
                  key={slot.slotId}
                  className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                    slot.isActive
                      ? 'bg-[#F0FDF4] border-[#1B8354]'
                      : slot.configured
                      ? 'bg-[#FAF8F5] border-[#D5C9B8]'
                      : 'bg-white border-dashed border-[#E8E1D5] opacity-75'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-[#142318]">{slot.labelBn}</span>
                    <span
                      className={`text-[11px] font-bold tabular-nums ${
                        !slot.configured
                          ? 'text-[#785942]'
                          : slot.status === 'cooldown' || slot.status === 'exhausted' || slot.status === 'invalid'
                          ? 'text-[#B34728]'
                          : 'text-[#1B8354]'
                      }`}
                    >
                      {!slot.configured
                        ? 'যুক্ত নেই'
                        : slot.status === 'cooldown'
                        ? `বিরতি ${slot.cooldownSecondsRemaining}s`
                        : slot.status === 'exhausted'
                        ? 'কোটা পূর্ণ (429)'
                        : slot.status === 'invalid'
                        ? 'অবৈধ কী'
                        : slot.isActive
                        ? 'সক্রিয় ✓'
                        : 'প্রস্তুত'}
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-[#526356]">
                    Secret: <span className="font-bold text-[#142318]">{slot.envVarName}</span>
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-[#785942] tabular-nums">
                    <span>
                      কল: {slot.requestsTotal} বার {slot.lastUsedModel ? `(${slot.lastUsedModel})` : ''}
                    </span>
                    {slot.configured && !slot.isActive && (
                      <button
                        type="button"
                        disabled={isRotatingKeySlot}
                        onClick={() => onRotateAiSlot('select', slot.slotId)}
                        className="text-[10px] font-bold text-[#1B8354] hover:underline cursor-pointer"
                      >
                        এটি সক্রিয় করুন
                      </button>
                    )}
                  </div>
                  {slot.lastErrorBn && (
                    <p className="text-[10px] text-[#B34728] font-semibold">{slot.lastErrorBn}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Default Gemini AI Model Selector */}
        <div>
          <label className="block text-xs font-bold text-[#142318] mb-1.5">
            ডিফল্ট Gemini AI মডেল নির্বাচন করুন:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {(
              [
                { id: 'auto', title: 'Auto (Gemini Cascade)', sub: 'স্বয়ংক্রিয় স্মার্ট মডেল নির্বাচন' },
                { id: 'flash25', title: 'Gemini 2.5 Flash', sub: 'স্মার্ট অটো-ফিল ও ফর্ম' },
                { id: 'fast', title: 'Gemini 3.1 Flash Lite', sub: 'সর্বোচ্চ ফ্রি কোটা ও দ্রুত গতি' },
                { id: 'hydrogen', title: 'Gemini 4 Hydrogen', sub: 'গভীর বিশ্লেষণ ও সার্চ' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setModelType(opt.id)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  modelType === opt.id
                    ? 'bg-[#142318] text-white border-[#142318]'
                    : 'bg-[#FAF8F5] text-[#142318] border-[#E8E1D5] hover:border-[#1B8354]'
                }`}
              >
                <p className="text-xs font-bold">{opt.title}</p>
                <p
                  className={`text-[10px] mt-0.5 ${
                    modelType === opt.id ? 'text-[#A3E635]' : 'text-[#785942]'
                  }`}
                >
                  {opt.sub}
                </p>
              </button>
            ))}
          </div>
          <p className="text-[10px] text-[#526356] mt-2 leading-relaxed">
            নোট: নিরাপত্তার জন্য ব্রাউজারে কোনো API Key ইনপুট রাখা হয়নি। অতিরিক্ত Gemini Secret যোগ করতে AI Studio-র <strong>Settings &gt; Secrets</strong> ব্যবহার করুন।
          </p>
        </div>
      </div>

      {/* Live Server & Runtime System Health */}
      <div className="bg-white border border-[#E8E1D5] rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#1B8354]" />
            <h3 className="font-serif-bn text-sm font-bold text-[#142318]">
              সার্ভার ও সিস্টেম ডায়াগনস্টিকস
            </h3>
          </div>
          <button
            type="button"
            disabled={isLoadingDiagnostics}
            onClick={onRefreshDiagnostics}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#FAF8F5] hover:bg-[#F0EAE1] border border-[#D5C9B8] rounded-xl text-[11px] font-bold text-[#142318] cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 text-[#1B8354] ${isLoadingDiagnostics ? 'animate-spin' : ''}`} />
            <span>পুনরায় যাচাই</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 bg-[#FAF8F5] border border-[#E8E1D5] rounded-xl">
            <p className="text-[10px] text-[#785942] font-bold">সার্ভার আপটাইম</p>
            <p className="font-mono font-bold text-[#142318]">
              {diagnosticsSnapshot ? `${diagnosticsSnapshot.server.uptimeSec}s` : 'লোড হচ্ছে...'}
            </p>
          </div>
          <div className="p-2.5 bg-[#FAF8F5] border border-[#E8E1D5] rounded-xl">
            <p className="text-[10px] text-[#785942] font-bold">মেমোরি (RSS)</p>
            <p className="font-mono font-bold text-[#142318]">
              {diagnosticsSnapshot ? `${diagnosticsSnapshot.server.memoryRssMb} MB` : '—'}
            </p>
          </div>
          <div className="p-2.5 bg-[#FAF8F5] border border-[#E8E1D5] rounded-xl">
            <p className="text-[10px] text-[#785942] font-bold">রেট-লিমিট মোড</p>
            <p className="font-mono font-bold text-[#142318] truncate">
              {diagnosticsSnapshot?.security.rateLimitMode || '—'}
            </p>
          </div>
          <div className="p-2.5 bg-[#FAF8F5] border border-[#E8E1D5] rounded-xl">
            <p className="text-[10px] text-[#785942] font-bold">ব্রাউজার এরর ক্যাপচার</p>
            <p
              className={`font-mono font-bold ${
                runtimeIssuesCount > 0 ? 'text-[#B34728]' : 'text-[#1B8354]'
              }`}
            >
              {runtimeIssuesCount === 0 ? '০ টি (সুস্থ)' : `${runtimeIssuesCount} টি সতর্কতা`}
            </p>
          </div>
        </div>

        <div className="p-3 bg-[#F0FDF4] border border-[#86EFAC] rounded-2xl flex items-start gap-2 text-[11px] text-[#166534] leading-relaxed">
          <ShieldCheck className="w-4 h-4 text-[#1B8354] shrink-0 mt-0.5" />
          <p>
            ডায়াগনস্টিকস ও Gemini AI সরাসরি আপনার ক্যাটালগ, ছবি, কোটা এবং রানটাইম ত্রুটি পর্যবেক্ষণ করতে পারে।
          </p>
        </div>
      </div>
    </div>
  );
}
