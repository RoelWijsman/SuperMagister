"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Clock } from "lucide-react";
import { useState } from "react";
import { SubjectDot } from "@/components/subjects/SubjectBadge";
import { Chip } from "@/components/ui/Chip";
import { cn } from "@/lib/cn";
import type { SubjectAppearance } from "@/lib/data/hooks";
import { formatDuration } from "@/lib/date";
import type { HomeworkItem, HomeworkStatus } from "@/lib/homework/overview";
import { checkReward, XpFloat } from "./CheckButton";

const COLUMNS: { status: HomeworkStatus; title: string; empty: string }[] = [
  { status: "todo", title: "Te doen", empty: "Niks meer te doen." },
  { status: "bezig", title: "Bezig", empty: "Sleep hier heen waar je mee bezig bent." },
  { status: "klaar", title: "Klaar", empty: "Sleep hier heen wat af is." },
];
const ORDER: HomeworkStatus[] = ["todo", "bezig", "klaar"];
const titleOf = (status: unknown) =>
  COLUMNS.find((column) => column.status === status)?.title ?? "een kolom";

/** Eerst waar je aanwijzer is, anders wat het meest overlapt (voor touch). */
const collision: CollisionDetection = (args) => {
  const within = pointerWithin(args);
  return within.length > 0 ? within : rectIntersection(args);
};

function CardBody({
  item,
  subject,
  meta,
}: {
  item: HomeworkItem;
  subject: SubjectAppearance;
  meta: (item: HomeworkItem) => string;
}) {
  return (
    <>
      <span className="flex items-center gap-2">
        <SubjectDot color={subject.color} />
        <span
          className={cn(
            "truncate font-semibold text-ink",
            item.isDone && "line-through decoration-2",
          )}
        >
          {subject.name}
        </span>
        {item.isTest && <Chip tone="accent">📝</Chip>}
      </span>
      <span className="mt-0.5 block text-xs text-ink-3">{meta(item)}</span>
      <span className="mt-1.5 line-clamp-2 block text-sm text-ink-2">{item.text}</span>
      <span className="mt-2 inline-flex items-center gap-1 text-xs text-ink-3 tabular-nums">
        <Clock size={12} aria-hidden />±{formatDuration(item.minutes)}
      </span>
    </>
  );
}

function KanbanCard({
  item,
  subject,
  meta,
  onMove,
}: {
  item: HomeworkItem;
  subject: SubjectAppearance;
  meta: (item: HomeworkItem) => string;
  onMove: (item: HomeworkItem, status: HomeworkStatus) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: item.id,
    data: { item },
  });
  const index = ORDER.indexOf(item.status);
  const back = ORDER[index - 1];
  const forward = ORDER[index + 1];

  return (
    <li
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      // Met het toetsenbord verplaats je via de knoppen; de kaart zelf is geen knop.
      role="listitem"
      tabIndex={-1}
      aria-roledescription="huiswerkkaart"
      aria-label={`${subject.name}: ${item.text}`}
      className={cn(
        "relative cursor-grab touch-manipulation rounded-2xl border border-line bg-glass-strong p-3 text-left transition-opacity select-none active:cursor-grabbing",
        isDragging && "opacity-40",
      )}
    >
      <CardBody item={item} subject={subject} meta={meta} />
      <span className="absolute right-2 bottom-2 flex gap-1">
        {back && (
          <button
            type="button"
            onClick={() => onMove(item, back)}
            aria-label={`Terug naar ${titleOf(back)}`}
            title={`Terug naar ${titleOf(back)}`}
            className="grid size-8 place-items-center rounded-full text-ink-3 transition-colors hover:bg-glass hover:text-ink"
          >
            <ArrowLeft size={15} aria-hidden />
          </button>
        )}
        {forward && (
          <button
            type="button"
            onClick={() => onMove(item, forward)}
            aria-label={`Naar ${titleOf(forward)}`}
            title={`Naar ${titleOf(forward)}`}
            className="grid size-8 place-items-center rounded-full text-ink-2 transition-colors hover:bg-glass hover:text-ink"
          >
            {forward === "klaar" ? (
              <Check size={15} aria-hidden />
            ) : (
              <ArrowRight size={15} aria-hidden />
            )}
          </button>
        )}
      </span>
    </li>
  );
}

function Column({
  status,
  title,
  empty,
  items,
  children,
  bursts,
  onBurstDone,
}: {
  status: HomeworkStatus;
  title: string;
  empty: string;
  items: readonly HomeworkItem[];
  children: React.ReactNode;
  bursts: number[];
  onBurstDone: (id: number) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const minutes = items.reduce((sum, item) => sum + (item.isDone ? 0 : item.minutes), 0);
  return (
    <section
      ref={setNodeRef}
      aria-label={`${title}, ${items.length}`}
      className={cn(
        "flex min-h-40 flex-col rounded-panel border border-line bg-glass p-3 transition-[background-color,box-shadow] duration-200",
        isOver &&
          "bg-glass-strong shadow-[inset_0_0_0_1.5px_color-mix(in_oklab,var(--sm-accent)_60%,transparent)]",
      )}
    >
      <h3 className="relative mb-3 flex items-center gap-2 px-1 font-display font-semibold text-ink">
        {title}
        <span className="grid h-6 min-w-6 place-items-center rounded-full bg-glass-strong px-2 font-sans text-xs font-semibold text-ink-2">
          {items.length}
        </span>
        {minutes > 0 && (
          <span className="ml-auto font-sans text-xs font-normal text-ink-3 tabular-nums">
            ±{formatDuration(minutes)}
          </span>
        )}
        <AnimatePresence>
          {bursts.map((id) => (
            <XpFloat key={id} id={id} onDone={onBurstDone} />
          ))}
        </AnimatePresence>
      </h3>
      {items.length === 0 ? (
        <p className="px-1 py-6 text-center text-sm text-ink-3">{empty}</p>
      ) : (
        <ul className="space-y-2">{children}</ul>
      )}
    </section>
  );
}

/**
 * Fase 3c: huiswerk als kanban (Te doen / Bezig / Klaar). Sleep een kaart naar
 * een andere kolom, of gebruik de pijltjes op de kaart. Naar Klaar = afvinken.
 */
export function KanbanBoard({
  items,
  subject,
  meta,
  onMove,
}: {
  items: readonly HomeworkItem[];
  subject: (id: string | null) => SubjectAppearance;
  meta: (item: HomeworkItem) => string;
  onMove: (item: HomeworkItem, status: HomeworkStatus) => void;
}) {
  const [active, setActive] = useState<HomeworkItem | null>(null);
  const [bursts, setBursts] = useState<number[]>([]);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  const move = (item: HomeworkItem, status: HomeworkStatus) => {
    if (item.status === status) return;
    if (status === "klaar" || item.status === "klaar") checkReward(status === "klaar");
    if (status === "klaar") setBursts((list) => [...list, Date.now()]);
    onMove(item, status);
  };

  const nameOf = (id: unknown) => {
    const item = items.find((other) => other.id === id);
    return item ? subject(item.subjectId).name : "Huiswerk";
  };
  const announcements: Announcements = {
    onDragStart: ({ active: dragged }) => `${nameOf(dragged.id)} opgepakt.`,
    onDragOver: ({ active: dragged, over }) =>
      over
        ? `${nameOf(dragged.id)} boven ${titleOf(over.id)}.`
        : `${nameOf(dragged.id)} staat nergens boven.`,
    onDragEnd: ({ active: dragged, over }) =>
      over
        ? `${nameOf(dragged.id)} in ${titleOf(over.id)} gezet.`
        : `${nameOf(dragged.id)} teruggezet.`,
    onDragCancel: ({ active: dragged }) => `Verplaatsen van ${nameOf(dragged.id)} afgebroken.`,
  };

  const onDragStart = ({ active: dragged }: DragStartEvent) =>
    setActive((dragged.data.current?.item as HomeworkItem | undefined) ?? null);
  const onDragEnd = ({ active: dragged, over }: DragEndEvent) => {
    setActive(null);
    const item = dragged.data.current?.item as HomeworkItem | undefined;
    if (item && over) move(item, over.id as HomeworkStatus);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collision}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActive(null)}
      accessibility={{
        announcements,
        screenReaderInstructions: {
          draggable:
            "Sleep de kaart met muis of vinger naar een andere kolom. Met het toetsenbord: gebruik de pijlknoppen op de kaart.",
        },
      }}
    >
      <div className="grid gap-4 md:grid-cols-3">
        {COLUMNS.map((column) => {
          const list = items.filter((item) => item.status === column.status);
          return (
            <Column
              key={column.status}
              {...column}
              items={list}
              bursts={column.status === "klaar" ? bursts : []}
              onBurstDone={(id) => setBursts((all) => all.filter((other) => other !== id))}
            >
              {list.map((item) => (
                <KanbanCard
                  key={item.id}
                  item={item}
                  subject={subject(item.subjectId)}
                  meta={meta}
                  onMove={move}
                />
              ))}
            </Column>
          );
        })}
      </div>
      <DragOverlay dropAnimation={null}>
        {active && (
          <div className="rotate-2 rounded-2xl border border-line bg-glass-strong p-3 shadow-[var(--sm-shadow)] backdrop-blur-xl">
            <CardBody item={active} subject={subject(active.subjectId)} meta={meta} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
