"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef } from "react";
import { ensureCardFont, renderCardCanvas } from "@/lib/cards/draw";
import { buildWalkoutPlan, SCRIPTED_LOCK_AFTER, scriptedGuessView } from "@/lib/walkout/plan";
import { practiceDeck } from "@/lib/walkout/practice";
import { renderWalkoutFrame, type WalkoutAssets } from "@/lib/walkout/render";
import { createWalkoutScene, stageFor } from "@/lib/walkout/scene";

/** Even stilstaan op het einde, dan opnieuw. */
const PAUSE = 0.9;

/**
 * Een stukje van de echte walkout, in een lus: de onthulling ("pack") of het
 * gokmoment ("gok"). Dezelfde tekencode als de walkout zelf, met een
 * oefenkaart. Met rustige animaties: één stilstaand frame.
 */
export function MiniWalkout({ variant, active }: { variant: "pack" | "gok"; active: boolean }) {
  const reduced = useReducedMotion() ?? false;
  const canvas = useRef<HTMLCanvasElement>(null);

  const { entry, plan, from, to } = useMemo(() => {
    const deck = practiceDeck("Jij");
    const chosen = deck.find((e) => e.id === (variant === "pack" ? "goud" : "zilver")) ?? deck[0]!;
    const actual = chosen.card.grade.kind === "numeric" ? chosen.card.grade.value : 7;
    const walkoutPlan = buildWalkoutPlan(
      { tier: chosen.card.tier, fail: chosen.card.isFail },
      variant === "gok"
        ? {
            gok: {
              lockedAfter: SCRIPTED_LOCK_AFTER,
              guess: Math.round(Math.max(1, actual - 0.3) * 10) / 10,
            },
          }
        : {},
    );
    return {
      entry: chosen,
      plan: walkoutPlan,
      from:
        variant === "gok"
          ? walkoutPlan.phases.gok.start - 0.2
          : Math.max(0, walkoutPlan.revealAt - 2.4),
      to: walkoutPlan.revealAt + (variant === "gok" ? 1.4 : 2.2),
    };
  }, [variant]);

  useEffect(() => {
    const element = canvas.current;
    if (!element || element.clientWidth === 0) return;
    let cancelled = false;
    let frame = 0;
    void ensureCardFont().then((family) => {
      if (cancelled) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      element.width = Math.round(element.clientWidth * ratio);
      element.height = Math.round(element.clientHeight * ratio);
      const ctx = element.getContext("2d");
      if (!ctx) return;
      const { stage, unit } = stageFor(element.width, element.height);
      const scene = createWalkoutScene(entry.card, plan, stage);
      const faceWidth = Math.min(700, scene.layout.w * unit * 1.12);
      const assets: WalkoutAssets = {
        face: renderCardCanvas(entry.card, faceWidth, { pixelRatio: 1 }),
        silhouette: renderCardCanvas(entry.card, faceWidth, { pixelRatio: 1, side: "silhouette" }),
        family,
      };
      const draw = (t: number) =>
        renderWalkoutFrame({ ctx, unit }, scene, assets, t, {
          value: variant === "gok" ? scriptedGuessView(plan, t) : null,
        });

      if (reduced || !active) {
        draw(variant === "gok" ? plan.revealAt + 0.6 : plan.revealAt + 1.2);
        return;
      }
      const length = to - from;
      const started = performance.now();
      const tick = (now: number) => {
        if (cancelled) return;
        const elapsed = ((now - started) / 1000) % (length + PAUSE);
        draw(from + Math.min(elapsed, length));
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [entry, plan, from, to, variant, active, reduced]);

  return (
    <canvas
      ref={canvas}
      role="img"
      aria-label={
        variant === "pack"
          ? "Een kaart wordt onthuld, met vuurwerk"
          : "Het gokmoment: de teller rolt naar je gok, daarna draait de kaart om"
      }
      className="mx-auto aspect-video max-h-[38dvh] w-full max-w-full rounded-3xl bg-black object-contain"
    />
  );
}
