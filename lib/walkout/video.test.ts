import { describe, expect, it } from "vitest";
import {
  MYSTERY_HOLD,
  mysteryCaption,
  videoFileName,
  walkoutVideoSounds,
  walkoutVideoTimeline,
  type WalkoutVideoInput,
} from "./video";

const base: WalkoutVideoInput = {
  tier: "goud",
  fail: false,
  actual: 7.8,
  guess: 7.2,
  mystery: false,
  hidden: false,
};

describe("walkoutVideoTimeline: mysterie", () => {
  const video = walkoutVideoTimeline({ ...base, mystery: true });
  const gokStart = video.plan.phases.gok.start;

  it("eindigt op het vraagteken, nooit bij de flip", () => {
    expect(video.plan.gok?.open).toBe(true);
    expect(video.end).toBeCloseTo(gokStart + MYSTERY_HOLD);
    expect(video.end).toBeLessThan(video.plan.phases.flip.start);
  });

  it("laat alleen een groot vraagteken zien, zonder je gok of de vraag aan jezelf", () => {
    expect(video.guessAt(video.end)).toEqual({ value: null, label: null });
  });

  it("kiest als preview het laatste beeld", () => {
    expect(video.posterAt).toBeLessThanOrEqual(video.end);
    expect(video.posterAt).toBeGreaterThan(video.end - 0.2);
  });
});

describe("walkoutVideoTimeline: normaal", () => {
  const video = walkoutVideoTimeline(base);
  const gok = video.plan.gok!;
  const gokStart = video.plan.phases.gok.start;

  it("laat de teller naar je gok rollen en daarna de flip", () => {
    expect(gok.guess).toBe(7.2);
    expect(video.guessAt(gokStart + 0.1)?.value).toBeNull();
    expect(video.guessAt(gok.lockAt)?.value).toBe(72);
    expect(video.plan.phases.flip.start).toBeGreaterThan(gok.lockAt);
  });

  it("noemt het getal 'mijn gok', zodat kijkers snappen wat ze zien", () => {
    expect(video.guessAt(gok.lockAt)?.label).toBe("MIJN GOK");
  });

  it("loopt door tot de kaart even stilligt", () => {
    expect(video.end).toBeGreaterThan(video.plan.restAt + 1);
    expect(Number.isFinite(video.end)).toBe(true);
    expect(video.posterAt).toBeGreaterThan(video.plan.restAt);
    expect(video.posterAt).toBeLessThan(video.end);
  });

  it("viert HELDERZIENDE bij een precies goede gok", () => {
    expect(walkoutVideoTimeline({ ...base, guess: 7.8 }).plan.helderziende).toBe(true);
  });

  it("verraadt een verborgen cijfer niet via HELDERZIENDE", () => {
    expect(walkoutVideoTimeline({ ...base, guess: 7.8, hidden: true }).plan.helderziende).toBe(
      false,
    );
  });

  it("is gewoon de walkout zonder gok, of bij V, G en O", () => {
    for (const input of [
      { ...base, guess: null },
      { ...base, actual: null },
    ]) {
      const plain = walkoutVideoTimeline(input);
      expect(plain.plan.gok).toBeNull();
      expect(plain.guessAt(plain.plan.restAt)).toBeUndefined();
    }
  });
});

describe("walkoutVideoSounds", () => {
  it("speelt alleen wat vóór het einde begint en kapt lange geluiden af", () => {
    const video = walkoutVideoTimeline(base);
    const end = video.plan.phases.flip.start;
    const sounds = walkoutVideoSounds(video.plan, end);
    expect(sounds.length).toBeGreaterThan(0);
    for (const sound of sounds) {
      expect(sound.at).toBeLessThan(end);
      if (sound.duration !== undefined) expect(sound.at + sound.duration).toBeLessThanOrEqual(end);
    }
  });

  it("laat in mysterie de hartslag doorgaan tot het laatste beeld", () => {
    const video = walkoutVideoTimeline({ ...base, mystery: true });
    const sounds = walkoutVideoSounds(video.plan, video.end);
    const tension = sounds.find((sound) => sound.cue === "spanning");
    expect(tension?.at).toBe(video.plan.phases.gok.start);
    expect(tension!.at + tension!.duration!).toBeCloseTo(video.end);
    expect(sounds.every((sound) => Number.isFinite(sound.at))).toBe(true);
  });

  it("staat op tijdvolgorde", () => {
    const sounds = walkoutVideoSounds(walkoutVideoTimeline(base).plan, 30);
    sounds.slice(1).forEach((sound, i) => expect(sound.at).toBeGreaterThanOrEqual(sounds[i]!.at));
  });
});

describe("mysteryCaption", () => {
  const video = walkoutVideoTimeline({ ...base, mystery: true });
  const gokStart = video.plan.phases.gok.start;

  it("verschijnt pas als het vraagteken er even staat, eerst de vraag en dan de inzet", () => {
    expect(mysteryCaption(video, gokStart + 0.2)).toEqual({ title: 0, line: 0 });
    const middle = mysteryCaption(video, gokStart + 1.4);
    expect(middle.title).toBeGreaterThan(0.9);
    expect(middle.line).toBeLessThan(0.1);
    expect(mysteryCaption(video, video.end)).toEqual({ title: 1, line: 1 });
  });

  it("is er niet in een normale video", () => {
    const normal = walkoutVideoTimeline(base);
    expect(mysteryCaption(normal, normal.end)).toEqual({ title: 0, line: 0 });
  });
});

describe("videoFileName", () => {
  it("noemt vak, datum en de modus", () => {
    expect(videoFileName({ subjectCode: "wisA", date: "2026-09-14" }, true, "mp4")).toBe(
      "supermagister-walkout-wisa-2026-09-14-mysterie.mp4",
    );
    expect(videoFileName({ subjectCode: "", date: "2026-09-14" }, false, "webm")).toBe(
      "supermagister-walkout-kaart-2026-09-14.webm",
    );
  });
});
