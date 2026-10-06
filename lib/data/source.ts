import type { GuessRecord } from "@/lib/guess/outcome";
import type { Absence, Account, DateRange, Grade, Lesson, Period, Subject } from "@/lib/types";

/**
 * Alles wat de app aan schooldata nodig heeft. De demo levert dit uit
 * lib/demo; in fase 5 komt er een Magister-bron bij die via de proxy praat.
 * Componenten praten nooit direct met een bron, alleen via lib/data/hooks.
 */
export interface SchoolDataSource {
  /** Uniek per bron en account, bijv. "demo" of "magister:school:12345". */
  id: string;
  kind: "demo" | "magister";
  /** Voor de chip in de shell: "DEMO" of de schoolnaam. */
  label: string;
  getAccount(): Promise<Account>;
  getSubjects(): Promise<Subject[]>;
  getPeriods(): Promise<Period[]>;
  getGrades(): Promise<Grade[]>;
  getLessons(range: DateRange): Promise<Lesson[]>;
  getAbsences(range: DateRange): Promise<Absence[]>;
  /** Cijfers die bij de eerste keer openen nog in een pack zitten. */
  getInitialPackIds(): Promise<string[]>;
  /** Gokken van vóór de eerste keer openen (alleen de demo heeft er een paar). */
  getInitialGuesses(): Promise<Record<string, GuessRecord>>;
}
