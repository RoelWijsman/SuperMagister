"use client";

import { useEffect, useRef, useState } from "react";
import { formatGrade } from "@/lib/calc/average";
import { formatDelta } from "@/lib/calc/cards";
import { formatShortDate, parseISODate } from "@/lib/date";
import { guessOutcome } from "@/lib/guess/outcome";
import type { GuessEntry } from "@/lib/guess/types";

const HEIGHT = 196;
const PAD = { left: 30, right: 12, top: 12, bottom: 28 };
const TICKS = [2, 4, 6, 8, 10];

function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry?.contentRect.width ?? 0));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

/**
 * Gok tegenover echt, per toets in de tijd: een "dumbbell" per gok. De ring is
 * je gok, de stip het echte cijfer. Eén as (1 tot 10), één kleur, vorm als
 * tweede kenmerk. Waarden staan ook in de tooltip en in de tabel.
 */
export function GuessChart({ entries }: { entries: readonly GuessEntry[] }) {
  const [ref, width] = useWidth();
  const [active, setActive] = useState<number | null>(null);
  const limit = width > 0 && width < 420 ? 10 : 16;
  const shown = entries.slice(-limit);

  const plotLeft = PAD.left + 10;
  const plotRight = Math.max(plotLeft, width - PAD.right - 10);
  const step = shown.length > 1 ? (plotRight - plotLeft) / (shown.length - 1) : 0;
  const x = (i: number) => (shown.length > 1 ? plotLeft + i * step : (plotLeft + plotRight) / 2);
  const y = (value: number) => PAD.top + (1 - (value - 1) / 9) * (HEIGHT - PAD.top - PAD.bottom);
  const hitWidth = Math.max(24, shown.length > 1 ? step : 48);
  const current = active !== null ? shown[active] : undefined;

  return (
    <figure className="sensitive">
      <figcaption className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-2">
        <span className="flex items-center gap-1.5">
          <svg aria-hidden width="12" height="12" viewBox="0 0 12 12">
            <circle
              cx="6"
              cy="6"
              r="4.5"
              fill="none"
              stroke="var(--sm-accent-ink)"
              strokeWidth="2"
            />
          </svg>
          Gok
        </span>
        <span className="flex items-center gap-1.5">
          <svg aria-hidden width="12" height="12" viewBox="0 0 12 12">
            <circle cx="6" cy="6" r="4.5" fill="var(--sm-accent-ink)" />
          </svg>
          Echt cijfer
        </span>
        <span className="text-ink-3">laatste {shown.length} gokken</span>
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
                  strokeWidth={1}
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

            {shown.map((entry, i) => {
              const cx = x(i);
              const isActive = i === active;
              const r = isActive ? 6 : 4.5;
              return (
                <g key={entry.gradeId} opacity={active === null || isActive ? 1 : 0.45}>
                  <line
                    x1={cx}
                    x2={cx}
                    y1={y(entry.guess)}
                    y2={y(entry.actual)}
                    stroke="var(--sm-line-strong)"
                    strokeWidth={2}
                    strokeLinecap="round"
                  />
                  {/* Ring in de kleur van het oppervlak: houdt overlappende stippen leesbaar. */}
                  <circle cx={cx} cy={y(entry.actual)} r={r + 2} fill="var(--sm-bg)" />
                  <circle cx={cx} cy={y(entry.actual)} r={r} fill="var(--sm-accent-ink)" />
                  <circle cx={cx} cy={y(entry.guess)} r={r + 2} fill="var(--sm-bg)" />
                  <circle
                    cx={cx}
                    cy={y(entry.guess)}
                    r={r - 1}
                    fill="var(--sm-bg)"
                    stroke="var(--sm-accent-ink)"
                    strokeWidth={2}
                  />
                </g>
              );
            })}

            {shown.length > 0 && (
              <>
                <text x={x(0)} y={HEIGHT - 8} textAnchor="start" className="fill-ink-3 text-[11px]">
                  {formatShortDate(parseISODate(shown[0]!.date))}
                </text>
                {shown.length > 1 && (
                  <text
                    x={x(shown.length - 1)}
                    y={HEIGHT - 8}
                    textAnchor="end"
                    className="fill-ink-3 text-[11px]"
                  >
                    {formatShortDate(parseISODate(shown[shown.length - 1]!.date))}
                  </text>
                )}
              </>
            )}
          </svg>
        )}

        {/* Raakvlakken: breder dan de stip, en ook met het toetsenbord te bereiken. */}
        {width > 0 &&
          shown.map((entry, i) => (
            <button
              key={entry.gradeId}
              type="button"
              aria-label={`${entry.subjectName}, ${formatShortDate(parseISODate(entry.date))}: gegokt ${formatGrade(entry.guess)}, echt ${formatGrade(entry.actual)}`}
              onPointerEnter={() => setActive(i)}
              onPointerLeave={() => setActive((a) => (a === i ? null : a))}
              onFocus={() => setActive(i)}
              onBlur={() => setActive((a) => (a === i ? null : a))}
              className="absolute top-0 rounded-lg outline-offset-0"
              style={{ left: x(i) - hitWidth / 2, width: hitWidth, height: HEIGHT - PAD.bottom }}
            />
          ))}

        {current && active !== null && (
          <div
            role="presentation"
            className="pointer-events-none absolute z-10 w-max max-w-56 -translate-x-1/2 rounded-xl glass-strong px-3 py-2 text-left shadow-lg"
            style={{
              left: Math.min(Math.max(x(active), 90), width - 90),
              top: Math.max(0, Math.min(y(current.actual), y(current.guess)) - 92),
            }}
          >
            <p className="text-base font-semibold text-ink tabular-nums">
              {formatGrade(current.actual)}{" "}
              <span className="text-sm font-normal text-ink-2">
                echt · gok {formatGrade(current.guess)} ·{" "}
                {formatDelta(guessOutcome(current.guess, current.actual).diff)}
              </span>
            </p>
            <p className="text-xs text-ink-3">
              {current.subjectName} · {formatShortDate(parseISODate(current.date))}
            </p>
          </div>
        )}
      </div>

      <details className="mt-2 text-sm">
        <summary className="cursor-pointer text-ink-2 hover:text-ink">Bekijk als tabel</summary>
        <table className="mt-2 w-full text-left tabular-nums">
          <thead className="text-ink-3">
            <tr>
              <th className="py-1 font-medium">Datum</th>
              <th className="py-1 font-medium">Vak</th>
              <th className="py-1 text-right font-medium">Gok</th>
              <th className="py-1 text-right font-medium">Echt</th>
              <th className="py-1 text-right font-medium">Verschil</th>
            </tr>
          </thead>
          <tbody className="text-ink-2">
            {[...entries].reverse().map((entry) => (
              <tr key={entry.gradeId} className="border-t border-line">
                <td className="py-1">{formatShortDate(parseISODate(entry.date))}</td>
                <td className="py-1">{entry.subjectName}</td>
                <td className="py-1 text-right">{formatGrade(entry.guess)}</td>
                <td className="py-1 text-right">{formatGrade(entry.actual)}</td>
                <td className="py-1 text-right">
                  {formatDelta(guessOutcome(entry.guess, entry.actual).diff)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
