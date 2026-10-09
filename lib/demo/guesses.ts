import { makeGuessRecord, type GuessRecord } from "@/lib/guess/outcome";
import { toTenths } from "@/lib/guess/scale";
import { createRandom } from "@/lib/random";
import { hashString } from "@/lib/subjects/palette";
import type { Grade } from "@/lib/types";

/**
 * Daans gokgeschiedenis (feature A). Hij gokt bijna altijd te laag, behalve
 * bij wiskunde A (daar is hij een orakel) en Duits (daar is het loterij).
 * Precies goed komt niet voor: "Verdacht" mag je zelf verdienen.
 */
export function buildDemoGuesses(
  grades: readonly Grade[],
  packIds: readonly string[],
): Record<string, GuessRecord> {
  const pack = new Set(packIds);
  const guesses: Record<string, GuessRecord> = {};

  for (const grade of grades) {
    if (grade.kind !== "numeric" || pack.has(grade.id)) continue;
    const random = createRandom(hashString(`gok-${grade.id}`));
    // Niet elk cijfer is gegokt: de functie is nieuw.
    if (random.next() < 0.2) continue;

    const r = random.next();
    const side = random.next() < 0.5 ? -1 : 1;
    const offset =
      grade.subjectId === "wisa"
        ? (r - 0.5) * 0.4
        : grade.subjectId === "du"
          ? side * (1.2 + r * 1.4)
          : -0.3 - r * 0.7;
    let guess = Math.min(100, Math.max(10, toTenths(grade.value + offset)));
    if (guess === toTenths(grade.value)) guess -= 2;

    const hoursLater = 2 + random.next() * 20;
    const at = new Date(new Date(grade.enteredAt).getTime() + hoursLater * 3_600_000);
    guesses[grade.id] = makeGuessRecord(guess / 10, grade.value, at);
  }
  return guesses;
}
