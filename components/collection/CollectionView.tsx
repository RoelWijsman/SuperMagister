"use client";

import { DataErrorState } from "@/components/koppelen/DataErrorState";
import { ChevronDown, Gift, Star, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { CardCanvas } from "@/components/cards/CardCanvas";
import { TIER_GLOW } from "@/components/cards/tier-style";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { LoadingQuip } from "@/components/ui/LoadingQuip";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { Tabs } from "@/components/ui/Tabs";
import { useWalkoutActions } from "@/components/walkout/useWalkoutActions";
import { VARIANT_LABELS } from "@/lib/calc/cards";
import { TIER_LABELS, TIER_ORDER, type CardTier } from "@/lib/calc/tiers";
import type { CardData } from "@/lib/cards/model";
import { renderShareShowcase } from "@/lib/cards/share";
import {
  filterCards,
  filterOptions,
  NO_FILTERS,
  sortCards,
  tierCounts,
  type AlbumFilters,
  type AlbumSort,
} from "@/lib/collection/album";
import { cn } from "@/lib/cn";
import { useAccount, useGrades } from "@/lib/data/hooks";
import { useCopy, useCopyParts } from "@/lib/use-copy";
import { useCollectionStore } from "@/stores/collection";
import { SquadView } from "@/components/squad/SquadView";
import { CardViewer } from "./CardViewer";
import { GoalsPanel } from "./GoalsPanel";
import { ShareSheet, type ShareRequest } from "./ShareSheet";
import { ShowcasePanel } from "./ShowcasePanel";
import { useCollection } from "./useCollection";

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
    <label className="relative">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 cursor-pointer appearance-none rounded-full glass pr-9 pl-4 text-sm font-medium text-ink outline-offset-2"
      >
        {children}
      </select>
      <ChevronDown
        size={16}
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-ink-3"
      />
    </label>
  );
}

function TierCounter({
  tier,
  count,
  active,
  onClick,
}: {
  tier: CardTier;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      disabled={count === 0 && !active}
      className={cn(
        "flex items-center gap-2 rounded-full py-1.5 pr-3.5 pl-2 transition-colors disabled:opacity-45",
        active
          ? "bg-[color-mix(in_oklab,var(--sm-accent)_22%,transparent)] shadow-[inset_0_0_0_1.5px_var(--sm-accent)]"
          : "glass",
      )}
    >
      <span
        aria-hidden
        className="h-[18px] w-[13px] rounded-[3px_3px_5px_5px] shadow-[0_0_10px_-2px_var(--c)]"
        style={{
          background: `linear-gradient(160deg, ${TIER_GLOW[tier]}, color-mix(in oklab, ${TIER_GLOW[tier]} 55%, black))`,
          ["--c" as string]: TIER_GLOW[tier],
        }}
      />
      <span className="font-card text-[1.05rem] tracking-wider text-ink">
        {TIER_LABELS[tier].toUpperCase()}
      </span>
      <span className="text-sm text-ink-2 tabular-nums">{count}</span>
    </button>
  );
}

type CollectionTab = "album" | "elftal";

/** De collectie (§12): album, vitrine, verzameldoelen en folies, en Jouw Elftal. */
export function CollectionView() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tab: CollectionTab = params.get("tab") === "elftal" ? "elftal" : "album";
  const setTab = (next: CollectionTab) =>
    router.replace(next === "elftal" ? `${pathname}?tab=elftal` : pathname, { scroll: false });
  const collection = useCollection();
  const gradesQuery = useGrades();
  const account = useAccount();
  const { openPack } = useWalkoutActions();
  const setFoil = useCollectionStore((s) => s.setFoil);
  const [filters, setFilters] = useState<AlbumFilters>(NO_FILTERS);
  const [sort, setSort] = useState<AlbumSort>("nieuw");
  const [viewer, setViewer] = useState<{ cards: readonly CardData[]; index: number } | null>(null);
  const [share, setShare] = useState<ShareRequest | null>(null);

  const cards = collection.collection;
  const shown = useMemo(() => sortCards(filterCards(cards, filters), sort), [cards, filters, sort]);
  const counts = useMemo(() => tierCounts(cards), [cards]);
  const options = useMemo(() => filterOptions(cards), [cards]);
  const filtered = filters !== NO_FILTERS && Object.values(filters).some(Boolean);

  const subtitle = useCopy(cards.length > 0 ? "collectie.subtitel" : null, {
    aantal: String(cards.length),
    kaarten: cards.length === 1 ? "kaart" : "kaarten",
  });
  const empty = useCopyParts(!collection.isLoading && cards.length === 0 ? "leeg.collectie" : null);
  const emptyFilter = useCopyParts(
    cards.length > 0 && shown.length === 0 ? "leeg.collectieFilter" : null,
  );

  const set = <K extends keyof AlbumFilters>(key: K, value: AlbumFilters[K]) =>
    setFilters((f) => ({ ...f, [key]: value }));

  const header = (
    <>
      <PageHeader eyebrow="Je verzamelkaarten" title="Collectie" subtitle={subtitle ?? undefined} />
      <Tabs<CollectionTab>
        id="collectie-tab"
        aria-label="Onderdeel"
        value={tab}
        onValueChange={setTab}
        items={[
          { value: "album", label: "Album" },
          { value: "elftal", label: "Elftal" },
        ]}
        className="mb-5"
      />
    </>
  );

  if (collection.isLoading && gradesQuery.isError && !gradesQuery.data) {
    return (
      <>
        {header}
        <DataErrorState error={gradesQuery.error} onRetry={() => void gradesQuery.refetch()} />
      </>
    );
  }

  if (collection.isLoading) {
    return (
      <>
        {header}
        <LoadingQuip topic="collectie" className="mb-4" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
          {Array.from({ length: 12 }, (_, i) => (
            <Skeleton key={i} className="aspect-[500/720] h-auto w-full rounded-3xl" />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      {header}

      {collection.pack.length > 0 && (
        <GlassPanel className="mb-5 flex flex-wrap items-center gap-4 bg-[color-mix(in_oklab,var(--sm-accent)_10%,transparent)]">
          <span className="grid size-11 place-items-center rounded-2xl bg-[linear-gradient(135deg,var(--sm-accent),var(--sm-accent-2))] text-on-accent">
            <Gift size={22} strokeWidth={2.2} aria-hidden />
          </span>
          <p className="min-w-0 flex-1 font-semibold text-ink">
            Nog {collection.pack.length} {collection.pack.length === 1 ? "kaart" : "kaarten"} in je
            pack
          </p>
          <Button variant="primary" onClick={openPack}>
            Open je pack
          </Button>
        </GlassPanel>
      )}

      {tab === "elftal" ? (
        <SquadView />
      ) : cards.length === 0 ? (
        <GlassPanel padding="lg">
          <EmptyState illustration="kaarten" title={empty?.title ?? ""} description={empty?.body} />
        </GlassPanel>
      ) : (
        <div className="space-y-5">
          <ShowcasePanel
            cards={collection.showcase}
            onOpen={(index) => setViewer({ cards: collection.showcase, index })}
            onShare={() =>
              setShare({
                title: "Deel je vitrine",
                filename: "supermagister-vitrine.png",
                render: () =>
                  renderShareShowcase(collection.showcase, account.data?.firstName ?? "Mijn"),
              })
            }
          />

          <GlassPanel as="section" aria-labelledby="album-titel" padding="lg">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="album-titel" className="font-display text-lg font-semibold tracking-tight">
                Album
              </h2>
              <Tabs<AlbumSort>
                id="album-sortering"
                aria-label="Sorteren"
                size="sm"
                value={sort}
                onValueChange={setSort}
                items={[
                  { value: "nieuw", label: "Nieuwste" },
                  { value: "rating", label: "Hoogste" },
                  { value: "vak", label: "Per vak" },
                ]}
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Tellers per tier">
              {TIER_ORDER.map((tier) => (
                <TierCounter
                  key={tier}
                  tier={tier}
                  count={counts[tier]}
                  active={filters.tier === tier}
                  onClick={() => set("tier", filters.tier === tier ? null : tier)}
                />
              ))}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Select
                label="Vak"
                value={filters.subjectId ?? ""}
                onChange={(v) => set("subjectId", v || null)}
              >
                <option value="">Alle vakken</option>
                {options.subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.count})
                  </option>
                ))}
              </Select>
              {options.periods.length > 1 && (
                <Select
                  label="Periode"
                  value={filters.periodId ?? ""}
                  onChange={(v) => set("periodId", v || null)}
                >
                  <option value="">Hele jaar</option>
                  {options.periods.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.count})
                    </option>
                  ))}
                </Select>
              )}
              {options.variants.length > 0 && (
                <Select
                  label="Soort kaart"
                  value={filters.variant ?? ""}
                  onChange={(v) => set("variant", (v || null) as AlbumFilters["variant"])}
                >
                  <option value="">Alle soorten</option>
                  {options.variants.map((variant) => (
                    <option key={variant} value={variant}>
                      {VARIANT_LABELS[variant]}
                    </option>
                  ))}
                </Select>
              )}
              {filtered && (
                <Button variant="ghost" size="sm" icon={X} onClick={() => setFilters(NO_FILTERS)}>
                  Filters wissen
                </Button>
              )}
            </div>

            {shown.length === 0 ? (
              <EmptyState
                illustration="zoeken"
                title={emptyFilter?.title ?? ""}
                description={emptyFilter?.body}
              />
            ) : (
              <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
                {shown.map((card, index) => (
                  <li key={card.id} className="relative">
                    <button
                      type="button"
                      onClick={() => setViewer({ cards: shown, index })}
                      aria-label={`Bekijk ${card.subjectName}, ${card.grade.description}`}
                      className="group block w-full rounded-2xl transition-transform duration-200 hover:-translate-y-1.5 active:scale-95"
                    >
                      <CardCanvas
                        card={card}
                        width={190}
                        lazy
                        className="sensitive !h-auto !w-full drop-shadow-[0_10px_18px_rgb(0_0_0/0.35)]"
                      />
                    </button>
                    {collection.isInShowcase(card) && (
                      <span
                        aria-label="In je vitrine"
                        className="absolute -top-1.5 -right-1.5 grid size-7 place-items-center rounded-full bg-[linear-gradient(135deg,var(--sm-accent),var(--sm-accent-2))] text-on-accent shadow-[0_4px_12px_-4px_var(--sm-accent)]"
                      >
                        <Star size={14} strokeWidth={2.6} aria-hidden />
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </GlassPanel>

          <GoalsPanel
            goals={collection.goals}
            foils={collection.foils}
            foil={collection.foil}
            onFoil={setFoil}
          />
        </div>
      )}

      <CardViewer
        cards={viewer?.cards ?? []}
        index={viewer?.index ?? null}
        onIndexChange={(index) => setViewer((v) => (v && index !== null ? { ...v, index } : null))}
      />
      <ShareSheet request={share} onClose={() => setShare(null)} />
    </>
  );
}
