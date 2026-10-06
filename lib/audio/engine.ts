import type { CardTier } from "@/lib/calc/tiers";
import type { SoundEvent } from "@/lib/walkout/plan";
import { useSettings } from "@/stores/settings";
import { createMasterChain, playCue, type SoundHandle } from "./synth";

/**
 * De live geluidsmotor. Maakt de AudioContext pas aan bij een tik of klik
 * (browsers eisen dat), luistert naar de mute-instelling en speelt cues uit
 * de walkout-tijdlijn af.
 */
let context: AudioContext | null = null;
let master: GainNode | null = null;
let unsubscribe: (() => void) | null = null;

const MASTER_LEVEL = 0.9;

function volumeFor(kind: "walkout" | "ui") {
  const settings = useSettings.getState();
  if (settings.soundMuted) return 0;
  return (kind === "walkout" ? settings.walkoutSounds : settings.uiSounds) ? 1 : 0;
}

/** Roep aan in een klik- of tikhandler, vóór het eerste geluid. */
export function unlockAudio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!context) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    context = new Ctor({ latencyHint: "interactive" });
    master = createMasterChain(context);
    master.gain.value = volumeFor("walkout") * MASTER_LEVEL;
    unsubscribe ??= useSettings.subscribe((state, previous) => {
      if (!master || !context) return;
      if (
        state.soundMuted !== previous.soundMuted ||
        state.walkoutSounds !== previous.walkoutSounds
      ) {
        master.gain.setTargetAtTime(volumeFor("walkout") * MASTER_LEVEL, context.currentTime, 0.05);
      }
    });
  }
  if (context.state === "suspended") void context.resume();
  return context;
}

/**
 * Feature A: de spanningsloop live, zolang het gokmoment duurt. In stukken van
 * 12 seconden, zodat hij zo lang kan duren als jij nodig hebt. Altijd ingepland
 * (ook als het geluid uit staat): de master-volumeknop regelt of je hem hoort.
 */
export function startLiveTension(): SoundHandle | null {
  const ctx = context;
  const out = master;
  if (!ctx || !out) return null;
  const chunk = 12;
  const start = ctx.currentTime + 0.02;
  const handles: SoundHandle[] = [];
  let scheduled = 0;
  const schedule = () => {
    while (scheduled < ctx.currentTime - start + chunk) {
      handles.push(
        playCue(
          ctx,
          out,
          { at: 0, cue: "spanning", duration: chunk, offset: scheduled },
          start + scheduled,
          {
            tier: "zilver",
          },
        ),
      );
      scheduled += chunk;
    }
  };
  schedule();
  const timer = setInterval(schedule, 4000);
  return {
    stop(at = ctx.currentTime) {
      clearInterval(timer);
      handles.forEach((handle) => handle.stop(at));
    },
  };
}

/** Speelt een cue nu meteen (live walkout). Geeft null als geluid uit staat. */
export function playLiveCue(
  event: SoundEvent,
  details: { tier: CardTier; peakAfter?: number },
): SoundHandle | null {
  if (!context || !master || volumeFor("walkout") === 0) return null;
  return playCue(context, master, event, context.currentTime + 0.01, details);
}
