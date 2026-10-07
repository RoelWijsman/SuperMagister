import { DAY_NAMES_SHORT, formatTime, parseISODate } from "@/lib/date";
import type { DateRange, ISODate, Lesson, LessonStatus } from "@/lib/types";

/**
 * Fase 3b: de roosterwijzigingen-detector. De app bewaart een snapshot van
 * je rooster (IndexedDB) en vergelijkt bij elke verversing. Puur: hier staat
 * alleen het vergelijken en het opschrijven ("Di 3e uur: lokaal B12 → A04").
 */

export interface LessonFingerprint {
  date: ISODate;
  start: string;
  end: string;
  hourFrom: number | null;
  subjectId: string | null;
  location: string | null;
  status: LessonStatus;
  teachers: string;
}

export function fingerprint(lesson: Lesson): LessonFingerprint {
  return {
    date: lesson.date,
    start: lesson.start,
    end: lesson.end,
    hourFrom: lesson.hourFrom,
    subjectId: lesson.subjectId,
    location: lesson.location,
    status: lesson.status,
    teachers: lesson.teachers.map((t) => t.code).join(", "),
  };
}

export type ChangeKind = "uitval" | "terug" | "lokaal" | "tijd" | "docent" | "extra" | "verdwenen";

export interface ScheduleChange {
  /** Uniek per les en soort wijziging. */
  id: string;
  lessonId: string;
  kind: ChangeKind;
  date: ISODate;
  start: string;
  hourFrom: number | null;
  subjectId: string | null;
  from?: string | null;
  to?: string | null;
}

const ms = (iso: string) => new Date(iso).getTime();
const inRange = (date: ISODate, range: DateRange) => date >= range.from && date <= range.to;

function change(
  lessonId: string,
  kind: ChangeKind,
  print: LessonFingerprint,
  extra: Pick<ScheduleChange, "from" | "to"> = {},
): ScheduleChange {
  return {
    id: `${lessonId}:${kind}`,
    lessonId,
    kind,
    date: print.date,
    start: print.start,
    hourFrom: print.hourFrom,
    subjectId: print.subjectId,
    ...extra,
  };
}

const byStart = (a: ScheduleChange, b: ScheduleChange) => ms(a.start) - ms(b.start);

/**
 * Wat is er veranderd tussen het snapshot en nu, binnen `range` (het
 * venster dat het snapshot kende, vanaf vandaag)?
 */
export function diffSchedule(
  snapshot: Readonly<Record<string, LessonFingerprint>>,
  lessons: readonly Lesson[],
  range: DateRange,
): ScheduleChange[] {
  const changes: ScheduleChange[] = [];
  const seen = new Set<string>();
  for (const lesson of lessons) {
    if (!inRange(lesson.date, range)) continue;
    seen.add(lesson.id);
    const now = fingerprint(lesson);
    const before = snapshot[lesson.id];
    if (!before) {
      if (now.status !== "uitval") changes.push(change(lesson.id, "extra", now));
      continue;
    }
    if (before.status !== "uitval" && now.status === "uitval") {
      changes.push(change(lesson.id, "uitval", now));
      continue;
    }
    if (before.status === "uitval" && now.status !== "uitval") {
      changes.push(change(lesson.id, "terug", now));
    }
    if (now.status === "uitval") continue;
    if (before.start !== now.start) {
      changes.push(change(lesson.id, "tijd", now, { from: before.start, to: now.start }));
    }
    if (before.location !== now.location) {
      changes.push(change(lesson.id, "lokaal", now, { from: before.location, to: now.location }));
    }
    if (before.teachers !== now.teachers && now.teachers) {
      changes.push(change(lesson.id, "docent", now, { from: before.teachers, to: now.teachers }));
    }
  }
  for (const [lessonId, before] of Object.entries(snapshot)) {
    if (seen.has(lessonId) || !inRange(before.date, range) || before.status === "uitval") continue;
    changes.push(change(lessonId, "verdwenen", before));
  }
  return changes.sort(byStart);
}

/**
 * De eerste keer is er nog geen snapshot. Dan telt wat al afwijkt van het
 * gewone rooster: uitval en lokaalwijzigingen.
 */
export function baselineChanges(lessons: readonly Lesson[], range: DateRange): ScheduleChange[] {
  return lessons
    .filter((lesson) => inRange(lesson.date, range))
    .flatMap((lesson) => {
      const print = fingerprint(lesson);
      if (lesson.status === "uitval") return [change(lesson.id, "uitval", print)];
      if (lesson.status === "wijziging" && lesson.previousLocation && lesson.location) {
        return [
          change(lesson.id, "lokaal", print, {
            from: lesson.previousLocation,
            to: lesson.location,
          }),
        ];
      }
      return [];
    })
    .sort(byStart);
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** "Di 3e uur: lokaal B12 → A04", "Do 5e uur: Frans vervalt". */
export function formatChange(
  change: ScheduleChange,
  subjectName: (id: string | null) => string,
): string {
  const day = capitalize(DAY_NAMES_SHORT[parseISODate(change.date).getDay()] ?? "");
  const when =
    change.hourFrom !== null ? `${change.hourFrom}e uur` : formatTime(new Date(change.start));
  const subject = subjectName(change.subjectId);
  const what = (() => {
    switch (change.kind) {
      case "uitval":
        return `${subject} vervalt`;
      case "terug":
        return `${subject} gaat toch door`;
      case "lokaal":
        return `lokaal ${change.from ?? "?"} → ${change.to ?? "?"}`;
      case "tijd":
        return `${subject} begint om ${formatTime(new Date(change.to ?? change.start))}`;
      case "docent":
        return `${subject} bij ${change.to}`;
      case "extra":
        return `extra les ${subject}`;
      case "verdwenen":
        return `${subject} staat niet meer in je rooster`;
    }
  })();
  return `${day} ${when}: ${what}`;
}
