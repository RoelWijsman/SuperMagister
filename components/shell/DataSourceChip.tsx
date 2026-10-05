"use client";

import { FlaskConical, Plug } from "lucide-react";
import { useState } from "react";
import { LinkButton } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { cn } from "@/lib/cn";
import { useDataSource } from "@/lib/data/context";

/**
 * Laat altijd zien welke data je ziet. Nu: de demo. In fase 5 ook
 * "Gekoppeld met {school}".
 */
export function DataSourceChip({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  const source = useDataSource();
  const [open, setOpen] = useState(false);
  const isDemo = source.kind === "demo";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={isDemo ? "Je bekijkt demo-data. Meer uitleg" : `Gekoppeld met ${source.label}`}
        className={cn(
          "group inline-flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-xs font-bold tracking-[0.12em] uppercase transition-colors",
          isDemo
            ? "border-[color-mix(in_oklab,var(--sm-warn)_45%,transparent)] bg-[repeating-linear-gradient(-45deg,color-mix(in_oklab,var(--sm-warn)_22%,transparent)_0_6px,color-mix(in_oklab,var(--sm-warn)_8%,transparent)_6px_12px)] text-warn hover:border-warn"
            : "border-line bg-glass text-ink-2",
          className,
        )}
      >
        {isDemo ? <FlaskConical size={14} strokeWidth={2.4} /> : <Plug size={14} />}
        {!compact && (isDemo ? "Demo" : source.label)}
      </button>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
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
            Koppelen met je eigen Magister-account komt in fase 5. Dat gaat zonder dat je ooit je
            wachtwoord hier invult.
          </p>
        </div>
        <LinkButton
          href="/koppelen"
          variant="primary"
          icon={Plug}
          className="mt-6 w-full"
          onClick={() => setOpen(false)}
        >
          Hoe werkt koppelen?
        </LinkButton>
      </Sheet>
    </>
  );
}
