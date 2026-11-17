import { initializeApp } from 'firebase/app';
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

  const win = window as unknown as { __firebasePopupConsoleGuardInstalled?: boolean };
  if (!win.__firebasePopupConsoleGuardInstalled) {
    win.__firebasePopupConsoleGuardInstalled = true;
    const origError = console.error.bind(console);
    console.error = (...args: unknown[]) => {
      if (args.some((arg) => isFirebasePopupPendingPromiseAssertion(arg))) {
        return;
      }
      origError(...args);
    };
  }
}

const app = initializeApp(firebaseConfig);

// Silence internal @firebase/firestore WebChannel 10s transport timeout console.error noise
// when operating in offline/local-cache mode; real operation errors still log via handleFirestoreError.
try {
  setLogLevel('silent');
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
