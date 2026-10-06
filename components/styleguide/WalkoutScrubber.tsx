"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Tabs } from "@/components/ui/Tabs";
import { ensureCardFont, renderCardCanvas } from "@/lib/cards/draw";
import { formatGuess } from "@/lib/guess/scale";
import {
  buildWalkoutPlan,
  phaseAt,
  SCRIPTED_LOCK_AFTER,
  scriptedGuessView,
  type WalkoutPlanOptions,
} from "@/lib/walkout/plan";
import type { PracticeEntry } from "@/lib/walkout/practice";
import { renderWalkoutFrame, type GuessView, type WalkoutAssets } from "@/lib/walkout/render";
import { createWalkoutScene, stageFor } from "@/lib/walkout/scene";

type Format = "liggend" | "staand";
/** Feature A: geen gokmoment, open (live, met een eigen tellerstand), of gegokt. */
type GuessDemo = "geen" | "open" | "dichtbij" | "precies";

const FORMAT_STYLE: Record<Format, CSSProperties> = {
  liggend: { aspectRatio: "16 / 9", width: "100%" },
  staand: { aspectRatio: "9 / 16", height: "min(70vh, 640px)", width: "auto" },
};

/** Zo lang kun je in de stijlgids door een open gokmoment spoelen. */
const OPEN_PREVIEW = 8;

/**
 * Spoel door de walkout. De tijdlijn is een pure functie van t, dus elk
 * frame is precies na te bootsen. Handig voor ontwerp, debuggen en straks
 * de video-export.
 */
export function WalkoutScrubber({ deck }: { deck: readonly PracticeEntry[] }) {
  const [id, setId] = useState(deck[deck.length - 1]?.id ?? "");
  const [format, setFormat] = useState<Format>("liggend");
  const [guessDemo, setGuessDemo] = useState<GuessDemo>("geen");
  /** Tellerstand in een open gokmoment (tienden); 0 = "?". */
  const [counter, setCounter] = useState(0);
  const [t, setT] = useState(3);
  const canvas = useRef<HTMLCanvasElement>(null);
  const prepared = useRef<{ key: string; draw: (t: number, view?: GuessView) => void } | null>(
    null,
  );

  const entry = deck.find((e) => e.id === id) ?? deck[0];
  const actual = entry?.card.grade.kind === "numeric" ? entry.card.grade.value : null;
  const plan = useMemo(() => {
    if (!entry) return null;
    let options: WalkoutPlanOptions = {};
    if (guessDemo === "open") options = { gok: { lockedAfter: null, guess: null } };
    if ((guessDemo === "dichtbij" || guessDemo === "precies") && actual !== null) {
      const guess =
        guessDemo === "precies" ? actual : Math.round(Math.max(1, actual - 0.4) * 10) / 10;
      options = {
        gok: { lockedAfter: SCRIPTED_LOCK_AFTER, guess },
        helderziende: guessDemo === "precies",
      };
    }
    return buildWalkoutPlan({ tier: entry.card.tier, fail: entry.card.isFail }, options);
  }, [entry, guessDemo, actual]);

  const end = plan
    ? Number.isFinite(plan.restAt)
      ? plan.restAt + 1.5
      : plan.phases.gok.start + OPEN_PREVIEW
    : 1;
  const time = Math.min(t, end);
  const phase = plan ? phaseAt(plan, time) : null;
  const view = useMemo<GuessView | undefined>(
    () =>
      !plan
        ? undefined
        : guessDemo === "open"
          ? { value: counter === 0 ? null : counter }
          : { value: scriptedGuessView(plan, time) },
    [plan, guessDemo, counter, time],
  );

  useEffect(() => {
    const element = canvas.current;
    if (!element || !entry || !plan) return;
    // Een verborgen canvas meet 0 px; dan valt er niets te tekenen.
    if (element.clientWidth === 0 || element.clientHeight === 0) return;
    const key = `${entry.id}-${format}-${guessDemo}-${element.clientWidth}x${element.clientHeight}`;
    let cancelled = false;
    void ensureCardFont().then((family) => {
      if (cancelled) return;
      if (prepared.current?.key !== key) {
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        element.width = Math.max(1, Math.round(element.clientWidth * ratio));
        element.height = Math.max(1, Math.round(element.clientHeight * ratio));
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
          draw: (at, guess) => renderWalkoutFrame({ ctx, unit }, scene, assets, at, guess),
        };
      }
      prepared.current?.draw(time, view);
    });
    return () => {
      cancelled = true;
    };
  }, [entry, plan, format, time, guessDemo, view]);

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
        <Tabs<GuessDemo>
          id="scrub-gok"
          aria-label="Gokmoment"
          size="sm"
          value={guessDemo}
          onValueChange={(value) => {
            setGuessDemo(value);
            setT(value === "geen" ? 3 : 6);
          }}
          items={[
            { value: "geen", label: "Geen gok" },
            { value: "open", label: "Gokmoment" },
            { value: "dichtbij", label: "Gegokt" },
            { value: "precies", label: "Precies goed" },
          ]}
        />
      </div>

      {guessDemo === "open" && (
        <label className="mt-3 block max-w-md">
          <span className="flex justify-between text-sm text-ink-2 tabular-nums">
            <span>Teller</span>
            <span>{counter === 0 ? "?" : formatGuess(counter)}</span>
          </span>
          <input
            type="range"
            min={0}
            max={100}
            step={0.25}
            value={counter}
            onChange={(event) => {
              const value = Number(event.target.value);
              setCounter(value < 10 ? 0 : value);
            }}
            className="mt-1 w-full accent-[var(--sm-accent)]"
          />
        </label>
      )}

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
            {time.toFixed(2)} s / {end.toFixed(1)} s
            {Number.isFinite(plan.revealAt)
              ? ` · onthulling op ${plan.revealAt.toFixed(2)} s`
              : " · gokmoment staat open"}
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
