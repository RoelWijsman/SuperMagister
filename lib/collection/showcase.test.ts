import { describe, expect, it } from "vitest";
import { cleanShowcase, SHOWCASE_SIZE, toggleShowcase } from "./showcase";

describe("toggleShowcase", () => {
  it("voegt een kaart achteraan toe", () => {
    expect(toggleShowcase(["a"], "b")).toEqual({ ids: ["a", "b"], result: "toegevoegd" });
  });

  it("haalt een kaart die er al in staat eruit", () => {
    expect(toggleShowcase(["a", "b", "c"], "b")).toEqual({ ids: ["a", "c"], result: "weg" });
  });

  it("weigert een zesde kaart", () => {
    const full = ["a", "b", "c", "d", "e"];
    expect(SHOWCASE_SIZE).toBe(5);
    expect(toggleShowcase(full, "f")).toEqual({ ids: full, result: "vol" });
  });
});

describe("cleanShowcase", () => {
  it("vergeet kaarten die niet (meer) in je collectie zitten en dubbele", () => {
    expect(cleanShowcase(["a", "x", "b", "a"], new Set(["a", "b"]))).toEqual(["a", "b"]);
  });
});
