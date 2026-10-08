import { formatGrade } from "@/lib/calc/average";
import { formatDelta } from "@/lib/calc/cards";
import { cn } from "@/lib/cn";
import { guessOutcome } from "@/lib/guess/outcome";
import { useGamification } from "@/lib/use-gamification";

interface GuessStripProps {
  guess: number;
  actual: number;
  /** Verdiende XP; weg bij oefenkaarten. */
  xp?: number | null;
  className?: string;
}

/** "Gegokt 7,2 · Echt 7,8 · +0,6": je gok naast het echte cijfer. */
export function GuessStrip({ guess, actual, xp, className }: GuessStripProps) {
  const { kind, diff } = guessOutcome(guess, actual);
  const showXp = useGamification();
  const exact = kind === "exact";

  return (
    <p
      className={cn(
        "sensitive flex flex-wrap items-center gap-x-2.5 gap-y-1 rounded-2xl px-3.5 py-1.5 font-card text-lg tracking-wider",
        exact
          ? "bg-[rgb(168_85_247/0.28)] text-white shadow-[inset_0_0_0_1px_rgb(192_132_252/0.7)]"
          : "bg-white/8 text-white/80",
        className,
      )}
    >
      <span>
        Gegokt <span className="text-white">{formatGrade(guess)}</span>
      </span>
      <span aria-hidden className="text-white/30">
        ·
      </span>
      <span>
        Echt <span className="text-white">{formatGrade(actual)}</span>
      </span>
      <span aria-hidden className="text-white/30">
        ·
      </span>
      <span
        className={cn(diff > 0 && "text-good", diff < 0 && "text-warn", exact && "text-[#e9d5ff]")}
      >
        {exact ? "HELDERZIENDE" : formatDelta(diff)}
      </span>
      {showXp && xp ? (
        <span className="ml-auto rounded-full bg-white/12 px-2.5 text-base text-white">
          +{xp} XP
        </span>
      ) : null}
    </p>
  );
}
