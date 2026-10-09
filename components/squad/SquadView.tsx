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
import {
  ArrowLeftRight,
  ChevronDown,
  CircleHelp,
  Clapperboard,
  Crown,
  Eraser,
  Share2,
  Trophy,
  Undo2,
  Wand2,
  X,
} from "lucide-react";
import { useEffect, useId, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Sheet } from "@/components/ui/Sheet";
import { useMediaQuery } from "@/lib/hooks";
import { notify } from "@/lib/notify";
import { track } from "@/lib/stats/client";
import type { BuildResult } from "@/lib/squad/build";
import {
  FORMATION_IDS,
  LINE_LABELS,
  POSITION_NAMES,
  type FormationId,
} from "@/lib/squad/formations";
import { cardAt, parseSpotKey, sameSpot, spotKey, type Spot } from "@/lib/squad/lineup";
import { NATURAL_LINE_LABELS } from "@/lib/squad/players";
import { bestEmptySpot } from "@/lib/squad/suggest";
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
import { SquadHeader, SquadsBar } from "./SquadHeader";
import { useSquad, type SquadApi } from "./useSquad";

const FORMATION_KEY = "elftal-formatie";

function spotName(api: SquadApi, spot: Spot): string {
  if (spot.kind === "bank") return `bank ${spot.index + 1}`;
  const slot = api.evaluation.formation.slots.find((s) => s.id === spot.slot);
  return slot ? POSITION_NAMES[slot.position].toLowerCase() : "plek";
}

/** De analyse: sterkste linie, zwakste plek en een tip, in de toon van de app. */
function Analysis({ api }: { api: SquadApi }) {
  const { strongest, weakest, tip } = api.analysis;
  const strong = useCopy(strongest ? "elftal.sterk" : null, {
    linie: strongest ? LINE_LABELS[strongest.line].toLowerCase() : "",
    vak: strongest?.subject ?? "",
  });
  const weak = useCopy(weakest ? "elftal.zwak" : null, {
    linie: weakest ? LINE_LABELS[weakest.line].toLowerCase() : "",
    vak: weakest?.subject ?? "",
  });
  const tipText = useCopy(`elftal.tip.${tip.kind}`, {
    aantal: tip.kind === "leeg" ? String(tip.open) : tip.kind === "chemie" ? String(tip.red) : "",
    vak: tip.kind === "positie" ? tip.subject : "",
    linie:
      tip.kind === "positie"
        ? tip.natural === "flexibel"
          ? "het veld"
          : NATURAL_LINE_LABELS[tip.natural].toLowerCase()
        : "",
  });
  const rows: [string, string | null][] = [
    ["Sterkst", strong],
    ["Zwakst", weak],
    ["Tip", tipText],
  ];
  return (
    <GlassPanel as="section" aria-labelledby="analyse-titel" padding="md">
      <h3 id="analyse-titel" className="mb-2 font-display font-semibold text-ink">
        Analyse
      </h3>
      <dl className="space-y-2 text-sm">
        {rows.map(([label, text]) =>
          text ? (
            <div key={label} className="grid grid-cols-[4.5rem_1fr] gap-2">
              <dt className="font-semibold text-ink-3">{label}</dt>
              <dd className="text-ink-2">{text}</dd>
            </div>
          ) : null,
        )}
      </dl>
    </GlassPanel>
  );
}

/** Wat "Bouw beste elftal" afwoog. */
function BuildNote({
  result,
  onFormation,
  onClose,
}: {
  result: BuildResult;
  onFormation: (formation: FormationId) => void;
  onClose: () => void;
}) {
  const { evaluation, ratingOnly, betterFormation } = result;
  const givenUp = ratingOnly.rating - evaluation.rating;
  const gained = evaluation.chemistry - ratingOnly.chemistry;
  return (
    <GlassPanel padding="md" className="relative text-sm text-ink-2">
      <button
        type="button"
        onClick={onClose}
        aria-label="Sluiten"
        className="absolute top-2 right-2 rounded-full p-1.5 text-ink-3 hover:text-ink"
      >
        <X size={16} aria-hidden />
      </button>
      <p className="pr-6 font-semibold text-ink">Zo is er gekozen</p>
      <p className="mt-1">
        Rating <span className="sensitive">{evaluation.rating}</span>, chemie {evaluation.chemistry}
        . Alleen op de hoogste ratings was het rating{" "}
        <span className="sensitive">{ratingOnly.rating}</span>, chemie {ratingOnly.chemistry}.{" "}
        {givenUp > 0 && gained > 0
          ? `Je levert ${givenUp} rating in voor ${gained} chemie: één ratingpunt telt als vier punten chemie.`
          : gained > 0
            ? `${gained} chemie erbij, zonder rating in te leveren.`
            : "Rating en chemie wezen hier dezelfde kant op."}
      </p>
      {betterFormation && (
        <p className="mt-2">
          In {betterFormation.formation} kom je op rating{" "}
          <span className="sensitive">{betterFormation.rating}</span> en chemie{" "}
          {betterFormation.chemistry}.{" "}
          <button
            type="button"
            onClick={() => onFormation(betterFormation.formation)}
            className="font-semibold text-accent-ink underline-offset-2 hover:underline"
          >
            Probeer {betterFormation.formation}
          </button>
        </p>
      )}
    </GlassPanel>
  );
}

function RenameSheet({
  squad,
  canRemove,
  onClose,
  onRename,
  onRemove,
}: {
  squad: SavedSquad | null;
  canRemove: boolean;
  onClose: () => void;
  onRename: (name: string) => void;
  onRemove: () => void;
}) {
  const [name, setName] = useState(squad?.name ?? "");
  return (
    <Sheet open={squad !== null} onClose={onClose} title="Elftal hernoemen" size="sm">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onRename(name);
          onClose();
        }}
        className="space-y-4"
      >
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">Naam</span>
          <input
            value={name}
            maxLength={24}
            onChange={(event) => setName(event.target.value)}
            placeholder="Bijv. Chaos XI"
            className="h-11 w-full rounded-xl border border-line-strong bg-glass-strong px-3.5 text-ink outline-none focus-visible:ring-2 focus-visible:ring-[var(--sm-accent)]"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="primary" className="flex-1">
            Opslaan
          </Button>
          {canRemove && (
            <Button
              variant="ghost"
              onClick={() => {
                onRemove();
                onClose();
              }}
            >
              Verwijderen
            </Button>
          )}
        </div>
      </form>
    </Sheet>
  );
}

function ActionButton({
  icon,
  children,
  onClick,
  primary = false,
}: {
  icon: typeof Wand2;
  children: ReactNode;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <Button variant={primary ? "primary" : "glass"} size="sm" icon={icon} onClick={onClick}>
      {children}
    </Button>
  );
}

/** Jouw Elftal: de squad builder van de collectie. */
export function SquadView() {
  const api = useSquad();
  const wide = useMediaQuery("(min-width: 1024px)");
  const mouse = useMediaQuery("(pointer: fine)");
  const dndId = useId();
  const sensors = useSensors(useSensor(MouseSensor, { activationConstraint: { distance: 6 } }));

  const [selected, setSelected] = useState<Spot | null>(null);
  const [picker, setPicker] = useState<Spot | null>(null);
  const [dragging, setDragging] = useState<{ key: string; cardId: string } | null>(null);
  const [built, setBuilt] = useState<BuildResult | null>(null);
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
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  const nameOf = (cardId: string | null) =>
    cardId ? (api.cardById(cardId)?.subjectName ?? "Kaart") : "Lege plek";

  const placeAt = (spot: Spot, cardId: string) => {
    api.place(spot, cardId);
    setBuilt(null);
    setAnnouncement(`${nameOf(cardId)} op ${spotName(api, spot)} gezet.`);
  };

  /** Tikken op een plek: kiezen, selecteren of wisselen. */
  const activate = (spot: Spot) => {
    if (selected) {
      if (sameSpot(selected, spot)) {
        setSelected(null);
        return;
      }
      api.swap(selected, spot);
      setBuilt(null);
      setAnnouncement(
        `${nameOf(cardAt(lineup, selected))} en ${nameOf(cardAt(lineup, spot))} gewisseld.`,
      );
      setSelected(null);
      return;
    }
    if (cardAt(lineup, spot)) {
      setSelected(spot);
      setAnnouncement(
        `${nameOf(cardAt(lineup, spot))} geselecteerd. Tik op een andere plek om te wisselen, of kies hieronder.`,
      );
    } else setPicker(spot);
  };

  /** Een kaart uit de lijst (naast het veld): naar de gekozen plek, of de best passende lege plek. */
  const pickFromList = (cardId: string) => {
    const player = api.players.get(cardId);
    if (!player) return;
    const target = selected ?? bestEmptySpot(lineup, player);
    if (!target) {
      toast({
        title: "Alles vol",
        description: "Tik eerst op een plek om hem te vervangen.",
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
        setBuilt(null);
      }
      return;
    }
    const target = parseSpotKey(String(over.id));
    if (!target) return;
    if (fromSpot) {
      api.swap(fromSpot, target);
      setBuilt(null);
      setAnnouncement(`${nameOf(cardAt(lineup, fromSpot))} naar ${spotName(api, target)}.`);
    } else if (cardId) placeAt(target, cardId);
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

  const build = () => {
    const result = api.build();
    track("elftal-gebouwd");
    setBuilt(result);
    setSelected(null);
    notify(
      "elftal.gebouwd",
      {
        cijfer: String(result.evaluation.rating),
        aantal: String(result.evaluation.chemistry),
      },
      { emoji: "🪄" },
    );
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
            "Sleep met de muis naar een plek. Met het toetsenbord: druk op Enter op een plek om een kaart te kiezen of te wisselen.",
        },
      }}
    >
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
      <div className="space-y-4">
        <GlassPanel padding="md" className="space-y-4">
          <SquadHeader evaluation={evaluation} club={api.club} onClub={() => setClubOpen(true)} />
          <div className="flex flex-wrap items-center gap-2">
            <SquadsBar
              squads={api.squads}
              activeId={api.activeId}
              onSelect={(id) => {
                api.setActive(id);
                setSelected(null);
                setBuilt(null);
              }}
              onAdd={() => api.addSquad(false)}
              onEdit={setRenaming}
            />
            <label className="relative ml-auto">
              <span className="sr-only">Formatie</span>
              <select
                id={FORMATION_KEY}
                value={lineup.formation}
                onChange={(event) => {
                  api.setFormation(event.target.value as FormationId);
                  setSelected(null);
                  setBuilt(null);
                }}
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
          </div>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible [&>*]:shrink-0">
            <ActionButton icon={Wand2} primary onClick={build}>
              Bouw beste elftal
            </ActionButton>
            <ActionButton
              icon={Eraser}
              onClick={() => {
                api.clear();
                setSelected(null);
                setBuilt(null);
                setAnnouncement("Elftal leeggemaakt.");
              }}
            >
              Leegmaken
            </ActionButton>
            <ActionButton icon={Share2} onClick={() => setShare("afbeelding")}>
              Delen
            </ActionButton>
            <ActionButton icon={Clapperboard} onClick={() => setShare("video")}>
              Video
            </ActionButton>
            <ActionButton icon={Trophy} onClick={() => setMatch(true)}>
              Oefenwedstrijd
            </ActionButton>
            <ActionButton icon={CircleHelp} onClick={() => setHelp(true)}>
              Hoe werkt chemie?
            </ActionButton>
          </div>
        </GlassPanel>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,360px)]">
          <div className="min-w-0 space-y-4">
            <Pitch
              evaluation={evaluation}
              cardById={api.cardById}
              selected={selected}
              draggingKey={dragging?.key ?? null}
              onActivate={activate}
            />

            {selected && (
              <GlassPanel
                padding="sm"
                className="sticky bottom-[calc(env(safe-area-inset-bottom)+5rem)] z-20 flex flex-wrap items-center gap-2 lg:bottom-4"
              >
                <p className="min-w-0 flex-1 px-1 text-sm text-ink-2">
                  <ArrowLeftRight size={14} aria-hidden className="mr-1 inline" />
                  {selectedCard ? nameOf(selectedCard) : spotName(api, selected)}: tik op een andere
                  plek om te wisselen.
                </p>
                <Button
                  size="sm"
                  variant="glass"
                  icon={Undo2}
                  onClick={() => {
                    setPicker(selected);
                    setSelected(null);
                  }}
                >
                  Vervangen
                </Button>
                {selected.kind === "veld" && selectedCard && (
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
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  icon={X}
                  onClick={() => {
                    api.remove(selected);
                    setAnnouncement(`${nameOf(selectedCard)} uit je elftal gehaald.`);
                    setSelected(null);
                    setBuilt(null);
                  }}
                >
                  Haal weg
                </Button>
              </GlassPanel>
            )}

            <GlassPanel padding="md">
              <Bench
                bench={lineup.bench}
                cardById={api.cardById}
                selected={selected}
                draggingKey={dragging?.key ?? null}
                onActivate={activate}
              />
            </GlassPanel>

            {built && (
              <BuildNote
                result={built}
                onClose={() => setBuilt(null)}
                onFormation={(formation) => setBuilt(api.build(formation))}
              />
            )}
            <Analysis api={api} />
          </div>

          {wide && (
            <GlassPanel
              as="aside"
              padding="md"
              aria-labelledby="kaarten-titel"
              className="flex max-h-[calc(100dvh-7rem)] flex-col lg:sticky lg:top-6 lg:self-start"
            >
              <h3 id="kaarten-titel" className="mb-1 font-display font-semibold text-ink">
                {selected ? `Kies voor ${spotName(api, selected)}` : "Je kaarten"}
              </h3>
              <p className="mb-3 text-xs text-ink-3">
                {mouse
                  ? "Sleep naar het veld, of klik om op te stellen. Sleep terug om weg te halen."
                  : "Tik om op te stellen."}
              </p>
              <CardList
                api={api}
                target={selected}
                draggable={mouse}
                onPick={pickFromList}
                className="min-h-0 flex-1"
              />
            </GlassPanel>
          )}
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {dragging && api.cardById(dragging.cardId) && (
          <div className="w-20 rotate-3 drop-shadow-[0_14px_20px_rgb(0_0_0/0.6)]">
            <SquadCard card={api.cardById(dragging.cardId)!} chemistry={null} />
          </div>
        )}
      </DragOverlay>

      <Sheet
        open={picker !== null}
        onClose={() => setPicker(null)}
        title={`Kies voor ${pickerName}`}
        description="Beste chemie voor deze plek bovenaan, daarna de hoogste rating."
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
            className="max-h-[60dvh]"
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
          canRemove={api.squads.length > 1}
          onClose={() => setRenaming(null)}
          onRename={(name) => api.renameSquad(renaming.id, name)}
          onRemove={() => api.removeSquad(renaming.id)}
        />
      )}
      <SquadShareSheet mode={share} api={api} onClose={() => setShare(null)} />
      <MatchSheet open={match} api={api} onClose={() => setMatch(false)} />
    </DndContext>
  );
}
