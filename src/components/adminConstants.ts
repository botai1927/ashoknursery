import type { PlantCategory } from '../types/nursery';
import {
  PUJA_IMAGE,
  FRUIT_IMAGE,
  ROOFTOP_IMAGE,
  POTS_IMAGE,
  tulsiImg,
  aparajitaImg,
  roseImg,
  adeniumImg,
  lotusImg,
  bananaImg,
  stholopaddmoImg,
  luckyBambooImg,
  chandramallikaImg,
} from '../data/brahmyamanCatalog';

export type AdminTab =
  | 'inventory'
  | 'add'
  | 'logs'
  | 'orders'
  | 'bulk_price'
  | 'reviews'
  | 'qr_tags'
  | 'trash'
  | 'chatbot'
  | 'api'
  | 'cloudinary'
  | 'backup'
  | 'settings'
  | 'undo_redo'
  | 'diagnostics';

export type AdminSection = 'catalog' | 'bulk' | 'recovery' | 'diagnostics';

export const ADMIN_CATEGORIES: PlantCategory[] = [
  'ছাদবাগানের ফল ও কলম',
  'পূজার ফুল ও পবিত্র গাছ',
  'ছাদ ও বারান্দার ফুল',
  'গাছপালা ও শো-প্ল্যান্ট',
  'মসলা ও ভেষজ গাছ',
  'গৃহস্থ ও ঔষধি গাছ',
];

export const PRESET_PLANT_PHOTOS = [
  { label: 'রক্তজবা (Hibiscus)', url: PUJA_IMAGE },
  { label: 'কাগজি পাতিলেবু (Lemon)', url: FRUIT_IMAGE },
  { label: 'G 9 কলা গাছ (Banana)', url: bananaImg },
  { label: 'পদ্ম ফুল (Sacred Lotus)', url: lotusImg },
  { label: 'গোলাপি স্থলপদ্ম (Stholopaddmo)', url: stholopaddmoImg },
  { label: 'বাগানবিলাস (Bougainvillea)', url: ROOFTOP_IMAGE },
  { label: 'কাশ্মীরি গোলাপ (Rose)', url: roseImg },
  { label: 'মরু গোলাপ (Adenium)', url: adeniumImg },
  { label: 'কৃষ্ণ তুলসী (Tulsi)', url: tulsiImg },
  { label: 'নীল অপরাজিতা (Aparajita)', url: aparajitaImg },
  { label: 'লাকি ব্যাম্বু (Lucky Bamboo)', url: luckyBambooImg },
  { label: 'চন্দ্রমল্লিকা (Mum)', url: chandramallikaImg },
  { label: 'সুগন্ধি মসলা চারা (Spice)', url: POTS_IMAGE },
];

export const PRESET_COLORS = [
  { labelBn: 'রক্ত লাল', labelEn: 'Red' },
  { labelBn: 'উজ্জ্বল হলুদ', labelEn: 'Yellow' },
  { labelBn: 'হালকা গোলাপি', labelEn: 'Pink' },
  { labelBn: 'স্নিগ্ধ সাদা', labelEn: 'White' },
  { labelBn: 'গাঢ় কমলা', labelEn: 'Orange' },
  { labelBn: 'রাজকীয় বেগুনী', labelEn: 'Purple' },
  { labelBn: 'সবুজ', labelEn: 'Green' },
  { labelBn: 'বারোমাসি কলম', labelEn: 'All-season Graft' },
  { labelBn: 'দেশি মিষ্টি জাত', labelEn: 'Native Variety' },
  { labelBn: 'থাই হাইব্রিড', labelEn: 'Thai Hybrid' },
];

export const QUICK_PRICES = [30, 40, 50, 60, 75, 95, 110, 125, 150, 180, 220, 300, 450];

export interface RootCauseIssue {
  id: string;
  severity: 'high' | 'medium' | 'info';
  titleBn: string;
  whereBn: string;
  rootReasonBn: string;
  solutionBn: string;
  plantToEdit?: import('../types/nursery').BrahmyamanPlant;
  canAutoBugFix?: boolean;
}
