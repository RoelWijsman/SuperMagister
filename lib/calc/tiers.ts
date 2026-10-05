import { roundHalfUp } from "./average";

/**
 * Kaarttiers voor de cijferonthulling (§11). Rating = cijfer × 10.
 * Brons < 55 · Zilver 55–69 · Goud 70–84 · TOTY 85–94 · ICON ≥ 95.
 */
export type CardTier = "brons" | "zilver" | "goud" | "toty" | "icon";

export const TIER_ORDER: readonly CardTier[] = ["brons", "zilver", "goud", "toty", "icon"];

export const TIER_LABELS: Readonly<Record<CardTier, string>> = {
  brons: "Brons",
  zilver: "Zilver",
  goud: "Goud",
  toty: "TOTY",
  icon: "ICON",
};

export function cardRating(value: number): number {
  return roundHalfUp(value * 10, 0);
}

export function cardTier(value: number): CardTier {
  const rating = cardRating(value);
  if (rating >= 95) return "icon";
  if (rating >= 85) return "toty";
  if (rating >= 70) return "goud";
  if (rating >= 55) return "zilver";
  return "brons";
}

export function bestTier(values: readonly number[]): CardTier | null {
  let best: CardTier | null = null;
  for (const value of values) {
    const tier = cardTier(value);
    if (!best || TIER_ORDER.indexOf(tier) > TIER_ORDER.indexOf(best)) best = tier;
  }
  return best;
}
