"use client";

import { useMemo, useState } from "react";
import { AchievementTile } from "@/components/achievements/AchievementTile";
import { GuessChart } from "@/components/guess/GuessChart";
import { GuessSlider } from "@/components/guess/GuessSlider";
import { GuessStrip } from "@/components/guess/GuessStrip";
import { guessAchievements } from "@/lib/guess/achievements";
import type { GuessEntry } from "@/lib/guess/types";

/** Een verzonnen gokgeschiedenis, alleen voor de stijlgids. */
const SAMPLE: GuessEntry[] = [
  [6.0, 6.8, "Engels"],
  [5.5, 6.1, "Duits"],
  [7.0, 7.4, "Wiskunde A"],
  [6.4, 7.9, "Biologie"],
  [8.0, 6.6, "Duits"],
  [7.2, 7.2, "Wiskunde A"],
  [6.1, 7.0, "Geschiedenis"],
  [5.8, 7.4, "Engels"],
  [6.9, 7.1, "Wiskunde A"],
  [6.0, 6.7, "Aardrijkskunde"],
].map(([guess, actual, subjectName], i) => {
  const day = String(i * 3 + 1).padStart(2, "0");
  return {
    gradeId: `stijl-${i}`,
    subjectId: String(subjectName),
    subjectName: String(subjectName),
    guess: Number(guess),
    actual: Number(actual),
    at: `2026-09-${day}T15:00:00.000Z`,
    date: `2026-09-${day}`,
  };
});

/** Stijlgids: de bouwstenen van "Gok je cijfer" (feature A). */
export function GuessSamples() {
  const [value, setValue] = useState(67);
  const achievements = useMemo(() => guessAchievements(SAMPLE), []);

  return (
    <div className="space-y-8">
      <div className="rounded-3xl bg-[#05060d] px-4 py-6 text-white" data-mode="dark">
        <GuessSlider value={value} onChange={setValue} />
        <p className="mt-1 text-center text-xs text-white/45">
          Zet hem op 6,7 voor de enige 6-7-grap van de app.
        </p>
      </div>

      <div className="space-y-2 rounded-3xl bg-[#05060d] p-4" data-mode="dark">
        <GuessStrip guess={7.2} actual={7.2} xp={50} />
        <GuessStrip guess={7.2} actual={7.8} xp={10} />
        <GuessStrip guess={8.5} actual={6.8} xp={5} />
      </div>

      <div>
        <p className="mb-3 text-sm text-ink-2">Gok tegenover echt (verzonnen voorbeeld):</p>
        <GuessChart entries={SAMPLE} />
      </div>

      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {achievements.slice(0, 3).map((achievement) => (
          <li key={achievement.id}>
            <AchievementTile achievement={achievement} />
          </li>
        ))}
        {achievements.slice(-1).map((achievement) => (
          <li key={achievement.id}>
            <AchievementTile achievement={achievement} />
          </li>
        ))}
      </ul>
    </div>
  );
}
