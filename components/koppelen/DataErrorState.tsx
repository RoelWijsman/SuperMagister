"use client";

import { CloudOff, Plug, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { cn } from "@/lib/cn";
import { useSessionStatus } from "@/lib/koppelen/runtime";
import { MagisterError } from "@/lib/magister/transport";
import { useRelink } from "./SessionWatcher";

const MESSAGES: Partial<Record<MagisterError["code"], { title: string; body: string }>> = {
  verlopen: {
    title: "Dit stuk is nog niet opgehaald",
    body: "Je koppeling is verlopen en dit hadden we nog niet bewaard. Koppel opnieuw om het te zien.",
  },
  "geen-sessie": {
    title: "Dit stuk is nog niet opgehaald",
    body: "In dit tabblad is je koppeling niet actief, en dit hadden we nog niet bewaard. Koppel opnieuw om het te zien.",
  },
  netwerk: {
    title: "Geen verbinding met Magister",
    body: "Check je internet. Zodra het weer kan, haalt de app het vanzelf op.",
  },
  server: {
    title: "Magister doet even moeilijk",
    body: "Magister geeft nu geen antwoord. Probeer het over een paar minuten nog eens.",
  },
  "te-vaak": {
    title: "Even rustig aan",
    body: "Magister kreeg net te veel verzoeken. Over een minuutje kan het weer.",
  },
  "geen-toegang": {
    title: "Geen toegang",
    body: "Magister laat dit stuk niet zien. Kun je het in Magister zelf wel openen?",
  },
};

const FALLBACK = {
  title: "Dat lukte niet",
  body: "Er ging iets mis bij het ophalen. Probeer het nog een keer.",
};

/**
 * Als er niets bewaard is en ophalen mislukt: zeggen wat er aan de hand is en
 * wat je kunt doen, in plaats van eindeloos te laden. (Met bewaarde data zie
 * je gewoon die data; dan meldt alleen de chip dat je koppeling verlopen is.)
 */
export function DataErrorState({
  error,
  onRetry,
  className,
}: {
  error: unknown;
  onRetry?: () => void;
  className?: string;
}) {
  const showRelink = useRelink((s) => s.show);
  const status = useSessionStatus();
  const code = error instanceof MagisterError ? error.code : null;
  const needsLink = code === "verlopen" || code === "geen-sessie";
  // Zonder bruikbare sessie zegt de stand van de koppeling meer dan de foutcode.
  const message =
    (needsLink && MESSAGES[status === "geen" ? "geen-sessie" : "verlopen"]) ||
    (code && MESSAGES[code]) ||
    FALLBACK;

  return (
    <GlassPanel role="alert" padding="lg" className={cn("flex items-start gap-4", className)}>
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-glass-strong text-ink-2">
        {needsLink ? <Plug size={20} aria-hidden /> : <CloudOff size={20} aria-hidden />}
      </span>
      <div className="min-w-0">
        <h2 className="font-display text-lg font-semibold tracking-tight text-ink">
          {message.title}
        </h2>
        <p className="mt-1 text-ink-2">{message.body}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          {needsLink ? (
            <Button variant="primary" icon={Plug} onClick={showRelink}>
              Opnieuw koppelen
            </Button>
          ) : (
            onRetry && (
              <Button variant="glass" icon={RotateCcw} onClick={onRetry}>
                Probeer opnieuw
              </Button>
            )
          )}
        </div>
      </div>
    </GlassPanel>
  );
}
