import { describe, expect, it } from "vitest";
import { getGreeting, type GreetingInput } from "./greeting";

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

describe("getGreeting", () => {
  it("greets in the morning with the first name", () => {
    expect(getGreeting(input({})).title).toBe("Goeiemorgen Daan ☀️");
  });

  it("calls a long day with a test 'pittig'", () => {
    const g = getGreeting(input({ lessonsToday: 7, lessonsLeft: 7, testsToday: 1 }));
    expect(g.subtitle).toBe("Pittige dag: 7 uur en een toets");
  });

  it("counts down to the weekend on friday", () => {
    const g = getGreeting(
      input({ now: new Date(2026, 9, 9, 12, 15), lessonsToday: 6, lessonsLeft: 2 }),
    );
    expect(g.subtitle).toBe("Vrijdag! Nog 2 lessen tot het weekend 🎉");
  });

  it("asks night owls if they are still awake", () => {
    const g = getGreeting(input({ now: new Date(2026, 9, 6, 1, 30) }));
    expect(g.title).toBe("Huh, ben je nog wakker? 🌙");
  });

  it("celebrates the weekend", () => {
    const g = getGreeting(
      input({ now: new Date(2026, 9, 10, 11, 0), lessonsToday: 0, lessonsLeft: 0 }),
    );
    expect(g.subtitle).toBe("Weekend! Geen lessen vandaag 🎉");
  });

  it("says school is done after the last lesson", () => {
    const g = getGreeting(input({ now: new Date(2026, 9, 5, 16, 0), lessonsLeft: 0 }));
    expect(g.subtitle).toBe("School zit erop voor vandaag ✅");
  });

  it("puts birthdays first", () => {
    const g = getGreeting(input({ isBirthday: true }));
    expect(g.title).toBe("Gefeliciteerd Daan! 🎂");
  });
});
