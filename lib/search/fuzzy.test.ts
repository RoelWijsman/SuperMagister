import { describe, expect, it } from "vitest";
import { fuzzyMatch, normalizeText } from "./fuzzy";

describe("normalizeText", () => {
  it("lowercases and strips diacritics", () => {
    expect(normalizeText("Enquête Één")).toBe("enquete een");
  });
});

describe("fuzzyMatch", () => {
  it("matches everything with score 0 for an empty query", () => {
    expect(fuzzyMatch("", "Rooster")).toEqual({ score: 0, ranges: [] });
  });

  it("matches a subsequence", () => {
    expect(fuzzyMatch("rst", "Rooster")).not.toBeNull();
  });

  it("returns null when characters are missing", () => {
    expect(fuzzyMatch("xyz", "Rooster")).toBeNull();
  });

  it("ignores case and diacritics", () => {
    expect(fuzzyMatch("enquete", "Enquête")).not.toBeNull();
  });

  it("returns highlight ranges for contiguous matches", () => {
    expect(fuzzyMatch("roo", "Rooster")?.ranges).toEqual([[0, 3]]);
  });

  it("ranks a prefix match above a scattered match", () => {
    const prefix = fuzzyMatch("ro", "Rooster")!;
    const scattered = fuzzyMatch("ro", "Huiswerk voor morgen")!;
    expect(prefix.score).toBeGreaterThan(scattered.score);
  });

  it("ranks word-start matches above mid-word matches", () => {
    const wordStart = fuzzyMatch("tw", "Thema wisselen")!;
    const midWord = fuzzyMatch("tw", "Toetsweek")!;
    expect(wordStart.score).toBeGreaterThan(midWord.score);
  });

  it("ranks an exact match highest", () => {
    const exact = fuzzyMatch("engels", "Engels")!;
    const longer = fuzzyMatch("engels", "Engels huiswerk")!;
    expect(exact.score).toBeGreaterThan(longer.score);
  });
});
