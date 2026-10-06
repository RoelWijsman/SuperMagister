"use client";

import { useEffect, useMemo } from "react";
import { useDataSource } from "@/lib/data/context";
import { useGuessEntries } from "@/lib/data/guesses";
import { guessAchievements } from "@/lib/guess/achievements";
import { notify } from "@/lib/notify";
import { useAchievementStore } from "@/stores/achievements";
import { useWalkout } from "@/stores/walkout";

/**
 * Meldt een nieuwe prestatie zodra de walkout klaar is. Bij het eerste bezoek
 * leggen we stil vast wat er al behaald was, zodat er geen meldingenregen komt.
 */
export function AchievementWatcher() {
  const source = useDataSource();
  const { entries } = useGuessEntries();
  const walkoutOpen = useWalkout((s) => s.session !== null);
  const announced = useAchievementStore((s) => s.announced[source.id]);
  const markAnnounced = useAchievementStore((s) => s.markAnnounced);
  const achievements = useMemo(() => (entries ? guessAchievements(entries) : null), [entries]);

  useEffect(() => {
    if (!achievements || walkoutOpen) return;
    const unlocked = achievements.filter((a) => a.unlockedAt !== null);
    if (!announced) {
      markAnnounced(
        source.id,
        unlocked.map((a) => a.id),
      );
      return;
    }
    const fresh = unlocked.filter((a) => !announced.includes(a.id));
    if (fresh.length === 0) return;
    // Eerst vastleggen (dan draait dit effect opnieuw), daarom geen cleanup voor de timers.
    markAnnounced(
      source.id,
      fresh.map((a) => a.id),
    );
    fresh.forEach((achievement, i) => {
      setTimeout(
        () =>
          notify(
            achievement.secret ? "toast.prestatieGeheim" : "toast.prestatie",
            { wat: achievement.title },
            { emoji: achievement.secret ? "🤫" : "🏅" },
          ),
        // Na de meldingen van verzameldoelen.
        1700 + i * 1200,
      );
    });
  }, [achievements, walkoutOpen, announced, markAnnounced, source.id]);

  return null;
}
