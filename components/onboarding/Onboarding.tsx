"use client";

import { AnimatePresence, motion, useReducedMotion, type PanInfo } from "framer-motion";
import { ArrowLeft, ArrowRight, House, PackageOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { useWalkoutActions } from "@/components/walkout/useWalkoutActions";
import { cn } from "@/lib/cn";
import { isTypingTarget, useIsClient, useMediaQuery, useModalLock } from "@/lib/hooks";
import { useConnection } from "@/stores/connection";
import {
  isReturningUser,
  ONBOARDING_STEPS,
  progressOf,
  PROGRESS_STEPS,
  useOnboarding,
  type OnboardingStep,
} from "@/stores/onboarding";
import { useWalkout } from "@/stores/walkout";
import { Intro } from "./Intro";
import { DoneStep, ExplainerStep, FirstPackStep, LinkStep, PlaceStep, ThemeStep } from "./steps";

/** Zo ver moet je vegen om naar de volgende of vorige stap te gaan. */
const SWIPE_PX = 70;

function Progress({ step }: { step: OnboardingStep }) {
  const current = progressOf(step);
  return (
    <ol
      className="flex items-center gap-1.5"
      aria-label={`Stap ${current + 1} van ${PROGRESS_STEPS}`}
    >
      {Array.from({ length: PROGRESS_STEPS }, (_, i) => (
        <li
          key={i}
          aria-hidden
          className={cn(
            "h-1.5 rounded-full transition-all duration-300",
            i === current
              ? "w-6 bg-[linear-gradient(90deg,var(--sm-accent),var(--sm-accent-2))]"
              : "w-1.5",
            i < current && "bg-ink-2",
            i > current && "bg-line-strong",
          )}
        />
      ))}
    </ol>
  );
}

/**
 * De onboarding: de eerste keer dat je SuperMagister opent. Een laag over de
 * app (onder de walkout), met een intro, drie uitlegkaarten, je thema, je
 * woonplaats, koppelen met de bladwijzer en je welkomstpack. Vegen op mobiel, pijltjes en Enter
 * op desktop, en altijd "Overslaan". Wie de app al gebruikte, krijgt hem niet
 * vanzelf (wel via Instellingen).
 */
export function Onboarding() {
  const isClient = useIsClient();
  const status = useOnboarding((s) => s.status);

  // De eerste keer: beginnen, behalve voor wie de app al gebruikte.
  useEffect(() => {
    if (!isClient) return;
    const state = useOnboarding.getState();
    if (state.status !== "nieuw") return;
    let keys: string[] = [];
    try {
      keys = Object.keys(window.localStorage);
    } catch {
      // Geen opslag: dan gewoon beginnen.
    }
    if (isReturningUser(keys)) state.finish();
    else state.begin();
  }, [isClient]);

  return isClient && status === "bezig" ? <OnboardingLayer /> : null;
}

/** De laag zelf; draait alleen als de onboarding open staat. */
function OnboardingLayer() {
  const router = useRouter();
  const reduced = useReducedMotion() ?? false;
  const touch = useMediaQuery("(pointer: coarse)");
  const step = useOnboarding((s) => s.step);
  const { next, back, finish, go } = useOnboarding.getState();
  const linked = useConnection((s) => s.account !== null);
  const { openPack, startPractice, packCount, isLoading } = useWalkoutActions();
  const walkoutOpen = useWalkout((s) => s.session !== null);
  const index = ONBOARDING_STEPS.indexOf(step);

  // Vooruit of terug: daar hangt de richting van de animatie van af.
  const [shown, setShown] = useState(step);
  const [direction, setDirection] = useState(1);
  if (shown !== step) {
    setDirection(index >= ONBOARDING_STEPS.indexOf(shown) ? 1 : -1);
    setShown(step);
  }

  useModalLock(!walkoutOpen);

  const done = useCallback(() => {
    finish();
    router.push("/vandaag");
  }, [finish, router]);

  // Je eerste pack: zodra de walkout weer dicht is, door naar "klaar".
  const startPack = useCallback(() => {
    const stop = useWalkout.subscribe((state, before) => {
      if (before.session && !state.session) {
        stop();
        if (useOnboarding.getState().step === "eerste-pack") useOnboarding.getState().go("klaar");
      }
    });
    if (packCount > 0) openPack();
    else startPractice(["goud"]);
  }, [packCount, openPack, startPractice]);

  const primary = useMemo<{ label: string; icon: typeof ArrowRight; run: () => void } | null>(
    () =>
      step === "koppelen" && !linked
        ? null
        : step === "eerste-pack"
          ? {
              label: packCount > 0 ? "Open je pack" : "Oefen een walkout",
              icon: PackageOpen,
              run: startPack,
            }
          : step === "klaar"
            ? { label: "Naar Vandaag", icon: House, run: done }
            : { label: "Verder", icon: ArrowRight, run: next },
    [step, linked, packCount, startPack, done, next],
  );

  // Pijltjes en Enter op desktop.
  useEffect(() => {
    if (walkoutOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;
      if (event.key === "ArrowRight") {
        event.preventDefault();
        // Zonder koppeling kun je niet verder dan de koppelstap (wel overslaan).
        if (step === "klaar" || (step === "koppelen" && !linked)) return;
        next();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        back();
      } else if (event.key === "Enter") {
        // Op een knop doet Enter gewoon wat die knop doet.
        const target = event.target as HTMLElement | null;
        if (target?.closest("button, a")) return;
        event.preventDefault();
        if (step === "intro") next();
        else primary?.run();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [walkoutOpen, step, next, back, primary, linked]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -SWIPE_PX || info.velocity.x < -500) {
      if (step !== "klaar" && !(step === "koppelen" && !linked)) next();
    } else if (info.offset.x > SWIPE_PX || info.velocity.x > 500) back();
  };

  const content: Record<OnboardingStep, ReactNode> = {
    intro: <Intro onDone={next} />,
    pack: <ExplainerStep kind="pack" />,
    gok: <ExplainerStep kind="gok" />,
    overzicht: <ExplainerStep kind="overzicht" />,
    thema: <ThemeStep />,
    woonplaats: <PlaceStep />,
    koppelen: <LinkStep onLinked={() => go("eerste-pack")} />,
    "eerste-pack": <FirstPackStep />,
    klaar: <DoneStep />,
  };
  const later = step === "woonplaats" || step === "eerste-pack";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Welkom bij SuperMagister"
      className="fixed inset-0 z-[56] flex flex-col text-ink"
    >
      {/* Matglas over de app: alleen het licht van de aurora schijnt nog door. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[color-mix(in_oklab,var(--sm-bg)_64%,transparent)] backdrop-blur-2xl"
      />
      {/* De aurora vloeit in: het donker trekt langzaam weg. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-bg"
        initial={{ opacity: step === "intro" ? 1 : 0 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 1.8, ease: "easeOut" }}
      />

      <div className="relative flex items-center justify-between gap-3 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-2 sm:px-6">
        {step === "intro" ? <span /> : <Progress step={step} />}
        <Button variant="ghost" size="sm" onClick={finish}>
          Overslaan
        </Button>
      </div>

      <div className="relative min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.section
            key={step}
            custom={direction}
            initial={reduced ? { opacity: 0 } : { opacity: 0, x: direction * 48 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, x: direction * -48 }}
            transition={{ duration: reduced ? 0.2 : 0.28, ease: "easeOut" }}
            drag={touch && step !== "intro" ? "x" : false}
            dragDirectionLock
            dragSnapToOrigin
            dragElastic={0.18}
            onDragEnd={onDragEnd}
            className={cn(
              "flex min-h-full flex-col px-4 sm:px-6",
              step === "intro" ? "justify-center" : "justify-center py-6",
            )}
          >
            {content[step]}
          </motion.section>
        </AnimatePresence>
      </div>

      {step !== "intro" && (
        <div className="relative flex items-center justify-between gap-3 border-t border-line bg-[color-mix(in_oklab,var(--sm-bg)_55%,transparent)] px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl sm:px-6">
          <Button
            variant="ghost"
            icon={ArrowLeft}
            onClick={back}
            disabled={index <= 1}
            aria-label="Vorige stap"
            className={cn(index <= 1 && "invisible")}
          >
            <span className="hidden sm:inline">Terug</span>
          </Button>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {later && (
              <Button variant="ghost" onClick={next}>
                Later
              </Button>
            )}
            {primary ? (
              <Button
                variant="primary"
                icon={primary.icon}
                onClick={primary.run}
                disabled={step === "eerste-pack" && isLoading}
              >
                {primary.label}
              </Button>
            ) : (
              <p className="text-right text-sm text-ink-3">
                Gekoppeld? Dan gaat dit vanzelf verder.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
