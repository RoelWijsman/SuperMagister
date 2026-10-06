import { describe, expect, it } from "vitest";
import {
  ambientPuffs,
  ballistic,
  confettiCannons,
  confettoAt,
  fireworkShells,
  flarePuffs,
  flareSparks,
  glitterTwinkles,
  puffAt,
  shellParticleAt,
  shellRocketAt,
  sparkAt,
  twinkleAlpha,
} from "./particles";
import { buildWalkoutPlan } from "./plan";

const stage = { w: 1000, h: 1778 };

describe("ballistic", () => {
  it("begint op het startpunt", () => {
    expect(ballistic(10, 20, 300, -400, 1.5, 900, 0)).toEqual({ x: 10, y: 20 });
  });

  it("valt uiteindelijk naar beneden door de zwaartekracht", () => {
    const up = ballistic(0, 0, 0, -500, 1.2, 900, 0.2);
    const down = ballistic(0, 0, 0, -500, 1.2, 900, 3);
    expect(up.y).toBeLessThan(0);
    expect(down.y).toBeGreaterThan(up.y);
  });
});

describe("flarePuffs", () => {
  const options = { count: 4, colors: ["#ffd25c"], start: 1, length: 1.2 };

  it("is deterministisch per seed", () => {
    expect(flarePuffs(7, stage, options)).toEqual(flarePuffs(7, stage, options));
    expect(flarePuffs(7, stage, options)).not.toEqual(flarePuffs(8, stage, options));
  });

  it("maakt meer rook bij meer flares", () => {
    expect(flarePuffs(1, stage, { ...options, count: 8 }).length).toBeGreaterThan(
      flarePuffs(1, stage, options).length,
    );
  });

  it("leeft alleen binnen zijn levensduur en groeit", () => {
    const puff = flarePuffs(3, stage, options)[0]!;
    expect(puffAt(puff, puff.t0 - 0.01)).toBeNull();
    expect(puffAt(puff, puff.t0 + puff.life + 0.01)).toBeNull();
    const early = puffAt(puff, puff.t0 + puff.life * 0.2)!;
    const late = puffAt(puff, puff.t0 + puff.life * 0.8)!;
    expect(late.size).toBeGreaterThan(early.size);
    expect(late.y).toBeLessThan(early.y);
  });
});

describe("flareSparks", () => {
  it("geeft vonken die binnen hun levensduur zichtbaar zijn", () => {
    const sparks = flareSparks(5, stage, { count: 2, colors: ["#fff"], start: 1, length: 1 });
    expect(sparks.length).toBeGreaterThan(0);
    const spark = sparks[0]!;
    expect(sparkAt(spark, spark.t0 + spark.life / 2)).not.toBeNull();
    expect(sparkAt(spark, spark.t0 + spark.life + 0.1)).toBeNull();
  });
});

describe("confettiCannons", () => {
  const confetti = confettiCannons(9, stage, { count: 40, colors: ["#ffd25c", "#fff"], at: 6 });

  it("schiet van beide kanten", () => {
    const left = confetti.filter((c) => c.x0 < stage.w / 2);
    expect(left.length).toBe(20);
    const piece = left[0]!;
    const later = confettoAt(piece, piece.t0 + 0.3)!;
    expect(later.x).toBeGreaterThan(piece.x0);
  });

  it("is deterministisch", () => {
    expect(confettiCannons(9, stage, { count: 40, colors: ["#fff"], at: 6 })).toEqual(
      confettiCannons(9, stage, { count: 40, colors: ["#fff"], at: 6 }),
    );
  });
});

describe("fireworkShells", () => {
  const plan = buildWalkoutPlan({ tier: "icon", fail: false });
  const shells = fireworkShells(11, stage, plan.fireworks);

  it("maakt één vuurpijl per gepland vuurwerk", () => {
    expect(shells).toHaveLength(plan.fireworks.length);
  });

  it("vliegt eerst omhoog en knalt op het geplande punt", () => {
    const shell = shells[0]!;
    const rising = shellRocketAt(shell, (shell.cue.launchAt + shell.cue.burstAt) / 2)!;
    expect(rising.y).toBeLessThan(stage.h);
    expect(rising.y).toBeGreaterThan(shell.by);
    expect(shellRocketAt(shell, shell.cue.burstAt + 0.1)).toBeNull();
    const particle = shell.particles[0]!;
    const atBurst = shellParticleAt(shell, particle, shell.cue.burstAt)!;
    expect(atBurst.x).toBeCloseTo(shell.bx, 5);
    expect(atBurst.y).toBeCloseTo(shell.by, 5);
  });
});

describe("glitterTwinkles", () => {
  it("knippert tussen 0 en 1", () => {
    const twinkles = glitterTwinkles(2, stage, 30, ["#fff"]);
    for (const twinkle of twinkles) {
      for (const t of [0, 0.37, 1.2, 4.9]) {
        const alpha = twinkleAlpha(twinkle, t);
        expect(alpha).toBeGreaterThanOrEqual(0);
        expect(alpha).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe("ambientPuffs (rook tijdens het gokmoment)", () => {
  const stage = { w: 1778, h: 1000 };
  const options = { count: 4, colors: ["#ffd25c"] };

  it("is er pas als het gokmoment begint, en blijft dan altijd beperkt", () => {
    expect(ambientPuffs(7, stage, options, 10, 9, Infinity)).toEqual([]);
    for (const t of [10.5, 14, 60, 600]) {
      const puffs = ambientPuffs(7, stage, options, 10, t, Infinity);
      expect(puffs.length).toBeGreaterThan(0);
      expect(puffs.length).toBeLessThanOrEqual(25);
    }
  });

  it("is deterministisch: hetzelfde tijdstip geeft dezelfde rook", () => {
    expect(ambientPuffs(7, stage, options, 10, 33.3, Infinity)).toEqual(
      ambientPuffs(7, stage, options, 10, 33.3, Infinity),
    );
  });

  it("stopt met nieuwe rook zodra de kaart omdraait", () => {
    const after = ambientPuffs(7, stage, options, 10, 30, 20);
    for (const puff of after) expect(puff.t0).toBeLessThanOrEqual(20);
  });
});
