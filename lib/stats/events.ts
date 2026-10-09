/**
 * Anonieme statistieken: welke events er bestaan. Dit is de whitelist voor het
 * event-endpoint (app/api/telling): alleen deze namen worden geteld, en alleen
 * als dagteller. Een event zegt nooit iets over wie, welke school of welk
 * cijfer: alleen dát er iets gebeurde, met hooguit een vaste keuze erbij (welke
 * stap, welk formaat). Er komt nooit vrije tekst in een naam.
 */

/** De stappen van de onboarding (gelijk aan ONBOARDING_STEPS, zie de test). */
export const ONBOARDING_STEP_NAMES = [
  "intro",
  "pack",
  "gok",
  "overzicht",
  "thema",
  "woonplaats",
  "koppelen",
  "eerste-pack",
  "klaar",
] as const;
export type OnboardingStepName = (typeof ONBOARDING_STEP_NAMES)[number];

/** Soorten onverwachte fouten in de browser. Nooit de melding zelf, alleen de soort. */
export const ERROR_KINDS = [
  "typeerror",
  "referenceerror",
  "rangeerror",
  "syntaxerror",
  "chunk",
  "netwerk",
  "opslag",
  "render",
  "overig",
] as const;
export type ErrorKind = (typeof ERROR_KINDS)[number];

const FIXED_EVENTS = [
  "app-geopend",
  "onboarding-gestart",
  "onboarding-afgerond",
  "demo-gestart",
  "gekoppeld:bladwijzer",
  "gekoppeld:plakken",
  "opnieuw-gekoppeld",
  "koppeling-verlopen",
  "ontkoppeld",
  "welkomstpack-geopend",
  "walkout-gestart",
  "walkout-overgeslagen",
  "eerste-walkout",
  "gok-gebruikt",
  "gok-overgeslagen",
  "gok-precies-goed",
  "video-gemaakt:9x16:mysterie",
  "video-gemaakt:9x16:open",
  "video-gemaakt:1x1:mysterie",
  "video-gemaakt:1x1:open",
  "calculator-gebruikt",
  "oefen-walkout",
  "pwa-geinstalleerd",
  "fout-open-meteo",
  "elftal-geopend",
  "elftal-gebouwd",
  "elftal-gedeeld",
  "elftal-video",
  "oefenwedstrijd",
] as const;

/** Alle events die geteld mogen worden. */
export const STAT_EVENTS = [
  ...FIXED_EVENTS,
  ...ONBOARDING_STEP_NAMES.map((step) => `onboarding-stap:${step}` as const),
  ...ONBOARDING_STEP_NAMES.map((step) => `onboarding-overgeslagen:${step}` as const),
  ...ERROR_KINDS.map((kind) => `fout:${kind}` as const),
] as const;
export type StatEvent = (typeof STAT_EVENTS)[number];

const KNOWN: ReadonlySet<string> = new Set(STAT_EVENTS);

export function isStatEvent(value: unknown): value is StatEvent {
  return typeof value === "string" && KNOWN.has(value);
}

/** Video gemaakt: staand (9:16) of vierkant (1:1), met of zonder mysterie. */
export function videoEvent(format: "staand" | "vierkant", mystery: boolean): StatEvent {
  return `video-gemaakt:${format === "staand" ? "9x16" : "1x1"}:${mystery ? "mysterie" : "open"}`;
}
