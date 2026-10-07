import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import {
  DEFAULT_LAYOUT,
  moveWidget,
  nextSize,
  normalizeLayout,
  toggleWidget,
  type TodayLayout,
  type TodayWidgetId,
} from "@/lib/today/layout";

interface TodayState {
  layout: TodayLayout;
  move: (active: TodayWidgetId, over: TodayWidgetId) => void;
  toggle: (id: TodayWidgetId) => void;
  resize: (id: TodayWidgetId) => void;
  reset: () => void;
}

/** Fase 3a: de indeling van Vandaag, lokaal bewaard. */
export const useToday = create<TodayState>()(
  persist(
    (set) => ({
      layout: DEFAULT_LAYOUT,
      move: (active, over) => set((s) => ({ layout: moveWidget(s.layout, active, over) })),
      toggle: (id) => set((s) => ({ layout: toggleWidget(s.layout, id) })),
      resize: (id) => set((s) => ({ layout: nextSize(s.layout, id) })),
      reset: () => set({ layout: DEFAULT_LAYOUT }),
    }),
    {
      name: STORAGE_KEYS.today,
      // Versie 2: de geschrapte laadbalk en zijn feestvlag gaan ook uit de opslag.
      version: 2,
      migrate: (persisted) => ({
        layout: normalizeLayout((persisted as Partial<Pick<TodayState, "layout">> | null)?.layout),
      }),
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ layout: s.layout }),
      // normalizeLayout ruimt ook oude, geschrapte widgets op (zoals de laadbalk).
      merge: (persisted, current) => ({
        ...current,
        layout: normalizeLayout((persisted as Partial<Pick<TodayState, "layout">> | null)?.layout),
      }),
    },
  ),
);
