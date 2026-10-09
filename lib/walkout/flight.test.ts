import { describe, expect, it } from "vitest";
import { guessFlight } from "./flight";
import { buildWalkoutPlan, SCRIPTED_LOCK_AFTER, type WalkoutPlanOptions } from "./plan";

const planWith = (options: WalkoutPlanOptions) =>
  buildWalkoutPlan({ tier: "goud", fail: false }, options);

const guessed = planWith({ gok: { lockedAfter: SCRIPTED_LOCK_AFTER, guess: 7.2 } });
const exact = planWith({
  gok: { lockedAfter: SCRIPTED_LOCK_AFTER, guess: 7.8 },
  helderziende: true,
});
const reduced = planWith({
  reduced: true,
  gok: { lockedAfter: SCRIPTED_LOCK_AFTER, guess: 7.2 },
});

const sample = (plan: typeof guessed, from: number, to: number) => {
  const frames = [];
  for (let t = from; t <= to; t += 0.01) frames.push(guessFlight(plan, t));
  return frames;
};

describe("guessFlight: je gok vliegt bij de flip naar de rating", () => {
  const gok = guessed.gok!;
  const flipStart = guessed.phases.flip.start;

  it("begint precies waar de teller stond: groot in het midden, met komma", () => {
    expect(guessFlight(guessed, flipStart - 0.01)).toBeNull();
    expect(guessFlight(guessed, flipStart)).toMatchObject({
      path: 0,
      comma: 1,
      ghost: 0,
      alpha: 1,
    });
  });

  it("landt naast de rating op het moment van de onthulling, zonder komma", () => {
    const frame = guessFlight(guessed, guessed.revealAt)!;
    expect(frame.path).toBeCloseTo(1);
    expect(frame.comma).toBeCloseTo(0);
  });

  it("vliegt alleen vooruit", () => {
    const paths = sample(guessed, flipStart, gok.impactAt + 1).map((f) => f!.path);
    paths.slice(1).forEach((path, i) => expect(path).toBeGreaterThanOrEqual(paths[i]! - 1e-9));
  });

  it("wordt een spookcijfer en klapt dan tegen de rating", () => {
    const waiting = guessFlight(guessed, gok.ghostAt - 0.01)!;
    expect(waiting.path).toBe(1);
    expect(waiting.ghost).toBe(1);
    expect(guessFlight(guessed, gok.impactAt)!.path).toBe(2);
  });

  it("veert terug na de klap en verdwijnt dan, zodat alleen het echte cijfer blijft", () => {
    expect(guessFlight(guessed, gok.impactAt + 0.11)!.bounce).toBeGreaterThan(0.9);
    // Na de klap nog even zichtbaar (je ziet hoe ver je ernaast zat)...
    expect(guessFlight(guessed, gok.impactAt + 0.3)!.alpha).toBeGreaterThan(0.3);
    // ...en dan weg: geen "4671" op de kaart of het eindscherm.
    const settled = guessFlight(guessed, gok.impactAt + 1.5)!;
    expect(settled.bounce).toBeCloseTo(0);
    expect(settled.alpha).toBe(0);
    expect(guessFlight(guessed, guessed.restAt)!.alpha).toBe(0);
  });

  it("smelt bij precies goed in de rating", () => {
    expect(guessFlight(exact, exact.gok!.impactAt + 0.5)!.alpha).toBe(0);
  });

  it("vliegt niet bij minder beweging: het getal vervaagt en verschijnt naast de rating", () => {
    const frames = sample(reduced, reduced.phases.flip.start, reduced.restAt);
    frames.forEach((frame) => expect([0, 2]).toContain(frame!.path));
    expect(frames.some((frame) => frame!.path === 2 && frame!.alpha > 0.4)).toBe(true);
    // Ook hier blijft hij niet over het echte cijfer hangen.
    expect(guessFlight(reduced, reduced.restAt)!.alpha).toBe(0);
  });

  it("is er niet zonder gok", () => {
    const skipped = planWith({ gok: { lockedAfter: 1, guess: null } });
    const none = planWith({});
    for (const t of [5, 9, 12, 20]) {
      expect(guessFlight(skipped, t)).toBeNull();
      expect(guessFlight(none, t)).toBeNull();
    }
  });
});
