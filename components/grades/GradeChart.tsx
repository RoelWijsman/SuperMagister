"use client";

import { useMemo, useState } from "react";
import { formatGrade } from "@/lib/calc/average";
import { averageHistory } from "@/lib/calc/overview";
import { formatShortDate, parseISODate } from "@/lib/date";
import type { Grade } from "@/lib/types";
import { useWidth } from "./useGradeData";

const HEIGHT = 220;
const PAD = { left: 30, right: 14, top: 14, bottom: 28 };
const TICKS = [2, 4, 6, 8, 10];
const DAY = 864e5;

/**
 * Fase 4: alle cijfers van een vak in de tijd. De grootte van de stip is de
 * weging (een open ring telt niet mee), de lijn is je gemiddelde tot dan toe,
 * de stippellijn de 5,5. Eén as; waarden staan ook in de tooltip en de tabel.
 */
export function GradeChart({ grades, color }: { grades: readonly Grade[]; color: string }) {
  const [ref, width] = useWidth();
  const [active, setActive] = useState<number | null>(null);
  const points = useMemo(() => averageHistory(grades), [grades]);
  if (points.length === 0) return null;

  const times = points.map((p) => +parseISODate(p.date));
  const first = Math.min(...times);
  const last = Math.max(...times);
  const span = Math.max(last - first, 14 * DAY);
  const plotLeft = PAD.left + 12;
  const plotRight = Math.max(plotLeft + 1, width - PAD.right - 12);
  const x = (time: number) =>
    plotLeft + ((time - first + (span - (last - first)) / 2) / span) * (plotRight - plotLeft);
  const y = (value: number) => PAD.top + (1 - (value - 1) / 9) * (HEIGHT - PAD.top - PAD.bottom);
  const radius = (weight: number) => (weight > 0 ? 4 + Math.sqrt(weight) * 2.2 : 4);
  const line = points
    .filter((p) => p.average !== null)
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(+parseISODate(p.date))},${y(p.average!)}`)
    .join(" ");
  const current = active !== null ? points[active] : undefined;

  return (
    <figure className="sensitive">
      <figcaption className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-2">
        <span className="flex items-center gap-1.5">
          <svg aria-hidden width="16" height="12" viewBox="0 0 16 12">
            <circle cx="4" cy="6" r="3" fill={color} />
            <circle cx="12" cy="6" r="5" fill={color} />
          </svg>
          Cijfer (groter = zwaarder)
        </span>
        <span className="flex items-center gap-1.5">
          <svg aria-hidden width="16" height="12" viewBox="0 0 16 12">
            <line x1="0" x2="16" y1="6" y2="6" stroke="var(--sm-ink)" strokeWidth="2" />
          </svg>
          Gemiddelde
        </span>
        <span className="flex items-center gap-1.5">
          <svg aria-hidden width="16" height="12" viewBox="0 0 16 12">
            <line
              x1="0"
              x2="16"
              y1="6"
              y2="6"
              stroke="var(--sm-line-strong)"
              strokeWidth="2"
              strokeDasharray="3 3"
            />
          </svg>
          5,5
        </span>
      </figcaption>

      <div ref={ref} className="relative mt-3" style={{ height: HEIGHT }}>
        {width > 0 && (
          <svg width={width} height={HEIGHT} className="block overflow-visible" aria-hidden>
            {TICKS.map((tick) => (
              <g key={tick}>
                <line
                  x1={PAD.left}
                  x2={width - PAD.right}
                  y1={y(tick)}
                  y2={y(tick)}
                  stroke="var(--sm-line)"
                />
                <text
                  x={PAD.left - 8}
                  y={y(tick)}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="fill-ink-3 text-[11px] tabular-nums"
                >
                  {tick}
                </text>
              </g>
            ))}
            <line
              x1={PAD.left}
              x2={width - PAD.right}
              y1={y(5.5)}
              y2={y(5.5)}
              stroke="var(--sm-line-strong)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
            />
            <path
              d={line}
              fill="none"
              stroke="var(--sm-ink)"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              opacity={0.8}
            />
            {points.map((p, i) => {
              const cx = x(+parseISODate(p.date));
              const r = radius(p.weight) + (i === active ? 1.5 : 0);
              return (
                <g key={p.id} opacity={active === null || i === active ? 1 : 0.5}>
                  <circle cx={cx} cy={y(p.value)} r={r + 2} fill="var(--sm-bg)" />
                  <circle
                    cx={cx}
                    cy={y(p.value)}
                    r={r}
                    fill={p.counts ? color : "var(--sm-bg)"}
                    stroke={color}
                    strokeWidth={p.counts ? 0 : 2}
                    strokeDasharray={p.counts ? undefined : "2 2"}
                  />
                </g>
              );
            })}
            <text x={x(first)} y={HEIGHT - 8} textAnchor="start" className="fill-ink-3 text-[11px]">
              {formatShortDate(new Date(first))}
            </text>
            {last > first && (
              <text x={x(last)} y={HEIGHT - 8} textAnchor="end" className="fill-ink-3 text-[11px]">
                {formatShortDate(new Date(last))}
              </text>
            )}
          </svg>
        )}

        {width > 0 &&
          points.map((p, i) => {
            const cx = x(+parseISODate(p.date));
            return (
              <button
                key={p.id}
                type="button"
                aria-label={`${p.grade.description}, ${formatShortDate(parseISODate(p.date))}: ${formatGrade(p.value)}, ${p.counts ? `weging ${p.weight}` : "telt niet mee"}`}
                onPointerEnter={() => setActive(i)}
                onPointerLeave={() => setActive((a) => (a === i ? null : a))}
                onFocus={() => setActive(i)}
                onBlur={() => setActive((a) => (a === i ? null : a))}
                className="absolute rounded-full"
                style={{ left: cx - 14, top: y(p.value) - 14, width: 28, height: 28 }}
              />
            );
          })}

        {current && active !== null && (
          <div
            role="presentation"
            className="pointer-events-none absolute z-10 w-max max-w-60 -translate-x-1/2 rounded-xl glass-strong px-3 py-2 shadow-lg"
            style={{
              left: Math.min(Math.max(x(+parseISODate(current.date)), 100), width - 100),
              top: Math.max(0, y(current.value) - 86),
            }}
          >
            <p className="text-base font-semibold text-ink tabular-nums">
              {formatGrade(current.value)}{" "}
              <span className="text-sm font-normal text-ink-2">
                {current.counts ? `weging ${current.weight}` : "telt niet mee"}
              </span>
            </p>
            <p className="text-xs text-ink-3">
              {current.grade.description} · {formatShortDate(parseISODate(current.date))}
            </p>
            {current.average !== null && (
              <p className="text-xs text-ink-3">Gemiddeld daarna: {formatGrade(current.average)}</p>
            )}
          </div>
        )}
      </div>

      <details className="mt-2 text-sm">
        <summary className="cursor-pointer text-ink-2 hover:text-ink">Bekijk als tabel</summary>
        <table className="mt-2 w-full text-left tabular-nums">
          <thead className="text-ink-3">
            <tr>
              <th className="py-1 font-medium">Datum</th>
              <th className="py-1 font-medium">Toets</th>
              <th className="py-1 text-right font-medium">Cijfer</th>
              <th className="py-1 text-right font-medium">Weging</th>
              <th className="py-1 text-right font-medium">Gemiddeld</th>
            </tr>
          </thead>
          <tbody className="text-ink-2">
            {points.map((p) => (
              <tr key={p.id} className="border-t border-line">
                <td className="py-1">{formatShortDate(parseISODate(p.date))}</td>
                <td className="py-1">{p.grade.description}</td>
                <td className="py-1 text-right">{formatGrade(p.value)}</td>
                <td className="py-1 text-right">{p.counts ? p.weight : "telt niet"}</td>
                <td className="py-1 text-right">
                  {p.average === null ? "—" : formatGrade(p.average)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
