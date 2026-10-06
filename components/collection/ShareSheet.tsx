"use client";

import { Download, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { Skeleton } from "@/components/ui/Skeleton";
import { canShareFile, canvasToFile, downloadFile, shareFile } from "@/lib/cards/share";
import { notify } from "@/lib/notify";
import { toast } from "@/stores/toast";

export interface ShareRequest {
  title: string;
  filename: string;
  render: () => Promise<HTMLCanvasElement>;
}

/** Laat de afbeelding eerst zien; delen of opslaan is daarna één tik. */
export function ShareSheet({
  request,
  onClose,
}: {
  request: ShareRequest | null;
  onClose: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!request) return;
    let cancelled = false;
    let url: string | null = null;
    void request
      .render()
      .then((canvas) => canvasToFile(canvas, request.filename))
      .then((made) => {
        if (cancelled) return;
        url = URL.createObjectURL(made);
        setFile(made);
        setPreview(url);
      })
      .catch(() => {
        if (!cancelled)
          toast({ tone: "warning", emoji: "🖼️", title: "Afbeelding maken lukte niet" });
      });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
      setFile(null);
      setPreview(null);
    };
  }, [request]);

  const share = async () => {
    if (!file || !request) return;
    setBusy(true);
    try {
      if ((await shareFile(file, request.title)) === "gedeeld") {
        notify("toast.afbeelding", {}, { emoji: "📸" });
        onClose();
      }
    } catch {
      toast({
        tone: "warning",
        emoji: "📤",
        title: "Delen lukte niet",
        description: "Sla de afbeelding op en deel hem zelf.",
      });
    } finally {
      setBusy(false);
    }
  };

  const save = () => {
    if (!file) return;
    downloadFile(file);
    notify("toast.afbeelding", {}, { emoji: "📸" });
    onClose();
  };

  const sharable = file ? canShareFile(file) : false;

  return (
    <Sheet
      open={request !== null}
      onClose={onClose}
      title={request?.title ?? "Delen"}
      description="Zo ziet je afbeelding eruit."
      size="sm"
    >
      <div className="mx-auto aspect-[4/5] w-full max-w-72 overflow-hidden rounded-2xl bg-black">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- lokale blob, geen optimalisatie nodig
          <img src={preview} alt={request?.title ?? ""} className="size-full object-cover" />
        ) : (
          <Skeleton className="size-full rounded-none" />
        )}
      </div>
      <div className="mt-5 flex flex-col gap-2.5">
        {sharable && (
          <Button variant="primary" icon={Share2} onClick={() => void share()} disabled={busy}>
            Delen
          </Button>
        )}
        <Button
          variant={sharable ? "glass" : "primary"}
          icon={Download}
          onClick={save}
          disabled={!file}
        >
          Opslaan als afbeelding
        </Button>
      </div>
    </Sheet>
  );
}
