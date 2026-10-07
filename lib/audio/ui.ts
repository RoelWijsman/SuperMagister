/**
 * Fase 3c: kleine geluidjes in de app, los van de walkout. Ook gesynthetiseerd,
 * zonder bestanden. Ze klinken alleen als "Geluidjes in de app" aan staat.
 */
export type UiSound = "plop" | "uit" | "klaar";

type Ctx = BaseAudioContext;

function tone(
  ctx: Ctx,
  out: AudioNode,
  when: number,
  {
    type = "sine",
    from,
    to = from,
    glide = 0.08,
    peak,
    length,
  }: {
    type?: OscillatorType;
    from: number;
    to?: number;
    glide?: number;
    peak: number;
    length: number;
  },
) {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(from, when);
  if (to !== from) osc.frequency.exponentialRampToValueAtTime(to, when + glide);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(peak, when + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + length);
  osc.connect(gain).connect(out);
  osc.start(when);
  osc.stop(when + length + 0.02);
}

/** Afvinken: een ronde plop, zoals een dop van een stift. */
function plop(ctx: Ctx, out: AudioNode, when: number) {
  tone(ctx, out, when, { from: 880, to: 260, glide: 0.07, peak: 0.42, length: 0.14 });
  tone(ctx, out, when + 0.05, {
    type: "triangle",
    from: 1320,
    to: 1500,
    glide: 0.04,
    peak: 0.06,
    length: 0.1,
  });
}

/** Weer uitvinken: dezelfde plop, maar zachter en omlaag. */
function uit(ctx: Ctx, out: AudioNode, when: number) {
  tone(ctx, out, when, { from: 420, to: 220, glide: 0.08, peak: 0.18, length: 0.12 });
}

/** De vijf minuten zijn om: twee zachte belletjes. */
function klaar(ctx: Ctx, out: AudioNode, when: number) {
  tone(ctx, out, when, { type: "triangle", from: 659.25, peak: 0.22, length: 0.9 });
  tone(ctx, out, when + 0.18, { type: "triangle", from: 987.77, peak: 0.2, length: 1.2 });
  tone(ctx, out, when + 0.18, { from: 1975.5, peak: 0.03, length: 0.6 });
}

export function playUiRecipe(ctx: Ctx, out: AudioNode, sound: UiSound, when: number) {
  if (sound === "plop") plop(ctx, out, when);
  else if (sound === "uit") uit(ctx, out, when);
  else klaar(ctx, out, when);
}
