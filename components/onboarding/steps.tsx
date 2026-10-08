"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ChevronDown, Search, Shield } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { CardCanvas } from "@/components/cards/CardCanvas";
import { BookmarkletCard } from "@/components/koppelen/BookmarkletCard";
import { PasteCard } from "@/components/koppelen/PasteCard";
import { PlaceSearch } from "@/components/settings/TodaySettings";
import { ThemePicker } from "@/components/settings/ThemePicker";
import { Kbd } from "@/components/ui/Kbd";
import { Tabs } from "@/components/ui/Tabs";
import type { CopyKey } from "@/content/copy";
import { useCards } from "@/lib/data/cards";
import { useIsApple, useMediaQuery } from "@/lib/hooks";
import type { HolidayRegion } from "@/lib/school/holidays";
import { useCopy } from "@/lib/use-copy";
import { useConnection } from "@/stores/connection";
import { useSettings } from "@/stores/settings";
import { MiniDay } from "./MiniDay";
import { MiniWalkout } from "./MiniWalkout";

/** Kop van een stap: klein label, grote titel en een droge regel (humorbijbel). */
export function StepHeading({
  eyebrow,
  title,
  copyKey,
  children,
}: {
  eyebrow?: string;
  title: string;
  copyKey?: CopyKey;
  children?: ReactNode;
}) {
  const line = useCopy(copyKey);
  const heading = useRef<HTMLHeadingElement>(null);
  // Bij een nieuwe stap de focus op de titel, zodat een schermlezer hem voorleest.
  useEffect(() => heading.current?.focus({ preventScroll: true }), []);
  return (
    <header className="mb-6 text-center">
      {eyebrow && (
        <p className="mb-2 text-sm font-semibold tracking-[0.14em] text-accent-ink uppercase">
          {eyebrow}
        </p>
      )}
      <h2
        ref={heading}
        tabIndex={-1}
        className="font-display text-[clamp(1.6rem,1.2rem+2vw,2.4rem)] leading-tight font-semibold tracking-[-0.03em] text-ink outline-none"
      >
        {title}
      </h2>
      {copyKey && <p className="mx-auto mt-3 min-h-[1.5em] max-w-md text-ink-2">{line}</p>}
      {children}
    </header>
  );
}

const EXPLAINERS = {
  pack: { title: "Je cijfers openen als een FIFA-pack", copyKey: "onboarding.pack", index: 1 },
  gok: { title: "Gok eerst wat je hebt", copyKey: "onboarding.gok", index: 2 },
  overzicht: {
    title: "Rooster en huiswerk in één oogopslag",
    copyKey: "onboarding.overzicht",
    index: 3,
  },
} as const satisfies Record<string, { title: string; copyKey: CopyKey; index: number }>;

/** Stap 2: wat is dit? Drie korte kaarten met een mini-animatie. */
export function ExplainerStep({ kind }: { kind: keyof typeof EXPLAINERS }) {
  const { title, copyKey, index } = EXPLAINERS[kind];
  return (
    <div className="mx-auto w-full max-w-lg">
      <StepHeading eyebrow={`Wat is dit? ${index}/3`} title={title} copyKey={copyKey} />
      <div className="rounded-[2rem] border border-line bg-glass p-2 shadow-[var(--sm-shadow)]">
        {kind === "overzicht" ? <MiniDay active /> : <MiniWalkout variant={kind} active />}
      </div>
    </div>
  );
}

/** Stap 3: kies je thema; de app kleurt live mee. */
export function ThemeStep() {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <StepHeading eyebrow="Jouw stijl" title="Kies je thema" copyKey="onboarding.thema" />
      <ThemePicker />
    </div>
  );
}

/** Stap 4: waar woon je? Voor het fietsweer en de vakantieregio. */
export function PlaceStep() {
  const region = useSettings((s) => s.holidayRegion);
  const set = useSettings((s) => s.set);
  return (
    <div className="mx-auto w-full max-w-md">
      <StepHeading eyebrow="Optioneel" title="Waar woon je?" copyKey="onboarding.woonplaats" />
      <div className="rounded-3xl border border-line bg-glass p-4">
        <PlaceSearch />
        <div className="mt-3 border-t border-line pt-4">
          <p className="font-medium text-ink">Vakantieregio</p>
          <p className="mt-0.5 mb-3 text-sm text-ink-2">
            Staat op de site van je school. Weet je het niet? Midden is een goede gok.
          </p>
          <Tabs<HolidayRegion>
            id="onboarding-regio"
            aria-label="Regio voor schoolvakanties"
            value={region}
            onValueChange={(value) => set("holidayRegion", value)}
            items={[
              { value: "noord", label: "Noord" },
              { value: "midden", label: "Midden" },
              { value: "zuid", label: "Zuid" },
            ]}
          />
        </div>
      </div>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-ink-3">
        <Search size={12} aria-hidden /> Je plaats gaat alleen als coördinaten naar Open-Meteo, voor
        het weer.
      </p>
    </div>
  );
}

/** Stap 5: koppelen met de bladwijzer. Gaat vanzelf verder zodra je gekoppeld bent. */
export function LinkStep({ onLinked }: { onLinked: () => void }) {
  const account = useConnection((s) => s.account);
  const [startLinkedAt] = useState(() => useConnection.getState().account?.linkedAt ?? null);
  const [paste, setPaste] = useState(false);

  // Nieuw gekoppeld (hier, of in het tabblad dat de bladwijzer opende)? Even laten zien, dan door.
  const justLinked = account !== null && account.linkedAt !== startLinkedAt;
  useEffect(() => {
    if (!justLinked) return;
    const timer = setTimeout(onLinked, 1400);
    return () => clearTimeout(timer);
  }, [justLinked, onLinked]);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <StepHeading
        eyebrow="Je eigen Magister"
        title="Koppel je Magister"
        copyKey="onboarding.koppelen"
      >
        {account ? (
          <p className="mt-3 font-semibold text-good">
            {justLinked
              ? "Gekoppeld. Even je pack klaarzetten…"
              : `Je bent al gekoppeld als ${account.name}.`}
          </p>
        ) : (
          <p className="mx-auto mt-3 max-w-lg text-sm text-ink-3">
            Je koppelt met een bladwijzer: een knopje in je browser dat je één keer neerzet. Klik je
            erop terwijl je in Magister bent, dan geeft hij SuperMagister een tijdelijke sleutel.
            Daarna gaat deze uitleg vanzelf verder.
          </p>
        )}
      </StepHeading>
      <BookmarkletCard />
      <button
        type="button"
        onClick={() => setPaste((open) => !open)}
        aria-expanded={paste}
        className="mx-auto mt-5 flex items-center gap-2 text-sm font-semibold text-accent-ink"
      >
        Lukt het niet? Koppel door te plakken
        <ChevronDown
          size={16}
          aria-hidden
          className={paste ? "rotate-180 transition-transform" : "transition-transform"}
        />
      </button>
      {paste && (
        <div className="mt-4">
          <PasteCard />
        </div>
      )}
      <p className="mt-6 flex items-start justify-center gap-2 text-center text-sm text-ink-3">
        <Shield size={15} aria-hidden className="mt-0.5 shrink-0" />
        SuperMagister is onofficieel. Je gegevens blijven op je eigen apparaat.
      </p>
    </div>
  );
}

/** Stap 6: het welkomstpack. De walkout is de afsluiter. */
export function FirstPackStep() {
  const cards = useCards();
  const reduced = useReducedMotion() ?? false;
  const first = cards.pack.at(-1) ?? cards.all[0] ?? null;
  const count = cards.pack.length;

  return (
    <div className="mx-auto w-full max-w-md text-center">
      <StepHeading
        eyebrow="Je welkomstpack"
        title={
          count > 0
            ? `${count} ${count === 1 ? "kaart ligt" : "kaarten liggen"} klaar`
            : "Tijd voor een walkout"
        }
        copyKey="onboarding.eerstePack"
      />
      <motion.div
        className="mx-auto w-fit"
        animate={reduced ? undefined : { y: [0, -8, 0], rotate: [-2, 2, -2] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="rounded-[1.4rem] shadow-[0_0_60px_-6px_color-mix(in_oklab,var(--sm-accent)_75%,transparent)]">
          {first ? (
            <CardCanvas card={first} width={180} side="back" />
          ) : (
            <div className="h-[259px] w-[180px] animate-pulse rounded-[1.4rem] bg-glass-strong" />
          )}
        </div>
      </motion.div>
      <p className="mt-6 text-sm text-ink-3">
        Je laatste cijfers uit Magister. Alles van daarvoor staat al in je collectie.
      </p>
    </div>
  );
}

/** Stap 7: klaar, met een paar tips. */
export function DoneStep() {
  const isApple = useIsApple();
  const touch = useMediaQuery("(pointer: coarse)");
  const tips = touch
    ? [
        { keys: ["Veeg"], text: "In het rooster veeg je door de dagen." },
        { keys: ["Meer"], text: "Daar staan je collectie, instellingen en de privacymodus." },
        {
          keys: ["Chip"],
          text: "Bovenin zie je met welke school je gekoppeld bent en hoe lang nog.",
        },
      ]
    : [
        {
          keys: [isApple ? "⌘" : "Ctrl", "K"],
          text: 'Zoeken, en alles in één keer: "wat moet ik halen voor wiskunde".',
        },
        { keys: ["P"], text: "Privacymodus: je cijfers vervagen, voor als iemand meekijkt." },
        { keys: ["?"], text: "Alle sneltoetsen op een rij." },
      ];
  return (
    <div className="mx-auto w-full max-w-md">
      <StepHeading eyebrow="Klaar" title="Je bent er klaar voor" copyKey="onboarding.klaar" />
      <ul className="space-y-3">
        {tips.map((tip) => (
          <li
            key={tip.text}
            className="flex items-center gap-3 rounded-3xl border border-line bg-glass p-4"
          >
            <span className="flex shrink-0 gap-1">
              {tip.keys.map((key) => (
                <Kbd key={key}>{key}</Kbd>
              ))}
            </span>
            <span className="text-ink-2">{tip.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
