import { clampGuess, GUESS_MAX, GUESS_MIN } from "./scale";

/**
 * Gokken in de walkout (feature A): één gebaar. Omhoog of omlaag slepen,
 * scrollen of de pijltjes laten het cijfer rollen als een gokkast-teller.
 * Alles in tienden (10 = 1,0); tijdens het slepen met fracties, zodat de
 * teller vloeiend rolt.
 */
export const PX_PER_TENTH = 6;
/** Zoveel scrollafstand is één tiende (trackpads geven kleine stapjes). */
const WHEEL_STEP = 40;

const clampFloat = (tenths: number) => Math.min(GUESS_MAX, Math.max(GUESS_MIN, tenths));

/** Omhoog slepen (positieve dy) is hoger. */
export function dragToGuess(startTenths: number, dyPx: number): number {
  return clampFloat(startTenths + dyPx / PX_PER_TENTH);
}

/** Telt scrollbewegingen op; omlaag scrollen (positieve deltaY) is lager. */
export function wheelSteps(rest: number, deltaY: number): { steps: number; rest: number } {
  const total = rest + deltaY;
  const whole = Math.trunc(total / WHEEL_STEP);
  return { steps: whole === 0 ? 0 : -whole, rest: total - whole * WHEEL_STEP };
}

/** Toetsen op het gokmoment; null als de toets niets met gokken te maken heeft. */
export function keyToGuess(tenths: number, key: string): number | null {
  switch (key) {
    case "ArrowUp":
      return clampGuess(tenths + 1);
    case "ArrowDown":
      return clampGuess(tenths - 1);
    case "PageUp":
      return clampGuess(tenths + 10);
    case "PageDown":
      return clampGuess(tenths - 10);
    case "Home":
      return GUESS_MIN;
    case "End":
      return GUESS_MAX;
    default:
      return null;
  }
}

/** De gok die vastgezet wordt: afgerond op een tiende, als cijfer (7,2). */
export function lockValue(tenths: number): number {
  return clampGuess(Math.round(tenths)) / 10;
}

export interface OdometerState {
  /** Eenheden (1 tot 10) en hoe ver ze al naar de volgende rollen (0–1). */
  units: number;
  unitsRoll: number;
  tenths: number;
  tenthsRoll: number;
}

/** Stand van de gokkast-teller: de tienden rollen mee, de eenheden pas bij de overgang. */
export function odometer(tenthsFloat: number): OdometerState {
  const value = clampFloat(tenthsFloat);
  if (value >= GUESS_MAX) return { units: 10, unitsRoll: 0, tenths: 0, tenthsRoll: 0 };
  const position = value % 10;
  const tenths = Math.floor(position);
  return {
    units: Math.floor(value / 10),
    unitsRoll: position > 9 ? position - 9 : 0,
    tenths,
    tenthsRoll: position - tenths,
  };
}

export type GuessMode = "elke" | "laatste" | "uit";

/** Krijgt deze kaart een gokmoment? */
export function shouldGuess({
  mode,
  session,
  index,
  count,
  numeric,
}: {
  mode: GuessMode;
  session: "pack" | "oefen" | "opnieuw";
  index: number;
  count: number;
  numeric: boolean;
}): boolean {
  if (mode === "uit" || session === "opnieuw" || !numeric) return false;
  return mode === "elke" || index === count - 1;
}
