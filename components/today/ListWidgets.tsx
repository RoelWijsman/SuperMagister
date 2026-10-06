"use client";

import { ListChecks } from "lucide-react";
import Link from "next/link";
import { SubjectDot } from "@/components/subjects/SubjectBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Widget } from "@/components/ui/Widget";
import type { SubjectAppearance } from "@/lib/data/hooks";
import type { Homework } from "@/lib/types";
import { useCopy } from "@/lib/use-copy";

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

/** Huiswerk voor de volgende schooldag. */
export function HomeworkTomorrowWidget({
  items,
  dayLabel,
  subject,
  isLoading,
}: {
  items: Homework[];
  dayLabel: string;
  subject: SubjectLookup;
  isLoading: boolean;
}) {
  const empty = useCopy(!isLoading && items.length === 0 ? "leeg.huiswerkMorgen" : null);
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
        <ul className="space-y-3">
          {items.map((item) => {
            const look = subject(item.subjectId);
            return (
              <li key={item.id} className="flex gap-3">
                <SubjectDot color={look.color} className="mt-1.5" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">
                    {look.name}
                    {item.isTest && (
                      <span className="ml-1.5 text-xs font-medium text-accent-ink">📝 toets</span>
                    )}
                  </p>
                  <p className="line-clamp-2 text-sm text-ink-2">{item.text}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Widget>
  );
}
