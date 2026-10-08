"use client";

import { KeyRound, ServerOff, ShieldCheck } from "lucide-react";
import { Disclaimer } from "@/components/legal/Disclaimer";
import { PageHeader } from "@/components/ui/PageHeader";
import { BookmarkletCard } from "./BookmarkletCard";
import { LinkStatusPanel } from "./LinkStatusPanel";
import { PasteCard } from "./PasteCard";

const PROMISES = [
  {
    icon: KeyRound,
    title: "Nooit je wachtwoord",
    text: "Je logt in op Magister zelf. SuperMagister vraagt en ziet je wachtwoord nooit.",
  },
  {
    icon: ShieldCheck,
    title: "Alleen lezen",
    text: "De app vraagt alleen gegevens op. Hij kan niets veranderen in Magister.",
  },
  {
    icon: ServerOff,
    title: "Niets op een server",
    text: "Je gegevens blijven op dit apparaat. Je sessie zelfs alleen in dit tabblad.",
  },
];

function SectionTitle({ children, hint }: { children: string; hint: string }) {
  return (
    <div className="mb-3 px-1">
      <h2 className="font-display text-lg font-semibold tracking-tight text-ink">{children}</h2>
      <p className="text-sm text-ink-3">{hint}</p>
    </div>
  );
}

/**
 * /koppelen: de bladwijzer is de manier om te koppelen; het plakveld is de
 * reserve als die niet werkt. Beide eindigen op dezelfde plek: lib/koppelen/link.ts.
 */
export function ConnectView() {
  return (
    <>
      <PageHeader
        eyebrow="Je eigen Magister"
        title="Koppelen met Magister"
        subtitle="Zonder wachtwoord. Je logt in bij Magister zelf; SuperMagister krijgt alleen een tijdelijke sleutel."
      />
      <div className="space-y-8">
        <LinkStatusPanel />

        <section>
          <SectionTitle hint="Drie stappen, één keer instellen.">Zo koppel je</SectionTitle>
          <BookmarkletCard />
        </section>

        <section>
          <SectionTitle hint="Bijvoorbeeld op een schoolcomputer die bladwijzers blokkeert.">
            Lukt het niet met de bladwijzer?
          </SectionTitle>
          <PasteCard />
        </section>

        <section aria-label="Wat je van ons mag verwachten">
          <ul className="grid gap-3 md:grid-cols-3">
            {PROMISES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="rounded-3xl border border-line p-4">
                <Icon size={20} strokeWidth={2.2} aria-hidden className="text-accent-ink" />
                <p className="mt-3 font-semibold text-ink">{title}</p>
                <p className="mt-1 text-sm text-ink-2">{text}</p>
              </li>
            ))}
          </ul>
          <Disclaimer className="mt-4 px-1" />
        </section>
      </div>
    </>
  );
}
