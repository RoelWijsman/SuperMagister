"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import type { SubjectAppearance } from "@/lib/data/hooks";
import { formatDuration } from "@/lib/date";
import { OWN_MAX, OWN_MIN } from "@/lib/homework/estimate";
import type { HomeworkItem } from "@/lib/homework/overview";
import { useHomeworkActions } from "@/lib/homework/use-homework";

const STEP = 5;

const SOURCE_TEXT: Record<HomeworkItem["minutesSource"], (vak: string) => string> = {
  schatting: () => "Geschat uit de opdracht.",
  vak: (vak) => `Jouw standaard voor ${vak}.`,
  eigen: () => "Jouw eigen tijd voor dit huiswerk.",
};

/** Fase 3c: de tijd voor één item aanpassen, of als standaard voor het vak. */
export function MinutesSheet({
  item,
  subject,
  onClose,
}: {
  item: HomeworkItem | null;
  subject: (id: string | null) => SubjectAppearance;
  onClose: () => void;
}) {
  const actions = useHomeworkActions();
  const look = item ? subject(item.subjectId) : null;
  const set = (minutes: number) => {
    if (!item) return;
    actions.setMinutes(item.id, Math.min(OWN_MAX, Math.max(OWN_MIN, minutes)));
  };

  return (
    <Sheet open={item !== null} onClose={onClose} title="Hoe lang duurt dit?" size="sm">
      {item && look && (
        <div className="space-y-5">
          <p className="line-clamp-2 text-sm text-ink-2">
            <span className="font-semibold text-ink">{look.name}</span> · {item.text}
          </p>

          <div className="flex items-center justify-center gap-5">
            <Button
              variant="glass"
              size="icon"
              icon={Minus}
              aria-label="Vijf minuten korter"
              disabled={item.minutes <= OWN_MIN}
              onClick={() => set(item.minutes - STEP)}
            />
            <p
              className="min-w-32 text-center font-display text-4xl font-semibold text-ink tabular-nums"
              aria-live="polite"
            >
              {formatDuration(item.minutes)}
            </p>
            <Button
              variant="glass"
              size="icon"
              icon={Plus}
              aria-label="Vijf minuten langer"
              disabled={item.minutes >= OWN_MAX}
              onClick={() => set(item.minutes + STEP)}
            />
          </div>
          <p className="text-center text-sm text-ink-3">
            {SOURCE_TEXT[item.minutesSource](look.name)}
          </p>

          <div className="flex flex-wrap justify-center gap-2">
            {!item.isTest && item.subjectId && (
              <Button
                variant="glass"
                size="sm"
                onClick={() => {
                  actions.setSubjectMinutes(item.subjectId!, item.minutes);
                  actions.setMinutes(item.id, null);
                }}
              >
                Standaard voor {look.name}
              </Button>
            )}
            {item.minutesSource === "eigen" && (
              <Button variant="ghost" size="sm" onClick={() => actions.setMinutes(item.id, null)}>
                Eigen tijd wissen
              </Button>
            )}
          </div>
          <p className="text-xs text-ink-3">
            Je standaard per vak geldt voor huiswerk, niet voor toetsen. Aanpassen kan ook bij
            Instellingen → Huiswerk.
          </p>
        </div>
      )}
    </Sheet>
  );
}
