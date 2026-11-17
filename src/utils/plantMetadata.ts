import type { BrahmyamanPlant, PlantPotOption } from '../types/nursery';

export interface PlantGrowthMetadata {
  sizeAgeBn: string;
  sizeAgeEn: string;
  harvestOrBloomBn: string;
  harvestOrBloomEn: string;
}

const SPECIFIC_PLANT_GROWTH: Record<string, PlantGrowthMetadata> = {
  'brahmyaman-amrapali-mango': {
    sizeAgeBn: '১.৫–২ ফুট · ৮–১২ মাস বয়সী কলম',
    sizeAgeEn: '1.5–2 ft · 8–12 mo grafted',
    harvestOrBloomBn: 'ফলন: ১২–১৮ মাসে (প্রথম মুকুল ১ম বছরেই)',
    harvestOrBloomEn: 'Fruits in 12–18 months',
  },
  'brahmyaman-dalim-pomegranate': {
    sizeAgeBn: '১.৫ ফুট · ৬–৮ মাস বয়সী কলম',
    sizeAgeEn: '1.5 ft · 6–8 mo sapling',
    harvestOrBloomBn: 'ফলন: ৮–১২ মাসে (সারা বছর ফুল-ফল)',
    harvestOrBloomEn: 'Fruits in 8–12 months',
  },
  'ashoke-2': {
    sizeAgeBn: '১.৫–২ ফুট · ৬–৮ মাস কলম চারা',
    sizeAgeEn: '1.5–2 ft · 6–8 mo graft',
    harvestOrBloomBn: 'ফলন: ৯০–১২০ দিনে ফুল ও লেবু',
    harvestOrBloomEn: 'Fruiting in 90–120 days',
  },
  'ashoke-3': {
    sizeAgeBn: '১.৫–২ ফুট · ৮ মাস গ্রাফটেড কলম',
    sizeAgeEn: '1.5–2 ft · 8 mo grafted',
    harvestOrBloomBn: 'ফলন: ৮–১০ মাসে মিষ্টি থাই পেয়ারা',
    harvestOrBloomEn: 'Fruits in 8–10 months',
  },
  'ashoke-73': {
    sizeAgeBn: '১–১.৫ ফুট · ৩–৪ মাস টিস্যু-কালচার',
    sizeAgeEn: '1–1.5 ft · 3–4 mo tissue-culture',
    harvestOrBloomBn: 'ফলন: ৭–৯ মাসে কাঁদি বেরোয়',
    harvestOrBloomEn: 'Fruits in 7–9 months',
  },
  'ashoke-74': {
    sizeAgeBn: '১.২–১.৫ ফুট · ৪ মাস সুস্থ শিকড়',
    sizeAgeEn: '1.2–1.5 ft · 4 mo established',
    harvestOrBloomBn: 'ফলন: ৮–১০ মাসে বামন গাছেই কলা',
    harvestOrBloomEn: 'Fruits in 8–10 months',
  },
  'ashoke-69': {
    sizeAgeBn: '১.৫–২ ফুট · ৮–১০ মাস কলম চারা',
    sizeAgeEn: '1.5–2 ft · 8–10 mo graft',
    harvestOrBloomBn: 'ফলন: ১৮–২৪ মাসে বড় থোকা জাম',
    harvestOrBloomEn: 'Fruits in 18–24 months',
  },
  'ashoke-62': {
    sizeAgeBn: '১.৫–২ ফুট · ৯–১২ মাস কলম চারা',
    sizeAgeEn: '1.5–2 ft · 9–12 mo graft',
    harvestOrBloomBn: 'ফলন: ২.৫–৩ বছরে গোলাপি কাঁঠাল',
    harvestOrBloomEn: 'Fruits in 2.5–3 years',
  },
  'ashoke-63': {
    sizeAgeBn: '৮–১০ ইঞ্চি · ৪৫–৬০ দিন চারা',
    sizeAgeEn: '8–10 in · 45–60 day sapling',
    harvestOrBloomBn: 'ফলন: ৫–৬ মাসে গাছ ভরে পেঁপে',
    harvestOrBloomEn: 'Fruits in 5–6 months',
  },
  'ashoke-51': {
    sizeAgeBn: '১.৫–২ ফুট · ৮ মাস গুটি কলম',
    sizeAgeEn: '1.5–2 ft · 8 mo air-layer',
    harvestOrBloomBn: 'ফলন: ১২–১৮ মাসে বাতাবি লেবু',
    harvestOrBloomEn: 'Fruits in 12–18 months',
  },
  'ashoke-77': {
    sizeAgeBn: '২.৫–৩ ফুট · ১২ মাস পরিপুষ্ট চারা',
    sizeAgeEn: '2.5–3 ft · 12 mo sapling',
    harvestOrBloomBn: 'ফলন: ৩–৪ বছরে বামন গাছে ডাব',
    harvestOrBloomEn: 'Fruits in 3–4 years',
  },
  'ashoke-30': {
    sizeAgeBn: '১–১.২ ফুট · ৫ মাস ঝোপালো চারা',
    sizeAgeEn: '1–1.2 ft · 5 mo clump',
    harvestOrBloomBn: 'ফলন: ১৮–২৪ মাসে বড় এলাচ',
    harvestOrBloomEn: 'Harvests in 18–24 months',
  },
  'ashoke-11': {
    sizeAgeBn: '৫–৬ ইঞ্চি · ২৫–৩০ দিন চারা',
    sizeAgeEn: '5–6 in · 25–30 day seedling',
    harvestOrBloomBn: 'ফলন: ৫৫–৭০ দিনে পাকা টমেটো',
    harvestOrBloomEn: 'Fruits in 55–70 days',
  },
  'ashoke-17': {
    sizeAgeBn: 'কন্দ ও ১–২টি ভাসমান পাতা',
    sizeAgeEn: 'Active tuber with 1–2 leaves',
    harvestOrBloomBn: 'ফুল ফোটা: ৪৫–৬০ দিনে কুঁড়ি আসে',
    harvestOrBloomEn: 'Blooms in 45–60 days',
  },
  'ashoke-52': {
    sizeAgeBn: '৭–৯ ইঞ্চি · মোটা কডেক্স (৮ মাস)',
    sizeAgeEn: '7–9 in · 8 mo caudex',
    harvestOrBloomBn: 'ফুল ফোটা: ৩০–৪৫ দিনে রোদে ফুল',
    harvestOrBloomEn: 'Blooms in 30–45 days',
  },
  'ashoke-66': {
    sizeAgeBn: '১.৫–২ ফুট · ১ বছর বয়সী পাম',
    sizeAgeEn: '1.5–2 ft · 1 yr clump',
    harvestOrBloomBn: 'বৃদ্ধি: সারা বছর চিরসবুজ ইনডোর পাম',
    harvestOrBloomEn: 'Evergreen indoor foliage',
  },
  'ashoke-65': {
    sizeAgeBn: '৮–১০ ইঞ্চি · ৩-স্তরের প্রস্তুত ক্যান',
    sizeAgeEn: '8–10 in · 3-tier arrangement',
    harvestOrBloomBn: 'যত্ন: জল বা মাটিতে সারা বছর সবুজ',
    harvestOrBloomEn: 'Evergreen in water or soil',
  },
  'ashoke-67': {
    sizeAgeBn: '৬–৮ ইঞ্চি · প্রতিষ্ঠিত কাঠের লগ',
    sizeAgeEn: '6–8 in · rooted trunk',
    harvestOrBloomBn: 'বৃদ্ধি: ২০–৩০ দিনে নতুন সবুজ ডাল',
    harvestOrBloomEn: 'New shoots in 20–30 days',
  },
};

export function getPlantGrowthInfo(
  plant: BrahmyamanPlant,
  selectedOption?: PlantPotOption
): PlantGrowthMetadata {
  const specific = SPECIFIC_PLANT_GROWTH[plant.id];
  if (specific) {
    if (selectedOption && selectedOption.price >= 140 && selectedOption.labelBn.includes('বড়')) {
      return {
        ...specific,
        sizeAgeBn: specific.sizeAgeBn.replace('১.৫–২ ফুট', '২.৫–৩ ফুট').replace('১.৫ ফুট', '২–২.৫ ফুট'),
        sizeAgeEn: specific.sizeAgeEn.replace('1.5–2 ft', '2.5–3 ft').replace('1.5 ft', '2–2.5 ft'),
      };
    }
    return specific;
  }

  const name = `${plant.nameBn} ${plant.nameEn} ${plant.category}`.toLowerCase();

  if (plant.category === 'ছাদবাগানের ফল ও কলম' || name.includes('কলম') || name.includes('graft')) {
    return {
      sizeAgeBn: '১.৫–২ ফুট · ৬–৯ মাস কলম চারা',
      sizeAgeEn: '1.5–2 ft · 6–9 mo grafted',
      harvestOrBloomBn: 'ফলন: ১০–১৫ মাসে টবে ফল ধরে',
      harvestOrBloomEn: 'Fruits in 10–15 months',
    };
  }

  if (plant.category === 'মসলা ও ভেষজ গাছ' || plant.category === 'গৃহস্থ ও ঔষধি গাছ') {
    if (
      name.includes('তেজপাতা') ||
      name.includes('দারুচিনি') ||
      name.includes('এলাচ')
    ) {
      return {
        sizeAgeBn: '১–১.৫ ফুট · ৬ মাস বয়সী চারা',
        sizeAgeEn: '1–1.5 ft · 6 mo sapling',
        harvestOrBloomBn: 'ব্যবহার: ২–৩ মাসে টাটকা পাতা তোলা যায়',
        harvestOrBloomEn: 'Fresh leaves in 2–3 months',
      };
    }
    if (name.includes('অ্যালোভেরা') || name.includes('স্নেক') || name.includes('মানি') || name.includes('সাকুলেন্ট')) {
      return {
        sizeAgeBn: '৬–১০ ইঞ্চি · ৪–৬ মাস শিকড়যুক্ত চারা',
        sizeAgeEn: '6–10 in · 4–6 mo rooted',
        harvestOrBloomBn: 'বৃদ্ধি: সারা বছর চিরসবুজ ও অক্সিজেনদায়ী',
        harvestOrBloomEn: 'Year-round evergreen growth',
      };
    }
    return {
      sizeAgeBn: '১–১.৫ ফুট · ৫–৭ মাস বয়সী চারা',
      sizeAgeEn: '1–1.5 ft · 5–7 mo sapling',
      harvestOrBloomBn: 'সৌন্দর্য: সারা বছর বাহারি পাতা ও বৃদ্ধি',
      harvestOrBloomEn: 'Year-round vibrant foliage',
    };
  }

  if (
    name.includes('গাঁদা') ||
    name.includes('চন্দ্রমল্লিকা') ||
    name.includes('গজনিয়া') ||
    name.includes('গজনীয়া') ||
    name.includes('সালভিয়া')
  ) {
    return {
      sizeAgeBn: '৫–৭ ইঞ্চি · ৩০–৪৫ দিন মৌসুমী চারা',
      sizeAgeEn: '5–7 in · 30–45 day bloomer',
      harvestOrBloomBn: 'ফুল ফোটা: ২০–৩০ দিনে প্রচুর কুঁড়ি',
      harvestOrBloomEn: 'Blooms in 20–30 days',
    };
  }

  if (name.includes('তুলসী')) {
    return {
      sizeAgeBn: '৮–১০ ইঞ্চি · ৩–৪ মাস পবিত্র চারা',
      sizeAgeEn: '8–10 in · 3–4 mo sapling',
      harvestOrBloomBn: 'ব্যবহার: লাগানোর পর থেকেই নিত্য পূজায় ব্যবহার্য',
      harvestOrBloomEn: 'Ready for daily puja use',
    };
  }

  if (name.includes('বেল') || name.includes('শিউলি')) {
    return {
      sizeAgeBn: '১.৫ ফুট · ৬ মাস বয়সী চারা',
      sizeAgeEn: '1.5 ft · 6 mo sapling',
      harvestOrBloomBn: 'ফুল/পাতা: ৪–৬ মাসে ঘন পাতা ও ঋতুতে ফুল',
      harvestOrBloomEn: 'Lush canopy in 4–6 months',
    };
  }

  if (name.includes('গোলাপ')) {
    return {
      sizeAgeBn: '১০–১৪ ইঞ্চি · ৫–৬ মাস গ্রাফটেড চারা',
      sizeAgeEn: '10–14 in · 5–6 mo grafted',
      harvestOrBloomBn: 'ফুল ফোটা: ২০–৩৫ দিনে নতুন কুঁড়ি ও ফুল',
      harvestOrBloomEn: 'Blooms in 20–35 days',
    };
  }

  if (name.includes('জবা')) {
    return {
      sizeAgeBn: '১–১.৫ ফুট · ৫–৬ মাস কলম/ডাল চারা',
      sizeAgeEn: '1–1.5 ft · 5–6 mo sapling',
      harvestOrBloomBn: 'ফুল ফোটা: ১৫–৩০ দিনে নিয়মিত ফুল',
      harvestOrBloomEn: 'Blooms in 15–30 days',
    };
  }

  return {
    sizeAgeBn: '১০–১৫ ইঞ্চি · ৪–৬ মাস বয়সী চারা',
    sizeAgeEn: '10–15 in · 4–6 mo sapling',
    harvestOrBloomBn: 'ফুল ফোটা: ৩০–৪৫ দিনে গাছে ফুল আসে',
    harvestOrBloomEn: 'Blooms in 30–45 days',
  };
}
