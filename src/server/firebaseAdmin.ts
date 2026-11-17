import type express from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  initializeApp as initializeAdminApp,
  getApps as getAdminApps,
  cert,
} from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { getAppCheck as getAdminAppCheck } from 'firebase-admin/app-check';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';
import { issuePublicChallenge, verifyPublicChallengeResponse } from '../lib/publicChallenge.ts';
import { verifyAdminTokenWithRevocation } from '../lib/firebaseAdminAuth.ts';
import {
  FirestoreHybridRateLimitStore,
  MemoryRateLimitStore,
  createRateLimitMiddleware,
  type FirestoreTransactionAdapter,
} from '../lib/rateLimiter.ts';

const __serverDir = path.dirname(fileURLToPath(import.meta.url));
export const WORKSPACE_ROOT = path.resolve(__serverDir, '..', '..');

const firebaseAppletConfig = JSON.parse(
  fs.readFileSync(path.join(WORKSPACE_ROOT, 'firebase-applet-config.json'), 'utf8')
);

export const FIREBASE_PROJECT_ID: string =
  process.env.FIREBASE_PROJECT_ID ||
  process.env.GOOGLE_CLOUD_PROJECT ||
  firebaseAppletConfig.projectId;
export const FIREBASE_WEB_API_KEY: string = firebaseAppletConfig.apiKey || '';

let adminCredentialConfig: { projectId: string; credential?: ReturnType<typeof cert> } = {
  projectId: FIREBASE_PROJECT_ID,
};
export let hasExplicitServiceAccount = false;

if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  try {
    const parsedSa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    adminCredentialConfig = {
      projectId: parsedSa.project_id || FIREBASE_PROJECT_ID,
      credential: cert(parsedSa),
    };
    hasExplicitServiceAccount = true;
  } catch {
    console.warn('Invalid FIREBASE_SERVICE_ACCOUNT_JSON format; falling back to default credentials.');
  }
}

export const adminApp =
  getAdminApps().length > 0
    ? getAdminApps()[0]
    : initializeAdminApp(adminCredentialConfig);
export const adminAuth = getAdminAuth(adminApp);
export const adminFirestore = getAdminFirestore(
  adminApp,
  firebaseAppletConfig.firestoreDatabaseId
);

const rateLimitFirestoreAdapter: FirestoreTransactionAdapter = {
  runTransaction: (updateFn) =>
    adminFirestore.runTransaction(async (tx) => {
      return updateFn({
        get: (docId: string) => tx.get(adminFirestore.collection('_rate_limits').doc(docId)),
        set: (docId: string, data: Record<string, any>) =>
          tx.set(adminFirestore.collection('_rate_limits').doc(docId), data),
      });
    }),
};

// SHA-256 digests of built-in owner & admin allowlisted Google emails (zero plain Gmail addresses in source)
const DEFAULT_OWNER_EMAIL_HASHES = new Set<string>([
  'a6551b199d8420a6e1f852b4ccea92b6dbb849619cbc4c8784fe628149025706',
  '12b87c63cc3b5eece84b2f35cdb453ce8d946dbad0d92abf3d82ccb40cae5faf',
]);

const DEFAULT_AUTHORIZED_ADMIN_EMAIL_HASHES = new Set<string>([
  ...DEFAULT_OWNER_EMAIL_HASHES,
  'd365a45c26dfd444c10b68b27db6d478fcb091fd1c3f2ac0d4c36f0c8de0b3da',
]);

export function parseEmailListEnv(raw?: string): string[] {
  return (raw || '')
    .split(',')
    .map((e) => e.replace(/['"]/g, '').trim().toLowerCase())
    .filter(Boolean);
}

export function hashNormalizedEmail(email: string): string {
  return crypto
    .createHash('sha256')
    .update(email.trim().toLowerCase(), 'utf8')
    .digest('hex');
}

export function isOwnerEmail(email: string | undefined | null): boolean {
  const normalized = (email || '').trim().toLowerCase();
  if (!normalized) return false;
  const envOwners = parseEmailListEnv(process.env.ADMIN_OWNER_EMAILS);
  if (envOwners.includes(normalized)) return true;
  return DEFAULT_OWNER_EMAIL_HASHES.has(hashNormalizedEmail(normalized));
}

export function isAuthorizedAdminEmail(email: string | undefined | null): boolean {
  const normalized = (email || '').trim().toLowerCase();
  if (!normalized) return false;
  if (isOwnerEmail(normalized)) return true;
  const envAdmins = parseEmailListEnv(process.env.ADMIN_AUTHORIZED_EMAILS);
  if (envAdmins.includes(normalized)) return true;
  return DEFAULT_AUTHORIZED_ADMIN_EMAIL_HASHES.has(hashNormalizedEmail(normalized));
}

// Hybrid Shared Firestore + Bounded In-Memory Rate Limiters (Zero extra paid services)
export const adminRateLimitStore = new FirestoreHybridRateLimitStore({
  adapter: rateLimitFirestoreAdapter,
});
export const publicProxyRateLimitStore = new MemoryRateLimitStore();

export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      const err: any = new Error(timeoutMessage);
      err.isTimeout = true;
      reject(err);
    }, timeoutMs);
    promise.then(
      (val) => {
        clearTimeout(timer);
        resolve(val);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

export const aiRateLimiter = createRateLimitMiddleware({
  bucket: 'admin_ai',
  windowMs: 60_000,
  maxRequests: 25,
  store: adminRateLimitStore,
  errorMessage: 'অনেকগুলো AI অনুরোধ একসাথে পাঠানো হয়েছে। অনুগ্রহ করে ১ মিনিট পর আবার চেষ্টা করুন।',
});

export const imageSearchRateLimiter = createRateLimitMiddleware({
  bucket: 'admin_image_search',
  windowMs: 60_000,
  maxRequests: 40,
  store: adminRateLimitStore,
  errorMessage: 'অনেকগুলো ছবির অনুসন্ধান একসাথে পাঠানো হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।',
});

export const imageProxyRateLimiter = createRateLimitMiddleware({
  bucket: 'public_image_proxy',
  windowMs: 60_000,
  maxRequests: 120,
  store: publicProxyRateLimitStore,
  errorMessage: 'Too many image requests. Please wait a moment.',
});

export const cloudinaryUploadRateLimiter = createRateLimitMiddleware({
  bucket: 'admin_cloudinary',
  windowMs: 60_000,
  maxRequests: 60,
  store: adminRateLimitStore,
  errorMessage: 'অনেকগুলো ছবি একসাথে আপলোড করা হচ্ছে। অনুগ্রহ করে ১ মিনিট পর আবার চেষ্টা করুন।',
});

export const publicReviewRateLimiter = createRateLimitMiddleware({
  bucket: 'public_review',
  windowMs: 10 * 60_000,
  maxRequests: 5,
  store: adminRateLimitStore,
  errorMessage: 'একসাথে অনেকগুলো রিভিউ পাঠানো হয়েছে। অনুগ্রহ করে ১০ মিনিট পর আবার চেষ্টা করুন।',
});

export const publicInquiryRateLimiter = createRateLimitMiddleware({
  bucket: 'public_inquiry',
  windowMs: 5 * 60_000,
  maxRequests: 20,
  store: adminRateLimitStore,
  errorMessage: 'অনেকগুলো অর্ডার অনুরোধ পাঠানো হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।',
});

export const publicChallengeRateLimiter = createRateLimitMiddleware({
  bucket: 'public_challenge',
  windowMs: 60_000,
  maxRequests: 60,
  store: publicProxyRateLimitStore,
  errorMessage: 'অনেকগুলো অনুরোধ পাঠানো হয়েছে। অনুগ্রহ করে ১ মিনিট পর আবার চেষ্টা করুন।',
});

export function isFirebaseAdminInfraUnavailableError(err: unknown): boolean {
  const msg = String(err instanceof Error ? err.message : err || '').toLowerCase();
  return (
    msg.includes('permission_denied') ||
    msg.includes('permission denied') ||
    msg.includes('unauthenticated') ||
    msg.includes('default credentials') ||
    msg.includes('metadata') ||
    msg.includes('enotfound') ||
    msg.includes('econnrefused')
  );
}

// Zero-billing Anti-Bot Guard: verifies single-use server-signed HMAC-SHA256 Proof-of-Work challenge
export async function verifyPublicRequestGuard(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const challengeToken = req.header('X-Public-Challenge') || req.header('x-public-challenge');
  const challengeSolution = req.header('X-Public-Solution') || req.header('x-public-solution');

  const challengeResult = verifyPublicChallengeResponse(challengeToken, challengeSolution);
  if (!challengeResult.ok) {
    return res.status(401).json({
      success: false,
      code: challengeResult.code || 'CHALLENGE_INVALID',
      error: challengeResult.error || 'নিরাপত্তা যাচাই ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।',
    });
  }

  const appCheckToken = String(
    req.header('X-Firebase-AppCheck') || req.header('x-firebase-appcheck') || ''
  ).trim();
  if (appCheckToken) {
    if (appCheckToken.split('.').length !== 3 || appCheckToken.length < 32) {
      return res.status(401).json({
        success: false,
        code: 'APP_CHECK_INVALID',
        error: 'অবৈধ নিরাপত্তা টোকেন। পেজ রিলোড করে আবার চেষ্টা করুন।',
      });
    }
    try {
      const verified = await withTimeout(
        getAdminAppCheck(adminApp).verifyToken(appCheckToken),
        4000,
        'App Check verification timeout'
      );
      (req as any).appCheckAppId = verified.appId;
    } catch (err: any) {
      if (hasExplicitServiceAccount || !isFirebaseAdminInfraUnavailableError(err)) {
        return res.status(401).json({
          success: false,
          code: 'APP_CHECK_INVALID',
          error: 'নিরাপত্তা টোকেন যাচাই ব্যর্থ হয়েছে। পেজ রিলোড করে আবার চেষ্টা করুন।',
        });
      }
    }
  }

  return next();
}

export { issuePublicChallenge };

async function extractAndVerifyFirebaseToken(
  req: express.Request,
  missingTokenMessage: string
): Promise<
  | {
      ok: true;
      uid: string;
      email: string;
      emailVerified: boolean;
      revocationCheckActive: true;
      revocationMethod: 'firebase-admin-sdk' | 'identity-toolkit-lookup';
    }
  | { ok: false; status: 401 | 403 | 503; code: string; revoked?: boolean; error: string }
> {
  const authHeader = req.headers.authorization || '';

  if (!authHeader.startsWith('Bearer ')) {
    return {
      ok: false,
      status: 401,
      code: 'AUTH_REQUIRED',
      error: missingTokenMessage,
    };
  }

  const idToken = authHeader.slice('Bearer '.length).trim();
  if (!idToken) {
    return {
      ok: false,
      status: 401,
      code: 'MISSING_TOKEN',
      error: 'Firebase ID টোকেন পাওয়া যায়নি। পুনরায় Google দিয়ে লগইন করুন।',
    };
  }

  const verification = await verifyAdminTokenWithRevocation(idToken, {
    verifyIdToken: (token, checkRevoked) => adminAuth.verifyIdToken(token, checkRevoked),
    hasExplicitServiceAccount,
    webApiKey: FIREBASE_WEB_API_KEY,
    timeoutMs: 4500,
  });

  if (verification.ok === false) {
    return {
      ok: false,
      status: verification.status,
      code: verification.code,
      ...(verification.revoked ? { revoked: true } : {}),
      error: verification.error,
    };
  }

  if (verification.emailVerified !== true) {
    return {
      ok: false,
      status: 403,
      code: 'EMAIL_NOT_VERIFIED',
      error: 'আপনার Google ইমেল ভেরিফাইড নয়। ভেরিফাইড Google ইমেল ব্যবহার করুন।',
    };
  }

  return verification;
}

export async function requireVerifiedFirebaseUser(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const verification = await extractAndVerifyFirebaseToken(
    req,
    'রিভিউ জমা দিতে আগে Google অ্যাকাউন্ট দিয়ে লগইন করুন।'
  );

  if (verification.ok === false) {
    return res.status(verification.status).json({
      success: false,
      code: verification.code,
      ...(verification.revoked ? { revoked: true } : {}),
      error: verification.error,
    });
  }

  (req as any).verifiedUser = {
    uid: verification.uid,
    email: verification.email,
    emailVerified: verification.emailVerified,
    revocationCheckActive: verification.revocationCheckActive,
    revocationMethod: verification.revocationMethod,
  };
  return next();
}

// Server-side Firebase ID token verification strictly enforced across all environments
export async function requireFirebaseAdmin(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const verification = await extractAndVerifyFirebaseToken(
    req,
    'অননুমোদিত প্রবেশ। অনুগ্রহ করে অনুমোদিত Google অ্যাকাউন্ট দিয়ে Firebase লগইন করুন।'
  );

  if (verification.ok === false) {
    return res.status(verification.status).json({
      success: false,
      code: verification.code,
      ...(verification.revoked ? { revoked: true } : {}),
      error: verification.error,
    });
  }

  if (!verification.email || !isAuthorizedAdminEmail(verification.email)) {
    return res.status(403).json({
      success: false,
      code: 'ADMIN_EMAIL_NOT_ALLOWLISTED',
      error: `অননুমোদিত জিমেইল (${verification.email || 'অজানা'})! শুধুমাত্র নির্ধারিত নার্সারি অ্যাডমিন অনুমোদিত।`,
    });
  }

  (req as any).adminUser = {
    uid: verification.uid,
    email: verification.email,
    revocationCheckActive: verification.revocationCheckActive,
    revocationMethod: verification.revocationMethod,
  };
  return next();
}
