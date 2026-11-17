// Pre-index all bundled nursery assets so Firestore documents storing dev paths like
// "/src/assets/images/ashoke_photos/photo_101.jpg" resolve to hashed "/assets/..." URLs in production builds.
let VITE_BUNDLED_ASSET_MAP: Record<string, string> = {};
try {
  VITE_BUNDLED_ASSET_MAP = import.meta.glob(
    '/src/assets/images/**/*.{jpg,jpeg,png,webp,avif}',
    { eager: true, import: 'default' }
  ) as Record<string, string>;
} catch {
  // Node unit-test runtime does not provide import.meta.glob
  VITE_BUNDLED_ASSET_MAP = {};
}

export function resolveBundledPlantAsset(rawPath: string): string | null {
  const clean = (rawPath || '').split(/[?#]/)[0].trim();
  if (!clean) return null;
  const normalizedKey = clean.startsWith('src/assets/')
    ? `/${clean}`
    : clean.startsWith('./src/assets/')
    ? clean.slice(1)
    : clean;

  if (normalizedKey in VITE_BUNDLED_ASSET_MAP) {
    return VITE_BUNDLED_ASSET_MAP[normalizedKey] || null;
  }
  return null;
}

/**
 * Routes external Wikimedia / Wikipedia botanical images through the local
 * cached image proxy (/api/image-proxy) to prevent Wikimedia 429/403 hotlink
 * blocking and accelerate load times on rural 3G/4G connections,
 * translates legacy dev "/src/assets/images/..." Firestore paths into production asset URLs,
 * and adds Cloudinary delivery-time optimizations.
 */
export function resolvePlantImageUrl(url: string | undefined, fallback: string): string {
  if (!url || !url.trim()) return fallback;
  const trimmed = url.trim();

  // Translate stored Vite source paths ("/src/assets/images/..." or "src/assets/images/...")
  if (
    trimmed.startsWith('/src/assets/') ||
    trimmed.startsWith('src/assets/') ||
    trimmed.startsWith('./src/assets/')
  ) {
    const resolvedAsset = resolveBundledPlantAsset(trimmed);
    if (resolvedAsset) {
      return resolvedAsset;
    }
    if (Object.keys(VITE_BUNDLED_ASSET_MAP).length > 0) {
      return fallback;
    }
    return trimmed;
  }

  // Keep already-compiled Vite assets, data URIs, blob URIs, and API proxy URLs untouched
  if (
    trimmed.startsWith('data:') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase();
    if (
      host.endsWith('wikimedia.org') ||
      host.endsWith('wikipedia.org')
    ) {
      return `/api/image-proxy?url=${encodeURIComponent(trimmed)}`;
    }

    // Cloudinary dynamic optimization: ensure automatic format (WebP/AVIF) & visual quality compression
    if (host.includes('cloudinary.com') && parsed.pathname.includes('/image/upload/')) {
      const uploadMarker = '/image/upload/';
      const idx = trimmed.indexOf(uploadMarker);
      if (idx !== -1) {
        const afterUpload = trimmed.slice(idx + uploadMarker.length);
        const firstSegment = afterUpload.split('/')[0] || '';
        const hasVersionOnly = /^v\d+$/.test(firstSegment);
        const alreadyHasTransforms =
          !hasVersionOnly &&
          (firstSegment.includes('f_auto') ||
            firstSegment.includes('q_auto') ||
            firstSegment.includes('w_') ||
            firstSegment.includes('c_'));
        if (!alreadyHasTransforms) {
          return `${trimmed.slice(0, idx + uploadMarker.length)}f_auto,q_auto,w_900,c_limit/${afterUpload}`;
        }
      }
    }

    return trimmed;
  } catch {
    return fallback;
  }
}
