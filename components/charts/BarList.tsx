import { cn } from "@/lib/cn";

/**
 * Een lijst met liggende balken (zelfgebouwd HTML): label links, waarde aan het
 * eind van de balk, één kleur. Voor "welke onderdelen het meest", trechters en
 * foutsoorten. Elke waarde staat er als tekst bij, dus er is geen hover nodig om
 * hem te lezen; de balk krijgt hem ook als title.
 */

export interface BarItem {
  label: string;
  value: number;
  /** Extra tekst achter de waarde, bijv. "62%". */
  note?: string;
}

export function BarList({
  items,
  format = (value) => value.toLocaleString("nl-NL"),
  color = "#3987e5",
  className,
  empty = "Nog niets geteld.",
}: {
  items: readonly BarItem[];
  format?: (value: number) => string;
  color?: string;
  className?: string;
  empty?: string;
}) {
  const max = Math.max(0, ...items.map((item) => item.value));
  if (max === 0) return <p className={cn("text-sm text-ink-3", className)}>{empty}</p>;
  return (
    <ul className={cn("space-y-3 sm:space-y-2", className)}>
      {items.map((item) => {
        const ratio = item.value / max;
        return (
          <li
            key={item.label}
            className="grid grid-cols-1 gap-x-3 gap-y-1 text-sm sm:grid-cols-[minmax(0,14rem)_1fr] sm:items-center"
          >
            <span className="truncate text-ink-2" title={item.label}>
              {item.label}
            </span>
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="h-2.5 shrink-0 rounded-r-[4px]"
                // Ruimte overhouden voor de waarde erachter.
                style={{
                  width: `max(calc((100% - 6rem) * ${ratio.toFixed(4)}), 2px)`,
                  background: color,
                }}
                title={`${item.label}: ${format(item.value)}`}
              />
              <span className="shrink-0 font-semibold text-ink tabular-nums">
                {format(item.value)}
                {item.note && <span className="ml-1.5 font-normal text-ink-3">{item.note}</span>}
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
