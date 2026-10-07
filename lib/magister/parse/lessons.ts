import type { Lesson, LessonInfoType, LessonStatus, Subject, Teacher } from "@/lib/types";
import { arr, bool, field, int, str, toIsoDateTime, toLocalDate } from "./fields";
import { subjectIdFor } from "./subjects";

/**
 * Afspraken (het rooster) naar lessen. De codes, gecontroleerd met echte data:
 *
 * - Type: 13 = les, 1 = persoonlijk, 2 = algemeen, 3 = schoolbreed (die tonen we),
 *   6 = roostervrij en 101 = markering zonder duur (die niet), net als hele dagen.
 * - Status: 4 en 5 = vervallen (uitval), 3, 9 en 10 = gewijzigd of verplaatst,
 *   de rest (1, 2, 6, 7) is gewoon.
 * - InfoType: 0 geen, 1 huiswerk, 2 toets, 3 tentamen, 4 schriftelijk (SO),
 *   5 mondeling, 6 informatie, 7 aantekening.
 * - Lessen uit /roosterwijzigingen zijn ook "gewijzigd" (Magister geeft daar het
 *   oude lokaal niet bij, dus previousLocation blijft leeg).
 */

const SHOWN_TYPES: ReadonlySet<number> = new Set([1, 2, 3, 13]);
const INFO_TYPES: readonly LessonInfoType[] = [
  "geen",
  "huiswerk",
  "toets",
  "tentamen",
  "schriftelijk",
  "mondeling",
  "informatie",
  "aantekening",
];
const CANCELLED: ReadonlySet<number> = new Set([4, 5]);
const CHANGED: ReadonlySet<number> = new Set([3, 9, 10]);

/** De ids uit /roosterwijzigingen. */
export function changedAppointmentIds(raw: unknown): Set<string> {
  return new Set(
    arr(raw, "Items").flatMap((item) => {
      const id = int(item, "Id");
      return id === null ? [] : [String(id)];
    }),
  );
}

const location = (item: unknown): string | null => {
  const text = str(item, "Lokatie", "Locatie");
  if (text && text !== "-") return text;
  const room = arr(item, "Lokalen")
    .map((r) => str(r, "Naam"))
    .find(Boolean);
  return room ?? null;
};

/** Eén afspraak naar een les; null als hij niet in het rooster hoort. */
export function parseLesson(
  item: unknown,
  { subjects, changed }: { subjects: readonly Subject[]; changed: ReadonlySet<string> },
): Lesson | null {
  const id = int(item, "Id");
  const type = int(item, "Type");
  const start = toIsoDateTime(field(item, "Start"));
  const end = toIsoDateTime(field(item, "Einde", "Eind"));
  if (id === null || id <= 0 || !start || !end || start >= end) return null;
  if (type !== null && !SHOWN_TYPES.has(type)) return null;
  if (bool(item, "DuurtHeleDag")) return null;

  const status = int(item, "Status") ?? 0;
  const infoType = INFO_TYPES[int(item, "InfoType") ?? 0] ?? "geen";
  const lessonStatus: LessonStatus = CANCELLED.has(status)
    ? "uitval"
    : CHANGED.has(status) || changed.has(String(id))
      ? "wijziging"
      : "normaal";
  const title = str(item, "Omschrijving") ?? "";
  const hourFrom = int(item, "LesuurVan");
  const hourTo = int(item, "LesuurTotMet");
  const teachers: Teacher[] = arr(item, "Docenten").flatMap((teacher) => {
    const code = str(teacher, "Docentcode", "Code");
    const name = str(teacher, "Naam");
    if (!code && !name) return [];
    return [{ code: code ?? name ?? "", ...(name ? { name } : {}) }];
  });

  return {
    id: String(id),
    start,
    end,
    date: toLocalDate(start)!,
    hourFrom: hourFrom && hourFrom > 0 ? hourFrom : null,
    hourTo: hourTo && hourTo > 0 ? hourTo : null,
    subjectId: subjectIdFor(subjects, {
      description: title,
      names: arr(item, "Vakken").flatMap((v) => str(v, "Naam") ?? []),
    }),
    title,
    location: location(item),
    previousLocation: null,
    teachers,
    infoType,
    status: lessonStatus,
    contentHtml: str(item, "Inhoud"),
    isDone: bool(item, "Afgerond") ?? false,
  };
}

export function parseLessons(
  raw: unknown,
  context: { subjects: readonly Subject[]; changed: ReadonlySet<string> },
): Lesson[] {
  return arr(raw, "Items")
    .flatMap((item) => parseLesson(item, context) ?? [])
    .sort((a, b) => a.start.localeCompare(b.start));
}
