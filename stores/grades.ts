import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { NORM_PRESETS, type NormPresetId, type PromotionNorms } from "@/lib/calc/promotion";
import { withoutSources } from "@/lib/sources";
import { STORAGE_KEYS } from "@/lib/storage-keys";

export type GradesTab = "vakken" | "ranglijst" | "periodes" | "tijdlijn" | "examen";

interface GradesState {
  /** null = automatisch: de slaag-zakregeling in een examenklas, anders "Veelvoorkomend". */
  presetId: NormPresetId | null;
  /** Eigen aanpassingen op de gekozen normen (null = precies de preset). */
  custom: PromotionNorms | null;
  /** Vakken in het combinatiecijfer, per databron (ontbreekt = het voorstel van de app). */
  combination: Record<string, string[]>;
  tab: GradesTab;
  setPreset: (presetId: NormPresetId) => void;
  setNorm: <K extends keyof PromotionNorms>(
    base: PromotionNorms,
    key: K,
    value: PromotionNorms[K],
  ) => void;
  resetNorms: () => void;
  setCombination: (sourceId: string, subjectIds: string[]) => void;
  setTab: (tab: GradesTab) => void;
  /** Ontkoppelen: alles van deze databronnen vergeten. */
  forgetSources: (match: (sourceId: string) => boolean) => void;
}

/** Welke normen gelden er nu? */
export function activeNorms(
  state: Pick<GradesState, "presetId" | "custom">,
  isExamYear: boolean,
): { presetId: NormPresetId; norms: PromotionNorms; isCustom: boolean } {
  const presetId = state.presetId ?? (isExamYear ? "examen" : "standaard");
  return {
    presetId,
    norms: state.custom ?? NORM_PRESETS[presetId].norms,
    isCustom: state.custom !== null,
  };
}

/** Fase 4: jouw overgangsnormen, combinatiecijfer en het gekozen tabblad bij Cijfers. */
export const useGradesStore = create<GradesState>()(
  persist(
    (set) => ({
      presetId: null,
      custom: null,
      combination: {},
      tab: "vakken",
      setPreset: (presetId) => set({ presetId, custom: null }),
      setNorm: (base, key, value) => set({ custom: { ...base, [key]: value } }),
      resetNorms: () => set({ custom: null }),
      setCombination: (sourceId, subjectIds) =>
        set((state) => ({ combination: { ...state.combination, [sourceId]: subjectIds } })),
      setTab: (tab) => set({ tab }),
      forgetSources: (match) =>
        set((state) => ({ combination: withoutSources(state.combination, match) })),
    }),
    {
      name: STORAGE_KEYS.grades,
      version: 1,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
