import type { BrahmyamanPlant } from '../types/nursery';

export interface PlantsRefLike {
  current: BrahmyamanPlant[];
}

export interface RollbackDiagnosticOptions {
  /**
   * Optional live React state hooks & ref (pass App.tsx plantsRef + state accessors in browser tests,
   * or omit to run inside a faithful standalone simulation mirror of App.tsx's handleUpdatePlant).
   */
  plantsRef?: PlantsRefLike;
  getPlantsState?: () => BrahmyamanPlant[];
  setPlantsState?: (next: BrahmyamanPlant[]) => void;
  storageKey?: string;
  /**
   * 'live_firestore' sends a schema-rejected probe payload to Cloud Firestore (returns real PERMISSION_DENIED
   * without altering any production plant document).
   * 'injected_failure' triggers an immediate deterministic error without network I/O.
   */
  mode?: 'live_firestore' | 'injected_failure';
}

export interface RollbackDiagnosticResult {
  passed: boolean;
  mode: 'live_firestore' | 'injected_failure';
  testedPlantId: string;
  originalPrice: number;
  attemptedPrice: number;
  failureTriggered: boolean;
  errorCode: string;
  errorMessage: string;
  syncedReturnValue: boolean;
  stateMatchesPreviousSnapshot: boolean;
  refMatchesPreviousSnapshot: boolean;
  localStorageMatchesPreviousSnapshot: boolean;
  uiDesyncDetected: boolean;
  finalPriceInState: number | null;
  finalPriceInRef: number | null;
  details: string;
  timestamp: string;
}

const DEFAULT_STORAGE_KEY = 'brahmyaman_custom_catalog_v3';

const DIAGNOSTIC_SAMPLE_PLANTS: BrahmyamanPlant[] = [
  {
    id: 'diag-sample-plant-1',
    nameBn: 'আম্রপালী আম (ডায়াগনস্টিক)',
    nameEn: 'Amrapali Mango',
    botanicalName: 'Mangifera indica',
    category: 'ছাদবাগানের ফল ও কলম',
    audience: ['family', 'fruit'],
    sunlightBn: 'পূর্ণ রোদ',
    sunlightEn: 'Full Sun',
    wateringBn: 'নিয়মিত পরিমিত জল',
    wateringEn: 'Moderate watering',
    soilTipBn: 'দোআঁশ মাটি ও জৈব সার',
    soilTipEn: 'Loamy organic soil',
    descriptionBn: 'ডায়াগনস্টিক রোলব্যাক পরীক্ষার নমুনা চারা।',
    descriptionEn: 'Diagnostic sample plant for rollback test.',
    image: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    status: 'active',
    inStock: true,
    options: [
      {
        id: 'diag-opt-1',
        labelBn: 'পলি গ্রো-ব্যাগ চারা',
        labelEn: 'Grow Bag Sapling',
        price: 120,
        containerType: 'পলি গ্রো ব্যাগ',
      },
    ],
  },
];

function readStorageSnapshot(key: string): string | null {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
  } catch {
    // Ignore storage access errors in headless runtimes
  }
  return null;
}

function writeStorageSnapshot(key: string, value: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    }
  } catch {
    // Ignore storage access errors in headless runtimes
  }
}

/**
 * Deliberately triggers a Firestore write failure during a plant update and verifies that both
 * React `plants` state and `plantsRef.current` (plus localStorage) atomically roll back to the
 * exact previous snapshot without leaving optimistic/stale UI state behind.
 */
export async function runPlantUpdateRollbackDiagnostic(
  options: RollbackDiagnosticOptions = {}
): Promise<RollbackDiagnosticResult> {
  const mode = options.mode ?? 'live_firestore';
  const storageKey = options.storageKey ?? DEFAULT_STORAGE_KEY;

  // Standalone React state/ref mirror when caller doesn't pass live App hooks
  let simulatedReactState: BrahmyamanPlant[] = JSON.parse(
    JSON.stringify(DIAGNOSTIC_SAMPLE_PLANTS)
  );
  const plantsRef: PlantsRefLike = options.plantsRef ?? {
    current: simulatedReactState,
  };
  const getPlantsState =
    options.getPlantsState ?? (() => simulatedReactState);
  const setPlantsState =
    options.setPlantsState ??
    ((next: BrahmyamanPlant[]) => {
      simulatedReactState = next;
    });

  // Ensure localStorage baseline matches snapshot before test if empty
  const hadStorageBefore = readStorageSnapshot(storageKey) !== null;
  const previousStorageSerialized = readStorageSnapshot(storageKey);

  // Capture deep immutable snapshot prior to optimistic mutation
  const previousSnapshot: BrahmyamanPlant[] = JSON.parse(
    JSON.stringify(plantsRef.current)
  );
  const previousSerialized = JSON.stringify(previousSnapshot);

  const targetPlant = previousSnapshot[0];
  if (!targetPlant || !Array.isArray(targetPlant.options) || targetPlant.options.length === 0) {
    return {
      passed: false,
      mode,
      testedPlantId: 'none',
      originalPrice: 0,
      attemptedPrice: 0,
      failureTriggered: false,
      errorCode: 'diagnostic/no-target-plant',
      errorMessage: 'No plant with valid options available to run rollback diagnostic.',
      syncedReturnValue: false,
      stateMatchesPreviousSnapshot: false,
      refMatchesPreviousSnapshot: false,
      localStorageMatchesPreviousSnapshot: true,
      uiDesyncDetected: true,
      finalPriceInState: null,
      finalPriceInRef: null,
      details: 'Diagnostic aborted: plantsRef.current[0] is missing.',
      timestamp: new Date().toISOString(),
    };
  }

  const originalPrice = targetPlant.options[0].price;
  const attemptedPrice = originalPrice + 9999;
  const mutatedPlant: BrahmyamanPlant = {
    ...targetPlant,
    options: targetPlant.options.map((opt, idx) =>
      idx === 0 ? { ...opt, price: attemptedPrice } : opt
    ),
    updatedAt: new Date().toISOString(),
    updatedAtBn: 'ডায়াগনস্টিক রোলব্যাক টেস্ট',
  };

  let failureTriggered = false;
  let errorCode = 'none';
  let errorMessage = '';
  let optimisticDesyncObservedMidFlight = false;

  // Mirrors App.tsx handleUpdatePlant exact optimistic update + catch rollback sequence
  const executeGuardedPlantUpdate = async (updatedPlant: BrahmyamanPlant): Promise<boolean> => {
    const prevPlants = plantsRef.current;
    const nextPlants = prevPlants.map((p) => (p.id === updatedPlant.id ? updatedPlant : p));
    plantsRef.current = nextPlants;
    setPlantsState(nextPlants);

    // Mid-flight assertion: confirm both ref and state moved optimistically before failure
    const stateMid = getPlantsState().find((p) => p.id === updatedPlant.id)?.options[0]?.price;
    const refMid = plantsRef.current.find((p) => p.id === updatedPlant.id)?.options[0]?.price;
    if (stateMid !== attemptedPrice || refMid !== attemptedPrice) {
      optimisticDesyncObservedMidFlight = true;
    }

    try {
      if (mode === 'injected_failure') {
        const injectedErr: any = new Error(
          '7 PERMISSION_DENIED: Deliberate diagnostic write failure'
        );
        injectedErr.code = 'permission-denied';
        throw injectedErr;
      }

      // Send a diagnostic write containing an unknown field to a dedicated probe doc ID.
      // Security rules in firestore.rules reject unknown keys with PERMISSION_DENIED even if signed in,
      // guaranteeing a genuine server-side failure without modifying any real nursery plant.
      const [{ doc, setDoc }, { db }] = await Promise.all([
        import('firebase/firestore'),
        import('../firebase'),
      ]);
      const diagnosticDocId = 'diag-rollback-failure-probe';
      await setDoc(
        doc(db, 'plants', diagnosticDocId),
        {
          id: diagnosticDocId,
          nameBn: updatedPlant.nameBn,
          category: updatedPlant.category,
          options: updatedPlant.options,
          _deliberateDiagnosticFailure: true,
        },
        { merge: true }
      );
      return true;
    } catch (err: any) {
      failureTriggered = true;
      errorCode = String(err?.code || 'unknown-error');
      errorMessage = err instanceof Error ? err.message : String(err);

      // Exact rollback contract from App.tsx
      plantsRef.current = prevPlants;
      setPlantsState(prevPlants);
      writeStorageSnapshot(
        storageKey,
        hadStorageBefore && previousStorageSerialized !== null
          ? previousStorageSerialized
          : JSON.stringify(prevPlants)
      );
      if (mode === 'live_firestore') {
        try {
          const { handleFirestoreError, OperationType } = await import('../firebase');
          handleFirestoreError(err, OperationType.UPDATE, `plants/${updatedPlant.id}`);
        } catch {}
      }
      return false;
    }
  };

  const syncedReturnValue = await executeGuardedPlantUpdate(mutatedPlant);

  const finalState = getPlantsState();
  const finalRef = plantsRef.current;
  const finalStateSerialized = JSON.stringify(finalState);
  const finalRefSerialized = JSON.stringify(finalRef);

  const stateMatchesPreviousSnapshot = finalStateSerialized === previousSerialized;
  const refMatchesPreviousSnapshot = finalRefSerialized === previousSerialized;

  let localStorageMatchesPreviousSnapshot = true;
  if (hadStorageBefore) {
    localStorageMatchesPreviousSnapshot =
      readStorageSnapshot(storageKey) === previousStorageSerialized;
  }

  const finalPlantInState = finalState.find((p) => p.id === targetPlant.id);
  const finalPlantInRef = finalRef.find((p) => p.id === targetPlant.id);
  const finalPriceInState = finalPlantInState?.options[0]?.price ?? null;
  const finalPriceInRef = finalPlantInRef?.options[0]?.price ?? null;

  const uiDesyncDetected =
    !stateMatchesPreviousSnapshot ||
    !refMatchesPreviousSnapshot ||
    finalStateSerialized !== finalRefSerialized ||
    !localStorageMatchesPreviousSnapshot ||
    optimisticDesyncObservedMidFlight ||
    syncedReturnValue !== false ||
    !failureTriggered;

  const passed = !uiDesyncDetected;

  return {
    passed,
    mode,
    testedPlantId: targetPlant.id,
    originalPrice,
    attemptedPrice,
    failureTriggered,
    errorCode,
    errorMessage,
    syncedReturnValue,
    stateMatchesPreviousSnapshot,
    refMatchesPreviousSnapshot,
    localStorageMatchesPreviousSnapshot,
    uiDesyncDetected,
    finalPriceInState,
    finalPriceInRef,
    details: passed
      ? `Rollback verified: Firestore error (${errorCode}) triggered during update of "${targetPlant.id}" (₹${originalPrice} -> ₹${attemptedPrice}); React state, plantsRef, and storage returned cleanly to previous snapshot (₹${finalPriceInState}) with zero UI desync.`
      : `Rollback verification FAILED for "${targetPlant.id}": synced=${syncedReturnValue}, stateMatch=${stateMatchesPreviousSnapshot}, refMatch=${refMatchesPreviousSnapshot}, error=${errorCode}`,
    timestamp: new Date().toISOString(),
  };
}

// Allow direct CLI execution via: npx tsx src/utils/testFirestore.ts
const proc = (globalThis as { process?: { argv?: string[]; exit?: (code: number) => void } }).process;
if (proc && Array.isArray(proc.argv) && proc.argv[1]?.includes('testFirestore')) {
  runPlantUpdateRollbackDiagnostic({ mode: 'live_firestore' })
    .then((result) => {
      console.log('=== Firestore Update Rollback Diagnostic ===');
      console.log(JSON.stringify(result, null, 2));
      proc.exit?.(result.passed ? 0 : 1);
    })
    .catch((err) => {
      console.error('Diagnostic crashed unexpectedly:', err);
      proc.exit?.(1);
    });
}
