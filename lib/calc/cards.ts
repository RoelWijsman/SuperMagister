import type { Grade, TextGradeValue } from "@/lib/types";
import { formatGrade, roundHalfUp } from "./average";
import { cardRating, cardTier, TIER_ORDER, type CardTier } from "./tiers";

/**
 * Van cijfers naar verzamelkaarten (§11): tier, varianten en de zes stats.
 * Per vak lopen we de cijfers op datum door, zodat elke kaart weet wat het
 * gemiddelde vóór en na dat cijfer was.
 */
export type CardVariant = "inform" | "record" | "comeback" | "reeks";

/** Volgorde van belangrijkheid; de eerste bepaalt de look (In Form = zwart met goud). */
export const VARIANT_ORDER: readonly CardVariant[] = ["inform", "record", "comeback", "reeks"];

export const VARIANT_LABELS: Readonly<Record<CardVariant, string>> = {
  inform: "IN FORM",
  record: "RECORD",
  comeback: "COMEBACK",
  reeks: "REEKS",
};

export interface CardStats {
  /** Het cijfer. */
  cyf: string;
  /** Vakgemiddelde na dit cijfer. */
  gem: string;
  /** Hoeveel het gemiddelde steeg of daalde. */
  imp: string;
  /** Weging. */
  weg: string;
  /** Hoogste cijfer in dit vak (tot en met dit cijfer). */
  top: string;
  /** Voldoende-reeks in dit vak. */
  rks: string;
}

export interface CardCore {
  gradeId: string;
  grade: Grade;
  /** Cijfer × 10, of `null` bij een beoordeling (V, G, …). */
  rating: number | null;
  /** Wat groot linksboven op de kaart staat: "78" of "G". */
  ratingLabel: string;
  tier: CardTier;
  isFail: boolean;
  variants: CardVariant[];
  primaryVariant: CardVariant | null;
  avgBefore: number | null;
  avgAfter: number | null;
  streak: number;
  stats: CardStats;
}

const TEXT_TIERS: Readonly<Record<TextGradeValue, CardTier>> = {
  ZG: "toty",
  G: "goud",
  RV: "zilver",
  V: "zilver",
  VR: "zilver",
  R: "zilver",
  NB: "zilver",
  M: "brons",
  O: "brons",
  ZS: "brons",
  INH: "brons",
};

const chronological = (a: Grade, b: Grade) =>
  a.date.localeCompare(b.date) ||
  a.enteredAt.localeCompare(b.enteredAt) ||
  a.id.localeCompare(b.id);

/** "+0,3", "-0,5" of "±0,0". */
export function formatDelta(delta: number): string {
  const size = roundHalfUp(Math.abs(delta), 1);
  if (size === 0) return "±0,0";
  return `${delta > 0 ? "+" : "-"}${formatGrade(size)}`;
}

const formatWeight = (weight: number) =>
  Number.isInteger(weight) ? String(weight) : String(weight).replace(".", ",");

const countsTowardHistory = (grade: Grade) =>
  grade.countsTowardAverage && (grade.kind === "text" || grade.weight > 0);

/** Kaarten voor alle cijfers, per cijfer-id. */
export function computeCards(grades: readonly Grade[]): Map<string, CardCore> {
  const bySubject = new Map<string, Grade[]>();
  for (const grade of grades) {
    const list = bySubject.get(grade.subjectId) ?? [];
    list.push(grade);
    bySubject.set(grade.subjectId, list);
  }

  const result = new Map<string, CardCore>();
  for (const list of bySubject.values()) {
    let sum = 0;
    let weights = 0;
    let top: number | null = null;
    let streak = 0;
    let lastSufficient: boolean | null = null;

    for (const grade of [...list].sort(chronological)) {
      const avgBefore = weights > 0 ? sum / weights : null;
      const numeric = grade.kind === "numeric";
      const tier = numeric ? cardTier(grade.value) : TEXT_TIERS[grade.value];
      const rating = numeric ? cardRating(grade.value) : null;
      const base = {
        gradeId: grade.id,
        grade,
        rating,
        ratingLabel: rating === null ? grade.display : String(rating),
        tier,
        isFail: grade.isSufficient === false,
      };

      if (!countsTowardHistory(grade)) {
        result.set(grade.id, {
          ...base,
          variants: [],
          primaryVariant: null,
          avgBefore,
          avgAfter: null,
          streak,
          stats: {
            cyf: numeric ? formatGrade(grade.value) : grade.display,
            gem: "—",
            imp: "—",
            weg: `×${formatWeight(grade.weight)}`,
            top: top === null ? "—" : formatGrade(top),
            rks: String(streak),
          },
        });
        continue;
      }

      if (numeric) {
        sum += grade.value * grade.weight;
        weights += grade.weight;
      }
      const avgAfter = weights > 0 ? sum / weights : null;
      const sufficient = grade.isSufficient === true;
      const nextStreak = grade.isSufficient === null ? streak : sufficient ? streak + 1 : 0;

      const variants: CardVariant[] = [];
      if (numeric && avgBefore !== null && grade.value >= avgBefore + 1 - 1e-9)
        variants.push("inform");
      if (numeric && top !== null && grade.value > top) variants.push("record");
      if (sufficient && lastSufficient === false) variants.push("comeback");
      if (nextStreak >= 3) variants.push("reeks");

      if (numeric) top = top === null ? grade.value : Math.max(top, grade.value);

      result.set(grade.id, {
        ...base,
        variants,
        primaryVariant: variants[0] ?? null,
        avgBefore,
        avgAfter,
        streak: nextStreak,
        stats: {
          cyf: numeric ? formatGrade(grade.value) : grade.display,
          gem: numeric && avgAfter !== null ? formatGrade(avgAfter) : "—",
          imp:
            numeric && avgBefore !== null && avgAfter !== null
              ? formatDelta(avgAfter - avgBefore)
              : "—",
          weg: `×${formatWeight(grade.weight)}`,
          top: top === null ? "—" : formatGrade(top),
          rks: String(nextStreak),
        },
      });

      streak = nextStreak;
      if (grade.isSufficient !== null) lastSufficient = sufficient;
    }
  }
  return result;
}

/** Ongeveer welke rating een beoordeling (V, G, …) waard is, om packs te sorteren. */
const TIER_SCORE: Readonly<Record<CardTier, number>> = {
  brons: 45,
  zilver: 62,
  goud: 77,
  toty: 90,
  icon: 97,
};

/** Rating, of bij een beoordeling zonder cijfer een schatting op basis van de tier. */
export const cardScore = (card: Pick<CardCore, "rating" | "tier">) =>
  card.rating ?? TIER_SCORE[card.tier];

/** Volgorde in een pack: het beste cijfer altijd als laatste. */
export function orderPack<T extends Pick<CardCore, "rating" | "tier">>(cards: readonly T[]): T[] {
  return [...cards].sort(
    (a, b) =>
      cardScore(a) - cardScore(b) || TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier),
  );
}
