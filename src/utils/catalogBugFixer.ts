import type { BrahmyamanPlant } from '../types/nursery';
import type { RootCauseIssue } from '../components/adminConstants';
import { alignPlantImageSlots } from './cloudinaryCleanup';

const GENERIC_BOILERPLATE_DESCRIPTIONS_BN: ReadonlySet<string> = new Set([
  'কালশুলির নিজস্ব নার্সারিতে তৈরি সুপুষ্ট ও রোগমুক্ত স্বাস্থ্যকর চারা।',
  'কালশুলির নার্সারির বিশেষ স্বাস্থ্যকর চারা।',
  'কালশুলির নিজস্ব নার্সারিতে যত্নে তৈরি প্রচুর কুঁড়ি ও শিকড়যুক্ত সতেজ গোলাপ ফুল চারা।',
  'কালশুলির নিজস্ব নার্সারিতে যত্নে তৈরি প্রচুর কুঁড়ি ও শিকড়যুক্ত সতেজ জবা চারা।',
  'বাঁকুড়ার রোদে জলের পাত্র বা গামলায় প্রচুর ফুল ফোটা পদ্ম ফুল।',
]);

export function buildDescriptionCountMap(activePlants: BrahmyamanPlant[]): Map<string, BrahmyamanPlant[]> {
  const descCountMap = new Map<string, BrahmyamanPlant[]>();
  for (const p of activePlants) {
    const norm = (p.descriptionBn || '').trim();
    if (norm.length > 0) {
      const arr = descCountMap.get(norm) || [];
      arr.push(p);
      descCountMap.set(norm, arr);
    }
  }
  return descCountMap;
}

export function isPlantDescriptionBnDefective(
  plant: BrahmyamanPlant,
  descCountMap: Map<string, BrahmyamanPlant[]>
): { defective: boolean; reason: 'missing_or_short' | 'duplicate' | 'boilerplate' | null } {
  const norm = (plant.descriptionBn || '').trim();
  if (norm.length < 45) {
    return { defective: true, reason: 'missing_or_short' };
  }
  const group = descCountMap.get(norm);
  if (group && group.length > 1) {
    return { defective: true, reason: 'duplicate' };
  }
  if (
    GENERIC_BOILERPLATE_DESCRIPTIONS_BN.has(norm) ||
    norm.endsWith('কালশুলির নার্সারির বিশেষ স্বাস্থ্যকর চারা।')
  ) {
    return { defective: true, reason: 'boilerplate' };
  }
  return { defective: false, reason: null };
}

export function isPlantCareOrEnDefective(plant: BrahmyamanPlant): boolean {
  return (
    !plant.sunlightBn?.trim() ||
    !plant.wateringBn?.trim() ||
    !plant.soilTipBn?.trim() ||
    !plant.botanicalName?.trim() ||
    plant.botanicalName.trim() === 'Specimen variety' ||
    !plant.descriptionEn?.trim() ||
    plant.descriptionEn.includes('Healthy nursery sapling cultivated in Kalsuli') ||
    plant.descriptionEn.trim() ===
      'Fresh, healthy nursery sapling acclimated to Bankura soil and climate.'
  );
}

export function isPlantPriceDefective(plant: BrahmyamanPlant): boolean {
  return (
    !plant.options ||
    plant.options.length === 0 ||
    plant.options.some((o) => !o.price || o.price <= 0)
  );
}

export function analyzeCatalogRootCauseDiagnostics(params: {
  activePlants: BrahmyamanPlant[];
  duplicateImages?: Array<{ url: string; plants: BrahmyamanPlant[] }>;
}): RootCauseIssue[] {
  const { activePlants, duplicateImages = [] } = params;
  const issues: RootCauseIssue[] = [];

  const brokenPricePlants = activePlants.filter(isPlantPriceDefective);
  if (brokenPricePlants.length > 0) {
    issues.push({
      id: 'issue-price',
      severity: 'high',
      titleBn: `${brokenPricePlants.length} টি গাছের দাম বা পাত্রের মাপ অসম্পূর্ণ`,
      whereBn: brokenPricePlants.map((p) => p.nameBn).slice(0, 5).join(', '),
      rootReasonBn:
        'মূল কারণ: চারা সেভ করার সময় বিক্রয়মূল্য শূন্য বা পট সাইজ অপশন খালি ছিল। ফলে ক্রেতারা কার্টে দাম দেখতে পাবেন না ও হোয়াটসঅ্যাপ অর্ডারে বিভ্রান্তি হবে।',
      solutionBn:
        '১-ক্লিকে "বাগ ফিক্স চালান" বোতামে চাপলে স্বয়ংক্রিয়ভাবে ₹৫০ / ₹৯০ মানসম্মত দাম ও গ্রো-ব্যাগ যুক্ত হয়ে যাবে।',
      plantToEdit: brokenPricePlants[0],
      canAutoBugFix: true,
    });
  }

  if (duplicateImages.length > 0) {
    const names = duplicateImages
      .flatMap((g) => g.plants.map((p) => p.nameBn))
      .slice(0, 6)
      .join(', ');
    issues.push({
      id: 'issue-dup-img',
      severity: 'medium',
      titleBn: `${duplicateImages.length} টি গ্রুপে একই ছবি ব্যবহার হয়েছে`,
      whereBn: names,
      rootReasonBn:
        'মূল কারণ: একাধিক আলাদা গাছে ডিফল্ট বা একই ছবি বসানো হয়েছে। ক্রেতারা আসল চারার তফাত বুঝতে না পেরে অর্ডার বাতিল করতে পারেন।',
      solutionBn:
        'প্রতিটি গাছ এডিট করে ক্যামেরা বা অনলাইন ডাটাবেস থেকে আলাদা প্রকৃত ছবি দিন, অথবা অপ্রয়োজনীয় ডুপ্লিকেট ট্র্যাশে পাঠান।',
      plantToEdit: duplicateImages[0]?.plants[1],
    });
  }

  const descCountMap = buildDescriptionCountMap(activePlants);
  const defectiveDescPlants = activePlants.filter(
    (p) => isPlantDescriptionBnDefective(p, descCountMap).defective
  );

  if (defectiveDescPlants.length > 0) {
    const samplePlant = defectiveDescPlants[0];
    const impactedNames = defectiveDescPlants
      .map((p) => (p.colorBn ? `${p.nameBn} (${p.colorBn})` : p.nameBn))
      .filter((v, i, a) => a.indexOf(v) === i)
      .slice(0, 6)
      .join(', ');

    issues.push({
      id: 'issue-desc',
      severity: 'medium',
      titleBn: `${defectiveDescPlants.length} টি চারার ইউনিক বিবরণ ও বৈশিষ্ট্য অসম্পূর্ণ`,
      whereBn: impactedNames,
      rootReasonBn:
        'মূল কারণ: বিবরণ খুব সংক্ষিপ্ত অথবা একাধিক চারায় একই সাধারণ লেখা থাকায় ক্রেতা গাছটির বিশেষ বৈশিষ্ট্য বুঝতে পারছেন না।',
      solutionBn:
        'নিচের "১-ক্লিকে স্বয়ংক্রিয় বাগ ফিক্স চালান" বোতামে চাপলে সব চারার জন্য স্বতন্ত্র ও সম্পূর্ণ বাংলা বিবরণ তৈরি হয়ে যাবে।',
      plantToEdit: samplePlant,
      canAutoBugFix: true,
    });
  }

  const missingCareOrEn = activePlants.filter(isPlantCareOrEnDefective);
  if (missingCareOrEn.length > 0) {
    issues.push({
      id: 'issue-care',
      severity: 'info',
      titleBn: `${missingCareOrEn.length} টি চারায় বিস্তারিত ইংরেজি বিবরণ বা যত্নের টিপস আপগ্রেডযোগ্য`,
      whereBn: missingCareOrEn.map((p) => p.nameBn).slice(0, 5).join(', '),
      rootReasonBn:
        'মূল কারণ: চারাগুলোর ইংরেজি বিবরণ (EN) বা মাটি-জলের টিপস ডিফল্ট টেমপ্লেট হিসেবে রয়ে গেছে।',
      solutionBn:
        'এডিট ফর্ম থেকে অথবা ১-ক্লিক অটো বাগ ফিক্স চালিয়ে ইংরেজি বিবরণ ও যত্নের টিপস আপডেট করুন।',
      plantToEdit: missingCareOrEn[0],
      canAutoBugFix: true,
    });
  }

  const outOfStockPlants = activePlants.filter((p) => p.inStock === false);
  if (outOfStockPlants.length > 0) {
    issues.push({
      id: 'issue-stock',
      severity: 'info',
      titleBn: `${outOfStockPlants.length} টি চারা বর্তমানে "স্টক শেষ" অবস্থায় আছে`,
      whereBn: outOfStockPlants.map((p) => p.nameBn).slice(0, 5).join(', '),
      rootReasonBn:
        'মূল কারণ: স্টক শেষ হিসেবে চিহ্নিত থাকায় ক্রেতারা সরাসরি কার্টে যোগ না করে শুধু হোয়াটসঅ্যাপে জিজ্ঞাসাবাদ করতে পারবেন।',
      solutionBn:
        'নার্সারিতে নতুন চারা এলে ইনভেন্টরি কার্ডের ১-ট্যাপ স্টক বোতামে চেপে পুনরায় "✓ স্টক আছে" চালু করুন।',
    });
  }

  return issues;
}

export interface PlantBugFixItem {
  before: BrahmyamanPlant;
  updated: BrahmyamanPlant;
  fixesForPlant: string[];
}

export interface CatalogBugFixPlan {
  plantsToUpdate: PlantBugFixItem[];
  candidateFixLogs: string[];
}

export function generateUniqueBengaliDescription(
  plant: BrahmyamanPlant,
  usedDescriptions: Set<string>,
  fallbackIndex: number
): string {
  const colorPhrase = plant.colorBn?.trim() ? ` (${plant.colorBn.trim()} জাত)` : '';
  const badgePhrase =
    plant.badgeBn?.trim() && plant.badgeBn.trim() !== plant.colorBn?.trim()
      ? ` — ${plant.badgeBn.trim()}`
      : '';
  const botPhrase =
    plant.botanicalName?.trim() &&
    plant.botanicalName.trim() !== 'Specimen variety' &&
    plant.botanicalName.trim() !== 'Nursery cultivar specimen'
      ? ` [${plant.botanicalName.trim()}]`
      : '';
  const catPhrase = plant.category || 'নার্সারি সংগ্রহ';
  const priceVal = plant.options?.[0]?.price || 50;
  const sunPhrase = plant.sunlightBn?.trim() || 'দিনে ৪–৬ ঘণ্টা উজ্জ্বল রোদ';
  const soilPhrase = plant.soilTipBn?.trim() || 'জৈব সারযুক্ত লাল দোআঁশ মাটি';
  const waterPhrase = plant.wateringBn?.trim() || 'পরিমিত জল';

  let candidate = `${plant.nameBn.trim()}${colorPhrase}${badgePhrase}${botPhrase} হলো আমাদের "${catPhrase}" বিভাগের একটি সতেজ, শিকড়যুক্ত ও রোগমুক্ত চারা (প্রাথমিক মূল্য ₹${priceVal})। বাঁকুড়া ও কালশুলির আবহাওয়ায় টব, ছাদবাগান বা উঠোনে চাষের জন্য আদর্শ; ${sunPhrase}, ${waterPhrase} এবং ${soilPhrase} ব্যবহারে দ্রুত বৃদ্ধি ও চমৎকার ফলন পাওয়া যায়।`;

  if (usedDescriptions.has(candidate)) {
    const enHint = plant.nameEn?.trim() ? ` (${plant.nameEn.trim()})` : '';
    candidate = `${plant.nameBn.trim()}${colorPhrase}${enHint}${badgePhrase}${botPhrase} হলো আমাদের "${catPhrase}" বিভাগের বিশেষ বাছাইকৃত শিকড়যুক্ত চারা (মূল্য ₹${priceVal}, ক্রমিক #${fallbackIndex + 1})। বাঁকুড়া ও কালশুলির আবহাওয়ায় টব বা ছাদবাগানে চাষের জন্য অত্যন্ত উপযোগী; ${sunPhrase} এবং ${soilPhrase} ব্যবহারে সারাবছর সতেজ বৃদ্ধি পাওয়া যায়।`;
  }

  usedDescriptions.add(candidate);
  return candidate;
}

export function buildCatalogBugFixPlan(params: {
  activePlants: BrahmyamanPlant[];
  fallbackImageUrl: string;
  timestampIso: string;
  timestampBn: string;
}): CatalogBugFixPlan {
  const { activePlants, fallbackImageUrl, timestampIso, timestampBn } = params;
  const descCountMap = buildDescriptionCountMap(activePlants);

  // Seed usedDescriptions with all currently valid (non-defective) descriptions
  const usedDescriptions = new Set<string>();
  for (const p of activePlants) {
    const check = isPlantDescriptionBnDefective(p, descCountMap);
    if (!check.defective) {
      usedDescriptions.add((p.descriptionBn || '').trim());
    }
  }

  const plantsToUpdate: PlantBugFixItem[] = [];
  const candidateFixLogs: string[] = [];

  activePlants.forEach((p, idx) => {
    let needsUpdate = false;
    const updated: BrahmyamanPlant = { ...p };
    const fixesForPlant: string[] = [];

    if (isPlantPriceDefective(updated)) {
      updated.options = [
        {
          id: `opt-1-${p.id}`,
          labelBn: 'পলি গ্রো-ব্যাগ চারা',
          labelEn: 'Grow Bag Sapling',
          price: 50,
          containerType: 'পলি গ্রো ব্যাগ',
        },
        {
          id: `opt-2-${p.id}`,
          labelBn: 'মাঝারি সাইজ পরিপুষ্ট চারা',
          labelEn: 'Medium Matured Sapling',
          price: 90,
          containerType: 'মাঝারি গ্রো ব্যাগ',
        },
      ];
      needsUpdate = true;
      fixesForPlant.push(
        `"${p.nameBn}": দাম ও সাইজ ঠিক করা হয়েছে (গ্রো ব্যাগ ₹৫০, পরিপুষ্ট চারা ₹৯০)`
      );
    }

    if (!updated.image || updated.image.trim() === '') {
      updated.image = fallbackImageUrl;
      needsUpdate = true;
      fixesForPlant.push(`"${p.nameBn}": ছবি না থাকায় স্ট্যান্ডার্ড ছবি নির্ধারণ করা হয়েছে`);
    }

    const rawImgs =
      Array.isArray(updated.images) && updated.images.length > 0
        ? updated.images
        : [updated.image];
    const aligned = alignPlantImageSlots(
      rawImgs,
      updated.cloudinaryPublicIds || [],
      updated.image
    );
    if (
      !Array.isArray(updated.images) ||
      updated.images.length === 0 ||
      updated.images[0] !== aligned.primaryImage
    ) {
      updated.image = aligned.primaryImage || updated.image;
      updated.images = aligned.images.length > 0 ? aligned.images : [updated.image];
      updated.cloudinaryPublicIds = aligned.cloudinaryPublicIds;
      needsUpdate = true;
      fixesForPlant.push(`"${p.nameBn}": ছবি ও Cloudinary স্লট সঠিকভাবে সিঙ্ক করা হয়েছে`);
    }

    if (!updated.sunlightBn || updated.sunlightBn.trim() === '') {
      const isIndoorOrHerb =
        updated.category === 'গাছপালা ও শো-প্ল্যান্ট' ||
        updated.category === 'গৃহস্থ ও ঔষধি গাছ';
      updated.sunlightBn = isIndoorOrHerb
        ? 'উজ্জ্বল পরোক্ষ আলো বা সকালের ২–৩ ঘণ্টা নরম রোদ'
        : 'দিনে ৪–৬ ঘণ্টা উজ্জ্বল রোদ বা খোলা ছাদ/বারান্দা';
      needsUpdate = true;
      fixesForPlant.push(`"${p.nameBn}": রোদ ও আলোর নির্দেশিকা যোগ করা হয়েছে`);
    }

    if (!updated.wateringBn || updated.wateringBn.trim() === '') {
      updated.wateringBn = 'মাটি হালকা শুকিয়ে এলে সকালে বা বিকালে পরিমিত জল দিন';
      needsUpdate = true;
      fixesForPlant.push(`"${p.nameBn}": জল দেওয়ার নিয়ম যোগ করা হয়েছে`);
    }

    if (!updated.soilTipBn || updated.soilTipBn.trim() === '') {
      updated.soilTipBn = 'বাঁকুড়ার লাল দোআঁশ মাটি, ভার্মিকম্পোস্ট ও বালি-নিম খোল';
      needsUpdate = true;
      fixesForPlant.push(`"${p.nameBn}": মাটি ও সারের টিপস যোগ করা হয়েছে`);
    }

    if (
      !updated.botanicalName ||
      updated.botanicalName.trim() === '' ||
      updated.botanicalName.trim() === 'Specimen variety'
    ) {
      updated.botanicalName = 'Nursery cultivar specimen';
      needsUpdate = true;
      fixesForPlant.push(`"${p.nameBn}": বৈজ্ঞানিক নাম আপডেট করা হয়েছে`);
    }

    const descCheck = isPlantDescriptionBnDefective(updated, descCountMap);
    if (descCheck.defective) {
      updated.descriptionBn = generateUniqueBengaliDescription(updated, usedDescriptions, idx);
      if (!updated.badgeBn || updated.badgeBn.trim() === '') {
        updated.badgeBn = 'সুস্থ শিকড়যুক্ত চারা';
      }
      needsUpdate = true;
      const reasonLabel =
        descCheck.reason === 'duplicate'
          ? 'ডুপ্লিকেট বিবরণ বদলে স্বতন্ত্র বাংলা বিবরণ'
          : descCheck.reason === 'missing_or_short'
          ? 'সংক্ষিপ্ত বিবরণ সম্প্রসারিত করে সম্পূর্ণ বাংলা বিবরণ'
          : 'সাধারণ বিবরণ বদলে বিশেষায়িত বাংলা বিবরণ';
      fixesForPlant.push(
        `"${p.nameBn}${p.colorBn ? ` (${p.colorBn})` : ''}": ${reasonLabel} যুক্ত করা হয়েছে`
      );
    }

    if (
      !updated.descriptionEn ||
      updated.descriptionEn.trim() === '' ||
      updated.descriptionEn.includes('Healthy nursery sapling cultivated in Kalsuli') ||
      updated.descriptionEn.trim() ===
        'Fresh, healthy nursery sapling acclimated to Bankura soil and climate.'
    ) {
      const cleanEnName = (updated.nameEn || updated.nameBn || 'Nursery Plant').trim();
      const colorEnHint = updated.colorBn ? ` (${updated.colorBn} variety)` : '';
      const catHint = updated.category ? ` in "${updated.category}"` : '';
      const botHint =
        updated.botanicalName && updated.botanicalName !== 'Nursery cultivar specimen'
          ? ` [${updated.botanicalName}]`
          : '';
      updated.descriptionEn = `${cleanEnName}${colorEnHint}${botHint} is a healthy, well-rooted sapling${catHint} conditioned for Bankura laterite soil and home rooftop pots.`;
      needsUpdate = true;
      fixesForPlant.push(`"${p.nameBn}": বিস্তারিত ইংরেজি বিবরণ (EN) আপগ্রেড করা হয়েছে`);
    }

    if (needsUpdate) {
      const isUserUploadedPlant = Boolean(p.createdAt) || p.id.startsWith('plant-');
      if (isUserUploadedPlant) {
        updated.updatedAt = timestampIso;
        updated.updatedAtBn = timestampBn;
      }
      plantsToUpdate.push({ before: p, updated, fixesForPlant });
      candidateFixLogs.push(...fixesForPlant);
    }
  });

  return {
    plantsToUpdate,
    candidateFixLogs,
  };
}
