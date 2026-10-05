import type { Absence, Account, Grade, Lesson, Period, Subject } from "@/lib/types";
import { buildDemoAbsences } from "./absences";
import { buildDemoGrades, buildDemoPeriods } from "./grades";
import { buildDemoLessons } from "./lessons";
import { DEMO_ACCOUNT, buildDemoSubjects } from "./school";

export interface DemoDataset {
  account: Account;
  subjects: Subject[];
  periods: Period[];
  grades: Grade[];
  lessons: Lesson[];
  absences: Absence[];
  /** De nieuwste cijfers: bij de eerste keer openen nog niet onthuld. */
  packGradeIds: string[];
}

/**
 * Volledige demo-school rond `now`. Deterministisch: dezelfde dag geeft
 * dezelfde data, en cijfers houden hun id en waarde op elke dag.
 */
export function buildDemoDataset(now: Date): DemoDataset {
  const { grades, packGradeIds } = buildDemoGrades(now);
  return {
    account: DEMO_ACCOUNT,
    subjects: buildDemoSubjects(),
    periods: buildDemoPeriods(now),
    grades,
    lessons: buildDemoLessons(now),
    absences: buildDemoAbsences(now),
    packGradeIds,
  };
}
