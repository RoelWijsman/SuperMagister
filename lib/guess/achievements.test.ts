import { describe, expect, it } from "vitest";
import { guessAchievements } from "./achievements";
import type { GuessEntry } from "./types";

let n = 0;
function entry(guess: number, actual: number): GuessEntry {
  n += 1;
  const minute = String(n).padStart(2, "0");
  return {
    gradeId: `g${n}`,
    subjectId: "wi",
    subjectName: "Wiskunde",
    guess,
    actual,
    at: `2026-10-06T10:${minute}:00.000Z`,
    date: "2026-10-01",
  };
}

const find = (entries: GuessEntry[], id: string) => {
  const found = guessAchievements(entries).find((a) => a.id === id);
  if (!found) throw new Error(`Geen prestatie ${id}`);
  return found;
};

describe("guessAchievements", () => {
  it("begint met alles op slot", () => {
    for (const achievement of guessAchievements([])) {
      expect(achievement.unlockedAt).toBeNull();
      expect(achievement.progress.current).toBe(0);
    }
  });

  it("geeft Verdacht bij de eerste precies goede gok", () => {
    const entries = [entry(6, 7), entry(7.4, 7.4), entry(8, 8)];
    expect(find(entries, "gok.verdacht")).toMatchObject({
      title: "Verdacht",
      unlockedAt: entries[1]!.at,
    });
  });

  it("maakt je na 5 keer binnen 0,3 een Orakel", () => {
    const entries = [
      entry(7, 7.3),
      entry(7, 7.6),
      entry(7, 6.8),
      entry(7, 7),
      entry(7, 7.1),
      entry(7, 7.2),
    ];
    const orakel = find(entries, "gok.orakel");
    expect(orakel.unlockedAt).toBe(entries[5]!.at);
    expect(orakel.progress).toEqual({ current: 5, target: 5 });
  });

  it("telt te laag en te hoog gegokt", () => {
    const low = Array.from({ length: 10 }, () => entry(6, 7));
    const high = Array.from({ length: 9 }, () => entry(8, 7));
    expect(find(low, "gok.laag").unlockedAt).toBe(low[9]!.at);
    expect(find(low, "gok.laag").title).toBe("Lage verwachtingen, hoge cijfers");
    expect(find(high, "gok.hoog")).toMatchObject({
      title: "Delulu is níet de solulu",
      unlockedAt: null,
      progress: { current: 9, target: 10 },
    });
  });

  it("wil voor Script gelezen 3 keer op rij binnen 0,5, in de volgorde van gokken", () => {
    const entries = [
      entry(7, 7.5),
      entry(7, 7.4),
      entry(5, 7),
      entry(7, 7.2),
      entry(7, 7.5),
      entry(7, 6.6),
    ];
    const script = find([...entries].reverse(), "gok.script");
    expect(script.unlockedAt).toBe(entries[5]!.at);
  });

  it("verstopt de geheime prestatie tot je 6,7 gokt en haalt", () => {
    const secret = find([entry(6.7, 6.8)], "gok.zeszeven");
    expect(secret).toMatchObject({ secret: true, unlockedAt: null });
    const entries = [entry(6.7, 6.7)];
    expect(find(entries, "gok.zeszeven")).toMatchObject({
      title: "Dit had niet mogen gebeuren",
      unlockedAt: entries[0]!.at,
    });
  });
});
