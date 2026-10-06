import {
  ArrowUpRight,
  Eye,
  Hand,
  Lock,
  Rocket,
  ScrollText,
  Sparkles,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { formatLongDate } from "@/lib/date";
import type { AchievementState } from "@/lib/guess/achievements";
import { cn } from "@/lib/cn";

const ICONS: Readonly<Record<string, LucideIcon>> = {
  "gok.verdacht": Eye,
  "gok.orakel": Sparkles,
  "gok.laag": ArrowUpRight,
  "gok.hoog": Rocket,
  "gok.script": ScrollText,
  "gok.zeszeven": Hand,
};

/** Eén prestatie: behaald (met datum), of op slot met voortgang. Geheime blijven geheim. */
export function AchievementTile({ achievement }: { achievement: AchievementState }) {
  const { title, description, secret, unlockedAt, progress } = achievement;
  const unlocked = unlockedAt !== null;
  const hidden = secret && !unlocked;
  const Icon = hidden ? Lock : (ICONS[achievement.id] ?? Trophy);
  const percent = Math.round((progress.current / progress.target) * 100);

  return (
    <div
      className={cn(
        "flex h-full gap-3.5 rounded-3xl p-4 shadow-[inset_0_0_0_1px_var(--sm-line)]",
        unlocked ? "glass-strong" : "bg-glass",
      )}
    >
      <span
        className={cn(
          "grid size-12 shrink-0 place-items-center rounded-2xl",
          unlocked
            ? "bg-[linear-gradient(135deg,var(--sm-accent),var(--sm-accent-2))] text-on-accent shadow-[0_8px_24px_-10px_var(--sm-accent)]"
            : "bg-glass-strong text-ink-3",
        )}
      >
        <Icon size={22} strokeWidth={2.2} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn("font-semibold", unlocked ? "text-ink" : "text-ink-2")}>
          {hidden ? "Geheime prestatie" : title}
        </p>
        <p className="mt-0.5 text-sm text-ink-2">
          {hidden ? "Hoe je deze haalt, staat nergens. Dat is het idee." : description}
        </p>
        {unlocked ? (
          <p className="mt-2 text-xs text-ink-3">
            Behaald op {formatLongDate(new Date(unlockedAt))}
          </p>
        ) : (
          !hidden &&
          progress.target > 1 && (
            <div className="mt-2.5 flex items-center gap-2.5">
              <div
                role="progressbar"
                aria-label={title}
                aria-valuemin={0}
                aria-valuemax={progress.target}
                aria-valuenow={progress.current}
                className="h-1.5 flex-1 overflow-hidden rounded-full bg-glass-strong"
              >
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,var(--sm-accent),var(--sm-accent-2))]"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <span className="text-xs text-ink-3 tabular-nums">
                {progress.current}/{progress.target}
              </span>
            </div>
          )
        )}
      </div>
    </div>
  );
}
