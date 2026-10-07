"use client";

import { ListChecks } from "lucide-react";
import Link from "next/link";
import { CheckButton } from "@/components/homework/CheckButton";
import { SubjectDot } from "@/components/subjects/SubjectBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Widget } from "@/components/ui/Widget";
import type { SubjectAppearance } from "@/lib/data/hooks";
import { cn } from "@/lib/cn";
import { formatDuration } from "@/lib/date";
import type { HomeworkItem } from "@/lib/homework/overview";
import { useCopy, useCopyParts } from "@/lib/use-copy";

type SubjectLookup = (id: string | null) => SubjectAppearance;

function RowsSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

const MoreLink = ({ href, children }: { href: string; children: string }) => (
  <Link href={href} className="text-sm font-medium text-accent-ink hover:underline">
    {children}
  </Link>
);

/** Huiswerk voor de volgende schooldag, met afvinken en de totale tijd (fase 3c). */
export function HomeworkTomorrowWidget({
  items,
  dayLabel,
  subject,
  isLoading,
  onCheckedChange,
}: {
  items: HomeworkItem[];
  dayLabel: string;
  subject: SubjectLookup;
  isLoading: boolean;
  onCheckedChange: (item: HomeworkItem, checked: boolean) => void;
}) {
  const empty = useCopy(!isLoading && items.length === 0 ? "leeg.huiswerkMorgen" : null);
  const open = items.filter((item) => !item.isDone);
  const minutes = open.reduce((sum, item) => sum + item.minutes, 0);
  const allDone = useCopyParts(
    !isLoading && items.length > 0 && open.length === 0 ? "huiswerk.allesAf" : null,
    { dag: dayLabel },
  );
  return (
    <Widget
      title={`Huiswerk voor ${dayLabel}`}
      icon={ListChecks}
      action={<MoreLink href="/huiswerk">Alles</MoreLink>}
    >
      {isLoading ? (
        <RowsSkeleton rows={3} />
      ) : items.length === 0 ? (
        <p className="py-4 text-ink-2">{empty}</p>
      ) : (
        <>
          <p className="mb-3 text-sm text-ink-3">
            {allDone ? (
              <span className="font-medium text-good">{allDone.title}</span>
            ) : (
              <>
                Nog {open.length} open · ±{formatDuration(minutes)}
              </>
            )}
          </p>
          <ul className="space-y-3">
            {items.map((item) => {
              const look = subject(item.subjectId);
              return (
                <li key={item.id} className="flex gap-3">
                  <CheckButton
                    size="sm"
                    checked={item.isDone}
                    onCheckedChange={(checked) => onCheckedChange(item, checked)}
                    label={`${look.name}: ${item.text || "huiswerk"}`}
                  />
                  <div
                    className={cn("min-w-0 flex-1 transition-opacity", item.isDone && "opacity-60")}
                  >
                    <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                      <SubjectDot color={look.color} />
                      <span className={cn(item.isDone && "line-through decoration-2")}>
                        {look.name}
                      </span>
                      {item.isTest && (
                        <span className="text-xs font-medium text-accent-ink">📝 toets</span>
                      )}
                      <span className="ml-auto pl-2 text-xs font-normal text-ink-3 tabular-nums">
                        ±{formatDuration(item.minutes)}
                      </span>
                    </p>
                    <p className="line-clamp-2 text-sm text-ink-2">{item.text}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Widget>
  );
}
