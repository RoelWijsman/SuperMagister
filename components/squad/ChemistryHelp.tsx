"use client";

import { Sheet } from "@/components/ui/Sheet";
import { LINK_COLORS, LINK_LABELS } from "./Pitch";

const LINE_STYLE = {
  groen: undefined,
  oranje: "5 3",
  rood: "1.5 3.5",
} as const;

function LinkSwatch({ strength }: { strength: keyof typeof LINK_COLORS }) {
  return (
    <svg aria-hidden width="34" height="8" className="shrink-0">
      <line
        x1="2"
        y1="4"
        x2="32"
        y2="4"
        stroke={LINK_COLORS[strength]}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={LINE_STYLE[strength]}
      />
    </svg>
  );
}

/** "Hoe werkt chemie?" in gewone taal, met een voorbeeld. */
export function ChemistryHelp({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="Hoe werkt chemie?" size="md">
      <div className="space-y-5 text-ink-2 [&_h3]:mb-2 [&_h3]:font-semibold [&_h3]:text-ink [&_li]:mt-1.5">
        <section>
          <h3>De lijnen</h3>
          <p>
            Tussen spelers die naast elkaar staan loopt een lijn. De kleur zegt hoe goed ze samen
            zijn:
          </p>
          <ul>
            <li className="flex items-center gap-2.5">
              <LinkSwatch strength="groen" />
              <span>
                <strong className="text-ink">Groen ({LINK_LABELS.groen})</strong>: zelfde vakgroep,
                bijvoorbeeld twee exacte vakken.
              </span>
            </li>
            <li className="flex items-center gap-2.5">
              <LinkSwatch strength="oranje" />
              <span>
                <strong className="text-ink">Oranje ({LINK_LABELS.oranje})</strong>: andere
                vakgroep, maar uit dezelfde periode, of allebei hetzelfde soort toets (bijvoorbeeld
                twee SO&apos;s).
              </span>
            </li>
            <li className="flex items-center gap-2.5">
              <LinkSwatch strength="rood" />
              <span>
                <strong className="text-ink">Rood ({LINK_LABELS.rood})</strong>: niets gemeen.
              </span>
            </li>
          </ul>
          <p className="mt-2">
            Een ICON-kaart heeft met iedereen minstens oranje. Zo gaat dat met legendes.
          </p>
        </section>

        <section>
          <h3>Waar hoort een vak?</h3>
          <ul className="list-disc pl-5">
            <li>Exact (wiskunde, natuurkunde, …): de aanval.</li>
            <li>Talen: het middenveld.</li>
            <li>Mens &amp; Maatschappij (geschiedenis, economie, …): de verdediging.</li>
            <li>LO: op doel. De enige die officieel mag duiken.</li>
            <li>Kunst en overige vakken: overal, behalve op doel, met een kleine straf.</li>
          </ul>
          <p className="mt-2">
            Je school doet het anders? Pas het per vak aan bij Instellingen → Vakken.
          </p>
        </section>

        <section>
          <h3>Spelerschemie (0–10)</h3>
          <ul className="list-disc pl-5">
            <li>Op je natuurlijke plek: 4 punten, plus tot 6 punten voor de lijnen.</li>
            <li>Flexibel (kunst en overig): één punt minder, dus hooguit 9.</li>
            <li>In de verkeerde linie: hooguit 5.</li>
            <li>Een keeper op het veld, of een veldspeler op doel: altijd 0.</li>
            <li>De aanvoerder (de band met de C) krijgt er 1 bij, tot 10.</li>
          </ul>
          <p className="mt-2">
            De lijnen tellen als gemiddelde: groen 10, oranje 5, rood 0. Een lege buurplek telt niet
            mee.
          </p>
        </section>

        <section>
          <h3>Teamchemie en rating</h3>
          <p>
            Teamchemie is de spelerschemie van je elf spelers bij elkaar, op 100 gezet (elf keer een
            10 is 100). De squad-rating is het gemiddelde van de ratings op het veld. De bank telt
            nergens mee.
          </p>
        </section>

        <section className="rounded-2xl border border-line p-4">
          <h3>Voorbeeld</h3>
          <p>
            Wiskunde staat in de spits. Naast hem staan natuurkunde en biologie (allebei exact:
            groen), achter hem Engels (talen, en geen gedeelde periode of toetssoort: rood).
          </p>
          <p className="mt-2 tabular-nums">
            Lijnen: (10 + 10 + 0) / 3 = 6,7. Chemie: 4 + 0,6 × 6,7 = 8. Met de aanvoerdersband: 9.
          </p>
        </section>
      </div>
    </Sheet>
  );
}
