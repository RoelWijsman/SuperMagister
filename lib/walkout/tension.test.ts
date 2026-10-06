import { describe, expect, it } from "vitest";
import { heartbeats, heartbeatTempo, intensityAt, pulseAt, zoomAt } from "./tension";

describe("hartslag tijdens het gokmoment", () => {
  it("begint rustig en wordt steeds sneller, tot zo'n 110 slagen per minuut", () => {
    expect(heartbeatTempo(0)).toBeCloseTo(64);
    for (let tau = 1; tau < 120; tau++)
      expect(heartbeatTempo(tau)).toBeGreaterThan(heartbeatTempo(tau - 1));
    expect(heartbeatTempo(300)).toBeGreaterThan(108);
    expect(heartbeatTempo(300)).toBeLessThanOrEqual(110);
  });

  it("geeft steeds kortere tussenpozen", () => {
    const beats = heartbeats(0, 30);
    expect(beats[0]).toBeGreaterThan(0);
    expect(beats[0]).toBeLessThan(0.6);
    const gaps = beats.slice(1).map((b, i) => b - beats[i]!);
    expect(gaps[gaps.length - 1]!).toBeLessThan(gaps[0]!);
  });

  it("geeft hetzelfde ritme, ook als je het in stukken opvraagt", () => {
    const whole = heartbeats(0, 20);
    expect([...heartbeats(0, 8), ...heartbeats(8, 20)]).toEqual(whole);
  });

  it("pulseert op de slag en zakt daarna weg", () => {
    const [first, second] = heartbeats(0, 3);
    expect(pulseAt(first!)).toBeCloseTo(1, 1);
    expect(pulseAt(first! - 0.05)).toBeLessThan(0.3);
    expect(pulseAt((first! + second!) / 2 + 0.2)).toBeLessThan(0.25);
  });
});

describe("spanning en camera", () => {
  it("bouwt de spanning langzaam op", () => {
    expect(intensityAt(0)).toBe(0);
    expect(intensityAt(10)).toBeGreaterThan(intensityAt(5));
    expect(intensityAt(600)).toBeLessThanOrEqual(1);
  });

  it("zoomt heel langzaam in, nooit te ver", () => {
    expect(zoomAt(0)).toBe(1);
    expect(zoomAt(1)).toBeLessThan(1.02);
    expect(zoomAt(20)).toBeGreaterThan(zoomAt(10));
    expect(zoomAt(600)).toBeLessThan(1.1);
  });
});
