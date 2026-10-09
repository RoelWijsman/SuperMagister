import type { GuessRecord } from "@/lib/guess/outcome";
import type { Enrollment } from "@/lib/magister/parse/enrollments";
import type { AverageCheck } from "@/lib/magister/parse/progress";
import type {
  Absence,
  Account,
  DateRange,
  Grade,
  Lesson,
  PastYear,
  Period,
  Subject,
} from "@/lib/types";

/**
 * Alles wat de app aan schooldata nodig heeft. De Magister-bron praat via
 * de client met Magister; zonder koppeling is er de demo (als je die kiest) of een lege bron.
 * Componenten praten nooit direct met een bron, alleen via lib/data/hooks.
 */
export interface SchoolDataSource {
  /** Uniek per bron, account en schooljaar, bijv. "magister:school:12345" (of "leeg"). */
  id: string;
  kind: "leeg" | "demo" | "magister";
  /** Voor de chip in de shell: de schoolnaam. */
  label: string;
  getAccount(): Promise<Account>;
  getSubjects(): Promise<Subject[]>;
  getPeriods(): Promise<Period[]>;
  /** De cijfers van het (gekozen) schooljaar. */
  getGrades(): Promise<Grade[]>;
  /** Eerdere schooljaren, nieuwste eerst. Alleen voor de collectie. */
  getHistory(): Promise<PastYear[]>;
  getLessons(range: DateRange): Promise<Lesson[]>;
  getAbsences(range: DateRange): Promise<Absence[]>;
  /** Cijfers die bij de eerste keer openen nog in een pack zitten. */
  getInitialPackIds(): Promise<string[]>;
  /** Gokken van vóór de eerste keer openen (alleen de demo heeft er een paar). */
  getInitialGuesses(): Promise<Record<string, GuessRecord>>;
  /** Onze gemiddelden naast die van Magister (alleen bij een echte koppeling). */
  getAverageChecks?(): Promise<AverageCheck[]>;
  /** Alle schooljaren, om te wisselen in Instellingen (alleen bij een echte koppeling). */
  getEnrollments?(): Promise<Enrollment[]>;
  /** Het schooljaar waar deze bron over gaat (alleen bij een echte koppeling). */
  getCurrentEnrollment?(): Promise<Enrollment | null>;
  /** Wanneer de data voor het laatst bij Magister is opgehaald (ms), of null. */
  lastUpdated?(): Promise<number | null>;
}
