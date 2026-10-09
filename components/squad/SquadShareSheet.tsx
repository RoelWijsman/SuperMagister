"use client";

import { useReducedMotion } from "framer-motion";
import { Clapperboard, Download, Settings2, Share2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { Switch } from "@/components/ui/Switch";
import { Tabs } from "@/components/ui/Tabs";
import { VideoProgress } from "@/components/video/VideoSheet";
import { ensureCardFont } from "@/lib/cards/draw";
import type { CardData } from "@/lib/cards/model";
import { canShareFile, canvasToFile, downloadFile, shareFile } from "@/lib/cards/share";
import { useAccount } from "@/lib/data/hooks";
import { notify } from "@/lib/notify";
import {
  drawSquadFrame,
  renderSquadPicture,
  renderSquadVideo,
  squadTimeline,
  type SquadPictureData,
  type SquadPictureOptions,
  type SquadVideo,
} from "@/lib/squad/render";
import { track } from "@/lib/stats/client";
import { getPreset } from "@/lib/theme/themes";
import { stageFor } from "@/lib/walkout/scene";
import { VideoUnsupportedError } from "@/lib/video/encode";
import { VIDEO_FORMATS, type VideoFormat } from "@/lib/video/formats";
import { useSettings } from "@/stores/settings";
import { toast } from "@/stores/toast";
import type { SquadApi } from "./useSquad";

type Step =
  | { kind: "opties"; error?: "fout" | "geen-video" }
  | { kind: "bezig"; percent: number }
  | { kind: "klaar"; file: File; url: string; video: SquadVideo | null };

/**
 * Je elftal delen als afbeelding (9:16 of 1:1) of als korte video. Standaard
 * alleen tiers en vakken: geen cijfers, geen naam. Delen via het deelmenu van
 * je telefoon, anders downloaden.
 */
export function SquadShareSheet({
  mode,
  api,
  onClose,
}: {
  mode: "afbeelding" | "video" | null;
  api: SquadApi;
  onClose: () => void;
}) {
  return (
    <Sheet
      open={mode !== null}
      onClose={onClose}
      title={mode === "video" ? "Elftal als video" : "Deel je elftal"}
      description="Standaard zonder cijfers en zonder je naam."
      size="sm"
    >
      {mode && <ShareBody key={mode} mode={mode} api={api} onDone={onClose} />}
    </Sheet>
  );
}

/** Hoe groot het voorbeeld getekend wordt (deel van de echte maat). */
const PREVIEW_SCALE = 0.32;

/**
 * Het voorbeeld van wat je deelt, vóór je op "Maak" drukt. Bij een video
 * speelt het voorbeeld de video af (in het klein, zonder geluid); bij minder
 * beweging alleen het eindbeeld.
 */
function SharePreview({
  data,
  options,
  animated,
}: {
  data: SquadPictureData;
  options: SquadPictureOptions;
  animated: boolean;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion() ?? false;
  const { width, height } = VIDEO_FORMATS[options.format];

  useEffect(() => {
    let cancelled = false;
    let frame = 0;
    void ensureCardFont().then((family) => {
      const element = canvas.current;
      if (cancelled || !element) return;
      element.width = Math.round(width * PREVIEW_SCALE);
      element.height = Math.round(height * PREVIEW_SCALE);
      const ctx = element.getContext("2d");
      if (!ctx) return;
      const { stage, unit } = stageFor(element.width, element.height);
      const draw = (t: number) => {
        ctx.setTransform(unit, 0, 0, unit, 0, 0);
        drawSquadFrame(ctx, stage, data, options, family, t);
      };
      if (!animated || reduced) {
        draw(Infinity);
        return;
      }
      const count = data.evaluation.slots.filter(
        (s) => s.player && data.cards.has(s.slot.id),
      ).length;
      const loop = squadTimeline(count).end + 0.8;
      const start = performance.now();
      let last = 0;
      const tick = (now: number) => {
        // Dertig beelden per seconde is genoeg voor een voorbeeld.
        if (now - last > 33) {
          last = now;
          draw(((now - start) / 1000) % loop);
        }
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [data, options, animated, reduced, width, height]);

  return (
    <figure className="flex flex-col items-center gap-2">
      <div className="flex h-[min(18rem,36dvh)] items-center justify-center">
        <canvas
          ref={canvas}
          role="img"
          aria-label={
            animated
              ? "Voorbeeld van de video: je elftal op het veld"
              : "Voorbeeld: je elftal op het veld"
          }
          className="h-full max-w-full rounded-2xl bg-black shadow-[0_18px_40px_-18px_rgb(0_0_0/0.7)]"
          style={{ aspectRatio: `${width} / ${height}` }}
        />
      </div>
      <figcaption className="text-xs text-ink-3">
        Voorbeeld{animated ? " (zonder geluid)" : ""}: zo ziet het eruit.
      </figcaption>
    </figure>
  );
}

function ShareBody({
  mode,
  api,
  onDone,
}: {
  mode: "afbeelding" | "video";
  api: SquadApi;
  onDone: () => void;
}) {
  const [format, setFormat] = useState<VideoFormat>("staand");
  const [showRatings, setShowRatings] = useState(false);
  const [showName, setShowName] = useState(false);
  const [step, setStep] = useState<Step>({ kind: "opties" });
  const job = useRef<AbortController | null>(null);
  const account = useAccount();
  const theme = useSettings((s) => s.theme);
  const customAccent = useSettings((s) => s.customAccent);

  const data = useMemo<SquadPictureData>(() => {
    const cards = new Map<string, CardData>();
    for (const slot of api.evaluation.slots) {
      const card = api.cardById(slot.player?.id ?? null);
      if (card) cards.set(slot.slot.id, card);
    }
    const preset = getPreset(theme);
    return {
      evaluation: api.evaluation,
      cards,
      club: api.club,
      squadName: api.squads.find((s) => s.id === api.activeId)?.name ?? "Mijn elftal",
      ownerName: account.data?.firstName ?? "",
      accent: theme === "custom" ? [customAccent, preset.accent2] : [preset.accent, preset.accent2],
    };
  }, [api, account.data, theme, customAccent]);
  const options = useMemo(
    () => ({ format, showRatings, showName }),
    [format, showRatings, showName],
  );

  useEffect(() => () => job.current?.abort(), []);
  useEffect(() => {
    if (step.kind !== "klaar") return;
    const { url } = step;
    return () => URL.revokeObjectURL(url);
  }, [step]);

  const make = async () => {
    if (mode === "afbeelding") {
      try {
        const canvas = await renderSquadPicture(data, options);
        const file = await canvasToFile(canvas, "supermagister-elftal.png");
        setStep({ kind: "klaar", file, url: URL.createObjectURL(file), video: null });
        track("elftal-gedeeld");
      } catch {
        setStep({ kind: "opties", error: "fout" });
      }
      return;
    }
    const controller = new AbortController();
    job.current = controller;
    setStep({ kind: "bezig", percent: 0 });
    let shown = 0;
    try {
      const video = await renderSquadVideo(data, options, {
        signal: controller.signal,
        onProgress: (fraction) => {
          const percent = Math.floor(fraction * 100);
          if (percent === shown) return;
          shown = percent;
          setStep({ kind: "bezig", percent });
        },
      });
      if (controller.signal.aborted) return;
      setStep({ kind: "klaar", file: video.file, url: URL.createObjectURL(video.file), video });
      track("elftal-video");
    } catch (error) {
      if (controller.signal.aborted) return;
      setStep({
        kind: "opties",
        error: error instanceof VideoUnsupportedError ? "geen-video" : "fout",
      });
    } finally {
      if (job.current === controller) job.current = null;
    }
  };

  const { width, height } = VIDEO_FORMATS[format];

  if (step.kind === "bezig")
    return (
      <VideoProgress
        percent={step.percent}
        onCancel={() => {
          job.current?.abort();
          setStep({ kind: "opties" });
        }}
      />
    );

  if (step.kind === "klaar") {
    const sharable = canShareFile(step.file);
    const share = async () => {
      try {
        if ((await shareFile(step.file, "Mijn elftal")) === "gedeeld") {
          notify(
            step.video ? "toast.video" : "toast.afbeelding",
            {},
            { emoji: step.video ? "🎬" : "📸" },
          );
          onDone();
        }
      } catch {
        toast({
          tone: "warning",
          emoji: "📤",
          title: "Delen lukte niet",
          description: "Download hem en deel hem zelf.",
        });
      }
    };
    return (
      <div>
        <div className="flex justify-center">
          {step.video ? (
            <video
              src={step.url}
              controls
              autoPlay
              playsInline
              loop
              aria-label="Je elftal als video"
              className="max-h-[52dvh] max-w-full rounded-2xl bg-black"
              style={{ aspectRatio: `${width} / ${height}` }}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- lokale blob
            <img
              src={step.url}
              alt="Je elftal op het veld"
              className="max-h-[52dvh] max-w-full rounded-2xl bg-black"
              style={{ aspectRatio: `${width} / ${height}` }}
            />
          )}
        </div>
        <div className="mt-5 flex flex-col gap-2.5">
          {sharable && (
            <Button variant="primary" icon={Share2} onClick={() => void share()}>
              Delen
            </Button>
          )}
          <Button
            variant={sharable ? "glass" : "primary"}
            icon={Download}
            onClick={() => {
              downloadFile(step.file);
              notify(
                step.video ? "toast.video" : "toast.afbeelding",
                {},
                { emoji: step.video ? "🎬" : "📸" },
              );
            }}
          >
            Downloaden
          </Button>
          <Button variant="ghost" icon={Settings2} onClick={() => setStep({ kind: "opties" })}>
            Andere instellingen
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SharePreview data={data} options={options} animated={mode === "video"} />
      {step.error && (
        <p role="alert" className="mt-4 rounded-2xl bg-bad/12 p-3 text-sm text-ink">
          {step.error === "geen-video"
            ? "Deze browser kan geen video maken. Probeer het in Chrome, Edge of Safari, of deel een afbeelding."
            : "Dat lukte niet. Probeer het nog een keer."}
        </p>
      )}
      <div className="mt-5 space-y-1">
        <div className="flex items-center justify-between gap-4 py-2">
          <span className="font-medium text-ink">Formaat</span>
          <Tabs<VideoFormat>
            id="elftal-formaat"
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
          checked={showRatings}
          onCheckedChange={setShowRatings}
          label="Ratings tonen"
          description="De ratings op de kaarten en je squad-rating. Uit: alleen tiers en vakken."
        />
        <Switch checked={showName} onCheckedChange={setShowName} label="Naam tonen" />
      </div>
      <Button
        variant="primary"
        icon={mode === "video" ? Clapperboard : Share2}
        onClick={() => void make()}
        className="mt-5 w-full"
      >
        {mode === "video" ? "Maak video" : "Maak afbeelding"}
      </Button>
    </div>
  );
}
