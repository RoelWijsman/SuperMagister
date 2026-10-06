import { describe, expect, it } from "vitest";
import { examCountdown, EXAM_START, weekendCountdown } from "./countdowns";

describe("weekendCountdown", () => {
  it("telt op maandag tot en met donderdag in dagen", () => {
    // Dinsdag 6 oktober 2026.
    expect(weekendCountdown(new Date("2026-10-06T10:00:00"), null)).toEqual({
      kind: "dagen",
      days: 4,
    });
    expect(weekendCountdown(new Date("2026-10-08T10:00:00"), null)).toEqual({
      kind: "dagen",
      days: 2,
    });
  });

  it("telt op vrijdag af tot de laatste bel", () => {
    const friday = new Date("2026-10-09T13:00:00");
    expect(weekendCountdown(friday, new Date("2026-10-09T15:20:00"))).toEqual({
      kind: "minuten",
      minutes: 140,
    });
  });

  it("is weekend na de laatste bel op vrijdag, en op zaterdag en zondag", () => {
    expect(
      weekendCountdown(new Date("2026-10-09T16:00:00"), new Date("2026-10-09T15:20:00")).kind,
    ).toBe("weekend");
    expect(weekendCountdown(new Date("2026-10-10T11:00:00"), null).kind).toBe("weekend");
    expect(weekendCountdown(new Date("2026-10-11T11:00:00"), null).kind).toBe("weekend");
  });

  it("telt op een vrijdag zonder lessen ook als weekend", () => {
    expect(weekendCountdown(new Date("2026-10-09T09:00:00"), null).kind).toBe("weekend");
  });
});

describe("examCountdown", () => {
  it("kent het eerste centraal examen van 2027", () => {
    expect(EXAM_START[2027]).toBe("2027-05-12");
  });

  it("telt de dagen tot je eerste examen", () => {
    expect(examCountdown(new Date("2026-10-06T10:00:00"))).toEqual({
      date: "2027-05-12",
      days: 218,
    });
  });

  it("stopt als de examens begonnen zijn of de datum onbekend is", () => {
    expect(examCountdown(new Date("2027-05-12T09:00:00"))?.days).toBe(0);
    expect(examCountdown(new Date("2027-06-01T09:00:00"))).toBeNull();
  });
});
