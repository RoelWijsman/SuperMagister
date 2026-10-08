import { deriveCustomTheme, readableTextOn, type CustomTheme } from "@/lib/color";

export type PresetThemeId =
  "aurora" | "middernacht" | "neon" | "pastel" | "zonsondergang" | "oceaan";
export type ThemeId = PresetThemeId | "custom";

export interface ThemePreset extends CustomTheme {
  id: PresetThemeId;
  name: string;
  tagline: string;
}

const preset = (
  id: PresetThemeId,
  name: string,
  tagline: string,
  colors: Omit<CustomTheme, "onAccent">,
): ThemePreset => ({ id, name, tagline, ...colors, onAccent: readableTextOn(colors.accent) });

/**
 * De themapresets. Eén bron van waarheid: deze waarden gaan als CSS-variabelen
 * naar <html>, zowel via het inline-script (vóór de eerste paint) als via React.
 */
export const THEME_PRESETS: readonly ThemePreset[] = [
  preset("aurora", "Aurora", "Noorderlicht in violet en mint", {
    accent: "#9b7bff",
    accent2: "#46f0c8",
    aurora: ["#7c5cff", "#2ee6b0", "#ff6fb5", "#3d8bff"],
    bgDark: "#070816",
    bgLight: "#f3f2fb",
  }),
  preset("middernacht", "Middernacht", "Diepblauw met een zilveren rand", {
    accent: "#7d97ff",
    accent2: "#c3cdff",
    aurora: ["#2a3dff", "#5a2bd8", "#1f8fff", "#8aa0ff"],
    bgDark: "#03050d",
    bgLight: "#eef1fb",
  }),
  preset("neon", "Neon", "Magenta en cyaan, vol aan", {
    accent: "#ff4fdc",
    accent2: "#2bf5ff",
    aurora: ["#ff2bd6", "#22f0ff", "#8a2bff", "#c6ff3d"],
    bgDark: "#07030b",
    bgLight: "#f8f2fb",
  }),
  preset("pastel", "Pastel", "Zacht als een marshmallow", {
    accent: "#ffa8cf",
    accent2: "#bcaeff",
    aurora: ["#ffb3d1", "#b9a6ff", "#a8f0dc", "#ffd1a8"],
    bgDark: "#17121f",
    bgLight: "#fbf6fa",
  }),
  preset("zonsondergang", "Zonsondergang", "Oranje gloed, roze lucht", {
    accent: "#ff8a3d",
    accent2: "#ff5c93",
    aurora: ["#ff7a2f", "#ff3d7f", "#9b3dff", "#ffc542"],
    bgDark: "#13070f",
    bgLight: "#fdf3ee",
  }),
  preset("oceaan", "Oceaan", "Lagune, golven en zeeschuim", {
    accent: "#22d3ee",
    accent2: "#34f5b0",
    aurora: ["#0ea5b8", "#1e6bff", "#22d3ee", "#2ff5b0"],
    bgDark: "#021219",
    bgLight: "#eef8fa",
  }),
];

export const DEFAULT_THEME: PresetThemeId = "aurora";

export function getPreset(id: string): ThemePreset {
  return THEME_PRESETS.find((p) => p.id === id) ?? THEME_PRESETS[0]!;
}

const INK = { dark: "#0b0a1a", light: "#ffffff" } as const;

/** CSS-variabelen voor een thema. */
export function themeVars(theme: CustomTheme): Record<string, string> {
  const [a1, a2, a3, a4] = theme.aurora;
  return {
    "--t-accent": theme.accent,
    "--t-accent-2": theme.accent2,
    "--t-a1": a1 ?? theme.accent,
    "--t-a2": a2 ?? theme.accent2,
    "--t-a3": a3 ?? theme.accent,
    "--t-a4": a4 ?? theme.accent2,
    "--t-bg-dark": theme.bgDark,
    "--t-bg-light": theme.bgLight,
    "--t-on-accent": INK[theme.onAccent],
  };
}

export function customThemeVars(accentHex: string): Record<string, string> {
  return themeVars(deriveCustomTheme(accentHex));
}
