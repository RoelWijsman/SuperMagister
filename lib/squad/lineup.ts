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

/**
 * Zet een kaart op een plek.
 * - Staat de kaart al in de selectie, dan wisselt hij van plek met wat er stond.
 * - Geen dubbele vakken: staat er al een kaart van hetzelfde vak, dan gaat die
 *   eruit (terug naar de lijst) en neemt de nieuwe kaart het over.
 * - Wie er op de plek stond, gaat terug naar de lijst.
 */
export function placeCard(
  lineup: Lineup,
  spot: Spot,
  cardId: string,
  vakOf: (cardId: string) => string | undefined,
): Lineup {
  const current = spotOf(lineup, cardId);
  if (current) return swapSpots(lineup, current, spot);

  const vak = vakOf(cardId);
  let next = lineup;
  if (vak !== undefined) {
    for (const other of squadCardIds(lineup)) {
      if (other !== cardId && vakOf(other) === vak) {
        const otherSpot = spotOf(next, other);
        if (otherSpot) next = withCard(next, otherSpot, null);
      }
    }
  }
  return fixCaptain(withCard(next, spot, cardId));
}

/** Wisselt twee plekken om (veld of bank). */
export function swapSpots(lineup: Lineup, a: Spot, b: Spot): Lineup {
  if (sameSpot(a, b)) return lineup;
  const first = cardAt(lineup, a);
  const second = cardAt(lineup, b);
  return fixCaptain(withCard(withCard(lineup, a, second), b, first));
}

export function removeAt(lineup: Lineup, spot: Spot): Lineup {
  return fixCaptain(withCard(lineup, spot, null));
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
 * Andere formatie: iedereen blijft zoveel mogelijk op een passende plek. Eerst
 * dezelfde plek (slot-id), dan dezelfde positie, dan dezelfde linie, dan wat er
 * over is. Wie geen plek meer heeft, gaat naar de bank (als daar ruimte is).
 */
export function changeFormation(lineup: Lineup, to: FormationId): Lineup {
  if (lineup.formation === to) return lineup;
  const from = FORMATIONS[lineup.formation];
  const target = FORMATIONS[to];
  const placed = from.slots.flatMap((slot) => {
    const id = lineup.slots[slot.id];
    return id ? [{ id, slot }] : [];
  });

  const slots: Record<string, string | null> = Object.fromEntries(
    target.slots.map((s) => [s.id, null]),
  );
  const open = new Set(target.slots.map((s) => s.id));
  const waiting = [...placed];
  const passes: ((
    old: (typeof placed)[number]["slot"],
    next: (typeof target.slots)[number],
  ) => boolean)[] = [
    (old, next) => old.id === next.id,
    (old, next) => old.position === next.position,
    (old, next) => slotLine(old) === slotLine(next),
    (old, next) => slotLine(old) !== "keeper" && slotLine(next) !== "keeper",
  ];
  for (const matches of passes) {
    for (const item of [...waiting]) {
      const spot = target.slots.find((s) => open.has(s.id) && matches(item.slot, s));
      if (!spot) continue;
      slots[spot.id] = item.id;
      open.delete(spot.id);
      waiting.splice(waiting.indexOf(item), 1);
    }
  }

  const bench = [...lineup.bench];
  for (const item of waiting) {
    const free = bench.indexOf(null);
    if (free >= 0) bench[free] = item.id;
  }
  return fixCaptain({ formation: to, slots, bench, captain: lineup.captain });
}

/**
 * Maakt een bewaarde opstelling weer geldig: kaarten die er niet meer zijn eruit,
 * geen dubbele vakken (het veld wint van de bank), de plekken van de formatie,
 * zeven plekken op de bank en een aanvoerder die op het veld staat.
 */
export function cleanLineup(
  lineup: Lineup,
  exists: (cardId: string) => boolean,
  vakOf: (cardId: string) => string | undefined,
): Lineup {
  const formation = FORMATIONS[lineup.formation] ? lineup.formation : "4-3-3";
  const seen = new Set<string>();
  const keep = (id: string | null | undefined): string | null => {
    if (!id || !exists(id)) return null;
    const vak = vakOf(id) ?? id;
    if (seen.has(vak)) return null;
    seen.add(vak);
    return id;
  };
  const slots = Object.fromEntries(
    FORMATIONS[formation].slots.map((s) => [s.id, keep(lineup.slots?.[s.id])]),
  );
  const bench = Array.from({ length: BENCH_SIZE }, (_, i) => keep(lineup.bench?.[i]));
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
