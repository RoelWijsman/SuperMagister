import { VIDEO_TEXT } from "@/content/copy";
import { LOGO_DOT, LOGO_RADIUS, LOGO_SIZE, LOGO_SPARK_PATH } from "@/lib/brand";
import { cardGlow, ensureCardFont, fitFont, renderCardCanvas, spaced } from "@/lib/cards/draw";
import type { CardData } from "@/lib/cards/model";
import { DEFAULT_THEME, getPreset } from "@/lib/theme/themes";
import { renderSoundtrack } from "@/lib/video/audio";
import { encodeVideo, type VideoResult } from "@/lib/video/encode";
import { VIDEO_FORMATS, VIDEO_FPS, type VideoFormat } from "@/lib/video/formats";
import type { Stage } from "./particles";
import { renderWalkoutFrame, type WalkoutAssets } from "./render";
import { createWalkoutScene, stageFor, type WalkoutScene } from "./scene";
import {
  mysteryCaption,
  videoFileName,
  walkoutVideoSounds,
  walkoutVideoTimeline,
  type WalkoutVideoTimeline,
} from "./video";

/**
 * Feature B: de walkout als video. Precies dezelfde tekencode als op het
 * scherm (renderWalkoutFrame), met daaroverheen alleen het watermerk en, in
 * mysterie-modus, "Raad mijn cijfer." onder het vraagteken.
 */

export interface WalkoutVideoSource {
  card: CardData;
  /** Je gok, of null als je niet gokte. */
  guess: number | null;
}

export interface WalkoutVideoOptions {
  format: VideoFormat;
  /** Stopt op het "?" van het gokmoment: raad mijn cijfer. */
  mystery: boolean;
  /** Tekst op de sticker over je cijfer, of null om het cijfer te laten zien. */
  sticker: string | null;
  showName: boolean;
  /** De kleine regel onder "Raad mijn cijfer." (een variant uit copy.ts). */
  stake: string;
}

/** Wat linksboven staat als het cijfer achter de sticker zit (kaarteenheden, zie drawSticker). */
const STICKER_WIDTH = 134;

interface PreparedVideo {
  timeline: WalkoutVideoTimeline;
  width: number;
  height: number;
  draw: (ctx: CanvasRenderingContext2D, t: number) => void;
}

/** De kaart blijft in beeld staan (geen eindscherm ernaast); in mysterie iets hoger, voor de tekst. */
function videoScene(card: CardData, timeline: WalkoutVideoTimeline, stage: Stage): WalkoutScene {
  const scene = createWalkoutScene(card, timeline.plan, stage);
  const portrait = stage.h > stage.w;
  let { cy, h, w } = scene.layout;
  if (timeline.mystery) {
    cy = stage.h * (portrait ? 0.41 : 0.4);
    if (!portrait) {
      h = Math.min(h, stage.h * 0.56);
      w = h * (scene.layout.w / scene.layout.h);
    }
  }
  return {
    ...scene,
    layout: { ...scene.layout, cy, h, w, cxRest: scene.layout.cx, cyRest: cy, restScale: 1 },
  };
}

function drawMysteryCaption(
  ctx: CanvasRenderingContext2D,
  scene: WalkoutScene,
  timeline: WalkoutVideoTimeline,
  t: number,
  family: string,
  stake: string,
) {
  const { title, line } = mysteryCaption(timeline, t);
  if (title <= 0) return;
  const { layout, stage, card } = scene;
  const portrait = stage.h > stage.w;
  const titleSize = portrait ? 118 : 80;
  const lineSize = portrait ? 46 : 32;
  // Onder de kaart, die tijdens het gokmoment een paar procent inzoomt.
  const titleY = layout.cy + layout.h * 0.55 + titleSize * 1.05;

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.globalAlpha = title;
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = card.isFail ? "#c9d2e3" : cardGlow(card);
  ctx.shadowBlur = 30;
  fitFont(ctx, VIDEO_TEXT.raad, family, stage.w * 0.88, titleSize, titleSize * 0.6);
  ctx.fillText(VIDEO_TEXT.raad, stage.w / 2, titleY + (1 - title) * 22);
  if (line > 0) {
    ctx.globalAlpha = line;
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(255,255,255,0.72)";
    fitFont(ctx, stake, family, stage.w * 0.86, lineSize, lineSize * 0.6);
    ctx.fillText(stake, stage.w / 2, titleY + lineSize * 1.55 + (1 - line) * 14);
  }
  ctx.restore();
}

const WATERMARK = (() => {
  const theme = getPreset(DEFAULT_THEME);
  return {
    from: theme.accent,
    to: theme.accent2,
    ink: theme.onAccent === "dark" ? "#0b0a1a" : "#ffffff",
  };
})();

/** Klein SuperMagister-logo onderaan, met de disclaimer eronder. */
export function drawWatermark(ctx: CanvasRenderingContext2D, stage: Stage, family: string) {
  const portrait = stage.h > stage.w;
  const tile = portrait ? 46 : 38;
  const y = stage.h - (portrait ? 110 : 74);
  const name = spaced("SUPERMAGISTER");
  ctx.save();
  ctx.font = `${tile * 0.66}px ${family}`;
  const gap = tile * 0.32;
  const left = (stage.w - (tile + gap + ctx.measureText(name).width)) / 2;
  ctx.globalAlpha = 0.82;

  ctx.save();
  ctx.translate(left, y - tile / 2);
  ctx.scale(tile / LOGO_SIZE, tile / LOGO_SIZE);
  const gradient = ctx.createLinearGradient(0, 0, LOGO_SIZE, LOGO_SIZE);
  gradient.addColorStop(0, WATERMARK.from);
  gradient.addColorStop(1, WATERMARK.to);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.roundRect(0, 0, LOGO_SIZE, LOGO_SIZE, LOGO_RADIUS);
  ctx.fill();
  ctx.fillStyle = WATERMARK.ink;
  ctx.fill(new Path2D(LOGO_SPARK_PATH));
  ctx.beginPath();
  ctx.arc(LOGO_DOT.cx, LOGO_DOT.cy, LOGO_DOT.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText(name, left + tile + gap, y + tile * 0.04);
  ctx.textAlign = "center";
  ctx.globalAlpha = 0.45;
  ctx.font = `${tile * 0.4}px ${family}`;
  ctx.fillText(spaced("ONOFFICIEEL · NIET VAN MAGISTER"), stage.w / 2, y + tile * 0.98);
  ctx.restore();
}

/** Bouwt de tijdlijn, de kaartbeelden en de tekenfunctie, op `scale` × het videoformaat. */
export async function prepareWalkoutVideo(
  source: WalkoutVideoSource,
  options: WalkoutVideoOptions,
  scale = 1,
): Promise<PreparedVideo> {
  const family = await ensureCardFont();
  const { card } = source;
  const format = VIDEO_FORMATS[options.format];
  const width = Math.round(format.width * scale);
  const height = Math.round(format.height * scale);
  const timeline = walkoutVideoTimeline({
    tier: card.tier,
    fail: card.isFail,
    actual: card.grade.kind === "numeric" ? card.grade.value : null,
    guess: source.guess,
    mystery: options.mystery,
    hidden: options.sticker !== null,
  });
  const { stage, unit } = stageFor(width, height);
  const scene = videoScene(card, timeline, stage);
  // Iets groter dan op het scherm: de kaart zoomt in en springt bij de onthulling.
  const faceWidth = Math.min(1400, scene.layout.w * unit * 1.3);
  const assets: WalkoutAssets = {
    face: renderCardCanvas(card, faceWidth, {
      pixelRatio: 1,
      options: { sticker: options.sticker, hideName: !options.showName },
    }),
    silhouette: renderCardCanvas(card, faceWidth, { pixelRatio: 1, side: "silhouette" }),
    family,
    ratingWidth: options.sticker === null ? undefined : STICKER_WIDTH,
  };

  const draw = (ctx: CanvasRenderingContext2D, t: number) => {
    renderWalkoutFrame({ ctx, unit }, scene, assets, t, timeline.guessAt(t));
    ctx.setTransform(unit, 0, 0, unit, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    drawMysteryCaption(ctx, scene, timeline, t, family, options.stake);
    drawWatermark(ctx, stage, family);
  };
  return { timeline, width, height, draw };
}

/** Eén stilstaand beeld uit de video, als voorproefje bij de instellingen. */
export async function renderWalkoutPoster(
  source: WalkoutVideoSource,
  options: WalkoutVideoOptions,
  width: number,
): Promise<HTMLCanvasElement> {
  const prepared = await prepareWalkoutVideo(
    source,
    options,
    width / VIDEO_FORMATS[options.format].width,
  );
  const canvas = document.createElement("canvas");
  canvas.width = prepared.width;
  canvas.height = prepared.height;
  const ctx = canvas.getContext("2d");
  if (ctx) prepared.draw(ctx, prepared.timeline.posterAt);
  return canvas;
}

export interface WalkoutVideo extends VideoResult {
  file: File;
  /** Lengte in seconden. */
  duration: number;
}

/** Maakt de video: eerst het geluid (offline), dan beeld voor beeld. */
export async function renderWalkoutVideo(
  source: WalkoutVideoSource,
  options: WalkoutVideoOptions,
  { onProgress, signal }: { onProgress?: (fraction: number) => void; signal?: AbortSignal } = {},
): Promise<WalkoutVideo> {
  const prepared = await prepareWalkoutVideo(source, options);
  const { timeline } = prepared;
  const { plan } = timeline;
  const { card } = source;
  const peak = plan.revealAt - plan.phases.flip.start;
  onProgress?.(0.01);
  const audio = await renderSoundtrack(walkoutVideoSounds(plan, timeline.end), {
    duration: timeline.end,
    tier: card.tier,
    peakAfter: Number.isFinite(peak) ? peak : undefined,
    // Een cliffhanger stopt abrupt; een gewone video sterft rustig uit.
    fadeOut: timeline.mystery ? 0.2 : 0.8,
  }).catch(() => null);
  if (signal?.aborted) throw new DOMException("Video maken afgebroken", "AbortError");

  const result = await encodeVideo({
    width: prepared.width,
    height: prepared.height,
    fps: VIDEO_FPS,
    duration: timeline.end,
    draw: prepared.draw,
    audio,
    signal,
    onProgress: (fraction) => onProgress?.(0.04 + 0.96 * fraction),
  });
  const name = videoFileName(
    { subjectCode: card.subjectCode, date: card.grade.date },
    options.mystery,
    result.extension,
  );
  return {
    ...result,
    file: new File([result.blob], name, { type: result.mimeType }),
    duration: timeline.end,
  };
}
