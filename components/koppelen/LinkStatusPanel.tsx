"use client";

import { CircleAlert, House, PackageOpen, Plug, Settings } from "lucide-react";
import { Button, LinkButton } from "@/components/ui/Button";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { LoadingQuip } from "@/components/ui/LoadingQuip";
import { useWalkoutActions } from "@/components/walkout/useWalkoutActions";
import { useLinkFlow, type LinkFailure } from "@/lib/koppelen/link";
import { useCopy } from "@/lib/use-copy";
import { useConnection } from "@/stores/connection";
import { ConnectionFacts } from "./ConnectionFacts";

const FAILURES: Record<LinkFailure, string> = {
  token: "De link van de bladwijzer was niet compleet. Probeer het nog een keer vanuit Magister.",
  school: "Die link kwam niet van een Magister-school. We hebben hem genegeerd.",
  verlopen:
    "Magister accepteerde de sessie niet (meer). Ververs Magister (F5), log in als dat nodig is en probeer het nog een keer.",
  "geen-toegang": "Magister geeft geen toegang tot je gegevens. Werkt Magister zelf wel?",
  netwerk: "Geen verbinding met Magister. Check je internet en probeer het nog een keer.",
  server: "Magister doet even moeilijk. Probeer het over een paar minuten nog een keer.",
  "te-vaak": "Even te veel verzoeken. Wacht een minuutje en probeer het dan nog een keer.",
  onbekend: "Er ging iets mis dat we niet kennen. Probeer het nog een keer.",
};

function Success({ isNew, name, school }: { isNew: boolean; name: string; school: string }) {
  const title = useCopy("koppelen.gelukt", { naam: name, school });
  const { openPack, packCount, isLoading } = useWalkoutActions();
  return (
    <GlassPanel variant="strong" padding="lg" aria-live="polite">
      <p className="text-sm font-semibold tracking-[0.12em] text-good uppercase">Gekoppeld</p>
      <h2 className="mt-1 min-h-[1.3em] font-display text-2xl font-semibold tracking-tight text-ink">
        {title}
      </h2>
      <p className="mt-2 max-w-prose text-ink-2">
        {isNew
          ? "Alles wat er al in Magister stond, zit in je collectie. Je laatste cijfers liggen klaar in je welkomstpack. Nieuwe cijfers worden vanaf nu vanzelf een pack."
          : "Je koppeling is vernieuwd. Alles wordt bijgewerkt."}
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        {isNew && !isLoading && packCount > 0 && (
          <Button variant="primary" icon={PackageOpen} onClick={openPack}>
            Open je welkomstpack ({packCount})
          </Button>
        )}
        <LinkButton
          href="/vandaag"
          variant={isNew && packCount > 0 ? "glass" : "primary"}
          icon={House}
        >
          Naar Vandaag
        </LinkButton>
      </div>
    </GlassPanel>
  );
}

function Linked({ school, name }: { school: string; name: string }) {
  return (
    <GlassPanel padding="lg">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold tracking-[0.12em] text-ink-3 uppercase">Gekoppeld</p>
          <h2 className="mt-1 font-display text-xl font-semibold tracking-tight text-ink">
            {school} · {name}
          </h2>
        </div>
        <LinkButton href="/instellingen#gegevens" variant="ghost" size="sm" icon={Settings}>
          Instellingen
        </LinkButton>
      </div>
      <ConnectionFacts className="mt-4" />
      <p className="mt-4 text-sm text-ink-3">
        Opnieuw koppelen gaat op dezelfde manier als de eerste keer. Je collectie en je voortgang
        blijven gewoon staan.
      </p>
    </GlassPanel>
  );
}

/** Bovenaan /koppelen: bezig, gelukt (met het welkomstpack), mislukt, of al gekoppeld. */
export function LinkStatusPanel() {
  const flow = useLinkFlow();
  const account = useConnection((s) => s.account);
  const failTitle = useCopy(flow.status === "fout" ? "koppelen.fout" : null);

  if (flow.status === "bezig") {
    return (
      <GlassPanel padding="lg" aria-live="polite" className="flex items-center gap-3">
        <Plug size={20} aria-hidden className="shrink-0 animate-pulse text-accent-ink" />
        <div>
          <p className="font-semibold text-ink">Koppelen…</p>
          <LoadingQuip className="text-ink-2" />
        </div>
      </GlassPanel>
    );
  }
  if (flow.status === "gelukt" && flow.result) {
    return (
      <Success isNew={flow.result.isNew} name={flow.result.firstName} school={flow.result.school} />
    );
  }
  if (flow.status === "fout" && flow.failure) {
    return (
      <GlassPanel
        padding="lg"
        role="alert"
        className="border-[color-mix(in_oklab,var(--sm-bad)_40%,transparent)]"
      >
        <div className="flex items-start gap-3">
          <CircleAlert size={22} aria-hidden className="mt-0.5 shrink-0 text-bad" />
          <div>
            <h2 className="min-h-[1.3em] font-display text-lg font-semibold text-ink">
              {failTitle}
            </h2>
            <p className="mt-1 text-ink-2">{FAILURES[flow.failure]}</p>
          </div>
        </div>
      </GlassPanel>
    );
  }
  if (account) return <Linked school={capitalize(account.schoolHost)} name={account.name} />;
  return null;
}

const capitalize = (host: string) => {
  const label = host.split(".")[0] ?? host;
  return label.charAt(0).toUpperCase() + label.slice(1);
};
