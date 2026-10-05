"use client";

import { ArrowRight, Bell, Heart, Plus, Sparkles } from "lucide-react";
import { useState, type ReactNode } from "react";
import { GradeValue } from "@/components/grades/GradeValue";
import { SubjectBadge } from "@/components/subjects/SubjectBadge";
import { SubjectIcon } from "@/components/subjects/SubjectIcon";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Illustration, type IllustrationName } from "@/components/ui/illustrations";
import { Kbd } from "@/components/ui/Kbd";
import { LoadingQuip } from "@/components/ui/LoadingQuip";
import { PageHeader } from "@/components/ui/PageHeader";
import { Sheet } from "@/components/ui/Sheet";
import { Skeleton, SkeletonText } from "@/components/ui/Skeleton";
import { Switch } from "@/components/ui/Switch";
import { Tabs } from "@/components/ui/Tabs";
import { Tilt } from "@/components/ui/Tilt";
import { SUBJECT_ICON_NAMES } from "@/lib/subjects/icons";
import { SUBJECT_PALETTE } from "@/lib/subjects/palette";
import { toast } from "@/stores/toast";

function Block({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <GlassPanel as="section" padding="lg">
      <h2 className="font-display text-lg font-semibold tracking-tight">{title}</h2>
      {note && <p className="mt-1 text-sm text-ink-2">{note}</p>}
      <div className="mt-5">{children}</div>
    </GlassPanel>
  );
}

const TOKENS = [
  ["accent", "var(--sm-accent)"],
  ["accent-2", "var(--sm-accent-2)"],
  ["ink", "var(--sm-ink)"],
  ["ink-2", "var(--sm-ink-2)"],
  ["ink-3", "var(--sm-ink-3)"],
  ["good", "var(--sm-good)"],
  ["warn", "var(--sm-warn)"],
  ["bad", "var(--sm-bad)"],
] as const;

const ILLUSTRATIONS: IllustrationName[] = [
  "bank",
  "kaarten",
  "trofee",
  "zoeken",
  "stekker",
  "planeet",
];

/** Alle bouwstenen van het design system op één pagina. */
export function StyleguideView() {
  const [tab, setTab] = useState<"dag" | "week" | "lijst">("week");
  const [on, setOn] = useState(true);
  const [sheet, setSheet] = useState(false);

  return (
    <>
      <PageHeader
        eyebrow="Design system"
        title="Stijlgids"
        subtitle="Alles op deze pagina volgt het gekozen thema. Wissel van thema met Ctrl/⌘ K en kijk mee."
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Block
          title="Kleuren"
          note="Semantische tokens; ze wisselen mee met thema en licht/donker."
        >
          <ul className="grid grid-cols-4 gap-3">
            {TOKENS.map(([name, value]) => (
              <li key={name} className="text-center">
                <span
                  className="mx-auto block size-12 rounded-2xl shadow-[inset_0_0_0_1px_var(--sm-line)]"
                  style={{ background: value }}
                />
                <span className="mt-1.5 block text-xs text-ink-2">{name}</span>
              </li>
            ))}
          </ul>
        </Block>

        <Block
          title="Typografie"
          note="Unbounded voor koppen en grote getallen, Inter voor tekst. Cijfers altijd tabular."
        >
          <p className="font-display text-5xl leading-none font-semibold tracking-tight">7,8</p>
          <p className="mt-3 font-display text-2xl font-semibold tracking-tight">
            Goeiemorgen Daan ☀️
          </p>
          <p className="mt-2 text-ink-2">Pittige dag: 7 uur en een toets. Jij kan dit.</p>
          <p className="mt-2 text-sm text-ink-3 tabular-nums">
            08:30 · 09:20 · 10:30 · 11:20 · 12:40
          </p>
        </Block>

        <Block title="Knoppen" note="Ze veren licht in als je ze indrukt.">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" icon={Sparkles}>
              Open je pack
            </Button>
            <Button variant="glass" iconRight={ArrowRight}>
              Verder
            </Button>
            <Button variant="ghost">Annuleren</Button>
            <Button variant="danger">Verwijderen</Button>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button variant="primary" size="sm">
              Klein
            </Button>
            <Button variant="primary" size="lg">
              Groot
            </Button>
            <Button variant="glass" size="icon" icon={Plus} aria-label="Toevoegen" />
            <Button variant="ghost" size="icon-sm" icon={Heart} aria-label="Leuk" />
            <Button variant="glass" disabled>
              Uit
            </Button>
          </div>
        </Block>

        <Block title="Labels en toetsen">
          <div className="flex flex-wrap gap-2">
            <Chip>Neutraal</Chip>
            <Chip tone="accent">📝 Toets</Chip>
            <Chip tone="good">Af</Chip>
            <Chip tone="warn">B12 → A04</Chip>
            <Chip tone="bad">Uitval</Chip>
          </div>
          <p className="mt-4 text-sm leading-7 text-ink-2">
            <Kbd>Ctrl</Kbd> <Kbd>K</Kbd> opent de command palette, <Kbd>P</Kbd> de privacymodus en{" "}
            <Kbd>?</Kbd> het overzicht van alle sneltoetsen.
          </p>
        </Block>

        <Block title="Glas" note="Drie sterktes: standaard, sterk en subtiel.">
          <div className="grid grid-cols-3 gap-3">
            <GlassPanel padding="sm" className="text-center text-sm">
              Standaard
            </GlassPanel>
            <GlassPanel variant="strong" padding="sm" className="text-center text-sm">
              Sterk
            </GlassPanel>
            <GlassPanel variant="subtle" padding="sm" className="text-center text-sm">
              Subtiel
            </GlassPanel>
          </div>
          <Tilt className="mt-4">
            <GlassPanel variant="strong" className="text-center">
              <p className="font-semibold">Beweeg je muis over deze kaart</p>
              <p className="text-sm text-ink-2">Kaarten kantelen subtiel mee.</p>
            </GlassPanel>
          </Tilt>
        </Block>

        <Block title="Keuzes" note="Tabs met een verend bolletje en een schakelaar.">
          <Tabs
            id="stijlgids"
            aria-label="Voorbeeld"
            value={tab}
            onValueChange={setTab}
            items={[
              { value: "dag", label: "Dag" },
              { value: "week", label: "Week" },
              { value: "lijst", label: "Lijst" },
            ]}
          />
          <Switch
            className="mt-3"
            label="Meldingen"
            description="Een voorbeeldschakelaar."
            checked={on}
            onCheckedChange={setOn}
          />
        </Block>

        <Block
          title="Toasts en sheets"
          note="Toasts vliegen zacht in en glijden weg; een sheet is een bottom sheet op mobiel."
        >
          <div className="flex flex-wrap gap-3">
            <Button
              variant="glass"
              icon={Bell}
              onClick={() =>
                toast({
                  emoji: "🎁",
                  title: "Er staat een pack voor je klaar",
                  description: "3 nieuwe cijfers.",
                })
              }
            >
              Toast
            </Button>
            <Button
              variant="glass"
              onClick={() => toast({ tone: "success", emoji: "✅", title: "Huiswerk afgevinkt" })}
            >
              Succes
            </Button>
            <Button
              variant="glass"
              onClick={() =>
                toast({
                  tone: "warning",
                  emoji: "📍",
                  title: "Lokaalwijziging",
                  description: "Di 3e uur: B12 → A04",
                })
              }
            >
              Waarschuwing
            </Button>
            <Button variant="primary" onClick={() => setSheet(true)}>
              Open sheet
            </Button>
          </div>
          <Sheet
            open={sheet}
            onClose={() => setSheet(false)}
            title="Een sheet"
            description="Veeg omlaag op je telefoon, of druk op Esc."
          >
            <p className="text-ink-2">
              Sheets worden gebruikt voor details, zoals de stof van een toets of het aanpassen van
              een vak.
            </p>
            <Button variant="primary" className="mt-5 w-full" onClick={() => setSheet(false)}>
              Klaar
            </Button>
          </Sheet>
        </Block>

        <Block
          title="Laden"
          note="Skeletons in de vorm van de echte inhoud, met een grappige tekst."
        >
          <div className="flex items-center gap-3">
            <Skeleton className="size-12 rounded-2xl" />
            <SkeletonText className="flex-1" lines={2} />
          </div>
          <LoadingQuip topic="cijfers" className="mt-4" />
        </Block>

        <Block
          title="Cijfers"
          note="Rood onder 5,5, oranje tot 6,5, groen daarboven. Vervaagd in de privacymodus."
        >
          <div className="flex flex-wrap items-baseline gap-6">
            {[4.8, 5.5, 6.4, 7.8, 9.7].map((value) => (
              <GradeValue
                key={value}
                value={value}
                className="font-display text-4xl font-semibold"
              />
            ))}
          </div>
        </Block>

        <Block
          title="Vakkleuren"
          note="16 kleuren. Elk vak krijgt er automatisch één, op basis van de vakcode."
        >
          <ul className="grid grid-cols-4 gap-3 sm:grid-cols-8">
            {SUBJECT_PALETTE.map((color) => (
              <li key={color.hex} className="text-center">
                <span
                  className="mx-auto block size-9 rounded-full shadow-[0_0_14px_-2px_var(--c)]"
                  style={{ background: color.hex, "--c": color.hex } as React.CSSProperties}
                />
                <span className="mt-1 block text-[0.6875rem] text-ink-3">{color.name}</span>
              </li>
            ))}
          </ul>
        </Block>
      </div>

      <div className="mt-5 grid gap-5">
        <Block
          title="Vakiconen"
          note="Wiskunde krijgt een sigma, Frans een croissant, Grieks een amfoor."
        >
          <ul className="grid grid-cols-6 gap-2 sm:grid-cols-10 lg:grid-cols-14">
            {SUBJECT_ICON_NAMES.map((name, i) => (
              <li key={name} title={name}>
                <SubjectBadge
                  subject={{
                    name,
                    icon: name,
                    color: SUBJECT_PALETTE[i % SUBJECT_PALETTE.length]!.hex,
                  }}
                  className="mx-auto"
                />
              </li>
            ))}
          </ul>
          <p className="mt-4 flex items-center gap-2 text-sm text-ink-3">
            <SubjectIcon name="Sigma" size={16} /> Iconen komen van Lucide.
          </p>
        </Block>

        <Block title="Lege staten" note="Altijd met een illustratie en een knipoog.">
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {ILLUSTRATIONS.map((name) => (
              <li key={name} className="rounded-3xl border border-line p-3 text-center">
                <Illustration name={name} className="mx-auto w-full text-ink-3" />
                <span className="mt-1 block text-xs text-ink-3">{name}</span>
              </li>
            ))}
          </ul>
        </Block>
      </div>
    </>
  );
}
