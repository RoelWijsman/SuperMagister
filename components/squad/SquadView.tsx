"use client";

import {
  DndContext,
  DragOverlay,
  MouseSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Sparkles, Wand2, X } from "lucide-react";
import { useEffect, useId, useState, type KeyboardEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Sheet } from "@/components/ui/Sheet";
import type { CopyKey } from "@/content/copy";
import { useMediaQuery } from "@/lib/hooks";
import { track } from "@/lib/stats/client";
import type { BuildResult } from "@/lib/squad/build";
import { evaluateSquad, inPosition, type SquadEvaluation } from "@/lib/squad/chemistry";
import { FORMATIONS, LINE_LABELS, POSITION_NAMES, type FormationId } from "@/lib/squad/formations";
import {
  applyMove,
  cardAt,
  parseSpotKey,
  sameSpot,
  spotKey,
  type MovePlan,
  type Source,
  type Spot,
} from "@/lib/squad/lineup";
import type { MoveAdvice, MoveEffect } from "@/lib/squad/suggest";
import { cn } from "@/lib/cn";
import { useCopy, useCopyParts } from "@/lib/use-copy";
import type { SavedSquad } from "@/stores/squad";
import { toast, useToasts } from "@/stores/toast";
import { Bench } from "./Bench";
import { ChemistryHelp } from "./ChemistryHelp";
import { ClubSheet } from "./ClubSheet";
import { MatchSheet } from "./MatchSheet";
import { Pitch, type DropHint } from "./Pitch";
import { PlayerPicker } from "./PlayerPicker";
import { SquadCard } from "./SquadCard";
import { SquadShareSheet } from "./SquadShareSheet";
import { SquadStats, SquadToolbar } from "./SquadHeader";
import { usePitchSize } from "./usePitchSize";
import { STEP_TOAST, useSquad, type SquadApi } from "./useSquad";

function spotName(api: SquadApi, spot: Spot): string {
  if (spot.kind === "bank") return `bank ${spot.index + 1}`;
  const slot = api.evaluation.formation.slots.find((s) => s.id === spot.slot);
  return slot ? POSITION_NAMES[slot.position].toLowerCase() : "plek";
}

const signed = (value: number) => (value > 0 ? `+${value}` : `−${Math.abs(value)}`);

/** "+4 chemie, −1 rating", alleen wat verandert. */
function effectLabel(effect: MoveEffect): string {
  return [
    effect.chemistry ? `${signed(effect.chemistry)} chemie` : null,
    effect.rating ? `${signed(effect.rating)} rating` : null,
  ]
    .filter(Boolean)
    .join(", ");
}

/** Wie er uit positie staat, en in welke linie. */
function outOfPosition(evaluation: SquadEvaluation): string[] {
  return evaluation.slots
    .filter((s) => s.player && !inPosition(s.fit))
    .map((s) => `${s.player!.subjectName} (${LINE_LABELS[s.line].toLowerCase()})`);
}

/** De tekst van een tip-zet: welke sleutel en welke vakken. */
function moveCopy(api: SquadApi, advice: MoveAdvice): { key: CopyKey; vak: string; vak2: string } {
  const name = (id: string | null | undefined) =>
    (id ? api.players.get(id)?.subjectName : null) ?? "een lege plek";
  const { move } = advice;
  if (move.kind === "wissel")
    return {
      key: "elftal.tip.wissel",
      vak: name(api.lineup.slots[move.a]),
      vak2: name(api.lineup.slots[move.b]),
    };
  const keeper =
    FORMATIONS[api.lineup.formation].slots.find((s) => s.id === move.slot)?.position === "K";
  return {
    key: keeper ? "elftal.tip.keeper" : "elftal.tip.vervang",
    vak: name(move.cardId),
    vak2: name(move.replaces),
  };
}

/** De tip: een zet die echt kan en echt beter is, met een knop om hem te doen. */
function Tip({ api, onApply }: { api: SquadApi; onApply: (advice: MoveAdvice) => void }) {
  const { tip } = api.analysis;
  const move = tip.kind === "zet" ? moveCopy(api, tip.advice) : null;
  const key: CopyKey = move ? move.key : `elftal.tip.${tip.kind as "leeg" | "aanvoerder" | "top"}`;
  const text = useCopy(key, {
    aantal: tip.kind === "leeg" ? (tip.open === 1 ? "1 plek" : `${tip.open} plekken`) : "",
    vak: move?.vak ?? "",
    vak2: move?.vak2 ?? "",
  });
  if (!text) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <p className="min-w-0 flex-1 basis-48 text-sm text-ink-2">
        {text}
        {tip.kind === "zet" && (
          <span className="ml-1 font-semibold whitespace-nowrap text-good">
            ({effectLabel(tip.advice.effect)})
          </span>
        )}
      </p>
      {tip.kind === "zet" && (
        <Button size="sm" variant="glass" icon={Sparkles} onClick={() => onApply(tip.advice)}>
          Doen
        </Button>
      )}
    </div>
  );
}

/** De analyse: sterkste en zwakste linie, en de tip. */
function Analysis({ api, onApply }: { api: SquadApi; onApply: (advice: MoveAdvice) => void }) {
  const { strongest, weakest } = api.analysis;
  const strong = useCopy(strongest ? "elftal.sterk" : null, {
    linie: strongest ? LINE_LABELS[strongest.line].toLowerCase() : "",
    vak: strongest?.subject ?? "",
  });
  const weak = useCopy(weakest ? "elftal.zwak" : null, {
    linie: weakest ? LINE_LABELS[weakest.line].toLowerCase() : "",
    vak: weakest?.subject ?? "",
  });
  return (
    <GlassPanel as="section" aria-labelledby="analyse-titel" padding="md">
      <h3 id="analyse-titel" className="mb-2 font-display font-semibold text-ink">
        Analyse
      </h3>
      <dl className="space-y-2 text-sm">
        {(
          [
            ["Sterkst", strong],
            ["Zwakst", weak],
          ] as const
        ).map(([label, text]) =>
          text ? (
            <div key={label} className="grid grid-cols-[4.5rem_1fr] gap-2">
              <dt className="font-semibold text-ink-3">{label}</dt>
              <dd className="text-ink-2">{text}</dd>
            </div>
          ) : null,
        )}
        <div className="grid grid-cols-[4.5rem_1fr] gap-2">
          <dt className="pt-0.5 font-semibold text-ink-3">Tip</dt>
          <dd>
            <Tip api={api} onApply={onApply} />
          </dd>
        </div>
      </dl>
    </GlassPanel>
  );
}

type Note =
  | { kind: "gebouwd"; result: BuildResult }
  | { kind: "formatie"; formation: FormationId; before: number };

/** Wat er net gebeurde: het beste elftal, of een nieuwe formatie. Met een vervolgknop. */
function NoteCard({
  note,
  api,
  bare = false,
  onBuild,
  onClose,
}: {
  note: Note;
  api: SquadApi;
  /** Zonder eigen paneel (in het paneel met de statistieken). */
  bare?: boolean;
  onBuild: (formation: FormationId) => void;
  onClose: () => void;
}) {
  const out = outOfPosition(api.evaluation);
  const outText =
    out.length > 0
      ? `${out.join(" en ")} ${out.length === 1 ? "staat" : "staan"} uit positie: met deze kaarten past het niet anders.`
      : null;

  let body: ReactNode;
  if (note.kind === "gebouwd") {
    const { evaluation, ratingOnly, betterFormation } = note.result;
    const givenUp = ratingOnly.rating - evaluation.rating;
    const gained = evaluation.chemistry - ratingOnly.chemistry;
    body = (
      <>
        <p>
          {givenUp > 0 && gained > 0
            ? `${gained} chemie erbij voor ${givenUp} rating, vergeleken met alleen de hoogste ratings.`
            : gained > 0
              ? `${gained} chemie erbij, zonder rating in te leveren.`
              : "Rating en chemie wezen hier dezelfde kant op."}
        </p>
        {outText && <p className="mt-1.5">{outText}</p>}
        {betterFormation && (
          <p className="mt-2">
            In {betterFormation.formation} kom je op rating{" "}
            <span className="sensitive">{betterFormation.rating}</span> en chemie{" "}
            {betterFormation.chemistry}.{" "}
            <button
              type="button"
              onClick={() => onBuild(betterFormation.formation)}
              className="font-semibold text-accent-ink underline-offset-2 hover:underline"
            >
              Probeer {betterFormation.formation}
            </button>
          </p>
        )}
      </>
    );
  } else {
    const now = api.evaluation.chemistry;
    body = (
      <>
        <p>
          Dezelfde elf, ieder in zijn eigen linie waar het kan. Chemie {note.before} → {now}.
        </p>
        {outText && <p className="mt-1.5">{outText}</p>}
        <Button
          size="sm"
          variant="glass"
          icon={Wand2}
          className="mt-2.5"
          onClick={() => onBuild(api.lineup.formation)}
        >
          Opnieuw beste elftal voor {api.lineup.formation}
        </Button>
      </>
    );
  }

  const content = (
    <>
      <button
        type="button"
        onClick={onClose}
        aria-label="Sluiten"
        className={cn(
          "absolute rounded-full p-1.5 text-ink-3 hover:text-ink",
          bare ? "-top-1.5 -right-1.5" : "top-2 right-2",
        )}
      >
        <X size={16} aria-hidden />
      </button>
      <p className="pr-7 font-semibold text-ink">
        {/* De bevestiging zelf staat onderaan in de melding (met Ongedaan maken); hier de uitleg. */}
        {note.kind === "gebouwd" ? "Zo is er gekozen" : `Formatie ${note.formation}`}
      </p>
      <div className="mt-1">{body}</div>
    </>
  );
  return bare ? (
    <div className="relative mt-3 border-t border-line pt-3 text-sm text-ink-2" role="status">
      {content}
    </div>
  ) : (
    <GlassPanel padding="md" className="relative text-sm text-ink-2" role="status">
      {content}
    </GlassPanel>
  );
}

function RenameSheet({
  squad,
  onClose,
  onRename,
}: {
  squad: SavedSquad | null;
  onClose: () => void;
  onRename: (name: string) => void;
}) {
  const [name, setName] = useState(squad?.name ?? "");
  const id = useId();
  return (
    <Sheet open={squad !== null} onClose={onClose} title="Naam van deze opstelling" size="sm">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onRename(name);
          onClose();
        }}
        className="space-y-4"
      >
        <div>
          <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
            Naam
          </label>
          <input
            id={id}
            value={name}
            maxLength={24}
            onChange={(event) => setName(event.target.value)}
            placeholder="Bijv. Chaos XI"
            className="h-11 w-full rounded-xl border border-line-strong bg-glass-strong px-3.5 text-ink outline-none focus-visible:ring-2 focus-visible:ring-[var(--sm-accent)]"
          />
        </div>
        <Button type="submit" variant="primary" className="w-full">
          Opslaan
        </Button>
      </form>
    </Sheet>
  );
}

/** Pijltjes: naar de dichtstbijzijnde plek in die richting (veld en bank). */
function moveFocus(event: KeyboardEvent<HTMLDivElement>) {
  const directions: Record<string, [number, number]> = {
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0],
  };
  const direction = directions[event.key];
  const current = (event.target as HTMLElement).closest<HTMLElement>("[data-spot]");
  if (!direction || !current) return;
  const center = (el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  };
  const from = center(current);
  let best: HTMLElement | null = null;
  let bestScore = Infinity;
  for (const el of event.currentTarget.querySelectorAll<HTMLElement>("[data-spot]")) {
    if (el === current) continue;
    const to = center(el);
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const along = dx * direction[0] + dy * direction[1];
    if (along <= 4) continue;
    const across = Math.abs(dx * direction[1]) + Math.abs(dy * direction[0]);
    const score = along + across * 2;
    if (score < bestScore) {
      bestScore = score;
      best = el;
    }
  }
  if (best) {
    event.preventDefault();
    best.focus();
  }
}

const dismissToast = (id: string) => useToasts.getState().dismiss(id);

/** Welke plekken er zijn (veld en bank), voor de hints tijdens het slepen. */
function allSpots(api: SquadApi): Spot[] {
  return [
    ...api.evaluation.formation.slots.map((s): Spot => ({ kind: "veld", slot: s.id })),
    ...api.lineup.bench.map((_, index): Spot => ({ kind: "bank", index })),
  ];
}

/** Of de toets in een tekstveld wordt getypt (dan is Ctrl+Z van het tekstveld). */
function typing(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return !!el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));
}

/** Jouw Elftal: de squad builder van de collectie. */
export function SquadView() {
  const api = useSquad();
  const wide = useMediaQuery("(min-width: 1024px)");
  const mouse = useMediaQuery("(pointer: fine)");
  const dndId = useId();
  const sensors = useSensors(useSensor(MouseSensor, { activationConstraint: { distance: 6 } }));
  // Vanaf een tablet past het hele veld in de hoogte van het scherm; op een telefoon is het zo breed als de pagina.
  const fitHeight = useMediaQuery("(min-width: 640px)");
  const { ref: pitchRef, size: pitchSize, cardWidth } = usePitchSize(fitHeight);

  /** Op een computer: de plek waarvoor de kiezer naast het veld openstaat. */
  const [selected, setSelected] = useState<Spot | null>(null);
  /** Op een telefoon of tablet: de plek waarvoor de kiezer als blad openstaat. */
  const [picker, setPicker] = useState<Spot | null>(null);
  const [dragging, setDragging] = useState<{
    key: string;
    cardId: string;
    hints: ReadonlyMap<string, DropHint>;
  } | null>(null);
  const [note, setNote] = useState<Note | null>(null);
  const [help, setHelp] = useState(false);
  const [clubOpen, setClubOpen] = useState(false);
  const [renaming, setRenaming] = useState<SavedSquad | null>(null);
  const [share, setShare] = useState<"afbeelding" | "video" | null>(null);
  const [match, setMatch] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const empty = useCopyParts(!api.isLoading && api.players.size === 0 ? "elftal.leeg" : null);

  const { evaluation, lineup } = api;

  useEffect(() => track("elftal-geopend"), []);

  // Rating en chemie voor schermlezers, zodra ze veranderen.
  useEffect(() => {
    const id = setTimeout(
      () =>
        setAnnouncement(
          evaluation.complete
            ? `Rating ${evaluation.rating}, chemie ${evaluation.chemistry}.`
            : `Elftal niet compleet, ${evaluation.placed} van de 11. Chemie ${evaluation.chemistry}.`,
        ),
      400,
    );
    return () => clearTimeout(id);
  }, [evaluation.rating, evaluation.chemistry, evaluation.complete, evaluation.placed]);

  // Escape laat de gekozen plek los; Ctrl+Z (of ⌘Z) zet de laatste stap terug.
  const { undo } = api;
  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
      const z = event.key === "z" || event.key === "Z";
      if (z && (event.ctrlKey || event.metaKey) && !event.shiftKey && !typing(event.target)) {
        if (undo()) {
          event.preventDefault();
          setAnnouncement("Laatste stap ongedaan gemaakt.");
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo]);

  /** Een zet die niet mag: zeg waarom, en wat wel kan. */
  const refuse = (plan: MovePlan, cardId: string | null) => {
    if (plan.ok || plan.reason !== "vak-staat-al") return;
    const player = cardId ? api.players.get(cardId) : undefined;
    const where = api.positionOf(plan.at);
    toast({
      tone: "warning",
      emoji: "✋",
      title: `${player?.subjectName ?? "Dit vak"} staat al op ${where}`,
      description:
        "Elk vak is één speler. Kies op die plek een andere versie, of wissel die speler hierheen.",
    });
    setAnnouncement(`Kan niet: ${player?.subjectName ?? "dit vak"} staat al op ${where}.`);
  };

  /** Tikken, klikken of Enter op een plek: de kiezer voor die plek. */
  const activate = (spot: Spot) => {
    // De melding van de vorige stap mag de kiezer niet bedekken (terugzetten kan nog met de knop of Ctrl+Z).
    dismissToast(STEP_TOAST);
    if (wide) setSelected((current) => (current && sameSpot(current, spot) ? null : spot));
    else setPicker(spot);
  };

  const onDragStart = ({ active }: DragStartEvent) => {
    const fromSpot = active.data.current?.spot as Spot | undefined;
    const cardId = fromSpot
      ? cardAt(lineup, fromSpot)
      : (active.data.current?.cardId as string | undefined);
    if (!cardId) return;
    const source: Source = fromSpot ? { kind: "plek", spot: fromSpot } : { kind: "kaart", cardId };
    // Voor elke plek: wat er gebeurt en wat het met de chemie doet.
    const hints = new Map<string, DropHint>();
    for (const spot of allSpots(api)) {
      const plan = api.plan(source, spot);
      if (!plan.ok) {
        if (plan.reason === "vak-staat-al")
          hints.set(spotKey(spot), { kind: "kan-niet", chemistry: null });
        continue;
      }
      const result = applyMove(lineup, source, spot, api.vakOf);
      const chemistry = result
        ? evaluateSquad(result.lineup, api.players).chemistry - evaluation.chemistry
        : null;
      hints.set(spotKey(spot), {
        kind: plan.kind === "wisselen" ? "wisselen" : "plaatsen",
        chemistry,
      });
    }
    setDragging({ key: fromSpot ? spotKey(fromSpot) : String(active.id), cardId, hints });
    setSelected(null);
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setDragging(null);
    if (!over) return;
    const fromSpot = active.data.current?.spot as Spot | undefined;
    const cardId = active.data.current?.cardId as string | undefined;
    if (over.id === "lijst") {
      if (fromSpot) api.toCollection(fromSpot);
      return;
    }
    const target = parseSpotKey(String(over.id));
    if (!target) return;
    const source: Source | null = fromSpot
      ? { kind: "plek", spot: fromSpot }
      : cardId
        ? { kind: "kaart", cardId }
        : null;
    if (!source) return;
    const plan = api.move(source, target);
    if (!plan.ok) refuse(plan, cardId ?? (fromSpot ? cardAt(lineup, fromSpot) : null));
    else setNote(null);
  };

  const announcements: Announcements = {
    onDragStart: ({ active }) => {
      const spot = active.data.current?.spot as Spot | undefined;
      return `${api.nameOf(spot ? cardAt(lineup, spot) : (active.data.current?.cardId as string))} opgepakt.`;
    },
    onDragOver: ({ over }) => {
      const spot = over ? parseSpotKey(String(over.id)) : null;
      if (!spot)
        return over ? "Boven de lijst: loslaten zet hem terug in je collectie." : "Nergens boven.";
      const hint = dragging?.hints.get(spotKey(spot));
      return `Boven ${spotName(api, spot)}: ${
        !hint ? "hier staat hij al" : hint.kind === "kan-niet" ? "kan niet" : hint.kind
      }.`;
    },
    onDragEnd: () => "",
    onDragCancel: () => "Slepen afgebroken.",
  };

  const build = (formation?: FormationId) => {
    const result = api.build(formation);
    track("elftal-gebouwd");
    setNote({ kind: "gebouwd", result });
    setSelected(null);
  };

  if (api.isLoading) return null;

  if (api.players.size === 0) {
    return (
      <GlassPanel padding="lg">
        <EmptyState illustration="kaarten" title={empty?.title ?? ""} description={empty?.body} />
      </GlassPanel>
    );
  }

  const activeSquad = api.squads.find((s) => s.id === api.activeId) ?? null;
  const dragCard = dragging ? api.cardById(dragging.cardId) : null;
  const pickerTitle = (spot: Spot) =>
    spot.kind === "bank"
      ? `Kies voor bank ${spot.index + 1}`
      : `Kies voor ${spotName(api, spot)} (${api.positionOf(spot)})`;

  const toolbar = (
    <SquadToolbar
      club={api.club}
      squads={api.squads}
      activeId={api.activeId}
      formation={lineup.formation}
      actions={{
        onClub: () => setClubOpen(true),
        onSelectSquad: (id) => {
          api.setActive(id);
          setSelected(null);
          setNote(null);
        },
        onAddSquad: (copy) => {
          api.addSquad(copy);
          setNote(null);
        },
        onRenameSquad: () => setRenaming(activeSquad),
        onRemoveSquad: () => {
          if (activeSquad) api.removeSquad(activeSquad.id);
          setNote(null);
        },
        onFormation: (formation) => {
          const before = evaluation.chemistry;
          api.setFormation(formation);
          setSelected(null);
          setNote({ kind: "formatie", formation, before });
        },
        onBuild: () => build(),
        onMatch: () => setMatch(true),
        onShare: setShare,
        onHelp: () => setHelp(true),
        onClear: () => {
          api.clear();
          setSelected(null);
          setNote(null);
        },
        onUndo: api.canUndo ? () => void api.undo() : undefined,
      }}
    />
  );

  const noteCard = (bare: boolean) =>
    note && (
      <NoteCard
        note={note}
        api={api}
        bare={bare}
        onBuild={(formation) => build(formation)}
        onClose={() => setNote(null)}
      />
    );

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setDragging(null)}
      accessibility={{
        announcements,
        screenReaderInstructions: {
          draggable:
            "Sleep met de muis naar een plek. Met het toetsenbord: pijltjes om tussen plekken te gaan, Enter om de kiezer voor die plek te openen.",
        },
      }}
    >
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
      <div className="space-y-4">
        {/* Boven de rest, zodat de uitklapmenu's over het veld en de kaarten vallen. */}
        <GlassPanel padding="sm" className="relative z-10 px-4 py-3">
          {toolbar}
          {!wide && (
            <SquadStats evaluation={evaluation} className="mt-3 border-t border-line pt-3" />
          )}
        </GlassPanel>

        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,340px)]">
          <div className="min-w-0 space-y-4" onKeyDown={moveFocus}>
            <div ref={pitchRef} className="w-full">
              {pitchSize && (
                <Pitch
                  evaluation={evaluation}
                  cardById={api.cardById}
                  size={pitchSize}
                  cardWidth={cardWidth}
                  selected={wide ? selected : picker}
                  draggingKey={dragging?.key ?? null}
                  hints={dragging?.hints ?? null}
                  onActivate={activate}
                />
              )}
            </div>

            {!wide && noteCard(false)}

            <GlassPanel padding="md">
              <Bench
                bench={lineup.bench}
                cardById={api.cardById}
                players={api.players}
                selected={wide ? selected : picker}
                draggingKey={dragging?.key ?? null}
                hints={dragging?.hints ?? null}
                allPlaying={api.vakkenInSquad.size >= api.vakCount}
                onActivate={activate}
              />
            </GlassPanel>

            <Analysis api={api} onApply={(advice) => api.applyAdvice(advice)} />
          </div>

          {wide && (
            <aside
              className="flex flex-col gap-3"
              style={{ height: pitchSize?.height }}
              aria-label="Statistieken en spelers"
            >
              <GlassPanel padding="md" className="max-h-[55%] shrink-0 overflow-y-auto">
                <SquadStats evaluation={evaluation} stacked />
                {/* Tijdens het kiezen krijgt de lijst de ruimte. */}
                {!selected && noteCard(true)}
              </GlassPanel>
              <GlassPanel
                padding="md"
                aria-labelledby="kaarten-titel"
                className="flex min-h-0 flex-1 flex-col"
              >
                <div className="mb-1 flex items-start justify-between gap-2">
                  <h3 id="kaarten-titel" className="font-display font-semibold text-ink">
                    {selected ? pickerTitle(selected) : "Je spelers"}
                  </h3>
                  {selected && (
                    <button
                      type="button"
                      onClick={() => setSelected(null)}
                      aria-label="Kiezer sluiten"
                      className="rounded-full p-1 text-ink-3 hover:text-ink"
                    >
                      <X size={16} aria-hidden />
                    </button>
                  )}
                </div>
                {!selected && (
                  <p className="text-xs text-ink-3">
                    {mouse
                      ? "Klik op een plek om te kiezen, of sleep een speler naar het veld."
                      : "Tik op een plek om te kiezen."}
                  </p>
                )}
                <PlayerPicker
                  key={selected ? spotKey(selected) : "overzicht"}
                  api={api}
                  target={selected}
                  draggable={mouse}
                  onDone={() => {
                    // Terug naar de plek op het veld, zodat je met het toetsenbord verder kunt.
                    const key = selected ? spotKey(selected) : null;
                    setSelected(null);
                    if (key)
                      requestAnimationFrame(() =>
                        document.querySelector<HTMLElement>(`[data-spot="${key}"]`)?.focus(),
                      );
                  }}
                  onSelectSpot={setSelected}
                  className="min-h-0 flex-1"
                />
              </GlassPanel>
            </aside>
          )}
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {dragCard && (
          <div
            className="rotate-3 drop-shadow-[0_14px_20px_rgb(0_0_0/0.6)]"
            style={{ width: cardWidth || 80 }}
          >
            <SquadCard
              card={dragCard}
              player={api.players.get(dragCard.id) ?? null}
              chemistry={null}
              animate={false}
            />
          </div>
        )}
      </DragOverlay>

      <Sheet
        open={picker !== null}
        onClose={() => setPicker(null)}
        title={picker ? pickerTitle(picker) : ""}
        size="md"
      >
        {picker && (
          <PlayerPicker
            key={spotKey(picker)}
            api={api}
            target={picker}
            draggable={false}
            onDone={() => setPicker(null)}
            className="max-h-[68dvh]"
          />
        )}
      </Sheet>

      <ChemistryHelp open={help} onClose={() => setHelp(false)} />
      {clubOpen && (
        <ClubSheet open club={api.club} onClose={() => setClubOpen(false)} onSave={api.setClub} />
      )}
      {renaming && (
        <RenameSheet
          key={renaming.id}
          squad={renaming}
          onClose={() => setRenaming(null)}
          onRename={(name) => api.renameSquad(renaming.id, name)}
        />
      )}
      <SquadShareSheet mode={share} api={api} onClose={() => setShare(null)} />
      <MatchSheet open={match} api={api} onClose={() => setMatch(false)} />
    </DndContext>
  );
}
