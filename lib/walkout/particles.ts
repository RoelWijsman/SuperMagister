import { createRandom } from "@/lib/random";
import type { FireworkCue } from "./plan";

/**
 * Deeltjes voor de walkout, als formules van de tijd: geen simulatiestappen,
 * dus elk frame is exact na te maken (ook in de video van feature B).
 *
 * Coördinaten in stage-eenheden: de korte kant van het beeld is 1000, (0,0)
 * linksboven, y naar beneden.
 */
export interface Stage {
  w: number;
  h: number;
}

export interface Point {
  x: number;
  y: number;
}

/** Beweging met luchtweerstand en zwaartekracht, exact opgelost. */
export function ballistic(
  x0: number,
  y0: number,
  vx: number,
  vy: number,
  drag: number,
  gravity: number,
  age: number,
): Point {
  if (age <= 0) return { x: x0, y: y0 };
  const decay = (1 - Math.exp(-drag * age)) / drag;
  const terminal = gravity / drag;
  return {
    x: x0 + vx * decay,
    y: y0 + terminal * age + (vy - terminal) * decay,
  };
}

// ——— Rook van de flares ———————————————————————————————————————————————————

export interface Puff {
  t0: number;
  life: number;
  x0: number;
  y0: number;
  vx: number;
  vy: number;
  drag: number;
  /** Opwaartse versnelling (warme rook stijgt). */
  lift: number;
  size0: number;
  size1: number;
  alpha: number;
  color: string;
}

export interface PuffState extends Point {
  size: number;
  alpha: number;
}

export function puffAt(puff: Puff, t: number): PuffState | null {
  const age = t - puff.t0;
  if (age < 0 || age > puff.life) return null;
  const k = age / puff.life;
  const decay = (1 - Math.exp(-puff.drag * age)) / puff.drag;
  return {
    x: puff.x0 + puff.vx * decay,
    y: puff.y0 + puff.vy * decay - 0.5 * puff.lift * age * age,
    size: puff.size0 + (puff.size1 - puff.size0) * (1 - (1 - k) ** 2),
    alpha: puff.alpha * Math.min(1, k / 0.12) * (1 - k) ** 1.4,
  };
}

/** Waar de flares staan: verspreid over de onderrand, van buiten naar binnen. */
export function flarePositions(stage: Stage, count: number): number[] {
  const xs: number[] = [];
  for (let i = 0; i < count; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const step = Math.floor(i / 2);
    const fromEdge = 0.08 + step * (0.34 / Math.max(1, Math.ceil(count / 2) - 1 || 1));
    xs.push(stage.w / 2 + side * (stage.w / 2 - fromEdge * stage.w));
  }
  return xs;
}

interface FlareOptions {
  count: number;
  colors: readonly string[];
  start: number;
  length: number;
}

export function flarePuffs(
  seed: number,
  stage: Stage,
  { count, colors, start, length }: FlareOptions,
): Puff[] {
  const random = createRandom(seed);
  const puffs: Puff[] = [];
  const xs = flarePositions(stage, count);
  const interval = 0.055;
  xs.forEach((x, flare) => {
    const color = colors[flare % colors.length] ?? "#ffffff";
    const lean = (x - stage.w / 2) / stage.w;
    for (let t = start + random.next() * 0.15; t < start + length + 0.5; t += interval) {
      puffs.push({
        t0: t,
        life: 1.6 + random.next() * 1.1,
        x0: x + (random.next() - 0.5) * 30,
        y0: stage.h + 30,
        vx: -lean * 260 + (random.next() - 0.5) * 220,
        vy: -(700 + random.next() * 420),
        drag: 1.4 + random.next() * 0.6,
        lift: 60 + random.next() * 60,
        size0: 70 + random.next() * 40,
        size1: 300 + random.next() * 220,
        alpha: 0.32 + random.next() * 0.22,
        color,
      });
    }
  });
  return puffs;
}

// ——— Vonken ——————————————————————————————————————————————————————————————

export interface Spark {
  t0: number;
  life: number;
  x0: number;
  y0: number;
  vx: number;
  vy: number;
  drag: number;
  gravity: number;
  size: number;
  color: string;
}

export function sparkAt(spark: Spark, t: number): (Point & { alpha: number; size: number }) | null {
  const age = t - spark.t0;
  if (age < 0 || age > spark.life) return null;
  const position = ballistic(
    spark.x0,
    spark.y0,
    spark.vx,
    spark.vy,
    spark.drag,
    spark.gravity,
    age,
  );
  return { ...position, alpha: (1 - age / spark.life) ** 1.2, size: spark.size };
}

export function flareSparks(
  seed: number,
  stage: Stage,
  { count, colors, start, length }: FlareOptions,
): Spark[] {
  const random = createRandom(seed + 101);
  const sparks: Spark[] = [];
  flarePositions(stage, count).forEach((x, flare) => {
    const color = colors[flare % colors.length] ?? "#ffffff";
    for (let i = 0; i < 26; i++) {
      sparks.push({
        t0: start + random.next() * length,
        life: 0.7 + random.next() * 0.7,
        x0: x + (random.next() - 0.5) * 40,
        y0: stage.h,
        vx: (random.next() - 0.5) * 520,
        vy: -(900 + random.next() * 900),
        drag: 1.1,
        gravity: 1400,
        size: 2 + random.next() * 3,
        color,
      });
    }
  });
  return sparks;
}

// ——— Confetti ————————————————————————————————————————————————————————————

export interface Confetto {
  t0: number;
  life: number;
  x0: number;
  y0: number;
  vx: number;
  vy: number;
  drag: number;
  gravity: number;
  w: number;
  h: number;
  color: string;
  spin0: number;
  spin: number;
  swayAmp: number;
  swayFreq: number;
  flipFreq: number;
  phase: number;
}

export interface ConfettoState extends Point {
  angle: number;
  /** Doorsnede van de draaiende snipper: -1 tot 1. */
  flip: number;
  alpha: number;
}

export function confettoAt(piece: Confetto, t: number): ConfettoState | null {
  const age = t - piece.t0;
  if (age < 0 || age > piece.life) return null;
  const base = ballistic(piece.x0, piece.y0, piece.vx, piece.vy, piece.drag, piece.gravity, age);
  const settle = Math.min(1, age / 0.6);
  return {
    x: base.x + Math.sin(age * piece.swayFreq + piece.phase) * piece.swayAmp * settle,
    y: base.y,
    angle: piece.spin0 + piece.spin * age,
    flip: Math.cos(age * piece.flipFreq + piece.phase),
    alpha: Math.min(1, (piece.life - age) / 0.6),
  };
}

/** Twee confettikanonnen, links en rechts onderin, gericht naar het midden. */
export function confettiCannons(
  seed: number,
  stage: Stage,
  { count, colors, at }: { count: number; colors: readonly string[]; at: number },
): Confetto[] {
  const random = createRandom(seed + 202);
  return Array.from({ length: count }, (_, i) => {
    const fromLeft = i < count / 2;
    const angle = (fromLeft ? -1 : 1) * (0.35 + random.next() * 0.45);
    const speed = 1500 + random.next() * 1100;
    return {
      t0: at + random.next() * 0.12,
      life: 3.2 + random.next() * 1.4,
      x0: fromLeft ? -10 : stage.w + 10,
      y0: stage.h * (0.78 + random.next() * 0.08),
      vx: Math.sin(angle) * speed * -1,
      vy: -Math.cos(angle) * speed,
      drag: 2.6 + random.next() * 0.8,
      gravity: 520,
      w: 10 + random.next() * 10,
      h: 16 + random.next() * 14,
      color: colors[i % colors.length] ?? "#ffffff",
      spin0: random.next() * Math.PI * 2,
      spin: (random.next() - 0.5) * 14,
      swayAmp: 18 + random.next() * 30,
      swayFreq: 3 + random.next() * 3,
      flipFreq: 6 + random.next() * 8,
      phase: random.next() * Math.PI * 2,
    };
  });
}

// ——— Vuurwerk ————————————————————————————————————————————————————————————

export interface ShellParticle {
  vx: number;
  vy: number;
  life: number;
  /** Bepaalt het knetteren bij goudregen. */
  flicker: number;
}

export interface Shell {
  cue: FireworkCue;
  /** Startpunt onderaan. */
  x0: number;
  y0: number;
  /** Knalpunt. */
  bx: number;
  by: number;
  drag: number;
  gravity: number;
  /** Lengte van het spoor in seconden. */
  trail: number;
  particles: ShellParticle[];
}

const SHELL_SETTINGS = {
  pioen: { count: 70, speed: 620, drag: 1.8, gravity: 260, trail: 0.09, life: 1.5 },
  palm: { count: 18, speed: 760, drag: 1.2, gravity: 420, trail: 0.22, life: 1.7 },
  regen: { count: 46, speed: 420, drag: 0.9, gravity: 180, trail: 0.4, life: 2.6 },
} as const;

export function fireworkShells(seed: number, stage: Stage, cues: readonly FireworkCue[]): Shell[] {
  const random = createRandom(seed + 303);
  return cues.map((cue) => {
    const settings = SHELL_SETTINGS[cue.kind];
    const scale = cue.size * (stage.w / 1000);
    const particles: ShellParticle[] = Array.from({ length: settings.count }, (_, i) => {
      const angle = (i / settings.count) * Math.PI * 2 + random.next() * 0.2;
      const speed = settings.speed * scale * (0.75 + random.next() * 0.35);
      return {
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: settings.life * (0.8 + random.next() * 0.4),
        flicker: random.next(),
      };
    });
    const bx = cue.x * stage.w;
    return {
      cue,
      x0: bx + (random.next() - 0.5) * stage.w * 0.1,
      y0: stage.h,
      bx,
      by: cue.y * stage.h,
      drag: settings.drag,
      gravity: settings.gravity,
      trail: settings.trail,
      particles,
    };
  });
}

/** De opstijgende vuurpijl, alleen vóór de knal. */
export function shellRocketAt(shell: Shell, t: number): (Point & { alpha: number }) | null {
  const { launchAt, burstAt } = shell.cue;
  if (t < launchAt || t >= burstAt) return null;
  const k = (t - launchAt) / (burstAt - launchAt);
  const eased = 1 - (1 - k) ** 2;
  return {
    x: shell.x0 + (shell.bx - shell.x0) * eased,
    y: shell.y0 + (shell.by - shell.y0) * eased,
    alpha: 0.4 + 0.6 * k,
  };
}

/** Positie van een deeltje na de knal; `back` kijkt terug in de tijd (voor het spoor). */
export function shellParticleAt(
  shell: Shell,
  particle: ShellParticle,
  t: number,
  back = 0,
): (Point & { alpha: number }) | null {
  const age = t - shell.cue.burstAt - back;
  if (age < 0 || age > particle.life) return null;
  const position = ballistic(
    shell.bx,
    shell.by,
    particle.vx,
    particle.vy,
    shell.drag,
    shell.gravity,
    age,
  );
  return { ...position, alpha: (1 - age / particle.life) ** 1.5 };
}

// ——— Glitter ————————————————————————————————————————————————————————————

export interface Twinkle extends Point {
  period: number;
  offset: number;
  size: number;
  color: string;
}

export function glitterTwinkles(
  seed: number,
  stage: Stage,
  count: number,
  colors: readonly string[],
): Twinkle[] {
  const random = createRandom(seed + 404);
  return Array.from({ length: count }, (_, i) => ({
    x: stage.w * (0.12 + random.next() * 0.76),
    y: stage.h * (0.18 + random.next() * 0.62),
    period: 0.9 + random.next() * 1.4,
    offset: random.next() * 3,
    size: 6 + random.next() * 14,
    color: colors[i % colors.length] ?? "#ffffff",
  }));
}

export function twinkleAlpha(twinkle: Twinkle, t: number): number {
  const phase = ((t + twinkle.offset) % twinkle.period) / twinkle.period;
  return Math.max(0, Math.sin(phase * Math.PI)) ** 3;
}

// ——— Rook tijdens het gokmoment (feature A) ————————————————————————————————

const AMBIENT_INTERVAL = 0.16;
const AMBIENT_LIFE = 3.2;

/**
 * Rook die blijft opstijgen zolang het gokmoment duurt. Geen vaste lijst
 * (het gokmoment kan eindeloos duren): per tijdstip rekenen we uit welke
 * pufjes er zijn. Pufje k ontstaat op start + k × interval; na `stop` (de
 * flip) komen er geen nieuwe bij.
 */
export function ambientPuffs(
  seed: number,
  stage: Stage,
  { count, colors }: { count: number; colors: readonly string[] },
  start: number,
  t: number,
  stop: number,
): Puff[] {
  if (t < start || count === 0) return [];
  const xs = flarePositions(stage, count);
  const last = Math.floor((Math.min(t, stop) - start) / AMBIENT_INTERVAL);
  const first = Math.max(0, Math.floor((t - start - AMBIENT_LIFE) / AMBIENT_INTERVAL));
  const puffs: Puff[] = [];
  for (let k = first; k <= last; k++) {
    const random = createRandom(seed * 31 + k * 977);
    const flare = k % xs.length;
    const x = xs[flare]!;
    const lean = (x - stage.w / 2) / stage.w;
    puffs.push({
      t0: start + k * AMBIENT_INTERVAL,
      life: 2.4 + random.next() * 0.8,
      x0: x + (random.next() - 0.5) * 30,
      y0: stage.h + 30,
      vx: -lean * 160 + (random.next() - 0.5) * 140,
      vy: -(380 + random.next() * 240),
      drag: 1.2 + random.next() * 0.5,
      lift: 50 + random.next() * 40,
      size0: 70 + random.next() * 40,
      size1: 260 + random.next() * 180,
      alpha: 0.14 + random.next() * 0.1,
      color: colors[flare % colors.length] ?? "#ffffff",
    });
  }
  return puffs;
}
