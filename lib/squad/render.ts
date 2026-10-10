import {
  cardOutline,
  drawSubjectIcon,
  ellipsize,
  ensureCardFont,
  faceStyleFor,
  fitFont,
  rgba,
  spaced,
} from "@/lib/cards/draw";
import { cardTierLabel, type CardData } from "@/lib/cards/model";
import { renderSoundtrack } from "@/lib/video/audio";
import { encodeVideo, type VideoResult } from "@/lib/video/encode";
import { VIDEO_FORMATS, VIDEO_FPS, type VideoFormat } from "@/lib/video/formats";
import type { SoundEvent } from "@/lib/walkout/plan";
import type { Stage } from "@/lib/walkout/particles";
import { stageFor } from "@/lib/walkout/scene";
import { drawWatermark } from "@/lib/walkout/video-render";
import type { LinkStrength, SquadEvaluation } from "./chemistry";
import { clubInitials, CREST_INNER, CREST_PATHS, type Club } from "./club";
import type { SquadPlayer } from "./players";

/**
 * Jouw Elftal als afbeelding en als korte video: het veld met de kaarten, de
 * chemie-lijnen, de squad-rating, de teamchemie, je club en het watermerk.
 * Eén tekenfunctie van de tijd t (zoals de walkout): de afbeelding is het
 * laatste beeld, de video tekent hem beeld voor beeld. Eerst vliegen de
 * kaarten één voor één het veld op, dan verschijnen de lijnen en tikt de
 * rating op.
 *
 * Privacy: standaard alleen tiers en vakken, geen cijfers en geen naam.
 */

export interface SquadPictureOptions {
  format: VideoFormat;
  /** Ratings (cijfers × 10) en de squad-rating tonen. */
  showRatings: boolean;
  /** Je voornaam onderaan. */
  showName: boolean;
}

export interface SquadPictureData {
  evaluation: SquadEvaluation;
  /** De kaart per slot-id. */
  cards: ReadonlyMap<string, CardData>;
  club: Club;
  squadName: string;
  ownerName: string;
  /** Twee themakleuren (hex) voor het wapen en de stadionlampen. */
  accent: readonly [string, string];
}

// ——— Tijdlijn ——————————————————————————————————————————————————————————————

const INTRO = 0.6;
const CARD_GAP = 0.28;
const CARD_FLIGHT = 0.45;
const LINES_TIME = 0.9;
const COUNT_TIME = 1.4;
const HOLD = 1.8;

export interface SquadTimeline {
  cardStart: (index: number) => number;
  linesStart: number;
  countStart: number;
  countEnd: number;
  end: number;
}

/** De tijdlijn van de video bij `count` kaarten op het veld. Pure functie, los te testen. */
export function squadTimeline(count: number): SquadTimeline {
  const cardStart = (index: number) => INTRO + index * CARD_GAP;
  const lastLanded = count > 0 ? cardStart(count - 1) + CARD_FLIGHT : INTRO;
  const linesStart = lastLanded + 0.15;
  const countStart = linesStart + LINES_TIME * 0.6;
  const countEnd = countStart + COUNT_TIME;
  return { cardStart, linesStart, countStart, countEnd, end: countEnd + HOLD };
}

export function squadVideoSounds(timeline: SquadTimeline, count: number): SoundEvent[] {
  const sounds: SoundEvent[] = [{ at: 0, cue: "stadion", strength: 0.5, duration: timeline.end }];
  for (let i = 0; i < count; i++)
    sounds.push({ at: timeline.cardStart(i), cue: "whoosh", pan: ((i % 3) - 1) * 0.5 });
  sounds.push({ at: timeline.linesStart, cue: "glans" });
  sounds.push({ at: timeline.countEnd, cue: "boem", strength: 0.8 });
  sounds.push({ at: timeline.countEnd, cue: "juichen", strength: 0.6, duration: 2.4 });
  return sounds;
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOut = (v: number) => 1 - (1 - v) ** 3;

// ——— Tekenen ——————————————————————————————————————————————————————————————

const LINK_COLORS: Readonly<Record<LinkStrength, string>> = {
  groen: "#4fe3a3",
  oranje: "#ffb547",
  rood: "#ff6b81",
};
// Net als op het scherm: groen doorgetrokken, oranje streepjes, rood stipjes.
const LINK_DASH: Readonly<Record<LinkStrength, number[]>> = {
  groen: [],
  oranje: [26, 16],
  rood: [0.1, 18],
};

interface Layout {
  pitch: { x: number; y: number; w: number; h: number };
  header: { y: number; h: number };
  cardW: number;
}

function layoutFor(stage: Stage): Layout {
  const portrait = stage.h > stage.w * 1.2;
  const headerH = portrait ? 230 : 150;
  const footer = portrait ? 210 : 120;
  const top = portrait ? 110 : 40;
  const availH = stage.h - top - headerH - footer;
  const availW = stage.w - (portrait ? 70 : 280);
  const ratio = 68 / 92;
  const w = Math.min(availW, availH * ratio);
  const h = w / ratio;
  return {
    header: { y: top, h: headerH },
    pitch: { x: (stage.w - w) / 2, y: top + headerH + (availH - h) / 2, w, h },
    cardW: w * 0.15,
  };
}

function drawBackdrop(
  ctx: CanvasRenderingContext2D,
  stage: Stage,
  accent: readonly [string, string],
) {
  ctx.fillStyle = "#05060d";
  ctx.fillRect(0, 0, stage.w, stage.h);
  const glow = ctx.createRadialGradient(
    stage.w / 2,
    -stage.h * 0.1,
    0,
    stage.w / 2,
    -stage.h * 0.1,
    stage.h * 0.9,
  );
  glow.addColorStop(0, rgba(accent[0], 0.35));
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, stage.w, stage.h);
}

function drawPitch(ctx: CanvasRenderingContext2D, p: Layout["pitch"], alpha: number) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.roundRect(p.x, p.y, p.w, p.h, 34);
  const grass = ctx.createLinearGradient(0, p.y, 0, p.y + p.h);
  grass.addColorStop(0, "#0f4a2e");
  grass.addColorStop(0.55, "#0b3522");
  grass.addColorStop(1, "#082618");
  ctx.fillStyle = grass;
  ctx.fill();
  ctx.clip();
  for (let i = 0; i < 12; i += 2) {
    ctx.fillStyle = "rgba(255,255,255,0.035)";
    ctx.fillRect(p.x, p.y + (p.h / 12) * i, p.w, p.h / 12);
  }
  // Lijnen in een vak van 68 × 100, net als op het scherm.
  const sx = p.w / 68;
  const sy = p.h / 100;
  ctx.translate(p.x, p.y);
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 3;
  const rect = (x: number, y: number, w: number, h: number) =>
    ctx.strokeRect(x * sx, y * sy, w * sx, h * sy);
  rect(3, 3, 62, 94);
  rect(15, 3, 38, 15);
  rect(25, 3, 18, 5.5);
  rect(15, 82, 38, 15);
  rect(25, 91.5, 18, 5.5);
  ctx.beginPath();
  ctx.moveTo(3 * sx, 50 * sy);
  ctx.lineTo(65 * sx, 50 * sy);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(34 * sx, 50 * sy, 8.5 * sx, 6.2 * sy, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

const chemistryColor = (value: number) =>
  value >= 7 ? "#4fe3a3" : value >= 4 ? "#ffb547" : "#ff6b81";

function drawMiniCard(
  ctx: CanvasRenderingContext2D,
  card: CardData,
  player: SquadPlayer,
  cx: number,
  cy: number,
  w: number,
  info: {
    position: string;
    chemistry: number | null;
    captain: boolean;
    showRating: boolean;
    family: string;
  },
) {
  const style = faceStyleFor(card);
  const h = w * 1.44;
  const s = w / 500;
  ctx.save();
  ctx.translate(cx - w / 2, cy - h / 2);
  ctx.save();
  ctx.scale(s, s);
  const outline = cardOutline();
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 18;
  const face = ctx.createLinearGradient(0, 0, 500, 720);
  style.stops.forEach((stop, i) => face.addColorStop(i / (style.stops.length - 1), stop));
  ctx.fillStyle = face;
  ctx.fill(outline);
  ctx.shadowColor = "transparent";
  ctx.clip(outline);
  const tint = ctx.createRadialGradient(350, 320, 0, 350, 320, 300);
  tint.addColorStop(0, rgba(card.color, 0.35));
  tint.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, 500, 720);

  // Dezelfde rating als op het scherm: bij een beoordeling de vaste rating, met "G" erbij.
  ctx.fillStyle = style.text;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  if (info.showRating) {
    ctx.font = `150px ${info.family}`;
    ctx.fillText(String(player.rating), 125, 230);
    if (player.judged) {
      ctx.font = `64px ${info.family}`;
      ctx.textAlign = "left";
      ctx.fillText(player.judged, 215, 150);
      ctx.textAlign = "center";
    }
  }
  ctx.font = `${info.showRating ? 82 : 110}px ${info.family}`;
  ctx.fillText(info.position, 125, info.showRating ? 320 : 250);
  drawSubjectIcon(ctx, card.icon, 230, 150, 210, style.text, 2.2);
  const name = player.shortName.toUpperCase();
  fitFont(ctx, name, info.family, 420, 120, 60);
  ctx.fillText(ellipsize(ctx, name, 430), 250, 540);
  ctx.globalAlpha = 0.7;
  ctx.font = `58px ${info.family}`;
  ctx.fillText(spaced(cardTierLabel(card)), 250, 625);
  ctx.restore();

  if (info.captain) {
    ctx.fillStyle = "#ffd25c";
    ctx.beginPath();
    ctx.roundRect(w * 0.72, h * 0.02, w * 0.3, w * 0.22, w * 0.06);
    ctx.fill();
    ctx.fillStyle = "#2b1d03";
    ctx.font = `${w * 0.17}px ${info.family}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("C", w * 0.87, h * 0.02 + w * 0.12);
  }

  // Chemie rechtsonder op de kaart, als bolletje (net als op het scherm).
  if (info.chemistry !== null) {
    const r = w * 0.15;
    const x = w - r * 1.05;
    const y = h - r * 1.05;
    ctx.fillStyle = chemistryColor(info.chemistry);
    ctx.strokeStyle = "rgba(0,0,0,0.45)";
    ctx.lineWidth = w * 0.015;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#0b0a1a";
    ctx.font = `${w * 0.19}px ${info.family}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(info.chemistry), x, y + w * 0.01);
  }
  ctx.restore();
}

function drawCrest(
  ctx: CanvasRenderingContext2D,
  club: Club,
  x: number,
  y: number,
  size: number,
  accent: readonly [string, string],
  family: string,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 100, size / 100);
  const fill = ctx.createLinearGradient(0, 0, 100, 120);
  fill.addColorStop(0, accent[0]);
  fill.addColorStop(1, accent[1]);
  ctx.fillStyle = fill;
  ctx.fill(new Path2D(CREST_PATHS[club.crest]));
  ctx.strokeStyle = "rgba(255,255,255,0.75)";
  ctx.lineWidth = 3;
  ctx.stroke(new Path2D(CREST_INNER[club.crest]));
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const initials = clubInitials(club.name);
  ctx.font = `${initials.length > 3 ? 22 : 30}px ${family}`;
  ctx.fillText(initials, 50, 64);
  ctx.restore();
}

function drawHeader(
  ctx: CanvasRenderingContext2D,
  stage: Stage,
  layout: Layout,
  data: SquadPictureData,
  options: SquadPictureOptions,
  family: string,
  count: number,
) {
  const { y, h } = layout.header;
  const left = layout.pitch.x;
  const right = layout.pitch.x + layout.pitch.w;
  const crest = h * 0.62;
  drawCrest(ctx, data.club, left, y + (h - crest * 1.2) / 2, crest, data.accent, family);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#fff";
  const textX = left + crest + 24;
  const maxW = right - textX - h * 1.45;
  fitFont(ctx, data.club.name.toUpperCase(), family, maxW, h * 0.3, h * 0.16);
  ctx.fillText(ellipsize(ctx, data.club.name.toUpperCase(), maxW), textX, y + h * 0.48);
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.font = `${h * 0.15}px ${family}`;
  const by = options.showName && data.ownerName ? ` · ${data.ownerName}` : "";
  const subtitle = `${data.squadName} · ${data.evaluation.formation.id}${by}`.toUpperCase();
  ctx.fillText(ellipsize(ctx, spaced(subtitle), maxW), textX, y + h * 0.7);

  // Rating en chemie rechts, groot (de rating alleen als je dat wilt).
  ctx.textAlign = "right";
  // Niet compleet: geen squad-rating (net als op het scherm).
  const rating =
    options.showRatings && data.evaluation.complete
      ? String(Math.round(data.evaluation.rating * count))
      : "–";
  const chemistry = String(Math.round(data.evaluation.chemistry * count));
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = `${h * 0.13}px ${family}`;
  ctx.fillText(spaced("RATING"), right - h * 0.72, y + h * 0.3);
  ctx.fillText(spaced("CHEMIE"), right, y + h * 0.3);
  ctx.fillStyle = "#fff";
  ctx.font = `${h * 0.48}px ${family}`;
  ctx.fillText(rating, right - h * 0.72, y + h * 0.78);
  ctx.fillText(chemistry, right, y + h * 0.78);
}

/** Tekent het beeld op tijd t (Infinity = het eindbeeld, voor de afbeelding). */
export function drawSquadFrame(
  ctx: CanvasRenderingContext2D,
  stage: Stage,
  data: SquadPictureData,
  options: SquadPictureOptions,
  family: string,
  t: number,
) {
  const layout = layoutFor(stage);
  const { pitch, cardW } = layout;
  const placed = data.evaluation.slots.filter((s) => s.player && data.cards.has(s.slot.id));
  // Volgorde van opkomen: keeper eerst, dan van achter naar voren.
  placed.sort((a, b) => b.slot.y - a.slot.y || a.slot.x - b.slot.x);
  const timeline = squadTimeline(placed.length);

  drawBackdrop(ctx, stage, data.accent);
  drawPitch(ctx, pitch, easeOut(clamp01(t / INTRO)));

  const at = (slotId: string) => {
    const slot = data.evaluation.formation.slots.find((s) => s.id === slotId)!;
    return { x: pitch.x + (slot.x / 100) * pitch.w, y: pitch.y + (slot.y / 100) * pitch.h };
  };

  // Chemie-lijnen: groeien na het opkomen.
  const lines = clamp01((t - timeline.linesStart) / LINES_TIME);
  if (lines > 0) {
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineWidth = 9;
    for (const link of data.evaluation.links) {
      if (!link.strength) continue;
      const a = at(link.a);
      const b = at(link.b);
      ctx.strokeStyle = LINK_COLORS[link.strength];
      ctx.setLineDash(LINK_DASH[link.strength]);
      ctx.globalAlpha = 0.9 * lines;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(a.x + (b.x - a.x) * easeOut(lines), a.y + (b.y - a.y) * easeOut(lines));
      ctx.stroke();
    }
    ctx.restore();
  }

  // De kaarten vliegen één voor één van onderen het veld op.
  placed.forEach((result, index) => {
    const progress = clamp01((t - timeline.cardStart(index)) / CARD_FLIGHT);
    if (progress <= 0) return;
    const card = data.cards.get(result.slot.id)!;
    const player = result.player!;
    const end = at(result.slot.id);
    const startY = stage.h + cardW * 1.6;
    const e = easeOut(progress);
    const x = stage.w / 2 + (end.x - stage.w / 2) * e;
    const y = startY + (end.y - startY) * e;
    const scale = 1.6 - 0.6 * e;
    ctx.save();
    ctx.globalAlpha = clamp01(progress * 2);
    drawMiniCard(ctx, card, player, x, y, cardW * scale, {
      position: result.slot.position,
      chemistry: lines > 0 ? result.chemistry : null,
      captain: result.captain,
      showRating: options.showRatings,
      family,
    });
    ctx.restore();
  });

  const count = easeOut(clamp01((t - timeline.countStart) / COUNT_TIME));
  drawHeader(ctx, stage, layout, data, options, family, count);

  drawWatermark(ctx, stage, family);
}

function newCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Geen canvas");
  return { canvas, ctx };
}

/** De afbeelding (het eindbeeld), eventueel kleiner voor een voorproefje. */
export async function renderSquadPicture(
  data: SquadPictureData,
  options: SquadPictureOptions,
  scale = 1,
): Promise<HTMLCanvasElement> {
  const family = await ensureCardFont();
  const format = VIDEO_FORMATS[options.format];
  const { canvas, ctx } = newCanvas(
    Math.round(format.width * scale),
    Math.round(format.height * scale),
  );
  const { stage, unit } = stageFor(canvas.width, canvas.height);
  ctx.setTransform(unit, 0, 0, unit, 0, 0);
  drawSquadFrame(ctx, stage, data, options, family, Infinity);
  return canvas;
}

export interface SquadVideo extends VideoResult {
  file: File;
  duration: number;
}

export async function renderSquadVideo(
  data: SquadPictureData,
  options: SquadPictureOptions,
  { onProgress, signal }: { onProgress?: (fraction: number) => void; signal?: AbortSignal } = {},
): Promise<SquadVideo> {
  const family = await ensureCardFont();
  const format = VIDEO_FORMATS[options.format];
  const count = data.evaluation.slots.filter((s) => s.player && data.cards.has(s.slot.id)).length;
  const timeline = squadTimeline(count);
  const { stage, unit } = stageFor(format.width, format.height);
  onProgress?.(0.01);
  const audio = await renderSoundtrack(squadVideoSounds(timeline, count), {
    duration: timeline.end,
    tier: "goud",
    fadeOut: 0.8,
  }).catch(() => null);
  const result = await encodeVideo({
    width: format.width,
    height: format.height,
    fps: VIDEO_FPS,
    duration: timeline.end,
    draw: (ctx, t) => {
      ctx.setTransform(unit, 0, 0, unit, 0, 0);
      drawSquadFrame(ctx, stage, data, options, family, t);
    },
    audio,
    onProgress,
    signal,
  });
  const slug =
    data.club.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "elftal";
  const file = new File([result.blob], `supermagister-elftal-${slug}.${result.extension}`, {
    type: result.mimeType,
  });
  return { ...result, file, duration: timeline.end };
}
