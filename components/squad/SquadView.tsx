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
import { Armchair, ArrowLeftRight, Crown, Replace, Sparkles, Wand2, X } from "lucide-react";
import { useEffect, useId, useState, type KeyboardEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Sheet } from "@/components/ui/Sheet";
import type { CopyKey } from "@/content/copy";
import { useMediaQuery } from "@/lib/hooks";
import { track } from "@/lib/stats/client";
import type { BuildResult } from "@/lib/squad/build";
import { inPosition, type SquadEvaluation } from "@/lib/squad/chemistry";
import { FORMATIONS, LINE_LABELS, POSITION_NAMES, type FormationId } from "@/lib/squad/formations";
import {
  cardAt,
  parseSpotKey,
  sameSpot,
  spotKey,
  type FieldConflict,
  type Spot,
} from "@/lib/squad/lineup";
import { bestEmptySpot, type MoveAdvice, type MoveEffect } from "@/lib/squad/suggest";
import { cn } from "@/lib/cn";
import { useCopy, useCopyParts } from "@/lib/use-copy";
import { toast } from "@/stores/toast";
import type { SavedSquad } from "@/stores/squad";
import { Bench } from "./Bench";
import { CardList } from "./CardList";
import { ChemistryHelp } from "./ChemistryHelp";
import { ClubSheet } from "./ClubSheet";
import { MatchSheet } from "./MatchSheet";
import { Pitch } from "./Pitch";
import { SquadCard } from "./SquadCard";
import { SquadShareSheet } from "./SquadShareSheet";
import { SquadStats, SquadToolbar } from "./SquadHeader";
import { usePitchSize } from "./usePitchSize";
import { useSquad, type SquadApi } from "./useSquad";

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
  const built = note.kind === "gebouwd" ? note.result : null;
  const title = useCopy(built ? "elftal.gebouwd" : null, {
    cijfer: String(built?.evaluation.rating ?? ""),
    aantal: String(built?.evaluation.chemistry ?? ""),
  });
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
        {note.kind === "gebouwd" ? title : `Formatie ${note.formation}`}
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

  const [selected, setSelected] = useState<Spot | null>(null);
  const [picker, setPicker] = useState<Spot | null>(null);
  const [dragging, setDragging] = useState<{ key: string; cardId: string } | null>(null);
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
      () => setAnnouncement(`Rating ${evaluation.rating}, chemie ${evaluation.chemistry}.`),
      400,
    );
    return () => clearTimeout(id);
  }, [evaluation.rating, evaluation.chemistry]);

  // Escape: selectie weg.
  useEffect(() => {
    if (!selected) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  const nameOf = (cardId: string | null) =>
    cardId ? (api.players.get(cardId)?.subjectName ?? "Kaart") : "Lege plek";
  const positionOf = (slot: string) =>
    FORMATIONS[lineup.formation].slots.find((s) => s.id === slot)?.position ?? "het veld";

  /** Een zet die niet mag: zeg waarom, en wat wel kan. */
  const refuse = (conflict: FieldConflict) => {
    const vak = nameOf(conflict.cardId);
    const where = positionOf(conflict.slot);
    toast({
      tone: "warning",
      emoji: "✋",
      title: `${vak} staat al op ${where}`,
      description: "Eén kaart per vak op het veld. Wissel met die kaart, of kies een ander vak.",
    });
    setAnnouncement(`Kan niet: ${vak} staat al op het veld.`);
  };

  const changed = () => setNote(null);

  const placeAt = (spot: Spot, cardId: string) => {
    const conflict = api.place(spot, cardId);
    if (conflict) return refuse(conflict);
    changed();
    setAnnouncement(`${nameOf(cardId)} op ${spotName(api, spot)} gezet.`);
  };

  const swap = (a: Spot, b: Spot) => {
    const first = cardAt(lineup, a);
    const second = cardAt(lineup, b);
    const conflict = api.swap(a, b);
    if (conflict) return refuse(conflict);
    changed();
    setAnnouncement(`${nameOf(first)} en ${nameOf(second)} gewisseld.`);
  };

  /** Tikken (of Enter) op een plek: kiezen, selecteren of wisselen. */
  const activate = (spot: Spot) => {
    if (selected) {
      if (sameSpot(selected, spot)) {
        setSelected(null);
        return;
      }
      swap(selected, spot);
      setSelected(null);
      return;
    }
    if (cardAt(lineup, spot)) {
      setSelected(spot);
      setAnnouncement(
        `${nameOf(cardAt(lineup, spot))} gekozen. Kies een andere plek om te wisselen, of kies hieronder wat je wilt doen.`,
      );
    } else setPicker(spot);
  };

  /** Een kaart uit de lijst (naast het veld): naar de gekozen plek, of de best passende lege plek. */
  const pickFromList = (cardId: string) => {
    const player = api.players.get(cardId);
    if (!player) return;
    const target = selected ?? bestEmptySpot(lineup, player, api.vakOf);
    if (!target) {
      toast({
        title: "Alles vol",
        description: "Kies eerst een plek om te vervangen.",
        emoji: "🧤",
      });
      return;
    }
    placeAt(target, cardId);
    setSelected(null);
  };

  const onDragStart = ({ active }: DragStartEvent) => {
    const id = String(active.id);
    const fromSpot = active.data.current?.spot as Spot | undefined;
    const cardId = fromSpot
      ? cardAt(lineup, fromSpot)
      : (active.data.current?.cardId as string | undefined);
    if (cardId) setDragging({ key: fromSpot ? spotKey(fromSpot) : id, cardId });
    setSelected(null);
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setDragging(null);
    if (!over) return;
    const fromSpot = active.data.current?.spot as Spot | undefined;
    const cardId = active.data.current?.cardId as string | undefined;
    if (over.id === "lijst") {
      if (fromSpot) {
        setAnnouncement(`${nameOf(cardAt(lineup, fromSpot))} uit je elftal gehaald.`);
        api.remove(fromSpot);
        changed();
      }
      return;
    }
    const target = parseSpotKey(String(over.id));
    if (!target) return;
    if (fromSpot) swap(fromSpot, target);
    else if (cardId) placeAt(target, cardId);
  };

  const announcements: Announcements = {
    onDragStart: ({ active }) => {
      const spot = active.data.current?.spot as Spot | undefined;
      return `${nameOf(spot ? cardAt(lineup, spot) : (active.data.current?.cardId as string))} opgepakt.`;
    },
    onDragOver: ({ over }) => {
      const spot = over ? parseSpotKey(String(over.id)) : null;
      return spot
        ? `Boven ${spotName(api, spot)}.`
        : over
          ? "Boven de lijst: loslaten haalt hem uit je elftal."
          : "Nergens boven.";
    },
    onDragEnd: () => "",
    onDragCancel: () => "Slepen afgebroken.",
  };

  const build = (formation?: FormationId) => {
    const result = api.build(formation);
    track("elftal-gebouwd");
    setNote({ kind: "gebouwd", result });
    setSelected(null);
    setAnnouncement(
      `Beste elftal staat: rating ${result.evaluation.rating}, chemie ${result.evaluation.chemistry}.`,
    );
  };

  const applyTip = (advice: MoveAdvice) => {
    api.apply(advice.next);
    setAnnouncement(`Gedaan: ${effectLabel(advice.effect)}.`);
  };

  if (api.isLoading) return null;

  if (api.players.size === 0) {
    return (
      <GlassPanel padding="lg">
        <EmptyState illustration="kaarten" title={empty?.title ?? ""} description={empty?.body} />
      </GlassPanel>
    );
  }

  const selectedCard = selected ? cardAt(lineup, selected) : null;
  const pickerName = picker ? spotName(api, picker) : "";
  const activeSquad = api.squads.find((s) => s.id === api.activeId) ?? null;
  const dragCard = dragging ? api.cardById(dragging.cardId) : null;

  /** Wat je met een gekozen kaart kunt doen. Op een computer staat "kiezen" al in de lijst ernaast. */
  const selectionButtons = (withReplace: boolean) =>
    selected && (
      <>
        {withReplace && (
          <Button
            size="sm"
            variant="glass"
            icon={Replace}
            onClick={() => {
              setPicker(selected);
              setSelected(null);
            }}
          >
            Vervangen
          </Button>
        )}
        {selected.kind === "veld" && selectedCard && (
          <>
            <Button
              size="sm"
              variant="glass"
              icon={Crown}
              onClick={() => {
                api.toggleCaptain(selectedCard);
                setAnnouncement(
                  lineup.captain === selectedCard
                    ? "Aanvoerdersband weggehaald."
                    : `${nameOf(selectedCard)} is aanvoerder.`,
                );
                setSelected(null);
              }}
            >
              {lineup.captain === selectedCard ? "Geen aanvoerder" : "Aanvoerder"}
            </Button>
            {api.canBench(selected) && (
              <Button
                size="sm"
                variant="glass"
                icon={Armchair}
                onClick={() => {
                  const incoming = api.toBench(selected);
                  if (incoming !== false) {
                    setAnnouncement(
                      incoming
                        ? `${nameOf(selectedCard)} naar de bank, ${nameOf(incoming)} erin.`
                        : `${nameOf(selectedCard)} naar de bank.`,
                    );
                    changed();
                  }
                  setSelected(null);
                }}
              >
                Naar bank
              </Button>
            )}
          </>
        )}
        <Button
          size="sm"
          variant="ghost"
          icon={X}
          onClick={() => {
            api.remove(selected);
            setAnnouncement(`${nameOf(selectedCard)} uit je elftal gehaald.`);
            setSelected(null);
            changed();
          }}
        >
          Haal weg
        </Button>
      </>
    );

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
          setAnnouncement("Elftal leeggemaakt.");
        },
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
            "Sleep met de muis naar een plek. Met het toetsenbord: pijltjes om tussen plekken te gaan, Enter om een kaart te kiezen of te wisselen.",
        },
      }}
    >
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
      <div className="space-y-4">
        {/* Boven de rest, zodat de uitklapmenu's over het veld en de kaarten vallen. */}
        <GlassPanel padding="sm" className="relative z-30 px-4 py-3">
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
                  selected={selected}
                  draggingKey={dragging?.key ?? null}
                  onActivate={activate}
                />
              )}
            </div>

            {selected && !wide && (
              <div
                role="toolbar"
                aria-label="Wat wil je met deze kaart?"
                className="sticky bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-20 rounded-2xl border border-line-strong bg-surface p-2.5 shadow-[0_18px_44px_-14px_rgb(0_0_0/0.6)]"
              >
                <p className="mb-2 px-1 text-sm text-ink-2">
                  <ArrowLeftRight size={14} aria-hidden className="mr-1 inline" />
                  <strong className="text-ink">{nameOf(selectedCard)}</strong>: tik op een andere
                  plek om te wisselen, of:
                </p>
                <div className="flex flex-wrap gap-2">{selectionButtons(true)}</div>
              </div>
            )}

            {!wide && noteCard(false)}

            <GlassPanel padding="md">
              <Bench
                bench={lineup.bench}
                cardById={api.cardById}
                players={api.players}
                selected={selected}
                draggingKey={dragging?.key ?? null}
                onActivate={activate}
              />
            </GlassPanel>

            <Analysis api={api} onApply={applyTip} />
          </div>

          {wide && (
            <aside
              className="flex flex-col gap-3"
              style={{ height: pitchSize?.height }}
              aria-label="Statistieken en kaarten"
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
                <h3 id="kaarten-titel" className="mb-1 font-display font-semibold text-ink">
                  {selected ? `Kies voor ${spotName(api, selected)}` : "Je kaarten"}
                </h3>
                <p className="mb-2 text-xs text-ink-3">
                  {selected
                    ? "Per vak de beste kaart voor deze plek. Of klik een andere plek om te wisselen."
                    : mouse
                      ? "Sleep of klik om op te stellen."
                      : "Tik om op te stellen."}
                </p>
                {selected && (
                  <div
                    role="toolbar"
                    aria-label="Wat wil je met deze kaart?"
                    className="mb-3 flex flex-wrap gap-1.5"
                  >
                    {selectionButtons(false)}
                  </div>
                )}
                <CardList
                  api={api}
                  target={selected}
                  draggable={mouse}
                  onPick={pickFromList}
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
        title={`Kies voor ${pickerName}`}
        description="Per vak de beste kaart voor deze plek. Plus en min is wat je rating en chemie doen."
        size="md"
      >
        {picker && (
          <CardList
            api={api}
            target={picker}
            draggable={false}
            onPick={(cardId) => {
              placeAt(picker, cardId);
              setPicker(null);
            }}
            className="max-h-[62dvh]"
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
