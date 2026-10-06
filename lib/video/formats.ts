/**
 * De video-engine (feature B), het pure deel: formaten, aantallen beelden en
 * welke manier van opnemen deze browser aankan. Herbruikbaar voor Wrapped
 * (feature C): de engine weet niets van walkouts.
 */

export const VIDEO_FORMATS = {
  staand: { width: 1080, height: 1920, label: "9:16" },
  vierkant: { width: 1080, height: 1080, label: "1:1" },
} as const;

export type VideoFormat = keyof typeof VIDEO_FORMATS;

export const VIDEO_FPS = 30;

/** Zoveel beelden zijn nodig voor `duration` seconden (minstens één). */
export function frameCount(duration: number, fps: number): number {
  return Math.max(1, Math.ceil(duration * fps - 1e-9));
}

/** Wat deze browser kan, per manier van opnemen. `null` = kan helemaal niet. */
export interface EncoderSupport {
  /** WebCodecs naar mp4: de eerste werkende codec voor beeld en geluid. */
  mp4: { video: string | null; audio: string | null } | null;
  /** WebCodecs naar webm. */
  webm: { video: string | null; audio: string | null } | null;
  /** MediaRecorder met canvas.captureStream(): het mime-type dat werkt. */
  recorder: string | null;
}

export type EncoderChoice =
  | { kind: "webcodecs"; container: "mp4" | "webm"; video: string; audio: string | null }
  | { kind: "mediarecorder"; mimeType: string; extension: "mp4" | "webm" }
  | { kind: "geen" };

/**
 * De beste manier van opnemen. WebCodecs rendert frame-exact (sneller dan
 * realtime); MediaRecorder neemt realtime op. Mp4 gaat vóór webm (deelt beter,
 * speelt overal) en een video met geluid vóór een stille.
 */
export function chooseEncoder(support: EncoderSupport): EncoderChoice {
  const { mp4, webm, recorder } = support;
  const recorderExtension = recorder ? extensionFor(recorder) : null;
  if (mp4?.video && mp4.audio) {
    return { kind: "webcodecs", container: "mp4", video: mp4.video, audio: mp4.audio };
  }
  if (recorder && recorderExtension === "mp4") {
    return { kind: "mediarecorder", mimeType: recorder, extension: "mp4" };
  }
  if (webm?.video && webm.audio) {
    return { kind: "webcodecs", container: "webm", video: webm.video, audio: webm.audio };
  }
  if (recorder && recorderExtension) {
    return { kind: "mediarecorder", mimeType: recorder, extension: recorderExtension };
  }
  if (mp4?.video) return { kind: "webcodecs", container: "mp4", video: mp4.video, audio: null };
  if (webm?.video) return { kind: "webcodecs", container: "webm", video: webm.video, audio: null };
  return { kind: "geen" };
}

const RECORDER_TYPES = [
  "video/mp4;codecs=avc1.640028,mp4a.40.2",
  "video/mp4;codecs=avc1,mp4a.40.2",
  "video/mp4",
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm",
] as const;

/** Het eerste type dat MediaRecorder hier aankan, of null. */
export function recorderMimeType(isSupported: (type: string) => boolean): string | null {
  return RECORDER_TYPES.find((type) => isSupported(type)) ?? null;
}

export function extensionFor(mimeType: string): "mp4" | "webm" {
  return mimeType.startsWith("video/mp4") ? "mp4" : "webm";
}
