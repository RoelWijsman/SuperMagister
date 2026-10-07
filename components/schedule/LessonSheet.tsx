"use client";

import { ArrowRight, MapPin, User } from "lucide-react";
import Link from "next/link";
import { Chip } from "@/components/ui/Chip";
import { SafeHtml } from "@/components/ui/SafeHtml";
import { Sheet } from "@/components/ui/Sheet";
import type { SubjectAppearance } from "@/lib/data/hooks";
import {
  diffInCalendarDays,
  formatLongDate,
  formatTime,
  parseISODate,
  startOfDay,
} from "@/lib/date";
import { hourLabel } from "@/lib/schedule/summary";
import { isTestInfoType } from "@/lib/school/derive";
import type { Lesson } from "@/lib/types";
import { useCopy } from "@/lib/use-copy";
import { useScheduleUi } from "@/stores/schedule";
import { TEST_LABELS } from "./LessonCard";

const dagen = (n: number) => (n === 1 ? "dag" : "dagen");

function Countdown({ date, now }: { date: string; now: Date }) {
  const days = diffInCalendarDays(parseISODate(date), startOfDay(now));
  const line = useCopy(
    days < 0 ? null : days === 0 ? "radar.vandaag" : days === 1 ? "radar.morgen" : "radar.aftellen",
    { aantal: days, dagen: dagen(days) },
  );
  if (days < 0) return null;
  return <p className="font-display text-lg font-semibold text-ink">{line}</p>;
}

function Notes({ lessonId, test }: { lessonId: string; test: boolean }) {
  const note = useScheduleUi((s) => s.notes[lessonId] ?? "");
  const setNote = useScheduleUi((s) => s.setNote);
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ink">Je notities</span>
      <textarea
        value={note}
        onChange={(event) => setNote(lessonId, event.target.value)}
        rows={4}
        placeholder={
          test
            ? "Wat je nog moet herhalen, welke opgaven lastig waren…"
            : "Wat je niet wilt vergeten van deze les…"
        }
        className="w-full resize-y rounded-2xl border border-line bg-glass px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-3"
      />
      <span className="mt-1 block text-xs text-ink-3">Blijft op dit apparaat.</span>
    </label>
  );
}

/**
 * Fase 3b: alles over één les. Bij een toets: de stof en het aftellen. Notities
 * kun je bij elke les en toets maken (fase 3c), ze blijven op dit apparaat.
 */
export function LessonSheet({
  lesson,
  subject,
  now,
  onClose,
}: {
  lesson: Lesson | null;
  subject: (id: string | null) => SubjectAppearance;
  now: Date | null;
  onClose: () => void;
}) {
  const look = lesson ? subject(lesson.subjectId) : null;
  const test = lesson && isTestInfoType(lesson.infoType) && lesson.status !== "uitval";
  const homework = lesson?.infoType === "huiswerk" && Boolean(lesson.contentHtml?.trim());
  const hour = lesson ? hourLabel(lesson) : null;

  return (
    <Sheet open={lesson !== null} onClose={onClose} title={look?.name ?? "Les"} size="sm">
      {lesson && look && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {lesson.status === "uitval" && <Chip tone="bad">Vervalt</Chip>}
            {lesson.status === "wijziging" && <Chip tone="warn">Gewijzigd</Chip>}
            {test && <Chip tone="accent">📝 {TEST_LABELS[lesson.infoType]}</Chip>}
            {homework && <Chip>Huiswerk</Chip>}
          </div>
          <div className="space-y-1.5 text-sm text-ink-2">
            <p className="first-letter:uppercase">
              {formatLongDate(parseISODate(lesson.date))} · {formatTime(new Date(lesson.start))}–
              {formatTime(new Date(lesson.end))}
              {hour && ` · ${hour}`}
            </p>
            {lesson.location && (
              <p className="flex items-center gap-1.5">
                <MapPin size={15} aria-hidden className="text-ink-3" />
                {lesson.status === "wijziging" && lesson.previousLocation ? (
                  <span>
                    <span className="line-through opacity-70">{lesson.previousLocation}</span> →{" "}
                    <span className="font-semibold text-warn">{lesson.location}</span>
                  </span>
                ) : (
                  lesson.location
                )}
              </p>
            )}
            {lesson.teachers.length > 0 && (
              <p className="flex items-center gap-1.5">
                <User size={15} aria-hidden className="text-ink-3" />
                {lesson.teachers.map((t) => t.name ?? t.code).join(", ")}
              </p>
            )}
          </div>

          {test && now && <Countdown date={lesson.date} now={now} />}

          {lesson.contentHtml?.trim() && (
            <div>
              <h3 className="mb-1.5 text-sm font-semibold text-ink">
                {test ? "Stof" : "Huiswerk"}
              </h3>
              <SafeHtml html={lesson.contentHtml} className="text-sm text-ink-2" />
            </div>
          )}

          <Notes lessonId={lesson.id} test={Boolean(test)} />

          {homework && (
            <Link
              href={`/huiswerk?item=hw-${lesson.id}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-ink hover:underline"
            >
              Naar je huiswerk <ArrowRight size={15} aria-hidden />
            </Link>
          )}
        </div>
      )}
    </Sheet>
  );
}
