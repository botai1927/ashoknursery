import { useState, useMemo } from 'react';
import {
  History,
  Search,
  Trash2,
  RefreshCw,
  Wrench,
  Camera,
  PlusCircle,
  Edit3,
  Settings,
  ShieldCheck,
  Calendar,
  Clock,
} from 'lucide-react';
import type { AdminActivityLogItem } from '../types/nursery';
import { resolvePlantImageUrl } from '../utils/imageUrl';
import { PUJA_IMAGE } from '../data/brahmyamanCatalog';

interface AdminActivityLogProps {
  activityLogs: AdminActivityLogItem[];
  onCleanupOldLogs: (maxKeep?: number, silent?: boolean) => void;
  isLoading?: boolean;
}

type LogFilterCategory = 'all' | 'fixes_updates' | 'deletions' | 'additions_uploads' | 'settings';

export function AdminActivityLog({
  activityLogs,
  onCleanupOldLogs,
  isLoading = false,
}: AdminActivityLogProps) {
  const [filterCategory, setFilterCategory] = useState<LogFilterCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCleaning, setIsCleaning] = useState<boolean>(false);

  const filteredLogs = useMemo(() => {
    return activityLogs.filter((log) => {
      // Category filter
      if (filterCategory === 'fixes_updates') {
        if (log.actionType !== 'plant_edit' && log.actionType !== 'price_update') return false;
      } else if (filterCategory === 'deletions') {
        if (
          log.actionType !== 'plant_delete' &&
          log.actionType !== 'trash_empty' &&
          log.actionType !== 'permanent_delete' &&
          log.actionType !== 'plant_restore'
        )
          return false;
      } else if (filterCategory === 'additions_uploads') {
        if (log.actionType !== 'plant_add' && log.actionType !== 'photo_upload') return false;
      } else if (filterCategory === 'settings') {
        if (log.actionType !== 'settings_change') return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = (log.titleBn || '').toLowerCase().includes(q);
        const descMatch = (log.descriptionBn || '').toLowerCase().includes(q);
        const plantMatch = (log.plantNameBn || '').toLowerCase().includes(q);
        const typeMatch = (log.actionType || '').toLowerCase().includes(q);
        if (!titleMatch && !descMatch && !plantMatch && !typeMatch) return false;
      }

      return true;
    });
  }, [activityLogs, filterCategory, searchQuery]);

  const stats = useMemo(() => {
    let fixesCount = 0;
    let deletionsCount = 0;
    let uploadsCount = 0;
    let settingsCount = 0;

    for (const log of activityLogs) {
      if (log.actionType === 'plant_edit' || log.actionType === 'price_update') fixesCount++;
      else if (
        log.actionType === 'plant_delete' ||
        log.actionType === 'trash_empty' ||
        log.actionType === 'permanent_delete' ||
        log.actionType === 'plant_restore'
      )
        deletionsCount++;
      else if (log.actionType === 'plant_add' || log.actionType === 'photo_upload') uploadsCount++;
      else if (log.actionType === 'settings_change') settingsCount++;
    }

    return {
      total: activityLogs.length,
      fixesCount,
      deletionsCount,
      uploadsCount,
      settingsCount,
    };
  }, [activityLogs]);

  const handleCleanup = async () => {
    if (isCleaning) return;
    setIsCleaning(true);
    try {
      await onCleanupOldLogs(100, false);
    } finally {
      setIsCleaning(false);
    }
  };

  const getActionIcon = (actionType: AdminActivityLogItem['actionType']) => {
    switch (actionType) {
      case 'plant_edit':
      case 'price_update':
        return <Wrench className="w-4 h-4 text-[#1B8354]" />;
      case 'plant_delete':
      case 'permanent_delete':
      case 'trash_empty':
        return <Trash2 className="w-4 h-4 text-[#B34728]" />;
      case 'plant_restore':
        return <RefreshCw className="w-4 h-4 text-[#2563EB]" />;
      case 'plant_add':
        return <PlusCircle className="w-4 h-4 text-[#16A34A]" />;
      case 'photo_upload':
        return <Camera className="w-4 h-4 text-[#D97706]" />;
      case 'settings_change':
        return <Settings className="w-4 h-4 text-[#785942]" />;
      default:
        return <Edit3 className="w-4 h-4 text-[#142318]" />;
    }
  };

  const getActionBadgeStyle = (actionType: AdminActivityLogItem['actionType']) => {
    switch (actionType) {
      case 'plant_edit':
      case 'price_update':
        return 'bg-[#F0FDF4] text-[#166534] border-[#86EFAC]';
      case 'plant_delete':
      case 'permanent_delete':
      case 'trash_empty':
        return 'bg-[#FEF2F2] text-[#991B1B] border-[#FCA5A5]';
      case 'plant_restore':
        return 'bg-[#EFF6FF] text-[#1E40AF] border-[#93C5FD]';
      case 'plant_add':
        return 'bg-[#F0FDF4] text-[#15803D] border-[#86EFAC]';
      case 'photo_upload':
        return 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]';
      case 'settings_change':
        return 'bg-[#F5EFE6] text-[#785942] border-[#D5C9B8]';
      default:
        return 'bg-[#FAF8F5] text-[#142318] border-[#E8E1D5]';
    }
  };

  const getActionLabelBn = (actionType: AdminActivityLogItem['actionType']) => {
    switch (actionType) {
      case 'plant_edit':
        return 'সম্পাদনা / ফিক্স';
      case 'price_update':
        return 'মূল্য আপডেট';
      case 'plant_delete':
        return 'ট্র্যাশে প্রেরণ';
      case 'permanent_delete':
        return 'স্থায়ী মুছে ফেলা';
      case 'trash_empty':
        return 'ট্র্যাশ খালি';
      case 'plant_restore':
        return 'পুনরুদ্ধার';
      case 'plant_add':
        return 'নতুন চারা সংযোজন';
      case 'photo_upload':
        return 'ছবি আপলোড';
      case 'settings_change':
        return 'সেটিংস পরিবর্তন';
      default:
        return 'অন্যান্য কার্যক্রম';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-white border border-[#E8E1D5] rounded-2xl p-4 sm:p-5 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5 text-[#142318]">
            <div className="w-10 h-10 rounded-2xl bg-[#1B8354]/10 text-[#1B8354] flex items-center justify-center shrink-0">
              <History className="w-5 h-5 text-[#1B8354]" />
            </div>
            <div>
              <h2 className="font-serif-bn text-base sm:text-lg font-bold">
                অ্যাডমিন অ্যাক্টিভিটি লগ (Firestore audit_logs)
              </h2>
              <p className="text-[11px] text-[#526356]">
                ক্যাটালগ ব্যাচ আপডেট, বাগ ফিক্স, চারা মুছে ফেলা ও সমস্ত অ্যাডমিন কার্যক্রমের কালানুক্রমিক ইতিহাস
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              disabled={isCleaning || activityLogs.length <= 10}
              onClick={handleCleanup}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#FAF8F5] hover:bg-[#F0EAE1] disabled:opacity-50 border border-[#D5C9B8] rounded-xl text-xs font-bold text-[#142318] cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-[#B34728]" />
              <span>পুরাতন লগ পরিষ্কার (সর্বোচ্চ ১০০ রাখুন)</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
          <div className="p-3 bg-[#FAF8F5] border border-[#E8E1D5] rounded-xl">
            <p className="text-[10px] text-[#785942] font-bold">মোট লগ এন্ট্রি</p>
            <p className="font-mono text-base sm:text-lg font-bold text-[#142318] tabular-nums">
              {stats.total} টি
            </p>
          </div>
          <div className="p-3 bg-[#F0FDF4] border border-[#86EFAC] rounded-xl">
            <p className="text-[10px] text-[#166534] font-bold">আপডেট ও ফিক্স</p>
            <p className="font-mono text-base sm:text-lg font-bold text-[#1B8354] tabular-nums">
              {stats.fixesCount} টি
            </p>
          </div>
          <div className="p-3 bg-[#FEF2F2] border border-[#FCA5A5] rounded-xl">
            <p className="text-[10px] text-[#991B1B] font-bold">মুছে ফেলা ও ট্র্যাশ</p>
            <p className="font-mono text-base sm:text-lg font-bold text-[#B34728] tabular-nums">
              {stats.deletionsCount} টি
            </p>
          </div>
          <div className="p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl">
            <p className="text-[10px] text-[#B45309] font-bold">ছবি ও সংযোজন</p>
            <p className="font-mono text-base sm:text-lg font-bold text-[#D97706] tabular-nums">
              {stats.uploadsCount} টি
            </p>
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white border border-[#E8E1D5] rounded-2xl p-3.5 sm:p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
            {(
              [
                { id: 'all', label: `সব লগ (${activityLogs.length})` },
                { id: 'fixes_updates', label: `ফিক্স ও আপডেট (${stats.fixesCount})` },
                { id: 'deletions', label: `মুছে ফেলা (${stats.deletionsCount})` },
                { id: 'additions_uploads', label: `সংযোজন/ছবি (${stats.uploadsCount})` },
                { id: 'settings', label: `সেটিংস (${stats.settingsCount})` },
              ] as const
            ).map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setFilterCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 tabular-nums ${
                  filterCategory === cat.id
                    ? 'bg-[#142318] text-white shadow-2xs'
                    : 'bg-[#FAF8F5] text-[#785942] hover:bg-[#F0EAE1] hover:text-[#142318]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#785942]" />
            <input
              type="text"
              placeholder="লগ বা চারার নাম দিয়ে খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#FAF8F5] border border-[#D5C9B8] rounded-xl text-xs text-[#142318] placeholder-[#785942] focus:outline-none focus:border-[#1B8354]"
            />
          </div>
        </div>
      </div>

      {/* Logs Feed */}
      <div className="bg-white border border-[#E8E1D5] rounded-2xl p-4 sm:p-5 space-y-3">
        {isLoading ? (
          <div className="py-12 text-center text-[#526356] space-y-2">
            <RefreshCw className="w-8 h-8 animate-spin text-[#1B8354] mx-auto" />
            <p className="font-bold text-sm">অ্যাক্টিভিটি লগ সিঙ্ক হচ্ছে...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-[#526356] space-y-2">
            <History className="w-10 h-10 text-[#D5C9B8] mx-auto" />
            <p className="font-bold text-sm text-[#142318]">কোনো অ্যাক্টিভিটি লগ পাওয়া যায়নি</p>
            <p className="text-xs">
              {searchQuery ? 'আপনার সার্চ কুয়েরির সাথে কোনো লগ মেলে না।' : 'ক্যাটালগ আপডেট বা ফিক্স করলে এখানে ইতিহাস সংরক্ষিত হবে।'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 bg-[#FAF8F5] hover:bg-[#F5EFE6] border border-[#E8E1D5] rounded-xl transition-all flex items-start gap-3"
              >
                {/* Thumbnail / Action Icon */}
                <div className="shrink-0 pt-0.5">
                  {log.thumbnail ? (
                    <img
                      src={resolvePlantImageUrl(log.thumbnail, PUJA_IMAGE)}
                      alt=""
                      className="w-10 h-10 rounded-xl object-cover border border-[#D5C9B8]"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-white border border-[#D5C9B8] flex items-center justify-center shadow-2xs">
                      {getActionIcon(log.actionType)}
                    </div>
                  )}
                </div>

                {/* Log Details */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-serif-bn text-xs sm:text-sm font-bold text-[#142318]">
                        {log.titleBn}
                      </h4>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getActionBadgeStyle(
                          log.actionType
                        )}`}
                      >
                        {getActionLabelBn(log.actionType)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-[#785942] font-mono tabular-nums">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {log.dateBn}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {log.timeBn}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-[#526356] leading-relaxed">
                    {log.descriptionBn}
                  </p>

                  {log.plantNameBn && (
                    <p className="text-[11px] text-[#1B8354] font-bold pt-0.5">
                      সংশ্লিষ্ট চারা: {log.plantNameBn}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-3.5 bg-[#F0FDF4] border border-[#86EFAC] rounded-2xl flex items-start gap-2.5 text-xs text-[#166534] leading-relaxed">
        <ShieldCheck className="w-4 h-4 text-[#1B8354] shrink-0 mt-0.5" />
        <p>
          <strong>অডিট ট্রেইল সুরক্ষা:</strong> সমস্ত অ্যাডমিন কার্যক্রম সরাসরি Firestore <code>activity_logs</code> কালেকশনে এনক্রিপ্টেড ও সুরক্ষিতভাবে সিঙ্ক হয়, যা একাধিক অ্যাডমিন সেশনে সম্পূর্ণ স্বচ্ছতা বজায় রাখে।
        </p>
      </div>
    </div>
  );
}
