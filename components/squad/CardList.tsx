"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import { ArrowLeftRight, ChevronDown, SlidersHorizontal } from "lucide-react";
import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { SubjectIcon } from "@/components/subjects/SubjectIcon";
import { TIER_LABELS, TIER_ORDER, type CardTier } from "@/lib/calc/tiers";
import { faceStyleFor } from "@/lib/cards/draw";
import { cardTierLabel, type CardData } from "@/lib/cards/model";
import { cn } from "@/lib/cn";
import { positionFit } from "@/lib/squad/chemistry";
import { FORMATIONS, LINE_LABELS, slotLine, type Line } from "@/lib/squad/formations";
import { cardAt as cardAtSpot, lineOfSpot, type Lineup, type Spot } from "@/lib/squad/lineup";
import { GROUP_LABELS, ratingNote, type SquadPlayer } from "@/lib/squad/players";
import { groupByVak, rankForSpot, type MoveEffect, type Suggestion } from "@/lib/squad/suggest";
import type { SubjectGroup } from "@/lib/types";
import { chemistryTone } from "./SquadCard";
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

/** Positie-afkorting van een plek, of "bank". */
function spotShort(lineup: Lineup, spot: Spot): string {
  if (spot.kind === "bank") return "de bank";
  return FORMATIONS[lineup.formation].slots.find((s) => s.id === spot.slot)?.position ?? "het veld";
}

const signed = (value: number) => (value > 0 ? `+${value}` : `−${Math.abs(value)}`);

/** "+3 chemie", "−1 rating" (alleen wat verandert), of "geen verschil". */
function EffectChips({ effect }: { effect: MoveEffect }) {
  const parts: { text: string; good: boolean }[] = [];
  if (effect.chemistry !== 0)
    parts.push({ text: `${signed(effect.chemistry)} chemie`, good: effect.chemistry > 0 });
  if (effect.rating !== 0)
    parts.push({ text: `${signed(effect.rating)} rating`, good: effect.rating > 0 });
  if (parts.length === 0) return <span className="text-xs text-ink-3">geen verschil</span>;
  return (
    <span className="flex flex-col items-end gap-0.5">
      {parts.map((part) => (
        <span
          key={part.text}
          className={cn(
            "text-xs font-semibold whitespace-nowrap tabular-nums",
            part.good ? "text-good" : "text-bad",
          )}
        >
          {part.text}
        </span>
      ))}
    </span>
  );
}

function effectText(effect: MoveEffect): string {
  const parts: string[] = [];
  if (effect.chemistry)
    parts.push(`${effect.chemistry > 0 ? "plus" : "min"} ${Math.abs(effect.chemistry)} chemie`);
  if (effect.rating)
    parts.push(`${effect.rating > 0 ? "plus" : "min"} ${Math.abs(effect.rating)} rating`);
  return parts.length ? parts.join(", ") : "geen verschil";
}

/** Het rondje links: tierkleur met het vak-icoon, en de chemie op die plek als bolletje. */
function Badge({ card, chemistry }: { card: CardData; chemistry: number | null }) {
  const style = faceStyleFor(card);
  const [a, , c] = style.stops;
  return (
    <span
      aria-hidden
      className="relative grid size-10 shrink-0 place-items-center rounded-xl"
      style={
        { background: `linear-gradient(150deg, ${a}, ${c})`, color: style.text } as CSSProperties
      }
    >
      <SubjectIcon name={card.icon} className="size-5" strokeWidth={2.2} />
      {chemistry !== null && (
        <span
          className="absolute -right-1.5 -bottom-1.5 grid size-5 place-items-center rounded-full border border-black/40 font-card text-[0.8rem] leading-none text-[#0b0a1a]"
          style={{ background: chemistryTone(chemistry) }}
        >
          {chemistry}
        </span>
      )}
    </span>
  );
}

interface RowInfo {
  player: SquadPlayer;
  card: CardData;
  /** Chemie op de gekozen plek, of null. */
  chemistry: number | null;
  effect: MoveEffect | null;
  /** Waar hij nu staat ("op het veld · CM", "op de bank"), of null. */
  status: string | null;
  /** Wat er verder verschuift, of waarom het niet mag. */
  note: string | null;
  blocked: boolean;
  outOfPosition: boolean;
}

function Row({
  info,
  draggable,
  onPick,
}: {
  info: RowInfo;
  draggable: boolean;
  onPick: (cardId: string) => void;
}) {
  const { player, card } = info;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `${draggable ? "lijst" : "keuze"}:${card.id}`,
    data: { cardId: card.id },
    disabled: !draggable || info.blocked,
  });
  const note = ratingNote(player);
  const label = [
    `${player.subjectName}, rating ${player.rating}${note ? ` (${note})` : ""}`,
    info.chemistry !== null ? `chemie hier ${info.chemistry}` : null,
    info.outOfPosition ? "uit positie" : null,
    info.effect ? effectText(info.effect) : null,
    info.status,
    info.note,
  ]
    .filter(Boolean)
    .join(". ");
  return (
    <button
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      type="button"
      disabled={info.blocked}
      onClick={() => onPick(card.id)}
      aria-label={label}
      role={undefined}
      aria-disabled={undefined}
      aria-roledescription={undefined}
      tabIndex={0}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left transition-colors hover:bg-glass-strong focus-visible:outline-2 focus-visible:outline-[var(--sm-accent)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent",
        isDragging && "opacity-30",
      )}
    >
      <Badge card={card} chemistry={info.chemistry} />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium text-ink">{player.subjectName}</span>
        <span className="block truncate text-xs text-ink-3">
          {info.status && <span className="font-semibold text-ink-2">{info.status} · </span>}
          {[
            cardTierLabel(card),
            card.grade.description || null,
            note,
            info.outOfPosition ? "uit positie" : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </span>
        {info.note && (
          <span
            className={cn(
              "mt-0.5 flex items-center gap-1 text-xs",
              info.blocked ? "text-warn" : "text-ink-2",
            )}
          >
            {!info.blocked && <ArrowLeftRight size={11} aria-hidden className="shrink-0" />}
            <span className="truncate">{info.note}</span>
          </span>
        )}
      </span>
      <span className="flex shrink-0 flex-col items-end gap-0.5">
        <span className="sensitive flex items-start font-card text-2xl leading-none text-ink tabular-nums">
          {player.rating}
          {player.judged && (
            <span className="ml-0.5 rounded bg-glass-strong px-1 text-[0.65rem] leading-tight text-ink-2">
              {player.judged}
            </span>
          )}
        </span>
        {info.effect && <EffectChips effect={info.effect} />}
      </span>
    </button>
  );
}

/**
 * De kaarten om op te stellen, met filters. Per vak één regel: de beste kaart
 * voor de gekozen plek (rating en chemie samen, net als bij het bouwen), met
 * "Nog 5 kaarten van Engels" om de rest te zien. Per kaart staat wat er
 * gebeurt (+3 chemie, −1 rating) en of er nog iemand anders verschuift. Zonder
 * plek gewoon op rating. Op een computer kun je de kaarten naar het veld slepen.
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
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  // Alleen de lijst naast het veld is een sleepdoel (een kaart erheen slepen = uit je elftal).
  const { setNodeRef: setDropRef } = useDroppable({
    id: draggable ? "lijst" : "lijst-keuze",
    disabled: !draggable,
  });

  const { lineup, players } = api;
  const all = useMemo(() => [...players.values()], [players]);
  const targetLine = target ? lineOfSpot(lineup, target) : null;
  // Zonder doelplek: "natuurlijke positie" = past op een van de lege plekken.
  const openLines = useMemo(
    () =>
      new Set<Line>(
        FORMATIONS[lineup.formation].slots
          .filter((s) => !lineup.slots[s.id])
          .map((s) => slotLine(s)),
      ),
    [lineup],
  );

  const options = useMemo(() => {
    const groups = [...new Set(all.map((p) => p.group))];
    const periods = new Map<string, string>();
    for (const p of all) {
      const card = api.cardById(p.id);
      if (p.period && card) periods.set(p.period, card.periodName ?? "Onbekend");
    }
    return { groups, periods: [...periods] };
  }, [all, api]);

  const filtered = useMemo(
    () =>
      all.filter((p) => {
        if (group && p.group !== group) return false;
        if (tier && p.tier !== tier) return false;
        if (period && p.period !== period) return false;
        if (naturalOnly) {
          const lines = targetLine ? [targetLine] : [...openLines];
          if (!lines.some((line) => positionFit(p, line) === "natuurlijk")) return false;
        }
        return true;
      }),
    [all, group, tier, period, naturalOnly, targetLine, openLines],
  );

  const groups = useMemo(() => {
    const nameOf = (id: string) => players.get(id)?.subjectName ?? "Kaart";
    const statusOf = (id: string): string | null => {
      if (target && cardAtSpot(lineup, target) === id) return "Staat hier nu";
      const slot = Object.entries(lineup.slots).find(([, card]) => card === id)?.[0];
      if (slot) return `Op het veld (${spotShort(lineup, { kind: "veld", slot })})`;
      return lineup.bench.includes(id) ? "Op de bank" : null;
    };
    const toInfo = (s: Suggestion): RowInfo => {
      let note: string | null = null;
      if (s.conflict)
        note = `${s.player.subjectName} staat al op ${spotShort(lineup, { kind: "veld", slot: s.conflict.slot })}. Eén kaart per vak op het veld.`;
      else if (s.displaced) {
        const who = nameOf(s.displaced.cardId);
        const to = s.displaced.to;
        if (!to) note = `${who} gaat eruit`;
        else if (to.kind === "bank") note = `${who} gaat naar de bank`;
        else {
          const there = spotShort(lineup, to);
          note =
            target && spotShort(lineup, target) === there
              ? `Ruilt van plek met ${who}`
              : `Ruilt: ${who} naar ${there}`;
        }
      } else if (s.from?.kind === "veld" && target?.kind === "bank")
        note = `Van ${spotShort(lineup, s.from)} naar de bank`;
      return {
        player: s.player,
        card: api.cardById(s.player.id)!,
        chemistry: s.chemistry,
        effect: target?.kind === "veld" || s.from?.kind === "veld" ? s.effect : null,
        status: statusOf(s.player.id),
        note,
        blocked:
          s.conflict !== null || (target !== null && cardAtSpot(lineup, target) === s.player.id),
        outOfPosition: s.fit === "verkeerd" || s.fit === "onmogelijk",
      };
    };
    if (target) {
      return groupByVak(rankForSpot(lineup, target, filtered, players)).map((g) => ({
        vak: g.vak,
        best: toInfo(g.best),
        rest: g.rest.map(toInfo),
      }));
    }
    const sorted = [...filtered].sort((a, b) => b.rating - a.rating || a.id.localeCompare(b.id));
    const byVak = new Map<string, RowInfo[]>();
    for (const player of sorted) {
      const info: RowInfo = {
        player,
        card: api.cardById(player.id)!,
        chemistry: null,
        effect: null,
        status: statusOf(player.id),
        note: null,
        blocked: false,
        outOfPosition: false,
      };
      byVak.set(player.vak, [...(byVak.get(player.vak) ?? []), info]);
    }
    return [...byVak].map(([vak, rows]) => ({ vak, best: rows[0]!, rest: rows.slice(1) }));
  }, [target, lineup, players, filtered, api]);

  const toggle = (vak: string) =>
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(vak)) next.delete(vak);
      else next.add(vak);
      return next;
    });

  const active = [group, tier, period, naturalOnly ? "ja" : ""].filter(Boolean).length;
  const filtersId = `${draggable ? "lijst" : "keuze"}-filters`;

  return (
    <div ref={setDropRef} className={cn("flex min-h-0 flex-col", className)}>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="text-xs text-ink-3">
          {groups.length} {groups.length === 1 ? "vak" : "vakken"}
          {active > 0 ? ", gefilterd" : ""}
        </p>
        <button
          type="button"
          aria-expanded={showFilters}
          aria-controls={filtersId}
          onClick={() => setShowFilters((v) => !v)}
          className={cn(
            "flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-colors",
            active > 0 || showFilters
              ? "glass text-ink"
              : "text-ink-2 hover:bg-glass hover:text-ink",
          )}
        >
          <SlidersHorizontal size={14} aria-hidden />
          Filters{active > 0 ? ` (${active})` : ""}
        </button>
      </div>
      <div id={filtersId} hidden={!showFilters}>
        <div className="mb-2 flex flex-wrap gap-2">
          <Select label="Vakgroep" value={group} onChange={(v) => setGroup(v as SubjectGroup | "")}>
            <option value="">Vakgroep</option>
            {options.groups.map((g) => (
              <option key={g} value={g}>
                {GROUP_LABELS[g]}
              </option>
            ))}
          </Select>
          <Select label="Tier" value={tier} onChange={(v) => setTier(v as CardTier | "")}>
            <option value="">Tier</option>
            {TIER_ORDER.map((t) => (
              <option key={t} value={t}>
                {TIER_LABELS[t]}
              </option>
            ))}
          </Select>
          {options.periods.length > 1 && (
            <Select label="Periode" value={period} onChange={setPeriod}>
              <option value="">Periode</option>
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
      </div>
      {groups.length === 0 ? (
        <p className="px-1 py-6 text-center text-sm text-ink-3">Geen kaarten met deze filters.</p>
      ) : (
        <ul
          className="-mx-1 scroll-quiet min-h-0 flex-1 space-y-0.5 overflow-y-auto overscroll-contain px-1 pb-4"
          aria-label="Kaarten, per vak"
        >
          {groups.map((g) => {
            const expanded = open.has(g.vak);
            const name = g.best.player.subjectName;
            return (
              <li key={g.vak}>
                <Row info={g.best} draggable={draggable} onPick={onPick} />
                {g.rest.length > 0 && (
                  <>
                    <button
                      type="button"
                      aria-expanded={expanded}
                      onClick={() => toggle(g.vak)}
                      className="ml-[3.25rem] flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-accent-ink hover:bg-glass"
                    >
                      <ChevronDown
                        size={13}
                        aria-hidden
                        className={cn("transition-transform", expanded && "rotate-180")}
                      />
                      {expanded
                        ? `Minder van ${name}`
                        : `Nog ${g.rest.length} ${g.rest.length === 1 ? "kaart" : "kaarten"} van ${name}`}
                    </button>
                    {expanded && (
                      <ul
                        className="ml-4 border-l border-line pl-2"
                        aria-label={`Andere kaarten van ${name}`}
                      >
                        {g.rest.map((info) => (
                          <li key={info.card.id}>
                            <Row info={info} draggable={draggable} onPick={onPick} />
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
