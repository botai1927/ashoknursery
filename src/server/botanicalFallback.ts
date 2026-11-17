export const ALLOWED_NURSERY_CATEGORIES = [
  'ছাদবাগানের ফল ও কলম',
  'পূজার ফুল ও পবিত্র গাছ',
  'ছাদ ও বারান্দার ফুল',
  'গাছপালা ও শো-প্ল্যান্ট',
  'মসলা ও ভেষজ গাছ',
  'গৃহস্থ ও ঔষধি গাছ',
];

export function inferNurseryCategory(text: string): string {
  const t = text.toLowerCase();
  if (
    /আম|আম্রপালী|কাটিমন|লেবু|কাগজি|পেয়ারা|পেয়ারা|ডালিম|বেদানা|সবেদা|লিচু|কাঁঠাল|বাতাবি|ড্রাগন|কমলা|মাল্টা|কলা|নারকেল|জাম|আমড়া|mango|lemon|lime|guava|pomegranate|sapota|jackfruit|dragon|pomelo|orange|fruit/.test(
      t
    )
  ) {
    return 'ছাদবাগানের ফল ও কলম';
  }
  if (
    /জবা|রক্তজবা|পদ্ম|স্থলপদ্ম|তুলসী|অপরাজিতা|বেল|শিউলি|টগর|চাঁপা|নয়নতারা|কলকে|দুর্বা|hibiscus|lotus|tulsi|aparajita|bael|shiuli|parijat|tagar/.test(
      t
    )
  ) {
    return 'পূজার ফুল ও পবিত্র গাছ';
  }
  if (
    /মসলা|এলাচ|দারুচিনি|তেজপাতা|লবঙ্গ|গোলমরিচ|কারি|কারিপাতা|আদা|হলুদ|পান|cardamom|cinnamon|bay leaf|curry leaf|pepper|clove/.test(
      t
    )
  ) {
    return 'মসলা ও ভেষজ গাছ';
  }
  if (
    /অ্যালোভেরা|ঘৃতকুমারী|নিম|পাথরকুচি|কালমেঘ|বাসক|স্নেক|থানকুনি|অশ্বগন্ধা|aloe|neem|snake plant|medicinal|herb|vicks|ajwain/.test(
      t
    )
  ) {
    return 'গৃহস্থ ও ঔষধি গাছ';
  }
  if (
    /পাম|ক্রোটন|মানি প্ল্যান্ট|লাকি ব্যাম্বু|রাবার|ফার্ন|জেড|এরিকা|মনস্টেরা|শো|ইনডোর|palm|croton|money plant|bamboo|jade|fern|indoor|foliage/.test(
      t
    )
  ) {
    return 'গাছপালা ও শো-প্ল্যান্ট';
  }
  return 'ছাদ ও বারান্দার ফুল';
}

export function normalizeAutofillResult(raw: any, fallback: any, mode: string, existingPlant: any) {
  const isDescOnly = mode === 'description_only';
  const rawCat = typeof raw?.category === 'string' ? raw.category.trim() : '';
  const matchedCat =
    ALLOWED_NURSERY_CATEGORIES.find((c) => c === rawCat || c.includes(rawCat) || rawCat.includes(c)) ||
    fallback.category;

  const rawPrice = Number(raw?.suggestedPrice);
  const cleanPrice =
    Number.isFinite(rawPrice) && rawPrice >= 20 && rawPrice <= 5000
      ? Math.round(rawPrice / 5) * 5
      : fallback.suggestedPrice;

  const rawDescBn = typeof raw?.descriptionBn === 'string' ? raw.descriptionBn.trim() : '';
  const rawDescEn = typeof raw?.descriptionEn === 'string' ? raw.descriptionEn.trim() : '';

  return {
    nameBn: isDescOnly && existingPlant?.nameBn ? existingPlant.nameBn : (raw?.nameBn || fallback.nameBn).trim(),
    nameEn: isDescOnly && existingPlant?.nameEn ? existingPlant.nameEn : (raw?.nameEn || fallback.nameEn).trim(),
    colorBn: isDescOnly && existingPlant?.colorBn ? existingPlant.colorBn : (raw?.colorBn || fallback.colorBn).trim(),
    badgeBn: (raw?.badgeBn || fallback.badgeBn).trim().slice(0, 48),
    category: isDescOnly && existingPlant?.category ? existingPlant.category : matchedCat,
    botanicalName: (raw?.botanicalName || fallback.botanicalName).trim(),
    suggestedPrice: cleanPrice,
    sunlightBn: (raw?.sunlightBn || fallback.sunlightBn).trim(),
    wateringBn: (raw?.wateringBn || fallback.wateringBn).trim(),
    soilTipBn: (raw?.soilTipBn || fallback.soilTipBn).trim(),
    descriptionBn: rawDescBn.length >= 240 ? rawDescBn : fallback.descriptionBn,
    descriptionEn: rawDescEn.length >= 60 ? rawDescEn : fallback.descriptionEn,
  };
}

interface BotanicalEntry {
  match: string[];
  nameBn: string;
  nameEn: string;
  colorBn: string;
  badgeBn: string;
  category: string;
  botanicalName: string;
  suggestedPrice: number;
  sunlightBn: string;
  wateringBn: string;
  soilTipBn: string;
  descriptionBn: string;
  descriptionEn: string;
}

// Unlimited Zero-Quota Botanical Auto-Fill Fallback (guarantees Smart Auto-Fill works even if cloud AI hits quota)
export async function generateUnlimitedBotanicalFallback(
  query: string,
  existingPlant: any,
  customInstruction: string,
  mode: string = 'full'
) {
  const q = query.trim();
  const qLower = q.toLowerCase();

  const NURSERY_ENCYCLOPEDIA: BotanicalEntry[] = [
    {
      match: ['জবা', 'রক্তজবা', 'hibiscus', 'জবা ফুল'],
      nameBn: 'রক্তজবা',
      nameEn: 'Red Hibiscus',
      colorBn: 'রক্ত লাল',
      badgeBn: 'নিত্য পূজার তাজা ফুল',
      category: 'পূজার ফুল ও পবিত্র গাছ',
      botanicalName: 'Hibiscus rosa-sinensis',
      suggestedPrice: 50,
      sunlightBn: 'পূর্ণ রোদ (দৈনিক ৫–৬ ঘণ্টা সরাসরি সূর্যালোক পেলে কুঁড়ি ঝরে না ও ফুল বড় হয়)',
      wateringBn: 'গ্রীষ্মে প্রতিদিন সকালে ও বিকালে গোড়ায় জল দিন; শীতে মাটির আর্দ্রতা দেখে ১ দিন অন্তর জল দিন',
      soilTipBn: '৫০% বাঁকুড়ার লাল দোআঁশ মাটি, ৩০% পুরনো গোবর সার বা ভার্মিকম্পোস্ট, ১০% নদী-বালি ও ১০% হাড়গুঁড়ো-নিমখোল',
      descriptionBn:
        'রক্তজবা (Hibiscus rosa-sinensis) কালশুলি, বাঁকুড়ার নার্সারিতে নিজস্ব যত্নে তৈরি শিকড়-সুস্থ পুষ্ট জাতের জবা চারা। গাঢ় সবুজ খাঁজকাটা পাতা ও সুষম কান্ডের বিস্তারযুক্ত এই চারায় খুব দ্রুত শাখা-প্রশাখা গজিয়ে সারাবছর প্রচুর কুঁড়ি ধারণের ক্ষমতা থাকে। মা কালী ও শিব পূজার নৈবেদ্যে রক্তজবার গভীর আধ্যাত্মিক মর্যাদা রয়েছে।\n\nবাঁকুড়ার প্রখর রৌদ্রোজ্জ্বল আবহাওয়ায় (৩৮°-৪২° সে.) এটি অনায়াসে খাপ খাইয়ে নেয়। গ্রীষ্মকালে টবের উপরের মাটি শুকিয়ে এলে সকালে ও বিকালে পরিমিত জল দিন। বর্ষাকালে ড্রেনেজ হোলে যাতে জল জমে শিকড় পচে না যায় সেদিকে নজর রাখুন এবং মাসে একবার সাফ (Saaf) বা নিমতেল স্প্রে করুন মিলিবাগ দমনের জন্য। শীতের শুরুতে হালকা প্রুনিং বা ডাল ছাঁটাই করে দিলে বসন্তকালে অজস্র নতুন ডালপালায় টকটকে লাল ফুল ফোটে।\n\nরোপণের জন্য ১০ থেকে ১২ ইঞ্চির পোড়ামাটির টব সবচেয়ে উপযুক্ত। মাটির সংমিশ্রণে ৫০% বাঁকুড়ার লাল দোআঁশ মাটি, ৩০% পুরনো গোবর সার বা ভার্মিকম্পোস্ট, ১০% নদী-বালি ও ১০% নিমখোল-হাড়গুঁড়ো মিশিয়ে নিলে সারাবছর গাছের বৃদ্ধি সতেজ থাকে। কার্তিক-অগ্রহায়ণ মাসে প্রতি ১৫ দিনে একবার হালকা সরিষার খোল পচা তরল সার প্রয়োগ করলে ফুলের আকার চমৎকার বড় হয়।',
      descriptionEn:
        'Vibrant Red Hibiscus prized for daily religious worship and sunny terrace pots. Features heat tolerance up to 42°C, prolific blooming cycles, and sturdy root structure.',
    },
    {
      match: ['আম', 'আম্রপালী', 'কাটিমন', 'mango', 'amrapali', 'katimon', 'হাড়িভাঙ্গা'],
      nameBn: qLower.includes('কাটিমন') || qLower.includes('katimon') ? 'বারোমাসি কাটিমন আম কলম' : 'আম্রপালী আম কলম',
      nameEn: qLower.includes('কাটিমন') || qLower.includes('katimon') ? 'Katimon All-Season Mango' : 'Grafted Amrapali Mango',
      colorBn: 'বারোমাসি / মিষ্টি কলম',
      badgeBn: 'ছাদবাগানের জোড় কলম',
      category: 'ছাদবাগানের ফল ও কলম',
      botanicalName: 'Mangifera indica',
      suggestedPrice: 120,
      sunlightBn: 'পূর্ণ রোদ (দৈনিক অন্তত ৬ ঘণ্টা খোলা ছাদ বা উঠোনের প্রখর রোদ আবশ্যক)',
      wateringBn: 'মাটির উপরিভাগ শুকিয়ে এলে নিয়মিত পরিমিত জল দিন; তবে মুকুল আসার সময় অতিরিক্ত জল পরিহার করুন',
      soilTipBn: '৬০% লাল দোআঁশ মাটি, ২৫% পচা গোবর বা ভার্মিকম্পোস্ট, ১০% মোটা বালি এবং ৫% হাড়গুঁড়ো ও নিমখোল',
      descriptionBn:
        'আম্রপালী ও কাটিমন জাতের উন্নত জোড় কলম (Grafting) আম চারা, যা ছাদবাগান ও ছোট উঠোনের জন্য বিশেষভাবে উপযোগী। কলমের জয়েন্ট মজবুত ও শিকড়ের বৃদ্ধি চমৎকার হওয়ায় অল্প বয়স থেকেই এতে মুকুল আসতে শুরু করে। কাটিমন জাতটি বছরে একাধিকবার এবং আম্রপালী নিয়মিত মিষ্টি ও আঁশহীন আম উপহার দেয়।\n\nবাঁকুড়ার তীব্র রোদ ও শুষ্ক জলবায়ুতে গাছটি দ্রুত বাড়ে। তবে মুকুল আসার সময় অতিরিক্ত জল দেওয়া যাবে না, অন্যথায় মুকুল ঝরে যায়। বর্ষার আগে ও পরে বোর্দো মিশ্রণ বা কপার ছত্রাকনাশক স্প্রে করলে আঠা ঝরা রোগ বন্ধ থাকে। বৈশাখ-জ্যৈষ্ঠের চড়া রোদে গোড়ায় খড় বা শুকনো পাতার মালচিং দিলে মাটির আর্দ্রতা দীর্ঘস্থায়ী হয়।\n\nছাদে চাষের জন্য অন্তত ১৮-২৪ ইঞ্চির বড় হাফ-ড্রাম বা গ্রো-ব্যাগ বেছে নিন, যার নিচে পর্যাপ্ত জল নিষ্কাশন ব্যবস্থা থাকবে। ৬০% বাঁকুড়ার লাল দোআঁশ মাটি, ২৫% পচা গোবর বা ভার্মিকম্পোস্ট, ১০% মোটা বালি এবং ৫% হাড়ের গুঁড়ো ও নিমখোল মিশিয়ে মাটি প্রস্তুত করুন। প্রতি বছর বর্ষার শেষে গোড়ার চারপাশের মাটি আলগা করে নতুন কম্পোস্ট সার দিলে প্রচুর সুস্বাদু ফলন পাওয়া যায়।',
      descriptionEn:
        'Premium dwarf grafted mango sapling adapted for rooftop drums and hot dry climates, producing sweet fiberless fruit with early bearing cycles.',
    },
    {
      match: ['লেবু', 'কাগজি', 'পাতিলেবু', 'lemon', 'lime', 'বাতাবি'],
      nameBn: 'বারোমাসি কাগজি লেবু',
      nameEn: 'All-Season Kagzi Lemon',
      colorBn: 'রসালো সবুজ কলম',
      badgeBn: 'বারোমাসি সুগন্ধি ফলন',
      category: 'ছাদবাগানের ফল ও কলম',
      botanicalName: 'Citrus aurantifolia',
      suggestedPrice: 70,
      sunlightBn: 'পূর্ণ রোদ (দিনে অন্তত ৫–৬ ঘণ্টা রোদে রাখলে ফুল ও ফলের সংখ্যা বাড়ে)',
      wateringBn: 'গ্রীষ্মে প্রতিদিন একবার, তবে টবের গোড়ায় কখনোই জল জমতে দেওয়া যাবে না',
      soilTipBn: '৫০% লাল দোআঁশ মাটি, ৩০% ভার্মিকম্পোস্ট, ১০% মোটা বালি ও ১০% নিমখোল-কাঠের ছাই মিশ্রণ',
      descriptionBn:
        'বারোমাসি কাগজি ও পাতি লেবুর উন্নত গুটি কলম চারা। গাঢ় সবুজ পাতা, সুষম কান্ড এবং কম বয়সেই ফুল ও ফল ধরার জিনগত গুণসম্পন্ন। পাতলা খোসা, সুগন্ধি রস ও রোগপ্রতিরোধক ভিটামিন-সি সমৃদ্ধ এই লেবু সারা বছরই ডালপালায় থোকায় থোকায় ধরে।\n\nগাছটির জন্য দৈনিক অন্তত ৫ থেকে ৬ ঘণ্টা সরাসরি সূর্যালোক আবশ্যক। বাঁকুড়ার গ্রীষ্মে নিয়মিত সেচ দিন, তবে টবের গোড়ায় কখনোই জল জমতে দেওয়া যাবে না। কচি পাতার ডগায় সাইট্রাস ক্যাঙ্কার ও পোকার আক্রমণ রুখতে প্রতি মাসে একবার নিমতেল দ্রবণ স্প্রে করুন। বর্ষার শেষে লেবুর ডালপালায় সামান্য কাঠের ছাই ও হাড়গুঁড়ো দিলে ফলের মিষ্টতা ও রস বাড়ে।\n\nছাদবাগানের জন্য ১২ থেকে ১৬ ইঞ্চির মাটির টব আদর্শ। ৫০% লাল দোআঁশ মাটি, ৩০% ভার্মিকম্পোস্ট, ১০% মোটা বালি ও ১০% নিমখোল-চুন মিশ্রণ দিয়ে টব তৈরি করুন। ফুল আসার সময়ে জল সামান্য কমিয়ে দিন এবং গুঁটি বাঁধলে নিয়মিত পরিমিত জল ও তরল খোল সার দিলে প্রচুর লেবু টিকে থাকে।',
      descriptionEn:
        'High-yielding grafted all-season Kagzi lemon sapling, producing juicy thin-skinned fruit year-round in terrace containers.',
    },
    {
      match: ['গন্ধরাজ', 'gardenia', 'gandharaj'],
      nameBn: 'সুগন্ধি গন্ধরাজ',
      nameEn: 'Fragrant Gardenia',
      colorBn: 'ধবধবে সাদা সুগন্ধি',
      badgeBn: 'মিষ্টি ঘ্রাণ ও পূজার শোভা',
      category: 'পূজার ফুল ও পবিত্র গাছ',
      botanicalName: 'Gardenia jasminoides',
      suggestedPrice: 60,
      sunlightBn: 'সকালের মিষ্টি রোদ ৪–৫ ঘণ্টা, গ্রীষ্মের দুপুরের তীব্র তাপে আংশিক ছায়ায় রাখলে কুঁড়ি ঝরে না',
      wateringBn: 'মাটি সবসময় হালকা আর্দ্র রাখুন, তবে অতিরিক্ত জল জমতে দেবেন না',
      soilTipBn: '৫০% দোআঁশ মাটি, ৩০% পাতা-পচা সার বা ভার্মিকম্পোস্ট, ১০% বালি এবং ১০% নিমখোল ও হাড়গুঁড়ো',
      descriptionBn:
        'চকচকে গাঢ় সবুজ পাতা ও মনমাতানো তীব্র সুবাসযুক্ত সাদা গন্ধরাজ ফুলের নির্বাচিত সুস্থ চারা। সান্ধ্য বাতাসে এর সুগন্ধ বহু দূর পর্যন্ত ছড়ায় এবং ঠাকুরঘরে নিত্যপূজার জন্য সাদা গন্ধরাজ ফুল অত্যন্ত পবিত্র বলে মানা হয়।\n\nগাছটি সকালের মিষ্টি রোদ সবচেয়ে ভালোবাসে, তবে বাঁকুড়ার বৈশাখী দুপুরের তীব্র খররোদে হালকা আংশিক ছায়াযুক্ত জায়গায় রাখলে কুঁড়ি ঝরে পড়ে না। গ্রীষ্মকালে মাটির আর্দ্রতা পরীক্ষা করে নিয়মিত জল দিন, যাতে মাটি কখনো পুরোপুরি শুকিয়ে কাঠ না হয়ে যায়। কুঁড়ি আসার সময় মাসে একবার সামান্য এপসম সল্ট ও নিমতেল স্প্রে করলে পাতা হলুদ হওয়া রোধ হয়।\n\n১০ থেকে ১২ ইঞ্চির পোড়ামাটির টবে ৫০% দোআঁশ মাটি, ৩০% পাতা-পচা সার বা ভার্মিকম্পোস্ট, ১০% বালি এবং ১০% হাড়গুঁড়ো ও নিমখোল মিশিয়ে রোপণ করুন। মাটি সামান্য অম্লীয় রাখতে প্রতি দুই মাসে একবার সামান্য চা-পাতা ধোয়া জল বা ফিটকিরি জল দিলে প্রচুর কুঁড়ি আসে।',
      descriptionEn:
        'Fragrant Gardenia featuring glossy evergreen leaves and intensely scented snow-white blooms suited for shaded sunny balconies.',
    },
    {
      match: ['গোলাপ', 'কাশ্মীরি', 'rose', 'ডাচ গোলাপ'],
      nameBn: 'হাইব্রিড গোলাপ',
      nameEn: 'Hybrid Garden Rose',
      colorBn: 'গাঢ় লাল / গোলাপি',
      badgeBn: 'বহু-পাপড়ি সুগন্ধি',
      category: 'ছাদ ও বারান্দার ফুল',
      botanicalName: 'Rosa hybrida',
      suggestedPrice: 60,
      sunlightBn: 'সকালের ৪–৫ ঘণ্টা মিষ্টি রোদ, গ্রীষ্মের দুপুরের কড়া তাপে হালকা শেড দেওয়া ভালো',
      wateringBn: 'সকালে গোড়ায় জল দিন; সন্ধ্যার সময় পাতায় জল ছিটানো এড়িয়ে চলুন যাতে ছত্রাক না লাগে',
      soilTipBn: '৪০% লাল দোআঁশ মাটি, ৩০% পুরোনো গোবর সার, ১৫% ভার্মিকম্পোস্ট, ১০% হাড়গুঁড়ো-শিংকুচি ও ৫% নিমখোল',
      descriptionBn:
        'ঘন পাপড়িযুক্ত ও দীর্ঘস্থায়ী সুবাসের কাশ্মীরি ও ডাচ হাইব্রিড গোলাপের সুস্থ কলম চারা। সুষম কাণ্ড ও রোগমুক্ত ডালপালায় ভরা এই চারায় শীতকালজুড়ে বড় আকারের রঙিন ফুল ফোটে এবং বসন্তেও নতুন কুঁড়ির জোয়ার আসে।\n\nগোলাপের জন্য সকালের ৪ থেকে ৫ ঘণ্টা মিষ্টি সূর্যালোক সবচেয়ে উপকারী। গ্রীষ্মকালে দুপুরের চড়া রোদে হালকা শেডের নিচে রাখলে পাপড়ির রঙ উজ্জ্বল থাকে। জল দেওয়ার সময় খেয়াল রাখবেন যেন পাতার ওপর জল না জমে, সবসময় গোড়ার মাটিতে সকালে জল দেওয়া উচিত। বর্ষায় ব্ল্যাক স্পট ও ডাইব্যাক রোগ ঠেকাতে কান্ড ছাঁটাইয়ের পর কাটা মুখে ফাংগিসাইড পেস্ট লাগিয়ে দিন।\n\n৮ থেকে ১০ ইঞ্চির টবে ৪০% লাল দোআঁশ মাটি, ৩০% পুরোনো গোবর সার, ১৫% ভার্মিকম্পোস্ট, ১০% হাড়গুঁড়ো-শিংকুচি এবং ৫% নিমখোল মিশিয়ে গাছ বসান। কার্তিক মাসে হালকা ডাল ছাঁটাই করে প্রতি সপ্তাহে সরিষার খোল পচা তরল সার দিলে থোকায় থোকায় বড় গোলাপ ফোটে।',
      descriptionEn:
        'Heirloom and hybrid bedding rose graft yielding profuse fragrant blossoms in aerated organic soil mixes.',
    },
    {
      match: ['অ্যাডেনিয়াম', 'মরু গোলাপ', 'adenium'],
      nameBn: 'অ্যাডেনিয়াম (মরু গোলাপ)',
      nameEn: 'Adenium Desert Rose',
      colorBn: 'দ্বি-বর্ণ / লাল-গোলাপি',
      badgeBn: 'কম জলে টেকসই বনসাই',
      category: 'ছাদ ও বারান্দার ফুল',
      botanicalName: 'Adenium obesum',
      suggestedPrice: 110,
      sunlightBn: 'তীব্র পূর্ণ রোদ (বাঁকুড়ার চড়া রোদে যত বেশি থাকবে, ফুল তত বেশি ফুটবে)',
      wateringBn: 'মাটি পুরোপুরি শুকিয়ে গেলে তবেই জল দিন; শীতে মাসে ১–২ বার জল দেওয়াই যথেষ্ট',
      soilTipBn: '৬০% সিণ্ডার বা মোটা লাল বালি, ২০% দোআঁশ মাটি এবং ২০% ভার্মিকম্পোস্ট ও হাড়গুঁড়ো',
      descriptionBn:
        'মোটা কডেক্স (Caudex) ও শৈল্পিক বনসাই গড়নের মরু গোলাপ চারা। এর মাংসল কান্ডে প্রচুর জল সঞ্চিত থাকে, ফলে তীব্র শুষ্কতা ও রোদেও এটি সতেজ থাকে। বিভিন্ন রঙের থোকা ফুল ছাদবাগানকে এক অপূর্ব রূপ দেয়।\n\nবাঁকুড়ার চড়া রোদ ও ৪০°+ সে. তাপমাত্রায় অ্যাডেনিয়াম চমৎকার বেড়ে ওঠে। তবে অতিরিক্ত জল বা জলাবদ্ধতা এর প্রধান শত্রু। গ্রীষ্মকালে মাটি শুকিয়ে গেলে ৩-৪ দিন পর পর জল দিন এবং শীতকালে মাসে মাত্র দুইবার জল দেওয়াই যথেষ্ট। বর্ষাকালে টবটি এমন শেডে রাখুন যাতে একটানা বৃষ্টির জলে শিকড় ও কডেক্স পচে না যায়।\n\nগাছটির জন্য প্রয়োজন সম্পূর্ণ জল নিষ্কাশনকারী সিণ্ডার ও বালির মিশ্রণ। ৬০% সিণ্ডার বা পোড়া কয়লার গুঁড়ো/মোটা লাল বালি, ২০% দোআঁশ মাটি এবং ২০% ভার্মিকম্পোস্ট ও হাড়গুঁড়ো দিয়ে অগভীর চওড়া টবে বসান। বছরে একবার বসন্তের শুরুতে কডেক্স সামান্য উঁচু করে রিপোর্টিং করলে বনসাই রূপ আরও খোলে।',
      descriptionEn:
        'Sculptural caudex desert rose thriving in blazing tropical heat with drought resilience and low maintenance.',
    },
    {
      match: ['বাগানবিলাস', 'বোগেনভেলিয়া', 'কাগজ ফুল', 'bougainvillea'],
      nameBn: 'বাগানবিলাস (বোগেনভেলিয়া)',
      nameEn: 'Bougainvillea Hybrid',
      colorBn: 'ম্যাজেন্টা / কমলা-সাদা',
      badgeBn: 'রোদে অজস্র রঙ্গিন ফুল',
      category: 'ছাদ ও বারান্দার ফুল',
      botanicalName: 'Bougainvillea spectabilis',
      suggestedPrice: 70,
      sunlightBn: 'তীব্র পূর্ণ রোদ (দৈনিক ৬+ ঘণ্টা কড়া রোদে ফুলের রং সবচেয়ে উজ্জ্বল হয়)',
      wateringBn: 'কম জল পছন্দ করে; মাটি শুকিয়ে পাতা সামান্য নুয়ে এলে তবেই পরিমিত জল দিন',
      soilTipBn: '৬০% সাধারণ বাগানের দোআঁশ মাটি, ২০% নদী-বালি এবং ২০% গোবর সার বা ভার্মিকম্পোস্ট',
      descriptionBn:
        'বাঁকুড়ার খরার রোদ সহ্য করে ছাদ ও বারান্দা রঙিন ফুলে ভরিয়ে দিতে বাগানবিলাস বা বোগেনভেলিয়ার কোনো বিকল্প নেই। এর উজ্জ্বল রঙিন ব্র্যাক্ট বা ফুল মাসের পর মাস ডালে টিকে থাকে এবং দূর থেকেই পথচারীদের দৃষ্টি আকর্ষণ করে।\n\nযত বেশি রোদ পাবে, গাছে তত বেশি ফুল আসবে। দিনে অন্তত ৬ ঘণ্টা কড়া রোদে গাছটি রাখুন। কম জলে ফুল বেশি আসে—মাটি শুকিয়ে পাতা যখন সামান্য নুয়ে পড়বে, তখনই কেবল পরিমিত জল দিন। বর্ষায় ডালপালা অতিরিক্ত বাড়লে ডগা ছাঁটাই করে দিন, তাহলে নতুন কচি ডাল বের হয়ে দ্রুত কুঁড়িতে ঢেকে যাবে।\n\n১০ থেকে ১২ ইঞ্চির টবে ৬০% সাধারণ বাগানের দোআঁশ মাটি, ২০% নদী-বালি এবং ২০% গোবর সার বা ভার্মিকম্পোস্ট মিশিয়ে রোপণ করুন। ফুল আসার মৌসুমে পটাসিয়াম সমৃদ্ধ কলার খোসা ভিজানো জল বা কাঠের ছাই দিলে ফুলের রঙ গাঢ় ও দীর্ঘস্থায়ী হয়।',
      descriptionEn:
        'Sun-loving Bougainvillea providing striking colorful floral bracts across summer and winter with low moisture needs.',
    },
    {
      match: ['রঙ্গন', 'রঙন', 'ixora'],
      nameBn: 'মিনি রঙ্গন (ইক্সোরা)',
      nameEn: 'Dwarf Ixora',
      colorBn: 'টকটকে লাল / গোলাপি',
      badgeBn: 'থোকা থোকা সারাবছর ফুল',
      category: 'ছাদ ও বারান্দার ফুল',
      botanicalName: 'Ixora coccinea',
      suggestedPrice: 50,
      sunlightBn: 'পূর্ণ থেকে আংশিক রোদ (দিনে ৪–৫ ঘণ্টা সূর্যালোক আবশ্যক)',
      wateringBn: 'নিয়মিত পরিমিত জল; বর্ষাকালে টবের ড্রেনেজ ভালো রাখুন',
      soilTipBn: '৫০% দোআঁশ মাটি, ৩০% ভার্মিকম্পোস্ট, ১০% বালি এবং ১০% নিমখোল-হাড়গুঁড়ো',
      descriptionBn:
        'ছোট ঝোপালো গাছে বড় থোকা থোকা রঙিন ফুলে ভরে থাকা মিনি রঙ্গন চারা। ছাদ ও বারান্দার ৮-১০ ইঞ্চি টবে প্রায় সারাবছরই ফুলের বাহার দেয়। উজ্জ্বল লাল, গোলাপি ও হলুদ রঙের থোকা ফুল পূজা ও সৌন্দর্য বর্ধনে অনন্য।\n\nগাছটি উষ্ণ ও আর্দ্র আবহাওয়ায় খুব ভালো বাড়ে। গ্রীষ্মকালে নিয়মিত সকাল-বিকাল জল দিন এবং বর্ষায় অতিরিক্ত জল যাতে টবে না জমে সেজন্য ড্রেনেজ হোল পরিষ্কার রাখুন। ডালপালার ভারসাম্য বজায় রাখতে বছরে একবার ফুল ফোটার পর হালকা ছাঁটাই করে দিন।\n\nমাটি সামান্য অম্লীয় রাখতে লাল দোআঁশ মাটির সাথে ভার্মিকম্পোস্ট ও সামান্য চা-পাতা সার মিশিয়ে টব প্রস্তুত করুন। প্রতি মাসে একবার হালকা তরল জৈব সার দিলে প্রতিটি ডালের ডগায় নতুন ফুলের কুঁড়ি আসে।',
      descriptionEn: 'Dwarf evergreen Ixora blooming in vibrant rounded flower clusters, well-suited for container gardening.',
    },
    {
      match: ['শিউলি', 'শেফালি', 'পারিজাত', 'shiuli', 'parijat', 'nyctanthes'],
      nameBn: 'শিউলি (পারিজাত) চারা',
      nameEn: 'Night-Flowering Jasmine (Shiuli)',
      colorBn: 'সাদা-কমলা পবিত্র ফুল',
      badgeBn: 'ভোরের মিষ্টি পূজার ফুল',
      category: 'পূজার ফুল ও পবিত্র গাছ',
      botanicalName: 'Nyctanthes arbor-tristis',
      suggestedPrice: 60,
      sunlightBn: 'পূর্ণ রোদ (খোলা ছাদে বা উঠোনে দিনে ৫–৬ ঘণ্টা সূর্যালোক)',
      wateringBn: 'গ্রীষ্মে প্রতিদিন একবার, শীত ও বর্ষায় মাটি বুঝে পরিমিত জল দিন',
      soilTipBn: '৫০% বাগানের দোআঁশ মাটি, ৩০% গোবর সার ও ২০% বালি-নিমখোল মিশ্রণ',
      descriptionBn:
        'শরৎ ও হেমন্তের ভোরকে সুবাসিত করা পবিত্র শিউলি বা পারিজাত চারা। কমলা বোঁটা ও দুধ-সাদা পাপড়ির এই ফুল রাতে ফোটে এবং সকালে ঝরে পড়ে। দেবীর আরাধনা ও সকালের পূজায় শিউলি ফুলের পবিত্রতা অপরিসীম।\n\nসুস্থ কলম ও বাছাইকৃত চারা হওয়ায় বড় টবে বা ড্রামেও এটি দ্রুত বাড়ে। গ্রীষ্মকালে নিয়মিত সেচ দিন এবং বর্ষার শেষে ডালপালার আগা সামান্য ছেঁটে দিলে শরৎকালে প্রচুর ফুলের কুঁড়ি ধরে।\n\n১২ থেকে ১৪ ইঞ্চির পোড়ামাটির টবে ৫০% দোআঁশ মাটি, ৩০% পচা গোবর বা কম্পোস্ট ও ২০% বালি-নিমখোল মিশিয়ে গাছ বসান। ভাদ্রমাসে সরিষার খোল পচা তরল সার প্রয়োগ করলে গাছের গঠন বলিষ্ঠ হয়।',
      descriptionEn:
        'Sacred autumnal night-flowering jasmine with aromatic orange-stemmed white petals cherished for morning worship.',
    },
    {
      match: ['অপরাজিতা', 'নীলকণ্ঠ', 'aparajita', 'clitoria', 'butterfly pea'],
      nameBn: 'থোকা নীল অপরাজিতা',
      nameEn: 'Double Blue Butterfly Pea',
      colorBn: 'গাঢ় নীল / সাদা',
      badgeBn: 'পূজা ও ভেষজ চা উপযোগী',
      category: 'পূজার ফুল ও পবিত্র গাছ',
      botanicalName: 'Clitoria ternatea',
      suggestedPrice: 40,
      sunlightBn: 'পূর্ণ রোদ বা উজ্জ্বল বারান্দা (দিনে ৪–৬ ঘণ্টা রোদ পেলে ফুলের প্রাচুর্য বাড়ে)',
      wateringBn: 'মাটিতে হালকা আর্দ্রতা বজায় রাখতে প্রতিদিন সকালে পরিমিত জল দিন',
      soilTipBn: '৫০% দোআঁশ মাটি, ৩০% পচা গোবর বা ভার্মিকম্পোস্ট ও ২০% বালি',
      descriptionBn:
        'মহাদেবের অতি প্রিয় ও মা দুর্গার পূজার অন্যতম শ্রেষ্ঠ নৈবেদ্য থোকা নীল অপরাজিতা লতা চারা। দ্রুত বর্ধনশীল এই লতায় গাঢ় নীল রঙের বহু-পাপড়ি ফুল সারাবছরই ফোটে। এছাড়া এর শুকনো ফুল থেকে স্বাস্থ্যকর অ্যান্টিঅক্সিডেন্ট ব্লু-টি (Blue Tea) তৈরি করা যায়।\n\nগাছটির জন্য উজ্জ্বল সূর্যালোক অত্যন্ত জরুরি। বারান্দার গ্রিল, নেট বা ছাদের মাচায় লতাটিকে উঠিয়ে দিলে অল্প দিনেই পাতার চেয়ে ফুলে বেশি ভরে যায়। মাটিতে সবসময় হালকা আর্দ্রতা বজায় রাখুন, তবে টবের নিচে ড্রেনেজ ছিদ্র খোলা রাখুন যাতে জল না জমে। মাঝে মাঝে ডগা পিঞ্চিং (ডাল ভেঙে দেওয়া) করলে লতাটি ঘন ও ঝোপালো হয়।\n\n৮ থেকে ১০ ইঞ্চির টবে ৫০% দোআঁশ মাটি, ৩০% ভার্মিকম্পোস্ট, ১০% বালি এবং ১০% নিমখোল মিশিয়ে গাছ বসান। ফুল ফোটার সময় প্রতি ২০ দিনে একবার পাতলা খোল জল দিলে ফুলের সংখ্যা বহুগুণ বৃদ্ধি পায়।',
      descriptionEn:
        'Fast-twining double blue butterfly pea creeper producing auspicious blooms for puja and antioxidant herbal tea.',
    },
    {
      match: ['তুলসী', 'কৃষ্ণ', 'রাম', 'tulsi'],
      nameBn: 'পবিত্র কৃষ্ণ তুলসী',
      nameEn: 'Sacred Krishna Tulsi',
      colorBn: 'গাঢ় বেগুনি-সবুজ',
      badgeBn: 'নিত্য পূজা ও ঔষধি',
      category: 'পূজার ফুল ও পবিত্র গাছ',
      botanicalName: 'Ocimum tenuiflorum',
      suggestedPrice: 40,
      sunlightBn: '৪–৫ ঘণ্টা উজ্জ্বল রোদ বা বারান্দার খোলা আলো',
      wateringBn: 'প্রতিদিন সকালে পরিমিত জল দিন; শিকড়ে যাতে জল জমে না থাকে সেদিকে খেয়াল রাখুন',
      soilTipBn: 'সাধারণ পরিষ্কার বাগানের মাটি ৬০%, গোবর সার ৩০% ও ১০% নদী-বালি',
      descriptionBn:
        'সনাতন গৃহস্থের নিত্য পূজা ও সর্দি-কাশি নিরাময়ের আয়ুর্বেদিক গুণে ভরপুর খাঁটি কৃষ্ণ তুলসী চারা। এর গাঢ় বেগুনি-সবুজ পাতা থেকে তীব্র পবিত্র সুগন্ধ নির্গত হয় এবং পরিবেশের বাতাসকে জীবাণুমুক্ত রাখে।\n\nতুলসী গাছের জন্য দৈনিক ৪-৫ ঘণ্টা সকালের নরম মিষ্টি রোদ সবচেয়ে ভালো। গ্রীষ্মের অতিরিক্ত কড়া রোদে দুপুরে হালকা আংশিক ছায়ায় রাখলে পাতার সতেজতা বজায় থাকে। প্রতিদিন সকালে পরিমিত জল দিন, কিন্তু শিকড়ে জল জমতে দেবেন না। গাছে মঞ্জরী বা ফুল এলে সাথে সাথে কেটে দিন, তাহলে তুলসী গাছ অনেক বছর বাঁচে এবং ঘন ঝোপালো থাকে।\n\n৮ থেকে ১০ ইঞ্চির মাটির টবে ৬০% সাধারণ পরিষ্কার মাটি, ৩০% গোবর সার বা কেঁচো সার এবং ১০% বালি মিশিয়ে রোপণ করুন। কোনো রাসায়নিক সার ব্যবহার না করে শুধুমাত্র নিমখোল ও হালকা কাঠের ছাই গোড়ায় দিলে পাতা সুস্থ ও কীটমুক্ত থাকে।',
      descriptionEn:
        'Sacred aromatic Krishna Tulsi esteemed for daily spiritual devotion, natural immunity, and household purifying aura.',
    },
    {
      match: ['পেয়ারা', 'পেয়ারা', 'guava'],
      nameBn: 'থাই বারোমাসি পেয়ারা কলম',
      nameEn: 'Thai Crisp Guava Graft',
      colorBn: 'কচকচে মিষ্টি জাত',
      badgeBn: 'টবেই দ্রুত ফলন',
      category: 'ছাদবাগানের ফল ও কলম',
      botanicalName: 'Psidium guajava',
      suggestedPrice: 80,
      sunlightBn: 'পূর্ণ রোদ (দৈনিক ৫–৬ ঘণ্টা সূর্যালোক আবশ্যক)',
      wateringBn: 'গ্রীষ্মে নিয়মিত জল ও ফল ধরার সময়ে মাটিতে পরিমিত আর্দ্রতা বজায় রাখুন',
      soilTipBn: '৫০% লাল দোআঁশ মাটি, ৩০% জৈব সার, ১০% হাড়ের গুঁড়ো ও ১০% নিমখোল',
      descriptionBn:
        'উন্নত থাই-৭ ও বারোমাসি মিষ্টি পেয়ারার গুটি কলম চারা। কলমের গাছ হওয়ায় চারা রোপণের কয়েক মাসের মধ্যেই ফুল আসে এবং মাঝারি সাইজের টবেই কচকচে মিষ্টি ও কম বীজের পেয়ারা উৎপন্ন হয়।\n\nগাছটিকে ছাদের পূর্ণ রৌদ্রোজ্জ্বল স্থানে রাখুন। ফল ধরার পর নিয়মিত পরিমিত সেচ প্রয়োজন, মাটি একদম শুকিয়ে গেলে কচি পেয়ারা ঝরে যেতে পারে। ফল যখন মার্বেলের মতো বড় হবে, তখন পলিথিন ব্যাগ দিয়ে ঢেকে দিলে মাছি পোকার আক্রমণ থেকে ফল ১০০% সুরক্ষিত থাকে।\n\n১৪ থেকে ১৮ ইঞ্চির টব বা গ্রো-ব্যাগে ৫০% লাল দোআঁশ মাটি, ৩০% ভার্মিকম্পোস্ট, ১০% মোটা বালি, ৫% হাড়ের গুঁড়ো এবং ৫% নিম খোল মিশিয়ে মাটি তৈরি করুন। ফল তোলার পর ডাল হালকা ছাঁটাই করে দিলে নতুন ডালে আবার প্রচুর ফুল আসে।',
      descriptionEn: 'Prolific crisp sweet Thai guava graft ideal for terrace gardening, producing early harvests with minimal care.',
    },
    {
      match: ['ডালিম', 'বেদানা', 'pomegranate'],
      nameBn: 'মিষ্টি লাল বেদানা কলম',
      nameEn: 'Sweet Red Pomegranate',
      colorBn: 'গাঢ় লাল দানা',
      badgeBn: 'পুষ্টিকর ও খরা সহনশীল',
      category: 'ছাদবাগানের ফল ও কলম',
      botanicalName: 'Punica granatum',
      suggestedPrice: 90,
      sunlightBn: 'পূর্ণ রোদ (কড়া রোদে দানা বেশি মিষ্টি ও গাঢ় লাল রঙের হয়)',
      wateringBn: 'মাটি শুকিয়ে এলে পরিমিত জল; ফল পাকার সময় অতিরিক্ত জল দিলে ফল ফেটে যেতে পারে',
      soilTipBn: 'দোআঁশ মাটি ৫০%, মোটা বালি ২০%, ভার্মিকম্পোস্ট ২০% ও ১০% নিমখোল-হাড়গুঁড়ো',
      descriptionBn:
        'বাঁকুড়ার শুষ্ক জলবায়ু ও কড়া রোদে মিষ্টি লাল বেদানার কলম চারা অত্যন্ত চমৎকার ফলন দেয়। ভাগোয়া জাতের এই কলমে অল্প বয়সেই গাঢ় লাল রঙের ফুল ফোটে এবং নিয়মিত পুষ্টিকর রসালো লাল দানার ডালিম ধরে।\n\nগাছটি খরা সহনশীল হলেও ফল বৃদ্ধির সময় মাটিতে নিয়মিত হালকা আর্দ্রতা বজায় রাখতে হবে। অনিয়মিত জল দিলে ফলের খোসা ফেটে যাওয়ার সম্ভাবনা থাকে। বর্ষায় ফলের মাছি ও দাগ রোগ প্রতিরোধে নিমতেল স্প্রে করা উপকারী।\n\n১৪ থেকে ১৬ ইঞ্চির টবে ৫০% দোআঁশ মাটি, ২০% বালি, ২০% ভার্মিকম্পোস্ট ও ১০% নিমখোল মিশিয়ে গাছ রোপণ করুন। ফুল আসার পর পটাস সার বা কলার খোসা ভেজানো জল দিলে ফলের মিষ্টতা ও ওজন বহুগুণ বৃদ্ধি পায়।',
      descriptionEn:
        'Heat-resilient sweet ruby pomegranate sapling adapted to terrace drums, yielding delicious antioxidant-rich fruit.',
    },
    {
      match: ['সবেদা', 'চিকু', 'sapota', 'chikoo'],
      nameBn: 'থাই বারোমাসি সবেদা কলম',
      nameEn: 'Grafted Thai Sapota',
      colorBn: 'মিষ্টি নরম শাঁস',
      badgeBn: 'খরা সহিষ্ণু ছাদ ফল',
      category: 'ছাদবাগানের ফল ও কলম',
      botanicalName: 'Manilkara zapota',
      suggestedPrice: 120,
      sunlightBn: 'পূর্ণ রোদ (দৈনিক ৬ ঘণ্টা সরাসরি সূর্যালোক আবশ্যক)',
      wateringBn: 'সপ্তাহে ৩–৪ বার পরিমিত জল; টবের গোড়ায় জল জমতে দেবেন না',
      soilTipBn: '৫০% লাল দোআঁশ মাটি, ৩০% পচা গোবর বা ভার্মিকম্পোস্ট ও ২০% বালি-হাড়গুঁড়ো',
      descriptionBn:
        'অল্প পরিচর্যাতেই বাঁকুড়ার গরমে দ্রুত বড় হওয়া ক্রিকেট বল ও থাই বারোমাসি সবেদার উন্নত কলম চারা। গাঢ় সবুজ চামড়ার মতো চকচকে পাতা ও শক্ত কান্ডের এই গাছে বছরে একাধিকবার প্রচুর মিষ্টি নরম শাঁসের সবেদা ধরে।\n\nগাছটি শুষ্ক আবহাওয়া ও তীব্র রোদ দারুণ ভালোবাসে। গ্রীষ্মকালে নিয়মিত জল দিন, তবে টবে যেন কোনোভাবেই জল জমে না থাকে। ফল ধরার পর পরিপক্ক হতে কিছুটা সময় নেয়, তবে গাছটিতে পোকামাকড়ের উপদ্রব খুবই কম হয়।\n\n১৬ থেকে ২০ ইঞ্চির হাফ-ড্রামে ৫০% দোআঁশ মাটি, ৩০% ভার্মিকম্পোস্ট ও ২০% মোটা বালি-হাড়গুঁড়ো দিয়ে প্রতিপালন করুন। বছরে দুইবার বর্ষা ও শীতের শুরুতে গোড়ার মাটি আলগা করে নতুন কম্পোস্ট সার দিলে প্রচুর ফলন বজায় থাকে।',
      descriptionEn:
        'Hardy dwarf sapota graft producing round sweet fruit, exceptional drought resistance in rooftop containers.',
    },
    {
      match: ['পদ্ম', 'স্থলপদ্ম', 'lotus'],
      nameBn: q.includes('স্থল') ? 'গোলাপি স্থলপদ্ম' : 'হাইব্রিড পদ্ম টিউবার',
      nameEn: q.includes('স্থল') ? 'Cotton Rosemallow' : 'Sacred Lotus',
      colorBn: 'গোলাপি / স্নিগ্ধ সাদা',
      badgeBn: 'উৎসব ও পূজার শোভা',
      category: 'পূজার ফুল ও পবিত্র গাছ',
      botanicalName: q.includes('স্থল') ? 'Hibiscus mutabilis' : 'Nelumbo nucifera',
      suggestedPrice: 90,
      sunlightBn: 'পূর্ণ রোদ (দিনে অন্তত ৫–৬ ঘণ্টা খোলা রোদ আবশ্যক)',
      wateringBn: q.includes('স্থল')
        ? 'মাটি স্যাঁতসেঁতে রাখতে প্রতিদিন জল দিন'
        : 'চৌবাচ্চায় পরিষ্কার জল ভরে রাখুন, প্রতি সপ্তাহে উপরের জল বদলান',
      soilTipBn: q.includes('স্থল')
        ? 'দোআঁশ মাটি ও ভার্মিকম্পোস্ট মিশ্রণ'
        : 'নিচে জমানো ভার্মিকম্পোস্ট ও উপরে আঠালো দোআঁশ কাদামাটি',
      descriptionBn: q.includes('স্থল')
        ? 'সকালে দুধ-সাদা ও দুপুরে মনোরম গোলাপি রঙ ধারণকারী অপূর্ব স্থলপদ্ম চারা। দেবী দুর্গার আরাধনা ও বাড়ির বাগানের শোভা বাড়াতে এই গাছ অতুলনীয়।\n\nগাছটির জন্য দিনে অন্তত ৫ ঘণ্টা সরাসরি রোদ প্রয়োজন। গ্রীষ্মের খরার দিনে গোড়ায় পর্যাপ্ত জল দিন যাতে শিকড় শুকিয়ে না যায়। শীতের শুরুতে পাতা ঝরে গেলেও বসন্তে আবার নতুন কচি পাতায় ভরে উঠে অজস্র ফুল দেয়।\n\n১০ থেকে ১২ ইঞ্চির টবে দোআঁশ মাটি ও ভার্মিকম্পোস্ট সমপরিমাণে মিশিয়ে গাছ রোপণ করুন। ফুল আসার সময়ে সরিষার খোল সার দিলে ফুলের আকার অনেক বড় হয়।'
        : 'ছাদের বড় গামলা বা সিমেন্টের চৌবাচ্চায় সহজে চাষযোগ্য সতেজ পদ্ম টিউবার চারা। সুস্থ কন্দ ও বড় পাতাযুক্ত এই চারা রোপণের অল্প দিনেই ছাদের জলবাগানে পবিত্র পদ্ম ফুল উপহার দেয়।\n\nপদ্মের জন্য সারাদিনের কড়া রোদ অত্যন্ত জরুরি। গামলার নিচে ভার্মিকম্পোস্ট ও উপরে আঠালো দোআঁশ মাটি দিয়ে টিউবারটি আনুভূমিকভাবে বসান এবং উপর দিয়ে পরিষ্কার জল ঢেলে দিন।\n\nজলে মশার উপদ্রব বন্ধ রাখতে গাপ্পি বা মলি মাছ ছেড়ে দেওয়া যায়। মাসে একবার পদ্মের বিশেষ জৈব সারের ট্যাবলেট কাদায় পুঁতে দিলে বড় আকারের পবিত্র পদ্ম ফুল ফোটে।',
      descriptionEn:
        'Auspicious aquatic and terrestrial lotus cultivars delivering resplendent devotional blossoms for festive rituals.',
    },
    {
      match: ['বেলি', 'জুঁই', 'jasmine', 'mogra'],
      nameBn: 'সুগন্ধি বেলি ফুল',
      nameEn: 'Arabian Jasmine (Beli)',
      colorBn: 'ধবধবে সাদা সুগন্ধি',
      badgeBn: 'গ্রীষ্মের সুগন্ধি ফুল',
      category: 'ছাদ ও বারান্দার ফুল',
      botanicalName: 'Jasminum sambac',
      suggestedPrice: 50,
      sunlightBn: 'পূর্ণ রোদ (দিনে ৫–৬ ঘণ্টা কড়া রোদে প্রচুর কুঁড়ি ধরে)',
      wateringBn: 'গ্রীষ্মে প্রতিদিন সকালে বা বিকালে গোড়ায় পরিমিত জল দিন',
      soilTipBn: '৫০% দোআঁশ মাটি, ৩০% গোবর সার, ১০% বালি ও ১০% হাড়গুঁড়ো-নিমখোল',
      descriptionBn:
        'তীব্র সুগন্ধযুক্ত থোকা বেলি বা মোতিয়া বেলি ফুলের নির্বাচিত চারা। গ্রীষ্ম ও বর্ষাকালে সন্ধ্যায় গাছজুড়ে অজস্র সাদা ফুল ফোটে এবং আশেপাশের বাতাসকে সুবাসিত রাখে। পূজা এবং ঘর সাজাতে বেলি ফুলের জুড়ি নেই।\n\nগাছটি পূর্ণ রৌদ্রোজ্জ্বল স্থানে সবচেয়ে ভালো বাড়ে। ফুল ফোটার প্রতিটি ফ্লাশ শেষ হওয়ার পর ডগা সামান্য ছাঁটাই করে দিলে নতুন ডাল থেকে আবার থোকায় থোকায় কুঁড়ি আসে।\n\n৮ থেকে ১০ ইঞ্চির টবে ৫০% দোআঁশ মাটি, ৩০% গোবর সার বা ভার্মিকম্পোস্ট এবং ২০% বালি ও নিমখোল মিশিয়ে গাছ লাগান। গ্রীষ্মের শুরুতে সরিষার খোল জল ও কলার খোসা ভেজানো জল দিলে সারা মরশুম অজস্র ফুল পাওয়া যায়।',
      descriptionEn:
        'Heavily scented white Arabian Jasmine flourishing in warm rooftop sun with continuous flushes of summer blooms.',
    },
    {
      match: ['কামিনী', 'orange jasmine', 'kamini'],
      nameBn: 'সুগন্ধি কামিনী ফুল',
      nameEn: 'Orange Jasmine (Kamini)',
      colorBn: 'ধবধবে সাদা সুবাসিত',
      badgeBn: 'রাতের তীব্র সুবাস',
      category: 'ছাদ ও বারান্দার ফুল',
      botanicalName: 'Murraya paniculata',
      suggestedPrice: 60,
      sunlightBn: 'সকাল থেকে দুপুরের উজ্জ্বল রোদ (দিনে ৪–৫ ঘণ্টা সূর্যালোক)',
      wateringBn: 'মাটির উপরিভাগ শুকিয়ে এলে পরিমিত জল দিন; জলাবদ্ধতা পরিহার করুন',
      soilTipBn: '৫০% দোআঁশ মাটি, ৩০% ভার্মিকম্পোস্ট ও ২০% বালি-নিমখোল',
      descriptionBn:
        'চকচকে গাঢ় সবুজ পাতা ও তীব্র মিষ্টি গন্ধযুক্ত সাদা কামিনী ফুলের নির্বাচিত চারা। রাতে এর মোহনীয় সুবাস বারান্দা ও ছাদ ভরিয়ে রাখে। নিয়মিত ছাঁটাই করে একে সুন্দর গোল ঝোপ বা বনসাই রূপ দেওয়া যায়।\n\nগাছটি বাঁকুড়ার রোদ ও গরমে খুব সহজেই খাপ খায়। বর্ষা ও গ্রীষ্মে ফুল ফোটার জোয়ার আসে। ফুল শেষ হলে হালকা প্রুনিং করে দিলে নতুন পাতার সাথে আবার ফুলের থোকা জন্মায়।\n\n১০ থেকে ১২ ইঞ্চির টবে ৫০% দোআঁশ মাটি, ৩০% ভার্মিকম্পোস্ট এবং ২০% বালি-নিমখোল মিশিয়ে রোপণ করুন। বছরে দুইবার জৈব সার প্রয়োগ করলে গাছটি ঘন সবুজ ও কুঁড়িতে সতেজ থাকে।',
      descriptionEn:
        'Dense evergreen shrub bearing clusters of intensely fragrant white flowers, ideal for topiary and fragrant gardens.',
    },
    {
      match: ['টগর', 'কাঠটগর', 'tagar', 'crepe jasmine'],
      nameBn: 'দুধ-সাদা টগর ফুল',
      nameEn: 'Crepe Jasmine (Tagar)',
      colorBn: 'ধবধবে সাদা',
      badgeBn: 'নিত্য পূজার প্রিয় ফুল',
      category: 'পূজার ফুল ও পবিত্র গাছ',
      botanicalName: 'Tabernaemontana divaricata',
      suggestedPrice: 40,
      sunlightBn: 'পূর্ণ থেকে আংশিক রোদ (দিনে ৪–৫ ঘণ্টা সূর্যালোক)',
      wateringBn: 'মাটি শুকালে পরিমিত জল; খরা সহনশীল হলেও নিয়মিত সেচে কুঁড়ি বেশি আসে',
      soilTipBn: '৫০% সাধারণ মাটি, ৩০% গোবর সার বা কম্পোস্ট ও ২০% বালি',
      descriptionBn:
        'ধবধবে সাদা পাপড়ির টগর বা কাঠটগর চারা, যা নিত্যদিনের গৃহপূজায় অত্যন্ত সমাদৃত। এর পরিচ্ছন্ন সাদা ফুল গাছকে সারাবছরই সুশোভিত রাখে এবং খুব অল্প পরিচর্যাতেই টবে সুন্দর ঝোপালো হয়।\n\nগাছটি বাঁকুড়ার চড়া রোদ সহ্য করতে সক্ষম। বর্ষাকালে সবচেয়ে বেশি ফুল ফোটে। ডাল ছাঁটাই করলে নতুন কচি শাখায় দ্রুত কুঁড়ির আবির্ভাব ঘটে।\n\n৮ থেকে ১০ ইঞ্চির টবে সাধারণ দোআঁশ মাটির সাথে গোবর সার মিশিয়ে গাছ লাগান। কোনো ক্ষতিকারক কীটনাশক ছাড়াই গাছটি বহু বছর সুস্থভাবে বেঁচে থাকে।',
      descriptionEn:
        'Pristine white crepe jasmine widely used for devotional temple offerings and resilient garden hedges.',
    },
    {
      match: ['অ্যালোভেরা', 'ঘৃতকুমারী', 'aloe'],
      nameBn: 'অ্যালোভেরা (ঘৃতকুমারী)',
      nameEn: 'Organic Aloe Vera',
      colorBn: 'রসালো সবুজ পাতা',
      badgeBn: 'ত্বক ও চুলের ভেষজ',
      category: 'গৃহস্থ ও ঔষধি গাছ',
      botanicalName: 'Aloe barbadensis miller',
      suggestedPrice: 40,
      sunlightBn: 'উজ্জ্বল পরোক্ষ আলো বা সকালের ২–৩ ঘণ্টা নরম রোদ',
      wateringBn: 'মাটি পুরোপুরি শুকিয়ে গেলে তবেই জল দিন (গরমে সপ্তাহে ২ দিন, শীতে সপ্তাহে ১ দিন)',
      soilTipBn: '৪০% দোআঁশ মাটি, ৪০% মোটা লাল বালি ও ২০% ভার্মিকম্পোস্ট',
      descriptionBn:
        'ঘরোয়া রূপচর্চা, চুলের যত্ন ও পেটের স্বাস্থ্যগুণে ভরপুর মোটা রসালো পাতার অ্যালোভেরা চারা। এর ভেতরে থাকা শীতল জেল ত্বকের পোড়া ভাব ও প্রদাহ কমাতে অত্যন্ত কার্যকরী।\n\nখুব কম জল ও অল্প পরিচর্যাতেই গাছটি টবে সতেজ থাকে। অতিরিক্ত জল দেওয়া যাবে না, অন্যথায় শিকড় পচে যায়। পাশ থেকে নতুন বেবি প্ল্যান্ট বের হয়ে অল্প দিনেই টব ভরে ওঠে।\n\n৮ থেকে ১০ ইঞ্চির অগভীর টবে মোটা বালি ও দোআঁশ মাটির মিশ্রণে গাছ লাগান। টবের নিচে যাতে চমৎকার জল নিষ্কাশন ব্যবস্থা থাকে সেদিকে খেয়াল রাখুন।',
      descriptionEn: 'Succulent medicinal Aloe Vera prized for cooling gel, soothing skincare, and effortless balcony upkeep.',
    },
    {
      match: ['স্নেক', 'snake plant', 'sansevieria'],
      nameBn: 'স্নেক প্ল্যান্ট (ইনডোর)',
      nameEn: 'Air-Purifying Snake Plant',
      colorBn: 'হলুদ-সবুজ ধারযুক্ত',
      badgeBn: '২৪ ঘণ্টা অক্সিজেনদায়ী',
      category: 'গৃহস্থ ও ঔষধি গাছ',
      botanicalName: 'Dracaena trifasciata',
      suggestedPrice: 80,
      sunlightBn: 'ঘরের উজ্জ্বল ছায়া বা বারান্দার হালকা আলোতেও দারুণভাবে বেঁচে থাকে',
      wateringBn: 'খুবই কম জল দিন (শীতে ১০–১২ দিনে ও গরমে ৫–৭ দিনে একবার গোড়ার মাটি শুকিয়ে গেলে)',
      soilTipBn: '৪০% বাগানের মাটি, ৪০% মোটা বালি বা পার্লাইট ও ২০% ভার্মিকম্পোস্ট',
      descriptionBn:
        'ঘরের ভেতর বা শোবার ঘরের বাতাস শুদ্ধ রাখতে নাসার গবেষণায় শীর্ষস্থান পাওয়া লো-মেইনটেন্যান্স স্নেক প্ল্যান্ট। এটি রাতেও অক্সিজেন ত্যাগ করে এবং ফর্মালডিহাইড ও বেনজিন জাতীয় দূষিত গ্যাস শোষণ করে।\n\nপানির অভাব বা অবহেলাতেও এটি মাসের পর মাস অক্ষত থাকে। একমাত্র বেশি জল দেওয়াই এর ক্ষতির কারণ হতে পারে। হলুদ বর্ডারযুক্ত শক্ত খাড়া পাতা ঘরের সৌন্দর্যে আধুনিক রূপ যোগ করে।\n\n৬ থেকে ৮ ইঞ্চির টবে বালি প্রধান মাটিতে গাছ বসান। অফিস ডেস্ক, ড্রয়িং রুম কিংবা বেডরুমের কর্নারে রাখার জন্য এটি সেরা ইনডোর প্ল্যান্ট।',
      descriptionEn: 'Ultra-hardy indoor air-purifying Snake Plant releasing oxygen at night with minimal watering and resilient foliage.',
    },
    {
      match: ['কারি', 'কারিপাতা', 'curry leaf'],
      nameBn: 'সুগন্ধি কারিপাতা চারা',
      nameEn: 'Sweet Neem / Curry Leaf',
      colorBn: 'গাঢ় সুগন্ধি সবুজ',
      badgeBn: 'রান্না ও ভেষজ উপকারী',
      category: 'মসলা ও ভেষজ গাছ',
      botanicalName: 'Murraya koenigii',
      suggestedPrice: 50,
      sunlightBn: 'পূর্ণ রোদ (দৈনিক ৪–৬ ঘণ্টা সরাসরি রোদে পাতায় সুগন্ধ বৃদ্ধি পায়)',
      wateringBn: 'মাটির উপরিভাগ শুকালে পরিমিত জল; শিকড়ে কখনোই জল জমতে দেবেন না',
      soilTipBn: '৫০% দোআঁশ মাটি, ৩০% গোবর সার ও ২০% বালি-নিমখোল মিশ্রণ',
      descriptionBn:
        'দক্ষিণী ও বাঙালি রান্নায় ফোড়ন দেওয়া এবং চুলের যত্নে ব্যবহৃত খাঁটি সুগন্ধি কারিপাতা চারা। কচি পাতা ডাল থেকে ছিঁড়লেই তীব্র খাঁটি সুবাসে চারপাশ ভরে যায়।\n\nগাছটির জন্য পর্যাপ্ত রোদ ও খোলা বাতাস প্রয়োজন। ডগা নিয়মিত কেটে নিলে গাছটি লিকলিকে না হয়ে দ্রুত চারদিকে ঝোপালো হয়ে ওঠে। মাঝে মাঝে সামান্য টক দই মেশানো জল গোড়ায় দিলে পাতা দ্রুত বড় ও ঘন সবুজ হয়।\n\n১০ থেকে ১২ ইঞ্চির টবে দোআঁশ মাটি ও গোবর সার মিশিয়ে রোপণ করুন। পোকার আক্রমণ থেকে বাঁচতে প্রতি মাসে একবার নিমতেল স্প্রে করা শ্রেয়।',
      descriptionEn:
        'Aromatic culinary sweet neem sapling producing lush flavorful leaves for daily cooking and natural hair nourishment.',
    },
    {
      match: ['তেজপাতা', 'এলাচ', 'দারুচিনি', 'bay leaf', 'cardamom', 'cinnamon'],
      nameBn:
        qLower.includes('এলাচ') || qLower.includes('cardamom')
          ? 'সুবাসিত এলাচ চারা'
          : qLower.includes('দারুচিনি') || qLower.includes('cinnamon')
          ? 'আসল দারুচিনি চারা'
          : 'সুগন্ধি তেজপাতা চারা',
      nameEn:
        qLower.includes('এলাচ') || qLower.includes('cardamom')
          ? 'Green Cardamom Plant'
          : qLower.includes('দারুচিনি') || qLower.includes('cinnamon')
          ? 'True Cinnamon Plant'
          : 'Indian Bay Leaf (Tejpata)',
      colorBn: 'সুগন্ধি সবুজ পাতা',
      badgeBn: 'বাড়ির নিজস্ব মশলা বাগান',
      category: 'মসলা ও ভেষজ গাছ',
      botanicalName:
        qLower.includes('এলাচ') || qLower.includes('cardamom')
          ? 'Elettaria cardamomum'
          : qLower.includes('দারুচিনি') || qLower.includes('cinnamon')
          ? 'Cinnamomum verum'
          : 'Cinnamomum tamala',
      suggestedPrice: 90,
      sunlightBn: 'সকালের নরম রোদ বা আংশিক ছায়াযুক্ত আর্দ্র পরিবেশ',
      wateringBn: 'মাটি হালকা স্যাঁতসেঁতে রাখুন, তবে টবের ড্রেনেজ দিয়ে অতিরিক্ত জল বের করে দিন',
      soilTipBn: '৫০% লাল দোআঁশ মাটি, ৩০% ভার্মিকম্পোস্ট ও ২০% বালি-পাতা পচা সার',
      descriptionBn:
        'বাড়ির ছাদ বা উঠোনেই খাঁটি মশলা ফলানোর জন্য বাছাইকৃত পুষ্ট চারা। পাতা ঘষলেই প্রাকৃতিক তীব্র মশলার সুবাস পাওয়া যায়। গৃহস্থের রান্নায় টাটকা মশলার পাতা ব্যবহারের আনন্দই আলাদা।\n\nগাছটি সরাসরি তীব্র খরতাপের চেয়ে আংশিক ছায়া ও আর্দ্রতা বেশি পছন্দ করে। গ্রীষ্মকালে গাছের পাতায় জল স্প্রে করলে সতেজ থাকে। শীতে গাছের বৃদ্ধি কিছুটা ধীর হলেও নিয়মিত জৈব পুষ্টি দিলে গাছ দীর্ঘজীবী হয়।\n\n১২ থেকে ১৪ ইঞ্চির টবে পাতা-পচা সার সমৃদ্ধ দোআঁশ মাটিতে গাছ লাগান। রাসায়নিক সার ছাড়াই গাছটি প্রাকৃতিক সুবাসে ভরপুর থাকে।',
      descriptionEn:
        'Authentic kitchen garden culinary spice sapling producing aromatic fresh leaves with rich natural essential oils.',
    },
    {
      match: ['পাম', 'এরিকা', 'মানি প্ল্যান্ট', 'ব্যাম্বু', 'ক্রোটন', 'palm', 'areca', 'money plant', 'bamboo', 'croton'],
      nameBn:
        qLower.includes('মানি') || qLower.includes('money')
          ? 'গোল্ডেন মানি প্ল্যান্ট'
          : qLower.includes('ব্যাম্বু') || qLower.includes('bamboo')
          ? 'লাকি ব্যাম্বু চারা'
          : qLower.includes('ক্রোটন') || qLower.includes('croton')
          ? 'রঙ্গিন পাতাবাহার (ক্রোটন)'
          : 'এরিকা পাম চারা',
      nameEn:
        qLower.includes('মানি') || qLower.includes('money')
          ? 'Golden Pothos Money Plant'
          : qLower.includes('ব্যাম্বু') || qLower.includes('bamboo')
          ? 'Lucky Bamboo'
          : qLower.includes('ক্রোটন') || qLower.includes('croton')
          ? 'Colorful Croton'
          : 'Areca Palm',
      colorBn: 'আকর্ষণীয় সবুজ / পাতাবাহার',
      badgeBn: 'ঘর ও বারান্দার সৌন্দর্য',
      category: 'গাছপালা ও শো-প্ল্যান্ট',
      botanicalName:
        qLower.includes('মানি') || qLower.includes('money')
          ? 'Epipremnum aureum'
          : qLower.includes('ব্যাম্বু') || qLower.includes('bamboo')
          ? 'Dracaena sanderiana'
          : qLower.includes('ক্রোটন') || qLower.includes('croton')
          ? 'Codiaeum variegatum'
          : 'Dypsis lutescens',
      suggestedPrice: 80,
      sunlightBn: 'উজ্জ্বল পরোক্ষ আলো বা সকালের হালকা নরম রোদ (কড়া রোদ এড়িয়ে চলুন)',
      wateringBn: 'মাটির উপরিভাগ ১ ইঞ্চি শুকিয়ে এলে পরিমিত জল দিন; পাতায় জল স্প্রে করা উপকারী',
      soilTipBn: '৪০% দোআঁশ মাটি, ৩০% কোকোপিট, ২০% ভার্মিকম্পোস্ট ও ১০% বালি',
      descriptionBn:
        'ঘর, বসার ঘর, অফিস ডেকোরেশন বা বারান্দার নান্দনিক শোভা বাড়াতে আদর্শ পুষ্ট শো-প্ল্যান্ট। এর স্বাস্থ্যোজ্জ্বল পাতা ঘরের রুচিশীল সৌন্দর্য বহুগুণ বাড়িয়ে তোলে এবং অভ্যন্তরীণ বাতাসকে সতেজ ও প্রাণবন্ত রাখে।\n\nকড়া দুপুরের সরাসরি রোদ পাতার ক্ষতি করতে পারে, তাই উজ্জ্বল পরোক্ষ আলো বা বারান্দার হালকা সকালের রোদ এর জন্য সেরা। নিয়মিত ভেজা কাপড় দিয়ে পাতার ধুলো মুছে দিলে পাতার চকচকে ভাব বজায় থাকে।\n\n৮ থেকে ১০ ইঞ্চির সুন্দর টবে কোকোপিট ও দোআঁশ মাটির হালকা মিশ্রণে রোপণ করুন। মাসে একবার পাতলা তরল জৈব সার দিলে সারাবছর ঘন সবুজ ও দৃষ্টিনন্দন থাকে।',
      descriptionEn:
        'Ornamental indoor and patio foliage specimen prized for tropical aesthetics and clean biophilic air.',
    },
  ];

  const matched = NURSERY_ENCYCLOPEDIA.find((item) =>
    item.match.some((kw) => qLower.includes(kw.toLowerCase()))
  );

  const isDescOnly = mode === 'description_only';

  if (matched) {
    const noteText = customInstruction ? `\n\nবিশেষ নির্দেশনা: ${customInstruction}।` : '';
    return {
      nameBn: isDescOnly && existingPlant?.nameBn ? existingPlant.nameBn : matched.nameBn,
      nameEn: isDescOnly && existingPlant?.nameEn ? existingPlant.nameEn : matched.nameEn,
      colorBn: isDescOnly && existingPlant?.colorBn ? existingPlant.colorBn : matched.colorBn,
      badgeBn: matched.badgeBn,
      category: isDescOnly && existingPlant?.category ? existingPlant.category : matched.category,
      botanicalName: matched.botanicalName,
      suggestedPrice:
        isDescOnly && Number(existingPlant?.currentPrice)
          ? Number(existingPlant.currentPrice)
          : matched.suggestedPrice,
      sunlightBn: matched.sunlightBn,
      wateringBn: matched.wateringBn,
      soilTipBn: matched.soilTipBn,
      descriptionBn: `${matched.descriptionBn}${noteText}`,
      descriptionEn: matched.descriptionEn,
    };
  }

  let wikiExtract = '';
  let wikiTitle = '';
  try {
    const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
      `${q} plant`
    )}&prop=extracts&exintro=1&explaintext=1&exchars=240&format=json&origin=*`;
    const wikiRes = await fetch(wikiUrl, {
      headers: { 'User-Agent': 'BrahmyamanNurseryBot/1.0' },
      signal: AbortSignal.timeout(2500),
    });
    if (wikiRes.ok) {
      const wData = await wikiRes.json();
      const pages = wData?.query?.pages ? Object.values(wData.query.pages) : [];
      wikiExtract = ((pages[0] as any)?.extract || '').trim();
      wikiTitle = ((pages[0] as any)?.title || '').trim();
    }
  } catch {}

  const inferredCategory = inferNurseryCategory(q);
  const displayName = isDescOnly && existingPlant?.nameBn ? existingPlant.nameBn : q;
  const customSuffix = customInstruction ? `\n\nবিশেষ নির্দেশনা: ${customInstruction}।` : '';

  let dynamicBadgeBn = 'কালশুলির সেরা চারা';
  let dynamicSunlightBn = 'দিনে অন্তত ৫–৬ ঘণ্টা খোলা রোদ বা উজ্জ্বল বারান্দা';
  let dynamicWateringBn = 'মাটির উপরিভাগ হালকা শুকিয়ে এলে সকালে বা বিকালে পরিমিত জল দিন; টবে জল জমতে দেবেন না';
  let dynamicSoilTipBn = '৫০% বাঁকুড়ার লাল দোআঁশ মাটি, ৩০% ভার্মিকম্পোস্ট বা পচা গোবর সার ও ২০% বালি-নিমখোল';
  let dynamicPrice = 60;
  let dynamicDescBn = '';

  if (inferredCategory === 'ছাদবাগানের ফল ও কলম') {
    dynamicBadgeBn = 'ছাদবাগানের পুষ্ট কলম';
    dynamicSunlightBn = 'পূর্ণ রোদ (দৈনিক ৬ ঘণ্টা সরাসরি ছাদের সূর্যালোক আবশ্যক)';
    dynamicWateringBn = 'মাটি শুকিয়ে এলে পরিমিত জল দিন; মুকুল ও ফুল আসার সময় অতিরিক্ত জল এড়িয়ে চলুন';
    dynamicSoilTipBn = '৬০% লাল দোআঁশ মাটি, ২৫% ভার্মিকম্পোস্ট, ১০% মোটা বালি ও ৫% হাড়গুঁড়ো-নিমখোল';
    dynamicPrice = 110;
    dynamicDescBn = `${displayName} কালশুলি, বাঁকুড়ার নার্সারিতে বিশেষভাবে প্রস্তুতকৃত শিকড়-সুস্থ ও রোগমুক্ত উন্নত জাতের ফল গাছের চারা। ছাদবাগান, বারান্দার বড় ড্রাম কিংবা উঠোনের বাগানে দ্রুত মানিয়ে নেওয়ার উপযোগী জিনগত গুণসম্পন্ন এই চারা অল্প বয়সেই সতেজ শাখা-প্রশাখা মেলে ধরে।\n\nবাঁকুড়ার তীব্র গ্রীষ্মকালীন উষ্ণতা (৩৮°-৪২° সে.) ও শুষ্ক লাল মাটির আবহাওয়ায় এটি দারুণ সহনশীল। বৈশাখ-জ্যৈষ্ঠে নিয়মিত সেচ দিন এবং ফল বা মুকুল আসার সময় গোড়ায় খড় দিয়ে মালচিং করলে মাটির আর্দ্রতা বজায় থাকে। বর্ষাকালে ড্রেনেজ ব্যবস্থার দিকে নজর রাখুন যাতে গোড়ায় জল জমে শিকড় পচন না ঘটে, এবং প্রতি মাসে একবার জৈব নিমতেল স্প্রে করুন।\n\nছাদে চাষের জন্য অন্তত ১৪ থেকে ১৮ ইঞ্চির বড় টব বা হাফ-ড্রাম ব্যবহার করুন। ৬০% লাল দোআঁশ মাটি, ২৫% ভার্মিকম্পোস্ট, ১০% বালি এবং ৫% হাড়গুঁড়ো-নিমখোল দিয়ে মাটির পুষ্টিকর ভিত্তি তৈরি করুন। বছরে দুইবার বর্ষার আগে ও শীতে জৈব সার প্রয়োগ করলে গাছটি প্রচুর মিষ্টি ও পুষ্টিকর ফলনে ভরে উঠবে।${customSuffix}`;
  } else if (inferredCategory === 'পূজার ফুল ও পবিত্র গাছ') {
    dynamicBadgeBn = 'নিত্য পূজার পবিত্র ফুল';
    dynamicSunlightBn = 'সকাল থেকে দুপুরের উজ্জ্বল রোদ (দিনে ৪–৫ ঘণ্টা সূর্যালোক)';
    dynamicWateringBn = 'প্রতিদিন সকালে পরিমিত জল দিন; গোড়ায় জল জমতে দেবেন না';
    dynamicSoilTipBn = '৫০% দোআঁশ মাটি, ৩০% পচা গোবর বা কম্পোস্ট ও ২০% বালি-নিমখোল';
    dynamicPrice = 50;
    dynamicDescBn = `${displayName} সনাতন গৃহস্থের নিত্য পূজা ও দেব-দেবীর আরাধনার জন্য অপরিহার্য পবিত্র পুষ্পবৃক্ষের পুষ্ট চারা। সতেজ পাতা ও প্রচুর কুঁড়ি ধারণের ক্ষমতাসম্পন্ন এই চারা ঘরের উঠোন বা ছাদবাগানে এক শান্ত ও আধ্যাত্মিক পরিবেশ তৈরি করে।\n\nগাছটির জন্য সকালের নরম সূর্যালোক অত্যন্ত ফলপ্রসূ। বাঁকুড়ার খরার দিনে নিয়মিত সকাল-বিকাল গোড়ার আর্দ্রতা বুঝে জল দিন। ফুল ফোটার মরশুমে শুকনো ফুল ও বোঁটা কেটে দিলে গাছে দ্রুত নতুন কুঁড়ির জোয়ার আসে। বর্ষার আর্দ্রতায় ছত্রাক সংক্রমণ ঠেকাতে মাসে একবার নিমতেল বা সামান্য হলুদ জল স্প্রে করুন।\n\n১০ থেকে ১২ ইঞ্চির মাটির টবে ৫০% দোআঁশ মাটি, ৩০% ভার্মিকম্পোস্ট বা পচা গোবর সার এবং ২০% বালি-নিমখোল মিশিয়ে গাছ রোপণ করুন। প্রতি ১৫ দিনে একবার হালকা খোল পচা জল দিলে সারা বছর সতেজ ফুলে গাছ ভরে থাকবে।${customSuffix}`;
  } else if (inferredCategory === 'ছাদ ও বারান্দার ফুল') {
    dynamicBadgeBn = 'রোদসহনশীল থোকা ফুল';
    dynamicSunlightBn = 'পূর্ণ রোদ (দিনে ৫–৬ ঘণ্টা রোদে ফুলের রং ও কুঁড়ি বৃদ্ধি পায়)';
    dynamicWateringBn = 'মাটি শুকিয়ে এলে পরিমিত জল দিন; ফুল ফোটার সময় পাতায় জল ছিটাবেন না';
    dynamicSoilTipBn = '৫০% লাল দোআঁশ মাটি, ৩০% ভার্মিকম্পোস্ট, ১০% বালি ও ১০% হাড়গুঁড়ো-নিমখোল';
    dynamicPrice = 60;
    dynamicDescBn = `${displayName} ছাদবাগান ও বারান্দা রঙিন ফুলে সাজিয়ে তোলার জন্য নির্বাচিত উৎকৃষ্ট জাতের সতেজ ফুল চারা। এর সুষম কান্ড ও বহু-শাখা বিস্তার গাছে থোকায় থোকায় উজ্জ্বল ফুল ফোটাতে সাহায্য করে, যা দূর থেকেই দৃষ্টি কাড়ে।\n\nবাঁকুড়ার প্রখর রোদ সহ্য করে এই গাছ প্রচুর ফুল দেয়। গ্রীষ্মের তীব্র তাপে নিয়মিত সেচ নিশ্চিত করুন, তবে টবের ড্রেনেজ হোল দিয়ে অতিরিক্ত জল যেন অনায়াসে বেরিয়ে যায়। ফুল ফোটা শেষ হলে হালকা প্রুনিং বা ডগা ছাঁটাই করে দিলে নতুন ডালপালায় আরও বেশি কুঁড়ি জন্মায়।\n\n৮ থেকে ১০ ইঞ্চির টবে ৫০% দোআঁশ মাটি, ৩০% ভার্মিকম্পোস্ট এবং ২০% বালি-হাড়গুঁড়ো মিশিয়ে রোপণ করুন। শীত ও বসন্তে প্রতি সপ্তাহে সরিষার খোল পচা তরল জৈব সার দিলে ফুলের আকার বড় ও দীর্ঘস্থায়ী হয়।${customSuffix}`;
  } else if (inferredCategory === 'গাছপালা ও শো-প্ল্যান্ট') {
    dynamicBadgeBn = 'ঘর ও বারান্দার সৌন্দর্য';
    dynamicSunlightBn = 'উজ্জ্বল পরোক্ষ আলো বা সকালের ২–৩ ঘণ্টা হালকা নরম রোদ';
    dynamicWateringBn = 'মাটির উপরিভাগ ১ ইঞ্চি শুকালে পরিমিত জল দিন; অতিরিক্ত জল পরিহার করুন';
    dynamicSoilTipBn = '৪০% দোআঁশ মাটি, ৩০% কোকোপিট, ২০% ভার্মিকম্পোস্ট ও ১০% পার্লাইট/বালি';
    dynamicPrice = 80;
    dynamicDescBn = `${displayName} ঘর, ড্রয়িং রুম, অফিস ডেস্ক কিংবা বারান্দার সৌন্দর্য বহুগুণ বৃদ্ধি করতে আদর্শ ঝোপালো শো-প্ল্যান্ট। এর চকচকে ও আকর্ষণীয় পাতা ঘরের পরিবেশকে প্রাণবন্ত করে তোলে এবং বিষাক্ত গ্যাস শোষণ করে বাতাস নির্মল রাখে।\n\nকড়া দুপুরের রোদ এড়িয়ে উজ্জ্বল পরোক্ষ আলোতে রাখলে পাতার রঙ ও উজ্জ্বলতা সবচেয়ে ভালো থাকে। শীতকালে জল দেওয়ার পরিমাণ কমিয়ে দিন এবং গ্রীষ্মে মাঝে মাঝে পাতায় জল স্প্রে করলে পাতার তরতাজা ভাব বজায় থাকে।\n\n৮ থেকে ১০ ইঞ্চির ছিদ্রযুক্ত টবে কোকোপিট সমৃদ্ধ হালকা মাটিতে গাছ লাগান। নিয়মিত পাতার ধুলোবালি মুছে দিলে গাছটি সুস্থ ও রোগমুক্ত থাকে।${customSuffix}`;
  } else if (inferredCategory === 'মসলা ও ভেষজ গাছ') {
    dynamicBadgeBn = 'খাঁটি রান্নার সুবাস';
    dynamicSunlightBn = 'সকালের ৪–৫ ঘণ্টা উজ্জ্বল সূর্যালোক';
    dynamicWateringBn = 'মাটি হালকা আর্দ্র রাখুন; শিকড়ে যাতে জল জমে না থাকে';
    dynamicSoilTipBn = '৫০% দোআঁশ মাটি, ৩০% গোবর সার বা কম্পোস্ট ও ২০% বালি-নিমখোল';
    dynamicPrice = 70;
    dynamicDescBn = `${displayName} রান্নায় তাজা সুবাস ও ঘরোয়া আয়ুর্বেদিক প্রয়োজনে ব্যবহারের জন্য খাঁটি জাতের মশলা চারা। বাড়িতে নিজের হাতে ফলানো এই ভেষজ চারা থেকে খাঁটি স্বাস্থ্যকর উপাদান পাওয়া যায়।\n\nগাছটির জন্য সকালের রোদ ও আলো-বাতাসযুক্ত জায়গা অত্যন্ত অনুকূল। নিয়মিত ডগা ছাঁটাই করলে গাছটি লম্বালম্বি না বেড়ে চারদিকে প্রচুর শাখা-প্রশাখা ছড়ায়। রাসায়নিক সারের পরিবর্তে জৈব সার দিলে পাতার প্রাকৃতিক ঔষধি গুণ ও সুবাস অক্ষুণ্ণ থাকে।\n\n১০ থেকে ১২ ইঞ্চির টবে দোআঁশ মাটি ও ভার্মিকম্পোস্ট মিশিয়ে গাছ প্রতিপালন করুন।${customSuffix}`;
  } else {
    dynamicBadgeBn = 'ঘরোয়া ঔষধি গুণ';
    dynamicSunlightBn = 'উজ্জ্বল পরোক্ষ আলো বা সকালের রোদ';
    dynamicWateringBn = 'মাটি শুকিয়ে গেলে পরিমিত জল দিন; কম জলে ভালো থাকে';
    dynamicSoilTipBn = '৪০% দোআঁশ মাটি, ৪০% মোটা বালি ও ২০% ভার্মিকম্পোস্ট';
    dynamicPrice = 60;
    dynamicDescBn = `${displayName} ঘরোয়া প্রাথমিক চিকিৎসা, রোগ প্রতিরোধ ও বাতাস বিশুদ্ধকরণের অসাধারণ ক্ষমতাসম্পন্ন প্রাকৃতিক ঔষধি চারা। প্রাচীন আয়ুর্বেদিক গুণে সমৃদ্ধ এই গাছ বাড়িতে থাকা অত্যন্ত কল্যাণকর।\n\nখুবই কম যত্ন ও অল্প পরিচর্যাতেই গাছটি বেঁচে থাকে। অতিরিক্ত জল দেওয়া থেকে বিরত থাকুন এবং টবের মাটি শুকিয়ে এলে তবেই জল দিন।\n\n৮ থেকে ১০ ইঞ্চির টবে বালি প্রধান মাটিতে গাছ রোপণ করুন। কোনো রাসায়নিক সার ছাড়াই গাছটি দীর্ঘকাল সতেজ থাকে।${customSuffix}`;
  }

  return {
    nameBn: displayName,
    nameEn: (isDescOnly && existingPlant?.nameEn) || wikiTitle || q,
    colorBn: (isDescOnly && existingPlant?.colorBn) || 'বাছাইকৃত সতেজ জাত',
    badgeBn: dynamicBadgeBn,
    category: isDescOnly && existingPlant?.category ? existingPlant.category : inferredCategory,
    botanicalName: (isDescOnly && existingPlant?.botanicalName) || wikiTitle || 'Nursery cultivar specimen',
    suggestedPrice:
      isDescOnly && Number(existingPlant?.currentPrice)
        ? Number(existingPlant.currentPrice)
        : dynamicPrice,
    sunlightBn: dynamicSunlightBn,
    wateringBn: dynamicWateringBn,
    soilTipBn: dynamicSoilTipBn,
    descriptionBn: dynamicDescBn,
    descriptionEn:
      wikiExtract ||
      `${displayName} is a healthy, nursery-conditioned botanical specimen suited for rooftop containers and Bankura red laterite garden soil.`,
  };
}
