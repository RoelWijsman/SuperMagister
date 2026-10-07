import { describe, expect, it } from "vitest";
import laatste from "../__fixtures__/cijfers-laatste.json";
import { parseLatestGrades } from "./grades";

/** Een item in precies de vorm van /cijfers/laatste (camelCase). */
const item = (extra: Record<string, unknown>) => ({
  kolomId: 501,
  omschrijving: "Toets H3",
  ingevoerdOp: "2026-10-05T14:12:00.0000000Z",
  vak: { code: "wi", omschrijving: "wiskunde" },
  waarde: "7,8",
  weegfactor: 2,
  isVoldoende: true,
  teltMee: true,
  moetInhalen: false,
  heeftVrijstelling: false,
  behaaldOp: "2026-10-02T22:00:00.0000000Z",
  links: {},
  ...extra,
});

describe("parseLatestGrades (/cijfers/laatste)", () => {
  it("leest een gewoon cijfer, met komma, weging en de toetsdatum", () => {
    expect(parseLatestGrades({ items: [item({})] })).toEqual([
      {
        id: "501",
        subjectId: "wi",
        description: "Toets H3",
        weight: 2,
        date: "2026-10-03",
        enteredAt: "2026-10-05T14:12:00.000Z",
        periodId: null,
        countsTowardAverage: true,
        isPTA: false,
        kind: "numeric",
        value: 7.8,
        display: "7,8",
        isSufficient: true,
      },
    ]);
  });

  it("maakt van 'Inh' een beoordeling die niet meetelt (echte data)", () => {
    const [grade] = parseLatestGrades(laatste);
    expect(grade).toMatchObject({
      subjectId: "lo",
      kind: "text",
      value: "INH",
      display: "Inh",
      isSufficient: null,
      countsTowardAverage: false,
      date: "2026-09-29",
    });
  });

  it("houdt V, G en O apart, met voldoende of niet", () => {
    const grades = parseLatestGrades({
      items: [
        item({ waarde: "G", kolomId: 1 }),
        item({ waarde: "O", kolomId: 2, isVoldoende: false }),
      ],
    });
    expect(grades.map((g) => [g.kind, g.value, g.isSufficient])).toEqual([
      ["text", "G", true],
      ["text", "O", false],
    ]);
  });

  it("respecteert teltMee en weging 0", () => {
    const [nietMee, nul] = parseLatestGrades({
      items: [item({ kolomId: 1, teltMee: false }), item({ kolomId: 2, weegfactor: 0 })],
    });
    expect(nietMee).toMatchObject({ countsTowardAverage: false });
    expect(nul).toMatchObject({ weight: 0, countsTowardAverage: true });
  });

  it("geeft een vrijstelling als VR", () => {
    const [grade] = parseLatestGrades({
      items: [item({ waarde: "", heeftVrijstelling: true })],
    });
    expect(grade).toMatchObject({ kind: "text", value: "VR", countsTowardAverage: false });
  });

  it("slaat items zonder bruikbare waarde of vak over", () => {
    expect(
      parseLatestGrades({
        items: [item({ waarde: "" }), item({ vak: null }), item({ kolomId: null })],
      }),
    ).toEqual([]);
    expect(parseLatestGrades(null)).toEqual([]);
  });

  it("valt terug op de invoerdatum als de toetsdatum ontbreekt", () => {
    const [grade] = parseLatestGrades({ items: [item({ behaaldOp: null })] });
    expect(grade?.date).toBe("2026-10-05");
  });
});
