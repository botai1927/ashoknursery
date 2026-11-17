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
  taglineBn: "পারিবারিক নার্সারি, কালশুলি · বাঁকুড়া, ৭২২১৬০ · WhatsApp-এ সরাসরি অর্ডার, ন্যায্য দাম",
  taglineEn: "Family Nursery, Kalsuli · Bankura, 722160 · Direct WhatsApp Order · Fair Price",
  sublineBn: "পারিবারিক নার্সারি, কালশুলি · বাঁকুড়া, ৭২২১৬০ · WhatsApp-এ সরাসরি অর্ডার, ন্যায্য দাম",
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
    image: getAshokePhotoUrl(25),
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
    image: getAshokePhotoUrl(42),
  },
  {
    id: "season-lotus",
    plantId: "ashoke-28",
    titleBn: "পবিত্র গোলাপি পদ্ম কন্দ ও চারা",
    titleEn: "Sacred Water Lotus Sapling",
    tagBn: "জলজ পবিত্র ফুল",
    tagEn: "Sacred Aquatic Lotus",
    priceNoteBn: "₹৩৫০ (পরিপুষ্ট কন্দ চারা)",
    priceNoteEn: "₹350 ready tuber",
    image: getAshokePhotoUrl(38),
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
        labelBn: "গ্রো ব্যাগ কলম চারা",
        labelEn: "Grafted Polybag Sapling",
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
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag Sapling",
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
        labelBn: "গ্রো ব্যাগ চারা",
        labelEn: "Polybag Sapling",
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
        labelBn: "গ্রো ব্যাগ চারা",
        labelEn: "Polybag Sapling",
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
        labelBn: "গ্রো ব্যাগ চারা",
        labelEn: "Grow Bag Sapling",
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
    nameBn: "ক্যামেলিয়ান ফুল গাছ",
    nameEn: "Camellia Flower Plant",
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
    descriptionBn: "কালশুলির নিজস্ব নার্সারিতে যত্নে তৈরি প্রচুর কুঁড়ি ও শিকড়যুক্ত সতেজ ক্যামেলিয়ান ফুল গাছ চারা।",
    descriptionEn: "Fresh, well-rooted Camellia Flower Plant sapling grown at Kalsuli nursery.",
    image: getAshokePhotoUrl(101),
    options: [
      {
        id: "opt-88-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
        price: 150,
        containerType: "পলি গ্রো ব্যাগ"
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
    descriptionBn: "ঘরের ভেতর বা বারান্দার হালকা ছায়ায় সহজে বেড়ে ওঠা সতেজ ঝাউ গাছ চারা।",
    descriptionEn: "Healthy, low-maintenance indoor/balcony Jhau Tree / Cypress Pine sapling.",
    image: getAshokePhotoUrl(100),
    options: [
      {
        id: "opt-87-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
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
    descriptionBn: "ঘরের ভেতর বা বারান্দার হালকা ছায়ায় সহজে বেড়ে ওঠা সতেজ ভিক্টোরিয়া চারা।",
    descriptionEn: "Healthy, low-maintenance indoor/balcony Victoria Agave / Decorative Agave sapling.",
    image: getAshokePhotoUrl(99),
    options: [
      {
        id: "opt-86-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
        price: 80,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-85",
    nameBn: "সাকুলেন্ট  ট্রী",
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
    descriptionBn: "ঘরের ভেতর বা বারান্দার হালকা ছায়ায় সহজে বেড়ে ওঠা সতেজ সাকুলেন্ট  ট্রী চারা।",
    descriptionEn: "Healthy, low-maintenance indoor/balcony Succulent Tree / Jade Bonsai sapling.",
    image: getAshokePhotoUrl(98),
    options: [
      {
        id: "opt-85-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
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
    descriptionBn: "কালশুলির নিজস্ব নার্সারিতে যত্নে তৈরি প্রচুর কুঁড়ি ও শিকড়যুক্ত সতেজ সালভিয়া চারা।",
    descriptionEn: "Fresh, well-rooted Salvia Flower Plant sapling grown at Kalsuli nursery.",
    image: getAshokePhotoUrl(97),
    options: [
      {
        id: "opt-84-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
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
    descriptionBn: "কালশুলির নিজস্ব নার্সারিতে যত্নে তৈরি প্রচুর কুঁড়ি ও শিকড়যুক্ত সতেজ সাদা পুনা ভ্যারাইটি জবা চারা।",
    descriptionEn: "Fresh, well-rooted White Pune Hybrid Hibiscus sapling grown at Kalsuli nursery.",
    image: getAshokePhotoUrl(96),
    options: [
      {
        id: "opt-83-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
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
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
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
    descriptionBn: "বাঁকুড়ার মাটি ও আবহাওয়ায় দ্রুত ফলনশীল সুপুষ্ট এলাচ কলমের চারা।",
    descriptionEn: "Fast-fruiting grafted Large Cardamom Sapling sapling acclimated to Bankura.",
    image: getAshokePhotoUrl(40),
    options: [
      {
        id: "opt-30-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
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
    descriptionBn: "বাঁকুড়ার মাটি ও আবহাওয়ায় দ্রুত ফলনশীল সুপুষ্ট কাগজি লেবু কলমের চারা।",
    descriptionEn: "Fast-fruiting grafted Kagzi Lime / Baromasi Lemon sapling acclimated to Bankura.",
    image: getAshokePhotoUrl(25),
    options: [
      {
        id: "opt-2-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
        price: 90,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-69",
    nameBn: "কালা জাম",
    nameEn: "Black Plum (Jamun)",
    botanicalName: "Syzygium cumini",
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
    descriptionBn: "বাঁকুড়ার মাটি ও আবহাওয়ায় দ্রুত ফলনশীল সুপুষ্ট কালা জামের কলমের চারা।",
    descriptionEn: "Fast-fruiting grafted black plum (jamun) sapling acclimated to Bankura.",
    image: getAshokePhotoUrl(82),
    options: [
      {
        id: "opt-69-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
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
    descriptionBn: "বাঁকুড়ার মাটি ও আবহাওয়ায় দ্রুত ফলনশীল সুপুষ্ট চায়না কলা কলমের চারা।",
    descriptionEn: "Fast-fruiting grafted China Dwarf Banana sapling acclimated to Bankura.",
    image: getAshokePhotoUrl(87),
    options: [
      {
        id: "opt-74-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
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
    descriptionBn: "বাঁকুড়ার মাটি ও আবহাওয়ায় দ্রুত ফলনশীল সুপুষ্ট নারিকেল গাছ কলমের চারা।",
    descriptionEn: "Fast-fruiting grafted Hazari Dwarf Coconut Tree sapling acclimated to Bankura.",
    image: getAshokePhotoUrl(90),
    options: [
      {
        id: "opt-77-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
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
    descriptionBn: "বাঁকুড়ার মাটি ও আবহাওয়ায় দ্রুত ফলনশীল সুপুষ্ট পিংক কাঁঠাল কলমের চারা।",
    descriptionEn: "Fast-fruiting grafted Pink Jackfruit Graft sapling acclimated to Bankura.",
    image: getAshokePhotoUrl(74),
    options: [
      {
        id: "opt-62-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
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
    descriptionBn: "বাঁকুড়ার মাটি ও আবহাওয়ায় দ্রুত ফলনশীল সুপুষ্ট পেঁপে গাছ কলমের চারা।",
    descriptionEn: "Fast-fruiting grafted Hybrid Red Lady Papaya sapling acclimated to Bankura.",
    image: getAshokePhotoUrl(75),
    options: [
      {
        id: "opt-63-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
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
    descriptionBn: "বাঁকুড়ার মাটি ও আবহাওয়ায় দ্রুত ফলনশীল সুপুষ্ট পেয়ারা (থাই) কলমের চারা।",
    descriptionEn: "Fast-fruiting grafted Thai Sweet Guava Graft sapling acclimated to Bankura.",
    image: getAshokePhotoUrl(3),
    options: [
      {
        id: "opt-3-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
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
    descriptionBn: "বাঁকুড়ার মাটি ও আবহাওয়ায় দ্রুত ফলনশীল সুপুষ্ট বাতাবি লেবু কলমের চারা।",
    descriptionEn: "Fast-fruiting grafted Batabi Pomelo / Grapefruit sapling acclimated to Bankura.",
    image: getAshokePhotoUrl(62),
    options: [
      {
        id: "opt-51-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
        price: 50,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-78",
    nameBn: "Golapi stholopaddmo",
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
    descriptionBn: "কালশুলির নিজস্ব নার্সারিতে যত্নে তৈরি প্রচুর কুঁড়ি ও শিকড়যুক্ত সতেজ Golapi stholopaddmo চারা।",
    descriptionEn: "Fresh, well-rooted Pink Confederate Rose / Stholopaddmo sapling grown at Kalsuli nursery.",
    image: getAshokePhotoUrl(91),
    options: [
      {
        id: "opt-78-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
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
    descriptionBn: "কালশুলির নিজস্ব নার্সারিতে যত্নে তৈরি প্রচুর কুঁড়ি ও শিকড়যুক্ত সতেজ অস্ট্রেলিয়ান জবা চারা।",
    descriptionEn: "Fresh, well-rooted Australian Giant Hibiscus sapling grown at Kalsuli nursery.",
    image: getAshokePhotoUrl(21),
    options: [
      {
        id: "opt-20-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
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
    descriptionBn: "কালশুলির নিজস্ব নার্সারিতে তৈরি সুপুষ্ট ও রোগমুক্ত স্বাস্থ্যকর চারা।",
    descriptionEn: "Fresh, healthy nursery sapling acclimated to Bankura soil and climate.",
    image: getAshokePhotoUrl(63),
    options: [
      {
        id: "opt-52-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
        price: 30,
        containerType: "পলি গ্রো ব্যাগ"
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
    descriptionBn: "কালশুলির নিজস্ব নার্সারিতে যত্নে তৈরি প্রচুর কুঁড়ি ও শিকড়যুক্ত সতেজ আজ,কাল,পরশু ফুলগাছ চারা।",
    descriptionEn: "Fresh, well-rooted Yesterday Today Tomorrow (Brunfelsia) sapling grown at Kalsuli nursery.",
    image: getAshokePhotoUrl(85),
    options: [
      {
        id: "opt-72-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
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
    descriptionBn: "কালশুলির নিজস্ব নার্সারিতে যত্নে তৈরি প্রচুর কুঁড়ি ও শিকড়যুক্ত সতেজ গজনিয়া ফুল চারা।",
    descriptionEn: "Fresh, well-rooted Gazania Sunshine Flower sapling grown at Kalsuli nursery.",
    image: getAshokePhotoUrl(52),
    options: [
      {
        id: "opt-42-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
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
    descriptionBn: "কালশুলির নিজস্ব নার্সারিতে যত্নে তৈরি প্রচুর কুঁড়ি ও শিকড়যুক্ত সতেজ গজনীয়া ফুল চারা।",
    descriptionEn: "Fresh, well-rooted White Sunshine Gazania sapling grown at Kalsuli nursery.",
    image: getAshokePhotoUrl(50),
    options: [
      {
        id: "opt-40-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
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
    descriptionBn: "কালশুলির নিজস্ব নার্সারিতে যত্নে তৈরি প্রচুর কুঁড়ি ও শিকড়যুক্ত সতেজ গন্ধরাজ ফুল চারা।",
    descriptionEn: "Fresh, well-rooted Gandharaj / Cape Jasmine sapling grown at Kalsuli nursery.",
    image: getAshokePhotoUrl(65),
    options: [
      {
        id: "opt-54-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
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
    descriptionBn: "কালশুলির নিজস্ব নার্সারিতে যত্নে তৈরি প্রচুর কুঁড়ি ও শিকড়যুক্ত সতেজ গাঁদা ফুলের চারা চারা।",
    descriptionEn: "Fresh, well-rooted Marigold Seedling sapling grown at Kalsuli nursery.",
    image: getAshokePhotoUrl(29),
    options: [
      {
        id: "opt-6-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
        price: 15,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-19",
    nameBn: "গোলাপ",
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
    descriptionBn: "কালশুলির নিজস্ব নার্সারিতে যত্নে তৈরি প্রচুর কুঁড়ি ও শিকড়যুক্ত সতেজ গোলাপ চারা।",
    descriptionEn: "Fresh, well-rooted Native Fragrant Rose sapling grown at Kalsuli nursery.",
    image: getAshokePhotoUrl(20),
    options: [
      {
        id: "opt-19-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
        price: 60,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-32",
    nameBn: "গোলাপ",
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
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
        price: 80,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-48",
    nameBn: "গোলাপ ফুল",
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
    descriptionBn: "কালশুলির নিজস্ব নার্সারিতে যত্নে তৈরি প্রচুর কুঁড়ি ও শিকড়যুক্ত সতেজ গোলাপ ফুল চারা।",
    descriptionEn: "Fresh, well-rooted Cream Yellow & Pink Rose sapling grown at Kalsuli nursery.",
    image: getAshokePhotoUrl(60),
    options: [
      {
        id: "opt-48-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
        price: 80,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-45",
    nameBn: "গোলাপ ফুল",
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
    descriptionBn: "কালশুলির নিজস্ব নার্সারিতে যত্নে তৈরি প্রচুর কুঁড়ি ও শিকড়যুক্ত সতেজ গোলাপ ফুল চারা।",
    descriptionEn: "Fresh, well-rooted Pink Garden Rose sapling grown at Kalsuli nursery.",
    image: getAshokePhotoUrl(55),
    options: [
      {
        id: "opt-45-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
        price: 60,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-46",
    nameBn: "গোলাপ ফুল",
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
    descriptionBn: "কালশুলির নিজস্ব নার্সারিতে যত্নে তৈরি প্রচুর কুঁড়ি ও শিকড়যুক্ত সতেজ গোলাপ ফুল চারা।",
    descriptionEn: "Fresh, well-rooted Velvet Deep Maroon Rose sapling grown at Kalsuli nursery.",
    image: getAshokePhotoUrl(56),
    options: [
      {
        id: "opt-46-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
        price: 80,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-37",
    nameBn: "গোলাপ ফুল",
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
    descriptionBn: "কালশুলির নিজস্ব নার্সারিতে যত্নে তৈরি প্রচুর কুঁড়ি ও শিকড়যুক্ত সতেজ গোলাপ ফুল চারা।",
    descriptionEn: "Fresh, well-rooted Red & Yellow Bicolor Rose sapling grown at Kalsuli nursery.",
    image: getAshokePhotoUrl(47),
    options: [
      {
        id: "opt-37-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
        price: 80,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-39",
    nameBn: "গোলাপ ফুল",
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
    descriptionBn: "কালশুলির নিজস্ব নার্সারিতে যত্নে তৈরি প্রচুর কুঁড়ি ও শিকড়যুক্ত সতেজ গোলাপ ফুল চারা।",
    descriptionEn: "Fresh, well-rooted Golden Yellow Garden Rose sapling grown at Kalsuli nursery.",
    image: getAshokePhotoUrl(49),
    options: [
      {
        id: "opt-39-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
        price: 60,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-44",
    nameBn: "গোলাপ ফুল",
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
    descriptionBn: "কালশুলির নিজস্ব নার্সারিতে যত্নে তৈরি প্রচুর কুঁড়ি ও শিকড়যুক্ত সতেজ গোলাপ ফুল চারা।",
    descriptionEn: "Fresh, well-rooted Crimson & Gold Rose sapling grown at Kalsuli nursery.",
    image: getAshokePhotoUrl(54),
    options: [
      {
        id: "opt-44-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
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
    descriptionBn: "কালশুলির নিজস্ব নার্সারিতে যত্নে তৈরি প্রচুর কুঁড়ি ও শিকড়যুক্ত সতেজ গোলাপ বাই কালার চারা।",
    descriptionEn: "Fresh, well-rooted Pink & White Edged Bicolor Rose sapling grown at Kalsuli nursery.",
    image: getAshokePhotoUrl(93),
    options: [
      {
        id: "opt-80-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
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
    descriptionBn: "কালশুলির নিজস্ব নার্সারিতে যত্নে তৈরি প্রচুর কুঁড়ি ও শিকড়যুক্ত সতেজ গোলাপি থাই স্থল পদ্ম চারা।",
    descriptionEn: "Fresh, well-rooted Thai Pink Confederate Rose sapling grown at Kalsuli nursery.",
    image: getAshokePhotoUrl(83),
    options: [
      {
        id: "opt-70-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
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
    descriptionBn: "কালশুলির নিজস্ব নার্সারিতে যত্নে তৈরি প্রচুর কুঁড়ি ও শিকড়যুক্ত সতেজ ঘন্টা জবা চারা।",
    descriptionEn: "Fresh, well-rooted Ghanta Jaba / Coral Pendant Hibiscus sapling grown at Kalsuli nursery.",
    image: getAshokePhotoUrl(70),
    options: [
      {
        id: "opt-4-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
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
    descriptionBn: "কালশুলির নিজস্ব নার্সারিতে যত্নে তৈরি প্রচুর কুঁড়ি ও শিকড়যুক্ত সতেজ চন্দ্রমল্লিকা ( সবুজ ) চারা।",
    descriptionEn: "Fresh, well-rooted Green Chrysanthemum (Chandramallika) sapling grown at Kalsuli nursery.",
    image: getAshokePhotoUrl(68),
    options: [
      {
        id: "opt-57-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
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
    descriptionBn: "কালশুলির নিজস্ব নার্সারিতে যত্নে তৈরি প্রচুর কুঁড়ি ও শিকড়যুক্ত সতেজ চন্দ্রমল্লিকা ফুল চারা।",
    descriptionEn: "Fresh, well-rooted Deep Red Chrysanthemum (Chandramallika) sapling grown at Kalsuli nursery.",
    image: getAshokePhotoUrl(53),
    options: [
      {
        id: "opt-43-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
        price: 20,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-22",
    nameBn: "জবা",
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
    descriptionBn: "কালশুলির নিজস্ব নার্সারিতে যত্নে তৈরি প্রচুর কুঁড়ি ও শিকড়যুক্ত সতেজ জবা চারা।",
    descriptionEn: "Fresh, well-rooted Yellow Double Petal Hibiscus sapling grown at Kalsuli nursery.",
    image: getAshokePhotoUrl(30),
    options: [
      {
        id: "opt-22-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
        price: 80,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-33",
    nameBn: "জবা",
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
    descriptionBn: "কালশুলির নিজস্ব নার্সারিতে যত্নে তৈরি প্রচুর কুঁড়ি ও শিকড়যুক্ত সতেজ জবা চারা।",
    descriptionEn: "Fresh, well-rooted White & Pink Center Hibiscus sapling grown at Kalsuli nursery.",
    image: getAshokePhotoUrl(43),
    options: [
      {
        id: "opt-33-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
        price: 60,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-24",
    nameBn: "জবা",
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
    descriptionBn: "কালশুলির নিজস্ব নার্সারিতে যত্নে তৈরি প্রচুর কুঁড়ি ও শিকড়যুক্ত সতেজ জবা চারা।",
    descriptionEn: "Fresh, well-rooted Peach-Orange Double Hibiscus sapling grown at Kalsuli nursery.",
    image: getAshokePhotoUrl(34),
    options: [
      {
        id: "opt-24-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
        price: 80,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-35",
    nameBn: "জবা",
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
    descriptionBn: "কালশুলির নিজস্ব নার্সারিতে যত্নে তৈরি প্রচুর কুঁড়ি ও শিকড়যুক্ত সতেজ জবা চারা।",
    descriptionEn: "Fresh, well-rooted Double Petal Red Hibiscus sapling grown at Kalsuli nursery.",
    image: getAshokePhotoUrl(45),
    options: [
      {
        id: "opt-35-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
        price: 80,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-81",
    nameBn: "জবা  ,  পুনা ভ্যারাইটি",
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
    descriptionBn: "কালশুলির নিজস্ব নার্সারিতে যত্নে তৈরি প্রচুর কুঁড়ি ও শিকড়যুক্ত সতেজ জবা  ,  পুনা ভ্যারাইটি চারা।",
    descriptionEn: "Fresh, well-rooted Coral Fringed Pune Hibiscus sapling grown at Kalsuli nursery.",
    image: getAshokePhotoUrl(94),
    options: [
      {
        id: "opt-81-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
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
    descriptionBn: "কালশুলির নিজস্ব নার্সারিতে যত্নে তৈরি প্রচুর কুঁড়ি ও শিকড়যুক্ত সতেজ জবা (লাল) চারা।",
    descriptionEn: "Fresh, well-rooted Sacred Red Hibiscus (Rakta Jaba) sapling grown at Kalsuli nursery.",
    image: getAshokePhotoUrl(27),
    options: [
      {
        id: "opt-5-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
        price: 50,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-82",
    nameBn: "জবা অস্ট্রেলিয়ান",
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
    descriptionBn: "কালশুলির নিজস্ব নার্সারিতে যত্নে তৈরি প্রচুর কুঁড়ি ও শিকড়যুক্ত সতেজ জবা অস্ট্রেলিয়ান চারা।",
    descriptionEn: "Fresh, well-rooted Giant Australian Hibiscus sapling grown at Kalsuli nursery.",
    image: getAshokePhotoUrl(95),
    options: [
      {
        id: "opt-82-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
        price: 120,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-38",
    nameBn: "জবা ফুল",
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
    descriptionBn: "কালশুলির নিজস্ব নার্সারিতে যত্নে তৈরি প্রচুর কুঁড়ি ও শিকড়যুক্ত সতেজ জবা ফুল চারা।",
    descriptionEn: "Fresh, well-rooted Peach Apricot Hibiscus sapling grown at Kalsuli nursery.",
    image: getAshokePhotoUrl(48),
    options: [
      {
        id: "opt-38-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
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
    descriptionBn: "কালশুলির নিজস্ব নার্সারিতে যত্নে তৈরি প্রচুর কুঁড়ি ও শিকড়যুক্ত সতেজ টিকোমা গৌরি চারা।",
    descriptionEn: "Fresh, well-rooted Tecoma Gauri / Yellow Elder sapling grown at Kalsuli nursery.",
    image: getAshokePhotoUrl(41),
    options: [
      {
        id: "opt-31-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
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
    descriptionBn: "কালশুলির নিজস্ব নার্সারিতে যত্নে তৈরি প্রচুর কুঁড়ি ও শিকড়যুক্ত সতেজ টিকোমা ফুল চারা।",
    descriptionEn: "Fresh, well-rooted Orange Tecoma Capensis sapling grown at Kalsuli nursery.",
    image: getAshokePhotoUrl(88),
    options: [
      {
        id: "opt-75-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
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
    descriptionBn: "কালশুলির নিজস্ব নার্সারিতে যত্নে তৈরি প্রচুর কুঁড়ি ও শিকড়যুক্ত সতেজ থাই রঙ্গন চারা।",
    descriptionEn: "Fresh, well-rooted Thai Dwarf Ixora (Rangan) sapling grown at Kalsuli nursery.",
    image: getAshokePhotoUrl(31),
    options: [
      {
        id: "opt-12-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
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
    descriptionBn: "কালশুলির নিজস্ব নার্সারিতে যত্নে তৈরি প্রচুর কুঁড়ি ও শিকড়যুক্ত সতেজ দেশী স্থল পদ্ম চারা।",
    descriptionEn: "Fresh, well-rooted Native Indian Stholopaddmo sapling grown at Kalsuli nursery.",
    image: getAshokePhotoUrl(73),
    options: [
      {
        id: "opt-61-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
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
    descriptionBn: "কালশুলির নিজস্ব নার্সারিতে যত্নে তৈরি প্রচুর কুঁড়ি ও শিকড়যুক্ত সতেজ নীল কন্ঠ ফুল চারা।",
    descriptionEn: "Fresh, well-rooted Blue Aparajita / Neel Kantha sapling grown at Kalsuli nursery.",
    image: getAshokePhotoUrl(46),
    options: [
      {
        id: "opt-36-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
        price: 80,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-28",
    nameBn: "পদ্ম ফুল",
    nameEn: "Sacred Water Lotus",
    botanicalName: "Nelumbo nucifera",
    category: "পূজার ফুল ও পবিত্র গাছ",
    audience: ["puja","family"],
    badgeBn: "জলজ পদ্ম কন্দ",
    colorBn: "গোলাপি",
    sunlightBn: "দিনে ৫-৬ ঘণ্টা পূর্ণ রোদ",
    sunlightEn: "5-6 Hours Full Sunlight",
    wateringBn: "পাত্রে সবসময় ৩-৪ ইঞ্চি পরিষ্কার জল রাখুন",
    wateringEn: "Maintain 3-4 inches standing clean water",
    soilTipBn: "পুকুরের এঁটেল মাটি ও সামান্য গোবর সার",
    soilTipEn: "Heavy clay/pond mud with aged cow manure",
    descriptionBn: "বাঁকুড়ার রোদে জলের পাত্র বা গামলায় প্রচুর ফুল ফোটা পদ্ম ফুল।",
    descriptionEn: "Healthy aquatic Sacred Water Lotus ready to bloom abundantly in sunny water tubs.",
    image: getAshokePhotoUrl(38),
    options: [
      {
        id: "opt-28-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
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
    descriptionBn: "কালশুলির নিজস্ব নার্সারিতে যত্নে তৈরি প্রচুর কুঁড়ি ও শিকড়যুক্ত সতেজ পুনা জবা চারা।",
    descriptionEn: "Fresh, well-rooted Pune Hybrid Hibiscus sapling grown at Kalsuli nursery.",
    image: getAshokePhotoUrl(22),
    options: [
      {
        id: "opt-21-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
        price: 60,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-76",
    nameBn: "পুনা ভ্যারাইটি",
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
    descriptionBn: "কালশুলির নিজস্ব নার্সারিতে যত্নে তৈরি প্রচুর কুঁড়ি ও শিকড়যুক্ত সতেজ পুনা ভ্যারাইটি চারা।",
    descriptionEn: "Fresh, well-rooted Exotic Pune Hibiscus sapling grown at Kalsuli nursery.",
    image: getAshokePhotoUrl(89),
    options: [
      {
        id: "opt-76-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
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
    descriptionBn: "কালশুলির নিজস্ব নার্সারিতে যত্নে তৈরি প্রচুর কুঁড়ি ও শিকড়যুক্ত সতেজ প্যাশিয়ন ফুল চারা।",
    descriptionEn: "Fresh, well-rooted Crimson Passion Flower (Krishna Kamal) sapling grown at Kalsuli nursery.",
    image: getAshokePhotoUrl(67),
    options: [
      {
        id: "opt-56-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
        price: 50,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-79",
    nameBn: "বাই কালার গোলাপ",
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
    descriptionBn: "কালশুলির নিজস্ব নার্সারিতে যত্নে তৈরি প্রচুর কুঁড়ি ও শিকড়যুক্ত সতেজ বাই কালার গোলাপ চারা।",
    descriptionEn: "Fresh, well-rooted Deep Maroon & Gold Flecked Rose sapling grown at Kalsuli nursery.",
    image: getAshokePhotoUrl(92),
    options: [
      {
        id: "opt-79-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
        price: 80,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-58",
    nameBn: "বাইকালার গোলাপ",
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
    descriptionBn: "কালশুলির নিজস্ব নার্সারিতে যত্নে তৈরি প্রচুর কুঁড়ি ও শিকড়যুক্ত সতেজ বাইকালার গোলাপ চারা।",
    descriptionEn: "Fresh, well-rooted Abracadabra Red & White Striped Rose sapling grown at Kalsuli nursery.",
    image: getAshokePhotoUrl(69),
    options: [
      {
        id: "opt-58-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
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
    descriptionBn: "কালশুলির নিজস্ব নার্সারিতে যত্নে তৈরি প্রচুর কুঁড়ি ও শিকড়যুক্ত সতেজ বোগেনভিলিয়া (গোলাপি) চারা।",
    descriptionEn: "Fresh, well-rooted Pink Bougainvillea (Baganbilas) sapling grown at Kalsuli nursery.",
    image: getAshokePhotoUrl(23),
    options: [
      {
        id: "opt-7-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
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
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
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
    descriptionBn: "কালশুলির নিজস্ব নার্সারিতে যত্নে তৈরি প্রচুর কুঁড়ি ও শিকড়যুক্ত সতেজ মধু - মালতী চারা।",
    descriptionEn: "Fresh, well-rooted Madhu Malati / Rangoon Creeper sapling grown at Kalsuli nursery.",
    image: getAshokePhotoUrl(32),
    options: [
      {
        id: "opt-23-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
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
    descriptionBn: "কালশুলির নিজস্ব নার্সারিতে যত্নে তৈরি প্রচুর কুঁড়ি ও শিকড়যুক্ত সতেজ মালটিভিলা ফুল চারা।",
    descriptionEn: "Fresh, well-rooted Mandevilla Climbing Vine sapling grown at Kalsuli nursery.",
    image: getAshokePhotoUrl(81),
    options: [
      {
        id: "opt-68-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
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
    descriptionBn: "কালশুলির নিজস্ব নার্সারিতে যত্নে তৈরি প্রচুর কুঁড়ি ও শিকড়যুক্ত সতেজ মাল্টিভিলা ( হলুদ ) চারা।",
    descriptionEn: "Fresh, well-rooted Yellow Mandevilla / Allamanda sapling grown at Kalsuli nursery.",
    image: getAshokePhotoUrl(59),
    options: [
      {
        id: "opt-49-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
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
    descriptionBn: "কালশুলির নিজস্ব নার্সারিতে যত্নে তৈরি প্রচুর কুঁড়ি ও শিকড়যুক্ত সতেজ মুসান্ডা ফুল চারা।",
    descriptionEn: "Fresh, well-rooted Mussaenda / Bangkok Rose sapling grown at Kalsuli nursery.",
    image: getAshokePhotoUrl(64),
    options: [
      {
        id: "opt-53-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
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
    descriptionBn: "কালশুলির নিজস্ব নার্সারিতে যত্নে তৈরি প্রচুর কুঁড়ি ও শিকড়যুক্ত সতেজ রঙ্গন ফুল চারা।",
    descriptionEn: "Fresh, well-rooted Native Red Ixora / Rangan sapling grown at Kalsuli nursery.",
    image: getAshokePhotoUrl(57),
    options: [
      {
        id: "opt-47-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
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
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
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
    descriptionBn: "কালশুলির নিজস্ব নার্সারিতে যত্নে তৈরি প্রচুর কুঁড়ি ও শিকড়যুক্ত সতেজ সাদা গোলাপ চারা।",
    descriptionEn: "Fresh, well-rooted White Fragrant Rose sapling grown at Kalsuli nursery.",
    image: getAshokePhotoUrl(76),
    options: [
      {
        id: "opt-64-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
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
    image: getAshokePhotoUrl(83),
    options: [
      {
        id: "opt-41-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
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
    descriptionBn: "কালশুলির নিজস্ব নার্সারিতে যত্নে তৈরি প্রচুর কুঁড়ি ও শিকড়যুক্ত সতেজ হলুদ গাঁদা ফুল চারা।",
    descriptionEn: "Fresh, well-rooted Yellow French Marigold sapling grown at Kalsuli nursery.",
    image: getAshokePhotoUrl(71),
    options: [
      {
        id: "opt-59-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
        price: 15,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-66",
    nameBn: "র‍্যাপিস পাম",
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
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
        price: 350,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-50",
    nameBn: "পাতা বাহার",
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
    descriptionBn: "ঘরের ভেতর বা বারান্দার হালকা ছায়ায় সহজে বেড়ে ওঠা সতেজ পাতা বাহার চারা।",
    descriptionEn: "Healthy, low-maintenance indoor/balcony Colorful Caladium / Croton sapling.",
    image: getAshokePhotoUrl(80),
    options: [
      {
        id: "opt-50-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
        price: 150,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-60",
    nameBn: "পাতাবাহার",
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
    descriptionBn: "ঘরের ভেতর বা বারান্দার হালকা ছায়ায় সহজে বেড়ে ওঠা সতেজ পাতাবাহার চারা।",
    descriptionEn: "Healthy, low-maintenance indoor/balcony Variegated Croton Foliage sapling.",
    image: getAshokePhotoUrl(72),
    options: [
      {
        id: "opt-60-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
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
    descriptionBn: "ঘরের ভেতর বা বারান্দার হালকা ছায়ায় সহজে বেড়ে ওঠা সতেজ পাতাবাহার (ক্রোটন) চারা।",
    descriptionEn: "Healthy, low-maintenance indoor/balcony Croton Gold Dust sapling.",
    image: getAshokePhotoUrl(10),
    options: [
      {
        id: "opt-10-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
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
    descriptionBn: "ঘরের ভেতর বা বারান্দার হালকা ছায়ায় সহজে বেড়ে ওঠা সতেজ ব্রাজিলিয়ান লাকি ব্যাম্বু চারা।",
    descriptionEn: "Healthy, low-maintenance indoor/balcony Brazilian Lucky Bamboo sapling.",
    image: getAshokePhotoUrl(79),
    options: [
      {
        id: "opt-67-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
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
    descriptionBn: "ঘরের ভেতর বা বারান্দার হালকা ছায়ায় সহজে বেড়ে ওঠা সতেজ মানি প্ল্যান্ট চারা।",
    descriptionEn: "Healthy, low-maintenance indoor/balcony Golden Pothos / Money Plant sapling.",
    image: getAshokePhotoUrl(8),
    options: [
      {
        id: "opt-8-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
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
    descriptionBn: "ঘরের ভেতর বা বারান্দার হালকা ছায়ায় সহজে বেড়ে ওঠা সতেজ রাবার গাছ চারা।",
    descriptionEn: "Healthy, low-maintenance indoor/balcony Burgundy Rubber Tree sapling.",
    image: getAshokePhotoUrl(84),
    options: [
      {
        id: "opt-71-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
        price: 70,
        containerType: "পলি গ্রো ব্যাগ"
      }
    ]
  },
  {
    id: "ashoke-65",
    nameBn: "লাকি ব্যাম্বু",
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
    descriptionBn: "ঘরের ভেতর বা বারান্দার হালকা ছায়ায় সহজে বেড়ে ওঠা সতেজ লাকি ব্যাম্বু চারা।",
    descriptionEn: "Healthy, low-maintenance indoor/balcony Lucky Bamboo 3-Tier sapling.",
    image: getAshokePhotoUrl(77),
    options: [
      {
        id: "opt-65-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
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
    descriptionBn: "ঘরের ভেতর বা বারান্দার হালকা ছায়ায় সহজে বেড়ে ওঠা সতেজ স্নেক প্ল্যান্ট চারা।",
    descriptionEn: "Healthy, low-maintenance indoor/balcony Snake Plant / Sansevieria sapling.",
    image: snakeOrigImg,
    options: [
      {
        id: "opt-9-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
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
    descriptionBn: "কালশুলির নিজস্ব নার্সারিতে তৈরি সুপুষ্ট ও রোগমুক্ত স্বাস্থ্যকর চারা।",
    descriptionEn: "Fresh, healthy nursery sapling acclimated to Bankura soil and climate.",
    image: getAshokePhotoUrl(11),
    options: [
      {
        id: "opt-11-1",
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
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
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
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
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
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
        labelBn: "গ্রো ব্যাগ / নার্সারি সাইজ",
        labelEn: "Grow Bag / Nursery Sapling",
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
