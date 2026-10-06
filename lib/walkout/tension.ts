/**
 * Het gokmoment (feature A) als functie van tau: de tijd sinds het silhouet
 * stil hangt. Hartslag, spanning en camera lopen in beeld en geluid precies
 * gelijk op, ook in de video (feature B).
 */
const FIRST_BEAT = 0.4;
const MAX_BEATS = 20_000;

/** Slagen per minuut: van 64 naar 110, steeds sneller. */
export function heartbeatTempo(tau: number): number {
  return 64 + 46 * (1 - Math.exp(-Math.max(0, tau) / 18));
}

const periodAt = (tau: number) => 60 / heartbeatTempo(tau);

/** Momenten van elke "lub" in [from, to). Altijd vanaf het begin gerekend, dus stuksgewijs gelijk. */
export function heartbeats(from: number, to: number): number[] {
  const beats: number[] = [];
  let tau = FIRST_BEAT;
  for (let i = 0; i < MAX_BEATS && tau < to; i++) {
    if (tau >= from) beats.push(tau);
    tau += periodAt(tau);
  }
  return beats;
}

/** Na een lub volgt de dub, een stuk zachter. */
export const dubAfter = (beat: number) => beat + periodAt(beat) * 0.26;

/** Visuele hartslag (0–1): een piek op elke lub en een kleinere op de dub. */
export function pulseAt(tau: number): number {
  if (tau < FIRST_BEAT) return 0;
  let beat = FIRST_BEAT;
  for (let i = 0; i < MAX_BEATS; i++) {
    const next = beat + periodAt(beat);
    if (next > tau) break;
    beat = next;
  }
  const lub = Math.exp(-(tau - beat) / 0.11);
  const dub = dubAfter(beat);
  return Math.min(1, lub + (tau >= dub ? 0.6 * Math.exp(-(tau - dub) / 0.11) : 0));
}

/** Hoe intens de spanningsloop klinkt (0–1). */
export function intensityAt(tau: number): number {
  return 1 - Math.exp(-Math.max(0, tau) / 20);
}

/** De camera zoomt heel langzaam in, tot hooguit 9%. */
export function zoomAt(tau: number): number {
  return 1 + 0.09 * (1 - Math.exp(-Math.max(0, tau) / 10));
}
