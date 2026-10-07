import type { DateRange, ISODate, Lesson } from "@/lib/types";
import {
  baselineChanges,
  diffSchedule,
  fingerprint,
  type LessonFingerprint,
  type ScheduleChange,
} from "./changes";

/** Wat de wijzigingen-detector per databron bewaart (IndexedDB). */
export interface TrackerState {
  snapshot: Record<string, LessonFingerprint>;
  /** Het venster van het snapshot. */
  range: DateRange;
  /** Wijzigingen voor vandaag en later. */
  changes: ScheduleChange[];
  /** Lessen met een wijziging die je nog niet gezien hebt (pulserende rand). */
  unseen: string[];
}

/** Uitval en "gaat toch door" sluiten elkaar uit: de nieuwste wint. */
const OPPOSITE: Partial<Record<ScheduleChange["kind"], ScheduleChange["kind"]>> = {
  uitval: "terug",
  terug: "uitval",
};

/**
 * Na een verversing: vergelijken met het vorige snapshot (alleen binnen het
 * venster dat dat al kende, vanaf vandaag), wijzigingen samenvoegen en een
 * nieuw snapshot maken. Zonder vorig snapshot telt wat al afwijkt.
 */
export function nextTrackerState(
  previous: TrackerState | null,
  lessons: readonly Lesson[],
  range: DateRange,
  today: ISODate,
): TrackerState {
  const inRange = (date: ISODate) => date >= range.from && date <= range.to;
  let fresh: ScheduleChange[];
  if (!previous) {
    fresh = baselineChanges(lessons, range);
  } else {
    const window = {
      from: previous.range.from > today ? previous.range.from : today,
      to: previous.range.to < range.to ? previous.range.to : range.to,
    };
    fresh =
      window.from <= window.to
        ? diffSchedule(
            previous.snapshot,
            lessons.filter((lesson) => lesson.date >= window.from && lesson.date <= window.to),
            window,
          )
        : [];
  }

  const changes = new Map(
    (previous?.changes ?? []).filter((c) => c.date >= today).map((c) => [c.id, c]),
  );
  const unseen = new Set(
    (previous?.unseen ?? []).filter((id) => [...changes.values()].some((c) => c.lessonId === id)),
  );
  for (const change of fresh) {
    const opposite = OPPOSITE[change.kind];
    if (opposite) changes.delete(`${change.lessonId}:${opposite}`);
    changes.set(change.id, change);
    unseen.add(change.lessonId);
  }
  const kept = [...changes.values()].sort((a, b) => a.start.localeCompare(b.start));
  const stillChanged = new Set(kept.map((c) => c.lessonId));

  return {
    snapshot: Object.fromEntries(
      lessons
        .filter((lesson) => inRange(lesson.date))
        .map((lesson) => [lesson.id, fingerprint(lesson)]),
    ),
    range,
    changes: kept,
    unseen: [...unseen].filter((id) => stillChanged.has(id)),
  };
}
