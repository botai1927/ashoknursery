import { BrahmyamanPlant, PlantCareTip } from "../types/nursery";
import { getAshokePhotoUrl } from "./ashokePhotos";

import heroImg from "../assets/images/hero_brahmyaman_nursery_1794627514151.webp";
import pujaOrigImg from "../assets/images/puja_plants_hibiscus_1794627514451.webp";
import fruitOrigImg from "../assets/images/fruit_grafts_saplings_1794627514463.webp";
import rooftopOrigImg from "../assets/images/rooftop_bougainvillea_rose_1794627515749.webp";
import potsOrigImg from "../assets/images/terracotta_pots_compost_1794627515802.webp";

import mangoOrigImg from "../assets/images/plant_mango_amrapali_1794628168576.webp";
import dalimOrigImg from "../assets/images/plant_pomegranate_dalim_1794628170246.webp";
import belOrigImg from "../assets/images/plant_bel_bilwapatra_1794628166466.webp";
import shiuliOrigImg from "../assets/images/plant_shiuli_parijat_1794628167184.webp";
import aparajitaOrigImg from "../assets/images/plant_neel_aparajita_1794628167282.webp";
import tulsiOrigImg from "../assets/images/plant_krishna_tulsi_1794628165686.webp";
import lemonOrigImg from "../assets/images/plant_kagzi_lemon_1794628168792.webp";
import guavaOrigImg from "../assets/images/plant_guava_lucknow_1794628171221.webp";
import kashmiriRoseOrigImg from "../assets/images/plant_kashmiri_rose_1794628170606.webp";
import adeniumOrigImg from "../assets/images/plant_adenium_desert_rose_1794628171551.webp";
import lotusOrigImg from "../assets/images/plant_lotus_padma_1794633597303.webp";
import bananaOrigImg from "../assets/images/plant_banana_g9_1794633596588.webp";
import marigoldOrigImg from "../assets/images/plant_marigold_ganda_1794633615666.webp";
import stholopaddmoOrigImg from "../assets/images/plant_stholopaddmo_rose_1794633615030.webp";
import luckyBambooOrigImg from "../assets/images/plant_lucky_bamboo_1794633632995.webp";
import chandramallikaOrigImg from "../assets/images/plant_chandramallika_mum_1794633634519.webp";
import rubberOrigImg from "../assets/images/plant_rubber_burgundy_1794625408145.webp";
import snakeOrigImg from "../assets/images/plant_snake_laurentii_1794625409134.webp";

export const HERO_IMAGE = heroImg;
export const POTS_IMAGE = potsOrigImg;
export const PUJA_IMAGE = pujaOrigImg;
export const FRUIT_IMAGE = fruitOrigImg;
export const ROOFTOP_IMAGE = rooftopOrigImg;

export const tulsiImg = tulsiOrigImg;
export const lemonImg = lemonOrigImg;
export const guavaImg = guavaOrigImg;
export const roseImg = kashmiriRoseOrigImg;
export const adeniumImg = adeniumOrigImg;
export const lotusImg = lotusOrigImg;
export const bananaImg = bananaOrigImg;
export const marigoldImg = marigoldOrigImg;
export const stholopaddmoImg = stholopaddmoOrigImg;
export const luckyBambooImg = luckyBambooOrigImg;
export const chandramallikaImg = chandramallikaOrigImg;
export const rubberImg = rubberOrigImg;
export const snakeImg = snakeOrigImg;
export const mangoImg = mangoOrigImg;
export const dalimImg = dalimOrigImg;
export const belImg = belOrigImg;
export const shiuliImg = shiuliOrigImg;
export const aparajitaImg = aparajitaOrigImg;

export { getAshokePhotoUrl };

export const NURSERY_CONTACT = {
  phone: "+918609417672",
  phoneRaw: "918609417672",
  phoneDisplay: "+91 86094 17672",
  whatsappNumber: "918609417672",
  mapUrl: "https://maps.app.goo.gl/zLQBxPHZKqK9ofLJ8",
  addressBn: "কালশুলি, বাঁকুড়া, ৭২২১৬০",
  addressEn: "Kalsuli, Bankura, 722160",
  taglineBn: "পারিবারিক নার্সারি, কালশুলি · বাঁকুড়া, ৭২২১৬০,WhatsApp-এ সরাসরি অর্ডার, ন্যায্য দাম",
  taglineEn: "Family Nursery, Kalsuli · Bankura, 722160 · Direct WhatsApp Order · Fair Price",
  sublineBn: "পারিবারিক নার্সারি, কালশুলি · বাঁকুড়া, ৭২২১৬০,WhatsApp-এ সরাসরি অর্ডার, ন্যায্য দাম",
  sublineEn: "Family Nursery, Kalsuli · Bankura, 722160 · Direct WhatsApp Order · Fair Price",
  visitingHoursBn: "প্রতিদিন সকাল ৬:৩০ – সন্ধ্যা ৬:৩০",
  visitingHoursEn: "Daily 6:30 AM – 6:30 PM",
  serviceLocationsBn: "কালশুলি, পারসোলা, খাতড়া ও সিমলাপাল",
  serviceLocationsEn: "Kalsuli, Parsola, Khatra & Simlapal",
  responsePromiseBn: "১৫ মিনিটের মধ্যে নিশ্চিত উত্তর (সকাল ৬:৩০ – সন্ধ্যা ৬:৩০)",
};

export interface SeasonalHighlight {
  id: string;
  plantId: string;
  titleBn: string;
  titleEn: string;
  tagBn: string;
  tagEn: string;
  priceNoteBn: string;
  priceNoteEn: string;
  image: string;
}

export const SEASONAL_HIGHLIGHTS: SeasonalHighlight[] = [
  {
    id: "season-lemon",
    plantId: "ashoke-2",
    titleBn: "বারোমাসি কাগজি পাতিলেবু",
    titleEn: "Kagzi Lemon Sapling",
    tagBn: "এখন ফল ও নতুন মুকুল",
    tagEn: "Bearing Lemons Now",
    priceNoteBn: "₹৯০ (ন্যায্য দাম)",
    priceNoteEn: "₹90 nursery rate",
    image: lemonOrigImg,
  },
  {
    id: "season-rose",
    plantId: "ashoke-32",
    titleBn: "কাশ্মীরি ও হাইব্রিড গোলাপ",
    titleEn: "Fragrant Hybrid Roses",
    tagBn: "কুঁড়ি ও ফুলের সেরা মরশুম",
    tagEn: "Peak Blooming Season",
    priceNoteBn: "₹৬০ ও ₹৮০",
    priceNoteEn: "From ₹60",
    image: kashmiriRoseOrigImg,
  },
  {
    id: "season-lotus",
    plantId: "ashoke-17",
    titleBn: "পবিত্র জলজ পদ্ম কন্দ (গোলাপি/সাদা/লাল)",
    titleEn: "Sacred Water Lotus Sapling",
    tagBn: "জলজ পবিত্র ফুল",
    tagEn: "Sacred Aquatic Lotus",
    priceNoteBn: "₹৩৫০ (পরিপুষ্ট কন্দ চারা)",
    priceNoteEn: "₹350 ready tuber",
    image: lotusOrigImg,
  },
  {
    id: "season-banana",
    plantId: "ashoke-73",
    titleBn: "G-9 ও চায়না খাটো কলা গাছ",
    titleEn: "G-9 & China Dwarf Banana",
    tagBn: "দ্রুত ফলনশীল চারা",
    tagEn: "Fast fruiting sapling",
    priceNoteBn: "₹৫০ ও ₹৮০",
    priceNoteEn: "From ₹50",
    image: bananaOrigImg,
  },
];

export const BRAHMYAMAN_PLANTS: BrahmyamanPlant[] = [
  {
    id: "brahmyaman-amrapali-mango",
    nameBn: "আম্রপালী ও কাটিমন আম (কলম)",
    nameEn: "Amrapali & Katimon Grafted Mango",
    botanicalName: "Mangifera indica",
    category: "ছাদবাগানের ফল ও কলম",
    audience: ["rooftop", "family"],
    badgeBn: "ছাদবাগানে বারোমাসি ফলন",
    badgeEn: "Dwarf Fruit Graft",
    colorBn: "হলুদ-সোনালী শাঁস",
    sunlightBn: "পূর্ণ রোদ (৬+ ঘণ্টা)",
    sunlightEn: "Full Sunlight (6+ Hours)",
    wateringBn: "মাটি শুকোলে নিয়মিত জল দিন",
    wateringEn: "Water regularly when topsoil dries",
    soilTipBn: "বাঁকুড়ার লাল দোআঁশ মাটি, বালি ও ভার্মিকম্পোস্ট",
    soilTipEn: "Bankura red loam, river sand & vermicompost",
    descriptionBn: "ছোট অবস্থাতেই মুকুল ও মিষ্টি ফলন দেওয়া খাঁটি আম্রপালী ও বারোমাসি কাটিমন আমের কলমের চারা।",
    descriptionEn: "Authentic grafted Amrapali and all-season Katimon mango saplings ideal for rooftop drums and courtyards.",
    image: mangoOrigImg,
    featured: true,
    options: [
      {
        id: "opt-mango-1",
        labelBn: "গ্রো ব্যাগ কলম (১.৫–২ ফুট · ৮–১২ মাস)",
        labelEn: "Grafted Polybag Sapling (1.5–2 ft)",
        price: 120,
        containerType: "পলি গ্রো ব্যাগ"
      },
      {
        id: "opt-mango-2",
        labelBn: "বড় কলম চারা (মাঝারি গ্রো ব্যাগ)",
        labelEn: "Matured Grafted Sapling (Medium Bag)",
        price: 180,
        containerType: "মাঝারি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "brahmyaman-dalim-pomegranate",
    nameBn: "মিষ্টি বেদানা / ডালিম কলম",
    nameEn: "Sweet Bhagwa Pomegranate Graft",
    botanicalName: "Punica granatum",
    category: "ছাদবাগানের ফল ও কলম",
    audience: ["rooftop", "family"],
    badgeBn: "ছাদবাগানেই মিষ্টি ফল",
    badgeEn: "Fruiting in Pots",
    colorBn: "গাঢ় লাল দানা",
    sunlightBn: "পূর্ণ রোদ ও খোলা হাওয়া",
    sunlightEn: "Full Sun & Open Air",
    wateringBn: "মাটির ওপর শুকোলে পরিমিত জল",
    wateringEn: "Moderate watering when topsoil dries",
    soilTipBn: "বেলে দোআঁশ মাটি ও কেঁচো সার",
    soilTipEn: "Sandy loam with vermicompost",
    descriptionBn: "কম যত্নে ও কম জলে বাঁকুড়ার আবহাওয়ায় দারুণ ফলন দেওয়া ভগওয়া লাল দানার মিষ্টি বেদানার চারা।",
    descriptionEn: "Drought-hardy grafted pomegranate sapling producing sweet ruby-red fruits in Bankura sunshine.",
    image: dalimOrigImg,
    options: [
      {
        id: "opt-dalim-1",
        labelBn: "গ্রো ব্যাগ কলম (১.৫ ফুট · ৬–৮ মাস)",
        labelEn: "Grow Bag Graft (1.5 ft)",
        price: 90,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "brahmyaman-triloha-bel",
    nameBn: "ত্রিমুখী পবিত্র বেলপাতা",
    nameEn: "Sacred Shiva Bael / Bilwapatra",
    botanicalName: "Aegle marmelos",
    category: "পূজার ফুল ও পবিত্র গাছ",
    audience: ["puja", "family"],
    badgeBn: "মহাদেবের প্রিয় বেলপাতা",
    badgeEn: "Sacred Puja Plant",
    colorBn: "গাঢ় সবুজ ত্রিপত্র",
    sunlightBn: "পূর্ণ রোদ ও পর্যাপ্ত আলো",
    sunlightEn: "Full Sun & Good Light",
    wateringBn: "মাটি শুকোলে জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "বাঁকুড়ার লাল মাটি ও সামান্য গোবর সার",
    soilTipEn: "Red loam with dry cow manure",
    descriptionBn: "শিবপূজার নিত্য অক্ষত ত্রিপত্র বেলপাতার জন্য ছাদবাগান বা উঠোনে সহজে লালনযোগ্য পবিত্র বেলগাছের চারা।",
    descriptionEn: "Sacred trifoliate Bilwapatra tree for fresh homegrown leaves for daily Shiva worship.",
    image: belOrigImg,
    options: [
      {
        id: "opt-bel-1",
        labelBn: "গ্রো ব্যাগ চারা (১.৫ ফুট · ৬ মাস)",
        labelEn: "Polybag Sapling (1.5 ft)",
        price: 60,
        containerType: "পলি গ্রো ব্যাগ"
      },
      {
        id: "opt-bel-2",
        labelBn: "বড় পরিপুষ্ট চারা (বড় গ্রো ব্যাগ)",
        labelEn: "Matured Sapling in Large Bag",
        price: 110,
        containerType: "বড় পরিপুষ্ট চারা"
      }
    ]
  },
  {
    id: "brahmyaman-shiuli-parijat",
    nameBn: "সুগন্ধি শিউলি / পারিজাত",
    nameEn: "Night-Flowering Jasmine (Shiuli)",
    botanicalName: "Nyctanthes arbor-tristis",
    category: "পূজার ফুল ও পবিত্র গাছ",
    audience: ["puja", "family"],
    badgeBn: "শরতের প্রিয় পুজোর ফুল",
    badgeEn: "Fragrant Sacred Bloom",
    colorBn: "সাদা পাপড়ি ও কমলা বৃন্ত",
    sunlightBn: "পূর্ণ রোদ ও পর্যাপ্ত আলো",
    sunlightEn: "Full Sun & Good Light",
    wateringBn: "নিয়মিত পরিমিত জল",
    wateringEn: "Regular moderate watering",
    soilTipBn: "দোআঁশ মাটি ও নিম খোল",
    soilTipEn: "Loamy soil with neem cake",
    descriptionBn: "প্রতিদিন ভোরবেলা সুগন্ধে ভরিয়ে তোলা খাঁটি দেশি শিউলি বা পারিজাত ফুলের সতেজ চারা।",
    descriptionEn: "Sacred fragrant night-blooming jasmine that carpets morning altars with orange-stemmed white flowers.",
    image: shiuliOrigImg,
    options: [
      {
        id: "opt-shiuli-1",
        labelBn: "গ্রো ব্যাগ চারা (১.৫ ফুট · ৬ মাস)",
        labelEn: "Polybag Sapling (1.5 ft)",
        price: 50,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "brahmyaman-daruchini",
    nameBn: "সুগন্ধি দারুচিনি গাছ",
    nameEn: "Aromatic Cinnamon Tree Sapling",
    botanicalName: "Cinnamomum verum",
    category: "মসলা ও ভেষজ গাছ",
    audience: ["herbal", "family", "rooftop"],
    badgeBn: "খাঁটি দেশি মসলা চারা",
    badgeEn: "Homegrown Spice Sapling",
    colorBn: "চিরসবুজ পাতা",
    sunlightBn: "পর্যাপ্ত রোদ ও আলো",
    sunlightEn: "Full Sun & Good Light",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Moderate watering when topsoil dries",
    soilTipBn: "বেলে দোআঁশ মাটি ও কেঁচো সার",
    soilTipEn: "Sandy loam with vermicompost",
    descriptionBn: "বাড়ির উঠোন ও বাগানের উপযোগী খাঁটি দারুচিনি গাছ—এর পাতা ও ছাল রান্নায় অসাধারণ সুবাস এনে দেয়।",
    descriptionEn: "Authentic homegrown cinnamon sapling whose fragrant leaves and bark add rich aroma to food.",
    image: potsOrigImg,
    options: [
      {
        id: "opt-daru-1",
        labelBn: "গ্রো ব্যাগ চারা (১–১.৫ ফুট · ৬ মাস)",
        labelEn: "Grow Bag Sapling (1–1.5 ft)",
        price: 80,
        containerType: "পলি গ্রো ব্যাগ"
      },
      {
        id: "opt-daru-2",
        labelBn: "বড় পরিপুষ্ট চারা",
        labelEn: "Matured Sapling",
        price: 140,
        containerType: "বড় পরিপুষ্ট চারা"
      }
    ]
  },
  {
    id: "ashoke-88",
    nameBn: "ক্যামেলিয়া ফুল গাছ",
    nameEn: "Camellia Flower Plant (Red & Pink)",
    botanicalName: "Camellia japonica",
    category: "ছাদ ও বারান্দার ফুল",
    audience: ["rooftop","family"],
    badgeBn: "শীত ও বসন্তের রানী",
    colorBn: "গাঢ় গোলাপি / লাল",
    sunlightBn: "পূর্ণ রোদ ও পর্যাপ্ত আলো",
    sunlightEn: "Full Sun & Good Light",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "বাঁকুড়ার লাল দোআঁশ মাটি ও ভার্মিকম্পোস্ট",
    soilTipEn: "Bankura red loam & vermicompost blend",
    descriptionBn: "শীত ও বসন্তের অভিজাত বহুপাপড়ি ক্যামেলিয়া ফুল—হালকা ছায়ায় ও পরিমিত আর্দ্রতায় টবে দারুণ সুন্দর গোলাপি ও লাল ফুল ফোটে।",
    descriptionEn: "Classic winter-spring Camellia japonica shrub with glossy evergreen leaves and layered pink or crimson blooms.",
    image: getAshokePhotoUrl(101),
    options: [
      {
        id: "opt-88-1",
        labelBn: "ছোট গ্রো ব্যাগ (৮–১০ ইঞ্চি · ৫ মাস)",
        labelEn: "Small Grow Bag (8–10 in)",
        price: 80,
        containerType: "পলি গ্রো ব্যাগ"
      },
      {
        id: "opt-88-2",
        labelBn: "মাঝারি গ্রো ব্যাগ (১–১.৫ ফুট · কুঁড়িসহ)",
        labelEn: "Medium Grow Bag with Buds (1–1.5 ft)",
        price: 150,
        containerType: "মাঝারি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-87",
    nameBn: "ঝাউ গাছ",
    nameEn: "Jhau Tree / Cypress Pine",
    botanicalName: "Casuarina equisetifolia",
    category: "গৃহস্থ ও ঔষধি গাছ",
    audience: ["family","rooftop"],
    badgeBn: "চিরসবুজ সৌন্দর্য",
    colorBn: "চিরসবুজ",
    sunlightBn: "হালকা ছায়া ও উজ্জ্বল পরোক্ষ আলো",
    sunlightEn: "Bright Indirect Light / Partial Shade",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "হালকা কোকোপিট, বালি ও ভার্মিকম্পোস্ট মিশ্রণ",
    soilTipEn: "Well-draining cocopeat, sand & vermicompost mix",
    descriptionBn: "সুন্দর ছুঁচালো সবুজ ডালপালার চিরসবুজ ঝাউ গাছ—বাড়ির গেট, সীমানা ও বড় টবে ছাঁটাই করে নান্দনিক রূপ দেওয়া যায়।",
    descriptionEn: "Graceful evergreen cypress-pine tree suited for boundary hedges, entryways, and sculpted outdoor pots.",
    image: getAshokePhotoUrl(100),
    options: [
      {
        id: "opt-87-1",
        labelBn: "গ্রো ব্যাগ (১.৫–২ ফুট · ৬ মাস)",
        labelEn: "Grow Bag (1.5–2 ft)",
        price: 40,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-86",
    nameBn: "ভিক্টোরিয়া",
    nameEn: "Victoria Agave / Decorative Agave",
    botanicalName: "Agave victoriae-reginae",
    category: "গৃহস্থ ও ঔষধি গাছ",
    audience: ["family","rooftop"],
    badgeBn: "কম যত্নে দীর্ঘস্থায়ী",
    colorBn: "সবুজ",
    sunlightBn: "হালকা ছায়া ও উজ্জ্বল পরোক্ষ আলো",
    sunlightEn: "Bright Indirect Light / Partial Shade",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "হালকা কোকোপিট, বালি ও ভার্মিকম্পোস্ট মিশ্রণ",
    soilTipEn: "Well-draining cocopeat, sand & vermicompost mix",
    descriptionBn: "শক্ত খাঁজকাটা সবুজ-সাদা বর্ডার পাতার দুর্লভ ভিক্টোরিয়া অ্যাগেভ—অত্যন্ত কম জলে কড়া রোদ বা বারান্দায় বছরের পর বছর টিকে থাকে।",
    descriptionEn: "Architectural rosette Victoria agave with crisp white leaf margins; thrives on minimal watering.",
    image: getAshokePhotoUrl(99),
    options: [
      {
        id: "opt-86-1",
        labelBn: "গ্রো ব্যাগ (৬–৮ ইঞ্চি · ৮ মাস)",
        labelEn: "Grow Bag (6–8 in)",
        price: 80,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-85",
    nameBn: "সাকুলেন্ট ট্রি (জেড বনসাই)",
    nameEn: "Succulent Tree / Jade Bonsai",
    botanicalName: "Crassula ovata",
    category: "গৃহস্থ ও ঔষধি গাছ",
    audience: ["family","rooftop"],
    badgeBn: "সৌভাগ্য ও দীর্ঘায়ু",
    colorBn: "রসাল সবুজ",
    sunlightBn: "পূর্ণ রোদ ও পর্যাপ্ত আলো",
    sunlightEn: "Full Sun & Good Light",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "বাঁকুড়ার লাল দোআঁশ মাটি ও ভার্মিকম্পোস্ট",
    soilTipEn: "Bankura red loam & vermicompost blend",
    descriptionBn: "চকচকে রসালো ডালপালার জেড প্ল্যান্ট (ক্রাসুলা) যা সহজেই ছোট বনসাইয়ের রূপ নেয়—পড়ার টেবিল বা উজ্জ্বল বারান্দার জন্য আদর্শ।",
    descriptionEn: "Thick-trunked jade succulent tree ready for bonsai shaping; low-water indoor and balcony favorite.",
    image: getAshokePhotoUrl(98),
    options: [
      {
        id: "opt-85-1",
        labelBn: "টব উপযোগী চারা (৭–৯ ইঞ্চি · ৮ মাস)",
        labelEn: "Potted Bonsai Start (7–9 in)",
        price: 120,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-84",
    nameBn: "সালভিয়া",
    nameEn: "Salvia Flower Plant",
    botanicalName: "Salvia splendens",
    category: "ছাদ ও বারান্দার ফুল",
    audience: ["rooftop","family"],
    badgeBn: "উজ্জ্বল লাল ফুল",
    colorBn: "রক্ত লাল",
    sunlightBn: "পূর্ণ রোদ ও পর্যাপ্ত আলো",
    sunlightEn: "Full Sun & Good Light",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "বাঁকুড়ার লাল দোআঁশ মাটি ও ভার্মিকম্পোস্ট",
    soilTipEn: "Bankura red loam & vermicompost blend",
    descriptionBn: "শীর্ষে স্তূপাকার উজ্জ্বল রক্তলাল ফুলের সালভিয়া—শীতের বাগানে টানা দুই-তিন মাস রঙিন শয্যা ও বর্ডার তৈরি করে।",
    descriptionEn: "Vibrant scarlet Salvia spikes ideal for winter flower beds, window boxes, and colorful borders.",
    image: getAshokePhotoUrl(97),
    options: [
      {
        id: "opt-84-1",
        labelBn: "মৌসুমী চারা (৫–৭ ইঞ্চি · ৩০–৪৫ দিন)",
        labelEn: "Seasonal Sapling (5–7 in)",
        price: 20,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-83",
    nameBn: "সাদা পুনা ভ্যারাইটি জবা",
    nameEn: "White Pune Hybrid Hibiscus",
    botanicalName: "Hibiscus rosa-sinensis (Pune White)",
    category: "পূজার ফুল ও পবিত্র গাছ",
    audience: ["puja","rooftop"],
    badgeBn: "দুষ্প্রাপ্য সাদা জাত",
    colorBn: "স্নিগ্ধ সাদা",
    sunlightBn: "পূর্ণ রোদ ও পর্যাপ্ত আলো",
    sunlightEn: "Full Sun & Good Light",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "বাঁকুড়ার লাল দোআঁশ মাটি ও ভার্মিকম্পোস্ট",
    soilTipEn: "Bankura red loam & vermicompost blend",
    descriptionBn: "দুধে সাদা বড় পাপড়ি ও দীর্ঘস্থায়ী ফুলের দুষ্প্রাপ্য পুনে ভ্যারাইটি সাদা জবা—নিত্য পূজায় ও ১০ ইঞ্চি টবে সারাবছর প্রচুর কুঁড়ি আসে।",
    descriptionEn: "Rare pure-white Pune cultivar hibiscus producing large crisp blooms year-round in sunny 10-inch pots.",
    image: getAshokePhotoUrl(96),
    options: [
      {
        id: "opt-83-1",
        labelBn: "কলম চারা (১–১.৫ ফুট · ৬ মাস)",
        labelEn: "Grafted Sapling (1–1.5 ft)",
        price: 120,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-73",
    nameBn: "G 9 কলা গাছ",
    nameEn: "G-9 Dwarf Cavendish Banana",
    botanicalName: "Musa acuminata Colla",
    category: "ছাদবাগানের ফল ও কলম",
    audience: ["rooftop","family"],
    badgeBn: "টিস্যু কালচার বাম্পার ফলন",
    colorBn: "সবুজ",
    sunlightBn: "পূর্ণ রোদ ও পর্যাপ্ত আলো",
    sunlightEn: "Full Sun & Good Light",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "বাঁকুড়ার লাল দোআঁশ মাটি ও ভার্মিকম্পোস্ট",
    soilTipEn: "Bankura red loam & vermicompost blend",
    descriptionBn: "কম উচ্চতায় ছয় থেকে আট মাসে বড় কাঁদি ফলন দেওয়া টিস্যু-কালচার G-9 খাটো কলা গাছ।",
    descriptionEn: "High-yielding dwarf tissue-culture G-9 Cavendish banana sapling suited for home plots.",
    image: bananaOrigImg,
    options: [
      {
        id: "opt-73-1",
        labelBn: "টিস্যু-কালচার চারা (১–১.৫ ফুট · ৩–৪ মাস)",
        labelEn: "Tissue-Culture Sapling (1–1.5 ft)",
        price: 50,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-30",
    nameBn: "এলাচ",
    nameEn: "Large Cardamom Sapling",
    botanicalName: "Amomum subulatum",
    category: "ছাদবাগানের ফল ও কলম",
    audience: ["family","rooftop"],
    badgeBn: "সুগন্ধি মশলা চারা",
    colorBn: "সবুজ",
    sunlightBn: "পূর্ণ রোদ ও পর্যাপ্ত আলো",
    sunlightEn: "Full Sun & Good Light",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "বাঁকুড়ার লাল দোআঁশ মাটি ও ভার্মিকম্পোস্ট",
    soilTipEn: "Bankura red loam & vermicompost blend",
    descriptionBn: "সুগন্ধি মসলাদার বড় এলাচের ঝোপালো চারা—বাড়ির ছায়াযুক্ত স্যাঁতসেঁতে বাগান বা বড় টবে সহজেই বেড়ে ওঠে।",
    descriptionEn: "Fragrant large cardamom clump sapling suited for partially shaded home gardens and moist loamy corners.",
    image: getAshokePhotoUrl(40),
    options: [
      {
        id: "opt-30-1",
        labelBn: "ঝোপালো চারা (১–১.২ ফুট · ৫ মাস)",
        labelEn: "Clump Sapling (1–1.2 ft)",
        price: 50,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-2",
    nameBn: "কাগজি লেবু",
    nameEn: "Kagzi Lime / Baromasi Lemon",
    botanicalName: "Citrus aurantiifolia",
    category: "ছাদবাগানের ফল ও কলম",
    audience: ["rooftop","family"],
    badgeBn: "বারোমাসি রসালো লেবু",
    colorBn: "হলুদ ও সবুজ",
    sunlightBn: "পূর্ণ রোদ ও পর্যাপ্ত আলো",
    sunlightEn: "Full Sun & Good Light",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "বাঁকুড়ার লাল দোআঁশ মাটি ও ভার্মিকম্পোস্ট",
    soilTipEn: "Bankura red loam & vermicompost blend",
    descriptionBn: "পাতলা খোসা ও তীব্র সুগন্ধি রসে ভরা বারোমাসি কাগজি পাতিলেবুর গুটি কলম—অনেক গাছে মুকুল ও কচি লেবু ধরেই থাকে।",
    descriptionEn: "Aromatic thin-skinned Kagzi lime air-layered graft already acclimated to fruit all year in rooftop drums.",
    image: getAshokePhotoUrl(25),
    options: [
      {
        id: "opt-2-1",
        labelBn: "গুটি কলম চারা (১.৫–২ ফুট · ৬–৮ মাস)",
        labelEn: "Air-Layered Graft (1.5–2 ft)",
        price: 90,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-69",
    nameBn: "কেজি-১০ (KG-10) জাম কলম",
    nameEn: "KG-10 Hybrid Black Plum (Jam)",
    botanicalName: "Syzygium cumini (KG-10)",
    category: "ছাদবাগানের ফল ও কলম",
    audience: ["rooftop","family"],
    badgeBn: "মিষ্টি ও বড় জাত",
    colorBn: "কালো জাম",
    sunlightBn: "পূর্ণ রোদ ও পর্যাপ্ত আলো",
    sunlightEn: "Full Sun & Good Light",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "বাঁকুড়ার লাল দোআঁশ মাটি ও ভার্মিকম্পোস্ট",
    soilTipEn: "Bankura red loam & vermicompost blend",
    descriptionBn: "অল্প উচ্চতায় বড় আকৃতির মিষ্টি রসালো কালো জাম ধরানো হাইব্রিড কেজি-১০ কলম—ছাদবাগানের ড্রাম বা বাড়ির উঠোনের সেরা জাত।",
    descriptionEn: "Early-fruiting KG-10 hybrid black jamun graft yielding large, pulpy sweet fruits even at low canopy height.",
    image: getAshokePhotoUrl(82),
    options: [
      {
        id: "opt-69-1",
        labelBn: "কলম চারা (১.৫–২ ফুট · ৮–১০ মাস)",
        labelEn: "Grafted Sapling (1.5–2 ft)",
        price: 150,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-74",
    nameBn: "চায়না কলা",
    nameEn: "China Dwarf Banana",
    botanicalName: "Musa cavendishii",
    category: "ছাদবাগানের ফল ও কলম",
    audience: ["rooftop","family"],
    badgeBn: "ড্রাম বা ছাদে উপযুক্ত",
    colorBn: "সবুজ",
    sunlightBn: "পূর্ণ রোদ ও পর্যাপ্ত আলো",
    sunlightEn: "Full Sun & Good Light",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "বাঁকুড়ার লাল দোআঁশ মাটি ও ভার্মিকম্পোস্ট",
    soilTipEn: "Bankura red loam & vermicompost blend",
    descriptionBn: "খাঁটি খাটো উচ্চতার চায়না ডোয়ার্ফ কলা—কম জায়গায় ছাদবাগানের বড় ড্রামে বা আঙিনায় সহজেই মোচা ও সুমিষ্ট কলার কাঁদি আসে।",
    descriptionEn: "Compact China dwarf banana that stays under 6 ft, bearing sweet bunches in home yards and large drums.",
    image: getAshokePhotoUrl(87),
    options: [
      {
        id: "opt-74-1",
        labelBn: "চারা (১.২–১.৫ ফুট · ৪ মাস)",
        labelEn: "Established Sapling (1.2–1.5 ft)",
        price: 80,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-77",
    nameBn: "নারিকেল গাছ",
    nameEn: "Hazari Dwarf Coconut Tree",
    botanicalName: "Cocos nucifera",
    category: "ছাদবাগানের ফল ও কলম",
    audience: ["family"],
    badgeBn: "খাটো জাতের হাজারি ডাব",
    colorBn: "সবুজ",
    sunlightBn: "পূর্ণ রোদ ও পর্যাপ্ত আলো",
    sunlightEn: "Full Sun & Good Light",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "বাঁকুড়ার লাল দোআঁশ মাটি ও ভার্মিকম্পোস্ট",
    soilTipEn: "Bankura red loam & vermicompost blend",
    descriptionBn: "আদি খাটো জাতের হাজারি ডাব ও নারিকেল চারা—অপেক্ষাকৃত কম উচ্চতায় ৩–৪ বছরেই থোকা থোকা মিষ্টি জলের ডাব ধরতে শুরু করে।",
    descriptionEn: "Compact Hazari dwarf coconut sapling bred for sweet tender water and earlier fruiting in home orchards.",
    image: getAshokePhotoUrl(90),
    options: [
      {
        id: "opt-77-1",
        labelBn: "পরিপুষ্ট চারা (২.৫–৩ ফুট · ১২ মাস)",
        labelEn: "Matured Sapling (2.5–3 ft)",
        price: 350,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-62",
    nameBn: "পিংক কাঁঠাল",
    nameEn: "Pink Jackfruit Graft",
    botanicalName: "Artocarpus heterophyllus (Pink)",
    category: "ছাদবাগানের ফল ও কলম",
    audience: ["rooftop","family"],
    badgeBn: "বছরে দুইবার ফলন",
    colorBn: "গোলাপি কোয়া",
    sunlightBn: "পূর্ণ রোদ ও পর্যাপ্ত আলো",
    sunlightEn: "Full Sun & Good Light",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "বাঁকুড়ার লাল দোআঁশ মাটি ও ভার্মিকম্পোস্ট",
    soilTipEn: "Bankura red loam & vermicompost blend",
    descriptionBn: "ভেতরের কোয়া উজ্জ্বল গোলাপি ও অত্যন্ত সুমিষ্ট—ভিয়েতনামী-হাইব্রিড পিংক কাঁঠালের কলম চারা যা বাঁকুড়ার উষ্ণ আবহাওয়ায় দারুণ ফলন দেয়।",
    descriptionEn: "Exotic pink-fleshed jackfruit graft prized for honey-sweet crispy bulbs and strong heat tolerance.",
    image: getAshokePhotoUrl(74),
    options: [
      {
        id: "opt-62-1",
        labelBn: "কলম চারা (১.৫–২ ফুট · ৯–১২ মাস)",
        labelEn: "Grafted Sapling (1.5–2 ft)",
        price: 100,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-63",
    nameBn: "পেঁপে গাছ",
    nameEn: "Hybrid Red Lady Papaya",
    botanicalName: "Carica papaya",
    category: "ছাদবাগানের ফল ও কলম",
    audience: ["rooftop","family"],
    badgeBn: "প্রচুর ফলনশীল",
    colorBn: "কমলা ও সবুজ",
    sunlightBn: "পূর্ণ রোদ ও পর্যাপ্ত আলো",
    sunlightEn: "Full Sun & Good Light",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "বাঁকুড়ার লাল দোআঁশ মাটি ও ভার্মিকম্পোস্ট",
    soilTipEn: "Bankura red loam & vermicompost blend",
    descriptionBn: "রেড লেডি জাতের দ্বিলিঙ্গ পেঁপে চারা—প্রতিটি গাছেই নিচে থেকে উপরের দিকে ৫০–৬০টি পাকা লাল ও মিষ্টি পেঁপে ধরে।",
    descriptionEn: "High-yielding bisexual Red Lady papaya seedling bearing thick, sweet orange-red fruits from waist height.",
    image: getAshokePhotoUrl(75),
    options: [
      {
        id: "opt-63-1",
        labelBn: "চারা (৮–১০ ইঞ্চি · ৪৫–৬০ দিন)",
        labelEn: "Nursery Seedling (8–10 in)",
        price: 40,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-3",
    nameBn: "পেয়ারা (থাই)",
    nameEn: "Thai Sweet Guava Graft",
    botanicalName: "Psidium guajava (Thai 7)",
    category: "ছাদবাগানের ফল ও কলম",
    audience: ["rooftop","family"],
    badgeBn: "বারোমাসি বড় পেয়ারা",
    colorBn: "সবুজ",
    sunlightBn: "পূর্ণ রোদ ও পর্যাপ্ত আলো",
    sunlightEn: "Full Sun & Good Light",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "বাঁকুড়ার লাল দোআঁশ মাটি ও ভার্মিকম্পোস্ট",
    soilTipEn: "Bankura red loam & vermicompost blend",
    descriptionBn: "ভেতরে কচকচে কম বীজের মিষ্টি থাই-৭ পেয়ারার গুটি কলম—১০–১২ ইঞ্চি টবেই বছরভর প্রচুর বড় সাইজের পেয়ারা ফলে।",
    descriptionEn: "Crisp, low-seed Thai-7 guava graft renowned for continuous fruiting in sunny 12-inch rooftop pots.",
    image: getAshokePhotoUrl(3),
    options: [
      {
        id: "opt-3-1",
        labelBn: "কলম চারা (১.৫–২ ফুট · ৮ মাস)",
        labelEn: "Grafted Sapling (1.5–2 ft)",
        price: 120,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-51",
    nameBn: "বাতাবি লেবু",
    nameEn: "Batabi Pomelo / Grapefruit",
    botanicalName: "Citrus maxima",
    category: "ছাদবাগানের ফল ও কলম",
    audience: ["rooftop","family"],
    badgeBn: "রসাল মিষ্টি বাতাসি লেবু",
    colorBn: "গোলাপি ও সাদা",
    sunlightBn: "পূর্ণ রোদ ও পর্যাপ্ত আলো",
    sunlightEn: "Full Sun & Good Light",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "বাঁকুড়ার লাল দোআঁশ মাটি ও ভার্মিকম্পোস্ট",
    soilTipEn: "Bankura red loam & vermicompost blend",
    descriptionBn: "গোলাপি শাঁসযুক্ত মিষ্টি রসালো বাতাবি লেবুর (জাম্বুরা) কলম—শরতের পূজা ও পারিবারিক ফলের বাগানে দারুণ ফলনশীল।",
    descriptionEn: "Sweet pink-fleshed Batabi pomelo graft adapted to Bankura laterite soil with heavy seasonal yields.",
    image: getAshokePhotoUrl(62),
    options: [
      {
        id: "opt-51-1",
        labelBn: "গুটি কলম (১.৫–২ ফুট · ৮ মাস)",
        labelEn: "Air-Layer Sapling (1.5–2 ft)",
        price: 50,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-78",
    nameBn: "গোলাপি স্থলপদ্ম (হাইব্রিড ডাবল)",
    nameEn: "Pink Confederate Rose / Stholopaddmo",
    botanicalName: "Hibiscus mutabilis",
    category: "পূজার ফুল ও পবিত্র গাছ",
    audience: ["puja","rooftop"],
    badgeBn: "রং পরিবর্তনকারী ফুল",
    colorBn: "হালকা গোলাপি",
    sunlightBn: "পূর্ণ রোদ ও পর্যাপ্ত আলো",
    sunlightEn: "Full Sun & Good Light",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "বাঁকুড়ার লাল দোআঁশ মাটি ও ভার্মিকম্পোস্ট",
    soilTipEn: "Bankura red loam & vermicompost blend",
    descriptionBn: "সকালে হালকা গোলাপি ফুটে বেলা গড়াতে গাঢ় গোলাপি রঙ ধারণ করা ঘন পাপড়ির স্থলপদ্ম—লক্ষ্মী ও দুর্গাপূজার অন্যতম শ্রেষ্ঠ ফুল।",
    descriptionEn: "Double-petal pink Confederate Rose shifting shades through the day; cherished for morning puja altars.",
    image: getAshokePhotoUrl(91),
    options: [
      {
        id: "opt-78-1",
        labelBn: "ডাল কলম (১–১.৫ ফুট · ৫ মাস)",
        labelEn: "Rooted Cutting (1–1.5 ft)",
        price: 80,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-20",
    nameBn: "অস্ট্রেলিয়ান জবা",
    nameEn: "Australian Giant Hibiscus",
    botanicalName: "Hibiscus rosa-sinensis (Australian)",
    category: "পূজার ফুল ও পবিত্র গাছ",
    audience: ["puja","rooftop"],
    badgeBn: "বড় থালার মতো ফুল",
    colorBn: "কমলা ও লাল",
    sunlightBn: "পূর্ণ রোদ ও পর্যাপ্ত আলো",
    sunlightEn: "Full Sun & Good Light",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "বাঁকুড়ার লাল দোআঁশ মাটি ও ভার্মিকম্পোস্ট",
    soilTipEn: "Bankura red loam & vermicompost blend",
    descriptionBn: "ভাতের থালার মতো বিশাল ব্যাসের উজ্জ্বল কমলা-লাল অস্ট্রেলিয়ান জবা—একটি ফুল ফুটে থাকলে পুরো ছাদবাগানের শোভা বাড়িয়ে দেয়।",
    descriptionEn: "Giant platter-sized Australian hybrid hibiscus in fiery orange-crimson hues for sunny balconies.",
    image: getAshokePhotoUrl(21),
    options: [
      {
        id: "opt-20-1",
        labelBn: "কলম চারা (১–১.৫ ফুট · ৬ মাস)",
        labelEn: "Grafted Sapling (1–1.5 ft)",
        price: 90,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-52",
    nameBn: "অ্যাডেনিয়াম",
    nameEn: "Adenium Desert Rose",
    botanicalName: "Adenium obesum",
    category: "ছাদ ও বারান্দার ফুল",
    audience: ["rooftop","family"],
    badgeBn: "বনসাই ও কডেক্স ফুল",
    colorBn: "গোলাপি ও লাল",
    sunlightBn: "পূর্ণ রোদ ও পর্যাপ্ত আলো",
    sunlightEn: "Full Sun & Good Light",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "বাঁকুড়ার লাল দোআঁশ মাটি ও ভার্মিকম্পোস্ট",
    soilTipEn: "Bankura red loam & vermicompost blend",
    descriptionBn: "মোটা আকর্ষণীয় কডেক্স ও সূক্ষ্ম পাতার মরু গোলাপ (অ্যাডেনিয়াম)—তীব্র বাঁকুড়ার রোদ পছন্দ করে, কম জলেই টবে উজ্জ্বল গোলাপি-লাল ফুল ফোটে।",
    descriptionEn: "Sculptural thick-caudex Desert Rose flowering profusely in harsh summer sun with minimal watering.",
    image: getAshokePhotoUrl(63),
    options: [
      {
        id: "opt-52-1",
        labelBn: "মাঝারি কডেক্স (৭–৯ ইঞ্চি · ৮ মাস)",
        labelEn: "Caudex Grow Bag (7–9 in · 8 mo)",
        price: 80,
        containerType: "পলি গ্রো ব্যাগ"
      },
      {
        id: "opt-52-2",
        labelBn: "বড় গ্রাফটেড কডেক্স (১ ফুট+)",
        labelEn: "Large Grafted Caudex (1 ft+)",
        price: 150,
        containerType: "মাঝারি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-72",
    nameBn: "আজ,কাল,পরশু ফুলগাছ",
    nameEn: "Yesterday Today Tomorrow (Brunfelsia)",
    botanicalName: "Brunfelsia pauciflora",
    category: "ছাদ ও বারান্দার ফুল",
    audience: ["rooftop","family"],
    badgeBn: "তিন রঙের সুবাসিত ফুল",
    colorBn: "বেগুনি, নীল ও সাদা",
    sunlightBn: "পূর্ণ রোদ ও পর্যাপ্ত আলো",
    sunlightEn: "Full Sun & Good Light",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "বাঁকুড়ার লাল দোআঁশ মাটি ও ভার্মিকম্পোস্ট",
    soilTipEn: "Bankura red loam & vermicompost blend",
    descriptionBn: "একই গাছে প্রথম দিন গাঢ় বেগুনি, পরদিন হালকা নীল ও তৃতীয় দিন দুধে সাদা হয়ে সুবাস ছড়ানো আশ্চর্য \"আজ-কাল-পরশু\" ফুলগাছ।",
    descriptionEn: "Fragrant tricolor Brunfelsia opening deep violet, fading to lavender, then pure white over three days.",
    image: getAshokePhotoUrl(85),
    options: [
      {
        id: "opt-72-1",
        labelBn: "গ্রো ব্যাগ (১–১.২ ফুট · ৫ মাস)",
        labelEn: "Grow Bag (1–1.2 ft)",
        price: 70,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-42",
    nameBn: "গজনিয়া ফুল",
    nameEn: "Gazania Sunshine Flower",
    botanicalName: "Gazania rigens",
    category: "ছাদ ও বারান্দার ফুল",
    audience: ["rooftop","family"],
    badgeBn: "সূর্যমুখী গোত্রের ফুল",
    colorBn: "উজ্জ্বল হলুদ ও কমলা",
    sunlightBn: "পূর্ণ রোদ ও পর্যাপ্ত আলো",
    sunlightEn: "Full Sun & Good Light",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "বাঁকুড়ার লাল দোআঁশ মাটি ও ভার্মিকম্পোস্ট",
    soilTipEn: "Bankura red loam & vermicompost blend",
    descriptionBn: "সূর্য উঠলেই প্রজাপতির পাখার মতো মেলে ধরা উজ্জ্বল হলুদ-কমলা গজনিয়া—শীত ও বসন্তে ঝুলন্ত টব ও রোদেলা কিনারায় দারুণ মানায়।",
    descriptionEn: "Sun-loving golden-orange Gazania blooms opening bright with morning sunlight in window boxes.",
    image: getAshokePhotoUrl(52),
    options: [
      {
        id: "opt-42-1",
        labelBn: "মৌসুমী চারা (৫–৭ ইঞ্চি · ৩০ দিন)",
        labelEn: "Seasonal Sapling (5–7 in)",
        price: 20,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-40",
    nameBn: "গজনীয়া ফুল",
    nameEn: "White Sunshine Gazania",
    botanicalName: "Gazania splendens",
    category: "ছাদ ও বারান্দার ফুল",
    audience: ["rooftop","family"],
    badgeBn: "রংবেরঙের উজ্জ্বল ফুল",
    colorBn: "সাদা ও হলুদ কেন্দ্র",
    sunlightBn: "পূর্ণ রোদ ও পর্যাপ্ত আলো",
    sunlightEn: "Full Sun & Good Light",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "বাঁকুড়ার লাল দোআঁশ মাটি ও ভার্মিকম্পোস্ট",
    soilTipEn: "Bankura red loam & vermicompost blend",
    descriptionBn: "হলুদ বিন্দু ও দুধে সাদা পাপড়ির সতেজ শ্বেত গজনিয়া—অল্প যত্নেই এক টবে একসাথে অনেকগুলো ডেইজি-সদৃশ ফুল ফোটে।",
    descriptionEn: "Crisp white daisy-like Gazania blooms with golden centers, ideal for sunny terrace borders.",
    image: getAshokePhotoUrl(50),
    options: [
      {
        id: "opt-40-1",
        labelBn: "মৌসুমী চারা (৫–৭ ইঞ্চি · ৩০ দিন)",
        labelEn: "Seasonal Sapling (5–7 in)",
        price: 20,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-54",
    nameBn: "গন্ধরাজ ফুল",
    nameEn: "Gandharaj / Cape Jasmine",
    botanicalName: "Gardenia jasminoides",
    category: "পূজার ফুল ও পবিত্র গাছ",
    audience: ["puja","family"],
    badgeBn: "তীব্র মিষ্টি সুবাস",
    colorBn: "দুধে সাদা",
    sunlightBn: "পূর্ণ রোদ ও পর্যাপ্ত আলো",
    sunlightEn: "Full Sun & Good Light",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "বাঁকুড়ার লাল দোআঁশ মাটি ও ভার্মিকম্পোস্ট",
    soilTipEn: "Bankura red loam & vermicompost blend",
    descriptionBn: "সারা উঠোন মাতিয়ে তোলা তীব্র মিষ্টি সুগন্ধি কেপ জেসমিন (গন্ধরাজ)—গ্রীষ্ম ও বর্ষায় পুরু পাপড়ির শ্বেতশুভ্র ফুল ফোটে।",
    descriptionEn: "Intensely fragrant creamy-white Cape Jasmine prized across Bengali households for summer blooms.",
    image: getAshokePhotoUrl(65),
    options: [
      {
        id: "opt-54-1",
        labelBn: "গুটি কলম (১–১.৫ ফুট · ৬ মাস)",
        labelEn: "Layering Sapling (1–1.5 ft)",
        price: 60,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-6",
    nameBn: "গাঁদা ফুলের চারা",
    nameEn: "Marigold Seedling",
    botanicalName: "Tagetes erecta",
    category: "পূজার ফুল ও পবিত্র গাছ",
    audience: ["puja","rooftop"],
    badgeBn: "পূজা ও উৎসবের প্রিয়",
    colorBn: "গাঢ় কমলা",
    sunlightBn: "পূর্ণ রোদ ও পর্যাপ্ত আলো",
    sunlightEn: "Full Sun & Good Light",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "বাঁকুড়ার লাল দোআঁশ মাটি ও ভার্মিকম্পোস্ট",
    soilTipEn: "Bankura red loam & vermicompost blend",
    descriptionBn: "পূজার মালা ও উৎসব সাজানোর জন্য ঘন কমলা-জাফরান রঙের ইনকা জাতের গাঁদা—প্রতি গাছে বড় আকারের থোকা ফুল আসে।",
    descriptionEn: "Plump saffron-orange Inca marigold seedlings grown for vibrant festive garlands and daily puja.",
    image: getAshokePhotoUrl(29),
    options: [
      {
        id: "opt-6-1",
        labelBn: "মৌসুমী চারা (৫–৭ ইঞ্চি · ৩০ দিন)",
        labelEn: "Seasonal Seedling (5–7 in)",
        price: 15,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-19",
    nameBn: "লাল দেশি গোলাপ",
    nameEn: "Native Fragrant Rose",
    botanicalName: "Rosa indica",
    category: "ছাদ ও বারান্দার ফুল",
    audience: ["rooftop","family"],
    badgeBn: "সুবাসিত দেশি গোলাপ",
    colorBn: "লাল",
    sunlightBn: "পূর্ণ রোদ ও পর্যাপ্ত আলো",
    sunlightEn: "Full Sun & Good Light",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "বাঁকুড়ার লাল দোআঁশ মাটি ও ভার্মিকম্পোস্ট",
    soilTipEn: "Bankura red loam & vermicompost blend",
    descriptionBn: "প্রবল মিষ্টি সুগন্ধ ও গাঢ় রক্তলাল রঙের খাঁটি বাংলা দেশি গোলাপ—পুজোর অর্ঘ্য ও রোদেলা বারান্দায় সারা বছর নিয়মিত ফুল দেয়।",
    descriptionEn: "Traditional fragrant crimson Bengali garden rose blooming reliably year-round with rich perfume.",
    image: getAshokePhotoUrl(20),
    options: [
      {
        id: "opt-19-1",
        labelBn: "গ্রো ব্যাগ (১০–১৪ ইঞ্চি · ৫ মাস)",
        labelEn: "Grow Bag (10–14 in)",
        price: 60,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-32",
    nameBn: "গোলাপি-লাল বর্ডার গোলাপ",
    nameEn: "Pink-Edged Fragrant Rose",
    botanicalName: "Rosa x hybrida",
    category: "ছাদ ও বারান্দার ফুল",
    audience: ["rooftop","family"],
    badgeBn: "দ্বি-বর্ণিল প্রান্তের গোলাপ",
    colorBn: "হালকা গোলাপি ও লাল প্রান্ত",
    sunlightBn: "পূর্ণ রোদ ও পর্যাপ্ত আলো",
    sunlightEn: "Full Sun & Good Light",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "বাঁকুড়ার লাল দোআঁশ মাটি ও ভার্মিকম্পোস্ট",
    soilTipEn: "Bankura red loam & vermicompost blend",
    descriptionBn: "গাছ ভরে ফোটা সুগন্ধি হাইব্রিড গোলাপের কলম চারা, ছাদবাগান ও উঠোনের জন্য উপযুক্ত।",
    descriptionEn: "Profuse-blooming pink-edged hybrid rose graft ideal for terrace and courtyard pots.",
    image: getAshokePhotoUrl(42),
    options: [
      {
        id: "opt-32-1",
        labelBn: "কলম চারা (১০–১৪ ইঞ্চি · ৬ মাস)",
        labelEn: "Grafted Sapling (10–14 in)",
        price: 80,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-48",
    nameBn: "ক্রিম-হলুদ হাইব্রিড গোলাপ",
    nameEn: "Cream Yellow & Pink Rose",
    botanicalName: "Rosa x hybrida (Yellow)",
    category: "ছাদ ও বারান্দার ফুল",
    audience: ["rooftop","family"],
    badgeBn: "উজ্জ্বল হলুদ পাপড়ি",
    colorBn: "ক্রিম-হলুদ ও গোলাপি",
    sunlightBn: "পূর্ণ রোদ ও পর্যাপ্ত আলো",
    sunlightEn: "Full Sun & Good Light",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "বাঁকুড়ার লাল দোআঁশ মাটি ও ভার্মিকম্পোস্ট",
    soilTipEn: "Bankura red loam & vermicompost blend",
    descriptionBn: "ক্রিম-হলুদ পাপড়ির ধারে হালকা গোলাপি আভাযুক্ত হাইব্রিড টি রোজ—বড় ও দীর্ঘস্থায়ী কুঁড়ির জন্য ছাদবাগানে অত্যন্ত জনপ্রিয়।",
    descriptionEn: "Creamy-yellow Hybrid Tea rose flushed with soft pink petal edges, holding blooms fresh for days.",
    image: getAshokePhotoUrl(60),
    options: [
      {
        id: "opt-48-1",
        labelBn: "কলম চারা (১০–১৪ ইঞ্চি · ৬ মাস)",
        labelEn: "Grafted Sapling (10–14 in)",
        price: 80,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-45",
    nameBn: "হালকা গোলাপি ফ্লোরিবুন্ডা গোলাপ",
    nameEn: "Pink Garden Rose",
    botanicalName: "Rosa x hybrida (Pink)",
    category: "ছাদ ও বারান্দার ফুল",
    audience: ["rooftop","family"],
    badgeBn: "মনোরম গোলাপি কুঁড়ি",
    colorBn: "হালকা গোলাপি",
    sunlightBn: "পূর্ণ রোদ ও পর্যাপ্ত আলো",
    sunlightEn: "Full Sun & Good Light",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "বাঁকুড়ার লাল দোআঁশ মাটি ও ভার্মিকম্পোস্ট",
    soilTipEn: "Bankura red loam & vermicompost blend",
    descriptionBn: "একই ডালে গুচ্ছ আকারে ফোটা মিষ্টি হালকা গোলাপি ফ্লোরিবুন্ডা গোলাপ—কম ছাঁটাইয়েও প্রতি মাসে থোকা ভরে কুঁড়ি ধরে।",
    descriptionEn: "Cluster-flowering soft pink floribunda rose yielding multiple blossoms per stem on balconies.",
    image: getAshokePhotoUrl(55),
    options: [
      {
        id: "opt-45-1",
        labelBn: "গ্রো ব্যাগ (১০–১৪ ইঞ্চি · ৫ মাস)",
        labelEn: "Grow Bag (10–14 in)",
        price: 60,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-46",
    nameBn: "মখমলি কালচে-মেরুন গোলাপ",
    nameEn: "Velvet Deep Maroon Rose",
    botanicalName: "Rosa x hybrida (Crimson)",
    category: "ছাদ ও বারান্দার ফুল",
    audience: ["rooftop","family"],
    badgeBn: "গাঢ় খয়েরি লাল",
    colorBn: "গাঢ় খয়েরি / কালচে লাল",
    sunlightBn: "পূর্ণ রোদ ও পর্যাপ্ত আলো",
    sunlightEn: "Full Sun & Good Light",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "বাঁকুড়ার লাল দোআঁশ মাটি ও ভার্মিকম্পোস্ট",
    soilTipEn: "Bankura red loam & vermicompost blend",
    descriptionBn: "ব্ল্যাক-ব্যাকারা ধাঁচের গাঢ় মখমলি মেরুন-লাল গোলাপ—গভীর রঙ ও পুরু পাপড়ির কারণে বাগানীদের সবচেয়ে পছন্দের সংগ্রহ।",
    descriptionEn: "Velvety deep burgundy-maroon exhibition rose prized for thick petals and dramatic dark hues.",
    image: getAshokePhotoUrl(56),
    options: [
      {
        id: "opt-46-1",
        labelBn: "কলম চারা (১০–১৪ ইঞ্চি · ৬ মাস)",
        labelEn: "Grafted Sapling (10–14 in)",
        price: 80,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-37",
    nameBn: "কমলা-হলুদ কোরাল গোলাপ",
    nameEn: "Red & Yellow Bicolor Rose",
    botanicalName: "Rosa x hybrida (Coral)",
    category: "ছাদ ও বারান্দার ফুল",
    audience: ["rooftop","family"],
    badgeBn: "কমলা কোরাল রং",
    colorBn: "লাল ও হলুদ",
    sunlightBn: "পূর্ণ রোদ ও পর্যাপ্ত আলো",
    sunlightEn: "Full Sun & Good Light",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "বাঁকুড়ার লাল দোআঁশ মাটি ও ভার্মিকম্পোস্ট",
    soilTipEn: "Bankura red loam & vermicompost blend",
    descriptionBn: "আগুনে কমলা ও সোনা-হলুদের মেলবন্ধনে তৈরি উজ্জ্বল কোরাল গোলাপ—তীব্র বাঁকুড়ার রোদেও পাপড়ির রং অটুট থাকে।",
    descriptionEn: "Fiery coral-orange and gold bicolor rose holding vibrant petal contrast under bright sunshine.",
    image: getAshokePhotoUrl(47),
    options: [
      {
        id: "opt-37-1",
        labelBn: "কলম চারা (১০–১৪ ইঞ্চি · ৬ মাস)",
        labelEn: "Grafted Sapling (10–14 in)",
        price: 80,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-39",
    nameBn: "সোনালী হলুদ গোলাপ",
    nameEn: "Golden Yellow Garden Rose",
    botanicalName: "Rosa x hybrida (Golden)",
    category: "ছাদ ও বারান্দার ফুল",
    audience: ["rooftop","family"],
    badgeBn: "সোনালী হলুদ গোলাপ",
    colorBn: "উজ্জ্বল হলুদ",
    sunlightBn: "পূর্ণ রোদ ও পর্যাপ্ত আলো",
    sunlightEn: "Full Sun & Good Light",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "বাঁকুড়ার লাল দোআঁশ মাটি ও ভার্মিকম্পোস্ট",
    soilTipEn: "Bankura red loam & vermicompost blend",
    descriptionBn: "উজ্জ্বল লেবু-সোনালী রঙের দীর্ঘকাণ্ড গোলাপ—শীতের সকালে ও বসন্তে প্রতিটি শাখায় সুগঠিত বড় আকারের হলুদ ফুল ফোটে।",
    descriptionEn: "Sunlit golden-yellow hybrid garden rose producing well-formed classic buds on sturdy stems.",
    image: getAshokePhotoUrl(49),
    options: [
      {
        id: "opt-39-1",
        labelBn: "গ্রো ব্যাগ (১০–১৪ ইঞ্চি · ৫ মাস)",
        labelEn: "Grow Bag (10–14 in)",
        price: 60,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-44",
    nameBn: "লাল-সোনালী শেড হাইব্রিড গোলাপ",
    nameEn: "Crimson & Gold Rose",
    botanicalName: "Rosa x hybrida (Tea)",
    category: "ছাদ ও বারান্দার ফুল",
    audience: ["rooftop","family"],
    badgeBn: "বড় জাতের কলম গোলাপ",
    colorBn: "লাল ও হলুদ শেড",
    sunlightBn: "পূর্ণ রোদ ও পর্যাপ্ত আলো",
    sunlightEn: "Full Sun & Good Light",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "বাঁকুড়ার লাল দোআঁশ মাটি ও ভার্মিকম্পোস্ট",
    soilTipEn: "Bankura red loam & vermicompost blend",
    descriptionBn: "ভেতরের দিকে সোনালী আর বাইরের পাপড়িতে টুকটুকে লাল ছোঁয়ার কলম গোলাপ—১২ ইঞ্চি টবে ঝোপালো হয়ে প্রচুর ফুল দেয়।",
    descriptionEn: "Grafted dual-shade crimson and gold tea rose thriving in 12-inch sunny terrace planters.",
    image: getAshokePhotoUrl(54),
    options: [
      {
        id: "opt-44-1",
        labelBn: "কলম চারা (১০–১৪ ইঞ্চি · ৬ মাস)",
        labelEn: "Grafted Sapling (10–14 in)",
        price: 80,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-80",
    nameBn: "গোলাপ বাই কালার",
    nameEn: "Pink & White Edged Bicolor Rose",
    botanicalName: "Rosa x hybrida (Bi-color)",
    category: "ছাদ ও বারান্দার ফুল",
    audience: ["rooftop","family"],
    badgeBn: "দুই রঙের অপূর্ব মেলবন্ধন",
    colorBn: "গোলাপি ও সাদা বর্ডার",
    sunlightBn: "পূর্ণ রোদ ও পর্যাপ্ত আলো",
    sunlightEn: "Full Sun & Good Light",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "বাঁকুড়ার লাল দোআঁশ মাটি ও ভার্মিকম্পোস্ট",
    soilTipEn: "Bankura red loam & vermicompost blend",
    descriptionBn: "প্রতিটি সাদা পাপড়ির কিনারায় চওড়া গোলাপি আলপনা আঁকা বাই-কালার গোলাপ—প্রদর্শনী ও গিফটিংয়ের জন্য অনন্য।",
    descriptionEn: "Showstopping bicolor rose with crisp white centers framed by vivid rose-pink margins.",
    image: getAshokePhotoUrl(93),
    options: [
      {
        id: "opt-80-1",
        labelBn: "কলম চারা (১০–১৪ ইঞ্চি · ৬ মাস)",
        labelEn: "Grafted Sapling (10–14 in)",
        price: 80,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-70",
    nameBn: "গোলাপি থাই স্থল পদ্ম",
    nameEn: "Thai Pink Confederate Rose",
    botanicalName: "Hibiscus mutabilis (Thai)",
    category: "পূজার ফুল ও পবিত্র গাছ",
    audience: ["puja","rooftop"],
    badgeBn: "থাই বড় স্থলপদ্ম",
    colorBn: "গোলাপি",
    sunlightBn: "পূর্ণ রোদ ও পর্যাপ্ত আলো",
    sunlightEn: "Full Sun & Good Light",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "বাঁকুড়ার লাল দোআঁশ মাটি ও ভার্মিকম্পোস্ট",
    soilTipEn: "Bankura red loam & vermicompost blend",
    descriptionBn: "উন্নত থাই জাতের ঝাঁকড়া স্থলপদ্ম—দেশি গাছের চেয়ে ছোট আকৃতিতেই ১০ ইঞ্চি টবে প্রতিদিন প্রচুর বড় গোলাপি ফুল দেয়।",
    descriptionEn: "Compact Thai dwarf Confederate Rose cultivar flowering generously at lower height in pots.",
    image: getAshokePhotoUrl(83),
    options: [
      {
        id: "opt-70-1",
        labelBn: "গ্রো ব্যাগ (১–১.৫ ফুট · ৬ মাস)",
        labelEn: "Grow Bag (1–1.5 ft)",
        price: 70,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-4",
    nameBn: "ঘন্টা জবা",
    nameEn: "Ghanta Jaba / Coral Pendant Hibiscus",
    botanicalName: "Hibiscus schizopetalus",
    category: "পূজার ফুল ও পবিত্র গাছ",
    audience: ["puja","rooftop"],
    badgeBn: "ঝুলন্ত ঘণ্টার মতো ফুল",
    colorBn: "কোরাল লাল",
    sunlightBn: "পূর্ণ রোদ ও পর্যাপ্ত আলো",
    sunlightEn: "Full Sun & Good Light",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "বাঁকুড়ার লাল দোআঁশ মাটি ও ভার্মিকম্পোস্ট",
    soilTipEn: "Bankura red loam & vermicompost blend",
    descriptionBn: "সূক্ষ্ম লণ্ঠনের মতো নিচের দিকে ঝুলে থাকা জালি-পাপড়ির ঘণ্টা জবা—বাগানের কিনারায় বা হ্যাঙ্গিং ঝোপে অপূর্ব দেখায়।",
    descriptionEn: "Pendulous coral-red lantern hibiscus with intricately fringed petals swaying gracefully in the breeze.",
    image: getAshokePhotoUrl(70),
    options: [
      {
        id: "opt-4-1",
        labelBn: "গ্রো ব্যাগ (১–১.৫ ফুট · ৫ মাস)",
        labelEn: "Grow Bag (1–1.5 ft)",
        price: 60,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-57",
    nameBn: "চন্দ্রমল্লিকা ( সবুজ )",
    nameEn: "Green Chrysanthemum (Chandramallika)",
    botanicalName: "Chrysanthemum indicum (Green)",
    category: "পূজার ফুল ও পবিত্র গাছ",
    audience: ["puja","rooftop"],
    badgeBn: "দুষ্প্রাপ্য সবুজ পাপড়ি",
    colorBn: "সবুজ",
    sunlightBn: "পূর্ণ রোদ ও পর্যাপ্ত আলো",
    sunlightEn: "Full Sun & Good Light",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "বাঁকুড়ার লাল দোআঁশ মাটি ও ভার্মিকম্পোস্ট",
    soilTipEn: "Bankura red loam & vermicompost blend",
    descriptionBn: "বিরল পেস্তা-সবুজ রঙের বোতাম-আকৃতির চন্দ্রমল্লিকা—টবে একসাথে ২০–৩০টি গোল থোকা ফুটে দীর্ঘদিন তাজা থাকে।",
    descriptionEn: "Rare pistachio-green pompom chrysanthemum yielding long-lasting clusters throughout winter.",
    image: getAshokePhotoUrl(68),
    options: [
      {
        id: "opt-57-1",
        labelBn: "মৌসুমী চারা (৫–৭ ইঞ্চি · ৪৫ দিন)",
        labelEn: "Seasonal Sapling (5–7 in)",
        price: 20,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-43",
    nameBn: "চন্দ্রমল্লিকা ফুল",
    nameEn: "Deep Red Chrysanthemum (Chandramallika)",
    botanicalName: "Chrysanthemum morifolium",
    category: "পূজার ফুল ও পবিত্র গাছ",
    audience: ["puja","rooftop"],
    badgeBn: "শীতের উজ্জ্বল রক্তিম চন্দ্রমল্লিকা",
    colorBn: "গাঢ় লাল-মেরুন",
    sunlightBn: "পূর্ণ রোদ ও পর্যাপ্ত আলো",
    sunlightEn: "Full Sun & Good Light",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "বাঁকুড়ার লাল দোআঁশ মাটি ও ভার্মিকম্পোস্ট",
    soilTipEn: "Bankura red loam & vermicompost blend",
    descriptionBn: "গাঢ় রক্তিম-মেরুন রঙের বহুপাপড়ি ডেকোরেটিভ চন্দ্রমল্লিকা—একটি গাছেই শতাধিক ফুল ফোটার ক্ষমতা রাখে।",
    descriptionEn: "Rich deep-crimson decorative chrysanthemum bred for dense, show-quality winter mounds.",
    image: getAshokePhotoUrl(53),
    options: [
      {
        id: "opt-43-1",
        labelBn: "মৌসুমী চারা (৫–৭ ইঞ্চি · ৪৫ দিন)",
        labelEn: "Seasonal Sapling (5–7 in)",
        price: 20,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-22",
    nameBn: "হলুদ ডাবল থোকা জবা",
    nameEn: "Yellow Double Petal Hibiscus",
    botanicalName: "Hibiscus rosa-sinensis (Yellow Double)",
    category: "পূজার ফুল ও পবিত্র গাছ",
    audience: ["puja","rooftop"],
    badgeBn: "ঘন পাপড়ির হলুদ জবা",
    colorBn: "উজ্জ্বল হলুদ ডাবল",
    sunlightBn: "পূর্ণ রোদ ও পর্যাপ্ত আলো",
    sunlightEn: "Full Sun & Good Light",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "বাঁকুড়ার লাল দোআঁশ মাটি ও ভার্মিকম্পোস্ট",
    soilTipEn: "Bankura red loam & vermicompost blend",
    descriptionBn: "গোলাপের মতো ঘন স্তরবিশিষ্ট হলুদ থোকা জবা—অল্প জায়গাতেও প্রতিদিন উজ্জ্বল সোনালী-হলুদ ফুলে ডাল ভরে ওঠে।",
    descriptionEn: "Multi-layered golden-yellow double hibiscus adding bright sunshine contrast to balcony collections.",
    image: getAshokePhotoUrl(30),
    options: [
      {
        id: "opt-22-1",
        labelBn: "গ্রো ব্যাগ (১–১.৫ ফুট · ৬ মাস)",
        labelEn: "Grow Bag (1–1.5 ft)",
        price: 80,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-33",
    nameBn: "সাদা-গোলাপি নয়নতারা জবা",
    nameEn: "White & Pink Center Hibiscus",
    botanicalName: "Hibiscus rosa-sinensis (Bicolor)",
    category: "পূজার ফুল ও পবিত্র গাছ",
    audience: ["puja","rooftop"],
    badgeBn: "সাদা ও গোলাপি কেন্দ্র",
    colorBn: "সাদা ও গোলাপি",
    sunlightBn: "পূর্ণ রোদ ও পর্যাপ্ত আলো",
    sunlightEn: "Full Sun & Good Light",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "বাঁকুড়ার লাল দোআঁশ মাটি ও ভার্মিকম্পোস্ট",
    soilTipEn: "Bankura red loam & vermicompost blend",
    descriptionBn: "সাদা পাপড়ির কেন্দ্রে গভীর লাল-গোলাপি চোখওয়ালা পবিত্র জবা—গৃহপূজায় ও বারান্দায় চিরসবুজ ঝোপ তৈরি করে।",
    descriptionEn: "Crisp white hibiscus accented with a bright magenta eye; prolific bloomer for daily Puja.",
    image: getAshokePhotoUrl(43),
    options: [
      {
        id: "opt-33-1",
        labelBn: "গ্রো ব্যাগ (১–১.৫ ফুট · ৫ মাস)",
        labelEn: "Grow Bag (1–1.5 ft)",
        price: 60,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-24",
    nameBn: "পিচ-কমলা ডাবল থোকা জবা",
    nameEn: "Peach-Orange Double Hibiscus",
    botanicalName: "Hibiscus rosa-sinensis (Peach Double)",
    category: "পূজার ফুল ও পবিত্র গাছ",
    audience: ["puja","rooftop"],
    badgeBn: "থোকা কমলা-গোলাপি জবা",
    colorBn: "কমলা-গোলাপি ডাবল",
    sunlightBn: "পূর্ণ রোদ ও পর্যাপ্ত আলো",
    sunlightEn: "Full Sun & Good Light",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "বাঁকুড়ার লাল দোআঁশ মাটি ও ভার্মিকম্পোস্ট",
    soilTipEn: "Bankura red loam & vermicompost blend",
    descriptionBn: "আগুনে কমলা ও নরম পিচ রঙের কোঁকড়ানো ডাবল পাপড়ির থোকা জবা—বর্ষা ও গরমে টানা ফুল দেয়।",
    descriptionEn: "Lush double-petaled peach-orange hibiscus flourishing across heat and monsoon seasons.",
    image: getAshokePhotoUrl(34),
    options: [
      {
        id: "opt-24-1",
        labelBn: "গ্রো ব্যাগ (১–১.৫ ফুট · ৬ মাস)",
        labelEn: "Grow Bag (1–1.5 ft)",
        price: 80,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-35",
    nameBn: "পঞ্চমুখী ডাবল রক্তজবা",
    nameEn: "Double Petal Red Hibiscus",
    botanicalName: "Hibiscus rosa-sinensis (Red Double)",
    category: "পূজার ফুল ও পবিত্র গাছ",
    audience: ["puja","rooftop"],
    badgeBn: "থোকা রক্তজবা",
    colorBn: "রক্ত লাল ডাবল",
    sunlightBn: "পূর্ণ রোদ ও পর্যাপ্ত আলো",
    sunlightEn: "Full Sun & Good Light",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "বাঁকুড়ার লাল দোআঁশ মাটি ও ভার্মিকম্পোস্ট",
    soilTipEn: "Bankura red loam & vermicompost blend",
    descriptionBn: "গভীর লাল রঙের বহুপাপড়ি পঞ্চমুখী রক্তজবা—কালীপূজা ও নিত্যপূজার অর্ঘ্যের জন্য আদর্শ ও শক্তিশালী শিকড়ের চারা।",
    descriptionEn: "Classic double crimson Panchamukhi Rakta Jaba revered across Bengal for Kali and Shakti worship.",
    image: getAshokePhotoUrl(45),
    options: [
      {
        id: "opt-35-1",
        labelBn: "গ্রো ব্যাগ (১–১.৫ ফুট · ৬ মাস)",
        labelEn: "Grow Bag (1–1.5 ft)",
        price: 80,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-81",
    nameBn: "পুনে ভ্যারাইটি কোরাল জবা",
    nameEn: "Coral Fringed Pune Hibiscus",
    botanicalName: "Hibiscus rosa-sinensis (Pune)",
    category: "পূজার ফুল ও পবিত্র গাছ",
    audience: ["puja","rooftop"],
    badgeBn: "প্রচুর কুঁড়ি ও বারোমাসি",
    colorBn: "সাদা-গোলাপি ঝালর",
    sunlightBn: "পূর্ণ রোদ ও পর্যাপ্ত আলো",
    sunlightEn: "Full Sun & Good Light",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "বাঁকুড়ার লাল দোআঁশ মাটি ও ভার্মিকম্পোস্ট",
    soilTipEn: "Bankura red loam & vermicompost blend",
    descriptionBn: "সাদা-গোলাপি মিশ্রণ ও কুঁচি দেওয়া ধারওয়ালা অরিজিনাল পুনে জবা—ছোট গাছেই একসাথে ৮–১০টি বড় কুঁড়ি নিয়ে আসে।",
    descriptionEn: "Genuine Pune cultivar hibiscus featuring ruffled pink-and-white blooms on compact potted shrubs.",
    image: getAshokePhotoUrl(94),
    options: [
      {
        id: "opt-81-1",
        labelBn: "গ্রো ব্যাগ (১–১.৫ ফুট · ৬ মাস)",
        labelEn: "Grow Bag (1–1.5 ft)",
        price: 70,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-5",
    nameBn: "জবা (লাল)",
    nameEn: "Sacred Red Hibiscus (Rakta Jaba)",
    botanicalName: "Hibiscus rosa-sinensis",
    category: "পূজার ফুল ও পবিত্র গাছ",
    audience: ["puja","rooftop"],
    badgeBn: "মা তারার রক্তজবা",
    colorBn: "রক্ত লাল",
    sunlightBn: "পূর্ণ রোদ ও পর্যাপ্ত আলো",
    sunlightEn: "Full Sun & Good Light",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "বাঁকুড়ার লাল দোআঁশ মাটি ও ভার্মিকম্পোস্ট",
    soilTipEn: "Bankura red loam & vermicompost blend",
    descriptionBn: "বাংলার ঘরে ঘরে প্রতিদিন দেবতার অর্ঘ্যে অপরিহার্য খাঁটি একপাপড়ি দেশি রক্তজবা—রোগবালাই খুব কম ও দীর্ঘজীবী।",
    descriptionEn: "Hardiest native five-petal sacred red hibiscus built for effortless year-round Puja flowers.",
    image: getAshokePhotoUrl(27),
    options: [
      {
        id: "opt-5-1",
        labelBn: "গ্রো ব্যাগ (১–১.৫ ফুট · ৫ মাস)",
        labelEn: "Grow Bag (1–1.5 ft)",
        price: 50,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-82",
    nameBn: "হলুদ-লাল বিশাল অস্ট্রেলিয়ান জবা",
    nameEn: "Giant Australian Hibiscus",
    botanicalName: "Hibiscus rosa-sinensis (Australian Giant)",
    category: "পূজার ফুল ও পবিত্র গাছ",
    audience: ["puja","rooftop"],
    badgeBn: "বিশাল আকারের ফুল",
    colorBn: "হলুদ ও লাল কোকিল",
    sunlightBn: "পূর্ণ রোদ ও পর্যাপ্ত আলো",
    sunlightEn: "Full Sun & Good Light",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "বাঁকুড়ার লাল দোআঁশ মাটি ও ভার্মিকম্পোস্ট",
    soilTipEn: "Bankura red loam & vermicompost blend",
    descriptionBn: "বাইরে সোনালী হলুদ ও ভেতরে সিঁদুরে লাল কেন্দ্রযুক্ত ৭ ইঞ্চি ব্যাসের অস্ট্রেলিয়ান জবা—এক ফুলেই সবার নজর কাড়ে।",
    descriptionEn: "Spectacular yellow-and-crimson Australian hybrid hibiscus opening blooms up to 7 inches wide.",
    image: getAshokePhotoUrl(95),
    options: [
      {
        id: "opt-82-1",
        labelBn: "কলম চারা (১.২–১.৫ ফুট · ৬ মাস)",
        labelEn: "Grafted Sapling (1.2–1.5 ft)",
        price: 120,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-38",
    nameBn: "পিচ-অ্যাপ্রিকট বড় জবা",
    nameEn: "Peach Apricot Hibiscus",
    botanicalName: "Hibiscus rosa-sinensis (Apricot)",
    category: "পূজার ফুল ও পবিত্র গাছ",
    audience: ["puja","rooftop"],
    badgeBn: "ঘন পাপড়ির ফুল",
    colorBn: "কমলা-পিচ (লাল কেন্দ্র)",
    sunlightBn: "পূর্ণ রোদ ও পর্যাপ্ত আলো",
    sunlightEn: "Full Sun & Good Light",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "বাঁকুড়ার লাল দোআঁশ মাটি ও ভার্মিকম্পোস্ট",
    soilTipEn: "Bankura red loam & vermicompost blend",
    descriptionBn: "কেন্দ্রভাগে লাল টুকটুকে বিন্দু ও কোমল অ্যাপ্রিকট পাপড়ির ঝলমলে হাইব্রিড জবা—টবের মাটিতে দ্রুত বাড়ে।",
    descriptionEn: "Velvety apricot-peach hibiscus with a ruby throat, thriving rapidly in well-drained pot soil.",
    image: getAshokePhotoUrl(48),
    options: [
      {
        id: "opt-38-1",
        labelBn: "গ্রো ব্যাগ (১–১.৫ ফুট · ৬ মাস)",
        labelEn: "Grow Bag (1–1.5 ft)",
        price: 90,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-31",
    nameBn: "টিকোমা গৌরি",
    nameEn: "Tecoma Gauri / Yellow Elder",
    botanicalName: "Tecoma stans",
    category: "ছাদ ও বারান্দার ফুল",
    audience: ["rooftop","family"],
    badgeBn: "ঝাঁকড়া সোনালী ফুল",
    colorBn: "উজ্জ্বল সোনালী",
    sunlightBn: "পূর্ণ রোদ ও পর্যাপ্ত আলো",
    sunlightEn: "Full Sun & Good Light",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "বাঁকুড়ার লাল দোআঁশ মাটি ও ভার্মিকম্পোস্ট",
    soilTipEn: "Bankura red loam & vermicompost blend",
    descriptionBn: "বছরের ১০ মাসই থোকা থোকা উজ্জ্বল সোনালী ঘণ্টা ফুলে ভরে থাকা টিকোমা গৌরী—প্রজাপতি ও মৌমাছিকে বাগানে ডেকে আনে।",
    descriptionEn: "Vigorous Yellow Elder shrub producing golden trumpet clusters nearly year-round with minimal care.",
    image: getAshokePhotoUrl(41),
    options: [
      {
        id: "opt-31-1",
        labelBn: "গ্রো ব্যাগ (১.২–১.৫ ফুট · ৫ মাস)",
        labelEn: "Grow Bag (1.2–1.5 ft)",
        price: 60,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-75",
    nameBn: "টিকোমা ফুল",
    nameEn: "Orange Tecoma Capensis",
    botanicalName: "Tecoma capensis",
    category: "ছাদ ও বারান্দার ফুল",
    audience: ["rooftop","family"],
    badgeBn: "কমলা নলাকার ফুল",
    colorBn: "উজ্জ্বল কমলা",
    sunlightBn: "পূর্ণ রোদ ও পর্যাপ্ত আলো",
    sunlightEn: "Full Sun & Good Light",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "বাঁকুড়ার লাল দোআঁশ মাটি ও ভার্মিকম্পোস্ট",
    soilTipEn: "Bankura red loam & vermicompost blend",
    descriptionBn: "উজ্জ্বল কমলা-লাল নলাকার ফুলের কেপ হানিসাকল টিকোমা—বাড়ির বারান্দা, গ্রিল বা সীমানা বেড়ায় রোদ পেলেই অজস্র ফুল ফোটে।",
    descriptionEn: "Bright fiery-orange Cape Honeysuckle bush ideal for sunny railings, borders, and terrace pots.",
    image: getAshokePhotoUrl(88),
    options: [
      {
        id: "opt-75-1",
        labelBn: "গ্রো ব্যাগ (১–১.৫ ফুট · ৫ মাস)",
        labelEn: "Grow Bag (1–1.5 ft)",
        price: 70,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-12",
    nameBn: "থাই রঙ্গন",
    nameEn: "Thai Dwarf Ixora (Rangan)",
    botanicalName: "Ixora coccinea (Thai Dwarf)",
    category: "ছাদ ও বারান্দার ফুল",
    audience: ["rooftop","puja"],
    badgeBn: "ঘন থোকা লাল রঙ্গন",
    colorBn: "লাল",
    sunlightBn: "পূর্ণ রোদ ও পর্যাপ্ত আলো",
    sunlightEn: "Full Sun & Good Light",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "বাঁকুড়ার লাল দোআঁশ মাটি ও ভার্মিকম্পোস্ট",
    soilTipEn: "Bankura red loam & vermicompost blend",
    descriptionBn: "বামন আকৃতির ঘন পাতার থাই রঙ্গন—কয়েক মাস বয়স থেকেই ছোট গাছে লাল বলের মতো গুচ্ছ ফুলের সমারোহ দেখা যায়।",
    descriptionEn: "Compact Thai dwarf Ixora exploding into dense crimson pompom clusters even in small containers.",
    image: getAshokePhotoUrl(31),
    options: [
      {
        id: "opt-12-1",
        labelBn: "গ্রো ব্যাগ (৮–১২ ইঞ্চি · ৫ মাস)",
        labelEn: "Grow Bag (8–12 in)",
        price: 60,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-61",
    nameBn: "দেশী স্থল পদ্ম",
    nameEn: "Native Indian Stholopaddmo",
    botanicalName: "Hibiscus mutabilis (Deshi)",
    category: "পূজার ফুল ও পবিত্র গাছ",
    audience: ["puja","rooftop"],
    badgeBn: "পবিত্র দেশি জাত",
    colorBn: "সাদা থেকে গোলাপি",
    sunlightBn: "পূর্ণ রোদ ও পর্যাপ্ত আলো",
    sunlightEn: "Full Sun & Good Light",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "বাঁকুড়ার লাল দোআঁশ মাটি ও ভার্মিকম্পোস্ট",
    soilTipEn: "Bankura red loam & vermicompost blend",
    descriptionBn: "বাংলার ঐতিহ্যবাহী বড় ঝোপের দেশী স্থলপদ্ম—ভোরবেলা দুধে সাদা হয়ে ফোটে এবং বিকাল হতে হতে গাঢ় গোলাপি রঙ ধারণ করে।",
    descriptionEn: "Heirloom Bengali Confederate Rose shifting organically from pure white at dawn to rose pink by dusk.",
    image: getAshokePhotoUrl(73),
    options: [
      {
        id: "opt-61-1",
        labelBn: "গ্রো ব্যাগ (১.২–১.৫ ফুট · ৫ মাস)",
        labelEn: "Grow Bag (1.2–1.5 ft)",
        price: 50,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-36",
    nameBn: "নীল কন্ঠ ফুল",
    nameEn: "Blue Aparajita / Neel Kantha",
    botanicalName: "Clitoria ternatea",
    category: "পূজার ফুল ও পবিত্র গাছ",
    audience: ["puja","family"],
    badgeBn: "শিব ও মা দুর্গার প্রিয়",
    colorBn: "গাঢ় নীল",
    sunlightBn: "পূর্ণ রোদ ও পর্যাপ্ত আলো",
    sunlightEn: "Full Sun & Good Light",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "বাঁকুড়ার লাল দোআঁশ মাটি ও ভার্মিকম্পোস্ট",
    soilTipEn: "Bankura red loam & vermicompost blend",
    descriptionBn: "গাঢ় নীল ডাবল/সিঙ্গেল নীলকণ্ঠ অপরাজিতা লতা—মহাদেব ও মা দুর্গার পূজার পাশাপাশি ভেষজ নীল চা তৈরিতেও ব্যবহৃত হয়।",
    descriptionEn: "Cobalt-blue sacred Aparajita climber valued both for Durga/Shiva Puja and antioxidant herbal blue tea.",
    image: getAshokePhotoUrl(46),
    options: [
      {
        id: "opt-36-1",
        labelBn: "গ্রো ব্যাগ (১–১.৫ ফুট · ৪ মাস)",
        labelEn: "Grow Bag (1–1.5 ft)",
        price: 80,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-17",
    nameBn: "পবিত্র জলজ পদ্ম কন্দ ও চারা (গোলাপি / সাদা / লাল)",
    nameEn: "Sacred Water Lotus Tuber Sapling (Pink / White / Red)",
    botanicalName: "Nelumbo nucifera",
    category: "পূজার ফুল ও পবিত্র গাছ",
    audience: ["puja","family"],
    badgeBn: "জলজ পবিত্র পদ্মের চারা",
    colorBn: "গোলাপি, সাদা ও লাল জাত",
    sunlightBn: "দিনে ৫-৬ ঘণ্টা পূর্ণ রোদ",
    sunlightEn: "5-6 Hours Full Sunlight",
    wateringBn: "পাত্রে সবসময় ৩-৪ ইঞ্চি পরিষ্কার জল রাখুন",
    wateringEn: "Maintain 3-4 inches standing clean water",
    soilTipBn: "পুকুরের এঁটেল মাটি ও সামান্য গোবর সার",
    soilTipEn: "Heavy clay/pond mud with aged cow manure",
    descriptionBn: "পুকুরের এঁটেল মাটিসহ প্রস্তুত শিকড়যুক্ত তাজা জলজ পদ্ম কন্দ ও চারা—বাড়িতে নিয়ে বড় গামলা বা টবে ৩–৪ ইঞ্চি জলে রোদে রাখলেই ৪৫–৬০ দিনে পবিত্র ফুল ফুটবে। গোলাপি, শ্বেত ও লাল তিন রঙের জাতই পাওয়া যায়।",
    descriptionEn: "Established aquatic sacred lotus rhizome & leaf sapling (available in Pink, White & Red); simply submerge in a sunny clay-filled tub for blooms within 45–60 days.",
    image: lotusOrigImg,
    images: [lotusOrigImg, getAshokePhotoUrl(36), getAshokePhotoUrl(38)],
    options: [
      {
        id: "opt-17-1",
        labelBn: "জলজ কন্দ চারা (গোলাপি / সাদা / লাল · ৪৫–৬০ দিনে ফুল)",
        labelEn: "Aquatic Tuber Sapling (Pink / White / Red)",
        price: 350,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-21",
    nameBn: "পুনা জবা",
    nameEn: "Pune Hybrid Hibiscus",
    botanicalName: "Hibiscus rosa-sinensis (Pune Pink)",
    category: "পূজার ফুল ও পবিত্র গাছ",
    audience: ["puja","rooftop"],
    badgeBn: "বারোমাসি কুঁড়ির কলম",
    colorBn: "গোলাপি (লাল কেন্দ্র)",
    sunlightBn: "পূর্ণ রোদ ও পর্যাপ্ত আলো",
    sunlightEn: "Full Sun & Good Light",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "বাঁকুড়ার লাল দোআঁশ মাটি ও ভার্মিকম্পোস্ট",
    soilTipEn: "Bankura red loam & vermicompost blend",
    descriptionBn: "আকর্ষণীয় হালকা গোলাপি রঙের বড় একপাপড়ি পুনে জবা—পাপড়ির মাঝখানে গাঢ় মেরুন চোখ থাকায় গাছটি দেখতে অত্যন্ত মনোমুগ্ধকর।",
    descriptionEn: "Soft rose-pink Pune hibiscus marked with a deep crimson center, thriving in sunny terrace pots.",
    image: getAshokePhotoUrl(22),
    options: [
      {
        id: "opt-21-1",
        labelBn: "গ্রো ব্যাগ (১–১.৫ ফুট · ৬ মাস)",
        labelEn: "Grow Bag (1–1.5 ft)",
        price: 60,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-76",
    nameBn: "লাল-হলুদ বর্ডার পুনে জবা",
    nameEn: "Exotic Pune Hibiscus",
    botanicalName: "Hibiscus rosa-sinensis (Pune Red)",
    category: "পূজার ফুল ও পবিত্র গাছ",
    audience: ["puja","rooftop"],
    badgeBn: "উন্নত পুনে জাত",
    colorBn: "লাল ও হলুদ বর্ডার",
    sunlightBn: "পূর্ণ রোদ ও পর্যাপ্ত আলো",
    sunlightEn: "Full Sun & Good Light",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "বাঁকুড়ার লাল দোআঁশ মাটি ও ভার্মিকম্পোস্ট",
    soilTipEn: "Bankura red loam & vermicompost blend",
    descriptionBn: "টকটকে লাল পাপড়ির ধারে সোনালী-হলুদ নকশা করা স্পেশাল পুনে হাইব্রিড জবা—আধুনিক ছাদবাগানের জন্য অত্যন্ত আকর্ষণীয় সংযোজন।",
    descriptionEn: "Striking crimson Pune hibiscus rimmed with golden-yellow edges; standout collector variety.",
    image: getAshokePhotoUrl(89),
    options: [
      {
        id: "opt-76-1",
        labelBn: "গ্রো ব্যাগ (১–১.৫ ফুট · ৬ মাস)",
        labelEn: "Grow Bag (1–1.5 ft)",
        price: 80,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-56",
    nameBn: "প্যাশিয়ন ফুল",
    nameEn: "Crimson Passion Flower (Krishna Kamal)",
    botanicalName: "Passiflora coccinea",
    category: "পূজার ফুল ও পবিত্র গাছ",
    audience: ["puja","rooftop"],
    badgeBn: "মহাভারতের কৃষ্ণকমল লতা",
    colorBn: "রক্ত লাল ও হলুদ",
    sunlightBn: "পূর্ণ রোদ ও পর্যাপ্ত আলো",
    sunlightEn: "Full Sun & Good Light",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "বাঁকুড়ার লাল দোআঁশ মাটি ও ভার্মিকম্পোস্ট",
    soilTipEn: "Bankura red loam & vermicompost blend",
    descriptionBn: "রক্তলাল কিরণাকৃতি পাপড়ির বিস্ময়কর কৃষ্ণকমল (প্যাশন ফ্লাওয়ার) লতা—অল্প সময়ে গ্রিল বা মাচায় চড়ে পবিত্র ও অনন্য ফুল ফোটায়।",
    descriptionEn: "Dramatic scarlet Krishna Kamal passion vine climbing trellises rapidly with intricate star-shaped blooms.",
    image: getAshokePhotoUrl(67),
    options: [
      {
        id: "opt-56-1",
        labelBn: "লতানো চারা (১–১.৫ ফুট · ৪ মাস)",
        labelEn: "Climbing Sapling (1–1.5 ft)",
        price: 50,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-79",
    nameBn: "মেরুন-সোনালী ডোরা গোলাপ",
    nameEn: "Deep Maroon & Gold Flecked Rose",
    botanicalName: "Rosa x hybrida (Two-tone)",
    category: "ছাদ ও বারান্দার ফুল",
    audience: ["rooftop","family"],
    badgeBn: "গোলাপি ও সাদা মিশ্রণ",
    colorBn: "গাঢ় মেরুন ও হলুদ ছোপ",
    sunlightBn: "পূর্ণ রোদ ও পর্যাপ্ত আলো",
    sunlightEn: "Full Sun & Good Light",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "বাঁকুড়ার লাল দোআঁশ মাটি ও ভার্মিকম্পোস্ট",
    soilTipEn: "Bankura red loam & vermicompost blend",
    descriptionBn: "গভীর মেরুন পাপড়ির ওপর সোনালী হলুদ রঙের প্রাকৃতিক ডোরা আঁকা টাইগার-স্টাইলের বিরল বাই-কালার গোলাপ।",
    descriptionEn: "Striped burgundy and gold designer hybrid rose; every bloom displays unique painter-like streaks.",
    image: getAshokePhotoUrl(92),
    options: [
      {
        id: "opt-79-1",
        labelBn: "কলম চারা (১০–১৪ ইঞ্চি · ৬ মাস)",
        labelEn: "Grafted Sapling (10–14 in)",
        price: 80,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-58",
    nameBn: "লাল-সাদা ডোরাকাটা আব্রাকাডাব্রা গোলাপ",
    nameEn: "Abracadabra Red & White Striped Rose",
    botanicalName: "Rosa x hybrida (Circus)",
    category: "ছাদ ও বারান্দার ফুল",
    audience: ["rooftop","family"],
    badgeBn: "হলুদ ও লাল শেড",
    colorBn: "লাল ও সাদা ডোরা",
    sunlightBn: "পূর্ণ রোদ ও পর্যাপ্ত আলো",
    sunlightEn: "Full Sun & Good Light",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "বাঁকুড়ার লাল দোআঁশ মাটি ও ভার্মিকম্পোস্ট",
    soilTipEn: "Bankura red loam & vermicompost blend",
    descriptionBn: "লাল ও দুধে-সাদা রঙের স্পষ্ট স্ট্রাইপযুক্ত \"আব্রাকাডাব্রা\" গোলাপ—দীর্ঘদিন গাছে টাটকা থাকে ও ছাদবাগানে নজর কাড়ে।",
    descriptionEn: "Famous candy-striped crimson and ivory rose variety prized by rose enthusiasts.",
    image: getAshokePhotoUrl(69),
    options: [
      {
        id: "opt-58-1",
        labelBn: "কলম চারা (১০–১৪ ইঞ্চি · ৬ মাস)",
        labelEn: "Grafted Sapling (10–14 in)",
        price: 80,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-7",
    nameBn: "বোগেনভিলিয়া (গোলাপি)",
    nameEn: "Pink Bougainvillea (Baganbilas)",
    botanicalName: "Bougainvillea spectabilis",
    category: "ছাদ ও বারান্দার ফুল",
    audience: ["rooftop","family"],
    badgeBn: "কড়া রোদ সহ্যকারী ফুল",
    colorBn: "গোলাপি",
    sunlightBn: "পূর্ণ রোদ ও পর্যাপ্ত আলো",
    sunlightEn: "Full Sun & Good Light",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "বাঁকুড়ার লাল দোআঁশ মাটি ও ভার্মিকম্পোস্ট",
    soilTipEn: "Bankura red loam & vermicompost blend",
    descriptionBn: "বাঁকুড়ার তীব্র গরমে সবচেয়ে কম জলে ফুলে ফুলে ঢেকে যাওয়া গোলাপি বাগানবিলাস—টব বা গেটের ওপর লতায় বা বনসাই রূপে মানানসই।",
    descriptionEn: "Heat-loving magenta-pink Bougainvillea erupting in papery bract clouds with minimal water.",
    image: getAshokePhotoUrl(23),
    options: [
      {
        id: "opt-7-1",
        labelBn: "শিকড়যুক্ত চারা (১–১.৫ ফুট · ৬ মাস)",
        labelEn: "Rooted Sapling (1–1.5 ft)",
        price: 90,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-27",
    nameBn: "ভেনেশতারা",
    nameEn: "Golden Flame Creeper (Veneshtara)",
    botanicalName: "Pyrostegia venusta",
    category: "ছাদ ও বারান্দার ফুল",
    audience: ["rooftop","family"],
    badgeBn: "ঝুলন্ত কমলা ফুলের লতা",
    colorBn: "উজ্জ্বল কমলা",
    sunlightBn: "পূর্ণ রোদ ও পর্যাপ্ত আলো",
    sunlightEn: "Full Sun & Good Light",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "বাঁকুড়ার লাল দোআঁশ মাটি ও ভার্মিকম্পোস্ট",
    soilTipEn: "Bankura red loam & vermicompost blend",
    descriptionBn: "গেট, বারান্দা ও ছাদের মাচায় ভরে ওঠা উজ্জ্বল কমলা রঙের লতানো ফুলগাছ।",
    descriptionEn: "Vigorous cascading orange flame creeper ideal for trellises, gates, and balconies.",
    image: getAshokePhotoUrl(37),
    options: [
      {
        id: "opt-27-1",
        labelBn: "লতানো চারা (১.২–১.৫ ফুট · ৫ মাস)",
        labelEn: "Vine Sapling (1.2–1.5 ft)",
        price: 80,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-23",
    nameBn: "মধু - মালতী",
    nameEn: "Madhu Malati / Rangoon Creeper",
    botanicalName: "Combretum indicum",
    category: "ছাদ ও বারান্দার ফুল",
    audience: ["rooftop","family"],
    badgeBn: "সুমিষ্ট সুবাসের লতা",
    colorBn: "সাদা থেকে লাল",
    sunlightBn: "পূর্ণ রোদ ও পর্যাপ্ত আলো",
    sunlightEn: "Full Sun & Good Light",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "বাঁকুড়ার লাল দোআঁশ মাটি ও ভার্মিকম্পোস্ট",
    soilTipEn: "Bankura red loam & vermicompost blend",
    descriptionBn: "বিকাল থেকে রাত পর্যন্ত মধুর মতো সুবাস ছড়ানো সাদা-গোলাপি-লাল তিন রঙের মধুমালতী লতা—সদর দরজা ও ব্যালকনির প্রিয় লতা।",
    descriptionEn: "Sweetly scented Rangoon Creeper whose clusters shift from white to pink to ruby red.",
    image: getAshokePhotoUrl(32),
    options: [
      {
        id: "opt-23-1",
        labelBn: "লতানো চারা (১–১.৫ ফুট · ৫ মাস)",
        labelEn: "Creeper Sapling (1–1.5 ft)",
        price: 60,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-68",
    nameBn: "মালটিভিলা ফুল",
    nameEn: "Mandevilla Climbing Vine",
    botanicalName: "Mandevilla sanderi",
    category: "ছাদ ও বারান্দার ফুল",
    audience: ["rooftop","family"],
    badgeBn: "বেলুনাকৃতি বড় ফুল",
    colorBn: "গোলাপি",
    sunlightBn: "পূর্ণ রোদ ও পর্যাপ্ত আলো",
    sunlightEn: "Full Sun & Good Light",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "বাঁকুড়ার লাল দোআঁশ মাটি ও ভার্মিকম্পোস্ট",
    soilTipEn: "Bankura red loam & vermicompost blend",
    descriptionBn: "চকচকে গাঢ় সবুজ পাতার ফাঁকে বড় বড় গোলাপি ঘণ্টাকৃতি ম্যান্ডেভিলা লতা—ব্যালকনির গ্রিলে সারাবছর ঝলমলে ফুল দেয়।",
    descriptionEn: "Glossy evergreen Mandevilla climber blooming with bold trumpet-pink flowers across spring and summer.",
    image: getAshokePhotoUrl(81),
    options: [
      {
        id: "opt-68-1",
        labelBn: "টবের লতা চারা (১–১.৫ ফুট · ৬ মাস)",
        labelEn: "Potted Vine (1–1.5 ft)",
        price: 120,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-49",
    nameBn: "মাল্টিভিলা ( হলুদ )",
    nameEn: "Yellow Mandevilla / Allamanda",
    botanicalName: "Allamanda cathartica",
    category: "ছাদ ও বারান্দার ফুল",
    audience: ["rooftop","family"],
    badgeBn: "উজ্জ্বল হলুদ ঘণ্টা ফুল",
    colorBn: "উজ্জ্বল হলুদ",
    sunlightBn: "পূর্ণ রোদ ও পর্যাপ্ত আলো",
    sunlightEn: "Full Sun & Good Light",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "বাঁকুড়ার লাল দোআঁশ মাটি ও ভার্মিকম্পোস্ট",
    soilTipEn: "Bankura red loam & vermicompost blend",
    descriptionBn: "টকটকে উজ্জ্বল হলুদ মাইকের মতো বড় অ্যালমান্ডা (হলুদ ম্যান্ডেভিলা)—গ্রীষ্ম ও বর্ষায় একটানা বাগান আলো করে রাখে।",
    descriptionEn: "Sunny yellow golden-trumpet Allamanda bush blooming heavily through monsoon and summer warmth.",
    image: getAshokePhotoUrl(59),
    options: [
      {
        id: "opt-49-1",
        labelBn: "গ্রো ব্যাগ (১–১.৫ ফুট · ৫ মাস)",
        labelEn: "Grow Bag (1–1.5 ft)",
        price: 70,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-53",
    nameBn: "মুসান্ডা ফুল",
    nameEn: "Mussaenda / Bangkok Rose",
    botanicalName: "Mussaenda erythrophylla",
    category: "ছাদ ও বারান্দার ফুল",
    audience: ["rooftop","family"],
    badgeBn: "মখমলি পাতার সৌন্দর্য",
    colorBn: "গোলাপি ও সাদা",
    sunlightBn: "পূর্ণ রোদ ও পর্যাপ্ত আলো",
    sunlightEn: "Full Sun & Good Light",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "বাঁকুড়ার লাল দোআঁশ মাটি ও ভার্মিকম্পোস্ট",
    soilTipEn: "Bankura red loam & vermicompost blend",
    descriptionBn: "সাদা ও গোলাপি মখমলি পাতার মতো বড় ব্রেক্টওয়ালা মুসান্ডা (ব্যাংকক রোজ)—একটি ফোটা গুচ্ছ বহু সপ্তাহ রঙিন হয়ে থাকে।",
    descriptionEn: "Velvety rose-and-cream bracted Mussaenda bush holding color steady through monsoon humidity.",
    image: getAshokePhotoUrl(64),
    options: [
      {
        id: "opt-53-1",
        labelBn: "কলম চারা (১–১.৫ ফুট · ৬ মাস)",
        labelEn: "Grafted Sapling (1–1.5 ft)",
        price: 90,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-47",
    nameBn: "রঙ্গন ফুল",
    nameEn: "Native Red Ixora / Rangan",
    botanicalName: "Ixora coccinea",
    category: "ছাদ ও বারান্দার ফুল",
    audience: ["rooftop","puja"],
    badgeBn: "চিরসবুজ রঙ্গন ফুল",
    colorBn: "রক্ত লাল",
    sunlightBn: "পূর্ণ রোদ ও পর্যাপ্ত আলো",
    sunlightEn: "Full Sun & Good Light",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "বাঁকুড়ার লাল দোআঁশ মাটি ও ভার্মিকম্পোস্ট",
    soilTipEn: "Bankura red loam & vermicompost blend",
    descriptionBn: "বাঁকুড়ার মাটির উপযোগী খাঁটি লাল দেশি রঙ্গন—কঠিন রোদেও অনায়াসে ঘন লাল ফুলের থোকা উপহার দেয়।",
    descriptionEn: "Hardy native red Ixora shrub thriving effortlessly in sunny Bengal courtyards and temple yards.",
    image: getAshokePhotoUrl(57),
    options: [
      {
        id: "opt-47-1",
        labelBn: "গ্রো ব্যাগ (১–১.২ ফুট · ৫ মাস)",
        labelEn: "Grow Bag (1–1.2 ft)",
        price: 50,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-25",
    nameBn: "শিব জটা",
    nameEn: "Shiba Jata / Cockscomb Cristata",
    botanicalName: "Acalypha hispida (Chenille)",
    category: "পূজার ফুল ও পবিত্র গাছ",
    audience: ["puja","family"],
    badgeBn: "ভগবান শিবের জটাকৃতি ফুল",
    colorBn: "গাঢ় লাল",
    sunlightBn: "পূর্ণ রোদ ও পর্যাপ্ত আলো",
    sunlightEn: "Full Sun & Good Light",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "বাঁকুড়ার লাল দোআঁশ মাটি ও ভার্মিকম্পোস্ট",
    soilTipEn: "Bankura red loam & vermicompost blend",
    descriptionBn: "শিবঠাকুরের জটার মতো লম্বা ও মখমলি লাল ঝুলন্ত ফুল, বাগানের বিশেষ আকর্ষণ।",
    descriptionEn: "Velvety crimson trailing chenille flower spikes, prized for ornamental gardens.",
    image: getAshokePhotoUrl(35),
    options: [
      {
        id: "opt-25-1",
        labelBn: "গ্রো ব্যাগ (১.২–১.৫ ফুট · ৬ মাস)",
        labelEn: "Grow Bag (1.2–1.5 ft)",
        price: 160,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-64",
    nameBn: "সাদা গোলাপ",
    nameEn: "White Fragrant Rose",
    botanicalName: "Rosa x hybrida (White)",
    category: "ছাদ ও বারান্দার ফুল",
    audience: ["rooftop","family"],
    badgeBn: "সাদা সুবাসিত গোলাপ",
    colorBn: "স্নিগ্ধ সাদা",
    sunlightBn: "পূর্ণ রোদ ও পর্যাপ্ত আলো",
    sunlightEn: "Full Sun & Good Light",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "বাঁকুড়ার লাল দোআঁশ মাটি ও ভার্মিকম্পোস্ট",
    soilTipEn: "Bankura red loam & vermicompost blend",
    descriptionBn: "খাঁটি বরফ-সাদা সুগন্ধি হাইব্রিড গোলাপ—প্রতিটি ফুল ধীরে ধীরে ফুটে ওঠে ও শান্ত, পবিত্র শোভা ছড়ায়।",
    descriptionEn: "Pure snow-white fragrant rose with crisp, slow-opening buds ideal for sunlit pots.",
    image: getAshokePhotoUrl(76),
    options: [
      {
        id: "opt-64-1",
        labelBn: "কলম চারা (১০–১৪ ইঞ্চি · ৬ মাস)",
        labelEn: "Grafted Sapling (10–14 in)",
        price: 80,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-41",
    nameBn: "স্থলপদ্ম",
    nameEn: "Confederate Rose / Stholopaddmo",
    botanicalName: "Hibiscus mutabilis",
    category: "পূজার ফুল ও পবিত্র গাছ",
    audience: ["puja","rooftop"],
    badgeBn: "সকাল-সন্ধ্যার রূপবতী",
    colorBn: "গোলাপি",
    sunlightBn: "পূর্ণ রোদ ও পর্যাপ্ত আলো",
    sunlightEn: "Full Sun & Good Light",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "বাঁকুড়ার লাল দোআঁশ মাটি ও ভার্মিকম্পোস্ট",
    soilTipEn: "Bankura red loam & vermicompost blend",
    descriptionBn: "সকালে সাদা থেকে দুপুরে গোলাপি রঙ বদলানো পবিত্র ডাবল স্থলপদ্ম চারা।",
    descriptionEn: "Double-petal Confederate Rose blooming white in morning and turning pink by afternoon.",
    image: stholopaddmoOrigImg,
    options: [
      {
        id: "opt-41-1",
        labelBn: "গ্রো ব্যাগ (১.২–১.৫ ফুট · ৬ মাস)",
        labelEn: "Grow Bag (1.2–1.5 ft)",
        price: 80,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-59",
    nameBn: "হলুদ গাঁদা ফুল",
    nameEn: "Yellow French Marigold",
    botanicalName: "Tagetes patula (Yellow)",
    category: "পূজার ফুল ও পবিত্র গাছ",
    audience: ["puja","rooftop"],
    badgeBn: "সোনালী হলুদ গাঁদা",
    colorBn: "উজ্জ্বল হলুদ",
    sunlightBn: "পূর্ণ রোদ ও পর্যাপ্ত আলো",
    sunlightEn: "Full Sun & Good Light",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "বাঁকুড়ার লাল দোআঁশ মাটি ও ভার্মিকম্পোস্ট",
    soilTipEn: "Bankura red loam & vermicompost blend",
    descriptionBn: "হালকা ঝালর কাটা পাপড়ির সোনালী হলুদ ফ্রেঞ্চ গাঁদা—পূজার অর্ঘ্যে ও ছাদবাগানের পোকা তাড়ানোর সাথী গাছ হিসেবে চমৎকার।",
    descriptionEn: "Sunny golden-yellow French marigold seedlings ideal for garlands and natural garden pest control.",
    image: getAshokePhotoUrl(71),
    options: [
      {
        id: "opt-59-1",
        labelBn: "মৌসুমী চারা (৫–৭ ইঞ্চি · ৩০ দিন)",
        labelEn: "Seasonal Seedling (5–7 in)",
        price: 15,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-66",
    nameBn: "র‍্যাফিস পাম (Rhapis Palm)",
    nameEn: "Rhapis Palm / Broadleaf Lady Palm",
    botanicalName: "Rhapis excelsa",
    category: "গৃহস্থ ও ঔষধি গাছ",
    audience: ["family","rooftop"],
    badgeBn: "ইনডোর এয়ার পিউরিফায়ার",
    colorBn: "গাঢ় সবুজ",
    sunlightBn: "হালকা ছায়া ও উজ্জ্বল পরোক্ষ আলো",
    sunlightEn: "Bright Indirect Light / Partial Shade",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "হালকা কোকোপিট, বালি ও ভার্মিকম্পোস্ট মিশ্রণ",
    soilTipEn: "Well-draining cocopeat, sand & vermicompost mix",
    descriptionBn: "ঘরের ভেতর ও বারান্দার ছায়ায় বাতাস বিশুদ্ধ রাখতে দারুণ কার্যকর চিরসবুজ র‍্যাপিস পাম।",
    descriptionEn: "Lush shade-loving indoor lady palm that naturally purifies home and living room air.",
    image: getAshokePhotoUrl(78),
    options: [
      {
        id: "opt-66-1",
        labelBn: "বড় গ্রো ব্যাগ (১.৫–২ ফুট · ১ বছর)",
        labelEn: "Large Polybag (1.5–2 ft · 1 yr)",
        price: 350,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-50",
    nameBn: "রঙিন পাতাবাহার (ক্রোটন-মাল্টিকালার)",
    nameEn: "Colorful Caladium / Croton",
    botanicalName: "Codiaeum variegatum",
    category: "গৃহস্থ ও ঔষধি গাছ",
    audience: ["family","rooftop"],
    badgeBn: "রংবেরঙের বাহারি পাতা",
    colorBn: "মাল্টিকালার",
    sunlightBn: "হালকা ছায়া ও উজ্জ্বল পরোক্ষ আলো",
    sunlightEn: "Bright Indirect Light / Partial Shade",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "হালকা কোকোপিট, বালি ও ভার্মিকম্পোস্ট মিশ্রণ",
    soilTipEn: "Well-draining cocopeat, sand & vermicompost mix",
    descriptionBn: "সবুজের ওপর লাল, হলুদ ও কমলার দারুণ ছোপযুক্ত চওড়া পাতার বাহারি ক্রোটন—বাড়ির প্রবেশদ্বার ও সিঁড়িতে উজ্জ্বল রঙ আনে।",
    descriptionEn: "Bold multi-colored broadleaf croton adding tropical crimson and amber tones to verandas.",
    image: getAshokePhotoUrl(80),
    options: [
      {
        id: "opt-50-1",
        labelBn: "গ্রো ব্যাগ (১–১.৫ ফুট · ৬ মাস)",
        labelEn: "Grow Bag (1–1.5 ft)",
        price: 150,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-60",
    nameBn: "পেট্রা ভ্যারাইটি পাতাবাহার",
    nameEn: "Variegated Croton Foliage",
    botanicalName: "Codiaeum variegatum (Petra)",
    category: "গৃহস্থ ও ঔষধি গাছ",
    audience: ["family","rooftop"],
    badgeBn: "ছায়াপ্রিয় পাতাবাহার",
    colorBn: "হলুদ ও লাল ছোপ",
    sunlightBn: "হালকা ছায়া ও উজ্জ্বল পরোক্ষ আলো",
    sunlightEn: "Bright Indirect Light / Partial Shade",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "হালকা কোকোপিট, বালি ও ভার্মিকম্পোস্ট মিশ্রণ",
    soilTipEn: "Well-draining cocopeat, sand & vermicompost mix",
    descriptionBn: "হলুদ ও গাঢ় লাল শিরাযুক্ত শক্ত ও চকচকে পাতার \"পেট্রা\" ক্রোটন—ফুল না ফুটলেও সারাবছর পাতার রঙেই বাগান জমজমাট থাকে।",
    descriptionEn: "Striking Petra croton with thick veined leaves glowing in yellow, scarlet, and emerald green.",
    image: getAshokePhotoUrl(72),
    options: [
      {
        id: "opt-60-1",
        labelBn: "গ্রো ব্যাগ (১–১.৫ ফুট · ৬ মাস)",
        labelEn: "Grow Bag (1–1.5 ft)",
        price: 150,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-10",
    nameBn: "পাতাবাহার (ক্রোটন)",
    nameEn: "Croton Gold Dust",
    botanicalName: "Codiaeum variegatum (Gold Dust)",
    category: "গৃহস্থ ও ঔষধি গাছ",
    audience: ["family","rooftop"],
    badgeBn: "সোনালী ফোঁটা পাতাবাহার",
    colorBn: "সবুজ ও সোনালী",
    sunlightBn: "হালকা ছায়া ও উজ্জ্বল পরোক্ষ আলো",
    sunlightEn: "Bright Indirect Light / Partial Shade",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "হালকা কোকোপিট, বালি ও ভার্মিকম্পোস্ট মিশ্রণ",
    soilTipEn: "Well-draining cocopeat, sand & vermicompost mix",
    descriptionBn: "গাঢ় সবুজ পাতার গায়ে সোনালী রেণু ছড়ানো গোল্ড-ডাস্ট ক্রোটন—হালকা ছায়া ও বারান্দার এক কোণে দারুণ ঝোপালো হয়।",
    descriptionEn: "Gold-Dust croton speckled with luminous golden dots; hardy indoor-veranda foliage shrub.",
    image: getAshokePhotoUrl(10),
    options: [
      {
        id: "opt-10-1",
        labelBn: "গ্রো ব্যাগ (১০–১২ ইঞ্চি · ৫ মাস)",
        labelEn: "Grow Bag (10–12 in)",
        price: 70,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-67",
    nameBn: "ব্রাজিলিয়ান লাকি ব্যাম্বু",
    nameEn: "Brazilian Lucky Bamboo",
    botanicalName: "Dracaena sanderiana (Brazilian)",
    category: "গৃহস্থ ও ঔষধি গাছ",
    audience: ["family"],
    badgeBn: "গৃহস্থের সুখ-শান্তি",
    colorBn: "গাঢ় সবুজ",
    sunlightBn: "হালকা ছায়া ও উজ্জ্বল পরোক্ষ আলো",
    sunlightEn: "Bright Indirect Light / Partial Shade",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "হালকা কোকোপিট, বালি ও ভার্মিকম্পোস্ট মিশ্রণ",
    soilTipEn: "Well-draining cocopeat, sand & vermicompost mix",
    descriptionBn: "প্রকৃত ব্রাজিলিয়ান ড্রেসিনা কাঠের লগ থেকে বেরোনো নতুন সবুজ পাতা—অল্প আলোতে জলের পাত্রেই বসার ঘরে দারুণ সৌন্দর্য আনে।",
    descriptionEn: "Authentic rooted Brazilian Lucky Wood trunk sprouting fresh foliage in shallow indoor water trays.",
    image: getAshokePhotoUrl(79),
    options: [
      {
        id: "opt-67-1",
        labelBn: "প্রস্তুত কাঠের লগ (৬–৮ ইঞ্চি · শিকড়সহ)",
        labelEn: "Rooted Wood Log (6–8 in)",
        price: 550,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-8",
    nameBn: "মানি প্ল্যান্ট",
    nameEn: "Golden Pothos / Money Plant",
    botanicalName: "Epipremnum aureum",
    category: "গৃহস্থ ও ঔষধি গাছ",
    audience: ["family"],
    badgeBn: "বাতাস বিশুদ্ধকারী লতা",
    colorBn: "সবুজ ও সোনালী",
    sunlightBn: "হালকা ছায়া ও উজ্জ্বল পরোক্ষ আলো",
    sunlightEn: "Bright Indirect Light / Partial Shade",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "হালকা কোকোপিট, বালি ও ভার্মিকম্পোস্ট মিশ্রণ",
    soilTipEn: "Well-draining cocopeat, sand & vermicompost mix",
    descriptionBn: "সবুজ পাতায় সোনালী ছোপওয়ালা মানি প্ল্যান্ট (গোল্ডেন পথোস)—মাটি বা জলের বোতল দুই জায়গাতেই দ্রুত লতিয়ে ঘরের বাতাস শুদ্ধ করে।",
    descriptionEn: "Fast-trailing Golden Pothos ivy thriving effortlessly in water jars or hanging balcony pots.",
    image: getAshokePhotoUrl(8),
    options: [
      {
        id: "opt-8-1",
        labelBn: "লতা চারা (৮–১০ ইঞ্চি · শিকড়সহ)",
        labelEn: "Rooted Vine (8–10 in)",
        price: 40,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-71",
    nameBn: "রাবার গাছ",
    nameEn: "Burgundy Rubber Tree",
    botanicalName: "Ficus elastica",
    category: "গৃহস্থ ও ঔষধি গাছ",
    audience: ["family"],
    badgeBn: "চকচকে চওড়া পাতা",
    colorBn: "বারগান্ডি খয়েরি",
    sunlightBn: "হালকা ছায়া ও উজ্জ্বল পরোক্ষ আলো",
    sunlightEn: "Bright Indirect Light / Partial Shade",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "হালকা কোকোপিট, বালি ও ভার্মিকম্পোস্ট মিশ্রণ",
    soilTipEn: "Well-draining cocopeat, sand & vermicompost mix",
    descriptionBn: "মোটা, চকচকে কালচে-খয়েরি (বার্গান্ডি) পাতার ইনডোর রাবার প্ল্যান্ট—বসার ঘর ও অফিসের কোণকে দেয় আধুনিক আভিজাত্য।",
    descriptionEn: "Glossy deep-burgundy Ficus Elastica rubber plant bringing architectural elegance to living rooms.",
    image: getAshokePhotoUrl(84),
    options: [
      {
        id: "opt-71-1",
        labelBn: "গ্রো ব্যাগ (১–১.৫ ফুট · ৬ মাস)",
        labelEn: "Grow Bag (1–1.5 ft)",
        price: 70,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-65",
    nameBn: "লাকি ব্যাম্বু (৩ স্তর)",
    nameEn: "Lucky Bamboo 3-Tier",
    botanicalName: "Dracaena braunii",
    category: "গৃহস্থ ও ঔষধি গাছ",
    audience: ["family"],
    badgeBn: "জলজ লাকি ব্যাম্বু",
    colorBn: "সবুজ",
    sunlightBn: "হালকা ছায়া ও উজ্জ্বল পরোক্ষ আলো",
    sunlightEn: "Bright Indirect Light / Partial Shade",
    wateringBn: "পরিষ্কার জলে বা ভেজা নুড়িতে রাখুন",
    wateringEn: "Keep roots submerged in clean fresh water",
    soilTipBn: "হালকা কোকোপিট, বালি ও ভার্মিকম্পোস্ট মিশ্রণ",
    soilTipEn: "Well-draining cocopeat, sand & vermicompost mix",
    descriptionBn: "সুন্দর ৩-স্তরের গোছানো জলজ লাকি ব্যাম্বু—সপ্তাহে একবার পরিষ্কার জল পাল্টে দিলেই বসার ঘরের টেবিলে বছরের পর বছর সবুজ থাকে।",
    descriptionEn: "Symmetrical 3-tier Lucky Bamboo arrangement symbolizing harmony; thrives in fresh tap water indoors.",
    image: getAshokePhotoUrl(77),
    options: [
      {
        id: "opt-65-1",
        labelBn: "৩-স্তরের ক্যান (৮–১০ ইঞ্চি)",
        labelEn: "3-Tier Arrangement (8–10 in)",
        price: 450,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-9",
    nameBn: "স্নেক প্ল্যান্ট",
    nameEn: "Snake Plant / Sansevieria",
    botanicalName: "Sansevieria trifasciata",
    category: "গৃহস্থ ও ঔষধি গাছ",
    audience: ["family"],
    badgeBn: "রাতের অক্সিজেন প্ল্যান্ট",
    colorBn: "সবুজ ও হলুদ বর্ডার",
    sunlightBn: "হালকা ছায়া ও উজ্জ্বল পরোক্ষ আলো",
    sunlightEn: "Bright Indirect Light / Partial Shade",
    wateringBn: "সপ্তাহে ১-২ বার অল্প জল দিন",
    wateringEn: "Water sparingly once or twice a week",
    soilTipBn: "হালকা কোকোপিট, বালি ও ভার্মিকম্পোস্ট মিশ্রণ",
    soilTipEn: "Well-draining cocopeat, sand & vermicompost mix",
    descriptionBn: "হলুদ বর্ডারযুক্ত খাড়া তলোয়ারের মতো স্নেক প্ল্যান্ট (সানসেভেরিয়া)—রাতের বেলা অক্সিজেন ছাড়ে এবং ঘরের দূষিত বাতাস শুষে নেয়।",
    descriptionEn: "Resilient Laurentii Snake Plant releasing oxygen at night while needing watering only once a week.",
    image: snakeOrigImg,
    options: [
      {
        id: "opt-9-1",
        labelBn: "শিকড়যুক্ত চারা (৮–১২ ইঞ্চি · ৬ মাস)",
        labelEn: "Rooted Clump (8–12 in)",
        price: 140,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-11",
    nameBn: "টমেটোর চারা",
    nameEn: "Country Tomato Sapling",
    botanicalName: "Solanum lycopersicum",
    category: "ছাদবাগানের ফল ও কলম",
    audience: ["rooftop","family"],
    badgeBn: "ছাদবাগানে দেশি সবজি",
    colorBn: "সবুজ",
    sunlightBn: "পূর্ণ রোদ ও পর্যাপ্ত আলো",
    sunlightEn: "Full Sun & Good Light",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "বাঁকুড়ার লাল দোআঁশ মাটি ও ভার্মিকম্পোস্ট",
    soilTipEn: "Bankura red loam & vermicompost blend",
    descriptionBn: "সবল কাণ্ডের দেশি খাঁটি টমেটো চারা—১০–১২ ইঞ্চি টব বা সবজি ক্ষেতে রোপণ করলে ৫৫–৭০ দিনেই থোকায় থোকায় লাল টমেটো ধরে।",
    descriptionEn: "Vigorous native country tomato seedlings yielding juicy, tangy harvests within 55–70 days.",
    image: getAshokePhotoUrl(11),
    options: [
      {
        id: "opt-11-1",
        labelBn: "সবজি চারা (৫–৬ ইঞ্চি · ২৫–৩০ দিন)",
        labelEn: "Vegetable Seedling (5–6 in)",
        price: 5,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-14",
    nameBn: "অ্যালোভেরা",
    nameEn: "Aloe Vera Medicinal Plant",
    botanicalName: "Aloe barbadensis Miller",
    category: "গৃহস্থ ও ঔষধি গাছ",
    audience: ["family"],
    badgeBn: "ত্বক ও স্বাস্থ্যের মহৌষধ",
    colorBn: "রসালো সবুজ",
    sunlightBn: "পূর্ণ রোদ ও পর্যাপ্ত আলো",
    sunlightEn: "Full Sun & Good Light",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "বাঁকুড়ার লাল দোআঁশ মাটি ও ভার্মিকম্পোস্ট",
    soilTipEn: "Bankura red loam & vermicompost blend",
    descriptionBn: "ত্বক, চুল ও প্রাথমিক রূপচর্চা-চিকিৎসায় অপরিহার্য রসালো অ্যালোভেরা (ঘৃতকুমারী) চারা।",
    descriptionEn: "Hardy medicinal Aloe Vera succulent requiring minimal water; great for balconies.",
    image: getAshokePhotoUrl(14),
    options: [
      {
        id: "opt-14-1",
        labelBn: "রসালো চারা (৬–১০ ইঞ্চি · ৪–৬ মাস)",
        labelEn: "Rooted Clump (6–10 in)",
        price: 50,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-13",
    nameBn: "তুলসী (কৃষ্ণ ও রাম তুলসী)",
    nameEn: "Sacred Krishna Tulsi",
    botanicalName: "Ocimum tenuiflorum",
    category: "পূজার ফুল ও পবিত্র গাছ",
    audience: ["puja","family"],
    badgeBn: "পবিত্র গৃহস্থের তুলসী",
    colorBn: "গাঢ় শ্যামল",
    sunlightBn: "পূর্ণ রোদ ও পর্যাপ্ত আলো",
    sunlightEn: "Full Sun & Good Light",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Water moderately when topsoil dries",
    soilTipBn: "বাঁকুড়ার লাল দোআঁশ মাটি ও ভার্মিকম্পোস্ট",
    soilTipEn: "Bankura red loam & vermicompost blend",
    descriptionBn: "বাঙালি গৃহস্থের নিত্যপূজা ও ভেষজ গুণে সমৃদ্ধ পবিত্র তুলসী গাছ—উঠোন ও বারান্দার জন্য শ্রেষ্ঠ।",
    descriptionEn: "Sacred Krishna Tulsi plant revered for daily worship and natural herbal immunity.",
    image: tulsiOrigImg,
    options: [
      {
        id: "opt-13-1",
        labelBn: "পবিত্র চারা (৮–১০ ইঞ্চি · ৩–৪ মাস)",
        labelEn: "Polybag Sapling (8–10 in)",
        price: 30,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-15",
    nameBn: "সুগন্ধি তেজপাতা গাছ",
    nameEn: "Aromatic Bay Leaf (Tejpatta) Tree Sapling",
    botanicalName: "Cinnamomum tamala",
    category: "মসলা ও ভেষজ গাছ",
    audience: ["herbal","rooftop","family"],
    badgeBn: "খাঁটি দেশি তেজপাতা চারা",
    colorBn: "গাঢ় সবুজ সুগন্ধি পাতা",
    sunlightBn: "পূর্ণ রোদ ও খোলা হাওয়া",
    sunlightEn: "Full Sun & Good Air Flow",
    wateringBn: "মাটি শুকোলে পরিমিত জল দিন",
    wateringEn: "Moderate watering when soil surface dries",
    soilTipBn: "দোআঁশ মাটি ও জৈব কেঁচো সার",
    soilTipEn: "Well drained loam with organic compost",
    descriptionBn: "রান্নায় টাটকা সুগন্ধ দিতে বাড়ির উঠোন ও বাগানের জন্য উপযুক্ত খাঁটি দেশি তেজপাতা গাছের চারা।",
    descriptionEn: "Aromatic homegrown bay leaf (Tejpatta) tree sapling yielding fragrant leaves for daily culinary use.",
    image: getAshokePhotoUrl(15),
    options: [
      {
        id: "opt-15-1",
        labelBn: "গ্রো ব্যাগ (১–১.৫ ফুট · ৬ মাস)",
        labelEn: "Grow Bag (1–1.5 ft)",
        price: 70,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  }
];

export const PLANT_CARE_TIPS: PlantCareTip[] = [
  {
    id: "tip-1",
    titleBn: "বাঁকুড়ার রাঙামাটিতে চারা রোপণের সুষম অনুপাত",
    titleEn: "Soil Mix for Bankura Laterite Clay",
    targetBn: "চারাগাছ ও ছাদবাগান",
    targetEn: "Potted & Rooftop Plants",
    descBn: "বাঁকুড়ার লাল মাটিতে সঠিক নিষ্কাশন বজায় রাখতে মাটির সাথে সঠিক অনুপাতে জৈব সার মেশানো দরকার।",
    descEn: "To prevent red laterite soil from hardening, blend with equal parts river sand and compost.",
    bulletPointsBn: [
      "৫০% কালশুলির গুঁড়ো লাল দোআঁশ মাটি",
      "৩০% ভার্মিকম্পোস্ট বা পুরানো শুকনো গোবর সার",
      "২০% মোটা লাল বালি ও সামান্য নিম খোল",
      "রোপণের নিচে অতিরিক্ত জল বের হওয়ার নিষ্কাশন ব্যবস্থা রাখুন"
    ],
    bulletPointsEn: [
      "50% screened Bankura red loam soil",
      "30% pure aged vermicompost or dry cow dung manure",
      "20% coarse river sand and a handful of neem cake",
      "Place a terracotta shard over the bottom drainage hole"
    ]
  },
  {
    id: "tip-2",
    titleBn: "গরমে ছাদবাগানের ফলের কলম ও চারা সুরক্ষা",
    titleEn: "Protecting Rooftop Fruit Grafts in Summer",
    targetBn: "আম, লেবু ও পেয়ারা কলম",
    targetEn: "Mango, Lemon & Guava Grafts",
    descBn: "বৈশাখ ও জ্যৈষ্ঠ মাসে বাঁকুড়ার খরায় তীব্র রোদে গাছের গোড়া অতিরিক্ত গরম হওয়া থেকে রক্ষা করার উপায়।",
    descEn: "How to shield potted fruit trees during peak 40°C+ summer heat in Bankura.",
    bulletPointsBn: [
      "সকাল ৮টার আগে অথবা বিকেল ৫টার পর ঠান্ডা হলে জল দিন",
      "গাছের মাটির ওপর শুকনো পাতা বা খড় দিয়ে ২ ইঞ্চি মালচিং করুন",
      "দুপুরে প্রখর রোদে গাছে বা পাতায় জল ছিটাবেন না",
      "মাসে একবার নিম তেল স্প্রে করে মিলিবাগ ও পোকা দূর রাখুন"
    ],
    bulletPointsEn: [
      "Water thoroughly before 8 AM or after 5 PM in cooler hours",
      "Mulch 2 inches with dry leaves to keep roots cool",
      "Avoid splashing water on leaves under direct noon sun",
      "Spray organic neem oil monthly to deter mealybugs"
    ]
  },
  {
    id: "tip-3",
    titleBn: "নিত্য পূজার জবা ও বেলগাছে সারাবছর বেশি ফুল",
    titleEn: "Maximizing Flowers on Puja Plants (Hibiscus & Bel)",
    targetBn: "রক্তজবা ও বেলগাছ",
    targetEn: "Red Hibiscus & Bael Tree",
    descBn: "সকালে ঠাকুরের থালা ভরিয়ে তোলার মতো উজ্জ্বল রক্তজবা ও বেলপাতা পাওয়ার প্রাকৃতিক যত্ন।",
    descEn: "Organic nourishment for daily bountiful blossoms on sacred prayer saplings.",
    bulletPointsBn: [
      "প্রতি ১৫ দিনে এক চামচ হাড়ের গুঁড়ো ও নিমখোল গোড়ায় দিন",
      "পুরানো শুকনো ডাল ছেঁটে (প্রুনিং) দিলে প্রচুর নতুন কুঁড়ি বেরোয়",
      "অন্তত দিনে ৫ ঘণ্টা কড়া রোদ পায় এমন স্থানে চারা রাখুন",
      "বর্ষার শুরুতে গাছের উপরের ২ ইঞ্চি মাটি আলগা করে নতুন কম্পোস্ট দিন"
    ],
    bulletPointsEn: [
      "Feed 1 spoonful bone meal and neem cake every 15 days",
      "Light pruning of spent branches stimulates lush new buds",
      "Ensure at least 5 hours of full daily sunlight",
      "Top dress with 2 inches fresh compost at start of monsoon"
    ]
  },
  {
    id: "tip-4",
    titleBn: "ডেলিভারির পর চারার মাটির বল ও শিকড় সুরক্ষা",
    titleEn: "Root-Ball Transit Safety & Post-Delivery Care",
    targetBn: "ডেলিভারি ও রোপণ নির্দেশিকা",
    targetEn: "Delivery & Planting Guidelines",
    descBn: "কালশুলি নার্সারি থেকে পারসোলা, খাতড়া বা সিমলাপাল ডেলিভারি পাওয়ার পর চারা যাতে ঝিমিয়ে না পড়ে তার বৈজ্ঞানিক যত্ন।",
    descEn: "Essential acclimation and root hydration steps after road transit across Bankura villages.",
    bulletPointsBn: [
      "ডেলিভারি পাওয়ার পরপরই পলি-গ্রোব্যাগটি ১৫ মিনিট আধ-বালতি জলে ভিজিয়ে রাখুন যাতে শিকড় সতেজ হয়ে ওঠে",
      "প্রথম ৪৮ ঘণ্টা চারা সরাসরি কড়া রোদে না রেখে ছায়াযুক্ত স্থানে রেখে স্থানীয় আবহাওয়ায় মানিয়ে নিতে দিন",
      "পলি গ্রো-ব্যাগ কাটার সময় ব্লেড দিয়ে সাবধানে কাটুন, মাটির বল বা শিকড় যাতে কোনোভাবেই ভেঙে না যায়",
      "নতুন মাটিতে বসানোর পর ভরপেট জল দিন এবং আগামী এক সপ্তাহ কোনো রাসায়নিক সার দেবেন না"
    ],
    bulletPointsEn: [
      "Submerge the polybag in half a bucket of water for 15 minutes immediately upon delivery to rehydrate roots",
      "Keep the sapling in shaded breeze for the first 48 hours to acclimatize before exposing to direct sun",
      "Slit the polybag carefully with a razor without disturbing or crumbling the nursery soil ball",
      "Water thoroughly after potting and avoid chemical fertilizers for the first 7 days"
    ]
  }
];

export const CARE_TIPS_DATA = PLANT_CARE_TIPS;
