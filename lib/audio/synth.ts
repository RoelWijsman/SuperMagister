import { createRandom } from "@/lib/random";
import type { CardTier } from "@/lib/calc/tiers";
import type { SoundEvent } from "@/lib/walkout/plan";

/**
 * Alle geluiden van SuperMagister, gesynthetiseerd met Web Audio: geen
 * bestanden. Elk recept werkt op elke BaseAudioContext, dus live
 * (AudioContext) én offline (OfflineAudioContext, voor de video van feature B).
 * Ruis is gezaaid, dus offline renderen geeft steeds hetzelfde resultaat.
 */
export interface SoundHandle {
  /** Zacht afbreken (bijv. bij overslaan of de volgende kaart). */
  stop(at?: number): void;
}

const noop: SoundHandle = { stop() {} };

type Ctx = BaseAudioContext;

// ——— Bouwstenen ——————————————————————————————————————————————————————————

const buffers = new WeakMap<Ctx, Map<string, AudioBuffer>>();

/** Ruisbuffer van 2 seconden, gezaaid (wit, roze of bruin). */
function noise(ctx: Ctx, kind: "wit" | "roze" | "bruin" = "wit"): AudioBuffer {
  let perCtx = buffers.get(ctx);
  if (!perCtx) {
    perCtx = new Map();
    buffers.set(ctx, perCtx);
  }
  const cached = perCtx.get(kind);
  if (cached) return cached;

  const length = Math.round(ctx.sampleRate * 2);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  const random = createRandom(kind === "wit" ? 11 : kind === "roze" ? 22 : 33);
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let last = 0;
  for (let i = 0; i < length; i++) {
    const white = random.next() * 2 - 1;
    if (kind === "wit") data[i] = white;
    else if (kind === "roze") {
      b0 = 0.99765 * b0 + white * 0.099046;
      b1 = 0.963 * b1 + white * 0.2965164;
      b2 = 0.57 * b2 + white * 1.0526913;
      data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.2;
    } else {
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }
  }
  perCtx.set(kind, buffer);
  return buffer;
}

function noiseSource(
  ctx: Ctx,
  kind: "wit" | "roze" | "bruin",
  when: number,
  duration: number,
  loop = true,
) {
  const source = ctx.createBufferSource();
  source.buffer = noise(ctx, kind);
  source.loop = loop;
  // Steeds ergens anders in de buffer beginnen, maar niet zo laat dat een
  // niet-herhalend geluid eerder ophoudt dan bedoeld.
  const offset = (when * 7.31) % 1.5;
  source.start(when, loop ? offset : Math.min(offset, Math.max(0, 1.95 - duration)));
  source.stop(when + duration + 0.05);
  return source;
}

function filter(ctx: Ctx, type: BiquadFilterType, frequency: number, q = 0.7) {
  const node = ctx.createBiquadFilter();
  node.type = type;
  node.frequency.value = frequency;
  node.Q.value = q;
  return node;
}

/** Envelope: punten [tijd vanaf `when`, waarde], exponentieel tussen de punten. */
function envelope(ctx: Ctx, when: number, points: readonly (readonly [number, number])[]) {
  const gain = ctx.createGain();
  const first = points[0];
  gain.gain.setValueAtTime(Math.max(first?.[1] ?? 0.0001, 0.0001), when + (first?.[0] ?? 0));
  for (const [time, value] of points.slice(1)) {
    gain.gain.exponentialRampToValueAtTime(Math.max(value, 0.0001), when + time);
  }
  return gain;
}

function panner(ctx: Ctx, pan: number) {
  const node = ctx.createStereoPanner();
  node.pan.value = Math.max(-1, Math.min(1, pan));
  return node;
}

function softClip(ctx: Ctx) {
  const shaper = ctx.createWaveShaper();
  const curve = new Float32Array(1024);
  for (let i = 0; i < curve.length; i++) {
    const x = (i / (curve.length - 1)) * 2 - 1;
    curve[i] = Math.tanh(x * 2.2) / Math.tanh(2.2);
  }
  shaper.curve = curve;
  return shaper;
}

const NOTE = (semitonesFromA4: number) => 440 * 2 ** (semitonesFromA4 / 12);

// ——— Recepten ————————————————————————————————————————————————————————————

/** Stadionruis: laag geroezemoes dat aanzwelt, met een langzame golf erin. */
function stadion(
  ctx: Ctx,
  out: AudioNode,
  when: number,
  strength: number,
  duration: number,
): SoundHandle {
  const level = 0.2 * strength;
  const rumble = noiseSource(ctx, "roze", when, duration + 2);
  const low = filter(ctx, "lowpass", 850, 0.4);
  const crowd = noiseSource(ctx, "wit", when, duration + 2);
  const band = filter(ctx, "bandpass", 1100, 0.9);
  const crowdGain = ctx.createGain();
  crowdGain.gain.value = 0.35;

  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, when);
  master.gain.exponentialRampToValueAtTime(level, when + 1.4);
  master.gain.setValueAtTime(level, when + Math.max(1.5, duration - 1));
  master.gain.exponentialRampToValueAtTime(0.0001, when + duration + 1);

  const wave = ctx.createOscillator();
  wave.frequency.value = 0.23;
  const waveDepth = ctx.createGain();
  waveDepth.gain.value = level * 0.35;
  wave.connect(waveDepth).connect(master.gain);
  wave.start(when);
  wave.stop(when + duration + 2);

  rumble.connect(low).connect(master);
  crowd.connect(band).connect(crowdGain).connect(master);
  master.connect(out);

  return {
    stop(at = ctx.currentTime) {
      master.gain.cancelScheduledValues(at);
      master.gain.setTargetAtTime(0.0001, at, 0.3);
    },
  };
}

/** Whoosh: gefilterde ruis die van laag naar hoog veegt en van links naar rechts gaat. */
function whoosh(ctx: Ctx, out: AudioNode, when: number, pan = 0, length = 0.65): SoundHandle {
  const source = noiseSource(ctx, "wit", when, length + 0.1);
  const band = filter(ctx, "bandpass", 300, 1.4);
  band.frequency.setValueAtTime(300, when);
  band.frequency.exponentialRampToValueAtTime(3400, when + length * 0.55);
  band.frequency.exponentialRampToValueAtTime(700, when + length);
  const gain = envelope(ctx, when, [
    [0, 0.0001],
    [length * 0.45, 0.42],
    [length, 0.0001],
  ]);
  const pans = panner(ctx, pan);
  pans.pan.setValueAtTime(pan, when);
  pans.pan.linearRampToValueAtTime(-pan * 0.6, when + length);
  source.connect(band).connect(gain).connect(pans).connect(out);
  return noop;
}

/** Sub-boem: dalende sinus met een klik en een rommel erachter. */
function boem(ctx: Ctx, out: AudioNode, when: number, strength = 1): SoundHandle {
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(150, when);
  osc.frequency.exponentialRampToValueAtTime(40, when + 0.5);
  const oscGain = envelope(ctx, when, [
    [0, 0.0001],
    [0.008, 0.85 * strength],
    [1.1, 0.0001],
  ]);
  osc.connect(softClip(ctx)).connect(oscGain).connect(out);
  osc.start(when);
  osc.stop(when + 1.2);

  const click = noiseSource(ctx, "wit", when, 0.06, false);
  const high = filter(ctx, "highpass", 1800);
  const clickGain = envelope(ctx, when, [
    [0, 0.3 * strength],
    [0.05, 0.0001],
  ]);
  click.connect(high).connect(clickGain).connect(out);

  const rumble = noiseSource(ctx, "bruin", when, 1);
  const low = filter(ctx, "lowpass", 220);
  const rumbleGain = envelope(ctx, when, [
    [0, 0.0001],
    [0.02, 0.5 * strength],
    [0.95, 0.0001],
  ]);
  rumble.connect(low).connect(rumbleGain).connect(out);
  return noop;
}

/** Sissende flares met een flakkerend ritme. */
function flare(
  ctx: Ctx,
  out: AudioNode,
  when: number,
  strength: number,
  duration: number,
): SoundHandle {
  const source = noiseSource(ctx, "wit", when, duration);
  const high = filter(ctx, "highpass", 2600, 0.5);
  const gain = envelope(ctx, when, [
    [0, 0.0001],
    [0.25, 0.07 * strength],
    [Math.max(0.3, duration - 0.6), 0.06 * strength],
    [duration, 0.0001],
  ]);
  const flicker = ctx.createOscillator();
  flicker.frequency.value = 13;
  const depth = ctx.createGain();
  depth.gain.value = 0.025 * strength;
  flicker.connect(depth).connect(gain.gain);
  flicker.start(when);
  flicker.stop(when + duration);
  source.connect(high).connect(gain).connect(out);
  return noop;
}

/** Opstijgende riser terwijl het silhouet ronddraait. */
function spin(ctx: Ctx, out: AudioNode, when: number, duration: number): SoundHandle {
  const source = noiseSource(ctx, "wit", when, duration);
  const band = filter(ctx, "bandpass", 200, 2);
  band.frequency.setValueAtTime(200, when);
  band.frequency.exponentialRampToValueAtTime(2600, when + duration);
  const gain = envelope(ctx, when, [
    [0, 0.0001],
    [duration * 0.85, 0.22],
    [duration, 0.0001],
  ]);
  source.connect(band).connect(gain).connect(out);

  const riser = ctx.createOscillator();
  riser.type = "sine";
  riser.frequency.setValueAtTime(55, when);
  riser.frequency.exponentialRampToValueAtTime(130, when + duration);
  const riserGain = envelope(ctx, when, [
    [0, 0.0001],
    [duration * 0.9, 0.14],
    [duration, 0.0001],
  ]);
  riser.connect(riserGain).connect(out);
  riser.start(when);
  riser.stop(when + duration + 0.05);
  return noop;
}

const CHORDS: Readonly<Record<CardTier, number[]>> = {
  brons: [-12, -9, -5],
  zilver: [3, 7, 10],
  goud: [3, 7, 10, 15],
  toty: [5, 9, 12, 19],
  icon: [-9, -2, 3, 7, 10, 15],
};

/** Onthulling: een glanzend akkoord met een glinsterende arpeggio erachteraan. */
function onthulling(
  ctx: Ctx,
  out: AudioNode,
  when: number,
  tier: CardTier,
  strength = 1,
): SoundHandle {
  const notes = CHORDS[tier];
  const low = filter(ctx, "lowpass", 6000);
  const bus = ctx.createGain();
  bus.gain.value = 0.9 * strength;
  low.connect(bus).connect(out);
  for (const semitones of notes) {
    for (const [type, octave, level] of [
      ["triangle", 0, 0.09],
      ["sine", 12, 0.04],
    ] as const) {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = NOTE(semitones + octave);
      const gain = envelope(ctx, when, [
        [0, 0.0001],
        [0.012, level],
        [2.4, 0.0001],
      ]);
      osc.connect(gain).connect(low);
      osc.start(when);
      osc.stop(when + 2.5);
    }
  }
  const top = Math.max(...notes) + 12;
  [0, 4, 7, 12, 16, 19].forEach((step, i) => {
    const at = when + 0.08 + i * 0.045;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = NOTE(top + step - 12);
    const gain = envelope(ctx, at, [
      [0, 0.0001],
      [0.006, 0.05],
      [0.45, 0.0001],
    ]);
    osc.connect(gain).connect(low);
    osc.start(at);
    osc.stop(at + 0.5);
  });
  return noop;
}

/** Juichend publiek: banden ruis met een rusteloze modulatie. */
function juichen(
  ctx: Ctx,
  out: AudioNode,
  when: number,
  strength: number,
  duration: number,
): SoundHandle {
  const level = 0.3 * strength;
  const source = noiseSource(ctx, "roze", when, duration + 1);
  const voices = filter(ctx, "bandpass", 1400, 0.6);
  const air = noiseSource(ctx, "wit", when, duration + 1);
  const airBand = filter(ctx, "bandpass", 2700, 0.9);
  const airGain = ctx.createGain();
  airGain.gain.value = 0.25;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, when);
  master.gain.exponentialRampToValueAtTime(level, when + 0.35);
  master.gain.setValueAtTime(level, when + duration * 0.55);
  master.gain.exponentialRampToValueAtTime(0.0001, when + duration);
  for (const [frequency, depthValue] of [
    [6.5, 0.08],
    [9.3, 0.06],
  ] as const) {
    const lfo = ctx.createOscillator();
    lfo.frequency.value = frequency;
    const depth = ctx.createGain();
    depth.gain.value = depthValue * strength;
    lfo.connect(depth).connect(master.gain);
    lfo.start(when);
    lfo.stop(when + duration);
  }
  source.connect(voices).connect(master);
  air.connect(airBand).connect(airGain).connect(master);
  master.connect(out);
  return {
    stop(at = ctx.currentTime) {
      master.gain.cancelScheduledValues(at);
      master.gain.setTargetAtTime(0.0001, at, 0.25);
    },
  };
}

/** Vuurwerk: een knal met een plof, en daarna geknetter. */
function vuurwerk(ctx: Ctx, out: AudioNode, when: number, pan = 0, strength = 1): SoundHandle {
  const pans = panner(ctx, pan);
  pans.connect(out);
  const thump = ctx.createOscillator();
  thump.frequency.setValueAtTime(95, when);
  thump.frequency.exponentialRampToValueAtTime(38, when + 0.3);
  const thumpGain = envelope(ctx, when, [
    [0, 0.0001],
    [0.005, 0.45 * strength],
    [0.4, 0.0001],
  ]);
  thump.connect(thumpGain).connect(pans);
  thump.start(when);
  thump.stop(when + 0.45);

  const burst = noiseSource(ctx, "wit", when, 0.5, false);
  const low = filter(ctx, "lowpass", 3400);
  const burstGain = envelope(ctx, when, [
    [0, 0.0001],
    [0.004, 0.4 * strength],
    [0.38, 0.0001],
  ]);
  burst.connect(low).connect(burstGain).connect(pans);

  const random = createRandom(Math.round(when * 1000) + 7);
  const crackleHigh = filter(ctx, "highpass", 3000);
  crackleHigh.connect(pans);
  for (let i = 0; i < 22; i++) {
    const at = when + 0.22 + i * 0.032 + random.next() * 0.04;
    const click = noiseSource(ctx, "wit", at, 0.012, false);
    const gain = envelope(ctx, at, [
      [0, 0.16 * strength * (1 - i / 26)],
      [0.01, 0.0001],
    ]);
    click.connect(gain).connect(crackleHigh);
  }
  return noop;
}

/** ICON-finale: een episch aanzwellend akkoord met een crash op het moment van de onthulling. */
function finale(ctx: Ctx, out: AudioNode, when: number, peakAfter: number): SoundHandle {
  const peak = when + Math.max(0.4, peakAfter);
  const sweep = filter(ctx, "lowpass", 250, 1.2);
  sweep.frequency.setValueAtTime(250, when);
  sweep.frequency.exponentialRampToValueAtTime(4500, peak);
  const bus = ctx.createGain();
  bus.gain.setValueAtTime(0.0001, when);
  bus.gain.exponentialRampToValueAtTime(0.16, peak);
  bus.gain.setValueAtTime(0.16, peak + 0.6);
  bus.gain.exponentialRampToValueAtTime(0.0001, peak + 3.2);
  sweep.connect(bus).connect(out);
  for (const semitones of [-33, -26, -21, -17, -14]) {
    for (const detune of [-7, 7]) {
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.value = NOTE(semitones);
      osc.detune.value = detune;
      osc.connect(sweep);
      osc.start(when);
      osc.stop(peak + 3.3);
    }
  }
  boem(ctx, out, peak, 1);
  const crash = noiseSource(ctx, "wit", peak, 2.6, false);
  const high = filter(ctx, "highpass", 6000);
  const crashGain = envelope(ctx, peak, [
    [0, 0.0001],
    [0.01, 0.22],
    [2.5, 0.0001],
  ]);
  crash.connect(high).connect(crashGain).connect(out);
  return noop;
}

/** Bij een onvoldoende: een warm, rustig akkoord. Geen drama. */
function zacht(ctx: Ctx, out: AudioNode, when: number): SoundHandle {
  const low = filter(ctx, "lowpass", 1800);
  low.connect(out);
  for (const semitones of [-16, -12, -9, -5]) {
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = NOTE(semitones);
    const gain = envelope(ctx, when, [
      [0, 0.0001],
      [0.45, 0.055],
      [3, 0.0001],
    ]);
    osc.connect(gain).connect(low);
    osc.start(when);
    osc.stop(when + 3.1);
  }
  return noop;
}

/** Het pack scheurt open. */
function scheur(ctx: Ctx, out: AudioNode, when: number): SoundHandle {
  const source = noiseSource(ctx, "wit", when, 0.55, false);
  const band = filter(ctx, "bandpass", 1800, 0.8);
  const gain = envelope(ctx, when, [
    [0, 0.0001],
    [0.03, 0.42],
    [0.5, 0.0001],
  ]);
  const rip = ctx.createOscillator();
  rip.type = "square";
  rip.frequency.value = 36;
  const ripDepth = ctx.createGain();
  ripDepth.gain.value = 0.18;
  rip.connect(ripDepth).connect(gain.gain);
  rip.start(when);
  rip.stop(when + 0.5);
  source.connect(band).connect(gain).connect(out);
  whoosh(ctx, out, when, 0, 0.45);
  return noop;
}

/** Glinstering, bijvoorbeeld als het pack begint te gloeien. */
function glans(ctx: Ctx, out: AudioNode, when: number, strength = 1): SoundHandle {
  [19, 22, 26, 29, 33].forEach((semitones, i) => {
    const at = when + i * 0.05;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = NOTE(semitones);
    const gain = envelope(ctx, at, [
      [0, 0.0001],
      [0.008, 0.045 * strength],
      [0.6, 0.0001],
    ]);
    osc.connect(gain).connect(out);
    osc.start(at);
    osc.stop(at + 0.65);
  });
  return noop;
}

/** Feature A: het tikje van de gokslider. Kort en droog; de toonhoogte loopt mee met je gok. */
function tik(ctx: Ctx, out: AudioNode, when: number, pitch = 660): SoundHandle {
  const osc = ctx.createOscillator();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(pitch, when);
  osc.frequency.exponentialRampToValueAtTime(pitch * 0.9, when + 0.05);
  const gain = envelope(ctx, when, [
    [0, 0.0001],
    [0.003, 0.08],
    [0.06, 0.0001],
  ]);
  osc.connect(gain).connect(out);
  osc.start(when);
  osc.stop(when + 0.07);
  return noop;
}

/** Feature A: je gok vastzetten. Een klik met een lage plof eronder. */
function vastzetten(ctx: Ctx, out: AudioNode, when: number): SoundHandle {
  const click = noiseSource(ctx, "wit", when, 0.06, false);
  const high = filter(ctx, "highpass", 2500);
  const clickGain = envelope(ctx, when, [
    [0, 0.0001],
    [0.002, 0.28],
    [0.05, 0.0001],
  ]);
  click.connect(high).connect(clickGain).connect(out);

  const thump = ctx.createOscillator();
  thump.type = "sine";
  thump.frequency.setValueAtTime(190, when);
  thump.frequency.exponentialRampToValueAtTime(70, when + 0.18);
  const thumpGain = envelope(ctx, when, [
    [0, 0.0001],
    [0.01, 0.34],
    [0.26, 0.0001],
  ]);
  thump.connect(thumpGain).connect(out);
  thump.start(when);
  thump.stop(when + 0.3);
  return noop;
}

/** Feature A: precies goed gegokt. Een paars, magisch arpeggio met een glinstering. */
function helderziende(ctx: Ctx, out: AudioNode, when: number): SoundHandle {
  [12, 16, 19, 23, 26, 28, 31].forEach((semitones, i) => {
    const at = when + i * 0.07;
    for (const detune of [-7, 7]) {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = NOTE(semitones);
      osc.detune.value = detune;
      const gain = envelope(ctx, at, [
        [0, 0.0001],
        [0.012, 0.045],
        [1.4, 0.0001],
      ]);
      osc.connect(gain).connect(out);
      osc.start(at);
      osc.stop(at + 1.5);
    }
  });
  const shimmer = noiseSource(ctx, "wit", when, 1.6, false);
  const band = filter(ctx, "bandpass", 6500, 2);
  const shimmerGain = envelope(ctx, when, [
    [0, 0.0001],
    [0.3, 0.07],
    [1.5, 0.0001],
  ]);
  shimmer.connect(band).connect(shimmerGain).connect(out);
  boem(ctx, out, when, 0.45);
  return noop;
}

/** Speelt één geluid uit de walkout-tijdlijn op `when` (in de tijd van de context). */
export function playCue(
  ctx: BaseAudioContext,
  out: AudioNode,
  event: SoundEvent,
  when: number,
  context: { tier: CardTier; peakAfter?: number },
): SoundHandle {
  const strength = event.strength ?? 1;
  switch (event.cue) {
    case "stadion":
      return stadion(ctx, out, when, strength, event.duration ?? 9);
    case "flare":
      return flare(ctx, out, when, strength, event.duration ?? 2);
    case "whoosh":
      return whoosh(ctx, out, when, event.pan ?? 0);
    case "boem":
      return boem(ctx, out, when, strength);
    case "spin":
      return spin(ctx, out, when, event.duration ?? 1.2);
    case "onthulling":
      return onthulling(ctx, out, when, context.tier, Math.max(0.6, strength));
    case "juichen":
      return juichen(ctx, out, when, strength, event.duration ?? 3);
    case "vuurwerk":
      return vuurwerk(ctx, out, when, event.pan ?? 0, strength);
    case "finale":
      return finale(ctx, out, when, context.peakAfter ?? 0.7);
    case "zacht":
      return zacht(ctx, out, when);
    case "scheur":
      return scheur(ctx, out, when);
    case "glans":
      return glans(ctx, out, when, strength);
    case "helderziende":
      return helderziende(ctx, out, when);
    case "tik":
      return tik(ctx, out, when, event.pitch);
    case "vastzetten":
      return vastzetten(ctx, out, when);
  }
}

/** Een master-keten met compressor, zodat niets ooit vervormt. */
export function createMasterChain(ctx: BaseAudioContext, destination: AudioNode = ctx.destination) {
  const master = ctx.createGain();
  master.gain.value = 0.9;
  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -14;
  compressor.knee.value = 12;
  compressor.ratio.value = 5;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.25;
  master.connect(compressor).connect(destination);
  return master;
}
