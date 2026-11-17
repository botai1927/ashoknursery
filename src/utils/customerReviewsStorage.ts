import { collection, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { CustomerReviewItem } from '../types/nursery';
import { getBengaliDateTime } from './bengaliDateTime';
import {
  PUJA_IMAGE,
  lemonImg,
  adeniumImg,
} from '../data/brahmyamanCatalog';

export const CUSTOMER_REVIEWS_STORAGE_KEY = 'brahmyaman_customer_reviews_v1';

export function isRemovedFakeReview(item: Partial<CustomerReviewItem> | null | undefined): boolean {
  if (!item) return false;
  if (item.id === 'rev-seed-1') return true;
  const combinedName = `${item.customerName || ''} ${item.customerNameBn || ''}`
    .toLowerCase()
    .trim();
  if (!combinedName) return false;
  const hasSouvik =
    combinedName.includes('souvik') ||
    combinedName.includes('শৌভিক') ||
    combinedName.includes('সৌভিক');
  const hasBanerjee =
    combinedName.includes('banerjee') ||
    combinedName.includes('ব্যানার্জি') ||
    combinedName.includes('ব্যানার্জী');
  return hasSouvik && hasBanerjee;
}

export const DEFAULT_CUSTOMER_REVIEWS: CustomerReviewItem[] = [
  {
    id: 'rev-seed-2',
    plantNameBn: 'রক্তজবা ও কৃষ্ণ তুলসী',
    customerName: 'অর্পিতা মুখার্জী',
    customerNameBn: 'অর্পিতা মুখার্জী',
    locationBn: 'পারসোলা, বাঁকুড়া',
    rating: 5,
    commentBn:
      'প্রতিদিনের পুজোর জন্য রক্তজবা ও কৃষ্ণ তুলসীর চারা নিয়েছি। নার্সারির অশোকদা নিজে দাঁড়িয়ে থেকে ভালো চারা বেছে দিয়েছেন। বাড়ির উঠোনে খুব সুন্দর ফুল ফুটছে।',
    photoUrl: PUJA_IMAGE,
    status: 'approved',
    createdAt: '2026-01-12T11:30:00.000Z',
    createdAtBn: '১২ জানু ২০২৬ · সকাল ১১:৩০',
  },
  {
    id: 'rev-seed-3',
    plantNameBn: 'মরু গোলাপ ও বাগানবিলাস',
    customerName: 'ডাঃ অনির্বাণ মণ্ডল',
    customerNameBn: 'ডাঃ অনির্বাণ মণ্ডল',
    locationBn: 'খাতড়া, বাঁকুড়া',
    rating: 5,
    commentBn:
      'অ্যাডেনিয়াম ও বিভিন্ন রঙের বাগানবিলাস নিয়েছিলাম। খাতড়ার কড়া রোদ সহ্য করেও এত সুন্দর ফুল ফুটছে যে বারান্দা পুরো ভরে উঠেছে। নার্সারির সঠিক যত্ন নেওয়ার পরামর্শ খুব কাজে লেগেছে।',
    photoUrl: adeniumImg,
    status: 'approved',
    createdAt: '2026-01-15T16:15:00.000Z',
    createdAtBn: '১৫ জানু ২০২৬ · বিকাল ৪:১৫',
  },
  {
    id: 'rev-seed-4',
    plantNameBn: 'কাগজি পাতিলেবু ও এলাচ চারা',
    customerName: 'অলোক কুমার মণ্ডল',
    customerNameBn: 'অলোক কুমার মণ্ডল',
    locationBn: 'সিমলাপাল, বাঁকুড়া',
    rating: 5,
    commentBn:
      'বারোমাসি কাগজি পাতিলেবুর চারা ও এলাচ গাছ এনে লাগিয়েছিলাম। মাত্র ছয় মাসের মাথায় থোকায় থোকায় রসালো কাগজি লেবু ধরেছে। সিমলাপাল অঞ্চলে সঠিক সময়ে চারা পেয়েছি।',
    photoUrl: lemonImg,
    status: 'approved',
    createdAt: '2026-01-18T09:45:00.000Z',
    createdAtBn: '১৮ জানু ২০২৬ · সকাল ৯:৪৫',
  },
];

export function loadLocalCustomerReviews(): CustomerReviewItem[] {
  if (typeof window === 'undefined') return DEFAULT_CUSTOMER_REVIEWS;
  try {
    const raw = window.localStorage.getItem(CUSTOMER_REVIEWS_STORAGE_KEY);
    if (!raw) return DEFAULT_CUSTOMER_REVIEWS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_CUSTOMER_REVIEWS;
    const cleaned = (parsed as CustomerReviewItem[]).filter(
      (item) => !isRemovedFakeReview(item)
    );
    if (cleaned.length !== parsed.length) {
      const next = cleaned.length > 0 ? cleaned : DEFAULT_CUSTOMER_REVIEWS;
      try {
        window.localStorage.setItem(
          CUSTOMER_REVIEWS_STORAGE_KEY,
          JSON.stringify(next.slice(0, 200))
        );
      } catch {
        // Ignore storage quota errors
      }
      return next;
    }
    return cleaned;
  } catch {
    return DEFAULT_CUSTOMER_REVIEWS;
  }
}

export function saveLocalCustomerReviews(reviews: CustomerReviewItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    const cleaned = reviews.filter((item) => !isRemovedFakeReview(item));
    window.localStorage.setItem(
      CUSTOMER_REVIEWS_STORAGE_KEY,
      JSON.stringify(cleaned.slice(0, 200))
    );
    window.dispatchEvent(new CustomEvent('brahmyaman-reviews-updated'));
  } catch {
    // Ignore storage quota errors
  }
}

export function sanitizeCustomerReviewForFirestore(
  item: CustomerReviewItem
): Record<string, unknown> {
  const resolvedName = String(item.customerName || item.customerNameBn || 'গ্রাহক').slice(0, 120);
  const resolvedComment = String(item.commentBn || item.textBn || '').slice(0, 1500);
  const payload: Record<string, unknown> = {
    id: String(item.id || '')
      .replace(/[^a-zA-Z0-9_-]/g, '-')
      .slice(0, 128),
    customerNameBn: resolvedName,
    locationBn: String(item.locationBn || 'বাঁকুড়া').slice(0, 160),
    rating: Math.min(5, Math.max(1, Math.round(Number(item.rating) || 5))),
    commentBn: resolvedComment,
    status: item.status === 'approved' ? 'approved' : 'pending',
    createdAt: String(item.createdAt || new Date().toISOString()).slice(0, 100),
    createdAtBn: String(item.createdAtBn || '').slice(0, 160),
  };
  if (item.plantId) payload.plantId = String(item.plantId).slice(0, 128);
  if (item.plantNameBn) payload.plantNameBn = String(item.plantNameBn).slice(0, 200);
  const photo = item.photoUrl || item.image;
  if (photo && photo.length <= 450_000) {
    payload.gardenImage = photo;
  }
  return payload;
}

export async function submitCustomerReview(input: {
  plantId?: string;
  plantNameBn?: string;
  customerName?: string;
  customerNameBn?: string;
  locationBn?: string;
  rating?: number;
  commentBn: string;
  photoUrl?: string;
  gardenImage?: string;
  status?: 'pending' | 'approved';
  autoApprove?: boolean;
}): Promise<CustomerReviewItem> {
  const dt = getBengaliDateTime();
  const id = `rev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const resolvedName =
    (input.customerName || input.customerNameBn || '').trim() || 'উদ্যানপ্রেমী গ্রাহক';
  const resolvedPhoto = (input.photoUrl || input.gardenImage || '').trim() || undefined;
  const resolvedStatus = input.autoApprove ? 'approved' : input.status || 'pending';

  const entry: CustomerReviewItem = {
    id,
    plantId: input.plantId,
    plantNameBn: input.plantNameBn,
    customerName: resolvedName,
    customerNameBn: resolvedName,
    locationBn: (input.locationBn || 'বাঁকুড়া').trim(),
    rating: Math.min(5, Math.max(1, Number(input.rating) || 5)),
    commentBn: input.commentBn.trim(),
    photoUrl: resolvedPhoto,
    status: resolvedStatus,
    createdAt: dt.iso,
    createdAtBn: `${dt.dateBn} · ${dt.timeBn}`,
  };

  const existing = loadLocalCustomerReviews();
  saveLocalCustomerReviews([entry, ...existing.filter((r) => r.id !== entry.id)]);

  try {
    const ref = doc(collection(db, 'customer_reviews'), entry.id);
    await setDoc(ref, sanitizeCustomerReviewForFirestore(entry));
  } catch {
    // LocalStorage backup already saved
  }

  return entry;
}

export async function updateCustomerReviewStatus(
  reviewId: string,
  nextStatus: 'pending' | 'approved'
): Promise<CustomerReviewItem | null> {
  const existing = loadLocalCustomerReviews();
  const updated = existing.map((r) =>
    r.id === reviewId ? { ...r, status: nextStatus } : r
  );
  saveLocalCustomerReviews(updated);

  const target = updated.find((r) => r.id === reviewId) || null;
  if (target) {
    try {
      const ref = doc(collection(db, 'customer_reviews'), reviewId);
      await setDoc(ref, sanitizeCustomerReviewForFirestore(target), { merge: true });
    } catch {
      // Ignore Firestore write error if offline
    }
  }
  return target;
}

export async function removeCustomerReview(reviewId: string): Promise<CustomerReviewItem[]> {
  const existing = loadLocalCustomerReviews();
  const updated = existing.filter((r) => r.id !== reviewId);
  saveLocalCustomerReviews(updated);
  try {
    await deleteDoc(doc(collection(db, 'customer_reviews'), reviewId));
  } catch {
    // Ignore
  }
  return updated;
}
