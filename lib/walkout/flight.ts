import type { WalkoutPlan } from "./plan";

/**
 * Feature A: wat er met je vastgezette gok gebeurt vanaf de flip. Het getal
 * vliegt uit het midden van de kaart naar een plek naast de rating (de komma
 * valt weg: 7,2 wordt 72), wordt een doorschijnend spookcijfer en klapt dan
 * tegen de echte rating. Puur een functie van tijd, net als de rest van de
 * walkout; de renderer vertaalt `path` naar posities op de kaart.
 */
export interface FlightFrame {
  /** 0 = groot in het midden, 1 = wachtplek naast de rating, 2 = tegen de rating aan. */
  path: number;
  /** 1 = met komma (7,2), 0 = zonder (72). */
  comma: number;
  /** 0 = gloeiende teller, 1 = doorschijnend spookcijfer. */
  ghost: number;
  alpha: number;
  /** Terugvering na de klap: van 0 naar 1 en weer terug. */
  bounce: number;
}

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const easeInOutCubic = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);

/** Zo snel wordt de teller een spookcijfer, na de onthulling. */
const TO_GHOST = 0.3;
const GHOST_ALPHA = 0.8;
const SETTLED_ALPHA = 0.45;

export function guessFlight(plan: WalkoutPlan, t: number): FlightFrame | null {
  const gok = plan.gok;
  const flipStart = plan.phases.flip.start;
  if (!gok || gok.guess === null || !Number.isFinite(gok.lockAt) || t < flipStart) return null;
  const exact = plan.helderziende;

  if (plan.reduced) {
    // Minder beweging: geen vlucht. Het getal vervaagt, het spook verschijnt op zijn plek.
    if (t < gok.ghostAt) {
      return { path: 0, comma: 1, ghost: 0, alpha: 1 - clamp((t - flipStart) / 0.25), bounce: 0 };
    }
    const since = t - gok.ghostAt;
    const fadeOut = exact ? 1 - clamp((since - 0.6) / 0.35) : 1;
    return {
      path: 2,
      comma: 0,
      ghost: 1,
      alpha: 0.6 * clamp(since / 0.3) * fadeOut,
      bounce: 0,
    };
  }

  if (t < plan.revealAt) {
    const p = easeInOutCubic(clamp((t - flipStart) / (plan.revealAt - flipStart)));
    return { path: p, comma: 1 - p, ghost: 0, alpha: 1, bounce: 0 };
  }
  if (t < gok.ghostAt) {
    const ghost = clamp((t - plan.revealAt) / TO_GHOST);
    return { path: 1, comma: 0, ghost, alpha: 1 - (1 - GHOST_ALPHA) * ghost, bounce: 0 };
  }
  if (t < gok.impactAt) {
    // Versnellen richting de klap.
    const p = clamp((t - gok.ghostAt) / (gok.impactAt - gok.ghostAt));
    return { path: 1 + p ** 3, comma: 0, ghost: 1, alpha: GHOST_ALPHA, bounce: 0 };
  }
  const since = t - gok.impactAt;
  if (exact) {
    return {
      path: 2,
      comma: 0,
      ghost: 1,
      alpha: GHOST_ALPHA * (1 - clamp(since / 0.35)),
      bounce: 0,
    };
  }
  return {
    path: 2,
    comma: 0,
    ghost: 1,
    alpha: GHOST_ALPHA - (GHOST_ALPHA - SETTLED_ALPHA) * clamp(since / 0.5),
    bounce: Math.sin(clamp(since / 0.22) * Math.PI),
  };
}
