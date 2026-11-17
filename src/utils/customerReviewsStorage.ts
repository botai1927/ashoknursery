import { loadFirebaseCore, loadFirestoreSdk } from '../firebaseLazy';
import type { CustomerReviewItem } from '../types/nursery';
import { getBengaliDateTime } from './bengaliDateTime';
import { getPublicChallengeHeaders } from './publicChallengeClient';

export const CUSTOMER_REVIEWS_STORAGE_KEY = 'brahmyaman_customer_reviews_v1';
const CLIENT_REVIEW_RATE_KEY = 'brahmyaman_review_rate_v1';

const REMOVED_SEED_REVIEW_IDS = new Set([
  'rev-seed-1',
  'rev-seed-2',
  'rev-seed-3',
  'rev-seed-4',
]);

export function isRemovedFakeReview(item: Partial<CustomerReviewItem> | null | undefined): boolean {
  if (!item) return false;
  if (item.id && REMOVED_SEED_REVIEW_IDS.has(item.id)) return true;
  const combinedName = `${item.customerName || ''} ${item.customerNameBn || ''}`
    .toLowerCase()
    .trim();
  if (!combinedName) return false;
  const hasSouvik =
    (combinedName.includes('souvik') ||
      combinedName.includes('শৌভিক') ||
      combinedName.includes('সৌভিক')) &&
    (combinedName.includes('banerjee') ||
      combinedName.includes('ব্যানার্জি') ||
      combinedName.includes('ব্যানার্জী'));
  const hasSeedNames =
    combinedName.includes('অর্পিতা মুখার্জী') ||
    combinedName.includes('অনির্বাণ মণ্ডল') ||
    combinedName.includes('অলোক কুমার মণ্ডল');
  return hasSouvik || hasSeedNames;
}

export function normalizeCustomerReview(
  raw: Partial<CustomerReviewItem> & {
    gardenImage?: string;
    customerNameEn?: string;
    commentEn?: string;
  },
  docId?: string
): CustomerReviewItem {
  const resolvedName =
    String(raw.customerName || raw.customerNameBn || raw.customerNameEn || 'উদ্যানপ্রেমী গ্রাহক').trim();
  const resolvedPhoto =
    String(raw.photoUrl || raw.gardenImage || raw.image || '').trim() || undefined;
  const resolvedComment = String(raw.commentBn || raw.textBn || raw.commentEn || '').trim();
  const resolvedStatus = raw.status === 'approved' ? 'approved' : 'pending';
  const resolvedRating = Math.min(5, Math.max(1, Math.round(Number(raw.rating) || 5)));

  return {
    id: String(raw.id || docId || '').trim(),
    authorUid: raw.authorUid ? String(raw.authorUid).trim() : undefined,
    plantId: raw.plantId ? String(raw.plantId).trim() : undefined,
    plantNameBn: raw.plantNameBn ? String(raw.plantNameBn).trim() : undefined,
    customerName: resolvedName,
    customerNameBn: resolvedName,
    locationBn: String(raw.locationBn || 'বাঁকুড়া').trim(),
    rating: resolvedRating,
    commentBn: resolvedComment,
    photoUrl: resolvedPhoto,
    status: resolvedStatus,
    createdAt: String(raw.createdAt || new Date().toISOString()),
    createdAtBn: String(raw.createdAtBn || ''),
  };
}

export const DEFAULT_CUSTOMER_REVIEWS: CustomerReviewItem[] = [];

export function loadLocalCustomerReviews(): CustomerReviewItem[] {
  if (typeof window === 'undefined') return DEFAULT_CUSTOMER_REVIEWS;
  try {
    const raw = window.localStorage.getItem(CUSTOMER_REVIEWS_STORAGE_KEY);
    if (!raw) return DEFAULT_CUSTOMER_REVIEWS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_CUSTOMER_REVIEWS;
    const cleaned = (parsed as Array<Partial<CustomerReviewItem> & { gardenImage?: string }>)
      .map((item) => normalizeCustomerReview(item))
      .filter((item) => item.id && !isRemovedFakeReview(item));
    if (cleaned.length !== parsed.length) {
      try {
        window.localStorage.setItem(
          CUSTOMER_REVIEWS_STORAGE_KEY,
          JSON.stringify(cleaned.slice(0, 200))
        );
      } catch {
        // Ignore storage quota errors
      }
      return cleaned;
    }
    return cleaned;
  } catch {
    return DEFAULT_CUSTOMER_REVIEWS;
  }
}

export function saveLocalCustomerReviews(reviews: CustomerReviewItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    const cleaned = reviews
      .map((item) => normalizeCustomerReview(item))
      .filter((item) => item.id && !isRemovedFakeReview(item));
    window.localStorage.setItem(
      CUSTOMER_REVIEWS_STORAGE_KEY,
      JSON.stringify(cleaned.slice(0, 200))
    );
    window.dispatchEvent(new CustomEvent('brahmyaman-reviews-updated'));
  } catch {
    // Ignore storage quota errors
  }
}

export function mergeApprovedRemoteReviews(
  remoteApproved: CustomerReviewItem[],
  localCached: CustomerReviewItem[]
): CustomerReviewItem[] {
  const merged = new Map<string, CustomerReviewItem>();
  for (const r of remoteApproved) {
    const norm = normalizeCustomerReview(r);
    if (norm.id && norm.status === 'approved' && !isRemovedFakeReview(norm)) {
      merged.set(norm.id, norm);
    }
  }
  // Never overwrite live Firestore deletions with stale local items once remote snapshot arrives;
  // callers pass localCached only before remote arrives or on offline fallback.
  for (const r of localCached) {
    const norm = normalizeCustomerReview(r);
    if (norm.id && norm.status === 'approved' && !isRemovedFakeReview(norm) && !merged.has(norm.id)) {
      merged.set(norm.id, norm);
    }
  }
  return Array.from(merged.values()).sort((a, b) =>
    (b.createdAt || '').localeCompare(a.createdAt || '')
  );
}

/**
 * Live-subscribes public storefront components to Firestore `/customer_reviews`
 * filtered strictly to `status == 'approved'` (compliant with firestore.rules).
 */
export function subscribeToApprovedCustomerReviews(
  onApprovedReviews: (reviews: CustomerReviewItem[]) => void
): () => void {
  const localInitial = loadLocalCustomerReviews().filter((r) => r.status === 'approved');
  if (localInitial.length > 0) {
    onApprovedReviews(mergeApprovedRemoteReviews(localInitial, []));
  }

  let disposed = false;
  let unsub: (() => void) | null = null;

  void Promise.all([loadFirebaseCore(), loadFirestoreSdk()])
    .then(([{ db, handleFirestoreError, OperationType }, fs]) => {
      if (disposed) return;
      const approvedQuery = fs.query(
        fs.collection(db, 'customer_reviews'),
        fs.where('status', '==', 'approved'),
        fs.limit(100)
      );

      try {
        unsub = fs.onSnapshot(
          approvedQuery,
          (snap) => {
            if (disposed) return;
            const remoteApproved: CustomerReviewItem[] = [];
            snap.forEach((docSnap) => {
              const norm = normalizeCustomerReview(
                docSnap.data() as Partial<CustomerReviewItem> & { gardenImage?: string },
                docSnap.id
              );
              if (!isRemovedFakeReview(norm) && norm.status === 'approved') {
                remoteApproved.push(norm);
              }
            });

            const sortedApproved = mergeApprovedRemoteReviews(remoteApproved, []);
            onApprovedReviews(sortedApproved);

            // Preserve any locally pending submissions from this browser while replacing approved list with Firestore truth
            const existingPending = loadLocalCustomerReviews().filter(
              (r) => r.status === 'pending' && !sortedApproved.some((a) => a.id === r.id)
            );
            saveLocalCustomerReviews([...sortedApproved, ...existingPending]);
          },
          (err) => {
            if (err && typeof err === 'object' && 'code' in err && String((err as any).code).includes('permission')) {
              handleFirestoreError(err, OperationType.LIST, 'customer_reviews');
            }
          }
        );
      } catch {
        void fs
          .getDocs(approvedQuery)
          .then((snap) => {
            if (disposed) return;
            const remoteApproved: CustomerReviewItem[] = [];
            snap.forEach((docSnap) => {
              const norm = normalizeCustomerReview(
                docSnap.data() as Partial<CustomerReviewItem> & { gardenImage?: string },
                docSnap.id
              );
              if (!isRemovedFakeReview(norm) && norm.status === 'approved') {
                remoteApproved.push(norm);
              }
            });
            onApprovedReviews(mergeApprovedRemoteReviews(remoteApproved, []));
          })
          .catch(() => {});
      }
    })
    .catch(() => {});

  return () => {
    disposed = true;
    try {
      unsub?.();
    } catch {}
  };
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
  if (item.authorUid) payload.authorUid = String(item.authorUid).trim().slice(0, 128);
  if (item.plantId) payload.plantId = String(item.plantId).slice(0, 128);
  if (item.plantNameBn) payload.plantNameBn = String(item.plantNameBn).slice(0, 200);
  const photo = item.photoUrl || item.image;
  if (photo && photo.length <= 450_000) {
    payload.gardenImage = photo;
  }
  return payload;
}

export interface ReviewAuthUserLike {
  uid?: string | null;
  emailVerified?: boolean;
  getIdToken?: (forceRefresh?: boolean) => Promise<string>;
}

export async function requireAuthenticatedReviewUser(
  currentUser: ReviewAuthUserLike | null | undefined
): Promise<{ uid: string; idToken: string }> {
  const uid = String(currentUser?.uid || '').trim();
  if (!currentUser || !uid) {
    throw new Error('রিভিউ জমা দিতে আগে Google অ্যাকাউন্ট দিয়ে লগইন করুন।');
  }
  if (currentUser.emailVerified === false) {
    throw new Error('আপনার Google ইমেল ভেরিফাইড নয়। অনুগ্রহ করে ভেরিফাইড Google অ্যাকাউন্ট ব্যবহার করুন।');
  }
  if (typeof currentUser.getIdToken !== 'function') {
    throw new Error('লগইন সেশন যাচাই করা যায়নি। অনুগ্রহ করে পুনরায় Google দিয়ে লগইন করুন।');
  }
  const idToken = (await currentUser.getIdToken()).trim();
  if (!idToken) {
    throw new Error('Firebase ID টোকেন পাওয়া যায়নি। অনুগ্রহ করে পুনরায় Google দিয়ে লগইন করুন।');
  }
  return { uid, idToken };
}

const memoryRateBuckets = new Map<string, number[]>();

export function checkClientSubmissionCooldown(
  bucketKey: string,
  options: { maxCount: number; windowMs: number; minIntervalMs: number; nowMs?: number }
): { allowed: boolean; retryAfterSec: number } {
  const now = options.nowMs ?? Date.now();
  let timestamps: number[] = [];

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(bucketKey);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) {
        timestamps = parsed.filter((n) => typeof n === 'number' && Number.isFinite(n));
      }
    } catch {
      timestamps = memoryRateBuckets.get(bucketKey) || [];
    }
  } else {
    timestamps = memoryRateBuckets.get(bucketKey) || [];
  }

  const active = timestamps.filter((ts) => now - ts < options.windowMs).sort((a, b) => a - b);
  const latest = active[active.length - 1];
  if (latest && now - latest < options.minIntervalMs) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((options.minIntervalMs - (now - latest)) / 1000)),
    };
  }
  if (active.length >= options.maxCount) {
    const oldest = active[0];
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((options.windowMs - (now - oldest)) / 1000)),
    };
  }

  const next = [...active, now];
  memoryRateBuckets.set(bucketKey, next);
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(bucketKey, JSON.stringify(next));
    } catch {}
  }
  return { allowed: true, retryAfterSec: 0 };
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
  honeypot?: string;
}): Promise<CustomerReviewItem> {
  if (input.honeypot && input.honeypot.trim().length > 0) {
    throw new Error('অস্বাভাবিক অনুরোধ শনাক্ত হয়েছে। অনুগ্রহ করে পরে চেষ্টা করুন।');
  }

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

  const [{ auth, db, getAppCheckHeaders, handleFirestoreError, OperationType }, fs] =
    await Promise.all([loadFirebaseCore(), loadFirestoreSdk()]);

  if (!input.autoApprove) {
    const authSession = await requireAuthenticatedReviewUser(auth.currentUser);
    entry.authorUid = authSession.uid;

    const cooldown = checkClientSubmissionCooldown(CLIENT_REVIEW_RATE_KEY, {
      maxCount: 4,
      windowMs: 10 * 60_000,
      minIntervalMs: 15_000,
    });
    if (!cooldown.allowed) {
      throw new Error(
        `একসাথে অনেকগুলো রিভিউ পাঠানো হয়েছে। অনুগ্রহ করে ${cooldown.retryAfterSec} সেকেন্ড পর আবার চেষ্টা করুন।`
      );
    }

    const sanitized = sanitizeCustomerReviewForFirestore({
      ...entry,
      status: 'pending',
      authorUid: authSession.uid,
    });
    const [appCheckHeaders, challengeHeaders] = await Promise.all([
      getAppCheckHeaders(),
      getPublicChallengeHeaders(),
    ]);
    const res = await fetch('/api/public/reviews', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authSession.idToken}`,
        ...appCheckHeaders,
        ...challengeHeaders,
      },
      body: JSON.stringify({
        ...sanitized,
        hp: input.honeypot || '',
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(
        data?.error ||
          (res.status === 401
            ? 'রিভিউ জমা দিতে আগে Google অ্যাকাউন্ট দিয়ে লগইন করুন।'
            : res.status === 429
            ? 'অনেকগুলো রিভিউ পাঠানো হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর চেষ্টা করুন।'
            : 'রিভিউ জমা দেওয়া যায়নি।')
      );
    }

    if (data?.persistedBy === 'client_fallback_allowed') {
      try {
        await fs.setDoc(fs.doc(fs.collection(db, 'customer_reviews'), entry.id), sanitized);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `customer_reviews/${entry.id}`);
      }
    }

    const existing = loadLocalCustomerReviews();
    saveLocalCustomerReviews([entry, ...existing.filter((r) => r.id !== entry.id)]);
    return entry;
  }

  // Authenticated Admin direct review creation (auto-approved)
  if (auth.currentUser?.uid) {
    entry.authorUid = auth.currentUser.uid;
  }
  const existing = loadLocalCustomerReviews();
  saveLocalCustomerReviews([entry, ...existing.filter((r) => r.id !== entry.id)]);

  try {
    const ref = fs.doc(fs.collection(db, 'customer_reviews'), entry.id);
    await fs.setDoc(ref, sanitizeCustomerReviewForFirestore(entry));
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `customer_reviews/${entry.id}`);
  }

  return entry;
}

export async function updateCustomerReviewStatus(
  reviewId: string,
  nextStatus: 'pending' | 'approved',
  fallbackReview?: CustomerReviewItem
): Promise<CustomerReviewItem | null> {
  const existing = loadLocalCustomerReviews();
  const localMatch = existing.find((r) => r.id === reviewId);
  const updatedList = localMatch
    ? existing.map((r) => (r.id === reviewId ? { ...r, status: nextStatus } : r))
    : fallbackReview
    ? [{ ...normalizeCustomerReview(fallbackReview), status: nextStatus }, ...existing]
    : existing;
  saveLocalCustomerReviews(updatedList);

  const target =
    updatedList.find((r) => r.id === reviewId) ||
    (fallbackReview ? { ...normalizeCustomerReview(fallbackReview), status: nextStatus } : null);

  const [{ db, handleFirestoreError, OperationType }, fs] = await Promise.all([
    loadFirebaseCore(),
    loadFirestoreSdk(),
  ]);

  const ref = fs.doc(fs.collection(db, 'customer_reviews'), reviewId);
  try {
    // Only update 'status' so firestore.rules affectedKeys().hasOnly(['status', ...]) always passes
    await fs.updateDoc(ref, { status: nextStatus });
  } catch (err: any) {
    const code = String(err?.code || '');
    if (code.includes('not-found') && target) {
      try {
        await fs.setDoc(ref, sanitizeCustomerReviewForFirestore(target));
      } catch (innerErr) {
        handleFirestoreError(innerErr, OperationType.WRITE, `customer_reviews/${reviewId}`);
      }
    } else if (code.includes('permission')) {
      handleFirestoreError(err, OperationType.UPDATE, `customer_reviews/${reviewId}`);
    }
  }

  return (
    target || {
      id: reviewId,
      customerName: 'গ্রাহক',
      customerNameBn: 'গ্রাহক',
      locationBn: 'বাঁকুড়া',
      rating: 5,
      commentBn: '',
      status: nextStatus,
      createdAt: new Date().toISOString(),
      createdAtBn: '',
    }
  );
}

export async function removeCustomerReview(reviewId: string): Promise<CustomerReviewItem[]> {
  const existing = loadLocalCustomerReviews();
  const updated = existing.filter((r) => r.id !== reviewId);
  saveLocalCustomerReviews(updated);
  try {
    const [{ db, handleFirestoreError, OperationType }, fs] = await Promise.all([
      loadFirebaseCore(),
      loadFirestoreSdk(),
    ]);
    try {
      await fs.deleteDoc(fs.doc(fs.collection(db, 'customer_reviews'), reviewId));
    } catch (err: any) {
      if (String(err?.code || '').includes('permission')) {
        handleFirestoreError(err, OperationType.DELETE, `customer_reviews/${reviewId}`);
      }
    }
  } catch {
    // Ignore lazy module failure
  }
  return updated;
}
