import { formatGrade } from "@/lib/calc/average";
import { addDays, atTime, toISODate } from "@/lib/date";
import { hashString } from "@/lib/subjects/palette";
import type { Grade, Period, TextGradeValue } from "@/lib/types";
import { addSchoolDays } from "./calendar";

/**
 * Met de hand geschreven cijferlijst, zodat de demo echte verhalen vertelt:
 * Engels gaat steeds omhoog, Duits is een worsteling met een comeback,
 * scheikunde krabbelt op na een 4,9 en wiskunde levert een ICON op.
 *
 * `ago` is het aantal schooldagen vóór vandaag waarop de toets was. Inhoud en
 * id's staan vast; alleen de datums schuiven mee met vandaag.
 */
interface GradeSpec {
  subject: string;
  description: string;
  weight: 0 | 1 | 2 | 3;
  value: number | TextGradeValue;
  period: 1 | 2 | 3;
  ago: number;
  pta?: boolean;
  /** Telt niet mee (oefentoets). */
  practice?: boolean;
  /** Hoort bij het eerste, nog ongeopende pack: [dagen geleden ingevoerd, tijd]. */
  pack?: readonly [number, string];
}

const GRADE_SPECS: readonly GradeSpec[] = [
  // Nederlands: stabiel, één uitschieter naar beneden.
  {
    subject: "ne",
    description: "Leesvaardigheid 1",
    weight: 2,
    value: 6.4,
    period: 1,
    ago: 128,
    pta: true,
  },
  { subject: "ne", description: "SO Argumentatieleer", weight: 1, value: 7.2, period: 1, ago: 96 },
  {
    subject: "ne",
    description: "Betoog schrijven",
    weight: 3,
    value: 5.3,
    period: 2,
    ago: 66,
    pta: true,
  },
  {
    subject: "ne",
    description: "Literatuurdossier (mondeling)",
    weight: 2,
    value: 7.8,
    period: 2,
    ago: 38,
    pta: true,
  },
  {
    subject: "ne",
    description: "Leesvaardigheid 2",
    weight: 2,
    value: 6.9,
    period: 3,
    ago: 18,
    pta: true,
  },
  { subject: "ne", description: "SO Spelling", weight: 1, value: 7.5, period: 3, ago: 9 },

  // Engels: gaat elke toets omhoog.
  { subject: "en", description: "Reading test Unit 1", weight: 2, value: 5.9, period: 1, ago: 131 },
  { subject: "en", description: "SO Vocabulary 1–2", weight: 1, value: 6.3, period: 1, ago: 102 },
  {
    subject: "en",
    description: "Writing: formal letter",
    weight: 2,
    value: 6.8,
    period: 2,
    ago: 70,
    pta: true,
  },
  {
    subject: "en",
    description: "Kijk- en luistertoets",
    weight: 2,
    value: 7.4,
    period: 2,
    ago: 44,
    pta: true,
  },
  { subject: "en", description: "SO Idioms", weight: 1, value: 7.9, period: 3, ago: 15 },
  {
    subject: "en",
    description: "Literature: The Great Gatsby",
    weight: 3,
    value: 8.1,
    period: 3,
    ago: 4,
    pta: true,
    pack: [1, "16:30"],
  },

  // Duits: lastig, met een comeback.
  {
    subject: "du",
    description: "Oefentoets Grammatik",
    weight: 0,
    value: 4.2,
    period: 1,
    ago: 135,
    practice: true,
  },
  {
    subject: "du",
    description: "SO Wortschatz Kapitel 1",
    weight: 1,
    value: 4.6,
    period: 1,
    ago: 120,
  },
  {
    subject: "du",
    description: "Grammatik-Test 1",
    weight: 2,
    value: 5.1,
    period: 1,
    ago: 88,
    pta: true,
  },
  {
    subject: "du",
    description: "Leseverstehen",
    weight: 2,
    value: 6.0,
    period: 2,
    ago: 61,
    pta: true,
  },
  {
    subject: "du",
    description: "SO Wortschatz Kapitel 3",
    weight: 1,
    value: 5.4,
    period: 2,
    ago: 33,
  },
  {
    subject: "du",
    description: "Hörverstehen",
    weight: 2,
    value: 5.2,
    period: 3,
    ago: 5,
    pta: true,
    pack: [3, "17:45"],
  },

  // Wiskunde A: sterk, met een ICON.
  {
    subject: "wisa",
    description: "PW H1 Statistiek",
    weight: 3,
    value: 7.6,
    period: 1,
    ago: 124,
    pta: true,
  },
  { subject: "wisa", description: "SO Procenten", weight: 1, value: 8.9, period: 1, ago: 91 },
  {
    subject: "wisa",
    description: "PW H3 Formules en grafieken",
    weight: 3,
    value: 8.2,
    period: 2,
    ago: 63,
    pta: true,
  },
  {
    subject: "wisa",
    description: "Praktische opdracht Onderzoek",
    weight: 2,
    value: 9.1,
    period: 2,
    ago: 40,
    pta: true,
  },
  {
    subject: "wisa",
    description: "PW H5 Exponentiële verbanden",
    weight: 3,
    value: 8.4,
    period: 3,
    ago: 12,
    pta: true,
  },
  {
    subject: "wisa",
    description: "SO Kansrekening",
    weight: 1,
    value: 9.7,
    period: 3,
    ago: 3,
    pack: [1, "19:12"],
  },

  // Biologie: goed.
  { subject: "biol", description: "Toets H1 Cellen", weight: 2, value: 7.1, period: 1, ago: 133 },
  {
    subject: "biol",
    description: "Practicumverslag microscopie",
    weight: 1,
    value: 8.4,
    period: 1,
    ago: 99,
  },
  {
    subject: "biol",
    description: "PW H3 Erfelijkheid",
    weight: 3,
    value: 6.6,
    period: 2,
    ago: 68,
    pta: true,
  },
  { subject: "biol", description: "SO Genetica", weight: 1, value: 7.9, period: 2, ago: 36 },
  {
    subject: "biol",
    description: "Toets H4 Evolutie",
    weight: 2,
    value: 8.6,
    period: 3,
    ago: 20,
    pta: true,
  },
  { subject: "biol", description: "Practicum enzymen", weight: 1, value: 7.2, period: 3, ago: 8 },

  // Scheikunde: krabbelt op na een onvoldoende.
  {
    subject: "schk",
    description: "SO Molecuulformules",
    weight: 1,
    value: 5.0,
    period: 1,
    ago: 126,
  },
  { subject: "schk", description: "Toets H2 Reacties", weight: 2, value: 6.1, period: 1, ago: 94 },
  {
    subject: "schk",
    description: "Practicum titratie",
    weight: 1,
    value: 7.5,
    period: 2,
    ago: 59,
    pta: true,
  },
  {
    subject: "schk",
    description: "PW H4 Zuren en basen",
    weight: 3,
    value: 4.9,
    period: 2,
    ago: 30,
    pta: true,
  },
  {
    subject: "schk",
    description: "SO Reactiesnelheid",
    weight: 1,
    value: 6.8,
    period: 3,
    ago: 6,
    pack: [2, "20:05"],
  },

  // Natuurkunde
  { subject: "nat", description: "Toets H1 Beweging", weight: 2, value: 6.7, period: 1, ago: 137 },
  {
    subject: "nat",
    description: "Practicum vrije val",
    weight: 1,
    value: 8.0,
    period: 1,
    ago: 105,
  },
  {
    subject: "nat",
    description: "PW H3 Elektriciteit",
    weight: 3,
    value: 7.2,
    period: 2,
    ago: 72,
    pta: true,
  },
  { subject: "nat", description: "SO Energie", weight: 1, value: 6.9, period: 2, ago: 47 },
  {
    subject: "nat",
    description: "Toets H4 Krachten",
    weight: 2,
    value: 7.7,
    period: 3,
    ago: 22,
    pta: true,
  },

  // Aardrijkskunde
  {
    subject: "ak",
    description: "Toets Wereld: globalisering",
    weight: 2,
    value: 7.0,
    period: 1,
    ago: 118,
  },
  {
    subject: "ak",
    description: "PO Stadsonderzoek",
    weight: 2,
    value: 8.3,
    period: 2,
    ago: 64,
    pta: true,
  },
  { subject: "ak", description: "SO Klimaat", weight: 1, value: 6.2, period: 2, ago: 42 },
  {
    subject: "ak",
    description: "Toets Gebieden: Zuid-Amerika",
    weight: 2,
    value: 7.4,
    period: 3,
    ago: 16,
    pta: true,
  },

  // Geschiedenis
  { subject: "gs", description: "Toets Tijdvak 5–6", weight: 2, value: 6.5, period: 1, ago: 116 },
  { subject: "gs", description: "Bronnenopdracht", weight: 1, value: 7.7, period: 1, ago: 84 },
  {
    subject: "gs",
    description: "PW Koude Oorlog",
    weight: 3,
    value: 8.0,
    period: 2,
    ago: 57,
    pta: true,
  },
  {
    subject: "gs",
    description: "Historisch onderzoek",
    weight: 2,
    value: 8.8,
    period: 3,
    ago: 13,
    pta: true,
  },

  // Economie: rustig omhoog.
  {
    subject: "econ",
    description: "Toets Markt en overheid",
    weight: 2,
    value: 5.6,
    period: 1,
    ago: 122,
  },
  { subject: "econ", description: "SO Begrippen H1", weight: 1, value: 6.0, period: 1, ago: 90 },
  {
    subject: "econ",
    description: "PW Geld en banken",
    weight: 3,
    value: 6.4,
    period: 2,
    ago: 55,
    pta: true,
  },
  {
    subject: "econ",
    description: "Case: rente en inflatie",
    weight: 1,
    value: 7.0,
    period: 2,
    ago: 28,
  },
  {
    subject: "econ",
    description: "Toets Risico en verzekeren",
    weight: 2,
    value: 7.3,
    period: 3,
    ago: 10,
    pta: true,
  },

  // Tekenen
  { subject: "tek", description: "Opdracht stilleven", weight: 2, value: 7.5, period: 1, ago: 110 },
  {
    subject: "tek",
    description: "Kunstbeschouwing toets",
    weight: 1,
    value: 6.8,
    period: 2,
    ago: 52,
  },
  {
    subject: "tek",
    description: "Eindwerk: zelfportret",
    weight: 3,
    value: 8.5,
    period: 2,
    ago: 26,
    pta: true,
  },
  { subject: "tek", description: "Schetsboek", weight: 1, value: 9.5, period: 3, ago: 11 },

  // LO: beoordelingen in plaats van cijfers.
  { subject: "lo", description: "Atletiek", weight: 1, value: "V", period: 1, ago: 114 },
  { subject: "lo", description: "Basketbal", weight: 1, value: "G", period: 1, ago: 80 },
  { subject: "lo", description: "Turnen", weight: 1, value: "V", period: 2, ago: 50 },
  { subject: "lo", description: "Conditietest", weight: 1, value: "G", period: 3, ago: 14 },
];

/** Grenzen van de periodes in schooldagen geleden: [begin, eind]. */
const PERIOD_AGO: Readonly<Record<1 | 2 | 3, readonly [number, number]>> = {
  1: [139, 75],
  2: [74, 25],
  3: [24, -35],
};

const TEXT_SUFFICIENT: Readonly<Partial<Record<TextGradeValue, boolean>>> = {
  V: true,
  G: true,
  ZG: true,
  O: false,
};

export function buildDemoPeriods(today: Date): Period[] {
  return ([1, 2, 3] as const).map((n) => {
    const [startAgo, endAgo] = PERIOD_AGO[n];
    const start = addSchoolDays(today, -startAgo);
    // Een periode eindigt op de laatste schooldag vóór de volgende begint.
    const end =
      n === 3
        ? addSchoolDays(today, -endAgo)
        : addSchoolDays(addSchoolDays(today, -PERIOD_AGO[(n + 1) as 2 | 3][0]), -1);
    return { id: `p${n}`, name: `Periode ${n}`, start: toISODate(start), end: toISODate(end) };
  });
}

export function buildDemoGrades(now: Date): { grades: Grade[]; packGradeIds: string[] } {
  const grades: Grade[] = [];
  const packGradeIds: string[] = [];

  GRADE_SPECS.forEach((spec, index) => {
    const id = `demo-cijfer-${String(index + 1).padStart(2, "0")}-${spec.subject}`;
    const testDay = addSchoolDays(now, -spec.ago);
    const date = toISODate(testDay);

    let enteredAt: Date;
    if (spec.pack) {
      const [daysAgo, time] = spec.pack;
      enteredAt = atTime(addDays(now, -daysAgo), time);
      packGradeIds.push(id);
    } else {
      // Docenten voeren een cijfer 1–4 dagen na de toets in, ergens na schooltijd.
      const hash = hashString(id);
      const hours = 15 + (hash % 6);
      const minutes = (hash >> 4) % 60;
      enteredAt = atTime(addDays(testDay, 1 + (hash % 4)), `${hours}:${minutes}`);
    }

    const base = {
      id,
      subjectId: spec.subject,
      description: spec.description,
      weight: spec.weight,
      date,
      enteredAt: enteredAt.toISOString(),
      periodId: `p${spec.period}`,
      countsTowardAverage: !spec.practice && spec.weight > 0,
      isPTA: spec.pta ?? false,
    };

    if (typeof spec.value === "number") {
      grades.push({
        ...base,
        kind: "numeric",
        value: spec.value,
        display: formatGrade(spec.value),
        isSufficient: spec.value >= 5.5,
      });
    } else {
      grades.push({
        ...base,
        kind: "text",
        value: spec.value,
        display: spec.value,
        isSufficient: TEXT_SUFFICIENT[spec.value] ?? null,
      });
    }
  });

  return { grades, packGradeIds };
}
