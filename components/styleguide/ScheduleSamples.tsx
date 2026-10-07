"use client";

import { useMemo, useState } from "react";
import { ChangeLine } from "@/components/schedule/ChangesSheet";
import type { AgendaContext } from "@/components/schedule/DayAgenda";
import { DayAgenda } from "@/components/schedule/DayAgenda";
import { LessonCard } from "@/components/schedule/LessonCard";
import { LessonSheet } from "@/components/schedule/LessonSheet";
import {
  BusyWeek,
  WeekFacts,
  WeekLoad,
  WeekView,
  type ScheduleDay,
} from "@/components/schedule/WeekView";
import { useSubjectAppearance } from "@/lib/data/hooks";
import type { ScheduleChange } from "@/lib/schedule/changes";
import { homeworkFromLessons } from "@/lib/school/derive";
import type { Lesson, LessonInfoType, LessonStatus } from "@/lib/types";

/** Lesuren van de verzonnen school. */
const HOURS: Record<number, [string, string]> = {
  1: ["08:30", "09:20"],
  2: ["09:20", "10:10"],
  3: ["10:30", "11:20"],
  4: ["11:20", "12:10"],
  5: ["12:40", "13:30"],
  6: ["13:30", "14:20"],
  7: ["14:30", "15:20"],
};

type Row = [
  hour: number,
  subjectId: string,
  extra?: {
    status?: LessonStatus;
    infoType?: LessonInfoType;
    html?: string;
    from?: string;
    location?: string;
  },
];

const les = (date: string, [hour, subjectId, extra = {}]: Row): Lesson => {
  const [from, to] = HOURS[hour]!;
  return {
    id: `stijl-rooster-${date}-${hour}`,
    start: `${date}T${from}:00`,
    end: `${date}T${to}:00`,
    date,
    hourFrom: hour,
    hourTo: hour,
    subjectId,
    title: "",
    location: extra.location ?? ["A12", "B21", "C07", "A09", "B04", "C05", "A14"][hour - 1]!,
    previousLocation: extra.from ?? null,
    teachers: [{ code: "VDB" }],
    infoType: extra.infoType ?? (extra.html ? "huiswerk" : "geen"),
    status: extra.status ?? (extra.from ? "wijziging" : "normaal"),
    contentHtml: extra.html ?? null,
    isDone: false,
  };
};

/** Een verzonnen week met alles erin: uitval, tussenuren, toetsen en een lokaalwijziging. */
const WEEK: [string, Row[]][] = [
  [
    "2026-10-12",
    [
      [1, "ne"],
      [2, "wisa"],
      [3, "en", { html: "<p>Lees § 3.2 en maak 4 t/m 7.</p>" }],
      [4, "gs"],
      [5, "schk"],
      [6, "nat"],
    ],
  ],
  [
    "2026-10-13",
    [
      [1, "ne", { status: "uitval" }],
      [2, "wisa", { infoType: "toets", html: "<p>H4 Kansrekening, § 4.1 t/m 4.4.</p>" }],
      [3, "biol", { from: "B12", location: "A04" }],
      [4, "en", { status: "uitval" }],
      [5, "gs", { html: "<p>Maak opdracht 3 t/m 6.</p>" }],
      [6, "schk"],
      [7, "econ", { status: "uitval" }],
    ],
  ],
  [
    "2026-10-14",
    [
      [1, "du"],
      [2, "biol", { infoType: "schriftelijk", html: "<p>SO hoofdstuk 2.</p>" }],
      [3, "ne", { html: "<p>Lees § 1.4.</p>" }],
      [4, "wisa"],
      [6, "en"],
    ],
  ],
  [
    "2026-10-15",
    [
      [1, "schk"],
      [2, "nat"],
      [3, "econ"],
      [4, "en", { infoType: "mondeling", html: "<p>Mondeling over je leesdossier.</p>" }],
      [5, "wisa", { html: "<p>Opgave 12 t/m 20.</p>" }],
      [6, "gs"],
      [7, "du"],
    ],
  ],
  [
    "2026-10-16",
    [
      [1, "wisa"],
      [2, "ne"],
      [3, "biol"],
      [4, "schk"],
    ],
  ],
];

const lessons = WEEK.flatMap(([date, rows]) => rows.map((row) => les(date, row)));
const homework = homeworkFromLessons(lessons);
const days: ScheduleDay[] = WEEK.map(([date]) => ({
  date,
  lessons: lessons.filter((l) => l.date === date),
  homeworkCount: homework.filter((h) => h.dueDate === date && !h.isTest).length,
}));
const tuesday = days[1]!;
const NOW = new Date("2026-10-13T10:45:00");
const MOVED = "stijl-rooster-2026-10-13-3";

const changes: ScheduleChange[] = [
  ["lokaal", 3, "biol", "B12", "A04"],
  ["uitval", 7, "econ"],
  ["terug", 2, "du"],
  ["tijd", 5, "gs", "12:40", "13:00"],
  ["extra", 7, "wisa"],
].map(([kind, hour, subjectId, from, to], i) => {
  const date = i < 2 ? "2026-10-13" : "2026-10-15";
  return {
    id: `stijl-wijziging-${i}`,
    lessonId: `stijl-wijziging-${i}`,
    kind: kind as ScheduleChange["kind"],
    date,
    start: `${date}T${HOURS[hour as number]![0]}:00`,
    hourFrom: hour as number,
    subjectId: subjectId as string,
    from: (from as string | undefined) ?? null,
    to: (to as string | undefined) ?? null,
  };
});

/** Stijlgids: de bouwstenen van het rooster (fase 3b) met een vaste, verzonnen week. */
export function ScheduleSamples() {
  const subjects = useSubjectAppearance();
  const [open, setOpen] = useState<Lesson | null>(null);
  const [unseen, setUnseen] = useState<ReadonlySet<string>>(() => new Set([MOVED]));

  const context: AgendaContext = useMemo(
    () => ({
      subject: subjects.get,
      now: NOW,
      unseen,
      markSeen: (id) =>
        setUnseen((current) => new Set([...current].filter((other) => other !== id))),
      open: setOpen,
      upcomingHomework: homework,
      homeworkLessons: new Set(homework.map((h) => h.lessonId)),
    }),
    [subjects.get, unseen],
  );
  const card = (id: string) => lessons.find((l) => l.id === id)!;

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-sm text-ink-2">
          Lescards: gewoon, nu bezig, toets, verplaatst (nog niet gezien) en vervallen.
        </p>
        <div className="grid gap-2 md:grid-cols-2">
          <LessonCard
            lesson={card("stijl-rooster-2026-10-13-6")}
            subject={subjects.get("schk")}
            onOpen={() => setOpen(card("stijl-rooster-2026-10-13-6"))}
          />
          <LessonCard
            lesson={card("stijl-rooster-2026-10-15-5")}
            subject={subjects.get("wisa")}
            hasHomework
            isNow
            onOpen={() => setOpen(card("stijl-rooster-2026-10-15-5"))}
          />
          <LessonCard
            lesson={card("stijl-rooster-2026-10-13-2")}
            subject={subjects.get("wisa")}
            hasHomework
            onOpen={() => setOpen(card("stijl-rooster-2026-10-13-2"))}
          />
          <LessonCard
            lesson={card(MOVED)}
            subject={subjects.get("biol")}
            unseen
            onOpen={() => setOpen(card(MOVED))}
          />
          <LessonCard
            lesson={card("stijl-rooster-2026-10-13-1")}
            subject={subjects.get("ne")}
            onOpen={() => setOpen(card("stijl-rooster-2026-10-13-1"))}
          />
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm text-ink-2">
          Een hele dag: uitslapen, een slim tussenuur door uitval en vroeg naar huis. Tik op een les
          voor de details.
        </p>
        <DayAgenda date={tuesday.date} lessons={tuesday.lessons} context={context} />
      </div>

      <div>
        <p className="mb-2 text-sm text-ink-2">
          De week: drukte-waarschuwing, weekbelasting, langste en kortste dag en de weekweergave met
          de nu-lijn (dinsdag 10:45).
        </p>
        <BusyWeek tests={3} />
        <WeekLoad days={days} />
        <WeekFacts days={days} />
        <WeekView days={days} context={context} />
      </div>

      <div>
        <p className="mb-2 text-sm text-ink-2">
          Wat is er veranderd? Elke soort wijziging met een eigen icoon.
        </p>
        <ul className="divide-y divide-line">
          {changes.map((change, i) => (
            <li key={change.id}>
              <ChangeLine
                change={change}
                subjectName={(id) => subjects.get(id).name}
                unseen={i < 2}
              />
            </li>
          ))}
        </ul>
      </div>

      <LessonSheet lesson={open} subject={subjects.get} now={NOW} onClose={() => setOpen(null)} />
    </div>
  );
}
