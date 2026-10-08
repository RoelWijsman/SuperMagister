import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { STORAGE_KEYS } from "@/lib/storage-keys";

/**
 * De onboarding: de eerste keer dat je SuperMagister opent. Je stap wordt
 * bewaard, zodat je de volgende keer verdergaat waar je was. Opnieuw bekijken
 * kan via Instellingen.
 */
export const ONBOARDING_STEPS = [
  "intro",
  "pack",
  "gok",
  "overzicht",
  "thema",
  "woonplaats",
  "koppelen",
  "eerste-pack",
  "klaar",
] as const;
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

/** Zoveel stippen heeft de voortgang (de drie uitlegkaarten samen zijn er één). */
export const PROGRESS_STEPS = 6;

/** Welke stip bij een stap hoort; de intro heeft er geen (-1). */
export function progressOf(step: OnboardingStep): number {
  const index = ONBOARDING_STEPS.indexOf(step);
  if (index <= 0) return -1;
  return index <= 3 ? 0 : index - 3;
}

/** Wie al iets van SuperMagister in de browser heeft, krijgt de onboarding niet vanzelf. */
export function isReturningUser(keys: readonly string[]): boolean {
  return keys.some((key) => key.startsWith("sm-") && key !== STORAGE_KEYS.onboarding);
}

interface OnboardingState {
  /** nieuw: nog nooit gezien; bezig: staat open; klaar: afgerond of overgeslagen. */
  status: "nieuw" | "bezig" | "klaar";
  step: OnboardingStep;
  begin: () => void;
  go: (step: OnboardingStep) => void;
  next: () => void;
  back: () => void;
  finish: () => void;
  restart: () => void;
}

export const useOnboarding = create<OnboardingState>()(
  persist(
    (set, get) => ({
      status: "nieuw",
      step: "intro",
      begin: () => set({ status: "bezig", step: "intro" }),
      go: (step) => set({ step }),
      next: () => {
        const index = ONBOARDING_STEPS.indexOf(get().step);
        const step = ONBOARDING_STEPS[Math.min(index + 1, ONBOARDING_STEPS.length - 1)];
        if (step) set({ step });
      },
      back: () => {
        // Terug naar de intro heeft geen zin: die speelt maar één keer.
        const index = ONBOARDING_STEPS.indexOf(get().step);
        const step = ONBOARDING_STEPS[Math.max(index - 1, 1)];
        if (step) set({ step });
      },
      finish: () => set({ status: "klaar" }),
      restart: () => set({ status: "bezig", step: "intro" }),
    }),
    {
      name: STORAGE_KEYS.onboarding,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ status: state.status, step: state.step }),
    },
  ),
);
