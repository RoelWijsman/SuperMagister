import { getPreset, themeVars, type ThemeId } from "./themes";

/** Zet de themakleuren als CSS-variabelen op <html>. */
export function applyThemeVars(theme: ThemeId, customVars: Record<string, string> | null) {
  const root = document.documentElement;
  const vars = theme === "custom" && customVars ? customVars : themeVars(getPreset(theme));
  for (const [key, value] of Object.entries(vars)) root.style.setProperty(key, value);
  root.setAttribute("data-theme", theme);

  // De adresbalk van mobiele browsers kleurt mee met de achtergrond.
  const mode = root.getAttribute("data-mode") === "light" ? "--t-bg-light" : "--t-bg-dark";
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta && vars[mode]) meta.setAttribute("content", vars[mode]);
}
