import type { BrahmyamanPlant } from '../types/nursery';
import { alignPlantImageSlots } from './cloudinaryCleanup';

export const MAX_RAW_IMAGE_FILE_BYTES = 65 * 1024 * 1024; // 65 MB raw camera file cap
export const SIGNED_DIRECT_PREFER_THRESHOLD_BYTES = 9 * 1024 * 1024; // Avoid backend JSON body limits for huge payloads

const ALLOWED_IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|gif|avif|heic|heif|bmp)$/i;

export type GetAuthHeadersFn = (isJson?: boolean) => Promise<HeadersInit>;

export interface ImageValidationResult {
  ok: boolean;
  errorBn?: string;
}

/**
 * Validates raw File selected from mobile Camera or Gallery before processing.
 */
export function validateImageFile(
  file: { name?: string; type?: string; size: number } | null | undefined
): ImageValidationResult {
  if (!file || typeof file.size !== 'number' || file.size <= 0) {
    return {
      ok: false,
      errorBn: 'খালি বা অকার্যকর ফাইল পাওয়া গেছে। অনুগ্রহ করে একটি বৈধ ছবি নির্বাচন করুন।',
    };
  }

  const mime = (file.type || '').trim().toLowerCase();
  const fileName = (file.name || '').trim();
  const hasImageMime = mime.startsWith('image/');
  // Some Android gallery pickers omit MIME type and provide only filename
  const hasImageExtension = !mime && ALLOWED_IMAGE_EXTENSIONS.test(fileName);

  if (!hasImageMime && !hasImageExtension) {
    return {
      ok: false,
      errorBn: 'শুধুমাত্র ছবির ফাইল (JPG, PNG, WebP, HEIC) আপলোড করা যাবে।',
    };
  }

  if (file.size > MAX_RAW_IMAGE_FILE_BYTES) {
    return {
      ok: false,
      errorBn: 'ছবির আকার ৬৫ MB-এর বেশি! অনুগ্রহ করে আরেকটু ছোট ছবি নির্বাচন করুন।',
    };
  }

  return { ok: true };
}

export interface CompressImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

/**
 * Compresses mobile camera/gallery images via ObjectURL + Canvas to ~100-250KB WebP/JPEG data URL.
 */
export function compressImageFileToDataUrl(
  file: File,
  options: CompressImageOptions = {}
): Promise<string> {
  const maxWidth = options.maxWidth ?? 1200;
  const maxHeight = options.maxHeight ?? 1200;
  const quality = options.quality ?? 0.82;

  const validation = validateImageFile(file);
  if (!validation.ok) {
    return Promise.reject(new Error(validation.errorBn || 'Invalid image file'));
  }

  const encodeImageElement = (img: HTMLImageElement, fallbackSrc: string): string => {
    let width = img.naturalWidth || img.width || 800;
    let height = img.naturalHeight || img.height || 800;
    if (width > height) {
      if (width > maxWidth) {
        height = Math.max(1, Math.round((height * maxWidth) / width));
        width = maxWidth;
      }
    } else if (height > maxHeight) {
      width = Math.max(1, Math.round((width * maxHeight) / height));
      height = maxHeight;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return fallbackSrc;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);

    let dataUrl = '';
    try {
      dataUrl = canvas.toDataURL('image/webp', quality);
      if (!dataUrl || dataUrl === 'data:,' || !dataUrl.startsWith('data:image/webp')) {
        dataUrl = canvas.toDataURL('image/jpeg', quality);
      }
    } catch {
      dataUrl = canvas.toDataURL('image/jpeg', quality);
    }

    if (!dataUrl || dataUrl === 'data:,' || !dataUrl.startsWith('data:image/')) {
      return fallbackSrc;
    }
    return dataUrl;
  };

  return new Promise((resolve, reject) => {
    const readViaFileReader = () => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const rawResult = (e.target?.result as string) || '';
        const img = new Image();
        img.onload = () => resolve(encodeImageElement(img, rawResult));
        img.onerror = () => reject(new Error('ছবিটি ডিকোড করা যায়নি।'));
        img.src = rawResult;
      };
      reader.onerror = () => reject(new Error('ফাইল পড়া যায়নি।'));
      reader.readAsDataURL(file);
    };

    if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
      const objUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        try {
          resolve(encodeImageElement(img, ''));
        } finally {
          URL.revokeObjectURL(objUrl);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(objUrl);
        readViaFileReader();
      };
      img.src = objUrl;
    } else {
      readViaFileReader();
    }
  });
}

export interface SignedUploadSignatureResult {
  ok: boolean;
  uploadEndpoint?: string;
  cloudName?: string;
  apiKey?: string;
  timestamp?: number;
  signature?: string;
  folder?: string;
  tags?: string;
  transformation?: string;
  publicId?: string;
  authError?: boolean;
  error?: string;
}

export interface CloudinaryUploadOutcome {
  ok: boolean;
  url: string;
  publicId: string;
  bytes: number;
  width?: number;
  height?: number;
  format?: string;
  method?: 'server' | 'signed-direct';
  authError?: boolean;
  errorCode?: string;
  error?: string;
}

export interface CloudinaryRequestDeps {
  getAuthHeaders: GetAuthHeadersFn;
  onUnauthorized?: (message?: string) => Promise<void> | void;
  fetchFn?: typeof fetch;
}

/**
 * Requests a short-lived server-generated cryptographic upload signature
 * without exposing CLOUDINARY_API_SECRET to browser JavaScript.
 */
export async function requestCloudinaryUploadSignature(
  params: { plantName?: string; slotNumber?: number; folder?: string; publicId?: string },
  deps: CloudinaryRequestDeps
): Promise<SignedUploadSignatureResult> {
  const fetchImpl = deps.fetchFn || fetch;
  try {
    const headers = await deps.getAuthHeaders(false);
    const sigRes = await fetchImpl('/api/admin/cloudinary-signature', {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        plantName: params.plantName || 'plant',
        slot: params.slotNumber || 1,
        ...(params.folder ? { folder: params.folder } : {}),
        ...(params.publicId ? { publicId: params.publicId } : {}),
      }),
    });
    const sigData = await sigRes.json().catch(() => ({}));
    if (sigRes.status === 401 || sigRes.status === 403) {
      await deps.onUnauthorized?.(sigData?.error);
      return {
        ok: false,
        authError: true,
        error: sigData?.error || 'অ্যাডমিন অনুমোদন ব্যর্থ হয়েছে',
      };
    }
    if (!sigRes.ok || !sigData?.success || !sigData?.signature || !sigData?.cloudName) {
      return {
        ok: false,
        error: sigData?.error || `Signature HTTP ${sigRes.status}`,
      };
    }
    return {
      ok: true,
      uploadEndpoint: `https://api.cloudinary.com/v1_1/${sigData.cloudName}/image/upload`,
      cloudName: sigData.cloudName,
      apiKey: sigData.apiKey,
      timestamp: sigData.timestamp,
      signature: sigData.signature,
      folder: sigData.folder,
      tags: sigData.tags,
      transformation: sigData.transformation,
      publicId: sigData.publicId,
    };
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message || 'Cloudinary সিগনেচার অনুরোধ ব্যর্থ হয়েছে',
    };
  }
}

export async function uploadToCloudinarySignedDirect(
  imagePayload: string,
  sig: SignedUploadSignatureResult,
  fetchFn: typeof fetch = fetch
): Promise<CloudinaryUploadOutcome> {
  if (!sig.ok || !sig.uploadEndpoint || !sig.signature || !sig.apiKey || !sig.timestamp) {
    return {
      ok: false,
      url: '',
      publicId: '',
      bytes: 0,
      error: sig.error || 'অবৈধ Cloudinary সিগনেচার',
    };
  }

  try {
    const formData = new FormData();
    formData.append('file', imagePayload);
    formData.append('api_key', String(sig.apiKey));
    formData.append('timestamp', String(sig.timestamp));
    formData.append('signature', String(sig.signature));
    if (sig.folder) formData.append('folder', String(sig.folder));
    if (sig.tags) formData.append('tags', String(sig.tags));
    if (sig.transformation) formData.append('transformation', String(sig.transformation));
    if (sig.publicId) formData.append('public_id', String(sig.publicId));

    const directRes = await fetchFn(sig.uploadEndpoint, {
      method: 'POST',
      body: formData,
    });
    const directData = await directRes.json().catch(() => ({}));
    if (directRes.ok && directData?.secure_url) {
      return {
        ok: true,
        url: directData.secure_url,
        publicId: directData.public_id || '',
        bytes: Number(directData.bytes || 0),
        width: Number(directData.width || 0) || undefined,
        height: Number(directData.height || 0) || undefined,
        format: directData.format || undefined,
        method: 'signed-direct',
      };
    }

    const rawDirectError = directData?.error?.message || `Direct upload HTTP ${directRes.status}`;
    const isInvalidCloudName =
      typeof rawDirectError === 'string' && rawDirectError.toLowerCase().includes('invalid cloud_name');
    return {
      ok: false,
      url: '',
      publicId: '',
      bytes: 0,
      errorCode: isInvalidCloudName ? 'INVALID_CLOUD_NAME' : undefined,
      error: isInvalidCloudName
        ? `Cloudinary Cloud Name ("${sig.cloudName || 'অজানা'}") সঠিক নয়! Settings > Secrets-এ CLOUDINARY_CLOUD_NAME আপডেট করুন।`
        : rawDirectError,
    };
  } catch (err: any) {
    return {
      ok: false,
      url: '',
      publicId: '',
      bytes: 0,
      error: err?.message || 'Cloudinary ডাইরেক্ট আপলোড ব্যর্থ হয়েছে',
    };
  }
}

export async function uploadViaServerEndpoint(
  imagePayload: string,
  params: { plantName?: string; slotNumber?: number; folder?: string },
  deps: CloudinaryRequestDeps
): Promise<CloudinaryUploadOutcome> {
  const fetchImpl = deps.fetchFn || fetch;
  try {
    const headers = await deps.getAuthHeaders(false);
    const uploadRes = await fetchImpl('/api/admin/cloudinary-upload', {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imagePayload,
        plantName: params.plantName || 'plant',
        slot: params.slotNumber || 1,
        ...(params.folder ? { folder: params.folder } : {}),
      }),
    });
    const uploadData = await uploadRes.json().catch(() => ({}));
    if (uploadRes.status === 401 || uploadRes.status === 403) {
      await deps.onUnauthorized?.(uploadData?.error);
      return {
        ok: false,
        url: '',
        publicId: '',
        bytes: 0,
        authError: true,
        error: uploadData?.error || 'অ্যাডমিন অনুমোদন ব্যর্থ হয়েছে',
      };
    }
    if (uploadRes.ok && uploadData?.success && uploadData?.url) {
      return {
        ok: true,
        url: uploadData.url,
        publicId: uploadData.public_id || '',
        bytes: Number(uploadData.bytes || 0),
        width: Number(uploadData.width || 0) || undefined,
        height: Number(uploadData.height || 0) || undefined,
        format: uploadData.format || undefined,
        method: 'server',
      };
    }
    return {
      ok: false,
      url: '',
      publicId: '',
      bytes: 0,
      errorCode: typeof uploadData?.code === 'string' ? uploadData.code : undefined,
      error: uploadData?.error || `HTTP ${uploadRes.status}`,
    };
  } catch (err: any) {
    return {
      ok: false,
      url: '',
      publicId: '',
      bytes: 0,
      error: err?.message || 'নেটওয়ার্ক ত্রুটি',
    };
  }
}

/**
 * Dual-path resilient authenticated upload:
 * - Supports server upload (/api/admin/cloudinary-upload) AND short-lived signed direct upload (/api/admin/cloudinary-signature -> api.cloudinary.com)
 * - Automatically prefers signed-direct when payload exceeds 9MB (avoiding serverless body caps) or when preferredStrategy === 'signed-first'
 * - Propagates 401/403 auth errors immediately without masking
 */
export async function uploadImageSecurely(
  options: {
    imagePayload: string;
    plantName?: string;
    slotNumber?: number;
    folder?: string;
    preferredStrategy?: 'server-first' | 'signed-first';
  },
  deps: CloudinaryRequestDeps
): Promise<CloudinaryUploadOutcome> {
  const payload = (options.imagePayload || '').trim();
  if (!payload) {
    return { ok: false, url: '', publicId: '', bytes: 0, error: 'ছবির ডাটা খালি।' };
  }

  const fetchImpl = deps.fetchFn || fetch;
  const strategy =
    options.preferredStrategy ||
    (payload.length >= SIGNED_DIRECT_PREFER_THRESHOLD_BYTES ? 'signed-first' : 'server-first');

  const tryServer = () =>
    uploadViaServerEndpoint(
      payload,
      { plantName: options.plantName, slotNumber: options.slotNumber, folder: options.folder },
      deps
    );

  const trySignedDirect = async (): Promise<CloudinaryUploadOutcome> => {
    const sig = await requestCloudinaryUploadSignature(
      { plantName: options.plantName, slotNumber: options.slotNumber, folder: options.folder },
      deps
    );
    if (sig.authError) {
      return { ok: false, url: '', publicId: '', bytes: 0, authError: true, error: sig.error };
    }
    if (!sig.ok) {
      return { ok: false, url: '', publicId: '', bytes: 0, error: sig.error };
    }
    return uploadToCloudinarySignedDirect(payload, sig, fetchImpl);
  };

  const isNonRetryableConfigError = (outcome: CloudinaryUploadOutcome) =>
    outcome.errorCode === 'INVALID_CLOUD_NAME' ||
    outcome.errorCode === 'INVALID_CREDENTIALS' ||
    outcome.errorCode === 'UNCONFIGURED';

  if (strategy === 'signed-first') {
    const first = await trySignedDirect();
    if (first.ok || first.authError || isNonRetryableConfigError(first)) return first;
    const second = await tryServer();
    if (second.ok || second.authError) return second;
    return {
      ok: false,
      url: '',
      publicId: '',
      bytes: 0,
      errorCode: second.errorCode || first.errorCode,
      error: first.error || second.error || 'Cloudinary আপলোড ব্যর্থ হয়েছে',
    };
  }

  const first = await tryServer();
  if (first.ok || first.authError || isNonRetryableConfigError(first)) return first;
  const second = await trySignedDirect();
  if (second.ok || second.authError) return second;
  return {
    ok: false,
    url: '',
    publicId: '',
    bytes: 0,
    errorCode: second.errorCode || first.errorCode,
    error: second.error || first.error || 'Cloudinary আপলোড ব্যর্থ হয়েছে',
  };
}

/**
 * Deletes an unused or replaced Cloudinary asset cleanly via authenticated Admin endpoint.
 */
export async function deleteCloudinaryAsset(
  publicId: string,
  deps: CloudinaryRequestDeps
): Promise<{ ok: boolean; authError?: boolean; error?: string }> {
  const cleanId = (publicId || '').trim();
  if (!cleanId) return { ok: true };
  const fetchImpl = deps.fetchFn || fetch;

  try {
    const headers = await deps.getAuthHeaders(false);
    const delRes = await fetchImpl('/api/admin/cloudinary-delete', {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ public_id: cleanId }),
    });
    const delData = await delRes.json().catch(() => ({}));
    if (delRes.status === 401 || delRes.status === 403) {
      await deps.onUnauthorized?.(delData?.error);
      return { ok: false, authError: true, error: delData?.error };
    }
    if (!delRes.ok || !delData?.success) {
      return { ok: false, error: delData?.error || `Delete HTTP ${delRes.status}` };
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Cloudinary ডিলিট ব্যর্থ হয়েছে' };
  }
}

/**
 * Immutably updates the target slot (0..2) on a BrahmyamanPlant while preserving
 * strict 1-to-1 alignment with cloudinaryPublicIds[] and stamping fresh sync metadata.
 */
export function applyUploadedPhotoToPlant(params: {
  plant: BrahmyamanPlant;
  slotIndex: number;
  uploadedUrl: string;
  publicId?: string;
  fallbackPrimaryImage?: string;
  timestampIso: string;
  timestampBn: string;
}): BrahmyamanPlant {
  const { plant, slotIndex, uploadedUrl, publicId = '', fallbackPrimaryImage = '', timestampIso, timestampBn } =
    params;
  const boundedSlot = Math.min(2, Math.max(0, Math.trunc(slotIndex)));
  const currentImages = Array.isArray(plant.images) && plant.images.length > 0 ? [...plant.images] : [plant.image];
  const currentPublicIds = Array.isArray(plant.cloudinaryPublicIds) ? [...plant.cloudinaryPublicIds] : [];

  currentImages[boundedSlot] = uploadedUrl;
  for (let i = 0; i < boundedSlot; i += 1) {
    if (typeof currentPublicIds[i] !== 'string') currentPublicIds[i] = '';
  }
  currentPublicIds[boundedSlot] = publicId;

  const aligned = alignPlantImageSlots(
    currentImages,
    currentPublicIds,
    currentImages[0] || plant.image || fallbackPrimaryImage || uploadedUrl
  );

  return {
    ...plant,
    image: aligned.primaryImage || uploadedUrl,
    images: aligned.images.length > 0 ? aligned.images : [aligned.primaryImage || uploadedUrl],
    cloudinaryPublicIds: aligned.cloudinaryPublicIds,
    updatedAt: timestampIso,
    updatedAtBn: timestampBn,
  };
}

/**
 * Clears a secondary photo slot (slot 1 or 2) immutably while keeping slot alignment intact.
 */
export function clearPlantPhotoSlot(params: {
  plant: BrahmyamanPlant;
  slotIndex: number;
  fallbackPrimaryImage?: string;
  timestampIso: string;
  timestampBn: string;
}): BrahmyamanPlant {
  const { plant, slotIndex, fallbackPrimaryImage = '', timestampIso, timestampBn } = params;
  const boundedSlot = Math.min(2, Math.max(0, Math.trunc(slotIndex)));
  const currentImages = Array.isArray(plant.images) && plant.images.length > 0 ? [...plant.images] : [plant.image];
  const currentPublicIds = Array.isArray(plant.cloudinaryPublicIds) ? [...plant.cloudinaryPublicIds] : [];

  if (boundedSlot === 0) {
    return plant;
  }

  currentImages[boundedSlot] = '';
  currentPublicIds[boundedSlot] = '';

  const aligned = alignPlantImageSlots(
    currentImages,
    currentPublicIds,
    currentImages[0] || plant.image || fallbackPrimaryImage
  );

  return {
    ...plant,
    image: aligned.primaryImage || plant.image || fallbackPrimaryImage,
    images:
      aligned.images.length > 0
        ? aligned.images
        : [aligned.primaryImage || plant.image || fallbackPrimaryImage].filter(Boolean),
    cloudinaryPublicIds: aligned.cloudinaryPublicIds,
    updatedAt: timestampIso,
    updatedAtBn: timestampBn,
  };
}

export function validateFirestoreImagePayloadSize(
  base64OrUrl: string,
  maxBytes = 850000
): { ok: boolean; sizeBytes: number; errorBn?: string } {
  if (!base64OrUrl || typeof base64OrUrl !== 'string') {
    return { ok: true, sizeBytes: 0 };
  }
  const sizeBytes = new Blob([base64OrUrl]).size;
  if (sizeBytes > maxBytes) {
    return {
      ok: false,
      sizeBytes,
      errorBn: `ছবির আকার (${Math.round(sizeBytes / 1024)} KB) Firestore-এর ১MB সীমার কাছাকাছি বা বেশি। অনুগ্রহ করে ছোট ছবি ব্যবহার করুন।`,
    };
  }
  return { ok: true, sizeBytes };
}

export function compressBase64ImageForFirestore(
  base64Input: string,
  targetMaxBytes = 750000
): Promise<string> {
  return new Promise((resolve) => {
    if (!base64Input || !base64Input.startsWith('data:image/')) {
      resolve(base64Input);
      return;
    }
    const initialValidation = validateFirestoreImagePayloadSize(base64Input, targetMaxBytes);
    if (initialValidation.ok) {
      resolve(base64Input);
      return;
    }

    const img = new Image();
    img.onload = () => {
      let width = img.naturalWidth || img.width || 1000;
      let height = img.naturalHeight || img.height || 1000;
      const maxDim = 1000;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const attemptCompression = (w: number, h: number, q: number): string => {
        const fallbackCanvas = document.createElement('canvas');
        fallbackCanvas.width = w;
        fallbackCanvas.height = h;
        const fCtx = fallbackCanvas.getContext('2d');
        if (!fCtx) return base64Input;

        fCtx.imageSmoothingEnabled = true;
        fCtx.imageSmoothingQuality = 'medium';
        fCtx.drawImage(img, 0, 0, w, h);

        let dataUrl = '';
        try {
          dataUrl = fallbackCanvas.toDataURL('image/webp', q);
          if (!dataUrl || dataUrl === 'data:,' || !dataUrl.startsWith('data:image/webp')) {
            dataUrl = fallbackCanvas.toDataURL('image/jpeg', q);
          }
        } catch {
          dataUrl = fallbackCanvas.toDataURL('image/jpeg', q);
        }
        return dataUrl;
      };

      let currentQuality = 0.80;
      let currentW = width;
      let currentH = height;
      let result = attemptCompression(currentW, currentH, currentQuality);

      while (new Blob([result]).size > targetMaxBytes && currentQuality > 0.35) {
        currentQuality -= 0.15;
        result = attemptCompression(currentW, currentH, currentQuality);
      }

      if (new Blob([result]).size > targetMaxBytes) {
        currentW = Math.round(currentW * 0.75);
        currentH = Math.round(currentH * 0.75);
        result = attemptCompression(currentW, currentH, 0.50);
      }

      resolve(new Blob([result]).size <= 850000 ? result : '');
    };
    img.onerror = () => resolve(base64Input);
    img.src = base64Input;
  });
}

