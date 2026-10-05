import { describe, expect, it } from "vitest";
import type { Lesson } from "@/lib/types";
import { homeworkFromLessons, htmlToText, testsFromLessons } from "./derive";

function lesson(overrides: Partial<Lesson>): Lesson {
  return {
    id: "l1",
    start: "2026-10-06T06:30:00.000Z",
    end: "2026-10-06T07:20:00.000Z",
    date: "2026-10-06",
    hourFrom: 1,
    hourTo: 1,
    subjectId: "wisa",
    title: "wisA - VDB - 5H2",
    location: "B21",
    previousLocation: null,
    teachers: [{ code: "VDB" }],
    infoType: "geen",
    status: "normaal",
    contentHtml: null,
    isDone: false,
    ...overrides,
  };
}

describe("htmlToText", () => {
  it("strips tags and decodes entities", () => {
    expect(htmlToText("<p>Maak <strong>opgave 3</strong> &amp; 4</p>")).toBe("Maak opgave 3 & 4");
  });

  it("turns breaks and paragraphs into spaces", () => {
    expect(htmlToText("<p>Regel 1</p><p>Regel&nbsp;2<br>Regel 3</p>")).toBe(
      "Regel 1 Regel 2 Regel 3",
    );
  });
});

describe("homeworkFromLessons", () => {
  it("creates homework for lessons with homework content", () => {
    const [hw] = homeworkFromLessons([
      lesson({ infoType: "huiswerk", contentHtml: "<p>Maak §5.2</p>", isDone: true }),
    ]);
    expect(hw).toMatchObject({
      id: "hw-l1",
      lessonId: "l1",
      subjectId: "wisa",
      dueDate: "2026-10-06",
      text: "Maak §5.2",
      isDone: true,
      isTest: false,
    });
  });

  it("also lists what to study for a test", () => {
    const [hw] = homeworkFromLessons([
      lesson({ infoType: "toets", contentHtml: "<p>Leer H5</p>" }),
    ]);
    expect(hw?.isTest).toBe(true);
  });

  it("ignores lessons without content", () => {
    expect(homeworkFromLessons([lesson({ infoType: "huiswerk", contentHtml: "  " })])).toEqual([]);
    expect(homeworkFromLessons([lesson({})])).toEqual([]);
  });
});

describe("testsFromLessons", () => {
  it("maps test-like info types to tests", () => {
    const tests = testsFromLessons([
      lesson({ id: "a", infoType: "toets", contentHtml: "<p>H5</p>" }),
      lesson({ id: "b", infoType: "schriftelijk", contentHtml: "<p>SO</p>" }),
      lesson({ id: "c", infoType: "mondeling" }),
      lesson({ id: "d", infoType: "huiswerk", contentHtml: "<p>hw</p>" }),
    ]);
    expect(tests.map((t) => [t.lessonId, t.kind])).toEqual([
      ["a", "toets"],
      ["b", "schriftelijk"],
      ["c", "mondeling"],
    ]);
  });

  it("skips cancelled lessons", () => {
    expect(testsFromLessons([lesson({ infoType: "toets", status: "uitval" })])).toEqual([]);
  });
});
