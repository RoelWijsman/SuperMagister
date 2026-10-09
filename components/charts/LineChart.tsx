"use client";

import { useCallback, useEffect, useId, useRef, useState, type PointerEvent } from "react";
import { cn } from "@/lib/cn";

/**
 * Een lijngrafiek (zelfgebouwd SVG): 2px lijnen, een haarlijn-raster, één as,
 * en een crosshair met tooltip die alle reeksen op die dag toont (ook met het
 * toetsenbord: ← en →). Bij twee of meer reeksen een legenda; onder de grafiek
 * altijd een tabel, zodat niets alleen via hover te lezen is.
 *
 * Kleuren (gecontroleerd met de dataviz-validator op de donkere achtergrond):
 * blauw #3987e5, oranje #d95926, aqua #199e70.
 */

export const CHART_COLORS = ["#3987e5", "#d95926", "#199e70"] as const;

export interface LineSeries {
  name: string;
  values: readonly (number | null)[];
}

interface LineChartProps {
  /** Labels op de x-as (bijv. "9 okt"), één per punt. */
  labels: readonly string[];
  series: readonly LineSeries[];
  /** Hoe een waarde in de tooltip, tabel en as staat. */
  format?: (value: number) => string;
  /** Naam van de grafiek voor schermlezers en de tabel. */
  title: string;
  height?: number;
  className?: string;
}

const PAD = { top: 12, right: 12, bottom: 26, left: 40 };

/** Een mooie bovengrens voor de as: 1, 2, 2,5 of 5 maal een macht van tien. */
export function niceMax(max: number): number {
  if (max <= 0) return 1;
  const power = 10 ** Math.floor(Math.log10(max));
  for (const step of [1, 2, 2.5, 5, 10]) if (step * power >= max) return step * power;
  return 10 * power;
}

const defaultFormat = (value: number) => value.toLocaleString("nl-NL");

export function LineChart({
  labels,
  series,
  format = defaultFormat,
  title,
  height = 180,
  className,
}: LineChartProps) {
  const id = useId();
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const node = box.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry?.contentRect.width ?? 0));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const count = labels.length;
  const max = niceMax(Math.max(0, ...series.flatMap((s) => s.values.map((v) => v ?? 0))));
  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const plotH = height - PAD.top - PAD.bottom;
  const x = useCallback(
    (i: number) => PAD.left + (count <= 1 ? plotW / 2 : (i / (count - 1)) * plotW),
    [count, plotW],
  );
  const y = (value: number) => PAD.top + plotH - (value / max) * plotH;

  const indexAt = (clientX: number) => {
    const rect = box.current?.getBoundingClientRect();
    if (!rect || count === 0) return null;
    const ratio = (clientX - rect.left - PAD.left) / Math.max(1, plotW);
    return Math.min(count - 1, Math.max(0, Math.round(ratio * (count - 1))));
  };
  const onMove = (event: PointerEvent<SVGRectElement>) => setActive(indexAt(event.clientX));

  const ticks = [0, max / 2, max];
  const xLabels = count > 2 ? [0, Math.floor((count - 1) / 2), count - 1] : labels.map((_, i) => i);

  const tooltipLeft = active === null ? 0 : Math.min(Math.max(x(active), 80), width - 80);

  return (
    <figure className={cn("min-w-0", className)}>
      {series.length > 1 && (
        <ul className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-2">
          {series.map((s, i) => (
            <li key={s.name} className="flex items-center gap-1.5">
              <span
                aria-hidden
                className="inline-block h-0.5 w-3.5 rounded-full"
                style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
              />
              {s.name}
            </li>
          ))}
        </ul>
      )}
      <div
        ref={box}
        className="relative"
        style={{ height }}
        tabIndex={0}
        role="img"
        aria-label={`${title}. Gebruik ← en → om per punt te lezen.`}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
            event.preventDefault();
            const step = event.key === "ArrowRight" ? 1 : -1;
            setActive((i) =>
              Math.min(count - 1, Math.max(0, (i ?? (step > 0 ? -1 : count)) + step)),
            );
          } else if (event.key === "Escape") setActive(null);
        }}
        onBlur={() => setActive(null)}
      >
        {width > 0 && (
          <svg width={width} height={height} className="block overflow-visible">
            {ticks.map((tick) => (
              <g key={tick}>
                <line
                  x1={PAD.left}
                  x2={width - PAD.right}
                  y1={y(tick)}
                  y2={y(tick)}
                  stroke="var(--sm-line)"
                  strokeWidth={1}
                />
                <text
                  x={PAD.left - 8}
                  y={y(tick)}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="fill-[var(--sm-ink-3)] text-[11px] tabular-nums"
                >
                  {format(tick)}
                </text>
              </g>
            ))}
            {xLabels.map((i) => (
              <text
                key={i}
                x={x(i)}
                y={height - 6}
                textAnchor={i === 0 ? "start" : i === count - 1 ? "end" : "middle"}
                className="fill-[var(--sm-ink-3)] text-[11px]"
              >
                {labels[i]}
              </text>
            ))}
            {series.map((s, si) => {
              const color = CHART_COLORS[si % CHART_COLORS.length];
              const points = s.values
                .map((v, i) => (v === null ? null : `${x(i).toFixed(1)},${y(v).toFixed(1)}`))
                .filter(Boolean);
              const last = s.values.length - 1;
              const lastValue = s.values[last];
              return (
                <g key={s.name}>
                  {si === 0 && series.length === 1 && points.length > 1 && (
                    <polygon
                      points={`${x(0)},${y(0)} ${points.join(" ")} ${x(last)},${y(0)}`}
                      fill={color}
                      opacity={0.1}
                    />
                  )}
                  <polyline
                    points={points.join(" ")}
                    fill="none"
                    stroke={color}
                    strokeWidth={2}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                  {lastValue !== null && lastValue !== undefined && (
                    <circle
                      cx={x(last)}
                      cy={y(lastValue)}
                      r={4}
                      fill={color}
                      stroke="var(--sm-bg)"
                      strokeWidth={2}
                    />
                  )}
                </g>
              );
            })}
            {active !== null && (
              <g pointerEvents="none">
                <line
                  x1={x(active)}
                  x2={x(active)}
                  y1={PAD.top}
                  y2={PAD.top + plotH}
                  stroke="var(--sm-ink-3)"
                  strokeWidth={1}
                />
                {series.map((s, si) => {
                  const v = s.values[active];
                  return v === null || v === undefined ? null : (
                    <circle
                      key={s.name}
                      cx={x(active)}
                      cy={y(v)}
                      r={4}
                      fill={CHART_COLORS[si % CHART_COLORS.length]}
                      stroke="var(--sm-bg)"
                      strokeWidth={2}
                    />
                  );
                })}
              </g>
            )}
            <rect
              x={PAD.left - 8}
              y={0}
              width={plotW + 16}
              height={height}
              fill="transparent"
              onPointerMove={onMove}
              onPointerDown={onMove}
              onPointerLeave={() => setActive(null)}
            />
          </svg>
        )}
        {active !== null && (
          <div
            role="status"
            className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-xl glass-strong px-3 py-2 text-xs shadow-lg"
            style={{ left: tooltipLeft }}
          >
            <p className="mb-1 text-ink-3">{labels[active]}</p>
            {series.map((s, si) => (
              <p key={s.name} className="flex items-center gap-2 whitespace-nowrap">
                <span
                  aria-hidden
                  className="inline-block h-0.5 w-3 rounded-full"
                  style={{ background: CHART_COLORS[si % CHART_COLORS.length] }}
                />
                <strong className="font-semibold text-ink tabular-nums">
                  {s.values[active] === null || s.values[active] === undefined
                    ? "—"
                    : format(s.values[active]!)}
                </strong>
                <span className="text-ink-2">{s.name}</span>
              </p>
            ))}
          </div>
        )}
      </div>
      <details className="mt-2 text-xs text-ink-2">
        <summary className="cursor-pointer text-ink-3 select-none hover:text-ink-2">
          Als tabel
        </summary>
        <div className="mt-2 max-h-56 overflow-auto">
          <table className="w-full text-left tabular-nums" aria-describedby={id}>
            <caption id={id} className="sr-only">
              {title}
            </caption>
            <thead>
              <tr className="text-ink-3">
                <th className="py-1 pr-3 font-medium">Wanneer</th>
                {series.map((s) => (
                  <th key={s.name} className="py-1 pr-3 font-medium">
                    {s.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {labels.map((label, i) => (
                <tr key={`${label}-${i}`} className="border-t border-line">
                  <td className="py-1 pr-3">{label}</td>
                  {series.map((s) => (
                    <td key={s.name} className="py-1 pr-3">
                      {s.values[i] === null || s.values[i] === undefined
                        ? "—"
                        : format(s.values[i]!)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
