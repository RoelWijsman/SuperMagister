"use client";

import { Clapperboard, Download, Settings2, Share2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { Switch } from "@/components/ui/Switch";
import { Tabs } from "@/components/ui/Tabs";
import { VIDEO_STICKERS } from "@/content/copy";
import type { CardData } from "@/lib/cards/model";
import { canShareFile, downloadFile, shareFile } from "@/lib/cards/share";
import { cn } from "@/lib/cn";
import { copyText } from "@/lib/copy";
import { notify } from "@/lib/notify";
import { VideoUnsupportedError } from "@/lib/video/encode";
import { VIDEO_FORMATS, type VideoFormat } from "@/lib/video/formats";
import {
  renderWalkoutPoster,
  renderWalkoutVideo,
  type WalkoutVideo,
  type WalkoutVideoOptions,
} from "@/lib/walkout/video-render";
import { toast } from "@/stores/toast";
import { useUi } from "@/stores/ui";

export interface VideoRequest {
  card: CardData;
  /** Je gok bij deze kaart, of null. */
  guess: number | null;
}

type Step =
  | { kind: "opties" }
  | { kind: "bezig"; percent: number }
  | { kind: "klaar"; video: WalkoutVideo; url: string }
  | { kind: "fout"; unsupported: boolean };

/** Feature B: je walkout als video. Instellen, maken, bekijken, delen. */
export function VideoSheet({
  request,
  onClose,
  layer,
}: {
  request: VideoRequest | null;
  onClose: () => void;
  layer?: "app" | "boven";
}) {
  return (
    <Sheet
      open={request !== null}
      onClose={onClose}
      title="Maak video"
      description="Je walkout als video, precies zoals op je scherm."
      size="sm"
      layer={layer}
    >
      {request && <VideoFlow key={request.card.id} request={request} onDone={onClose} />}
    </Sheet>
  );
}

const PROGRESS_QUIP_MS = 2600;

function VideoFlow({ request, onDone }: { request: VideoRequest; onDone: () => void }) {
  const privacy = useUi((s) => s.privacy);
  const numeric = request.card.grade.kind === "numeric";
  const [format, setFormat] = useState<VideoFormat>("staand");
  const [mystery, setMystery] = useState(true);
  // In de privacymodus staat het cijfer standaard achter een sticker.
  const [hideGrade, setHideGrade] = useState(privacy);
  const [sticker, setSticker] = useState<string>(VIDEO_STICKERS[0]);
  const [showName, setShowName] = useState(true);
  const [stake] = useState(() => copyText("video.inzet"));
  const [step, setStep] = useState<Step>({ kind: "opties" });
  const job = useRef<AbortController | null>(null);
  const poster = useRef<HTMLCanvasElement>(null);

  const options = useMemo<WalkoutVideoOptions>(
    () => ({
      format,
      mystery,
      sticker: !mystery && hideGrade && numeric ? sticker : null,
      showName: mystery || showName,
      stake,
    }),
    [format, mystery, hideGrade, numeric, sticker, showName, stake],
  );

  // Een voorproefje van het (bijna) laatste beeld.
  useEffect(() => {
    if (step.kind !== "opties") return;
    let cancelled = false;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    void renderWalkoutPoster(request, options, 240 * ratio).then((frame) => {
      const canvas = poster.current;
      if (cancelled || !canvas) return;
      canvas.width = frame.width;
      canvas.height = frame.height;
      canvas.getContext("2d")?.drawImage(frame, 0, 0);
    });
    return () => {
      cancelled = true;
    };
  }, [request, options, step.kind]);

  // Sheet dicht of andere kaart: lopend werk stoppen.
  useEffect(() => () => job.current?.abort(), []);

  useEffect(() => {
    if (step.kind !== "klaar") return;
    const { url } = step;
    return () => URL.revokeObjectURL(url);
  }, [step]);

  const start = async () => {
    const controller = new AbortController();
    job.current = controller;
    setStep({ kind: "bezig", percent: 0 });
    let shown = 0;
    try {
      const video = await renderWalkoutVideo(request, options, {
        signal: controller.signal,
        onProgress: (fraction) => {
          const percent = Math.floor(fraction * 100);
          if (percent === shown) return;
          shown = percent;
          setStep({ kind: "bezig", percent });
        },
      });
      if (controller.signal.aborted) return;
      setStep({ kind: "klaar", video, url: URL.createObjectURL(video.file) });
    } catch (error) {
      if (controller.signal.aborted) return;
      setStep({ kind: "fout", unsupported: error instanceof VideoUnsupportedError });
    } finally {
      if (job.current === controller) job.current = null;
    }
  };

  const cancel = () => {
    job.current?.abort();
    job.current = null;
    setStep({ kind: "opties" });
  };

  if (step.kind === "bezig") return <Progress percent={step.percent} onCancel={cancel} />;
  if (step.kind === "klaar") {
    return (
      <Preview
        video={step.video}
        url={step.url}
        format={format}
        onShared={onDone}
        onBack={() => setStep({ kind: "opties" })}
      />
    );
  }

  const { width, height } = VIDEO_FORMATS[format];
  return (
    <div>
      <div className="flex h-60 items-center justify-center">
        <canvas
          ref={poster}
          role="img"
          aria-label="Voorproefje van de video"
          className="h-full max-w-full rounded-2xl bg-black shadow-[0_18px_40px_-18px_rgb(0_0_0/0.7)]"
          style={{ aspectRatio: `${width} / ${height}` }}
        />
      </div>

      {step.kind === "fout" && (
        <p role="alert" className="mt-4 rounded-2xl bg-bad/12 p-3 text-sm text-ink">
          {step.unsupported
            ? "Deze browser kan geen video maken. Probeer het in Chrome, Edge of Safari."
            : "Video maken lukte niet. Probeer het nog een keer."}
        </p>
      )}

      <div className="mt-5 space-y-1">
        <div className="flex items-center justify-between gap-4 py-2">
          <span className="font-medium text-ink">Formaat</span>
          <Tabs<VideoFormat>
            id="video-formaat"
            aria-label="Formaat"
            size="sm"
            value={format}
            onValueChange={setFormat}
            items={[
              { value: "staand", label: "9:16" },
              { value: "vierkant", label: "1:1" },
            ]}
          />
        </div>
        <Switch
          checked={mystery}
          onCheckedChange={setMystery}
          label="Mysterie-modus"
          description={
            mystery
              ? "Stopt op het vraagteken. Kijkers raden je cijfer."
              : request.guess !== null && numeric
                ? "Je gok rolt in beeld, daarna de flip en je cijfer."
                : "De hele walkout, met de flip en je cijfer."
          }
        />
        {!mystery && numeric && (
          <>
            <Switch
              checked={hideGrade}
              onCheckedChange={setHideGrade}
              label="Cijfer verbergen"
              description="Een sticker over je cijfer."
            />
            {hideGrade && (
              <div role="radiogroup" aria-label="Sticker" className="flex flex-wrap gap-2 pb-2">
                {VIDEO_STICKERS.map((text) => (
                  <button
                    key={text}
                    type="button"
                    role="radio"
                    aria-checked={sticker === text}
                    onClick={() => setSticker(text)}
                    className={cn(
                      "h-9 rounded-full border px-3.5 text-sm font-medium transition-colors",
                      sticker === text
                        ? "border-transparent bg-[#ff3d6e] text-white"
                        : "border-line-strong bg-glass text-ink-2 hover:text-ink",
                    )}
                  >
                    {text}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
        {!mystery && <Switch checked={showName} onCheckedChange={setShowName} label="Naam tonen" />}
      </div>

      <Button
        variant="primary"
        icon={Clapperboard}
        onClick={() => void start()}
        className="mt-5 w-full"
      >
        {step.kind === "fout" ? "Opnieuw proberen" : "Maak video"}
      </Button>
    </div>
  );
}

function Progress({ percent, onCancel }: { percent: number; onCancel: () => void }) {
  const [quip, setQuip] = useState(() => copyText("video.voortgang"));
  useEffect(() => {
    const id = setInterval(() => setQuip(copyText("video.voortgang")), PROGRESS_QUIP_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="py-6 text-center">
      <p className="font-card text-7xl tabular-nums">{percent}%</p>
      <div
        role="progressbar"
        aria-label="Video maken"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="mx-auto mt-4 h-2 max-w-64 overflow-hidden rounded-full bg-glass-strong"
      >
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,var(--sm-accent),var(--sm-accent-2))] transition-[width] duration-200"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-4 min-h-12 text-balance text-ink-2">{quip}</p>
      <Button variant="ghost" size="sm" onClick={onCancel} className="mt-2">
        Annuleren
      </Button>
    </div>
  );
}

function Preview({
  video,
  url,
  format,
  onShared,
  onBack,
}: {
  video: WalkoutVideo;
  url: string;
  format: VideoFormat;
  onShared: () => void;
  onBack: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const { width, height } = VIDEO_FORMATS[format];
  const sharable = canShareFile(video.file);
  const size = `${(video.file.size / 1_000_000).toFixed(1).replace(".", ",")} MB`;

  const share = async () => {
    setBusy(true);
    try {
      if ((await shareFile(video.file, "Mijn walkout")) === "gedeeld") {
        notify("toast.video", {}, { emoji: "🎬" });
        onShared();
      }
    } catch {
      toast({
        tone: "warning",
        emoji: "📤",
        title: "Delen lukte niet",
        description: "Download de video en deel hem zelf.",
      });
    } finally {
      setBusy(false);
    }
  };

  const download = () => {
    downloadFile(video.file);
    notify("toast.video", {}, { emoji: "🎬" });
  };

  return (
    <div>
      <div className="flex justify-center">
        <video
          src={url}
          controls
          autoPlay
          playsInline
          loop
          aria-label="Je walkout-video"
          className="max-h-[52dvh] max-w-full rounded-2xl bg-black"
          style={{ aspectRatio: `${width} / ${height}` }}
        />
      </div>
      <p className="mt-3 text-center text-sm text-ink-2 tabular-nums">
        {video.extension.toUpperCase()} · {Math.round(video.duration)} s · {size}
      </p>
      <div className="mt-5 flex flex-col gap-2.5">
        {sharable && (
          <Button variant="primary" icon={Share2} onClick={() => void share()} disabled={busy}>
            Delen
          </Button>
        )}
        <Button variant={sharable ? "glass" : "primary"} icon={Download} onClick={download}>
          Downloaden
        </Button>
        <Button variant="ghost" icon={Settings2} onClick={onBack}>
          Andere instellingen
        </Button>
      </div>
    </div>
  );
}
