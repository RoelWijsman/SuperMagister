import type { Grade } from "@/lib/types";
import { formatGrade, reportGrade, roundHalfUp, weightedAverage } from "./average";
import { combinationGrade, seAverage } from "./exam";

/**
 * Fase 4: de overgangsmeter. Configureerbare overgangsnormen (tekortpunten,
 * onvoldoendes, kernvakken, gemiddelde) met een paar veelvoorkomende presets,
 * en precies welke vakken het verschil maken.
 *
 * Alles rekent met rapportcijfers: het gemiddelde zoals je het ziet (één
 * decimaal), afgerond op een heel cijfer (zie reportGrade).
 */

export interface PromotionNorms {
  /** Zoveel tekortpunten mag je hebben zonder verdere voorwaarden. */
  freePoints: number;
  /** Hooguit zoveel tekortpunten in totaal. */
  maxPoints: number;
  /** Hooguit zoveel vakken met een tekort. */
  maxSubjects: number;
  /** Laagste rapportcijfer dat nog mag. */
  minGrade: number;
  /** Heb je meer dan de vrije tekortpunten, dan moet je gemiddelde minstens dit zijn. */
  minAverageWhenShort: number | null;
  /** Gemiddelde dat je altijd moet halen. */
  minAverage: number | null;
  /** Kernvakken (Ne/En/Wi): hooguit zoveel tekortpunten samen. */
  coreMaxPoints: number;
  /** Kernvakken: laagste rapportcijfer dat nog mag. */
  coreMinGrade: number;
  /** Zoveel over de grens is een bespreekgeval; daarboven de gevarenzone. */
  discussPoints: number;
}

export type NormPresetId = "standaard" | "streng" | "ruim" | "examen";

export const NORM_PRESETS: Readonly<
  Record<NormPresetId, { name: string; description: string; norms: PromotionNorms }>
> = {
  standaard: {
    name: "Veelvoorkomend",
    description: "Eén 5 mag altijd. Tot 3 tekortpunten in 2 vakken als je gemiddeld een 6 staat.",
    norms: {
      freePoints: 1,
      maxPoints: 3,
      maxSubjects: 2,
      minGrade: 4,
      minAverageWhenShort: 6,
      minAverage: null,
      coreMaxPoints: 1,
      coreMinGrade: 5,
      discussPoints: 1,
    },
  },
  streng: {
    name: "Streng",
    description: "Hooguit 2 tekortpunten, geen 4 en geen tekort in Ne/En/Wi.",
    norms: {
      freePoints: 1,
      maxPoints: 2,
      maxSubjects: 2,
      minGrade: 5,
      minAverageWhenShort: 6,
      minAverage: null,
      coreMaxPoints: 0,
      coreMinGrade: 6,
      discussPoints: 1,
    },
  },
  ruim: {
    name: "Ruim",
    description: "Tot 4 tekortpunten in 3 vakken, met een gemiddelde van 6.",
    norms: {
      freePoints: 2,
      maxPoints: 4,
      maxSubjects: 3,
      minGrade: 4,
      minAverageWhenShort: 6,
      minAverage: null,
      coreMaxPoints: 2,
      coreMinGrade: 4,
      discussPoints: 2,
    },
  },
  examen: {
    name: "Slaag-zakregeling (schatting)",
    description:
      "Havo en vwo, op je SE: één 5 mag, of 5+5, 4 of 5+4 met gemiddeld een 6. In Ne/En/Wi hooguit één 5. Geen bespreekgeval.",
    norms: {
      freePoints: 1,
      maxPoints: 3,
      maxSubjects: 2,
      minGrade: 4,
      minAverageWhenShort: 6,
      minAverage: null,
      coreMaxPoints: 1,
      coreMinGrade: 5,
      discussPoints: 0,
    },
  },
};

export type PromotionStatus = "over" | "bespreek" | "gevaar" | "onbekend";

export interface PromotionSubject {
  subjectId: string;
  /** Onafgerond gemiddelde; null = geen cijfers (of alleen V/G). */
  average: number | null;
  isCore: boolean;
}

export interface PromotionGrade {
  subjectId: string;
  average: number;
  report: number;
  points: number;
  isCore: boolean;
}

export type CheckId =
  | "tekortpunten"
  | "onvoldoendes"
  | "laagste"
  | "kernvakken"
  | "kernLaagste"
  | "gemiddeldBijTekort"
  | "gemiddelde";

export interface PromotionCheck {
  id: CheckId;
  ok: boolean;
  label: string;
  detail: string;
}

export interface DecisiveSubject {
  subjectId: string;
  report: number;
  /** "tekort": met een 6 ga je erop vooruit. "randje": nog net een punt hoger dan je staat. */
  kind: "tekort" | "randje";
  /** De status als dit vak één kant op valt. */
  wouldBe: PromotionStatus;
}

export interface PromotionResult {
  status: PromotionStatus;
  grades: PromotionGrade[];
  points: number;
  shortSubjects: number;
  corePoints: number;
  /** Gemiddelde van de rapportcijfers. */
  average: number | null;
  checks: PromotionCheck[];
  decisive: DecisiveSubject[];
}

/** Tekortpunten voor één rapportcijfer: een 5 is er één, een 4 twee. */
export const shortagePoints = (report: number) => Math.max(0, 6 - report);

const RANK: Readonly<Record<PromotionStatus, number>> = {
  over: 0,
  bespreek: 1,
  gevaar: 2,
  onbekend: 3,
};

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

function judge(grades: readonly { report: number; isCore: boolean }[], norms: PromotionNorms) {
  const points = grades.reduce((sum, g) => sum + shortagePoints(g.report), 0);
  const shortSubjects = grades.filter((g) => g.report < 6).length;
  const core = grades.filter((g) => g.isCore);
  const corePoints = core.reduce((sum, g) => sum + shortagePoints(g.report), 0);
  const average = grades.length
    ? grades.reduce((sum, g) => sum + g.report, 0) / grades.length
    : null;
  const lowest = grades.length ? Math.min(...grades.map((g) => g.report)) : null;
  const coreLowest = core.length ? Math.min(...core.map((g) => g.report)) : null;

  // Hoe ver ga je over een grens (in "punten"); harde grenzen tellen als oneindig.
  let overshoot = 0;
  const checks: PromotionCheck[] = [];
  const add = (check: PromotionCheck, over: number) => {
    checks.push(check);
    if (!check.ok) overshoot += over;
  };

  add(
    {
      id: "tekortpunten",
      ok: points <= norms.maxPoints,
      label: "Tekortpunten",
      detail: `${points} van hooguit ${norms.maxPoints}`,
    },
    points - norms.maxPoints,
  );
  add(
    {
      id: "onvoldoendes",
      ok: shortSubjects <= norms.maxSubjects,
      label: "Vakken met een tekort",
      detail: `${shortSubjects} van hooguit ${norms.maxSubjects}`,
    },
    shortSubjects - norms.maxSubjects,
  );
  add(
    {
      id: "laagste",
      ok: lowest === null || lowest >= norms.minGrade,
      label: "Laagste cijfer",
      detail: `${lowest ?? "—"} (minstens ${norms.minGrade})`,
    },
    Infinity,
  );
  if (core.length > 0) {
    add(
      {
        id: "kernvakken",
        ok: corePoints <= norms.coreMaxPoints,
        label: "Kernvakken (Ne/En/Wi)",
        detail: `${plural(corePoints, "tekortpunt", "tekortpunten")} van hooguit ${norms.coreMaxPoints}`,
      },
      corePoints - norms.coreMaxPoints,
    );
    add(
      {
        id: "kernLaagste",
        ok: coreLowest === null || coreLowest >= norms.coreMinGrade,
        label: "Laagste kernvak",
        detail: `${coreLowest ?? "—"} (minstens ${norms.coreMinGrade})`,
      },
      Infinity,
    );
  }
  if (norms.minAverageWhenShort !== null && points > norms.freePoints) {
    add(
      {
        id: "gemiddeldBijTekort",
        ok: average !== null && roundHalfUp(average, 2) >= norms.minAverageWhenShort,
        label: "Gemiddelde bij tekorten",
        detail: `${average === null ? "—" : formatGrade(average, 2)} (minstens ${formatGrade(norms.minAverageWhenShort)})`,
      },
      1,
    );
  }
  if (norms.minAverage !== null) {
    add(
      {
        id: "gemiddelde",
        ok: average !== null && roundHalfUp(average, 2) >= norms.minAverage,
        label: "Gemiddelde",
        detail: `${average === null ? "—" : formatGrade(average, 2)} (minstens ${formatGrade(norms.minAverage)})`,
      },
      1,
    );
  }

  const status: PromotionStatus =
    grades.length === 0
      ? "onbekend"
      : overshoot <= 0
        ? "over"
        : overshoot <= norms.discussPoints
          ? "bespreek"
          : "gevaar";
  return { status, checks, points, shortSubjects, corePoints, average };
}

export function evaluatePromotion(
  subjects: readonly PromotionSubject[],
  norms: PromotionNorms,
): PromotionResult {
  const grades: PromotionGrade[] = subjects.flatMap((subject) => {
    if (subject.average === null) return [];
    const report = reportGrade(subject.average);
    return [
      {
        subjectId: subject.subjectId,
        average: subject.average,
        report,
        points: shortagePoints(report),
        isCore: subject.isCore,
      },
    ];
  });
  const result = judge(grades, norms);

  // Wat gebeurt er als één vak een punt anders uitvalt?
  const withReport = (subjectId: string, report: number) =>
    judge(
      grades.map((g) => (g.subjectId === subjectId ? { ...g, report } : g)),
      norms,
    ).status;
  const decisive: DecisiveSubject[] = [];
  if (result.status !== "onbekend") {
    for (const grade of [...grades].sort((a, b) => b.points - a.points)) {
      if (grade.report < 6 && result.status !== "over") {
        const wouldBe = withReport(grade.subjectId, 6);
        if (RANK[wouldBe] < RANK[result.status])
          decisive.push({
            subjectId: grade.subjectId,
            report: grade.report,
            kind: "tekort",
            wouldBe,
          });
      }
    }
    for (const grade of grades) {
      // Op het randje: alleen dankzij afronden zo hoog (bijv. 5,6 → 6).
      if (roundHalfUp(grade.average, 1) >= grade.report) continue;
      const wouldBe = withReport(grade.subjectId, grade.report - 1);
      if (RANK[wouldBe] > RANK[result.status])
        decisive.push({
          subjectId: grade.subjectId,
          report: grade.report,
          kind: "randje",
          wouldBe,
        });
    }
  }

  return {
    status: result.status,
    grades,
    points: result.points,
    shortSubjects: result.shortSubjects,
    corePoints: result.corePoints,
    average: result.average,
    checks: result.checks,
    decisive,
  };
}

/** De sleutel van het combinatiecijfer als "vak" in de meter. */
export const COMBINATION_ID = "combinatiecijfer";

/**
 * Wat de meter meeneemt. Normaal het jaargemiddelde per vak; in het
 * examenjaar het SE, waarbij de vakken van het combinatiecijfer samen één
 * vak worden. Een onderdeel onder de 4 maakt het combinatiecijfer ongeldig:
 * dan telt het laagste onderdeel, zodat de meter dat ook ziet.
 */
export function promotionSubjects(
  subjects: readonly { id: string; isCore: boolean }[],
  grades: readonly Grade[],
  { exam, combination }: { exam: boolean; combination: readonly string[] },
): PromotionSubject[] {
  const inCombination = new Set(exam ? combination : []);
  const averageOf = (subjectId: string) => {
    const own = grades.filter((grade) => grade.subjectId === subjectId);
    return exam ? seAverage(own) : weightedAverage(own);
  };
  const result: PromotionSubject[] = subjects
    .filter((subject) => !inCombination.has(subject.id))
    .map((subject) => ({
      subjectId: subject.id,
      average: averageOf(subject.id),
      isCore: subject.isCore,
    }));
  if (inCombination.size > 0) {
    const parts = combinationGrade([...inCombination].map(averageOf));
    const lowest = Math.min(...parts.finals.filter((f): f is number => f !== null));
    result.push({
      subjectId: COMBINATION_ID,
      average: parts.valid ? parts.grade : lowest,
      isCore: false,
    });
  }
  return result;
}
