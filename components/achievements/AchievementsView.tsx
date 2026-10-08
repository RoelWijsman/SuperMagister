"use client";

import { House, Target, Zap } from "lucide-react";
import { useMemo } from "react";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { useGuessEntries } from "@/lib/data/guesses";
import { guessAchievements } from "@/lib/guess/achievements";
import { useIsClient } from "@/lib/hooks";
import { useGamification } from "@/lib/use-gamification";
import { useCopyParts } from "@/lib/use-copy";
import { AchievementTile } from "./AchievementTile";

/**
 * Prestaties: de gok-prestaties van feature A en je XP met gokken. Fase 6
 * (levels, quests en de rest) is vervallen; deze pagina staat daarom standaard
 * uit en is aan te zetten bij Instellingen > Ontwikkelaar.
 */
export function AchievementsView() {
  const isClient = useIsClient();
  const gamification = useGamification();
  const { entries, xp, isLoading } = useGuessEntries();
  const achievements = useMemo(() => guessAchievements(entries ?? []), [entries]);
  const unlocked = achievements.filter((a) => a.unlockedAt).length;
  const soon = useCopyParts(isLoading || !gamification ? null : "prestaties.binnenkort", { xp });

  if (!isClient) return <PageHeader eyebrow="Alleen omhoog" title="Prestaties" />;

  // Uitgezet: wie hier via een oude link komt, krijgt geen lege pagina.
  if (!gamification)
    return (
      <GlassPanel padding="lg" className="mt-6 md:mt-12">
        <EmptyState
          illustration="trofee"
          title="Prestaties staan uit"
          description="Aanzetten kan bij Instellingen, onder Ontwikkelaar."
          action={
            <LinkButton href="/vandaag" variant="primary" icon={House}>
              Naar Vandaag
            </LinkButton>
          }
        />
      </GlassPanel>
    );

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
