import { describe, expect, it } from "vitest";
import { lesson } from "@/lib/test-utils/lesson";
import { nextTrackerState } from "./tracker";

const today = "2026-10-06";
const range = { from: today, to: "2026-10-19" };
const lessons = [
  lesson("2026-10-07", "08:30", "09:20", { id: "a", location: "A12" }),
  lesson("2026-10-08", "08:30", "09:20", { id: "b", status: "uitval" }),
];

describe("nextTrackerState (wat de detector bewaart)", () => {
  it("begint met wat al afwijkt en markeert dat als nog niet gezien", () => {
    const state = nextTrackerState(null, lessons, range, today);
    expect(state.changes.map((c) => c.id)).toEqual(["b:uitval"]);
    expect(state.unseen).toEqual(["b"]);
    expect(Object.keys(state.snapshot)).toEqual(["a", "b"]);
    expect(state.range).toEqual(range);
  });

  it("voegt nieuwe wijzigingen toe en onthoudt de oude", () => {
    const first = nextTrackerState(null, lessons, range, today);
    const moved = [{ ...lessons[0]!, location: "C07" }, lessons[1]!];
    const second = nextTrackerState(first, moved, range, today);
    expect(second.changes.map((c) => c.id)).toEqual(["a:lokaal", "b:uitval"]);
    expect(second.unseen.sort()).toEqual(["a", "b"]);
  });

  it("vervangt uitval door 'gaat toch door' als een les terugkomt", () => {
    const first = nextTrackerState(null, lessons, range, today);
    const back = [lessons[0]!, { ...lessons[1]!, status: "normaal" as const }];
    const second = nextTrackerState(first, back, range, today);
    expect(second.changes.map((c) => c.id)).toEqual(["b:terug"]);
  });

  it("ruimt wijzigingen van voorbije dagen op", () => {
    const first = nextTrackerState(null, lessons, range, today);
    const later = nextTrackerState(
      first,
      lessons,
      { from: "2026-10-09", to: "2026-10-22" },
      "2026-10-09",
    );
    expect(later.changes).toEqual([]);
    expect(later.unseen).toEqual([]);
  });

  it("vergelijkt alleen binnen het venster dat het snapshot al kende", () => {
    const first = nextTrackerState(null, lessons, range, today);
    const fresh = lesson("2026-10-20", "08:30", "09:20", { id: "nieuw" });
    const second = nextTrackerState(
      first,
      [...lessons, fresh],
      { from: today, to: "2026-10-20" },
      today,
    );
    expect(second.changes.map((c) => c.id)).toEqual(["b:uitval"]);
    expect(Object.keys(second.snapshot)).toContain("nieuw");
  });
});
