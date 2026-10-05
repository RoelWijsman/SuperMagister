import { useSettings } from "@/stores/settings";

const PATTERNS = {
  tap: 8,
  success: [12, 40, 18],
  reveal: [20, 30, 40],
  celebrate: [30, 50, 30, 50, 80],
} as const;

export type HapticKind = keyof typeof PATTERNS;

/** Korte trilling, als het apparaat het kan en de gebruiker het wil. */
export function haptic(kind: HapticKind) {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  if (!useSettings.getState().haptics) return;
  try {
    navigator.vibrate(PATTERNS[kind] as number | number[]);
  } catch {
    // Sommige browsers gooien als er geen gebruikersinteractie was.
  }
}
