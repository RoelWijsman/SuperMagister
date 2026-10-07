import { roundHalfUp, weightedAverage } from "@/lib/calc/average";
import type { Grade } from "@/lib/types";
import {
  arr,
  bool,
  field,
  int,
  num,
  obj,
  parseGradeValue,
  str,
  toIsoDateTime,
  toLocalDate,
} from "./fields";

/**
 * Cijfers uit /aanmeldingen/{id}/cijfers (camelCase), gecontroleerd met echte
 * data van drie schooljaren. Elk item is een cel in een kolom:
 *
 * - kolom.type "cijfer": een toets, met kolom.weegfactor, kolom.periode.id en
 *   kolom.studievakId (het vak via /vakken). waarde "6,4", "V", "G", "O", "RV",
 *   "Vr" (vrijstelling) of "Inh" (inhalen). Achter V/G/O verstopt Magister een
 *   getal (cijferGetal); dat negeren we, net als Magister bij het gemiddelde.
 * - kolom.type "gemiddelde" (kop "VG"): Magisters eigen gemiddelde per vak en
 *   periode. Daarmee controleren we onze berekening.
 * - kolom.type "formule" en "som" (kop "TEK"): Magisters tekortpunten. Die rekent
 *   elke school anders; we gebruiken ze niet.
 * - Een schooljaar kan meerdere perioden hebben (OV1, OV2); we volgen gewoon
 *   wat Magister bij dat schooljaar zet.
 */

export interface MagisterAverage {
  subjectId: string;
  periodId: string | null;
  /** Null bij een beoordeling ("RV", "V"). */
  value: number | null;
  display: string;
}

export interface ProgressGrades {
  grades: Grade[];
  magisterAverages: MagisterAverage[];
}

const NUMERIC = /^\d+(?:[.,]\d+)?$/;
/** PTA herkennen we (nog niet getest met echte data) aan "SE" of "PTA" in periode of kop. */
const PTA = /^(se|pta)\b/i;

export function parseProgressGrades(
  raw: unknown,
  { subjects }: { subjects: ReadonlyMap<number, string> },
): ProgressGrades {
  const grades: Grade[] = [];
  const magisterAverages: MagisterAverage[] = [];

  for (const item of arr(raw, "items", "Items")) {
    const kolom = obj(item, "kolom");
    const studyId = int(kolom, "studievakId", "studieVakId");
    const subjectId = studyId === null ? undefined : subjects.get(studyId);
    if (!kolom || !subjectId) continue;
    const type = str(kolom, "type")?.toLowerCase();
    const periodId = int(kolom, "periode.id");
    const rawValue = str(item, "waarde") ?? "";

    if (type === "gemiddelde") {
      magisterAverages.push({
        subjectId,
        periodId: periodId === null ? null : String(periodId),
        value: NUMERIC.test(rawValue) ? (num(item, "cijferGetal") ?? num(item, "waarde")) : null,
        display: rawValue,
      });
      continue;
    }
    if (type !== "cijfer") continue;

    const id = int(kolom, "id");
    const enteredAt = toIsoDateTime(field(item, "ingevoerdOp"));
    if (id === null || !enteredAt) continue;
    const exempt = bool(item, "heeftVrijstelling") === true;
    const makeUp = bool(item, "moetInhalen") === true;
    const parsed = exempt
      ? ({ kind: "text", value: "VR" } as const)
      : makeUp
        ? ({ kind: "text", value: "INH" } as const)
        : NUMERIC.test(rawValue)
          ? ({ kind: "numeric", value: num(item, "cijferGetal") ?? num(item, "waarde")! } as const)
          : parseGradeValue(rawValue);
    if (!parsed) continue;

    const base = {
      id: String(id),
      subjectId,
      description: str(kolom, "omschrijving") ?? str(kolom, "naam") ?? "",
      weight: num(kolom, "weegfactor") ?? 1,
      date: toLocalDate(enteredAt)!,
      enteredAt,
      periodId: periodId === null ? null : String(periodId),
      isPTA: PTA.test(str(kolom, "periode.code") ?? "") || PTA.test(str(kolom, "kop") ?? ""),
    };
    if (parsed.kind === "numeric") {
      grades.push({
        ...base,
        countsTowardAverage: bool(item, "teltMee") ?? true,
        kind: "numeric",
        value: parsed.value,
        display: rawValue,
        isSufficient: bool(item, "isVoldoende") ?? parsed.value >= 5.5,
      });
    } else {
      const pending = parsed.value === "INH" || parsed.value === "VR";
      grades.push({
        ...base,
        countsTowardAverage: pending ? false : (bool(item, "teltMee") ?? true),
        kind: "text",
        value: parsed.value,
        display: rawValue || (parsed.value === "INH" ? "Inh" : parsed.value),
        isSufficient: pending ? null : (bool(item, "isVoldoende") ?? null),
      });
    }
  }
  return { grades, magisterAverages };
}

export interface AverageCheck {
  subjectId: string;
  periodId: string | null;
  ours: number;
  magister: number;
  /** Afgerond op één decimaal anders dan Magister: "Magister rekent hier anders". */
  differs: boolean;
}

/** Onze gemiddelden naast die van Magister, per vak en periode. */
export function compareAverages(
  grades: readonly Grade[],
  averages: readonly MagisterAverage[],
): AverageCheck[] {
  return averages.flatMap((average) => {
    if (average.value === null) return [];
    const ours = weightedAverage(
      grades.filter((g) => g.subjectId === average.subjectId && g.periodId === average.periodId),
    );
    if (ours === null) return [];
    return [
      {
        subjectId: average.subjectId,
        periodId: average.periodId,
        ours,
        magister: average.value,
        differs: Math.abs(roundHalfUp(ours, 1) - roundHalfUp(average.value, 1)) > 1e-9,
      },
    ];
  });
}
