import { createMasterChain, playCue } from "@/lib/audio/synth";
import type { CardTier } from "@/lib/calc/tiers";
import type { SoundEvent } from "@/lib/walkout/plan";

/** Samplefrequentie van video-geluid (aac en opus willen 48 kHz). */
export const VIDEO_SAMPLE_RATE = 48_000;

/**
 * Rendert een rij geluiden offline, met dezelfde recepten als live. Sneller
 * dan realtime en elke keer exact hetzelfde. Aan het eind zakt het volume
 * weg (bij een cliffhanger kort, anders rustig). Null als de browser geen
 * OfflineAudioContext heeft: dan wordt de video stil.
 */
export async function renderSoundtrack(
  sounds: readonly SoundEvent[],
  {
    duration,
    tier,
    peakAfter,
    fadeOut = 0.6,
  }: { duration: number; tier: CardTier; peakAfter?: number; fadeOut?: number },
): Promise<AudioBuffer | null> {
  if (typeof OfflineAudioContext === "undefined") return null;
  const ctx = new OfflineAudioContext({
    numberOfChannels: 2,
    length: Math.max(1, Math.ceil(duration * VIDEO_SAMPLE_RATE)),
    sampleRate: VIDEO_SAMPLE_RATE,
  });
  const master = createMasterChain(ctx);
  const level = master.gain.value;
  master.gain.setValueAtTime(level, Math.max(0, duration - fadeOut));
  master.gain.linearRampToValueAtTime(0, duration);
  for (const sound of sounds) playCue(ctx, master, sound, sound.at, { tier, peakAfter });
  return ctx.startRendering();
}
