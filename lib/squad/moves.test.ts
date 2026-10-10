import { describe, expect, it } from "vitest";
import { createRandom } from "@/lib/random";
import { evaluateSquad } from "./chemistry";
import { FORMATIONS, slotLine } from "./formations";
import { HISTORY_LIMIT, recordStep, undoStep } from "./history";
import {
  applyMove,
  describeChanges,
  emptyLineup,
  planMove,
  removeFromSquad,
  returnToCollection,
  sendToBench,
  setCaptain,
  type Lineup,
  type Source,
  type Spot,
} from "./lineup";
import { pickerOptions } from "./picker";
import type { SquadPlayer } from "./players";

/**
 * Jouw Elftal, het spelersmodel: elk vak is één speler, elke kaart van dat vak
 * een versie. Een speler staat hooguit één keer in je selectie (veld of bank),
 * en geen enkele zet laat zomaar iemand verdwijnen of een gat achter.
 */

let counter = 0;
function version(vak: string, rating: number, extra: Partial<SquadPlayer> = {}): SquadPlayer {
  counter++;
  const group =
    extra.group ??
    (vak === "lo"
      ? "bewegen"
      : ["wis", "bio", "nat", "sk"].includes(vak)
        ? "exact"
        : ["en", "ne", "du"].includes(vak)
          ? "talen"
          : ["gs", "ak", "econ"].includes(vak)
            ? "mens-maatschappij"
            : "kunst-cultuur");
  const natural =
    group === "bewegen"
      ? "keeper"
      : group === "exact"
        ? "aanval"
        : group === "talen"
          ? "middenveld"
          : group === "mens-maatschappij"
            ? "verdediging"
            : "flexibel";
  return {
    id: `${vak}-${rating}-${counter}`,
    vak,
    subjectName: vak.toUpperCase(),
    shortName: vak,
    group,
    natural,
    rating,
    judged: null,
    tier: "goud",
    isIcon: false,
    period: null,
    testKind: null,
    ...extra,
  };
}

/** Twaalf vakken, de meeste met een paar versies. */
function pool(): SquadPlayer[] {
  return [
    version("lo", 80),
    version("lo", 65),
    version("gs", 88),
    version("gs", 70),
    version("ak", 83),
    version("econ", 73),
    version("en", 79),
    version("en", 74),
    version("ne", 78),
    version("du", 60),
    version("wis", 91),
    version("wis", 70),
    version("bio", 79),
    version("nat", 77),
    version("sk", 75),
    version("tek", 95),
    version("tek", 68),
  ];
}

const mapOf = (players: readonly SquadPlayer[]) => new Map(players.map((p) => [p.id, p]));
const card = (players: readonly SquadPlayer[], vak: string, rating: number) =>
  players.find((p) => p.vak === vak && p.rating === rating)!.id;
const veld = (slot: string): Spot => ({ kind: "veld", slot });
const bank = (index: number): Spot => ({ kind: "bank", index });
const kaart = (cardId: string): Source => ({ kind: "kaart", cardId });
const plek = (spot: Spot): Source => ({ kind: "plek", spot });

/** Een 4-3-3 zoals in de melding: scheikunde op CM-R, Engels 79 op CM-L. */
function scenario() {
  const players = pool();
  const id = (vak: string, rating: number) => card(players, vak, rating);
  const lineup: Lineup = {
    ...emptyLineup("4-3-3"),
    slots: {
      k: id("lo", 80),
      lb: id("gs", 88),
      "cv-l": id("ak", 83),
      "cv-r": id("econ", 73),
      rb: id("tek", 95),
      "cm-l": id("en", 79),
      "cm-m": id("ne", 78),
      "cm-r": id("sk", 75),
      lv: id("nat", 77),
      sp: id("wis", 91),
      rv: id("bio", 79),
    },
    bench: [id("du", 60), null, null, null, null, null, null],
    captain: id("wis", 91),
  };
  const vakOf = (cardId: string) => players.find((p) => p.id === cardId)?.vak;
  return { players, lineup, vakOf, id };
}

/** Geen vak twee keer, geen kaart twee keer, op het veld of de bank. */
function assertOnePerVak(lineup: Lineup, vakOf: (id: string) => string | undefined) {
  const ids = [...Object.values(lineup.slots), ...lineup.bench].filter((x): x is string => !!x);
  expect(new Set(ids).size).toBe(ids.length);
  const vakken = ids.map((x) => vakOf(x));
  expect(new Set(vakken).size).toBe(vakken.length);
}

describe("elk vak is één speler", () => {
  it("een andere versie van een vak dat al ergens staat, kan alleen op die plek (melding 1)", () => {
    const { lineup, vakOf, id } = scenario();
    // Engels 74 voor de plek van scheikunde, terwijl Engels 79 op CM-L staat: mag niet.
    const plan = planMove(lineup, kaart(id("en", 74)), veld("cm-r"), vakOf);
    expect(plan).toEqual({ ok: false, reason: "vak-staat-al", at: veld("cm-l") });
    expect(applyMove(lineup, kaart(id("en", 74)), veld("cm-r"), vakOf)).toBeNull();
    // Op de plek van Engels zelf is het een andere versie: dat mag, en de positie blijft.
    expect(planMove(lineup, kaart(id("en", 74)), veld("cm-l"), vakOf)).toEqual({
      ok: true,
      kind: "versie",
    });
  });

  it("blijft één speler per vak, wat je ook doet (willekeurige zetten)", () => {
    const { players, lineup: start, vakOf } = scenario();
    const random = createRandom(11);
    const spots: Spot[] = [
      ...FORMATIONS["4-3-3"].slots.map((s) => veld(s.id)),
      ...Array.from({ length: 7 }, (_, i) => bank(i)),
    ];
    let lineup = start;
    for (let step = 0; step < 600; step++) {
      const target = random.pick(spots);
      const roll = random.next();
      const result =
        roll < 0.45
          ? applyMove(lineup, kaart(random.pick(players).id), target, vakOf)
          : roll < 0.8
            ? applyMove(lineup, plek(random.pick(spots)), target, vakOf)
            : roll < 0.88
              ? sendToBench(lineup, target)
              : roll < 0.95
                ? removeFromSquad(lineup, target)
                : returnToCollection(lineup, target);
      if (result) lineup = result.lineup;
      assertOnePerVak(lineup, vakOf);
    }
  });
});

describe("vervangen", () => {
  it("de oude speler gaat naar de bank als daar plek is", () => {
    const { lineup, vakOf, id } = scenario();
    // Alle twaalf vakken staan in de selectie; haal Duits van de bank, dan is hij beschikbaar.
    const freed = removeFromSquad(lineup, bank(0))!.lineup;
    const result = applyMove(freed, kaart(id("du", 60)), veld("cm-r"), vakOf)!;
    expect(result.lineup.slots["cm-r"]).toBe(id("du", 60));
    expect(result.lineup.bench).toContain(id("sk", 75));
    expect(result.changes).toEqual([
      { kind: "op", cardId: id("du", 60), spot: veld("cm-r") },
      { kind: "bank", cardId: id("sk", 75) },
    ]);
  });

  it("… en terug naar de collectie als de bank vol is", () => {
    const { lineup, vakOf, id } = scenario();
    const freed = removeFromSquad(lineup, bank(0))!.lineup;
    const full = { ...freed, bench: ["x1", "x2", "x3", "x4", "x5", "x6", "x7"] };
    const result = applyMove(full, kaart(id("du", 60)), veld("cm-r"), vakOf)!;
    expect(result.lineup.slots["cm-r"]).toBe(id("du", 60));
    expect([...Object.values(result.lineup.slots), ...result.lineup.bench]).not.toContain(
      id("sk", 75),
    );
    expect(result.changes.at(-1)).toEqual({ kind: "collectie", cardId: id("sk", 75) });
  });

  it("op de bank vervangen: de oude gaat terug naar de collectie", () => {
    const { lineup, vakOf, id, players } = scenario();
    const extra = version("mu", 70);
    const all = [...players, extra];
    const vak = (cardId: string) => all.find((p) => p.id === cardId)?.vak;
    const result = applyMove(lineup, kaart(extra.id), bank(0), vak)!;
    expect(result.lineup.bench[0]).toBe(extra.id);
    expect(result.changes).toContainEqual({ kind: "collectie", cardId: id("du", 60) });
    expect(vakOf(extra.id)).toBeUndefined();
  });

  it("haal weg: van het veld naar de bank (of de collectie), nooit zomaar weg", () => {
    const { lineup, id } = scenario();
    const result = removeFromSquad(lineup, veld("cm-r"))!;
    expect(result.lineup.slots["cm-r"]).toBeNull();
    expect(result.lineup.bench).toContain(id("sk", 75));
    expect(result.changes).toEqual([
      { kind: "bank", cardId: id("sk", 75) },
      { kind: "leeg", spot: veld("cm-r") },
    ]);
    const fromBench = removeFromSquad(lineup, bank(0))!;
    expect(fromBench.changes).toEqual([{ kind: "collectie", cardId: id("du", 60) }]);
  });

  it("naar de bank: alleen als er plek is", () => {
    const { lineup, id } = scenario();
    const result = sendToBench(lineup, veld("sp"))!;
    expect(result.lineup.slots.sp).toBeNull();
    expect(result.lineup.bench[1]).toBe(id("wis", 91));
    // De aanvoerder op de bank is geen aanvoerder meer.
    expect(result.lineup.captain).toBeNull();
    const full = { ...lineup, bench: ["x1", "x2", "x3", "x4", "x5", "x6", "x7"] };
    expect(sendToBench(full, veld("sp"))).toBeNull();
  });
});

describe("wisselen", () => {
  it("wissel met laat geen gaten achter: beide plekken blijven gevuld", () => {
    const { lineup, vakOf, id, players } = scenario();
    for (const [source, target] of [
      [plek(veld("sp")), veld("cm-r")],
      [plek(veld("sp")), bank(0)],
      [kaart(id("du", 60)), veld("cm-r")],
      [kaart(id("wis", 91)), veld("lv")],
    ] as const) {
      expect(planMove(lineup, source, target, vakOf)).toEqual({ ok: true, kind: "wisselen" });
      const result = applyMove(lineup, source, target, vakOf)!;
      const filled = (spot: Spot) =>
        spot.kind === "veld" ? result.lineup.slots[spot.slot] : result.lineup.bench[spot.index];
      expect(filled(target)).not.toBeNull();
      const from = source.kind === "plek" ? source.spot : null;
      if (from) expect(filled(from)).not.toBeNull();
      expect(evaluateSquad(result.lineup, mapOf(players)).placed).toBe(11);
    }
  });

  it("een speler naar een lege plek verhuizen zegt dat de oude plek leeg wordt (melding 2)", () => {
    const { lineup, vakOf, id } = scenario();
    const open = { ...lineup, slots: { ...lineup.slots, lv: null } };
    expect(planMove(open, kaart(id("wis", 91)), veld("lv"), vakOf)).toEqual({
      ok: true,
      kind: "verplaatsen",
    });
    const result = applyMove(open, kaart(id("wis", 91)), veld("lv"), vakOf)!;
    expect(result.changes).toEqual([
      { kind: "op", cardId: id("wis", 91), spot: veld("lv") },
      { kind: "leeg", spot: veld("sp") },
    ]);
  });

  it("dezelfde kaart op dezelfde plek doet niets", () => {
    const { lineup, vakOf, id } = scenario();
    expect(planMove(lineup, kaart(id("wis", 91)), veld("sp"), vakOf)).toEqual({
      ok: false,
      reason: "zelfde",
    });
  });
});

describe("andere versie", () => {
  it("houdt de positie, de oude versie gaat terug naar de collectie, de band blijft", () => {
    const { lineup, vakOf, id } = scenario();
    const result = applyMove(lineup, kaart(id("wis", 70)), veld("sp"), vakOf)!;
    expect(result.lineup.slots.sp).toBe(id("wis", 70));
    expect(result.lineup.captain).toBe(id("wis", 70));
    expect(result.changes).toEqual([
      { kind: "op", cardId: id("wis", 70), spot: veld("sp") },
      { kind: "collectie", cardId: id("wis", 91) },
    ]);
    // Alle andere plekken zijn onveranderd.
    for (const [slot, cardId] of Object.entries(lineup.slots))
      if (slot !== "sp") expect(result.lineup.slots[slot]).toBe(cardId);
    expect(result.lineup.bench).toEqual(lineup.bench);
  });
});

describe("meldingen", () => {
  it("zeggen precies wat er gebeurde", () => {
    const { lineup, vakOf, id, players } = scenario();
    const name = (cardId: string) => {
      const p = players.find((x) => x.id === cardId)!;
      return `${p.subjectName} ${p.rating}`;
    };
    const position = (spot: Spot) =>
      spot.kind === "bank"
        ? "de bank"
        : FORMATIONS["4-3-3"].slots.find((s) => s.id === spot.slot)!.position;
    const versie = applyMove(lineup, kaart(id("en", 74)), veld("cm-l"), vakOf)!;
    expect(describeChanges(versie.changes, name, position)).toBe(
      "EN 74 staat op CM. EN 79 terug naar je collectie.",
    );
    const wissel = applyMove(lineup, plek(veld("sp")), bank(0), vakOf)!;
    expect(describeChanges(wissel.changes, name, position)).toBe("WIS 91 en DU 60 gewisseld.");
  });
});

describe("ongedaan maken", () => {
  it("herstelt exact de vorige stand, ook na een paar stappen", () => {
    const { lineup, vakOf, id } = scenario();
    let past: Lineup[] = [];
    let current = lineup;
    const snapshots = [current];
    for (const [source, target] of [
      [kaart(id("wis", 70)), veld("sp")],
      [plek(veld("cm-r")), bank(0)],
      [kaart(id("en", 74)), veld("cm-l")],
    ] as const) {
      const next = applyMove(current, source, target, vakOf)!.lineup;
      past = recordStep(past, current);
      current = next;
      snapshots.push(current);
    }
    current = setCaptain(current, id("ne", 78));
    past = recordStep(past, snapshots.at(-1)!);
    snapshots.push(current);
    for (let i = snapshots.length - 2; i >= 0; i--) {
      const step = undoStep(past)!;
      past = step.past;
      current = step.lineup;
      expect(current).toEqual(snapshots[i]);
    }
    expect(undoStep(past)).toBeNull();
  });

  it("bewaart de laatste 20 stappen", () => {
    let past: Lineup[] = [];
    for (let i = 0; i < 30; i++) past = recordStep(past, emptyLineup(i % 2 ? "4-4-2" : "4-3-3"));
    expect(past).toHaveLength(HISTORY_LIMIT);
    expect(HISTORY_LIMIT).toBe(20);
  });
});

describe("onvolledig elftal", () => {
  it("geeft nooit een hogere rating dan met die speler erbij", () => {
    const { lineup, players } = scenario();
    const map = mapOf(players);
    const full = evaluateSquad(lineup, map);
    expect(full.complete).toBe(true);
    for (const slot of FORMATIONS["4-3-3"].slots) {
      const gap = evaluateSquad({ ...lineup, slots: { ...lineup.slots, [slot.id]: null } }, map);
      expect(gap.complete).toBe(false);
      expect(gap.placed).toBe(10);
      expect(gap.rating).toBeLessThan(full.rating);
      expect(gap.chemistry).toBeLessThanOrEqual(full.chemistry);
      // Een linie met een gat heeft geen rating, en geen enkele linie wordt hoger.
      expect(gap.lineRatings[slotLine(slot)]).toBeNull();
      for (const [line, rating] of Object.entries(gap.lineRatings))
        if (rating !== null) {
          const was = full.lineRatings[line as keyof typeof full.lineRatings]!;
          expect(rating).toBeLessThanOrEqual(was);
        }
    }
  });

  it("telt een lege plek als 0", () => {
    const { lineup, players } = scenario();
    const gap = evaluateSquad({ ...lineup, slots: { ...lineup.slots, sp: null } }, mapOf(players));
    expect(gap.rating).toBe(Math.round(gap.ratingSum / 11));
  });
});

describe("de kiezer", () => {
  it("laat per vak één regel zien, apart wat er al in je selectie staat", () => {
    const { lineup, players } = scenario();
    const freed = removeFromSquad(lineup, bank(0))!.lineup; // Duits weer beschikbaar
    const options = pickerOptions(freed, veld("cm-r"), mapOf(players));
    expect(options.current?.player.vak).toBe("sk");
    // Beschikbaar: alleen Duits (de rest staat al in je selectie).
    expect(options.available.map((g) => g.vak)).toEqual(["du"]);
    expect(options.available[0]!.best.changes).toContainEqual({
      kind: "bank",
      cardId: lineup.slots["cm-r"],
    });
    // In je selectie: iedereen behalve scheikunde zelf, allemaal "wisselen".
    expect(options.selected.map((o) => o.player.vak)).not.toContain("sk");
    expect(options.selected.every((o) => o.kind === "wisselen")).toBe(true);
    expect(options.selected).toHaveLength(10);
    // Een andere versie van Engels staat nergens als losse keuze voor deze plek.
    const all = [
      ...options.available.flatMap((g) => [g.best, ...g.others]),
      ...options.selected,
      ...(options.current?.versions ?? []),
    ];
    expect(all.filter((o) => o.player.vak === "en")).toHaveLength(1);
  });

  it("biedt andere versies van het vak op deze plek aan", () => {
    const { lineup, players } = scenario();
    const options = pickerOptions(lineup, veld("cm-l"), mapOf(players));
    expect(options.current?.player.rating).toBe(79);
    expect(options.current?.versions.map((o) => o.player.rating)).toEqual([74]);
    expect(options.current?.versions[0]!.kind).toBe("versie");
  });
});
