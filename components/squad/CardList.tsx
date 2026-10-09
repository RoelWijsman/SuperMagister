"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import { Check, ChevronDown } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { TIER_LABELS, TIER_ORDER, type CardTier } from "@/lib/calc/tiers";
import type { CardData } from "@/lib/cards/model";
import { cn } from "@/lib/cn";
import { positionFit } from "@/lib/squad/chemistry";
import { FORMATIONS, LINE_LABELS, slotLine, type Line } from "@/lib/squad/formations";
import { lineOfSpot, type Spot } from "@/lib/squad/lineup";
import { GROUP_LABELS, NATURAL_LINE_LABELS, type SquadPlayer } from "@/lib/squad/players";
import { rankForSpot } from "@/lib/squad/suggest";
import type { SubjectGroup } from "@/lib/types";
import { SquadCard } from "./SquadCard";
import type { SquadApi } from "./useSquad";

function Select({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="relative min-w-0 flex-1">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-full cursor-pointer appearance-none truncate rounded-full glass pr-8 pl-3.5 text-sm font-medium text-ink outline-offset-2"
      >
        {children}
      </select>
      <ChevronDown
        size={15}
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-ink-3"
      />
    </label>
  );
}

function Row({
  card,
  player,
  chemistry,
  inSquad,
  draggable,
  onPick,
}: {
  card: CardData;
  player: SquadPlayer;
  chemistry: number | null;
  inSquad: boolean;
  draggable: boolean;
  onPick: (cardId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `${draggable ? "lijst" : "keuze"}:${card.id}`,
    data: { cardId: card.id },
    disabled: !draggable,
  });
  const label = `${card.subjectName}, rating ${card.ratingLabel}, ${NATURAL_LINE_LABELS[player.natural].toLowerCase()}${chemistry !== null ? `, chemie hier ${chemistry}` : ""}${inSquad ? ", staat al in je elftal" : ""}`;
  return (
    <li>
      <button
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        type="button"
        onClick={() => onPick(card.id)}
        aria-label={label}
        role={undefined}
        aria-disabled={undefined}
        aria-roledescription={undefined}
        tabIndex={0}
        className={cn(
          "flex w-full items-center gap-3 rounded-2xl px-2 py-1.5 text-left transition-colors hover:bg-glass-strong focus-visible:outline-2 focus-visible:outline-[var(--sm-accent)]",
          inSquad && "opacity-55",
          isDragging && "opacity-30",
        )}
      >
        <SquadCard card={card} chemistry={null} className="w-11 shrink-0" />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium text-ink">{card.subjectName}</span>
          <span className="block truncate text-xs text-ink-3">
            {NATURAL_LINE_LABELS[player.natural]} · {card.grade.description || "Toets"}
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-0.5">
          <span className="sensitive font-card text-xl leading-none text-ink tabular-nums">
            {card.ratingLabel}
          </span>
          {chemistry !== null && (
            <span
              className={cn(
                "text-xs font-semibold tabular-nums",
                chemistry >= 7 ? "text-good" : chemistry >= 4 ? "text-warn" : "text-bad",
              )}
            >
              chemie {chemistry}
            </span>
          )}
          {inSquad && (
            <span className="flex items-center gap-0.5 text-[0.7rem] text-ink-3">
              <Check size={11} aria-hidden /> in elftal
            </span>
          )}
        </span>
      </button>
    </li>
  );
}

/**
 * De kaarten om op te stellen, met filters. Met een doelplek gesorteerd op de
 * beste chemie voor die plek en dan de rating; anders op rating. Op een computer
 * kun je de kaarten naar het veld slepen; tikken werkt overal.
 */
export function CardList({
  api,
  target,
  draggable,
  onPick,
  className,
}: {
  api: SquadApi;
  target: Spot | null;
  draggable: boolean;
  onPick: (cardId: string) => void;
  className?: string;
}) {
  const [group, setGroup] = useState<SubjectGroup | "">("");
  const [tier, setTier] = useState<CardTier | "">("");
  const [period, setPeriod] = useState("");
  const [naturalOnly, setNaturalOnly] = useState(false);
  // Alleen de lijst naast het veld is een sleepdoel (een kaart erheen slepen = uit je elftal).
  const { setNodeRef: setDropRef } = useDroppable({
    id: draggable ? "lijst" : "lijst-keuze",
    disabled: !draggable,
  });

  const players = useMemo(() => [...api.players.values()], [api.players]);
  const targetLine = target ? lineOfSpot(api.lineup, target) : null;
  // Zonder doelplek: "natuurlijke positie" = past op een van de lege plekken.
  const openLines = useMemo(
    () =>
      new Set<Line>(
        FORMATIONS[api.lineup.formation].slots
          .filter((s) => !api.lineup.slots[s.id])
          .map((s) => slotLine(s)),
      ),
    [api.lineup],
  );

  const options = useMemo(() => {
    const groups = [...new Set(players.map((p) => p.group))];
    const periods = new Map<string, string>();
    for (const p of players) {
      const card = api.cardById(p.id);
      if (p.period && card) periods.set(p.period, card.periodName ?? "Onbekend");
    }
    return { groups, periods: [...periods] };
  }, [players, api]);

  const filtered = useMemo(
    () =>
      players.filter((p) => {
        if (group && p.group !== group) return false;
        if (tier && p.tier !== tier) return false;
        if (period && p.period !== period) return false;
        if (naturalOnly) {
          const lines = targetLine ? [targetLine] : [...openLines];
          if (!lines.some((line) => positionFit(p, line) === "natuurlijk")) return false;
        }
        return true;
      }),
    [players, group, tier, period, naturalOnly, targetLine, openLines],
  );

  const ranked = useMemo(() => {
    if (target) return rankForSpot(api.lineup, target, filtered, api.players);
    return [...filtered]
      .sort((a, b) => b.rating - a.rating || a.id.localeCompare(b.id))
      .map((player) => ({ player, chemistry: null }));
  }, [target, api.lineup, api.players, filtered]);

  return (
    <div ref={setDropRef} className={cn("flex min-h-0 flex-col", className)}>
      <div className="mb-2 flex flex-wrap gap-2">
        <Select label="Vakgroep" value={group} onChange={(v) => setGroup(v as SubjectGroup | "")}>
          <option value="">Alle vakgroepen</option>
          {options.groups.map((g) => (
            <option key={g} value={g}>
              {GROUP_LABELS[g]}
            </option>
          ))}
        </Select>
        <Select label="Tier" value={tier} onChange={(v) => setTier(v as CardTier | "")}>
          <option value="">Alle tiers</option>
          {TIER_ORDER.map((t) => (
            <option key={t} value={t}>
              {TIER_LABELS[t]}
            </option>
          ))}
        </Select>
        {options.periods.length > 1 && (
          <Select label="Periode" value={period} onChange={setPeriod}>
            <option value="">Alle periodes</option>
            {options.periods.map(([key, name]) => (
              <option key={key} value={key}>
                {name}
              </option>
            ))}
          </Select>
        )}
      </div>
      <label className="mb-2 flex cursor-pointer items-center gap-2 px-1 text-sm text-ink-2">
        <input
          type="checkbox"
          checked={naturalOnly}
          onChange={(event) => setNaturalOnly(event.target.checked)}
          className="size-4 accent-[var(--sm-accent)]"
        />
        Alleen natuurlijke positie
        {targetLine && (
          <span className="text-ink-3">({LINE_LABELS[targetLine].toLowerCase()})</span>
        )}
      </label>
      {ranked.length === 0 ? (
        <p className="px-1 py-6 text-center text-sm text-ink-3">Geen kaarten met deze filters.</p>
      ) : (
        <ul className="-mx-1 min-h-0 flex-1 space-y-0.5 overflow-y-auto px-1" aria-label="Kaarten">
          {ranked.map(({ player, chemistry }) => {
            const card = api.cardById(player.id);
            return card ? (
              <Row
                key={player.id}
                card={card}
                player={player}
                chemistry={chemistry}
                inSquad={api.inSquad.has(player.id)}
                draggable={draggable}
                onPick={onPick}
              />
            ) : null;
          })}
        </ul>
      )}
    </div>
  );
}
