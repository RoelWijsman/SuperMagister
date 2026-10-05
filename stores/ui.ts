import { create } from "zustand";
import type { TimeOfDay } from "@/lib/theme/time-of-day";

/** Vluchtige UI-state: wat open staat en wat even aan staat. Niet bewaard. */
interface UiState {
  paletteOpen: boolean;
  shortcutsOpen: boolean;
  moreOpen: boolean;
  privacy: boolean;
  /** Voorvertoning van een tijd van de dag (instellingen); `null` = echte klok. */
  timeOfDayPreview: TimeOfDay | null;
  setPaletteOpen: (open: boolean) => void;
  togglePalette: () => void;
  setShortcutsOpen: (open: boolean) => void;
  setMoreOpen: (open: boolean) => void;
  setPrivacy: (on: boolean) => void;
  togglePrivacy: () => void;
  setTimeOfDayPreview: (value: TimeOfDay | null) => void;
}

export const useUi = create<UiState>()((set) => ({
  paletteOpen: false,
  shortcutsOpen: false,
  moreOpen: false,
  privacy: false,
  timeOfDayPreview: null,
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
  togglePalette: () => set((s) => ({ paletteOpen: !s.paletteOpen })),
  setShortcutsOpen: (shortcutsOpen) => set({ shortcutsOpen }),
  setMoreOpen: (moreOpen) => set({ moreOpen }),
  setPrivacy: (privacy) => set({ privacy }),
  togglePrivacy: () => set((s) => ({ privacy: !s.privacy })),
  setTimeOfDayPreview: (timeOfDayPreview) => set({ timeOfDayPreview }),
}));
