// Lazy loaders for Firebase SDK modules so first-paint storefront bundles
// never parse or download ~193KB of Firebase SDK eagerly.

export function loadFirebaseCore() {
  return import('./firebase');
}

export function loadFirestoreSdk() {
  return import('firebase/firestore');
}

export function loadFirebaseAuthSdk() {
  return import('firebase/auth');
}
