import { isSixSeven, toTenths } from "./scale";
import type { GuessEntry } from "./types";

/**
 * Prestaties voor het gokken (feature A). Alles volgt uit je gokgeschiedenis,
 * dus er hoeft niets extra bewaard te worden. Het moment van behalen is het
 * moment van de gok waarmee je hem haalde.
 */
export interface AchievementState {
  id: string;
  title: string;
  description: string;
  secret: boolean;
  /** Moment van behalen (ISO), of null als hij nog op slot zit. */
  unlockedAt: string | null;
  progress: { current: number; target: number };
}

interface Definition {
  id: string;
  title: string;
  description: string;
  secret?: boolean;
  target: number;
}

const DEFINITIONS: readonly Definition[] = [
  { id: "gok.verdacht", title: "Verdacht", description: "Precies goed gegokt.", target: 1 },
  { id: "gok.orakel", title: "Orakel", description: "5 keer binnen 0,3 gegokt.", target: 5 },
  {
    id: "gok.laag",
    title: "Lage verwachtingen, hoge cijfers",
    description: "10 keer te laag gegokt.",
    target: 10,
  },
  {
    id: "gok.hoog",
    title: "Delulu is níet de solulu",
    description: "10 keer te hoog gegokt.",
    target: 10,
  },
  {
    id: "gok.script",
    title: "Script gelezen",
    description: "3 keer op rij binnen 0,5.",
    target: 3,
  },
  {
    id: "gok.zeszeven",
    title: "Dit had niet mogen gebeuren",
    description: "6,7 gegokt en 6,7 gehaald.",
    secret: true,
    target: 1,
  },
];

export function guessAchievements(entries: readonly GuessEntry[]): AchievementState[] {
  const sorted = [...entries].sort((a, b) => a.at.localeCompare(b.at));
  const count: Record<string, number> = Object.fromEntries(DEFINITIONS.map((d) => [d.id, 0]));
  const unlockedAt: Record<string, string | null> = Object.fromEntries(
    DEFINITIONS.map((d) => [d.id, null]),
  );
  let streak = 0;

  const bump = (id: string, value: number, at: string) => {
    const definition = DEFINITIONS.find((d) => d.id === id)!;
    count[id] = Math.max(count[id] ?? 0, value);
    if (unlockedAt[id] === null && value >= definition.target) unlockedAt[id] = at;
  };

  for (const entry of sorted) {
    const guess = toTenths(entry.guess);
    const actual = toTenths(entry.actual);
    const diff = actual - guess;
    streak = Math.abs(diff) <= 5 ? streak + 1 : 0;

    if (diff === 0) bump("gok.verdacht", (count["gok.verdacht"] ?? 0) + 1, entry.at);
    if (Math.abs(diff) <= 3) bump("gok.orakel", (count["gok.orakel"] ?? 0) + 1, entry.at);
    if (diff > 0) bump("gok.laag", (count["gok.laag"] ?? 0) + 1, entry.at);
    if (diff < 0) bump("gok.hoog", (count["gok.hoog"] ?? 0) + 1, entry.at);
    bump("gok.script", streak, entry.at);
    if (isSixSeven(guess) && isSixSeven(actual)) bump("gok.zeszeven", 1, entry.at);
  }

  return DEFINITIONS.map((definition) => ({
    id: definition.id,
    title: definition.title,
    description: definition.description,
    secret: definition.secret ?? false,
    unlockedAt: unlockedAt[definition.id] ?? null,
    progress: {
      current: Math.min(count[definition.id] ?? 0, definition.target),
      target: definition.target,
    },
  }));
}
