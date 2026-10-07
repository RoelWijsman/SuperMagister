import type { DateRange } from "@/lib/types";
import type { Query } from "./transport";

/**
 * De (onofficiële) Magister-endpoints, bekend uit open-source projecten. Ze
 * kunnen veranderen; alles staat daarom hier. Paden zijn relatief aan /api.
 */
export interface Endpoint {
  path: string;
  query?: Query;
}

export const ENDPOINTS = {
  /** Persoon.Id, Roepnaam, Achternaam (en mogelijk de geboortedatum). */
  account: (): Endpoint => ({ path: "account" }),
  /** De laatste cijfers: vak, waarde, weegfactor, omschrijving, ingevoerdOp, isVoldoende, teltMee. */
  latestGrades: (personId: number, top = 50, skip = 0): Endpoint => ({
    path: `personen/${personId}/cijfers/laatste`,
    query: { top, skip },
  }),
  /** Het rooster: afspraken met huiswerk-HTML, InfoType, Status en Afgerond. */
  appointments: (personId: number, range: DateRange): Endpoint => ({
    path: `personen/${personId}/afspraken`,
    query: { van: range.from, tot: range.to },
  }),
  /** Schooljaren. */
  enrollments: (personId: number): Endpoint => ({ path: `personen/${personId}/aanmeldingen` }),
  /** Het volledige cijferoverzicht van een schooljaar. */
  gradeOverview: (personId: number, enrollmentId: number): Endpoint => ({
    path: `personen/${personId}/aanmeldingen/${enrollmentId}/cijfers/cijferoverzichtvooraanmelding`,
    query: { actievePerioden: false, alleenBerekendeKolommen: false, alleenPTAKolommen: false },
  }),
  absences: (personId: number, range: DateRange): Endpoint => ({
    path: `personen/${personId}/absenties`,
    query: { van: range.from, tot: range.to },
  }),
} as const;
