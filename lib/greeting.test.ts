import { describe, expect, it } from "vitest";
import { greetingSituation, type GreetingInput } from "./greeting";

function input(overrides: Partial<GreetingInput>): GreetingInput {
  return {
    now: new Date(2026, 9, 5, 7, 45), // maandag
    firstName: "Daan",
    lessonsToday: 6,
    lessonsLeft: 6,
    testsToday: 0,
    firstLessonStart: new Date(2026, 9, 5, 8, 30),
    nextSchoolDayStart: null,
    isBirthday: false,
    ...overrides,
  };
}

describe("greetingSituation", () => {
  it("greets in the morning with the first name", () => {
    expect(greetingSituation(input({})).title).toEqual({
      key: "begroeting.ochtend",
      vars: { naam: "Daan" },
    });
  });

  it("uses the afternoon and evening greetings", () => {
    expect(greetingSituation(input({ now: new Date(2026, 9, 5, 13, 0) })).title.key).toBe(
      "begroeting.middag",
    );
    expect(greetingSituation(input({ now: new Date(2026, 9, 5, 19, 0) })).title.key).toBe(
      "begroeting.avond",
    );
  });

  it("calls a long day with a test 'pittig'", () => {
    const s = greetingSituation(input({ lessonsToday: 7, lessonsLeft: 7, testsToday: 1 }));
    expect(s.subtitle).toEqual({ key: "dag.pittig", vars: { uren: 7, toetsen: "een toets" } });
  });

  it("mentions a test on a normal day", () => {
    const s = greetingSituation(input({ testsToday: 2, lessonsToday: 5, lessonsLeft: 5 }));
    expect(s.subtitle).toEqual({ key: "dag.pittig", vars: { uren: 5, toetsen: "2 toetsen" } });
    const single = greetingSituation(input({ testsToday: 1 }));
    expect(single.subtitle).toEqual({ key: "dag.toets", vars: { toetsen: "een toets" } });
  });

  it("counts down to the weekend on friday", () => {
    const s = greetingSituation(
      input({ now: new Date(2026, 9, 9, 12, 15), lessonsToday: 6, lessonsLeft: 2 }),
    );
    expect(s.subtitle).toEqual({ key: "dag.vrijdag", vars: { aantal: 2, lessen: "lessen" } });
  });

  it("uses the singular for one lesson", () => {
    const s = greetingSituation(input({ now: new Date(2026, 9, 5, 14, 0), lessonsLeft: 1 }));
    expect(s.subtitle).toEqual({ key: "dag.bezig", vars: { aantal: 1, lessen: "les" } });
  });

  it("asks night owls if they are still awake and mentions the first lesson", () => {
    const s = greetingSituation(
      input({
        now: new Date(2026, 9, 6, 1, 30),
        nextSchoolDayStart: new Date(2026, 9, 6, 10, 30),
      }),
    );
    expect(s.title).toEqual({ key: "begroeting.nacht", vars: { naam: "Daan", tijd: "01:30" } });
    expect(s.subtitle).toEqual({ key: "dag.nacht", vars: { tijd: "10:30" } });
  });

  it("tells night owls when there is no school tomorrow", () => {
    const s = greetingSituation(input({ now: new Date(2026, 9, 10, 23, 30) }));
    expect(s.subtitle.key).toBe("dag.nachtVrij");
  });

  it("celebrates the weekend", () => {
    const s = greetingSituation(
      input({ now: new Date(2026, 9, 10, 11, 0), lessonsToday: 0, lessonsLeft: 0 }),
    );
    expect(s.subtitle.key).toBe("dag.weekend");
  });

  it("knows a free weekday", () => {
    const s = greetingSituation(input({ lessonsToday: 0, lessonsLeft: 0 }));
    expect(s.subtitle.key).toBe("dag.vrij");
  });

  it("says school is done after the last lesson", () => {
    const s = greetingSituation(input({ now: new Date(2026, 9, 5, 16, 0), lessonsLeft: 0 }));
    expect(s.subtitle.key).toBe("dag.klaar");
  });

  it("mentions the first lesson before school", () => {
    const s = greetingSituation(input({}));
    expect(s.subtitle).toEqual({ key: "dag.voorSchool", vars: { uren: 6, tijd: "08:30" } });
  });

  it("puts birthdays first", () => {
    expect(greetingSituation(input({ isBirthday: true })).title).toEqual({
      key: "begroeting.verjaardag",
      vars: { naam: "Daan" },
    });
  });
});
