"use client";

import { cn } from "@/lib/cn";
import { useLastUpdated } from "@/lib/data/hooks";
import { formatTime } from "@/lib/date";
import { useNow } from "@/lib/hooks";
import { formatMoment } from "@/lib/koppelen/format";
import { getSessionStore, useSession, useSessionStatus } from "@/lib/koppelen/runtime";
import type { SessionStatus } from "@/lib/koppelen/session";

export const STATUS_TONE: Record<SessionStatus, string> = {
  geldig: "bg-good",
  "bijna-verlopen": "bg-warn",
  verlopen: "bg-bad",
  geen: "bg-bad",
};

/** Een stipje: groen gekoppeld, oranje bijna verlopen, rood verlopen. */
export function StatusDot({ status, className }: { status: SessionStatus; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block size-2 shrink-0 rounded-full",
        STATUS_TONE[status],
        status === "geldig" &&
          "shadow-[0_0_0_3px_color-mix(in_oklab,var(--sm-good)_25%,transparent)]",
        className,
      )}
    />
  );
}

/** Hoe de koppeling ervoor staat, in gewone taal. */
export function useConnectionStatusText(): { status: SessionStatus; text: string } {
  const status = useSessionStatus();
  const { session } = useSession();
  const until = session?.expiresAt ? formatTime(new Date(session.expiresAt)) : null;
  if (status === "geldig" && getSessionStore().autoRenews())
    return { status, text: "vernieuwt zichzelf" };
  switch (status) {
    case "geldig":
      return { status, text: until ? `geldig tot ${until}` : "geldig" };
    case "bijna-verlopen":
      return { status, text: `verloopt om ${until}` };
    case "verlopen":
      return { status, text: "verlopen, koppel opnieuw" };
    case "geen":
      return { status, text: "niet actief in dit tabblad" };
  }
}

/** Laatste update en de stand van de koppeling, voor de chip, Instellingen en /koppelen. */
export function ConnectionFacts({ className }: { className?: string }) {
  const now = useNow(30_000);
  const lastUpdated = useLastUpdated();
  const { status, text } = useConnectionStatusText();
  return (
    <dl className={cn("grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm", className)}>
      <dt className="text-ink-3">Laatste update</dt>
      <dd className="text-ink tabular-nums">
        {lastUpdated.data && now ? formatMoment(lastUpdated.data, now) : "nog niet"}
      </dd>
      <dt className="text-ink-3">Koppeling</dt>
      <dd className="flex items-center gap-2 text-ink">
        <StatusDot status={status} />
        {text}
      </dd>
    </dl>
  );
}
