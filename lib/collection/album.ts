import { cardScore, VARIANT_ORDER, type CardVariant } from "@/lib/calc/cards";
import { TIER_ORDER, type CardTier } from "@/lib/calc/tiers";

/**
 * Het album (§12): filteren, tellen en sorteren. Puur, zodat de collectie
 * pagina alleen nog hoeft te tekenen.
 */
export interface AlbumCard {
  id: string;
  subjectId: string;
  subjectName: string;
  periodName: string | null;
  tier: CardTier;
  /** null bij een beoordeling zonder cijfer (V, G, …). */
  rating: number | null;
  variants: readonly CardVariant[];
  grade: { enteredAt: string; periodId: string | null };
}

export interface AlbumFilters {
  subjectId: string | null;
  tier: CardTier | null;
  periodId: string | null;
  variant: CardVariant | null;
}

export const NO_FILTERS: AlbumFilters = {
  subjectId: null,
  tier: null,
  periodId: null,
  variant: null,
};

export function filterCards<T extends AlbumCard>(cards: readonly T[], filters: AlbumFilters): T[] {
  return cards.filter(
    (card) =>
      (!filters.subjectId || card.subjectId === filters.subjectId) &&
      (!filters.tier || card.tier === filters.tier) &&
      (!filters.periodId || card.grade.periodId === filters.periodId) &&
      (!filters.variant || card.variants.includes(filters.variant)),
  );
}

export function tierCounts(cards: readonly Pick<AlbumCard, "tier">[]): Record<CardTier, number> {
  const counts = Object.fromEntries(TIER_ORDER.map((tier) => [tier, 0])) as Record<
    CardTier,
    number
  >;
  for (const card of cards) counts[card.tier] += 1;
  return counts;
}

export type AlbumSort = "nieuw" | "rating" | "vak";

const newestFirst = (a: AlbumCard, b: AlbumCard) =>
  b.grade.enteredAt.localeCompare(a.grade.enteredAt);

export function sortCards<T extends AlbumCard>(cards: readonly T[], sort: AlbumSort): T[] {
  const sorted = [...cards];
  if (sort === "nieuw") return sorted.sort(newestFirst);
  if (sort === "rating")
    return sorted.sort((a, b) => cardScore(b) - cardScore(a) || newestFirst(a, b));
  return sorted.sort(
    (a, b) =>
      a.subjectName.localeCompare(b.subjectName, "nl") ||
      cardScore(b) - cardScore(a) ||
      newestFirst(a, b),
  );
}

export interface FilterOption {
  id: string;
  name: string;
  count: number;
}

/** Alleen keuzes die echt in je album voorkomen. */
export function filterOptions(cards: readonly AlbumCard[]) {
  const subjects = new Map<string, FilterOption>();
  const periods = new Map<string, FilterOption>();
  const tiers = new Set<CardTier>();
  const variants = new Set<CardVariant>();

  for (const card of cards) {
    const subject = subjects.get(card.subjectId) ?? {
      id: card.subjectId,
      name: card.subjectName,
      count: 0,
    };
    subject.count += 1;
    subjects.set(card.subjectId, subject);

    const periodId = card.grade.periodId;
    if (periodId) {
      const period = periods.get(periodId) ?? {
        id: periodId,
        name: card.periodName ?? periodId,
        count: 0,
      };
      period.count += 1;
      periods.set(periodId, period);
    }
    tiers.add(card.tier);
    for (const variant of card.variants) variants.add(variant);
  }

  return {
    subjects: [...subjects.values()].sort((a, b) => a.name.localeCompare(b.name, "nl")),
    periods: [...periods.values()].sort((a, b) => a.name.localeCompare(b.name, "nl")),
    tiers: TIER_ORDER.filter((tier) => tiers.has(tier)),
    variants: VARIANT_ORDER.filter((variant) => variants.has(variant)),
  };
}
