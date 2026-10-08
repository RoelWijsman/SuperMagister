"use client";

import { Puzzle, RefreshCw, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { useCopyParts } from "@/lib/use-copy";

const PERKS = [
  { icon: Zap, text: "Koppelen met één klik" },
  { icon: RefreshCw, text: "Vernieuwt zichzelf: nooit meer opnieuw koppelen" },
  { icon: ShieldCheck, text: "Leest alleen, net als nu" },
];

/**
 * De plek voor de browserextensie: straks de makkelijkste manier om te
 * koppelen (fase 5c). Tot die tijd een aankondiging.
 */
export function ExtensionCard() {
  const copy = useCopyParts("koppelen.extensie");
  return (
    <GlassPanel
      as="section"
      variant="strong"
      padding="lg"
      aria-labelledby="extensie-titel"
      className="relative overflow-hidden"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-16 size-64 rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--sm-accent)_30%,transparent),transparent_70%)]"
      />
      <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[linear-gradient(135deg,var(--sm-accent),var(--sm-accent-2))] text-on-accent">
            <Puzzle size={24} strokeWidth={2.2} aria-hidden />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3
                id="extensie-titel"
                className="font-display text-xl font-semibold tracking-tight text-ink"
              >
                Installeer de extensie
              </h3>
              <Chip tone="accent">Binnenkort</Chip>
            </div>
            <p className="mt-1 min-h-[1.5em] max-w-prose text-ink-2">
              {copy ? (
                <>
                  <strong className="font-semibold text-ink">{copy.title}</strong> {copy.body}
                </>
              ) : null}
            </p>
          </div>
        </div>
        <Button variant="glass" icon={Puzzle} disabled className="self-start md:self-center">
          Nog niet beschikbaar
        </Button>
      </div>
      <ul className="relative mt-5 grid gap-2 sm:grid-cols-3">
        {PERKS.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-2 text-sm text-ink-2">
            <Icon size={16} aria-hidden className="shrink-0 text-accent-ink" />
            {text}
          </li>
        ))}
      </ul>
    </GlassPanel>
  );
}
