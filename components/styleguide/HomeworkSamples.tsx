"use client";

import { useState } from "react";
import { CheckButton } from "@/components/homework/CheckButton";
import { HomeworkCard } from "@/components/homework/HomeworkCard";
import { HomeworkLoad } from "@/components/homework/HomeworkLoad";
import { KanbanBoard } from "@/components/homework/KanbanBoard";
import { NoZinSheet } from "@/components/homework/NoZinSheet";
import { Button } from "@/components/ui/Button";
import { useSubjectAppearance } from "@/lib/data/hooks";
import {
  loadLevel,
  type DayLoad,
  type HomeworkItem,
  type HomeworkStatus,
} from "@/lib/homework/overview";

/** Verzonnen huiswerk, alleen voor de stijlgids. Afvinken blijft hier lokaal. */
const SAMPLE: HomeworkItem[] = [
  {
    id: "stijl-hw-1",
    lessonId: "stijl-les-1",
    subjectId: "wisa",
    dueDate: "2026-10-08",
    dueAt: "2026-10-08T09:20:00",
    html: "<p>Maak opgave 12 t/m 18 van § 4.2.</p>",
    text: "Maak opgave 12 t/m 18 van § 4.2.",
    isDone: false,
    isTest: false,
    status: "todo",
    doneAt: null,
    minutes: 30,
    minutesSource: "schatting",
  },
  {
    id: "stijl-hw-2",
    lessonId: "stijl-les-2",
    subjectId: "en",
    dueDate: "2026-10-08",
    dueAt: "2026-10-08T11:20:00",
    html: "<p>Lees § 3.2 en maak 4 t/m 7.</p>",
    text: "Lees § 3.2 en maak 4 t/m 7.",
    isDone: false,
    isTest: false,
    status: "bezig",
    doneAt: null,
    minutes: 35,
    minutesSource: "eigen",
  },
  {
    id: "stijl-hw-3",
    lessonId: "stijl-les-3",
    subjectId: "biol",
    dueDate: "2026-10-09",
    dueAt: "2026-10-09T10:30:00",
    html: "<p>SO hoofdstuk 2: cellen en weefsels.</p>",
    text: "SO hoofdstuk 2: cellen en weefsels.",
    isDone: false,
    isTest: true,
    status: "todo",
    doneAt: null,
    minutes: 45,
    minutesSource: "schatting",
  },
  {
    id: "stijl-hw-4",
    lessonId: "stijl-les-4",
    subjectId: "ne",
    dueDate: "2026-10-09",
    dueAt: "2026-10-09T08:30:00",
    html: "<p>Neem je leesboek mee.</p>",
    text: "Neem je leesboek mee.",
    isDone: true,
    isTest: false,
    status: "klaar",
    doneAt: "2026-10-07T15:00:00.000Z",
    minutes: 20,
    minutesSource: "vak",
  },
];

const LOAD: DayLoad[] = [
  ["2026-10-08", 65],
  ["2026-10-09", 45],
  ["2026-10-12", 0],
  ["2026-10-13", 125],
  ["2026-10-14", 20],
].map(([date, minutes]) => ({
  date: date as string,
  minutes: minutes as number,
  open: minutes ? 2 : 0,
  total: minutes ? 2 : 0,
  level: loadLevel(minutes as number),
}));

const meta = (item: HomeworkItem) => (item.dueDate === "2026-10-08" ? "morgen" : "vrijdag");

/** Stijlgids: de bouwstenen van huiswerk (fase 3c). */
export function HomeworkSamples() {
  const subjects = useSubjectAppearance();
  const [items, setItems] = useState(SAMPLE);
  const [checked, setChecked] = useState(false);
  const [noZin, setNoZin] = useState<HomeworkItem | null>(null);
  const setStatus = (item: HomeworkItem, status: HomeworkStatus) =>
    setItems((list) =>
      list.map((other) =>
        other.id === item.id ? { ...other, status, isDone: status === "klaar" } : other,
      ),
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-3">
          <CheckButton checked={checked} onCheckedChange={setChecked} label="Proefvinkje" />
          <span className="text-sm text-ink-2">Vinkknop: veert, plopt en geeft +10 XP.</span>
        </div>
        <div className="flex items-center gap-3">
          <CheckButton size="sm" checked label="Klein vinkje" onCheckedChange={() => {}} />
          <span className="text-sm text-ink-2">Klein (Vandaag en mini-stapjes).</span>
        </div>
      </div>

      <HomeworkLoad days={LOAD} />

      <ul className="grid gap-3 lg:grid-cols-2">
        {items.map((item) => (
          <HomeworkCard
            key={item.id}
            item={item}
            subject={subjects.get(item.subjectId)}
            meta={meta(item)}
            onCheckedChange={(next) => setStatus(item, next ? "klaar" : "todo")}
            onTime={() => {}}
            onNoZin={() => setNoZin(item)}
          />
        ))}
      </ul>

      <div>
        <p className="mb-2 text-sm text-ink-2">Kanban: sleep een kaart of gebruik de pijltjes.</p>
        <KanbanBoard items={items} subject={subjects.get} meta={meta} onMove={setStatus} />
      </div>

      <Button variant="glass" onClick={() => setNoZin(items[0]!)}>
        Open &quot;Ik heb geen zin&quot;
      </Button>
      <NoZinSheet
        item={noZin}
        subject={subjects.get}
        onClose={() => setNoZin(null)}
        onStart={() => {}}
        onDone={(item) => {
          setStatus(item, "klaar");
          setNoZin(null);
        }}
      />
    </div>
  );
}
