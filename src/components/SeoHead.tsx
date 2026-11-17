import { useEffect, useState } from 'react';
import type { BrahmyamanPlant } from '../types/nursery';
import type { WindowViewKey } from './Header';

const SITE_ORIGIN = 'https://brahmyaman.store';
const OG_IMAGE = `${SITE_ORIGIN}/og.webp`;
const NURSERY_NAME_BN = 'ভ্রম্যমাণ নার্সারি';
const NURSERY_NAME_EN = 'Brahmyaman Nursery';

interface SeoHeadProps {
  lang: 'bn' | 'en';
  route: 'shop' | 'admin';
  view: WindowViewKey;
  plant: BrahmyamanPlant | null;
  unknownPath: boolean;
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

function pageCopy(props: SeoHeadProps, category: string | null): { title: string; description: string; canonical: string; robots: string } {
  const brand = props.lang === 'bn' ? NURSERY_NAME_BN : NURSERY_NAME_EN;
  if (props.route === 'admin') {
    return {
      title: `অ্যাডমিন · ${NURSERY_NAME_BN}`,
      description: 'ভ্রম্যমাণ নার্সারির অ্যাডমিন পাতা।',
      canonical: `${SITE_ORIGIN}/admin`,
      robots: 'noindex, nofollow',
    };
  }
  if (props.unknownPath) {
    return {
      title: `পাতা পাওয়া যায়নি · ${brand}`,
      description: 'এই ঠিকানায় ভ্রম্যমাণ নার্সারির কোনো পাতা নেই। ক্যাটালগে ফিরে চারা দেখুন।',
      canonical: `${SITE_ORIGIN}${window.location.pathname}`,
      robots: 'noindex, follow',
    };
  }
  if (props.plant) {
    const name = props.lang === 'bn' ? props.plant.nameBn : props.plant.nameEn;
    const raw = props.lang === 'bn' ? props.plant.descriptionBn : props.plant.descriptionEn;
    const description = (raw || `${name}, কালশুলি, বাঁকুড়া।`).replace(/\s+/g, ' ').slice(0, 160);
    return {
      title: `${name} · ${brand}`,
      description,
      canonical: `${SITE_ORIGIN}/?plant=${encodeURIComponent(props.plant.id)}`,
      robots: 'index, follow',
    };
  }
  const categoryCopy: Record<string, { bn: string; en: string; descBn: string; descEn: string }> = {
    fruit: {
      bn: 'ফলের গাছ ও কলম',
      en: 'Fruit grafts',
      descBn: 'আম, লেবু, পেয়ারা ও অন্যান্য ফলের কলম। কালশুলি, বাঁকুড়া।',
      descEn: 'Mango, lemon, guava and other fruit grafts from Kalsuli, Bankura.',
    },
    puja: {
      bn: 'পূজার ফুল ও বেলপাতা',
      en: 'Puja plants',
      descBn: 'রক্তজবা, তুলসী, বেল ও পূজার ফুলের চারা। কালশুলি, বাঁকুড়া।',
      descEn: 'Hibiscus, tulsi, bael and puja flowers from Kalsuli, Bankura.',
    },
    flower: {
      bn: 'ছাদ ও বারান্দার ফুল',
      en: 'Terrace flowers',
      descBn: 'গোলাপ, বাগানবিলাস ও ছাদের ফুলগাছ। কালশুলি, বাঁকুড়া।',
      descEn: 'Roses, bougainvillea and terrace flowers from Kalsuli, Bankura.',
    },
    foliage: {
      bn: 'শো-প্ল্যান্ট ও পাম',
      en: 'Foliage and palms',
      descBn: 'পাম, ক্রোটন ও শো-প্ল্যান্ট। কালশুলি, বাঁকুড়া।',
      descEn: 'Palms, crotons and foliage from Kalsuli, Bankura.',
    },
    herbal: {
      bn: 'মসলা ও ভেষজ',
      en: 'Herbs and spices',
      descBn: 'দারুচিনি, এলাচ ও ভেষজ চারা। কালশুলি, বাঁকুড়া।',
      descEn: 'Cinnamon, cardamom and herb saplings from Kalsuli, Bankura.',
    },
  };
  if (category && categoryCopy[category]) {
    const copy = categoryCopy[category];
    return {
      title: `${props.lang === 'bn' ? copy.bn : copy.en} · ${brand}`,
      description: props.lang === 'bn' ? copy.descBn : copy.descEn,
      canonical: `${SITE_ORIGIN}/?category=${category}`,
      robots: 'index, follow',
    };
  }
  const views: Record<WindowViewKey, { titleBn: string; titleEn: string; descBn: string; descEn: string }> = {
    catalog: {
      titleBn: `${NURSERY_NAME_BN} · কালশুলি, বাঁকুড়া`,
      titleEn: `${NURSERY_NAME_EN} · Kalsuli, Bankura`,
      descBn: 'কালশুলির পারিবারিক নার্সারি। ফলের কলম, পূজার ফুল ও ছাদবাগানের চারা। WhatsApp-এ অর্ডার।',
      descEn: 'Family nursery in Kalsuli, Bankura. Fruit grafts, puja flowers and terrace saplings. Order on WhatsApp.',
    },
    offers: {
      titleBn: `মরশুমি অফার · ${NURSERY_NAME_BN}`,
      titleEn: `Seasonal offers · ${NURSERY_NAME_EN}`,
      descBn: 'কালশুলি নার্সারির চলতি চারা ও দাম।',
      descEn: 'Current saplings and prices at the Kalsuli nursery.',
    },
    care: {
      titleBn: `গাছের যত্ন · ${NURSERY_NAME_BN}`,
      titleEn: `Plant care · ${NURSERY_NAME_EN}`,
      descBn: 'বাঁকুড়ার লাল মাটি ও রোদে চারা বাঁচিয়ে রাখার সহজ যত্ন।',
      descEn: 'Simple care for saplings in Bankura’s red soil and sun.',
    },
    reviews: {
      titleBn: `গ্রাহক রিভিউ · ${NURSERY_NAME_BN}`,
      titleEn: `Customer reviews · ${NURSERY_NAME_EN}`,
      descBn: 'অনুমোদিত গ্রাহক রিভিউ। নতুন মতামত WhatsApp-এ পাঠানো যায়।',
      descEn: 'Approved customer reviews. New notes can be sent on WhatsApp.',
    },
    location: {
      titleBn: `ঠিকানা ও সময় · ${NURSERY_NAME_BN}`,
      titleEn: `Location and hours · ${NURSERY_NAME_EN}`,
      descBn: 'কালশুলি, বাঁকুড়া ৭২২১৬০। প্রতিদিন সকাল ৬:৩০ থেকে সন্ধ্যা ৬:৩০।',
      descEn: 'Kalsuli, Bankura 722160. Open daily 6:30 to 18:30.',
    },
  };
  const copy = views[props.view] || views.catalog;
  const canonical =
    props.view === 'catalog' ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}/?view=${props.view}`;
  return {
    title: props.lang === 'bn' ? copy.titleBn : copy.titleEn,
    description: props.lang === 'bn' ? copy.descBn : copy.descEn,
    canonical,
    robots: 'index, follow',
  };
}

export function SeoHead(props: SeoHeadProps) {
  const [routeTick, setRouteTick] = useState(0);

  useEffect(() => {
    const bump = () => setRouteTick((value) => value + 1);
    window.addEventListener('popstate', bump);
    window.addEventListener('brahmyaman-route', bump);
    return () => {
      window.removeEventListener('popstate', bump);
      window.removeEventListener('brahmyaman-route', bump);
    };
  }, []);

  useEffect(() => {
    const category = new URLSearchParams(window.location.search).get('category');
    const copy = pageCopy(props, category);
    document.title = copy.title;
    upsertMeta('name', 'description', copy.description);
    upsertMeta('name', 'robots', copy.robots);
    upsertMeta('property', 'og:title', copy.title);
    upsertMeta('property', 'og:description', copy.description);
    upsertMeta('property', 'og:type', 'website');
    upsertMeta('property', 'og:url', copy.canonical);
    upsertMeta('property', 'og:image', OG_IMAGE);
    upsertMeta('property', 'og:locale', props.lang === 'bn' ? 'bn_IN' : 'en_IN');
    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', copy.title);
    upsertMeta('name', 'twitter:description', copy.description);
    upsertMeta('name', 'twitter:image', OG_IMAGE);
    upsertLink('canonical', copy.canonical);
    document.documentElement.lang = props.lang;
  }, [props, routeTick]);

  return null;
}
