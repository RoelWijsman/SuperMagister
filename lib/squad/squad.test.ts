import { describe, expect, it } from "vitest";
import { createRandom } from "@/lib/random";
import { analyseSquad } from "./analysis";
import { bestPerVak, buildBestSquad, squadScore } from "./build";
import {
  evaluateSquad,
  linkStrength,
  playerChemistry,
  positionFit,
  squadRating,
  teamChemistry,
} from "./chemistry";
import { cleanClubName, clubInitials, generateClubName, isRealClubName } from "./club";
import { FORMATION_IDS, FORMATIONS, neighbours, slotLine } from "./formations";
import {
  changeFormation,
  cleanLineup,
  emptyLineup,
  placeCard,
  setCaptain,
  spotOf,
  squadCardIds,
  swapSpots,
  type Lineup,
} from "./lineup";
import { simulateMatch } from "./match";
import { testKindOf, toSquadPlayer, vakKey, type SquadPlayer } from "./players";

let counter = 0;
function player(overrides: Partial<SquadPlayer> = {}): SquadPlayer {
  counter++;
  return {
    id: `kaart-${counter}`,
    vak: `vak-${counter}`,
    subjectName: `Vak ${counter}`,
    group: "exact",
    natural: "aanval",
    rating: 70,
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
  const judged = (value: "G" | "V" | "VR" | "INH") => ({
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

  it("beoordelingen spelen mee met een vaste rating (zo heeft LO een keeper)", () => {
    expect(toSquadPlayer(judged("G"))).toMatchObject({ rating: 80, natural: "keeper" });
    expect(toSquadPlayer(judged("V"))!.rating).toBe(65);
    expect(toSquadPlayer(judged("VR"))).toBeNull();
    expect(toSquadPlayer(judged("INH"))).toBeNull();
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

  it("flexibel kost een punt, verkeerde linie flink", () => {
    expect(positionFit(player({ natural: "flexibel" }), "verdediging")).toBe("flexibel");
    expect(playerChemistry("flexibel", 10)).toBe(9);
    expect(positionFit(player({ natural: "middenveld" }), "aanval")).toBe("verkeerd");
    expect(playerChemistry("verkeerd", 10)).toBe(5);
    expect(playerChemistry("verkeerd", 0)).toBe(1);
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

  it("geen dubbele vakken: een tweede kaart van hetzelfde vak neemt het over", () => {
    let lineup = placeCard(emptyLineup(), { kind: "veld", slot: "sp" }, wisA.id, vakOf);
    lineup = placeCard(lineup, { kind: "veld", slot: "lv" }, wisA2.id, vakOf);
    expect(lineup.slots.sp).toBeNull();
    expect(lineup.slots.lv).toBe(wisA2.id);
    expect(squadCardIds(lineup)).toEqual([wisA2.id]);
  });

  it("ook vanaf de bank: nooit twee keer hetzelfde vak in de selectie", () => {
    let lineup = placeCard(emptyLineup(), { kind: "bank", index: 0 }, wisA.id, vakOf);
    lineup = placeCard(lineup, { kind: "veld", slot: "sp" }, wisA2.id, vakOf);
    expect(lineup.bench[0]).toBeNull();
    expect(squadCardIds(lineup)).toEqual([wisA2.id]);
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
    lineup = swapSpots(lineup, { kind: "veld", slot: "sp" }, { kind: "bank", index: 2 });
    expect(lineup.slots.sp).toBe(frans.id);
    expect(lineup.bench[2]).toBe(wisA.id);
    expect(lineup.captain).toBeNull();
  });

  it("formatie wisselen houdt kaarten op een passende plek", () => {
    const keeper = player({ natural: "keeper" });
    const ids = Object.fromEntries(FORMATIONS["4-3-3"].slots.map((s) => [s.id, `${s.id}-kaart`]));
    ids.k = keeper.id;
    const lineup: Lineup = { ...emptyLineup("4-3-3"), slots: ids, captain: "sp-kaart" };
    const next = changeFormation(lineup, "4-4-2");
    expect(next.slots.k).toBe(keeper.id);
    expect(next.slots.lb).toBe("lb-kaart");
    expect(next.slots["cv-l"]).toBe("cv-l-kaart");
    // De spits blijft spits; de buitenspelers schuiven door naar de vrije spitsplek of het middenveld.
    expect([next.slots["sp-l"], next.slots["sp-r"]]).toContain("sp-kaart");
    expect(squadCardIds(next).sort()).toEqual(Object.values(ids).sort());
    expect(next.captain).toBe("sp-kaart");
    // Van 4-3-3 naar 3-5-2: een verdediger te veel gaat naar de bank of het middenveld, niemand verdwijnt.
    const three = changeFormation(lineup, "3-5-2");
    expect(squadCardIds(three).sort()).toEqual(Object.values(ids).sort());
  });

  it("maakt een bewaarde opstelling weer geldig", () => {
    const stored = {
      formation: "4-3-3",
      slots: { sp: wisA.id, lv: wisA2.id, "cm-m": "weg" },
      bench: [frans.id],
      captain: "weg",
    } as unknown as Lineup;
    const clean = cleanLineup(stored, (id) => all.some((p) => p.id === id), vakOf);
    // Twee keer wiskunde A: de eerste plek in de formatie (LV komt vóór SP) houdt hem.
    expect(clean.slots.lv).toBe(wisA2.id);
    expect(clean.slots.sp).toBeNull();
    expect(clean.slots["cm-m"]).toBeNull();
    expect(clean.bench).toHaveLength(7);
    expect(clean.bench[0]).toBe(frans.id);
    expect(clean.captain).toBeNull();
    expect(Object.keys(clean.slots)).toHaveLength(11);
  });
});

describe("automatisch bouwen", () => {
  function pool(): SquadPlayer[] {
    return [
      player({ vak: "lo", group: "bewegen", natural: "keeper", rating: 64 }),
      player({ vak: "ges", group: "mens-maatschappij", natural: "verdediging", rating: 71 }),
      player({ vak: "ak", group: "mens-maatschappij", natural: "verdediging", rating: 68 }),
      player({ vak: "eco", group: "mens-maatschappij", natural: "verdediging", rating: 75 }),
      player({ vak: "maat", group: "mens-maatschappij", natural: "verdediging", rating: 62 }),
      player({ vak: "ne", group: "talen", natural: "middenveld", rating: 66 }),
      player({ vak: "en", group: "talen", natural: "middenveld", rating: 82 }),
      player({ vak: "fa", group: "talen", natural: "middenveld", rating: 59 }),
      player({ vak: "wi", group: "exact", natural: "aanval", rating: 88 }),
      player({ vak: "na", group: "exact", natural: "aanval", rating: 73 }),
      player({ vak: "bi", group: "exact", natural: "aanval", rating: 79 }),
      player({ vak: "mu", group: "kunst-cultuur", natural: "flexibel", rating: 95 }),
      // Een oudere, slechtere kaart van wiskunde: mag er niet bij.
      player({ vak: "wi", group: "exact", natural: "aanval", rating: 52 }),
    ];
  }

  it("kiest per vak de beste kaart", () => {
    const best = bestPerVak(pool());
    expect(best.filter((p) => p.vak === "wi")).toHaveLength(1);
    expect(best.find((p) => p.vak === "wi")!.rating).toBe(88);
  });

  it("zet iedereen op een natuurlijke plek als dat kan, met LO op doel", () => {
    const result = buildBestSquad(pool(), "4-3-3");
    // Ook de bank heeft geen dubbele vakken of vakken die al op het veld staan.
    const benchIds = result.lineup.bench.filter(Boolean);
    expect(benchIds.length).toBe(1);
    const { evaluation, lineup } = result;
    expect(evaluation.placed).toBe(11);
    const keeper = evaluation.slots.find((s) => s.line === "keeper")!;
    expect(keeper.player!.vak).toBe("lo");
    expect(evaluation.slots.every((s) => s.fit !== "onmogelijk")).toBe(true);
    // Geen dubbele vakken, en de slechte wiskundekaart zit nergens.
    const vakken = evaluation.slots.map((s) => s.player!.vak);
    expect(new Set(vakken).size).toBe(11);
    expect(evaluation.slots.find((s) => s.player!.vak === "wi")!.player!.rating).toBe(88);
    expect(lineup.captain).not.toBeNull();
    // Muziek (95, flexibel) is te goed om op de bank te laten.
    const ids = Object.values(lineup.slots);
    const muziek = evaluation.slots.find((s) => s.player?.vak === "mu");
    expect(muziek && ids.includes(muziek.player!.id)).toBe(true);
  });

  it("is minstens zo goed als alleen op rating kiezen, en altijd hetzelfde", () => {
    const players = pool();
    const a = buildBestSquad(players, "4-3-3");
    const b = buildBestSquad([...players].reverse(), "4-3-3");
    expect(a.lineup).toEqual(b.lineup);
    expect(squadScore(a.evaluation)).toBeGreaterThanOrEqual(
      a.ratingOnly.rating + 0.25 * a.ratingOnly.chemistry - 1,
    );
    expect(a.evaluation.chemistry).toBeGreaterThanOrEqual(a.ratingOnly.chemistry);
  });

  it("werkt ook met weinig kaarten of helemaal geen", () => {
    expect(buildBestSquad([], "4-4-2").evaluation.placed).toBe(0);
    const few = buildBestSquad(pool().slice(0, 4), "4-4-2");
    expect(few.evaluation.placed).toBe(4);
  });
});

describe("analyse, club en oefenwedstrijd", () => {
  it("noemt de sterkste linie en een tip", () => {
    const lineup = placeCard(emptyLineup(), { kind: "veld", slot: "sp" }, "x", () => "x");
    const players = new Map([["x", player({ id: "x", subjectName: "Wiskunde", rating: 88 })]]);
    const analysis = analyseSquad(evaluateSquad(lineup, players));
    expect(analysis.strongest).toEqual({ line: "aanval", rating: 88, subject: "Wiskunde" });
    expect(analysis.tip).toEqual({ kind: "leeg", open: 10 });
  });

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

  it("speelt een oefenwedstrijd: altijd dezelfde bij dezelfde seed, en een sterk team wint vaker", () => {
    const strong = buildBestSquad(
      Array.from({ length: 11 }, (_, i) =>
        player({
          vak: `v${i}`,
          group: i === 0 ? "bewegen" : "exact",
          natural: i === 0 ? "keeper" : "flexibel",
          rating: 95,
        }),
      ),
      "4-3-3",
    ).evaluation;
    const a = simulateMatch(strong, 42);
    expect(simulateMatch(strong, 42)).toEqual(a);
    expect(a.events.at(-1)!.kind).toBe("einde");
    expect(a.events.at(-1)!.score).toEqual(a.score);
    const empty = evaluateSquad(emptyLineup(), new Map());
    let wins = 0;
    let losses = 0;
    for (let seed = 1; seed <= 60; seed++) {
      if (simulateMatch(strong, seed).outcome === "winst") wins++;
      if (simulateMatch(empty, seed).outcome === "verlies") losses++;
    }
    expect(wins).toBeGreaterThan(35);
    expect(losses).toBeGreaterThan(35);
  });
});

it("spotOf vindt kaarten op het veld en de bank", () => {
  const lineup = placeCard(emptyLineup(), { kind: "bank", index: 3 }, "a", () => "a");
  expect(spotOf(lineup, "a")).toEqual({ kind: "bank", index: 3 });
  expect(spotOf(lineup, "b")).toBeNull();
});

describe("kiezen per plek en de video", () => {
  it("sorteert op beste chemie voor de plek, dan op rating", async () => {
    const { rankForSpot, bestEmptySpot } = await import("./suggest");
    const exact = player({ vak: "na", group: "exact", natural: "aanval", rating: 70 });
    const taal = player({ vak: "en", group: "talen", natural: "middenveld", rating: 90 });
    const buur = player({ vak: "wi", group: "exact", natural: "aanval", rating: 80 });
    const all = [exact, taal, buur];
    const lineup = placeCard(
      emptyLineup("4-3-3"),
      { kind: "veld", slot: "lv" },
      buur.id,
      (id) => all.find((p) => p.id === id)?.vak,
    );
    const ranked = rankForSpot(lineup, { kind: "veld", slot: "sp" }, [taal, exact], mapOf(all));
    // Natuurkunde (exact, groen met wiskunde) wint het van Engels (hogere rating, verkeerde linie).
    expect(ranked.map((r) => r.player.vak)).toEqual(["na", "en"]);
    expect(ranked[0]!.fit).toBe("natuurlijk");
    // Op de bank telt alleen de rating.
    const bench = rankForSpot(lineup, { kind: "bank", index: 0 }, [exact, taal], mapOf(all));
    expect(bench.map((r) => r.player.vak)).toEqual(["en", "na"]);
    // Zonder plek: de lege plek waar hij van nature hoort.
    expect(bestEmptySpot(lineup, taal)).toEqual({ kind: "veld", slot: "cm-l" });
    expect(bestEmptySpot(lineup, player({ natural: "keeper" }))).toEqual({
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
