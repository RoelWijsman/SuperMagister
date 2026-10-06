import { CARD_RATIO } from "@/lib/cards/draw";
import type { CardData } from "@/lib/cards/model";
import type { CardTier } from "@/lib/calc/tiers";
import { hashString } from "@/lib/subjects/palette";
import {
  confettiCannons,
  fireworkShells,
  flarePuffs,
  flareSparks,
  glitterTwinkles,
  type Confetto,
  type Puff,
  type Shell,
  type Spark,
  type Stage,
  type Twinkle,
} from "./particles";
import type { PackPlan, WalkoutPlan } from "./plan";

/**
 * Een walkout-scène: alle data om elk frame te tekenen, berekend uit de
 * kaart, de tijdlijn en de afmetingen. Puur en deterministisch.
 */
export interface CardLayout {
  cx: number;
  cy: number;
  /** Positie als de kaart stilligt en het eindscherm ernaast of eronder staat. */
  cxRest: number;
  cyRest: number;
  restScale: number;
  w: number;
  h: number;
}

export interface WalkoutScene {
  kind: "card";
  card: CardData;
  plan: WalkoutPlan;
  stage: Stage;
  layout: CardLayout;
  puffs: Puff[];
  sparks: Spark[];
  confetti: Confetto[];
  shells: Shell[];
  twinkles: Twinkle[];
  seed: number;
}

export interface PackScene {
  kind: "pack";
  plan: PackPlan;
  stage: Stage;
  count: number;
  tier: CardTier;
  sparks: Spark[];
}

/** Stage in eenheden (korte kant precies 1000) en de pixelgrootte van één eenheid. */
export function stageFor(width: number, height: number): { stage: Stage; unit: number } {
  // Een canvas zonder afmetingen (nog niet in beeld) telt als 1×1 pixel.
  const pixelWidth = Math.max(1, width);
  const pixelHeight = Math.max(1, height);
  const unit = Math.min(pixelWidth, pixelHeight) / 1000;
  const stage =
    pixelHeight > pixelWidth
      ? { w: 1000, h: (pixelHeight / pixelWidth) * 1000 }
      : { w: (pixelWidth / pixelHeight) * 1000, h: 1000 };
  return { unit, stage };
}

/**
 * Vanaf deze verhouding (breedte/hoogte) staat het eindscherm naast de kaart
 * in plaats van eronder. Moet gelijk blijven aan de variant "naast" in
 * globals.css (min-aspect-ratio: 6/5).
 */
export const SIDE_LAYOUT_MIN_ASPECT = 1.2;

export function isSideLayout(stage: Stage): boolean {
  return stage.w / stage.h >= SIDE_LAYOUT_MIN_ASPECT;
}

export interface LayoutOptions {
  /**
   * Deel van de hoogte (0–1) dat onderaan vrij moet blijven voor het
   * eindscherm. De overlay meet dat; zonder meting een redelijke gok.
   */
  reserveBottom?: number;
}

export function cardLayout(stage: Stage, { reserveBottom }: LayoutOptions = {}): CardLayout {
  const portrait = stage.h > stage.w;
  const h = Math.min(stage.h * (portrait ? 0.5 : 0.62), stage.w * 0.74 * CARD_RATIO);
  const w = h / CARD_RATIO;
  const base = { cx: stage.w / 2, cy: stage.h * (portrait ? 0.43 : 0.46), w, h };

  if (isSideLayout(stage)) {
    // Kaart links van het midden, eindscherm rechts (vanaf 52%).
    const restScale = 0.95;
    return {
      ...base,
      restScale,
      cxRest: stage.w * 0.48 - (w * restScale) / 2,
      cyRest: stage.h / 2,
    };
  }

  // Gestapeld: de kaart past tussen de bovenbalk en het eindscherm.
  const reserve = Math.min(0.7, Math.max(0, reserveBottom ?? (portrait ? 0.45 : 0.42)));
  const top = stage.h * 0.08;
  const bottom = Math.max(top, stage.h * (1 - reserve) - 24);
  const restScale = Math.max(0.25, Math.min(portrait ? 0.82 : 0.72, (bottom - top) / h));
  return {
    ...base,
    cxRest: stage.w / 2,
    cyRest: top + Math.max(bottom - top, h * restScale) / 2,
    restScale,
  };
}

const CONFETTI_COLORS: Readonly<Record<CardTier, readonly string[]>> = {
  brons: ["#e3a06a"],
  zilver: ["#e8edf2", "#ffffff"],
  goud: ["#ffd25c", "#fff1b8", "#ffb81f", "#ffffff"],
  toty: ["#3d7bff", "#9fc3ff", "#ffe7a1", "#ffffff"],
  icon: ["#ff4d6d", "#ffb347", "#ffe066", "#4ade80", "#38bdf8", "#a78bfa", "#fff1c2"],
};

export function createWalkoutScene(
  card: CardData,
  plan: WalkoutPlan,
  stage: Stage,
  options: LayoutOptions = {},
): WalkoutScene {
  const seed = hashString(card.id);
  const flareOptions = {
    count: plan.fx.flares,
    colors: plan.fx.flareColors,
    start: plan.phases.flares.start,
    length: Math.max(0.6, plan.phases.flares.end - plan.phases.flares.start),
  };
  return {
    kind: "card",
    card,
    plan,
    stage,
    layout: cardLayout(stage, options),
    puffs: plan.fx.flares > 0 ? flarePuffs(seed, stage, flareOptions) : [],
    sparks: plan.fx.flares > 0 ? flareSparks(seed, stage, flareOptions) : [],
    confetti:
      plan.fx.confetti > 0
        ? confettiCannons(seed, stage, {
            count: plan.fx.confetti,
            colors: CONFETTI_COLORS[plan.tier],
            at: plan.revealAt + 0.08,
          })
        : [],
    shells: fireworkShells(seed, stage, plan.fireworks),
    twinkles: plan.fx.glitter
      ? glitterTwinkles(
          seed,
          stage,
          34,
          plan.tier === "icon" ? ["#fff1c2", "#ffffff"] : ["#9fc3ff", "#ffffff"],
        )
      : [],
    seed,
  };
}

export function createPackScene(plan: PackPlan, stage: Stage, count: number): PackScene {
  const seed = hashString(`pack-${count}-${plan.tier}`);
  const sparks = flareSparks(
    seed,
    { w: stage.w, h: stage.h * 0.5 },
    {
      count: 4,
      colors: [plan.light, "#ffffff"],
      start: plan.tearAt,
      length: 0.15,
    },
  );
  return { kind: "pack", plan, stage, count, tier: plan.tier, sparks };
}
