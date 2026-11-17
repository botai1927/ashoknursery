import { ChangeEvent, FormEvent, RefObject } from 'react';
import {
  Sparkles,
  Loader2,
  Edit2,
  AlertTriangle,
  CheckCircle,
  Camera,
  Clock,
  Upload,
  Globe,
  Search,
  Palette,
  DollarSign,
  Tag,
  Check,
  X,
  Undo2,
  Redo2,
  RotateCcw,
} from 'lucide-react';
import type { BrahmyamanPlant, PlantCategory } from '../types/nursery';
import { PUJA_IMAGE } from '../data/brahmyamanCatalog';
import { resolvePlantImageUrl } from '../utils/imageUrl';
import {
  ADMIN_CATEGORIES,
  PRESET_PLANT_PHOTOS,
  PRESET_COLORS,
} from './adminConstants';
import type { AdminAiStatusSnapshot, AiModelChoice, AiProviderChoice } from './AdminApiTab';

export interface ImageSearchResultItem {
  id: string;
  title: string;
  url: string;
  thumbUrl: string;
  source: string;
  license: string;
  verified: boolean;
  extract?: string;
}

export interface DuplicateCheckResult {
  type: 'exact_duplicate' | 'valid_variant';
  plant: BrahmyamanPlant;
  messageBn: string;
}

interface AdminPlantFormTabProps {
  isAdminSimpleView: boolean;
  editingPlantId: string | null;
  formNameBn: string;
  setFormNameBn: (v: string) => void;
  formNameEn: string;
  setFormNameEn: (v: string) => void;
  formBotanical: string;
  setFormBotanical: (v: string) => void;
  formCategory: PlantCategory;
  setFormCategory: (c: PlantCategory) => void;
  formBadgeBn: string;
  setFormBadgeBn: (v: string) => void;
  formColorBn: string;
  setFormColorBn: (v: string) => void;
  formSunlightBn: string;
  setFormSunlightBn: (v: string) => void;
  formWateringBn: string;
  setFormWateringBn: (v: string) => void;
  formSoilTipBn: string;
  setFormSoilTipBn: (v: string) => void;
  formDescBn: string;
  setFormDescBn: (v: string) => void;
  formDescEn: string;
  setFormDescEn: (v: string) => void;
  formImage: string;
  formImages: string[];
  activeImageSlot: number;
  setActiveImageSlot: (slot: number) => void;
  photoUploadTimestampBn: string | null;
  isCompressingPhoto: boolean;
  isUploadingToCloudinary: boolean;
  cloudinaryStatus: {
    configured: boolean;
    verified?: boolean;
    cloudName: string | null;
    folder?: string;
    errorCode?: string | null;
    errorMessage?: string | null;
  } | null;
  cameraInputRef: RefObject<HTMLInputElement | null>;
  galleryInputRef: RefObject<HTMLInputElement | null>;
  onPhotoUpload: (e: ChangeEvent<HTMLInputElement>, source: 'camera' | 'gallery') => void;
  onClearPhotoSlot: (slotIdx: number) => void;
  onSelectPresetPhoto: (url: string) => void;
  showImageSearchPanel: boolean;
  setShowImageSearchPanel: (show: boolean) => void;
  imageSearchQuery: string;
  setImageSearchQuery: (q: string) => void;
  isSearchingImages: boolean;
  imageSearchResults: ImageSearchResultItem[];
  imageSearchError: string | null;
  verifiedImageSource: string | null;
  onSearchPlantImages: (term?: string) => void;
  onSelectSearchedImage: (img: ImageSearchResultItem) => void;
  aiStatus: AdminAiStatusSnapshot | null;
  aiProviderChoice: AiProviderChoice;
  setAiProviderChoice: (p: AiProviderChoice) => void;
  modelType: AiModelChoice;
  setModelType: (m: AiModelChoice) => void;
  aiCustomInstruction: string;
  setAiCustomInstruction: (v: string) => void;
  isAiAutofilling: boolean;
  onAiAutoFill: (overrideQuery?: string, mode?: 'full' | 'description_only') => void;
  duplicateCheck: DuplicateCheckResult | null;
  onEditExistingDuplicate: (plant: BrahmyamanPlant) => void;
  setBasePrice: (v: string) => void;
  option1Label: string;
  setOption1Label: (v: string) => void;
  option1Price: string;
  setOption1Price: (v: string) => void;
  option2Label: string;
  setOption2Label: (v: string) => void;
  option2Price: string;
  setOption2Price: (v: string) => void;
  hasOption3: boolean;
  setHasOption3: (v: boolean) => void;
  option3Label: string;
  setOption3Label: (v: string) => void;
  option3Price: string;
  setOption3Price: (v: string) => void;
  onSubmitForm: (e: FormEvent) => void;
  onBack: () => void;
  formUndoCount?: number;
  formRedoCount?: number;
  lastFormUndoLabelBn?: string | null;
  lastFormRedoLabelBn?: string | null;
  onFormUndo?: () => void;
  onFormRedo?: () => void;
  onResetFormDraft?: () => void;
  globalUndoCount?: number;
  globalRedoCount?: number;
  lastGlobalUndoLabelBn?: string | null;
  lastGlobalRedoLabelBn?: string | null;
  onGlobalUndo?: () => void;
  onGlobalRedo?: () => void;
}

export function AdminPlantFormTab({
  isAdminSimpleView,
  editingPlantId,
  formNameBn,
  setFormNameBn,
  formNameEn,
  setFormNameEn,
  formBotanical,
  setFormBotanical,
  formCategory,
  setFormCategory,
  formBadgeBn,
  setFormBadgeBn,
  formColorBn,
  setFormColorBn,
  formSunlightBn,
  setFormSunlightBn,
  formWateringBn,
  setFormWateringBn,
  formSoilTipBn,
  setFormSoilTipBn,
  formDescBn,
  setFormDescBn,
  formDescEn,
  setFormDescEn,
  formImage,
  formImages,
  activeImageSlot,
  setActiveImageSlot,
  photoUploadTimestampBn,
  isCompressingPhoto,
  isUploadingToCloudinary,
  cloudinaryStatus,
  cameraInputRef,
  galleryInputRef,
  onPhotoUpload,
  onClearPhotoSlot,
  onSelectPresetPhoto,
  showImageSearchPanel,
  setShowImageSearchPanel,
  imageSearchQuery,
  setImageSearchQuery,
  isSearchingImages,
  imageSearchResults,
  imageSearchError,
  verifiedImageSource,
  onSearchPlantImages,
  onSelectSearchedImage,
  aiStatus,
  aiProviderChoice,
  setAiProviderChoice,
  modelType,
  setModelType,
  aiCustomInstruction,
  setAiCustomInstruction,
  isAiAutofilling,
  onAiAutoFill,
  duplicateCheck,
  onEditExistingDuplicate,
  setBasePrice,
  option1Label,
  setOption1Label,
  option1Price,
  setOption1Price,
  option2Label,
  setOption2Label,
  option2Price,
  setOption2Price,
  hasOption3,
  setHasOption3,
  option3Label,
  setOption3Label,
  option3Price,
  setOption3Price,
  onSubmitForm,
  onBack,
  formUndoCount = 0,
  formRedoCount = 0,
  lastFormUndoLabelBn = null,
  lastFormRedoLabelBn = null,
  onFormUndo,
  onFormRedo,
  onResetFormDraft,
  globalUndoCount = 0,
  globalRedoCount = 0,
  lastGlobalUndoLabelBn = null,
  lastGlobalRedoLabelBn = null,
  onGlobalUndo,
  onGlobalRedo,
}: AdminPlantFormTabProps) {
  return (
    <div className="bg-white border border-[#E8E1D5] rounded-2xl p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap pb-3 border-b border-[#E8E1D5]">
        <div>
          <h2 className={`font-serif-bn font-bold text-[#142318] ${isAdminSimpleView ? 'text-xl' : 'text-base sm:text-lg'}`}>
            {editingPlantId ? 'চারার তথ্য, ছবি ও দাম আপডেট' : 'নতুন চারার ছবি ও দাম যোগ করুন'}
          </h2>
          <p className={isAdminSimpleView ? 'text-sm text-[#526356]' : 'text-[11px] text-[#785942]'}>
            ক্যামেরা দিয়ে ছবি তুলুন, AI দিয়ে বিবরণ তৈরি করুন ও বিক্রয়মূল্য সেট করুন
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {onResetFormDraft && (
            <button
              type="button"
              onClick={onResetFormDraft}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#FAF8F5] hover:bg-[#F3ECE2] border border-[#D5C9B8] text-[#785942] rounded-xl text-xs font-bold cursor-pointer"
              title="ফর্মের তথ্য রিসেট করুন"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>রিসেট</span>
            </button>
          )}
          <button
            type="button"
            onClick={onBack}
            className={`text-[#142318] bg-[#F5EFE6] hover:bg-[#E8E1D5] rounded-xl font-bold cursor-pointer whitespace-nowrap shrink-0 ${
              isAdminSimpleView ? 'px-4 py-2.5 text-sm' : 'text-xs px-3 py-1.5'
            }`}
          >
            পিছনে ফিরুন
          </button>
        </div>
      </div>

      {/* Form & Upload Live Undo/Redo Bar */}
      <div
        data-testid="plant-form-undo-redo-bar"
        className="p-3 bg-[#F4F9F5] border border-[#C6E6D3] rounded-xl flex items-center justify-between gap-3 flex-wrap"
      >
        <div className="min-w-0">
          <p className="text-xs font-bold text-[#142318] flex items-center gap-1.5">
            <Undo2 className="w-3.5 h-3.5 text-[#1B8354] shrink-0" />
            <span>চারা যোগ ও ছবি আপলোড আনডু / রিডু (Form & Upload Undo/Redo)</span>
          </p>
          <p className="text-[11px] text-[#526356] truncate mt-0.5">
            {lastFormUndoLabelBn
              ? `সর্বশেষ ফর্ম পরিবর্তন: ${lastFormUndoLabelBn}`
              : lastGlobalUndoLabelBn
              ? `সর্বশেষ ক্যাটালগ পরিবর্তন: ${lastGlobalUndoLabelBn}`
              : 'ছবি আপলোড/মুছে ফেলা, AI অটো-ফিল, দাম বা নামের যেকোনো পরিবর্তন ১-ক্লিকে আনডু/রিডু করুন'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            type="button"
            disabled={formUndoCount === 0}
            onClick={onFormUndo}
            title={
              lastFormUndoLabelBn
                ? `ফর্ম আনডু: ${lastFormUndoLabelBn}`
                : 'ফর্ম বা ছবির পূর্বাবস্থায় ফেরান'
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#EBF5EF] disabled:opacity-45 disabled:pointer-events-none border border-[#1B8354]/40 text-[#142318] text-xs font-bold cursor-pointer shadow-2xs"
          >
            <Undo2 className="w-3.5 h-3.5 text-[#1B8354]" />
            <span>ফর্ম আনডু</span>
            <span className="font-mono text-[10px] text-[#1B8354]">({formUndoCount})</span>
          </button>

          <button
            type="button"
            disabled={formRedoCount === 0}
            onClick={onFormRedo}
            title={
              lastFormRedoLabelBn
                ? `ফর্ম রিডু: ${lastFormRedoLabelBn}`
                : 'ফর্ম বা ছবির পরিবর্তন পুনরায় করুন'
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#EBF5EF] disabled:opacity-45 disabled:pointer-events-none border border-[#1B8354]/40 text-[#142318] text-xs font-bold cursor-pointer shadow-2xs"
          >
            <Redo2 className="w-3.5 h-3.5 text-[#1B8354]" />
            <span>ফর্ম রিডু</span>
            <span className="font-mono text-[10px] text-[#1B8354]">({formRedoCount})</span>
          </button>

          {(globalUndoCount > 0 || globalRedoCount > 0) && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-[#C6E6D3]">
              <button
                type="button"
                disabled={globalUndoCount === 0}
                onClick={onGlobalUndo}
                title={
                  lastGlobalUndoLabelBn
                    ? `ক্যাটালগ আনডু: ${lastGlobalUndoLabelBn}`
                    : 'ক্যাটালগ পরিবর্তন আনডু করুন'
                }
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#142318] hover:bg-[#203425] disabled:opacity-40 disabled:pointer-events-none text-white text-[11px] font-bold cursor-pointer"
              >
                <Undo2 className="w-3 h-3 text-[#A3E635]" />
                <span>ক্যাটালগ আনডু ({globalUndoCount})</span>
              </button>
              <button
                type="button"
                disabled={globalRedoCount === 0}
                onClick={onGlobalRedo}
                title={
                  lastGlobalRedoLabelBn
                    ? `ক্যাটালগ রিডু: ${lastGlobalRedoLabelBn}`
                    : 'ক্যাটালগ পরিবর্তন রিডু করুন'
                }
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#142318] hover:bg-[#203425] disabled:opacity-40 disabled:pointer-events-none text-white text-[11px] font-bold cursor-pointer"
              >
                <Redo2 className="w-3 h-3 text-[#A3E635]" />
                <span>ক্যাটালগ রিডু ({globalRedoCount})</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Duplicate Detection Notice */}
      {duplicateCheck && (
        <div
          className={`p-3.5 rounded-xl border text-xs ${
            duplicateCheck.type === 'exact_duplicate'
              ? 'bg-[#FEF2F2] border-[#FCA5A5] text-[#991B1B]'
              : 'bg-[#F0FDF4] border-[#86EFAC] text-[#166534]'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {duplicateCheck.type === 'exact_duplicate' ? (
              <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
            ) : (
              <CheckCircle className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
            )}
            <div className="flex-1 space-y-1.5">
              <p className="font-semibold">{duplicateCheck.messageBn}</p>
              {duplicateCheck.type === 'exact_duplicate' && (
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onEditExistingDuplicate(duplicateCheck.plant)}
                    className="px-3 py-1.5 bg-[#991B1B] text-white font-bold rounded-lg text-[11px] cursor-pointer"
                  >
                    বর্তমান চারাটিতে যান ও দাম আপডেট করুন
                  </button>
                  <span className="text-[10px] text-[#B91C1C] flex items-center">
                    অথবা নিচে চারার নির্দিষ্ট রং/ভ্যারাইটি বেছে নিন।
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={onSubmitForm} className="space-y-5">
        {/* STEP 1: PHOTO & GALLERY SLOTS */}
        <section className="p-4 bg-[#FBF9F5] border border-[#E8E1D5] rounded-2xl space-y-3.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <label className="text-xs font-bold text-[#142318] flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-[#1B8354]" />
              <span>১. চারার ছবি ও ৩টি গ্যালারি স্লট</span>
            </label>
            <div className="flex items-center gap-2 flex-wrap text-[11px]">
              {(formUndoCount > 0 || formRedoCount > 0) && (
                <div className="inline-flex items-center gap-1">
                  <button
                    type="button"
                    disabled={formUndoCount === 0}
                    onClick={onFormUndo}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white hover:bg-[#EBF5EF] disabled:opacity-40 border border-[#D5C9B8] text-[#142318] text-[10px] font-bold cursor-pointer"
                    title="ছবি বা ফর্ম পরিবর্তন আনডু করুন"
                  >
                    <Undo2 className="w-3 h-3 text-[#1B8354]" />
                    <span>ছবি আনডু</span>
                  </button>
                  <button
                    type="button"
                    disabled={formRedoCount === 0}
                    onClick={onFormRedo}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white hover:bg-[#EBF5EF] disabled:opacity-40 border border-[#D5C9B8] text-[#142318] text-[10px] font-bold cursor-pointer"
                    title="ছবি বা ফর্ম পরিবর্তন রিডু করুন"
                  >
                    <Redo2 className="w-3 h-3 text-[#1B8354]" />
                    <span>ছবি রিডু</span>
                  </button>
                </div>
              )}
              {cloudinaryStatus?.configured && cloudinaryStatus.verified ? (
                <span className="text-[#1B8354] font-semibold">Cloudinary সক্রিয় ✓</span>
              ) : cloudinaryStatus?.configured && !cloudinaryStatus.verified ? (
                <span className="text-[#B34728] font-semibold">
                  Cloudinary ত্রুটি ({cloudinaryStatus.cloudName || '?'})
                </span>
              ) : null}
              {photoUploadTimestampBn && (
                <span className="text-[#526356] flex items-center gap-1 tabular-nums">
                  <Clock className="w-3 h-3 text-[#1B8354]" />
                  <span>{photoUploadTimestampBn}</span>
                </span>
              )}
            </div>
          </div>

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onClick={(e) => {
              (e.target as HTMLInputElement).value = '';
            }}
            onChange={(e) => onPhotoUpload(e, 'camera')}
            className="hidden"
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            onClick={(e) => {
              (e.target as HTMLInputElement).value = '';
            }}
            onChange={(e) => onPhotoUpload(e, 'gallery')}
            className="hidden"
          />

          {/* 3-Photo Slot Selection Bar (Sibling remove button for clean valid interactive HTML) */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { slotIdx: 0, label: '১. প্রধান ছবি', desc: 'মূল চারা' },
              { slotIdx: 1, label: '২. ক্লোজ-আপ', desc: 'পাতা/ফুল' },
              { slotIdx: 2, label: '৩. পাত্র/শিকড়', desc: 'টব/গোড়া' },
            ].map((slot) => {
              const slotImg = formImages[slot.slotIdx];
              const isSelected = activeImageSlot === slot.slotIdx;
              return (
                <div key={`slot-${slot.slotIdx}`} className="relative">
                  <button
                    type="button"
                    onClick={() => setActiveImageSlot(slot.slotIdx)}
                    className={`w-full p-1.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#1B8354] bg-[#EBF5EF] ring-2 ring-[#1B8354]/40'
                        : 'border-[#DACFBF] bg-white hover:bg-[#FAF7F2]'
                    }`}
                  >
                    <div className="aspect-[4/3] rounded-lg bg-[#EAE4D9] overflow-hidden mb-1 flex items-center justify-center">
                      {slotImg ? (
                        <img
                          src={resolvePlantImageUrl(slotImg, PUJA_IMAGE)}
                          alt={slot.label}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-[10px] text-[#785942] font-medium">+ ছবি দিন</span>
                      )}
                    </div>
                    <p className="text-[10px] font-bold text-[#142318] truncate leading-tight">
                      {slot.label}
                    </p>
                    <p className="text-[9px] text-[#785942] truncate">
                      {slotImg ? (slotImg.includes('cloudinary') ? 'Cloudinary ✓' : 'সংরক্ষিত') : slot.desc}
                    </p>
                  </button>

                  {slot.slotIdx > 0 && slotImg && (
                    <button
                      type="button"
                      onClick={() => onClearPhotoSlot(slot.slotIdx)}
                      aria-label={`স্লট ${slot.slotIdx + 1} মুছুন`}
                      className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-xs cursor-pointer"
                      title="ছবি সরান"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Photo Preview & Upload Buttons */}
          <div className="flex items-center gap-3 pt-1">
            <div className="w-22 h-22 rounded-xl overflow-hidden border-2 border-[#1B8354] bg-[#EAE4D9] shrink-0 relative">
              <img
                src={resolvePlantImageUrl(formImages[activeImageSlot] || formImage, PUJA_IMAGE)}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              {(isCompressingPhoto || isUploadingToCloudinary) && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white p-1 text-center">
                  <Loader2 className="w-5 h-5 animate-spin text-[#A3E635]" />
                  <span className="text-[9px] mt-1 font-bold">
                    {isUploadingToCloudinary ? 'ক্লাউডিনারি...' : 'কমপ্রেস...'}
                  </span>
                </div>
              )}
              {verifiedImageSource && (
                <div className="absolute bottom-0 inset-x-0 bg-[#1B8354]/95 text-white text-[9px] font-bold text-center py-0.5">
                  যাচাইকৃত
                </div>
              )}
            </div>

            <div className="flex-1 space-y-2">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                disabled={isCompressingPhoto || isUploadingToCloudinary}
                className={`w-full bg-[#1B8354] hover:bg-[#146c44] text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 ${
                  isAdminSimpleView ? 'h-13 text-base' : 'h-10 text-xs'
                }`}
              >
                <Camera className={isAdminSimpleView ? 'w-5 h-5' : 'w-4 h-4'} />
                <span>স্লট {activeImageSlot + 1}-এ ক্যামেরা দিয়ে ছবি তুলুন</span>
              </button>

              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                disabled={isCompressingPhoto || isUploadingToCloudinary}
                className={`w-full bg-white border border-[#D5C9B8] hover:bg-[#F3ECE2] text-[#142318] rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 ${
                  isAdminSimpleView ? 'h-12 text-sm' : 'h-9 text-xs'
                }`}
              >
                <Upload className="w-3.5 h-3.5 text-[#785942]" />
                <span>স্লট {activeImageSlot + 1}-এ গ্যালারি থেকে আপলোড</span>
              </button>

              <p className="text-[10px] font-medium text-[#526356] leading-snug">
                {editingPlantId
                  ? 'ছবি বদলালেই সাথে সাথে লাইভ দোকানে আপডেট হয়ে যাবে।'
                  : 'ছবি যুক্ত করে নিচের সংরক্ষণ বোতামে চাপলে দোকানে লাইভ হবে।'}
              </p>
            </div>
          </div>

          {/* Wikimedia Botanical Image Search Drawer */}
          <div className="pt-2 border-t border-[#E8E1D5] space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  const next = !showImageSearchPanel;
                  setShowImageSearchPanel(next);
                  if (next && imageSearchResults.length === 0) {
                    const initial = (formNameBn || formNameEn || formBotanical || 'রক্তজবা').trim();
                    setImageSearchQuery(initial);
                    onSearchPlantImages(initial);
                  }
                }}
                className={`inline-flex items-center gap-1.5 px-3 rounded-xl bg-white hover:bg-[#FAF8F5] text-[#1B8354] font-bold transition-all border border-[#1B8354]/40 cursor-pointer ${
                  isAdminSimpleView ? 'min-h-[44px] text-sm py-2' : 'py-1.5 text-xs'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>ডাটাবেস থেকে ছবি অনুসন্ধান</span>
              </button>

              {verifiedImageSource && (
                <span className="text-[10px] text-[#1B8354] font-bold flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  <span>{verifiedImageSource}</span>
                </span>
              )}
            </div>

            {showImageSearchPanel && (
              <div className="p-3 bg-white rounded-xl border border-[#D5C9B8] space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-[#785942] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={imageSearchQuery}
                      onChange={(e) => setImageSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          onSearchPlantImages(imageSearchQuery);
                        }
                      }}
                      placeholder="যেমন: রক্তজবা, কাগজি লেবু, Rose, Bougainvillea..."
                      className="w-full h-9 pl-9 pr-3 bg-[#FAF8F5] border border-[#D5C9B8] rounded-xl text-xs text-[#142318] focus:outline-none focus:border-[#1B8354]"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={isSearchingImages}
                    onClick={() => onSearchPlantImages(imageSearchQuery)}
                    className="px-3 h-9 bg-[#142318] hover:bg-[#203425] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    {isSearchingImages ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Search className="w-3.5 h-3.5" />
                    )}
                    <span>খুঁজুন</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-1 items-center">
                  <span className="text-[10px] text-[#785942] font-semibold">জনপ্রিয়:</span>
                  {['টমেটোর চারা', 'বেগুনের চারা', 'রক্তজবা', 'কাগজি লেবু', 'গোলাপ', 'আম্রপালী', 'থাই পেয়ারা', 'টিউলিপ', 'কৃষ্ণ তুলসী'].map(
                    (tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          setImageSearchQuery(tag);
                          onSearchPlantImages(tag);
                        }}
                        className="px-2 py-0.5 rounded-md bg-[#FAF8F5] hover:bg-[#F3ECE2] border border-[#E8E1D5] text-[10px] text-[#526356] font-medium cursor-pointer"
                      >
                        {tag}
                      </button>
                    )
                  )}
                </div>

                {imageSearchError && (
                  <p className="text-xs text-[#B34728] font-semibold bg-[#B34728]/10 p-2 rounded-xl text-center">
                    {imageSearchError}
                  </p>
                )}

                {isSearchingImages ? (
                  <div className="py-6 text-center text-xs text-[#785942] font-medium flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#1B8354]" />
                    <span>অনলাইন বোটানিক্যাল ডাটাবেসে সঠিক ছবি যাচাই করা হচ্ছে...</span>
                  </div>
                ) : imageSearchResults.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-56 overflow-y-auto p-1 bg-[#FAF8F5] rounded-xl border border-[#F0EAE1]">
                    {imageSearchResults.map((img) => {
                      const currentSlotUrl =
                        formImages[activeImageSlot] || (activeImageSlot === 0 ? formImage : '');
                      const isSlotMatch = currentSlotUrl === img.url;
                      return (
                        <button
                          key={img.id}
                          type="button"
                          onClick={() => onSelectSearchedImage(img)}
                          className={`group rounded-xl overflow-hidden border-2 cursor-pointer transition-all bg-white flex flex-col justify-between text-left ${
                            isSlotMatch
                              ? 'border-[#1B8354] ring-2 ring-[#1B8354]/30'
                              : 'border-[#E8E1D5] hover:border-[#1B8354]'
                          }`}
                        >
                          <div className="aspect-square w-full overflow-hidden bg-[#EAE4D9]">
                            <img
                              src={resolvePlantImageUrl(img.thumbUrl || img.url, PUJA_IMAGE)}
                              alt={img.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              loading="lazy"
                            />
                          </div>
                          <div className="p-1.5 w-full">
                            <p className="text-[10px] font-bold text-[#142318] truncate">{img.title}</p>
                            <div className="flex items-center justify-between mt-0.5 text-[9px]">
                              <span className="text-[#1B8354] font-semibold">যাচাইকৃত</span>
                              {isSlotMatch && <span className="text-[#1B8354] font-bold">যুক্ত ✓</span>}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Preset Species Thumbnails */}
          <div>
            <span className="block text-[10px] font-semibold text-[#526356] mb-1.5">
              অথবা নার্সারির প্রস্তুত চারা থেকে ছবি বাছুন:
            </span>
            <div className="grid grid-cols-6 sm:grid-cols-7 gap-1.5 max-h-24 overflow-y-auto p-1.5 bg-white border border-[#E8E1D5] rounded-xl">
              {PRESET_PLANT_PHOTOS.map((preset, idx) => {
                const currentSlotUrl =
                  formImages[activeImageSlot] || (activeImageSlot === 0 ? formImage : '');
                const isPresetMatch = currentSlotUrl === preset.url;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onSelectPresetPhoto(preset.url)}
                    title={preset.label}
                    className={`aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-transform ${
                      isPresetMatch
                        ? 'border-[#1B8354] ring-2 ring-[#1B8354]/30 scale-95'
                        : 'border-transparent opacity-85 hover:opacity-100'
                    }`}
                  >
                    <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* STEP 2: NAMES, COLOR/VARIETY & CATEGORY */}
        <section className="space-y-3.5">
          <div className={`grid gap-3 ${isAdminSimpleView ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={`block font-bold text-[#142318] ${isAdminSimpleView ? 'text-base' : 'text-xs'}`}>
                  ২. গাছের বাংলা নাম *
                </label>
                {formNameBn.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      setImageSearchQuery(formNameBn.trim());
                      onSearchPlantImages(formNameBn.trim());
                    }}
                    className="text-xs text-[#1B8354] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Search className="w-3 h-3" />
                    <span>ছবি খুঁজুন</span>
                  </button>
                )}
              </div>
              <input
                type="text"
                required
                value={formNameBn}
                onChange={(e) => setFormNameBn(e.target.value)}
                placeholder="যেমন: রক্তজবা, কাগজি লেবু, আম্রপালী"
                className={`w-full px-3 border border-[#D5C9B8] rounded-xl focus:outline-none focus:border-[#1B8354] ${
                  isAdminSimpleView ? 'h-13 text-lg font-semibold' : 'h-10 text-sm'
                }`}
              />
            </div>

            {!isAdminSimpleView && (
              <div>
                <label className="block text-xs font-bold text-[#142318] mb-1">
                  ইংরেজি নাম (English Name)
                </label>
                <input
                  type="text"
                  value={formNameEn}
                  onChange={(e) => setFormNameEn(e.target.value)}
                  placeholder="e.g. Red Hibiscus, Lemon"
                  className="w-full h-10 px-3 border border-[#D5C9B8] rounded-xl text-sm focus:outline-none focus:border-[#1B8354]"
                />
              </div>
            )}
          </div>

          <div className="p-3.5 bg-[#FAF8F5] border border-[#E8E1D5] rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <label className={`font-bold text-[#142318] flex items-center gap-1.5 ${isAdminSimpleView ? 'text-base' : 'text-xs'}`}>
                <Palette className="w-4 h-4 text-[#B34728]" />
                <span>রং বা বিশেষ জাত (ঐচ্ছিক)</span>
              </label>
              {!isAdminSimpleView && (
                <span className="text-[10px] text-[#785942]">একই গাছের ভিন্ন কালার আলাদা করবে</span>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {PRESET_COLORS.map((clr) => (
                <button
                  key={clr.labelBn}
                  type="button"
                  onClick={() => setFormColorBn(clr.labelBn)}
                  className={`px-3 rounded-lg font-bold transition-colors cursor-pointer ${
                    isAdminSimpleView ? 'h-10 text-sm' : 'h-7 text-xs'
                  } ${
                    formColorBn === clr.labelBn
                      ? 'bg-[#142318] text-white'
                      : 'bg-white border border-[#D5C9B8] text-[#526356] hover:text-[#142318]'
                  }`}
                >
                  {clr.labelBn}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={formColorBn}
              onChange={(e) => setFormColorBn(e.target.value)}
              placeholder="অথবা নিজের মতো লিখুন: যেমন: হলুদ, গোলাপি, কাটিমন বারোমাসি"
              className={`w-full px-3 border border-[#D5C9B8] rounded-xl bg-white focus:outline-none focus:border-[#1B8354] ${
                isAdminSimpleView ? 'h-12 text-base' : 'h-9 text-xs'
              }`}
            />
          </div>

          <div className={`grid gap-3 ${isAdminSimpleView ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
            <div>
              <label className={`block font-bold text-[#142318] mb-1 ${isAdminSimpleView ? 'text-base' : 'text-xs'}`}>
                বিভাগ (Category)
              </label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value as PlantCategory)}
                className={`w-full px-3 border border-[#D5C9B8] rounded-xl bg-white focus:outline-none focus:border-[#1B8354] ${
                  isAdminSimpleView ? 'h-13 text-base font-semibold' : 'h-10 text-xs'
                }`}
              >
                {ADMIN_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {!isAdminSimpleView && (
              <div>
                <label className="block text-xs font-bold text-[#142318] mb-1">
                  বোটানিক্যাল নাম (Latin)
                </label>
                <input
                  type="text"
                  value={formBotanical}
                  onChange={(e) => setFormBotanical(e.target.value)}
                  placeholder="যেমন: Hibiscus rosa-sinensis"
                  className="w-full h-10 px-3 border border-[#D5C9B8] rounded-xl text-sm focus:outline-none focus:border-[#1B8354]"
                />
              </div>
            )}
          </div>
        </section>

        {/* STEP 3: MANUAL PRICE INPUTS & POT VARIANTS */}
        <section className="p-4 bg-[#FFFBF5] border border-[#EADBCC] rounded-2xl space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-1">
            <label className={`font-bold text-[#142318] flex items-center gap-1.5 ${isAdminSimpleView ? 'text-base' : 'text-xs'}`}>
              <DollarSign className="w-4 h-4 text-[#B34728]" />
              <span>৩. বিক্রয়মূল্য ও পাত্রের ধরন (₹)</span>
            </label>
            <span className={isAdminSimpleView ? 'text-xs text-[#785942]' : 'text-[10px] text-[#785942]'}>
              নিজের ইচ্ছেমতো দাম টাইপ করুন অথবা +/- বোতামে বাড়ান বা কমান
            </span>
          </div>

          <div className="space-y-3 pt-1">
            <div className="space-y-1.5">
              <div className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-7 sm:col-span-8">
                  <span className="block text-[11px] font-semibold text-[#785942]">ছোট / গ্রো-ব্যাগ চারা:</span>
                  <input
                    type="text"
                    value={option1Label}
                    onChange={(e) => setOption1Label(e.target.value)}
                    placeholder="পলি গ্রো-ব্যাগ চারা"
                    className={`w-full px-3 border border-[#D5C9B8] rounded-xl bg-white ${
                      isAdminSimpleView ? 'h-12 text-sm' : 'h-10 text-xs'
                    }`}
                  />
                </div>
                <div className="col-span-5 sm:col-span-4">
                  <span className="block text-[11px] font-semibold text-[#785942]">দাম (₹):</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={option1Price}
                    onChange={(e) => {
                      setOption1Price(e.target.value);
                      setBasePrice(e.target.value);
                    }}
                    placeholder="যেমন: 50"
                    className={`w-full px-3 border border-[#D5C9B8] rounded-xl font-bold font-mono tabular-nums text-[#B34728] bg-white ${
                      isAdminSimpleView ? 'h-12 text-lg' : 'h-10 text-sm'
                    }`}
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-1.5">
                {[-10, -5, 5, 10].map((delta) => (
                  <button
                    key={delta}
                    type="button"
                    onClick={() => {
                      const cur = parseFloat(option1Price) || 0;
                      const next = Math.max(1, Math.round(cur + delta));
                      setOption1Price(next.toString());
                      setBasePrice(next.toString());
                    }}
                    className={`px-2.5 py-1 rounded-lg font-mono tabular-nums text-[11px] font-bold border cursor-pointer transition-colors ${
                      delta < 0
                        ? 'bg-[#FEF2F2] border-[#FECACA] text-[#B34728] hover:bg-[#FEE2E2]'
                        : 'bg-[#F0FDF4] border-[#86EFAC] text-[#166534] hover:bg-[#DCFCE7]'
                    }`}
                  >
                    {delta > 0 ? `+₹${delta}` : `-₹${Math.abs(delta)}`}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-[#F0E4D5]">
              <div className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-7 sm:col-span-8">
                  <span className="block text-[11px] font-semibold text-[#785942]">বড় / মাঝারি চারা:</span>
                  <input
                    type="text"
                    value={option2Label}
                    onChange={(e) => setOption2Label(e.target.value)}
                    placeholder="মাঝারি সাইজ পরিপুষ্ট চারা"
                    className={`w-full px-3 border border-[#D5C9B8] rounded-xl bg-white ${
                      isAdminSimpleView ? 'h-12 text-sm' : 'h-10 text-xs'
                    }`}
                  />
                </div>
                <div className="col-span-5 sm:col-span-4">
                  <span className="block text-[11px] font-semibold text-[#785942]">দাম (₹):</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={option2Price}
                    onChange={(e) => setOption2Price(e.target.value)}
                    placeholder="যেমন: 90"
                    className={`w-full px-3 border border-[#D5C9B8] rounded-xl font-bold font-mono tabular-nums text-[#B34728] bg-white ${
                      isAdminSimpleView ? 'h-12 text-lg' : 'h-10 text-sm'
                    }`}
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-1.5">
                {[-10, -5, 5, 10].map((delta) => (
                  <button
                    key={delta}
                    type="button"
                    onClick={() => {
                      const cur = parseFloat(option2Price) || 0;
                      const next = Math.max(1, Math.round(cur + delta));
                      setOption2Price(next.toString());
                    }}
                    className={`px-2.5 py-1 rounded-lg font-mono tabular-nums text-[11px] font-bold border cursor-pointer transition-colors ${
                      delta < 0
                        ? 'bg-[#FEF2F2] border-[#FECACA] text-[#B34728] hover:bg-[#FEE2E2]'
                        : 'bg-[#F0FDF4] border-[#86EFAC] text-[#166534] hover:bg-[#DCFCE7]'
                    }`}
                  >
                    {delta > 0 ? `+₹${delta}` : `-₹${Math.abs(delta)}`}
                  </button>
                ))}
              </div>
            </div>

            {!isAdminSimpleView && (
              <div className="pt-1">
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#142318] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasOption3}
                    onChange={(e) => setHasOption3(e.target.checked)}
                    className="rounded text-[#1B8354]"
                  />
                  <span>৩য় বড় / ফলবতী কলম বিকল্প যোগ করুন</span>
                </label>
                {hasOption3 && (
                  <div className="grid grid-cols-12 gap-2 items-center mt-2">
                    <div className="col-span-7 sm:col-span-8">
                      <input
                        type="text"
                        value={option3Label}
                        onChange={(e) => setOption3Label(e.target.value)}
                        placeholder="বড় ফলবতী কলম চারা"
                        className="w-full h-10 px-3 border border-[#D5C9B8] rounded-xl bg-white text-xs"
                      />
                    </div>
                    <div className="col-span-5 sm:col-span-4">
                      <input
                        type="number"
                        inputMode="numeric"
                        value={option3Price}
                        onChange={(e) => setOption3Price(e.target.value)}
                        placeholder="দাম ₹"
                        className="w-full h-10 px-3 border border-[#D5C9B8] rounded-xl font-bold font-mono tabular-nums text-[#B34728] bg-white text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* STEP 4: AI SMART AUTO-FILL + DESCRIPTION & CARE TIPS */}
        <section className="p-4 bg-[#FBF9F5] border border-[#E8E1D5] rounded-2xl space-y-3.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <label className={`font-bold text-[#142318] flex items-center gap-1.5 ${isAdminSimpleView ? 'text-base' : 'text-xs'}`}>
              <Tag className="w-4 h-4 text-[#1B8354]" />
              <span>৪. Gemini AI স্মার্ট অটো-ফিল, বিবরণ ও পরিচর্যা</span>
            </label>

            <div className="flex flex-wrap items-center gap-1.5">
              <select
                aria-label="Gemini AI Model Choice"
                value={modelType}
                onChange={(e) => setModelType(e.target.value as AiModelChoice)}
                className="h-8 px-2 bg-white border border-[#D5C9B8] rounded-lg text-[11px] font-bold text-[#142318]"
              >
                <option value="auto">Auto (Gemini Cascade)</option>
                <option value="flash25">Gemini 2.5 Flash</option>
                <option value="fast">Gemini 3.1 Flash Lite</option>
                <option value="hydrogen">Gemini 4 Hydrogen</option>
              </select>
            </div>
          </div>

          <input
            type="text"
            value={aiCustomInstruction}
            onChange={(e) => setAiCustomInstruction(e.target.value)}
            placeholder="AI-কে বিশেষ নির্দেশনা দিন (ঐচ্ছিক): যেমন — বড় গ্রো ব্যাগের কলম চারা, ছাদে ফল দেবে..."
            className={`w-full px-3 bg-white border border-[#D5C9B8] rounded-xl text-[#142318] ${
              isAdminSimpleView ? 'h-11 text-sm' : 'h-9 text-xs'
            }`}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              disabled={isAiAutofilling}
              onClick={() => onAiAutoFill(undefined, 'full')}
              className={`bg-[#1B8354] hover:bg-[#146c44] text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
                isAdminSimpleView ? 'h-12 text-sm px-4' : 'px-3.5 py-2 text-xs'
              }`}
            >
              {isAiAutofilling ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#A3E635]" />
              ) : (
                <Sparkles className="w-4 h-4 text-[#A3E635]" />
              )}
              <span>AI দিয়ে সব তথ্য অটো-ফিল করুন</span>
            </button>

            <button
              type="button"
              disabled={isAiAutofilling}
              onClick={() => onAiAutoFill(undefined, 'description_only')}
              className={`bg-[#142318] hover:bg-[#203425] text-white font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                isAdminSimpleView ? 'h-12 text-sm px-4' : 'px-3.5 py-2 text-xs'
              }`}
            >
              {isAiAutofilling ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#A3E635]" />
              ) : (
                <Edit2 className="w-3.5 h-3.5 text-[#A3E635]" />
              )}
              <span>শুধু ইউনিক বিবরণ লিখুন</span>
            </button>
          </div>

          <div>
            <label className={`block font-bold text-[#142318] mb-1 ${isAdminSimpleView ? 'text-sm' : 'text-[11px]'}`}>
              বাংলা বিবরণ ও বৈশিষ্ট্য
            </label>
            <textarea
              rows={3}
              value={formDescBn}
              onChange={(e) => setFormDescBn(e.target.value)}
              placeholder="এই গাছটির বৈশিষ্ট্য, ফলন/ফুল ও যত্নের কথা লিখুন..."
              className={`w-full p-3 bg-white border border-[#D5C9B8] rounded-xl focus:outline-none focus:border-[#1B8354] ${
                isAdminSimpleView ? 'text-base' : 'text-xs'
              }`}
            />
          </div>

          {isAdminSimpleView ? (
            <details className="bg-white border border-[#E8E1D5] rounded-xl p-3">
              <summary className="text-sm font-bold text-[#526356] cursor-pointer">
                আরও তথ্য ও যত্নের নিয়ম (ইংরেজি নাম, রোদ, জল — ঐচ্ছিক)
              </summary>
              <div className="grid grid-cols-1 gap-2.5 pt-3">
                <input
                  type="text"
                  value={formNameEn}
                  onChange={(e) => setFormNameEn(e.target.value)}
                  placeholder="ইংরেজি নাম (English Name)"
                  className="w-full h-11 px-3 bg-[#FAF8F5] border border-[#D5C9B8] rounded-xl text-sm"
                />
                <input
                  type="text"
                  value={formSunlightBn}
                  onChange={(e) => setFormSunlightBn(e.target.value)}
                  placeholder="রোদের চাহিদা"
                  className="w-full h-11 px-3 bg-[#FAF8F5] border border-[#D5C9B8] rounded-xl text-sm"
                />
                <input
                  type="text"
                  value={formWateringBn}
                  onChange={(e) => setFormWateringBn(e.target.value)}
                  placeholder="জল দেওয়ার নিয়ম"
                  className="w-full h-11 px-3 bg-[#FAF8F5] border border-[#D5C9B8] rounded-xl text-sm"
                />
                <input
                  type="text"
                  value={formSoilTipBn}
                  onChange={(e) => setFormSoilTipBn(e.target.value)}
                  placeholder="মাটি ও সার"
                  className="w-full h-11 px-3 bg-[#FAF8F5] border border-[#D5C9B8] rounded-xl text-sm"
                />
              </div>
            </details>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-[#142318] mb-1">
                    বিশেষ বৈশিষ্ট্য (Badge)
                  </label>
                  <input
                    type="text"
                    value={formBadgeBn}
                    onChange={(e) => setFormBadgeBn(e.target.value)}
                    placeholder="যেমন: বারোমাসি ফলন / ঘ্রাণযুক্ত ফুল"
                    className="w-full h-10 px-3 bg-white border border-[#D5C9B8] rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#142318] mb-1">
                    রোদ ও আলোর চাহিদা
                  </label>
                  <input
                    type="text"
                    value={formSunlightBn}
                    onChange={(e) => setFormSunlightBn(e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-[#D5C9B8] rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#142318] mb-1">
                    জল দেওয়ার নিয়ম
                  </label>
                  <input
                    type="text"
                    value={formWateringBn}
                    onChange={(e) => setFormWateringBn(e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-[#D5C9B8] rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#142318] mb-1">
                    মাটি ও সার পরামর্শ
                  </label>
                  <input
                    type="text"
                    value={formSoilTipBn}
                    onChange={(e) => setFormSoilTipBn(e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-[#D5C9B8] rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#142318] mb-1">
                  স্বতন্ত্র ইংরেজি বিবরণ (Unique English Description)
                </label>
                <textarea
                  rows={2}
                  value={formDescEn}
                  onChange={(e) => setFormDescEn(e.target.value)}
                  placeholder="Unique English description..."
                  className="w-full p-3 bg-white border border-[#D5C9B8] rounded-xl text-xs"
                />
              </div>
            </>
          )}
        </section>

        {/* Bottom Form Undo/Redo + Primary Save Bar */}
        <div className="space-y-2.5">
          {(formUndoCount > 0 || formRedoCount > 0) && (
            <div className="flex items-center justify-between gap-2 p-2.5 bg-[#FAF8F5] border border-[#E8E1D5] rounded-xl text-xs">
              <span className="text-[#526356] font-medium truncate">
                {lastFormUndoLabelBn ? `ফর্ম পরিবর্তন: ${lastFormUndoLabelBn}` : 'ফর্ম আনডু/রিডু প্রস্তুত'}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  disabled={formUndoCount === 0}
                  onClick={onFormUndo}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#F3ECE2] disabled:opacity-40 border border-[#D5C9B8] text-[#142318] font-bold cursor-pointer"
                >
                  <Undo2 className="w-3.5 h-3.5 text-[#1B8354]" />
                  <span>আনডু ({formUndoCount})</span>
                </button>
                <button
                  type="button"
                  disabled={formRedoCount === 0}
                  onClick={onFormRedo}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#F3ECE2] disabled:opacity-40 border border-[#D5C9B8] text-[#142318] font-bold cursor-pointer"
                >
                  <Redo2 className="w-3.5 h-3.5 text-[#1B8354]" />
                  <span>রিডু ({formRedoCount})</span>
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={Boolean(duplicateCheck && duplicateCheck.type === 'exact_duplicate')}
            className={`w-full text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
              isAdminSimpleView ? 'h-14 text-lg' : 'h-12 text-sm'
            } ${
              duplicateCheck && duplicateCheck.type === 'exact_duplicate'
                ? 'bg-gray-400 cursor-not-allowed opacity-60'
                : 'bg-[#1B8354] hover:bg-[#146c44] cursor-pointer'
            }`}
          >
            <Check className="w-5 h-5" />
            <span>
              {duplicateCheck && duplicateCheck.type === 'exact_duplicate'
                ? 'একই চারা বিদ্যমান — ভিন্ন রং বা জাত বাছুন'
                : 'সংরক্ষণ করুন ও ওয়েবসাইটে দেখান'}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}

