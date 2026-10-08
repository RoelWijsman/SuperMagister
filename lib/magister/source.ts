import type { SchoolDataSource } from "@/lib/data/source";
import { toISODate } from "@/lib/date";
import { welcomePackIds } from "@/lib/reveal";
import type { DateRange, PastYear } from "@/lib/types";
import type { MagisterClient } from "./client";
import { parseAbsences } from "./parse/absences";
import { parseAccount } from "./parse/account";
import { currentEnrollment, parseEnrollments, type Enrollment } from "./parse/enrollments";
import { changedAppointmentIds, parseLessons } from "./parse/lessons";
import { parsePeriods } from "./parse/periods";
import { compareAverages, parseProgressGrades, type AverageCheck } from "./parse/progress";
import { gradedSubjectCodes, parseSubjects, studySubjectMap } from "./parse/subjects";
import { MagisterError } from "./transport";

/** Zo lang delen gelijktijdige aanvragen hetzelfde antwoord; daarna weer vers. */
const SHARE_MS = 30_000;

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

/** Bij een schooljaar dat Magister niet (meer) geeft, slaan we dat jaar over. */
const isMissing = (error: unknown) =>
  error instanceof MagisterError &&
  (error.code === "niet-gevonden" || error.code === "geen-toegang");

/**
 * De databron voor echte Magister-data. Praat alleen via de client (dus via
 * de transport: proxy nu, extensie later) en levert precies dezelfde types als
 * de demo. Zuinig: wat meerdere onderdelen nodig hebben (schooljaren, vakken,
 * cijfers) wordt kort gedeeld in plaats van dubbel opgevraagd.
 *
 * Een ouder schooljaar bekijken (Instellingen) geeft een eigen bron-id, zodat
 * de opslag van dat jaar los staat van nu. Zo'n jaar heeft geen pack.
 */
export function createMagisterSource({
  client,
  schoolHost,
  personId,
  enrollmentId,
  today = () => new Date(),
  via = {},
}: {
  client: MagisterClient;
  schoolHost: string;
  personId: number;
  /** Een ander schooljaar dan het huidige. */
  enrollmentId?: number;
  today?: () => Date;
  /**
   * Haal deze onderdelen via de cache (als die er is), zodat bijvoorbeeld het
   * rooster niet bij elke verversing ook de vakken en cijfers opnieuw ophaalt.
   */
  via?: Partial<Pick<SchoolDataSource, "getSubjects" | "getGrades" | "getHistory">>;
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

  const rawSubjectsOf = (id: number) => share(`vakken:${id}`, () => client.subjects(personId, id));
  const progressOf = (id: number) =>
    share(`cijfers:${id}`, async () =>
      parseProgressGrades(await client.progressGrades(id), {
        subjects: studySubjectMap(await rawSubjectsOf(id)),
      }),
    );
  const progress = async () => progressOf(await year());

  const subjects = async () => {
    const id = await year();
    return share(`vakkenlijst:${id}`, async () => {
      const [raw, overview, { grades }] = await Promise.all([
        rawSubjectsOf(id),
        // Het oude overzicht noemt alle vakken met cijferkolommen, ook vroeg in het jaar.
        client.gradeOverview(personId, id).catch(() => null),
        progressOf(id),
      ]);
      const graded = gradedSubjectCodes(overview);
      for (const grade of grades) graded.add(grade.subjectId);
      return parseSubjects(raw, graded);
    });
  };

  const history = () =>
    share("geschiedenis", async (): Promise<PastYear[]> => {
      const [list, chosen] = await Promise.all([enrollments(), enrollment()]);
      if (!chosen) return [];
      const earlier = list
        .filter((e) => e.start < chosen.start)
        .sort((a, b) => b.start.localeCompare(a.start));
      const years = await Promise.all(
        earlier.map(async (e): Promise<PastYear | null> => {
          try {
            const [{ grades }, raw] = await Promise.all([progressOf(e.id), rawSubjectsOf(e.id)]);
            const graded = new Set(grades.map((g) => g.subjectId));
            return {
              id: String(e.id),
              label: e.label,
              grades,
              subjects: parseSubjects(raw, graded),
            };
          } catch (error) {
            if (isMissing(error)) return null;
            throw error;
          }
        }),
      );
      return years.filter((y): y is PastYear => y !== null);
    });

  return {
    id: `magister:${schoolHost}:${personId}${enrollmentId === undefined ? "" : `:${enrollmentId}`}`,
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
    getHistory: history,
    async getAverageChecks() {
      const { grades, magisterAverages } = await progress();
      return compareAverages(grades, magisterAverages);
    },
    async getLessons(range: DateRange) {
      const [raw, changes, list] = await Promise.all([
        client.appointments(personId, range),
        client.scheduleChanges(personId, range).catch(() => null),
        (via.getSubjects ?? subjects)(),
      ]);
      return parseLessons(raw, { subjects: list, changed: changedAppointmentIds(changes) });
    },
    async getAbsences(range: DateRange) {
      const [raw, list] = await Promise.all([
        client.absences(personId, range),
        (via.getSubjects ?? subjects)(),
      ]);
      return parseAbsences(raw, { subjects: list });
    },
    async getInitialPackIds() {
      // Een ouder schooljaar bekijk je alleen terug: daar zit geen pack in.
      if (enrollmentId !== undefined) return [];
      // Alles wat er al staat, is al onthuld; alleen de laatste vijf cijfers gaan in het
      // welkomstpack. Heeft dit jaar er nog geen vijf, dan vullen we aan met vorig jaar.
      const [grades, past] = await Promise.all([
        via.getGrades ? via.getGrades() : progress().then((p) => p.grades),
        (via.getHistory ?? history)().catch(() => []),
      ]);
      return welcomePackIds([...grades, ...past.flatMap((y) => y.grades)]);
    },
    async getInitialGuesses() {
      return {};
    },
  };
}
