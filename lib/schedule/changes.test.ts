import { describe, expect, it } from "vitest";
import { lesson } from "@/lib/test-utils/lesson";
import { baselineChanges, diffSchedule, fingerprint, formatChange } from "./changes";

const D = "2026-10-06"; // dinsdag
const subjects = (id: string | null) =>
  ({ wisa: "Wiskunde A", fa: "Frans", ne: "Nederlands" })[id ?? ""] ?? "Les";

const base = [
  lesson(D, "08:30", "09:20", {
    id: "a",
    hourFrom: 1,
    hourTo: 1,
    subjectId: "ne",
    location: "A12",
  }),
  lesson(D, "10:30", "11:20", {
    id: "b",
    hourFrom: 3,
    hourTo: 3,
    subjectId: "wisa",
    location: "B12",
  }),
  lesson("2026-10-08", "12:40", "13:30", { id: "c", hourFrom: 5, hourTo: 5, subjectId: "fa" }),
];
const snapshot = Object.fromEntries(base.map((l) => [l.id, fingerprint(l)]));
const range = { from: D, to: "2026-10-19" };

describe("diffSchedule (wijzigingen-detector)", () => {
  it("ziet een nieuw lokaal en uitval", () => {
    const now = [
      base[0]!,
      { ...base[1]!, location: "A04", previousLocation: "B12", status: "wijziging" as const },
      { ...base[2]!, status: "uitval" as const },
    ];
    const changes = diffSchedule(snapshot, now, range);
    expect(changes.map((c) => [c.lessonId, c.kind])).toEqual([
      ["b", "lokaal"],
      ["c", "uitval"],
    ]);
    expect(changes.map((c) => formatChange(c, subjects))).toEqual([
      "Di 3e uur: lokaal B12 → A04",
      "Do 5e uur: Frans vervalt",
    ]);
  });

  it("ziet een andere tijd, een les die terugkomt en een les die verdwijnt", () => {
    const moved = { ...base[0]!, start: `${D}T09:20:00`, end: `${D}T10:10:00` };
    const changes = diffSchedule(
      { ...snapshot, c: { ...snapshot.c!, status: "uitval" } },
      [moved, { ...base[2]! }],
      range,
    );
    expect(changes.map((c) => c.kind)).toEqual(["tijd", "verdwenen", "terug"]);
    expect(formatChange(changes[0]!, subjects)).toBe("Di 1e uur: Nederlands begint om 09:20");
    expect(formatChange(changes[2]!, subjects)).toBe("Do 5e uur: Frans gaat toch door");
  });

  it("noemt een extra les binnen het bekende rooster", () => {
    const extra = lesson(D, "13:30", "14:20", {
      id: "x",
      hourFrom: 6,
      hourTo: 6,
      subjectId: "wisa",
    });
    const changes = diffSchedule(snapshot, [...base, extra], range);
    expect(changes.map((c) => c.kind)).toEqual(["extra"]);
    expect(formatChange(changes[0]!, subjects)).toBe("Di 6e uur: extra les Wiskunde A");
  });

  it("negeert lessen buiten het bekende venster en lessen in het verleden", () => {
    const future = lesson("2026-11-02", "08:30", "09:20", { id: "ver" });
    expect(diffSchedule(snapshot, [...base, future], range)).toEqual([]);
  });

  it("ziet niks als er niks verandert", () => {
    expect(diffSchedule(snapshot, base, range)).toEqual([]);
  });
});

describe("baselineChanges (eerste keer)", () => {
  it("telt wat al afwijkt van het gewone rooster", () => {
    const now = [
      base[0]!,
      { ...base[1]!, location: "A04", previousLocation: "B12", status: "wijziging" as const },
      { ...base[2]!, status: "uitval" as const },
    ];
    expect(baselineChanges(now, range).map((c) => c.kind)).toEqual(["lokaal", "uitval"]);
  });
});
