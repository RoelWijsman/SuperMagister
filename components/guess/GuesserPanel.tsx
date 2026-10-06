"use client";

import { Target, Trophy } from "lucide-react";
import { useMemo } from "react";
import { LinkButton } from "@/components/ui/Button";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Skeleton } from "@/components/ui/Skeleton";
import type { CopyKey } from "@/content/copy";
import { formatGrade } from "@/lib/calc/average";
import { useGuessEntries } from "@/lib/data/guesses";
import { useAccount } from "@/lib/data/hooks";
import { guessAchievements } from "@/lib/guess/achievements";
import {
  GUESSER_TITLES,
  guesserProfile,
  MIN_GUESSES_FOR_TYPE,
  subjectAccuracy,
  type GuesserType,
} from "@/lib/guess/profile";
import { useCopy, useCopyParts } from "@/lib/use-copy";
import { GuessChart } from "./GuessChart";

const TYPE_COPY: Readonly<Record<GuesserType, CopyKey>> = {
  orakel: "gok.type.orakel",
  pessimist: "gok.type.pessimist",
  hoofdpersonage: "gok.type.hoofdpersonage",
  chaos: "gok.type.chaos",
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-glass px-3.5 py-2.5 shadow-[inset_0_0_0_1px_var(--sm-line)]">
      <dt className="text-xs text-ink-3">{label}</dt>
      <dd className="mt-0.5 font-display text-xl font-semibold text-ink">{value}</dd>
    </div>
  );
}

/** Feature A: wat voor gokker ben je? Met je nauwkeurigheid per vak en gok tegenover echt. */
export function GuesserPanel() {
  const { entries, xp, isLoading } = useGuessEntries();
  const account = useAccount();
  const profile = useMemo(() => (entries ? guesserProfile(entries) : null), [entries]);
  const accuracy = useMemo(() => (entries ? subjectAccuracy(entries) : null), [entries]);
  const achievements = useMemo(() => guessAchievements(entries ?? []), [entries]);
  const count = entries?.length ?? 0;

  const textKey: CopyKey | null = profile
    ? TYPE_COPY[profile.type]
    : count > 0
      ? "gok.type.teWeinig"
      : null;
  const text = useCopy(textKey, {
    aantal: profile ? count : MIN_GUESSES_FOR_TYPE - count,
    verschil: profile
      ? formatGrade(
          profile.type === "pessimist" || profile.type === "hoofdpersonage"
            ? Math.abs(profile.meanError)
            : profile.meanAbsError,
        )
      : "",
  });
  const subjects = useCopy(accuracy ? "gok.vakken" : null, {
    vak: accuracy?.best.subjectName ?? "",
    vak2: accuracy?.worst.subjectName ?? "",
  });
  const empty = useCopyParts(entries && count === 0 ? "leeg.gokken" : null);

  const title = profile
    ? GUESSER_TITLES[profile.type].replace("{klas}", account.data?.className ?? "je klas")
    : "Nog geen gokkerstype";
  const unlocked = achievements.filter((a) => a.unlockedAt).length;

  return (
    <GlassPanel
      as="section"
      id="gokken"
      aria-labelledby="gokken-titel"
      padding="lg"
      className="scroll-mt-24"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-medium text-ink-3">
            <Target size={15} strokeWidth={2.4} aria-hidden />
            Jouw gokkerstype
          </p>
          {isLoading ? (
            <Skeleton className="mt-2 h-8 w-64" />
          ) : (
            <h2
              id="gokken-titel"
              className="mt-1 font-display text-2xl leading-tight font-semibold tracking-tight text-ink"
            >
              {empty ? empty.title : title}
            </h2>
          )}
        </div>
        <LinkButton href="/prestaties" variant="glass" size="sm" icon={Trophy}>
          {unlocked}/{achievements.length} prestaties
        </LinkButton>
      </div>

      {empty ? (
        <p className="mt-2 max-w-prose text-ink-2">{empty.body}</p>
      ) : (
        text && <p className="mt-2 max-w-prose text-ink-2">{text}</p>
      )}

      {entries && count > 0 && (
        <>
          <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Gokken" value={String(count)} />
            <Stat
              label="Gemiddeld ernaast"
              value={profile ? formatGrade(profile.meanAbsError) : "–"}
            />
            <Stat label="Precies goed" value={`${profile?.exact ?? 0}×`} />
            <Stat label="Verdiend" value={`${xp} XP`} />
          </dl>
          {subjects && <p className="mt-4 font-medium text-ink">{subjects}</p>}
          <div className="mt-5">
            <GuessChart entries={entries} />
          </div>
        </>
      )}
    </GlassPanel>
  );
}
