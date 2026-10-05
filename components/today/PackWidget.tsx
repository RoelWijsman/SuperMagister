"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Gift, Sparkles } from "lucide-react";
import type { CSSProperties } from "react";
import { TIER_GLOW } from "@/components/cards/tier-style";
import { LogoMark } from "@/components/shell/Logo";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Widget } from "@/components/ui/Widget";
import { bestTier } from "@/lib/calc/tiers";
import type { Grade } from "@/lib/types";
import { toast } from "@/stores/toast";

/** Zwevend kaartenpakket. De gloed verraadt subtiel de beste kaart erin. */
function FloatingPack({ glow }: { glow: string }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      aria-hidden
      className="relative h-32 w-24 shrink-0"
      animate={reduced ? undefined : { y: [0, -7, 0], rotate: [-2, 2, -2] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      style={{ "--glow": glow } as CSSProperties}
    >
      <span className="absolute inset-0 translate-x-3 rotate-[10deg] rounded-2xl bg-glass-strong shadow-[inset_0_0_0_1px_var(--sm-line-strong)]" />
      <span className="absolute inset-0 -translate-x-2 -rotate-[8deg] rounded-2xl bg-glass-strong shadow-[inset_0_0_0_1px_var(--sm-line-strong)]" />
      <span className="absolute inset-0 animate-[pack-glow_2.8s_ease-in-out_infinite] overflow-hidden rounded-2xl bg-[linear-gradient(150deg,var(--sm-accent),var(--sm-accent-2))] shadow-[0_0_32px_-2px_var(--glow),0_0_70px_-10px_var(--glow)] motion-reduce:animate-none">
        <span className="absolute inset-0 animate-[foil_3.2s_ease-in-out_infinite] bg-[linear-gradient(115deg,transparent_30%,rgb(255_255_255/0.55)_45%,transparent_60%)] bg-[length:250%_100%] motion-reduce:animate-none" />
        <span className="absolute inset-0 grid place-items-center">
          <LogoMark className="size-11 drop-shadow-[0_2px_6px_rgb(0_0_0/0.25)]" />
        </span>
      </span>
    </motion.div>
  );
}

/** Pack-banner: nieuwe cijfers wachten op een walkout (fase 2). */
export function PackWidget({ pack, isLoading }: { pack: Grade[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <Widget title="Nieuwe cijfers" icon={Gift} size="md">
        <div className="flex items-center gap-5">
          <Skeleton className="h-32 w-24 rounded-2xl" />
          <div className="flex-1 space-y-2.5">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </Widget>
    );
  }

  if (pack.length === 0) {
    return (
      <Widget title="Nieuwe cijfers" icon={Gift} size="md">
        <div className="flex items-center gap-4">
          <span className="grid size-12 place-items-center rounded-2xl bg-glass-strong text-2xl">
            ✨
          </span>
          <div>
            <p className="font-semibold text-ink">Alles bekeken</p>
            <p className="text-sm text-ink-2">Nieuwe cijfers verschijnen hier als pack.</p>
          </div>
        </div>
      </Widget>
    );
  }

  const values = pack.flatMap((g) => (g.kind === "numeric" ? [g.value] : []));
  const tier = bestTier(values) ?? "zilver";

  return (
    <Widget title="Nieuwe cijfers" icon={Gift} size="md">
      <div className="flex items-center gap-6">
        <FloatingPack glow={TIER_GLOW[tier]} />
        <div className="min-w-0">
          <p className="font-display text-[1.7rem] leading-tight font-semibold tracking-tight">
            🎁 {pack.length} {pack.length === 1 ? "nieuw cijfer" : "nieuwe cijfers"}
          </p>
          <p className="mt-1.5 text-ink-2">Er zit iets moois in. De gloed verraadt het al…</p>
          <Button
            variant="primary"
            icon={Sparkles}
            className="mt-4"
            onClick={() =>
              toast({
                emoji: "🚧",
                title: "De walkout komt in fase 2",
                description: "Dan scheurt dit pack open en wordt elk cijfer een verzamelkaart.",
              })
            }
          >
            Open je pack
          </Button>
        </div>
      </div>
    </Widget>
  );
}
