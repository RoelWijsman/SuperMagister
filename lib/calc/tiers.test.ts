import { describe, expect, it } from "vitest";
import { bestTier, cardRating, cardTier } from "./tiers";

describe("cardRating", () => {
  it("is the grade times ten", () => {
    expect(cardRating(7.8)).toBe(78);
    expect(cardRating(10)).toBe(100);
  });

  it("rounds to a whole rating", () => {
    expect(cardRating(6.95)).toBe(70);
  });
});

describe("cardTier", () => {
  it.each([
    [1.0, "brons"],
    [5.4, "brons"],
    [5.5, "zilver"],
    [6.9, "zilver"],
    [7.0, "goud"],
    [8.4, "goud"],
    [8.5, "toty"],
    [9.4, "toty"],
    [9.5, "icon"],
    [10, "icon"],
  ] as const)("%s → %s", (value, tier) => {
    expect(cardTier(value)).toBe(tier);
  });
});

describe("bestTier", () => {
  it("returns the highest tier", () => {
    expect(bestTier([5.2, 8.1, 9.7, 6.8])).toBe("icon");
    expect(bestTier([5.2, 6.1])).toBe("zilver");
  });

  it("returns null for an empty list", () => {
    expect(bestTier([])).toBeNull();
  });
});
