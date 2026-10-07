"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ListChecks, Pause, Play, Timer, type LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { playUiSound } from "@/lib/audio/engine";
import { cn } from "@/lib/cn";
import { seededCopy } from "@/lib/copy";
import type { SubjectAppearance } from "@/lib/data/hooks";
import { haptic } from "@/lib/haptics";
import type { HomeworkItem } from "@/lib/homework/overview";
import { miniSteps } from "@/lib/homework/steps";
import { useHomeworkActions, useHomeworkPrefs } from "@/lib/homework/use-homework";
import { useCopy, useCopyParts } from "@/lib/use-copy";
import { CheckButton } from "./CheckButton";

/** De eigen timer van "ik heb geen zin": vijf minuten, geen focusmodus. */
export const NO_ZIN_MS = 5 * 60_000;

/** Vaste seed per item, zodat de stapjes bij heropenen hetzelfde zijn. */
function seedOf(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = (hash * 31 + text.charCodeAt(i)) | 0;
  return Math.abs(hash);
}

export const formatClock = (ms: number) => {
  const seconds = Math.ceil(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
};

function Choice({
  icon: Icon,
  title,
  text,
  onClick,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-start gap-3 rounded-2xl border border-line bg-glass p-4 text-left transition-colors hover:bg-glass-strong"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[linear-gradient(135deg,var(--sm-accent),var(--sm-accent-2))] text-on-accent">
        <Icon size={20} aria-hidden />
      </span>
      <span>
        <span className="block font-semibold text-ink">{title}</span>
        <span className="block text-sm text-ink-2">{text}</span>
      </span>
    </button>
  );
}

function Steps({ item, onDone }: { item: HomeworkItem; onDone: () => void }) {
  const intro = useCopy("geenZin.stapjes");
  const actions = useHomeworkActions();
  const done = useHomeworkPrefs().steps[item.id] ?? [];
  const texts = useMemo(() => {
    const seed = seedOf(item.id);
    return miniSteps(item).map((step, i) =>
      step.kind === "tekst" ? step.text : seededCopy(step.key, seed + i),
    );
  }, [item]);

  return (
    <div className="space-y-4">
      <p className="text-ink-2">{intro}</p>
      <ol className="space-y-2">
        {texts.map((text, i) => {
          const checked = done.includes(i);
          return (
            <li key={i} className="flex items-center gap-3 rounded-xl px-1 py-1">
              <CheckButton
                size="sm"
                xp={false}
                checked={checked}
                onCheckedChange={() => actions.toggleStep(item.id, i)}
                label={`Stapje ${i + 1}: ${text}`}
              />
              <span className={cn("text-sm text-ink", checked && "text-ink-3 line-through")}>
                {text}
              </span>
            </li>
          );
        })}
      </ol>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-ink-3 tabular-nums">
          {done.length} van {texts.length} gedaan
        </p>
        <Button variant={done.length >= texts.length - 1 ? "primary" : "glass"} onClick={onDone}>
          Huiswerk afvinken
        </Button>
      </div>
    </div>
  );
}

function Ring({ progress }: { progress: number }) {
  const r = 52;
  const length = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-90" aria-hidden>
      <circle cx="60" cy="60" r={r} fill="none" stroke="var(--sm-line)" strokeWidth="8" />
      <circle
        cx="60"
        cy="60"
        r={r}
        fill="none"
        stroke="url(#geenzin-ring)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={length}
        strokeDashoffset={length * (1 - progress)}
        style={{ transition: "stroke-dashoffset 0.3s linear" }}
      />
      <defs>
        <linearGradient id="geenzin-ring" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--sm-accent)" />
          <stop offset="100%" stopColor="var(--sm-accent-2)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function FiveMinutes({
  onStart,
  onDone,
  onStop,
}: {
  onStart: () => void;
  onDone: () => void;
  onStop: () => void;
}) {
  const reduced = useReducedMotion();
  const [endAt, setEndAt] = useState<number | null>(null);
  const [pausedLeft, setPausedLeft] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [round, setRound] = useState(0);
  const before = useCopy("geenZin.timer");
  const during = useCopy(endAt !== null || pausedLeft !== null ? "geenZin.bezig" : null);
  const after = useCopyParts(finished ? "geenZin.klaar" : null);

  useEffect(() => {
    if (endAt === null) return;
    const timer = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= endAt) {
        clearInterval(timer);
        setEndAt(null);
        setFinished(true);
        playUiSound("klaar", { essential: true });
        haptic("celebrate");
      }
    }, 250);
    return () => clearInterval(timer);
  }, [endAt]);

  const left = endAt !== null ? Math.max(0, endAt - now) : (pausedLeft ?? NO_ZIN_MS);
  const running = endAt !== null;

  const start = (ms = NO_ZIN_MS) => {
    const t = Date.now();
    setNow(t);
    setEndAt(t + ms);
    setPausedLeft(null);
    setFinished(false);
    if (round === 0) onStart();
    setRound((n) => n + 1);
  };

  return (
    <div className="space-y-5 text-center">
      <div className="relative mx-auto size-48">
        <Ring progress={finished ? 1 : 1 - left / NO_ZIN_MS} />
        <motion.div
          className="absolute inset-0 grid place-items-center"
          animate={finished && !reduced ? { scale: [1, 1.08, 1] } : { scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <span
            className="font-display text-5xl font-semibold text-ink tabular-nums"
            role="timer"
            aria-label={`${formatClock(left)} over`}
          >
            {finished ? "0:00" : formatClock(left)}
          </span>
        </motion.div>
      </div>

      {finished ? (
        <div aria-live="polite">
          <p className="font-display text-lg font-semibold text-ink">{after?.title}</p>
          <p className="text-ink-2">{after?.body}</p>
        </div>
      ) : (
        <p className="text-ink-2" aria-live="polite">
          {running || pausedLeft !== null ? during : before}
        </p>
      )}

      <div className="flex flex-wrap justify-center gap-2">
        {finished ? (
          <>
            <Button variant="primary" icon={Play} onClick={() => start()}>
              Nog 5 minuten
            </Button>
            <Button variant="glass" onClick={onDone}>
              Afvinken
            </Button>
            <Button variant="ghost" onClick={onStop}>
              Stoppen
            </Button>
          </>
        ) : running ? (
          <Button
            variant="glass"
            icon={Pause}
            onClick={() => {
              setPausedLeft(left);
              setEndAt(null);
            }}
          >
            Pauze
          </Button>
        ) : (
          <Button variant="primary" icon={Play} onClick={() => start(pausedLeft ?? NO_ZIN_MS)}>
            {pausedLeft !== null ? "Verder" : "Start 5 minuten"}
          </Button>
        )}
      </div>
    </div>
  );
}

type Mode = "kies" | "stapjes" | "timer";

function NoZinContent({
  item,
  look,
  onDone,
  onStart,
  onClose,
}: {
  item: HomeworkItem;
  look: SubjectAppearance;
  onDone: () => void;
  onStart: () => void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<Mode>("kies");
  const intro = useCopy("geenZin.intro");

  return (
    <div className="space-y-5">
      <p className="line-clamp-2 text-sm text-ink-3">
        <span className="font-semibold text-ink-2">{look.name}</span> · {item.text}
      </p>
      {mode === "kies" && (
        <>
          <p className="text-ink-2">{intro}</p>
          <div className="space-y-3">
            <Choice
              icon={ListChecks}
              title="Maak het kleiner"
              text="Knip het op in mini-stapjes. Het eerste is bijna te makkelijk."
              onClick={() => setMode("stapjes")}
            />
            <Choice
              icon={Timer}
              title="Alleen 5 minuten"
              text="Begin gewoon. Na vijf minuten mag je stoppen."
              onClick={() => setMode("timer")}
            />
          </div>
        </>
      )}
      {mode === "stapjes" && <Steps item={item} onDone={onDone} />}
      {mode === "timer" && <FiveMinutes onStart={onStart} onDone={onDone} onStop={onClose} />}
      {mode !== "kies" && (
        <button
          type="button"
          onClick={() => setMode("kies")}
          className="text-sm font-medium text-accent-ink hover:underline"
        >
          Toch liever {mode === "stapjes" ? "5 minuten" : "mini-stapjes"}
        </button>
      )}
    </div>
  );
}

/**
 * Fase 3c: de "ik heb geen zin"-knop. Of je knipt de taak op in mini-stapjes,
 * of je doet alleen vijf minuten (met een eigen timer, geen focusmodus).
 */
export function NoZinSheet({
  item,
  subject,
  onClose,
  onDone,
  onStart,
}: {
  item: HomeworkItem | null;
  subject: (id: string | null) => SubjectAppearance;
  onClose: () => void;
  /** Afvinken vanuit de sheet. */
  onDone: (item: HomeworkItem) => void;
  /** De timer start: het item staat dan op "bezig". */
  onStart: (item: HomeworkItem) => void;
}) {
  return (
    <Sheet open={item !== null} onClose={onClose} title="Ik heb geen zin" size="sm">
      {item && (
        <NoZinContent
          key={item.id}
          item={item}
          look={subject(item.subjectId)}
          onDone={() => onDone(item)}
          onStart={() => onStart(item)}
          onClose={onClose}
        />
      )}
    </Sheet>
  );
}
