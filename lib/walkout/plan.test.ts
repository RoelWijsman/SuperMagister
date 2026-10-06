import { describe, expect, it } from "vitest";
import { buildPackPlan, buildWalkoutPlan, phaseAt, WALKOUT_PHASES } from "./plan";

const goud = buildWalkoutPlan({ tier: "goud", fail: false });
const icon = buildWalkoutPlan({ tier: "icon", fail: false });
const brons = buildWalkoutPlan({ tier: "brons", fail: true });
const reduced = buildWalkoutPlan({ tier: "icon", fail: false }, { reduced: true });

describe("buildWalkoutPlan: fases", () => {
  it.each([
    ["goud", goud],
    ["icon", icon],
    ["brons", brons],
    ["minder beweging", reduced],
  ])("%s: fases sluiten op elkaar aan", (_name, plan) => {
    let previousEnd = 0;
    for (const phase of WALKOUT_PHASES) {
      const { start, end } = plan.phases[phase];
      expect(start).toBeCloseTo(previousEnd, 10);
      expect(end).toBeGreaterThanOrEqual(start);
      previousEnd = end;
    }
    expect(plan.restAt).toBe(plan.phases.rust.start);
    expect(plan.revealAt).toBeGreaterThan(plan.phases.flip.start - 1e-9);
    expect(plan.revealAt).toBeLessThanOrEqual(plan.phases.flip.end);
  });

  it("duurt bij normale snelheid ongeveer 8 seconden", () => {
    expect(goud.restAt).toBeGreaterThan(7);
    expect(goud.restAt).toBeLessThan(9.5);
  });

  it("geeft ICON een slow-motion flip en meer flares", () => {
    const flip = (p: typeof goud) => p.phases.flip.end - p.phases.flip.start;
    expect(flip(icon)).toBeGreaterThan(flip(goud) * 1.8);
    expect(icon.fx.flares).toBeGreaterThan(goud.fx.flares);
    expect(icon.fx.shake).toBeGreaterThan(goud.fx.shake);
    expect(icon.fx.rays).toBe(true);
  });

  it("maakt het bij minder beweging kort en rustig", () => {
    expect(reduced.restAt).toBeLessThan(goud.restAt / 2);
    expect(reduced.fx).toMatchObject({
      flares: 0,
      shake: 0,
      confetti: 0,
      fireworks: 0,
      rays: false,
    });
  });
});

describe("buildWalkoutPlan: geluid", () => {
  const cues = (plan: typeof goud) => plan.events.map((e) => e.cue);

  it("houdt alle geluiden binnen de walkout", () => {
    for (const plan of [goud, icon, brons, reduced]) {
      for (const event of plan.events) {
        expect(event.at).toBeGreaterThanOrEqual(0);
        expect(event.at).toBeLessThanOrEqual(plan.duration);
      }
    }
  });

  it("geeft drie onthullingen met elk een whoosh en een boem", () => {
    expect(cues(goud).filter((c) => c === "whoosh").length).toBeGreaterThanOrEqual(3);
    expect(cues(goud).filter((c) => c === "boem").length).toBeGreaterThanOrEqual(3);
  });

  it("laat het juichen en vuurwerk horen vanaf goud", () => {
    expect(cues(goud)).toEqual(expect.arrayContaining(["juichen", "vuurwerk", "onthulling"]));
    expect(cues(icon)).toContain("finale");
  });

  it("houdt het rustig en bemoedigend bij een onvoldoende", () => {
    expect(cues(brons)).not.toContain("juichen");
    expect(cues(brons)).not.toContain("vuurwerk");
    expect(cues(brons)).toContain("zacht");
    expect(brons.fx).toMatchObject({ shake: 0, confetti: 0, fireworks: 0 });
  });

  it("laat elk vuurwerkgeluid samenvallen met een gepland vuurwerk", () => {
    const bursts = icon.fireworks.map((f) => f.burstAt);
    for (const event of icon.events.filter((e) => e.cue === "vuurwerk")) {
      expect(bursts).toContain(event.at);
    }
  });
});

describe("phaseAt", () => {
  it("vindt de fase en de voortgang binnen de fase", () => {
    expect(phaseAt(goud, -1)).toEqual({ phase: "intro", p: 0 });
    const middle = (goud.phases.vak.start + goud.phases.vak.end) / 2;
    expect(phaseAt(goud, middle).phase).toBe("vak");
    expect(phaseAt(goud, middle).p).toBeCloseTo(0.5, 5);
    expect(phaseAt(goud, 999).phase).toBe("rust");
  });
});

describe("buildPackPlan", () => {
  it("scheurt het pack open en speelt het juiste geluid", () => {
    const plan = buildPackPlan("toty");
    expect(plan.tearAt).toBeGreaterThan(0);
    expect(plan.tearAt).toBeLessThan(plan.duration);
    expect(plan.events.map((e) => e.cue)).toContain("scheur");
  });
});

describe("buildWalkoutPlan: helderziende (precies goed gegokt)", () => {
  const plain = buildWalkoutPlan({ tier: "goud", fail: false });
  const exact = buildWalkoutPlan({ tier: "goud", fail: false }, { helderziende: true });

  it("doet niets extra's zonder precies goede gok", () => {
    expect(plain.helderziende).toBe(false);
    expect(plain.events.some((e) => e.cue === "helderziende")).toBe(false);
  });

  it("speelt na de onthulling een eigen geluid", () => {
    expect(exact.helderziende).toBe(true);
    const event = exact.events.find((e) => e.cue === "helderziende");
    expect(event?.at).toBeGreaterThan(exact.revealAt);
    expect(event!.at).toBeLessThan(exact.restAt);
  });

  it("geeft het moment altijd genoeg tijd, ook bij een onvoldoende of minder beweging", () => {
    for (const plan of [
      exact,
      buildWalkoutPlan({ tier: "brons", fail: true }, { helderziende: true }),
      buildWalkoutPlan({ tier: "icon", fail: false }, { helderziende: true, reduced: true }),
    ]) {
      expect(plan.restAt - plan.revealAt).toBeGreaterThanOrEqual(2);
    }
  });
});
