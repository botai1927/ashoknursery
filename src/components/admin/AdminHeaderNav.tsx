import {
  Activity,
  ArrowLeft,
  ExternalLink,
  Eye,
  LogOut,
  Menu,
  Package,
  Percent,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';
import type { AdminSection, AdminTab } from '../adminConstants';
import type { AdminNavData } from './adminNavConfig';

interface AdminHeaderBarProps {
  onOpenMobileDrawer: () => void;
  showBackButton: boolean;
  onAdminBack: () => void;
  isAdminSimpleView: boolean;
  sectionTitleBn: string;
  relativeTimeBn: string;
  isRefreshingAdmin: boolean;
  onManualRefresh: () => void;
  isOwner: boolean;
  previewAdminMode: boolean;
  onTogglePreviewAdminMode: () => void;
  onNavigateToShop: () => void;
  onLogout: () => void;
}

export function AdminHeaderBar({
  onOpenMobileDrawer,
  showBackButton,
  onAdminBack,
  isAdminSimpleView,
  sectionTitleBn,
  relativeTimeBn,
  isRefreshingAdmin,
  onManualRefresh,
  isOwner,
  previewAdminMode,
  onTogglePreviewAdminMode,
  onNavigateToShop,
  onLogout,
}: AdminHeaderBarProps) {
  return (
    <header className="sticky top-0 z-40 bg-[#142318] text-white border-b border-[#25392A]">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 h-14 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileDrawer}
            aria-label="সব সেকশন মেনু খুলুন"
            className="lg:hidden inline-flex items-center justify-center w-9 h-9 rounded-xl bg-[#213526] hover:bg-[#2c4533] text-white cursor-pointer shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>

          {showBackButton && (
            <button
              type="button"
              onClick={onAdminBack}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#213526] hover:bg-[#2c4533] text-[#E8EDE9] hover:text-white text-xs font-bold transition-colors cursor-pointer shrink-0"
              title="আগের সেকশনে ফিরুন"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">পিছনে</span>
            </button>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-serif-bn font-bold text-sm sm:text-base text-white truncate">
                ভ্রাম্যমাণ নার্সারি
              </h1>
              <span className="text-xs font-mono font-bold text-[#A3E635] shrink-0">
                · {isAdminSimpleView ? 'Admin' : 'Owner'}
              </span>
            </div>
            <p className="text-xs text-[#A8BDB0] font-mono truncate">
              {sectionTitleBn} · {relativeTimeBn}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            disabled={isRefreshingAdmin}
            onClick={onManualRefresh}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#213526] hover:bg-[#2c4533] border border-[#304836] text-[#E8EDE9] text-xs font-bold transition-colors cursor-pointer"
            title="সকল ক্যাটালগ তথ্য ও ডাটাবেস স্ট্যাটাস রিফ্রেশ করুন"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-[#A3E635] ${isRefreshingAdmin ? 'animate-spin' : ''}`}
            />
            <span className="hidden sm:inline">রিফ্রেশ</span>
          </button>

          {isOwner && (
            <button
              type="button"
              onClick={onTogglePreviewAdminMode}
              className={`inline-flex items-center gap-1 rounded-xl font-bold transition-colors cursor-pointer ${
                previewAdminMode
                  ? 'px-3 py-1.5 bg-[#F59E0B] hover:bg-[#D97706] text-[#142318] text-xs'
                  : 'px-2.5 py-1.5 bg-[#213526] hover:bg-[#2c4533] text-[#A3E635] text-xs border border-[#304836]'
              }`}
              title="Admin বড়-ফন্ট ভিউ দেখুন বা Owner মোডে ফিরুন"
            >
              <Eye className="w-3.5 h-3.5 shrink-0" />
              <span>{previewAdminMode ? 'Owner মোড' : 'Admin ভিউ'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onNavigateToShop}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1B8354] hover:bg-[#146c44] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            title="পাবলিক নার্সারি ওয়েবসাইটে যান"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#A3E635]" />
            <span className="hidden sm:inline">ওয়েবসাইট</span>
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="lg:hidden inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#B34728] text-xs font-bold rounded-xl transition-colors cursor-pointer"
            title="লগআউট করুন"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">লগআউট</span>
          </button>
        </div>
      </div>
    </header>
  );
}

interface AdminMobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  navGroups: AdminNavData['navGroups'];
  mobileTab: AdminTab;
  onLogout: () => void;
}

export function AdminMobileDrawer({
  isOpen,
  onClose,
  userEmail,
  navGroups,
  mobileTab,
  onLogout,
}: AdminMobileDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden flex">
      <div className="fixed inset-0 bg-black/35 backdrop-blur-[1px]" onClick={onClose} />
      <aside className="relative w-64 sm:w-72 max-w-[74vw] bg-white h-full shadow-2xl border-r border-[#E8E1D5] flex flex-col justify-between z-10 overflow-y-auto">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E8E1D5]">
            <div>
              <p className="font-serif-bn text-base font-bold text-[#142318]">অ্যাডমিন নেভিগেশন</p>
              <p className="text-xs font-mono text-[#526356] truncate max-w-[190px]">{userEmail}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="মেনু বন্ধ করুন"
              className="w-8 h-8 rounded-lg bg-[#F5EFE6] text-[#142318] flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            {navGroups.map((group) => (
              <div key={group.groupLabel} className="space-y-1">
                <p className="px-2.5 text-xs font-bold text-[#785942] uppercase tracking-wider">
                  {group.groupLabel}
                </p>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = mobileTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={item.onClick}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        isActive ? 'bg-[#142318] text-white' : 'text-[#142318] hover:bg-[#FAF8F5]'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 truncate">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#A3E635]' : 'text-[#1B8354]'}`}
                        />
                        <span className="truncate">{item.label}</span>
                      </span>
                      {item.badge && (
                        <span
                          className={`font-mono tabular-nums text-xs ${
                            isActive ? 'text-[#A3E635]' : 'text-[#785942]'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-[#E8E1D5]">
          <button
            type="button"
            onClick={onLogout}
            className="w-full py-2.5 px-3 bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#B34728] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>লগআউট করুন</span>
          </button>
        </div>
      </aside>
    </div>
  );
}

interface AdminDesktopSidebarProps {
  navGroups: AdminNavData['navGroups'];
  mobileTab: AdminTab;
  userEmail: string;
  onLogout: () => void;
}

export function AdminDesktopSidebar({
  navGroups,
  mobileTab,
  userEmail,
  onLogout,
}: AdminDesktopSidebarProps) {
  return (
    <aside className="hidden lg:flex w-60 shrink-0 flex-col justify-between bg-white border border-[#E8E1D5] rounded-2xl p-3.5 h-[calc(100dvh-5.25rem)] sticky top-18 overflow-y-auto">
      <div className="space-y-4">
        {navGroups.map((group) => (
          <div key={group.groupLabel} className="space-y-1">
            <p className="px-2.5 text-xs font-bold text-[#785942] uppercase tracking-wider">
              {group.groupLabel}
            </p>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = mobileTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.onClick}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    isActive ? 'bg-[#142318] text-white' : 'text-[#142318] hover:bg-[#FAF8F5]'
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#A3E635]' : 'text-[#1B8354]'}`}
                    />
                    <span className="truncate">{item.label}</span>
                  </span>
                  {item.badge && (
                    <span
                      className={`font-mono tabular-nums text-xs ${
                        isActive ? 'text-[#A3E635]' : 'text-[#785942]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="pt-3 border-t border-[#E8E1D5] space-y-2">
        <div className="px-2 text-xs text-[#526356] truncate font-mono">{userEmail}</div>
        <button
          type="button"
          onClick={onLogout}
          className="w-full py-2 px-3 bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#B34728] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>লগআউট</span>
        </button>
      </div>
    </aside>
  );
}

interface AdminMobileBottomNavProps {
  activeSection: AdminSection;
  mobileTab: AdminTab;
  onSwitchSection: (section: AdminSection) => void;
  onStartAddPlant: () => void;
}

export function AdminMobileBottomNav({
  activeSection,
  mobileTab,
  onSwitchSection,
  onStartAddPlant,
}: AdminMobileBottomNavProps) {
  return (
    <nav
      aria-label="Admin Mobile Bottom Navigation"
      className="lg:hidden fixed bottom-0 inset-x-0 z-[9999] bg-white/95 backdrop-blur-md border-t border-[#E8E1D5] pt-1.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] px-2 shadow-2xl"
    >
      <div className="max-w-lg mx-auto grid grid-cols-5 gap-1">
        <button
          type="button"
          onClick={() => onSwitchSection('catalog')}
          className={`flex flex-col items-center justify-center rounded-xl py-1.5 transition-colors cursor-pointer ${
            activeSection === 'catalog' && mobileTab !== 'add'
              ? 'bg-[#EBF5EF] text-[#1B8354] font-bold'
              : 'text-[#526356] hover:text-[#142318]'
          }`}
        >
          <Package className="w-4 h-4 mb-0.5" />
          <span className="text-xs leading-tight">ক্যাটালগ</span>
        </button>

        <button
          type="button"
          onClick={onStartAddPlant}
          className={`flex flex-col items-center justify-center rounded-xl py-1.5 transition-colors cursor-pointer ${
            mobileTab === 'add'
              ? 'bg-[#EBF5EF] text-[#1B8354] font-bold'
              : 'text-[#526356] hover:text-[#142318]'
          }`}
        >
          <Plus className="w-4 h-4 mb-0.5" />
          <span className="text-xs leading-tight">+ নতুন</span>
        </button>

        <button
          type="button"
          onClick={() => onSwitchSection('bulk')}
          className={`flex flex-col items-center justify-center rounded-xl py-1.5 transition-colors cursor-pointer ${
            activeSection === 'bulk'
              ? 'bg-[#EBF5EF] text-[#1B8354] font-bold'
              : 'text-[#526356] hover:text-[#142318]'
          }`}
        >
          <Percent className="w-4 h-4 mb-0.5" />
          <span className="text-xs leading-tight">বাল্ক</span>
        </button>

        <button
          type="button"
          onClick={() => onSwitchSection('recovery')}
          className={`flex flex-col items-center justify-center rounded-xl py-1.5 transition-colors cursor-pointer ${
            activeSection === 'recovery'
              ? 'bg-[#EBF5EF] text-[#1B8354] font-bold'
              : 'text-[#526356] hover:text-[#142318]'
          }`}
        >
          <Trash2 className="w-4 h-4 mb-0.5" />
          <span className="text-xs leading-tight">ট্র্যাশ</span>
        </button>

        <button
          type="button"
          onClick={() => onSwitchSection('diagnostics')}
          className={`flex flex-col items-center justify-center rounded-xl py-1.5 transition-colors cursor-pointer ${
            activeSection === 'diagnostics'
              ? 'bg-[#EBF5EF] text-[#1B8354] font-bold'
              : 'text-[#526356] hover:text-[#142318]'
          }`}
        >
          <Activity className="w-4 h-4 mb-0.5" />
          <span className="text-xs leading-tight">ডায়াগনস্টিকস</span>
        </button>
      </div>
    </nav>
  );
}
