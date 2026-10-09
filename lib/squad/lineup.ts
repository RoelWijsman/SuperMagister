import { BENCH_SIZE, FORMATIONS, slotLine, type FormationId, type Line } from "./formations";

/**
 * Een opstelling: welke kaart op welke plek staat, wie er op de bank zit en wie
 * de aanvoerder is. Alleen kaart-id's: de kaarten zelf komen uit je collectie.
 * Alle bewerkingen geven een nieuwe opstelling terug (niets wordt aangepast).
 */
export interface Lineup {
  formation: FormationId;
  /** Per slot-id van de formatie: een kaart-id of null. */
  slots: Record<string, string | null>;
  /** Zeven plekken op de bank. */
  bench: (string | null)[];
  captain: string | null;
}

export type Spot = { kind: "veld"; slot: string } | { kind: "bank"; index: number };

export function emptyLineup(formation: FormationId = "4-3-3"): Lineup {
  return {
    formation,
    slots: Object.fromEntries(FORMATIONS[formation].slots.map((s) => [s.id, null])),
    bench: Array.from({ length: BENCH_SIZE }, () => null),
    captain: null,
  };
}

export function sameSpot(a: Spot, b: Spot): boolean {
  return a.kind === "veld"
    ? b.kind === "veld" && a.slot === b.slot
    : b.kind === "bank" && a.index === b.index;
}

export function cardAt(lineup: Lineup, spot: Spot): string | null {
  return spot.kind === "veld"
    ? (lineup.slots[spot.slot] ?? null)
    : (lineup.bench[spot.index] ?? null);
}

export function spotOf(lineup: Lineup, cardId: string): Spot | null {
  for (const [slot, id] of Object.entries(lineup.slots))
    if (id === cardId) return { kind: "veld", slot };
  const index = lineup.bench.indexOf(cardId);
  return index >= 0 ? { kind: "bank", index } : null;
}

/** Alle kaarten in de selectie (veld en bank). */
export function squadCardIds(lineup: Lineup): string[] {
  return [...Object.values(lineup.slots), ...lineup.bench].filter(
    (id): id is string => id !== null,
  );
}

function withCard(lineup: Lineup, spot: Spot, cardId: string | null): Lineup {
  if (spot.kind === "veld") return { ...lineup, slots: { ...lineup.slots, [spot.slot]: cardId } };
  const bench = [...lineup.bench];
  bench[spot.index] = cardId;
  return { ...lineup, bench };
}

/** De aanvoerder moet op het veld staan; anders is er even geen. */
function fixCaptain(lineup: Lineup): Lineup {
  if (lineup.captain && !Object.values(lineup.slots).includes(lineup.captain))
    return { ...lineup, captain: null };
  return lineup;
}

/** Een zet die niet mag: er staat al een kaart van hetzelfde vak op het veld. */
export interface FieldConflict {
  /** De kaart van hetzelfde vak die al op het veld staat. */
  cardId: string;
  slot: string;
}

export interface MoveResult {
  lineup: Lineup;
  /** Gezet als de zet niet mag; de opstelling is dan onveranderd. */
  conflict: FieldConflict | null;
}

/** Staat deze kaart op het veld naast een andere kaart van hetzelfde vak? */
function conflictFor(
  lineup: Lineup,
  cardId: string,
  vakOf: (cardId: string) => string | undefined,
): FieldConflict | null {
  if (!Object.values(lineup.slots).includes(cardId)) return null;
  const vak = vakOf(cardId);
  if (vak === undefined) return null;
  for (const [slot, id] of Object.entries(lineup.slots))
    if (id && id !== cardId && vakOf(id) === vak) return { cardId: id, slot };
  return null;
}

/** Wisselt twee plekken om (veld of bank), tenzij er dan twee keer hetzelfde vak op het veld staat. */
export function trySwap(
  lineup: Lineup,
  a: Spot,
  b: Spot,
  vakOf?: (cardId: string) => string | undefined,
): MoveResult {
  if (sameSpot(a, b)) return { lineup, conflict: null };
  const first = cardAt(lineup, a);
  const second = cardAt(lineup, b);
  const next = fixCaptain(withCard(withCard(lineup, a, second), b, first));
  if (vakOf)
    for (const id of [first, second]) {
      const conflict = id ? conflictFor(next, id, vakOf) : null;
      if (conflict) return { lineup, conflict };
    }
  return { lineup: next, conflict: null };
}

/**
 * Zet een kaart op een plek.
 * - Staat de kaart al in de selectie, dan wisselt hij van plek met wat er stond.
 * - Wie er op de plek stond, gaat terug naar de lijst.
 * - Op het veld één kaart per vak: staat het vak al ergens anders op het veld,
 *   dan mag het niet (eerst die kaart vervangen of wisselen). Op de bank mag een
 *   tweede kaart van een vak wel: dat is een reserve.
 */
export function tryPlace(
  lineup: Lineup,
  spot: Spot,
  cardId: string,
  vakOf: (cardId: string) => string | undefined,
): MoveResult {
  const current = spotOf(lineup, cardId);
  if (current) return trySwap(lineup, current, spot, vakOf);
  const next = fixCaptain(withCard(lineup, spot, cardId));
  const conflict = conflictFor(next, cardId, vakOf);
  return conflict ? { lineup, conflict } : { lineup: next, conflict: null };
}

export function placeCard(
  lineup: Lineup,
  spot: Spot,
  cardId: string,
  vakOf: (cardId: string) => string | undefined,
): Lineup {
  return tryPlace(lineup, spot, cardId, vakOf).lineup;
}

export function swapSpots(
  lineup: Lineup,
  a: Spot,
  b: Spot,
  vakOf?: (cardId: string) => string | undefined,
): Lineup {
  return trySwap(lineup, a, b, vakOf).lineup;
}

export function removeAt(lineup: Lineup, spot: Spot): Lineup {
  return fixCaptain(withCard(lineup, spot, null));
}

/** Van het veld naar de eerste vrije plek op de bank; null als de bank vol is. */
export function toBench(lineup: Lineup, spot: Spot): Lineup | null {
  if (spot.kind === "bank") return lineup;
  const cardId = cardAt(lineup, spot);
  if (!cardId) return lineup;
  const free = lineup.bench.indexOf(null);
  if (free < 0) return null;
  return fixCaptain(withCard(withCard(lineup, spot, null), { kind: "bank", index: free }, cardId));
}

/** Aanvoerder kiezen (alleen iemand op het veld), of opnieuw tikken om hem weg te halen. */
export function setCaptain(lineup: Lineup, cardId: string | null): Lineup {
  if (cardId === null || lineup.captain === cardId) return { ...lineup, captain: null };
  if (!Object.values(lineup.slots).includes(cardId)) return lineup;
  return { ...lineup, captain: cardId };
}

export function clearLineup(lineup: Lineup): Lineup {
  return emptyLineup(lineup.formation);
}

/**
 * Maakt een bewaarde opstelling weer geldig: kaarten die er niet meer zijn eruit,
 * geen dubbele vakken op het veld, elke kaart maar één keer, de plekken van de
 * formatie, zeven plekken op de bank en een aanvoerder die op het veld staat.
 */
export function cleanLineup(
  lineup: Lineup,
  exists: (cardId: string) => boolean,
  vakOf: (cardId: string) => string | undefined,
): Lineup {
  const formation = FORMATIONS[lineup.formation] ? lineup.formation : "4-3-3";
  const used = new Set<string>();
  const fieldVakken = new Set<string>();
  const slots = Object.fromEntries(
    FORMATIONS[formation].slots.map((s) => {
      const id = lineup.slots?.[s.id];
      if (!id || used.has(id) || !exists(id)) return [s.id, null];
      const vak = vakOf(id) ?? id;
      if (fieldVakken.has(vak)) return [s.id, null];
      used.add(id);
      fieldVakken.add(vak);
      return [s.id, id];
    }),
  );
  const bench = Array.from({ length: BENCH_SIZE }, (_, i) => {
    const id = lineup.bench?.[i];
    if (!id || used.has(id) || !exists(id)) return null;
    used.add(id);
    return id;
  });
  return fixCaptain({ formation, slots, bench, captain: lineup.captain ?? null });
}

/** Welke linie een plek is (voor de lijst met kaarten). */
export function lineOfSpot(lineup: Lineup, spot: Spot): Line | null {
  if (spot.kind === "bank") return null;
  const slot = FORMATIONS[lineup.formation].slots.find((s) => s.id === spot.slot);
  return slot ? slotLine(slot) : null;
}

/** Een plek als tekst ("veld:sp", "bank:3"), voor slepen en schermlezers. */
export function spotKey(spot: Spot): string {
  return spot.kind === "veld" ? `veld:${spot.slot}` : `bank:${spot.index}`;
}

export function parseSpotKey(key: string): Spot | null {
  const [kind, rest] = key.split(":");
  if (kind === "veld" && rest) return { kind: "veld", slot: rest };
  if (kind === "bank" && rest !== undefined && /^\d+$/.test(rest))
    return { kind: "bank", index: Number(rest) };
  return null;
}
