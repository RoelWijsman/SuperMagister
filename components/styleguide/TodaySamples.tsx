"use client";

import { useMemo } from "react";
import { CountdownWidget } from "@/components/today/CountdownWidget";
import { LoadBarWidget } from "@/components/today/LoadBarWidget";
import { RadarWidget } from "@/components/today/RadarWidget";
import { TimelineWidget } from "@/components/today/TimelineWidget";
import { TrendWidget } from "@/components/today/TrendWidget";
import { WeatherWidget } from "@/components/today/WeatherWidget";
import { useSubjectAppearance } from "@/lib/data/hooks";
import { schoolDayLoad } from "@/lib/school/day-parts";
import { gradeTrend } from "@/lib/today/trend";
import type { Lesson, LessonStatus, NumericGrade, Test } from "@/lib/types";

/** Een verzonnen dinsdag, alleen voor de stijlgids: met pauze, tussenuur en uitval. */
const DAY = "2026-10-06";
const SAMPLE: [string, string, string, LessonStatus, string][] = [
  ["08:30", "09:20", "ne", "normaal", "A12"],
  ["09:20", "10:10", "wisa", "normaal", "B21"],
  ["10:30", "11:20", "biol", "wijziging", "C07"],
  ["12:10", "13:00", "en", "normaal", "A09"],
  ["13:00", "13:50", "gs", "uitval", "B04"],
  ["14:00", "14:50", "schk", "normaal", "C05"],
];
const lessons: Lesson[] = SAMPLE.map(([from, to, subjectId, status, location], i) => ({
  id: `stijl-les-${i}`,
  start: `${DAY}T${from}:00`,
  end: `${DAY}T${to}:00`,
  date: DAY,
  hourFrom: null,
  hourTo: null,
  subjectId,
  title: "",
  location,
  previousLocation: null,
  teachers: [],
  infoType: "geen",
  status,
  contentHtml: null,
  isDone: false,
}));
const at = (time: string) => new Date(`${DAY}T${time}:00`);

const tests: Test[] = [
  ["wisa", "2026-10-07", "toets"],
  ["biol", "2026-10-09", "schriftelijk"],
  ["en", "2026-10-13", "mondeling"],
  ["gs", "2026-10-19", "toets"],
].map(([subjectId, date, kind], i) => ({
  id: `stijl-toets-${i}`,
  lessonId: `stijl-toets-${i}`,
  subjectId: subjectId!,
  kind: kind as Test["kind"],
  date: date!,
  start: `${date}T09:20:00`,
  html: "<p>Hoofdstuk 3 en de aantekeningen uit de les.</p>",
  text: "Hoofdstuk 3 en de aantekeningen uit de les.",
}));

const grades: NumericGrade[] = [6.1, 6.6, 6.4, 7.2, 7.8].map((value, i) => ({
  id: `stijl-cijfer-${i}`,
  subjectId: ["ne", "wisa", "en", "biol", "gs"][i]!,
  description: "",
  weight: 1,
  date: `2026-09-${String(10 + i).padStart(2, "0")}`,
  enteredAt: `2026-09-${String(10 + i).padStart(2, "0")}T16:00:00`,
  periodId: null,
  countsTowardAverage: true,
  isPTA: false,
  kind: "numeric",
  value,
  display: value.toFixed(1).replace(".", ","),
  isSufficient: value >= 5.5,
}));

const STATES = [
  { label: "Voor schooltijd", time: "07:50" },
  { label: "Onderweg", time: "11:05" },
  { label: "Download voltooid", time: "15:10" },
] as const;

/** Stijlgids: de widgets van Vandaag (fase 3a) met een vaste, verzonnen dag. */
export function TodaySamples() {
  const subjects = useSubjectAppearance();
  const trend = useMemo(() => gradeTrend(grades), []);
  const noon = at("11:05");

  return (
    <div className="space-y-5">
      <div className="grid gap-4">
        {STATES.map(({ label, time }) => (
          <div key={label}>
            <p className="mb-2 text-sm text-ink-3">{label}</p>
            <LoadBarWidget
              load={schoolDayLoad(lessons, at(time))}
              upcoming={null}
              now={at(time)}
              subject={subjects.get}
              preview
            />
          </div>
        ))}
      </div>
      <TimelineWidget lessons={lessons} now={noon} subject={subjects.get} isLoading={false} />
      <div className="grid gap-4 md:grid-cols-2">
        <RadarWidget tests={tests} now={noon} subject={subjects.get} isLoading={false} />
        <TrendWidget trend={trend} subject={subjects.get} isLoading={false} />
      </div>
      <p className="text-sm text-ink-2">Fietsweer en aftellen gebruiken echte data van vandaag:</p>
      <div className="grid gap-4 md:grid-cols-2">
        <WeatherWidget times={{ leave: at("08:15"), home: at("14:50") }} now={noon} />
        <CountdownWidget now={new Date()} lastBellToday={null} examYear />
      </div>
    </div>
  );
}
