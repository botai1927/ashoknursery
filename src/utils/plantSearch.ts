import { BrahmyamanPlant } from '../types/nursery';

export type CategoryViewKey = 'all' | 'fruit' | 'puja' | 'flower' | 'foliage' | 'herbal';

// Phonetic & Bilingual synonym dictionary so customers typing in English, Benglish, or Bengali
// always find the exact matching plant at #1 without digging through unrelated results.
const PHONETIC_SYNONYMS: Record<string, string[]> = {
  aam: ['আম', 'mango', 'আম্রপালী', 'হিমসাগর', 'কাটিমন', 'amrapali', 'katimon'],
  mango: ['আম', 'আম্রপালী', 'হিমসাগর', 'কাটিমন', 'amrapali', 'katimon'],
  lebu: ['লেবু', 'lemon', 'কাগজি', 'পাতি', 'গন্ধরাজ', 'kagzi'],
  lemon: ['লেবু', 'কাগজি', 'পাতি', 'kagzi'],
  joba: ['জবা', 'hibiscus', 'রক্তজবা', 'পঞ্চমুখী'],
  jaba: ['জবা', 'hibiscus', 'রক্তজবা'],
  hibiscus: ['জবা', 'রক্তজবা'],
  golap: ['গোলাপ', 'rose', 'কাশ্মীরি'],
  rose: ['গোলাপ', 'কাশ্মীরি'],
  tulsi: ['তুলসী', 'কৃষ্ণ তুলসী', 'রাম তুলসী'],
  tulshi: ['তুলসী', 'কৃষ্ণ তুলসী'],
  bel: ['বেল', 'বেলপাতা', 'বিল্বপত্র', 'bael'],
  belpata: ['বেল', 'বেলপাতা', 'বিল্বপত্র', 'bael'],
  bael: ['বেল', 'বেলপাতা', 'বিল্বপত্র'],
  peyara: ['পেয়ারা', 'পেয়ারা', 'guava', 'থাই'],
  guava: ['পেয়ারা', 'পেয়ারা'],
  dalim: ['ডালিম', 'বেদানা', 'pomegranate'],
  bedana: ['ডালিম', 'বেদানা', 'pomegranate'],
  pomegranate: ['ডালিম', 'বেদানা'],
  padma: ['পদ্ম', 'lotus', 'স্থলপদ্ম'],
  lotus: ['পদ্ম', 'স্থলপদ্ম'],
  aparajita: ['অপরাজিতা', 'নীলকণ্ঠ'],
  shiuli: ['শিউলি', 'পারিজাত'],
  sheuli: ['শিউলি', 'পারিজাত'],
  ganda: ['গাঁদা', 'marigold'],
  gada: ['গাঁদা', 'marigold'],
  marigold: ['গাঁদা'],
  kola: ['কলা', 'banana', 'g9'],
  banana: ['কলা'],
  jam: ['জাম', 'jamun'],
  kathal: ['কাঁঠাল', 'jackfruit'],
  ata: ['আতা', 'custard apple'],
  safeda: ['সফেদা', 'sapota'],
  chiku: ['সফেদা', 'sapota'],
  kul: ['কুল', 'ber'],
  baganbilas: ['বাগানবিলাস', 'বোগেনভিলিয়া', 'bougainvillea'],
  bougainvillea: ['বাগানবিলাস', 'বোগেনভিলিয়া'],
  adenium: ['অ্যাডেনিয়াম', 'মরু গোলাপ'],
  chandramallika: ['চন্দ্রমল্লিকা', 'chrysanthemum'],
  rongon: ['রঙ্গন', 'ixora'],
  rangan: ['রঙ্গন', 'ixora'],
  gondhoraj: ['গন্ধরাজ', 'gardenia'],
  neem: ['নিম'],
  nim: ['নিম'],
  pudina: ['পুদিনা', 'mint'],
  karipata: ['কারিপাতা', 'curry'],
  tejpata: ['তেজপাতা', 'bay leaf'],
  elach: ['এলাচ', 'cardamom'],
  daruchini: ['দারুচিনি', 'cinnamon'],
  bamboo: ['ব্যাম্বু', 'bamboo', 'লাকি'],
  snake: ['স্নেক', 'snake'],
  rubber: ['রাবার', 'rubber'],
  aloe: ['অ্যালোভেরা', 'ঘৃতকুমারী', 'aloe'],
  camellia: ['ক্যামেলিয়া', 'ক্যামেলিয়ান', 'camellia'],
  rhapis: ['র‍্যাফিস', 'পাম', 'rhapis'],
  jade: ['সাকুলেন্ট', 'জেড', 'jade'],
};

// Classification helpers shared across search & catalog tabs
export function isFruitPlant(p: BrahmyamanPlant): boolean {
  const name = `${p.nameBn} ${p.nameEn} ${p.category} ${p.botanicalName}`.toLowerCase();
  return (
    p.category === 'ছাদবাগানের ফল ও কলম' ||
    name.includes('আম') ||
    name.includes('mango') ||
    name.includes('লেবু') ||
    name.includes('lemon') ||
    name.includes('পেয়ারা') ||
    name.includes('পেয়ারা') ||
    name.includes('guava') ||
    name.includes('কলা') ||
    name.includes('banana') ||
    name.includes('ডালিম') ||
    name.includes('বেদানা') ||
    name.includes('pomegranate') ||
    name.includes('জাম') ||
    name.includes('jamun') ||
    name.includes('কাঁঠাল') ||
    name.includes('jackfruit') ||
    name.includes('আতা') ||
    name.includes('custard') ||
    name.includes('সফেদা') ||
    name.includes('sapota') ||
    name.includes('কুল') ||
    name.includes('বেয়ার') ||
    name.includes('কলম') ||
    name.includes('graft')
  );
}

export function isPoojaPlant(p: BrahmyamanPlant): boolean {
  if (isFruitPlant(p)) return false;
  const name = `${p.nameBn} ${p.nameEn} ${p.category} ${p.botanicalName}`.toLowerCase();
  return (
    p.category === 'পূজার ফুল ও পবিত্র গাছ' ||
    p.audience.includes('puja') ||
    name.includes('তুলসী') ||
    name.includes('tulsi') ||
    name.includes('বেল') ||
    name.includes('বিল্বপত্র') ||
    name.includes('bael') ||
    name.includes('অপরাজিতা') ||
    name.includes('aparajita') ||
    name.includes('শিউলি') ||
    name.includes('shiuli') ||
    name.includes('পদ্ম') ||
    name.includes('lotus') ||
    name.includes('রক্তজবা') ||
    name.includes('শিব জটা')
  );
}

export function isHerbalPlant(p: BrahmyamanPlant): boolean {
  if (isFruitPlant(p) || isPoojaPlant(p)) return false;
  const name = `${p.nameBn} ${p.nameEn} ${p.category} ${p.botanicalName}`.toLowerCase();
  return (
    p.category === 'মসলা ও ভেষজ গাছ' ||
    p.audience.includes('herbal') ||
    name.includes('দারুচিনি') ||
    name.includes('cinnamon') ||
    name.includes('এলাচ') ||
    name.includes('cardamom') ||
    name.includes('তেজপাতা') ||
    name.includes('bay leaf') ||
    name.includes('কারিপাতা') ||
    name.includes('curry') ||
    name.includes('পুদিনা') ||
    name.includes('mint') ||
    name.includes('নিম') ||
    name.includes('neem') ||
    name.includes('থানকুনি') ||
    name.includes('বাসক') ||
    name.includes('কালোমেঘ') ||
    name.includes('ঘৃতকুমারী') ||
    name.includes('অ্যালোভেরা') ||
    name.includes('aloe')
  );
}

export function isFlowerPlant(p: BrahmyamanPlant): boolean {
  if (isFruitPlant(p) || isPoojaPlant(p) || isHerbalPlant(p)) return false;
  const name = `${p.nameBn} ${p.nameEn} ${p.category} ${p.botanicalName}`.toLowerCase();
  return (
    p.category === 'ছাদ ও বারান্দার ফুল' ||
    p.audience.includes('flower') ||
    name.includes('গোলাপ') ||
    name.includes('rose') ||
    name.includes('জবা') ||
    name.includes('hibiscus') ||
    name.includes('বাগানবিলাস') ||
    name.includes('বোগেনভিলিয়া') ||
    name.includes('bougainvillea') ||
    name.includes('অ্যাডেনিয়াম') ||
    name.includes('adenium') ||
    name.includes('চন্দ্রমল্লিকা') ||
    name.includes('chrysanthemum') ||
    name.includes('গাঁদা') ||
    name.includes('marigold') ||
    name.includes('রঙ্গন') ||
    name.includes('ixora') ||
    name.includes('টিকোমা') ||
    name.includes('তেকোমা') ||
    name.includes('সালভিয়া') ||
    name.includes('ক্যামেলিয়া') ||
    name.includes('ক্যামেলিয়ান') ||
    name.includes('স্থলপদ্ম') ||
    name.includes('মুসান্ডা') ||
    name.includes('গন্ধরাজ') ||
    name.includes('মালতি') ||
    name.includes('গজনিয়া') ||
    name.includes('ডালিয়া')
  );
}

export function isFoliagePlant(p: BrahmyamanPlant): boolean {
  return !isFruitPlant(p) && !isPoojaPlant(p) && !isHerbalPlant(p) && !isFlowerPlant(p);
}

export function detectCategoryIntent(rawQuery: string): CategoryViewKey | null {
  const raw = rawQuery.trim().toLowerCase();
  if (!raw) return null;

  const fruitTerms = ['fruit', 'fruits', 'ফল', 'ফলের গাছ', 'ফলের চারা', 'কলম', 'graft', 'orchard'];
  const pujaTerms = ['puja', 'pooja', 'পূজা', 'পূজার ফুল', 'পুজোর', 'পবিত্র'];
  const flowerTerms = ['flower', 'flowers', 'phool', 'ফুল', 'ফুলগাছ', 'ফুলের চারা'];
  const foliageTerms = ['foliage', 'show plant', 'showplant', 'শো-প্ল্যান্ট', 'পাম', 'palm', 'indoor', 'পাতাবাহার'];
  const herbalTerms = ['spice', 'spices', 'herbal', 'masala', 'মসলা', 'ভেষজ'];

  if (fruitTerms.some((t) => raw === t || raw.includes(t))) return 'fruit';
  if (pujaTerms.some((t) => raw === t || raw.includes(t))) return 'puja';
  if (flowerTerms.some((t) => raw === t || raw.includes(t))) return 'flower';
  if (foliageTerms.some((t) => raw === t || raw.includes(t))) return 'foliage';
  if (herbalTerms.some((t) => raw === t || raw.includes(t))) return 'herbal';
  return null;
}

export interface SearchAnalysisResult {
  isSearching: boolean;
  categoryTarget: CategoryViewKey | null;
  results: BrahmyamanPlant[];
}

export function searchAndRankPlants(plants: BrahmyamanPlant[], query: string): SearchAnalysisResult {
  const raw = query.trim().toLowerCase();
  if (!raw) {
    return { isSearching: false, categoryTarget: null, results: [] };
  }

  const detectedCategory = detectCategoryIntent(raw);

  // Build expanded token list from direct tokens + phonetic dictionary matches
  const tokens = raw.split(/\s+/).filter(Boolean);
  const expandedTerms = new Set<string>([raw, ...tokens]);

  for (const token of tokens) {
    if (PHONETIC_SYNONYMS[token]) {
      PHONETIC_SYNONYMS[token].forEach((syn) => expandedTerms.add(syn.toLowerCase()));
    }
    // Partial prefix match against dictionary keys (minimum 2 chars so "go" matches "golap", "jo" matches "joba")
    if (token.length >= 2) {
      for (const [key, syns] of Object.entries(PHONETIC_SYNONYMS)) {
        if (key.startsWith(token)) {
          syns.forEach((syn) => expandedTerms.add(syn.toLowerCase()));
        }
      }
    }
  }

  const scored: Array<{ plant: BrahmyamanPlant; score: number }> = [];

  for (const plant of plants) {
    const nameBn = (plant.nameBn || '').toLowerCase();
    const nameEn = (plant.nameEn || '').toLowerCase();
    const botanical = (plant.botanicalName || '').toLowerCase();
    const category = (plant.category || '').toLowerCase();
    const color = (plant.colorBn || '').toLowerCase();
    const badge = `${plant.badgeBn || ''} ${plant.badgeEn || ''}`.toLowerCase();
    const desc = `${plant.descriptionBn || ''} ${plant.descriptionEn || ''}`.toLowerCase();

    let score = 0;

    // 1. Direct query match against primary titles
    if (nameBn === raw || nameEn === raw) {
      score += 140;
    } else if (nameBn.startsWith(raw) || nameEn.startsWith(raw)) {
      score += 110;
    } else if (nameBn.includes(raw) || nameEn.includes(raw)) {
      score += 85;
    }

    // 2. Phonetic/synonym match on primary titles & botanical names
    for (const term of expandedTerms) {
      if (term === raw) continue;
      if (nameBn.startsWith(term) || nameEn.startsWith(term)) {
        score = Math.max(score, 90);
      } else if (nameBn.includes(term) || nameEn.includes(term)) {
        score = Math.max(score, 72);
      } else if (color.includes(term) || botanical.includes(term) || badge.includes(term)) {
        score = Math.max(score, 50);
      }
    }

    // 3. Direct query on color / botanical / category / description
    if (color.includes(raw) || botanical.includes(raw) || badge.includes(raw)) {
      score += 45;
    }
    if (category.includes(raw)) {
      score += 32;
    }
    if (desc.includes(raw)) {
      score += 18;
    }

    // 4. Category-level query intent (e.g., "ফলের গাছ", "puja", "flower")
    if (score === 0 && detectedCategory) {
      if (detectedCategory === 'fruit' && isFruitPlant(plant)) score += 30;
      else if (detectedCategory === 'puja' && isPoojaPlant(plant)) score += 30;
      else if (detectedCategory === 'flower' && isFlowerPlant(plant)) score += 30;
      else if (detectedCategory === 'foliage' && isFoliagePlant(plant)) score += 30;
      else if (detectedCategory === 'herbal' && isHerbalPlant(plant)) score += 30;
    }

    if (score > 0) {
      // Slight preference to in-stock plants in tie-breaks
      if (plant.inStock !== false) score += 5;
      scored.push({ plant, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);

  return {
    isSearching: true,
    categoryTarget: detectedCategory,
    results: scored.map((s) => s.plant),
  };
}

export interface SearchHighlightSegment {
  text: string;
  matched: boolean;
}

function expandSearchHighlightTerms(query: string): string[] {
  const raw = query.trim().toLowerCase();
  if (!raw) return [];
  const tokens = raw.split(/\s+/).filter(Boolean);
  const ordered: string[] = [raw, ...tokens];

  for (const token of tokens) {
    if (PHONETIC_SYNONYMS[token]) {
      ordered.push(...PHONETIC_SYNONYMS[token].map((syn) => syn.toLowerCase()));
    }
    if (token.length >= 2) {
      for (const [key, syns] of Object.entries(PHONETIC_SYNONYMS)) {
        if (key.startsWith(token)) {
          ordered.push(...syns.map((syn) => syn.toLowerCase()));
        }
      }
    }
  }

  // Deduplicate while preserving priority: exact query -> tokens -> primary synonym -> secondary terms
  const seen = new Set<string>();
  return ordered.filter((t) => {
    if (!t || seen.has(t)) return false;
    seen.add(t);
    return true;
  });
}

export function findMatchingHighlightSegments(
  text: string,
  query: string
): SearchHighlightSegment[] {
  if (!text) return [];
  const terms = expandSearchHighlightTerms(query);
  if (terms.length === 0) return [{ text, matched: false }];

  const lower = text.toLowerCase();
  let matchIdx = -1;
  let matchLen = 0;

  for (const term of terms) {
    const idx = lower.indexOf(term);
    if (idx !== -1) {
      matchIdx = idx;
      matchLen = term.length;
      break;
    }
  }

  if (matchIdx === -1 || matchLen === 0) {
    return [{ text, matched: false }];
  }

  const segments: SearchHighlightSegment[] = [];
  if (matchIdx > 0) {
    segments.push({ text: text.slice(0, matchIdx), matched: false });
  }
  segments.push({ text: text.slice(matchIdx, matchIdx + matchLen), matched: true });
  if (matchIdx + matchLen < text.length) {
    segments.push({ text: text.slice(matchIdx + matchLen), matched: false });
  }
  return segments;
}

export function extractCatalogSearchSuggestions(
  plants: BrahmyamanPlant[],
  query: string,
  limit = 8
): { totalMatches: number; suggestions: BrahmyamanPlant[] } {
  const analysis = searchAndRankPlants(plants, query);
  if (!analysis.isSearching) {
    return { totalMatches: 0, suggestions: [] };
  }
  const safeLimit = Math.max(1, Math.min(20, limit));
  return {
    totalMatches: analysis.results.length,
    suggestions: analysis.results.slice(0, safeLimit),
  };
}

