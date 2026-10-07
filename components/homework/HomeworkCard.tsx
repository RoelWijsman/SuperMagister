"use client";

import { Clock, Hand } from "lucide-react";
import { SubjectBadge } from "@/components/subjects/SubjectBadge";
import { Chip } from "@/components/ui/Chip";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { SafeHtml } from "@/components/ui/SafeHtml";
import { cn } from "@/lib/cn";
import type { SubjectAppearance } from "@/lib/data/hooks";
import { formatDuration } from "@/lib/date";
import type { HomeworkItem } from "@/lib/homework/overview";
import { CheckButton } from "./CheckButton";

/** Fase 3c: één huiswerkitem met afvinken, de tijd en "ik heb geen zin". */
export function HomeworkCard({
  item,
  subject,
  meta,
  focused = false,
  onCheckedChange,
  onTime,
  onNoZin,
}: {
  item: HomeworkItem;
  subject: SubjectAppearance;
  /** "morgen · 2e uur" */
  meta: string;
  focused?: boolean;
  onCheckedChange: (checked: boolean) => void;
  onTime: () => void;
  onNoZin: () => void;
}) {
  const done = item.isDone;
  return (
    <GlassPanel
      as="li"
      id={item.id}
      data-due={item.dueDate}
      className={cn(
        "relative flex scroll-mt-28 gap-3.5 transition-opacity duration-300",
        done && "opacity-65",
        focused &&
          "shadow-[inset_0_0_0_1.5px_color-mix(in_oklab,var(--sm-accent)_60%,transparent),var(--sm-shadow)]",
      )}
    >
      <span
        aria-hidden
        className="absolute inset-y-5 left-0 w-1 rounded-r-full"
        style={{ background: subject.color }}
      />
      <CheckButton
        checked={done}
        onCheckedChange={onCheckedChange}
        label={`${subject.name}: ${item.text || "huiswerk"}`}
        className="mt-0.5 self-start"
      />
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className={cn("font-semibold text-ink", done && "line-through decoration-2")}>
            {subject.name}
          </p>
          <p className="text-sm text-ink-3">{meta}</p>
          {item.isTest && <Chip tone="accent">📝 Toets</Chip>}
          {item.status === "bezig" && <Chip tone="warn">Bezig</Chip>}
        </div>
        <SafeHtml
          html={item.html}
          className={cn("text-[0.9375rem] text-ink-2", done && "line-clamp-2")}
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onTime}
            title="Tijd aanpassen"
            aria-label={`Ongeveer ${formatDuration(item.minutes)}. Tijd aanpassen`}
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line bg-glass px-3 text-sm text-ink-2 tabular-nums transition-colors hover:bg-glass-strong hover:text-ink"
          >
            <Clock size={14} aria-hidden />±{formatDuration(item.minutes)}
            {item.minutesSource !== "schatting" && (
              <span className="text-xs text-ink-3">
                ({item.minutesSource === "eigen" ? "eigen" : "vak"})
              </span>
            )}
          </button>
          {!done && (
            <button
              type="button"
              onClick={onNoZin}
              className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-ink-2 transition-colors hover:bg-glass hover:text-ink"
            >
              <Hand size={14} aria-hidden />
              Ik heb geen zin
            </button>
          )}
        </div>
      </div>
      <SubjectBadge subject={subject} className="hidden sm:grid" />
    </GlassPanel>
  );
}
