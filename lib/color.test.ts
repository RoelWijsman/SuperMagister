import { describe, expect, it } from "vitest";
import {
  contrastRatio,
  deriveCustomTheme,
  hexToOklch,
  hexToRgb,
  normalizeHex,
  oklchToHex,
  readableTextOn,
} from "./color";

describe("normalizeHex / hexToRgb", () => {
  it("expands shorthand and lowercases", () => {
    expect(normalizeHex("#ABC")).toBe("#aabbcc");
    expect(normalizeHex("7c5cff")).toBe("#7c5cff");
  });

  it("returns null for invalid input", () => {
    expect(normalizeHex("#12")).toBeNull();
    expect(normalizeHex("purple")).toBeNull();
  });

  it("parses channels", () => {
    expect(hexToRgb("#ff8000")).toEqual({ r: 255, g: 128, b: 0 });
  });
});

describe("contrastRatio", () => {
  it("is 21 for black on white", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
  });

  it("is 1 for identical colors", () => {
    expect(contrastRatio("#7c5cff", "#7c5cff")).toBeCloseTo(1, 5);
  });
});

describe("readableTextOn", () => {
  it("picks dark text on light colors", () => {
    expect(readableTextOn("#ffd23f")).toBe("dark");
  });

  it("picks light text on dark colors", () => {
    expect(readableTextOn("#1a1a40")).toBe("light");
  });
});

describe("oklch conversion", () => {
  it("round-trips sRGB colors", () => {
    for (const hex of ["#7c5cff", "#3ee6b5", "#ff8a3d", "#101020", "#ffffff"]) {
      expect(oklchToHex(hexToOklch(hex))).toBe(hex);
    }
  });

  it("maps white to lightness 1 and no chroma", () => {
    const { l, c } = hexToOklch("#ffffff");
    expect(l).toBeCloseTo(1, 3);
    expect(c).toBeCloseTo(0, 3);
  });

  it("clamps out-of-gamut colors into sRGB", () => {
    expect(oklchToHex({ l: 0.7, c: 0.4, h: 150 })).toMatch(/^#[0-9a-f]{6}$/);
  });
});

describe("deriveCustomTheme", () => {
  const theme = deriveCustomTheme("#FF3399");

  it("keeps the chosen color as accent", () => {
    expect(theme.accent).toBe("#ff3399");
  });

  it("produces valid hex colors for every token", () => {
    const values = [theme.accent, theme.accent2, theme.bgDark, theme.bgLight, ...theme.aurora];
    for (const value of values) expect(value).toMatch(/^#[0-9a-f]{6}$/);
    expect(theme.aurora).toHaveLength(4);
  });

  it("uses a very dark background tinted by the accent", () => {
    expect(hexToOklch(theme.bgDark).l).toBeLessThan(0.2);
    expect(hexToOklch(theme.bgLight).l).toBeGreaterThan(0.94);
  });

  it("chooses readable text for the accent", () => {
    expect(theme.onAccent).toBe(readableTextOn("#ff3399"));
  });
});
