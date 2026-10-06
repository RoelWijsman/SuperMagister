import type { CopyKey } from "@/content/copy";
import type { CopyVars } from "@/lib/copy";
import { formatTime } from "@/lib/date";

export interface GreetingInput {
  now: Date;
  firstName: string;
  /** Lessen vandaag, zonder uitval. */
  lessonsToday: number;
  /** Lessen die vandaag nog moeten beginnen of nog bezig zijn. */
  lessonsLeft: number;
  testsToday: number;
  firstLessonStart: Date | null;
  /** Begin van de eerstvolgende schooldag na vandaag. */
  nextSchoolDayStart: Date | null;
  isBirthday: boolean;
}

export interface CopyLine {
  key: CopyKey;
  vars: CopyVars;
}

export interface GreetingSituation {
  title: CopyLine;
  subtitle: CopyLine;
}

const lessons = (n: number) => (n === 1 ? "les" : "lessen");
const tests = (n: number) => (n === 1 ? "een toets" : `${n} toetsen`);

/**
 * Welke begroeting past bij dit moment? Geeft de tekstsleutels en variabelen;
 * de teksten zelf (met varianten) staan in content/copy.ts.
 */
export function greetingSituation(input: GreetingInput): GreetingSituation {
  const { now, firstName: naam, lessonsToday, lessonsLeft, testsToday } = input;
  const minutes = now.getHours() * 60 + now.getMinutes();
  const nightOwl = minutes >= 23 * 60 || minutes < 5 * 60;
  const weekday = now.getDay();

  let title: CopyLine;
  if (input.isBirthday) title = { key: "begroeting.verjaardag", vars: { naam } };
  else if (nightOwl) title = { key: "begroeting.nacht", vars: { naam, tijd: formatTime(now) } };
  else if (minutes < 12 * 60) title = { key: "begroeting.ochtend", vars: { naam } };
  else if (minutes < 18 * 60) title = { key: "begroeting.middag", vars: { naam } };
  else title = { key: "begroeting.avond", vars: { naam } };

  return { title, subtitle: subtitleFor() };

  function subtitleFor(): CopyLine {
    if (nightOwl) {
      return input.nextSchoolDayStart
        ? { key: "dag.nacht", vars: { tijd: formatTime(input.nextSchoolDayStart) } }
        : { key: "dag.nachtVrij", vars: {} };
    }
    if (lessonsToday === 0) {
      return { key: weekday === 0 || weekday === 6 ? "dag.weekend" : "dag.vrij", vars: {} };
    }
    if (lessonsLeft === 0) return { key: "dag.klaar", vars: {} };
    if (weekday === 5) {
      return { key: "dag.vrijdag", vars: { aantal: lessonsLeft, lessen: lessons(lessonsLeft) } };
    }
    if (testsToday > 0 && (lessonsToday >= 7 || testsToday >= 2)) {
      return { key: "dag.pittig", vars: { uren: lessonsToday, toetsen: tests(testsToday) } };
    }
    if (testsToday > 0) return { key: "dag.toets", vars: { toetsen: tests(testsToday) } };
    if (lessonsLeft < lessonsToday) {
      return { key: "dag.bezig", vars: { aantal: lessonsLeft, lessen: lessons(lessonsLeft) } };
    }
    return {
      key: "dag.voorSchool",
      vars: {
        uren: lessonsToday,
        tijd: input.firstLessonStart ? formatTime(input.firstLessonStart) : "",
      },
    };
  }
}
