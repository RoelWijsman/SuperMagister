"use client";

import { Bookmark, ChevronDown, Copy, ExternalLink, Plug, Smartphone, Star } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Kbd } from "@/components/ui/Kbd";
import { useIsApple, useIsClient } from "@/lib/hooks";
import { buildBookmarklet, resolveAppUrl } from "@/lib/koppelen/bookmarklet";
import { toast } from "@/stores/toast";
import { LinkSteps } from "./LinkSteps";

/** De bookmarklet voor het adres waarop de app nu draait (of NEXT_PUBLIC_SITE_URL). */
function useBookmarklet(): string | null {
  const isClient = useIsClient();
  return useMemo(
    () =>
      isClient
        ? buildBookmarklet(resolveAppUrl(process.env.NEXT_PUBLIC_SITE_URL, window.location.origin))
        : null,
    [isClient],
  );
}

/**
 * De knop om naar je bladwijzerbalk te slepen. React laat geen javascript:-links
 * toe in href, dus die zetten we zelf, buiten React om. Klikken doet niets:
 * hij moet in Magister draaien, niet hier.
 */
function BookmarkletButton({ code }: { code: string | null }) {
  const link = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    if (code) link.current?.setAttribute("href", code);
  }, [code]);

  return (
    <a
      ref={link}
      draggable
      onClick={(event) => {
        event.preventDefault();
        toast({
          title: "Sleep me, niet klikken",
          description: "Sleep deze knop naar je bladwijzerbalk. Klikken doe je straks in Magister.",
          emoji: "👆",
        });
      }}
      title="Sleep naar je bladwijzerbalk"
      className="inline-flex h-12 cursor-grab items-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--sm-accent),var(--sm-accent-2))] px-5 text-base font-semibold text-on-accent shadow-[0_12px_30px_-10px_color-mix(in_oklab,var(--sm-accent)_80%,transparent)] outline-offset-4 active:cursor-grabbing"
    >
      <Plug size={18} strokeWidth={2.4} aria-hidden />
      SuperMagister
    </a>
  );
}

function StepNumber({ n }: { n: number }) {
  return (
    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,var(--sm-accent),var(--sm-accent-2))] text-xs font-bold text-on-accent">
      {n}
    </span>
  );
}

function PhoneFrame({ children, caption }: { children: React.ReactNode; caption: string }) {
  return (
    <li className="flex flex-col items-center gap-2 text-center">
      <div className="w-full max-w-44 rounded-[1.6rem] border border-line-strong bg-[color-mix(in_oklab,var(--sm-bg)_75%,transparent)] p-2 shadow-[var(--sm-shadow)]">
        <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-ink-3/40" aria-hidden />
        <div className="space-y-1.5 text-left text-[0.6875rem] leading-tight">{children}</div>
      </div>
      <p className="text-sm text-ink-2">{caption}</p>
    </li>
  );
}

/** Op een telefoon kun je niet slepen: zo maak je de bladwijzer met de hand. */
function PhoneSteps({ onCopy }: { onCopy: () => void }) {
  return (
    <div className="mt-4 space-y-4">
      <ol className="grid gap-4 sm:grid-cols-3">
        <PhoneFrame caption="1. Kopieer de code met de knop hieronder.">
          <div className="rounded-lg bg-glass-strong px-2 py-1.5 font-mono break-all text-ink-3">
            javascript:(function()…
          </div>
          <div className="flex items-center justify-center gap-1 rounded-full bg-accent py-1 font-semibold text-on-accent">
            <Copy size={10} aria-hidden /> Gekopieerd
          </div>
        </PhoneFrame>
        <PhoneFrame caption="2. Maak een bladwijzer (van elke pagina) en zet de code bij het adres.">
          <p className="font-semibold text-ink">Bladwijzer bewerken</p>
          <div className="rounded-lg border border-line px-2 py-1 text-ink-2">
            <span className="block text-[0.5625rem] text-ink-3">Naam</span>SuperMagister
          </div>
          <div className="rounded-lg border border-[color-mix(in_oklab,var(--sm-accent)_55%,transparent)] px-2 py-1 text-ink-2">
            <span className="block text-[0.5625rem] text-ink-3">Adres</span>
            <span className="block truncate font-mono">javascript:(function()…</span>
          </div>
        </PhoneFrame>
        <PhoneFrame caption="3. Open Magister, typ SuperMagister in de adresbalk en tik op de bladwijzer.">
          <div className="truncate rounded-full bg-glass-strong px-2 py-1 text-ink">
            SuperMagister<span className="animate-pulse">|</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-[color-mix(in_oklab,var(--sm-accent)_18%,transparent)] px-2 py-1.5 text-ink">
            <Star size={11} className="fill-warn text-warn" aria-hidden />
            <span className="min-w-0 truncate">
              SuperMagister
              <span className="block text-[0.5625rem] text-ink-3">javascript:(function()…</span>
            </span>
          </div>
        </PhoneFrame>
      </ol>
      <Button variant="glass" size="sm" icon={Copy} onClick={onCopy}>
        Kopieer de code
      </Button>
      <p className="text-sm text-ink-3">
        Werkt het op je telefoon niet? Sommige browsers voeren een bladwijzer met code niet uit
        vanuit de adresbalk. Koppel dan op een computer, of gebruik het plakveld.
      </p>
    </div>
  );
}

export function BookmarkletCard() {
  const code = useBookmarklet();
  const isApple = useIsApple();
  const [phone, setPhone] = useState(false);

  const copy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      toast({
        title: "Code gekopieerd",
        description: "Plak hem als adres van een nieuwe bladwijzer.",
        emoji: "📋",
      });
    } catch {
      toast({
        title: "Kopiëren lukte niet",
        description: "Je browser hield het tegen. Sleep de knop dan naar je bladwijzerbalk.",
      });
    }
  };

  return (
    <GlassPanel as="section" padding="lg" aria-labelledby="bladwijzer-titel" id="bladwijzer">
      <div className="mb-5 flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-glass-strong text-accent-ink">
          <Bookmark size={20} strokeWidth={2.2} aria-hidden />
        </span>
        <div>
          <h3
            id="bladwijzer-titel"
            className="font-display text-lg font-semibold tracking-tight text-ink"
          >
            De bladwijzer
          </h3>
          <p className="text-sm text-ink-2">
            Zo koppel je SuperMagister aan je Magister. Eén keer slepen, daarna is het één klik.
          </p>
        </div>
      </div>

      <LinkSteps />

      <ol className="mt-5 space-y-3">
        <li className="rounded-3xl border border-dashed border-line-strong p-4">
          <p className="mb-3 flex items-center gap-2 font-semibold text-ink">
            <StepNumber n={1} /> Sleep deze knop naar je bladwijzerbalk
          </p>
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <BookmarkletButton code={code} />
            <p className="text-sm text-ink-2">
              Houd de knop vast en laat hem los op de balk bovenin je browser. Zie je die balk niet?
              Druk op <Kbd>{isApple ? "⌘" : "Ctrl"}</Kbd> <Kbd>Shift</Kbd> <Kbd>B</Kbd>.
            </p>
          </div>
        </li>
        <li className="rounded-3xl border border-line p-4">
          <p className="mb-3 flex items-center gap-2 font-semibold text-ink">
            <StepNumber n={2} /> Open Magister en log in
          </p>
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <a
              href="https://accounts.magister.net/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full glass px-5 font-semibold text-ink hover:bg-glass-hover"
            >
              <ExternalLink size={18} strokeWidth={2.2} aria-hidden />
              Open Magister
            </a>
            <p className="text-sm text-ink-2">
              Gewoon zoals altijd, op de site van je eigen school. Je wachtwoord typ je daar, niet
              hier.
            </p>
          </div>
        </li>
        <li className="rounded-3xl border border-line p-4">
          <p className="flex items-center gap-2 font-semibold text-ink">
            <StepNumber n={3} /> Klik in Magister op de bladwijzer
          </p>
          <p className="mt-2 text-sm text-ink-2">
            SuperMagister opent en is gekoppeld. Na ongeveer een uur verloopt de koppeling; dan klik
            je in Magister gewoon nog een keer op de bladwijzer.
          </p>
        </li>
      </ol>

      <details className="mt-4 rounded-3xl border border-line p-4 text-sm text-ink-2">
        <summary className="cursor-pointer font-semibold text-ink">
          Wat doet die bladwijzer precies?
        </summary>
        <ul className="mt-3 list-disc space-y-1.5 pl-5">
          <li>
            Als je bent ingelogd, bewaart Magister in je browser een tijdelijke sleutel (een token).
            De bladwijzer leest die sleutel, op de pagina van je eigen school.
          </li>
          <li>
            Hij opent SuperMagister en geeft de sleutel mee achter het #-teken van het adres. Dat
            deel gaat nooit naar een server; SuperMagister haalt het meteen weg.
          </li>
          <li>
            Met de sleutel haalt SuperMagister je rooster, huiswerk en cijfers op. Alleen lezen: er
            verandert niets in Magister.
          </li>
          <li>Je wachtwoord ziet de bladwijzer nooit, en hij stuurt niets naar andere websites.</li>
        </ul>
      </details>

      <button
        type="button"
        onClick={() => setPhone((value) => !value)}
        aria-expanded={phone}
        className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-accent-ink"
      >
        <Smartphone size={16} aria-hidden />
        Op je telefoon
        <ChevronDown
          size={16}
          aria-hidden
          className={phone ? "rotate-180 transition-transform" : "transition-transform"}
        />
      </button>
      {phone && <PhoneSteps onCopy={copy} />}
    </GlassPanel>
  );
}
