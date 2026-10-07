import { describe, expect, it } from "vitest";
import absenties from "../__fixtures__/absenties.json";
import account from "../__fixtures__/account.json";
import aanmeldingen from "../__fixtures__/aanmeldingen.json";
import afspraken from "../__fixtures__/afspraken.json";
import afsprakenExtra from "../__fixtures__/afspraken-extra.json";
import cijferoverzicht from "../__fixtures__/cijferoverzicht.json";
import cijferperioden from "../__fixtures__/cijferperioden.json";
import roosterwijzigingen from "../__fixtures__/roosterwijzigingen.json";
import vakken from "../__fixtures__/vakken.json";
import { parseAbsences } from "./absences";
import { parseAccount } from "./account";
import { currentEnrollment, parseEnrollments, studyInfo } from "./enrollments";
import { changedAppointmentIds, parseLessons } from "./lessons";
import { testsFromLessons } from "@/lib/school/derive";
import { parsePeriods } from "./periods";
import { gradedSubjectCodes, parseSubjects } from "./subjects";

/** Woensdag 7 oktober 2026, zoals in de export. */
const TODAY = "2026-10-07";

describe("parseEnrollments (aanmeldingen = schooljaren)", () => {
  const enrollments = parseEnrollments(aanmeldingen);

  it("leest elk schooljaar, met de einddatum als laatste dag", () => {
    expect(enrollments).toHaveLength(4);
    expect(enrollments.at(-1)).toEqual({
      id: 1014,
      start: "2026-08-01",
      end: "2027-07-30",
      label: "2026–2027",
      study: "HAVO/3",
      group: "HAVO 3",
      level: "havo",
      year: 3,
      isExamYear: false,
    });
  });

  it("kiest automatisch het huidige schooljaar", () => {
    expect(currentEnrollment(enrollments, TODAY)?.id).toBe(1014);
    // In de zomer: het nieuwste dat al begonnen is.
    expect(currentEnrollment(enrollments, "2026-07-31")?.id).toBe(1011);
  });

  it("herkent examenklassen", () => {
    expect(studyInfo("K_HAVO/5")).toEqual({ level: "havo", year: 5, isExamYear: true });
    expect(studyInfo("6 vwo")).toEqual({ level: "vwo", year: 6, isExamYear: true });
    expect(studyInfo("Atheneum 4")).toEqual({ level: "vwo", year: 4, isExamYear: false });
    expect(studyInfo("MAVO/4")).toEqual({ level: "vmbo", year: 4, isExamYear: true });
    expect(studyInfo("iets anders")).toEqual({ level: null, year: null, isExamYear: false });
  });
});

describe("parseAccount", () => {
  it("leest naam, geboortedatum, school en klas", () => {
    const enrollment = currentEnrollment(parseEnrollments(aanmeldingen), TODAY)!;
    expect(parseAccount(account, { schoolHost: "voorbeeld.magister.net", enrollment })).toEqual({
      id: 1002,
      firstName: "Daan",
      lastName: "Visser",
      fullName: "Daan Visser",
      birthDate: "2010-03-14",
      schoolName: "Voorbeeld",
      schoolHost: "voorbeeld.magister.net",
      className: "HAVO 3",
      studyLabel: "havo 3",
      isExamYear: false,
    });
  });

  it("zet een tussenvoegsel netjes in de achternaam", () => {
    const raw = {
      Persoon: { Id: 7, Roepnaam: "Sem", Tussenvoegsel: "van der", Achternaam: "Berg" },
    };
    expect(parseAccount(raw, { schoolHost: "a.magister.net", enrollment: null })).toMatchObject({
      lastName: "van der Berg",
      fullName: "Sem van der Berg",
    });
  });

  it("weigert een account zonder persoon", () => {
    expect(() => parseAccount({}, { schoolHost: "a.magister.net", enrollment: null })).toThrow();
  });
});

describe("parseSubjects", () => {
  const graded = gradedSubjectCodes(cijferoverzicht);
  const subjects = parseSubjects(vakken, graded);

  it("laat Magisters eigen rekenregels (gemiddelde en tekortpunten) weg", () => {
    expect(graded.has("gem")).toBe(false);
    expect(graded.has("tek")).toBe(false);
    expect(subjects.map((s) => s.id)).not.toContain("gem");
    expect(subjects.map((s) => s.id)).not.toContain("tek");
  });

  it("geeft vakken een nette naam, kernvak-vlag en of ze cijfers hebben", () => {
    const byId = new Map(subjects.map((s) => [s.id, s]));
    expect(byId.get("ne")).toMatchObject({
      code: "ne",
      name: "Nederlandse taal",
      isCore: true,
      hasGrades: true,
    });
    expect(byId.get("wi")).toMatchObject({ name: "Wiskunde", isCore: true, hasGrades: true });
    expect(byId.get("gs")).toMatchObject({ name: "Geschiedenis", isCore: false, hasGrades: true });
    expect(byId.get("slb")).toMatchObject({ hasGrades: false });
    expect(byId.get("dia_sp")).toMatchObject({ id: "dia_sp", hasGrades: false });
  });

  it("geeft onbekende vakken een standaardgroep", () => {
    const [vak] = parseSubjects([{ afkorting: "XYZ", omschrijving: "knutselen 3.0" }], new Set());
    expect(vak).toMatchObject({ id: "xyz", code: "XYZ", name: "Knutselen 3.0", group: "overig" });
  });
});

describe("parsePeriods", () => {
  it("leest perioden met de einddatum als laatste dag", () => {
    expect(parsePeriods(cijferperioden)).toEqual([
      { id: "1069", name: "Overgangstoetsen LJ3", start: "2026-08-01", end: "2027-07-30" },
    ]);
  });
});

describe("parseLessons (afspraken)", () => {
  const subjects = parseSubjects(vakken, gradedSubjectCodes(cijferoverzicht));
  const changed = changedAppointmentIds(roosterwijzigingen);
  const lessons = parseLessons(afspraken, { subjects, changed });
  const byId = new Map(lessons.map((l) => [l.id, l]));

  it("slaat roostervrij, hele dagen en markeringen zonder duur over", () => {
    expect(byId.has("1072")).toBe(false); // Type 6, roostervrij
    expect(byId.has("1136")).toBe(false); // hele dag
    expect(lessons.some((l) => l.id === "0")).toBe(false); // Type 101, markering
  });

  it("leest een gewone les", () => {
    expect(byId.get("1094")).toEqual({
      id: "1094",
      start: "2026-08-19T07:15:00.000Z",
      end: "2026-08-19T08:15:00.000Z",
      date: "2026-08-19",
      hourFrom: 2,
      hourTo: 2,
      subjectId: "ak",
      title: "ak - DCIP - k3a",
      location: "R105",
      previousLocation: null,
      teachers: [{ code: "DCIP", name: "Docent W" }],
      infoType: "geen",
      status: "normaal",
      contentHtml: null,
      isDone: false,
    });
  });

  it("vertaalt Status 5 naar uitval, ook met huiswerk erbij", () => {
    expect(byId.get("1126")).toMatchObject({
      status: "uitval",
      infoType: "huiswerk",
      subjectId: "ec",
    });
    expect(byId.get("1159")).toMatchObject({ status: "uitval", hourFrom: 5 });
  });

  it("neemt huiswerk mee als HTML (de app toont het altijd via DOMPurify)", () => {
    const lesson = byId.get("1091")!;
    expect(lesson).toMatchObject({ infoType: "huiswerk", subjectId: "bi" });
    expect(lesson.contentHtml).toContain("<p>");
  });

  it("markeert lessen uit de roosterwijzigingen als gewijzigd", () => {
    expect(byId.get("1147")).toMatchObject({ status: "wijziging", hourFrom: null });
  });

  it("houdt activiteiten zonder vak, met een leeg of '-' lokaal als null", () => {
    expect(byId.get("1112")).toMatchObject({ subjectId: null, location: null, infoType: "geen" });
    expect(byId.get("1082")).toMatchObject({
      infoType: "informatie",
      location: "R101 | R102 | R103",
    });
    expect(byId.get("1082")!.teachers).toHaveLength(6);
  });

  it("vindt het vak ook via de naam, als de omschrijving geen code heeft", () => {
    const [lesson] = parseLessons(
      {
        Items: [
          {
            Id: 5,
            Start: "2026-10-08T07:15:00Z",
            Einde: "2026-10-08T08:15:00Z",
            Type: 13,
            Status: 1,
            InfoType: 0,
            Omschrijving: "Les",
            Vakken: [{ Id: 1, Naam: "aardrijkskunde" }],
          },
        ],
      },
      { subjects, changed: new Set() },
    );
    expect(lesson?.subjectId).toBe("ak");
  });

  it("herkent een echte toets (InfoType 2) en maakt er een toets van", () => {
    const extra = parseLessons(afsprakenExtra, { subjects, changed: new Set() });
    const toets = extra.find((l) => l.id === "1196")!;
    expect(toets).toMatchObject({
      infoType: "toets",
      status: "normaal",
      subjectId: "ak",
      hourFrom: 3,
      date: "2026-05-21",
    });
    expect(toets.contentHtml).toBeTruthy();
    expect(testsFromLessons(extra).map((t) => [t.lessonId, t.kind, t.subjectId])).toEqual([
      ["1196", "toets", "ak"],
      ["1200", "toets", "ak"],
    ]);
  });

  it("vertaalt alle InfoTypes en wijzigings-statussen", () => {
    const one = (extra: Record<string, unknown>) =>
      parseLessons(
        {
          Items: [
            {
              Id: 9,
              Start: "2026-10-08T07:15:00Z",
              Einde: "2026-10-08T08:15:00Z",
              Type: 13,
              Status: 1,
              InfoType: 0,
              ...extra,
            },
          ],
        },
        { subjects, changed: new Set() },
      )[0]!;
    expect([0, 1, 2, 3, 4, 5, 6, 7, 99].map((InfoType) => one({ InfoType }).infoType)).toEqual([
      "geen",
      "huiswerk",
      "toets",
      "tentamen",
      "schriftelijk",
      "mondeling",
      "informatie",
      "aantekening",
      "geen",
    ]);
    expect([1, 2, 3, 4, 5, 7, 9, 10].map((Status) => one({ Status }).status)).toEqual([
      "normaal",
      "normaal",
      "wijziging",
      "uitval",
      "uitval",
      "normaal",
      "wijziging",
      "wijziging",
    ]);
  });
});

describe("parseAbsences", () => {
  const subjects = parseSubjects(vakken, gradedSubjectCodes(cijferoverzicht));
  const absences = parseAbsences(absenties, { subjects });
  const byId = new Map(absences.map((a) => [a.id, a]));

  it("vertaalt elke soort", () => {
    expect(absences.map((a) => a.kind)).toEqual([
      "te-laat",
      "afwezig",
      "afwezig",
      "materiaal-vergeten",
      "huiswerk-vergeten",
      "ziek",
      "afwezig",
      "afwezig",
    ]);
  });

  it("koppelt de absentie aan de les, met het lesuur en het vak", () => {
    expect(byId.get("1174")).toEqual({
      id: "1174",
      start: "2026-08-19T06:15:00.000Z",
      end: "2026-08-19T07:15:00.000Z",
      date: "2026-08-19",
      lessonId: "1091",
      subjectId: "bi",
      hour: 1,
      kind: "te-laat",
      reason: "Te laat ongeoorloofd",
      isAuthorized: false,
    });
  });

  it("haalt witruimte van omschrijvingen af", () => {
    expect(byId.get("1180")?.reason).toBe("Boeken vergeten");
  });
});
