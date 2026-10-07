import type { Absence, AbsenceKind, Subject } from "@/lib/types";
import { arr, bool, field, int, obj, str, toIsoDateTime, toLocalDate } from "./fields";
import { subjectIdFor } from "./subjects";

/**
 * Absenties. Verantwoordingtype, gecontroleerd met echte data: 1 afwezig
 * (met allerlei codes, ook spijbelen), 2 te laat, 3 ziek, 7 materiaal of boeken
 * vergeten, 8 huiswerk vergeten. 4 (verwijderd) en vrijstellingen herkennen we
 * ook aan de omschrijving.
 */
const KINDS: Readonly<Record<number, AbsenceKind>> = {
  1: "afwezig",
  2: "te-laat",
  3: "ziek",
  4: "uitgestuurd",
  7: "materiaal-vergeten",
  8: "huiswerk-vergeten",
};

function kindOf(type: number | null, reason: string): AbsenceKind {
  if (/vrijstell/i.test(reason)) return "vrijstelling";
  if (/uitgestuurd|verwijderd/i.test(reason)) return "uitgestuurd";
  return (type !== null ? KINDS[type] : undefined) ?? "overig";
}

export function parseAbsences(
  raw: unknown,
  { subjects }: { subjects: readonly Subject[] },
): Absence[] {
  return arr(raw, "Items")
    .flatMap((item): Absence[] => {
      const id = int(item, "Id");
      const lesson = obj(item, "Afspraak");
      const start = toIsoDateTime(field(lesson, "Start") ?? field(item, "Start"));
      const end = toIsoDateTime(field(lesson, "Einde") ?? field(item, "Eind", "Einde")) ?? start;
      const date = toLocalDate(field(item, "Start")) ?? (start ? toLocalDate(start) : null);
      if (id === null || !start || !end || !date) return [];
      const reason = str(item, "Omschrijving") ?? "";
      const lessonId = int(item, "AfspraakId");
      const hour = int(item, "Lesuur") ?? int(lesson, "LesuurVan");
      return [
        {
          id: String(id),
          start,
          end,
          date,
          lessonId: lessonId && lessonId > 0 ? String(lessonId) : null,
          subjectId: lesson
            ? subjectIdFor(subjects, {
                description: str(lesson, "Omschrijving"),
                names: arr(lesson, "Vakken").flatMap((v) => str(v, "Naam") ?? []),
              })
            : null,
          hour: hour && hour > 0 ? hour : null,
          kind: kindOf(int(item, "Verantwoordingtype"), reason),
          reason,
          isAuthorized: bool(item, "Geoorloofd") ?? false,
        },
      ];
    })
    .sort((a, b) => a.start.localeCompare(b.start));
}
