import { collection, doc, onSnapshot, query, setDoc, deleteDoc, where } from 'firebase/firestore';
import { db } from '../firebase';
import type { CustomerReviewItem } from '../types/nursery';
import { getBengaliDateTime } from './bengaliDateTime';

export const CUSTOMER_REVIEWS_STORAGE_KEY = 'brahmyaman_customer_reviews_v1';

const REMOVED_FAKE_REVIEW_IDS = new Set([
  'rev-seed-1',
  'rev-seed-2',
  'rev-seed-3',
  'rev-seed-4',
]);

const REMOVED_FAKE_REVIEW_NAMES = new Set([
  'ডাঃ অনির্বাণ মণ্ডল',
  'অনির্বাণ মণ্ডল',
  'অর্পিতা মুখার্জী',
  'অলোক কুমার মণ্ডল',
]);

export function isRemovedFakeReview(item: Partial<CustomerReviewItem> | null | undefined): boolean {
  if (!item) return false;
  if (item.id && REMOVED_FAKE_REVIEW_IDS.has(item.id)) return true;
  const combinedName = `${item.customerName || ''} ${item.customerNameBn || ''}`
    .replace(/\s+/g, ' ')
    .trim();
  const lowered = combinedName.toLowerCase();
  if (REMOVED_FAKE_REVIEW_NAMES.has(combinedName)) return true;
  const hasSouvik =
    lowered.includes('souvik') ||
    combinedName.includes('শৌভিক') ||
    combinedName.includes('সৌভিক');
  const hasBanerjee =
    lowered.includes('banerjee') ||
    combinedName.includes('ব্যানার্জি') ||
    combinedName.includes('ব্যানার্জী');
  return hasSouvik && hasBanerjee;
}

/** Public pages never invent reviews. Approved text comes from Firestore. */
export const DEFAULT_CUSTOMER_REVIEWS: CustomerReviewItem[] = [];

export function loadLocalCustomerReviews(): CustomerReviewItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CUSTOMER_REVIEWS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const cleaned = (parsed as CustomerReviewItem[]).filter(
      (item) => !isRemovedFakeReview(item)
    );
    if (cleaned.length !== parsed.length) {
      try {
        window.localStorage.setItem(
          CUSTOMER_REVIEWS_STORAGE_KEY,
          JSON.stringify(cleaned.slice(0, 200))
        );
      } catch {
        // Ignore storage quota errors
      }
    }
    return cleaned;
  } catch {
    return [];
  }
}

export function mapFirestoreCustomerReview(
  id: string,
  data: Record<string, unknown>
): CustomerReviewItem {
  const name = String(data.customerNameBn || data.customerName || 'গ্রাহক');
  const photo = typeof data.gardenImage === 'string' ? data.gardenImage : undefined;
  return {
    id: String(data.id || id),
    plantId: typeof data.plantId === 'string' ? data.plantId : undefined,
    plantNameBn: typeof data.plantNameBn === 'string' ? data.plantNameBn : undefined,
    customerName: name,
    customerNameBn: name,
    locationBn: String(data.locationBn || ''),
    rating: Math.min(5, Math.max(1, Number(data.rating) || 5)),
    commentBn: String(data.commentBn || ''),
    photoUrl: photo,
    status: data.status === 'approved' ? 'approved' : 'pending',
    createdAt: String(data.createdAt || ''),
    createdAtBn: String(data.createdAtBn || ''),
  };
}

/** Live list of reviews an admin has marked approved. Empty when Firestore is unavailable. */
export function subscribeApprovedCustomerReviews(
  onReviews: (reviews: CustomerReviewItem[]) => void
): () => void {
  try {
    const approvedQuery = query(
      collection(db, 'customer_reviews'),
      where('status', '==', 'approved')
    );
    return onSnapshot(
      approvedQuery,
      (snap) => {
        const reviews = snap.docs
          .map((entry) =>
            mapFirestoreCustomerReview(entry.id, entry.data() as Record<string, unknown>)
          )
          .filter((item) => item.status === 'approved' && !isRemovedFakeReview(item));
        onReviews(reviews);
      },
      () => {
        onReviews([]);
      }
    );
  } catch {
    onReviews([]);
    return () => {};
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
