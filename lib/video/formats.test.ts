import { describe, expect, it } from "vitest";
import {
  chooseEncoder,
  extensionFor,
  frameCount,
  recorderMimeType,
  VIDEO_FORMATS,
  type EncoderSupport,
} from "./formats";

describe("videoformaten", () => {
  it("maakt 9:16 en 1:1 in 1080 pixels breed", () => {
    expect(VIDEO_FORMATS.staand).toMatchObject({ width: 1080, height: 1920 });
    expect(VIDEO_FORMATS.vierkant).toMatchObject({ width: 1080, height: 1080 });
  });

  it("telt de beelden die nodig zijn, minstens één", () => {
    expect(frameCount(14.5, 30)).toBe(435);
    expect(frameCount(14.51, 30)).toBe(436);
    expect(frameCount(0, 30)).toBe(1);
  });
});

const none: EncoderSupport = { mp4: null, webm: null, recorder: null };

describe("chooseEncoder", () => {
  it("kiest frame-exact mp4 met WebCodecs als beeld en geluid kunnen", () => {
    expect(chooseEncoder({ ...none, mp4: { video: "avc", audio: "aac" } })).toEqual({
      kind: "webcodecs",
      container: "mp4",
      video: "avc",
      audio: "aac",
    });
  });

  it("gaat liever via MediaRecorder naar mp4 dan via WebCodecs naar webm", () => {
    expect(
      chooseEncoder({
        mp4: { video: null, audio: null },
        webm: { video: "vp9", audio: "opus" },
        recorder: "video/mp4",
      }),
    ).toEqual({ kind: "mediarecorder", mimeType: "video/mp4", extension: "mp4" });
  });

  it("kiest WebCodecs-webm als MediaRecorder alleen webm kan", () => {
    expect(
      chooseEncoder({
        mp4: { video: null, audio: null },
        webm: { video: "vp9", audio: "opus" },
        recorder: "video/webm;codecs=vp9,opus",
      }),
    ).toEqual({ kind: "webcodecs", container: "webm", video: "vp9", audio: "opus" });
  });

  it("wil geluid: zonder geluidscodec eerst MediaRecorder", () => {
    expect(
      chooseEncoder({
        mp4: { video: "avc", audio: null },
        webm: null,
        recorder: "video/webm",
      }),
    ).toEqual({ kind: "mediarecorder", mimeType: "video/webm", extension: "webm" });
  });

  it("maakt als laatste redmiddel een video zonder geluid", () => {
    expect(chooseEncoder({ ...none, mp4: { video: "avc", audio: null } })).toEqual({
      kind: "webcodecs",
      container: "mp4",
      video: "avc",
      audio: null,
    });
  });

  it("zegt eerlijk dat het niet kan", () => {
    expect(chooseEncoder(none)).toEqual({ kind: "geen" });
  });
});

describe("recorderMimeType", () => {
  it("probeert eerst mp4 met geluid, dan webm", () => {
    expect(recorderMimeType((type) => type.startsWith("video/mp4"))).toMatch(/^video\/mp4;codecs=/);
    expect(recorderMimeType((type) => type === "video/webm;codecs=vp8,opus")).toBe(
      "video/webm;codecs=vp8,opus",
    );
    expect(recorderMimeType(() => false)).toBeNull();
  });

  it("geeft bij elk type de juiste extensie", () => {
    expect(extensionFor("video/mp4;codecs=avc1")).toBe("mp4");
    expect(extensionFor("video/webm")).toBe("webm");
  });
});
