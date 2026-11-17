import {
  Activity,
  Bot,
  Cloud,
  Cpu,
  Download,
  History,
  Lock,
  Package,
  Percent,
  Plus,
  QrCode,
  ShoppingBag,
  Star,
  Trash2,
} from 'lucide-react';
import type { AdminSection, AdminTab } from '../adminConstants';
import type { AdminUndoRecord } from '../../utils/adminUndoRedoStorage';
import type {
  BrahmyamanPlant,
  CustomerReviewItem,
  WhatsAppOrderLogItem,
} from '../../types/nursery';

export const TAB_TO_SECTION_MAP: Record<AdminTab, AdminSection> = {
  inventory: 'catalog',
  add: 'catalog',
  logs: 'catalog',
  bulk_price: 'bulk',
  qr_tags: 'bulk',
  orders: 'bulk',
  reviews: 'bulk',
  trash: 'recovery',
  backup: 'recovery',
  undo_redo: 'recovery',
  diagnostics: 'diagnostics',
  api: 'diagnostics',
  chatbot: 'diagnostics',
  cloudinary: 'diagnostics',
  settings: 'diagnostics',
};

export function buildAdminNavigationData(params: {
  activePlantsCount: number;
  trashedPlantsCount: number;
  orderLogs: WhatsAppOrderLogItem[];
  customerReviews: CustomerReviewItem[];
  undoStack: AdminUndoRecord[];
  rootCauseCount: number;
  base64PhotoCount: number;
  dbAlertsCount: number;
  editingPlantId: string | null;
  switchAdminTab: (tab: AdminTab) => void;
  onStartAddPlant: () => void;
}) {
  const {
    activePlantsCount,
    trashedPlantsCount,
    orderLogs,
    customerReviews,
    undoStack,
    rootCauseCount,
    base64PhotoCount,
    dbAlertsCount,
    editingPlantId,
    switchAdminTab,
    onStartAddPlant,
  } = params;

  const pendingReviewsCount = customerReviews.filter((r) => r.status === 'pending').length;

  const sectionsConfig: Array<{
    id: AdminSection;
    labelBn: string;
    shortLabelBn: string;
    descBn: string;
    icon: any;
    badge?: string | null;
  }> = [
    {
      id: 'catalog',
      labelBn: 'ক্যাটালগ পরিচালনা',
      shortLabelBn: 'ক্যাটালগ',
      descBn: 'গাছের ইনভেন্টরি, নতুন চারা ও আপলোড ইতিহাস',
      icon: Package,
      badge: `${activePlantsCount}`,
    },
    {
      id: 'bulk',
      labelBn: 'বাল্ক অপারেশন ও বিক্রয়',
      shortLabelBn: 'বাল্ক ও বিক্রয়',
      descBn: 'বাল্ক দাম পরিবর্তন, QR ট্যাগ, অর্ডার ও রিভিউ',
      icon: Percent,
      badge:
        orderLogs.length > 0 || pendingReviewsCount > 0
          ? `${orderLogs.length + pendingReviewsCount}`
          : null,
    },
    {
      id: 'recovery',
      labelBn: 'ট্র্যাশ ও পুনরুদ্ধার',
      shortLabelBn: 'ট্র্যাশ/রিকভারি',
      descBn: 'মুছে ফেলা চারা (৩০ দিন), ব্যাকআপ ও রিস্টোর',
      icon: Trash2,
      badge: trashedPlantsCount > 0 ? `${trashedPlantsCount}` : null,
    },
    {
      id: 'diagnostics',
      labelBn: 'সিস্টেম ডায়াগনস্টিকস ও কোটা',
      shortLabelBn: 'ডায়াগনস্টিকস',
      descBn: 'ক্যাটালগ অডিট, ১-ক্লিক ফিক্স, AI কোটা ও ডাটাবেস',
      icon: Activity,
      badge: rootCauseCount > 0 ? `${rootCauseCount}` : null,
    },
  ];

  const navGroups = [
    {
      sectionId: 'catalog' as AdminSection,
      groupLabel: 'ক্যাটালগ পরিচালনা (Manage Catalog)',
      icon: Package,
      items: [
        {
          id: 'inventory' as AdminTab,
          label: 'সব গাছ (Inventory)',
          badge: `${activePlantsCount}`,
          icon: Package,
          onClick: () => switchAdminTab('inventory'),
        },
        {
          id: 'add' as AdminTab,
          label: editingPlantId ? 'চারা এডিট ফর্ম' : '+ নতুন চারা যোগ',
          badge: null,
          icon: Plus,
          onClick: () => onStartAddPlant(),
        },
        {
          id: 'logs' as AdminTab,
          label: 'আপলোড হিস্ট্রি (ডেট-টাইম)',
          badge: null,
          icon: History,
          onClick: () => switchAdminTab('logs'),
        },
      ],
    },
    {
      sectionId: 'bulk' as AdminSection,
      groupLabel: 'বাল্ক অপারেশন ও বিক্রয় (Bulk Operations)',
      icon: Percent,
      items: [
        {
          id: 'bulk_price' as AdminTab,
          label: 'বাল্ক দাম ও ছাড় আপডেটার',
          badge: null,
          icon: Percent,
          onClick: () => switchAdminTab('bulk_price'),
        },
        {
          id: 'qr_tags' as AdminTab,
          label: 'প্রিন্টেবল QR প্ল্যান্ট ট্যাগ',
          badge: null,
          icon: QrCode,
          onClick: () => switchAdminTab('qr_tags'),
        },
        {
          id: 'orders' as AdminTab,
          label: 'অর্ডার ও চাহিদা ট্র্যাকার',
          badge: orderLogs.length > 0 ? `${orderLogs.length}` : null,
          icon: ShoppingBag,
          onClick: () => switchAdminTab('orders'),
        },
        {
          id: 'reviews' as AdminTab,
          label: 'কাস্টমার রিভিউ ও গ্যালারি',
          badge: pendingReviewsCount > 0 ? `${pendingReviewsCount}` : null,
          icon: Star,
          onClick: () => switchAdminTab('reviews'),
        },
      ],
    },
    {
      sectionId: 'recovery' as AdminSection,
      groupLabel: 'ট্র্যাশ ও পুনরুদ্ধার (Trash / Recovery)',
      icon: Trash2,
      items: [
        {
          id: 'trash' as AdminTab,
          label: 'ট্র্যাশ বিন (৩০ দিন)',
          badge: trashedPlantsCount > 0 ? `${trashedPlantsCount}` : null,
          icon: Trash2,
          onClick: () => switchAdminTab('trash'),
        },
        {
          id: 'backup' as AdminTab,
          label: 'ব্যাকআপ ও রিস্টোর',
          badge: null,
          icon: Download,
          onClick: () => switchAdminTab('backup'),
        },
        {
          id: 'undo_redo' as AdminTab,
          label: 'অ্যাকশন হিস্ট্রি ও অডিট',
          badge: undoStack.length > 0 ? `${undoStack.length}` : null,
          icon: History,
          onClick: () => switchAdminTab('undo_redo'),
        },
      ],
    },
    {
      sectionId: 'diagnostics' as AdminSection,
      groupLabel: 'সিস্টেম ডায়াগনস্টিকস (System Diagnostics)',
      icon: Activity,
      items: [
        {
          id: 'diagnostics' as AdminTab,
          label: 'ক্যাটালগ অডিট ও ১-ক্লিক ফিক্স',
          badge: rootCauseCount > 0 ? `${rootCauseCount}` : null,
          icon: Activity,
          onClick: () => switchAdminTab('diagnostics'),
        },
        {
          id: 'api' as AdminTab,
          label: 'Gemini AI ও ২৪ঘণ্টার কোটা',
          badge: null,
          icon: Cpu,
          onClick: () => switchAdminTab('api'),
        },
        {
          id: 'chatbot' as AdminTab,
          label: 'Gemini AI পরামর্শক',
          badge: null,
          icon: Bot,
          onClick: () => switchAdminTab('chatbot'),
        },
        {
          id: 'cloudinary' as AdminTab,
          label: 'Cloudinary মিডিয়া ও স্টোরেজ',
          badge: base64PhotoCount > 0 ? `${base64PhotoCount}` : null,
          icon: Cloud,
          onClick: () => switchAdminTab('cloudinary'),
        },
        {
          id: 'settings' as AdminTab,
          label: 'নিরাপত্তা ও ডাটাবেস',
          badge: dbAlertsCount > 0 ? `${dbAlertsCount}` : null,
          icon: Lock,
          onClick: () => switchAdminTab('settings'),
        },
      ],
    },
  ];

  const sectionMeta: Record<AdminTab, { titleBn: string; subtitleBn: string }> = {
    inventory: {
      titleBn: 'ক্যাটালগ ও ইনভেন্টরি (নতুন আপলোড সবার উপরে)',
      subtitleBn: `মোট ${activePlantsCount} টি সক্রিয় চারা · সারি ওয়াইজ ডেট-টাইম লিস্ট ও দ্রুত ফিল্টার`,
    },
    add: {
      titleBn: editingPlantId ? 'চারার তথ্য ও ছবি সম্পাদনা' : 'নতুন চারা যোগ করুন',
      subtitleBn: 'ক্যামেরা, ৩-স্লট গ্যালারি, দাম ও Gemini AI অটো-ফিল',
    },
    logs: {
      titleBn: 'আপলোড করা চারার ডেট-টাইম লিস্ট ও হিস্ট্রি',
      subtitleBn: 'নতুন আপলোড করা চারা সবার উপরে সারি ওয়াইজ দেখুন ও ১-ক্লিকে এডিট করুন',
    },
    orders: {
      titleBn: 'হোয়াটসঅ্যাপ অর্ডার ও চাহিদা ট্র্যাকার',
      subtitleBn: 'সবচেয়ে বেশি চাহিদার চারা ও কাস্টমার অর্ডার/শেয়ার লিস্ট',
    },
    bulk_price: {
      titleBn: 'বাল্ক প্রাইস ও সিজনাল ডিসকাউন্ট আপডেটার',
      subtitleBn: 'বর্ষা বা শীতের মৌসুমে ১-ক্লিকে নির্দিষ্ট ক্যাটাগরির দাম শতকরা হারে কমান বা বাড়ান',
    },
    reviews: {
      titleBn: 'কাস্টমার রিভিউ ও বাগান গ্যালারি অনুমোদন',
      subtitleBn: 'ক্রেতাদের পাঠানো গাছের ছবি ও মতামত অনুমোদন করে ওয়েবসাইটে দেখান',
    },
    qr_tags: {
      titleBn: 'প্রিন্টেবল QR কোড প্ল্যান্ট ট্যাগ জেনারেটর',
      subtitleBn: 'নার্সারির টব বা চারার গায়ে লাগানোর জন্য নাম, দাম ও QR কোডসহ প্রিন্টেবল ট্যাগ',
    },
    trash: {
      titleBn: 'ডিজিটাল ট্র্যাশ বিন',
      subtitleBn: 'মুছে ফেলা চারা ৩০ দিন পর্যন্ত সুরক্ষিত থাকে',
    },
    chatbot: {
      titleBn: 'Google Gemini AI নার্সারি পরামর্শক',
      subtitleBn: 'Gemini AI দিয়ে ক্যাটালগ সমস্যা নির্ণয় ও গাছের পরিচর্যা পরামর্শ',
    },
    api: {
      titleBn: 'Gemini AI কনফিগারেশন ও কোটা স্ট্যাটাস',
      subtitleBn: 'Gemini ৪-স্লট কী পুল, অটো-রোটেশন ও সার্ভার ডায়াগনস্টিকস',
    },
    cloudinary: {
      titleBn: 'Cloudinary মিডিয়া ও স্টোরেজ কন্ট্রোল',
      subtitleBn: 'CDN ছবি লাইব্রেরি, Base64 মাইগ্রেশন ও অরফ্যান স্ক্যানার',
    },
    backup: {
      titleBn: 'ব্যাকআপ, অফলাইন ক্যাটালগ ও রিস্টোর',
      subtitleBn: 'JSON ব্যাকআপ, প্রিন্টযোগ্য ফটো ক্যাটালগ ও পুনরুদ্ধার',
    },
    settings: {
      titleBn: 'নিরাপত্তা, অ্যাকাউন্ট ও ডাটাবেস হেলথ',
      subtitleBn: 'অনুমোদিত অ্যাডমিন রোল ও Firestore কোটা মনিটর',
    },
    undo_redo: {
      titleBn: 'ক্যাটালগ আনডু ও রিডু হিস্ট্রি স্ট্যাক',
      subtitleBn: 'কোন কোন পরিবর্তন করা হয়েছে এবং ১-ক্লিকে কী আনডু বা রিডু করবেন তা দেখুন',
    },
    diagnostics: {
      titleBn: 'ক্যাটালগ অডিট ও ১-ক্লিক মেরামত কেন্দ্র',
      subtitleBn: 'ক্যাটালগের ভুলত্রুটি, রুট কজ বিশ্লেষণ, ডুপ্লিকেট স্ক্যান ও স্বয়ংক্রিয় মেরামত',
    },
  };

  return { sectionsConfig, navGroups, sectionMeta };
}

export type AdminNavData = ReturnType<typeof buildAdminNavigationData>;
export type { BrahmyamanPlant };
