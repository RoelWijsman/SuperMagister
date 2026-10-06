import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { normalizeHex } from "@/lib/color";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import type { SubjectIconName } from "@/lib/subjects/icons";
import { customThemeVars, DEFAULT_THEME, type ThemeId } from "@/lib/theme/themes";

export type ColorMode = "dark" | "light" | "system";
export type MotionPreference = "system" | "reduced" | "full";
export type WalkoutSpeed = "normaal" | "snel" | "direct";

export interface SettingsValues {
  theme: ThemeId;
  customAccent: string;
  /** Afgeleide CSS-variabelen van het eigen thema; ook gelezen door het inline-script. */
  customVars: Record<string, string> | null;
  colorMode: ColorMode;
  /** Achtergrond kleurt mee met ochtend, dag, avond en nacht. */
  skyFollowsTime: boolean;
  /** Langzaam bewegende aurora. */
  ambientMotion: boolean;
  motion: MotionPreference;
  /** Privacymodus staat bij het openen al aan. */
  privacyAuto: boolean;
  /** Globale mute: geen enkel geluid. */
  soundMuted: boolean;
  uiSounds: boolean;
  walkoutSounds: boolean;
  haptics: boolean;
  walkoutSpeed: WalkoutSpeed;
  /** Na een kaart vanzelf door naar de volgende. */
  walkoutAuto: boolean;
  /** Feature A: vóór elke kaart eerst je cijfer gokken. */
  guessEnabled: boolean;
  /** Eigen vakkleur (paletindex) per vak-id. */
  subjectColors: Record<string, number>;
  subjectIcons: Record<string, SubjectIconName>;
}

interface SettingsActions {
  setTheme: (theme: ThemeId) => void;
  setCustomAccent: (hex: string) => void;
  setColorMode: (mode: ColorMode) => void;
  setMotion: (motion: MotionPreference) => void;
  set: <K extends keyof SettingsValues>(key: K, value: SettingsValues[K]) => void;
  setSubjectColor: (subjectId: string, paletteIndex: number | null) => void;
  setSubjectIcon: (subjectId: string, icon: SubjectIconName | null) => void;
  resetAppearance: () => void;
}

export const DEFAULT_SETTINGS: SettingsValues = {
  theme: DEFAULT_THEME,
  customAccent: "#ff5c93",
  customVars: null,
  colorMode: "dark",
  skyFollowsTime: true,
  ambientMotion: true,
  motion: "system",
  privacyAuto: false,
  soundMuted: false,
  uiSounds: false,
  walkoutSounds: true,
  haptics: true,
  walkoutSpeed: "normaal",
  walkoutAuto: false,
  guessEnabled: true,
  subjectColors: {},
  subjectIcons: {},
};

export const useSettings = create<SettingsValues & SettingsActions>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      setTheme: (theme) =>
        set((state) => ({
          theme,
          customVars:
            theme === "custom"
              ? (state.customVars ?? customThemeVars(state.customAccent))
              : state.customVars,
        })),
      setCustomAccent: (hex) => {
        const accent = normalizeHex(hex);
        if (!accent) return;
        set({ theme: "custom", customAccent: accent, customVars: customThemeVars(accent) });
      },
      setColorMode: (colorMode) => set({ colorMode }),
      setMotion: (motion) => set({ motion }),
      set: (key, value) => set({ [key]: value } as Partial<SettingsValues>),
      setSubjectColor: (subjectId, paletteIndex) =>
        set((state) => {
          const subjectColors = { ...state.subjectColors };
          if (paletteIndex === null) delete subjectColors[subjectId];
          else subjectColors[subjectId] = paletteIndex;
          return { subjectColors };
        }),
      setSubjectIcon: (subjectId, icon) =>
        set((state) => {
          const subjectIcons = { ...state.subjectIcons };
          if (icon === null) delete subjectIcons[subjectId];
          else subjectIcons[subjectId] = icon;
          return { subjectIcons };
        }),
      resetAppearance: () =>
        set({
          theme: DEFAULT_SETTINGS.theme,
          colorMode: DEFAULT_SETTINGS.colorMode,
          skyFollowsTime: DEFAULT_SETTINGS.skyFollowsTime,
          ambientMotion: DEFAULT_SETTINGS.ambientMotion,
          motion: DEFAULT_SETTINGS.motion,
        }),
    }),
    {
      name: STORAGE_KEYS.settings,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => {
        const values: Partial<SettingsValues> = {};
        for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof SettingsValues)[]) {
          (values as Record<string, unknown>)[key] = state[key];
        }
        return values as SettingsValues;
      },
    },
  ),
);
