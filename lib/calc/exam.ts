import type { Grade } from "@/lib/types";
import { roundHalfUp, weightedAverage } from "./average";

/**
 * Fase 4, bovenbouw: het schoolexamen (SE). Het SE-cijfer is het gewogen
 * gemiddelde van je PTA-cijfers, afgerond op één decimaal. Een vak zonder
 * centraal examen krijgt dat SE-cijfer, afgerond op een heel cijfer, als
 * eindcijfer. Het combinatiecijfer is het afgeronde gemiddelde van de
 * eindcijfers van de vakken die erin zitten; geen daarvan mag lager zijn dan 4.
 */

/** Onafgerond SE-gemiddelde; null zonder PTA-cijfers die meetellen. */
export function seAverage(grades: readonly Grade[]): number | null {
  return weightedAverage(grades.filter((grade) => grade.isPTA));
}

/** Het SE-cijfer: op één decimaal. */
export const seGrade = (raw: number) => roundHalfUp(raw, 1);

/** Eindcijfer uit het SE (zonder centraal examen): het SE-cijfer, afgerond op een heel cijfer. */
export const finalFromSe = (raw: number) => roundHalfUp(seGrade(raw), 0);

export interface CombinationResult {
  /** Het combinatiecijfer, of null zolang een onderdeel nog niets heeft. */
  grade: number | null;
  finals: (number | null)[];
  /** Geen onderdeel onder de 4. */
  valid: boolean;
}

export function combinationGrade(components: readonly (number | null)[]): CombinationResult {
  const finals = components.map((raw) => (raw === null ? null : finalFromSe(raw)));
  const known = finals.filter((f): f is number => f !== null);
  const valid = known.every((f) => f >= 4);
  const grade =
    known.length > 0 && known.length === finals.length
      ? roundHalfUp(known.reduce((sum, f) => sum + f, 0) / known.length, 0)
      : null;
  return { grade, finals, valid };
}

export interface ExamRow {
  subjectId: string;
  /** De PTA-kolommen, op datum. */
  pta: Grade[];
  seRaw: number | null;
  se: number | null;
  final: number | null;
}

/** Per vak (in de gegeven volgorde) de PTA-cijfers en het SE; vakken zonder PTA vallen weg. */
export function examOverview(grades: readonly Grade[], subjectIds: readonly string[]): ExamRow[] {
  return subjectIds.flatMap((subjectId) => {
    const pta = grades
      .filter((grade) => grade.subjectId === subjectId && grade.isPTA)
      .sort((a, b) => a.date.localeCompare(b.date) || a.enteredAt.localeCompare(b.enteredAt));
    if (pta.length === 0) return [];
    const seRaw = seAverage(pta);
    return [
      {
        subjectId,
        pta,
        seRaw,
        se: seRaw === null ? null : seGrade(seRaw),
        final: seRaw === null ? null : finalFromSe(seRaw),
      },
    ];
  });
}

/** Vakken die meestal in het combinatiecijfer zitten (havo/vwo). */
const COMBINATION_HINT =
  /maatschappijleer|profielwerkstuk|^(maat|ma|mask|pws|ckv|anw|burgerschap|lv)$/i;

/** Een voorstel voor het combinatiecijfer; je past het zelf aan bij Examen. */
export function suggestedCombination(
  subjects: readonly { id: string; code: string; name: string }[],
): string[] {
  return subjects
    .filter((s) => COMBINATION_HINT.test(s.name) || COMBINATION_HINT.test(s.code))
    .map((s) => s.id);
}
