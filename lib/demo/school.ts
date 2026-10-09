import { matchSubjectInfo } from "@/lib/subjects/catalog";
import type { Account, Subject, Teacher } from "@/lib/types";

/**
 * De demo-school: Daan Visser uit 5 havo (examenklas) op het fictieve
 * Noorderlicht College. Alles is verzonnen.
 */
export const DEMO_ACCOUNT: Account = {
  id: 424242,
  firstName: "Daan",
  lastName: "Visser",
  fullName: "Daan Visser",
  birthDate: "2009-03-14",
  schoolName: "Noorderlicht College",
  schoolHost: "demo.supermagister.local",
  className: "5H2",
  studyLabel: "5 havo",
  isExamYear: true,
};

interface DemoSubjectSpec {
  code: string;
  name: string;
  teacher: Teacher;
  room: string;
  hasGrades?: boolean;
}

const SUBJECT_SPECS: readonly DemoSubjectSpec[] = [
  { code: "ne", name: "Nederlands", teacher: { code: "BKR", name: "mw. Bakker" }, room: "A12" },
  { code: "en", name: "Engels", teacher: { code: "JNS", name: "dhr. Jansen" }, room: "A14" },
  { code: "du", name: "Duits", teacher: { code: "MLR", name: "mw. Müller" }, room: "A09" },
  {
    code: "wisA",
    name: "Wiskunde A",
    teacher: { code: "VDB", name: "dhr. Van den Berg" },
    room: "B21",
  },
  { code: "biol", name: "Biologie", teacher: { code: "DKS", name: "mw. Dekker" }, room: "C03" },
  { code: "schk", name: "Scheikunde", teacher: { code: "SMT", name: "dhr. Smit" }, room: "C05" },
  { code: "nat", name: "Natuurkunde", teacher: { code: "HLM", name: "mw. Holm" }, room: "C07" },
  { code: "ak", name: "Aardrijkskunde", teacher: { code: "VOS", name: "dhr. Vos" }, room: "B12" },
  { code: "gs", name: "Geschiedenis", teacher: { code: "PTR", name: "mw. Peters" }, room: "B14" },
  { code: "econ", name: "Economie", teacher: { code: "KLN", name: "dhr. Klein" }, room: "B04" },
  { code: "tek", name: "Tekenen", teacher: { code: "DGR", name: "mw. De Groot" }, room: "D02" },
  {
    code: "lo",
    name: "Lichamelijke opvoeding",
    teacher: { code: "BRW", name: "dhr. Brouwer" },
    room: "Gym 1",
  },
  {
    code: "mentor",
    name: "Mentoruur",
    teacher: { code: "VDB", name: "dhr. Van den Berg" },
    room: "B21",
    hasGrades: false,
  },
];

export const subjectId = (code: string) => code.toLowerCase();

export function buildDemoSubjects(): Subject[] {
  return SUBJECT_SPECS.map((spec) => {
    const info = matchSubjectInfo(spec.code, spec.name);
    return {
      id: subjectId(spec.code),
      code: spec.code,
      name: spec.name,
      group: info.group,
      isCore: info.isCore,
      hasGrades: spec.hasGrades ?? true,
    };
  });
}

export const SUBJECT_SPEC_BY_ID: ReadonlyMap<string, DemoSubjectSpec> = new Map(
  SUBJECT_SPECS.map((spec) => [subjectId(spec.code), spec]),
);

/** Lestijden per lesuur. */
export const BELL_SCHEDULE: Readonly<Record<number, readonly [string, string]>> = {
  1: ["08:30", "09:20"],
  2: ["09:20", "10:10"],
  3: ["10:30", "11:20"],
  4: ["11:20", "12:10"],
  5: ["12:40", "13:30"],
  6: ["13:30", "14:20"],
  7: ["14:30", "15:20"],
  8: ["15:20", "16:10"],
};

/** Vast weekrooster (1 = maandag). LO is een blokuur van het 5e t/m 6e uur. */
export const WEEK_TIMETABLE: Readonly<
  Record<number, readonly (readonly [number, number, string])[]>
> = {
  1: [
    [1, 1, "ne"],
    [2, 2, "wisa"],
    [3, 3, "biol"],
    [4, 4, "en"],
    [5, 5, "gs"],
    [6, 6, "schk"],
    [7, 7, "econ"],
  ],
  2: [
    [2, 2, "du"],
    [3, 3, "nat"],
    [4, 4, "wisa"],
    [5, 6, "lo"],
    [7, 7, "ak"],
  ],
  3: [
    [1, 1, "en"],
    [2, 2, "schk"],
    [3, 3, "ne"],
    [4, 4, "tek"],
    [5, 5, "tek"],
    [6, 6, "mentor"],
  ],
  4: [
    [1, 1, "biol"],
    [2, 2, "econ"],
    [3, 3, "wisa"],
    [5, 5, "nat"],
    [6, 6, "gs"],
    [7, 7, "du"],
    [8, 8, "ak"],
  ],
  5: [
    [1, 1, "schk"],
    [2, 2, "nat"],
    [3, 3, "en"],
    [4, 4, "ne"],
    [5, 5, "wisa"],
    [6, 6, "biol"],
  ],
};

/** Lokalen waar een les naartoe kan verhuizen bij een lokaalwijziging. */
export const SPARE_ROOMS = [
  "A04",
  "A21",
  "B02",
  "B17",
  "C11",
  "D07",
  "Aula",
  "Mediatheek",
] as const;
