import {
  FORMATIONS,
  LINES,
  neighbours,
  slotLine,
  type Formation,
  type Line,
  type Slot,
} from "./formations";
import type { Lineup } from "./lineup";
import type { SquadPlayer } from "./players";

/**
 * Chemie, klassiek Ultimate Team: lijnen tussen plekken die naast elkaar staan,
 * spelerschemie 0–10 en teamchemie 0–100.
 *
 * - Lijn groen: dezelfde vakgroep. Oranje: andere vakgroep, maar dezelfde periode
 *   of dezelfde soort toets (allebei een SO). Rood: geen van beide. Een ICON-kaart
 *   heeft met iedereen minstens oranje.
 * - Spelerschemie: een basis voor de plek (natuurlijke linie het meest, flexibel
 *   een punt minder, verkeerde linie flink minder, keeper op het veld of andersom
 *   altijd 0) plus wat de lijnen opleveren. De aanvoerder krijgt er 1 bij (max 10).
 * - Teamchemie: alle spelerschemie bij elkaar, geschaald naar 100 (elf keer 10 =
 *   100). Een lege plek telt als 0.
 */

export type LinkStrength = "groen" | "oranje" | "rood";

/** Punten voor de spelerschemie per lijn. */
export const LINK_POINTS: Readonly<Record<LinkStrength, number>> = {
  groen: 10,
  oranje: 5,
  rood: 0,
};

export function linkStrength(a: SquadPlayer, b: SquadPlayer): LinkStrength {
  if (a.group === b.group) return "groen";
  if (a.isIcon || b.isIcon) return "oranje";
  if (a.period !== null && a.period === b.period) return "oranje";
  if (a.testKind !== null && a.testKind === b.testKind) return "oranje";
  return "rood";
}

/** Hoe goed een speler op een plek past. */
export type PositionFit = "natuurlijk" | "flexibel" | "verkeerd" | "onmogelijk";

export function positionFit(player: SquadPlayer, line: Line): PositionFit {
  if (line === "keeper") return player.natural === "keeper" ? "natuurlijk" : "onmogelijk";
  if (player.natural === "keeper") return "onmogelijk";
  if (player.natural === line) return "natuurlijk";
  if (player.natural === "flexibel") return "flexibel";
  return "verkeerd";
}

/** Basis en hoeveel de lijnen meetellen, per soort plek. */
const FIT_RULES: Readonly<Record<PositionFit, { base: number; links: number }>> = {
  natuurlijk: { base: 4, links: 0.6 },
  flexibel: { base: 3, links: 0.6 },
  verkeerd: { base: 1, links: 0.4 },
  onmogelijk: { base: 0, links: 0 },
};

/**
 * Spelerschemie 0–10. `linkPoints` is het gemiddelde van de lijnen naar bezette
 * buurplekken (groen 10, oranje 5, rood 0); zonder buren is het 0.
 */
export function playerChemistry(fit: PositionFit, linkPoints: number, captain = false): number {
  if (fit === "onmogelijk") return 0;
  const rule = FIT_RULES[fit];
  const raw = Math.round(rule.base + rule.links * linkPoints) + (captain ? 1 : 0);
  return Math.max(0, Math.min(10, raw));
}

/** Teamchemie 0–100 uit de spelerschemie van de elf plekken (lege plek = 0). */
export function teamChemistry(chemistries: readonly number[], slots = 11): number {
  const total = chemistries.reduce((sum, value) => sum + value, 0);
  return Math.round((total / (slots * 10)) * 100);
}

/** Squad-rating: het gemiddelde van de kaart-ratings op het veld, afgerond. */
export function squadRating(ratings: readonly number[]): number {
  if (ratings.length === 0) return 0;
  return Math.round(ratings.reduce((sum, r) => sum + r, 0) / ratings.length);
}

export interface SlotResult {
  slot: Slot;
  line: Line;
  player: SquadPlayer | null;
  fit: PositionFit | null;
  /** 0–10; 0 bij een lege plek. */
  chemistry: number;
  captain: boolean;
}

export interface LinkResult {
  a: string;
  b: string;
  /** null als een van beide plekken leeg is. */
  strength: LinkStrength | null;
}

export interface SquadEvaluation {
  formation: Formation;
  slots: SlotResult[];
  links: LinkResult[];
  /** Gemiddelde rating van de spelers op het veld, afgerond (0 zonder spelers). */
  rating: number;
  /** Onafgeronde som van de ratings, voor het automatisch bouwen. */
  ratingSum: number;
  chemistry: number;
  /** Gemiddelde rating per linie, of null als er niemand staat. */
  lineRatings: Record<Line, number | null>;
  placed: number;
}

export function evaluateSquad(
  lineup: Pick<Lineup, "formation" | "slots" | "captain">,
  players: ReadonlyMap<string, SquadPlayer>,
): SquadEvaluation {
  const formation = FORMATIONS[lineup.formation];
  const at = (slotId: string) => {
    const id = lineup.slots[slotId];
    return id ? (players.get(id) ?? null) : null;
  };

  const links: LinkResult[] = formation.links.map(([a, b]) => {
    const pa = at(a);
    const pb = at(b);
    return { a, b, strength: pa && pb ? linkStrength(pa, pb) : null };
  });

  const slots: SlotResult[] = formation.slots.map((slot) => {
    const player = at(slot.id);
    const line = slotLine(slot);
    if (!player) return { slot, line, player, fit: null, chemistry: 0, captain: false };
    const fit = positionFit(player, line);
    const points = neighbours(formation, slot.id).flatMap((other) => {
      const mate = at(other);
      return mate ? [LINK_POINTS[linkStrength(player, mate)]] : [];
    });
    const linkPoints = points.length ? points.reduce((s, p) => s + p, 0) / points.length : 0;
    const captain = lineup.captain === player.id;
    return {
      slot,
      line,
      player,
      fit,
      chemistry: playerChemistry(fit, linkPoints, captain),
      captain,
    };
  });

  const ratings = slots.flatMap((s) => (s.player ? [s.player.rating] : []));
  const lineRatings = Object.fromEntries(
    LINES.map((line) => {
      const inLine = slots.filter((s) => s.line === line && s.player).map((s) => s.player!.rating);
      return [line, inLine.length ? squadRating(inLine) : null];
    }),
  ) as Record<Line, number | null>;

  return {
    formation,
    slots,
    links,
    rating: squadRating(ratings),
    ratingSum: ratings.reduce((sum, r) => sum + r, 0),
    chemistry: teamChemistry(
      slots.map((s) => s.chemistry),
      formation.slots.length,
    ),
    lineRatings,
    placed: ratings.length,
  };
}
