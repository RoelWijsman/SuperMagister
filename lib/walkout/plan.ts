import type { CardTier } from "@/lib/calc/tiers";
import { tickFrequency } from "@/lib/guess/scale";

/**
 * De walkout als tijdlijn (§11). Alles hier is een pure functie: dezelfde
 * kaart geeft altijd exact dezelfde tijdlijn. De renderer tekent een frame
 * als functie van tijd t, en de video-export (feature B) gebruikt precies
 * dezelfde tijdlijn.
 */
export type WalkoutPhase =
  | "intro"
  | "flares"
  | "vak"
  | "weging"
  | "toets"
  | "silhouet"
  /** Feature A: het silhouet hangt stil en jij gokt. Live open tot je vastzet. */
  | "gok"
  | "flip"
  | "feest"
  | "rust";

export const WALKOUT_PHASES: readonly WalkoutPhase[] = [
  "intro",
  "flares",
  "vak",
  "weging",
  "toets",
  "silhouet",
  "gok",
  "flip",
  "feest",
  "rust",
];

export type SoundCue =
  | "stadion"
  | "flare"
  | "whoosh"
  | "boem"
  | "spin"
  | "onthulling"
  | "juichen"
  | "vuurwerk"
  | "finale"
  | "zacht"
  | "scheur"
  | "glans"
  /** Feature A: precies goed gegokt. */
  | "helderziende"
  /** Feature A: de gokteller rolt een tiende verder. */
  | "tik"
  /** Feature A: de spanningsloop tijdens het gokmoment (hartslag en drone). */
  | "spanning"
  /** Feature A: je gok vastzetten. */
  | "vastzetten";

export interface SoundEvent {
  at: number;
  cue: SoundCue;
  /** 0–1. */
  strength?: number;
  /** -1 (links) tot 1 (rechts). */
  pan?: number;
  /** Voor lange geluiden (stadion, flares, juichen). */
  duration?: number;
  /** Toonhoogte in Hz (het tikje van de gokteller). */
  pitch?: number;
  /** Waar in een lang geluid we beginnen (de spanningsloop wordt live in stukken gespeeld). */
  offset?: number;
}

export type FireworkKind = "pioen" | "palm" | "regen";

export interface FireworkCue {
  launchAt: number;
  burstAt: number;
  kind: FireworkKind;
  color: string;
  /** Positie van de knal, 0–1 van breedte en hoogte. */
  x: number;
  y: number;
  /** 0–1. */
  size: number;
}

export interface TierFx {
  flares: number;
  flareColors: readonly string[];
  /** Schudden van het beeld, in stage-eenheden (korte kant = 1000). */
  shake: number;
  confetti: number;
  fireworks: number;
  /** Gouden lichtstralen achter de kaart (ICON). */
  rays: boolean;
  /** Glinsteringen rond de kaart (TOTY en ICON). */
  glitter: boolean;
  /** Hoe vaak het silhouet ronddraait. */
  spinTurns: number;
  /** Kleur van het licht en de gloed. */
  light: string;
  /** Hoe hard het publiek klinkt, 0–1. */
  crowd: number;
  boom: number;
}

export interface WalkoutPlan {
  tier: CardTier;
  fail: boolean;
  reduced: boolean;
  phases: Record<WalkoutPhase, { start: number; end: number }>;
  /** Moment waarop de voorkant van de kaart zichtbaar wordt. */
  revealAt: number;
  /** Vanaf hier ligt de kaart stil en verschijnt het eindscherm. */
  restAt: number;
  /** Totale lengte inclusief naklinkend vuurwerk (voor de video). */
  duration: number;
  /** Feature A: precies goed gegokt, dus paarse flits, sterren en "HELDERZIENDE". */
  helderziende: boolean;
  events: SoundEvent[];
  fireworks: FireworkCue[];
  fx: TierFx;
  /** Feature A: het gokmoment, of null als er niet gegokt wordt. */
  gok: GuessMoment | null;
}

export interface GuessMoment {
  /** Live en nog niet vastgezet: het silhouet blijft hangen. */
  open: boolean;
  /** De vastgezette gok, of null als je zonder gok liet omdraaien. */
  guess: number | null;
  /** Moment van vastzetten (de klik). */
  lockAt: number;
  /** Je gok vliegt bij de flip naast de rating en wacht daar; nu schiet hij weg… */
  ghostAt: number;
  /** …en klapt hij tegen de echte rating aan. */
  impactAt: number;
}

/** Na de klik: een halve seconde stilte, dan de flip. Zonder gok draait hij meteen om. */
const LOCK_SILENCE = 0.5;
const SKIP_DELAY = 0.05;
/** Gescript gokmoment (herhaling, video): eerst "?", dan rolt de teller naar je gok. */
const SCRIPT = { question: 0.7, roll: 1.6, settle: 0.25 } as const;
export const SCRIPTED_LOCK_AFTER = SCRIPT.question + SCRIPT.roll + SCRIPT.settle;
/** Na de flip: het spookcijfer wacht nog even naast de rating en schuift dan tot de klap. */
const GHOST = { delay: 0.1, slide: 0.45 } as const;

const RAINBOW = ["#ff4d6d", "#ffb347", "#ffe066", "#4ade80", "#38bdf8", "#a78bfa"] as const;

const FX: Readonly<Record<CardTier, TierFx>> = {
  brons: {
    flares: 2,
    flareColors: ["#f3eee6"],
    shake: 0,
    confetti: 0,
    fireworks: 0,
    rays: false,
    glitter: false,
    spinTurns: 1.5,
    light: "#e9c3a0",
    crowd: 0.35,
    boom: 0.5,
  },
  zilver: {
    flares: 3,
    flareColors: ["#ffffff", "#dfe8f4"],
    shake: 0,
    confetti: 0,
    fireworks: 0,
    rays: false,
    glitter: false,
    spinTurns: 2,
    light: "#e6edf7",
    crowd: 0.55,
    boom: 0.65,
  },
  goud: {
    flares: 4,
    flareColors: ["#ffd25c", "#ffb81f", "#fff1b8"],
    shake: 6,
    confetti: 110,
    fireworks: 3,
    rays: false,
    glitter: false,
    spinTurns: 2,
    light: "#ffd25c",
    crowd: 0.75,
    boom: 0.8,
  },
  toty: {
    flares: 6,
    flareColors: ["#3d7bff", "#78a6ff", "#c9dbff"],
    shake: 10,
    confetti: 140,
    fireworks: 5,
    rays: false,
    glitter: true,
    spinTurns: 2.5,
    light: "#5b8dff",
    crowd: 0.9,
    boom: 0.95,
  },
  icon: {
    flares: 8,
    flareColors: RAINBOW,
    shake: 16,
    confetti: 170,
    fireworks: 8,
    rays: true,
    glitter: true,
    spinTurns: 3,
    light: "#fff1c2",
    crowd: 1,
    boom: 1,
  },
};

/** Onvoldoende: rustig en bemoedigend. Geen schudden, geen feest. */
const FAIL_FX: TierFx = {
  flares: 2,
  flareColors: ["#d9dde6"],
  shake: 0,
  confetti: 0,
  fireworks: 0,
  rays: false,
  glitter: false,
  spinTurns: 1,
  light: "#c9d2e3",
  crowd: 0.25,
  boom: 0.35,
};

type Durations = Record<Exclude<WalkoutPhase, "rust" | "gok">, number>;

const BASE: Durations = {
  intro: 1.1,
  flares: 1.2,
  vak: 1,
  weging: 0.85,
  toets: 1,
  silhouet: 1.25,
  flip: 0.55,
  feest: 1.5,
};

function durationsFor(tier: CardTier, fail: boolean, reduced: boolean): Durations {
  if (reduced)
    return {
      intro: 0.35,
      flares: 0,
      vak: 0.7,
      weging: 0.55,
      toets: 0.7,
      silhouet: 0,
      flip: 0.45,
      feest: 0.25,
    };
  if (fail)
    return {
      intro: 0.9,
      flares: 0.9,
      vak: 0.9,
      weging: 0.75,
      toets: 0.9,
      silhouet: 1,
      flip: 0.7,
      feest: 0.5,
    };
  switch (tier) {
    case "icon":
      return { ...BASE, intro: 1.3, flares: 1.5, flip: BASE.flip * 2.5, feest: 2.2 };
    case "toty":
      return { ...BASE, flares: 1.35, flip: BASE.flip * 1.4, feest: 1.9 };
    case "goud":
      return { ...BASE, feest: 1.7 };
    default:
      return BASE;
  }
}

const FIREWORK_X = [0.24, 0.76, 0.5, 0.14, 0.86, 0.36, 0.64, 0.5] as const;
const FIREWORK_Y = [0.24, 0.2, 0.15, 0.3, 0.27, 0.12, 0.18, 0.32] as const;
const FIREWORK_GAP: Readonly<Record<CardTier, number>> = {
  brons: 0,
  zilver: 0,
  goud: 0.55,
  toty: 0.48,
  icon: 0.4,
};

function fireworksFor(tier: CardTier, fx: TierFx, revealAt: number): FireworkCue[] {
  const kinds: FireworkKind[] =
    tier === "icon" ? ["pioen", "palm", "regen"] : tier === "toty" ? ["pioen", "palm"] : ["pioen"];
  const colors =
    tier === "icon"
      ? RAINBOW
      : tier === "toty"
        ? ["#5b8dff", "#ffffff", "#9fc3ff"]
        : ["#ffd25c", "#fff1b8"];
  return Array.from({ length: fx.fireworks }, (_, i) => {
    const burstAt = revealAt + 0.3 + i * FIREWORK_GAP[tier];
    return {
      launchAt: burstAt - 0.7,
      burstAt,
      kind: kinds[i % kinds.length]!,
      color: colors[i % colors.length]!,
      x: FIREWORK_X[i % FIREWORK_X.length]!,
      y: FIREWORK_Y[i % FIREWORK_Y.length]!,
      size: 0.7 + ((i * 37) % 30) / 100,
    };
  });
}

export interface WalkoutPlanOptions {
  reduced?: boolean;
  /** Precies goed gegokt. */
  helderziende?: boolean;
  /**
   * Feature A: het gokmoment. lockedAfter is hoe lang na het begin van het
   * gokmoment de gok vastgezet werd; null = live en nog open.
   */
  gok?: { lockedAfter: number | null; guess: number | null };
}

export function buildWalkoutPlan(
  card: { tier: CardTier; fail: boolean },
  options: WalkoutPlanOptions = {},
): WalkoutPlan {
  const reduced = options.reduced ?? false;
  const helderziende = options.helderziende ?? false;
  const gokOption = options.gok;
  const guess = gokOption?.guess ?? null;
  const { tier, fail } = card;
  const base = fail ? FAIL_FX : FX[tier];
  const fx: TierFx = reduced
    ? { ...base, flares: 0, shake: 0, confetti: 0, fireworks: 0, rays: false, glitter: false }
    : base;

  const lengths = { ...durationsFor(tier, fail, reduced) };
  const ghostSlide = reduced ? 0 : GHOST.slide;
  if (gokOption && guess !== null) {
    // Na de flip schuift het spookcijfer tegen de rating; daarna nog even kijken.
    const afterFlip = GHOST.delay + ghostSlide + (helderziende ? 2 : 1.4);
    lengths.feest = Math.max(lengths.feest, afterFlip);
  } else if (helderziende) {
    // Na een precies goede gok moet "HELDERZIENDE" even te lezen zijn.
    // (met een piepkleine marge tegen afrondingsruis)
    lengths.feest = Math.max(lengths.feest, 2 - lengths.flip * 0.5 + 1e-6);
  }
  const gokLength = !gokOption
    ? 0
    : gokOption.lockedAfter === null
      ? Infinity
      : gokOption.lockedAfter + (guess !== null ? LOCK_SILENCE : SKIP_DELAY);

  const phases = {} as WalkoutPlan["phases"];
  let cursor = 0;
  for (const phase of WALKOUT_PHASES) {
    const length = phase === "rust" ? 600 : phase === "gok" ? gokLength : lengths[phase];
    phases[phase] = { start: cursor, end: cursor + length };
    cursor += length;
  }

  // Met lengths en niet met phases rekenen: bij een open gokmoment is alles daarna oneindig.
  const revealAt = phases.flip.start + lengths.flip * 0.5;
  const restAt = phases.rust.start;
  const flipEnd = phases.flip.start + lengths.flip;
  const lockAt = gokOption
    ? gokOption.lockedAfter === null
      ? Infinity
      : phases.gok.start + gokOption.lockedAfter
    : phases.gok.start;
  const ghostAt = gokOption && guess !== null ? flipEnd + GHOST.delay : Infinity;
  const impactAt = ghostAt + ghostSlide;
  const gok: GuessMoment | null = gokOption
    ? { open: gokOption.lockedAfter === null, guess, lockAt, ghostAt, impactAt }
    : null;
  const fireworks = fireworksFor(tier, fx, revealAt);
  const lastBurst = fireworks.reduce((max, f) => Math.max(max, f.burstAt), 0);
  const duration = Math.max(restAt + 1.2, fireworks.length ? lastBurst + 2.2 : 0);

  const events: SoundEvent[] = [];
  if (gok) {
    // Het stadion zwijgt tijdens het gokmoment en komt terug bij de flip.
    events.push({ at: 0, cue: "stadion", strength: fx.crowd, duration: phases.gok.start + 0.8 });
    if (Number.isFinite(phases.flip.start)) {
      const back = phases.flip.start - 0.3;
      events.push({ at: back, cue: "stadion", strength: fx.crowd, duration: restAt + 2 - back });
    }
  } else {
    events.push({ at: 0, cue: "stadion", strength: fx.crowd, duration: restAt + 2 });
  }
  if (fx.flares > 0) {
    events.push({
      at: phases.flares.start,
      cue: "flare",
      strength: Math.min(1, fx.flares / 6),
      duration: phases.flares.end - phases.flares.start + 1.5,
    });
  }
  (["vak", "weging", "toets"] as const).forEach((phase, i) => {
    const { start, end } = phases[phase];
    events.push({ at: start, cue: "whoosh", pan: [-0.6, 0.6, 0][i] });
    events.push({ at: Math.min(start + 0.16, end), cue: "boem", strength: fx.boom * 0.7 });
  });
  if (phases.silhouet.end > phases.silhouet.start) {
    events.push({
      at: phases.silhouet.start,
      cue: "spin",
      duration: phases.silhouet.end - phases.silhouet.start,
    });
  }
  if (tier === "icon" && !fail) events.push({ at: phases.flip.start, cue: "finale" });
  if (fail) {
    events.push({ at: revealAt, cue: "zacht" });
  } else {
    events.push({ at: revealAt, cue: "onthulling", strength: fx.crowd });
    events.push({ at: revealAt, cue: "boem", strength: fx.boom });
    if (tier === "goud" || tier === "toty" || tier === "icon") {
      events.push({ at: phases.feest.start, cue: "juichen", strength: fx.crowd, duration: 3.2 });
    }
  }
  for (const firework of fireworks) {
    events.push({
      at: firework.burstAt,
      cue: "vuurwerk",
      pan: firework.x * 2 - 1,
      strength: firework.size,
    });
  }
  if (gok && Number.isFinite(lockAt)) {
    // Live speelt de overlay de spanning zelf (de duur is dan nog onbekend).
    events.push({ at: phases.gok.start, cue: "spanning", duration: lockAt - phases.gok.start });
  }
  if (gok && guess !== null) {
    events.push(...scriptedTicks(phases.gok.start, lockAt, guess));
    events.push({ at: lockAt, cue: "vastzetten" });
    events.push({ at: ghostAt, cue: "whoosh", pan: 0.3 });
    events.push({ at: impactAt, cue: "boem", strength: 0.6 });
  }
  if (helderziende) {
    events.push({ at: gok && guess !== null ? impactAt : revealAt + 0.3, cue: "helderziende" });
  }
  events.sort((a, b) => a.at - b.at);

  return {
    tier,
    fail,
    reduced,
    phases,
    revealAt,
    restAt,
    duration,
    events,
    fireworks,
    fx,
    helderziende,
    gok,
  };
}

const easeOutCubic = (x: number) => 1 - (1 - x) ** 3;

/** De teller in tienden bij een gescript gokmoment (herhaling, video); null = nog "?". */
function scriptedValue(start: number, lockAt: number, guess: number, t: number): number | null {
  const rollEnd = lockAt - SCRIPT.settle;
  const rollStart = rollEnd - SCRIPT.roll;
  if (t < Math.max(start, rollStart)) return null;
  const target = Math.round(guess * 10);
  if (t >= rollEnd) return target;
  const p = easeOutCubic((t - rollStart) / SCRIPT.roll);
  return 10 + (target - 10) * p;
}

/** Wat de gokteller laat zien bij een gescript gokmoment, in tienden; null = "?". */
export function scriptedGuessView(plan: WalkoutPlan, t: number): number | null {
  const gok = plan.gok;
  if (!gok || gok.guess === null || !Number.isFinite(gok.lockAt)) return null;
  return scriptedValue(plan.phases.gok.start, gok.lockAt, gok.guess, t);
}

/** Een tikje bij elke tiende die de gescripte teller passeert. */
function scriptedTicks(start: number, lockAt: number, guess: number): SoundEvent[] {
  if (!Number.isFinite(lockAt)) return [];
  const ticks: SoundEvent[] = [];
  let last = -1;
  for (let t = lockAt - SCRIPT.settle - SCRIPT.roll; t <= lockAt; t += 1 / 120) {
    const value = scriptedValue(start, lockAt, guess, t);
    if (value === null) continue;
    const tenth = Math.floor(value + 1e-9);
    if (tenth !== last) {
      if (last !== -1) ticks.push({ at: t, cue: "tik", pitch: tickFrequency(tenth) });
      last = tenth;
    }
  }
  return ticks;
}

/** In welke fase zitten we op tijd t, en hoe ver (0–1)? */
export function phaseAt(plan: WalkoutPlan, t: number): { phase: WalkoutPhase; p: number } {
  if (t <= 0) return { phase: "intro", p: 0 };
  for (const phase of WALKOUT_PHASES) {
    const { start, end } = plan.phases[phase];
    if (end > start && t >= start && t < end) return { phase, p: (t - start) / (end - start) };
  }
  return { phase: "rust", p: 1 };
}

/** Voortgang (0–1) van een fase op tijd t, begrensd. */
export function phaseProgress(plan: WalkoutPlan, phase: WalkoutPhase, t: number): number {
  const { start, end } = plan.phases[phase];
  if (end <= start) return t >= start ? 1 : 0;
  return Math.min(1, Math.max(0, (t - start) / (end - start)));
}

export interface PackPlan {
  tier: CardTier;
  duration: number;
  /** Moment waarop het pack openscheurt. */
  tearAt: number;
  events: SoundEvent[];
  light: string;
}

/** Het pack dat openscheurt voordat de kaarten komen. De gloed verraadt de beste kaart. */
export function buildPackPlan(bestTier: CardTier, options: { reduced?: boolean } = {}): PackPlan {
  const reduced = options.reduced ?? false;
  const tearAt = reduced ? 0.6 : 1.75;
  const duration = reduced ? 1 : 2.4;
  return {
    tier: bestTier,
    duration,
    tearAt,
    light: FX[bestTier].light,
    events: [
      { at: 0, cue: "whoosh", pan: 0 },
      { at: reduced ? 0.2 : 0.55, cue: "boem", strength: 0.45 },
      { at: reduced ? 0.3 : 0.9, cue: "glans", strength: FX[bestTier].crowd },
      { at: tearAt, cue: "scheur" },
      { at: tearAt + 0.05, cue: "boem", strength: 0.8 },
    ],
  };
}
