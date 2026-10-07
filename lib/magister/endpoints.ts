import type { DateRange } from "@/lib/types";
import type { Query } from "./transport";

/**
 * De (onofficiële) Magister-endpoints. Paden zijn relatief aan /api.
 *
 * Gecontroleerd op 7 oktober 2026 met een echte export (scripts/verzamel-magister.js):
 * account, aanmeldingen, laatste cijfers, cijferoverzicht, cijferperioden, vakken,
 * afspraken, roosterwijzigingen en absenties werkten allemaal met de eerste variant.
 *
 * Cijfers: het oude cijferoverzicht (cijferoverzichtvooraanmelding) bleek leeg. Magister
 * gebruikt nu /aanmeldingen/{id}/cijfers ("voortgangscijfers"), met per cijfer de kolom,
 * de weging, de periode en Magisters eigen gemiddelde per vak (kolomtype "gemiddelde").
 * Kolominfo is daardoor niet meer nodig.
 */
export interface Endpoint {
  path: string;
  query?: Query;
}

const enrollment = (personId: number, enrollmentId: number) =>
  `personen/${personId}/aanmeldingen/${enrollmentId}`;

export const ENDPOINTS = {
  /** Persoon.Id, Roepnaam, Tussenvoegsel, Achternaam, Geboortedatum. */
  account: (): Endpoint => ({ path: "account" }),
  /** De laatste cijfers (camelCase!): vak, waarde, weegfactor, ingevoerdOp, teltMee, moetInhalen. */
  latestGrades: (personId: number, top = 50, skip = 0): Endpoint => ({
    path: `personen/${personId}/cijfers/laatste`,
    query: { top, skip },
  }),
  /** Het rooster: afspraken met huiswerk-HTML (Inhoud), InfoType, Status en Afgerond. */
  appointments: (personId: number, range: DateRange): Endpoint => ({
    path: `personen/${personId}/afspraken`,
    query: { van: range.from, tot: range.to },
  }),
  /** Afspraken die gewijzigd zijn (zonder het oude lokaal). */
  scheduleChanges: (personId: number, range: DateRange): Endpoint => ({
    path: `personen/${personId}/roosterwijzigingen`,
    query: { van: range.from, tot: range.to },
  }),
  /** Schooljaren, ook toekomstige. */
  enrollments: (personId: number): Endpoint => ({
    path: `personen/${personId}/aanmeldingen`,
    query: { geenToekomstige: false },
  }),
  /** Het volledige cijferoverzicht van een schooljaar (geen weging per cijfer!). */
  gradeOverview: (personId: number, enrollmentId: number): Endpoint => ({
    path: `${enrollment(personId, enrollmentId)}/cijfers/cijferoverzichtvooraanmelding`,
    query: { actievePerioden: false, alleenBerekendeKolommen: false, alleenPTAKolommen: false },
  }),
  /** Cijferperioden van een schooljaar. */
  gradePeriods: (personId: number, enrollmentId: number): Endpoint => ({
    path: `${enrollment(personId, enrollmentId)}/cijfers/cijferperiodenvooraanmelding`,
  }),
  /**
   * Alle cijferkolommen van een schooljaar (camelCase): gewone cijfers met weegfactor
   * en periode, Magisters gemiddelde per vak ("gemiddelde") en tekortpunten ("formule", "som").
   */
  progressGrades: (enrollmentId: number): Endpoint => ({
    path: `aanmeldingen/${enrollmentId}/cijfers`,
  }),
  /** De vakken van een schooljaar (camelCase-lijst). */
  subjects: (personId: number, enrollmentId: number): Endpoint => ({
    path: `${enrollment(personId, enrollmentId)}/vakken`,
  }),
  absences: (personId: number, range: DateRange): Endpoint => ({
    path: `personen/${personId}/absenties`,
    query: { van: range.from, tot: range.to },
  }),
} as const;
