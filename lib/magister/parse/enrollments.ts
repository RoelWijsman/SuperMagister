import type { ISODate } from "@/lib/types";
import { arr, field, int, str, toLocalEndDate, toLocalDate } from "./fields";

/** Een aanmelding: één schooljaar bij Magister. */
export interface Enrollment {
  id: number;
  start: ISODate;
  /** De laatste dag (Magister geeft de middernacht erna). */
  end: ISODate;
  /** "2026–2027" */
  label: string;
  /** Zoals Magister hem noemt, bijv. "K_HAVO/3". */
  study: string | null;
  /** De klas, bijv. "HAVO 3". */
  group: string | null;
  level: "vmbo" | "havo" | "vwo" | null;
  year: number | null;
  isExamYear: boolean;
}

const EXAM_YEAR = { vmbo: 4, havo: 5, vwo: 6 } as const;

/** Niveau en leerjaar uit een studie- of klasnaam ("K_HAVO/5", "6 vwo", "Atheneum 4"). */
export function studyInfo(text: string | null): Pick<Enrollment, "level" | "year" | "isExamYear"> {
  const value = (text ?? "").toLowerCase();
  const level = /vwo|atheneum|gymnasium/.test(value)
    ? "vwo"
    : /havo/.test(value)
      ? "havo"
      : /vmbo|mavo|kader|basis/.test(value)
        ? "vmbo"
        : null;
  const digit = /(?:^|\D)([1-6])(?:\D|$)/.exec(value);
  const year = level && digit ? Number(digit[1]) : null;
  return { level, year, isExamYear: level !== null && year === EXAM_YEAR[level] };
}

export function parseEnrollments(raw: unknown): Enrollment[] {
  return arr(raw, "Items").flatMap((item): Enrollment[] => {
    const id = int(item, "Id");
    const start = toLocalDate(field(item, "Start", "Begin"));
    const end = toLocalEndDate(field(item, "Einde", "Eind"));
    if (id === null || !start || !end) return [];
    const study = str(item, "Studie.Omschrijving", "Studie.Code");
    const group = str(item, "Groep.Omschrijving", "Groep.Code");
    const info = studyInfo(study ?? group);
    return [
      {
        id,
        start,
        end,
        label: `${start.slice(0, 4)}–${end.slice(0, 4)}`,
        study,
        group,
        ...info,
      },
    ];
  });
}

/** Het schooljaar van vandaag; in de zomer het nieuwste dat al begonnen is. */
export function currentEnrollment(list: readonly Enrollment[], today: ISODate): Enrollment | null {
  const sorted = [...list].sort((a, b) => a.start.localeCompare(b.start));
  return (
    sorted.find((e) => e.start <= today && today <= e.end) ??
    sorted.filter((e) => e.start <= today).at(-1) ??
    sorted[0] ??
    null
  );
}
