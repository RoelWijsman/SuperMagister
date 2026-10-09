import { describe, expect, it } from "vitest";
import {
  buildPackPlan,
  buildWalkoutPlan,
  phaseAt,
  SCRIPTED_LOCK_AFTER,
  scriptedGuessView,
  WALKOUT_PHASES,
} from "./plan";

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

  it("duurt bij normale snelheid ongeveer 9 seconden (vak, weging en toets lang genoeg om te lezen)", () => {
    expect(goud.restAt).toBeGreaterThan(8);
    expect(goud.restAt).toBeLessThan(10.5);
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

describe("buildWalkoutPlan: het gokmoment (feature A)", () => {
  const plain = buildWalkoutPlan({ tier: "goud", fail: false });
  const open = buildWalkoutPlan(
    { tier: "goud", fail: false },
    { gok: { lockedAfter: null, guess: null } },
  );
  const locked = buildWalkoutPlan(
    { tier: "goud", fail: false },
    { gok: { lockedAfter: 3, guess: 7.2 } },
  );
  const skipped = buildWalkoutPlan(
    { tier: "goud", fail: false },
    { gok: { lockedAfter: 2, guess: null } },
  );
  const at = (plan: typeof plain, cue: string) =>
    plan.events.filter((e) => e.cue === cue).map((e) => e.at);

  it("heeft zonder gokmoment een lege gok-fase en verder dezelfde tijdlijn", () => {
    expect(plain.gok).toBeNull();
    expect(plain.phases.gok.start).toBe(plain.phases.silhouet.end);
    expect(plain.phases.gok.end).toBe(plain.phases.gok.start);
  });

  it("laat het silhouet open hangen tot je gokt: geen flip, geen onthulling", () => {
    expect(open.gok?.open).toBe(true);
    expect(open.phases.gok.start).toBe(open.phases.silhouet.end);
    expect(open.phases.gok.end).toBe(Infinity);
    expect(open.revealAt).toBe(Infinity);
    expect(open.restAt).toBe(Infinity);
    for (const event of open.events) expect(Number.isNaN(event.at)).toBe(false);
    expect(phaseAt(open, open.phases.gok.start + 120).phase).toBe("gok");
  });

  it("zet de gok vast met een klik, dan een halve seconde stilte, dan de flip", () => {
    const { start, end } = locked.phases.gok;
    expect(locked.gok?.lockAt).toBeCloseTo(start + 3);
    expect(end).toBeCloseTo(start + 3.5);
    expect(locked.phases.flip.start).toBeCloseTo(end);
    expect(at(locked, "vastzetten")).toEqual([locked.gok!.lockAt]);
    const tension = locked.events.find((e) => e.cue === "spanning");
    expect(tension?.at).toBeCloseTo(start);
    expect(tension?.duration).toBeCloseTo(3);
  });

  it("draait zonder gok meteen om, zonder klik en zonder spookcijfer", () => {
    expect(skipped.phases.gok.end - skipped.gok!.lockAt).toBeLessThan(0.1);
    expect(at(skipped, "vastzetten")).toEqual([]);
    expect(skipped.gok?.ghostAt).toBe(Infinity);
  });

  it("laat het spookcijfer na de flip met een klap tegen de rating schuiven", () => {
    const { ghostAt, impactAt } = locked.gok!;
    expect(ghostAt).toBeGreaterThanOrEqual(locked.phases.flip.end);
    expect(impactAt).toBeGreaterThan(ghostAt);
    expect(at(locked, "boem")).toContain(impactAt);
    expect(locked.restAt - impactAt).toBeGreaterThanOrEqual(1.4);
  });

  it("laat het stadion zwijgen tijdens het gokmoment en terugkomen bij de flip", () => {
    const crowd = locked.events.filter((e) => e.cue === "stadion");
    expect(crowd).toHaveLength(2);
    expect(crowd[0]!.at + crowd[0]!.duration!).toBeLessThan(locked.phases.gok.start + 1.5);
    expect(crowd[1]!.at).toBeCloseTo(locked.phases.flip.start - 0.3);
    expect(at(open, "spanning")).toEqual([]);
  });

  it("laat HELDERZIENDE samenvallen met de klap, met tijd om het te lezen", () => {
    const exact = buildWalkoutPlan(
      { tier: "goud", fail: false },
      { gok: { lockedAfter: 3, guess: 7.6 }, helderziende: true },
    );
    expect(at(exact, "helderziende")).toEqual([exact.gok!.impactAt]);
    expect(exact.restAt - exact.gok!.impactAt).toBeGreaterThanOrEqual(2);
  });
});

describe("scriptedGuessView (herhaling en video)", () => {
  const plan = buildWalkoutPlan(
    { tier: "toty", fail: false },
    { gok: { lockedAfter: SCRIPTED_LOCK_AFTER, guess: 7.2 } },
  );
  const { start } = plan.phases.gok;

  it("toont eerst het vraagteken, rolt dan naar de gok en bevriest", () => {
    expect(scriptedGuessView(plan, start - 0.1)).toBeNull();
    expect(scriptedGuessView(plan, start + 0.2)).toBeNull();
    expect(scriptedGuessView(plan, plan.gok!.lockAt)).toBe(72);
    expect(scriptedGuessView(plan, plan.gok!.lockAt + 0.3)).toBe(72);
  });

  it("rolt steeds verder omhoog", () => {
    let previous = 0;
    for (let t = start + 0.75; t < plan.gok!.lockAt; t += 0.05) {
      const value = scriptedGuessView(plan, t) ?? 0;
      expect(value).toBeGreaterThanOrEqual(previous);
      previous = value;
    }
  });

  it("tikt bij elke tiende tijdens het rollen, met stijgende toon", () => {
    const ticks = plan.events.filter((e) => e.cue === "tik");
    expect(ticks.length).toBeGreaterThan(20);
    for (let i = 1; i < ticks.length; i++)
      expect(ticks[i]!.pitch!).toBeGreaterThan(ticks[i - 1]!.pitch!);
    expect(ticks[ticks.length - 1]!.at).toBeLessThanOrEqual(plan.gok!.lockAt);
  });
});
