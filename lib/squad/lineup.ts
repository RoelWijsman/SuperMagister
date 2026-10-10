import { BENCH_SIZE, FORMATIONS, slotLine, type FormationId, type Line } from "./formations";

/**
 * Een opstelling: welke kaart op welke plek staat, wie er op de bank zit en wie
 * de aanvoerder is. Alleen kaart-id's: de kaarten zelf komen uit je collectie.
 * Alle bewerkingen geven een nieuwe opstelling terug (niets wordt aangepast).
 *
 * Het spelersmodel: elk vak is één speler, elke kaart van dat vak een versie
 * van die speler. Een speler staat hooguit één keer in je selectie, op het veld
 * óf op de bank. De zetten hieronder kunnen dat niet breken, en niemand
 * verdwijnt zomaar: wie plaats moet maken, gaat naar de bank (als daar plek is)
 * of terug naar je collectie, en dat staat in de lijst met veranderingen.
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

/** Waar de speler (het vak) van deze kaart staat, met welke versie; null als hij niet meedoet. */
export function vakSpot(
  lineup: Lineup,
  vak: string,
  vakOf: (cardId: string) => string | undefined,
): { spot: Spot; cardId: string } | null {
  for (const [slot, id] of Object.entries(lineup.slots))
    if (id && vakOf(id) === vak) return { spot: { kind: "veld", slot }, cardId: id };
  for (const [index, id] of lineup.bench.entries())
    if (id && vakOf(id) === vak) return { spot: { kind: "bank", index }, cardId: id };
  return null;
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

// ——— Zetten ——————————————————————————————————————————————————————————————

/** Wat je verplaatst: een kaart die al op een plek staat, of een kaart uit je collectie. */
export type Source = { kind: "plek"; spot: Spot } | { kind: "kaart"; cardId: string };

/**
 * - plaatsen: een speler die nog niet meedoet, komt op de plek. Wie er stond, gaat
 *   naar de bank (als het een plek op het veld is en de bank niet vol is) of
 *   terug naar je collectie.
 * - versie: een andere versie van de speler die er al staat; de positie blijft.
 * - wisselen: twee spelers in je selectie ruilen van plek. Beide plekken blijven gevuld.
 * - verplaatsen: een speler uit je selectie naar een lege plek; zijn oude plek wordt leeg
 *   (en dat staat er dan ook bij).
 */
export type MoveKind = "plaatsen" | "versie" | "wisselen" | "verplaatsen";

export type MovePlan =
  | { ok: true; kind: MoveKind }
  | { ok: false; reason: "zelfde" }
  /** Dit vak staat al ergens anders, met een andere versie. */
  | { ok: false; reason: "vak-staat-al"; at: Spot };

/** Wat er veranderde, voor de melding met "Ongedaan maken". */
export type Change =
  | { kind: "op"; cardId: string; spot: Spot }
  | { kind: "bank"; cardId: string }
  | { kind: "collectie"; cardId: string }
  | { kind: "wissel"; a: string; b: string }
  | { kind: "leeg"; spot: Spot };

export interface MoveResult {
  lineup: Lineup;
  changes: Change[];
}

type VakOf = (cardId: string) => string | undefined;

/** Wat er gebeurt als je `source` op `target` zet, of waarom het niet kan. */
export function planMove(lineup: Lineup, source: Source, target: Spot, vakOf: VakOf): MovePlan {
  // Een kaart die al in je selectie staat, is hetzelfde als die plek oppakken.
  const from = source.kind === "plek" ? source.spot : (spotOf(lineup, source.cardId) ?? undefined);
  if (from) {
    if (sameSpot(from, target)) return { ok: false, reason: "zelfde" };
    if (!cardAt(lineup, from)) return { ok: false, reason: "zelfde" };
    return { ok: true, kind: cardAt(lineup, target) ? "wisselen" : "verplaatsen" };
  }
  const cardId = (source as { cardId: string }).cardId;
  const vak = vakOf(cardId);
  const present = vak === undefined ? null : vakSpot(lineup, vak, vakOf);
  if (present) {
    if (sameSpot(present.spot, target)) return { ok: true, kind: "versie" };
    return { ok: false, reason: "vak-staat-al", at: present.spot };
  }
  return { ok: true, kind: "plaatsen" };
}

/** Voert de zet uit; null als hij niet mag (dan verandert er niets). */
export function applyMove(
  lineup: Lineup,
  source: Source,
  target: Spot,
  vakOf: VakOf,
): MoveResult | null {
  const plan = planMove(lineup, source, target, vakOf);
  if (!plan.ok) return null;
  const occupant = cardAt(lineup, target);

  if (plan.kind === "wisselen" || plan.kind === "verplaatsen") {
    const from = source.kind === "plek" ? source.spot : spotOf(lineup, source.cardId)!;
    const moving = cardAt(lineup, from)!;
    const next = fixCaptain(withCard(withCard(lineup, from, occupant), target, moving));
    if (plan.kind === "wisselen")
      return { lineup: next, changes: [{ kind: "wissel", a: moving, b: occupant! }] };
    const changes: Change[] = [{ kind: "op", cardId: moving, spot: target }];
    if (from.kind === "veld") changes.push({ kind: "leeg", spot: from });
    return { lineup: next, changes };
  }

  const cardId = (source as { cardId: string }).cardId;
  if (plan.kind === "versie") {
    // Dezelfde speler: de aanvoerdersband gaat mee naar de nieuwe versie.
    const next = withCard(lineup, target, cardId);
    return {
      lineup: { ...next, captain: lineup.captain === occupant ? cardId : next.captain },
      changes: [
        { kind: "op", cardId, spot: target },
        { kind: "collectie", cardId: occupant! },
      ],
    };
  }

  // Plaatsen: wie er stond, naar de bank (vanaf het veld, als er plek is) of naar de collectie.
  let next = withCard(lineup, target, cardId);
  const changes: Change[] = [{ kind: "op", cardId, spot: target }];
  if (occupant) {
    const free = target.kind === "veld" ? next.bench.indexOf(null) : -1;
    if (free >= 0) {
      next = withCard(next, { kind: "bank", index: free }, occupant);
      changes.push({ kind: "bank", cardId: occupant });
    } else changes.push({ kind: "collectie", cardId: occupant });
  }
  return { lineup: fixCaptain(next), changes };
}

/** Van het veld naar de eerste vrije plek op de bank; null als de bank vol is (of de plek leeg). */
export function sendToBench(lineup: Lineup, spot: Spot): MoveResult | null {
  const cardId = cardAt(lineup, spot);
  if (spot.kind !== "veld" || !cardId) return null;
  const free = lineup.bench.indexOf(null);
  if (free < 0) return null;
  return {
    lineup: fixCaptain(
      withCard(withCard(lineup, spot, null), { kind: "bank", index: free }, cardId),
    ),
    changes: [
      { kind: "bank", cardId },
      { kind: "leeg", spot },
    ],
  };
}

/** "Haal weg": van het veld naar de bank als daar plek is, anders (en vanaf de bank) naar de collectie. */
export function removeFromSquad(lineup: Lineup, spot: Spot): MoveResult | null {
  const cardId = cardAt(lineup, spot);
  if (!cardId) return null;
  if (spot.kind === "veld") {
    const benched = sendToBench(lineup, spot);
    if (benched) return benched;
  }
  return returnToCollection(lineup, spot);
}

/** Terug naar je collectie (bijv. een kaart van het veld terugslepen naar de lijst). */
export function returnToCollection(lineup: Lineup, spot: Spot): MoveResult | null {
  const cardId = cardAt(lineup, spot);
  if (!cardId) return null;
  return {
    lineup: fixCaptain(withCard(lineup, spot, null)),
    changes: [
      { kind: "collectie", cardId },
      ...(spot.kind === "veld" ? [{ kind: "leeg", spot } as const] : []),
    ],
  };
}

/** De veranderingen als zinnen: "Engels 74 staat op CM. Engels 79 naar de bank." */
export function describeChanges(
  changes: readonly Change[],
  name: (cardId: string) => string,
  position: (spot: Spot) => string,
): string {
  return changes
    .map((change) => {
      switch (change.kind) {
        case "op":
          return change.spot.kind === "bank"
            ? `${name(change.cardId)} staat op de bank.`
            : `${name(change.cardId)} staat op ${position(change.spot)}.`;
        case "bank":
          return `${name(change.cardId)} naar de bank.`;
        case "collectie":
          return `${name(change.cardId)} terug naar je collectie.`;
        case "wissel":
          return `${name(change.a)} en ${name(change.b)} gewisseld.`;
        case "leeg":
          return `${position(change.spot)} is nu leeg.`;
      }
    })
    .join(" ");
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
 * elk vak hooguit één keer (het veld gaat voor de bank), de plekken van de
 * formatie, zeven plekken op de bank en een aanvoerder die op het veld staat.
 */
export function cleanLineup(
  lineup: Lineup,
  exists: (cardId: string) => boolean,
  vakOf: VakOf,
): Lineup {
  const formation = FORMATIONS[lineup.formation] ? lineup.formation : "4-3-3";
  const vakken = new Set<string>();
  const keep = (id: string | null | undefined): string | null => {
    if (!id || !exists(id)) return null;
    const vak = vakOf(id) ?? id;
    if (vakken.has(vak)) return null;
    vakken.add(vak);
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
