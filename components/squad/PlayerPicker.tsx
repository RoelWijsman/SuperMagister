"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import {
  Armchair,
  ArrowLeftRight,
  ChevronDown,
  Crown,
  Layers,
  Lightbulb,
  SlidersHorizontal,
  Undo2,
} from "lucide-react";
import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { SubjectIcon } from "@/components/subjects/SubjectIcon";
import { Button } from "@/components/ui/Button";
import { TIER_LABELS, TIER_ORDER, type CardTier } from "@/lib/calc/tiers";
import { faceStyleFor } from "@/lib/cards/draw";
import { cardLook, type CardData } from "@/lib/cards/model";
import { cn } from "@/lib/cn";
import { positionFit } from "@/lib/squad/chemistry";
import { FORMATIONS, LINE_LABELS, slotLine, type Line } from "@/lib/squad/formations";
import { cardAt, lineOfSpot, spotOf, type Spot } from "@/lib/squad/lineup";
import { pickerOptions, type PickOption } from "@/lib/squad/picker";
import { GROUP_LABELS, ratingNote, type SquadPlayer } from "@/lib/squad/players";
import { bestEmptySpot, type MoveEffect } from "@/lib/squad/suggest";
import type { SubjectGroup } from "@/lib/types";
import { toast } from "@/stores/toast";
import { chemistryTone } from "./SquadCard";
import type { SquadApi } from "./useSquad";

const signed = (value: number) => (value > 0 ? `+${value}` : `−${Math.abs(value)}`);

/** "+3 chemie", "−1 rating" (alleen wat verandert), of "geen verschil". */
export function EffectChips({ effect }: { effect: MoveEffect }) {
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

function effectWords(effect: MoveEffect): string {
  const parts: string[] = [];
  if (effect.chemistry)
    parts.push(`${effect.chemistry > 0 ? "plus" : "min"} ${Math.abs(effect.chemistry)} chemie`);
  if (effect.rating)
    parts.push(`${effect.rating > 0 ? "plus" : "min"} ${Math.abs(effect.rating)} rating`);
  return parts.length ? parts.join(", ") : "geen verschil";
}

/** Het blokje links: tierkleur met het vak-icoon, en de chemie op die plek als bolletje. */
export function PlayerBadge({ card, chemistry }: { card: CardData; chemistry: number | null }) {
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

/** "Goud · SO hoofdstuk 3 · G telt als 80": welke versie dit is. */
export function versionLabel(card: CardData, player: SquadPlayer): string {
  return [
    cardLook(card) === "inform" ? "In Form" : TIER_LABELS[card.tier],
    card.grade.description || null,
    ratingNote(player),
  ]
    .filter(Boolean)
    .join(" · ");
}

/**
 * Eén regel in de kiezer: wie (vak, versie, rating), wat er gebeurt (de actie
 * in gewone woorden) en wat het doet met rating en chemie. De hele regel is de
 * knop; met de muis kun je hem ook naar het veld slepen.
 */
export function PickerRow({
  card,
  player,
  title,
  detail,
  action,
  actionTone = "plain",
  chemistry,
  effect,
  label,
  dragId,
  onPick,
}: {
  card: CardData;
  player: SquadPlayer;
  /** Meestal de vaknaam. */
  title: string;
  /** Welke versie, of waar hij staat. */
  detail: string;
  /** Wat er gebeurt als je kiest ("Wissel met Scheikunde"). */
  action: string | null;
  actionTone?: "plain" | "swap" | "warn";
  chemistry: number | null;
  effect: MoveEffect | null;
  /** Toegankelijke naam (alles in één zin). */
  label: string;
  /** Slepen met de muis (alleen naast het veld). */
  dragId?: string;
  onPick: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: dragId ?? `keuze:${card.id}`,
    data: { cardId: card.id },
    disabled: !dragId,
  });
  return (
    <button
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      type="button"
      onClick={onPick}
      aria-label={label}
      role={undefined}
      aria-disabled={undefined}
      aria-roledescription={undefined}
      tabIndex={0}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left transition-colors hover:bg-glass-strong focus-visible:outline-2 focus-visible:outline-[var(--sm-accent)]",
        isDragging && "opacity-30",
      )}
    >
      <PlayerBadge card={card} chemistry={chemistry} />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium text-ink">{title}</span>
        <span className="block truncate text-xs text-ink-3">{detail}</span>
        {action && (
          <span
            className={cn(
              "mt-0.5 flex items-center gap-1 text-xs font-medium",
              actionTone === "swap"
                ? "text-accent-ink"
                : actionTone === "warn"
                  ? "text-warn"
                  : "text-ink-2",
            )}
          >
            {actionTone === "swap" && <ArrowLeftRight size={11} aria-hidden className="shrink-0" />}
            <span className="truncate">{action}</span>
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
        {effect && <EffectChips effect={effect} />}
      </span>
    </button>
  );
}

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

function SectionTitle({ children, count }: { children: ReactNode; count: number }) {
  return (
    <h4 className="mt-3 mb-1 flex items-baseline gap-2 px-1 text-xs font-semibold tracking-[0.12em] text-ink-3 uppercase">
      {children}
      <span className="font-normal tracking-normal normal-case">({count})</span>
    </h4>
  );
}

/** De eerste keer: in één zin wat een speler en een versie is, met een voorbeeld uit je eigen kaarten. */
function Intro({ api }: { api: SquadApi }) {
  const example = useMemo(() => {
    const byVak = new Map<string, SquadPlayer[]>();
    for (const p of api.players.values()) byVak.set(p.vak, [...(byVak.get(p.vak) ?? []), p]);
    const most = [...byVak.values()].sort((a, b) => b.length - a.length)[0] ?? [];
    return [...most].sort((a, b) => b.rating - a.rating).slice(0, 3);
  }, [api.players]);
  return (
    <div className="mb-3 rounded-2xl border border-[color-mix(in_oklab,var(--sm-accent)_40%,transparent)] bg-[color-mix(in_oklab,var(--sm-accent)_10%,transparent)] p-3 text-sm">
      <p className="flex gap-2 text-ink">
        <Lightbulb size={16} aria-hidden className="mt-0.5 shrink-0 text-accent-ink" />
        <span>
          Elk vak is één speler. Elke toets is een versie van die speler. Je kiest welke versie er
          speelt.
        </span>
      </p>
      {example.length > 1 && (
        <p className="mt-2 flex flex-wrap items-center gap-1.5 pl-6 text-xs text-ink-2">
          <span className="font-semibold text-ink">{example[0]!.subjectName}:</span>
          {example.map((p) => {
            const card = api.cardById(p.id);
            return (
              <span key={p.id} className="rounded-full bg-glass-strong px-2 py-0.5 tabular-nums">
                {p.rating}
                {card ? ` ${versionLabel(card, p).split(" · ")[0]}` : ""}
              </span>
            );
          })}
          <span>… één ervan staat in je elftal.</span>
        </p>
      )}
      <div className="mt-2 pl-6">
        <Button size="sm" variant="glass" onClick={api.markIntroSeen}>
          Begrepen
        </Button>
      </div>
    </div>
  );
}

/**
 * De kiezer voor een plek, ontworpen zodat je je niet kunt vergissen:
 * - bovenaan wat er nu staat, met "Andere versie", "Naar de bank", "Aanvoerder
 *   maken" en "Haal weg";
 * - "Beschikbaar": vakken die nog niet meedoen, per vak één regel (de beste
 *   versie voor deze plek), de andere versies om uit te klappen;
 * - "Al in je selectie": per regel precies wat er gebeurt ("Wissel met …").
 * Wat niet mag (een vak twee keer), staat er niet tussen. Zonder plek (naast
 * het veld op een computer) is het een overzicht van al je spelers.
 */
export function PlayerPicker({
  api,
  target,
  draggable,
  onDone,
  onSelectSpot,
  className,
}: {
  api: SquadApi;
  target: Spot | null;
  /** Rijen naar het veld slepen (alleen met de muis, naast het veld). */
  draggable: boolean;
  /** Na een keuze: de kiezer dicht of terug naar het overzicht. */
  onDone: () => void;
  /** Klik op een speler in je selectie (in het overzicht zonder plek): kies zijn plek. */
  onSelectSpot?: (spot: Spot) => void;
  className?: string;
}) {
  const [group, setGroup] = useState<SubjectGroup | "">("");
  const [tier, setTier] = useState<CardTier | "">("");
  const [period, setPeriod] = useState("");
  const [naturalOnly, setNaturalOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());
  const [versionsOpen, setVersionsOpen] = useState(false);
  // De lijst naast het veld is een sleepdoel: een kaart erheen slepen = weghalen.
  const { setNodeRef: setDropRef } = useDroppable({
    id: draggable ? "lijst" : "lijst-keuze",
    disabled: !draggable,
  });

  const { lineup, players } = api;
  const targetLine = target ? lineOfSpot(lineup, target) : null;
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
    const groups = [...new Set([...players.values()].map((p) => p.group))];
    const periods = new Map<string, string>();
    for (const p of players.values()) {
      const card = api.cardById(p.id);
      if (p.period && card) periods.set(p.period, card.periodName ?? "Onbekend");
    }
    return { groups, periods: [...periods] };
  }, [players, api]);

  const passes = (p: SquadPlayer) => {
    if (group && p.group !== group) return false;
    if (tier && p.tier !== tier) return false;
    if (period && p.period !== period) return false;
    if (naturalOnly) {
      const lines = targetLine ? [targetLine] : [...openLines];
      if (!lines.some((line) => positionFit(p, line) === "natuurlijk")) return false;
    }
    return true;
  };

  const picked = useMemo(
    () => (target ? pickerOptions(lineup, target, players) : null),
    [lineup, target, players],
  );

  const position = (spot: Spot) => api.positionOf(spot);
  const where = (spot: Spot) =>
    spot.kind === "bank" ? "Op de bank" : `Staat op ${position(spot)}`;
  const occupantId = target ? cardAt(lineup, target) : null;
  const occupant = occupantId ? (players.get(occupantId) ?? null) : null;
  const targetName = target ? position(target) : "";

  /** Wat er gebeurt bij deze keuze, in woorden. */
  const actionOf = (
    option: PickOption,
  ): { text: string | null; tone: "plain" | "swap" | "warn" } => {
    const others = option.changes.filter((c) => c.kind === "bank" || c.kind === "collectie");
    switch (option.kind) {
      case "wisselen":
        return { text: `Wissel met ${occupant?.subjectName ?? "deze plek"}`, tone: "swap" };
      case "verplaatsen":
        return option.at?.kind === "veld"
          ? { text: `Hierheen · ${position(option.at)} wordt leeg`, tone: "warn" }
          : { text: "Van de bank hierheen", tone: "swap" };
      default: {
        const change = others[0];
        if (!change) return { text: null, tone: "plain" };
        const who = api.nameOf(change.cardId);
        return {
          text:
            change.kind === "bank"
              ? `${who} gaat naar de bank`
              : `${who} gaat terug naar je collectie`,
          tone: "plain",
        };
      }
    }
  };

  const pick = (option: PickOption) => {
    if (!target) return;
    api.move(option.source, target);
    onDone();
  };

  const row = (option: PickOption, title: string, detailOverride?: string) => {
    const card = api.cardById(option.player.id);
    if (!card) return null;
    const action = actionOf(option);
    const detail = detailOverride ?? versionLabel(card, option.player);
    return (
      <PickerRow
        key={option.player.id}
        card={card}
        player={option.player}
        title={title}
        detail={detail}
        action={action.text}
        actionTone={action.tone}
        chemistry={option.chemistry}
        effect={target?.kind === "veld" || option.at?.kind === "veld" ? option.effect : null}
        label={[
          `${title}, rating ${option.player.rating}`,
          detail,
          option.chemistry !== null ? `chemie hier ${option.chemistry}` : null,
          action.text,
          target?.kind === "veld" ? effectWords(option.effect) : null,
        ]
          .filter(Boolean)
          .join(". ")}
        dragId={draggable ? `lijst:${option.player.id}` : undefined}
        onPick={() => pick(option)}
      />
    );
  };

  const toggle = (vak: string) =>
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(vak)) next.delete(vak);
      else next.add(vak);
      return next;
    });

  const active = [group, tier, period, naturalOnly ? "ja" : ""].filter(Boolean).length;
  const filtersId = `${draggable ? "lijst" : "keuze"}-filters`;
  const filters = (
    <>
      <div className="mt-1 mb-1 flex items-center justify-between gap-2">
        <p className="text-xs text-ink-3">
          {api.vakkenInSquad.size} van {api.vakCount} vakken in je selectie
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
    </>
  );

  // ——— Zonder plek: overzicht van al je spelers (naast het veld op een computer) ———
  if (!target) {
    const byVak = new Map<string, SquadPlayer[]>();
    for (const p of players.values())
      if (!api.vakkenInSquad.has(p.vak) && passes(p))
        byVak.set(p.vak, [...(byVak.get(p.vak) ?? []), p]);
    const available = [...byVak.values()]
      .map((list) => [...list].sort((a, b) => b.rating - a.rating))
      .sort((a, b) => b[0]!.rating - a[0]!.rating);
    const selected = [...api.inSquad]
      .flatMap((id) => (players.has(id) ? [players.get(id)!] : []))
      .sort((a, b) => b.rating - a.rating);
    const place = (player: SquadPlayer) => {
      const spot = bestEmptySpot(lineup, player, api.vakOf);
      if (!spot) {
        toast({
          title: "Geen plek vrij",
          description: "Kies eerst een plek op het veld of de bank.",
          emoji: "🧤",
        });
        return;
      }
      api.move({ kind: "kaart", cardId: player.id }, spot);
    };
    return (
      <div ref={setDropRef} className={cn("flex min-h-0 flex-col", className)}>
        {filters}
        <div className="-mx-1 scroll-quiet min-h-0 flex-1 overflow-y-auto overscroll-contain px-1 pb-4">
          <SectionTitle count={available.length}>Beschikbaar</SectionTitle>
          {available.length === 0 ? (
            <p className="px-1 pb-2 text-sm text-ink-3">
              Al je vakken staan in je selectie. Elk vak is één speler.
            </p>
          ) : (
            <ul aria-label="Beschikbare spelers" className="space-y-0.5">
              {available.map(([best, ...others]) => {
                const card = api.cardById(best!.id);
                if (!card) return null;
                const expanded = open.has(best!.vak);
                return (
                  <li key={best!.vak}>
                    <PickerRow
                      card={card}
                      player={best!}
                      title={best!.subjectName}
                      detail={versionLabel(card, best!)}
                      action="Kies een plek, of sleep naar het veld"
                      chemistry={null}
                      effect={null}
                      label={`${best!.subjectName}, rating ${best!.rating}. ${versionLabel(card, best!)}. Zet op een vrije plek.`}
                      dragId={draggable ? `lijst:${best!.id}` : undefined}
                      onPick={() => place(best!)}
                    />
                    {others.length > 0 && (
                      <VersionToggle
                        count={others.length}
                        name={best!.subjectName}
                        expanded={expanded}
                        onToggle={() => toggle(best!.vak)}
                      />
                    )}
                    {expanded && (
                      <ul
                        className="ml-4 border-l border-line pl-2"
                        aria-label={`Andere versies van ${best!.subjectName}`}
                      >
                        {others.map((p) => {
                          const c = api.cardById(p.id);
                          return c ? (
                            <li key={p.id}>
                              <PickerRow
                                card={c}
                                player={p}
                                title={`${p.subjectName} ${p.rating}`}
                                detail={versionLabel(c, p)}
                                action={null}
                                chemistry={null}
                                effect={null}
                                label={`${p.subjectName}, rating ${p.rating}. ${versionLabel(c, p)}. Zet op een vrije plek.`}
                                dragId={draggable ? `lijst:${p.id}` : undefined}
                                onPick={() => place(p)}
                              />
                            </li>
                          ) : null;
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          <SectionTitle count={selected.length}>Al in je selectie</SectionTitle>
          <ul aria-label="Spelers in je selectie" className="space-y-0.5">
            {selected.map((p) => {
              const card = api.cardById(p.id);
              const spot = spotOf(lineup, p.id)!;
              return card ? (
                <li key={p.id}>
                  <PickerRow
                    card={card}
                    player={p}
                    title={p.subjectName}
                    detail={`${where(spot)} · ${versionLabel(card, p)}`}
                    action="Kies om deze plek te bekijken"
                    chemistry={null}
                    effect={null}
                    label={`${p.subjectName}, rating ${p.rating}. ${where(spot)}. Kies om deze plek te bekijken.`}
                    dragId={draggable ? `lijst:${p.id}` : undefined}
                    onPick={() => onSelectSpot?.(spot)}
                  />
                </li>
              ) : null;
            })}
          </ul>
        </div>
      </div>
    );
  }

  // ——— Met een plek: de kiezer ———
  const current = picked!.current;
  const available = picked!.available.filter((g) => passes(g.best.player));
  const selected = picked!.selected;
  const occupantCard = occupant ? api.cardById(occupant.id) : null;
  const occupantChemistry =
    target.kind === "veld"
      ? (api.evaluation.slots.find((s) => s.slot.id === target.slot)?.chemistry ?? null)
      : null;
  const benchFree = lineup.bench.includes(null);

  return (
    <div ref={setDropRef} className={cn("flex min-h-0 flex-col", className)}>
      {!api.introSeen && <Intro api={api} />}

      {current && occupantCard && (
        <section
          aria-label="Nu op deze plek"
          className="mb-2 rounded-2xl border border-line bg-glass p-3"
        >
          <p className="mb-2 text-xs font-semibold tracking-[0.12em] text-ink-3 uppercase">
            Nu op deze plek
          </p>
          <div className="flex items-center gap-3">
            <PlayerBadge card={occupantCard} chemistry={occupantChemistry} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-ink">
                {current.player.subjectName}{" "}
                <span className="sensitive font-card text-lg tabular-nums">
                  {current.player.rating}
                </span>
              </p>
              <p className="truncate text-xs text-ink-3">
                {versionLabel(occupantCard, current.player)}
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Button
              size="sm"
              variant="glass"
              icon={Layers}
              aria-expanded={versionsOpen}
              disabled={current.versions.length === 0}
              onClick={() => setVersionsOpen((v) => !v)}
            >
              {current.versions.length === 0
                ? "Geen andere versie"
                : `Andere versie van ${current.player.subjectName} (${current.versions.length})`}
            </Button>
            {target.kind === "veld" && (
              <>
                <Button
                  size="sm"
                  variant="glass"
                  icon={Armchair}
                  disabled={!benchFree}
                  onClick={() => {
                    api.toBench(target);
                    onDone();
                  }}
                >
                  {benchFree ? "Naar de bank" : "Bank is vol"}
                </Button>
                <Button
                  size="sm"
                  variant="glass"
                  icon={Crown}
                  onClick={() => {
                    api.toggleCaptain(current.player.id);
                    onDone();
                  }}
                >
                  {lineup.captain === current.player.id
                    ? "Geen aanvoerder meer"
                    : "Aanvoerder maken"}
                </Button>
              </>
            )}
            <Button
              size="sm"
              variant="ghost"
              icon={Undo2}
              onClick={() => {
                api.remove(target);
                onDone();
              }}
            >
              {target.kind === "veld" && benchFree
                ? "Haal weg (naar de bank)"
                : "Haal weg (naar je collectie)"}
            </Button>
          </div>
          {versionsOpen && current.versions.length > 0 && (
            <ul
              className="mt-2 border-t border-line pt-2"
              aria-label={`Andere versies van ${current.player.subjectName}`}
            >
              {current.versions.map((option) => (
                <li key={option.player.id}>
                  {row(option, `${option.player.subjectName} ${option.player.rating}`)}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {filters}

      <div className="-mx-1 scroll-quiet min-h-0 flex-1 overflow-y-auto overscroll-contain px-1 pb-4">
        <SectionTitle count={available.length}>Beschikbaar</SectionTitle>
        {available.length === 0 ? (
          <p className="px-1 pb-2 text-sm text-ink-3">
            {active > 0
              ? "Geen vakken met deze filters."
              : "Al je vakken staan in je selectie. Kies hieronder iemand om te wisselen."}
          </p>
        ) : (
          <ul aria-label="Beschikbare spelers" className="space-y-0.5">
            {available.map((g) => {
              const expanded = open.has(g.vak);
              return (
                <li key={g.vak}>
                  {row(g.best, g.best.player.subjectName)}
                  {g.others.length > 0 && (
                    <VersionToggle
                      count={g.others.length}
                      name={g.best.player.subjectName}
                      expanded={expanded}
                      onToggle={() => toggle(g.vak)}
                    />
                  )}
                  {expanded && (
                    <ul
                      className="ml-4 border-l border-line pl-2"
                      aria-label={`Andere versies van ${g.best.player.subjectName}`}
                    >
                      {g.others.map((option) => (
                        <li key={option.player.id}>
                          {row(option, `${option.player.subjectName} ${option.player.rating}`)}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <SectionTitle count={selected.length}>Al in je selectie</SectionTitle>
        {selected.length === 0 ? (
          <p className="px-1 text-sm text-ink-3">Nog niemand anders in je selectie.</p>
        ) : (
          <ul aria-label={`Spelers in je selectie, voor ${targetName}`} className="space-y-0.5">
            {selected.map((option) => {
              const card = api.cardById(option.player.id);
              return (
                <li key={option.player.id}>
                  {row(
                    option,
                    option.player.subjectName,
                    card
                      ? `${where(option.at!)} · ${versionLabel(card, option.player)}`
                      : undefined,
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function VersionToggle({
  count,
  name,
  expanded,
  onToggle,
}: {
  count: number;
  name: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-expanded={expanded}
      onClick={onToggle}
      className="ml-[3.25rem] flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-accent-ink hover:bg-glass"
    >
      <ChevronDown
        size={13}
        aria-hidden
        className={cn("transition-transform", expanded && "rotate-180")}
      />
      {expanded
        ? `Minder versies van ${name}`
        : `${count} ${count === 1 ? "andere versie" : "andere versies"} van ${name}`}
    </button>
  );
}
