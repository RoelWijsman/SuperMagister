"use client";

import { Pencil, Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import type { SquadEvaluation } from "@/lib/squad/chemistry";
import type { Club } from "@/lib/squad/club";
import { LINES, type Line } from "@/lib/squad/formations";
import { MAX_SQUADS, type SavedSquad } from "@/stores/squad";
import { AnimatedNumber } from "./AnimatedNumber";
import { Crest } from "./Crest";

const LINE_SHORT: Readonly<Record<Line, string>> = {
  aanval: "AAN",
  middenveld: "MID",
  verdediging: "VER",
  keeper: "KEE",
};

/** Bovenaan, zoals in FUT: de squad-rating groot linksboven, de chemie ernaast en per linie. */
export function SquadHeader({
  evaluation,
  club,
  onClub,
}: {
  evaluation: SquadEvaluation;
  club: Club;
  onClub: () => void;
}) {
  const chemistry = evaluation.chemistry;
  const tone =
    chemistry >= 70 ? "var(--sm-good)" : chemistry >= 40 ? "var(--sm-warn)" : "var(--sm-bad)";
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
      <div className="flex items-end gap-5">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-ink-3">RATING</p>
          <p className="sensitive font-card text-[3.6rem] leading-[0.85] text-ink tabular-nums">
            <AnimatedNumber value={evaluation.rating} />
          </p>
        </div>
        <div className="min-w-[7.5rem]">
          <p className="text-xs font-semibold tracking-[0.2em] text-ink-3">CHEMIE</p>
          <p className="font-card text-[2.4rem] leading-[0.9] text-ink tabular-nums">
            <AnimatedNumber value={chemistry} />
            <span className="text-lg text-ink-3">/100</span>
          </p>
          <span
            aria-hidden
            className="mt-1 block h-1.5 overflow-hidden rounded-full bg-glass-strong"
          >
            <span
              className="block h-full rounded-full transition-[width,background-color] duration-500"
              style={{ width: `${chemistry}%`, background: tone }}
            />
          </span>
        </div>
      </div>
      <ul className="flex flex-wrap gap-1.5" aria-label="Rating per linie">
        {LINES.map((line) => {
          const rating = evaluation.lineRatings[line];
          return (
            <li
              key={line}
              className="flex items-baseline gap-1.5 rounded-full glass px-3 py-1"
              title={line}
            >
              <span className="text-[0.7rem] font-semibold tracking-wider text-ink-3">
                {LINE_SHORT[line]}
              </span>
              <span className="sensitive font-card text-lg leading-none text-ink tabular-nums">
                {rating ?? "–"}
              </span>
              <span className="sr-only">{line}</span>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        onClick={onClub}
        className="ml-auto flex items-center gap-2.5 rounded-2xl px-2 py-1 text-left transition-colors hover:bg-glass"
        aria-label={`Club: ${club.name}. Aanpassen`}
      >
        <Crest name={club.name} shape={club.crest} size={34} />
        <span className="max-w-[11rem] truncate font-display font-semibold text-ink">
          {club.name}
        </span>
      </button>
    </div>
  );
}

/** Je drie bewaarde elftallen, met een eigen naam. */
export function SquadsBar({
  squads,
  activeId,
  onSelect,
  onAdd,
  onEdit,
}: {
  squads: readonly SavedSquad[];
  activeId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onEdit: (squad: SavedSquad) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Je elftallen">
      {squads.map((squad) => {
        const active = squad.id === activeId;
        return (
          <span key={squad.id} className="flex items-center">
            <button
              type="button"
              aria-pressed={active}
              onClick={() => (active ? onEdit(squad) : onSelect(squad.id))}
              className={cn(
                "flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold transition-colors",
                active
                  ? "bg-[color-mix(in_oklab,var(--sm-accent)_22%,transparent)] text-ink shadow-[inset_0_0_0_1.5px_var(--sm-accent)]"
                  : "glass text-ink-2 hover:text-ink",
              )}
            >
              {squad.name}
              {active && <Pencil size={13} aria-label="hernoemen" />}
            </button>
          </span>
        );
      })}
      {squads.length < MAX_SQUADS && (
        <button
          type="button"
          onClick={onAdd}
          className="flex h-9 items-center gap-1 rounded-full border border-dashed border-line-strong px-3 text-sm font-medium text-ink-2 hover:text-ink"
        >
          <Plus size={15} aria-hidden /> Nieuw elftal
        </button>
      )}
    </div>
  );
}
