import { describe, expect, it } from "vitest";
import { addDays, parseISODate, startOfWeek, toISODate } from "@/lib/date";
import { homeworkFromLessons, testsFromLessons } from "@/lib/school/derive";
import { addSchoolDays, isDemoSchoolDay } from "./calendar";
import { buildDemoDataset } from "./index";

const NOW = new Date(2026, 9, 5, 10, 15); // maandag 5 oktober 2026
const TODAY = toISODate(NOW);
const data = buildDemoDataset(NOW);

describe("demo: account en vakken", () => {
  it("has 12 subjects with grades plus a mentor hour", () => {
    expect(data.subjects.filter((s) => s.hasGrades)).toHaveLength(12);
    expect(data.subjects.some((s) => !s.hasGrades)).toBe(true);
    expect(new Set(data.subjects.map((s) => s.id)).size).toBe(data.subjects.length);
  });

  it("is a student in an exam year", () => {
    expect(data.account.isExamYear).toBe(true);
    expect(data.account.firstName).toBe("Daan");
  });
});

describe("demo: cijfers", () => {
  const numeric = data.grades.filter((g) => g.kind === "numeric");

  it("has around 60 grades with unique ids", () => {
    expect(data.grades.length).toBeGreaterThanOrEqual(55);
    expect(data.grades.length).toBeLessThanOrEqual(65);
    expect(new Set(data.grades.map((g) => g.id)).size).toBe(data.grades.length);
  });

  it("only uses subjects that have grades", () => {
    const graded = new Set(data.subjects.filter((s) => s.hasGrades).map((s) => s.id));
    for (const grade of data.grades) expect(graded.has(grade.subjectId)).toBe(true);
  });

  it("includes failing grades, a few 9+ and an ICON-worthy 9.5+", () => {
    expect(numeric.filter((g) => g.value < 5.5).length).toBeGreaterThanOrEqual(3);
    expect(numeric.filter((g) => g.value >= 9).length).toBeGreaterThanOrEqual(2);
    expect(numeric.some((g) => g.value >= 9.5)).toBe(true);
  });

  it("includes non-numeric grades", () => {
    expect(data.grades.some((g) => g.kind === "text")).toBe(true);
  });

  it("uses realistic weights", () => {
    for (const grade of data.grades) expect([0, 1, 2, 3]).toContain(grade.weight);
  });

  it("ends each period on a school day before the next one starts", () => {
    for (const [i, period] of data.periods.entries()) {
      const end = parseISODate(period.end);
      expect(isDemoSchoolDay(end), `${period.name} eindigt op ${period.end}`).toBe(true);
      const next = data.periods[i + 1];
      if (next) expect(period.end < next.start).toBe(true);
    }
  });

  it("spreads grades over three periods and keeps each grade inside its period", () => {
    expect(data.periods).toHaveLength(3);
    for (const period of data.periods) {
      const inPeriod = data.grades.filter((g) => g.periodId === period.id);
      expect(inPeriod.length).toBeGreaterThanOrEqual(10);
      for (const grade of inPeriod) {
        expect(grade.date >= period.start && grade.date <= period.end).toBe(true);
      }
    }
  });

  it("never contains grades from the future", () => {
    for (const grade of data.grades) {
      expect(grade.date <= TODAY).toBe(true);
      expect(new Date(grade.enteredAt).getTime()).toBeLessThanOrEqual(NOW.getTime());
      expect(toISODate(new Date(grade.enteredAt)) >= grade.date).toBe(true);
    }
  });

  it("starts with a pack of the newest grades", () => {
    expect(data.packGradeIds.length).toBeGreaterThanOrEqual(3);
    expect(data.packGradeIds.length).toBeLessThanOrEqual(5);
    const newest = [...data.grades]
      .sort((a, b) => b.enteredAt.localeCompare(a.enteredAt))
      .slice(0, data.packGradeIds.length)
      .map((g) => g.id);
    expect([...data.packGradeIds].sort()).toEqual([...newest].sort());
  });
});

describe("demo: rooster", () => {
  const weekStart = startOfWeek(NOW);
  const weekDates = Array.from({ length: 5 }, (_, i) => toISODate(addDays(weekStart, i)));
  const thisWeek = data.lessons.filter((l) => weekDates.includes(l.date));

  it("plans a full week of lessons", () => {
    expect(thisWeek.filter((l) => l.status !== "uitval").length).toBeGreaterThanOrEqual(25);
  });

  it("never schedules overlapping lessons", () => {
    const byDate = Map.groupBy(data.lessons, (l) => l.date);
    for (const lessons of byDate.values()) {
      const sorted = [...lessons].sort((a, b) => a.start.localeCompare(b.start));
      for (let i = 1; i < sorted.length; i++) {
        expect(sorted[i - 1]!.end <= sorted[i]!.start).toBe(true);
      }
    }
  });

  it("has cancellations and room changes this week", () => {
    expect(thisWeek.some((l) => l.status === "uitval")).toBe(true);
    const moved = thisWeek.filter((l) => l.status === "wijziging");
    expect(moved.length).toBeGreaterThanOrEqual(1);
    expect(moved.every((l) => l.previousLocation && l.previousLocation !== l.location)).toBe(true);
  });

  it("has at least three tests in the coming 14 days", () => {
    const limit = toISODate(addDays(NOW, 14));
    const upcoming = testsFromLessons(data.lessons).filter(
      (t) => t.date > TODAY && t.date <= limit,
    );
    expect(upcoming.length).toBeGreaterThanOrEqual(3);
  });

  it("never schedules two tests for the same subject within 10 days", () => {
    const tests = testsFromLessons(data.lessons).sort((a, b) => a.start.localeCompare(b.start));
    for (const [i, test] of tests.entries()) {
      for (const other of tests.slice(i + 1)) {
        if (other.subjectId !== test.subjectId) continue;
        const days =
          (parseISODate(other.date).getTime() - parseISODate(test.date).getTime()) / 864e5;
        expect(days, `${test.subjectId} op ${test.date} en ${other.date}`).toBeGreaterThanOrEqual(
          10,
        );
      }
    }
  });

  it("has homework for the next school day", () => {
    const next = toISODate(addSchoolDays(parseISODate(TODAY), 1));
    const due = homeworkFromLessons(data.lessons).filter((h) => h.dueDate === next);
    expect(due.length).toBeGreaterThanOrEqual(2);
  });
});

describe("demo: absenties", () => {
  it("has a mix of authorized and unauthorized absences in the past", () => {
    expect(data.absences.length).toBeGreaterThanOrEqual(5);
    expect(data.absences.some((a) => a.isAuthorized)).toBe(true);
    expect(data.absences.some((a) => !a.isAuthorized)).toBe(true);
    for (const absence of data.absences) expect(absence.date < TODAY).toBe(true);
  });
});

describe.each([
  ["vrijdagmiddag", new Date(2026, 9, 9, 16, 0)],
  ["zaterdag", new Date(2026, 9, 10, 11, 0)],
  ["zondagnacht", new Date(2026, 9, 11, 23, 30)],
  ["maandag vóór schooltijd", new Date(2026, 9, 12, 7, 15)],
])("demo op %s", (_label, now) => {
  const other = buildDemoDataset(now);
  const today = toISODate(now);

  it("still shows upcoming tests and homework for the next school day", () => {
    const limit = toISODate(addDays(now, 14));
    const tests = testsFromLessons(other.lessons).filter((t) => t.date > today && t.date <= limit);
    expect(tests.length).toBeGreaterThanOrEqual(3);
    const next = toISODate(addSchoolDays(now, 1));
    expect(
      homeworkFromLessons(other.lessons).filter((h) => h.dueDate === next).length,
    ).toBeGreaterThanOrEqual(2);
  });

  it("keeps the grade list intact", () => {
    expect(other.grades).toHaveLength(data.grades.length);
    for (const grade of other.grades) {
      expect(new Date(grade.enteredAt).getTime()).toBeLessThanOrEqual(now.getTime());
    }
  });
});

describe.each([
  ["de kerstvakantie", new Date(2026, 11, 23, 12, 0)],
  ["de zomervakantie", new Date(2026, 6, 28, 12, 0)],
])("demo in %s", (_label, now) => {
  it("builds without lessons today and with valid periods", () => {
    const other = buildDemoDataset(now);
    expect(other.lessons.filter((l) => l.date === toISODate(now))).toHaveLength(0);
    expect(other.periods).toHaveLength(3);
    for (const grade of other.grades) expect(grade.date <= toISODate(now)).toBe(true);
  });
});

describe("demo: stabiliteit", () => {
  it("is deterministic", () => {
    expect(buildDemoDataset(NOW)).toEqual(data);
  });

  it("keeps grade ids and values when opened on another day", () => {
    const later = buildDemoDataset(new Date(2026, 9, 14, 9, 0));
    const values = (d: typeof data) =>
      Object.fromEntries(d.grades.map((g) => [g.id, `${g.subjectId}:${g.value}:${g.weight}`]));
    expect(values(later)).toEqual(values(data));
  });
});
