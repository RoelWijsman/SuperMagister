import { cardScore } from "@/lib/calc/cards";
import {
  CARD_RATIO,
  cardGlow,
  ellipsize,
  ensureCardFont,
  fitFont,
  renderCardCanvas,
  rgba,
  spaced,
} from "./draw";
import type { CardData } from "./model";
import { SHARE_H, SHARE_W, showcaseSlots } from "./share-layout";

/**
 * Deelbare afbeeldingen van een kaart of je vitrine. Rechtstreeks met canvas,
 * met dezelfde tekencode als de walkout: scherper dan een screenshot van de
 * pagina en zonder extra dependency.
 */

function drawBackdrop(ctx: CanvasRenderingContext2D, glow: string) {
  ctx.fillStyle = "#05060d";
  ctx.fillRect(0, 0, SHARE_W, SHARE_H);

  const cx = SHARE_W / 2;
  const cy = SHARE_H * 0.55;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.globalCompositeOperation = "lighter";
  const rays = 18;
  for (let i = 0; i < rays; i++) {
    const angle = (i / rays) * Math.PI * 2;
    ctx.fillStyle = rgba(glow, i % 2 === 0 ? 0.07 : 0.035);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, SHARE_H, angle, angle + Math.PI / rays);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, SHARE_H * 0.62);
  halo.addColorStop(0, rgba(glow, 0.5));
  halo.addColorStop(0.45, rgba(glow, 0.12));
  halo.addColorStop(1, rgba(glow, 0));
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, SHARE_W, SHARE_H);

  const vignette = ctx.createRadialGradient(cx, cy, SHARE_H * 0.35, cx, cy, SHARE_H * 0.85);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.7)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, SHARE_W, SHARE_H);
}

function drawHeader(
  ctx: CanvasRenderingContext2D,
  family: string,
  title: string,
  subtitle: string,
) {
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = `34px ${family}`;
  ctx.fillText(spaced("SUPERMAGISTER"), SHARE_W / 2, 112);

  ctx.fillStyle = "#ffffff";
  fitFont(ctx, title, family, SHARE_W - 120, 104, 56);
  ctx.fillText(title, SHARE_W / 2, 214);

  ctx.fillStyle = "rgba(255,255,255,0.72)";
  ctx.font = `40px ${family}`;
  ctx.fillText(ellipsize(ctx, subtitle, SHARE_W - 160), SHARE_W / 2, 268);
}

function drawFooter(ctx: CanvasRenderingContext2D, family: string) {
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = `26px ${family}`;
  ctx.fillText(spaced("ONOFFICIEEL · NIET VAN MAGISTER"), SHARE_W / 2, SHARE_H - 56);
}

function newCanvas(): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement("canvas");
  canvas.width = SHARE_W;
  canvas.height = SHARE_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas niet beschikbaar");
  return [canvas, ctx];
}

function drawCardAt(
  ctx: CanvasRenderingContext2D,
  card: CardData,
  x: number,
  y: number,
  w: number,
  angle = 0,
) {
  const face = renderCardCanvas(card, w, { pixelRatio: 2 });
  const h = w * CARD_RATIO;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((angle * Math.PI) / 180);
  ctx.shadowColor = rgba(cardGlow(card), 0.85);
  ctx.shadowBlur = 70;
  ctx.drawImage(face, -w / 2, -h / 2, w, h);
  ctx.restore();
}

/** Eén kaart, groot, met het vak en de toets erboven. */
export async function renderShareCard(card: CardData): Promise<HTMLCanvasElement> {
  const family = await ensureCardFont();
  const [canvas, ctx] = newCanvas();
  drawBackdrop(ctx, cardGlow(card));
  drawHeader(ctx, family, card.subjectName.toUpperCase(), card.grade.description.toUpperCase());
  const w = 600;
  drawCardAt(ctx, card, SHARE_W / 2, 330 + (w * CARD_RATIO) / 2, w);
  drawFooter(ctx, family);
  return canvas;
}

/** De vitrine als waaier van maximaal vijf kaarten. */
export async function renderShareShowcase(
  cards: readonly CardData[],
  ownerName: string,
): Promise<HTMLCanvasElement> {
  const family = await ensureCardFont();
  const [canvas, ctx] = newCanvas();
  const best = [...cards].sort((a, b) => cardScore(b) - cardScore(a))[0];
  drawBackdrop(ctx, best ? cardGlow(best) : "#9b7bff");
  const subtitle = `${cards.length} ${cards.length === 1 ? "FAVORIETE KAART" : "FAVORIETE KAARTEN"} VAN ${ownerName.toUpperCase()}`;
  drawHeader(ctx, family, "VITRINE", subtitle);
  const slots = showcaseSlots(cards.length).map((slot, i) => ({ slot, card: cards[i]! }));
  for (const { slot, card } of [...slots].sort((a, b) => a.slot.z - b.slot.z)) {
    drawCardAt(ctx, card, slot.x, slot.y, slot.w, slot.angle);
  }
  drawFooter(ctx, family);
  return canvas;
}

export function canvasToFile(canvas: HTMLCanvasElement, filename: string): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(new File([blob], filename, { type: "image/png" }));
      else reject(new Error("Afbeelding maken mislukt"));
    }, "image/png");
  });
}

/** Kan dit apparaat een afbeelding delen via het deelmenu? */
export function canShareFile(file: File): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [file] })
  );
}

export async function shareFile(file: File, title: string): Promise<"gedeeld" | "geannuleerd"> {
  try {
    await navigator.share({ files: [file], title });
    return "gedeeld";
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return "geannuleerd";
    throw error;
  }
}

export function downloadFile(file: File) {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
