import { describe, expect, it } from "vitest";
import cijfers2526 from "../__fixtures__/cijfers-2526.json";
import cijfers2627 from "../__fixtures__/cijfers-2627.json";
import cijferperioden2526 from "../__fixtures__/cijferperioden-2526.json";
import vakken2526 from "../__fixtures__/vakken-2526.json";
import vakken from "../__fixtures__/vakken.json";
import { weightedAverage } from "@/lib/calc/average";
import { compareAverages, parseProgressGrades } from "./progress";
import { studySubjectMap } from "./subjects";

/**
 * Echte (geanonimiseerde) cijfers uit /aanmeldingen/{id}/cijfers. De nepcijfers zijn
 * per vak verschoven, en Magisters gemiddelden mee: ze moeten dus nog precies kloppen.
 */
const lastYear = parseProgressGrades(cijfers2526, { subjects: studySubjectMap(vakken2526) });
const ofSubject = (id: string) => lastYear.grades.filter((g) => g.subjectId === id);

describe("studySubjectMap", () => {
  it("koppelt studievak-id's aan vakcodes, zonder Magisters rekenvakken", () => {
    const map = studySubjectMap(vakken2526);
    expect([...map.values()]).toEqual(expect.arrayContaining(["ak", "ec", "en", "lo"]));
    expect([...map.values()]).not.toContain("gem");
    expect([...map.values()]).not.toContain("tek");
  });
});

describe("parseProgressGrades (cijfers per schooljaar)", () => {
  it("leest gewone cijfers met weging, periode en de cijfervorm van Magister", () => {
    const first = ofSubject("ak")[0]!;
    expect(first).toEqual({
      id: "1275",
      subjectId: "ak",
      description: "Voorbeeldtoets 1",
      weight: 2,
      date: "2025-10-12",
      enteredAt: "2025-10-12T17:47:17.000Z",
      periodId: String(cijferperioden2526.Items[0]!.Id),
      countsTowardAverage: true,
      isPTA: false,
      kind: "numeric",
      value: 6.4,
      display: "6,4",
      isSufficient: true,
    });
  });

  it("laat gemiddelden, tekortpunten en Magisters rekenvakken weg uit de cijfers", () => {
    expect(lastYear.grades.every((g) => ["ak", "ec", "en", "lo"].includes(g.subjectId))).toBe(true);
    expect(lastYear.grades).toHaveLength(
      ofSubject("ak").length +
        ofSubject("ec").length +
        ofSubject("en").length +
        ofSubject("lo").length,
    );
    expect(ofSubject("ak")).toHaveLength(5);
  });

  it("houdt V, G, O en vrijstelling apart, ook als Magister er een getal achter verstopt", () => {
    expect(ofSubject("lo").map((g) => [g.kind, g.value, g.isSufficient])).toEqual([
      ["text", "O", false],
      ["text", "O", false],
      ["text", "RV", true],
      ["text", "V", true],
      ["text", "RV", true],
    ]);
    const vrijstelling = ofSubject("ec").find((g) => g.value === "VR")!;
    expect(vrijstelling).toMatchObject({
      kind: "text",
      display: "Vr",
      countsTowardAverage: false,
      isSufficient: null,
    });
  });

  it("geeft een beoordeling met weging 0 gewoon door (telt toch niet mee)", () => {
    expect(ofSubject("ak").find((g) => g.kind === "text")).toMatchObject({
      value: "RV",
      weight: 0,
    });
  });

  it("leest 'Inh' uit dit schooljaar", () => {
    const thisYear = parseProgressGrades(cijfers2627, { subjects: studySubjectMap(vakken) });
    expect(thisYear.grades).toEqual([
      expect.objectContaining({
        id: "1070",
        subjectId: "lo",
        kind: "text",
        value: "INH",
        display: "Inh",
        countsTowardAverage: false,
      }),
    ]);
  });
});

describe("Magisters eigen gemiddelden", () => {
  it("leest per vak en periode het gemiddelde van Magister", () => {
    const bySubject = new Map(lastYear.magisterAverages.map((a) => [a.subjectId, a]));
    expect(bySubject.get("ak")).toMatchObject({ value: 7.7, display: "7,7" });
    expect(bySubject.get("lo")).toMatchObject({ value: null, display: "G" });
    expect(bySubject.has("gem")).toBe(false);
  });

  it("rekent precies hetzelfde als Magister (echte data, afgerond op één decimaal)", () => {
    for (const subjectId of ["ak", "ec", "en"]) {
      const ours = weightedAverage(ofSubject(subjectId))!;
      const theirs = lastYear.magisterAverages.find((a) => a.subjectId === subjectId)!.value!;
      expect(Math.round(ours * 10) / 10, subjectId).toBeCloseTo(theirs, 5);
    }
    expect(
      compareAverages(lastYear.grades, lastYear.magisterAverages).filter((c) => c.differs),
    ).toEqual([]);
  });

  it("ziet het als Magister anders rekent", () => {
    const changed = lastYear.magisterAverages.map((a) =>
      a.subjectId === "en" ? { ...a, value: 6.4, display: "6,4" } : a,
    );
    expect(compareAverages(lastYear.grades, changed).filter((c) => c.differs)).toEqual([
      expect.objectContaining({
        subjectId: "en",
        ours: expect.closeTo(5.8, 1),
        magister: 6.4,
        differs: true,
      }),
    ]);
  });

  it("vergelijkt niets bij een beoordeling (RV) of een vak zonder cijfers", () => {
    const checks = compareAverages(
      [],
      [
        { subjectId: "lo", periodId: "1", value: null, display: "RV" },
        { subjectId: "wi", periodId: "1", value: 6.2, display: "6,2" },
      ],
    );
    expect(checks).toEqual([]);
  });
});
