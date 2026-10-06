"use client";

import { House, KeyRound, ShieldCheck, Zap } from "lucide-react";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { useCopyParts } from "@/lib/use-copy";

/*
 * Pagina's die in een latere fase gevuld worden. Ze staan hier als
 * client-componenten omdat de knoppen een icoon-component meekrijgen.
 */

export function AchievementsPlaceholder() {
  const copy = useCopyParts("leeg.prestaties");
  return (
    <GlassPanel padding="lg">
      <EmptyState illustration="trofee" title={copy?.title ?? ""} description={copy?.body} />
    </GlassPanel>
  );
}

const PROMISES = [
  {
    icon: KeyRound,
    title: "Nooit je wachtwoord",
    text: "Je logt gewoon in op Magister zelf. SuperMagister ziet je wachtwoord nooit.",
  },
  {
    icon: Zap,
    title: "Eén klik op een bladwijzer",
    text: "Een bookmarklet haalt je sessie op en geeft hem veilig door via het #-deel van de link.",
  },
  {
    icon: ShieldCheck,
    title: "Alleen lezen",
    text: "De app vraagt alleen gegevens op en slaat niets op een server op.",
  },
];

export function ConnectPlaceholder() {
  const copy = useCopyParts("leeg.koppelen");
  return (
    <GlassPanel padding="lg">
      <EmptyState
        illustration="stekker"
        title={copy?.title ?? ""}
        description={copy?.body}
        action={
          <LinkButton href="/vandaag" variant="glass" icon={House}>
            Terug naar Vandaag
          </LinkButton>
        }
      />
      <ul className="mt-2 grid gap-3 md:grid-cols-3">
        {PROMISES.map(({ icon: Icon, title, text }) => (
          <li key={title} className="rounded-3xl border border-line p-4">
            <Icon size={20} strokeWidth={2.2} aria-hidden className="text-accent-ink" />
            <p className="mt-3 font-semibold text-ink">{title}</p>
            <p className="mt-1 text-sm text-ink-2">{text}</p>
          </li>
        ))}
      </ul>
    </GlassPanel>
  );
}

export function NotFoundContent() {
  const copy = useCopyParts("leeg.404");
  return (
    <GlassPanel padding="lg" className="mt-6 md:mt-12">
      <EmptyState
        illustration="planeet"
        title={copy?.title ?? ""}
        description={copy?.body}
        action={
          <LinkButton href="/vandaag" variant="primary" icon={House}>
            Terug naar Vandaag
          </LinkButton>
        }
      />
    </GlassPanel>
  );
}
