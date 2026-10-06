"use client";

import { Target, Zap } from "lucide-react";
import { useMemo } from "react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { useGuessEntries } from "@/lib/data/guesses";
import { guessAchievements } from "@/lib/guess/achievements";
import { useCopyParts } from "@/lib/use-copy";
import { AchievementTile } from "./AchievementTile";

/**
 * Prestaties. Voor nu de gok-prestaties van feature A; XP, levels en de
 * rest komen in fase 6. Hier ga je alleen omhoog.
 */
export function AchievementsView() {
  const { entries, xp, isLoading } = useGuessEntries();
  const achievements = useMemo(() => guessAchievements(entries ?? []), [entries]);
  const unlocked = achievements.filter((a) => a.unlockedAt).length;
  const soon = useCopyParts(isLoading ? null : "prestaties.binnenkort", { xp });

  return (
    <>
      <PageHeader
        eyebrow="Alleen omhoog"
        title="Prestaties"
        subtitle={isLoading ? undefined : `${unlocked} van ${achievements.length} behaald`}
      />

      <GlassPanel className="mb-6 flex items-center gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[linear-gradient(135deg,var(--sm-accent),var(--sm-accent-2))] text-on-accent">
          <Zap size={22} strokeWidth={2.2} aria-hidden />
        </span>
        <div className="min-w-0">
          {soon ? (
            <>
              <p className="font-semibold text-ink">{soon.title}</p>
              <p className="text-sm text-ink-2">{soon.body}</p>
            </>
          ) : (
            <Skeleton className="h-10 w-64" />
          )}
        </div>
      </GlassPanel>

      <section aria-labelledby="prestaties-gokken">
        <h2
          id="prestaties-gokken"
          className="mb-3 flex items-center gap-2 font-display text-lg font-semibold tracking-tight"
        >
          <Target size={18} strokeWidth={2.4} aria-hidden className="text-accent-ink" />
          Gokken
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {achievements.map((achievement) => (
            <li key={achievement.id}>
              <AchievementTile achievement={achievement} />
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
