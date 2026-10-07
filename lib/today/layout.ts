/**
 * Fase 3a: de indeling van Vandaag. Alle blokken zijn widgets die je in de
 * bewerkmodus versleept, aan- of uitzet en groter of kleiner maakt. Puur:
 * de store bewaart alleen wat deze functies teruggeven.
 */

export const TODAY_WIDGETS = [
  "nu",
  "pack",
  "tijdlijn",
  "radar",
  "huiswerk",
  "weer",
  "countdowns",
  "trend",
] as const;

export type TodayWidgetId = (typeof TODAY_WIDGETS)[number];

/** Breedte in het 12-koloms raster: smal (1/3), half, breed (2/3) of de hele rij. */
export type WidgetSize = "sm" | "md" | "lg" | "full";

/** Welke maten een widget aankan; de eerste is de standaard. */
export const WIDGET_SIZES: Readonly<Record<TodayWidgetId, readonly WidgetSize[]>> = {
  nu: ["md", "sm", "lg"],
  pack: ["md", "lg", "full"],
  tijdlijn: ["full", "lg"],
  radar: ["sm", "md"],
  huiswerk: ["sm", "md", "lg"],
  weer: ["sm", "md"],
  countdowns: ["md", "sm", "lg"],
  trend: ["md", "sm"],
};

export const WIDGET_LABELS: Readonly<Record<TodayWidgetId, string>> = {
  nu: "Nu bezig",
  pack: "Nieuwe cijfers",
  tijdlijn: "Dagtijdlijn",
  radar: "Toets-radar",
  huiswerk: "Huiswerk",
  weer: "Fietsweer",
  countdowns: "Aftellen",
  trend: "Trend",
};

export const SIZE_LABELS: Readonly<Record<WidgetSize, string>> = {
  sm: "Smal",
  md: "Half",
  lg: "Breed",
  full: "Volle breedte",
};

export interface TodayLayout {
  order: TodayWidgetId[];
  hidden: TodayWidgetId[];
  sizes: Record<TodayWidgetId, WidgetSize>;
}

const isWidget = (value: unknown): value is TodayWidgetId =>
  typeof value === "string" && (TODAY_WIDGETS as readonly string[]).includes(value);

const defaultSizes = () =>
  Object.fromEntries(TODAY_WIDGETS.map((id) => [id, WIDGET_SIZES[id][0]])) as Record<
    TodayWidgetId,
    WidgetSize
  >;

export const DEFAULT_LAYOUT: TodayLayout = {
  order: [...TODAY_WIDGETS],
  hidden: [],
  sizes: defaultSizes(),
};

/**
 * Maakt van wat er opgeslagen was een geldige indeling. Onbekende widgets
 * vallen weg, nieuwe widgets (uit een latere versie) komen achteraan.
 */
export function normalizeLayout(stored: unknown): TodayLayout {
  if (typeof stored !== "object" || stored === null) return DEFAULT_LAYOUT;
  const value = stored as Partial<Record<keyof TodayLayout, unknown>>;
  const known = Array.isArray(value.order) ? value.order.filter(isWidget) : [];
  const order = [...new Set(known)];
  for (const id of TODAY_WIDGETS) if (!order.includes(id)) order.push(id);
  const hidden = Array.isArray(value.hidden) ? [...new Set(value.hidden.filter(isWidget))] : [];
  const sizes = defaultSizes();
  if (typeof value.sizes === "object" && value.sizes !== null) {
    for (const [id, size] of Object.entries(value.sizes)) {
      if (isWidget(id) && (WIDGET_SIZES[id] as readonly unknown[]).includes(size)) {
        sizes[id] = size as WidgetSize;
      }
    }
  }
  return { order, hidden, sizes };
}

/** Versleept `active` naar de plek van `over`. */
export function moveWidget(
  layout: TodayLayout,
  active: TodayWidgetId,
  over: TodayWidgetId,
): TodayLayout {
  const from = layout.order.indexOf(active);
  const to = layout.order.indexOf(over);
  if (from === -1 || to === -1 || from === to) return layout;
  const order = [...layout.order];
  order.splice(from, 1);
  order.splice(to, 0, active);
  return { ...layout, order };
}

export function toggleWidget(layout: TodayLayout, id: TodayWidgetId): TodayLayout {
  const hidden = layout.hidden.includes(id)
    ? layout.hidden.filter((other) => other !== id)
    : [...layout.hidden, id];
  return { ...layout, hidden };
}

/** De volgende maat die deze widget aankan (rond). */
export function nextSize(layout: TodayLayout, id: TodayWidgetId): TodayLayout {
  const sizes = WIDGET_SIZES[id];
  const index = sizes.indexOf(layout.sizes[id]);
  const size = sizes[(index + 1) % sizes.length] ?? sizes[0]!;
  return { ...layout, sizes: { ...layout.sizes, [id]: size } };
}

export function visibleWidgets(layout: TodayLayout): TodayWidgetId[] {
  return layout.order.filter((id) => !layout.hidden.includes(id));
}
