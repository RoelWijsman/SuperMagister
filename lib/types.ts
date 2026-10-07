/**
 * Domeintypes van SuperMagister.
 *
 * De rest van de app kent alleen deze types. Ruwe Magister-responses worden in
 * lib/magister/parsers.ts (fase 5) naar deze vormen omgezet; de demo-data in
 * lib/demo levert ze direct.
 */

/** Kalenderdatum in lokale tijd, formaat `YYYY-MM-DD`. */
export type ISODate = string;
/** Tijdstip als ISO 8601-string (met tijdzone, meestal UTC `...Z`). */
export type ISODateTime = string;

export type SubjectGroup =
  "talen" | "exact" | "mens-maatschappij" | "kunst-cultuur" | "bewegen" | "overig";

export interface Account {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  birthDate?: ISODate;
  schoolName: string;
  /** Bijv. `noorderlicht.magister.net`. */
  schoolHost: string;
  className?: string;
  /** Bijv. "5 havo". */
  studyLabel?: string;
  isExamYear: boolean;
}

export interface Subject {
  /** Stabiele sleutel, afgeleid van de vakcode (lowercase). */
  id: string;
  /** Vakcode zoals Magister hem toont, bijv. "wisA". */
  code: string;
  name: string;
  group: SubjectGroup;
  /** Kernvak (Ne/En/Wi) voor overgangsnormen. */
  isCore: boolean;
  /** Heeft dit vak cijfers? (Mentoruur bijvoorbeeld niet.) */
  hasGrades: boolean;
}

export interface Period {
  id: string;
  name: string;
  start: ISODate;
  end: ISODate;
}

/** Niet-numerieke beoordelingen die Magister kan teruggeven. */
/** RV = ruim voldoende, VR = vrijstelling, INH = moet nog inhalen (Magister toont "Inh"). */
export type TextGradeValue = "V" | "G" | "O" | "RV" | "ZG" | "ZS" | "R" | "M" | "NB" | "VR" | "INH";

interface GradeBase {
  id: string;
  subjectId: string;
  description: string;
  weight: number;
  /** Datum van de toets (afname). */
  date: ISODate;
  /** Moment waarop de docent het cijfer invoerde. */
  enteredAt: ISODateTime;
  periodId: string | null;
  /** Telt mee voor het gemiddelde. */
  countsTowardAverage: boolean;
  /** Onderdeel van het PTA / schoolexamen. */
  isPTA: boolean;
}

export interface NumericGrade extends GradeBase {
  kind: "numeric";
  value: number;
  /** Zoals getoond in Magister, bijv. "7,8". */
  display: string;
  isSufficient: boolean;
}

export interface TextGrade extends GradeBase {
  kind: "text";
  value: TextGradeValue;
  display: string;
  /** `null` als de waarde geen voldoende/onvoldoende betekent. */
  isSufficient: boolean | null;
}

export type Grade = NumericGrade | TextGrade;

/** Afgeleid van Magister `InfoType`. */
export type LessonInfoType =
  | "geen"
  | "huiswerk"
  | "toets"
  | "tentamen"
  | "schriftelijk"
  | "mondeling"
  | "informatie"
  | "aantekening";

/** Afgeleid van Magister `Status`. */
export type LessonStatus = "normaal" | "uitval" | "wijziging";

export interface Teacher {
  code: string;
  name?: string;
}

export interface Lesson {
  id: string;
  start: ISODateTime;
  end: ISODateTime;
  /** Kalenderdatum van de les (lokale tijd). */
  date: ISODate;
  hourFrom: number | null;
  hourTo: number | null;
  subjectId: string | null;
  /** Omschrijving zoals in het rooster, bijv. "wisA - VDB - 5H2". */
  title: string;
  location: string | null;
  /** Bij een lokaalwijziging: het oorspronkelijke lokaal. */
  previousLocation: string | null;
  teachers: Teacher[];
  infoType: LessonInfoType;
  status: LessonStatus;
  /** Ruwe HTML uit Magister (`Inhoud`). Altijd via SafeHtml tonen. */
  contentHtml: string | null;
  /** Afgevinkt in Magister (`Afgerond`). */
  isDone: boolean;
}

export interface Homework {
  id: string;
  lessonId: string;
  subjectId: string | null;
  /** Inleverdatum = de dag van de les. */
  dueDate: ISODate;
  dueAt: ISODateTime;
  html: string;
  /** Platte tekst voor zoeken en previews. */
  text: string;
  isDone: boolean;
  /** Dezelfde les heeft ook een toets. */
  isTest: boolean;
}

export type TestKind = "toets" | "tentamen" | "schriftelijk" | "mondeling";

export interface Test {
  id: string;
  lessonId: string;
  subjectId: string | null;
  kind: TestKind;
  date: ISODate;
  start: ISODateTime;
  html: string;
  text: string;
}

export type AbsenceKind =
  | "afwezig"
  | "te-laat"
  | "ziek"
  | "uitgestuurd"
  | "huiswerk-vergeten"
  | "materiaal-vergeten"
  | "vrijstelling"
  | "overig";

export interface Absence {
  id: string;
  start: ISODateTime;
  end: ISODateTime;
  date: ISODate;
  lessonId: string | null;
  subjectId: string | null;
  hour: number | null;
  kind: AbsenceKind;
  /** Omschrijving van de school, bijv. "Te laat (trein)". */
  reason: string;
  /** Geoorloofd. */
  isAuthorized: boolean;
}

export interface DateRange {
  from: ISODate;
  to: ISODate;
}
