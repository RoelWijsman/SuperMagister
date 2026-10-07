import type { Grade } from "@/lib/types";
import {
  arr,
  bool,
  field,
  int,
  num,
  parseGradeValue,
  str,
  toIsoDateTime,
  toLocalDate,
} from "./fields";

/**
 * Cijfers uit /cijfers/laatste (camelCase, gecontroleerd met echte data):
 * kolomId, omschrijving, ingevoerdOp, vak.code, waarde ("7,8", "V", "Inh"),
 * weegfactor, isVoldoende, teltMee, moetInhalen, heeftVrijstelling, behaaldOp.
 *
 * - "Inh" (moet inhalen) en vrijstellingen worden beoordelingen die niet meetellen.
 * - De toetsdatum is behaaldOp als die er is, anders de invoerdatum.
 * - Periode en PTA staan hier niet in; die vult de bron aan.
 */
export function parseLatestGrades(raw: unknown): Grade[] {
  return arr(raw, "items", "Items").flatMap((item): Grade[] => {
    const id = int(item, "kolomId", "KolomId", "id");
    const code = str(item, "vak.code", "vak.afkorting");
    const enteredAt = toIsoDateTime(field(item, "ingevoerdOp"));
    if (id === null || !code || !enteredAt) return [];

    const exempt = bool(item, "heeftVrijstelling") === true;
    const rawValue = str(item, "waarde");
    const parsed = exempt
      ? { kind: "text" as const, value: "VR" as const }
      : parseGradeValue(rawValue);
    if (!parsed) return [];

    const base = {
      id: String(id),
      subjectId: code.toLowerCase(),
      description: str(item, "omschrijving") ?? "",
      weight: num(item, "weegfactor", "weging") ?? 1,
      date: toLocalDate(field(item, "behaaldOp")) ?? toLocalDate(enteredAt)!,
      enteredAt,
      periodId: null,
      isPTA: false,
    };
    if (parsed.kind === "numeric") {
      return [
        {
          ...base,
          countsTowardAverage: bool(item, "teltMee") ?? true,
          kind: "numeric",
          value: parsed.value,
          display: rawValue ?? String(parsed.value).replace(".", ","),
          isSufficient: bool(item, "isVoldoende") ?? parsed.value >= 5.5,
        },
      ];
    }
    const pending = parsed.value === "INH" || parsed.value === "VR";
    return [
      {
        ...base,
        countsTowardAverage: pending ? false : (bool(item, "teltMee") ?? true),
        kind: "text",
        value: parsed.value,
        display: parsed.value === "INH" ? "Inh" : parsed.value,
        isSufficient: pending ? null : (bool(item, "isVoldoende") ?? null),
      },
    ];
  });
}
