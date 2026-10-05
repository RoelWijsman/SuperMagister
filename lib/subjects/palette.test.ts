import { describe, expect, it } from "vitest";
import { SUBJECT_PALETTE, assignSubjectColors, hashString } from "./palette";

const CODES = ["ne", "en", "du", "wisa", "biol", "schk", "nat", "ak", "gs", "econ", "tek", "lo"];

describe("SUBJECT_PALETTE", () => {
  it("has 16 distinct hex colors", () => {
    expect(SUBJECT_PALETTE).toHaveLength(16);
    expect(new Set(SUBJECT_PALETTE.map((c) => c.hex)).size).toBe(16);
  });
});

describe("hashString", () => {
  it("is deterministic and unsigned", () => {
    expect(hashString("wisa")).toBe(hashString("wisa"));
    expect(hashString("wisa")).toBeGreaterThanOrEqual(0);
    expect(hashString("wisa")).not.toBe(hashString("wisb"));
  });
});

describe("assignSubjectColors", () => {
  it("gives a single subject its hashed color", () => {
    expect(assignSubjectColors(["wisa"])).toEqual({ wisa: hashString("wisa") % 16 });
  });

  it("gives every subject a unique palette index when there are at most 16", () => {
    const colors = assignSubjectColors(CODES);
    const indices = CODES.map((code) => colors[code]);
    for (const index of indices) {
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(16);
    }
    expect(new Set(indices).size).toBe(CODES.length);
  });

  it("does not depend on the input order", () => {
    expect(assignSubjectColors([...CODES].reverse())).toEqual(assignSubjectColors(CODES));
  });

  it("treats codes case-insensitively", () => {
    expect(assignSubjectColors(["WisA"])).toEqual({ wisa: hashString("wisa") % 16 });
  });

  it("still assigns colors when there are more than 16 subjects", () => {
    const many = Array.from({ length: 20 }, (_, i) => `vak${i}`);
    const colors = assignSubjectColors(many);
    expect(Object.keys(colors)).toHaveLength(20);
  });
});
