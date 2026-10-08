import { HardDrive, KeyRound, Server, ShieldCheck, Trash2, Wifi } from "lucide-react";
import type { ReactNode } from "react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { PageHeader } from "@/components/ui/PageHeader";
import { Disclaimer } from "./Disclaimer";

function Part({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof HardDrive;
  title: string;
  children: ReactNode;
}) {
  return (
    <GlassPanel as="section" padding="lg">
      <h2 className="flex items-center gap-2.5 font-display text-lg font-semibold tracking-tight text-ink">
        <Icon size={20} strokeWidth={2.2} aria-hidden className="text-accent-ink" />
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-ink-2 [&_li]:mt-1.5 [&_ul]:list-disc [&_ul]:pl-5">
        {children}
      </div>
    </GlassPanel>
  );
}

/** /privacy: in gewone taal wat er met je gegevens gebeurt. */
export function PrivacyView() {
  return (
    <>
      <PageHeader
        eyebrow="Privacy"
        title="Je gegevens blijven van jou"
        subtitle="Kort gezegd: alles staat op je eigen apparaat. SuperMagister heeft geen database, geen accounts en geen tracking."
      />
      <div className="mx-auto max-w-3xl space-y-4">
        <Part icon={KeyRound} title="Je wachtwoord">
          <p>
            SuperMagister vraagt nooit om je wachtwoord en ziet het ook nooit. Je logt in bij
            Magister zelf. Met de bladwijzer (of door te plakken) geef je SuperMagister alleen een
            tijdelijke sleutel van Magister, een <em>token</em>, die na ongeveer een uur vanzelf
            verloopt.
          </p>
        </Part>

        <Part icon={HardDrive} title="Wat er op je apparaat staat">
          <ul>
            <li>
              <strong>Het token</strong>: alleen in het geheugen van dit tabblad (sessionStorage).
              Sluit je de browser, dan is het weg.
            </li>
            <li>
              <strong>Wat de app bij Magister ophaalt</strong>: je rooster, huiswerk, cijfers en
              absenties, zodat je ze ook ziet als je koppeling verlopen is.
            </li>
            <li>
              <strong>Wat je zelf in de app doet</strong>: je instellingen, afgevinkt huiswerk,
              notities, gokken, je kaartencollectie en je woonplaats voor het fietsweer.
            </li>
          </ul>
          <p>
            Dat staat allemaal in de opslag van je browser (localStorage en IndexedDB), op dit
            apparaat. Niemand anders kan erbij, wij ook niet.
          </p>
        </Part>

        <Part icon={Server} title="Wat de server doet">
          <p>
            Browsers mogen Magister niet rechtstreeks vragen om je gegevens. Daarom gaan die
            verzoeken via een doorgeefluik op supermagister.nl, de <em>proxy</em>. Die:
          </p>
          <ul>
            <li>stuurt je verzoek met je token door naar de Magister van je eigen school;</li>
            <li>stuurt het antwoord meteen terug naar jou;</li>
            <li>kan alleen gegevens opvragen (lezen), nooit iets veranderen in Magister;</li>
            <li>bewaart niets en schrijft niets op: geen token, geen cijfers, geen logboek.</li>
          </ul>
          <p>
            Om misbruik te voorkomen telt de proxy hoeveel verzoeken er per minuut van één IP-adres
            komen. Die teller staat alleen in het werkgeheugen en is na een minuut weer weg. De site
            draait bij Vercel; zoals elke hostingpartij ziet Vercel welke adressen verbinding maken.
          </p>
        </Part>

        <Part icon={Wifi} title="Andere diensten">
          <ul>
            <li>
              <strong>Open-Meteo</strong> voor het fietsweer: de app vraagt het weer op voor de
              plaats die je instelt. Je naam of school gaat niet mee.
            </li>
            <li>
              <strong>Rijksoverheid</strong> voor de schoolvakanties: die haalt onze server op,
              zonder iets van jou.
            </li>
          </ul>
          <p>Geen advertenties, geen analytics, geen cookies van anderen.</p>
        </Part>

        <Part icon={Trash2} title="Alles wissen">
          <p>
            Bij <strong>Instellingen → Gegevens → Ontkoppelen</strong> haal je je token en alles van
            je Magister van dit apparaat. Wil je echt alles kwijt, ook je instellingen? Wis dan de
            sitegegevens van supermagister.nl in je browser.
          </p>
        </Part>

        <Part icon={ShieldCheck} title="Wie we zijn">
          <p>
            SuperMagister is een onafhankelijk hobbyproject, bedoeld voor je eigen account. Het is
            geen product van Magister of Iddink.
          </p>
          <Disclaimer privacyLink={false} className="text-sm" />
        </Part>
      </div>
    </>
  );
}
