"use client";

import { motion, useReducedMotion } from "framer-motion";
import { BookCheck, MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SubjectBadge } from "@/components/subjects/SubjectBadge";
import { Chip } from "@/components/ui/Chip";
import { cn } from "@/lib/cn";
import type { SubjectAppearance } from "@/lib/data/hooks";
import { formatTime } from "@/lib/date";
import { hourLabel } from "@/lib/schedule/summary";
import { isTestInfoType } from "@/lib/school/derive";
import type { Lesson, LessonInfoType } from "@/lib/types";
import { useDataSource } from "@/lib/data/context";
import { scheduleKey, useScheduleUi } from "@/stores/schedule";

export const TEST_LABELS: Partial<Record<LessonInfoType, string>> = {
  toets: "Toets",
  tentamen: "Tentamen",
  schriftelijk: "SO",
  mondeling: "Mondeling",
};

/**
 * De schuine "VERVALLEN"-stempel. De eerste keer dat je hem ziet valt hij er
 * met een klap op; daarna staat hij er gewoon.
 */
function Stamp({ lessonId, small }: { lessonId: string; small?: boolean }) {
  const reduced = useReducedMotion();
  const key = scheduleKey(useDataSource().id, lessonId);
  const stamped = useScheduleUi((s) => s.stamped.includes(key));
  const stamp = useScheduleUi((s) => s.stamp);
  // Bij de eerste render bepalen we of hij moet vallen; daarna niet meer.
  const [animate] = useState(() => !stamped && !reduced);

  useEffect(() => {
    if (!stamped) stamp(key);
  }, [stamped, stamp, key]);

  return (
    <motion.span
      aria-hidden
      className={cn(
        "pointer-events-none absolute top-1/2 left-1/2 rounded-lg border-[3px] border-bad px-2 font-card tracking-[0.18em] text-bad uppercase",
        "bg-[color-mix(in_oklab,var(--sm-bg)_55%,transparent)] shadow-[0_0_0_1px_color-mix(in_oklab,var(--sm-bad)_25%,transparent)]",
        small ? "py-0 text-sm" : "py-0.5 text-xl",
      )}
      style={{ x: "-50%", y: "-50%" }}
      initial={
        animate ? { scale: 2.4, rotate: -24, opacity: 0 } : { scale: 1, rotate: -12, opacity: 0.92 }
      }
      animate={{ scale: 1, rotate: -12, opacity: 0.92 }}
      transition={
        animate
          ? { type: "spring", stiffness: 520, damping: 16, mass: 0.7, delay: 0.15 }
          : { duration: 0 }
      }
    >
      Vervallen
    </motion.span>
  );
}

/** Na zoveel milliseconden in beeld telt een gewijzigde les als gezien. */
const SEEN_AFTER = 2500;

function useSeenAfter(active: boolean, onSeen: () => void) {
  const ref = useRef<HTMLElement | null>(null);
  // De nieuwste callback, zonder dat de timer bij elke render opnieuw begint.
  const callback = useRef(onSeen);
  useEffect(() => {
    callback.current = onSeen;
  });
  useEffect(() => {
    const node = ref.current;
    if (!active || !node || typeof IntersectionObserver === "undefined") return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) timer ??= setTimeout(() => callback.current(), SEEN_AFTER);
        else if (timer) {
          clearTimeout(timer);
          timer = null;
        }
      },
      { threshold: 0.6 },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [active]);
  return ref;
}

interface LessonCardProps {
  lesson: Lesson;
  subject: SubjectAppearance;
  /** Er staat huiswerk bij deze les. */
  hasHomework?: boolean;
  isNow?: boolean;
  /** Gewijzigd en nog niet gezien: pulserende rand. */
  unseen?: boolean;
  onSeen?: () => void;
  /** Kleine kaart (weekweergave): minder tekst, zelfde signalen. */
  compact?: boolean;
  onOpen: () => void;
  className?: string;
  style?: React.CSSProperties;
}

/** Fase 3b: een les als kaart in vakkleur. */
export function LessonCard({
  lesson,
  subject,
  hasHomework = false,
  isNow = false,
  unseen = false,
  onSeen,
  compact = false,
  onOpen,
  className,
  style,
}: LessonCardProps) {
  const cancelled = lesson.status === "uitval";
  const moved = lesson.status === "wijziging";
  const test = !cancelled && isTestInfoType(lesson.infoType) ? TEST_LABELS[lesson.infoType] : null;
  const teachers = lesson.teachers.map((t) => t.code).join(", ");
  const hour = hourLabel(lesson);
  const seenRef = useSeenAfter(unseen, () => onSeen?.());
  const time = `${formatTime(new Date(lesson.start))}–${formatTime(new Date(lesson.end))}`;

  return (
    <button
      ref={(node) => {
        seenRef.current = node;
      }}
      type="button"
      onClick={onOpen}
      aria-label={[
        subject.name,
        time,
        hour,
        lesson.location ? `lokaal ${lesson.location}` : null,
        teachers ? `docent ${teachers}` : null,
        cancelled ? "vervalt" : null,
        moved && lesson.previousLocation ? `verplaatst van ${lesson.previousLocation}` : null,
        test ? `${test.toLowerCase() === "so" ? "SO" : test.toLowerCase()}` : null,
        hasHomework ? "huiswerk" : null,
        unseen ? "gewijzigd" : null,
      ]
        .filter(Boolean)
        .join(", ")}
      className={cn(
        "group relative flex w-full overflow-hidden rounded-2xl border text-left transition-[transform,box-shadow,filter] duration-200 hover:-translate-y-px focus-visible:-translate-y-px",
        compact ? "flex-col gap-0.5 p-2" : "items-center gap-3 p-3",
        cancelled ? "border-line bg-glass grayscale" : "border-transparent",
        test &&
          "shadow-[0_0_0_1.5px_color-mix(in_oklab,var(--sm-accent)_75%,transparent),0_0_22px_-4px_color-mix(in_oklab,var(--sm-accent)_70%,transparent)]",
        isNow && !test && "shadow-[0_0_0_1.5px_var(--lesson)]",
        unseen && "animate-[changed-pulse_1.6s_ease-in-out_infinite] motion-reduce:animate-none",
        className,
      )}
      style={{
        ...style,
        ["--lesson" as string]: subject.color,
        background: cancelled
          ? undefined
          : `linear-gradient(135deg, color-mix(in oklab, ${subject.color} 24%, transparent), color-mix(in oklab, ${subject.color} 10%, transparent))`,
      }}
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1"
        style={{ background: cancelled ? "var(--sm-line-strong)" : subject.color }}
      />
      {!compact && <SubjectBadge subject={subject} className={cn(cancelled && "opacity-50")} />}
      <span className={cn("min-w-0 flex-1", cancelled && "opacity-60", compact && "pl-1")}>
        <span className="flex items-center gap-1.5">
          <span
            className={cn(
              "truncate font-semibold text-ink",
              compact ? "text-[0.8125rem]" : "text-[0.9375rem]",
              cancelled && "line-through decoration-2",
            )}
          >
            {compact ? subject.code || subject.name : subject.name}
          </span>
          {isNow && !compact && <Chip tone="accent">Nu</Chip>}
          {compact && (test || (hasHomework && !cancelled)) && (
            <span aria-hidden className="ml-auto flex shrink-0 items-center gap-1 text-[0.6875rem]">
              {test && <span>📝</span>}
              {hasHomework && !cancelled && <BookCheck size={11} className="text-ink-2" />}
            </span>
          )}
        </span>
        {compact ? (
          <span className="block truncate text-[0.6875rem] text-ink-2">
            {formatTime(new Date(lesson.start))}
            {lesson.location && (
              <>
                {" · "}
                <span className={cn(moved && lesson.previousLocation && "font-semibold text-warn")}>
                  {lesson.location}
                </span>
              </>
            )}
          </span>
        ) : (
          <>
            <span className="block truncate text-sm text-ink-2">
              {time}
              {hour && <span className="text-ink-3"> · {hour}</span>}
            </span>
            <span className="flex items-center gap-1 truncate text-sm text-ink-2">
              {lesson.location && (
                <>
                  <MapPin size={13} aria-hidden className="shrink-0 text-ink-3" />
                  {moved && lesson.previousLocation ? (
                    <span className="font-semibold text-warn">
                      <span className="font-normal line-through opacity-70">
                        {lesson.previousLocation}
                      </span>
                      {" → "}
                      {lesson.location}
                    </span>
                  ) : (
                    <span>{lesson.location}</span>
                  )}
                </>
              )}
              {teachers && <span className="text-ink-3">· {teachers}</span>}
            </span>
          </>
        )}
      </span>
      {!compact && (test || hasHomework) && (
        <span className="flex shrink-0 flex-col items-end gap-1">
          {test && <Chip tone="accent">📝 {test}</Chip>}
          {hasHomework && !cancelled && (
            <Chip title="Huiswerk" className="px-1.5">
              <BookCheck size={13} aria-hidden />
              <span className="sr-only">Huiswerk</span>
            </Chip>
          )}
        </span>
      )}
      {cancelled && <Stamp lessonId={lesson.id} small={compact} />}
    </button>
  );
}
