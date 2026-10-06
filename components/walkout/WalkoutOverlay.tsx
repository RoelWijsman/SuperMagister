"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { FastForward, Volume2, VolumeX, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { createPortal } from "react-dom";
import { GuessScreen } from "@/components/guess/GuessScreen";
import { Button } from "@/components/ui/Button";
import { playLiveCue } from "@/lib/audio/engine";
import type { SoundHandle } from "@/lib/audio/synth";
import { bestTier, TIER_LABELS } from "@/lib/calc/tiers";
import { ensureCardFont, renderCardCanvas } from "@/lib/cards/draw";
import type { CardData } from "@/lib/cards/model";
import { useGuesses } from "@/lib/data/guesses";
import { formatGuess, toTenths } from "@/lib/guess/scale";
import { guessOutcome, makeGuessRecord } from "@/lib/guess/outcome";
import { haptic } from "@/lib/haptics";
import { useFocusTrap, useIsClient, useModalLock } from "@/lib/hooks";
import { buildPackPlan, buildWalkoutPlan, type SoundEvent } from "@/lib/walkout/plan";
import {
  renderIdleFrame,
  renderPackCanvas,
  renderPackFrame,
  renderWalkoutFrame,
  type WalkoutAssets,
} from "@/lib/walkout/render";
import { cn } from "@/lib/cn";
import type { Stage } from "@/lib/walkout/particles";
import {
  cardLayout,
  createPackScene,
  createWalkoutScene,
  stageFor,
  type WalkoutScene,
} from "@/lib/walkout/scene";
import { useGuessStore } from "@/stores/guesses";
import { useReveal } from "@/stores/reveal";
import { useSettings } from "@/stores/settings";
import { useWalkout, type WalkoutEntry, type WalkoutSession } from "@/stores/walkout";
import { WalkoutResult } from "./WalkoutResult";
import { WalkoutSummary } from "./WalkoutSummary";

type Step = { kind: "pack" } | { kind: "card"; index: number } | { kind: "summary" };

const SPEED = { normaal: 1, snel: 1.8, direct: 1 } as const;
const HOLD_MS = 180;
const HOLD_SPEED = 3;

/** Maakt het canvas scherp (max. 2× pixels) en geeft stage en eenheid terug. */
function sizeCanvas(canvas: HTMLCanvasElement) {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.round(canvas.clientWidth * ratio));
  canvas.height = Math.max(1, Math.round(canvas.clientHeight * ratio));
  return stageFor(canvas.width, canvas.height);
}

/** De walkout: fullscreen, overslaanbaar met een tik, sneller door ingedrukt te houden. */
export function WalkoutOverlay() {
  const session = useWalkout((s) => s.session);
  const isClient = useIsClient();
  if (!isClient || !session) return null;
  return createPortal(<WalkoutStage key={session.id} session={session} />, document.body);
}

function WalkoutStage({ session }: { session: WalkoutSession }) {
  const router = useRouter();
  const close = useWalkout((s) => s.close);
  const reveal = useReveal((s) => s.reveal);
  const speedSetting = useSettings((s) => s.walkoutSpeed);
  const autoAdvance = useSettings((s) => s.walkoutAuto);
  const muted = useSettings((s) => s.soundMuted);
  const setSetting = useSettings((s) => s.set);
  const motionSetting = useSettings((s) => s.motion);
  const guessEnabled = useSettings((s) => s.guessEnabled);
  const { guesses: storedGuesses } = useGuesses();
  const prefersReduced = useReducedMotion();
  const reduced =
    motionSetting === "reduced" || (motionSetting === "system" && Boolean(prefersReduced));

  const { entries } = session;
  const [step, setStep] = useState<Step>(() =>
    session.mode === "pack" && entries.length > 1 ? { kind: "pack" } : { kind: "card", index: 0 },
  );
  const [resting, setResting] = useState(false);
  const [holding, setHolding] = useState(false);
  /** Telt op bij "Nog een keer": dezelfde kaart opnieuw afspelen. */
  const [run, setRun] = useState(0);
  const [announcement, setAnnouncement] = useState("");
  /** Gokken van deze sessie per kaart; null = overgeslagen. */
  const [sessionGuesses, setSessionGuesses] = useState<Record<string, number | null>>({});

  const container = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const holdRef = useRef(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipRef = useRef<() => void>(() => {});
  /** Hoeveel van de hoogte het eindscherm onderaan inneemt (gemeten). */
  const reserveRef = useRef<number | undefined>(undefined);
  const measureResult = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const observer = new ResizeObserver(() => {
      reserveRef.current = node.offsetHeight / Math.max(1, window.innerHeight);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useModalLock(true);
  useFocusTrap(true, container);

  const entry: WalkoutEntry | undefined = step.kind === "card" ? entries[step.index] : undefined;

  /** De gok bij een kaart: uit deze sessie, of eerder bewaard (nooit bij oefenkaarten). */
  const guessFor = (card: CardData): number | null =>
    card.id in sessionGuesses
      ? (sessionGuesses[card.id] ?? null)
      : card.isPractice
        ? null
        : (storedGuesses?.[card.gradeId]?.gok ?? null);

  // Feature A: vóór een kaart eerst gokken. Afgeleid, dus geen enkele overgang kan het overslaan.
  const asking =
    entry !== undefined &&
    guessEnabled &&
    session.mode !== "opnieuw" &&
    entry.card.grade.kind === "numeric" &&
    !(entry.card.id in sessionGuesses) &&
    (entry.card.isPractice || !storedGuesses?.[entry.card.gradeId]);
  const currentGuess = entry ? guessFor(entry.card) : null;
  const currentXp =
    entry && !entry.card.isPractice ? (storedGuesses?.[entry.card.gradeId]?.xp ?? null) : null;

  const lockGuess = (value: number) => {
    if (!entry) return;
    const { card } = entry;
    setSessionGuesses((all) => ({ ...all, [card.id]: value }));
    setAnnouncement(`Gok vastgezet: ${formatGuess(toTenths(value))}.`);
    if (session.mode === "pack" && !card.isPractice && card.grade.kind === "numeric") {
      useGuessStore
        .getState()
        .record(card.gradeId, makeGuessRecord(value, card.grade.value, new Date()));
    }
  };
  const skipGuess = () => {
    if (entry) setSessionGuesses((all) => ({ ...all, [entry.card.id]: null }));
  };

  const goNext = useCallback(() => {
    if (step.kind !== "card") return;
    if (step.index + 1 < entries.length) {
      setResting(false);
      setStep({ kind: "card", index: step.index + 1 });
    } else if (session.mode === "pack" && entries.length > 1) {
      setResting(false);
      setStep({ kind: "summary" });
    } else {
      close();
    }
  }, [entries.length, session.mode, step, close]);

  const replay = useCallback(() => {
    setResting(false);
    setRun((r) => r + 1);
  }, []);

  // ——— Pack openscheuren ———————————————————————————————————————————————————
  useEffect(() => {
    if (step.kind !== "pack" || !canvas.current) return;
    const element = canvas.current;
    const ctx = element.getContext("2d");
    if (!ctx) return;
    let disposed = false;
    let frame = 0;
    const values = entries.flatMap((e) =>
      e.card.grade.kind === "numeric" ? [e.card.grade.value] : [],
    );
    const tier = bestTier(values) ?? entries[entries.length - 1]?.card.tier ?? "zilver";
    const plan = buildPackPlan(tier, { reduced });

    void ensureCardFont().then((family) => {
      if (disposed) return;
      let { stage, unit } = sizeCanvas(element);
      let scene = createPackScene(plan, stage, entries.length);
      let assets = {
        pack: renderPackCanvas(tier, entries.length, family, Math.max(1, unit * 1.3)),
        family,
      };
      const onResize = () => {
        ({ stage, unit } = sizeCanvas(element));
        scene = createPackScene(plan, stage, entries.length);
        assets = {
          pack: renderPackCanvas(tier, entries.length, family, Math.max(1, unit * 1.3)),
          family,
        };
      };
      window.addEventListener("resize", onResize);

      let t = 0;
      let previous = -1;
      let last = performance.now();
      skipRef.current = () => {
        t = Math.max(t, plan.duration);
      };
      const loop = (now: number) => {
        if (disposed) return window.removeEventListener("resize", onResize);
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        t += dt * (holdRef.current ? HOLD_SPEED : 1);
        for (const event of plan.events) {
          if (event.at > previous && event.at <= t) playLiveCue(event, { tier });
        }
        if (previous < plan.tearAt && t >= plan.tearAt) haptic("reveal");
        previous = t;
        renderPackFrame({ ctx, unit }, scene, assets, Math.min(t, plan.duration));
        if (t >= plan.duration) {
          window.removeEventListener("resize", onResize);
          setStep({ kind: "card", index: 0 });
          return;
        }
        frame = requestAnimationFrame(loop);
      };
      frame = requestAnimationFrame(loop);
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
    };
  }, [step.kind, entries, reduced]);

  // ——— Gokken: neutraal podium ————————————————————————————————————————————
  useEffect(() => {
    if (!asking || !canvas.current) return;
    const element = canvas.current;
    const ctx = element.getContext("2d");
    if (!ctx) return;
    let disposed = false;
    let frame = 0;
    let { stage, unit } = sizeCanvas(element);
    const onResize = () => {
      ({ stage, unit } = sizeCanvas(element));
    };
    window.addEventListener("resize", onResize);
    const start = performance.now();
    const loop = (now: number) => {
      if (disposed) return;
      renderIdleFrame({ ctx, unit }, stage, (now - start) / 1000);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
    };
  }, [asking]);

  // ——— Eén kaart ——————————————————————————————————————————————————————————
  const cardIndex = step.kind === "card" ? step.index : -1;
  useEffect(() => {
    if (cardIndex < 0 || asking || !canvas.current) return;
    const current = entries[cardIndex];
    if (!current) return;
    const element = canvas.current;
    const ctx = element.getContext("2d");
    if (!ctx) return;
    const { card } = current;
    let disposed = false;
    let frame = 0;
    const handles: SoundHandle[] = [];
    const helderziende =
      currentGuess !== null &&
      card.grade.kind === "numeric" &&
      guessOutcome(currentGuess, card.grade.value).kind === "exact";
    const plan = buildWalkoutPlan(
      { tier: card.tier, fail: card.isFail },
      { reduced, helderziende },
    );
    const peakAfter = plan.revealAt - plan.phases.flip.start;
    const baseSpeed = SPEED[speedSetting];

    const play = (event: SoundEvent) => {
      const handle = playLiveCue(event, { tier: card.tier, peakAfter });
      if (handle && event.duration) handles.push(handle);
    };

    void ensureCardFont().then((family) => {
      if (disposed) return;
      let unit = 1;
      let stage: Stage;
      let reserve = reserveRef.current;
      let scene: WalkoutScene;
      let assets: WalkoutAssets;
      const build = () => {
        const sized = sizeCanvas(element);
        unit = sized.unit;
        stage = sized.stage;
        reserve = reserveRef.current;
        scene = createWalkoutScene(card, plan, stage, { reserveBottom: reserve });
        const faceWidth = Math.min(1100, scene.layout.w * unit * 1.12);
        assets = {
          face: renderCardCanvas(card, faceWidth, { pixelRatio: 1 }),
          silhouette: renderCardCanvas(card, faceWidth, { pixelRatio: 1, side: "silhouette" }),
          family,
        };
      };
      build();
      window.addEventListener("resize", build);

      // "Direct": meteen naar het moment van de onthulling.
      let t = speedSetting === "direct" ? plan.revealAt - 0.03 : 0;
      let previous = t - 1e-6;
      let revealed = false;
      let rested = false;
      let last = performance.now();
      skipRef.current = () => {
        if (t < plan.revealAt - 0.03) {
          t = plan.revealAt - 0.03;
          previous = t;
        }
      };

      const loop = (now: number) => {
        if (disposed) return window.removeEventListener("resize", build);
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        const speed = t >= plan.restAt ? 1 : holdRef.current ? HOLD_SPEED : baseSpeed;
        t += dt * speed;
        for (const event of plan.events) if (event.at > previous && event.at <= t) play(event);
        if (!revealed && t >= plan.revealAt) {
          revealed = true;
          haptic(card.tier === "icon" ? "celebrate" : card.isFail ? "tap" : "reveal");
          setAnnouncement(
            `${card.subjectName}: ${card.stats.cyf}. ${TIER_LABELS[card.tier]}-kaart.`,
          );
          if (session.mode === "pack" && !card.isPractice) reveal([card.gradeId]);
        }
        if (reserveRef.current !== reserve) {
          // Het eindscherm is gemeten: de rustpositie van de kaart schuift mee.
          reserve = reserveRef.current;
          scene = { ...scene, layout: cardLayout(stage, { reserveBottom: reserve }) };
        }
        if (!rested && t >= plan.restAt) {
          rested = true;
          setResting(true);
        }
        previous = t;
        renderWalkoutFrame({ ctx, unit }, scene, assets, t);
        frame = requestAnimationFrame(loop);
      };
      frame = requestAnimationFrame(loop);
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      handles.forEach((handle) => handle.stop());
    };
  }, [cardIndex, run, entries, reduced, speedSetting, session.mode, reveal, asking, currentGuess]);

  // ——— Bediening ———————————————————————————————————————————————————————————
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      else if (asking) return;
      else if (event.key === "ArrowRight") {
        if (resting) goNext();
        else skipRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close, resting, goNext, asking]);

  const onPointerDown = (event: PointerEvent) => {
    if (asking || (event.target as HTMLElement).closest("button, a")) return;
    holdTimer.current = setTimeout(() => {
      holdRef.current = true;
      setHolding(true);
    }, HOLD_MS);
  };
  const onPointerUp = (event: PointerEvent) => {
    if (asking || (event.target as HTMLElement).closest("button, a")) return;
    if (holdTimer.current) clearTimeout(holdTimer.current);
    if (!holdRef.current && !resting && step.kind !== "summary") skipRef.current();
    holdRef.current = false;
    setHolding(false);
  };

  const isLast = step.kind === "card" && step.index === entries.length - 1;
  const nextLabel = !isLast
    ? "Volgende kaart"
    : session.mode === "pack" && entries.length > 1
      ? "Overzicht"
      : "Klaar";

  return (
    <div
      ref={container}
      role="dialog"
      aria-modal="true"
      aria-label="Walkout"
      tabIndex={-1}
      data-mode="dark"
      data-fullscreen
      className="fixed inset-0 z-[80] touch-none bg-black text-white outline-none select-none"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <canvas ref={canvas} aria-hidden className="absolute inset-0 size-full" />
      <p className="sr-only" aria-live="assertive">
        {announcement}
      </p>

      <AnimatePresence>
        {asking && entry && (
          <GuessScreen
            key={entry.card.id}
            card={entry.card}
            onLock={lockGuess}
            onSkip={skipGuess}
          />
        )}
      </AnimatePresence>

      <div className="pt-safe absolute inset-x-0 top-0 flex items-center gap-2 p-3 sm:p-4">
        <span className="font-card text-lg tracking-[0.2em] text-white/55">
          {session.mode === "oefen"
            ? "OEFENMODUS"
            : session.mode === "opnieuw"
              ? "HERHALING"
              : step.kind === "card"
                ? `KAART ${step.index + 1}/${entries.length}`
                : "PACK"}
        </span>
        <div className="ml-auto flex gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            icon={muted ? VolumeX : Volume2}
            aria-label={muted ? "Geluid aan" : "Geluid uit"}
            aria-pressed={muted}
            onClick={() => setSetting("soundMuted", !muted)}
            className="text-white/80 hover:bg-white/10 hover:text-white"
          />
          <Button
            variant="ghost"
            size="icon"
            icon={X}
            aria-label="Walkout sluiten"
            onClick={close}
            className="text-white/80 hover:bg-white/10 hover:text-white"
          />
        </div>
      </div>

      {step.kind !== "summary" && !resting && !asking && (
        <div className="pb-safe pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
          <p className="text-sm text-white/45">
            {holding ? "Sneller…" : "Tik om over te slaan · houd ingedrukt voor sneller"}
          </p>
          <Button
            variant="glass"
            size="sm"
            iconRight={FastForward}
            onClick={() => skipRef.current()}
            className="pointer-events-auto text-white"
          >
            Overslaan
          </Button>
        </div>
      )}

      {/* Staat er al vanaf het begin (onzichtbaar), zodat de kaart weet hoeveel ruimte het inneemt. */}
      {entry && step.kind === "card" && (
        <div
          key={entry.card.id}
          ref={measureResult}
          inert={!resting}
          className={cn(
            "pb-safe pointer-events-none absolute inset-x-0 bottom-0 p-3 sm:p-6 naast:inset-x-auto naast:top-1/2 naast:bottom-auto naast:left-[52%] naast:w-[min(30rem,44vw)] naast:-translate-y-1/2 naast:p-0",
            !resting && "invisible",
          )}
        >
          <WalkoutResult
            entry={entry}
            guess={currentGuess}
            guessXp={currentXp}
            visible={resting}
            nextLabel={nextLabel}
            onNext={goNext}
            onReplay={replay}
            onWhatToGet={(card) => {
              close();
              router.push(card.isPractice ? "/cijfers" : `/cijfers?vak=${card.subjectId}`);
            }}
            autoAdvance={autoAdvance && !isLast && resting}
          />
        </div>
      )}

      {step.kind === "summary" && (
        <motion.div
          className="absolute inset-0 touch-auto bg-black/55 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <WalkoutSummary
            entries={entries}
            guessXp={entries.reduce(
              (sum, e) =>
                sessionGuesses[e.card.id] != null && !e.card.isPractice
                  ? sum + (storedGuesses?.[e.card.gradeId]?.xp ?? 0)
                  : sum,
              0,
            )}
            onCollection={
              session.mode === "pack"
                ? () => {
                    close();
                    router.push("/collectie");
                  }
                : null
            }
            onDone={close}
          />
        </motion.div>
      )}
    </div>
  );
}
