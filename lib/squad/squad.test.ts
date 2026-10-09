import { describe, expect, it } from "vitest";
import { createRandom } from "@/lib/random";
import { analyseSquad } from "./analysis";
import { bestPerVak, buildBestSquad, changeFormation, squadScore } from "./build";
import {
  evaluateSquad,
  inPosition,
  linkStrength,
  playerChemistry,
  positionFit,
  squadRating,
  teamChemistry,
} from "./chemistry";
import { cleanClubName, clubInitials, generateClubName, isRealClubName } from "./club";
import { FORMATION_IDS, FORMATIONS, neighbours, slotLine } from "./formations";
import {
  cleanLineup,
  emptyLineup,
  placeCard,
  setCaptain,
  spotOf,
  squadCardIds,
  swapSpots,
  toBench,
  tryPlace,
  trySwap,
  type Lineup,
} from "./lineup";
import { commentary, GOAL_BY_GROUP, MAX_GOALS, simulateMatch } from "./match";
import { ratingNote, testKindOf, toSquadPlayer, vakKey, type SquadPlayer } from "./players";
import { bestMove, groupByVak, rankForSpot } from "./suggest";
import { COPY } from "@/content/copy";
import { fillCopy } from "@/lib/copy";

let counter = 0;
function player(overrides: Partial<SquadPlayer> = {}): SquadPlayer {
  counter++;
  return {
    id: `kaart-${counter}`,
    vak: `vak-${counter}`,
    subjectName: `Vak ${counter}`,
    shortName: `V${counter}`,
    group: "exact",
    natural: "aanval",
    rating: 70,
    judged: null,
    tier: "goud",
    isIcon: false,
    period: null,
    testKind: null,
    ...overrides,
  };
}

const mapOf = (players: readonly SquadPlayer[]) => new Map(players.map((p) => [p.id, p]));

describe("formaties", () => {
  it.each(FORMATION_IDS)(
    "%s heeft elf plekken, één keeper en lijnen tussen bestaande plekken",
    (id) => {
      const formation = FORMATIONS[id];
      expect(formation.slots).toHaveLength(11);
      expect(new Set(formation.slots.map((s) => s.id)).size).toBe(11);
      expect(formation.slots.filter((s) => slotLine(s) === "keeper")).toHaveLength(1);
      const ids = new Set(formation.slots.map((s) => s.id));
      for (const [a, b] of formation.links) {
        expect(ids.has(a) && ids.has(b)).toBe(true);
        expect(a).not.toBe(b);
      }
      // Iedereen heeft minstens één lijn, net als in Ultimate Team.
      for (const slot of formation.slots)
        expect(neighbours(formation, slot.id).length).toBeGreaterThan(0);
    },
  );

  it("telt de linies van 4-3-3 goed", () => {
    const lines = FORMATIONS["4-3-3"].slots.map(slotLine);
    expect(lines.filter((l) => l === "verdediging")).toHaveLength(4);
    expect(lines.filter((l) => l === "middenveld")).toHaveLength(3);
    expect(lines.filter((l) => l === "aanval")).toHaveLength(3);
  });
});

describe("van kaart naar speler", () => {
  const card = (subjectName: string, subjectCode: string, rating: number | null = 78) => ({
    id: subjectName,
    subjectName,
    subjectCode,
    rating,
    tier: "goud" as const,
    periodName: "Periode 1",
    grade: { kind: "numeric" as const, periodId: "p1", description: "SO hoofdstuk 3" },
  });
  const judged = (value: "G" | "V" | "O" | "VR" | "INH") => ({
    ...card("Lichamelijke opvoeding", "lo", null),
    grade: { kind: "text" as const, value, periodId: "p1", description: "Basketbal" },
  });

  it("geeft elke vakgroep zijn natuurlijke linie", () => {
    expect(toSquadPlayer(card("Wiskunde A", "wisA"))!.natural).toBe("aanval");
    expect(toSquadPlayer(card("Frans", "fa"))!.natural).toBe("middenveld");
    expect(toSquadPlayer(card("Geschiedenis", "gs"))!.natural).toBe("verdediging");
    expect(toSquadPlayer(card("Lichamelijke opvoeding", "lo"))!.natural).toBe("keeper");
    expect(toSquadPlayer(card("Muziek", "mu"))!.natural).toBe("flexibel");
  });

  it("laat een eigen positie per vak winnen", () => {
    const player = toSquadPlayer(card("Biologie", "bi"), { biologie: "verdediging" });
    expect(player!.natural).toBe("verdediging");
  });

  it("beoordelingen spelen mee met een vaste, zichtbare rating (zo heeft LO een keeper)", () => {
    const g = toSquadPlayer(judged("G"))!;
    expect(g).toMatchObject({ rating: 80, judged: "G", natural: "keeper", shortName: "LO" });
    // Wat op het kaartje staat, is wat er meetelt.
    expect(ratingNote(g)).toBe("G telt als 80");
    expect(toSquadPlayer(judged("V"))).toMatchObject({ rating: 65, judged: "V" });
    expect(toSquadPlayer(judged("O"))).toMatchObject({ rating: 45, judged: "O" });
    expect(toSquadPlayer(judged("VR"))).toBeNull();
    expect(toSquadPlayer(judged("INH"))).toBeNull();
    // Een cijfer heeft geen vaste rating en dus geen uitleg.
    const cijfer = toSquadPlayer(card("Wiskunde A", "wisA", 82))!;
    expect(cijfer).toMatchObject({ rating: 82, judged: null, shortName: "Wis A" });
    expect(ratingNote(cijfer)).toBeNull();
  });

  it("herkent de soort toets en het vak", () => {
    expect(testKindOf("SO hoofdstuk 3")).toBe("so");
    expect(testKindOf("Proefwerk H4")).toBe("proefwerk");
    expect(testKindOf("PO presentatie")).toBe("po");
    expect(testKindOf("Mondeling")).toBe("mondeling");
    expect(testKindOf("Iets anders")).toBeNull();
    expect(vakKey("  Wiskunde  A ")).toBe("wiskunde a");
  });
});

describe("chemie per lijn", () => {
  it("is groen bij dezelfde vakgroep", () => {
    expect(linkStrength(player({ group: "talen" }), player({ group: "talen" }))).toBe("groen");
  });

  it("is oranje bij dezelfde periode of dezelfde soort toets", () => {
    expect(
      linkStrength(
        player({ group: "talen", period: "p1" }),
        player({ group: "exact", period: "p1" }),
      ),
    ).toBe("oranje");
    expect(
      linkStrength(
        player({ group: "talen", testKind: "so" }),
        player({ group: "exact", testKind: "so" }),
      ),
    ).toBe("oranje");
  });

  it("is rood als niets overeenkomt (onbekend telt niet als gelijk)", () => {
    expect(linkStrength(player({ group: "talen" }), player({ group: "exact" }))).toBe("rood");
    expect(
      linkStrength(
        player({ group: "talen", period: "p1" }),
        player({ group: "exact", period: "p2" }),
      ),
    ).toBe("rood");
  });

  it("ICON heeft met iedereen minstens oranje, en groen blijft groen", () => {
    const icon = player({ group: "kunst-cultuur", isIcon: true, tier: "icon" });
    expect(linkStrength(icon, player({ group: "exact" }))).toBe("oranje");
    expect(linkStrength(player({ group: "talen" }), icon)).toBe("oranje");
    expect(linkStrength(icon, player({ group: "kunst-cultuur" }))).toBe("groen");
  });
});

describe("spelerschemie en positie-straffen", () => {
  it("natuurlijke positie geeft de volle bonus", () => {
    expect(positionFit(player({ natural: "aanval" }), "aanval")).toBe("natuurlijk");
    expect(playerChemistry("natuurlijk", 10)).toBe(10);
    expect(playerChemistry("natuurlijk", 5)).toBe(7);
    expect(playerChemistry("natuurlijk", 0)).toBe(4);
  });

  it("flexibel kost een punt, uit positie is 0 (zoals in Ultimate Team)", () => {
    expect(positionFit(player({ natural: "flexibel" }), "verdediging")).toBe("flexibel");
    expect(playerChemistry("flexibel", 10)).toBe(9);
    expect(positionFit(player({ natural: "middenveld" }), "aanval")).toBe("verkeerd");
    expect(playerChemistry("verkeerd", 10)).toBe(0);
    expect(playerChemistry("verkeerd", 10, true)).toBe(0);
    expect(inPosition("flexibel")).toBe(true);
    expect(inPosition("verkeerd")).toBe(false);
  });

  it("een speler uit positie kleurt zijn lijnen rood, ook naar zijn eigen vakgroep", () => {
    const sp = player({ group: "exact", natural: "aanval" });
    const cm = player({ group: "exact", natural: "aanval" }); // exact op het middenveld
    const lineup: Lineup = {
      ...emptyLineup("4-3-3"),
      slots: { ...emptyLineup().slots, sp: sp.id, "cm-m": cm.id },
    };
    const result = evaluateSquad(lineup, mapOf([sp, cm]));
    expect(result.links.find((l) => l.a === "cm-m" && l.b === "sp")!.strength).toBe("rood");
    expect(result.slots.find((s) => s.slot.id === "cm-m")!.chemistry).toBe(0);
    // De spits heeft alleen een rode buur: 4 + 0 = 4.
    expect(result.slots.find((s) => s.slot.id === "sp")!.chemistry).toBe(4);
  });

  it("keeper op het veld, of een veldspeler op doel, is altijd 0", () => {
    expect(positionFit(player({ natural: "keeper" }), "middenveld")).toBe("onmogelijk");
    expect(positionFit(player({ natural: "aanval" }), "keeper")).toBe("onmogelijk");
    expect(positionFit(player({ natural: "flexibel" }), "keeper")).toBe("onmogelijk");
    expect(playerChemistry("onmogelijk", 10)).toBe(0);
    expect(playerChemistry("onmogelijk", 10, true)).toBe(0);
  });

  it("de aanvoerder krijgt er 1 bij, maar nooit meer dan 10", () => {
    expect(playerChemistry("natuurlijk", 5, true)).toBe(8);
    expect(playerChemistry("natuurlijk", 10, true)).toBe(10);
  });
});

describe("teamchemie en squad-rating", () => {
  it("teamchemie is de som van spelerschemie, geschaald naar 100", () => {
    expect(teamChemistry(Array(11).fill(10))).toBe(100);
    expect(teamChemistry([10, 10, 10, 10, 10, 0, 0, 0, 0, 0, 0])).toBe(45);
    expect(teamChemistry([])).toBe(0);
  });

  it("squad-rating is het afgeronde gemiddelde", () => {
    expect(squadRating([80, 81])).toBe(81);
    expect(squadRating([70, 70, 71])).toBe(70);
    expect(squadRating([])).toBe(0);
  });

  it("rekent een heel elftal door", () => {
    // 4-3-3 met iedereen op zijn natuurlijke plek en alleen groene lijnen per linie.
    const keeper = player({ group: "bewegen", natural: "keeper", rating: 60 });
    const defs = Array.from({ length: 4 }, () =>
      player({ group: "mens-maatschappij", natural: "verdediging", rating: 70 }),
    );
    const mids = Array.from({ length: 3 }, () =>
      player({ group: "talen", natural: "middenveld", rating: 80 }),
    );
    const atts = Array.from({ length: 3 }, () =>
      player({ group: "exact", natural: "aanval", rating: 90 }),
    );
    const all = [keeper, ...defs, ...mids, ...atts];
    const order = ["k", "lb", "cv-l", "cv-r", "rb", "cm-l", "cm-m", "cm-r", "lv", "sp", "rv"];
    const lineup: Lineup = {
      ...emptyLineup("4-3-3"),
      slots: Object.fromEntries(order.map((id, i) => [id, all[i]!.id])),
    };
    const result = evaluateSquad(lineup, mapOf(all));
    expect(result.placed).toBe(11);
    expect(result.rating).toBe(Math.round((60 + 4 * 70 + 3 * 80 + 3 * 90) / 11));
    expect(result.lineRatings).toEqual({ aanval: 90, middenveld: 80, verdediging: 70, keeper: 60 });
    // De spits heeft alleen groene buren (LV, RV) en één rode (CM): (10+10+0)/3 → 4 + 0,6 × 6,67 = 8.
    const sp = result.slots.find((s) => s.slot.id === "sp")!;
    expect(sp.chemistry).toBe(8);
    // Met de spits als aanvoerder: 9.
    const withCaptain = evaluateSquad(setCaptain(lineup, atts[1]!.id), mapOf(all));
    expect(withCaptain.slots.find((s) => s.slot.id === "sp")!.chemistry).toBe(9);
    expect(withCaptain.chemistry).toBe(result.chemistry + 1);
  });
});

describe("opstelling", () => {
  const wisA = player({ vak: "wiskunde a" });
  const wisA2 = player({ vak: "wiskunde a", rating: 90 });
  const frans = player({ vak: "frans", group: "talen", natural: "middenveld" });
  const all = [wisA, wisA2, frans];
  const vakOf = (id: string) => all.find((p) => p.id === id)?.vak;

  it("op het veld één kaart per vak: ernaast zetten mag niet, en zegt waarom", () => {
    const lineup = placeCard(emptyLineup(), { kind: "veld", slot: "sp" }, wisA.id, vakOf);
    const result = tryPlace(lineup, { kind: "veld", slot: "lv" }, wisA2.id, vakOf);
    expect(result.conflict).toEqual({ cardId: wisA.id, slot: "sp" });
    expect(result.lineup).toBe(lineup);
  });

  it("op dezelfde plek mag een andere kaart van het vak het wel overnemen", () => {
    let lineup = placeCard(emptyLineup(), { kind: "veld", slot: "sp" }, wisA.id, vakOf);
    lineup = placeCard(lineup, { kind: "veld", slot: "sp" }, wisA2.id, vakOf);
    expect(lineup.slots.sp).toBe(wisA2.id);
    expect(squadCardIds(lineup)).toEqual([wisA2.id]);
  });

  it("op de bank mag een reserve van hetzelfde vak, die alleen voor dat vak invalt", () => {
    let lineup = placeCard(emptyLineup(), { kind: "veld", slot: "sp" }, wisA.id, vakOf);
    lineup = placeCard(lineup, { kind: "veld", slot: "cm-m" }, frans.id, vakOf);
    lineup = placeCard(lineup, { kind: "bank", index: 0 }, wisA2.id, vakOf);
    expect(lineup.bench[0]).toBe(wisA2.id);
    // Met wiskunde wisselen kan.
    const swap = trySwap(lineup, { kind: "bank", index: 0 }, { kind: "veld", slot: "sp" }, vakOf);
    expect(swap.conflict).toBeNull();
    expect(swap.lineup.slots.sp).toBe(wisA2.id);
    // Voor Frans invallen niet: dan staat wiskunde er twee keer.
    const wrong = trySwap(
      lineup,
      { kind: "bank", index: 0 },
      { kind: "veld", slot: "cm-m" },
      vakOf,
    );
    expect(wrong.conflict).toEqual({ cardId: wisA.id, slot: "sp" });
    expect(wrong.lineup).toBe(lineup);
  });

  it("een kaart die al in de selectie staat, wisselt van plek", () => {
    let lineup = placeCard(emptyLineup(), { kind: "veld", slot: "sp" }, wisA.id, vakOf);
    lineup = placeCard(lineup, { kind: "veld", slot: "cm-m" }, frans.id, vakOf);
    lineup = placeCard(lineup, { kind: "veld", slot: "cm-m" }, wisA.id, vakOf);
    expect(lineup.slots["cm-m"]).toBe(wisA.id);
    expect(lineup.slots.sp).toBe(frans.id);
  });

  it("wisselen tussen veld en bank, en de aanvoerder moet op het veld staan", () => {
    let lineup = placeCard(emptyLineup(), { kind: "veld", slot: "sp" }, wisA.id, vakOf);
    lineup = placeCard(lineup, { kind: "bank", index: 2 }, frans.id, vakOf);
    lineup = setCaptain(lineup, wisA.id);
    expect(setCaptain(lineup, frans.id).captain).toBe(wisA.id); // bank kan geen aanvoerder zijn
    lineup = swapSpots(lineup, { kind: "veld", slot: "sp" }, { kind: "bank", index: 2 }, vakOf);
    expect(lineup.slots.sp).toBe(frans.id);
    expect(lineup.bench[2]).toBe(wisA.id);
    expect(lineup.captain).toBeNull();
  });

  it("naar de bank: de eerste vrije plek, of niet als de bank vol is", () => {
    const lineup = placeCard(emptyLineup(), { kind: "veld", slot: "sp" }, wisA.id, vakOf);
    const benched = toBench(lineup, { kind: "veld", slot: "sp" })!;
    expect(benched.slots.sp).toBeNull();
    expect(benched.bench[0]).toBe(wisA.id);
    const full = { ...lineup, bench: Array.from({ length: 7 }, (_, i) => `bank-${i}`) };
    expect(toBench(full, { kind: "veld", slot: "sp" })).toBeNull();
  });

  it("maakt een bewaarde opstelling weer geldig", () => {
    const stored = {
      formation: "4-3-3",
      slots: { sp: wisA.id, lv: wisA2.id, "cm-m": "weg" },
      bench: [frans.id, wisA2.id, wisA.id],
      captain: "weg",
    } as unknown as Lineup;
    const clean = cleanLineup(stored, (id) => all.some((p) => p.id === id), vakOf);
    // Twee keer wiskunde A op het veld: de eerste plek in de formatie (LV komt vóór SP) houdt hem.
    expect(clean.slots.lv).toBe(wisA2.id);
    expect(clean.slots.sp).toBeNull();
    expect(clean.slots["cm-m"]).toBeNull();
    expect(clean.bench).toHaveLength(7);
    expect(clean.bench[0]).toBe(frans.id);
    // Een kaart staat maar op één plek; een reserve van hetzelfde vak op de bank mag.
    expect(clean.bench[1]).toBeNull();
    expect(clean.bench[2]).toBe(wisA.id);
    expect(clean.captain).toBeNull();
    expect(Object.keys(clean.slots)).toHaveLength(11);
  });
});

/** Zoals de demo: vier exacte vakken, drie talen (Duits zwak), drie M&M-vakken, Tekenen en LO. */
function demoPool(): SquadPlayer[] {
  const p = (
    vak: string,
    group: SquadPlayer["group"],
    rating: number,
    extra: Partial<SquadPlayer> = {},
  ) =>
    player({
      vak,
      subjectName: vak,
      group,
      natural:
        group === "exact"
          ? "aanval"
          : group === "talen"
            ? "middenveld"
            : group === "mens-maatschappij"
              ? "verdediging"
              : group === "bewegen"
                ? "keeper"
                : "flexibel",
      rating,
      ...extra,
    });
  return [
    p("lo", "bewegen", 80, { judged: "G" }),
    p("lo", "bewegen", 65, { judged: "V" }),
    p("geschiedenis", "mens-maatschappij", 88),
    p("geschiedenis", "mens-maatschappij", 70),
    p("aardrijkskunde", "mens-maatschappij", 83),
    p("economie", "mens-maatschappij", 73),
    p("engels", "talen", 81),
    p("engels", "talen", 74),
    p("nederlands", "talen", 78),
    p("duits", "talen", 60),
    p("duits", "talen", 54),
    p("wiskunde a", "exact", 97),
    p("wiskunde a", "exact", 70),
    p("biologie", "exact", 84),
    p("natuurkunde", "exact", 80),
    p("scheikunde", "exact", 75),
    p("tekenen", "kunst-cultuur", 95, { isIcon: true, tier: "icon" }),
    p("tekenen", "kunst-cultuur", 68),
  ];
}

describe("automatisch bouwen", () => {
  it("kiest per vak de beste kaart", () => {
    const best = bestPerVak(demoPool());
    expect(best.filter((p) => p.vak === "wiskunde a")).toHaveLength(1);
    expect(best.find((p) => p.vak === "wiskunde a")!.rating).toBe(97);
  });

  it("zet geen exact vak op het middenveld als een taal daar kan staan", () => {
    const { evaluation } = buildBestSquad(demoPool(), "4-3-3");
    const midfield = evaluation.slots.filter((s) => s.line === "middenveld");
    expect(midfield.every((s) => s.player!.group !== "exact")).toBe(true);
    expect(midfield.map((s) => s.player!.vak)).toContain("duits");
    // Er is een verdeling waarin iedereen op een eigen of flexibele plek staat: die wint.
    expect(evaluation.slots.every((s) => inPosition(s.fit))).toBe(true);
    expect(evaluation.slots.find((s) => s.line === "keeper")!.player!.vak).toBe("lo");
    expect(new Set(evaluation.slots.map((s) => s.player!.vak)).size).toBe(11);
  });

  it("vult de bank met zeven wissels: eerst per linie één reserve", () => {
    const pool = demoPool();
    const { lineup } = buildBestSquad(pool, "4-3-3");
    const players = mapOf(pool);
    const byId = new Map(pool.map((p) => [p.id, p]));
    expect(lineup.bench.filter(Boolean)).toHaveLength(7);
    const bench = lineup.bench.map((id) => byId.get(id!)!);
    expect(bench[0]!.natural).toBe("keeper");
    expect(bench[1]!.natural).toMatch(/verdediging|flexibel/);
    expect(bench[2]!.natural).toMatch(/middenveld|flexibel/);
    expect(bench[3]!.natural).toMatch(/aanval|flexibel/);
    // Scheikunde staat niet op het veld, dus is de reserve voor de aanval.
    expect(bench[3]!.vak).toBe("scheikunde");
    // Niemand staat twee keer in de selectie.
    expect(new Set(squadCardIds(lineup)).size).toBe(18);
    expect(players.size).toBe(18);
  });

  it("is minstens zo goed als alleen op rating kiezen, en altijd hetzelfde", () => {
    const players = demoPool();
    const a = buildBestSquad(players, "4-3-3");
    const b = buildBestSquad([...players].reverse(), "4-3-3");
    expect(a.lineup).toEqual(b.lineup);
    expect(a.evaluation.chemistry).toBeGreaterThanOrEqual(a.ratingOnly.chemistry);
    expect(squadScore(a.evaluation)).toBeGreaterThan(0);
    expect(a.lineup.captain).not.toBeNull();
  });

  it("werkt ook met weinig kaarten of helemaal geen", () => {
    expect(buildBestSquad([], "4-4-2").evaluation.placed).toBe(0);
    const few = buildBestSquad(demoPool().slice(0, 4), "4-4-2");
    // Vier kaarten, waarvan twee keer LO en twee keer geschiedenis: twee vakken op het veld.
    expect(few.evaluation.placed).toBe(2);
    expect(few.lineup.bench.filter(Boolean)).toHaveLength(2);
  });
});

describe("formatie wisselen", () => {
  const pool = demoPool();
  const players = mapOf(pool);
  const built = buildBestSquad(pool, "4-3-3").lineup;

  it.each(["4-4-2", "4-2-3-1", "3-5-2", "5-3-2"] as const)(
    "4-3-3 → %s verdeelt dezelfde elf kaarten op hun natuurlijke linie",
    (to) => {
      const next = changeFormation(built, to, players);
      const evaluation = evaluateSquad(next, players);
      expect(evaluation.placed).toBe(11);
      expect(squadCardIds({ ...next, bench: [] }).sort()).toEqual(
        squadCardIds({ ...built, bench: [] }).sort(),
      );
      expect(next.bench).toEqual(built.bench);
      expect(next.captain).toBe(built.captain);
      // Op doel LO, in de spits alleen exacte vakken.
      expect(evaluation.slots.find((s) => s.line === "keeper")!.player!.vak).toBe("lo");
      for (const slot of evaluation.slots.filter((s) => s.slot.position === "SP"))
        expect(slot.player!.group).toBe("exact");
      // Nooit meer spelers uit positie dan nodig: alleen als een linie te klein is voor een
      // vakgroep (vier exacte vakken, maar één spits in 4-2-3-1).
      const out = evaluation.slots.filter((s) => !inPosition(s.fit));
      const needed: Record<string, number> = { "4-4-2": 1, "4-2-3-1": 2, "3-5-2": 1, "5-3-2": 1 };
      expect(out.length).toBeLessThanOrEqual(needed[to]!);
      // Moet een exact vak uit positie, dan op het middenveld (ernaast), niet achterin,
      // tenzij er vijf verdedigers zijn en maar drie M&M-vakken plus Tekenen.
      if (to !== "5-3-2")
        for (const slot of evaluation.slots.filter((s) => s.line === "verdediging"))
          expect(slot.player!.group).not.toBe("exact");
    },
  );

  it("verliest weinig chemie, en terug naar 4-3-3 is weer het oude niveau", () => {
    const start = evaluateSquad(built, players).chemistry;
    const there = changeFormation(built, "3-5-2", players);
    const back = changeFormation(there, "4-3-3", players);
    expect(evaluateSquad(there, players).chemistry).toBeGreaterThan(start - 15);
    expect(evaluateSquad(back, players).chemistry).toBeGreaterThanOrEqual(start - 2);
  });
});

describe("tips: alleen zetten die kunnen en echt beter zijn", () => {
  const pool = demoPool();
  const players = mapOf(pool);
  const vakOf = (id: string) => players.get(id)?.vak;

  it("na Bouw beste elftal is er geen zet meer die beter is", () => {
    const { lineup, evaluation } = buildBestSquad(pool, "4-3-3");
    expect(bestMove(lineup, players)).toBeNull();
    expect(analyseSquad(evaluation, null).tip.kind).not.toBe("zet");
  });

  it("stelt een zet voor die kan en de score verhoogt", () => {
    const { lineup } = buildBestSquad(pool, "4-3-3");
    // Scheikunde (van de bank) op de plek van Duits: exact op het middenveld.
    const duits = Object.entries(lineup.slots).find(([, id]) => vakOf(id!) === "duits")![0];
    const scheikunde = pool.find((p) => p.vak === "scheikunde")!;
    const worse = placeCard(lineup, { kind: "veld", slot: duits }, scheikunde.id, vakOf);
    const advice = bestMove(worse, players)!;
    expect(advice).not.toBeNull();
    expect(squadScore(evaluateSquad(advice.next, players))).toBeGreaterThan(
      squadScore(evaluateSquad(worse, players)),
    );
    expect(advice.effect.rating + advice.effect.chemistry).toBeGreaterThan(0);
    // De zet zelf mag: geen vak twee keer op het veld.
    const vakken = Object.values(advice.next.slots).map((id) => vakOf(id!));
    expect(new Set(vakken).size).toBe(11);
    const tip = analyseSquad(evaluateSquad(worse, players), advice).tip;
    expect(tip.kind).toBe("zet");
  });

  it("noemt geen zet als de aanval vol zit met betere exacte vakken", () => {
    // Zonder Duits: één exact vak moet wel uit positie, en dat is de beste keus.
    const noGerman = pool.filter((p) => p.vak !== "duits");
    const map = mapOf(noGerman);
    const { lineup, evaluation } = buildBestSquad(noGerman, "4-3-3");
    expect(evaluation.slots.some((s) => !inPosition(s.fit))).toBe(true);
    expect(bestMove(lineup, map)).toBeNull();
  });

  it("noemt lege plekken alleen als er kaarten zijn om ze te vullen", () => {
    const lineup = placeCard(emptyLineup(), { kind: "veld", slot: "sp" }, "x", () => "x");
    const one = new Map([["x", player({ id: "x", subjectName: "Wiskunde", rating: 88 })]]);
    const analysis = analyseSquad(evaluateSquad(lineup, one), null, true);
    expect(analysis.strongest).toEqual({ line: "aanval", rating: 88, subject: "Wiskunde" });
    expect(analysis.tip).toEqual({ kind: "leeg", open: 10 });
    expect(analyseSquad(evaluateSquad(lineup, one), null, false).tip.kind).toBe("aanvoerder");
  });
});

const spotKeyOf = (spot: { kind: string; slot?: string } | null) => spot?.slot;

describe("kiezen per plek", () => {
  const pool = demoPool();
  const players = mapOf(pool);
  const vakOf = (id: string) => players.get(id)?.vak;
  const { lineup } = buildBestSquad(pool, "4-3-3");
  const midSlot = Object.entries(lineup.slots).find(([, id]) => vakOf(id!) === "duits")![0];

  it("laat per kaart zien wat er met rating en chemie gebeurt, op dezelfde manier", () => {
    const ranked = rankForSpot(lineup, { kind: "veld", slot: midSlot }, pool, players);
    const before = evaluateSquad(lineup, players);
    for (const s of ranked.filter((r) => !r.conflict)) {
      const after = evaluateSquad(
        placeCard(lineup, { kind: "veld", slot: midSlot }, s.player.id, vakOf),
        players,
      );
      expect(s.effect).toEqual({
        rating: after.rating - before.rating,
        chemistry: after.chemistry - before.chemistry,
      });
      expect(s.chemistry).toBe(after.slots.find((x) => x.slot.id === midSlot)!.chemistry);
    }
    // Twee kaarten van hetzelfde vak die allebei uit je kaarten komen, krijgen dezelfde chemie
    // als ze dezelfde periode en toetssoort hebben.
    const engels = ranked.filter((r) => r.player.vak === "engels" && !r.from);
    expect(new Set(engels.map((r) => r.chemistry)).size).toBeLessThanOrEqual(1);
  });

  it("zegt wie er verder verschuift, en blokkeert een tweede kaart van een vak op het veld", () => {
    const ranked = rankForSpot(lineup, { kind: "veld", slot: midSlot }, pool, players);
    // Engels staat al op het middenveld: die kaart wisselt van plek met Duits.
    const engelsOpVeld = ranked.find((r) => r.player.vak === "engels" && r.from?.kind === "veld")!;
    expect(engelsOpVeld.displaced).toEqual({
      cardId: lineup.slots[midSlot],
      to: engelsOpVeld.from,
    });
    // De andere Engels-kaart mag hier niet bij: Engels staat dan twee keer op het veld.
    const engelsReserve = ranked.find((r) => r.player.vak === "engels" && r.from?.kind !== "veld")!;
    expect(engelsReserve.conflict).toEqual({
      cardId: engelsOpVeld.player.id,
      slot: spotKeyOf(engelsOpVeld.from),
    });
    // Een kaart uit je kaarten (lege bank): Duits gaat terug naar je kaarten.
    const noBench = { ...lineup, bench: lineup.bench.map(() => null) };
    const fromList = rankForSpot(noBench, { kind: "veld", slot: midSlot }, pool, players);
    const extra = fromList.find((r) => !r.from && !r.conflict)!;
    expect(extra.displaced).toEqual({ cardId: lineup.slots[midSlot], to: null });
  });

  it("groepeert per vak: alleen de beste kaart vooraan", () => {
    const ranked = rankForSpot(lineup, { kind: "veld", slot: midSlot }, pool, players);
    const groups = groupByVak(ranked);
    expect(new Set(groups.map((g) => g.vak)).size).toBe(groups.length);
    for (const g of groups) for (const r of g.rest) expect(r.player.vak).toBe(g.vak);
    expect(groups.reduce((n, g) => n + 1 + g.rest.length, 0)).toBe(ranked.length);
  });

  it("naar de bank: de best passende reserve komt erin, anders een vrije plek", async () => {
    const { substitute } = await import("./suggest");
    // Bank vol na het bouwen: Duits eruit, de middenveld-reserve (Engels 74 mag niet: Engels
    // speelt al) of een andere reserve die mag, erin.
    const result = substitute(lineup, { kind: "veld", slot: midSlot }, players)!;
    expect(result.incoming).not.toBeNull();
    expect(result.lineup.slots[midSlot]).toBe(result.incoming);
    expect(result.lineup.bench).toContain(lineup.slots[midSlot]);
    const vakken = Object.values(result.lineup.slots).map((id) => vakOf(id!));
    expect(new Set(vakken).size).toBe(11);
    // Lege bank: de kaart gaat naar de bank en de plek blijft leeg.
    const noBench = { ...lineup, bench: lineup.bench.map(() => null) };
    const alone = substitute(noBench, { kind: "veld", slot: midSlot }, players)!;
    expect(alone.incoming).toBeNull();
    expect(alone.lineup.slots[midSlot]).toBeNull();
    expect(alone.lineup.bench[0]).toBe(lineup.slots[midSlot]);
  });

  it("op de bank telt de rating", () => {
    const empty = emptyLineup("4-3-3");
    const ranked = rankForSpot(empty, { kind: "bank", index: 0 }, pool, players);
    expect(ranked[0]!.player.rating).toBe(97);
    expect(ranked[0]!.chemistry).toBeNull();
  });
});

describe("club en oefenwedstrijd", () => {
  it("maakt clubnamen en initialen, nooit een echte club", () => {
    const random = createRandom(7);
    for (let i = 0; i < 200; i++) expect(isRealClubName(generateClubName(random))).toBe(false);
    expect(cleanClubName("Real Madrid")).toBe("FC Herkansing");
    expect(cleanClubName("  SV   Tussenuur  ")).toBe("SV Tussenuur");
    expect(cleanClubName("")).toBe("FC Herkansing");
    expect(clubInitials("FC Herkansing")).toBe("FCH");
    expect(clubInitials("Atletico Aula")).toBe("AA");
    expect(clubInitials("Kluisje")).toBe("KLU");
  });

  const strong = buildBestSquad(demoPool(), "4-3-3").evaluation;

  it("speelt een oefenwedstrijd: altijd dezelfde bij dezelfde seed, en een sterk team wint vaker", () => {
    const a = simulateMatch(strong, 42);
    expect(simulateMatch(strong, 42)).toEqual(a);
    expect(a.events.at(-1)!.kind).toBe("einde");
    expect(a.events.at(-1)!.score).toEqual(a.score);
    const empty = evaluateSquad(emptyLineup(), new Map());
    let wins = 0;
    let losses = 0;
    for (let seed = 1; seed <= 200; seed++) {
      if (simulateMatch(strong, seed).outcome === "winst") wins++;
      if (simulateMatch(empty, seed).outcome === "verlies") losses++;
    }
    expect(wins).toBeGreaterThan(100);
    expect(losses).toBeGreaterThan(140);
  });

  it("houdt de uitslagen realistisch: meestal 0 tot 4 per team, nooit meer dan 6", () => {
    const empty = evaluateSquad(emptyLineup(), new Map());
    const goals: number[] = [];
    for (const evaluation of [strong, empty])
      for (let seed = 1; seed <= 1000; seed++) goals.push(...simulateMatch(evaluation, seed).score);
    expect(Math.max(...goals)).toBeLessThanOrEqual(MAX_GOALS);
    expect(goals.filter((g) => g <= 4).length / goals.length).toBeGreaterThan(0.9);
    const average = goals.reduce((a, b) => a + b, 0) / goals.length;
    expect(average).toBeGreaterThan(0.8);
    expect(average).toBeLessThan(2.2);
  });

  it("commentaar herhaalt zich niet en een vak-grap past bij het vak", () => {
    const special = new Map(
      Object.entries(GOAL_BY_GROUP).flatMap(([group, key]) =>
        COPY[key].map((text) => [text, group] as const),
      ),
    );
    for (let seed = 1; seed <= 300; seed++) {
      const result = simulateMatch(strong, seed);
      const lines = commentary(result, seed);
      expect(lines).toHaveLength(result.events.length);
      expect(new Set(lines).size).toBe(lines.length);
      result.events.forEach((event, i) => {
        for (const [template, group] of special)
          if (fillCopy(template, { vak: event.subject ?? "Iemand" }) === lines[i])
            expect(event.group).toBe(group);
      });
    }
  });

  it("geeft een man van de wedstrijd en de beste chemie-lijn", () => {
    for (let seed = 1; seed <= 50; seed++) {
      const result = simulateMatch(strong, seed);
      const scorers = result.events.filter((e) => e.kind === "goal-ons").map((e) => e.subject);
      if (result.score[0] > 0) {
        expect(result.manOfTheMatch!.reason).toBe("goals");
        expect(scorers).toContain(result.manOfTheMatch!.subject);
      } else expect(result.manOfTheMatch!.reason).toMatch(/nul|rating/);
      expect(result.bestLink).toHaveLength(2);
    }
  });
});

it("spotOf vindt kaarten op het veld en de bank", () => {
  const lineup = placeCard(emptyLineup(), { kind: "bank", index: 3 }, "a", () => "a");
  expect(spotOf(lineup, "a")).toEqual({ kind: "bank", index: 3 });
  expect(spotOf(lineup, "b")).toBeNull();
});

describe("zonder plek kiezen en de video", () => {
  it("zonder plek: de lege plek waar hij hoort, en de bank als zijn vak al speelt", async () => {
    const { bestEmptySpot } = await import("./suggest");
    const taal = player({ vak: "en", group: "talen", natural: "middenveld", rating: 90 });
    const taal2 = player({ vak: "en", group: "talen", natural: "middenveld", rating: 80 });
    const all = [taal, taal2];
    const vakOf = (id: string) => all.find((p) => p.id === id)?.vak;
    const lineup = placeCard(emptyLineup("4-3-3"), { kind: "veld", slot: "cm-m" }, taal.id, vakOf);
    expect(bestEmptySpot(emptyLineup("4-3-3"), taal, vakOf)).toEqual({
      kind: "veld",
      slot: "cm-l",
    });
    expect(bestEmptySpot(lineup, taal2, vakOf)).toEqual({ kind: "bank", index: 0 });
    expect(bestEmptySpot(emptyLineup(), player({ natural: "keeper" }))).toEqual({
      kind: "veld",
      slot: "k",
    });
  });

  it("de video-tijdlijn: kaarten één voor één, dan lijnen, dan de rating", async () => {
    const { squadTimeline, squadVideoSounds } = await import("./render");
    const timeline = squadTimeline(11);
    expect(timeline.cardStart(1)).toBeGreaterThan(timeline.cardStart(0));
    expect(timeline.linesStart).toBeGreaterThan(timeline.cardStart(10));
    expect(timeline.countStart).toBeGreaterThan(timeline.linesStart);
    expect(timeline.end).toBeGreaterThan(timeline.countEnd);
    expect(timeline.end).toBeLessThan(12);
    const whooshes = squadVideoSounds(timeline, 11).filter((s) => s.cue === "whoosh");
    expect(whooshes).toHaveLength(11);
    expect(squadTimeline(0).end).toBeGreaterThan(0);
  });
});
