import type { CardTier } from "@/lib/calc/tiers";
import { normalizeText } from "@/lib/search/fuzzy";
import { matchSubjectInfo } from "@/lib/subjects/catalog";
import { shortSubjectName } from "@/lib/subjects/short";
import type { SubjectGroup, TextGradeValue } from "@/lib/types";
import type { Line } from "./formations";

/**
 * Van kaart naar speler. Elke onthulde kaart is een speler: de rating is cijfer
 * × 10 (net als op de kaart), het vak bepaalt de vakgroep en de vakgroep de
 * natuurlijke linie.
 *
 * Een beoordeling (V, G, …) heeft geen cijfer, maar LO krijgt op bijna elke
 * school alleen V's en G's, en zonder LO heb je geen keeper. Daarom spelen
 * beoordelingen mee met een vaste, zichtbare rating: een G is in het elftal
 * overal 80, ook op het kaartje ("80" met een klein "G" erbij). Vrijstelling,
 * inhalen en "niet beoordeeld" spelen niet mee.
 */

/** Rating in het elftal voor een beoordeling. */
export const TEXT_RATINGS: Readonly<Partial<Record<TextGradeValue, number>>> = {
  ZG: 90,
  G: 80,
  RV: 72,
  V: 65,
  R: 60,
  M: 50,
  O: 45,
  ZS: 40,
};

/** Waar een vak het liefst staat: een linie, of overal (behalve op doel). */
export type NaturalLine = Line | "flexibel";

export const NATURAL_LINES: readonly NaturalLine[] = [
  "aanval",
  "middenveld",
  "verdediging",
  "keeper",
  "flexibel",
];

export const NATURAL_LINE_LABELS: Readonly<Record<NaturalLine, string>> = {
  aanval: "Aanval",
  middenveld: "Middenveld",
  verdediging: "Verdediging",
  keeper: "Keeper",
  flexibel: "Overal (flexibel)",
};

/** Exact valt aan, talen regelen het middenveld, M&M verdedigt, LO staat op doel. */
export const GROUP_LINE: Readonly<Record<SubjectGroup, NaturalLine>> = {
  exact: "aanval",
  talen: "middenveld",
  "mens-maatschappij": "verdediging",
  bewegen: "keeper",
  "kunst-cultuur": "flexibel",
  overig: "flexibel",
};

export const GROUP_LABELS: Readonly<Record<SubjectGroup, string>> = {
  exact: "Exact",
  talen: "Talen",
  "mens-maatschappij": "Mens & Maatschappij",
  bewegen: "Bewegen",
  "kunst-cultuur": "Kunst & Cultuur",
  overig: "Overig",
};

/** Soorten toetsen, afgeleid uit de omschrijving (Magister geeft geen soort mee). */
export type TestKindKey =
  "so" | "proefwerk" | "po" | "mondeling" | "se" | "toets" | "huiswerk" | "lezen";

const TEST_KINDS: readonly [TestKindKey, RegExp][] = [
  ["so", /\bso\b|schriftelijke overhoring|overhoring/],
  ["se", /\bse\b|schoolexamen|\bpta\b|tentamen/],
  ["proefwerk", /\bpw\b|proefwerk|repetitie|\brep\b/],
  ["po", /\bpo\b|praktische opdracht|praktisch|werkstuk|presentatie|verslag|project/],
  ["mondeling", /mondeling|spreek|gesprek/],
  ["lezen", /leesdossier|boekverslag|literatuur|leesverslag/],
  ["huiswerk", /huiswerk|\bhw\b/],
  ["toets", /toets|\btt\b|test\b|\bexamen/],
];

export function testKindOf(description: string): TestKindKey | null {
  const text = normalizeText(description);
  return TEST_KINDS.find(([, pattern]) => pattern.test(text))?.[0] ?? null;
}

/**
 * De sleutel van een vak voor "geen dubbele spelers": de naam, zonder hoofdletters
 * en spaties eromheen. Zo is Wiskunde A uit dit jaar en vorig jaar hetzelfde vak,
 * maar Wiskunde B een ander.
 */
export function vakKey(subjectName: string): string {
  return normalizeText(subjectName).trim().replace(/\s+/g, " ");
}

export interface SquadPlayer {
  /** Het id van de kaart. */
  id: string;
  vak: string;
  subjectName: string;
  /** Korte naam voor op het kaartje: "Wis A", "LO". */
  shortName: string;
  group: SubjectGroup;
  natural: NaturalLine;
  /** Cijfer × 10, of de vaste rating van een beoordeling. */
  rating: number;
  /** De beoordeling (V, G, …) als de rating vast is; null bij een cijfer. */
  judged: TextGradeValue | null;
  tier: CardTier;
  isIcon: boolean;
  /** Schooljaar en periode samen; null als onbekend. */
  period: string | null;
  testKind: TestKindKey | null;
}

/** Wat we van een kaart nodig hebben (zo blijft dit los van de React-kant te testen). */
export interface PlayerSource {
  id: string;
  subjectName: string;
  subjectCode: string;
  rating: number | null;
  tier: CardTier;
  periodName: string | null;
  grade:
    | { kind: "numeric"; periodId: string | null; description: string }
    | { kind: "text"; value: TextGradeValue; periodId: string | null; description: string };
}

/**
 * Maakt een speler van een kaart, of null bij een kaart zonder rating.
 * `lineOverrides` (per vak, uit Instellingen → Vakken) wint van de vakgroep.
 */
export function toSquadPlayer(
  card: PlayerSource,
  lineOverrides: Readonly<Record<string, NaturalLine>> = {},
): SquadPlayer | null {
  const rating =
    card.rating ?? (card.grade.kind === "text" ? (TEXT_RATINGS[card.grade.value] ?? null) : null);
  if (rating === null) return null;
  const group = matchSubjectInfo(card.subjectCode, card.subjectName).group;
  const vak = vakKey(card.subjectName);
  return {
    id: card.id,
    vak,
    subjectName: card.subjectName,
    shortName: shortSubjectName(card.subjectName, card.subjectCode),
    group,
    natural: lineOverrides[vak] ?? GROUP_LINE[group],
    rating,
    judged: card.rating === null && card.grade.kind === "text" ? card.grade.value : null,
    tier: card.tier,
    isIcon: card.tier === "icon",
    period: card.grade.periodId ? `${card.periodName ?? ""}|${card.grade.periodId}` : null,
    testKind: testKindOf(card.grade.description),
  };
}

/** "G telt als 80" bij een beoordeling, anders null. */
export function ratingNote(player: Pick<SquadPlayer, "judged" | "rating">): string | null {
  return player.judged ? `${player.judged} telt als ${player.rating}` : null;
}
