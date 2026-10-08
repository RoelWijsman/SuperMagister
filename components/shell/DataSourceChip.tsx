"use client";

import { Plug, Settings } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ConnectionFacts, StatusDot } from "@/components/koppelen/ConnectionFacts";
import { useRelink } from "@/components/koppelen/SessionWatcher";
import { Button, LinkButton } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { cn } from "@/lib/cn";
import { useDataSource } from "@/lib/data/context";
import { useAccount, useEnrollments } from "@/lib/data/hooks";
import { useIsClient } from "@/lib/hooks";
import { useSessionStatus } from "@/lib/koppelen/runtime";
import { useConnection } from "@/stores/connection";

/**
 * Laat altijd zien of je gekoppeld bent: "Gekoppeld met {school}" met een
 * stipje voor de stand van je koppeling, of een knop naar de koppelpagina.
 */
export function DataSourceChip({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  const isClient = useIsClient();
  const source = useDataSource();
  const [open, setOpen] = useState(false);
  const linked = source.kind === "magister";
  const status = useSessionStatus();
  // Een ouder schooljaar terugkijken: dat zie je ook aan de chip.
  const enrollmentId = useConnection((s) => s.enrollmentId);
  const enrollments = useEnrollments();
  const archiveYear =
    linked && enrollmentId !== null
      ? (enrollments.data?.find((e) => e.id === enrollmentId)?.label ?? null)
      : null;
  const label = archiveYear ? `${source.label} · ${archiveYear}` : source.label;
  const chip =
    "group inline-flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-xs font-bold tracking-[0.12em] uppercase transition-[colors,opacity]";

  // Niet gekoppeld: de chip brengt je naar de koppelpagina.
  if (!linked)
    return (
      <Link
        href="/koppelen"
        aria-label="Koppelen: je bent nog niet gekoppeld met Magister"
        className={cn(
          chip,
          "border-[color-mix(in_oklab,var(--sm-warn)_45%,transparent)] bg-[color-mix(in_oklab,var(--sm-warn)_12%,transparent)] text-warn hover:border-warn",
          !isClient && "opacity-0",
          className,
        )}
      >
        <Plug size={14} strokeWidth={2.4} />
        {!compact && "Koppelen"}
      </Link>
    );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Gekoppeld met ${label}`}
        className={cn(
          chip,
          "border-line bg-glass text-ink-2 hover:border-line-strong",
          !isClient && "opacity-0",
          className,
        )}
      >
        <span className="relative">
          <Plug size={14} />
          <StatusDot status={status} className="absolute -top-0.5 -right-1 size-1.5" />
        </span>
        {!compact && label}
      </button>
      <LinkedSheet
        open={open}
        onClose={() => setOpen(false)}
        school={source.label}
        archiveYear={archiveYear}
      />
    </>
  );
}

function LinkedSheet({
  open,
  onClose,
  school,
  archiveYear,
}: {
  open: boolean;
  onClose: () => void;
  school: string;
  archiveYear: string | null;
}) {
  const account = useAccount();
  const status = useSessionStatus();
  const showRelink = useRelink((s) => s.show);
  const needsLink = status === "verlopen" || status === "geen";
  const who = [account.data?.fullName, account.data?.studyLabel].filter(Boolean).join(" · ");

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={`Gekoppeld met ${school}`}
      description={
        archiveYear
          ? `Je kijkt terug naar schooljaar ${archiveYear}. Terug naar nu kan in Instellingen.`
          : who
            ? `Je ziet je eigen Magister: ${who}.`
            : "Je ziet je eigen Magister."
      }
      size="sm"
    >
      <ConnectionFacts />
      <p className="mt-4 text-sm text-ink-3">
        Wat je ziet, staat ook op dit apparaat. Zo blijft het zichtbaar als je koppeling verloopt.
        Elk kwartier haalt de app nieuwe gegevens op, zolang hij open staat.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        {needsLink ? (
          <Button
            variant="primary"
            icon={Plug}
            onClick={() => {
              onClose();
              showRelink();
            }}
          >
            Opnieuw koppelen
          </Button>
        ) : (
          <LinkButton href="/koppelen" variant="glass" icon={Plug} onClick={onClose}>
            Koppeling
          </LinkButton>
        )}
        <LinkButton href="/instellingen#gegevens" variant="ghost" icon={Settings} onClick={onClose}>
          Instellingen
        </LinkButton>
      </div>
    </Sheet>
  );
}
