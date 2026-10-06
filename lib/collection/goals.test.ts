import { describe, expect, it } from "vitest";
import type { SubjectGroup } from "@/lib/types";
import { collectionGoals, FOILS, unlockedFoils, type GoalCard } from "./goals";

const GROUPS: Record<string, SubjectGroup> = {
  wi: "exact",
  na: "exact",
  en: "talen",
  ne: "talen",
  gs: "mens-maatschappij",
  ak: "mens-maatschappij",
};
const groupOf = (subjectId: string): SubjectGroup => GROUPS[subjectId] ?? "overig";

const card = (
  subjectId: string,
  tier: GoalCard["tier"],
  extra: Partial<GoalCard> = {},
): GoalCard => ({
  subjectId,
  tier,
  variants: [],
  streak: 0,
  ...extra,
});

const goal = (cards: GoalCard[], id: string) => {
  const found = collectionGoals(cards, groupOf).find((g) => g.id === id);
  if (!found) throw new Error(`Geen doel ${id}`);
  return found;
};

describe("collectionGoals", () => {
  it("telt naar een startelftal van 11 kaarten", () => {
    const ten = Array.from({ length: 10 }, () => card("en", "zilver"));
    expect(goal(ten, "startelftal")).toMatchObject({ current: 10, target: 11, done: false });
    expect(goal([...ten, card("wi", "brons")], "startelftal")).toMatchObject({
      current: 11,
      done: true,
    });
  });

  it("wil voor Goudkoorts goud of beter in elk vak, met minstens vijf vakken", () => {
    const cards = [
      card("wi", "goud"),
      card("en", "icon"),
      card("ne", "zilver"),
      card("gs", "toty"),
    ];
    expect(goal(cards, "goudkoorts")).toMatchObject({ current: 3, target: 5, done: false });

    const all = [...cards, card("ne", "goud"), card("ak", "goud")];
    expect(goal(all, "goudkoorts")).toMatchObject({ current: 5, target: 5, done: true });

    const sixth = [...all, card("na", "brons")];
    expect(goal(sixth, "goudkoorts")).toMatchObject({ current: 5, target: 6, done: false });
  });

  it("telt alleen TOTY en ICON in exacte vakken voor Exacte toppers", () => {
    const cards = [card("wi", "toty"), card("na", "icon"), card("en", "icon"), card("wi", "goud")];
    expect(goal(cards, "exact")).toMatchObject({ current: 2, target: 3, done: false });
    expect(goal([...cards, card("wi", "toty")], "exact")).toMatchObject({ current: 3, done: true });
  });

  it("telt comeback-kaarten", () => {
    const cards = [
      card("wi", "goud", { variants: ["comeback"] }),
      card("en", "zilver", { variants: ["record", "comeback"] }),
    ];
    expect(goal(cards, "comeback")).toMatchObject({ current: 2, target: 3, done: false });
  });

  it("kijkt voor Reeksmachine naar de langste reeks", () => {
    const cards = [card("wi", "goud", { streak: 3 }), card("en", "zilver", { streak: 6 })];
    expect(goal(cards, "reeks")).toMatchObject({ current: 5, target: 5, done: true });
  });

  it("geeft elk doel een eigen folie als beloning", () => {
    const rewards = collectionGoals([], groupOf).map((g) => g.reward);
    expect(new Set(rewards).size).toBe(rewards.length);
    expect(rewards).not.toContain("standaard");
    for (const reward of rewards) expect(FOILS[reward]).toBeDefined();
  });
});

describe("unlockedFoils", () => {
  it("heeft altijd de standaardfolie, plus de beloningen van gehaalde doelen", () => {
    const eleven = Array.from({ length: 11 }, () => card("en", "zilver"));
    expect(unlockedFoils(collectionGoals([], groupOf))).toEqual(["standaard"]);
    expect(unlockedFoils(collectionGoals(eleven, groupOf))).toEqual(["standaard", "regenboog"]);
  });
});
