import { BrahmyamanPlant, PlantCategory, AudienceTag } from '../types/nursery';

export type AdminUndoRecord =
  | {
      id: string;
      timestampBn: string;
      type: 'plant_add';
      labelBn: string;
      plant: BrahmyamanPlant;
    }
  | {
      id: string;
      timestampBn: string;
      type: 'plant_update';
      labelBn: string;
      before: BrahmyamanPlant;
      after: BrahmyamanPlant;
    }
  | {
      id: string;
      timestampBn: string;
      type: 'batch_plant_update';
      labelBn: string;
      beforeList: BrahmyamanPlant[];
      afterList: BrahmyamanPlant[];
    }
  | {
      id: string;
      timestampBn: string;
      type: 'soft_delete';
      labelBn: string;
      plant: BrahmyamanPlant;
    }
  | {
      id: string;
      timestampBn: string;
      type: 'restore_plant';
      labelBn: string;
      plant: BrahmyamanPlant;
    };

export interface PlantFormDraftSnapshot {
  labelBn: string;
  timestampBn: string;
  editingPlantId: string | null;
  formNameBn: string;
  formNameEn: string;
  formBotanical: string;
  formCategory: PlantCategory;
  formAudience: AudienceTag[];
  formBadgeBn: string;
  formColorBn: string;
  formSunlightBn: string;
  formWateringBn: string;
  formSoilTipBn: string;
  formDescBn: string;
  formDescEn: string;
  formImage: string;
  formImages: string[];
  formCloudinaryPublicIds: string[];
  activeImageSlot: number;
  basePrice: string;
  option1Label: string;
  option1Price: string;
  option2Label: string;
  option2Price: string;
  hasOption3: boolean;
  option3Label: string;
  option3Price: string;
}

const STORAGE_GLOBAL_UNDO_STACK = 'brahmyaman_admin_undo_stack_v1';
const STORAGE_GLOBAL_REDO_STACK = 'brahmyaman_admin_redo_stack_v1';
const STORAGE_FORM_UNDO_STACK = 'brahmyaman_admin_form_undo_stack_v1';
const STORAGE_FORM_REDO_STACK = 'brahmyaman_admin_form_redo_stack_v1';

export const MAX_GLOBAL_HISTORY = 20;
export const MAX_FORM_HISTORY = 15;

function compactPlantForStorage(plant: BrahmyamanPlant): BrahmyamanPlant {
  const compactUrl = (u?: string) =>
    typeof u === 'string' && u.startsWith('data:image/') && u.length > 180_000
      ? u.slice(0, 180_000)
      : u || '';
  return {
    ...plant,
    image: compactUrl(plant.image),
    images: Array.isArray(plant.images) ? plant.images.map((img) => compactUrl(img)) : undefined,
  };
}

function compactUndoRecordForStorage(record: AdminUndoRecord): AdminUndoRecord {
  if (record.type === 'plant_add' || record.type === 'soft_delete' || record.type === 'restore_plant') {
    return {
      ...record,
      plant: compactPlantForStorage(record.plant),
    };
  }
  if (record.type === 'plant_update') {
    return {
      ...record,
      before: compactPlantForStorage(record.before),
      after: compactPlantForStorage(record.after),
    };
  }
  return {
    ...record,
    beforeList: record.beforeList.map(compactPlantForStorage),
    afterList: record.afterList.map(compactPlantForStorage),
  };
}

export function loadGlobalUndoStack(): AdminUndoRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_GLOBAL_UNDO_STACK);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(-MAX_GLOBAL_HISTORY) : [];
  } catch {
    return [];
  }
}

export function loadGlobalRedoStack(): AdminUndoRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_GLOBAL_REDO_STACK);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(-MAX_GLOBAL_HISTORY) : [];
  } catch {
    return [];
  }
}

export function saveGlobalUndoRedoStacks(
  undoStack: AdminUndoRecord[],
  redoStack: AdminUndoRecord[]
): void {
  try {
    const trimmedUndo = undoStack.slice(-MAX_GLOBAL_HISTORY);
    const trimmedRedo = redoStack.slice(-MAX_GLOBAL_HISTORY);
    localStorage.setItem(STORAGE_GLOBAL_UNDO_STACK, JSON.stringify(trimmedUndo));
    localStorage.setItem(STORAGE_GLOBAL_REDO_STACK, JSON.stringify(trimmedRedo));
  } catch {
    try {
      const compactUndo = undoStack.slice(-10).map(compactUndoRecordForStorage);
      const compactRedo = redoStack.slice(-10).map(compactUndoRecordForStorage);
      localStorage.setItem(STORAGE_GLOBAL_UNDO_STACK, JSON.stringify(compactUndo));
      localStorage.setItem(STORAGE_GLOBAL_REDO_STACK, JSON.stringify(compactRedo));
    } catch {
      // Ignore storage quota errors
    }
  }
}

export function loadFormUndoStack(): PlantFormDraftSnapshot[] {
  try {
    const raw = localStorage.getItem(STORAGE_FORM_UNDO_STACK);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(-MAX_FORM_HISTORY) : [];
  } catch {
    return [];
  }
}

export function loadFormRedoStack(): PlantFormDraftSnapshot[] {
  try {
    const raw = localStorage.getItem(STORAGE_FORM_REDO_STACK);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(-MAX_FORM_HISTORY) : [];
  } catch {
    return [];
  }
}

export function saveFormUndoRedoStacks(
  undoStack: PlantFormDraftSnapshot[],
  redoStack: PlantFormDraftSnapshot[]
): void {
  try {
    localStorage.setItem(
      STORAGE_FORM_UNDO_STACK,
      JSON.stringify(undoStack.slice(-MAX_FORM_HISTORY))
    );
    localStorage.setItem(
      STORAGE_FORM_REDO_STACK,
      JSON.stringify(redoStack.slice(-MAX_FORM_HISTORY))
    );
  } catch {
    try {
      const stripDataUrl = (snap: PlantFormDraftSnapshot): PlantFormDraftSnapshot => ({
        ...snap,
        formImage: snap.formImage.startsWith('data:image/') ? '' : snap.formImage,
        formImages: snap.formImages.map((u) => (u.startsWith('data:image/') ? '' : u)),
      });
      localStorage.setItem(
        STORAGE_FORM_UNDO_STACK,
        JSON.stringify(undoStack.slice(-8).map(stripDataUrl))
      );
      localStorage.setItem(
        STORAGE_FORM_REDO_STACK,
        JSON.stringify(redoStack.slice(-8).map(stripDataUrl))
      );
    } catch {}
  }
}
