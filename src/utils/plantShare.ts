import { BrahmyamanPlant, PlantPotOption } from '../types/nursery';

const DEFAULT_NURSERY_SHARE_INFO = {
  nameBn: 'ব্রাহ্ম্যমাণ নার্সারি',
  nameEn: 'Brahmyaman Nursery',
  addressBn: 'কালশুলি, বাঁকুড়া, ৭২২১৬০',
  addressEn: 'Kalsuli, Bankura, 722160',
  phone: '+918609417672',
};

export interface PlantSharePayloadInput {
  plant: BrahmyamanPlant;
  selectedOption?: PlantPotOption;
  photoUrl?: string;
  lang?: 'bn' | 'en';
  origin?: string;
  nurseryNameBn?: string;
  nurseryNameEn?: string;
  nurseryAddressBn?: string;
  nurseryAddressEn?: string;
  nurseryPhone?: string;
}

export interface WebShareOutcome {
  ok: boolean;
  method?: 'native-file' | 'native-text';
  cancelled?: boolean;
  fallbackRequired?: boolean;
  messageBn?: string;
}

/**
 * Resolves a public HTTP/HTTPS photo URL suitable for putting inside a WhatsApp text message.
 * Never embeds giant `data:image/...;base64,...` strings into `wa.me/?text=` URLs.
 */
export function resolveShareableImageUrl(
  rawImageUrl: string | undefined | null,
  origin?: string
): string | null {
  const trimmed = (rawImageUrl || '').trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return null;
  }
  if (trimmed.startsWith('/') && origin && /^https?:\/\//i.test(origin)) {
    return `${origin.replace(/\/+$/, '')}${trimmed}`;
  }
  return null;
}

/**
 * Builds the canonical deep link URL for opening this specific plant directly.
 */
export function buildPlantShareUrl(plantId: string, origin?: string): string | null {
  const cleanId = (plantId || '').trim();
  const cleanOrigin = (origin || '').trim().replace(/\/+$/, '');
  if (!cleanId || !/^https?:\/\//i.test(cleanOrigin)) return null;
  return `${cleanOrigin}/?plant=${encodeURIComponent(cleanId)}`;
}

/**
 * Formats complete product details + photo URL + direct page link for WhatsApp or Web Share.
 */
export function buildPlantShareText(input: PlantSharePayloadInput): {
  title: string;
  text: string;
  shareUrl: string | null;
  publicPhotoUrl: string | null;
} {
  const { plant, selectedOption, photoUrl, lang = 'bn', origin } = input;
  const option = selectedOption ||
    plant.options[0] || {
      id: 'opt-def',
      labelBn: 'পলি গ্রো-ব্যাগ চারা',
      labelEn: 'Polybag Sapling',
      price: 50,
      containerType: 'পলি গ্রো ব্যাগ',
    };

  const shareUrl = buildPlantShareUrl(plant.id, origin);
  const publicPhotoUrl = resolveShareableImageUrl(photoUrl || plant.image, origin);

  const nurseryNameBn = input.nurseryNameBn || DEFAULT_NURSERY_SHARE_INFO.nameBn;
  const nurseryNameEn = input.nurseryNameEn || DEFAULT_NURSERY_SHARE_INFO.nameEn;
  const nurseryAddressBn = input.nurseryAddressBn || DEFAULT_NURSERY_SHARE_INFO.addressBn;
  const nurseryAddressEn = input.nurseryAddressEn || DEFAULT_NURSERY_SHARE_INFO.addressEn;
  const nurseryPhone = input.nurseryPhone || DEFAULT_NURSERY_SHARE_INFO.phone;

  const title =
    lang === 'bn'
      ? `${plant.nameBn} (₹${option.price}) — ${nurseryNameBn}`
      : `${plant.nameEn} (₹${option.price}) — ${nurseryNameEn}`;

  const lines: string[] = [];

  if (lang === 'bn') {
    lines.push(`🌿 *${plant.nameBn}* (${plant.nameEn})`);
    if (plant.botanicalName) {
      lines.push(`বোটানিক্যাল নাম: _${plant.botanicalName}_`);
    }
    lines.push(`বিভাগ: ${plant.category}`);
    lines.push(
      `দাম: *₹${option.price}* (${option.labelBn} · ${option.containerType})`
    );
    lines.push(
      `স্টক: ${plant.inStock !== false ? '✅ স্টকে আছে' : '⏳ স্টক শেষ (নার্সারিতে জিজ্ঞাসা করুন)'}`
    );
    if (plant.descriptionBn) {
      const shortDesc =
        plant.descriptionBn.length > 180
          ? `${plant.descriptionBn.slice(0, 177).trim()}...`
          : plant.descriptionBn;
      lines.push('');
      lines.push(`বিবরণ: ${shortDesc}`);
    }
    if (plant.sunlightBn || plant.wateringBn) {
      lines.push(
        `যত্ন: ☀️ ${plant.sunlightBn || 'স্বাভাবিক রোদ'} | 💧 ${plant.wateringBn || 'নিয়মিত জল'}`
      );
    }
    lines.push('');
    lines.push(`🏡 ${nurseryNameBn} — ${nurseryAddressBn}`);
    lines.push(`📞 যোগাযোগ/WhatsApp: ${nurseryPhone}`);
    if (shareUrl) {
      lines.push(`🔗 চারাটি দেখুন: ${shareUrl}`);
    }
    if (publicPhotoUrl) {
      lines.push(`📸 চারার ছবি: ${publicPhotoUrl}`);
    }
  } else {
    lines.push(`🌿 *${plant.nameEn}* (${plant.nameBn})`);
    if (plant.botanicalName) {
      lines.push(`Botanical: _${plant.botanicalName}_`);
    }
    lines.push(`Category: ${plant.category}`);
    lines.push(`Price: *₹${option.price}* (${option.labelEn} · ${option.containerType})`);
    lines.push(`Availability: ${plant.inStock !== false ? 'In Stock' : 'Ask for availability'}`);
    if (plant.descriptionEn) {
      const shortDesc =
        plant.descriptionEn.length > 180
          ? `${plant.descriptionEn.slice(0, 177).trim()}...`
          : plant.descriptionEn;
      lines.push('');
      lines.push(shortDesc);
    }
    lines.push('');
    lines.push(`🏡 ${nurseryNameEn} — ${nurseryAddressEn}`);
    lines.push(`📞 Contact/WhatsApp: ${nurseryPhone}`);
    if (shareUrl) {
      lines.push(`🔗 View Plant: ${shareUrl}`);
    }
    if (publicPhotoUrl) {
      lines.push(`📸 Photo: ${publicPhotoUrl}`);
    }
  }

  return {
    title,
    text: lines.join('\n'),
    shareUrl,
    publicPhotoUrl,
  };
}

/**
 * Generates a universal WhatsApp share link (`https://wa.me/?text=...`) with no hardcoded recipient,
 * allowing the user to pick any WhatsApp contact, family member, or group to send the plant photo & details to.
 */
export function buildWhatsAppShareUrl(shareText: string): string {
  return `https://wa.me/?text=${encodeURIComponent(shareText)}`;
}

function extensionForMime(mime: string): string {
  const lower = (mime || '').toLowerCase();
  if (lower.includes('png')) return 'png';
  if (lower.includes('webp')) return 'webp';
  return 'jpg';
}

function sanitizeFileSlug(raw: string): string {
  const clean = (raw || '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return clean || 'brahmyaman-plant';
}

/**
 * Fetches or decodes the currently viewed photo into a `File` for Web Share API Level 2 (native photo attachment).
 * Fails safely and returns `null` if CORS or offline restrictions prevent reading image bytes.
 */
export async function fetchImageAsShareFile(
  imageSrc: string,
  slugSource: string,
  fetchFn: typeof fetch = fetch
): Promise<File | null> {
  if (!imageSrc || typeof File === 'undefined') return null;

  try {
    const res = await fetchFn(imageSrc, {
      mode: imageSrc.startsWith('data:') || imageSrc.startsWith('blob:') ? 'same-origin' : 'cors',
    });
    if (!res.ok) return null;
    const blob = await res.blob();
    if (!blob || blob.size === 0) return null;
    const mime = blob.type && blob.type.startsWith('image/') ? blob.type : 'image/jpeg';
    const ext = extensionForMime(mime);
    const filename = `${sanitizeFileSlug(slugSource)}.${ext}`;
    return new File([blob], filename, { type: mime });
  } catch {
    return null;
  }
}

/**
 * Shares both the actual plant photo file (when Web Share Level 2 file sharing is supported)
 * and the formatted product details via the device's native share sheet (which includes WhatsApp).
 */
export async function sharePlantViaWebShare(params: {
  plant: BrahmyamanPlant;
  selectedOption?: PlantPotOption;
  photoUrl: string;
  lang?: 'bn' | 'en';
  origin?: string;
  navigatorObj?: {
    share?: (data: ShareData) => Promise<void>;
    canShare?: (data: ShareData) => boolean;
  };
  fetchFn?: typeof fetch;
}): Promise<WebShareOutcome> {
  const nav =
    params.navigatorObj ??
    (typeof navigator !== 'undefined' ? (navigator as any) : undefined);

  if (!nav || typeof nav.share !== 'function') {
    return { ok: false, fallbackRequired: true };
  }

  const { title, text, shareUrl } = buildPlantShareText({
    plant: params.plant,
    selectedOption: params.selectedOption,
    photoUrl: params.photoUrl,
    lang: params.lang,
    origin: params.origin,
  });

  // 1. Try attaching the actual image File so WhatsApp / mobile apps receive Photo + Caption together
  if (typeof nav.canShare === 'function' && params.photoUrl) {
    const file = await fetchImageAsShareFile(
      params.photoUrl,
      params.plant.nameEn || params.plant.id,
      params.fetchFn
    );
    if (file) {
      const fileShareData: ShareData = {
        files: [file],
        title,
        text,
        ...(shareUrl ? { url: shareUrl } : {}),
      };
      try {
        if (nav.canShare(fileShareData)) {
          await nav.share(fileShareData);
          return {
            ok: true,
            method: 'native-file',
            messageBn: 'ছবি ও বিস্তারিত তথ্য শেয়ার করা হয়েছে!',
          };
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          return { ok: false, cancelled: true };
        }
        // Fall through to text + URL share
      }
    }
  }

  // 2. Fallback to native text + URL share
  try {
    await nav.share({
      title,
      text,
      ...(shareUrl ? { url: shareUrl } : {}),
    });
    return {
      ok: true,
      method: 'native-text',
      messageBn: 'গাছের বিবরণ ও লিংক শেয়ার করা হয়েছে!',
    };
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return { ok: false, cancelled: true };
    }
    return { ok: false, fallbackRequired: true };
  }
}

export async function copyShareText(value: string): Promise<boolean> {
  if (!value) return false;
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // Fall through to execCommand fallback
  }
  try {
    if (typeof document !== 'undefined') {
      const textarea = document.createElement('textarea');
      textarea.value = value;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(textarea);
      return ok;
    }
  } catch {
    return false;
  }
  return false;
}

export async function downloadPlantPhoto(
  imageSrc: string,
  slugSource: string
): Promise<boolean> {
  if (!imageSrc || typeof document === 'undefined') return false;
  try {
    const file = await fetchImageAsShareFile(imageSrc, slugSource);
    if (file) {
      const blobUrl = URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 2500);
      return true;
    }
    // Same-origin or data fallback anchor
    const a = document.createElement('a');
    a.href = imageSrc;
    a.download = `${sanitizeFileSlug(slugSource)}.jpg`;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return true;
  } catch {
    return false;
  }
}
