"use client";

import { FlaskConical, Plug, Settings } from "lucide-react";
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
 * Laat altijd zien welke data je ziet: de gestreepte DEMO-chip, of
 * "Gekoppeld met {school}" met een stipje voor de stand van je koppeling.
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
  const isDemo = source.kind === "demo";
  const status = useSessionStatus();
  // Een ouder schooljaar terugkijken: dat zie je ook aan de chip.
  const enrollmentId = useConnection((s) => s.enrollmentId);
  const enrollments = useEnrollments();
  const archiveYear =
    !isDemo && enrollmentId !== null
      ? (enrollments.data?.find((e) => e.id === enrollmentId)?.label ?? null)
      : null;
  const label = archiveYear ? `${source.label} · ${archiveYear}` : source.label;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={isDemo ? "Je bekijkt demo-data. Meer uitleg" : `Gekoppeld met ${label}`}
        className={cn(
          "group inline-flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-xs font-bold tracking-[0.12em] uppercase transition-[colors,opacity]",
          isDemo
            ? "border-[color-mix(in_oklab,var(--sm-warn)_45%,transparent)] bg-[repeating-linear-gradient(-45deg,color-mix(in_oklab,var(--sm-warn)_22%,transparent)_0_6px,color-mix(in_oklab,var(--sm-warn)_8%,transparent)_6px_12px)] text-warn hover:border-warn"
            : "border-line bg-glass text-ink-2 hover:border-line-strong",
          // Tot na de hydratie weten we nog niet of je gekoppeld bent: geen DEMO-flits.
          !isClient && "opacity-0",
          className,
        )}
      >
        {isDemo ? (
          <FlaskConical size={14} strokeWidth={2.4} />
        ) : (
          <span className="relative">
            <Plug size={14} />
            <StatusDot status={status} className="absolute -top-0.5 -right-1 size-1.5" />
          </span>
        )}
        {!compact && (isDemo ? "Demo" : label)}
      </button>

      {isDemo ? (
        <DemoSheet open={open} onClose={() => setOpen(false)} />
      ) : (
        <LinkedSheet
          open={open}
          onClose={() => setOpen(false)}
          school={source.label}
          archiveYear={archiveYear}
        />
      )}
    </>
  );
}

function DemoSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Je bekijkt de demo"
      description="Alles wat je nu ziet is verzonnen, zodat je de app veilig kunt uitproberen."
      size="sm"
    >
      <div className="space-y-3 text-ink-2">
        <p>
          Je kijkt mee met <strong className="text-ink">Daan Visser</strong> uit 5 havo op het
          (niet-bestaande) Noorderlicht College: 12 vakken, een volle week rooster, toetsen,
          huiswerk en een pack met nieuwe cijfers.
        </p>
        <p>
          Koppel je eigen Magister-account om je echte cijfers te zien. Dat gaat zonder dat je ooit
          je wachtwoord hier invult.
        </p>
      </div>
      <LinkButton
        href="/koppelen"
        variant="primary"
        icon={Plug}
        className="mt-6 w-full"
        onClick={onClose}
      >
        Koppelen met Magister
      </LinkButton>
    </Sheet>
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
