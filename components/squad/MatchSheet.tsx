"use client";

import { useReducedMotion } from "framer-motion";
import { Play, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import type { CopyKey } from "@/content/copy";
import { cn } from "@/lib/cn";
import { copyText } from "@/lib/copy";
import { simulateMatch, type MatchEvent, type MatchResult } from "@/lib/squad/match";
import { track } from "@/lib/stats/client";
import { Crest } from "./Crest";
import type { SquadApi } from "./useSquad";

/** Hoe lang de samenvatting duurt (ms per moment). */
const STEP_MS = 1100;

const EVENT_KEYS: Readonly<Record<MatchEvent["kind"], CopyKey>> = {
  "goal-ons": "wedstrijd.goalOns",
  "goal-zij": "wedstrijd.goalZij",
  "kans-ons": "wedstrijd.kansOns",
  "kans-zij": "wedstrijd.kansZij",
  rust: "wedstrijd.rust",
  einde: "wedstrijd.winst",
};

interface Played {
  result: MatchResult;
  lines: string[];
}

function play(api: SquadApi): Played {
  const result = simulateMatch(api.evaluation, Math.floor(Math.random() * 2 ** 31));
  const outcomeKey: CopyKey = `wedstrijd.${result.outcome}`;
  const lines = result.events.map((event) =>
    copyText(event.kind === "einde" ? outcomeKey : EVENT_KEYS[event.kind], {
      vak: event.subject ?? "Iemand",
      tegenstander: result.opponent,
    }),
  );
  return { result, lines };
}

/** Bonus: een oefenwedstrijd tegen een verzonnen tegenstander, met live-commentaar. */
export function MatchSheet({
  open,
  api,
  onClose,
}: {
  open: boolean;
  api: SquadApi;
  onClose: () => void;
}) {
  const reduced = useReducedMotion() ?? false;
  const [played, setPlayed] = useState<Played | null>(null);
  const [shown, setShown] = useState(0);
  const enough = api.evaluation.placed >= 7;

  // Moment voor moment, als een samenvatting. Met minder beweging alles tegelijk.
  useEffect(() => {
    if (!played) return;
    const total = played.result.events.length;
    if (reduced) {
      const id = requestAnimationFrame(() => setShown(total));
      return () => cancelAnimationFrame(id);
    }
    if (shown >= total) return;
    const id = setTimeout(() => setShown((n) => n + 1), shown === 0 ? 300 : STEP_MS);
    return () => clearTimeout(id);
  }, [played, shown, reduced]);

  const start = () => {
    setPlayed(play(api));
    setShown(0);
    track("oefenwedstrijd");
  };

  const close = () => {
    setPlayed(null);
    setShown(0);
    onClose();
  };

  const visible = played ? played.result.events.slice(0, shown) : [];
  const last = visible[visible.length - 1];
  const score = last?.score ?? [0, 0];
  const minute = last?.minute ?? 0;
  const done = played !== null && shown >= played.result.events.length;

  return (
    <Sheet open={open} onClose={close} title="Oefenwedstrijd" size="md">
      {!played ? (
        <div className="space-y-4 text-center">
          <p className="text-ink-2">
            Negentig minuten in tien seconden. De uitslag hangt af van je rating en je chemie, met
            een beetje toeval. Niemand raakt geblesseerd, behalve je trots.
          </p>
          {!enough && (
            <p className="text-sm text-warn">Zet eerst minstens zeven spelers op het veld.</p>
          )}
          <Button
            variant="primary"
            icon={Play}
            disabled={!enough}
            onClick={start}
            className="w-full"
          >
            Aftrap
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div
            className="flex items-center justify-between gap-3 rounded-3xl p-4"
            style={{
              background:
                "linear-gradient(180deg, #0f4a2e, #082618), radial-gradient(circle at 50% 0%, var(--sm-accent), transparent)",
            }}
            aria-live="polite"
            aria-atomic="true"
          >
            <div className="flex min-w-0 flex-1 flex-col items-center gap-1 text-center">
              <Crest name={api.club.name} shape={api.club.crest} size={36} />
              <span className="w-full truncate text-sm font-semibold text-white">
                {api.club.name}
              </span>
            </div>
            <div className="text-center">
              <p className="font-card text-5xl leading-none text-white tabular-nums">
                {score[0]} – {score[1]}
              </p>
              <p className="mt-1 font-card text-sm tracking-widest text-white/70 tabular-nums">
                {done ? "EINDSTAND" : `${minute}'`}
              </p>
            </div>
            <div className="flex min-w-0 flex-1 flex-col items-center gap-1 text-center">
              <span
                aria-hidden
                className="grid size-10 place-items-center rounded-full bg-white/15 font-card text-lg text-white"
              >
                {played.result.opponent.slice(0, 2).toUpperCase()}
              </span>
              <span className="w-full truncate text-sm font-semibold text-white">
                {played.result.opponent}
              </span>
            </div>
          </div>

          <ol className="max-h-[42dvh] space-y-2 overflow-y-auto" aria-label="Commentaar">
            {visible.map((event, index) => (
              <li
                key={index}
                className={cn(
                  "grid grid-cols-[2.6rem_1fr] gap-2 rounded-2xl px-3 py-2 text-sm",
                  event.kind === "goal-ons" && "bg-good/12",
                  event.kind === "goal-zij" && "bg-bad/12",
                  event.kind === "einde" && "bg-glass-strong font-semibold text-ink",
                )}
              >
                <span className="font-card text-base text-ink-3 tabular-nums">
                  {event.minute}&apos;
                </span>
                <span className="text-ink-2">{played.lines[index]}</span>
              </li>
            ))}
          </ol>

          {done && (
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" icon={RotateCcw} onClick={start} className="flex-1">
                Nog een keer
              </Button>
              <Button variant="ghost" onClick={close}>
                Klaar
              </Button>
            </div>
          )}
        </div>
      )}
    </Sheet>
  );
}
