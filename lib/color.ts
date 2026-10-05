/**
 * Kleurhulpjes voor thema's: hex ↔ OKLCH, contrast en het afleiden van een
 * volledig thema uit één zelfgekozen accentkleur.
 */

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface OKLCH {
  /** Lichtheid 0–1. */
  l: number;
  /** Chroma (0 – ±0.37). */
  c: number;
  /** Hue in graden 0–360. */
  h: number;
}

export function normalizeHex(input: string): string | null {
  const raw = input.trim().replace(/^#/, "").toLowerCase();
  if (/^[0-9a-f]{3}$/.test(raw)) {
    return `#${raw
      .split("")
      .map((ch) => ch + ch)
      .join("")}`;
  }
  if (/^[0-9a-f]{6}$/.test(raw)) return `#${raw}`;
  return null;
}

export function hexToRgb(hex: string): RGB {
  const normalized = normalizeHex(hex);
  if (!normalized) throw new Error(`Ongeldige kleur: ${hex}`);
  const value = parseInt(normalized.slice(1), 16);
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}

export function rgbToHex({ r, g, b }: RGB): string {
  const channel = (v: number) =>
    Math.round(Math.min(255, Math.max(0, v)))
      .toString(16)
      .padStart(2, "0");
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

const toLinear = (c: number) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};

const fromLinear = (v: number) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);

/** WCAG relatieve luminantie. */
export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [light, dark] = la > lb ? [la, lb] : [lb, la];
  return (light + 0.05) / (dark + 0.05);
}

const INK_DARK = "#0b0a1a";
const INK_LIGHT = "#ffffff";

/** Welke tekstkleur leest het best op deze achtergrond? */
export function readableTextOn(hex: string): "dark" | "light" {
  return contrastRatio(hex, INK_DARK) >= contrastRatio(hex, INK_LIGHT) ? "dark" : "light";
}

export function hexToOklch(hex: string): OKLCH {
  const { r, g, b } = hexToRgb(hex);
  const lr = toLinear(r);
  const lg = toLinear(g);
  const lb = toLinear(b);

  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);

  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  const c = Math.sqrt(A * A + B * B);
  let h = (Math.atan2(B, A) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { l: L, c, h: c < 1e-4 ? 0 : h };
}

function oklchToLinear({ l, c, h }: OKLCH): [number, number, number] {
  const rad = (h * Math.PI) / 180;
  const A = c * Math.cos(rad);
  const B = c * Math.sin(rad);
  const l_ = (l + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m_ = (l - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s_ = (l - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ];
}

const inGamut = (channels: number[]) => channels.every((v) => v >= -1e-4 && v <= 1 + 1e-4);

/** OKLCH naar hex; buiten sRGB wordt de chroma verlaagd tot de kleur past. */
export function oklchToHex(color: OKLCH): string {
  let channels = oklchToLinear(color);
  if (!inGamut(channels)) {
    let low = 0;
    let high = color.c;
    for (let i = 0; i < 24; i++) {
      const mid = (low + high) / 2;
      if (inGamut(oklchToLinear({ ...color, c: mid }))) low = mid;
      else high = mid;
    }
    channels = oklchToLinear({ ...color, c: low });
  }
  const [r, g, b] = channels.map((v) => fromLinear(Math.min(1, Math.max(0, v))) * 255);
  return rgbToHex({ r: r ?? 0, g: g ?? 0, b: b ?? 0 });
}

const wrapHue = (h: number) => ((h % 360) + 360) % 360;

export interface CustomTheme {
  accent: string;
  accent2: string;
  /** Vier kleuren voor de aurora-vlekken. */
  aurora: string[];
  bgDark: string;
  bgLight: string;
  onAccent: "dark" | "light";
}

/** Bouwt een compleet, harmonieus thema rond één gekozen accentkleur. */
export function deriveCustomTheme(accentHex: string): CustomTheme {
  const accent = normalizeHex(accentHex) ?? "#8b6cff";
  const base = hexToOklch(accent);
  const h = base.h;
  const vivid = Math.max(0.12, Math.min(base.c, 0.22));

  return {
    accent,
    accent2: oklchToHex({
      l: Math.min(0.88, Math.max(base.l, 0.72)),
      c: vivid,
      h: wrapHue(h + 48),
    }),
    aurora: [
      oklchToHex({ l: 0.68, c: vivid, h }),
      oklchToHex({ l: 0.74, c: vivid * 0.9, h: wrapHue(h + 62) }),
      oklchToHex({ l: 0.62, c: vivid, h: wrapHue(h - 54) }),
      oklchToHex({ l: 0.7, c: vivid * 0.7, h: wrapHue(h + 165) }),
    ],
    bgDark: oklchToHex({ l: 0.145, c: 0.035, h }),
    bgLight: oklchToHex({ l: 0.965, c: 0.012, h }),
    onAccent: readableTextOn(accent),
  };
}
