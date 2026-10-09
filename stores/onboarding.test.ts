import { beforeEach, describe, expect, it } from "vitest";
import {
  isReturningUser,
  ONBOARDING_STEPS,
  PROGRESS_STEPS,
  progressOf,
  useOnboarding,
} from "./onboarding";

beforeEach(() => {
  useOnboarding.setState({ status: "nieuw", step: "intro" });
});

describe("useOnboarding", () => {
  it("begint bij de intro en loopt de stappen op volgorde af", () => {
    const { begin, next } = useOnboarding.getState();
    begin();
    expect(useOnboarding.getState()).toMatchObject({ status: "bezig", step: "intro" });
    const seen = [useOnboarding.getState().step];
    for (let i = 1; i < ONBOARDING_STEPS.length; i++) {
      next();
      seen.push(useOnboarding.getState().step);
    }
    expect(seen).toEqual([...ONBOARDING_STEPS]);
    // Na de laatste stap gaat hij niet verder.
    next();
    expect(useOnboarding.getState().step).toBe("klaar");
  });

  it("kan terug, maar niet terug naar de intro", () => {
    const { begin, go, back } = useOnboarding.getState();
    begin();
    go("thema");
    back();
    expect(useOnboarding.getState().step).toBe("overzicht");
    go("pack");
    back();
    expect(useOnboarding.getState().step).toBe("pack");
  });

  it("onthoudt waar je was (de stap blijft staan)", () => {
    const { begin, go } = useOnboarding.getState();
    begin();
    go("woonplaats");
    expect(useOnboarding.getState()).toMatchObject({ status: "bezig", step: "woonplaats" });
  });

  it("is klaar na afronden of overslaan, en kan opnieuw", () => {
    const { begin, finish, restart } = useOnboarding.getState();
    begin();
    finish();
    expect(useOnboarding.getState().status).toBe("klaar");
    restart();
    expect(useOnboarding.getState()).toMatchObject({ status: "bezig", step: "intro" });
  });

  it("geeft elke stap na de intro een eigen stip", () => {
    expect(progressOf("intro")).toBe(-1);
    // Elke uitlegkaart heeft een eigen stip, zodat je ziet dat er iets gebeurt.
    expect(progressOf("pack")).toBe(0);
    expect(progressOf("gok")).toBe(1);
    expect(progressOf("overzicht")).toBe(2);
    expect(progressOf("thema")).toBe(3);
    expect(progressOf("klaar")).toBe(PROGRESS_STEPS - 1);
  });
});

describe("isReturningUser", () => {
  it("herkent wie de app al gebruikte aan eigen opslag", () => {
    expect(isReturningUser([])).toBe(false);
    expect(isReturningUser(["iets-anders", "sm-onboarding"])).toBe(false);
    expect(isReturningUser(["sm-instellingen"])).toBe(true);
    expect(isReturningUser(["sm-koppeling"])).toBe(true);
  });
});
