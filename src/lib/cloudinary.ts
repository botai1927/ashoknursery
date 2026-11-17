import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';

export const CLOUDINARY_DEFAULT_FOLDER = 'brahmyaman_plants';

export interface ResolvedCloudinaryCredentials {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

export type CloudinaryHealthErrorCode =
  | 'UNCONFIGURED'
  | 'INVALID_CLOUD_NAME'
  | 'INVALID_CREDENTIALS'
  | 'RATE_LIMITED'
  | 'NETWORK_ERROR';

export interface CloudinaryStatusResult {
  configured: boolean;
  verified: boolean;
  cloudName: string | null;
  folder: string;
  errorCode: CloudinaryHealthErrorCode | null;
  errorMessage: string | null;
  checkedAt: string;
}

function stripSurroundingQuotes(raw: string): string {
  const trimmed = (raw || '').trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

/**
 * Normalizes a CLOUDINARY_CLOUD_NAME input even if copied with quotes,
 * `@cloud_name`, or a `res.cloudinary.com/<cloud_name>/...` URL.
 */
export function normalizeCloudNameInput(raw: string): string {
  let val = stripSurroundingQuotes(raw).replace(/[\u200B-\u200D\uFEFF\s]+/g, '');
  if (!val) return '';

  const resMatch = val.match(/res\.cloudinary\.com\/([a-zA-Z0-9_-]+)/i);
  if (resMatch?.[1]) {
    return resMatch[1].trim().toLowerCase();
  }

  const apiMatch = val.match(/api\.cloudinary\.com\/v1_1\/([a-zA-Z0-9_-]+)/i);
  if (apiMatch?.[1]) {
    return apiMatch[1].trim().toLowerCase();
  }

  if (val.startsWith('cloudinary://') && val.includes('@')) {
    const afterAt = val.split('@').pop() || '';
    return afterAt.split('/')[0].trim().toLowerCase();
  }

  if (val.startsWith('@')) {
    val = val.slice(1).trim();
  }

  return val.toLowerCase();
}

/**
 * Parses `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
 * (or fallback `CLOUDINARY_URL=cloudinary://key:secret@cloud_name`) dynamically
 * from `env` so `dotenv.config()` ordering never freezes stale values.
 */
export function resolveCloudinaryCredentials(
  env: Record<string, string | undefined> = process.env
): ResolvedCloudinaryCredentials {
  let cloudName = normalizeCloudNameInput(env.CLOUDINARY_CLOUD_NAME || '');
  let apiKey = stripSurroundingQuotes(env.CLOUDINARY_API_KEY || '');
  let apiSecret = stripSurroundingQuotes(env.CLOUDINARY_API_SECRET || '');

  const rawUrl = stripSurroundingQuotes(env.CLOUDINARY_URL || '');
  if (rawUrl && rawUrl.startsWith('cloudinary://')) {
    try {
      const parsed = new URL(rawUrl);
      if (!cloudName && parsed.hostname) {
        cloudName = normalizeCloudNameInput(parsed.hostname);
      }
      if (!apiKey && parsed.username) {
        apiKey = decodeURIComponent(parsed.username);
      }
      if (!apiSecret && parsed.password) {
        apiSecret = decodeURIComponent(parsed.password);
      }
    } catch {
      // Ignore malformed CLOUDINARY_URL
    }
  }

  return { cloudName, apiKey, apiSecret };
}

let lastConfiguredFingerprint = '';
let cachedVerification: { fingerprint: string; expiresAt: number; result: CloudinaryStatusResult } | null = null;

export function isCloudinaryConfigured(
  env: Record<string, string | undefined> = process.env
): boolean {
  const creds = resolveCloudinaryCredentials(env);
  return Boolean(creds.cloudName && creds.apiKey && creds.apiSecret);
}

function ensureCloudinaryConfigured(): ResolvedCloudinaryCredentials {
  const creds = resolveCloudinaryCredentials();
  if (!creds.cloudName || !creds.apiKey || !creds.apiSecret) {
    throw new Error(
      'সার্ভারে Cloudinary কনফিগারেশন সক্রিয় নেই। অনুগ্রহ করে Settings > Secrets-এ CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY এবং CLOUDINARY_API_SECRET যোগ করুন।'
    );
  }
  const fingerprint = `${creds.cloudName}|${creds.apiKey}|${creds.apiSecret.length}`;
  if (fingerprint !== lastConfiguredFingerprint) {
    cloudinary.config({
      cloud_name: creds.cloudName,
      api_key: creds.apiKey,
      api_secret: creds.apiSecret,
      secure: true,
    });
    lastConfiguredFingerprint = fingerprint;
    cachedVerification = null;
  }
  return creds;
}

export interface ClassifiedCloudinaryError {
  statusCode: number;
  code: CloudinaryHealthErrorCode | 'UPLOAD_FAILED';
  message: string;
  rawMessage: string;
}

export function classifyCloudinaryError(
  err: unknown,
  cloudNameHint?: string
): ClassifiedCloudinaryError {
  const anyErr = err as any;
  const rawMessage =
    typeof anyErr?.error?.message === 'string'
      ? anyErr.error.message
      : typeof anyErr?.message === 'string'
      ? anyErr.message
      : 'Cloudinary সংযোগ বা আপলোড ব্যর্থ হয়েছে।';
  const lower = rawMessage.toLowerCase();
  const httpCode = Number(anyErr?.http_code || anyErr?.error?.http_code || anyErr?.status || 0);

  if (lower.includes('invalid cloud_name') || lower.includes('cloud_name')) {
    const badName =
      rawMessage.match(/invalid cloud_name\s+([^\s,;]+)/i)?.[1] || cloudNameHint || '';
    return {
      statusCode: 422,
      code: 'INVALID_CLOUD_NAME',
      rawMessage,
      message: `Cloudinary-তে "${badName}" নামে কোনো বৈধ Cloud Name পাওয়া যায়নি (${rawMessage})। Cloudinary Dashboard থেকে সঠিক Cloud Name দেখে Settings > Secrets-এ CLOUDINARY_CLOUD_NAME আপডেট করুন।`,
    };
  }

  if (
    lower.includes('invalid signature') ||
    lower.includes('unknown api_key') ||
    lower.includes('api_key') ||
    lower.includes('must supply api_key') ||
    lower.includes('authorization') ||
    httpCode === 401 ||
    httpCode === 403
  ) {
    return {
      statusCode: 422,
      code: 'INVALID_CREDENTIALS',
      rawMessage,
      message: `Cloudinary API Key বা API Secret সঠিক নয় (${rawMessage})। Settings > Secrets-এ CLOUDINARY_API_KEY এবং CLOUDINARY_API_SECRET যাচাই করুন।`,
    };
  }

  if (httpCode === 420 || httpCode === 429 || lower.includes('rate limit')) {
    return {
      statusCode: 429,
      code: 'RATE_LIMITED',
      rawMessage,
      message: `Cloudinary সাময়িক রেট-লিমিটে পৌঁছেছে (${rawMessage})। কিছুক্ষণ পর আবার চেষ্টা করুন।`,
    };
  }

  if (httpCode >= 400 && httpCode < 500) {
    return {
      statusCode: 400,
      code: 'UPLOAD_FAILED',
      rawMessage,
      message: `Cloudinary অনুরোধ গ্রহণ করেনি: ${rawMessage}`,
    };
  }

  return {
    statusCode: 500,
    code: 'UPLOAD_FAILED',
    rawMessage,
    message: rawMessage || 'Cloudinary-তে ছবি আপলোড করতে সমস্যা হয়েছে।',
  };
}

export function getCloudinaryStatus(): {
  configured: boolean;
  cloudName: string | null;
  folder: string;
} {
  const creds = resolveCloudinaryCredentials();
  return {
    configured: Boolean(creds.cloudName && creds.apiKey && creds.apiSecret),
    cloudName: creds.cloudName || null,
    folder: CLOUDINARY_DEFAULT_FOLDER,
  };
}

/**
 * Live connectivity & credential verification against Cloudinary Admin Ping API.
 * Caches results briefly (30s) unless `forceRefresh = true`.
 */
export async function verifyCloudinaryConnection(
  forceRefresh = false
): Promise<CloudinaryStatusResult> {
  const creds = resolveCloudinaryCredentials();
  const checkedAt = new Date().toISOString();

  if (!creds.cloudName || !creds.apiKey || !creds.apiSecret) {
    return {
      configured: false,
      verified: false,
      cloudName: creds.cloudName || null,
      folder: CLOUDINARY_DEFAULT_FOLDER,
      errorCode: 'UNCONFIGURED',
      errorMessage:
        'Settings > Secrets-এ CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY ও CLOUDINARY_API_SECRET যোগ করা নেই।',
      checkedAt,
    };
  }

  const fingerprint = `${creds.cloudName}|${creds.apiKey}|${creds.apiSecret.length}`;
  if (
    !forceRefresh &&
    cachedVerification &&
    cachedVerification.fingerprint === fingerprint &&
    cachedVerification.expiresAt > Date.now()
  ) {
    return cachedVerification.result;
  }

  ensureCloudinaryConfigured();

  try {
    await cloudinary.api.ping();
    const okResult: CloudinaryStatusResult = {
      configured: true,
      verified: true,
      cloudName: creds.cloudName,
      folder: CLOUDINARY_DEFAULT_FOLDER,
      errorCode: null,
      errorMessage: null,
      checkedAt,
    };
    cachedVerification = {
      fingerprint,
      expiresAt: Date.now() + 30_000,
      result: okResult,
    };
    return okResult;
  } catch (err: unknown) {
    const classified = classifyCloudinaryError(err, creds.cloudName);
    const errorCode: CloudinaryHealthErrorCode =
      classified.code === 'INVALID_CLOUD_NAME' ||
      classified.code === 'INVALID_CREDENTIALS' ||
      classified.code === 'RATE_LIMITED'
        ? classified.code
        : 'NETWORK_ERROR';

    const failResult: CloudinaryStatusResult = {
      configured: true,
      verified: false,
      cloudName: creds.cloudName,
      folder: CLOUDINARY_DEFAULT_FOLDER,
      errorCode,
      errorMessage: classified.message,
      checkedAt,
    };
    cachedVerification = {
      fingerprint,
      expiresAt: Date.now() + 10_000,
      result: failResult,
    };
    return failResult;
  }
}

export function sanitizeCloudinaryTag(input: string, fallback = 'plant'): string {
  const cleaned = (input || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 40);
  return cleaned || fallback;
}

export interface SignedUploadParamsRequest {
  plantName?: string;
  slot?: number;
  folder?: string;
  publicId?: string;
}

export interface SignedUploadParamsResponse {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  tags: string;
  transformation: string;
  publicId?: string;
}

/**
 * Generates a short-lived cryptographic upload signature on the server using
 * CLOUDINARY_API_SECRET so the secret is NEVER exposed to browser JavaScript.
 * Note: f_auto is strictly a delivery-time parameter and MUST NOT be included
 * in upload/incoming transformations (Cloudinary Upload API rejects f_auto).
 */
export function generateCloudinaryUploadSignature(
  params: SignedUploadParamsRequest = {}
): SignedUploadParamsResponse {
  const creds = ensureCloudinaryConfigured();

  const timestamp = Math.round(Date.now() / 1000);
  const folder =
    (params.folder || CLOUDINARY_DEFAULT_FOLDER).replace(/[^a-zA-Z0-9_/-]/g, '') ||
    CLOUDINARY_DEFAULT_FOLDER;
  const safeTag = sanitizeCloudinaryTag(params.plantName || 'plant');
  const slotNum = Math.min(3, Math.max(1, Number(params.slot) || 1));
  const tags = `brahmyaman_nursery,${safeTag},slot_${slotNum}`;
  const transformation = 'w_1400,h_1400,c_limit,q_auto:good';

  const paramsToSign: Record<string, string | number> = {
    folder,
    tags,
    timestamp,
    transformation,
  };

  let sanitizedPublicId: string | undefined;
  if (params.publicId && typeof params.publicId === 'string') {
    sanitizedPublicId = params.publicId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
    if (sanitizedPublicId) {
      paramsToSign.public_id = sanitizedPublicId;
    }
  }

  const signature = cloudinary.utils.api_sign_request(paramsToSign, creds.apiSecret);

  return {
    cloudName: creds.cloudName,
    apiKey: creds.apiKey,
    timestamp,
    signature,
    folder,
    tags,
    transformation,
    ...(sanitizedPublicId ? { publicId: sanitizedPublicId } : {}),
  };
}

export interface CloudinaryUploadInput {
  image: string;
  plantName?: string;
  slot?: number;
  folder?: string;
}

export interface CloudinaryUploadResult {
  url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
}

function isValidUploadPayload(image: string): boolean {
  const trimmed = image.trim();
  if (trimmed.startsWith('data:')) {
    return /^data:image\/(jpeg|jpg|png|webp);base64,[a-z0-9+/=\r\n]+$/i.test(trimmed);
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Server-side authenticated Cloudinary image upload with automatic
 * resolution capping (1400x1400) and quality:auto:good compression.
 * Delivery-time WebP/AVIF f_auto is applied via resolvePlantImageUrl.
 */
export async function uploadImageToCloudinary(
  input: CloudinaryUploadInput
): Promise<CloudinaryUploadResult> {
  const creds = ensureCloudinaryConfigured();

  if (!input.image || typeof input.image !== 'string' || !isValidUploadPayload(input.image)) {
    throw new Error('অবৈধ ছবির ফরম্যাট। অনুগ্রহ করে বৈধ ছবি (JPEG/PNG/WebP/HTTPS URL) পাঠান।');
  }

  const safeTag = sanitizeCloudinaryTag(input.plantName || 'plant');
  const slotNum = Math.min(3, Math.max(1, Number(input.slot) || 1));
  const folder =
    (input.folder || CLOUDINARY_DEFAULT_FOLDER).replace(/[^a-zA-Z0-9_/-]/g, '') ||
    CLOUDINARY_DEFAULT_FOLDER;

  try {
    const uploadResponse: UploadApiResponse = await cloudinary.uploader.upload(input.image, {
      folder,
      resource_type: 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      tags: ['brahmyaman_nursery', safeTag, `slot_${slotNum}`],
      transformation: [
        {
          width: 1400,
          height: 1400,
          crop: 'limit',
          quality: 'auto:good',
        },
      ],
    });

    return {
      url: uploadResponse.secure_url,
      public_id: uploadResponse.public_id,
      format: uploadResponse.format,
      width: uploadResponse.width,
      height: uploadResponse.height,
      bytes: uploadResponse.bytes,
    };
  } catch (err: unknown) {
    const classified = classifyCloudinaryError(err, creds.cloudName);
    const wrapped = new Error(classified.message) as Error & {
      code?: string;
      statusCode?: number;
      rawMessage?: string;
    };
    wrapped.code = classified.code;
    wrapped.statusCode = classified.statusCode;
    wrapped.rawMessage = classified.rawMessage;
    throw wrapped;
  }
}

/**
 * Server-side authenticated Cloudinary asset deletion.
 * Only permits deleting assets within this nursery's namespace.
 */
export async function deleteImageFromCloudinary(publicId: string): Promise<any> {
  ensureCloudinaryConfigured();

  const cleanedId = (publicId || '').trim();
  if (!cleanedId || cleanedId.length > 250 || !/^[a-zA-Z0-9_/\-.]+$/.test(cleanedId)) {
    throw new Error('অবৈধ Cloudinary public_id।');
  }

  return cloudinary.uploader.destroy(cleanedId, { resource_type: 'image', invalidate: true });
}

export interface CloudinaryListedAsset {
  public_id: string;
  url: string;
  format: string;
  bytes: number;
  width: number;
  height: number;
  created_at: string;
  folder: string;
  tags: string[];
}

/**
 * Server-side read-only paginated listing of Cloudinary assets in this nursery's folder
 * for orphan detection and manual cleanup review.
 */
export async function listCloudinaryAssets(options: {
  folder?: string;
  maxResults?: number;
  nextCursor?: string;
} = {}): Promise<{ resources: CloudinaryListedAsset[]; next_cursor: string | null }> {
  ensureCloudinaryConfigured();

  const folder =
    (options.folder || CLOUDINARY_DEFAULT_FOLDER).replace(/[^a-zA-Z0-9_/-]/g, '') ||
    CLOUDINARY_DEFAULT_FOLDER;
  const maxResults = Math.min(100, Math.max(1, Number(options.maxResults) || 100));

  const apiResult: any = await cloudinary.api.resources({
    type: 'upload',
    resource_type: 'image',
    prefix: folder,
    max_results: maxResults,
    tags: true,
    ...(options.nextCursor ? { next_cursor: options.nextCursor } : {}),
  });

  const resources: CloudinaryListedAsset[] = Array.isArray(apiResult?.resources)
    ? apiResult.resources.map((item: any) => ({
        public_id: String(item.public_id || ''),
        url: String(item.secure_url || item.url || ''),
        format: String(item.format || ''),
        bytes: Number(item.bytes || 0),
        width: Number(item.width || 0),
        height: Number(item.height || 0),
        created_at: String(item.created_at || ''),
        folder: String(item.folder || ''),
        tags: Array.isArray(item.tags) ? item.tags.map(String) : [],
      }))
    : [];

  return {
    resources,
    next_cursor: apiResult?.next_cursor ? String(apiResult.next_cursor) : null,
  };
}

/**
 * Paginated full export of all Cloudinary assets in the nursery folder (up to 20 pages / 2000 images)
 * used exclusively by the Admin unified backup export.
 */
export async function listAllCloudinaryAssets(folder?: string): Promise<{
  resources: CloudinaryListedAsset[];
  totalCount: number;
  totalBytes: number;
  truncated: boolean;
}> {
  ensureCloudinaryConfigured();

  const allResources: CloudinaryListedAsset[] = [];
  let cursor: string | undefined = undefined;
  let pageCount = 0;
  const MAX_PAGES = 20;

  while (pageCount < MAX_PAGES) {
    pageCount += 1;
    const page = await listCloudinaryAssets({
      folder,
      maxResults: 100,
      nextCursor: cursor,
    });
    allResources.push(...page.resources);
    if (!page.next_cursor) {
      cursor = undefined;
      break;
    }
    cursor = page.next_cursor;
  }

  const totalBytes = allResources.reduce((sum, item) => sum + (Number(item.bytes) || 0), 0);
  return {
    resources: allResources,
    totalCount: allResources.length,
    totalBytes,
    truncated: Boolean(cursor),
  };
}
