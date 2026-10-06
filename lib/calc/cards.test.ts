import { describe, expect, it } from "vitest";
import type { Grade, TextGradeValue } from "@/lib/types";
import { computeCards, orderPack } from "./cards";

let n = 0;
function g(
  subjectId: string,
  value: number | TextGradeValue,
  weight: number,
  date: string,
  extra: Partial<Grade> = {},
): Grade {
  n++;
  const base = {
    id: `g${n}`,
    subjectId,
    description: `Toets ${n}`,
    weight,
    date,
    enteredAt: `${date}T15:00:00.000Z`,
    periodId: "p1",
    countsTowardAverage: true,
    isPTA: false,
  };
  if (typeof value === "number") {
    return {
      ...base,
      kind: "numeric",
      value,
      display: String(value),
      isSufficient: value >= 5.5,
      ...extra,
    } as Grade;
  }
  return {
    ...base,
    kind: "text",
    value,
    display: value,
    isSufficient: value !== "O",
    ...extra,
  } as Grade;
}

// Wiskunde: 6,0 · 5,0 · 7,0 (×2) · 8,5 · 9,0 (in volgorde van datum)
const wis = [
  g("wis", 6.0, 1, "2026-09-01"),
  g("wis", 5.0, 1, "2026-09-08"),
  g("wis", 7.0, 2, "2026-09-15"),
  g("wis", 8.5, 1, "2026-09-22"),
  g("wis", 9.0, 1, "2026-09-29"),
];
// Opzettelijk door elkaar aangeleverd: de volgorde moet op datum.
const cards = computeCards([wis[3]!, wis[0]!, wis[4]!, wis[1]!, wis[2]!]);
const card = (i: number) => cards.get(wis[i]!.id)!;

describe("computeCards: tiers en ratings", () => {
  it("maakt van elk cijfer een kaart met rating = cijfer × 10", () => {
    expect(card(0)).toMatchObject({ rating: 60, ratingLabel: "60", tier: "zilver", isFail: false });
    expect(card(1)).toMatchObject({ rating: 50, tier: "brons", isFail: true });
    expect(card(4)).toMatchObject({ rating: 90, tier: "toty" });
  });
});

describe("computeCards: stats", () => {
  it("heeft geen IMP en geen varianten bij het eerste cijfer", () => {
    expect(card(0).stats).toEqual({
      cyf: "6,0",
      gem: "6,0",
      imp: "—",
      weg: "×1",
      top: "6,0",
      rks: "1",
    });
    expect(card(0).variants).toEqual([]);
  });

  it("toont de daling bij een onvoldoende en zet de reeks op 0", () => {
    expect(card(1).stats).toMatchObject({ gem: "5,5", imp: "-0,5", rks: "0" });
  });

  it("rekent gewogen gemiddeldes en de impact uit", () => {
    // (6 + 5 + 7×2) / 4 = 6,25 → 6,3; impact 6,25 − 5,5 = +0,75 → +0,8
    expect(card(2).stats).toMatchObject({
      cyf: "7,0",
      gem: "6,3",
      imp: "+0,8",
      weg: "×2",
      top: "7,0",
    });
    expect(card(2).avgBefore).toBeCloseTo(5.5, 10);
    expect(card(2).avgAfter).toBeCloseTo(6.25, 10);
  });

  it("houdt het hoogste cijfer en de voldoende-reeks bij", () => {
    expect(card(4).stats).toMatchObject({ top: "9,0", rks: "3" });
  });
});

describe("computeCards: varianten", () => {
  it("geeft een comeback, record en In Form na een onvoldoende", () => {
    expect(card(2).variants).toEqual(["inform", "record", "comeback"]);
    expect(card(2).primaryVariant).toBe("inform");
  });

  it("geeft een reeks bij de derde voldoende op rij", () => {
    expect(card(3).variants).not.toContain("reeks");
    expect(card(4).variants).toContain("reeks");
  });

  it("geeft In Form alleen bij minstens 1 punt boven het gemiddelde ervoor", () => {
    const cs = computeCards([g("ne", 7, 1, "2026-09-01"), g("ne", 7.9, 1, "2026-09-02")]);
    const second = [...cs.values()][1]!;
    expect(second.variants).not.toContain("inform");
    expect(second.variants).toContain("record");
  });
});

describe("computeCards: bijzondere cijfers", () => {
  it("laat cijfers die niet meetellen buiten gemiddelde, reeks en record", () => {
    const practice = g("du", 2.0, 0, "2026-09-01", { countsTowardAverage: false });
    const real = g("du", 6.0, 1, "2026-09-02");
    const cs = computeCards([practice, real]);
    expect(cs.get(real.id)!.variants).not.toContain("comeback");
    expect(cs.get(real.id)!.stats.imp).toBe("—");
    expect(cs.get(practice.id)!.stats.gem).toBe("—");
  });

  it("maakt ook kaarten van beoordelingen als V en G", () => {
    const cs = computeCards([
      g("lo", "V", 1, "2026-09-01"),
      g("lo", "G", 1, "2026-09-02"),
      g("lo", "V", 1, "2026-09-03"),
    ]);
    const [first, second, third] = [...cs.values()];
    expect(first).toMatchObject({ rating: null, ratingLabel: "V", tier: "zilver", isFail: false });
    expect(second).toMatchObject({ ratingLabel: "G", tier: "goud" });
    expect(third!.stats).toMatchObject({ cyf: "V", gem: "—", rks: "3" });
    expect(third!.variants).toEqual(["reeks"]);
  });

  it("ziet een O als onvoldoende", () => {
    const [o] = [...computeCards([g("lo", "O", 1, "2026-09-01")]).values()];
    expect(o).toMatchObject({ tier: "brons", isFail: true });
  });
});

describe("orderPack", () => {
  it("zet het beste cijfer altijd als laatste", () => {
    const order = orderPack([card(4), card(1), card(2), card(0)]).map((c) => c.rating);
    expect(order).toEqual([50, 60, 70, 90]);
  });
});
