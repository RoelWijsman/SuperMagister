"use client";

import { Moon, Monitor, Palette, Sparkles, Sun } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { Button, LinkButton } from "@/components/ui/Button";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { PageHeader } from "@/components/ui/PageHeader";
import { Switch } from "@/components/ui/Switch";
import { Tabs } from "@/components/ui/Tabs";
import { useWalkoutActions } from "@/components/walkout/useWalkoutActions";
import type { GuessMode } from "@/lib/guess/input";
import { useIsClient } from "@/lib/hooks";
import { notify } from "@/lib/notify";
import { DEVELOPER_TAPS, useDeveloperMode } from "@/lib/use-developer";
import type { TimeOfDay } from "@/lib/theme/time-of-day";
import { useOnboarding } from "@/stores/onboarding";
import {
  useSettings,
  type ColorMode,
  type MotionPreference,
  type WalkoutSpeed,
} from "@/stores/settings";
import { useUi } from "@/stores/ui";
import { Disclaimer } from "@/components/legal/Disclaimer";
import { DataCheck } from "./DataCheck";
import { DataSettings, LinkDevTools } from "./DataSettings";
import { HomeworkSettings } from "./HomeworkSettings";
import { StatsSetting } from "./StatsSetting";
import { SubjectSettings } from "./SubjectSettings";
import { ThemePicker } from "./ThemePicker";
import { TodaySettings } from "./TodaySettings";

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

/**
 * Het versienummer. 7× snel tikken zet de ontwikkelaarsinstellingen aan of
 * uit (in de live versie zijn ze anders verborgen).
 */
function VersionTapper() {
  const taps = useRef({ count: 0, last: 0 });
  return (
    <button
      type="button"
      onClick={() => {
        const now = Date.now();
        const tap = taps.current;
        tap.count = now - tap.last < 1500 ? tap.count + 1 : 1;
        tap.last = now;
        if (tap.count < DEVELOPER_TAPS) return;
        tap.count = 0;
        const on = !useSettings.getState().developer;
        useSettings.getState().set("developer", on);
        notify(on ? "toast.ontwikkelaarAan" : "toast.ontwikkelaarUit", {}, { emoji: "🛠️" });
      }}
      className="mt-3 text-xs text-ink-3 select-none"
    >
      Versie {process.env.NEXT_PUBLIC_APP_VERSION}
    </button>
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

const GUESS_HINT: Record<GuessMode, string> = {
  elke: "Vóór elke onthulling gok je wat je hebt. Bij V, G en O slaan we het over.",
  laatste: "Alleen bij de laatste kaart, en dat is altijd de beste. Grote packs gaan zo sneller.",
  uit: "Geen gokmoment: de kaarten draaien meteen om.",
};

const SPEED_HINT: Record<WalkoutSpeed, string> = {
  normaal: "De hele show, met alles erop en eraan.",
  snel: "Dezelfde show, bijna twee keer zo snel.",
  direct: "Meteen naar de onthulling. Voor als je weinig tijd hebt.",
};

/** De walkout: snelheid, automatisch door en oefenen. */
function WalkoutSettings() {
  const settings = useSettings();
  const { startPractice } = useWalkoutActions();

  return (
    <>
      <Field label="Snelheid">
        <Tabs<WalkoutSpeed>
          id="walkout-snelheid"
          aria-label="Snelheid van de walkout"
          size="sm"
          value={settings.walkoutSpeed}
          onValueChange={(value) => settings.set("walkoutSpeed", value)}
          items={[
            { value: "normaal", label: "Normaal" },
            { value: "snel", label: "Snel" },
            { value: "direct", label: "Direct" },
          ]}
        />
      </Field>
      <p className="-mt-1 mb-2 text-sm text-ink-3">{SPEED_HINT[settings.walkoutSpeed]}</p>
      <Switch
        label="Automatisch door"
        description="Na een paar seconden vanzelf naar de volgende kaart."
        checked={settings.walkoutAuto}
        onCheckedChange={(value) => settings.set("walkoutAuto", value)}
      />
      <Field label="Gokken">
        <Tabs<GuessMode>
          id="gokken"
          aria-label="Bij welke kaarten je gokt"
          size="sm"
          value={settings.guessMode}
          onValueChange={(value) => settings.set("guessMode", value)}
          items={[
            { value: "elke", label: "Elke kaart" },
            { value: "laatste", label: "Alleen de laatste" },
            { value: "uit", label: "Uit" },
          ]}
        />
      </Field>
      <p className="-mt-1 mb-2 text-sm text-ink-3">{GUESS_HINT[settings.guessMode]}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button variant="glass" icon={Sparkles} onClick={() => startPractice()}>
          Oefen een walkout
        </Button>
      </div>
    </>
  );
}

/** Instellingen. Alles wordt lokaal op dit apparaat bewaard. */
export function SettingsView() {
  const isClient = useIsClient();
  const settings = useSettings();
  const preview = useUi((s) => s.timeOfDayPreview);
  const setPreview = useUi((s) => s.setTimeOfDayPreview);
  const developer = useDeveloperMode();

  // De voorvertoning van de hemel geldt alleen zolang je hier bent.
  useEffect(() => () => setPreview(null), [setPreview]);

  // Instellingen komen uit localStorage; pas na hydratie tonen we de echte keuzes.
  if (!isClient) return <PageHeader eyebrow="Alles blijft op dit apparaat" title="Instellingen" />;

  return (
    <>
      <PageHeader eyebrow="Alles blijft op dit apparaat" title="Instellingen" />
      <div className="space-y-5">
        <Section id="thema" title="Thema" description="De hele app kleurt live mee.">
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
          <StatsSetting />
        </Section>

        <Section
          id="vandaag"
          title="Vandaag"
          description="Voor het fietsweer en het aftellen naar de vakantie. Je woonplaats gaat alleen als coördinaten naar Open-Meteo, voor de weersverwachting."
        >
          <TodaySettings />
        </Section>

        <Section
          id="huiswerk"
          title="Huiswerk"
          description="Hoe lang je meestal bezig bent per vak. Geldt voor huiswerk, niet voor leren voor een toets. Bij Schatting haalt de app het uit de opdracht. Per opdracht aanpassen kan op de huiswerkpagina."
        >
          <HomeworkSettings />
        </Section>

        <Section
          id="walkout"
          title="Walkout"
          description="Elk nieuw cijfer komt binnen als verzamelkaart, met een eigen walkout."
        >
          <WalkoutSettings />
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
          description="Alle geluiden worden live gemaakt, zonder geluidsbestanden."
        >
          <Switch
            label="Alles stil"
            description="Zet in één keer al het geluid uit. Kan ook met de luidspreker in de walkout."
            checked={settings.soundMuted}
            onCheckedChange={(value) => settings.set("soundMuted", value)}
          />
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
            description="Bij afvinken en onthullingen (als je telefoon het kan)."
            checked={settings.haptics}
            onCheckedChange={(value) => settings.set("haptics", value)}
          />
        </Section>

        <Section
          id="gegevens"
          title="Gegevens"
          description="Je koppeling met Magister. Alles wat de app ophaalt, blijft op dit apparaat."
        >
          <DataSettings />
        </Section>

        {developer && (
          <Section
            id="ontwikkelaar"
            title="Ontwikkelaar"
            description="Voor wie wil zien hoe de app in elkaar zit."
          >
            <div className="flex flex-wrap items-center gap-3">
              <p className="min-w-[min(100%,14rem)] flex-1 text-ink-2">
                Alle bouwstenen van het design system op één pagina, met de walkout-schuif.
              </p>
              <LinkButton href="/stijlgids" variant="glass" icon={Palette}>
                Stijlgids
              </LinkButton>
            </div>
            <div className="mt-4 border-t border-line pt-2">
              <Switch
                label="Prestaties en XP tonen"
                description="De Prestaties-pagina, prestatiemeldingen en XP bij gokken en afvinken. Uit sinds fase 6 is vervallen."
                checked={settings.gamification}
                onCheckedChange={(value) => settings.set("gamification", value)}
              />
            </div>
            <LinkDevTools />
            <DataCheck />
          </Section>
        )}

        <Section id="over" title="Over SuperMagister">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <p className="min-w-[min(100%,14rem)] flex-1 text-ink-2">
              De uitleg van de eerste keer: thema, woonplaats, koppelen en een pack.
            </p>
            <Button
              variant="glass"
              icon={Sparkles}
              onClick={() => useOnboarding.getState().restart()}
            >
              Onboarding opnieuw bekijken
            </Button>
          </div>
          <Disclaimer className="text-sm" />
          <VersionTapper />
        </Section>
      </div>
    </>
  );
}
