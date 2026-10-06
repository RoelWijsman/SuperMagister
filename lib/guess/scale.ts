import type { CopyKey } from "@/content/copy";
import type { GradeTone } from "@/lib/calc/average";

/**
 * Gok je cijfer (feature A). Gokken rekenen in tienden: 10 is een 1,0 en 100
 * een 10,0. Zo zit er nergens een zwevende komma tussen gok en cijfer.
 */
export const GUESS_MIN = 10;
export const GUESS_MAX = 100;

export function clampGuess(tenths: number): number {
  return Math.min(GUESS_MAX, Math.max(GUESS_MIN, Math.round(tenths)));
}

export const toTenths = (value: number) => Math.round(value * 10);

export function formatGuess(tenths: number): string {
  return (tenths / 10).toFixed(1).replace(".", ",");
}

/** De enige 6-7-grap van de hele app. */
export const isSixSeven = (tenths: number) => tenths === 67;

/** Welk live commentaar hoort bij een gok (zie de aanvulling, feature A). */
export function guessCommentKey(tenths: number): CopyKey {
  const t = clampGuess(tenths);
  if (t === 10) return "gok.commentaar.een";
  if (t < 30) return "gok.commentaar.laag";
  if (t < 50) return "gok.commentaar.zwak";
  if (t < 55) return "gok.commentaar.bijna";
  if (t === 55) return "gok.commentaar.precies";
  if (t < 60) return "gok.commentaar.krap";
  if (isSixSeven(t)) return "gok.commentaar.67";
  if (t < 70) return "gok.commentaar.realistisch";
  if (t < 80) return "gok.commentaar.zelfvertrouwen";
  if (t < 95) return "gok.commentaar.aura";
  return "gok.commentaar.genie";
}

/** Toonhoogte van het tikje bij de gokteller: twee octaven omhoog over de hele schaal. */
export function tickFrequency(tenths: number): number {
  return 330 * 2 ** (((clampGuess(tenths) - GUESS_MIN) / (GUESS_MAX - GUESS_MIN)) * 2);
}

/** Plek op de gokschaal naast de kaart: 0 = 1,0 (onderaan), 1 = 10,0 (bovenaan). */
export function scaleFraction(tenths: number): number {
  return (Math.min(GUESS_MAX, Math.max(GUESS_MIN, tenths)) - GUESS_MIN) / (GUESS_MAX - GUESS_MIN);
}

/** Zones van de gokschaal, met dezelfde grenzen als de cijferkleuren (zie gradeTone). */
export const SCALE_ZONES: readonly { tone: GradeTone; from: number; to: number }[] = [
  { tone: "bad", from: 0, to: scaleFraction(55) },
  { tone: "warn", from: scaleFraction(55), to: scaleFraction(65) },
  { tone: "good", from: scaleFraction(65), to: 1 },
];
