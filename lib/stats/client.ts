import { STORAGE_KEYS } from "@/lib/storage-keys";
import { useSettings } from "@/stores/settings";
import { isStatEvent, type ErrorKind, type StatEvent } from "./events";

/**
 * Anonieme statistieken vanuit de browser. `track("walkout-gestart")` stuurt
 * alleen die naam naar /api/telling: geen id, geen cookie, geen cijfer, geen
 * vak, geen school. Niets als je "Anonieme statistieken delen" uit hebt gezet
 * (Instellingen → Privacy), of als je browser Do Not Track of Global Privacy
 * Control aan heeft.
 */

export const ENDPOINT = "/api/telling";

interface PrivacyNavigator {
  doNotTrack?: string | null;
  globalPrivacyControl?: boolean;
}

/** Vraagt de browser om niet gevolgd te worden (Do Not Track of Global Privacy Control)? */
export function browserOptedOut(
  nav: PrivacyNavigator | undefined = typeof navigator === "undefined" ? undefined : navigator,
  win: { doNotTrack?: string | null } | undefined = typeof window === "undefined"
    ? undefined
    : (window as { doNotTrack?: string | null }),
): boolean {
  return nav?.globalPrivacyControl === true || nav?.doNotTrack === "1" || win?.doNotTrack === "1";
}

/** Mag er nu geteld worden? */
export function statsAllowed(): boolean {
  if (typeof window === "undefined") return false;
  return useSettings.getState().shareStats && !browserOptedOut();
}

export function track(event: StatEvent): void {
  if (!statsAllowed() || !isStatEvent(event)) return;
  try {
    void fetch(ENDPOINT, {
      method: "POST",
      keepalive: true,
      credentials: "omit",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ e: event }),
    }).catch(() => undefined);
  } catch {
    // Tellen mag nooit iets kapotmaken.
  }
}

/**
 * Welke soort fout dit is. De melding wordt hier alleen gelezen om de soort te
 * kiezen en gaat nooit mee: alleen de soort (bijv. "typeerror") wordt geteld.
 */
export function classifyError(error: unknown): ErrorKind {
  const name = error instanceof Error ? error.name : "";
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  if (
    name === "ChunkLoadError" ||
    /loading (css )?chunk|failed to load chunk|dynamically imported module/i.test(message)
  )
    return "chunk";
  if (name === "QuotaExceededError" || /quota/i.test(message)) return "opslag";
  if (/failed to fetch|networkerror|load failed|network request failed/i.test(message))
    return "netwerk";
  if (name === "TypeError") return "typeerror";
  if (name === "ReferenceError") return "referenceerror";
  if (name === "RangeError") return "rangeerror";
  if (name === "SyntaxError") return "syntaxerror";
  return "overig";
}

/** Hooguit zoveel fouten per pagina-bezoek: een fout in een lus mag de tellers niet volspammen. */
const MAX_ERRORS = 5;
let errorsSent = 0;

export function trackError(kind: ErrorKind): void {
  if (errorsSent >= MAX_ERRORS) return;
  errorsSent++;
  track(`fout:${kind}`);
}

/** Kleine dingen die we op dit apparaat onthouden om een event maar één keer te tellen. */
const LOCAL_KEY = STORAGE_KEYS.stats;

interface LocalFlags {
  /** Je eerste walkout ooit (op dit apparaat) is al geteld. */
  eersteWalkout?: boolean;
  /** Net voor het eerst gekoppeld: het volgende pack is je welkomstpack. */
  welkomstpack?: boolean;
}

function readFlags(): LocalFlags {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) ?? "{}") as LocalFlags;
  } catch {
    return {};
  }
}

function writeFlags(flags: LocalFlags) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(flags));
  } catch {
    // Geen opslag: dan tellen we het misschien dubbel. Geen ramp.
  }
}

/** Een walkout begint (pack of herhaling; oefenen telt apart). */
export function trackWalkoutStart(mode: "pack" | "oefen" | "opnieuw"): void {
  if (!statsAllowed()) return;
  if (mode === "oefen") {
    track("oefen-walkout");
    return;
  }
  track("walkout-gestart");
  const flags = readFlags();
  const next = { ...flags };
  if (!flags.eersteWalkout) {
    track("eerste-walkout");
    next.eersteWalkout = true;
  }
  if (mode === "pack" && flags.welkomstpack) {
    track("welkomstpack-geopend");
    next.welkomstpack = false;
  }
  if (next.eersteWalkout !== flags.eersteWalkout || next.welkomstpack !== flags.welkomstpack)
    writeFlags(next);
}

/** Net voor het eerst gekoppeld met een (nieuw) account: het volgende pack is het welkomstpack. */
export function trackLinked(method: "bookmarklet" | "plakken" | "voorbeeld", isNew: boolean): void {
  if (method === "voorbeeld" || !statsAllowed()) return;
  if (!isNew) {
    track("opnieuw-gekoppeld");
    return;
  }
  track(method === "bookmarklet" ? "gekoppeld:bladwijzer" : "gekoppeld:plakken");
  writeFlags({ ...readFlags(), welkomstpack: true });
}
