"use client";

import { Check, ExternalLink, Puzzle, RefreshCw, ShieldCheck, Smartphone, Zap } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { cn } from "@/lib/cn";
import { extensionSupport } from "@/lib/extensie/browser";
import { isExtensionStatus } from "@/lib/extensie/protocol";
import { getBridge, useExtension } from "@/lib/extensie/runtime";
import { useIsClient } from "@/lib/hooks";
import { useCopyParts } from "@/lib/use-copy";
import { magisterUrl } from "./RelinkSheet";

/** De extensie in de Chrome Web Store, zodra hij daar staat. */
const STORE_URL = process.env.NEXT_PUBLIC_EXTENSION_URL;

const PERKS = [
  { icon: Zap, text: "Koppelt vanzelf als je Magister opent" },
  { icon: RefreshCw, text: "Vernieuwt zichzelf: nooit meer opnieuw koppelen" },
  { icon: ShieldCheck, text: "Leest alleen; je token blijft in de extensie" },
];

const schoolName = (host: string | null | undefined) => {
  const label = (host ?? "").split(".")[0] ?? "";
  return label ? label.charAt(0).toUpperCase() + label.slice(1) : "je school";
};

const linkClass =
  "inline-flex h-11 shrink-0 items-center gap-2 rounded-full px-5 font-semibold whitespace-nowrap";
const primaryLink = cn(
  linkClass,
  "bg-[linear-gradient(135deg,var(--sm-accent),var(--sm-accent-2))] text-on-accent shadow-[0_10px_28px_-10px_color-mix(in_oklab,var(--sm-accent)_75%,transparent)]",
);
const glassLink = cn(linkClass, "glass text-ink hover:bg-glass-hover");

function Shell({
  icon,
  title,
  chip,
  children,
  action,
  tone = "accent",
}: {
  icon: ReactNode;
  title: string;
  chip?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  tone?: "accent" | "good";
}) {
  return (
    <GlassPanel
      as="section"
      variant="strong"
      padding="lg"
      aria-labelledby="extensie-titel"
      className="relative overflow-hidden"
    >
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute -top-24 -right-16 size-64 rounded-full",
          tone === "good"
            ? "bg-[radial-gradient(circle,color-mix(in_oklab,var(--sm-good)_26%,transparent),transparent_70%)]"
            : "bg-[radial-gradient(circle,color-mix(in_oklab,var(--sm-accent)_30%,transparent),transparent_70%)]",
        )}
      />
      <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "grid size-12 shrink-0 place-items-center rounded-2xl text-on-accent",
              tone === "good"
                ? "bg-good"
                : "bg-[linear-gradient(135deg,var(--sm-accent),var(--sm-accent-2))]",
            )}
          >
            {icon}
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3
                id="extensie-titel"
                className="font-display text-xl font-semibold tracking-tight text-ink"
              >
                {title}
              </h3>
              {chip}
            </div>
            {children}
          </div>
        </div>
        {action && <div className="shrink-0 self-start md:self-center">{action}</div>}
      </div>
    </GlassPanel>
  );
}

function Steps({ steps }: { steps: readonly ReactNode[] }) {
  return (
    <ol className="relative mt-5 grid gap-3 sm:grid-cols-3">
      {steps.map((step, index) => (
        <li
          key={index}
          className="flex gap-3 rounded-3xl border border-line p-3 text-sm text-ink-2"
        >
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-glass-strong text-xs font-bold text-ink">
            {index + 1}
          </span>
          <span>{step}</span>
        </li>
      ))}
    </ol>
  );
}

/** Nog geen extensie, in Chrome of Edge: installeren in drie stappen. */
function Install() {
  const copy = useCopyParts("koppelen.extensie");
  const steps = STORE_URL
    ? [
        <>
          Klik op <strong className="text-ink">Installeer de extensie</strong>.
        </>,
        <>
          Kies <strong className="text-ink">Toevoegen aan Chrome</strong> (of aan Edge).
        </>,
        <>Open Magister en log in. SuperMagister koppelt vanzelf.</>,
      ]
    : [
        <>
          Open <code className="text-ink">chrome://extensions</code> (in Edge:{" "}
          <code className="text-ink">edge://extensions</code>) en zet de{" "}
          <strong className="text-ink">ontwikkelaarsmodus</strong> aan.
        </>,
        <>
          Kies <strong className="text-ink">Uitgepakte extensie laden</strong> en kies de map{" "}
          <code className="text-ink">extension</code> uit SuperMagister.
        </>,
        <>Open Magister en log in. SuperMagister koppelt vanzelf.</>,
      ];
  return (
    <>
      <Shell
        icon={<Puzzle size={24} strokeWidth={2.2} aria-hidden />}
        title="Installeer de extensie"
        chip={!STORE_URL && <Chip tone="accent">Nog niet in de Web Store</Chip>}
        action={
          STORE_URL ? (
            <a href={STORE_URL} target="_blank" rel="noopener noreferrer" className={primaryLink}>
              <Puzzle size={18} strokeWidth={2.2} aria-hidden />
              Installeer de extensie
            </a>
          ) : undefined
        }
      >
        <p className="mt-1 min-h-[1.5em] max-w-prose text-ink-2">
          {copy && (
            <>
              <strong className="font-semibold text-ink">{copy.title}</strong> {copy.body}
            </>
          )}
        </p>
      </Shell>
      <Steps steps={steps} />
      <ul className="mt-4 grid gap-2 px-1 sm:grid-cols-3">
        {PERKS.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-2 text-sm text-ink-2">
            <Icon size={16} aria-hidden className="shrink-0 text-accent-ink" />
            {text}
          </li>
        ))}
      </ul>
    </>
  );
}

/**
 * Bovenaan /koppelen: de extensie, de hoofdmanier van koppelen (fase 5c).
 * Gekoppeld via de extensie, de extensie staat klaar, installeren (Chrome en
 * Edge), of, op een telefoon en in andere browsers, een verwijzing naar de
 * bladwijzer en het plakveld eronder.
 */
export function ExtensionCard() {
  const isClient = useIsClient();
  const present = useExtension((s) => s.present);
  const status = useExtension((s) => s.status);

  if (!isClient || present === null)
    return (
      <Shell icon={<Puzzle size={24} strokeWidth={2.2} aria-hidden />} title="De extensie">
        <p className="mt-1 text-ink-3">Even kijken of hij er is…</p>
      </Shell>
    );

  if (present && status) {
    const openMagister = (
      <a
        href={status.schoolHost ? magisterUrl(status.schoolHost) : "https://accounts.magister.net/"}
        target="_blank"
        rel="noopener noreferrer"
        className={status.linked ? glassLink : primaryLink}
      >
        <ExternalLink size={18} strokeWidth={2.2} aria-hidden />
        Open Magister
      </a>
    );
    if (status.linked)
      return (
        <Shell
          tone="good"
          icon={<Check size={26} strokeWidth={2.6} aria-hidden />}
          title="Gekoppeld via de extensie ✓"
          chip={<Chip tone="good">Actief</Chip>}
        >
          <p className="mt-1 max-w-prose text-ink-2">
            {schoolName(status.schoolHost)} · vernieuwt automatisch. Je hoeft nooit meer opnieuw te
            koppelen, en je token blijft in de extensie.
          </p>
        </Shell>
      );
    if (status.paused)
      return (
        <Shell
          icon={<Puzzle size={24} strokeWidth={2.2} aria-hidden />}
          title="De extensie is ontkoppeld"
          action={
            <Button
              variant="primary"
              icon={RefreshCw}
              onClick={async () => {
                const next = await getBridge()
                  ?.request("hervat")
                  .catch(() => null);
                if (isExtensionStatus(next)) useExtension.setState({ status: next });
              }}
            >
              Weer automatisch koppelen
            </Button>
          }
        >
          <p className="mt-1 max-w-prose text-ink-2">
            Hij koppelt pas weer als jij dat zegt. Daarna: Magister openen en klaar.
          </p>
        </Shell>
      );
    return (
      <Shell
        icon={<Puzzle size={24} strokeWidth={2.2} aria-hidden />}
        title={status.needsLogin ? "Log even opnieuw in bij Magister" : "De extensie staat klaar"}
        action={openMagister}
      >
        <p className="mt-1 max-w-prose text-ink-2">
          {status.needsLogin
            ? "Magister wil je even terugzien. Daarna koppelt de extensie vanzelf."
            : "Open je eigen Magister en log in. Dan koppelt hij vanzelf, en blijft hij gekoppeld."}
        </p>
      </Shell>
    );
  }

  const support = extensionSupport(navigator);
  if (support === "ja") return <Install />;
  return (
    <Shell
      icon={
        support === "telefoon" ? (
          <Smartphone size={24} strokeWidth={2.2} aria-hidden />
        ) : (
          <Puzzle size={24} strokeWidth={2.2} aria-hidden />
        )
      }
      title="De extensie werkt in Chrome en Edge op een computer"
    >
      <p className="mt-1 max-w-prose text-ink-2">
        {support === "telefoon"
          ? "Op je telefoon koppel je met de bladwijzer hieronder."
          : "In deze browser koppel je met de bladwijzer of door te plakken, hieronder."}
      </p>
    </Shell>
  );
}
