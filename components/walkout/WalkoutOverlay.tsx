"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronsUpDown, FastForward, Volume2, VolumeX, X } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type WheelEvent,
} from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";
import { VideoSheet, type VideoRequest } from "@/components/video/VideoSheet";
import { playLiveCue, startLiveTension } from "@/lib/audio/engine";
import type { SoundHandle } from "@/lib/audio/synth";
import { bestTier, TIER_LABELS } from "@/lib/calc/tiers";
import { ensureCardFont, renderCardCanvas } from "@/lib/cards/draw";
import type { CardData } from "@/lib/cards/model";
import { cn } from "@/lib/cn";
import { useDataSource } from "@/lib/data/context";
import { useGuesses } from "@/lib/data/guesses";
import { confirmGuess, dragToGuess, keyToGuess, shouldGuess, wheelSteps } from "@/lib/guess/input";
import { guessOutcome, makeGuessRecord, type GuessRecord } from "@/lib/guess/outcome";
import {
  clampGuess,
  formatGuess,
  guessCommentKey,
  tickFrequency,
  toTenths,
} from "@/lib/guess/scale";
import { haptic } from "@/lib/haptics";
import { useFocusTrap, useIsClient, useModalLock } from "@/lib/hooks";
import { useCopy } from "@/lib/use-copy";
import type { Stage } from "@/lib/walkout/particles";
import {
  buildPackPlan,
  buildWalkoutPlan,
  SCRIPTED_LOCK_AFTER,
  scriptedGuessView,
  type SoundEvent,
  type WalkoutPlanOptions,
} from "@/lib/walkout/plan";
import {
  renderPackCanvas,
  renderPackFrame,
  renderWalkoutFrame,
  type GuessView,
  type WalkoutAssets,
} from "@/lib/walkout/render";
import {
  cardLayout,
  createPackScene,
  createWalkoutScene,
  stageFor,
  type WalkoutScene,
} from "@/lib/walkout/scene";
import { useCalculator } from "@/stores/calculator";
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
/** Zo ver moet je slepen voordat het telt als gokken (en niet als tikken). */
const DRAG_THRESHOLD = 6;
/** Feature A: zonder gok omdraaien kan alleen met dit knopje, nooit met een tik op de kaart. */
const SKIP_GUESS_LABEL = "Overslaan, ik ben er klaar voor (ben ik niet)";

/** Maakt het canvas scherp (max. 2× pixels) en geeft stage en eenheid terug. */
function sizeCanvas(canvas: HTMLCanvasElement) {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.round(canvas.clientWidth * ratio));
  canvas.height = Math.max(1, Math.round(canvas.clientHeight * ratio));
  return stageFor(canvas.width, canvas.height);
}

/** Startpunt van de teller: je gemiddelde voor dit vak. */
const anchorFor = (card: CardData) => clampGuess(toTenths(card.avgBefore ?? 6));

/** Elke kaart begint met een "?", met de pijltjes en de schaal in beeld. */
const freshView = (): GuessView => ({
  value: null,
  wobbleSince: null,
  hints: true,
  nudgeSince: null,
});

/** De walkout: fullscreen, overslaanbaar met een tik, sneller door ingedrukt te houden. */
export function WalkoutOverlay() {
  const session = useWalkout((s) => s.session);
  const isClient = useIsClient();
  if (!isClient || !session) return null;
  return createPortal(<WalkoutStage key={session.id} session={session} />, document.body);
}

interface DragState {
  pointerId: number;
  x: number;
  y: number;
  start: number;
  moved: boolean;
}

function WalkoutStage({ session }: { session: WalkoutSession }) {
  const router = useRouter();
  const realData = useDataSource().kind === "magister";
  const close = useWalkout((s) => s.close);
  const reveal = useReveal((s) => s.reveal);
  const speedSetting = useSettings((s) => s.walkoutSpeed);
  const autoAdvance = useSettings((s) => s.walkoutAuto);
  const muted = useSettings((s) => s.soundMuted);
  const setSetting = useSettings((s) => s.set);
  const motionSetting = useSettings((s) => s.motion);
  const guessMode = useSettings((s) => s.guessMode);
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
  /** Gokken van deze sessie per kaart; null = zonder gok omgedraaid. */
  const [sessionGuesses, setSessionGuesses] = useState<Record<string, number | null>>({});
  /** Feature B: de video die je vanaf het eindscherm maakt. */
  const [video, setVideo] = useState<VideoRequest | null>(null);

  // Feature A: het gokmoment.
  const [guessOpen, setGuessOpen] = useState(false);
  /** Huidige gok in hele tienden (voor commentaar en schermlezer); null = "?". */
  const [guessValue, setGuessValue] = useState<number | null>(null);
  /** Waar de onderkant van de kaart zit (procent van de hoogte), voor het commentaar. */
  const [commentTop, setCommentTop] = useState(78);

  const container = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const holdRef = useRef(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipRef = useRef<() => void>(() => {});
  /** Zet de gok vast (of draai zonder gok om); geeft false als het nu niet kan. */
  const lockRef = useRef<(value: number | null) => boolean>(() => false);
  const viewRef = useRef<GuessView>(freshView());
  const timeRef = useRef(0);
  const dragRef = useRef<DragState | null>(null);
  const wheelRest = useRef(0);
  const lastTick = useRef(0);
  const sessionGuessesRef = useRef(sessionGuesses);
  const storedGuessesRef = useRef<Readonly<Record<string, GuessRecord>> | null>(storedGuesses);
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

  useEffect(() => {
    sessionGuessesRef.current = sessionGuesses;
    storedGuessesRef.current = storedGuesses;
  }, [sessionGuesses, storedGuesses]);

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
  const currentGuess = entry ? guessFor(entry.card) : null;
  const currentXp =
    entry && !entry.card.isPractice ? (storedGuesses?.[entry.card.gradeId]?.xp ?? null) : null;

  const goNext = useCallback(() => {
    if (step.kind !== "card") return;
    if (step.index + 1 < entries.length) {
      setResting(false);
      setGuessValue(null);
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
    setGuessValue(null);
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

  // ——— Eén kaart ——————————————————————————————————————————————————————————
  const cardIndex = step.kind === "card" ? step.index : -1;
  useEffect(() => {
    if (cardIndex < 0 || !canvas.current) return;
    const current = entries[cardIndex];
    if (!current) return;
    const element = canvas.current;
    const ctx = element.getContext("2d");
    if (!ctx) return;
    const { card } = current;
    const actual = card.grade.kind === "numeric" ? card.grade.value : null;
    let disposed = false;
    let frame = 0;
    const handles: SoundHandle[] = [];
    let tension: SoundHandle | null = null;
    let crowd: SoundHandle | null = null;

    // Wat weten we al van deze kaart? Een gok uit deze sessie, of een bewaarde gok.
    const sessionKnown = sessionGuessesRef.current;
    const known: number | null | undefined =
      card.id in sessionKnown
        ? sessionKnown[card.id]
        : card.isPractice
          ? undefined
          : storedGuessesRef.current?.[card.gradeId]?.gok;
    const live =
      known === undefined &&
      shouldGuess({
        mode: guessMode,
        session: session.mode,
        index: cardIndex,
        count: entries.length,
        numeric: actual !== null,
      });
    const scripted = typeof known === "number" && actual !== null;
    const exact = (value: number | null) =>
      value !== null && actual !== null && guessOutcome(value, actual).kind === "exact";

    const optionsFor = (gok: WalkoutPlanOptions["gok"], helderziende = false) => ({
      reduced,
      helderziende,
      gok,
    });
    let plan = buildWalkoutPlan(
      { tier: card.tier, fail: card.isFail },
      live
        ? optionsFor({ lockedAfter: null, guess: null })
        : scripted
          ? optionsFor({ lockedAfter: SCRIPTED_LOCK_AFTER, guess: known }, exact(known))
          : optionsFor(undefined),
    );
    let peakAfter = plan.revealAt - plan.phases.flip.start;
    const baseSpeed = SPEED[speedSetting];

    const play = (event: SoundEvent) => {
      const handle = playLiveCue(event, { tier: card.tier, peakAfter });
      if (handle && event.duration) handles.push(handle);
      if (handle && event.cue === "stadion") crowd = handle;
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
        // Het commentaar komt net onder de kaart. Iets ruimer dan de kaart zelf:
        // hij zoomt tijdens het gokmoment langzaam in.
        const { cy, h } = scene.layout;
        setCommentTop(Math.min(90, ((cy + h * 0.58) / stage.h) * 100));
      };
      build();
      window.addEventListener("resize", build);

      const gokStart = plan.phases.gok.start;
      // "Direct": meteen naar het gokmoment, of anders naar de onthulling.
      let t = speedSetting === "direct" ? (plan.gok ? gokStart : plan.revealAt - 0.03) : 0;
      let previous = t - 1e-6;
      let revealed = false;
      let rested = false;
      let opened = false;
      let locked = !live;
      let last = performance.now();

      skipRef.current = () => {
        if (live && !locked) {
          // Overslaan brengt je naar het gokmoment, nooit eroverheen.
          if (t < gokStart) {
            t = gokStart;
            previous = t - 1e-6;
          }
          return;
        }
        if (t < plan.revealAt - 0.03) {
          t = plan.revealAt - 0.03;
          previous = t;
        }
      };

      lockRef.current = (value) => {
        if (!live || locked || t < gokStart) return false;
        locked = true;
        tension?.stop();
        tension = null;
        plan = buildWalkoutPlan(
          { tier: card.tier, fail: card.isFail },
          optionsFor({ lockedAfter: t - gokStart, guess: value }, exact(value)),
        );
        peakAfter = plan.revealAt - plan.phases.flip.start;
        scene = createWalkoutScene(card, plan, stage, { reserveBottom: reserve });
        // De klik staat op dit moment in de nieuwe tijdlijn: volgende frame afspelen.
        previous = t - 1e-6;
        return true;
      };

      const loop = (now: number) => {
        if (disposed) return window.removeEventListener("resize", build);
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        const waiting = live && !locked && t >= gokStart;
        const speed = t >= plan.restAt || waiting ? 1 : holdRef.current ? HOLD_SPEED : baseSpeed;
        t += dt * speed;
        timeRef.current = t;

        if (live && !opened && t >= gokStart) {
          // Het gokmoment begint: de spanningsloop neemt het over van het stadion.
          opened = true;
          crowd?.stop();
          tension = startLiveTension();
          setGuessOpen(true);
          setAnnouncement(
            "Wat heb je? Sleep omhoog of omlaag, of gebruik de pijltjestoetsen. Loslaten of Enter zet je gok vast. Niet gokken? Kies Overslaan onderaan.",
          );
        }
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
        const view: GuessView | undefined = live
          ? viewRef.current
          : scripted
            ? { value: scriptedGuessView(plan, t) }
            : undefined;
        renderWalkoutFrame({ ctx, unit }, scene, assets, t, view);
        frame = requestAnimationFrame(loop);
      };
      frame = requestAnimationFrame(loop);
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      tension?.stop();
      handles.forEach((handle) => handle.stop());
      lockRef.current = () => false;
    };
  }, [cardIndex, run, entries, reduced, speedSetting, session.mode, reveal, guessMode]);

  // ——— Gokken ——————————————————————————————————————————————————————————————
  /** Nieuwe stand van de teller (in tienden, mag een fractie zijn). */
  const setLiveValue = (tenths: number) => {
    const view = viewRef.current;
    const rounded = Math.round(tenths);
    const before = view.value === null ? null : Math.round(view.value);
    view.value = tenths;
    if (rounded === before) return;
    view.wobbleSince = rounded === 67 ? timeRef.current : null;
    setGuessValue(rounded);
    const now = performance.now();
    if (now - lastTick.current > 25) {
      lastTick.current = now;
      playLiveCue({ at: 0, cue: "tik", pitch: tickFrequency(rounded) }, { tier: "zilver" });
      haptic("tap");
    }
  };

  /** Loslaten of Enter: met een getal vastzetten; zonder getal krijgen de pijltjes een duwtje. */
  const confirm = () => {
    const result = confirmGuess(viewRef.current.value);
    if (result.kind === "vastzetten") lock(result.value);
    else viewRef.current.nudgeSince = timeRef.current;
  };

  /** Gok vastzetten (value) of zonder gok omdraaien (null). */
  const lock = (value: number | null) => {
    const card = entry?.card;
    if (!card || !lockRef.current(value)) return;
    setGuessOpen(false);
    dragRef.current = null;
    setSessionGuesses((all) => ({ ...all, [card.id]: value }));
    if (value === null) {
      setAnnouncement("Zonder gok omgedraaid.");
      return;
    }
    haptic("success");
    setAnnouncement(`Gok vastgezet: ${formatGuess(Math.round(value * 10))}.`);
    if (session.mode === "pack" && !card.isPractice && card.grade.kind === "numeric") {
      useGuessStore
        .getState()
        .record(card.gradeId, makeGuessRecord(value, card.grade.value, new Date()));
    }
  };

  // Elke nieuwe kaart begint met een "?".
  useEffect(() => {
    viewRef.current = freshView();
    wheelRest.current = 0;
  }, [cardIndex, run]);

  useEffect(() => {
    if (guessOpen) sliderRef.current?.focus({ preventScroll: true });
  }, [guessOpen]);

  // ——— Bediening ———————————————————————————————————————————————————————————
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      // Het videopaneel ligt erbovenop en handelt zijn eigen toetsen af.
      if (video) return;
      if (event.key === "Escape") {
        close();
        return;
      }
      if (guessOpen && entry) {
        // Enter op een knop (zoals geluid uit) is voor die knop, niet voor je gok.
        if ((event.target as HTMLElement | null)?.closest?.("button")) return;
        if (event.key === "Enter") {
          event.preventDefault();
          confirm();
          return;
        }
        const base = viewRef.current.value ?? anchorFor(entry.card);
        const next = keyToGuess(Math.round(base), event.key);
        if (next !== null) {
          event.preventDefault();
          setLiveValue(next);
        }
        return;
      }
      if (event.key === "ArrowRight") {
        if (resting) goNext();
        else skipRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  /** Komt dit event uit de walkout zelf (en niet uit een paneel erbovenop)? */
  const fromStage = (event: { target: EventTarget }) =>
    container.current?.contains(event.target as Node) ?? false;

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!fromStage(event) || (event.target as HTMLElement).closest("button, a")) return;
    if (guessOpen && entry) {
      dragRef.current = {
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        start: viewRef.current.value ?? anchorFor(entry.card),
        moved: false,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }
    holdTimer.current = setTimeout(() => {
      holdRef.current = true;
      setHolding(true);
    }, HOLD_MS);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!fromStage(event)) return;
    const drag = dragRef.current;
    if (!guessOpen || !drag || drag.pointerId !== event.pointerId) return;
    const dy = drag.y - event.clientY;
    if (!drag.moved && Math.abs(dy) < DRAG_THRESHOLD) return;
    drag.moved = true;
    setLiveValue(dragToGuess(drag.start, dy));
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!fromStage(event) || (event.target as HTMLElement).closest("button, a")) return;
    const drag = dragRef.current;
    if (guessOpen && drag && drag.pointerId === event.pointerId) {
      // Loslaten = vastzetten. Een tik zonder getal slaat niets over (dat kan
      // alleen met het knopje onderaan), dus slepen en tikken botsen nooit.
      dragRef.current = null;
      confirm();
      return;
    }
    if (holdTimer.current) clearTimeout(holdTimer.current);
    if (!holdRef.current && !resting && step.kind !== "summary") skipRef.current();
    holdRef.current = false;
    setHolding(false);
  };

  const onWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (!fromStage(event) || !guessOpen || !entry) return;
    const { steps, rest } = wheelSteps(wheelRest.current, event.deltaY);
    wheelRest.current = rest;
    if (steps === 0) return;
    const base = viewRef.current.value ?? anchorFor(entry.card);
    setLiveValue(clampGuess(Math.round(base) + steps));
  };

  const commentKey = guessOpen
    ? guessValue === null
      ? "gok.vraag"
      : guessCommentKey(guessValue)
    : null;
  const comment = useCopy(commentKey);

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
      className={cn(
        "fixed inset-0 z-[80] touch-none bg-black text-white outline-none select-none",
        guessOpen && "cursor-ns-resize",
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onWheel={onWheel}
    >
      <canvas ref={canvas} aria-hidden className="absolute inset-0 size-full" />
      <p className="sr-only" aria-live="assertive">
        {announcement}
      </p>

      {/* Het gokmoment: live commentaar en meteen de uitleg onder de kaart. */}
      <AnimatePresence>
        {guessOpen && (
          <motion.div
            key="gok"
            className="pointer-events-none absolute inset-x-0 px-6 text-center"
            style={{ top: `${commentTop}%` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
          >
            <div
              ref={sliderRef}
              role="slider"
              tabIndex={0}
              aria-label="Jouw gok"
              aria-valuemin={1}
              aria-valuemax={10}
              aria-valuenow={guessValue === null ? undefined : guessValue / 10}
              aria-valuetext={guessValue === null ? "Nog geen gok" : formatGuess(guessValue)}
              className="sr-only"
            />
            {/* Elke nieuwe tekst komt er meteen in (geen wachten op de vorige), zodat het
                commentaar bij snel slepen nooit blijft hangen. */}
            <motion.p
              key={commentKey ?? "leeg"}
              className="mx-auto max-w-md text-[0.95rem] font-medium text-balance text-white/85"
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.12 }}
            >
              {comment}
            </motion.p>
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-white/60">
              <ChevronsUpDown size={16} aria-hidden className="shrink-0" />
              Sleep omhoog of omlaag · loslaten = vastzetten
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Zonder gok omdraaien kan alleen hier, nooit met een tik op de kaart. */}
      {guessOpen && (
        <div className="pb-safe pointer-events-none absolute inset-x-0 bottom-0 flex justify-center p-3 sm:p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => lock(null)}
            className="pointer-events-auto text-white/55 hover:bg-white/10 hover:text-white"
          >
            {SKIP_GUESS_LABEL}
          </Button>
        </div>
      )}

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

      {step.kind !== "summary" && !resting && !guessOpen && (
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
              // Oefenkaart of de demo: geen echte cijfers, dus zelf invullen.
              if (card.isPractice || !realData) {
                useCalculator.getState().openManual();
                return;
              }
              // Direct naar de calculator, met het vak al ingevuld.
              router.push(`/cijfers?tool=calculator&vak=${card.subjectId}`);
            }}
            onMakeVideo={() => setVideo({ card: entry.card, guess: currentGuess })}
            autoAdvance={autoAdvance && !isLast && resting}
            hold={video !== null}
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

      <VideoSheet request={video} onClose={() => setVideo(null)} layer="boven" />
    </div>
  );
}
