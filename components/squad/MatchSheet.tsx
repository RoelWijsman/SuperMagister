"use client";

import { useReducedMotion } from "framer-motion";
import { Play, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { cn } from "@/lib/cn";
import { commentary, simulateMatch, type MatchResult } from "@/lib/squad/match";
import { track } from "@/lib/stats/client";
import { Crest } from "./Crest";
import type { SquadApi } from "./useSquad";

/** Negentig minuten in precies zoveel seconden. */
const MATCH_MS = 10_000;

interface Played {
  result: MatchResult;
  lines: string[];
}

function play(api: SquadApi): Played {
  const seed = Math.floor(Math.random() * 2 ** 31);
  const result = simulateMatch(api.evaluation, seed);
  return { result, lines: commentary(result, seed) };
}

/** Na afloop: uitslag, man van de wedstrijd en de beste chemie-lijn. */
function Summary({ result }: { result: MatchResult }) {
  const man = result.manOfTheMatch;
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 rounded-2xl border border-line p-4 text-sm">
      <dt className="text-ink-3">Uitslag</dt>
      <dd className="font-semibold text-ink tabular-nums">
        {result.score[0]} – {result.score[1]} tegen {result.opponent}
      </dd>
      {man && (
        <>
          <dt className="text-ink-3">Man van de wedstrijd</dt>
          <dd className="text-ink">
            {man.subject}
            <span className="text-ink-3">
              {man.reason === "goals"
                ? ` · ${man.goals} ${man.goals === 1 ? "doelpunt" : "doelpunten"}`
                : man.reason === "nul"
                  ? " · de nul gehouden"
                  : " · hoogste rating"}
            </span>
          </dd>
        </>
      )}
      {result.bestLink && (
        <>
          <dt className="text-ink-3">Beste chemie-lijn</dt>
          <dd className="text-ink">
            {result.bestLink[0]} en {result.bestLink[1]}
          </dd>
        </>
      )}
    </dl>
  );
}

/**
 * Bonus: een oefenwedstrijd tegen een verzonnen tegenstander, met commentaar.
 * Negentig minuten in tien seconden: elk moment verschijnt op zijn minuut. Het
 * nieuwste moment scrolt vanzelf in beeld.
 */
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
  const [minute, setMinute] = useState(0);
  const list = useRef<HTMLOListElement>(null);
  const enough = api.evaluation.placed >= 7;

  // De klok: van 0 tot 90 in tien seconden. Met minder beweging meteen het eindsignaal.
  useEffect(() => {
    if (!played) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const next = reduced ? 90 : Math.min(90, Math.floor(((now - start) / MATCH_MS) * 90));
      setMinute(next);
      if (next < 90) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [played, reduced]);

  const visible = played ? played.result.events.filter((e) => e.minute <= minute) : [];
  const done = played !== null && minute >= 90;

  // Het nieuwste moment in beeld.
  useEffect(() => {
    const element = list.current;
    if (!element) return;
    element.scrollTo({ top: element.scrollHeight, behavior: reduced ? "auto" : "smooth" });
  }, [visible.length, reduced]);

  const start = () => {
    setMinute(0);
    setPlayed(play(api));
    track("oefenwedstrijd");
  };

  const close = () => {
    setPlayed(null);
    setMinute(0);
    onClose();
  };

  const last = visible[visible.length - 1];
  const score = last?.score ?? [0, 0];

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
          >
            <div className="flex min-w-0 flex-1 flex-col items-center gap-1 text-center">
              <Crest name={api.club.name} shape={api.club.crest} size={36} />
              <span className="w-full truncate text-sm font-semibold text-white">
                {api.club.name}
              </span>
            </div>
            <div className="text-center" aria-live="polite" aria-atomic="true">
              <p className="font-card text-5xl leading-none text-white tabular-nums">
                <span className="sr-only">Stand: </span>
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

          <ol
            ref={list}
            className="scroll-quiet max-h-[34dvh] space-y-2 overflow-y-auto overscroll-contain pb-4"
            aria-label="Commentaar"
          >
            {visible.map((event) => {
              const index = played.result.events.indexOf(event);
              return (
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
              );
            })}
          </ol>

          {done && (
            <>
              <Summary result={played.result} />
              <div className="flex flex-wrap gap-2">
                <Button variant="primary" icon={RotateCcw} onClick={start} className="flex-1">
                  Nog een keer
                </Button>
                <Button variant="ghost" onClick={close}>
                  Klaar
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </Sheet>
  );
}
