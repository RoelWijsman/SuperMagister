import type { SchoolDataSource } from "@/lib/data/source";
import { toISODate } from "@/lib/date";
import type { DateRange, Grade } from "@/lib/types";
import type { MagisterClient } from "./client";
import { parseAbsences } from "./parse/absences";
import { parseAccount } from "./parse/account";
import { currentEnrollment, parseEnrollments, type Enrollment } from "./parse/enrollments";
import { changedAppointmentIds, parseLessons } from "./parse/lessons";
import { parsePeriods } from "./parse/periods";
import { compareAverages, parseProgressGrades, type AverageCheck } from "./parse/progress";
import { gradedSubjectCodes, parseSubjects, studySubjectMap } from "./parse/subjects";

/** Zo lang delen gelijktijdige aanvragen hetzelfde antwoord; daarna weer vers. */
const SHARE_MS = 30_000;
/** Het welkomstpack bij de eerste koppeling: de laatste vijf cijfers. */
const WELCOME_PACK = 5;

export interface MagisterSource extends SchoolDataSource {
  kind: "magister";
  /** Alle schooljaren (voor het wisselen in Instellingen). */
  getEnrollments(): Promise<Enrollment[]>;
  /** Het schooljaar waar deze bron over gaat. */
  getCurrentEnrollment(): Promise<Enrollment | null>;
  /** Onze gemiddelden naast die van Magister, per vak en periode. */
  getAverageChecks(): Promise<AverageCheck[]>;
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * Fase 5a: de databron voor echte Magister-data. Praat alleen via de client
 * (dus via de transport: proxy nu, extensie later) en levert precies dezelfde
 * types als de demo. Zuinig: wat meerdere onderdelen nodig hebben (schooljaren,
 * vakken, cijfers) wordt kort gedeeld in plaats van dubbel opgevraagd.
 */
export function createMagisterSource({
  client,
  schoolHost,
  personId,
  enrollmentId,
  today = () => new Date(),
}: {
  client: MagisterClient;
  schoolHost: string;
  personId: number;
  /** Een ander schooljaar dan het huidige. */
  enrollmentId?: number;
  today?: () => Date;
}): MagisterSource {
  const shared = new Map<string, { at: number; promise: Promise<unknown> }>();
  function share<T>(key: string, load: () => Promise<T>): Promise<T> {
    const hit = shared.get(key);
    if (hit && Date.now() - hit.at < SHARE_MS) return hit.promise as Promise<T>;
    const promise = load();
    shared.set(key, { at: Date.now(), promise });
    // Een mislukte aanvraag niet bewaren: de volgende keer opnieuw proberen.
    promise.catch(() => shared.delete(key));
    return promise;
  }

  const enrollments = () =>
    share("aanmeldingen", async () => parseEnrollments(await client.enrollments(personId)));
  const enrollment = async () => {
    const list = await enrollments();
    return list.find((e) => e.id === enrollmentId) ?? currentEnrollment(list, toISODate(today()));
  };
  const year = async () => {
    const chosen = await enrollment();
    if (!chosen) throw new Error("Geen schooljaar gevonden in Magister.");
    return chosen.id;
  };
  const rawSubjects = async () => {
    const id = await year();
    return share(`vakken:${id}`, () => client.subjects(personId, id));
  };
  const progress = async () => {
    const id = await year();
    return share(`cijfers:${id}`, async () =>
      parseProgressGrades(await client.progressGrades(id), {
        subjects: studySubjectMap(await rawSubjects()),
      }),
    );
  };
  const subjects = async () => {
    const id = await year();
    return share(`vakkenlijst:${id}`, async () => {
      const [raw, overview, { grades }] = await Promise.all([
        rawSubjects(),
        // Het oude overzicht noemt alle vakken met cijferkolommen, ook vroeg in het jaar.
        client.gradeOverview(personId, id).catch(() => null),
        progress(),
      ]);
      const graded = gradedSubjectCodes(overview);
      for (const grade of grades) graded.add(grade.subjectId);
      return parseSubjects(raw, graded);
    });
  };

  return {
    id: `magister:${schoolHost}:${personId}`,
    kind: "magister",
    label: capitalize(schoolHost.split(".")[0] ?? schoolHost),

    getEnrollments: enrollments,
    getCurrentEnrollment: enrollment,

    async getAccount() {
      const [raw, chosen] = await Promise.all([
        share("account", () => client.account()),
        enrollment(),
      ]);
      return parseAccount(raw, { schoolHost, enrollment: chosen });
    },
    getSubjects: subjects,
    async getPeriods() {
      const id = await year();
      return parsePeriods(await client.gradePeriods(personId, id));
    },
    async getGrades() {
      return (await progress()).grades;
    },
    async getAverageChecks() {
      const { grades, magisterAverages } = await progress();
      return compareAverages(grades, magisterAverages);
    },
    async getLessons(range: DateRange) {
      const [raw, changes, list] = await Promise.all([
        client.appointments(personId, range),
        client.scheduleChanges(personId, range).catch(() => null),
        subjects(),
      ]);
      return parseLessons(raw, { subjects: list, changed: changedAppointmentIds(changes) });
    },
    async getAbsences(range: DateRange) {
      const [raw, list] = await Promise.all([client.absences(personId, range), subjects()]);
      return parseAbsences(raw, { subjects: list });
    },
    async getInitialPackIds() {
      // Alles wat er al staat, is al onthuld; alleen de laatste vijf gaan in het welkomstpack.
      const isReal = (g: Grade) => !(g.kind === "text" && (g.value === "INH" || g.value === "VR"));
      return (await progress()).grades
        .filter(isReal)
        .sort((a, b) => b.enteredAt.localeCompare(a.enteredAt))
        .slice(0, WELCOME_PACK)
        .map((g) => g.id);
    },
    async getInitialGuesses() {
      return {};
    },
  };
}
