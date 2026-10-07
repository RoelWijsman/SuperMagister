"use client";

import {
  Ban,
  Clock,
  MapPin,
  MinusCircle,
  PlusCircle,
  RotateCcw,
  User,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { cn } from "@/lib/cn";
import { formatShortDate, parseISODate } from "@/lib/date";
import { formatChange, type ChangeKind, type ScheduleChange } from "@/lib/schedule/changes";
import { useCopy } from "@/lib/use-copy";

const KIND_ICONS: Record<ChangeKind, { icon: LucideIcon; tone: string }> = {
  uitval: { icon: Ban, tone: "text-bad" },
  terug: { icon: RotateCcw, tone: "text-good" },
  lokaal: { icon: MapPin, tone: "text-warn" },
  tijd: { icon: Clock, tone: "text-warn" },
  docent: { icon: User, tone: "text-warn" },
  extra: { icon: PlusCircle, tone: "text-accent-ink" },
  verdwenen: { icon: MinusCircle, tone: "text-ink-3" },
};

/** Eén regel: icoon per soort, de wijziging in gewone taal en een stip als hij nieuw is. */
export function ChangeLine({
  change,
  subjectName,
  unseen,
  onPick,
}: {
  change: ScheduleChange;
  subjectName: (id: string | null) => string;
  unseen: boolean;
  onPick?: () => void;
}) {
  const { icon: Icon, tone } = KIND_ICONS[change.kind];
  const text = formatChange(change, subjectName);
  const body = (
    <>
      <Icon size={17} aria-hidden className={cn("mt-0.5 shrink-0", tone)} />
      <span className="flex-1 text-sm text-ink">{text}</span>
      <span className="mt-0.5 shrink-0 text-xs text-ink-3 tabular-nums">
        {formatShortDate(parseISODate(change.date))}
      </span>
      {unseen && (
        <span className="mt-1.5 size-2 shrink-0 rounded-full bg-warn">
          <span className="sr-only">nieuw</span>
        </span>
      )}
    </>
  );
  return onPick ? (
    <button
      type="button"
      onClick={onPick}
      className="flex w-full items-start gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-glass"
    >
      {body}
    </button>
  ) : (
    <div className="flex items-start gap-3 px-2 py-2.5">{body}</div>
  );
}

/** Fase 3b: "Wat is er veranderd?" Alle roosterwijzigingen voor vandaag en later. */
export function ChangesSheet({
  open,
  onClose,
  changes,
  unseen,
  subjectName,
  onPick,
  onAllSeen,
  onClear,
}: {
  open: boolean;
  onClose: () => void;
  changes: readonly ScheduleChange[];
  unseen: ReadonlySet<string>;
  subjectName: (id: string | null) => string;
  onPick: (change: ScheduleChange) => void;
  onAllSeen: () => void;
  onClear: () => void;
}) {
  const empty = useCopy(open && changes.length === 0 ? "rooster.wijzigingen.leeg" : null);
  const sorted = [...changes].sort(
    (a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start),
  );
  const anyUnseen = changes.some((change) => unseen.has(change.lessonId));

  return (
    <Sheet open={open} onClose={onClose} title="Wat is er veranderd?" size="sm">
      {sorted.length === 0 ? (
        <p className="py-2 text-ink-2">{empty}</p>
      ) : (
        <>
          <ul className="-mx-2 divide-y divide-line">
            {sorted.map((change) => (
              <li key={change.id}>
                <ChangeLine
                  change={change}
                  subjectName={subjectName}
                  unseen={unseen.has(change.lessonId)}
                  onPick={() => onPick(change)}
                />
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-ink-3">
            Tik op een wijziging om naar die dag te gaan. Een oranje stip is nieuw.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {anyUnseen && (
              <Button variant="glass" size="sm" onClick={onAllSeen}>
                Alles gezien
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClear}>
              Lijst wissen
            </Button>
          </div>
        </>
      )}
    </Sheet>
  );
}
