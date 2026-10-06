import { VIDEO_SAMPLE_RATE } from "./audio";
import {
  chooseEncoder,
  frameCount,
  recorderMimeType,
  type EncoderChoice,
  type EncoderSupport,
} from "./formats";

/**
 * De video-engine (feature B): tekent een video beeld voor beeld en maakt er
 * een bestand van. Frame-exact via WebCodecs en Mediabunny (mp4, sneller dan
 * realtime); anders realtime met canvas.captureStream() en MediaRecorder.
 * Weet niets van walkouts, zodat Wrapped (feature C) hem ook kan gebruiken.
 */

export interface VideoJob {
  width: number;
  height: number;
  fps: number;
  /** Lengte in seconden. */
  duration: number;
  /** Tekent het beeld op tijd t (seconden). Moet een pure functie van t zijn. */
  draw: (ctx: CanvasRenderingContext2D, t: number) => void;
  /** Het geluid, al gerenderd; null = stil. */
  audio: AudioBuffer | null;
  /** Voortgang van 0 tot 1. */
  onProgress?: (fraction: number) => void;
  signal?: AbortSignal;
}

export interface VideoResult {
  blob: Blob;
  mimeType: string;
  extension: "mp4" | "webm";
  /** Hoe het gemaakt is: frame-exact of realtime opgenomen. */
  method: "webcodecs" | "mediarecorder";
}

/** Deze browser kan op geen enkele manier video maken. */
export class VideoUnsupportedError extends Error {
  constructor() {
    super("Video maken wordt niet ondersteund");
    this.name = "VideoUnsupportedError";
  }
}

const abortError = () => new DOMException("Video maken afgebroken", "AbortError");

/** Even ruimte voor de browser (voortgang tekenen), ook in een tabblad op de achtergrond. */
function yieldToBrowser(): Promise<void> {
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    channel.port1.onmessage = () => resolve();
    channel.port2.postMessage(null);
  });
}

/** Wat kan deze browser? WebCodecs wordt pas geladen als hij bestaat. */
export async function detectEncoderSupport(
  width: number,
  height: number,
  fps: number,
): Promise<EncoderSupport> {
  let mp4: EncoderSupport["mp4"] = null;
  let webm: EncoderSupport["webm"] = null;
  if (typeof window !== "undefined" && typeof window.VideoEncoder === "function") {
    try {
      const mb = await import("mediabunny");
      const video = { width, height, frameRate: fps };
      const audio = { numberOfChannels: 2, sampleRate: VIDEO_SAMPLE_RATE };
      const canAudio = typeof window.AudioEncoder === "function";
      mp4 = {
        video: await mb.getFirstEncodableVideoCodec(["avc"], video),
        audio: canAudio ? await mb.getFirstEncodableAudioCodec(["aac", "opus"], audio) : null,
      };
      webm = {
        video: await mb.getFirstEncodableVideoCodec(["vp9", "vp8"], video),
        audio: canAudio ? await mb.getFirstEncodableAudioCodec(["opus"], audio) : null,
      };
    } catch {
      mp4 = null;
      webm = null;
    }
  }
  const canRecord =
    typeof MediaRecorder === "function" &&
    typeof HTMLCanvasElement !== "undefined" &&
    typeof HTMLCanvasElement.prototype.captureStream === "function";
  const recorder = canRecord
    ? recorderMimeType((type) => MediaRecorder.isTypeSupported(type))
    : null;
  return { mp4, webm, recorder };
}

function newCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new VideoUnsupportedError();
  return { canvas, ctx };
}

export async function encodeVideo(job: VideoJob): Promise<VideoResult> {
  const choice = chooseEncoder(await detectEncoderSupport(job.width, job.height, job.fps));
  if (choice.kind === "webcodecs") return encodeFrameExact(job, choice);
  if (choice.kind === "mediarecorder") return recordRealtime(job, choice);
  throw new VideoUnsupportedError();
}

async function encodeFrameExact(
  job: VideoJob,
  choice: Extract<EncoderChoice, { kind: "webcodecs" }>,
): Promise<VideoResult> {
  const mb = await import("mediabunny");
  const { canvas, ctx } = newCanvas(job.width, job.height);
  const mp4 = choice.container === "mp4";
  const output = new mb.Output({
    // Metadata vooraan: de video speelt meteen af, ook in een deelmenu.
    format: mp4 ? new mb.Mp4OutputFormat({ fastStart: "in-memory" }) : new mb.WebMOutputFormat(),
    target: new mb.BufferTarget(),
  });
  const video = new mb.CanvasSource(canvas, {
    codec: choice.video as (typeof mb.VIDEO_CODECS)[number],
    quality: mb.QUALITY_HIGH,
    keyFrameInterval: 2,
  });
  output.addVideoTrack(video, { frameRate: job.fps });
  const audio =
    job.audio && choice.audio
      ? new mb.AudioBufferSource({
          codec: choice.audio as (typeof mb.AUDIO_CODECS)[number],
          quality: mb.QUALITY_HIGH,
        })
      : null;
  if (audio) output.addAudioTrack(audio);

  try {
    await output.start();
    if (audio && job.audio) {
      await audio.add(job.audio);
      audio.close();
    }
    const frames = frameCount(job.duration, job.fps);
    for (let i = 0; i < frames; i++) {
      if (job.signal?.aborted) throw abortError();
      const t = i / job.fps;
      job.draw(ctx, t);
      await video.add(t, 1 / job.fps);
      job.onProgress?.((i + 1) / frames);
      await yieldToBrowser();
    }
    video.close();
    await output.finalize();
  } catch (error) {
    await output.cancel().catch(() => undefined);
    throw error;
  }

  const buffer = output.target.buffer;
  if (!buffer) throw new Error("Video maken mislukt");
  const mimeType = mp4 ? "video/mp4" : "video/webm";
  return {
    blob: new Blob([buffer], { type: mimeType }),
    mimeType,
    extension: mp4 ? "mp4" : "webm",
    method: "webcodecs",
  };
}

/** Terugval: realtime opnemen. Duurt net zo lang als de video zelf. */
async function recordRealtime(
  job: VideoJob,
  choice: Extract<EncoderChoice, { kind: "mediarecorder" }>,
): Promise<VideoResult> {
  const { canvas, ctx } = newCanvas(job.width, job.height);
  // Sommige browsers nemen een canvas alleen op als het in de pagina staat.
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText =
    "position:fixed;left:-10000px;top:0;width:2px;height:2px;opacity:0;pointer-events:none";
  document.body.append(canvas);
  job.draw(ctx, 0);

  const stream = canvas.captureStream(job.fps);
  let audioContext: AudioContext | null = null;
  let source: AudioBufferSourceNode | null = null;
  if (job.audio) {
    audioContext = new AudioContext({ sampleRate: job.audio.sampleRate });
    await audioContext.resume().catch(() => undefined);
    const destination = audioContext.createMediaStreamDestination();
    source = audioContext.createBufferSource();
    source.buffer = job.audio;
    source.connect(destination);
    destination.stream.getAudioTracks().forEach((track) => stream.addTrack(track));
  }

  const recorder = new MediaRecorder(stream, {
    mimeType: choice.mimeType,
    videoBitsPerSecond: 10_000_000,
  });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  };
  const stopped = new Promise<void>((resolve) => {
    recorder.onstop = () => resolve();
  });

  let started = false;
  try {
    recorder.start(250);
    started = true;
    source?.start();
    const start = performance.now();
    await new Promise<void>((resolve, reject) => {
      const tick = () => {
        if (job.signal?.aborted) return reject(abortError());
        const t = (performance.now() - start) / 1000;
        job.draw(ctx, Math.min(t, job.duration));
        job.onProgress?.(Math.min(1, t / job.duration));
        if (t >= job.duration) resolve();
        else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  } finally {
    if (started) {
      if (recorder.state !== "inactive") recorder.stop();
      await stopped;
    }
    stream.getTracks().forEach((track) => track.stop());
    void audioContext?.close();
    canvas.remove();
  }

  const mimeType = choice.mimeType.split(";")[0] ?? choice.mimeType;
  return {
    blob: new Blob(chunks, { type: mimeType }),
    mimeType,
    extension: choice.extension,
    method: "mediarecorder",
  };
}
