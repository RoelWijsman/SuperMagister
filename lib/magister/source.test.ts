import { describe, expect, it, vi } from "vitest";
import absenties from "./__fixtures__/absenties.json";
import account from "./__fixtures__/account.json";
import aanmeldingen from "./__fixtures__/aanmeldingen.json";
import afspraken from "./__fixtures__/afspraken.json";
import cijferoverzicht from "./__fixtures__/cijferoverzicht.json";
import cijferperioden2526 from "./__fixtures__/cijferperioden-2526.json";
import cijferperioden from "./__fixtures__/cijferperioden.json";
import cijfers2526 from "./__fixtures__/cijfers-2526.json";
import cijfers2627 from "./__fixtures__/cijfers-2627.json";
import roosterwijzigingen from "./__fixtures__/roosterwijzigingen.json";
import vakken2526 from "./__fixtures__/vakken-2526.json";
import vakken from "./__fixtures__/vakken.json";
import type { MagisterClient } from "./client";
import { createMagisterSource } from "./source";
import { MagisterError } from "./transport";

const CURRENT = 1014;
const LAST_YEAR = 1011;

function fakeClient() {
  // Van de oudste twee schooljaren hebben we geen voorbeelden: die geven een 404.
  const year = <T, U>(enrollmentId: number, current: T, last: U) =>
    enrollmentId === CURRENT
      ? Promise.resolve(current)
      : enrollmentId === LAST_YEAR
        ? Promise.resolve(last)
        : Promise.reject(new MagisterError("niet-gevonden", "Onbekend schooljaar.", 404));
  return {
    transport: "proxy",
    account: vi.fn(async () => account),
    enrollments: vi.fn(async () => aanmeldingen),
    subjects: vi.fn(async (_p: number, e: number) => year(e, vakken, vakken2526)),
    progressGrades: vi.fn(async (e: number) => year(e, cijfers2627, cijfers2526)),
    gradePeriods: vi.fn(async (_p: number, e: number) =>
      year(e, cijferperioden, cijferperioden2526),
    ),
    gradeOverview: vi.fn(async (_p: number, e: number) => year(e, cijferoverzicht, { Items: [] })),
    appointments: vi.fn(async () => afspraken),
    scheduleChanges: vi.fn(async () => roosterwijzigingen),
    absences: vi.fn(async () => absenties),
    latestGrades: vi.fn(async () => ({ items: [] })),
  };
}

const today = () => new Date(2026, 9, 7, 12, 0);
const source = (enrollmentId?: number, client = fakeClient()) => ({
  client,
  source: createMagisterSource({
    client: client as unknown as MagisterClient,
    schoolHost: "voorbeeld.magister.net",
    personId: 1002,
    enrollmentId,
    today,
  }),
});

describe("createMagisterSource", () => {
  it("heeft een eigen id per school en leerling, los van de demo", () => {
    const { source: s } = source();
    expect(s).toMatchObject({
      id: "magister:voorbeeld.magister.net:1002",
      kind: "magister",
      label: "Voorbeeld",
    });
  });

  it("geeft het account met de klas van het huidige schooljaar", async () => {
    const account = await source().source.getAccount();
    expect(account).toMatchObject({
      fullName: "Daan Visser",
      className: "HAVO 3",
      isExamYear: false,
    });
  });

  it("kiest automatisch het huidige schooljaar, en kan wisselen", async () => {
    const { source: now } = source();
    expect((await now.getEnrollments()).map((e) => e.id)).toEqual([1004, 1008, 1011, 1014]);
    expect((await now.getCurrentEnrollment())?.id).toBe(CURRENT);
    const { source: last } = source(LAST_YEAR);
    expect((await last.getCurrentEnrollment())?.id).toBe(LAST_YEAR);
  });

  it("geeft vakken, met 'heeft cijfers' ook al vroeg in het jaar", async () => {
    const subjects = await source().source.getSubjects();
    const byId = new Map(subjects.map((s) => [s.id, s]));
    expect(byId.get("ak")).toMatchObject({ hasGrades: true });
    expect(byId.get("slb")).toMatchObject({ hasGrades: false });
    expect(byId.has("gem")).toBe(false);
  });

  it("geeft de cijfers en perioden van het gekozen schooljaar", async () => {
    expect((await source().source.getGrades()).map((g) => g.value)).toEqual(["INH"]);
    const { source: last } = source(LAST_YEAR);
    const grades = await last.getGrades();
    expect(grades.length).toBeGreaterThan(15);
    const periods = await last.getPeriods();
    expect(new Set(grades.map((g) => g.periodId))).toEqual(new Set(periods.map((p) => p.id)));
  });

  it("vergelijkt onze gemiddelden met die van Magister", async () => {
    const checks = await source(LAST_YEAR).source.getAverageChecks();
    expect(checks.length).toBeGreaterThanOrEqual(3);
    expect(checks.filter((c) => c.differs)).toEqual([]);
  });

  it("geeft het rooster met uitval en wijzigingen, en de absenties", async () => {
    const { source: s, client } = source();
    const range = { from: "2026-08-17", to: "2026-10-25" };
    const lessons = await s.getLessons(range);
    expect(client.appointments).toHaveBeenCalledWith(1002, range);
    expect(client.scheduleChanges).toHaveBeenCalledWith(1002, range);
    expect(lessons.find((l) => l.id === "1126")).toMatchObject({
      status: "uitval",
      subjectId: "ec",
    });
    expect(lessons.find((l) => l.id === "1147")).toMatchObject({ status: "wijziging" });
    expect(await s.getAbsences(range)).toHaveLength(8);
  });

  it("geeft eerdere schooljaren voor de collectie, en slaat onbereikbare jaren over", async () => {
    const history = await source().source.getHistory();
    expect(history.map((y) => [y.id, y.label])).toEqual([["1011", "2025–2026"]]);
    const [lastYear] = history;
    expect(lastYear!.grades.length).toBeGreaterThan(15);
    // Frans had je alleen vorig jaar: dat vak komt mee, zodat de kaart een naam en kleur heeft.
    expect(lastYear!.subjects.map((s) => s.id)).toContain("fa");
    expect(lastYear!.subjects.some((s) => s.id === "gem")).toBe(false);
  });

  it("vult het welkomstpack aan met vorig jaar als dit jaar nog geen echte cijfers heeft", async () => {
    const { source: now } = source();
    // Dit jaar staat er alleen een "Inh": die telt niet als cijfer voor het pack.
    expect((await now.getGrades()).map((g) => g.value)).toEqual(["INH"]);
    const [lastYear] = await now.getHistory();
    const newest = [...lastYear!.grades]
      .filter((g) => g.value !== "INH" && g.value !== "VR")
      .sort((a, b) => b.enteredAt.localeCompare(a.enteredAt))
      .slice(0, 5)
      .map((g) => g.id);
    const pack = await now.getInitialPackIds();
    expect(pack).toHaveLength(5);
    expect(new Set(pack)).toEqual(new Set(newest));
    expect(await now.getInitialGuesses()).toEqual({});
  });

  it("geeft een ouder schooljaar een eigen id, zonder pack", async () => {
    const { source: last } = source(LAST_YEAR);
    expect(last.id).toBe("magister:voorbeeld.magister.net:1002:1011");
    expect(await last.getInitialPackIds()).toEqual([]);
    expect(await last.getHistory()).toEqual([]);
  });

  it("is zuinig: vakken en cijfers maar één keer tegelijk ophalen", async () => {
    const { source: s, client } = source();
    await Promise.all([
      s.getSubjects(),
      s.getGrades(),
      s.getLessons({ from: "2026-10-05", to: "2026-10-11" }),
    ]);
    expect(client.subjects).toHaveBeenCalledTimes(1);
    expect(client.enrollments).toHaveBeenCalledTimes(1);
    expect(client.progressGrades).toHaveBeenCalledTimes(1);
  });
});
