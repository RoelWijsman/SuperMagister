import { describe, expect, it } from "vitest";
import {
  filterCards,
  filterOptions,
  NO_FILTERS,
  sortCards,
  tierCounts,
  type AlbumCard,
} from "./album";

let n = 0;
function card(
  overrides: Partial<Omit<AlbumCard, "grade">> & {
    enteredAt?: string;
    periodId?: string | null;
  } = {},
): AlbumCard {
  n += 1;
  const {
    enteredAt = `2026-09-${String(n).padStart(2, "0")}T10:00:00`,
    periodId = "p1",
    ...rest
  } = overrides;
  return {
    id: `c${n}`,
    subjectId: "wi",
    subjectName: "Wiskunde",
    periodName: periodId === "p2" ? "Periode 2" : "Periode 1",
    tier: "zilver",
    rating: 65,
    variants: [],
    grade: { enteredAt, periodId },
    ...rest,
  };
}

describe("filterCards", () => {
  const cards = [
    card({ subjectId: "wi", tier: "goud", variants: ["record"] }),
    card({ subjectId: "en", subjectName: "Engels", tier: "zilver", periodId: "p2" }),
    card({ subjectId: "en", subjectName: "Engels", tier: "goud", variants: ["comeback", "reeks"] }),
  ];

  it("laat zonder filters alles zien", () => {
    expect(filterCards(cards, NO_FILTERS)).toHaveLength(3);
  });

  it("combineert vak, tier, periode en variant", () => {
    expect(filterCards(cards, { ...NO_FILTERS, subjectId: "en" }).map((c) => c.id)).toEqual([
      cards[1]!.id,
      cards[2]!.id,
    ]);
    expect(filterCards(cards, { ...NO_FILTERS, subjectId: "en", tier: "goud" })).toEqual([
      cards[2],
    ]);
    expect(filterCards(cards, { ...NO_FILTERS, periodId: "p2" })).toEqual([cards[1]]);
    expect(filterCards(cards, { ...NO_FILTERS, variant: "reeks" })).toEqual([cards[2]]);
    expect(filterCards(cards, { ...NO_FILTERS, tier: "icon" })).toEqual([]);
  });
});

describe("tierCounts", () => {
  it("telt per tier, ook de lege", () => {
    const counts = tierCounts([
      card({ tier: "goud" }),
      card({ tier: "goud" }),
      card({ tier: "icon" }),
    ]);
    expect(counts).toEqual({ brons: 0, zilver: 0, goud: 2, toty: 0, icon: 1 });
  });
});

describe("sortCards", () => {
  const old = card({ rating: 90, subjectName: "Wiskunde", enteredAt: "2026-01-01T08:00:00" });
  const fresh = card({
    rating: 60,
    subjectName: "Aardrijkskunde",
    enteredAt: "2026-10-01T08:00:00",
  });
  const mid = card({ rating: 75, subjectName: "Biologie", enteredAt: "2026-05-01T08:00:00" });

  it("zet de nieuwste kaart voorop", () => {
    expect(sortCards([old, fresh, mid], "nieuw")).toEqual([fresh, mid, old]);
  });

  it("sorteert op rating, hoogste eerst", () => {
    expect(sortCards([fresh, old, mid], "rating")).toEqual([old, mid, fresh]);
  });

  it("schat een beoordeling zonder rating (zoals een G) op zijn tier", () => {
    const good = card({ rating: null, tier: "goud", enteredAt: "2026-02-01T08:00:00" });
    expect(sortCards([fresh, good, old, mid], "rating")).toEqual([old, good, mid, fresh]);
  });

  it("sorteert op vaknaam", () => {
    expect(sortCards([old, mid, fresh], "vak")).toEqual([fresh, mid, old]);
  });

  it("laat de invoer ongemoeid", () => {
    const input = [old, fresh];
    sortCards(input, "nieuw");
    expect(input).toEqual([old, fresh]);
  });
});

describe("filterOptions", () => {
  it("biedt alleen keuzes aan die echt voorkomen, met aantallen", () => {
    const options = filterOptions([
      card({ subjectId: "en", subjectName: "Engels", tier: "goud", variants: ["record"] }),
      card({ subjectId: "en", subjectName: "Engels", tier: "zilver", periodId: "p2" }),
      card({ subjectId: "ak", subjectName: "Aardrijkskunde", tier: "goud", periodId: null }),
    ]);
    expect(options.subjects).toEqual([
      { id: "ak", name: "Aardrijkskunde", count: 1 },
      { id: "en", name: "Engels", count: 2 },
    ]);
    expect(options.periods).toEqual([
      { id: "p1", name: "Periode 1", count: 1 },
      { id: "p2", name: "Periode 2", count: 1 },
    ]);
    expect(options.tiers).toEqual(["zilver", "goud"]);
    expect(options.variants).toEqual(["record"]);
  });
});
