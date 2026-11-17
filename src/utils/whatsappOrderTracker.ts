import type {
  WhatsAppOrderEventType,
  WhatsAppOrderLineItem,
  WhatsAppOrderLogItem,
  WhatsAppOrderStatus,
} from '../types/nursery';
import { getBengaliDateTime } from './bengaliDateTime';
import { loadFirebaseCore, loadFirestoreSdk } from '../firebaseLazy';
import { trackFirestoreWrite } from './firestoreMonitor';
import { checkClientSubmissionCooldown } from './customerReviewsStorage';
import { getPublicChallengeHeaders } from './publicChallengeClient';

export const STORAGE_WHATSAPP_ORDERS_KEY = 'brahmyaman_whatsapp_orders_v1';
const CLIENT_INQUIRY_RATE_KEY = 'brahmyaman_inquiry_rate_v1';

export interface PlantDemandLeaderboardRow {
  plantId: string;
  plantNameBn: string;
  nameBn: string;
  category: string;
  image: string;
  totalQuantityOrdered: number;
  totalRequestedQty: number;
  orderClickCount: number;
  orderCount: number;
  photoShareCount: number;
  shareCount: number;
  totalInteractions: number;
  demandScore: number;
  estimatedRevenue: number;
  totalEstimatedRevenue: number;
  lastRequestedBn: string;
  lastRequestedAtBn: string;
  lastRequestedIso: string;
}

export function loadLocalWhatsAppOrderLogs(): WhatsAppOrderLogItem[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(STORAGE_WHATSAPP_ORDERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalWhatsAppOrderLogs(logs: WhatsAppOrderLogItem[]): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_WHATSAPP_ORDERS_KEY, JSON.stringify(logs.slice(0, 300)));
  } catch {
    // Ignore storage quota issues
  }
}

export function sanitizeWhatsAppOrderForFirestore(
  entry: WhatsAppOrderLogItem
): Record<string, unknown> {
  const cleanItems = (Array.isArray(entry.items) ? entry.items : []).slice(0, 25).map((it) => {
    const resolvedName = String(it.plantNameBn || it.nameBn || 'চারাগাছ').trim().slice(0, 200);
    const resolvedPrice = Math.max(0, Math.round(Number(it.unitPrice ?? it.price) || 0));
    return {
      plantId: String(it.plantId || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 128),
      plantNameBn: resolvedName,
      nameBn: resolvedName,
      category: String(it.category || 'নার্সারি চারা').trim().slice(0, 120),
      optionLabelBn: String(it.optionLabelBn || 'গ্রো ব্যাগ').trim().slice(0, 120),
      unitPrice: resolvedPrice,
      price: resolvedPrice,
      quantity: Math.max(1, Math.min(999, Math.round(Number(it.quantity) || 1))),
      ...(typeof it.image === 'string' && it.image.startsWith('http') && it.image.length <= 1500
        ? { image: it.image }
        : {}),
    };
  });

  const totalQuantity = Math.max(
    1,
    Number(entry.totalQuantity) ||
      cleanItems.reduce((sum, it) => sum + it.quantity, 0) ||
      1
  );
  const totalAmount = Math.max(
    0,
    Math.round(
      Number(entry.totalAmount ?? entry.totalEstimatedAmount) ||
        cleanItems.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0)
    )
  );

  const normalizedStatus: WhatsAppOrderStatus =
    entry.status === 'contacted'
      ? 'contacted'
      : entry.status === 'completed' || entry.status === 'delivered'
      ? 'completed'
      : 'new';

  const cleanObj: Record<string, unknown> = {
    id: entry.id.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 128),
    timestamp: (entry.timestamp || new Date().toISOString()).slice(0, 100),
    dateBn: (entry.dateBn || '').slice(0, 100),
    timeBn: (entry.timeBn || '').slice(0, 100),
    eventType: entry.eventType,
    customerName: (entry.customerName || 'ওয়েবসাইট ক্রেতা').trim().slice(0, 120),
    items: cleanItems,
    totalAmount,
    totalQuantity,
    status: normalizedStatus,
  };

  if (entry.customerVillage || entry.deliveryZone || entry.deliveryZoneBn) {
    cleanObj.customerVillage = (
      entry.customerVillage ||
      entry.deliveryZoneBn ||
      entry.deliveryZone ||
      ''
    )
      .trim()
      .slice(0, 200);
  }
  if (entry.customerPhone && entry.customerPhone.trim()) {
    cleanObj.customerPhone = entry.customerPhone.trim().slice(0, 40);
  }
  if (entry.deliveryMode || entry.pickupPreference) {
    cleanObj.deliveryMode =
      (entry.deliveryMode || entry.pickupPreference) === 'delivery' ? 'delivery' : 'pickup';
  }
  if (entry.voiceTranscript || entry.specialNote) {
    cleanObj.voiceTranscript = (entry.voiceTranscript || entry.specialNote || '')
      .trim()
      .slice(0, 1000);
  }
  return cleanObj;
}

/**
 * Records a customer WhatsApp order or photo share immediately in LocalStorage
 * and submits it through the App Check + rate-limited `/api/public/inquiries` endpoint
 * (falling back to Firestore `/whatsapp_inquiries/{id}` only when permitted).
 */
export function recordWhatsAppInquiryLog(params: {
  eventType: WhatsAppOrderEventType;
  customerName?: string;
  customerPhone?: string;
  customerVillage?: string;
  deliveryZone?: string;
  deliveryZoneBn?: string;
  locality?: string;
  pickupPreference?: 'pickup' | 'delivery';
  deliveryMode?: 'pickup' | 'delivery';
  specialNote?: string;
  voiceTranscript?: string;
  totalEstimatedAmount?: number;
  items: WhatsAppOrderLineItem[];
}): WhatsAppOrderLogItem {
  const dt = getBengaliDateTime();
  const id = `wa-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const items: WhatsAppOrderLineItem[] = params.items.map((it) => {
    const resolvedName = it.plantNameBn || it.nameBn || 'চারাগাছ';
    const resolvedPrice = Math.max(0, Math.round(Number(it.unitPrice ?? it.price) || 0));
    return {
      plantId: it.plantId || 'unknown',
      plantNameBn: resolvedName,
      nameBn: resolvedName,
      category: it.category || 'নার্সারি চারা',
      optionLabelBn: it.optionLabelBn || 'গ্রো ব্যাগ চারা',
      unitPrice: resolvedPrice,
      price: resolvedPrice,
      quantity: Math.max(1, Math.round(Number(it.quantity) || 1)),
      image: it.image && it.image.startsWith('http') ? it.image : undefined,
    };
  });
  const totalQuantity = items.reduce((sum, it) => sum + it.quantity, 0);
  const totalAmount =
    params.totalEstimatedAmount !== undefined
      ? Math.max(0, Math.round(Number(params.totalEstimatedAmount) || 0))
      : items.reduce((sum, it) => sum + (it.unitPrice ?? it.price ?? 0) * it.quantity, 0);

  const zoneText =
    (
      params.deliveryZoneBn ||
      params.deliveryZone ||
      params.customerVillage ||
      params.locality ||
      ''
    ).trim() || 'কালশুলি (নার্সারি)';

  const entry: WhatsAppOrderLogItem = {
    id,
    timestamp: dt.iso,
    dateBn: dt.dateBn,
    timeBn: dt.timeBn,
    createdAtBn: `${dt.dateBn} · ${dt.timeBn}`,
    eventType: params.eventType,
    customerName: (params.customerName || '').trim() || 'ওয়েবসাইট ক্রেতা',
    customerPhone: params.customerPhone?.trim() || undefined,
    customerVillage: zoneText,
    deliveryZone: zoneText,
    deliveryZoneBn: zoneText,
    locality: params.locality?.trim() || undefined,
    pickupPreference: params.pickupPreference || params.deliveryMode || 'pickup',
    deliveryMode: params.deliveryMode || params.pickupPreference || 'pickup',
    specialNote: (params.specialNote || params.voiceTranscript || '').trim() || undefined,
    voiceTranscript: (params.voiceTranscript || params.specialNote || '').trim() || undefined,
    totalAmount,
    totalEstimatedAmount: totalAmount,
    totalQuantity,
    items,
    status: 'new',
  };

  const existing = loadLocalWhatsAppOrderLogs();
  saveLocalWhatsAppOrderLogs([entry, ...existing]);

  const cooldown = checkClientSubmissionCooldown(CLIENT_INQUIRY_RATE_KEY, {
    maxCount: 20,
    windowMs: 5 * 60_000,
    minIntervalMs: 2_500,
  });

  if (cooldown.allowed && typeof fetch === 'function') {
    const sanitized = sanitizeWhatsAppOrderForFirestore(entry);
    const hasAppCheckSiteKey = Boolean(
      ((import.meta as unknown as { env?: Record<string, string | undefined> }).env)
        ?.VITE_FIREBASE_APPCHECK_SITE_KEY
    );
    const appCheckPromise: Promise<Record<string, string>> = hasAppCheckSiteKey
      ? loadFirebaseCore().then((m) => m.getAppCheckHeaders()).catch(() => ({}))
      : Promise.resolve({});

    void Promise.all([appCheckPromise, getPublicChallengeHeaders()])
      .then(([appCheckHeaders, challengeHeaders]) =>
        fetch('/api/public/inquiries', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...appCheckHeaders,
            ...challengeHeaders,
          },
          body: JSON.stringify(sanitized),
        })
      )
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json().catch(() => ({}));
        if (data?.persistedBy === 'client_fallback_allowed') {
          const [{ db }, { doc, setDoc }] = await Promise.all([
            loadFirebaseCore(),
            loadFirestoreSdk(),
          ]);
          await setDoc(doc(db, 'whatsapp_inquiries', entry.id), sanitized);
        }
        trackFirestoreWrite(1, 'activity_logs');
      })
      .catch(() => {});
  }

  return entry;
}

/**
 * Computes the Most In-Demand Plants ranking from all recorded WhatsApp orders and photo shares.
 */
export function computePlantDemandLeaderboard(
  logs: WhatsAppOrderLogItem[]
): PlantDemandLeaderboardRow[] {
  const byPlant = new Map<string, PlantDemandLeaderboardRow>();

  for (const log of logs) {
    const isShare = log.eventType === 'photo_share';
    const dtBn = log.createdAtBn || `${log.dateBn} · ${log.timeBn}`;
    for (const item of log.items || []) {
      const resolvedName = (item.plantNameBn || item.nameBn || 'চারাগাছ').trim();
      const resolvedPrice = Math.max(0, Number(item.unitPrice ?? item.price) || 0);
      const key = item.plantId || resolvedName;
      if (!key) continue;

      const existing: PlantDemandLeaderboardRow = byPlant.get(key) || {
        plantId: item.plantId || key,
        plantNameBn: resolvedName,
        nameBn: resolvedName,
        category: item.category || 'নার্সারি চারা',
        image: item.image || '',
        totalQuantityOrdered: 0,
        totalRequestedQty: 0,
        orderClickCount: 0,
        orderCount: 0,
        photoShareCount: 0,
        shareCount: 0,
        totalInteractions: 0,
        demandScore: 0,
        estimatedRevenue: 0,
        totalEstimatedRevenue: 0,
        lastRequestedBn: dtBn,
        lastRequestedAtBn: dtBn,
        lastRequestedIso: log.timestamp || '',
      };

      if (!existing.image && item.image) {
        existing.image = item.image;
      }
      if (item.category && existing.category === 'নার্সারি চারা') {
        existing.category = item.category;
      }

      const qty = Math.max(1, Number(item.quantity) || 1);
      if (isShare) {
        existing.photoShareCount += 1;
        existing.shareCount += 1;
      } else {
        existing.orderClickCount += 1;
        existing.orderCount += 1;
        existing.totalQuantityOrdered += qty;
        existing.totalRequestedQty += qty;
        const rev = resolvedPrice * qty;
        existing.estimatedRevenue += rev;
        existing.totalEstimatedRevenue += rev;
      }
      existing.totalInteractions += 1;
      existing.demandScore =
        existing.totalRequestedQty * 2 + existing.shareCount * 1;

      if ((log.timestamp || '') >= existing.lastRequestedIso) {
        existing.lastRequestedIso = log.timestamp || '';
        existing.lastRequestedBn = dtBn;
        existing.lastRequestedAtBn = dtBn;
      }
      byPlant.set(key, existing);
    }
  }

  return Array.from(byPlant.values()).sort((a, b) => {
    if (b.demandScore !== a.demandScore) {
      return b.demandScore - a.demandScore;
    }
    if (b.totalQuantityOrdered !== a.totalQuantityOrdered) {
      return b.totalQuantityOrdered - a.totalQuantityOrdered;
    }
    if (b.totalInteractions !== a.totalInteractions) {
      return b.totalInteractions - a.totalInteractions;
    }
    return b.estimatedRevenue - a.estimatedRevenue;
  });
}
