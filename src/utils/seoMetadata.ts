import type { BrahmyamanPlant } from '../types/nursery';
import type { WindowViewKey } from '../components/Header';
import { resolvePlantImageUrl } from './imageUrl';

const NURSERY_PHONE = '+91 86094 17672';

export interface ResolvedSeoMetadata {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  ogType: 'website' | 'product';
  ogImage: string;
  canonicalUrl: string;
  robots: string;
  productJsonLd: Record<string, unknown> | null;
}

const DEFAULT_OG_IMAGE_PATH = '/og-nursery.webp';

function toAbsoluteUrl(rawUrl: string, origin: string): string {
  const cleanOrigin = origin.replace(/\/+$/, '');
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) return `${cleanOrigin}${DEFAULT_OG_IMAGE_PATH}`;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('data:')) return `${cleanOrigin}${DEFAULT_OG_IMAGE_PATH}`;
  if (trimmed.startsWith('/')) return `${cleanOrigin}${trimmed}`;
  return `${cleanOrigin}/${trimmed}`;
}

export function buildSeoMetaForState(params: {
  currentRoute: 'shop' | 'admin' | 'not_found';
  activeWindow: WindowViewKey;
  selectedPlant: BrahmyamanPlant | null;
  lang: 'bn' | 'en';
  origin: string;
}): ResolvedSeoMetadata {
  const origin = (params.origin || '').replace(/\/+$/, '');
  const defaultOgImage = `${origin}${DEFAULT_OG_IMAGE_PATH}`;

  if (params.currentRoute === 'admin') {
    const title = 'অ্যাডমিন প্যানেল — ভ্রাম্যমাণ নার্সারি';
    const description =
      'ভ্রাম্যমাণ নার্সারির গাছের স্টক, দাম, ছবি ও গ্রাহক রিভিউ পরিচালনার সুরক্ষিত অ্যাডমিন প্যানেল।';
    return {
      title,
      description,
      ogTitle: title,
      ogDescription: description,
      ogType: 'website',
      ogImage: defaultOgImage,
      canonicalUrl: `${origin}/admin`,
      robots: 'noindex, nofollow',
      productJsonLd: null,
    };
  }

  if (params.currentRoute === 'not_found') {
    const title =
      params.lang === 'bn'
        ? '৪০৪ · পাতাটি পাওয়া যায়নি — ভ্রাম্যমাণ নার্সারি'
        : '404 · Page Not Found — Brahmyaman Nursery';
    const description =
      params.lang === 'bn'
        ? 'দুঃখিত, আপনি যে চারাগাছ বা পাতাটি খুঁজছেন তা পাওয়া যায়নি। কালশুলি নার্সারির মূল ক্যাটালগে ফিরে যান।'
        : 'The requested page or sapling listing was not found at Brahmyaman Nursery, Bankura.';
    return {
      title,
      description,
      ogTitle: title,
      ogDescription: description,
      ogType: 'website',
      ogImage: defaultOgImage,
      canonicalUrl: `${origin}/`,
      robots: 'noindex, nofollow',
      productJsonLd: null,
    };
  }

  if (params.selectedPlant) {
    const p = params.selectedPlant;
    const minPrice = p.options.length > 0 ? Math.min(...p.options.map((o) => o.price)) : 50;
    const maxPrice = p.options.length > 0 ? Math.max(...p.options.map((o) => o.price)) : minPrice;
    const resolvedImg = resolvePlantImageUrl(p.image, DEFAULT_OG_IMAGE_PATH);
    const ogImage = toAbsoluteUrl(resolvedImg, origin);
    const canonicalUrl = `${origin}/?plant=${encodeURIComponent(p.id)}`;
    const title =
      params.lang === 'bn'
        ? `${p.nameBn} (${p.nameEn}) · ₹${minPrice} — ভ্রাম্যমাণ নার্সারি`
        : `${p.nameEn} (${p.nameBn}) · ₹${minPrice} — Brahmyaman Nursery`;
    const descriptionSource = (params.lang === 'bn' ? p.descriptionBn : p.descriptionEn) || p.descriptionBn;
    const shortDesc =
      descriptionSource.replace(/\s+/g, ' ').trim().slice(0, 148) ||
      `${p.nameBn} (${p.nameEn}) সতেজ চারা — ₹${minPrice} থেকে শুরু। ভ্রাম্যমাণ নার্সারি, কালশুলি, বাঁকুড়া।`;

    const productJsonLd: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: `${p.nameBn} (${p.nameEn})`,
      description: shortDesc,
      image: ogImage,
      sku: p.id,
      category: p.category,
      brand: {
        '@type': 'Brand',
        name: 'ভ্রাম্যমাণ নার্সারি — Brahmyaman Nursery',
      },
      offers: {
        '@type': minPrice === maxPrice ? 'Offer' : 'AggregateOffer',
        priceCurrency: 'INR',
        ...(minPrice === maxPrice
          ? { price: minPrice }
          : { lowPrice: minPrice, highPrice: maxPrice, offerCount: p.options.length }),
        availability:
          p.inStock === false
            ? 'https://schema.org/OutOfStock'
            : 'https://schema.org/InStock',
        url: canonicalUrl,
        seller: {
          '@type': 'GardenStore',
          name: 'ভ্রাম্যমাণ নার্সারি (Brahmyaman Nursery)',
          telephone: NURSERY_PHONE,
        },
      },
    };

    return {
      title,
      description: shortDesc,
      ogTitle: title,
      ogDescription: shortDesc,
      ogType: 'product',
      ogImage,
      canonicalUrl,
      robots: 'index, follow',
      productJsonLd,
    };
  }

  const windowMetaMap: Record<WindowViewKey, { titleBn: string; titleEn: string; descBn: string; descEn: string; path: string }> = {
    catalog: {
      titleBn: 'ভ্রাম্যমাণ নার্সারি — Brahmyaman Nursery | কালশুলি, বাঁকুড়া',
      titleEn: 'Brahmyaman Nursery (ভ্রাম্যমাণ নার্সারি) | Kalsuli, Bankura',
      descBn:
        'পারিবারিক নার্সারি, কালশুলি · বাঁকুড়া, ৭২২১৬০, WhatsApp-এ সরাসরি অর্ডার, ন্যায্য দাম। ফলের কলম, পূজার ফুল ও ছাদবাগানের সতেজ চারা।',
      descEn:
        'Family-run nursery in Kalsuli, Bankura (722160). Grafted fruit saplings, puja flowers, medicinal & terrace plants via WhatsApp.',
      path: '/',
    },
    offers: {
      titleBn: 'মরশুমি অফার ও সেরা ছাড় — ভ্রাম্যমাণ নার্সারি | কালশুলি, বাঁকুড়া',
      titleEn: 'Seasonal Nursery Offers & Best Buys — Brahmyaman Nursery',
      descBn:
        'চলতি মাসের সেরা ফলের কলম, কম্বো প্যাকেজ ও সাশ্রয়ী মূল্যের চারাগাছ — ভ্রাম্যমাণ নার্সারি, কালশুলি, বাঁকুড়া।',
      descEn:
        'Monthly best-buy grafted saplings and seasonal nursery deals from Brahmyaman Nursery, Kalsuli, Bankura.',
      path: '/?view=offers',
    },
    care: {
      titleBn: 'গাছ পরিচর্যা ও মাটি তৈরির নিয়ম — ভ্রাম্যমাণ নার্সারি | বাঁকুড়া',
      titleEn: 'Plant Care & Bankura Soil Guide — Brahmyaman Nursery',
      descBn:
        'বাঁকুড়ার রোদ ও লাল মাটিতে ফলের কলম ও ফুলের গাছ সুস্থ রাখার বাস্তব মাটি মিশ্রণ, জল ও জৈব সার নির্দেশিকা।',
      descEn:
        'Practical potting soil mix, seasonal watering, and organic care guide tailored for Bankura and Bengal gardens.',
      path: '/?view=care',
    },
    reviews: {
      titleBn: 'গ্রাহক রিভিউ ও বাগানের ছবি — ভ্রাম্যমাণ নার্সারি | বাঁকুড়া',
      titleEn: 'Customer Reviews & Garden Photos — Brahmyaman Nursery',
      descBn:
        'কালশুলি, পারসোলা, খাতড়া ও সিমলাপালের উদ্যানপ্রেমী গ্রাহকদের বাস্তব রিভিউ ও চারাগাছের ফলাফল দেখুন।',
      descEn:
        'Verified customer reviews and real garden results across Kalsuli, Parsola, Khatra, and Simlapal in Bankura.',
      path: '/?view=reviews',
    },
    location: {
      titleBn: 'নার্সারির ঠিকানা, সময় ও রুট ডেলিভারি — ভ্রাম্যমাণ নার্সারি | বাঁকুড়া',
      titleEn: 'Visit Kalsuli Nursery & Opening Hours — Brahmyaman Nursery',
      descBn:
        'কালশুলি, লক্ষ্মীসাগর, বাঁকুড়া ৭২২১৬০। প্রতিদিন সকাল ৬:৩০ থেকে সন্ধ্যা ৬:৩০ খোলা। কল বা WhatsApp করুন +91 86094 17672।',
      descEn:
        'Visit Brahmyaman Nursery at Kalsuli, Lakshmisagar, Bankura 722160. Open daily 6:30 AM to 6:30 PM.',
      path: '/?view=location',
    },
  };

  const wMeta = windowMetaMap[params.activeWindow] || windowMetaMap.catalog;
  const title = params.lang === 'bn' ? wMeta.titleBn : wMeta.titleEn;
  const description = params.lang === 'bn' ? wMeta.descBn : wMeta.descEn;

  return {
    title,
    description,
    ogTitle: title,
    ogDescription: description,
    ogType: 'website',
    ogImage: defaultOgImage,
    canonicalUrl: `${origin}${wMeta.path}`,
    robots: 'index, follow',
    productJsonLd: null,
  };
}

function setMetaByName(name: string, content: string): void {
  if (typeof document === 'undefined') return;
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setMetaByProperty(property: string, content: string): void {
  if (typeof document === 'undefined') return;
  let el = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function applySeoMetadataToDocument(meta: ResolvedSeoMetadata, lang: 'bn' | 'en'): void {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = lang === 'en' ? 'en' : 'bn';
  document.title = meta.title;

  setMetaByName('description', meta.description);
  setMetaByName('robots', meta.robots);
  setMetaByName('twitter:title', meta.ogTitle);
  setMetaByName('twitter:description', meta.ogDescription);
  setMetaByName('twitter:image', meta.ogImage);

  setMetaByProperty('og:type', meta.ogType);
  setMetaByProperty('og:title', meta.ogTitle);
  setMetaByProperty('og:description', meta.ogDescription);
  setMetaByProperty('og:image', meta.ogImage);
  setMetaByProperty('og:url', meta.canonicalUrl);

  let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', meta.canonicalUrl);

  const ldId = 'dynamic-product-jsonld';
  const existingLd = document.getElementById(ldId);
  if (meta.productJsonLd) {
    const scriptEl = existingLd || document.createElement('script');
    scriptEl.id = ldId;
    scriptEl.setAttribute('type', 'application/ld+json');
    scriptEl.textContent = JSON.stringify(meta.productJsonLd);
    if (!existingLd) {
      document.head.appendChild(scriptEl);
    }
  } else if (existingLd) {
    existingLd.remove();
  }
}
