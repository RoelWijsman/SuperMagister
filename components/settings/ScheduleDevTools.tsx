"use client";

import { useQueryClient } from "@tanstack/react-query";
import { RotateCcw, Shuffle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useDataSource } from "@/lib/data/context";
import { daysRange, useSubjectAppearance } from "@/lib/data/hooks";
import { startOfDay } from "@/lib/date";
import { addTweak, clearTweaks, pickTweak } from "@/lib/demo/tweaks";
import { notify } from "@/lib/notify";
import { formatChange } from "@/lib/schedule/changes";
import { useScheduleTracker } from "@/stores/schedule";
import { toast } from "@/stores/toast";

/**
 * Fase 3b, alleen in de demo: een roosterwijziging verzinnen om de
 * wijzigingen-detector te zien werken, en alles weer terugzetten.
 */
export function ScheduleDevTools() {
  const source = useDataSource();
  const queryClient = useQueryClient();
  const subjects = useSubjectAppearance();
  const forget = useScheduleTracker((s) => s.forget);
  const [busy, setBusy] = useState(false);

  if (source.id !== "demo") return null;

  const refresh = () => queryClient.invalidateQueries({ queryKey: [source.id, "lessons"] });

  const simulate = async () => {
    setBusy(true);
    try {
      const now = new Date();
      const lessons = await source.getLessons(daysRange(startOfDay(now), 8));
      const tweak = pickTweak(lessons, now);
      const lesson = tweak && lessons.find((l) => l.id === tweak.lessonId);
      if (!tweak || !lesson) {
        toast({ tone: "info", emoji: "🗓️", title: "Geen les gevonden om te verschuiven" });
        return;
      }
      addTweak(tweak);
      await refresh();
      const wat = formatChange(
        {
          id: `${lesson.id}:${tweak.kind}`,
          lessonId: lesson.id,
          kind: tweak.kind,
          date: lesson.date,
          start: lesson.start,
          hourFrom: lesson.hourFrom,
          subjectId: lesson.subjectId,
          from: tweak.kind === "lokaal" ? (lesson.location ?? undefined) : undefined,
          to: tweak.location,
        },
        (id) => subjects.get(id).name,
      );
      notify("toast.roosterWijziging", { wat }, { emoji: "🗓️" });
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    setBusy(true);
    try {
      clearTweaks();
      await forget(source.id);
      await refresh();
      notify("toast.roosterTerug", {}, { emoji: "🗓️" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4">
      <p className="min-w-0 flex-1 text-ink-2">
        Verzin een roosterwijziging (uitval of een ander lokaal) in de komende week en kijk of het
        rooster hem opmerkt.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button variant="glass" icon={Shuffle} onClick={simulate} disabled={busy}>
          Simuleer roosterwijziging
        </Button>
        <Button variant="ghost" icon={RotateCcw} onClick={reset} disabled={busy}>
          Rooster terugzetten
        </Button>
      </div>
    </div>
  );
}
