import {
  ShieldCheck,
  Mail,
  CheckCircle2,
  Eye,
  LogOut,
  Database,
  RefreshCw,
  AlertTriangle,
  HardDrive,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import {
  formatBytesReadable,
  resetDailyMonitorCounter,
  type StoredMonitorState,
} from '../utils/firestoreMonitor';

export interface DbHealthAlert {
  id: string;
  severity: 'critical' | 'warning';
  titleBn: string;
  detailBn: string;
  actionBn: string;
}

export interface DbHealthMetrics {
  totalPlantBytes: number;
  totalLogsBytes: number;
  totalEstimatedBytes: number;
  largestPlantBytes: number;
  largestPlantName: string;
  largestDocPct: number;
  base64PhotoCount: number;
  effectivePlantDocs: number;
  effectiveLogsDocs: number;
  effectiveTotalDocs: number;
  readsPct: number;
  writesPct: number;
  deletesPct: number;
  storagePct: number;
  readsPerFreshVisitor: number;
  estimatedDailyVisitorCapacity: number;
  alerts: DbHealthAlert[];
  statusLevel: 'healthy' | 'warning' | 'critical';
}

export interface ServerDocCountsState {
  plants: number | null;
  trashPlants: number | null;
  logs: number | null;
  deletedMeta: number | null;
  total: number | null;
  checkedAt: string | null;
  isLoading: boolean;
  error: string | null;
}

interface AdminSettingsTabProps {
  verifiedEmail: string | null;
  fallbackEmail: string | null;
  isOwner: boolean;
  isAdminSimpleView: boolean;
  previewAdminMode: boolean;
  onTogglePreviewAdminMode: () => void;
  authorizedEmailsList: string[];
  ownerEmailsList: string[];
  onLogout: () => void;
  serverSecurityMeta: {
    rateLimitMode: 'firestore-shared' | 'in-memory-fallback';
    rateLimitReason: string | null;
    hasExplicitServiceAccount: boolean;
    revocationMethod: string | null;
  };
  dbHealthMetrics: DbHealthMetrics;
  dbMonitorStats: StoredMonitorState;
  serverDocCounts: ServerDocCountsState;
  activePlantsCount: number;
  trashedPlantsCount: number;
  onRefreshDocCounts: () => void;
  isCleaningLogs: boolean;
  onCleanupOldLogs: (maxKeep?: number, silent?: boolean) => void;
  onShowToast: (msg: string, type?: 'success' | 'warning' | 'info') => void;
}

export function AdminSettingsTab({
  verifiedEmail,
  fallbackEmail,
  isOwner,
  isAdminSimpleView,
  previewAdminMode,
  onTogglePreviewAdminMode,
  authorizedEmailsList,
  ownerEmailsList,
  onLogout,
  serverSecurityMeta,
  dbHealthMetrics,
  dbMonitorStats,
  serverDocCounts,
  activePlantsCount,
  trashedPlantsCount,
  onRefreshDocCounts,
  isCleaningLogs,
  onCleanupOldLogs,
  onShowToast,
}: AdminSettingsTabProps) {
  return (
    <div className="space-y-4">
      {/* 1. Verified Session & Access Control */}
      <section className="bg-white border border-[#E8E1D5] rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 text-[#142318]">
            <ShieldCheck className="w-5 h-5 text-[#1B8354]" />
            <h2 className="font-serif-bn text-base sm:text-lg font-bold">
              অ্যাডমিন অ্যাকাউন্ট ও রোল নিয়ন্ত্রণ
            </h2>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="px-3.5 py-2 bg-[#B34728] hover:bg-[#8F351D] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>লগআউট</span>
          </button>
        </div>

        <div className="p-3.5 bg-[#F0FDF4] border border-[#86EFAC] rounded-xl space-y-1.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs font-bold text-[#142318] flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-[#1B8354]" />
              <span className="font-mono">{verifiedEmail || fallbackEmail}</span>
            </span>
            <span className="text-xs font-bold text-[#166534]">
              {isOwner ? 'Owner (পূর্ণ অধিকার)' : 'Admin (সহজ ও নিরাপদ মোড)'}
            </span>
          </div>
          <p className="text-[11px] text-[#166534]">
            Firebase Authentication ID টোকেন Express সার্ভার ও Firestore Security Rules দ্বারা যাচাইকৃত।
          </p>
        </div>

        <div className="p-3.5 bg-[#FAF8F5] border border-[#E8E1D5] rounded-xl space-y-2.5">
          <p className="text-xs font-bold text-[#142318]">অনুমোদিত অ্যাকাউন্ট তালিকা:</p>
          <div className="space-y-1.5">
            {authorizedEmailsList.map((em) => {
              const emailIsOwner = ownerEmailsList.includes(em.toLowerCase());
              return (
                <div
                  key={em}
                  className="flex items-center justify-between gap-2 px-3 py-2 bg-white border border-[#E8E1D5] rounded-lg text-xs"
                >
                  <span className="flex items-center gap-1.5 font-mono text-[#142318] truncate">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#1B8354] shrink-0" />
                    <span className="truncate">{em}</span>
                  </span>
                  <span
                    className={`text-[11px] font-bold shrink-0 ${
                      emailIsOwner ? 'text-[#1B8354]' : 'text-[#785942]'
                    }`}
                  >
                    {emailIsOwner ? 'Owner' : 'Admin (Simple View)'}
                  </span>
                </div>
              );
            })}
          </div>

          {isOwner && (
            <button
              type="button"
              onClick={onTogglePreviewAdminMode}
              className="w-full h-10 bg-[#142318] hover:bg-[#203425] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Eye className="w-4 h-4 text-[#A3E635]" />
              <span>
                {previewAdminMode
                  ? 'Owner পূর্ণ মোডে ফিরে যান'
                  : 'Admin সহজ ও বড়-ফন্ট ভিউ প্রিভিউ করুন'}
              </span>
            </button>
          )}
        </div>
      </section>

      {/* 2. Server Security & Rate-Limit Diagnostics */}
      <section className="bg-white border border-[#E8E1D5] rounded-2xl p-4 sm:p-5 space-y-3">
        <h3 className="font-serif-bn text-sm sm:text-base font-bold text-[#142318]">
          সার্ভার নিরাপত্তা ও রেট-লিমিট স্ট্যাটাস
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-[#FAF8F5] border border-[#E8E1D5] rounded-xl space-y-1">
            <p className="text-[11px] text-[#785942] font-semibold">AI ও আপলোড রেট-লিমিট</p>
            <p className="font-mono font-bold text-[#142318]">
              {serverSecurityMeta.rateLimitMode === 'firestore-shared'
                ? 'Shared Firestore (ডিস্ট্রিবিউটেড ✓)'
                : 'In-Memory Instance Fallback'}
            </p>
            <p className="text-[11px] text-[#526356]">
              {serverSecurityMeta.hasExplicitServiceAccount
                ? 'FIREBASE_SERVICE_ACCOUNT_JSON সক্রিয় আছে।'
                : 'Secrets-এ FIREBASE_SERVICE_ACCOUNT_JSON না থাকায় একক-ইনস্ট্যান্স মেমোরি মোড চলছে।'}
            </p>
          </div>

          <div className="p-3 bg-[#FAF8F5] border border-[#E8E1D5] rounded-xl space-y-1">
            <p className="text-[11px] text-[#785942] font-semibold">টোকেন যাচাই পদ্ধতি</p>
            <p className="font-mono font-bold text-[#142318]">
              {serverSecurityMeta.revocationMethod === 'admin-sdk'
                ? 'Firebase Admin SDK (স্থানীয় যাচাই)'
                : 'Identity Toolkit Live Lookup'}
            </p>
            <p className="text-[11px] text-[#526356]">
              Fail-Closed নীতি সক্রিয় — অবৈধ বা বাতিল সেশন তাৎক্ষণিক ব্লক হয়।
            </p>
          </div>
        </div>
      </section>

      {/* 3. Live Database Health & Spark Quota Monitor */}
      <section className="bg-white border border-[#E8E1D5] rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 text-[#142318]">
            <Database className="w-5 h-5 text-[#1B8354]" />
            <div>
              <h2 className="font-serif-bn text-base font-bold">
                Firestore ডাটাবেস হেলথ ও ফ্রি কোটা মনিটর
              </h2>
              <p className="text-[11px] text-[#526356]">
                রিয়েল-টাইম ডকুমেন্ট সংখ্যা, রিড/রাইট মিটার ও লগ রক্ষণাবেক্ষণ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold ${
                dbHealthMetrics.statusLevel === 'critical'
                  ? 'text-[#B34728]'
                  : dbHealthMetrics.statusLevel === 'warning'
                  ? 'text-[#D97706]'
                  : 'text-[#1B8354]'
              }`}
            >
              {dbHealthMetrics.statusLevel === 'critical'
                ? 'জরুরি সতর্কতা'
                : dbHealthMetrics.statusLevel === 'warning'
                ? `${dbHealthMetrics.alerts.length}টি সতর্কতা`
                : 'স্বাভাবিক ✓'}
            </span>

            <button
              type="button"
              disabled={serverDocCounts.isLoading}
              onClick={onRefreshDocCounts}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#FAF8F5] hover:bg-[#F0EAE1] border border-[#D5C9B8] rounded-xl text-[11px] font-bold text-[#142318] cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3 h-3 text-[#1B8354] ${serverDocCounts.isLoading ? 'animate-spin' : ''}`}
              />
              <span>কাউন্ট রিফ্রেশ</span>
            </button>
          </div>
        </div>

        {/* Alerts */}
        {dbHealthMetrics.alerts.length > 0 ? (
          <div className="space-y-2">
            {dbHealthMetrics.alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-xl border space-y-1 text-xs ${
                  alert.severity === 'critical'
                    ? 'bg-[#FEF2F2] border-[#FCA5A5] text-[#991B1B]'
                    : 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]'
                }`}
              >
                <p className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{alert.titleBn}</span>
                </p>
                <p className="text-[11px] opacity-90">{alert.detailBn}</p>
                <p className="text-[11px] font-semibold">করণীয়: {alert.actionBn}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-3 bg-[#F0FDF4] border border-[#86EFAC] rounded-xl flex items-center gap-2 text-xs text-[#166534]">
            <ShieldCheck className="w-4 h-4 text-[#1B8354] shrink-0" />
            <span>
              সকল রিড, রাইট, স্টোরেজ ও ডকুমেন্ট সাইজ ফ্রি টিয়ারের নিরাপদ সীমার মধ্যে রয়েছে।
            </span>
          </div>
        )}

        {serverDocCounts.error && (
          <p className="text-[11px] text-[#B34728] font-semibold bg-[#FEF2F2] p-2.5 rounded-xl border border-[#FCA5A5]">
            {serverDocCounts.error}
          </p>
        )}

        {/* Document Counts Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 bg-[#FBF9F5] border border-[#E8E1D5] rounded-xl">
            <p className="text-[10px] font-bold text-[#785942]">মোট সার্ভার ডকুমেন্ট</p>
            <p className="text-lg font-bold font-mono tabular-nums text-[#142318]">
              {dbHealthMetrics.effectiveTotalDocs}
            </p>
            <p className="text-[10px] text-[#526356]">
              {serverDocCounts.checkedAt ? `লাইভ (${serverDocCounts.checkedAt})` : 'ক্যাশ গণনা'}
            </p>
          </div>

          <div className="p-3 bg-[#FBF9F5] border border-[#E8E1D5] rounded-xl">
            <p className="text-[10px] font-bold text-[#785942]">plants + trash</p>
            <p className="text-lg font-bold font-mono tabular-nums text-[#1B8354]">
              {dbHealthMetrics.effectivePlantDocs}
            </p>
            <p className="text-[10px] text-[#526356] tabular-nums">
              সক্রিয় {activePlantsCount} · ট্র্যাশ {trashedPlantsCount}
            </p>
          </div>

          <div className="p-3 bg-[#FBF9F5] border border-[#E8E1D5] rounded-xl">
            <p className="text-[10px] font-bold text-[#785942]">activity_logs</p>
            <p className="text-lg font-bold font-mono tabular-nums text-[#142318]">
              {dbHealthMetrics.effectiveLogsDocs}
            </p>
            <p className="text-[10px] text-[#526356]">শেয়ার্ড অডিট লগ</p>
          </div>

          <div className="p-3 bg-[#FBF9F5] border border-[#E8E1D5] rounded-xl">
            <p className="text-[10px] font-bold text-[#785942]">ভিজিটর ক্ষমতা/দিন</p>
            <p className="text-lg font-bold font-mono tabular-nums text-[#1B8354]">
              ~{dbHealthMetrics.estimatedDailyVisitorCapacity}
            </p>
            <p className="text-[10px] text-[#526356] tabular-nums">
              {dbHealthMetrics.readsPerFreshVisitor} রিড/জন
            </p>
          </div>
        </div>

        {/* Daily Progress Meters */}
        <div className="p-3.5 bg-[#FAF8F5] border border-[#E8E1D5] rounded-xl space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
            <span className="font-bold text-[#142318] tabular-nums">
              আজকের অপারেশন ({dbMonitorStats.today.dateKey})
            </span>
            <span className="text-[11px] font-semibold text-[#1B8354] tabular-nums">
              IndexedDB ক্যাশে সেভ: {dbMonitorStats.today.cacheHits.toLocaleString()} রিড
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-[#526356]">সার্ভার রিড (Reads):</span>
              <span className="font-mono tabular-nums font-bold text-[#142318]">
                {dbMonitorStats.today.serverReads.toLocaleString()} / ৫০,০০০ ({dbHealthMetrics.readsPct}%)
              </span>
            </div>
            <div className="w-full h-2 bg-[#E8E1D5] rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  dbHealthMetrics.readsPct >= 85
                    ? 'bg-[#B34728]'
                    : dbHealthMetrics.readsPct >= 70
                    ? 'bg-[#D97706]'
                    : 'bg-[#1B8354]'
                }`}
                style={{ width: `${Math.max(2, dbHealthMetrics.readsPct)}%` }}
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-[#526356]">রাইট অপারেশন (Writes):</span>
              <span className="font-mono tabular-nums font-bold text-[#142318]">
                {dbMonitorStats.today.writes.toLocaleString()} / ২০,০০০ ({dbHealthMetrics.writesPct}%)
              </span>
            </div>
            <div className="w-full h-2 bg-[#E8E1D5] rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  dbHealthMetrics.writesPct >= 70 ? 'bg-[#D97706]' : 'bg-[#1B8354]'
                }`}
                style={{ width: `${Math.max(2, dbHealthMetrics.writesPct)}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-[#526356]">ডিলিট (Deletes):</span>
                <span className="font-mono tabular-nums font-bold text-[#142318]">
                  {dbMonitorStats.today.deletes} / ২০,০০০ ({dbHealthMetrics.deletesPct}%)
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#E8E1D5] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#785942]"
                  style={{ width: `${Math.max(2, dbHealthMetrics.deletesPct)}%` }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-[#526356]">সর্ববৃহৎ ডকুমেন্ট / ১ MB:</span>
                <span className="font-mono tabular-nums font-bold text-[#142318]">
                  {formatBytesReadable(dbHealthMetrics.largestPlantBytes)} ({dbHealthMetrics.largestDocPct}%)
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#E8E1D5] rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    dbHealthMetrics.largestDocPct >= 75
                      ? 'bg-[#B34728]'
                      : dbHealthMetrics.largestDocPct >= 50
                      ? 'bg-[#D97706]'
                      : 'bg-[#1B8354]'
                  }`}
                  style={{ width: `${Math.max(2, dbHealthMetrics.largestDocPct)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-[#785942] pt-2 border-t border-[#E8E1D5] flex-wrap gap-2">
            <span className="flex items-center gap-1 tabular-nums">
              <HardDrive className="w-3 h-3" />
              <span>
                মোট সাইজ: <strong className="text-[#142318]">{formatBytesReadable(dbHealthMetrics.totalEstimatedBytes)}</strong> / 1 GB
              </span>
            </span>

            <div className="flex items-center gap-3 flex-wrap">
              {isOwner && !isAdminSimpleView && (
                <button
                  type="button"
                  disabled={isCleaningLogs}
                  onClick={() => onCleanupOldLogs(100, false)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#B34728] hover:underline cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>{isCleaningLogs ? 'ক্লিন হচ্ছে...' : 'পুরনো লগ ক্লিন'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  resetDailyMonitorCounter();
                  onShowToast('আজকের লোকাল কাউন্টার রিসেট হয়েছে।', 'info');
                }}
                className="text-[11px] font-bold text-[#785942] hover:text-[#142318] underline cursor-pointer"
              >
                কাউন্টার রিসেট
              </button>

              <a
                href="https://console.firebase.google.com/project/hidden-catalyst-7ln7n/firestore/databases/ai-studio-brahmyamannurser-7e886e4b-1ef0-4a8e-b1f9-77dc3b21d71b/data?openUpgradeDialog=true"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1B8354] hover:underline"
              >
                <span>Firebase কনসোল</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* 7-Day Recorded Pattern History */}
        {dbMonitorStats.history.length > 0 && (
          <div className="p-3 bg-[#FBF9F5] border border-[#E8E1D5] rounded-xl space-y-1.5">
            <p className="text-[11px] font-bold text-[#142318]">বিগত দিনের ব্যবহারের রেকর্ড:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {dbMonitorStats.history.slice(0, 4).map((day) => (
                <div
                  key={day.dateKey}
                  className="flex items-center justify-between px-2.5 py-1.5 bg-white border border-[#E8E1D5] rounded-lg text-[10px] font-mono tabular-nums"
                >
                  <span className="font-bold text-[#142318]">{day.dateKey}</span>
                  <span className="text-[#526356]">
                    R:{day.serverReads} · W:{day.writes} · D:{day.deletes}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
