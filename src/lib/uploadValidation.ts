export const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/heic',
  'image/heif',
]);

export interface ValidatedUploadPayload {
  ok: boolean;
  kind?: 'data_uri' | 'https_url';
  mime?: string;
  detectedFormat?: 'jpeg' | 'png' | 'webp' | 'gif' | 'avif' | 'heic' | 'external_https';
  byteLength?: number;
  code?: 'MISSING_IMAGE' | 'INVALID_FILE_TYPE' | 'PAYLOAD_TOO_LARGE' | 'INVALID_IMAGE_URL';
  error?: string;
}

const MAX_SERVER_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB decoded binary limit

function isPrivateOrLocalHostname(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (
    lower === 'localhost' ||
    lower === '127.0.0.1' ||
    lower === '0.0.0.0' ||
    lower === '::1' ||
    lower.endsWith('.local') ||
    lower.endsWith('.internal')
  ) {
    return true;
  }
  if (/^10\./.test(lower) || /^192\.168\./.test(lower) || /^169\.254\./.test(lower)) {
    return true;
  }
  const m172 = lower.match(/^172\.(\d+)\./);
  if (m172) {
    const second = Number(m172[1]);
    if (second >= 16 && second <= 31) return true;
  }
  return false;
}

export function detectImageMagicFormat(
  bytes: Uint8Array
): 'jpeg' | 'png' | 'webp' | 'gif' | 'avif' | 'heic' | null {
  if (!bytes || bytes.length < 12) return null;

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'jpeg';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return 'png';
  }

  // WEBP: "RIFF" .... "WEBP"
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return 'webp';
  }

  // GIF: GIF87a or GIF89a
  if (
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38 &&
    (bytes[4] === 0x37 || bytes[4] === 0x39) &&
    bytes[5] === 0x61
  ) {
    return 'gif';
  }

  // ISO Base Media File Format (AVIF / HEIC / HEIF): .... "ftyp" brand
  if (
    bytes[4] === 0x66 &&
    bytes[5] === 0x74 &&
    bytes[6] === 0x79 &&
    bytes[7] === 0x70
  ) {
    const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]).toLowerCase();
    if (brand === 'avif' || brand === 'avis') return 'avif';
    if (
      brand === 'heic' ||
      brand === 'heix' ||
      brand === 'hevc' ||
      brand === 'hevx' ||
      brand === 'mif1' ||
      brand === 'msf1'
    ) {
      return 'heic';
    }
  }

  return null;
}

/**
 * Strictly validates an image payload (base64 data URI with verified image magic bytes,
 * OR public HTTPS image URL) before uploading to Cloudinary or storing in Firestore.
 * Blocks SVG/HTML/XML scripts, non-image payloads, and SSRF URLs.
 */
export function validateUploadImagePayload(
  image: unknown,
  maxDecodedBytes = MAX_SERVER_IMAGE_BYTES
): ValidatedUploadPayload {
  if (!image || typeof image !== 'string' || !image.trim()) {
    return {
      ok: false,
      code: 'MISSING_IMAGE',
      error: 'ছবির ডাটা (image) পাওয়া যায়নি।',
    };
  }

  const trimmed = image.trim();

  if (trimmed.startsWith('data:')) {
    const match = trimmed.match(/^data:([^;,]+);base64,([A-Za-z0-9+/=\r\n]+)$/);
    if (!match) {
      return {
        ok: false,
        code: 'INVALID_FILE_TYPE',
        error: 'অবৈধ ছবির ডাটা ফরম্যাট। শুধুমাত্র বৈধ JPEG, PNG বা WebP ছবি আপলোড করুন।',
      };
    }

    const mime = match[1].trim().toLowerCase();
    if (!ALLOWED_IMAGE_MIME_TYPES.has(mime)) {
      return {
        ok: false,
        code: 'INVALID_FILE_TYPE',
        error: `অননুমোদিত ফাইল টাইপ (${mime})। শুধুমাত্র JPG, PNG, WebP, GIF, AVIF বা HEIC ছবি গ্রহণযোগ্য।`,
      };
    }

    const cleanB64 = match[2].replace(/[\r\n\s]+/g, '');
    const buf = Buffer.from(cleanB64, 'base64');
    if (buf.length < 12) {
      return {
        ok: false,
        code: 'INVALID_FILE_TYPE',
        error: 'ফাইলটি অসম্পূর্ণ বা বৈধ ছবি নয়।',
      };
    }

    if (buf.length > maxDecodedBytes) {
      return {
        ok: false,
        code: 'PAYLOAD_TOO_LARGE',
        error: `ছবির আকার অনুমোদিত সীমার (${Math.round(maxDecodedBytes / (1024 * 1024))} MB) চেয়ে বেশি।`,
      };
    }

    const detected = detectImageMagicFormat(buf);
    if (!detected) {
      return {
        ok: false,
        code: 'INVALID_FILE_TYPE',
        error: 'ফাইলের ভেতরের ডাটা বৈধ ছবির (JPEG/PNG/WebP) সাথে মিলছে না।',
      };
    }

    return {
      ok: true,
      kind: 'data_uri',
      mime,
      detectedFormat: detected,
      byteLength: buf.length,
    };
  }

  if (trimmed.startsWith('https://')) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== 'https:' || !parsed.hostname || isPrivateOrLocalHostname(parsed.hostname)) {
        return {
          ok: false,
          code: 'INVALID_IMAGE_URL',
          error: 'অবৈধ বা অনিরাপদ ছবির HTTPS URL।',
        };
      }
      return {
        ok: true,
        kind: 'https_url',
        detectedFormat: 'external_https',
        byteLength: trimmed.length,
      };
    } catch {
      return {
        ok: false,
        code: 'INVALID_IMAGE_URL',
        error: 'অবৈধ ছবির HTTPS URL।',
      };
    }
  }

  return {
    ok: false,
    code: 'INVALID_FILE_TYPE',
    error: 'অবৈধ ছবির ফরম্যাট। শুধুমাত্র JPG, PNG, WebP ছবি বা বৈধ HTTPS লিঙ্ক দিন।',
  };
}
