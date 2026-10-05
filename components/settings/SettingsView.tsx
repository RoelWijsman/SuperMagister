"use client";

import { Moon, Monitor, Plug, Sun } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { LinkButton } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { PageHeader } from "@/components/ui/PageHeader";
import { Switch } from "@/components/ui/Switch";
import { Tabs } from "@/components/ui/Tabs";
import { useIsClient } from "@/lib/hooks";
import type { TimeOfDay } from "@/lib/theme/time-of-day";
import { useSettings, type ColorMode, type MotionPreference } from "@/stores/settings";
import { useUi } from "@/stores/ui";
import { SubjectSettings } from "./SubjectSettings";
import { ThemePicker } from "./ThemePicker";

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <GlassPanel
      as="section"
      id={id}
      aria-labelledby={`${id}-titel`}
      className="scroll-mt-24"
      padding="lg"
    >
      <h2 id={`${id}-titel`} className="font-display text-lg font-semibold tracking-tight text-ink">
        {title}
      </h2>
      {description && <p className="mt-1 mb-5 text-sm text-ink-2">{description}</p>}
      {!description && <div className="mb-4" />}
      {children}
    </GlassPanel>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5 py-2 sm:flex-row sm:items-center sm:justify-between">
      <span className="font-medium text-ink">{label}</span>
      {children}
    </div>
  );
}

const SKY_OPTIONS: { value: TimeOfDay | "auto"; label: string }[] = [
  { value: "auto", label: "Nu" },
  { value: "ochtend", label: "Ochtend" },
  { value: "dag", label: "Dag" },
  { value: "avond", label: "Avond" },
  { value: "nacht", label: "Nacht" },
];

/** Instellingen. Alles wordt lokaal op dit apparaat bewaard. */
export function SettingsView() {
  const isClient = useIsClient();
  const settings = useSettings();
  const preview = useUi((s) => s.timeOfDayPreview);
  const setPreview = useUi((s) => s.setTimeOfDayPreview);

  // De voorvertoning van de hemel geldt alleen zolang je hier bent.
  useEffect(() => () => setPreview(null), [setPreview]);

  // Instellingen komen uit localStorage; pas na hydratie tonen we de echte keuzes.
  if (!isClient) return <PageHeader eyebrow="Alles blijft op dit apparaat" title="Instellingen" />;

  return (
    <>
      <PageHeader eyebrow="Alles blijft op dit apparaat" title="Instellingen" />
      <div className="space-y-5">
        <Section
          id="thema"
          title="Thema"
          description="De hele app kleurt live mee. Later speel je extra thema's vrij met levels."
        >
          <ThemePicker />
        </Section>

        <Section id="weergave" title="Weergave">
          <Field label="Modus">
            <Tabs<ColorMode>
              id="kleurmodus"
              aria-label="Kleurmodus"
              size="sm"
              value={settings.colorMode}
              onValueChange={settings.setColorMode}
              items={[
                { value: "dark", label: "Donker", icon: Moon },
                { value: "light", label: "Licht", icon: Sun },
                { value: "system", label: "Systeem", icon: Monitor },
              ]}
            />
          </Field>
          <Switch
            label="Achtergrond leeft mee met de tijd"
            description="Warm in de ochtend, fris blauw overdag, paars in de avond en sterren in de nacht."
            checked={settings.skyFollowsTime}
            onCheckedChange={(value) => settings.set("skyFollowsTime", value)}
          />
          <Field label="Bekijk de hemel als">
            <Tabs<TimeOfDay | "auto">
              id="hemel"
              aria-label="Voorvertoning tijd van de dag"
              size="sm"
              value={preview ?? "auto"}
              onValueChange={(value) => setPreview(value === "auto" ? null : value)}
              items={SKY_OPTIONS}
              className="no-scrollbar max-w-full overflow-x-auto"
            />
          </Field>
          <Switch
            label="Bewegende achtergrond"
            description="De aurora beweegt langzaam. Zet uit als je apparaat het zwaar heeft."
            checked={settings.ambientMotion}
            onCheckedChange={(value) => settings.set("ambientMotion", value)}
          />
          <Field label="Animaties">
            <Tabs<MotionPreference>
              id="beweging"
              aria-label="Animaties"
              size="sm"
              value={settings.motion}
              onValueChange={settings.setMotion}
              items={[
                { value: "system", label: "Systeem" },
                { value: "reduced", label: "Rustig" },
                { value: "full", label: "Alles" },
              ]}
            />
          </Field>
        </Section>

        <Section
          id="privacy"
          title="Privacy"
          description="Met één tik (of de P-toets) vervaag je al je cijfers."
        >
          <Switch
            label="Privacymodus bij het openen"
            description="Handig als je de app vaak opent waar anderen meekijken."
            checked={settings.privacyAuto}
            onCheckedChange={(value) => settings.set("privacyAuto", value)}
          />
        </Section>

        <Section
          id="vakken"
          title="Vakken"
          description="Elk vak heeft een vaste kleur en een icoon. Tik op een vak om ze aan te passen."
        >
          <SubjectSettings />
        </Section>

        <Section
          id="geluid"
          title="Geluid en trillen"
          description="Alle geluiden worden live gemaakt, zonder geluidsbestanden. Ze komen met de walkout in fase 2."
        >
          <Switch
            label="Geluidjes in de app"
            description="Zachte tikjes bij knoppen en afvinken."
            checked={settings.uiSounds}
            onCheckedChange={(value) => settings.set("uiSounds", value)}
          />
          <Switch
            label="Geluid bij de walkout"
            description="Stadion, whoosh en vuurwerk."
            checked={settings.walkoutSounds}
            onCheckedChange={(value) => settings.set("walkoutSounds", value)}
          />
          <Switch
            label="Trillen"
            description="Bij afvinken, onthullingen en achievements (als je telefoon het kan)."
            checked={settings.haptics}
            onCheckedChange={(value) => settings.set("haptics", value)}
          />
        </Section>

        <Section id="gegevens" title="Gegevens">
          <div className="flex flex-wrap items-center gap-3">
            <Chip tone="warn">Demo</Chip>
            <p className="min-w-0 flex-1 text-ink-2">
              Je bekijkt verzonnen data van Daan uit 5 havo.
            </p>
            <LinkButton href="/koppelen" variant="glass" icon={Plug}>
              Koppelen met Magister
            </LinkButton>
          </div>
        </Section>

        <Section id="over" title="Over SuperMagister">
          <p className="text-sm text-ink-2">
            SuperMagister is een onofficiële app. Hij gebruikt een onofficiële, interne
            Magister-API, is niet verbonden aan Magister of Iddink en is alleen bedoeld voor je
            eigen account.
          </p>
          <p className="mt-3 text-xs text-ink-3">Versie 0.1 · fase 1: het fundament</p>
        </Section>
      </div>
    </>
  );
}
