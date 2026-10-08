"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check, MousePointer2, Plug } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * De uitleg van de bladwijzer in drie stappen, als kleine geanimeerde
 * schermpjes. De stappen lichten om de beurt op; met rustige animaties staan
 * ze gewoon stil naast elkaar.
 */

const STEP_MS = 2800;

function Browser({ address, children }: { address: string; children?: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-[color-mix(in_oklab,var(--sm-bg)_70%,transparent)] text-[0.625rem] leading-none">
      <div className="flex items-center gap-1.5 border-b border-line px-2 py-1.5">
        <span className="flex gap-0.5" aria-hidden>
          <i className="size-1.5 rounded-full bg-ink-3/60" />
          <i className="size-1.5 rounded-full bg-ink-3/60" />
          <i className="size-1.5 rounded-full bg-ink-3/60" />
        </span>
        <span className="min-w-0 flex-1 truncate rounded-full bg-glass-strong px-2 py-1 text-ink-3">
          {address}
        </span>
      </div>
      {children}
    </div>
  );
}

function BookmarkBar({ children }: { children?: ReactNode }) {
  return (
    <div className="flex h-6 items-center gap-1 border-b border-line px-2">
      <i className="h-2 w-8 rounded-full bg-glass-strong" />
      <i className="h-2 w-6 rounded-full bg-glass-strong" />
      {children}
    </div>
  );
}

function Pill({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-4 items-center gap-0.5 rounded-full bg-[linear-gradient(135deg,var(--sm-accent),var(--sm-accent-2))] px-1.5 font-semibold text-on-accent",
        className,
      )}
    >
      <Plug size={8} strokeWidth={3} aria-hidden />
      SuperMagister
    </span>
  );
}

function DragScene({ active, still }: { active: boolean; still: boolean }) {
  return (
    <Browser address="supermagister">
      <BookmarkBar>
        <motion.span
          initial={false}
          animate={
            still
              ? { x: 0, y: 0 }
              : active
                ? { x: [26, 26, 0, 0], y: [30, 30, 0, 0] }
                : { x: 26, y: 30 }
          }
          transition={{ duration: 2, times: [0, 0.2, 0.7, 1], ease: "easeInOut" }}
          className="relative z-10"
        >
          <Pill />
          {!still && (
            <MousePointer2
              size={12}
              aria-hidden
              className="absolute top-2 left-10 fill-ink text-bg"
            />
          )}
        </motion.span>
      </BookmarkBar>
      <div className="h-10" />
    </Browser>
  );
}

function LoginScene({ active, still }: { active: boolean; still: boolean }) {
  const done = still || active;
  return (
    <Browser address="jouwschool.magister.net">
      <BookmarkBar>
        <Pill />
      </BookmarkBar>
      <div className="relative grid h-10 place-items-center">
        <motion.span
          initial={false}
          animate={{ opacity: done ? 0 : 1 }}
          transition={{ delay: still ? 0 : 0.9 }}
          className="absolute flex flex-col gap-1"
        >
          <i className="h-1.5 w-16 rounded-full bg-glass-strong" />
          <i className="h-1.5 w-16 rounded-full bg-glass-strong" />
        </motion.span>
        <motion.span
          initial={false}
          animate={{ opacity: done ? 1 : 0, scale: done ? 1 : 0.6 }}
          transition={{ delay: still ? 0 : 1, type: "spring", stiffness: 400, damping: 18 }}
          className="flex items-center gap-1 font-semibold text-good"
        >
          <Check size={12} strokeWidth={3} aria-hidden /> Ingelogd
        </motion.span>
      </div>
    </Browser>
  );
}

function ClickScene({ active, still }: { active: boolean; still: boolean }) {
  return (
    <Browser address="jouwschool.magister.net">
      <BookmarkBar>
        <motion.span
          initial={false}
          animate={!still && active ? { scale: [1, 1, 0.88, 1.06, 1] } : { scale: 1 }}
          transition={{ duration: 1.2, times: [0, 0.4, 0.55, 0.7, 1] }}
          className="relative"
        >
          <Pill />
          {!still && (
            <MousePointer2
              size={12}
              aria-hidden
              className="absolute top-2 left-7 fill-ink text-bg"
            />
          )}
        </motion.span>
      </BookmarkBar>
      <div className="grid h-10 place-items-center">
        <motion.span
          initial={false}
          animate={still || active ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
          transition={{ delay: still ? 0 : 1.1 }}
          className="flex items-center gap-1 font-semibold text-accent-ink"
        >
          <Plug size={11} strokeWidth={2.6} aria-hidden /> Gekoppeld
        </motion.span>
      </div>
    </Browser>
  );
}

const STEPS = [
  {
    title: "Sleep de knop naar je bladwijzerbalk",
    text: "Eén keer. Daarna staat hij er gewoon.",
    Scene: DragScene,
  },
  {
    title: "Log in op Magister",
    text: "Gewoon op je eigen Magister, zoals altijd. Je wachtwoord blijft daar.",
    Scene: LoginScene,
  },
  {
    title: "Klik op de bladwijzer",
    text: "SuperMagister opent en is gekoppeld. Klaar.",
    Scene: ClickScene,
  },
] as const;

export function LinkSteps() {
  const reduced = useReducedMotion() ?? false;
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const timer = setInterval(() => setActive((step) => (step + 1) % STEPS.length), STEP_MS);
    return () => clearInterval(timer);
  }, [reduced]);

  return (
    <ol className="grid gap-3 sm:grid-cols-3">
      {STEPS.map(({ title, text, Scene }, index) => {
        const isActive = !reduced && index === active;
        return (
          <li
            key={title}
            className={cn(
              "rounded-3xl border p-3 transition-[border-color,background-color] duration-500",
              isActive
                ? "border-[color-mix(in_oklab,var(--sm-accent)_45%,transparent)] bg-glass-strong"
                : "border-line",
            )}
          >
            <Scene active={isActive} still={reduced} />
            <div className="mt-3 flex gap-2.5">
              <span
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold transition-colors duration-500",
                  isActive ? "bg-accent text-on-accent" : "bg-glass-strong text-ink",
                )}
              >
                {index + 1}
              </span>
              <div>
                <p className="font-semibold text-ink">{title}</p>
                <p className="mt-0.5 text-sm text-ink-2">{text}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
