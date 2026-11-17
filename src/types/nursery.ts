export type AudienceTag =
  | 'all'
  | 'fruit'
  | 'puja'
  | 'flower'
  | 'foliage'
  | 'herbal'
  | 'rooftop'
  | 'family';

export type PlantCategory =
  | 'ছাদবাগানের ফল ও কলম'
  | 'পূজার ফুল ও পবিত্র গাছ'
  | 'ছাদ ও বারান্দার ফুল'
  | 'গাছপালা ও শো-প্ল্যান্ট'
  | 'মসলা ও ভেষজ গাছ'
  | 'গৃহস্থ ও ঔষধি গাছ';

export interface PlantPotOption {
  id: string;
  labelBn: string;
  labelEn: string;
  price: number;
  containerType: 'পলি গ্রো ব্যাগ' | 'মাঝারি গ্রো ব্যাগ' | 'বড় পরিপুষ্ট চারা' | 'কলমের চারা' | 'একক' | 'বস্তা';
}

export interface BrahmyamanPlant {
  id: string;
  nameBn: string;
  nameEn: string;
  botanicalName: string;
  category: PlantCategory;
  audience: AudienceTag[];
  badgeBn?: string;
  badgeEn?: string;
  colorBn?: string;
  colorEn?: string;
  sunlightBn: string;
  sunlightEn: string;
  wateringBn: string;
  wateringEn: string;
  soilTipBn: string;
  soilTipEn: string;
  descriptionBn: string;
  descriptionEn: string;
  image: string;
  images?: string[]; // Up to 3 product images [primary, close-up, root-ball/pot]
  cloudinaryPublicIds?: string[]; // Cloudinary asset IDs for management & deletion
  options: PlantPotOption[];
  featured?: boolean;
  inStock?: boolean;
  createdAt?: string;
  createdAtBn?: string;
  updatedAt?: string;
  updatedAtBn?: string;
  status?: 'active' | 'deleted';
  deletedAt?: string;
  deletedAtBn?: string;
}

export interface AdminActivityLogItem {
  id: string;
  timestamp: string;
  dateBn: string;
  timeBn: string;
  actionType:
    | 'photo_upload'
    | 'price_update'
    | 'plant_add'
    | 'plant_edit'
    | 'plant_delete'
    | 'plant_restore'
    | 'trash_empty'
    | 'permanent_delete'
    | 'settings_change';
  titleBn: string;
  descriptionBn: string;
  plantId?: string;
  plantNameBn?: string;
  thumbnail?: string;
}

export interface WhatsAppInquiryItem {
  plantId: string;
  nameBn: string;
  nameEn: string;
  optionLabelBn: string;
  optionLabelEn: string;
  price: number;
  quantity: number;
}

export type WhatsAppOrderEventType =
  | 'cart_order'
  | 'direct_order'
  | 'photo_share'
  | 'voice_order';

export type WhatsAppOrderStatus = 'new' | 'contacted' | 'delivered' | 'completed';

export interface WhatsAppOrderLineItem {
  plantId: string;
  plantNameBn?: string;
  nameBn?: string;
  category?: string;
  optionLabelBn: string;
  unitPrice?: number;
  price?: number;
  quantity: number;
  image?: string;
}

export interface WhatsAppOrderLogItem {
  id: string;
  timestamp: string;
  dateBn: string;
  timeBn: string;
  createdAtBn?: string;
  eventType: WhatsAppOrderEventType;
  customerName?: string;
  customerPhone?: string;
  customerVillage?: string;
  deliveryZone?: string;
  deliveryZoneBn?: string;
  locality?: string;
  pickupPreference?: 'pickup' | 'delivery';
  deliveryMode?: 'pickup' | 'delivery';
  specialNote?: string;
  voiceTranscript?: string;
  totalAmount: number;
  totalEstimatedAmount?: number;
  totalQuantity?: number;
  items: WhatsAppOrderLineItem[];
  status: WhatsAppOrderStatus;
}

export interface CustomerReviewItem {
  id: string;
  plantId?: string;
  plantNameBn?: string;
  plantBought?: string;
  customerName: string;
  customerNameBn?: string;
  nameBn?: string;
  nameEn?: string;
  locationBn: string;
  locationEn?: string;
  rating: number;
  commentBn: string;
  textBn?: string;
  textEn?: string;
  photoUrl?: string;
  image?: string;
  status: 'pending' | 'approved';
  createdAt: string;
  createdAtBn: string;
}

export interface PlantCareTip {
  id: string;
  titleBn: string;
  titleEn: string;
  targetBn: string;
  targetEn: string;
  descBn: string;
  descEn: string;
  bulletPointsBn: string[];
  bulletPointsEn: string[];
}
