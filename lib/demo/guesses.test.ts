import { describe, expect, it } from "vitest";
import { guessAchievements } from "@/lib/guess/achievements";
import { guesserProfile, subjectAccuracy } from "@/lib/guess/profile";
import type { GuessEntry } from "@/lib/guess/types";
import { buildDemoGrades } from "./grades";
import { buildDemoGuesses } from "./guesses";
import { buildDemoSubjects } from "./school";

/**
 * Daan gokt al een tijdje. Zijn geschiedenis laat het hele gokprofiel zien,
 * maar laat genoeg over om zelf te verdienen bij het eerste pack.
 */
describe("buildDemoGuesses", () => {
  const now = new Date(2026, 9, 6, 12);
  const { grades, packGradeIds } = buildDemoGrades(now);
  const guesses = buildDemoGuesses(grades, packGradeIds);
  const names = new Map(buildDemoSubjects().map((s) => [s.id, s.name]));
  const entries: GuessEntry[] = grades.flatMap((grade) => {
    const record = guesses[grade.id];
    if (!record || grade.kind !== "numeric") return [];
    return [
      {
        gradeId: grade.id,
        subjectId: grade.subjectId,
        subjectName: names.get(grade.subjectId) ?? grade.subjectId,
        guess: record.gok,
        actual: grade.value,
        at: record.at,
        date: grade.date,
      },
    ];
  });

  it("is deterministisch", () => {
    expect(buildDemoGuesses(grades, packGradeIds)).toEqual(guesses);
  });

  it("gokt niet op cijfers uit het pack en niet op V, G of O", () => {
    for (const id of packGradeIds) expect(guesses[id]).toBeUndefined();
    for (const grade of grades.filter((g) => g.kind === "text"))
      expect(guesses[grade.id]).toBeUndefined();
    expect(entries.length).toBeGreaterThanOrEqual(25);
  });

  it("gokt pas nadat het cijfer is ingevoerd", () => {
    for (const grade of grades) {
      const record = guesses[grade.id];
      if (record) expect(record.at > grade.enteredAt).toBe(true);
    }
  });

  it("maakt van Daan een bescheiden pessimist: orakel bij wiskunde, muntje bij Duits", () => {
    expect(guesserProfile(entries)?.type).toBe("pessimist");
    const accuracy = subjectAccuracy(entries);
    expect(accuracy?.best.subjectId).toBe("wisa");
    expect(accuracy?.worst.subjectId).toBe("du");
  });

  it("laat Verdacht, Delulu en de geheime prestatie over om zelf te halen", () => {
    const unlocked = guessAchievements(entries)
      .filter((a) => a.unlockedAt)
      .map((a) => a.id);
    expect(unlocked).toContain("gok.laag");
    expect(unlocked).not.toContain("gok.verdacht");
    expect(unlocked).not.toContain("gok.hoog");
    expect(unlocked).not.toContain("gok.zeszeven");
  });
});
