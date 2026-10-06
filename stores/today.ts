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
import type { ISODate } from "@/lib/types";

interface TodayState {
  layout: TodayLayout;
  /** Op welke dag de laadbalk al "Download voltooid" vierde (één keer per dag). */
  celebrated: ISODate | null;
  move: (active: TodayWidgetId, over: TodayWidgetId) => void;
  toggle: (id: TodayWidgetId) => void;
  resize: (id: TodayWidgetId) => void;
  reset: () => void;
  celebrate: (day: ISODate) => void;
}

/** Fase 3a: de indeling van Vandaag, lokaal bewaard. */
export const useToday = create<TodayState>()(
  persist(
    (set) => ({
      layout: DEFAULT_LAYOUT,
      celebrated: null,
      move: (active, over) => set((s) => ({ layout: moveWidget(s.layout, active, over) })),
      toggle: (id) => set((s) => ({ layout: toggleWidget(s.layout, id) })),
      resize: (id) => set((s) => ({ layout: nextSize(s.layout, id) })),
      reset: () => set({ layout: DEFAULT_LAYOUT }),
      celebrate: (day) => set({ celebrated: day }),
    }),
    {
      name: STORAGE_KEYS.today,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ layout: s.layout, celebrated: s.celebrated }),
      merge: (persisted, current) => {
        const value = (persisted ?? {}) as Partial<Pick<TodayState, "layout" | "celebrated">>;
        return {
          ...current,
          layout: normalizeLayout(value.layout),
          celebrated: typeof value.celebrated === "string" ? value.celebrated : null,
        };
      },
    },
  ),
);
