"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Tabs } from "@/components/ui/Tabs";
import { ensureCardFont, renderCardCanvas } from "@/lib/cards/draw";
import { buildWalkoutPlan, phaseAt } from "@/lib/walkout/plan";
import type { PracticeEntry } from "@/lib/walkout/practice";
import { renderWalkoutFrame, type WalkoutAssets } from "@/lib/walkout/render";
import { createWalkoutScene, stageFor } from "@/lib/walkout/scene";

type Format = "liggend" | "staand";

const FORMAT_STYLE: Record<Format, CSSProperties> = {
  liggend: { aspectRatio: "16 / 9", width: "100%" },
  staand: { aspectRatio: "9 / 16", height: "min(70vh, 640px)", width: "auto" },
};

/**
 * Spoel door de walkout. De tijdlijn is een pure functie van t, dus elk
 * frame is precies na te bootsen. Handig voor ontwerp, debuggen en straks
 * de video-export.
 */
export function WalkoutScrubber({ deck }: { deck: readonly PracticeEntry[] }) {
  const [id, setId] = useState(deck[deck.length - 1]?.id ?? "");
  const [format, setFormat] = useState<Format>("liggend");
  const [t, setT] = useState(3);
  const canvas = useRef<HTMLCanvasElement>(null);
  const prepared = useRef<{ key: string; draw: (t: number) => void } | null>(null);

  const entry = deck.find((e) => e.id === id) ?? deck[0];
  const plan = useMemo(
    () => (entry ? buildWalkoutPlan({ tier: entry.card.tier, fail: entry.card.isFail }) : null),
    [entry],
  );
  const end = plan ? plan.restAt + 1.5 : 1;
  const time = Math.min(t, end);
  const phase = plan ? phaseAt(plan, time) : null;

  useEffect(() => {
    const element = canvas.current;
    if (!element || !entry || !plan) return;
    const key = `${entry.id}-${format}`;
    let cancelled = false;
    void ensureCardFont().then((family) => {
      if (cancelled) return;
      if (prepared.current?.key !== key) {
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        element.width = Math.round(element.clientWidth * ratio);
        element.height = Math.round(element.clientHeight * ratio);
        const ctx = element.getContext("2d");
        if (!ctx) return;
        const { stage, unit } = stageFor(element.width, element.height);
        const scene = createWalkoutScene(entry.card, plan, stage);
        const faceWidth = Math.min(1100, scene.layout.w * unit * 1.12);
        const assets: WalkoutAssets = {
          face: renderCardCanvas(entry.card, faceWidth, { pixelRatio: 1 }),
          silhouette: renderCardCanvas(entry.card, faceWidth, {
            pixelRatio: 1,
            side: "silhouette",
          }),
          family,
        };
        prepared.current = {
          key,
          draw: (at) => renderWalkoutFrame({ ctx, unit }, scene, assets, at),
        };
      }
      prepared.current?.draw(time);
    });
    return () => {
      cancelled = true;
    };
  }, [entry, plan, format, time]);

  if (!entry || !plan) return null;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <Tabs
          id="scrub-kaart"
          aria-label="Kaart"
          size="sm"
          value={entry.id}
          onValueChange={(value) => {
            setId(value);
            setT(3);
          }}
          items={deck.map((e) => ({ value: e.id, label: e.label }))}
        />
        <Tabs
          id="scrub-formaat"
          aria-label="Formaat"
          size="sm"
          value={format}
          onValueChange={setFormat}
          items={[
            { value: "liggend", label: "Liggend" },
            { value: "staand", label: "Staand" },
          ]}
        />
      </div>

      <div className="mt-4 flex justify-center">
        <canvas
          ref={canvas}
          aria-label={`Walkout-frame op ${time.toFixed(2)} seconden`}
          role="img"
          className="max-w-full rounded-2xl bg-black"
          style={FORMAT_STYLE[format]}
        />
      </div>

      <label className="mt-4 block">
        <span className="flex justify-between text-sm text-ink-2 tabular-nums">
          <span>
            Fase: <strong className="text-ink">{phase?.phase}</strong>
          </span>
          <span>
            {time.toFixed(2)} s / {end.toFixed(1)} s · onthulling op {plan.revealAt.toFixed(2)} s
          </span>
        </span>
        <input
          type="range"
          min={0}
          max={end}
          step={0.01}
          value={time}
          onChange={(event) => setT(Number(event.target.value))}
          className="mt-2 w-full accent-[var(--sm-accent)]"
        />
      </label>
    </div>
  );
}
