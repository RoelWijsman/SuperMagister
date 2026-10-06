import { VARIANT_LABELS } from "@/lib/calc/cards";
import type { CardTier } from "@/lib/calc/tiers";
import { hexToRgb } from "@/lib/color";
import { formatShortDate, parseISODate } from "@/lib/date";
import { createRandom } from "@/lib/random";
import { hashString } from "@/lib/subjects/palette";
import { iconNodeToPaths, SUBJECT_ICON_NODES, type IconPath } from "./icon-paths";
import { cardLook, cardTierLabel, type CardData } from "./model";

/**
 * De verzamelkaart, getekend op canvas. Dit is de enige plek waar een kaart
 * getekend wordt: in de walkout, de collectie, de deelafbeelding en (feature
 * B) de video. Ontwerpmaat 500 × 720; alles schaalt mee.
 */
export const CARD_W = 500;
export const CARD_H = 720;
export const CARD_RATIO = CARD_H / CARD_W;

type FaceStyleKey = CardTier | "inform";

interface FaceStyle {
  stops: readonly string[];
  text: string;
  sub: string;
  frame: string;
  glow: string;
  sheen: number;
  pattern: "lines" | "glitter" | "rays" | "gold";
  badgeBg: string;
  badgeText: string;
}

const FACE: Readonly<Record<FaceStyleKey, FaceStyle>> = {
  brons: {
    stops: ["#4a2a12", "#a8683a", "#d9a271", "#7a4520"],
    text: "#2a1608",
    sub: "rgba(42,22,8,0.72)",
    frame: "#f3c29a",
    glow: "#d08a5c",
    sheen: 0.28,
    pattern: "lines",
    badgeBg: "#2a1608",
    badgeText: "#f3c29a",
  },
  zilver: {
    stops: ["#7f8996", "#d9e0e7", "#f7f9fb", "#a3adb8"],
    text: "#18202b",
    sub: "rgba(24,32,43,0.7)",
    frame: "#ffffff",
    glow: "#dfe5ef",
    sheen: 0.45,
    pattern: "lines",
    badgeBg: "#18202b",
    badgeText: "#ffffff",
  },
  goud: {
    stops: ["#8a5f14", "#e9c25a", "#fff0b3", "#c8952a"],
    text: "#2b1d03",
    sub: "rgba(43,29,3,0.72)",
    frame: "#fff6cf",
    glow: "#ffcf4a",
    sheen: 0.5,
    pattern: "lines",
    badgeBg: "#2b1d03",
    badgeText: "#ffe08a",
  },
  toty: {
    stops: ["#02040b", "#0a1c56", "#1d47b8", "#04081a"],
    text: "#ffe7a1",
    sub: "rgba(255,231,161,0.78)",
    frame: "#6f9bff",
    glow: "#3d7bff",
    sheen: 0.22,
    pattern: "glitter",
    badgeBg: "#ffe7a1",
    badgeText: "#0a1c56",
  },
  icon: {
    stops: ["#fffaf0", "#f0dca8", "#fffdf7", "#e2c886"],
    text: "#4f3a0c",
    sub: "rgba(79,58,12,0.72)",
    frame: "#c99a33",
    glow: "#fff1c2",
    sheen: 0.55,
    pattern: "rays",
    badgeBg: "#4f3a0c",
    badgeText: "#fff1c2",
  },
  inform: {
    stops: ["#050506", "#1b1b21", "#0b0b0e", "#22222a"],
    text: "#f4d675",
    sub: "rgba(244,214,117,0.75)",
    frame: "#d4af37",
    glow: "#ffd25c",
    sheen: 0.12,
    pattern: "gold",
    badgeBg: "#d4af37",
    badgeText: "#0b0b0e",
  },
};

export function faceStyleFor(card: Pick<CardData, "tier" | "primaryVariant">): FaceStyle {
  return FACE[cardLook(card)];
}

/** Gloedkleur rond een kaart in de walkout en de collectie. */
export function cardGlow(card: Pick<CardData, "tier" | "primaryVariant">): string {
  return faceStyleFor(card).glow;
}

export function rgba(hex: string, alpha: number): string {
  try {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r},${g},${b},${alpha})`;
  } catch {
    return hex;
  }
}

/** De vorm van de kaart: een schild met een inkeping bovenin en een punt onderaan. */
export function cardOutline(): Path2D {
  const path = new Path2D();
  path.moveTo(46, 0);
  path.lineTo(196, 0);
  path.lineTo(214, 12);
  path.lineTo(286, 12);
  path.lineTo(304, 0);
  path.lineTo(454, 0);
  path.quadraticCurveTo(500, 0, 500, 46);
  path.lineTo(500, 628);
  path.quadraticCurveTo(500, 656, 476, 670);
  path.lineTo(274, 712);
  path.quadraticCurveTo(250, 720, 226, 712);
  path.lineTo(24, 670);
  path.quadraticCurveTo(0, 656, 0, 628);
  path.lineTo(0, 46);
  path.quadraticCurveTo(0, 0, 46, 0);
  path.closePath();
  return path;
}

/** Hetzelfde schild als SVG-pad (voor CSS-maskers in de collectie). */
export const CARD_OUTLINE_SVG =
  "M46 0H196L214 12H286L304 0H454Q500 0 500 46V628Q500 656 476 670L274 712Q250 720 226 712L24 670Q0 656 0 628V46Q0 0 46 0Z";

// ——— Font ————————————————————————————————————————————————————————————————

const FALLBACK_FONT = "Impact, 'Arial Narrow', sans-serif";

export function cardFontFamily(): string {
  if (typeof document === "undefined") return FALLBACK_FONT;
  const family = getComputedStyle(document.documentElement).getPropertyValue("--font-bebas").trim();
  return family ? `${family}, ${FALLBACK_FONT}` : FALLBACK_FONT;
}

let fontPromise: Promise<string> | null = null;

/** Wacht tot Bebas Neue geladen is; daarna tekent canvas met het juiste font. */
export function ensureCardFont(): Promise<string> {
  if (typeof document === "undefined") return Promise.resolve(FALLBACK_FONT);
  fontPromise ??= (async () => {
    const family = cardFontFamily();
    try {
      await document.fonts.load(`64px ${family}`, "0123456789ABCDEF");
    } catch {
      // Dan maar het reservefont.
    }
    return family;
  })();
  return fontPromise;
}

// ——— Iconen ——————————————————————————————————————————————————————————————

const iconCache = new Map<string, { paths: IconPath[]; path2d: Path2D[] }>();

function iconPaths(name: CardData["icon"]) {
  let entry = iconCache.get(name);
  if (!entry) {
    const paths = iconNodeToPaths(SUBJECT_ICON_NODES[name]);
    entry = { paths, path2d: paths.map((p) => new Path2D(p.d)) };
    iconCache.set(name, entry);
  }
  return entry;
}

/** Tekent een vak-icoon (24×24 lucide) op positie (x, y) met grootte `size`. */
export function drawSubjectIcon(
  ctx: CanvasRenderingContext2D,
  name: CardData["icon"],
  x: number,
  y: number,
  size: number,
  color: string,
  lineWidth = 2,
) {
  const { paths, path2d } = iconPaths(name);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 24, size / 24);
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  path2d.forEach((path, i) => (paths[i]?.fill ? ctx.fill(path) : ctx.stroke(path)));
  ctx.restore();
}

// ——— Tekst ———————————————————————————————————————————————————————————————

export function fitFont(
  ctx: CanvasRenderingContext2D,
  text: string,
  family: string,
  maxWidth: number,
  size: number,
  min: number,
): number {
  let current = size;
  ctx.font = `${current}px ${family}`;
  while (ctx.measureText(text).width > maxWidth && current > min) {
    current -= 2;
    ctx.font = `${current}px ${family}`;
  }
  return current;
}

export function ellipsize(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let cut = text;
  while (cut.length > 1 && ctx.measureText(`${cut}…`).width > maxWidth) cut = cut.slice(0, -1);
  return `${cut.trimEnd()}…`;
}

export const spaced = (text: string) => text.split("").join(" ");

// ——— Voorkant ————————————————————————————————————————————————————————————

export interface CardFaceOptions {
  /** Feature B: cijfer verbergen achter een sticker. */
  sticker?: string | null;
  /** Feature B: naam weglaten. */
  hideName?: boolean;
}

function drawPattern(ctx: CanvasRenderingContext2D, style: FaceStyle, seed: string) {
  ctx.save();
  if (style.pattern === "lines" || style.pattern === "gold") {
    ctx.strokeStyle = style.pattern === "gold" ? "rgba(212,175,55,0.1)" : "rgba(255,255,255,0.08)";
    ctx.lineWidth = 2;
    for (let i = -720; i < 500; i += 26) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 720, 720);
      ctx.stroke();
    }
  } else if (style.pattern === "glitter") {
    const random = createRandom(hashString(seed));
    for (let i = 0; i < 160; i++) {
      ctx.fillStyle =
        i % 3 === 0
          ? `rgba(160,195,255,${0.3 + random.next() * 0.6})`
          : `rgba(255,255,255,${0.2 + random.next() * 0.7})`;
      ctx.beginPath();
      ctx.arc(random.next() * 500, random.next() * 720, 0.8 + random.next() * 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (style.pattern === "rays") {
    ctx.translate(305, 230);
    for (let i = 0; i < 24; i++) {
      ctx.rotate((Math.PI * 2) / 24);
      ctx.fillStyle = i % 2 === 0 ? "rgba(255,255,255,0.22)" : "rgba(201,154,51,0.1)";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(900, -60);
      ctx.lineTo(900, 60);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.restore();
}

/** Tekent de voorkant op (0, 0) met de gegeven breedte (in de huidige eenheden van ctx). */
export function drawCardFace(
  ctx: CanvasRenderingContext2D,
  card: CardData,
  width: number,
  options: CardFaceOptions = {},
) {
  const style = faceStyleFor(card);
  const family = cardFontFamily();
  const outline = cardOutline();
  const s = width / CARD_W;

  ctx.save();
  ctx.scale(s, s);

  // Achtergrond, patroon, glans en de gloed van het vak.
  ctx.save();
  ctx.clip(outline);
  const base = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
  style.stops.forEach((color, i) => base.addColorStop(i / (style.stops.length - 1), color));
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, CARD_W, CARD_H);
  drawPattern(ctx, style, card.id);

  const sheen = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
  sheen.addColorStop(0.22, "rgba(255,255,255,0)");
  sheen.addColorStop(0.36, `rgba(255,255,255,${style.sheen})`);
  sheen.addColorStop(0.5, "rgba(255,255,255,0)");
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  const halo = ctx.createRadialGradient(305, 230, 10, 305, 230, 210);
  halo.addColorStop(0, rgba(card.color, 0.6));
  halo.addColorStop(1, rgba(card.color, 0));
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  ctx.shadowColor = rgba(style.glow, 0.8);
  ctx.shadowBlur = 24;
  drawSubjectIcon(ctx, card.icon, 305 - 108, 230 - 108, 216, style.text, 1.5);
  ctx.shadowBlur = 0;

  const shade = ctx.createLinearGradient(0, 470, 0, CARD_H);
  shade.addColorStop(0, "rgba(0,0,0,0)");
  shade.addColorStop(1, "rgba(0,0,0,0.12)");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 470, CARD_W, 250);
  ctx.restore();

  // Lijsten.
  ctx.save();
  ctx.translate(250, 360);
  ctx.scale(0.952, 0.96);
  ctx.translate(-250, -360);
  ctx.strokeStyle = rgba(style.frame, 0.95);
  ctx.lineWidth = 3;
  ctx.stroke(outline);
  ctx.restore();
  ctx.strokeStyle = rgba(style.frame, 0.7);
  ctx.lineWidth = 2;
  ctx.stroke(outline);

  // Rating, weging en vak-icoon linksboven.
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.fillStyle = style.text;
  if (options.sticker) {
    drawSticker(ctx, options.sticker, family);
  } else {
    ctx.font = `150px ${family}`;
    ctx.fillText(card.ratingLabel, 48, 168);
  }
  ctx.font = `52px ${family}`;
  ctx.fillText(card.stats.weg, 56, 224);
  ctx.globalAlpha = 0.45;
  ctx.fillRect(58, 242, 64, 3);
  ctx.globalAlpha = 1;
  drawSubjectIcon(ctx, card.icon, 60, 258, 50, style.text, 2.2);

  // Variantlabel rechtsboven.
  if (card.primaryVariant) {
    const label = VARIANT_LABELS[card.primaryVariant];
    ctx.font = `30px ${family}`;
    const w = ctx.measureText(label).width + 36;
    const x = 470 - w;
    ctx.fillStyle = style.badgeBg;
    ctx.beginPath();
    ctx.roundRect(x, 38, w, 42, 21);
    ctx.fill();
    ctx.fillStyle = style.badgeText;
    ctx.textAlign = "center";
    ctx.fillText(label, x + w / 2, 70);
  }

  // Naam en vak.
  ctx.textAlign = "center";
  ctx.fillStyle = style.text;
  if (!options.hideName) {
    const name = card.studentName.toUpperCase();
    fitFont(ctx, name, family, 400, 74, 44);
    ctx.fillText(name, 250, 448);
  }
  ctx.globalAlpha = 0.35;
  ctx.fillRect(95, 468, 310, 2.5);
  ctx.globalAlpha = 1;
  const subline = `${card.subjectName} · ${card.grade.description}`.toUpperCase();
  fitFont(ctx, subline, family, 410, 34, 24);
  ctx.fillStyle = style.sub;
  ctx.fillText(ellipsize(ctx, subline, 410), 250, 508);

  // Stats.
  const rows: [string, string, string, string][] = [
    [card.stats.cyf, "CYF", card.stats.weg, "WEG"],
    [card.stats.gem, "GEM", card.stats.top, "TOP"],
    [card.stats.imp, "IMP", card.stats.rks, "RKS"],
  ];
  rows.forEach(([lv, ll, rv, rl], i) => {
    const y = 566 + i * 48;
    ctx.font = `48px ${family}`;
    ctx.fillStyle = style.text;
    ctx.textAlign = "right";
    ctx.fillText(options.sticker && i === 0 ? "??" : lv, 166, y);
    ctx.fillText(rv, 350, y);
    ctx.font = `32px ${family}`;
    ctx.fillStyle = style.sub;
    ctx.textAlign = "left";
    ctx.fillText(ll, 176, y);
    ctx.fillText(rl, 360, y);
  });
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = style.text;
  ctx.fillRect(249, 530, 2, 140);
  ctx.globalAlpha = 1;

  // Tier onderaan.
  ctx.font = `24px ${family}`;
  ctx.fillStyle = style.sub;
  ctx.textAlign = "center";
  ctx.fillText(spaced(cardTierLabel(card)), 250, 698);

  ctx.restore();
}

function drawSticker(ctx: CanvasRenderingContext2D, text: string, family: string) {
  ctx.save();
  ctx.translate(98, 120);
  ctx.rotate(-0.12);
  ctx.fillStyle = "#ff3d6e";
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.roundRect(-78, -48, 156, 96, 18);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  fitFont(ctx, text.toUpperCase(), family, 136, 44, 22);
  ctx.fillText(text.toUpperCase(), 0, 4);
  ctx.restore();
}

// ——— Achterkant en silhouet ——————————————————————————————————————————————

export function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.quadraticCurveTo(cx + r * 0.16, cy - r * 0.16, cx + r, cy);
  ctx.quadraticCurveTo(cx + r * 0.16, cy + r * 0.16, cx, cy + r);
  ctx.quadraticCurveTo(cx - r * 0.16, cy + r * 0.16, cx - r, cy);
  ctx.quadraticCurveTo(cx - r * 0.16, cy - r * 0.16, cx, cy - r);
  ctx.closePath();
  ctx.fill();
}

/** Achterkant: datum, toets en context. */
export function drawCardBack(ctx: CanvasRenderingContext2D, card: CardData, width: number) {
  const style = faceStyleFor(card);
  const family = cardFontFamily();
  const outline = cardOutline();
  const s = width / CARD_W;

  ctx.save();
  ctx.scale(s, s);
  ctx.save();
  ctx.clip(outline);
  const base = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
  base.addColorStop(0, "#0b0d18");
  base.addColorStop(0.5, rgba(style.glow, 0.28));
  base.addColorStop(1, "#05060c");
  ctx.fillStyle = "#07080f";
  ctx.fillRect(0, 0, CARD_W, CARD_H);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, CARD_W, CARD_H);
  ctx.fillStyle = "rgba(255,255,255,0.05)";
  for (let y = 40; y < CARD_H; y += 70) {
    for (let x = (y / 70) % 2 === 0 ? 40 : 75; x < CARD_W; x += 70) drawStar(ctx, x, y, 9);
  }
  ctx.restore();

  ctx.strokeStyle = rgba(style.frame, 0.85);
  ctx.lineWidth = 3;
  ctx.stroke(outline);

  ctx.fillStyle = style.glow;
  ctx.beginPath();
  ctx.arc(250, 118, 46, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#07080f";
  drawStar(ctx, 250, 118, 30);

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = rgba(style.glow, 0.9);
  ctx.font = `30px ${family}`;
  ctx.fillText(spaced("SUPERMAGISTER"), 250, 200);

  ctx.fillStyle = "#ffffff";
  const subject = card.subjectName.toUpperCase();
  fitFont(ctx, subject, family, 420, 58, 32);
  ctx.fillText(subject, 250, 282);
  ctx.globalAlpha = 0.8;
  const description = card.grade.description.toUpperCase();
  fitFont(ctx, description, family, 420, 36, 24);
  ctx.fillText(ellipsize(ctx, description, 420), 250, 326);
  ctx.globalAlpha = 0.3;
  ctx.fillRect(130, 350, 240, 2);
  ctx.globalAlpha = 1;

  const rows: [string, string][] = [
    ["CIJFER", card.stats.cyf],
    ["TOETS", formatShortDate(parseISODate(card.grade.date)).toUpperCase()],
    ["INGEVOERD", formatShortDate(new Date(card.grade.enteredAt)).toUpperCase()],
    ["WEGING", card.stats.weg],
    ["PERIODE", card.periodName?.toUpperCase() ?? "—"],
    [
      "GEM. NA DIT CIJFER",
      card.stats.imp === "—" ? card.stats.gem : `${card.stats.gem} (${card.stats.imp})`,
    ],
  ];
  ctx.font = `30px ${family}`;
  rows.forEach(([label, value], i) => {
    const y = 404 + i * 44;
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fillText(label, 70, y);
    ctx.textAlign = "right";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(value, 430, y);
  });

  ctx.font = `24px ${family}`;
  ctx.textAlign = "center";
  ctx.fillStyle = rgba(style.glow, 0.9);
  ctx.fillText(spaced(cardTierLabel(card)), 250, 698);
  ctx.restore();
}

/** Donker silhouet met een gloeiende rand, voor het ronddraaien in de walkout. */
export function drawCardSilhouette(ctx: CanvasRenderingContext2D, width: number, glow: string) {
  const outline = cardOutline();
  const s = width / CARD_W;
  ctx.save();
  ctx.scale(s, s);
  ctx.save();
  ctx.clip(outline);
  const base = ctx.createLinearGradient(0, 0, 0, CARD_H);
  base.addColorStop(0, "#10121c");
  base.addColorStop(1, "#05060b");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, CARD_W, CARD_H);
  ctx.fillStyle = rgba(glow, 0.12);
  drawStar(ctx, 250, 360, 120);
  ctx.restore();
  ctx.strokeStyle = glow;
  ctx.lineWidth = 6;
  ctx.stroke(outline);
  ctx.restore();
}

export type CardSide = "face" | "back" | "silhouette";

/** Tekent een kaart op een eigen canvas, scherp op het scherm (devicePixelRatio). */
export function renderCardCanvas(
  card: CardData,
  cssWidth: number,
  {
    side = "face",
    pixelRatio,
    options,
  }: { side?: CardSide; pixelRatio?: number; options?: CardFaceOptions } = {},
): HTMLCanvasElement {
  const ratio = Math.min(
    pixelRatio ?? (typeof window === "undefined" ? 1 : window.devicePixelRatio || 1),
    3,
  );
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(cssWidth * ratio);
  canvas.height = Math.round(cssWidth * CARD_RATIO * ratio);
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.scale(ratio, ratio);
  if (side === "face") drawCardFace(ctx, card, cssWidth, options);
  else if (side === "back") drawCardBack(ctx, card, cssWidth);
  else drawCardSilhouette(ctx, cssWidth, cardGlow(card));
  return canvas;
}
