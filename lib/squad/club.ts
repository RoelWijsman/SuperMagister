import { CLUB_PREFIXES, CLUB_WORDS } from "@/content/copy";
import type { Random } from "@/lib/random";

/**
 * Je club: een naam (zelf bedacht of uit de generator vol schoolgrappen) en een
 * wapen dat vanzelf ontstaat uit de naam en de kleuren van je thema. Nooit een
 * echte clubnaam: de generator gebruikt alleen schoolwoorden, en zelf invullen
 * mag alles behalve een paar bekende clubs.
 */

export type CrestShape = "schild" | "rond" | "ruit" | "banier";

export const CREST_SHAPES: readonly CrestShape[] = ["schild", "rond", "ruit", "banier"];

export const CREST_LABELS: Readonly<Record<CrestShape, string>> = {
  schild: "Schild",
  rond: "Rond",
  ruit: "Ruit",
  banier: "Banier",
};

/** De vorm van het wapen in een vak van 100 × 120 (SVG-pad, ook bruikbaar als Path2D). */
export const CREST_PATHS: Readonly<Record<CrestShape, string>> = {
  schild: "M50 4 L94 16 C94 62 80 94 50 116 C20 94 6 62 6 16 Z",
  rond: "M50 10 A50 50 0 1 1 49.99 10 Z M50 10",
  ruit: "M50 4 L96 60 L50 116 L4 60 Z",
  banier: "M8 4 H92 V92 L50 116 L8 92 Z",
};

/** De binnenrand (iets kleiner), voor de tweede kleur. */
export const CREST_INNER: Readonly<Record<CrestShape, string>> = {
  schild: "M50 12 L86 22 C86 61 74 88 50 106 C26 88 14 61 14 22 Z",
  rond: "M50 18 A42 42 0 1 1 49.99 18 Z",
  ruit: "M50 15 L87 60 L50 105 L13 60 Z",
  banier: "M16 12 H84 V87 L50 106 L16 87 Z",
};

export const CLUB_NAME_MAX = 28;

export interface Club {
  name: string;
  crest: CrestShape;
}

export const DEFAULT_CLUB: Club = { name: "FC Herkansing", crest: "schild" };

export function generateClubName(random: Random, avoid?: string): string {
  for (let i = 0; i < 8; i++) {
    const name = `${random.pick(CLUB_PREFIXES)} ${random.pick(CLUB_WORDS)}`;
    if (name !== avoid) return name;
  }
  return `${random.pick(CLUB_PREFIXES)} ${random.pick(CLUB_WORDS)}`;
}

/** Echte clubs, die je niet zelf mag invullen (de generator komt er nooit op uit). */
const REAL_CLUBS =
  /\b(ajax|psv|feyenoord|az|twente|utrecht|vitesse|heerenveen|real madrid|barcelona|bar[cç]a|atl[eé]tico madrid|manchester|liverpool|chelsea|arsenal|tottenham|juventus|milan|inter milan|internazionale|napoli|roma|lazio|bayern|dortmund|psg|paris saint|marseille|lyon|benfica|porto|sporting lissabon|celtic|rangers|anderlecht|club brugge|galatasaray|fenerbah[cç]e)\b/i;

export function isRealClubName(name: string): boolean {
  return REAL_CLUBS.test(name);
}

/** Een geldige clubnaam: netjes ingekort, nooit leeg en nooit een echte club. */
export function cleanClubName(name: string): string {
  const clean = name.replace(/\s+/g, " ").trim().slice(0, CLUB_NAME_MAX);
  return clean && !isRealClubName(clean) ? clean : DEFAULT_CLUB.name;
}

/** Initialen voor op het wapen: "FC Herkansing" → "FCH", "Atletico Aula" → "AA". */
export function clubInitials(name: string): string {
  const words = name
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0]!.slice(0, 3).toUpperCase();
  const first = words[0]!;
  // Een afkorting vooraan (FC, SV, AC) blijft heel.
  const lead = /^[A-Z]{2,3}$/.test(first) ? first : first[0]!.toUpperCase();
  return (
    lead +
    words
      .slice(1)
      .map((w) => w[0]!.toUpperCase())
      .join("")
  ).slice(0, 4);
}
