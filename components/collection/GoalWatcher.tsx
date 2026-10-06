"use client";

import { useEffect } from "react";
import { notify } from "@/lib/notify";
import { useCollectionStore } from "@/stores/collection";
import { useWalkout } from "@/stores/walkout";
import { useCollection } from "./useCollection";

/**
 * Meldt een verzameldoel zodra je het haalt, maar pas als de walkout klaar
 * is. De eerste keer worden doelen die al gehaald zijn stil vastgelegd.
 */
export function GoalWatcher() {
  const { goals, isLoading, sourceId } = useCollection();
  const walkoutOpen = useWalkout((s) => s.session !== null);
  const announced = useCollectionStore((s) => s.announced[sourceId]);
  const markAnnounced = useCollectionStore((s) => s.markAnnounced);

  useEffect(() => {
    if (isLoading || walkoutOpen) return;
    const done = goals.filter((goal) => goal.done);
    if (!announced) {
      markAnnounced(
        sourceId,
        done.map((goal) => goal.id),
      );
      return;
    }
    const fresh = done.filter((goal) => !announced.includes(goal.id));
    if (fresh.length === 0) return;
    // Eerst vastleggen (dan draait dit effect opnieuw), daarom geen cleanup voor de timers.
    markAnnounced(
      sourceId,
      fresh.map((goal) => goal.id),
    );
    fresh.forEach((goal, i) => {
      setTimeout(
        () => notify("toast.doelGehaald", { wat: goal.title }, { emoji: "🏆" }),
        500 + i * 1200,
      );
    });
  }, [goals, isLoading, walkoutOpen, announced, markAnnounced, sourceId]);

  return null;
}
