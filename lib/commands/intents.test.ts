import { describe, expect, it } from "vitest";
import { parseIntent } from "./intents";

const subjects = [
  { id: "wisa", code: "wisA", name: "Wiskunde A" },
  { id: "en", code: "en", name: "Engels" },
];
const now = new Date(2026, 9, 5, 10, 0); // maandag

describe("parseIntent", () => {
  it("understands 'wat moet ik halen voor wiskunde'", () => {
    expect(parseIntent("wat moet ik halen voor wiskunde", subjects, now)).toEqual({
      type: "what-to-get",
      subjectId: "wisa",
    });
  });

  it("understands a short 'halen engels'", () => {
    expect(parseIntent("halen engels", subjects, now)).toEqual({
      type: "what-to-get",
      subjectId: "en",
    });
  });

  it("understands 'rooster morgen'", () => {
    expect(parseIntent("rooster morgen", subjects, now)).toEqual({
      type: "schedule-day",
      date: "2026-10-06",
    });
  });

  it("understands a weekday in the schedule", () => {
    expect(parseIntent("rooster vrijdag", subjects, now)).toEqual({
      type: "schedule-day",
      date: "2026-10-09",
    });
  });

  it("jumps to next week for a weekday that already passed", () => {
    expect(parseIntent("rooster maandag", subjects, new Date(2026, 9, 7, 10))).toEqual({
      type: "schedule-day",
      date: "2026-10-12",
    });
  });

  it("returns null for plain searches", () => {
    expect(parseIntent("engels", subjects, now)).toBeNull();
  });
});
