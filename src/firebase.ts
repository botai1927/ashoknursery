import { initializeApp } from 'firebase/app';
import {
  initializeAppCheck,
  ReCaptchaV3Provider,
  ReCaptchaEnterpriseProvider,
  getToken as getAppCheckTokenSdk,
  type AppCheck,
} from 'firebase/app-check';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  setLogLevel,
  doc,
  getDocFromServer,
  Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const FIREBASE_POPUP_ASSERTION = 'INTERNAL ASSERTION FAILED: Pending promise was never set';

export function isFirebasePopupPendingPromiseAssertion(value: unknown): boolean {
  if (!value) return false;
  if (typeof value === 'string') {
    return value.includes(FIREBASE_POPUP_ASSERTION);
  }
  if (value instanceof Error) {
    return (
      value.message.includes(FIREBASE_POPUP_ASSERTION) ||
      (typeof value.stack === 'string' && value.stack.includes(FIREBASE_POPUP_ASSERTION))
    );
  }
  if (typeof value === 'object' && 'message' in value) {
    const msg = (value as { message?: unknown }).message;
    if (typeof msg === 'string' && msg.includes(FIREBASE_POPUP_ASSERTION)) {
      return true;
    }
  }
  return String(value).includes(FIREBASE_POPUP_ASSERTION);
}

/**
 * Removes lingering `firebase:authEvent:*` and `firebase:pendingRedirect:*` entries
 * from sessionStorage/localStorage before opening a new Google login popup.
 * This prevents @firebase/auth's AuthEventManager from replaying a stale popup/redirect
 * event into a newly created PopupOperation before `pendingPromise` is initialized.
 */
export function clearStaleFirebaseAuthEvents(
  storages: Array<Pick<Storage, 'length' | 'key' | 'removeItem'> | null | undefined> = typeof window !==
  'undefined'
    ? [
        (() => {
          try {
            return window.sessionStorage;
          } catch {
            return null;
          }
        })(),
        (() => {
          try {
            return window.localStorage;
          } catch {
            return null;
          }
        })(),
      ]
    : []
): number {
  let removedCount = 0;
  for (const storage of storages) {
    if (!storage) continue;
    try {
      const keysToDelete: string[] = [];
      for (let i = 0; i < storage.length; i += 1) {
        const key = storage.key(i);
        if (
          key &&
          (key.startsWith('firebase:authEvent:') ||
            key.startsWith('firebase:pendingRedirect:') ||
            key.startsWith('firebase:redirectUser:'))
        ) {
          keysToDelete.push(key);
        }
      }
      for (const key of keysToDelete) {
        storage.removeItem(key);
        removedCount += 1;
      }
    } catch {
      // Ignore storage access errors in restricted iframe contexts
    }
  }
  return removedCount;
}

// Guard against upstream @firebase/auth (13.3.0) PopupOperation race condition when a popup closes
// or a stale authEvent fires before/after pendingPromise is active.
if (typeof window !== 'undefined') {
  window.addEventListener(
    'error',
    (event) => {
      if (
        isFirebasePopupPendingPromiseAssertion(event.error) ||
        isFirebasePopupPendingPromiseAssertion(event.message)
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true
  );

  window.addEventListener(
    'unhandledrejection',
    (event) => {
      if (isFirebasePopupPendingPromiseAssertion(event.reason)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true
  );
}

const app = initializeApp(firebaseConfig);

// Optional Firebase App Check initialization (activates automatically when VITE_FIREBASE_APPCHECK_SITE_KEY is configured)
const viteEnv =
  ((import.meta as unknown as { env?: Record<string, string | undefined> }).env) || {};
const APPCHECK_SITE_KEY = (viteEnv.VITE_FIREBASE_APPCHECK_SITE_KEY || '').trim();
const APPCHECK_PROVIDER_TYPE = (viteEnv.VITE_FIREBASE_APPCHECK_PROVIDER || 'v3').trim().toLowerCase();
const APPCHECK_DEBUG_TOKEN = (viteEnv.VITE_FIREBASE_APPCHECK_DEBUG_TOKEN || '').trim();

let appCheckInstance: AppCheck | null = null;
if (typeof window !== 'undefined' && APPCHECK_SITE_KEY) {
  try {
    if (APPCHECK_DEBUG_TOKEN) {
      (window as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN?: string | boolean }).FIREBASE_APPCHECK_DEBUG_TOKEN =
        APPCHECK_DEBUG_TOKEN === 'true' ? true : APPCHECK_DEBUG_TOKEN;
    }
    const provider =
      APPCHECK_PROVIDER_TYPE === 'enterprise'
        ? new ReCaptchaEnterpriseProvider(APPCHECK_SITE_KEY)
        : new ReCaptchaV3Provider(APPCHECK_SITE_KEY);
    appCheckInstance = initializeAppCheck(app, {
      provider,
      isTokenAutoRefreshEnabled: true,
    });
  } catch {
    appCheckInstance = null;
  }
}

export function isAppCheckConfigured(): boolean {
  return Boolean(appCheckInstance);
}

export async function getAppCheckTokenValue(forceRefresh = false): Promise<string | null> {
  if (!appCheckInstance) return null;
  try {
    const res = await getAppCheckTokenSdk(appCheckInstance, forceRefresh);
    return res?.token || null;
  } catch {
    return null;
  }
}

export async function getAppCheckHeaders(): Promise<Record<string, string>> {
  const token = await getAppCheckTokenValue(false);
  return token ? { 'X-Firebase-AppCheck': token } : {};
}

// Log only real Firestore errors while keeping offline/local-cache operation clean
try {
  setLogLevel('error');
} catch {
  // Ignore if unsupported in test environment
}

// Enable IndexedDB persistent offline cache + automatic long-polling fallback
// so rural 3G/4G visitors and proxied iframe sessions connect reliably without 10s WebChannel stalls
let dbInstance: Firestore;
try {
  dbInstance = initializeFirestore(
    app,
    {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
      experimentalAutoDetectLongPolling: true,
    },
    firebaseConfig.firestoreDatabaseId
  );
} catch {
  dbInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
}

export const db = dbInstance;
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Clean up any leftover authEvent artifacts on initial boot
clearStaleFirebaseAuthEvents();

/**
 * Safely executes Google Sign-In via Popup without triggering the @firebase/auth 13.3.0
 * `PopupOperation` / `browserPopupRedirectResolver` pendingPromise assertion conflict.
 */
export async function signInWithGooglePopup(): Promise<FirebaseUser> {
  clearStaleFirebaseAuthEvents();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  try {
    const credential = await signInWithPopup(auth, provider);
    return credential.user;
  } catch (err: unknown) {
    if (isFirebasePopupPendingPromiseAssertion(err)) {
      await auth.authStateReady().catch(() => {});
      if (auth.currentUser) {
        return auth.currentUser;
      }
      const fallbackError = new Error('Google sign-in popup closed before completion') as Error & {
        code?: string;
      };
      fallbackError.code = 'auth/popup-closed-by-user';
      throw fallbackError;
    }
    throw err;
  }
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): FirestoreErrorInfo {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid ?? null,
      email: auth.currentUser?.email ?? null,
      emailVerified: auth.currentUser?.emailVerified ?? null,
      isAnonymous: auth.currentUser?.isAnonymous ?? null,
      tenantId: auth.currentUser?.tenantId ?? null,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  return errInfo;
}

// Quiet connection check on boot (browser-only, cache-friendly)
async function testConnection() {
  if (typeof window === 'undefined' || (typeof navigator !== 'undefined' && navigator.onLine === false)) {
    return;
  }
  try {
    await getDocFromServer(doc(db, '_test', 'connection'));
  } catch {
    // Quietly operate from IndexedDB / localStorage cache when offline or on slow rural networks
  }
}
testConnection();
