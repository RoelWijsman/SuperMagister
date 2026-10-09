"use client";

import { Plug, Sparkles, X } from "lucide-react";
import { Button, LinkButton } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { useIsClient } from "@/lib/hooks";
import { notify } from "@/lib/notify";
import { track } from "@/lib/stats/client";
import { useCopy } from "@/lib/use-copy";
import { useConnection } from "@/stores/connection";

/** Kijkt deze bezoeker rond in de demo (en is hij niet gekoppeld)? */
export function useDemo(): boolean {
  const isClient = useIsClient();
  const demo = useConnection((s) => s.demo && s.account === null);
  return isClient && demo;
}

/**
 * "Probeer de demo": voor wie (nog) niet wil koppelen. De demo heeft een eigen
 * bron-id, dus niets ervan komt bij je echte gegevens.
 */
export function DemoButton({
  onStart,
  variant = "glass",
  className,
}: {
  onStart?: () => void;
  variant?: "glass" | "primary" | "ghost";
  className?: string;
}) {
  return (
    <Button
      variant={variant}
      icon={Sparkles}
      className={className}
      onClick={() => {
        useConnection.getState().startDemo();
        track("demo-gestart");
        notify("toast.demoAan", {}, { emoji: "🎬" });
        onStart?.();
      }}
    >
      Probeer de demo
    </Button>
  );
}

/** Boven elke pagina zolang je in de demo zit: duidelijk DEMO, en de weg naar echt koppelen. */
export function DemoBanner({
  className,
  preview = false,
}: {
  className?: string;
  /** Alleen voor de stijlgids: altijd tonen. */
  preview?: boolean;
}) {
  const demo = useDemo() || preview;
  const text = useCopy(demo ? "demo.banner" : null);
  if (!demo) return null;
  return (
    <div
      role="status"
      className={cn(
        "mb-4 flex flex-wrap items-center gap-x-4 gap-y-2.5 rounded-3xl border border-[color-mix(in_oklab,var(--sm-warn)_45%,transparent)] bg-[color-mix(in_oklab,var(--sm-warn)_10%,transparent)] px-4 py-3 sm:mb-5 sm:gap-y-3",
        className,
      )}
    >
      <span className="rounded-full bg-warn px-2.5 py-1 text-xs font-bold tracking-[0.14em] text-[#1b1300]">
        DEMO
      </span>
      <p className="min-w-0 flex-1 text-sm text-ink-2">{text}</p>
      {/* Op een telefoon passen beide knoppen op één regel. */}
      <div className="flex flex-wrap gap-2">
        <LinkButton href="/koppelen" variant="primary" icon={Plug} size="sm">
          Nu echt koppelen
        </LinkButton>
        <Button
          variant="ghost"
          icon={X}
          size="sm"
          onClick={() => {
            useConnection.getState().stopDemo();
            notify("toast.demoUit", {}, { emoji: "👋" });
          }}
          aria-label="Demo stoppen"
        >
          <span>
            <span className="max-sm:hidden">Demo stoppen</span>
            <span className="sm:hidden">Stoppen</span>
          </span>
        </Button>
      </div>
    </div>
  );
}
