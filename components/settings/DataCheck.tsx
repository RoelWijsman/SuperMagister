"use client";

import { useState } from "react";
import {
  daysRange,
  useAbsences,
  useAverageChecks,
  useGrades,
  useHistory,
  useLessons,
  useSubjectAppearance,
  weekRange,
} from "@/lib/data/hooks";
import { addDays, formatShortDate, parseISODate, startOfDay } from "@/lib/date";
import { homeworkFromLessons, testsFromLessons } from "@/lib/school/derive";
import type { AbsenceKind } from "@/lib/types";

const KIND: Record<AbsenceKind, string> = {
  afwezig: "afwezig",
  "te-laat": "te laat",
  ziek: "ziek",
  uitgestuurd: "uitgestuurd",
  "huiswerk-vergeten": "huiswerk vergeten",
  "materiaal-vergeten": "materiaal vergeten",
  vrijstelling: "vrijstelling",
  overig: "overig",
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-ink-3">{label}</dt>
      <dd className="text-ink tabular-nums">{value}</dd>
    </>
  );
}

/**
 * Alleen tijdens het bouwen: wat er van de databron binnenkomt, in getallen.
 * Om na het koppelen te vergelijken met Magister zelf (ook de absenties, die
 * geen eigen scherm hebben).
 */
export function DataCheck() {
  const [today] = useState(() => startOfDay(new Date()));
  const [absenceRange] = useState(() => daysRange(addDays(today, -84), 84));
  const [week] = useState(() => weekRange(today));
  const grades = useGrades();
  const history = useHistory();
  const checks = useAverageChecks();
  const lessons = useLessons(week);
  const absences = useAbsences(absenceRange);
  const subjects = useSubjectAppearance();

  if (process.env.NODE_ENV === "production") return null;
  const count = (n: number | undefined) => (n === undefined ? "…" : String(n));
  const list = lessons.data;
  const sortedAbsences = [...(absences.data ?? [])].sort((a, b) => b.start.localeCompare(a.start));

  return (
    <div className="mt-4 border-t border-line pt-4">
      <p className="font-medium text-ink">Gegevens controleren</p>
      <p className="mb-3 text-sm text-ink-3">
        Wat de app nu binnenkrijgt. Vergelijk het met Magister zelf.
      </p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <Row label="Cijfers dit schooljaar" value={count(grades.data?.length)} />
        <Row
          label="Eerdere schooljaren"
          value={
            history.data
              ? history.data.map((y) => `${y.label}: ${y.grades.length}`).join(" · ") || "geen"
              : "…"
          }
        />
        <Row
          label="Gemiddelden vergeleken"
          value={
            checks.data
              ? `${checks.data.length}, waarvan ${checks.data.filter((c) => c.differs).length} anders dan Magister`
              : "…"
          }
        />
        <Row
          label={`Deze week (${formatShortDate(parseISODate(week.from))})`}
          value={
            list
              ? `${list.length} lessen · ${list.filter((l) => l.status === "uitval").length} uitval · ${list.filter((l) => l.status === "wijziging").length} gewijzigd · ${testsFromLessons(list).length} toetsen · ${homeworkFromLessons(list).length} huiswerk`
              : "…"
          }
        />
        <Row label="Absenties (12 weken)" value={count(absences.data?.length)} />
      </dl>
      {sortedAbsences.length > 0 && (
        <ul className="mt-2 space-y-0.5 text-sm text-ink-2">
          {sortedAbsences.slice(0, 12).map((absence) => (
            <li key={absence.id}>
              {formatShortDate(parseISODate(absence.date))}
              {absence.hour !== null && `, ${absence.hour}e uur`}
              {absence.subjectId && ` · ${subjects.get(absence.subjectId).name}`} ·{" "}
              {KIND[absence.kind]}
              {absence.isAuthorized ? " (geoorloofd)" : ""}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
