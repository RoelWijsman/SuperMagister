import { describe, expect, it } from "vitest";
import { defaultFocus, shiftFocus, viewRange } from "./navigate";

describe("defaultFocus", () => {
  it("is vandaag op een schooldag", () => {
    expect(defaultFocus(new Date(2026, 9, 7, 14, 0))).toBe("2026-10-07");
  });

  it("springt in het weekend naar maandag", () => {
    expect(defaultFocus(new Date(2026, 9, 10, 9, 0))).toBe("2026-10-12");
    expect(defaultFocus(new Date(2026, 9, 11, 9, 0))).toBe("2026-10-12");
  });
});

describe("shiftFocus", () => {
  it("gaat per dag en slaat het weekend over", () => {
    expect(shiftFocus("2026-10-07", "dag", 1)).toBe("2026-10-08");
    expect(shiftFocus("2026-10-09", "dag", 1)).toBe("2026-10-12");
    expect(shiftFocus("2026-10-12", "dag", -1)).toBe("2026-10-09");
  });

  it("gaat per week in de week- en lijstweergave", () => {
    expect(shiftFocus("2026-10-07", "week", 1)).toBe("2026-10-14");
    expect(shiftFocus("2026-10-07", "lijst", -1)).toBe("2026-09-30");
  });

  it("gaat per maand naar de eerste schooldag", () => {
    expect(shiftFocus("2026-10-07", "maand", 1)).toBe("2026-11-02");
    expect(shiftFocus("2026-10-07", "maand", -1)).toBe("2026-09-01");
  });
});

describe("viewRange", () => {
  it("is de hele week voor dag, week en lijst", () => {
    expect(viewRange("2026-10-07", "dag")).toEqual({ from: "2026-10-05", to: "2026-10-11" });
    expect(viewRange("2026-10-11", "week")).toEqual({ from: "2026-10-05", to: "2026-10-11" });
  });

  it("is het hele maandrooster (zes weken) voor maand", () => {
    expect(viewRange("2026-10-20", "maand")).toEqual({ from: "2026-09-28", to: "2026-11-08" });
  });
});
