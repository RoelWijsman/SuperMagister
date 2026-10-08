import type { DateRange } from "@/lib/types";
import { ENDPOINTS, type Endpoint } from "./endpoints";
import type { MagisterTransport } from "./transport";

/**
 * De Magister-client. Geeft de ruwe antwoorden terug; de parsers (fase 5)
 * zetten ze om naar de eigen types. Weet niets van proxy of testbestanden: dat
 * regelt de transport, gekozen in lib/magister/config.ts.
 */
export function createMagisterClient(transport: MagisterTransport) {
  const call = <T = unknown>({ path, query }: Endpoint) => transport.get<T>(path, query);
  return {
    transport: transport.kind,
    account: () => call(ENDPOINTS.account()),
    latestGrades: (personId: number, top?: number, skip?: number) =>
      call(ENDPOINTS.latestGrades(personId, top, skip)),
    appointments: (personId: number, range: DateRange) =>
      call(ENDPOINTS.appointments(personId, range)),
    scheduleChanges: (personId: number, range: DateRange) =>
      call(ENDPOINTS.scheduleChanges(personId, range)),
    enrollments: (personId: number) => call(ENDPOINTS.enrollments(personId)),
    gradeOverview: (personId: number, enrollmentId: number) =>
      call(ENDPOINTS.gradeOverview(personId, enrollmentId)),
    gradePeriods: (personId: number, enrollmentId: number) =>
      call(ENDPOINTS.gradePeriods(personId, enrollmentId)),
    progressGrades: (enrollmentId: number) => call(ENDPOINTS.progressGrades(enrollmentId)),
    subjects: (personId: number, enrollmentId: number) =>
      call(ENDPOINTS.subjects(personId, enrollmentId)),
    absences: (personId: number, range: DateRange) => call(ENDPOINTS.absences(personId, range)),
  };
}

export type MagisterClient = ReturnType<typeof createMagisterClient>;
