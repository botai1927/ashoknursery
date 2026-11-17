import { useMemo, useState } from 'react';
import {
  ShoppingBag,
  TrendingUp,
  Share2,
  Clock,
  Search,
  CheckCircle2,
  Trash2,
  Edit2,
  Phone,
  MapPin,
  Sparkles,
  X,
} from 'lucide-react';
import type {
  BrahmyamanPlant,
  WhatsAppOrderLogItem,
  WhatsAppOrderStatus,
} from '../types/nursery';
import { computePlantDemandLeaderboard } from '../utils/whatsappOrderTracker';
import { resolvePlantImageUrl } from '../utils/imageUrl';
import { PUJA_IMAGE } from '../data/brahmyamanCatalog';

interface AdminOrderTrackerTabProps {
  orderLogs: WhatsAppOrderLogItem[];
  plants: BrahmyamanPlant[];
  isAdminSimpleView: boolean;
  onUpdateOrderStatus: (orderId: string, status: WhatsAppOrderStatus) => void;
  onDeleteOrderLog: (orderId: string) => void;
  onEditPlant: (plant: BrahmyamanPlant) => void;
}

type TrackerSubView = 'demand' | 'orders';
type OrderEventFilter = 'all' | 'orders_only' | 'shares_only' | 'new_only';

export function AdminOrderTrackerTab({
  orderLogs,
  plants,
  isAdminSimpleView,
  onUpdateOrderStatus,
  onDeleteOrderLog,
  onEditPlant,
}: AdminOrderTrackerTabProps) {
  const [subView, setSubView] = useState<TrackerSubView>('demand');
  const [searchQuery, setSearchQuery] = useState('');
  const [eventFilter, setEventFilter] = useState<OrderEventFilter>('all');

  const plantByIdMap = useMemo(() => {
    const map = new Map<string, BrahmyamanPlant>();
    for (const p of plants) {
      map.set(p.id, p);
    }
    return map;
  }, [plants]);

  const demandLeaderboard = useMemo(
    () => computePlantDemandLeaderboard(orderLogs),
    [orderLogs]
  );

  const summary = useMemo(() => {
    let orderCount = 0;
    let shareCount = 0;
    let totalSaplings = 0;
    let totalRevenueValue = 0;
    let newPendingCount = 0;

    for (const log of orderLogs) {
      if (log.eventType === 'photo_share') {
        shareCount += 1;
      } else {
        orderCount += 1;
        totalSaplings += Math.max(1, Number(log.totalQuantity || 1));
        totalRevenueValue += Math.max(0, Number(log.totalEstimatedAmount || 0));
      }
      if ((log.status || 'new') === 'new') {
        newPendingCount += 1;
      }
    }

    return {
      totalEvents: orderLogs.length,
      orderCount,
      shareCount,
      totalSaplings,
      totalRevenueValue,
      newPendingCount,
    };
  }, [orderLogs]);

  const filteredDemand = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return demandLeaderboard;
    return demandLeaderboard.filter(
      (item) =>
        item.plantNameBn.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [demandLeaderboard, searchQuery]);

  const filteredOrderLogs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return orderLogs.filter((log) => {
      if (eventFilter === 'orders_only' && log.eventType === 'photo_share') return false;
      if (eventFilter === 'shares_only' && log.eventType !== 'photo_share') return false;
      if (eventFilter === 'new_only' && (log.status || 'new') !== 'new') return false;
      if (!q) return true;
      const itemsMatch = (log.items || []).some(
        (it) =>
          (it.plantNameBn || '').toLowerCase().includes(q) ||
          (it.category || '').toLowerCase().includes(q)
      );
      return (
        itemsMatch ||
        (log.customerName || '').toLowerCase().includes(q) ||
        (log.customerPhone || '').toLowerCase().includes(q) ||
        (log.deliveryZoneBn || '').toLowerCase().includes(q) ||
        (log.createdAtBn || '').toLowerCase().includes(q)
      );
    });
  }, [orderLogs, eventFilter, searchQuery]);

  const getEventLabelBn = (eventType: WhatsAppOrderLogItem['eventType']) => {
    switch (eventType) {
      case 'cart_order':
        return 'ঝুড়ি অর্ডার (WhatsApp)';
      case 'direct_order':
        return 'সরাসরি ১-ক্লিক অর্ডার';
      case 'voice_order':
        return 'ভয়েস অর্ডার';
      case 'photo_share':
        return 'ছবি ও তথ্য শেয়ার';
      default:
        return 'WhatsApp ইনকোয়ারি';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & KPI Metrics */}
      <section className="bg-white border border-[#E8E1D5] rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#1B8354]/10 text-[#1B8354] flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2
                className={`font-serif-bn font-bold text-[#142318] ${
                  isAdminSimpleView ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'
                }`}
              >
                অর্ডার ও ইনকোয়ারি ট্র্যাকার (WhatsApp Order &amp; Demand Log)
              </h2>
              <p className="text-xs text-[#526356]">
                ওয়েবসাইট থেকে কাস্টমাররা কোন গাছ বেশি অর্ডার বা হোয়াটসঅ্যাপে শেয়ার করছেন তার লাইভ তালিকা
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 bg-[#FAF8F5] border border-[#E8E1D5] rounded-xl">
            <p className="text-xs font-bold text-[#785942]">মোট WhatsApp অর্ডার</p>
            <p className="font-mono tabular-nums text-xl font-extrabold text-[#1B8354] mt-0.5">
              {summary.orderCount} টি
            </p>
          </div>
          <div className="p-3 bg-[#FAF8F5] border border-[#E8E1D5] rounded-xl">
            <p className="text-xs font-bold text-[#785942]">মোট চারার চাহিদা</p>
            <p className="font-mono tabular-nums text-xl font-extrabold text-[#142318] mt-0.5">
              {summary.totalSaplings} টি চারা
            </p>
          </div>
          <div className="p-3 bg-[#FAF8F5] border border-[#E8E1D5] rounded-xl">
            <p className="text-xs font-bold text-[#785942]">ছবি শেয়ার সংখ্যা</p>
            <p className="font-mono tabular-nums text-xl font-extrabold text-[#142318] mt-0.5">
              {summary.shareCount} বার
            </p>
          </div>
          <div className="p-3 bg-[#FFF8F0] border border-[#EADBCC] rounded-xl">
            <p className="text-xs font-bold text-[#B34728]">আনুমানিক অর্ডার মূল্য</p>
            <p className="font-mono tabular-nums text-xl font-extrabold text-[#B34728] mt-0.5">
              ₹{summary.totalRevenueValue}
            </p>
          </div>
        </div>

        {/* Sub-view Switcher */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setSubView('demand')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer border transition-colors ${
              subView === 'demand'
                ? 'bg-[#142318] text-white border-[#142318]'
                : 'bg-[#FAF8F5] text-[#526356] border-[#E8E1D5] hover:bg-[#F3ECE2]'
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#A3E635]" />
            <span>সবচেয়ে বেশি চাহিদার চারা ({demandLeaderboard.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubView('orders')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer border transition-colors ${
              subView === 'orders'
                ? 'bg-[#142318] text-white border-[#142318]'
                : 'bg-[#FAF8F5] text-[#526356] border-[#E8E1D5] hover:bg-[#F3ECE2]'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-[#A3E635]" />
            <span>কাস্টমার অর্ডার ও শেয়ার লগ ({orderLogs.length})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#785942] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              subView === 'demand'
                ? 'চারার নাম বা বিভাগ দিয়ে চাহিদা খুঁজুন...'
                : 'কাস্টমারের নাম, ফোন, এলাকা বা চারার নাম দিয়ে খুঁজুন...'
            }
            className="w-full h-10 pl-9 pr-9 bg-[#FAF8F5] border border-[#E8E1D5] focus:border-[#1B8354] rounded-xl text-xs text-[#142318] focus:outline-2 focus:outline-[#1B8354] focus:outline-offset-1"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-[#785942] hover:text-[#142318] absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </section>

      {/* SUBVIEW 1: PLANT DEMAND LEADERBOARD (সবচেয়ে বেশি চাহিদার চারা) */}
      {subView === 'demand' && (
        <section className="bg-white border border-[#E8E1D5] rounded-2xl overflow-hidden">
          {filteredDemand.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <p className="font-serif-bn text-base font-bold text-[#142318]">
                এখনো কোনো কাস্টমার অর্ডার বা শেয়ার রেকর্ড হয়নি
              </p>
              <p className="text-xs text-[#526356]">
                কাস্টমাররা যখন ওয়েবসাইট থেকে যেকোনো গাছ WhatsApp-এ অর্ডার বা শেয়ার করবেন, সাথে সাথে এখানে কোন গাছের চাহিদা সবচেয়ে বেশি তার তালিকা তৈরি হয়ে যাবে।
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#EFEAE0]">
              <div className="hidden md:grid md:grid-cols-12 gap-3 px-4 py-2.5 bg-[#FAF8F5] text-xs font-bold text-[#526356]">
                <div className="col-span-5">র‍্যাঙ্ক · চারার নাম ও বিভাগ</div>
                <div className="col-span-2 text-center">অর্ডার সংখ্যা</div>
                <div className="col-span-2 text-center">শেয়ার সংখ্যা</div>
                <div className="col-span-2 text-right">মোট মূল্য (₹)</div>
                <div className="col-span-1 text-right">এডিট</div>
              </div>

              {filteredDemand.map((entry, idx) => {
                const matchedPlant = plantByIdMap.get(entry.plantId);
                return (
                  <div
                    key={`${entry.plantId}-${idx}`}
                    className="p-3 sm:px-4 sm:py-3 flex flex-col md:grid md:grid-cols-12 gap-3 md:items-center hover:bg-[#FAF8F5] transition-colors"
                  >
                    <div className="md:col-span-5 flex items-center gap-3 min-w-0">
                      <span
                        className={`w-7 h-7 rounded-lg font-mono tabular-nums text-xs font-bold flex items-center justify-center shrink-0 ${
                          idx < 3
                            ? 'bg-[#1B8354] text-white'
                            : 'bg-[#F5EFE6] text-[#142318]'
                        }`}
                      >
                        #{idx + 1}
                      </span>

                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#EAE4D9] border border-[#DDD5C7] shrink-0">
                        <img
                          src={resolvePlantImageUrl(
                            matchedPlant?.image || entry.image,
                            PUJA_IMAGE
                          )}
                          alt={entry.plantNameBn}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-serif-bn text-sm font-bold text-[#142318] truncate">
                            {entry.plantNameBn}
                          </h3>
                          {idx === 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-[#FEF3C7] text-[#92400E] text-xs font-bold">
                              ★ সর্বোচ্চ চাহিদা
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#526356] mt-0.5">
                          {entry.category} · সর্বশেষ চাহিদা: {entry.lastRequestedAtBn}
                        </p>
                      </div>
                    </div>

                    <div className="md:col-span-2 flex md:justify-center items-center gap-2 text-xs">
                      <span className="md:hidden text-[#785942]">অর্ডার:</span>
                      <span className="font-mono tabular-nums font-bold text-[#1B8354]">
                        {entry.orderCount} বার ({entry.totalQuantityOrdered} টি চারা)
                      </span>
                    </div>

                    <div className="md:col-span-2 flex md:justify-center items-center gap-2 text-xs">
                      <span className="md:hidden text-[#785942]">শেয়ার:</span>
                      <span className="font-mono tabular-nums font-semibold text-[#142318]">
                        {entry.shareCount} বার
                      </span>
                    </div>

                    <div className="md:col-span-2 flex md:justify-end items-center gap-2 text-xs">
                      <span className="md:hidden text-[#785942]">মোট মূল্য:</span>
                      <span className="font-mono tabular-nums font-bold text-[#B34728]">
                        ₹{entry.totalEstimatedRevenue}
                      </span>
                    </div>

                    <div className="md:col-span-1 flex justify-end">
                      {matchedPlant && (
                        <button
                          type="button"
                          onClick={() => onEditPlant(matchedPlant)}
                          className="p-2 rounded-xl bg-[#EBF5EF] hover:bg-[#D5EBDC] text-[#14532D] cursor-pointer"
                          title="এই চারাটি এডিট করুন"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* SUBVIEW 2: CHRONOLOGICAL ORDER & SHARE LOG */}
      {subView === 'orders' && (
        <section className="space-y-3">
          <div className="inline-flex gap-1 p-1 bg-[#F5EFE6] rounded-xl overflow-x-auto max-w-full">
            {(
              [
                { id: 'all', label: `সব লগ (${orderLogs.length})` },
                { id: 'orders_only', label: `শুধু অর্ডার (${summary.orderCount})` },
                { id: 'shares_only', label: `শুধু ছবি শেয়ার (${summary.shareCount})` },
                { id: 'new_only', label: `নতুন / অপেক্ষমাণ (${summary.newPendingCount})` },
              ] as const
            ).map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => setEventFilter(btn.id)}
                className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer shrink-0 tabular-nums ${
                  eventFilter === btn.id
                    ? 'bg-white text-[#142318] shadow-2xs'
                    : 'text-[#526356] hover:text-[#142318]'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {filteredOrderLogs.length === 0 ? (
            <div className="bg-white border border-[#E8E1D5] rounded-2xl p-8 text-center text-xs text-[#785942]">
              এই ফিল্টারে কোনো অর্ডার বা শেয়ার লগ পাওয়া যায়নি।
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredOrderLogs.map((log, idx) => {
                const status = log.status || 'new';
                return (
                  <div
                    key={log.id}
                    className="bg-white border border-[#E8E1D5] rounded-2xl p-3.5 sm:p-4 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md bg-[#142318] text-white font-mono text-xs font-bold">
                          #{idx + 1}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-xs font-bold inline-flex items-center gap-1 ${
                            log.eventType === 'photo_share'
                              ? 'bg-[#EFF6FF] text-[#1D4ED8]'
                              : 'bg-[#EBF5EF] text-[#14532D]'
                          }`}
                        >
                          {log.eventType === 'photo_share' ? (
                            <Share2 className="w-3 h-3" />
                          ) : (
                            <ShoppingBag className="w-3 h-3" />
                          )}
                          <span>{getEventLabelBn(log.eventType)}</span>
                        </span>
                        <span className="inline-flex items-center gap-1 font-mono text-xs text-[#526356]">
                          <Clock className="w-3 h-3 text-[#1B8354]" />
                          <span>{log.createdAtBn}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <select
                          aria-label="অর্ডার স্ট্যাটাস"
                          value={status}
                          onChange={(e) =>
                            onUpdateOrderStatus(log.id, e.target.value as WhatsAppOrderStatus)
                          }
                          className={`h-7 px-2 rounded-lg text-xs font-bold border cursor-pointer ${
                            status === 'completed'
                              ? 'bg-[#F0FDF4] border-[#86EFAC] text-[#166534]'
                              : status === 'contacted'
                              ? 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]'
                              : 'bg-[#FAF8F5] border-[#D5C9B8] text-[#142318]'
                          }`}
                        >
                          <option value="new">নতুন ইনকোয়ারি</option>
                          <option value="contacted">যোগাযোগ হয়েছে</option>
                          <option value="completed">ডেলিভারি সম্পন্ন ✓</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => onDeleteOrderLog(log.id)}
                          className="p-1.5 rounded-lg bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#B34728] cursor-pointer"
                          title="লগ মুছুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Items in Order */}
                    <div className="flex flex-wrap gap-2">
                      {(log.items || []).map((item, i) => (
                        <div
                          key={`${item.plantId}-${i}`}
                          className="px-2.5 py-1.5 bg-[#FAF8F5] border border-[#E8E1D5] rounded-xl flex items-center gap-2 text-xs"
                        >
                          {item.image && (
                            <img
                              src={resolvePlantImageUrl(item.image, PUJA_IMAGE)}
                              alt={item.plantNameBn}
                              className="w-8 h-8 rounded-lg object-cover shrink-0"
                              loading="lazy"
                              decoding="async"
                            />
                          )}
                          <div>
                            <p className="font-bold text-[#142318]">
                              {item.plantNameBn}{' '}
                              <span className="font-mono text-[#1B8354]">× {item.quantity}</span>
                            </p>
                            <p className="text-xs text-[#526356]">
                              {item.optionLabelBn} · ₹{item.unitPrice}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Customer & Total Info */}
                    <div className="pt-2 border-t border-[#F3ECE2] flex items-center justify-between gap-2 flex-wrap text-xs text-[#526356]">
                      <div className="flex items-center gap-3 flex-wrap">
                        {log.customerName && (
                          <span className="font-bold text-[#142318]">ক্রেতা: {log.customerName}</span>
                        )}
                        {log.customerPhone && (
                          <a
                            href={`tel:${log.customerPhone}`}
                            className="inline-flex items-center gap-1 text-[#1B8354] font-mono font-bold hover:underline"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{log.customerPhone}</span>
                          </a>
                        )}
                        {log.deliveryZoneBn && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#785942]" />
                            <span>{log.deliveryZoneBn}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 font-mono font-bold text-[#B34728]">
                        {status === 'completed' && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#1B8354]" />
                        )}
                        <span>মোট: ₹{log.totalEstimatedAmount || 0}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
