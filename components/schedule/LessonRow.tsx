import { BookCheck, MapPin } from "lucide-react";
import { SubjectBadge } from "@/components/subjects/SubjectBadge";
import { Chip } from "@/components/ui/Chip";
import { cn } from "@/lib/cn";
import type { SubjectAppearance } from "@/lib/data/hooks";
import { formatTime } from "@/lib/date";
import type { Lesson, LessonInfoType } from "@/lib/types";

const TEST_LABELS: Partial<Record<LessonInfoType, string>> = {
  toets: "Toets",
  tentamen: "Tentamen",
  schriftelijk: "SO",
  mondeling: "Mondeling",
};

export function hourLabel(lesson: Lesson): string | null {
  if (lesson.hourFrom === null) return null;
  if (lesson.hourTo === null || lesson.hourTo === lesson.hourFrom) return `${lesson.hourFrom}e uur`;
  return `${lesson.hourFrom}e–${lesson.hourTo}e uur`;
}

interface LessonRowProps {
  lesson: Lesson;
  subject: SubjectAppearance;
  /** Deze les is nu bezig. */
  isNow?: boolean;
  className?: string;
}

/** Eén les: tijd, vak, lokaal, docent en labels voor uitval, wijziging, toets en huiswerk. */
export function LessonRow({ lesson, subject, isNow, className }: LessonRowProps) {
  const cancelled = lesson.status === "uitval";
  const moved = lesson.status === "wijziging";
  const test = TEST_LABELS[lesson.infoType];
  const teachers = lesson.teachers.map((t) => t.code).join(", ");
  const hour = hourLabel(lesson);

  return (
    <li
      className={cn(
        "relative flex items-center gap-3 rounded-2xl px-2.5 py-2.5 sm:px-3",
        isNow &&
          "bg-glass-strong shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--sm-accent)_40%,transparent)]",
        className,
      )}
    >
      <div className="w-12 shrink-0 text-right">
        <p
          className={cn(
            "text-sm font-semibold tabular-nums",
            cancelled ? "text-ink-3" : "text-ink",
          )}
        >
          {formatTime(new Date(lesson.start))}
        </p>
        {hour && <p className="text-[0.6875rem] text-ink-3">{hour}</p>}
      </div>
      <SubjectBadge subject={subject} className={cn(cancelled && "opacity-45 grayscale")} />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate font-medium",
            cancelled ? "text-ink-3 line-through decoration-bad decoration-2" : "text-ink",
          )}
        >
          {subject.name}
        </p>
        <p className="flex items-center gap-1 truncate text-sm text-ink-2">
          {lesson.location && (
            <>
              <MapPin size={13} aria-hidden className="shrink-0 text-ink-3" />
              <span className={cn(moved && "font-semibold text-warn")}>{lesson.location}</span>
            </>
          )}
          {teachers && <span className="text-ink-3">· {teachers}</span>}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
        {isNow && <Chip tone="accent">Nu</Chip>}
        {cancelled && <Chip tone="bad">Uitval</Chip>}
        {moved && lesson.previousLocation && (
          <Chip
            tone="warn"
            title={`Lokaal gewijzigd: ${lesson.previousLocation} → ${lesson.location}`}
          >
            <span className="hidden sm:inline">{lesson.previousLocation} →</span> {lesson.location}
          </Chip>
        )}
        {test && !cancelled && <Chip tone="accent">📝 {test}</Chip>}
        {lesson.infoType === "huiswerk" && !cancelled && (
          <Chip title="Huiswerk" className="px-1.5">
            <BookCheck size={13} aria-hidden />
            <span className="sr-only">Huiswerk</span>
          </Chip>
        )}
      </div>
    </li>
  );
}
