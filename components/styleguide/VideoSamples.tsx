"use client";

import { Clapperboard } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { VideoSheet, type VideoRequest } from "@/components/video/VideoSheet";
import { VIDEO_STICKERS } from "@/content/copy";
import { VIDEO_FORMATS } from "@/lib/video/formats";
import type { PracticeEntry } from "@/lib/walkout/practice";
import { renderWalkoutPoster, type WalkoutVideoOptions } from "@/lib/walkout/video-render";

const SAMPLES: { label: string; options: WalkoutVideoOptions }[] = [
  {
    label: "Mysterie · 9:16",
    options: {
      format: "staand",
      mystery: true,
      sticker: null,
      showName: true,
      stake: "Fout = jij haalt tosti's.",
    },
  },
  {
    label: "Met gok · 9:16",
    options: { format: "staand", mystery: false, sticker: null, showName: true, stake: "" },
  },
  {
    label: "Sticker · 1:1",
    options: {
      format: "vierkant",
      mystery: false,
      sticker: VIDEO_STICKERS[1],
      showName: false,
      stake: "",
    },
  },
];

function Poster({ request, options }: { request: VideoRequest; options: WalkoutVideoOptions }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let cancelled = false;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    void renderWalkoutPoster(request, options, 170 * ratio).then((frame) => {
      const element = canvas.current;
      if (cancelled || !element) return;
      element.width = frame.width;
      element.height = frame.height;
      element.getContext("2d")?.drawImage(frame, 0, 0);
    });
    return () => {
      cancelled = true;
    };
  }, [request, options]);
  const { width, height } = VIDEO_FORMATS[options.format];
  return (
    <canvas
      ref={canvas}
      role="img"
      aria-label="Laatste beeld van de video"
      className="w-[170px] rounded-2xl bg-black"
      style={{ aspectRatio: `${width} / ${height}` }}
    />
  );
}

/** Stijlgids: het laatste beeld van de video in een paar standen, en het videopaneel zelf. */
export function VideoSamples({ deck }: { deck: readonly PracticeEntry[] }) {
  const entry = deck[deck.length - 1];
  const [request] = useState<VideoRequest | null>(() =>
    entry ? { card: entry.card, guess: 9.4 } : null,
  );
  const [open, setOpen] = useState<VideoRequest | null>(null);
  if (!request) return null;

  return (
    <div>
      <ul className="flex flex-wrap items-end gap-4">
        {SAMPLES.map(({ label, options }) => (
          <li key={label} className="space-y-2">
            <Poster request={request} options={options} />
            <p className="text-sm text-ink-2">{label}</p>
          </li>
        ))}
      </ul>
      <Button variant="glass" icon={Clapperboard} onClick={() => setOpen(request)} className="mt-4">
        Maak een testvideo
      </Button>
      <VideoSheet request={open} onClose={() => setOpen(null)} />
    </div>
  );
}
