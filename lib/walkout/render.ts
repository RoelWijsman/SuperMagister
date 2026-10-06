import {
  CARD_RATIO,
  cardGlow,
  drawSubjectIcon,
  faceStyleFor,
  rgba,
  spaced,
} from "@/lib/cards/draw";
import { gradeTone, type GradeTone } from "@/lib/calc/average";
import { odometer } from "@/lib/guess/input";
import { GUESS_MAX, GUESS_MIN, SCALE_ZONES, scaleFraction } from "@/lib/guess/scale";
import {
  ambientPuffs,
  confettoAt,
  puffAt,
  shellParticleAt,
  shellRocketAt,
  sparkAt,
  twinkleAlpha,
} from "./particles";
import { guessFlight } from "./flight";
import { phaseProgress, type WalkoutPlan } from "./plan";
import type { PackScene, WalkoutScene } from "./scene";
import { glowSprite, smokeSprite, sparkleSprite } from "./sprites";
import { pulseAt, zoomAt } from "./tension";

/**
 * Tekent één frame van de walkout. Puur een functie van tijd t: dezelfde t
 * geeft altijd hetzelfde beeld. De live walkout en (feature B) de video
 * gebruiken precies deze functie.
 */
export interface WalkoutAssets {
  face: HTMLCanvasElement;
  silhouette: HTMLCanvasElement;
  /** Font-familie van de kaarten (Bebas Neue). */
  family: string;
  /**
   * Feature B: breedte van wat linksboven op de kaart staat (kaarteenheden), als
   * dat geen rating is maar een sticker. Het spookcijfer landt ernaast.
   */
  ratingWidth?: number;
}

/** Feature A: wat de gokteller live laat zien. */
export interface GuessView {
  /** Stand in tienden (mag een fractie zijn tijdens het rollen); null = "?". */
  value: number | null;
  /** Sinds wanneer (walkout-tijd) de teller op 6,7 staat: dan wiebelt hij even. */
  wobbleSince?: number | null;
  /** Live gokken: pijltjes en de schaal naast de kaart. Niet in herhalingen of de video. */
  hints?: boolean;
  /** Sinds wanneer de pijltjes een duwtje krijgen (tik of Enter zonder getal). */
  nudgeSince?: number | null;
  /** Tekst boven het getal: standaard "WAT HEB JE?", null = geen tekst (video). */
  label?: string | null;
}

export interface PackAssets {
  pack: HTMLCanvasElement;
  family: string;
}

export interface RenderTarget {
  ctx: CanvasRenderingContext2D;
  /** Pixels per stage-eenheid. */
  unit: number;
}

// ——— Hulpjes ————————————————————————————————————————————————————————————

const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));
const easeOutCubic = (x: number) => 1 - (1 - x) ** 3;
const easeInOutCubic = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
const easeOutBack = (x: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2;
};
const decay = (t: number, at: number, tau: number) => (t < at ? 0 : Math.exp(-(t - at) / tau));

function shakeOffset(plan: WalkoutPlan, t: number) {
  const max = plan.fx.shake;
  if (!max) return { x: 0, y: 0 };
  const flares = phaseProgress(plan, "flares", t);
  let amp = flares > 0 && flares < 1 ? 0.3 * max * Math.sin(Math.PI * flares) : 0;
  amp += max * decay(t, plan.revealAt, 0.35);
  for (const event of plan.events)
    if (event.cue === "boem") amp += 0.25 * max * decay(t, event.at, 0.14);
  return {
    x: (amp * (Math.sin(t * 67.3) + 0.6 * Math.sin(t * 41.9 + 1.3))) / 1.6,
    y: (amp * (Math.sin(t * 59.1 + 0.7) + 0.6 * Math.sin(t * 37.7))) / 1.6,
  };
}

/** Waar de kaart staat: midden tijdens de onthulling, opzij of omhoog in rust. */
function cardCenter(scene: WalkoutScene, t: number) {
  const { layout, plan } = scene;
  const rest = easeOutCubic(clamp((t - plan.restAt) / 0.6));
  return {
    x: layout.cx + (layout.cxRest - layout.cx) * rest,
    y: layout.cy + (layout.cyRest - layout.cy) * rest,
    scale: 1 - (1 - layout.restScale) * rest,
  };
}

function flashAlpha(plan: WalkoutPlan, t: number) {
  let alpha = (plan.fail ? 0.22 : 0.85) * decay(t, plan.revealAt, plan.fail ? 0.3 : 0.16);
  for (const event of plan.events)
    if (event.cue === "boem" && event.at < plan.revealAt) alpha += 0.1 * decay(t, event.at, 0.12);
  return clamp(alpha);
}

// ——— Lagen ———————————————————————————————————————————————————————————————

function drawBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  light: string,
  glow: number,
) {
  ctx.fillStyle = "#03040a";
  ctx.fillRect(0, 0, w, h);
  const bowl = ctx.createRadialGradient(w / 2, h * 1.08, 0, w / 2, h * 1.08, Math.max(w, h) * 0.8);
  bowl.addColorStop(0, rgba(light, 0.12 + 0.5 * glow));
  bowl.addColorStop(0.45, rgba(light, 0.05 + 0.12 * glow));
  bowl.addColorStop(1, rgba(light, 0));
  ctx.fillStyle = bowl;
  ctx.fillRect(0, 0, w, h);
}

function drawSpotlights(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  strength: number,
  aim: { x: number; y: number } | null,
  aimMix: number,
  color: string,
  moving: boolean,
) {
  if (strength <= 0) return;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const beams = [
    { ox: w * 0.1, base: 0.42 },
    { ox: w * 0.9, base: -0.42 },
    { ox: w * 0.5, base: 0 },
  ];
  beams.forEach((beam, i) => {
    const oy = -80;
    let angle = beam.base + (moving ? Math.sin(t * 0.9 + i * 2.1) * 0.32 : 0);
    if (aim) angle = angle * (1 - aimMix) + Math.atan2(aim.x - beam.ox, aim.y - oy) * aimMix;
    const length = h * 1.5;
    const spread = 0.12;
    const tip = { x: beam.ox + Math.sin(angle) * length, y: oy + Math.cos(angle) * length };
    const gradient = ctx.createLinearGradient(beam.ox, oy, tip.x, tip.y);
    gradient.addColorStop(0, rgba(color, strength));
    gradient.addColorStop(0.7, rgba(color, strength * 0.25));
    gradient.addColorStop(1, rgba(color, 0));
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(beam.ox, oy);
    ctx.lineTo(beam.ox + Math.sin(angle - spread) * length, oy + Math.cos(angle - spread) * length);
    ctx.lineTo(beam.ox + Math.sin(angle + spread) * length, oy + Math.cos(angle + spread) * length);
    ctx.closePath();
    ctx.fill();
  });
  ctx.restore();
}

function drawFlares(ctx: CanvasRenderingContext2D, scene: WalkoutScene, t: number) {
  if (scene.puffs.length === 0) return;
  const { plan, stage } = scene;
  // Tijdens het gokmoment blijft er rook opstijgen, zachter dan de flares.
  const ambient = plan.gok
    ? ambientPuffs(
        scene.seed,
        stage,
        { count: plan.fx.flares, colors: plan.fx.flareColors },
        plan.phases.gok.start,
        t,
        plan.phases.flip.start,
      )
    : [];
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const puff of [...scene.puffs, ...ambient]) {
    const state = puffAt(puff, t);
    if (!state || state.alpha <= 0.002) continue;
    ctx.globalAlpha = state.alpha;
    ctx.drawImage(
      smokeSprite(puff.color),
      state.x - state.size / 2,
      state.y - state.size / 2,
      state.size,
      state.size,
    );
  }
  for (const spark of scene.sparks) {
    const state = sparkAt(spark, t);
    if (!state) continue;
    ctx.globalAlpha = state.alpha;
    const size = state.size * 6;
    ctx.drawImage(glowSprite(spark.color), state.x - size / 2, state.y - size / 2, size, size);
  }
  ctx.restore();
}

function drawRays(
  ctx: CanvasRenderingContext2D,
  scene: WalkoutScene,
  t: number,
  cx: number,
  cy: number,
) {
  const { plan } = scene;
  if (!plan.fx.rays) return;
  const strength = clamp((t - plan.phases.flip.start) / 0.6) * (t > plan.restAt + 3 ? 0.7 : 1);
  if (strength <= 0) return;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.translate(cx, cy);
  ctx.rotate(t * 0.22);
  const radius = Math.max(scene.stage.w, scene.stage.h);
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
  gradient.addColorStop(0, `rgba(255,236,170,${0.34 * strength})`);
  gradient.addColorStop(0.6, `rgba(255,214,120,${0.08 * strength})`);
  gradient.addColorStop(1, "rgba(255,214,120,0)");
  ctx.fillStyle = gradient;
  for (let i = 0; i < 16; i++) {
    ctx.rotate((Math.PI * 2) / 16);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(radius, -radius * 0.09);
    ctx.lineTo(radius, radius * 0.09);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawFireworks(ctx: CanvasRenderingContext2D, scene: WalkoutScene, t: number) {
  if (scene.shells.length === 0) return;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";
  for (const shell of scene.shells) {
    const rocket = shellRocketAt(shell, t);
    if (rocket) {
      const previous = shellRocketAt(shell, Math.max(shell.cue.launchAt, t - 0.08)) ?? rocket;
      ctx.globalAlpha = rocket.alpha;
      ctx.strokeStyle = "#ffe9b8";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(previous.x, previous.y);
      ctx.lineTo(rocket.x, rocket.y);
      ctx.stroke();
      ctx.drawImage(glowSprite("#fff1c2"), rocket.x - 12, rocket.y - 12, 24, 24);
      continue;
    }
    const age = t - shell.cue.burstAt;
    if (age < 0 || age > 3) continue;
    // De knal zelf.
    const burst = decay(t, shell.cue.burstAt, 0.12);
    if (burst > 0.01) {
      ctx.globalAlpha = burst;
      const size = 260 * shell.cue.size;
      ctx.drawImage(
        glowSprite(shell.cue.color),
        shell.bx - size / 2,
        shell.by - size / 2,
        size,
        size,
      );
    }
    ctx.strokeStyle = shell.cue.color;
    ctx.lineWidth = shell.cue.kind === "palm" ? 5 : 3;
    for (const particle of shell.particles) {
      const head = shellParticleAt(shell, particle, t);
      if (!head) continue;
      const tail = shellParticleAt(shell, particle, t, shell.trail) ?? { x: shell.bx, y: shell.by };
      let alpha = head.alpha;
      if (shell.cue.kind === "regen")
        alpha *= 0.55 + 0.45 * Math.sin(t * 38 + particle.flicker * 40);
      ctx.globalAlpha = clamp(alpha);
      ctx.beginPath();
      ctx.moveTo(tail.x, tail.y);
      ctx.lineTo(head.x, head.y);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function revealCenter(scene: WalkoutScene) {
  return { x: scene.stage.w / 2, y: scene.stage.h * (scene.stage.h > scene.stage.w ? 0.4 : 0.44) };
}

function drawRevealText(
  ctx: CanvasRenderingContext2D,
  scene: WalkoutScene,
  assets: WalkoutAssets,
  t: number,
  unit: number,
) {
  const { plan, card, stage } = scene;
  const light = plan.fx.light;
  const center = revealCenter(scene);
  const maxWidth = stage.w * 0.86;

  (["vak", "weging", "toets"] as const).forEach((phase) => {
    const p = phaseProgress(plan, phase, t);
    if (p <= 0 || p >= 1) return;
    const enter = plan.reduced ? clamp(p / 0.2) : easeOutBack(clamp(p / 0.22));
    const exit = clamp((p - 0.8) / 0.2);
    const alpha = clamp(p / 0.1) * (1 - exit);
    const scale = plan.reduced ? 1 : 1.55 - 0.55 * enter;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(center.x, center.y - 36 * exit);
    ctx.scale(scale, scale);
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.shadowColor = rgba(light, 0.9);
    ctx.shadowBlur = 42 * unit;
    ctx.fillStyle = "#ffffff";

    if (phase === "vak") {
      ctx.fillStyle = rgba(light, 0.14);
      ctx.beginPath();
      ctx.arc(0, -70, 118, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = rgba(light, 0.9);
      ctx.stroke();
      drawSubjectIcon(ctx, card.icon, -70, -140, 140, "#ffffff", 1.7);
      ctx.fillStyle = "#ffffff";
      const name = card.subjectName.toUpperCase();
      let size = 132;
      ctx.font = `${size}px ${assets.family}`;
      while (ctx.measureText(name).width > maxWidth && size > 60) {
        size -= 4;
        ctx.font = `${size}px ${assets.family}`;
      }
      ctx.fillText(name, 0, 170);
    } else if (phase === "weging") {
      ctx.font = `64px ${assets.family}`;
      ctx.globalAlpha = alpha * 0.75;
      ctx.fillText("W E G I N G", 0, -190);
      ctx.globalAlpha = alpha;
      ctx.font = `340px ${assets.family}`;
      ctx.fillText(card.stats.weg, 0, 110);
    } else {
      ctx.font = `64px ${assets.family}`;
      ctx.globalAlpha = alpha * 0.75;
      ctx.fillText("T O E T S", 0, -150);
      ctx.globalAlpha = alpha;
      drawWrapped(ctx, card.grade.description.toUpperCase(), assets.family, maxWidth, 150, 64);
    }
    ctx.restore();
  });
}

/** Zo groot mogelijk, desnoods over twee regels. */
function drawWrapped(
  ctx: CanvasRenderingContext2D,
  text: string,
  family: string,
  maxWidth: number,
  size: number,
  min: number,
) {
  const fits = (lines: string[]) => lines.every((line) => ctx.measureText(line).width <= maxWidth);
  const split = (): string[] => {
    const words = text.split(/\s+/);
    if (words.length < 2) return [text];
    let best: string[] = [text];
    let bestDiff = Infinity;
    for (let i = 1; i < words.length; i++) {
      const a = words.slice(0, i).join(" ");
      const b = words.slice(i).join(" ");
      const diff = Math.abs(ctx.measureText(a).width - ctx.measureText(b).width);
      if (diff < bestDiff) {
        bestDiff = diff;
        best = [a, b];
      }
    }
    return best;
  };
  const draw = (lines: string[], current: number) => {
    const lineHeight = current * 0.95;
    lines.forEach((line, i) =>
      ctx.fillText(line, 0, 40 + (i - (lines.length - 1) / 2) * lineHeight),
    );
  };

  for (let current = size; current >= min; current -= 6) {
    ctx.font = `${current}px ${family}`;
    if (fits([text])) return draw([text], current);
    if (current <= size * 0.75) {
      const lines = split();
      if (fits(lines)) return draw(lines, current);
    }
  }
  ctx.font = `${min}px ${family}`;
  draw(split(), min);
}

/** Kaart met perspectief, door hem in smalle verticale stroken te tekenen. */
function drawCardStrips(
  ctx: CanvasRenderingContext2D,
  source: HTMLCanvasElement,
  cx: number,
  cy: number,
  w: number,
  h: number,
  angleDeg: number,
) {
  const angle = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  if (Math.abs(sin) < 1e-3) {
    // Recht van voren (of achteren): geen perspectief, dus in één keer, zonder naden.
    ctx.drawImage(source, cx - w / 2, cy - h / 2, w, h);
    return;
  }
  const back = cos < 0;
  const strips = 40;
  const camera = 1500;
  const sw = source.width / strips;
  // Stroken overlappen minstens een halve schermpixel, anders schemeren de naden door.
  const transform = ctx.getTransform();
  const overlap = Math.max(0.3, 0.5 / Math.max(1e-3, Math.hypot(transform.a, transform.b)));
  for (let i = 0; i < strips; i++) {
    const u0 = i / strips;
    const u1 = (i + 1) / strips;
    const x0 = (u0 - 0.5) * w;
    const x1 = (u1 - 0.5) * w;
    const p0 = camera / (camera + x0 * sin);
    const p1 = camera / (camera + x1 * sin);
    const X0 = cx + x0 * cos * p0;
    const X1 = cx + x1 * cos * p1;
    const width = Math.abs(X1 - X0);
    if (width < 0.2) continue;
    const height = h * ((p0 + p1) / 2);
    const srcIndex = back ? strips - 1 - i : i;
    ctx.drawImage(
      source,
      srcIndex * sw,
      0,
      sw,
      source.height,
      Math.min(X0, X1) - overlap,
      cy - height / 2,
      width + overlap * 2,
      height,
    );
  }
}

interface CardPose {
  angle: number;
  cx: number;
  cy: number;
  w: number;
  h: number;
  alpha: number;
  /** De voorkant is te zien (na de onthulling). */
  revealed: boolean;
}

/** Waar de kaart staat en hoe hij gedraaid is; null als hij (nog) niet te zien is. */
function cardPose(scene: WalkoutScene, t: number): CardPose | null {
  const { plan, layout } = scene;
  const flipStart = plan.phases.flip.start;
  const flipEnd = plan.phases.flip.end;
  const gokStart = plan.phases.gok.start;
  if (!plan.reduced && t < plan.phases.silhouet.start) return null;
  if (plan.reduced && t < (plan.gok ? gokStart : flipStart)) return null;

  let angle = 360;
  let scale = 1;
  let dy = 0;
  let alpha = 1;

  if (plan.reduced) {
    if (t < flipStart) {
      angle = 180;
      alpha = clamp((t - gokStart) / 0.3);
    } else {
      alpha = clamp((t - flipStart) / Math.max(0.01, flipEnd - flipStart));
    }
  } else if (t < flipStart) {
    const p = phaseProgress(plan, "silhouet", t);
    const e = easeOutCubic(p);
    angle = 180 + 360 * plan.fx.spinTurns * (1 - e);
    scale = 0.45 + 0.55 * e;
    dy = 340 * (1 - e);
    alpha = clamp(p / 0.15);
    if (plan.gok && t >= gokStart) {
      // Het gokmoment: het silhouet hangt, deint zacht en klopt mee met de hartslag.
      const tau = t - gokStart;
      dy = Math.sin(tau * 1.4) * 7 * clamp(tau / 0.6);
      scale = 1 + 0.014 * pulseAt(tau);
    }
  } else if (t < flipEnd) {
    const p = phaseProgress(plan, "flip", t);
    angle = 180 + 180 * easeInOutCubic(p);
    scale = 1 + 0.05 * Math.sin(Math.PI * p);
  } else {
    const since = t - flipEnd;
    angle = 360 + 7 * Math.sin(since * 1.1) * clamp(since / 0.8);
    scale = 1 + 0.08 * decay(t, plan.revealAt, 0.2);
    dy = -6 * Math.sin(t * 1.5);
  }

  const center = cardCenter(scene, t);
  const w = layout.w * scale * center.scale;
  return {
    angle,
    cx: center.x,
    cy: center.y + dy,
    w,
    h: w * CARD_RATIO,
    alpha,
    revealed: t >= plan.revealAt || (plan.reduced && t >= flipStart),
  };
}

function drawCard(
  ctx: CanvasRenderingContext2D,
  scene: WalkoutScene,
  assets: WalkoutAssets,
  t: number,
  pose: CardPose | null,
) {
  if (!pose) return;
  const { plan } = scene;
  const { angle, cx, cy, w, h, alpha, revealed } = pose;
  const source =
    revealed && Math.cos((angle * Math.PI) / 180) > 0 ? assets.face : assets.silhouette;
  const gokStart = plan.phases.gok.start;
  const pulse =
    plan.gok && !plan.reduced && t >= gokStart && t < plan.phases.flip.start
      ? pulseAt(t - gokStart)
      : 0;

  ctx.save();
  const glowColor = plan.fail ? "#9aa6bf" : cardGlow(scene.card);
  ctx.globalAlpha = alpha * (revealed ? 0.85 : 0.45 + 0.4 * pulse);
  ctx.globalCompositeOperation = "lighter";
  const glow = 1 + 0.15 * pulse;
  ctx.drawImage(
    glowSprite(glowColor),
    cx - w * 1.15 * glow,
    cy - h * 0.85 * glow,
    w * 2.3 * glow,
    h * 1.7 * glow,
  );
  ctx.globalCompositeOperation = "source-over";
  // Minder beweging: het silhouet vervaagt onder de voorkant in plaats van te draaien.
  if (plan.reduced && plan.gok && revealed && alpha < 1) {
    ctx.globalAlpha = 1 - alpha;
    drawCardStrips(ctx, assets.silhouette, cx, cy, w, h, 180);
  }
  ctx.globalAlpha = alpha;
  drawCardStrips(ctx, source, cx, cy, w, h, angle);

  // Glansstreep die over de kaart beweegt.
  if (revealed && !plan.reduced) {
    const cycle = ((t - plan.revealAt) % 3.2) / 3.2;
    if (cycle < 0.4) {
      const x = cx - w + (cycle / 0.4) * w * 2;
      ctx.save();
      ctx.beginPath();
      ctx.rect(cx - w / 2, cy - h / 2, w, h);
      ctx.clip();
      const shine = ctx.createLinearGradient(x - w * 0.25, cy - h / 2, x + w * 0.25, cy + h / 2);
      shine.addColorStop(0, "rgba(255,255,255,0)");
      shine.addColorStop(0.5, "rgba(255,255,255,0.28)");
      shine.addColorStop(1, "rgba(255,255,255,0)");
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = shine;
      ctx.fillRect(cx - w / 2, cy - h / 2, w, h);
      ctx.restore();
    }
  }
  ctx.restore();
}

/** Plek van de rating op de kaart (kaarteenheden van 500 breed, zie drawCardFace). */
function ratingSpot(pose: CardPose) {
  const k = pose.w / 500;
  const left = pose.cx - pose.w / 2;
  const top = pose.cy - pose.h / 2;
  return { k, x: left + 48 * k, baseline: top + 168 * k, size: 150 * k, top };
}

/** Feature A: het gokgetal staat groot in het midden van de kaart, met de pijltjes erom. */
function guessSpot(pose: CardPose) {
  const k = pose.w / 500;
  const top = pose.cy - pose.h / 2;
  return {
    k,
    cx: pose.cx,
    label: top + 214 * k,
    up: top + 262 * k,
    baseline: top + 455 * k,
    down: top + 498 * k,
    size: 210 * k,
  };
}

type GuessSpot = ReturnType<typeof guessSpot>;

/** Breedte van een gokgetal (eenheden, komma, tienden), zoals de teller hem neerzet. */
function guessNumberWidth(ctx: CanvasRenderingContext2D, units: string, size: number, comma = 1) {
  return (
    ctx.measureText(units).width +
    comma * (ctx.measureText(",").width + size * 0.04) +
    ctx.measureText("0").width
  );
}

/** Een getal als gokkast-teller, gecentreerd op x: de tienden rollen mee, de eenheden bij de overgang. */
function drawOdometer(
  ctx: CanvasRenderingContext2D,
  tenths: number,
  x: number,
  baseline: number,
  size: number,
  family: string,
) {
  const reels = odometer(tenths);
  ctx.font = `${size}px ${family}`;
  ctx.textAlign = "left";
  const line = size * 0.95;
  const reel = (left: number, width: number, current: string, next: string, roll: number) => {
    ctx.save();
    ctx.beginPath();
    // Een smal venster, net zo hoog als de cijfers: wat eruit rolt, verdwijnt.
    ctx.rect(left - size * 0.08, baseline - size * 0.74, width + size * 0.16, size * 0.8);
    ctx.clip();
    ctx.fillText(current, left, baseline - roll * line);
    if (roll > 0.001) ctx.fillText(next, left, baseline + (1 - roll) * line);
    ctx.restore();
  };
  const units = String(reels.units);
  const unitsNext = String(Math.min(10, reels.units + 1));
  // Rolt de 9 door naar 10, dan schuift de komma pas mee terwijl het rolt.
  const unitsWidth =
    ctx.measureText(units).width +
    (ctx.measureText(unitsNext).width - ctx.measureText(units).width) * reels.unitsRoll;
  const total = guessNumberWidth(ctx, units, size) - ctx.measureText(units).width + unitsWidth;
  const left = x - total / 2;
  const commaX = left + unitsWidth + size * 0.02;
  const tenthsX = commaX + ctx.measureText(",").width + size * 0.02;
  const tenthsNow = String(reels.tenths);
  const tenthsNext = String((reels.tenths + 1) % 10);

  ctx.save();
  if (ctx.shadowBlur > 0) {
    // De gloed apart en zonder knipvenster (anders tekent hij de randen van de rollen
    // af): alleen de schaduw, op de rustplek. Een cijfer dat halverwege rolt, gloeit
    // even niet, anders zie je een schim van een cijfer dat er niet staat.
    const away = 5000;
    const alpha = ctx.globalAlpha;
    ctx.shadowOffsetX = away * ctx.getTransform().a;
    const glow = (current: string, next: string, roll: number, at: number) => {
      const settled = 1 - 4 * roll * (1 - roll);
      ctx.globalAlpha = alpha * settled * (1 - roll);
      ctx.fillText(current, at - away, baseline);
      if (roll > 0.001) {
        ctx.globalAlpha = alpha * settled * roll;
        ctx.fillText(next, at - away, baseline);
      }
    };
    glow(units, unitsNext, reels.unitsRoll, left);
    glow(",", ",", 0, commaX);
    glow(tenthsNow, tenthsNext, reels.tenthsRoll, tenthsX);
    ctx.globalAlpha = alpha;
    ctx.shadowOffsetX = 0;
    ctx.shadowBlur = 0;
  }
  reel(left, unitsWidth, units, unitsNext, reels.unitsRoll);
  ctx.fillText(",", commaX, baseline);
  reel(tenthsX, ctx.measureText("0").width, tenthsNow, tenthsNext, reels.tenthsRoll);
  ctx.restore();
}

/**
 * Feature A, alleen live: pulserende pijltjes boven en onder het getal. Op 10,0
 * kan het niet hoger en op 1,0 niet lager; dan vervaagt dat pijltje. Een tik
 * zonder getal geeft ze een duwtje.
 */
function drawGuessArrows(
  ctx: CanvasRenderingContext2D,
  spot: GuessSpot,
  t: number,
  unit: number,
  reduced: boolean,
  value: number | null,
  nudgeSince: number | null,
) {
  const { k, cx } = spot;
  const wave = reduced ? 0.5 : 0.5 - 0.5 * Math.cos((t * 2 * Math.PI) / 1.2);
  const nudge =
    reduced || nudgeSince === null || t < nudgeSince
      ? 0
      : Math.exp(-(t - nudgeSince) / 0.35) * Math.abs(Math.sin((t - nudgeSince) * 14));
  const shift = (reduced ? 0 : 7 * wave + 16 * nudge) * k;
  const base = ctx.globalAlpha;
  const half = 30 * k;
  const rise = 15 * k;

  ctx.save();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 6 * k;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.shadowColor = "rgba(255,255,255,0.85)";
  ctx.shadowBlur = 10 * unit;
  const chevron = (y: number, direction: -1 | 1, dim: boolean) => {
    ctx.globalAlpha = base * (dim ? 0.12 : Math.min(1, 0.4 + 0.45 * wave + 0.5 * nudge));
    ctx.beginPath();
    ctx.moveTo(cx - half, y - (direction * rise) / 2);
    ctx.lineTo(cx, y + (direction * rise) / 2);
    ctx.lineTo(cx + half, y - (direction * rise) / 2);
    ctx.stroke();
  };
  chevron(spot.up - shift, -1, value !== null && Math.round(value) >= GUESS_MAX);
  chevron(spot.down + shift, 1, value !== null && Math.round(value) <= GUESS_MIN);
  ctx.restore();
}

const SCALE_COLORS: Readonly<Record<GradeTone, string>> = {
  bad: "#ff6b81",
  warn: "#ffb547",
  good: "#4fe3a3",
};

/**
 * Feature A, alleen live: een verticale schaal naast de kaart, van 1 (onder) tot
 * 10 (boven), met dezelfde rood/oranje/groen-grenzen als de cijfers in de app.
 * Een streepje beweegt mee met je gok.
 */
function drawGuessScale(
  ctx: CanvasRenderingContext2D,
  scene: WalkoutScene,
  assets: WalkoutAssets,
  t: number,
  unit: number,
  view: GuessView | undefined,
) {
  const { plan, layout } = scene;
  const gok = plan.gok;
  const gokStart = plan.phases.gok.start;
  if (!gok || !view?.hints || t < gokStart || t >= plan.phases.flip.start) return;
  const out = t >= gok.lockAt ? 1 - clamp((t - gok.lockAt) / 0.25) : 1;
  const fade = clamp((t - gokStart) / 0.4) * out;
  if (fade <= 0.01) return;

  const k = layout.w / 500;
  const x = layout.cx + layout.w / 2 + 40 * k;
  const top = layout.cy - layout.h / 2 + 96 * k;
  const bottom = layout.cy + layout.h / 2 - 118 * k;
  const yAt = (fraction: number) => bottom - (bottom - top) * fraction;
  const bar = 10 * k;
  const gap = 2 * k;
  const current = view.value === null ? null : scaleFraction(view.value);

  ctx.save();
  ctx.globalAlpha = fade;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x - bar / 2, top, bar, bottom - top, bar / 2);
  ctx.clip();
  for (const zone of SCALE_ZONES) {
    const active = current !== null && current >= zone.from && (current < zone.to || zone.to === 1);
    ctx.fillStyle = rgba(SCALE_COLORS[zone.tone], active ? 0.95 : 0.45);
    const y0 = yAt(zone.to) + (zone.to < 1 ? gap / 2 : 0);
    const y1 = yAt(zone.from) - (zone.from > 0 ? gap / 2 : 0);
    ctx.fillRect(x - bar / 2, y0, bar, y1 - y0);
  }
  ctx.restore();

  // Streepjes per heel cijfer, met 1, 5,5 en 10 erbij.
  ctx.fillStyle = "rgba(255,255,255,0.32)";
  for (let n = 1; n <= 10; n++) {
    ctx.fillRect(x + bar / 2 + 4 * k, yAt(scaleFraction(n * 10)) - k, 9 * k, 2 * k);
  }
  ctx.font = `${21 * k}px ${assets.family}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(255,255,255,0.58)";
  for (const [label, tenths] of [
    ["10", 100],
    ["5,5", 55],
    ["1", 10],
  ] as const) {
    ctx.fillText(label, x + bar / 2 + 16 * k, yAt(scaleFraction(tenths)));
  }

  if (current !== null && view.value !== null) {
    const y = yAt(current);
    ctx.shadowColor = SCALE_COLORS[gradeTone(Math.round(view.value) / 10)];
    ctx.shadowBlur = 14 * unit;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(x - 17 * k, y - 3 * k, 34 * k, 6 * k, 3 * k);
    ctx.fill();
    // Een puntje naar de kaart toe.
    ctx.beginPath();
    ctx.moveTo(x - 17 * k, y - 7 * k);
    ctx.lineTo(x - 27 * k, y);
    ctx.lineTo(x - 17 * k, y + 7 * k);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Feature A: het gokmoment op de kaart. Groot in het midden een "?" met klein
 * "Wat heb je?" erboven; tijdens het gokken rolt daar de teller. Na de klik
 * bevriest het getal; bij de flip neemt drawGuessFlight het over.
 */
function drawGuessCounter(
  ctx: CanvasRenderingContext2D,
  scene: WalkoutScene,
  assets: WalkoutAssets,
  t: number,
  unit: number,
  pose: CardPose | null,
  view: GuessView | undefined,
) {
  const { plan } = scene;
  const gok = plan.gok;
  const gokStart = plan.phases.gok.start;
  if (!gok || !pose || t < gokStart || t >= plan.phases.flip.start) return;
  const spot = guessSpot(pose);
  const { k, cx, baseline, size } = spot;
  const locked = t >= gok.lockAt;
  const value = locked && gok.guess !== null ? Math.round(gok.guess * 10) : (view?.value ?? null);
  const pulse = plan.reduced ? 0 : pulseAt(t - gokStart);
  const glow = plan.fail ? "#c9d2e3" : cardGlow(scene.card);

  ctx.save();
  ctx.globalAlpha = clamp((t - gokStart) / 0.35) * pose.alpha;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const label = view?.label === undefined ? "WAT HEB JE?" : view.label;
  if (label) {
    ctx.fillStyle = "rgba(255,255,255,0.78)";
    ctx.font = `${28 * k}px ${assets.family}`;
    ctx.fillText(spaced(label), cx, spot.label);
  }

  if (view?.hints && !locked) {
    drawGuessArrows(ctx, spot, t, unit, plan.reduced, value, view.nudgeSince ?? null);
  }

  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = rgba(glow, 0.95);
  ctx.shadowBlur = (16 + 22 * pulse) * unit;
  if (value === null) {
    ctx.font = `${size * (1 + 0.06 * pulse)}px ${assets.family}`;
    ctx.fillText("?", cx, baseline);
  } else {
    let wobble = 0;
    if (!plan.reduced && !locked && view?.wobbleSince != null && Math.round(value) === 67) {
      const since = t - view.wobbleSince;
      wobble = Math.sin(since * 26) * 16 * k * Math.exp(-since / 0.35);
    }
    const flash = locked ? decay(t, gok.lockAt, 0.18) : 0;
    drawOdometer(ctx, value, cx, baseline + wobble, size * (1 + 0.07 * flash), assets.family);
    if (flash > 0.01) {
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = flash * 0.8;
      const r = size * 1.6;
      ctx.drawImage(glowSprite("#ffffff"), cx - r, baseline - size * 0.4 - r / 2, r * 2, r);
    }
  }
  ctx.restore();
}

/**
 * Feature A: vanaf de flip vliegt je gok uit het midden naar een plek naast de
 * rating (de komma valt weg), wordt een doorschijnend spookcijfer en klapt dan
 * tegen de echte rating. Precies goed: hij valt er precies over. Zie guessFlight.
 */
function drawGuessFlight(
  ctx: CanvasRenderingContext2D,
  scene: WalkoutScene,
  assets: WalkoutAssets,
  t: number,
  unit: number,
  pose: CardPose | null,
) {
  const { plan, card } = scene;
  const gok = plan.gok;
  const frame = guessFlight(plan, t);
  if (!gok || gok.guess === null || !frame || !pose) return;
  const spot = guessSpot(pose);
  const rating = ratingSpot(pose);
  const { k } = rating;
  const tenthsValue = Math.round(gok.guess * 10);
  const units = String(Math.floor(tenthsValue / 10));
  const tenths = String(tenthsValue % 10);
  const exact = plan.helderziende;

  ctx.save();
  ctx.font = `${rating.size}px ${assets.family}`;
  const realWidth =
    assets.ratingWidth === undefined
      ? ctx.measureText(card.ratingLabel).width
      : assets.ratingWidth * k;
  const waitLeft = rating.x + realWidth + 80 * k;
  const finalLeft = exact ? rating.x : rating.x + realWidth + 10 * k;

  let size: number;
  let left: number;
  let baseline: number;
  if (frame.path <= 1) {
    const p = frame.path;
    size = spot.size + (rating.size - spot.size) * p;
    ctx.font = `${size}px ${assets.family}`;
    const centerLeft = spot.cx - guessNumberWidth(ctx, units, size, frame.comma) / 2;
    left = centerLeft + (waitLeft - centerLeft) * p;
    baseline = spot.baseline + (rating.baseline - spot.baseline) * p;
  } else {
    size = rating.size;
    left = waitLeft + (finalLeft - waitLeft) * (frame.path - 1) + 22 * k * frame.bounce;
    baseline = rating.baseline;
  }
  ctx.font = `${size}px ${assets.family}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  const paintNumber = (paint: (text: string, x: number) => void) => {
    const unitsWidth = ctx.measureText(units).width;
    paint(units, left);
    if (frame.comma > 0.01) {
      const alpha = ctx.globalAlpha;
      ctx.globalAlpha = alpha * frame.comma;
      paint(",", left + unitsWidth + size * 0.02 * frame.comma);
      ctx.globalAlpha = alpha;
    }
    const commaWidth = (ctx.measureText(",").width + size * 0.04) * frame.comma;
    paint(tenths, left + unitsWidth + commaWidth);
  };

  // Nog de gloeiende teller…
  if (frame.ghost < 1 && frame.alpha > 0.01) {
    ctx.globalAlpha = frame.alpha * (1 - frame.ghost);
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = rgba(plan.fail ? "#c9d2e3" : cardGlow(card), 0.95);
    ctx.shadowBlur = 16 * unit;
    paintNumber((text, x) => ctx.fillText(text, x, baseline));
  }
  // …of al het spookcijfer: een doorschijnende echo in de inktkleur van de kaart
  // (leesbaar op lichte en donkere kaarten), met een paarse gokrand.
  if (frame.ghost > 0 && frame.alpha > 0.01) {
    ctx.globalAlpha = frame.alpha * frame.ghost;
    ctx.lineJoin = "round";
    ctx.lineWidth = 3 * k;
    ctx.strokeStyle = "rgba(168,85,247,0.9)";
    ctx.fillStyle = rgba(faceStyleFor(card).text, 0.5);
    paintNumber((text, x) => {
      ctx.shadowColor = "#a855f7";
      ctx.shadowBlur = 22 * unit;
      ctx.strokeText(text, x, baseline);
      ctx.shadowBlur = 0;
      ctx.fillText(text, x, baseline);
    });
  }

  // De klap: een lichtflits waar ze elkaar raken.
  const flash = plan.reduced ? 0 : decay(t, gok.impactAt, 0.2);
  if (flash > 0.01) {
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = flash;
    const r = 300 * k;
    const hitX = exact ? rating.x + realWidth / 2 : rating.x + realWidth + 5 * k;
    const hitY = rating.baseline - rating.size * 0.38;
    ctx.drawImage(glowSprite("#ffffff"), hitX - r / 2, hitY - r / 2, r, r);
  }
  ctx.restore();
}

/** Feature A: de camera zoomt tijdens het gokmoment heel langzaam in, en bij de flip terug. */
function cameraZoom(plan: WalkoutPlan, t: number): number {
  if (!plan.gok || plan.reduced) return 1;
  const start = plan.phases.gok.start;
  const flipStart = plan.phases.flip.start;
  if (t <= start) return 1;
  if (t < flipStart) return zoomAt(t - start);
  const zoom = zoomAt(flipStart - start);
  return 1 + (zoom - 1) * (1 - easeInOutCubic(clamp((t - flipStart) / 0.6)));
}

function drawGlitter(ctx: CanvasRenderingContext2D, scene: WalkoutScene, t: number) {
  if (scene.twinkles.length === 0 || t < scene.plan.revealAt) return;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const fade = clamp((t - scene.plan.revealAt) / 0.5);
  for (const twinkle of scene.twinkles) {
    const alpha = twinkleAlpha(twinkle, t) * fade;
    if (alpha < 0.02) continue;
    ctx.globalAlpha = alpha;
    const size = twinkle.size * 3;
    ctx.drawImage(
      sparkleSprite(twinkle.color),
      twinkle.x - size / 2,
      twinkle.y - size / 2,
      size,
      size,
    );
  }
  ctx.restore();
}

function drawConfetti(ctx: CanvasRenderingContext2D, scene: WalkoutScene, t: number) {
  for (const piece of scene.confetti) {
    const state = confettoAt(piece, t);
    if (!state) continue;
    ctx.save();
    ctx.globalAlpha = clamp(state.alpha);
    ctx.translate(state.x, state.y);
    ctx.rotate(state.angle);
    ctx.scale(1, state.flip);
    ctx.fillStyle = piece.color;
    ctx.fillRect(-piece.w / 2, -piece.h / 2, piece.w, piece.h);
    ctx.restore();
  }
}

function drawVignette(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const gradient = ctx.createRadialGradient(
    w / 2,
    h / 2,
    Math.min(w, h) * 0.35,
    w / 2,
    h / 2,
    Math.max(w, h) * 0.75,
  );
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(1, "rgba(0,0,0,0.62)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
}

/**
 * Feature A: precies goed gegokt. Paarse flits, een sterrenburst rond de
 * kaart en "HELDERZIENDE" als een schuine stempel. Weg vóór het eindscherm.
 */
function drawHelderziende(
  ctx: CanvasRenderingContext2D,
  scene: WalkoutScene,
  assets: WalkoutAssets,
  t: number,
  unit: number,
) {
  const { plan, stage } = scene;
  const start = plan.gok?.guess != null ? plan.gok.impactAt : plan.revealAt + 0.3;
  if (!plan.helderziende || t < start) return;
  const since = t - start;
  const fadeOut = 1 - clamp((t - (plan.restAt - 0.45)) / 0.45);
  if (fadeOut <= 0) return;

  const flash = 0.5 * decay(t, start, 0.28);
  if (flash > 0.005) {
    ctx.globalAlpha = flash;
    ctx.fillStyle = "#a855f7";
    ctx.fillRect(0, 0, stage.w, stage.h);
    ctx.globalAlpha = 1;
  }

  const center = cardCenter(scene, t);
  if (!plan.reduced) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const burst = easeOutCubic(clamp(since / 1.1));
    for (let i = 0; i < 26; i++) {
      // Gulden hoek: mooi verdeeld, zonder toeval.
      const angle = i * 2.399963;
      const reach = (220 + (i % 5) * 70) * burst + 40;
      const alpha = (1 - clamp((since - 0.5 - (i % 4) * 0.12) / 0.8)) * fadeOut;
      if (alpha <= 0.01) continue;
      const size = (26 + (i % 3) * 14) * (0.6 + 0.4 * Math.sin(since * 9 + i));
      ctx.globalAlpha = alpha;
      ctx.drawImage(
        sparkleSprite(i % 3 === 0 ? "#ffffff" : "#c084fc"),
        center.x + Math.cos(angle) * reach * 1.15 - size,
        center.y + Math.sin(angle) * reach - size,
        size * 2,
        size * 2,
      );
    }
    ctx.restore();
  }

  const appear = plan.reduced ? clamp(since / 0.2) : easeOutBack(clamp((since - 0.05) / 0.35));
  if (appear <= 0) return;
  const scale = plan.reduced ? 1 : 1.5 - 0.5 * appear;
  const word = "HELDERZIENDE";
  ctx.save();
  ctx.globalAlpha = clamp(appear) * fadeOut;
  ctx.translate(stage.w / 2, center.y);
  ctx.rotate(-0.1);
  ctx.scale(scale, scale);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  let size = 190;
  ctx.font = `${size}px ${assets.family}`;
  while (ctx.measureText(word).width > stage.w * 0.9 && size > 70) {
    size -= 6;
    ctx.font = `${size}px ${assets.family}`;
  }
  ctx.lineJoin = "round";
  ctx.lineWidth = size * 0.08;
  ctx.strokeStyle = "#3b0764";
  ctx.shadowColor = "#a855f7";
  ctx.shadowBlur = 50 * unit;
  ctx.strokeText(word, 0, 0);
  ctx.shadowBlur = 0;
  const fill = ctx.createLinearGradient(0, -size / 2, 0, size / 2);
  fill.addColorStop(0, "#ffffff");
  fill.addColorStop(1, "#e9d5ff");
  ctx.fillStyle = fill;
  ctx.fillText(word, 0, 0);
  ctx.restore();
}

// ——— Frames ——————————————————————————————————————————————————————————————

export function renderWalkoutFrame(
  { ctx, unit }: RenderTarget,
  scene: WalkoutScene,
  assets: WalkoutAssets,
  t: number,
  guess?: GuessView,
) {
  const { plan, stage } = scene;
  ctx.setTransform(unit, 0, 0, unit, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";

  const flares = phaseProgress(plan, "flares", t);
  const glow =
    (plan.fail ? 0.3 : 1) *
    (0.25 * Math.sin(Math.PI * clamp(flares)) + 0.55 * clamp((t - plan.revealAt) / 0.4));
  drawBackground(ctx, stage.w, stage.h, plan.fx.light, glow);

  const shake = shakeOffset(plan, t);
  ctx.translate(shake.x, shake.y);

  const card = cardCenter(scene, t);
  const zoom = cameraZoom(plan, t);
  if (zoom !== 1) {
    ctx.translate(card.x, card.y);
    ctx.scale(zoom, zoom);
    ctx.translate(-card.x, -card.y);
  }
  const intro = clamp(t / 0.8);
  const spotStrength = (plan.fail ? 0.18 : 0.32) * intro * (t > plan.restAt ? 0.7 : 1);
  const aimMix = clamp((t - plan.phases.silhouet.start) / 1.2);
  drawSpotlights(
    ctx,
    stage.w,
    stage.h,
    t,
    spotStrength,
    card,
    aimMix,
    plan.fail ? "#c9d2e3" : "#fff6e0",
    !plan.reduced,
  );

  drawFlares(ctx, scene, t);
  drawRays(ctx, scene, t, card.x, card.y);
  drawFireworks(ctx, scene, t);
  drawRevealText(ctx, scene, assets, t, unit);
  const pose = cardPose(scene, t);
  drawCard(ctx, scene, assets, t, pose);
  drawGuessScale(ctx, scene, assets, t, unit, guess);
  drawGuessCounter(ctx, scene, assets, t, unit, pose, guess);
  drawGuessFlight(ctx, scene, assets, t, unit, pose);
  drawGlitter(ctx, scene, t);
  drawConfetti(ctx, scene, t);

  ctx.setTransform(unit, 0, 0, unit, 0, 0);
  const flash = flashAlpha(plan, t);
  if (flash > 0.005) {
    ctx.globalAlpha = flash;
    ctx.fillStyle = plan.fail ? "#cfd8ea" : "#ffffff";
    ctx.fillRect(0, 0, stage.w, stage.h);
    ctx.globalAlpha = 1;
  }
  drawVignette(ctx, stage.w, stage.h);
  drawHelderziende(ctx, scene, assets, t, unit);

  // Intro: uit het zwart.
  const black = 1 - clamp(t / 0.45);
  if (black > 0) {
    ctx.globalAlpha = black;
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, stage.w, stage.h);
    ctx.globalAlpha = 1;
  }
}

// ——— Pack ————————————————————————————————————————————————————————————————

const PACK_W = 360;
const PACK_H = 520;

const PACK_COLORS: Readonly<Record<PackScene["tier"], [string, string, string]>> = {
  brons: ["#5a3418", "#c58753", "#2a1608"],
  zilver: ["#7f8996", "#eef2f6", "#18202b"],
  goud: ["#a8761c", "#ffe38c", "#2b1d03"],
  toty: ["#04081a", "#2a5bd8", "#ffe7a1"],
  icon: ["#f3e2b4", "#fffdf7", "#4f3a0c"],
};

/** Tekent het pack één keer op een eigen canvas. */
export function renderPackCanvas(
  tier: PackScene["tier"],
  count: number,
  family: string,
  pixelRatio: number,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(PACK_W * pixelRatio);
  canvas.height = Math.round(PACK_H * pixelRatio);
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.scale(pixelRatio, pixelRatio);
  const [from, to, ink] = PACK_COLORS[tier];

  const body = new Path2D();
  body.moveTo(0, 24);
  for (let x = 0; x <= PACK_W; x += 20) body.lineTo(x, x % 40 === 0 ? 24 : 12);
  body.lineTo(PACK_W, PACK_H - 24);
  for (let x = PACK_W; x >= 0; x -= 20) body.lineTo(x, x % 40 === 0 ? PACK_H - 24 : PACK_H - 12);
  body.closePath();

  ctx.save();
  ctx.clip(body);
  const gradient = ctx.createLinearGradient(0, 0, PACK_W, PACK_H);
  gradient.addColorStop(0, from);
  gradient.addColorStop(0.5, to);
  gradient.addColorStop(1, from);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, PACK_W, PACK_H);
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 6;
  for (let i = -PACK_H; i < PACK_W; i += 34) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + PACK_H, PACK_H);
    ctx.stroke();
  }
  const sheen = ctx.createLinearGradient(0, 0, PACK_W, PACK_H);
  sheen.addColorStop(0.3, "rgba(255,255,255,0)");
  sheen.addColorStop(0.45, "rgba(255,255,255,0.45)");
  sheen.addColorStop(0.6, "rgba(255,255,255,0)");
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, PACK_W, PACK_H);
  ctx.restore();

  ctx.fillStyle = ink;
  ctx.beginPath();
  const cx = PACK_W / 2;
  const cy = 210;
  const r = 78;
  ctx.moveTo(cx, cy - r);
  ctx.quadraticCurveTo(cx + r * 0.16, cy - r * 0.16, cx + r, cy);
  ctx.quadraticCurveTo(cx + r * 0.16, cy + r * 0.16, cx, cy + r);
  ctx.quadraticCurveTo(cx - r * 0.16, cy + r * 0.16, cx - r, cy);
  ctx.quadraticCurveTo(cx - r * 0.16, cy - r * 0.16, cx, cy - r);
  ctx.fill();

  ctx.textAlign = "center";
  ctx.font = `46px ${family}`;
  ctx.fillText("SUPERMAGISTER", cx, 360);
  ctx.font = `30px ${family}`;
  ctx.globalAlpha = 0.75;
  // Alleen de kleur verraadt de beste kaart; de tekst houdt het spannend.
  ctx.fillText(`${count} NIEUWE ${count === 1 ? "KAART" : "KAARTEN"}`, cx, 400);
  ctx.globalAlpha = 1;
  return canvas;
}

export function renderPackFrame(
  { ctx, unit }: RenderTarget,
  scene: PackScene,
  assets: PackAssets,
  t: number,
) {
  const { plan, stage } = scene;
  ctx.setTransform(unit, 0, 0, unit, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  const charge = clamp((t - 0.5) / (plan.tearAt - 0.5));
  drawBackground(ctx, stage.w, stage.h, plan.light, 0.2 + 0.5 * charge);

  const cx = stage.w / 2;
  const cy = stage.h * 0.46;
  drawSpotlights(
    ctx,
    stage.w,
    stage.h,
    t,
    0.3 * clamp(t / 0.6),
    { x: cx, y: cy },
    0.7,
    "#fff6e0",
    true,
  );

  const scale = Math.min((stage.w * 0.62) / PACK_W, (stage.h * 0.55) / PACK_H);
  const w = PACK_W * scale;
  const h = PACK_H * scale;
  const drop = clamp(t / 0.6);
  const bounce = drop < 1 ? 1 - Math.abs(Math.cos(drop * Math.PI * 1.5)) * (1 - drop) : 1;
  const y = -h + (cy + h) * easeOutCubic(drop) * (0.92 + 0.08 * bounce);
  const shake = 18 * charge * charge;
  const sx = t < plan.tearAt ? Math.sin(t * 61) * shake : 0;
  const sy = t < plan.tearAt ? Math.sin(t * 47 + 1) * shake * 0.5 : 0;

  // Gloed die de beste kaart verraadt.
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = 0.25 + 0.65 * charge + 0.1 * Math.sin(t * 9) * charge;
  ctx.drawImage(glowSprite(plan.light), cx - w * 1.3, y - h * 1.05, w * 2.6, h * 2.1);
  ctx.restore();

  const left = cx - w / 2 + sx;
  const top = y - h / 2 + sy;
  if (t < plan.tearAt) {
    ctx.drawImage(assets.pack, left, top, w, h);
  } else {
    const since = t - plan.tearAt;
    const split = h * 0.24;
    ctx.save();
    ctx.globalAlpha = clamp(1 - since / 0.5);
    ctx.translate(cx, top + split / 2 - since * 900);
    ctx.rotate(-since * 1.4);
    ctx.drawImage(
      assets.pack,
      0,
      0,
      assets.pack.width,
      assets.pack.height * 0.24,
      -w / 2,
      -split / 2,
      w,
      split,
    );
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = clamp(1 - since / 0.4);
    ctx.drawImage(
      assets.pack,
      0,
      assets.pack.height * 0.24,
      assets.pack.width,
      assets.pack.height * 0.76,
      left,
      top + split + since * since * 1400,
      w,
      h - split,
    );
    ctx.restore();

    // Licht dat uit het pack knalt.
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = clamp(1 - since / 0.6);
    const size = w * (1.5 + since * 5);
    ctx.drawImage(glowSprite(plan.light), cx - size / 2, top + split - size / 2, size, size);
    for (const spark of scene.sparks) {
      const state = sparkAt(spark, t);
      if (!state) continue;
      ctx.globalAlpha = state.alpha;
      ctx.drawImage(
        glowSprite(spark.color),
        state.x - 8,
        state.y + top + split - stage.h * 0.5 - 8,
        16,
        16,
      );
    }
    ctx.restore();
  }

  ctx.setTransform(unit, 0, 0, unit, 0, 0);
  const flash = decay(t, plan.tearAt, 0.18) * 0.9;
  if (flash > 0.005) {
    ctx.globalAlpha = flash;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, stage.w, stage.h);
  }
  // Uitfaden naar zwart, zodat de eerste walkout uit het donker begint.
  const out = clamp((t - (plan.duration - 0.45)) / 0.45);
  if (out > 0) {
    ctx.globalAlpha = out;
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, stage.w, stage.h);
  }
  ctx.globalAlpha = 1;
  drawVignette(ctx, stage.w, stage.h);
}
