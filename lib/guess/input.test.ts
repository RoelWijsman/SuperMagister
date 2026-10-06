import { describe, expect, it } from "vitest";
import {
  confirmGuess,
  dragToGuess,
  keyToGuess,
  lockValue,
  odometer,
  PX_PER_TENTH,
  shouldGuess,
  wheelSteps,
} from "./input";

describe("dragToGuess", () => {
  it("rolt omhoog als je omhoog sleept, in fracties voor een vloeiende teller", () => {
    expect(dragToGuess(55, PX_PER_TENTH * 10)).toBe(65);
    expect(dragToGuess(55, -PX_PER_TENTH * 2.5)).toBe(52.5);
  });

  it("blijft tussen 1,0 en 10,0", () => {
    expect(dragToGuess(95, PX_PER_TENTH * 40)).toBe(100);
    expect(dragToGuess(15, -PX_PER_TENTH * 40)).toBe(10);
  });
});

describe("wheelSteps", () => {
  it("telt kleine trackpad-bewegingen op tot een hele stap", () => {
    const first = wheelSteps(0, -25);
    expect(first.steps).toBe(0);
    const second = wheelSteps(first.rest, -25);
    expect(second.steps).toBe(1);
    expect(second.rest).toBe(-10);
  });

  it("geeft per muiswielklik minstens één tiende, omlaag scrollen is lager", () => {
    expect(wheelSteps(0, 100).steps).toBe(-2);
  });
});

describe("keyToGuess", () => {
  it("kent pijltjes, page up/down, home en end", () => {
    expect(keyToGuess(72, "ArrowUp")).toBe(73);
    expect(keyToGuess(72, "ArrowDown")).toBe(71);
    expect(keyToGuess(72, "PageUp")).toBe(82);
    expect(keyToGuess(95, "PageUp")).toBe(100);
    expect(keyToGuess(72, "Home")).toBe(10);
    expect(keyToGuess(72, "End")).toBe(100);
    expect(keyToGuess(72, "a")).toBeNull();
  });
});

describe("lockValue", () => {
  it("rondt af op een tiende en geeft een cijfer", () => {
    expect(lockValue(72.4)).toBe(7.2);
    expect(lockValue(72.5)).toBe(7.3);
    expect(lockValue(100)).toBe(10);
  });
});

describe("odometer", () => {
  it("laat de tienden doorrollen en de eenheden pas bij de overgang", () => {
    expect(odometer(72)).toEqual({ units: 7, unitsRoll: 0, tenths: 2, tenthsRoll: 0 });
    const between = odometer(72.5);
    expect(between.tenths).toBe(2);
    expect(between.tenthsRoll).toBeCloseTo(0.5);
    expect(between.unitsRoll).toBe(0);
  });

  it("neemt de eenheden mee als de tienden van 9 naar 0 gaan, net als een kilometerteller", () => {
    const carry = odometer(79.5);
    expect(carry.units).toBe(7);
    expect(carry.unitsRoll).toBeCloseTo(0.5);
    expect(carry.tenths).toBe(9);
    expect(carry.tenthsRoll).toBeCloseTo(0.5);
  });

  it("toont 10,0 als hoogste stand", () => {
    expect(odometer(100)).toEqual({ units: 10, unitsRoll: 0, tenths: 0, tenthsRoll: 0 });
    expect(odometer(130)).toEqual({ units: 10, unitsRoll: 0, tenths: 0, tenthsRoll: 0 });
  });
});

describe("shouldGuess", () => {
  const base = { mode: "elke", session: "pack", index: 0, count: 4, numeric: true } as const;

  it("gokt standaard bij elke kaart met een cijfer", () => {
    expect(shouldGuess(base)).toBe(true);
    expect(shouldGuess({ ...base, numeric: false })).toBe(false);
  });

  it("gokt bij 'alleen de laatste' alleen bij de finale", () => {
    expect(shouldGuess({ ...base, mode: "laatste" })).toBe(false);
    expect(shouldGuess({ ...base, mode: "laatste", index: 3 })).toBe(true);
  });

  it("gokt nooit als het uit staat of bij een herhaling", () => {
    expect(shouldGuess({ ...base, mode: "uit" })).toBe(false);
    expect(shouldGuess({ ...base, session: "opnieuw" })).toBe(false);
  });
});

describe("confirmGuess (loslaten of Enter)", () => {
  it("zet een gekozen getal vast, afgerond op een tiende", () => {
    expect(confirmGuess(72.4)).toEqual({ kind: "vastzetten", value: 7.2 });
  });

  it("slaat nooit over: zonder getal wiebelen alleen de pijltjes", () => {
    expect(confirmGuess(null)).toEqual({ kind: "duwtje" });
  });
});
