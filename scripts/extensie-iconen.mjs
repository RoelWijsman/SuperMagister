/**
 * Tekent de iconen van de extensie (extension/icons/icon-{16,32,48,128}.png)
 * uit dezelfde vormen als het logo (app/icon.svg en lib/brand.ts): de
 * fonkelende ster op een afgeronde tegel. 16 en 32 pixels krijgen de platte
 * versie (één kleur, grotere ster, zonder stipje), zodat ze klein scherp
 * blijven. Gebruik: node scripts/extensie-iconen.mjs
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { encodePng } from "./lib/png.mjs";

const OUT = join(import.meta.dirname, "..", "extension", "icons");
const SAMPLES = 6; // 6 × 6 metingen per pixel voor zachte randen

/** Een SVG-pad met alleen M, c, C en z naar een veelhoek (bezier in stukjes). */
function pathToPolygon(d) {
  const tokens = d.match(/[MCcz]|-?\d*\.?\d+/g);
  const points = [];
  let x = 0;
  let y = 0;
  let command = "";
  let i = 0;
  const next = () => Number(tokens[i++]);
  while (i < tokens.length) {
    if (/[MCcz]/.test(tokens[i])) command = tokens[i++];
    if (command === "z") break;
    if (command === "M") {
      x = next();
      y = next();
      points.push([x, y]);
      continue;
    }
    const relative = command === "c";
    const c = Array.from({ length: 6 }, next);
    const [x1, y1, x2, y2, x3, y3] = relative
      ? [x + c[0], y + c[1], x + c[2], y + c[3], x + c[4], y + c[5]]
      : c;
    for (let s = 1; s <= 24; s++) {
      const t = s / 24;
      const u = 1 - t;
      points.push([
        u ** 3 * x + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t ** 3 * x3,
        u ** 3 * y + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t ** 3 * y3,
      ]);
    }
    x = x3;
    y = y3;
  }
  return points;
}

function insidePolygon(points, px, py) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function insideRoundedRect(px, py, size, radius) {
  const cx = Math.min(Math.max(px, radius), size - radius);
  const cy = Math.min(Math.max(py, radius), size - radius);
  return (
    px >= 0 && py >= 0 && px <= size && py <= size && (px - cx) ** 2 + (py - cy) ** 2 <= radius ** 2
  );
}

const hex = (value) => [1, 3, 5].map((i) => parseInt(value.slice(i, i + 2), 16));
const INK = hex("#0b0a1a");

const VARIANTS = {
  // Het logo zoals in de app: verloop van paars naar mint, met stipje.
  vol: {
    radius: 12,
    tile: (x, y) => {
      const t = (x + y) / 80;
      const [a, b] = [hex("#9b7bff"), hex("#46f0c8")];
      return a.map((v, i) => v + (b[i] - v) * t);
    },
    spark: pathToPolygon(
      "M20 7.5c1.5 7.6 4.9 11 12.5 12.5-7.6 1.5-11 4.9-12.5 12.5C18.5 24.9 15.1 21.5 7.5 20c7.6-1.5 11-4.9 12.5-12.5z",
    ),
    dot: { cx: 30.5, cy: 9.5, r: 2, opacity: 0.85 },
  },
  // Plat: één kleur, grotere ster, geen stipje.
  plat: {
    radius: 10,
    tile: () => hex("#8f74ff"),
    spark: pathToPolygon(
      "M20 5.5c1.7 8.6 5.4 12.3 14.5 14.5-9.1 2.2-12.8 5.9-14.5 14.5C18.3 25.9 14.6 22.2 5.5 20c9.1-2.2 12.8-5.9 14.5-14.5z",
    ),
    dot: null,
  },
};

function render(size, variant) {
  const { radius, tile, spark, dot } = VARIANTS[variant];
  const scale = 40 / size;
  const pixels = Buffer.alloc(size * size * 4);
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let sy = 0; sy < SAMPLES; sy++) {
        for (let sx = 0; sx < SAMPLES; sx++) {
          const x = (px + (sx + 0.5) / SAMPLES) * scale;
          const y = (py + (sy + 0.5) / SAMPLES) * scale;
          if (!insideRoundedRect(x, y, 40, radius)) continue;
          let color = tile(x, y);
          if (insidePolygon(spark, x, y)) color = INK;
          else if (dot && (x - dot.cx) ** 2 + (y - dot.cy) ** 2 <= dot.r ** 2)
            color = color.map((v, i) => v + (INK[i] - v) * dot.opacity);
          r += color[0];
          g += color[1];
          b += color[2];
          a += 1;
        }
      }
      const offset = (py * size + px) * 4;
      // Kleur gemiddeld over de bedekte metingen; dekking = aandeel bedekt.
      if (a > 0) {
        pixels[offset] = Math.round(r / a);
        pixels[offset + 1] = Math.round(g / a);
        pixels[offset + 2] = Math.round(b / a);
      }
      pixels[offset + 3] = Math.round((a / SAMPLES ** 2) * 255);
    }
  }
  return encodePng(size, size, pixels);
}

for (const [size, variant] of [
  [16, "plat"],
  [32, "plat"],
  [48, "vol"],
  [128, "vol"],
]) {
  writeFileSync(join(OUT, `icon-${size}.png`), render(size, variant));
  console.log(`icon-${size}.png (${variant})`);
}
