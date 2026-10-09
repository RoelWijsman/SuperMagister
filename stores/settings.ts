import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { normalizeHex } from "@/lib/color";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import type { SubjectIconName } from "@/lib/subjects/icons";
import type { GuessMode } from "@/lib/guess/input";
import type { HolidayRegion } from "@/lib/school/holidays";
import type { Compass } from "@/lib/weather/advice";
import { customThemeVars, DEFAULT_THEME, type ThemeId } from "@/lib/theme/themes";

export type ColorMode = "dark" | "light" | "system";
export type MotionPreference = "system" | "reduced" | "full";
export type WalkoutSpeed = "normaal" | "snel" | "direct";

/** Een plaats voor het fietsweer (via de geocoder van Open-Meteo). */
export interface WeatherPlace {
  name: string;
  /** Bijv. de provincie, om dubbele plaatsnamen uit elkaar te houden. */
  region: string;
  latitude: number;
  longitude: number;
}

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
  /**
   * Anonieme statistieken delen (Instellingen → Privacy): alleen dagtellers als
   * "walkout gestart", nooit iets over jou. Zie lib/stats/client.ts.
   */
  shareStats: boolean;
  /** Globale mute: geen enkel geluid. */
  soundMuted: boolean;
  uiSounds: boolean;
  walkoutSounds: boolean;
  haptics: boolean;
  walkoutSpeed: WalkoutSpeed;
  /** Na een kaart vanzelf door naar de volgende. */
  walkoutAuto: boolean;
  /** Feature A: bij welke kaarten je gokt (elke, alleen de laatste, of uit). */
  guessMode: GuessMode;
  /** Eigen vakkleur (paletindex) per vak-id. */
  subjectColors: Record<string, number>;
  subjectIcons: Record<string, SubjectIconName>;
  /** Fase 3a, fietsweer: waar je woont. Leeg tot je zelf iets kiest. */
  weatherPlace: WeatherPlace | null;
  /** In welke richting je naar school fietst (voor tegenwind). */
  bikeHeading: Compass;
  /** Hoe lang je fietst, om je vertrektijd te weten. */
  bikeMinutes: number;
  /** Fase 3a: regio voor de schoolvakanties. */
  holidayRegion: HolidayRegion;
  /**
   * Prestaties en XP tonen (Instellingen > Ontwikkelaar). Fase 6 is vervallen;
   * wat er al was, staat standaard uit maar blijft bestaan.
   */
  gamification: boolean;
  /** Ontwikkelaarsinstellingen tonen in de live versie (7× tikken op het versienummer). */
  developer: boolean;
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
  shareStats: true,
  soundMuted: false,
  uiSounds: false,
  walkoutSounds: true,
  haptics: true,
  walkoutSpeed: "normaal",
  walkoutAuto: false,
  guessMode: "elke",
  subjectColors: {},
  subjectIcons: {},
  weatherPlace: null,
  bikeHeading: "O",
  bikeMinutes: 15,
  holidayRegion: "midden",
  gamification: false,
  developer: false,
};

const SETTINGS_VERSION = 3;

/** De oude standaard-woonplaats (tot versie 3). Niemand koos die zelf, dus die gaat weg. */
const OLD_DEFAULT_PLACE = { latitude: 52.0908, longitude: 5.1222 };

/**
 * Oude opslag bijwerken. Versie 2: "gokken aan/uit" werd "bij welke kaarten"; wie het
 * had uitgezet, houdt het uit. Versie 3: geen standaard woonplaats (Utrecht) meer.
 */
export function migrateSettings(persisted: unknown, version: number): Partial<SettingsValues> {
  if (typeof persisted !== "object" || persisted === null) return {};
  const values = { ...(persisted as Record<string, unknown>) };
  if (version < 2 && "guessEnabled" in values) {
    values.guessMode = values.guessEnabled === false ? "uit" : "elke";
    delete values.guessEnabled;
  }
  const place = values.weatherPlace as { latitude?: number; longitude?: number } | undefined;
  if (
    version < 3 &&
    place?.latitude === OLD_DEFAULT_PLACE.latitude &&
    place?.longitude === OLD_DEFAULT_PLACE.longitude
  )
    values.weatherPlace = null;
  return values as Partial<SettingsValues>;
}

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
      version: SETTINGS_VERSION,
      migrate: (persisted, version) => migrateSettings(persisted, version) as SettingsValues,
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
