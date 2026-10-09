import {
  BarChart3,
  HardDrive,
  KeyRound,
  Mail,
  Server,
  ShieldCheck,
  Trash2,
  Wifi,
} from "lucide-react";
import type { ReactNode } from "react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { PageHeader } from "@/components/ui/PageHeader";
import Link from "next/link";
import { CONTACT_EMAIL } from "@/lib/site";
import { Disclaimer } from "./Disclaimer";

function Part({
  icon: Icon,
  title,
  children,
  id,
}: {
  icon: typeof HardDrive;
  title: string;
  children: ReactNode;
  id?: string;
}) {
  return (
    <GlassPanel as="section" padding="lg" id={id} className="scroll-mt-24">
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
        subtitle="Kort gezegd: je rooster, huiswerk en cijfers staan alleen op je eigen apparaat. Er zijn geen accounts. Wat we wel bijhouden, zijn anonieme tellers, zoals hoe vaak er een walkout start. Nooit iets over jou, en je kunt het uitzetten."
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
            <li>
              <strong>Twee vinkjes voor de statistieken</strong>: of je eerste walkout en je
              welkomstpack al geteld zijn, zodat we ze niet dubbel tellen.
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
            Wel telt de proxy per dag hoeveel verzoeken er waren, hoe Magister antwoordde (gelukt,
            verlopen, plat) en hoe snel. Dat zijn alleen getallen, zonder wie, welke school of welke
            gegevens. Zo zien we het als Magister iets verandert.
          </p>
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
          <p>
            Geen advertenties en geen cookies, ook niet van anderen. Voor de anonieme statistieken
            gebruiken we Vercel Web Analytics en Upstash; zie hieronder.
          </p>
        </Part>

        <Part icon={BarChart3} title="Anonieme statistieken" id="statistieken">
          <p>
            Om te weten wat er gebruikt wordt en wat er stuk is, tellen we een paar dingen. Alleen
            hoe vaak iets gebeurt, per dag. Nooit wie.
          </p>
          <p>
            <strong>Wat we tellen</strong>
          </p>
          <ul>
            <li>
              <strong>Bezoeken</strong> via Vercel Web Analytics: welke pagina, uit welk land en met
              wat voor apparaat en browser. Zonder cookies, en zonder het stuk achter ? of # in het
              adres (daar kan je sessie in staan). Een vak in het adres wordt “[vak]”.
            </li>
            <li>
              <strong>Wat er in de app gebeurt</strong>, als dagteller: de app is geopend, de
              onboarding is gestart, afgerond of overgeslagen (en bij welke stap), de demo is
              gestart, er is gekoppeld (met de bladwijzer of door te plakken), een koppeling is
              verlopen of ontkoppeld, een pack of walkout is geopend of overgeslagen, er is gegokt
              (en of dat precies goed was), er is een video gemaakt (welk formaat, wel of geen
              mysterie), de calculator is gebruikt, je elftal is geopend, gebouwd of gedeeld, er is
              een oefenwedstrijd gespeeld, of de app is geïnstalleerd.
            </li>
            <li>
              <strong>Fouten</strong>: hoe vaak er iets misging, en wat voor soort fout (bijv. “het
              netwerk”). Nooit de foutmelding zelf.
            </li>
            <li>
              <strong>De proxy</strong>: aantallen, of het lukte en hoe snel Magister was (zie
              hierboven).
            </li>
          </ul>
          <p>
            <strong>Wat we nooit tellen</strong>: je naam, je school, je cijfers, je vakken, je
            gokken, je rooster of huiswerk, je IP-adres, een id of iets anders waarmee je te
            herkennen bent. Ook niet in logbestanden of foutmeldingen. Er is geen enkele teller die
            van jou is: het is “vandaag 12 walkouts”, niet “jij deed een walkout”.
          </p>
          <p>
            <strong>Waar het staat en hoe lang</strong>: de bezoekcijfers bij Vercel (de partij waar
            de site draait), de tellers in een kleine database bij Upstash. Elke dagteller wordt na
            13 maanden vanzelf verwijderd; bij Vercel blijven bezoekcijfers op ons gratis abonnement
            een maand zichtbaar. Om spam tegen te gaan kijkt de server een minuut lang hoeveel
            verzoeken er van één IP-adres komen; dat staat alleen in het werkgeheugen en wordt nooit
            bewaard.
          </p>
          <p>
            <strong>Uitzetten</strong>: bij{" "}
            <Link
              href="/instellingen#privacy"
              className="font-semibold text-accent-ink underline-offset-2 hover:underline"
            >
              Instellingen → Privacy
            </Link>{" "}
            zet je “Anonieme statistieken delen” uit. Staat in je browser Do Not Track of Global
            Privacy Control aan, dan tellen we sowieso niets.
          </p>
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

        <Part icon={Mail} title="Contact">
          <p>
            Een vraag over je gegevens, iets gevonden wat niet klopt, of wil je dat we iets
            aanpassen? Mail naar{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=SuperMagister`}
              className="font-semibold text-accent-ink underline-offset-2 hover:underline"
            >
              {CONTACT_EMAIL}
            </a>
            . Stuur nooit je wachtwoord of je token mee: daar vragen we nooit om.
          </p>
        </Part>
      </div>
    </>
  );
}
