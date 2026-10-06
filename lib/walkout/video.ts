import { VIDEO_TEXT } from "@/content/copy";
import type { CardTier } from "@/lib/calc/tiers";
import { guessOutcome } from "@/lib/guess/outcome";
import {
  buildWalkoutPlan,
  SCRIPTED_LOCK_AFTER,
  scriptedGuessView,
  type SoundEvent,
  type WalkoutPlan,
  type WalkoutPlanOptions,
} from "./plan";
import type { GuessView } from "./render";

/**
 * Feature B: de walkout als video, het pure deel. Welke tijdlijn, hoe lang,
 * welke geluiden en wanneer de teksten verschijnen. Het gokmoment is de
 * cliffhanger: in mysterie-modus stopt de video op het "?", anders rolt de
 * teller naar je gok en volgt de flip.
 */

/** Zo lang blijft het "?" in beeld voordat de mysterie-video stopt. */
export const MYSTERY_HOLD = 4.2;
/** Zo lang ligt de kaart nog stil aan het eind van een normale video. */
const REST_HOLD = 2.2;
/** Boven je gok in de video: kijkers moeten snappen dat het (nog) niet je cijfer is. */
const GUESS_LABEL = VIDEO_TEXT.gok.toUpperCase();
/** Wanneer de tekst onder het "?" verschijnt (na het begin van het gokmoment). */
const CAPTION = { title: 0.9, line: 1.7, fade: 0.45 } as const;

export interface WalkoutVideoInput {
  tier: CardTier;
  fail: boolean;
  /** Het echte cijfer, of null bij een beoordeling (V, G, O). */
  actual: number | null;
  /** Je gok, of null als je niet gokte. */
  guess: number | null;
  mystery: boolean;
  /** Cijfer verborgen achter een sticker. */
  hidden: boolean;
}

export interface WalkoutVideoTimeline {
  plan: WalkoutPlan;
  mystery: boolean;
  /** Lengte van de video in seconden. */
  end: number;
  /** Een mooi stilstaand beeld voor de preview. */
  posterAt: number;
  /** Wat de gokteller laat zien; undefined als er geen gokmoment is. */
  guessAt(t: number): GuessView | undefined;
}

export function walkoutVideoTimeline(input: WalkoutVideoInput): WalkoutVideoTimeline {
  const card = { tier: input.tier, fail: input.fail };

  if (input.mystery) {
    // Het gokmoment blijft open: de video stopt voordat er ooit gegokt wordt.
    const plan = buildWalkoutPlan(card, { gok: { lockedAfter: null, guess: null } });
    const end = plan.phases.gok.start + MYSTERY_HOLD;
    return {
      plan,
      mystery: true,
      end,
      posterAt: end - 1 / 30,
      guessAt: () => ({ value: null, label: null }),
    };
  }

  const { actual, guess } = input;
  let options: WalkoutPlanOptions = {};
  if (guess !== null && actual !== null) {
    const exact = guessOutcome(guess, actual).kind === "exact";
    options = {
      gok: { lockedAfter: SCRIPTED_LOCK_AFTER, guess },
      // Met een sticker zou HELDERZIENDE je cijfer alsnog verraden.
      helderziende: exact && !input.hidden,
    };
  }
  const plan = buildWalkoutPlan(card, options);
  const end = Math.max(plan.duration, plan.restAt + REST_HOLD);
  return {
    plan,
    mystery: false,
    end,
    posterAt: plan.restAt + 0.8,
    guessAt: (t) =>
      plan.gok ? { value: scriptedGuessView(plan, t), label: GUESS_LABEL } : undefined,
  };
}

/**
 * De geluiden van de video: alles wat vóór het einde begint, lange geluiden
 * afgekapt op het einde. In mysterie speelt de spanningsloop (die live door de
 * overlay zelf wordt gestart) door tot het laatste beeld.
 */
export function walkoutVideoSounds(plan: WalkoutPlan, end: number): SoundEvent[] {
  const sounds = plan.events
    .filter((event) => event.at >= 0 && event.at < end)
    .map((event) =>
      event.duration !== undefined && event.at + event.duration > end
        ? { ...event, duration: end - event.at }
        : event,
    );
  const gokStart = plan.phases.gok.start;
  if (plan.gok?.open && gokStart < end) {
    sounds.push({ at: gokStart, cue: "spanning", duration: end - gokStart });
  }
  return sounds.sort((a, b) => a.at - b.at);
}

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const easeOutCubic = (x: number) => 1 - (1 - x) ** 3;

/** Hoe ver de teksten onder het "?" zijn (0 = nog weg, 1 = helemaal in beeld). */
export function mysteryCaption(
  video: Pick<WalkoutVideoTimeline, "mystery" | "plan">,
  t: number,
): { title: number; line: number } {
  if (!video.mystery) return { title: 0, line: 0 };
  const since = t - video.plan.phases.gok.start;
  return {
    title: easeOutCubic(clamp((since - CAPTION.title) / CAPTION.fade)),
    line: easeOutCubic(clamp((since - CAPTION.line) / CAPTION.fade)),
  };
}

/** "supermagister-walkout-wisa-2026-09-14-mysterie.mp4" */
export function videoFileName(
  card: { subjectCode: string; date: string },
  mystery: boolean,
  extension: string,
): string {
  const slug = card.subjectCode
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `supermagister-walkout-${slug || "kaart"}-${card.date}${mystery ? "-mysterie" : ""}.${extension}`;
}
