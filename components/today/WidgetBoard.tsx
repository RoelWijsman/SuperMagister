"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, EyeOff, GripVertical, MoveHorizontal, Plus, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import {
  SIZE_LABELS,
  visibleWidgets,
  WIDGET_LABELS,
  WIDGET_SIZES,
  type TodayWidgetId,
  type WidgetSize,
} from "@/lib/today/layout";
import { useToday } from "@/stores/today";

/** Breedte in het 12-koloms raster: op een telefoon altijd de hele breedte. */
const SPANS: Readonly<Record<WidgetSize, string>> = {
  sm: "md:col-span-6 xl:col-span-4",
  md: "md:col-span-6",
  lg: "md:col-span-12 xl:col-span-8",
  full: "md:col-span-12",
};

const label = (id: unknown) => WIDGET_LABELS[id as TodayWidgetId] ?? "Widget";

const announcements: Announcements = {
  onDragStart: ({ active }) => `${label(active.id)} opgepakt.`,
  onDragOver: ({ active, over }) =>
    over
      ? `${label(active.id)} staat nu op de plek van ${label(over.id)}.`
      : `${label(active.id)} staat nergens boven.`,
  onDragEnd: ({ active, over }) =>
    over
      ? `${label(active.id)} neergezet op de plek van ${label(over.id)}.`
      : `${label(active.id)} neergezet.`,
  onDragCancel: ({ active }) => `Verplaatsen van ${label(active.id)} afgebroken.`,
};

const instructions = {
  draggable:
    "Druk op spatie of enter om de widget op te pakken. Verplaats hem met de pijltjestoetsen en zet hem neer met spatie of enter. Escape breekt af.",
};

function SortableWidget({
  id,
  size,
  editing,
  children,
}: {
  id: TodayWidgetId;
  size: WidgetSize;
  editing: boolean;
  children: ReactNode;
}) {
  const resize = useToday((s) => s.resize);
  const toggle = useToday((s) => s.toggle);
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !editing });
  const sizes = WIDGET_SIZES[id];
  const name = WIDGET_LABELS[id];

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn("relative col-span-12", SPANS[size], isDragging && "z-20")}
    >
      {/* In de bewerkmodus doet de inhoud even niet mee: dan tik je niet per ongeluk iets aan. */}
      <div
        inert={editing}
        className={cn(
          "h-full transition-[opacity,transform] duration-200",
          editing && "opacity-60",
          isDragging && "scale-[1.02] opacity-80",
        )}
      >
        {children}
      </div>
      {editing && (
        <div className="absolute inset-0 rounded-panel border-2 border-dashed border-[color-mix(in_oklab,var(--sm-accent)_55%,transparent)]">
          {/* Eén dichte strook bovenop de kop van de widget: naam links, knoppen rechts. */}
          <div className="absolute inset-x-2 top-2 flex items-center gap-1.5 rounded-2xl bg-[color-mix(in_oklab,var(--sm-bg)_90%,transparent)] p-1.5 pl-3.5 shadow-[0_6px_18px_-8px_rgb(0_0_0/0.5)] backdrop-blur-md">
            <span className="mr-auto min-w-0 truncate text-sm font-semibold text-ink">{name}</span>
            {sizes.length > 1 && (
              <Button
                variant="glass"
                size="sm"
                icon={MoveHorizontal}
                onClick={() => resize(id)}
                aria-label={`${name}: ${SIZE_LABELS[size].toLowerCase()}. Andere breedte kiezen`}
              >
                {SIZE_LABELS[size]}
              </Button>
            )}
            <Button
              variant="glass"
              size="icon-sm"
              icon={EyeOff}
              onClick={() => toggle(id)}
              aria-label={`${name} verbergen`}
            />
            <button
              ref={setActivatorNodeRef}
              type="button"
              className="grid size-9 cursor-grab touch-none place-items-center rounded-full glass text-ink active:cursor-grabbing"
              aria-label={`${name} verplaatsen`}
              {...attributes}
              {...listeners}
            >
              <GripVertical size={18} aria-hidden />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Fase 3a: Vandaag als bord met widgets. In de bewerkmodus versleep je ze
 * (muis, touch of toetsenbord), zet je ze aan of uit en kies je de breedte.
 * De indeling blijft lokaal bewaard.
 */
export function WidgetBoard({
  editing,
  onDone,
  widgets,
}: {
  editing: boolean;
  onDone: () => void;
  widgets: Readonly<Record<TodayWidgetId, ReactNode>>;
}) {
  const layout = useToday((s) => s.layout);
  const move = useToday((s) => s.move);
  const toggle = useToday((s) => s.toggle);
  const reset = useToday((s) => s.reset);
  const visible = visibleWidgets(layout);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) move(active.id as TodayWidgetId, over.id as TodayWidgetId);
  };

  return (
    <>
      {editing && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-panel glass-strong p-3 md:mb-5">
          <p className="mr-auto text-sm text-ink-2">
            Sleep aan <GripVertical size={14} aria-hidden className="inline align-[-2px]" /> om te
            verplaatsen. Kies een breedte, of verberg wat je niet nodig hebt.
          </p>
          {layout.hidden.map((id) => (
            <Button key={id} variant="glass" size="sm" icon={Plus} onClick={() => toggle(id)}>
              {WIDGET_LABELS[id]}
            </Button>
          ))}
          <Button variant="ghost" size="sm" icon={RotateCcw} onClick={reset}>
            Standaardindeling
          </Button>
          <Button variant="primary" size="sm" icon={Check} onClick={onDone}>
            Klaar
          </Button>
        </div>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
        accessibility={{ announcements, screenReaderInstructions: instructions }}
      >
        <SortableContext items={visible} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-12 gap-4 md:gap-5">
            {visible.map((id) => (
              <SortableWidget key={id} id={id} size={layout.sizes[id]} editing={editing}>
                {widgets[id]}
              </SortableWidget>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </>
  );
}
