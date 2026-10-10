"use client";

import {
  ChevronDown,
  CircleHelp,
  Clapperboard,
  Copy,
  Eraser,
  Image as ImageIcon,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Trophy,
  Undo2,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Menu, type MenuItem } from "@/components/ui/Menu";
import { cn } from "@/lib/cn";
import type { SquadEvaluation } from "@/lib/squad/chemistry";
import type { Club } from "@/lib/squad/club";
import { FORMATION_IDS, LINE_LABELS, LINES, type FormationId } from "@/lib/squad/formations";
import { MAX_SQUADS, type SavedSquad } from "@/stores/squad";
import { AnimatedNumber } from "./AnimatedNumber";
import { Crest } from "./Crest";

export interface ToolbarActions {
  onClub: () => void;
  onSelectSquad: (id: string) => void;
  onAddSquad: (copy: boolean) => void;
  onRenameSquad: () => void;
  onRemoveSquad: () => void;
  onFormation: (formation: FormationId) => void;
  onBuild: () => void;
  onMatch: () => void;
  onShare: (mode: "afbeelding" | "video") => void;
  onHelp: () => void;
  onClear: () => void;
  /** De laatste stap terugzetten; undefined als er niets terug te zetten is. */
  onUndo?: () => void;
}

/**
 * De balk boven het veld: je club (naam en wapen) met de naam van deze
 * opstelling eronder, de formatie, één hoofdknop en een menu met de rest.
 * "FC Herkansing" is je club, "Mijn elftal" is een van je drie opstellingen.
 */
export function SquadToolbar({
  club,
  squads,
  activeId,
  formation,
  actions,
}: {
  club: Club;
  squads: readonly SavedSquad[];
  activeId: string;
  formation: FormationId;
  actions: ToolbarActions;
}) {
  const active = squads.find((s) => s.id === activeId);
  const squadItems: MenuItem[] = [
    ...squads.map((squad) => ({
      label: squad.name,
      checked: squad.id === activeId,
      onSelect: () => actions.onSelectSquad(squad.id),
    })),
    {
      label: "Naam wijzigen",
      icon: Pencil,
      onSelect: actions.onRenameSquad,
      separated: true,
    },
    ...(squads.length < MAX_SQUADS
      ? [
          { label: "Nieuwe opstelling", icon: Plus, onSelect: () => actions.onAddSquad(false) },
          {
            label: "Kopie van deze opstelling",
            icon: Copy,
            onSelect: () => actions.onAddSquad(true),
          },
        ]
      : []),
    ...(squads.length > 1
      ? [{ label: "Deze opstelling verwijderen", icon: Trash2, onSelect: actions.onRemoveSquad }]
      : []),
  ];
  const moreItems: MenuItem[] = [
    { label: "Oefenwedstrijd", icon: Trophy, onSelect: actions.onMatch },
    {
      label: "Delen als afbeelding",
      icon: ImageIcon,
      onSelect: () => actions.onShare("afbeelding"),
    },
    { label: "Delen als video", icon: Clapperboard, onSelect: () => actions.onShare("video") },
    { label: "Hoe werkt chemie?", icon: CircleHelp, onSelect: actions.onHelp, separated: true },
    { label: "Leegmaken", icon: Eraser, onSelect: actions.onClear },
  ];

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2.5">
      <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:basis-56">
        {/* Het wapen is ook aanklikbaar, maar voor toetsenbord en schermlezer is de naam de knop. */}
        <button
          type="button"
          onClick={actions.onClub}
          aria-hidden
          tabIndex={-1}
          className="shrink-0 rounded-xl p-0.5 transition-transform hover:scale-105"
        >
          <Crest name={club.name} shape={club.crest} size={38} />
        </button>
        <div className="min-w-0">
          <button
            type="button"
            onClick={actions.onClub}
            aria-label={`Club: ${club.name}. Naam en wapen aanpassen`}
            className="group flex max-w-full items-center gap-1.5 rounded-lg text-left"
          >
            <span className="truncate font-display text-[1.05rem] leading-tight font-semibold text-ink">
              {club.name}
            </span>
            <Pencil
              size={13}
              aria-hidden
              className="shrink-0 text-ink-3 transition-colors group-hover:text-ink"
            />
          </button>
          <Menu
            label={`Opstelling: ${active?.name ?? "Mijn elftal"}. Wisselen of aanpassen`}
            items={squadItems}
            align="start"
            buttonClassName="flex max-w-full items-center gap-1 rounded-lg text-left text-sm text-ink-2 hover:text-ink"
          >
            <span className="shrink-0 text-ink-3">Opstelling:</span>
            <span className="truncate font-medium">{active?.name ?? "Mijn elftal"}</span>
            <ChevronDown size={14} aria-hidden className="shrink-0" />
          </Menu>
        </div>
      </div>

      {/* Op een telefoon staat de formatie naast de clubnaam en de knoppen op een eigen regel. */}
      <label className="relative shrink-0 sm:order-last sm:hidden">
        <span className="sr-only">Formatie</span>
        <select
          id="elftal-formatie-klein"
          value={formation}
          onChange={(event) => actions.onFormation(event.target.value as FormationId)}
          className="h-9 cursor-pointer appearance-none rounded-full glass pr-8 pl-3.5 font-card text-lg tracking-wider text-ink outline-offset-2"
        >
          {FORMATION_IDS.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
        <ChevronDown
          size={15}
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-ink-3"
        />
      </label>
      <div className="flex w-full items-center gap-2 sm:w-auto sm:shrink-0">
        <label className="relative max-sm:hidden">
          <span className="sr-only">Formatie</span>
          <select
            id="elftal-formatie"
            value={formation}
            onChange={(event) => actions.onFormation(event.target.value as FormationId)}
            className="h-9 cursor-pointer appearance-none rounded-full glass pr-8 pl-3.5 font-card text-lg tracking-wider text-ink outline-offset-2"
          >
            {FORMATION_IDS.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
          <ChevronDown
            size={15}
            aria-hidden
            className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-ink-3"
          />
        </label>
        <Button
          variant="glass"
          size="icon-sm"
          icon={Undo2}
          aria-label="Ongedaan maken (Ctrl+Z)"
          title="Ongedaan maken (Ctrl+Z)"
          disabled={!actions.onUndo}
          onClick={() => actions.onUndo?.()}
        />
        <Button
          variant="primary"
          size="sm"
          icon={Wand2}
          onClick={actions.onBuild}
          className="max-sm:flex-1"
        >
          Bouw beste elftal
        </Button>
        <Menu
          label="Meer"
          items={moreItems}
          buttonClassName="inline-flex h-9 items-center gap-1.5 rounded-full glass px-3 text-sm font-medium text-ink hover:bg-glass-hover"
        >
          <MoreHorizontal size={16} aria-hidden />
          <span className="max-[380px]:sr-only">Meer</span>
        </Menu>
      </div>
    </div>
  );
}

/**
 * Squad-rating, teamchemie en de rating per linie, klein en op één plek. Groot
 * linksboven, zoals in FUT. Een lege linie krijgt een rustig streepje.
 */
export function SquadStats({
  evaluation,
  stacked = false,
  className,
}: {
  evaluation: SquadEvaluation;
  /** Linies onder de getallen in plaats van ernaast (in de smalle kolom naast het veld). */
  stacked?: boolean;
  className?: string;
}) {
  const chemistry = evaluation.chemistry;
  const tone =
    chemistry >= 70 ? "var(--sm-good)" : chemistry >= 40 ? "var(--sm-warn)" : "var(--sm-bad)";
  return (
    <div className={cn("flex gap-x-5 gap-y-3", stacked ? "flex-col" : "items-center", className)}>
      <div className="flex shrink-0 items-end gap-4">
        {evaluation.complete ? (
          <div>
            <p className="text-[0.65rem] font-semibold tracking-[0.2em] text-ink-3">RATING</p>
            <p className="sensitive font-card text-[2.6rem] leading-[0.85] text-ink tabular-nums">
              <AnimatedNumber value={evaluation.rating} />
            </p>
          </div>
        ) : (
          // Nooit een rating die hoger is door een gat: eerst het elftal vol.
          <div className="max-w-[6.5rem]">
            <p className="text-[0.65rem] font-semibold tracking-[0.2em] text-ink-3">RATING</p>
            <p className="font-card text-[1.35rem] leading-[1.05] text-warn">
              Niet compleet
            </p>
            <p className="text-xs font-semibold text-ink-2 tabular-nums">
              {evaluation.placed}/{evaluation.formation.slots.length} spelers
            </p>
          </div>
        )}
        <div className="min-w-[5.5rem]">
          <p className="text-[0.65rem] font-semibold tracking-[0.2em] text-ink-3">CHEMIE</p>
          <p className="font-card text-[2rem] leading-[0.9] text-ink tabular-nums">
            <AnimatedNumber value={chemistry} />
            <span className="text-base text-ink-3">/100</span>
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
      <dl
        aria-label="Rating per linie"
        className={cn(
          "grid min-w-0 flex-1 gap-x-4",
          stacked
            ? "grid-cols-2 gap-y-1 border-t border-line pt-3 text-sm"
            : "grid-cols-1 gap-y-0.5 text-xs sm:grid-cols-2 sm:gap-y-1 sm:text-sm",
        )}
      >
        {LINES.map((line) => {
          const rating = evaluation.lineRatings[line];
          const fill = evaluation.lineFill[line];
          return (
            <div key={line} className="flex items-baseline justify-between gap-2">
              <dt className="truncate text-ink-3">{LINE_LABELS[line]}</dt>
              <dd className="sensitive font-semibold text-ink tabular-nums">
                {rating ??
                  (fill.placed > 0 ? (
                    <span
                      className="font-normal text-warn"
                      aria-label={`${fill.placed} van ${fill.total}, nog niet compleet`}
                    >
                      {fill.placed}/{fill.total}
                    </span>
                  ) : (
                    <span className="font-normal text-ink-3" aria-label="leeg">
                      —
                    </span>
                  ))}
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
