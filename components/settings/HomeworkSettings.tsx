"use client";

import { ChevronDown } from "lucide-react";
import { SubjectDot } from "@/components/subjects/SubjectBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { useSubjectAppearance } from "@/lib/data/hooks";
import { formatDuration } from "@/lib/date";
import { useHomeworkActions, useHomeworkPrefs } from "@/lib/homework/use-homework";

const CHOICES = [10, 15, 20, 25, 30, 40, 45, 60, 90];

/**
 * Fase 3c: je standaardtijd per vak. Geldt voor huiswerk (niet voor leren voor
 * een toets); "Schatting" laat de app het uit de opdracht halen.
 */
export function HomeworkSettings() {
  const { subjects, get, isReady } = useSubjectAppearance();
  const prefs = useHomeworkPrefs();
  const actions = useHomeworkActions();

  if (!isReady) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-full" />
        ))}
      </div>
    );
  }

  return (
    <ul className="divide-y divide-line">
      {subjects.map((subject) => {
        const look = get(subject.id);
        const current = prefs.subjects[subject.id];
        const options =
          current !== undefined && !CHOICES.includes(current)
            ? [...CHOICES, current].sort((a, b) => a - b)
            : CHOICES;
        return (
          <li key={subject.id} className="flex items-center justify-between gap-3 py-2">
            <span className="flex min-w-0 items-center gap-2.5 font-medium text-ink">
              <SubjectDot color={look.color} />
              <span className="truncate">{look.name}</span>
            </span>
            <label className="relative shrink-0">
              <span className="sr-only">Standaardtijd voor {look.name}</span>
              <select
                value={current ?? ""}
                onChange={(event) =>
                  actions.setSubjectMinutes(
                    subject.id,
                    event.target.value ? Number(event.target.value) : null,
                  )
                }
                className="h-10 cursor-pointer appearance-none rounded-full glass pr-9 pl-4 text-sm font-medium text-ink outline-offset-2"
              >
                <option value="">Schatting</option>
                {options.map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {formatDuration(minutes)}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                aria-hidden
                className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-ink-3"
              />
            </label>
          </li>
        );
      })}
    </ul>
  );
}
