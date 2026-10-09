# SuperMagister

Je rooster, huiswerk en cijfers uit Magister. Mooi, supersnel en vooral leuk. Nieuwe cijfers onthul
je met een walkout in FIFA-stijl, en elk cijfer wordt een verzamelkaart.

> **Disclaimer:** SuperMagister is onofficieel. Het gebruikt een interne Magister-API die kan
> veranderen, is niet verbonden aan Magister of Iddink, slaat je gegevens niet op een server op
> (alleen anonieme dagtellers, zie [Anonieme statistieken](#anonieme-statistieken)) en is alleen
> bedoeld voor je eigen account.

## Status

| Stap | Inhoud                                                                                 | Status     |
| ---- | -------------------------------------------------------------------------------------- | ---------- |
| 1    | Fundament: design system, thema's, app-shell, paginatransities, command palette        | ✅ Klaar   |
| 2    | Cijferonthulling: walkout, pack-opening, kaarten, geluid, oefenmodus, collectie        | ✅ Klaar   |
| A    | Gok je cijfer: het gokmoment midden in de walkout                                      | ✅ Klaar   |
| B    | Walkout als video delen                                                                | ✅ Klaar   |
| 3a   | Vandaag: widgets, dagtijdlijn, nu bezig, toets-radar, fietsweer, aftellen, trend       | ✅ Klaar   |
| 3b   | Rooster: alle weergaven, uitval, wijzigingen, slimme tussenuren, weekbelasting, export | ✅ Klaar   |
| 3c   | Huiswerk: afvinken met beloning, tijdsschatting, "ik heb geen zin"                     | ✅ Klaar   |
| 4    | Cijfers: vak-detail, calculator, simulator, overgangsmeter, bovenbouw, inzichten       | ✅ Klaar   |
| 5    | Koppeling: bladwijzer, plakken, koppelpagina, proxy en echte data                      | ✅ Klaar   |
| —    | Onboarding: de eerste keer openen, van intro tot je welkomstpack                       | ✅ Klaar   |
| —    | Live: supermagister.nl op Vercel, privacy, beveiliging (v1.0.0)                        | ✅ Klaar   |
| —    | Ontwikkelaarsdashboard en anonieme statistieken                                        | ✅ Klaar   |
| 6    | Gamification: XP, levels, quests, mascotte, weekrecap, Wrapped                         | Vervallen  |
| C    | Laatste schooldag voor de zomer, met jaar-Wrapped                                      | Geparkeerd |
| 7    | Afwerking: PWA, offline, meldingen, seizoensthema's, easter eggs, toegankelijkheid     | Gepland    |

De volledige opdracht staat in [docs/bouwopdracht.md](docs/bouwopdracht.md), de aanvulling met de
humorbijbel en de features A, B en C in [docs/aanvulling.md](docs/aanvulling.md), en de gemaakte
keuzes in [docs/ontwerp.md](docs/ontwerp.md).

## Lokaal draaien

Je hebt [Node.js](https://nodejs.org) 20.9 of nieuwer nodig (getest met Node 22).

```bash
npm install
npm run dev
```

Open daarna [http://localhost:3000](http://localhost:3000). De eerste keer krijg je een korte
uitleg (de onboarding) die eindigt met koppelen aan je eigen Magister. Nog niet koppelen? Kies
**Probeer de demo** (in de onboarding, op het koppelscherm of in **Instellingen → Gegevens**): dan
kijk je mee met Daan Visser uit 5 havo op het verzonnen Noorderlicht College. In de demo staat
bovenaan een DEMO-balk met **Nu echt koppelen**; alles uit de demo blijft los van je echte
gegevens. Tijdens het bouwen kun je bij **Instellingen → Ontwikkelaar** ook koppelen met de
geanonimiseerde testbestanden.

### Handige commando's

| Commando            | Wat het doet                                |
| ------------------- | ------------------------------------------- |
| `npm run dev`       | Ontwikkelserver met hot reload              |
| `npm run build`     | Productie-build                             |
| `npm start`         | De productie-build draaien                  |
| `npm test`          | Alle unit tests (Vitest)                    |
| `npm run lint`      | ESLint                                      |
| `npm run typecheck` | TypeScript-controle                         |
| `npm run format`    | Code opmaken met Prettier                   |
| `npm run check`     | Lint, typecheck, tests en build in één keer |

## Vandaag

- Alles op **Vandaag** is een widget. Tik op **Indelen** om ze te verslepen, uit of aan te zetten
  of breder en smaller te maken. Met het toetsenbord: Tab naar de greep, spatie om op te pakken,
  pijltjes om te verplaatsen, spatie om neer te zetten.
- De **dagtijdlijn** laat je lessen zien met uitval en tussenuren, en de **toets-radar** je
  toetsen van de komende twee weken (tik op een stip voor de stof).
- **Fietsweer** en **vakanties**: stel je woonplaats, je richting naar school, je fietstijd en je
  vakantieregio in bij **Instellingen → Vandaag**.

## Rooster

- Kies bovenaan **Dag**, **Week**, **Lijst** of **Maand**. Op je telefoon veeg je door de dagen,
  op een computer blader je met ← en →.
- Uitval krijgt een stempel, tussenuren een suggestie voor huiswerk dat precies past, en toetsen
  gloeien (tik erop voor de stof, het aftellen en je notities).
- Is er iets veranderd sinds je laatste bezoek, dan zie je een banner. Tik op **Wat is er
  veranderd?** voor de lijst.
- **Naar je agenda** downloadt vier weken rooster als .ics-bestand voor je agenda-app.

## Huiswerk

- Vink huiswerk af op **Huiswerk** of op **Vandaag**. Alles voor morgen af? Dan regent het
  confetti. Zet **Instellingen → Geluid → Geluidjes in de app** aan voor de plop.
- Kies bovenaan **Lijst** of **Kanban** (Te doen / Bezig / Klaar). In de kanban sleep je kaarten
  of gebruik je de pijltjes.
- Tik op de tijd (±20 min) om hem aan te passen, of maak hem de standaard voor dat vak. Alle
  standaarden staan bij **Instellingen → Huiswerk**.
- **Ik heb geen zin:** knip de taak op in mini-stapjes, of doe alleen vijf minuten met de timer.
- Je vinkjes blijven op dit apparaat; Magister zelf verandert niet.

## Cijfers

- Op **Cijfers** zie je per vak je gemiddelde en een trendlijntje. Tik op een vak voor de grafiek,
  al je cijfers en het gemiddelde per periode.
- **Wat moet ik halen?** rekent uit welk cijfer je nodig hebt voor je doel, en andersom wat een
  cijfer met je gemiddelde doet. Ook via Ctrl+K ("wat moet ik halen voor wiskunde") en via de
  knop in de walkout bij een onvoldoende.
- De **Simulator** laat je denkbeeldige cijfers toevoegen; de overgangsmeter beweegt mee.
- De **Overgangsmeter** (in een examenklas: Slaagmeter) zegt of je overgaat en welke vakken het
  verschil maken. Stel de normen van je school in via **Details en normen**.
- Verder: een ranglijst, periodes vergelijken, je cijfers als tijdlijn en, in de bovenbouw, je
  SE en combinatiecijfer.

## Walkout en collectie

- Op **Vandaag** ligt je pack met nieuwe cijfers. Open het en elk cijfer krijgt een walkout: tik om
  naar de onthulling te springen, houd ingedrukt om te versnellen.
- In **Collectie** staan al je kaarten. Tik op een kaart om hem te kantelen, om te draaien, in je
  vitrine te zetten of als afbeelding te delen. Verzameldoelen spelen nieuwe folies vrij.
- **Gok je cijfer:** vlak voor de flip hangt het silhouet gloeiend in beeld en vraagt de kaart
  "Wat heb je?". Sleep omhoog of omlaag om de teller te laten rollen en laat los om vast te zetten.
  Niet gokken? Tik onderaan op "Overslaan, ik ben er klaar voor (ben ik niet)". Precies goed?
  HELDERZIENDE. Bij **Cijfers** zie je wat voor gokker je bent. Liever alleen bij de laatste
  kaart, of helemaal niet? **Instellingen → Walkout → Gokken.**
- **Walkout als video:** tik op het eindscherm van een walkout op **Maak video**, of in de
  collectie op **Video**. Standaard in mysterie-modus: de video stopt op het vraagteken en vraagt
  "Raad mijn cijfer.". Zonder mysterie zie je je gok rollen en daarna de flip. Kies 9:16 of 1:1,
  een sticker over je cijfer en of je naam erop staat; daarna delen of downloaden.
- Alle soorten kaarten bekijken? Kies **Oefen een walkout** in Instellingen of via Ctrl/⌘ K.

## Sneltoetsen

| Toets       | Actie                          |
| ----------- | ------------------------------ |
| `Ctrl/⌘ K`  | Zoeken en commando's           |
| `1` t/m `6` | Naar een pagina                |
| `P`         | Privacymodus aan/uit           |
| `?`         | Overzicht van alle sneltoetsen |

Bij het gokmoment: scrollwiel of `↑`/`↓` om de teller te laten rollen (`Page Up`/`Page Down` per
hele punt), `Enter` om vast te zetten. In de walkout: `→` om over te slaan of door te gaan, `Esc`
om te sluiten. In de kaartviewer: `←`
en `→` om te bladeren, `F` om om te draaien, `Esc` om te sluiten.

## Onboarding

De eerste keer dat je SuperMagister opent, loop je in een paar stappen door de app: een korte
intro, drie uitlegkaarten (de walkout, gokken en je dag in één oogopslag), je thema, je woonplaats
en vakantieregio (mag ook later), koppelen met Magister, je welkomstpack en een paar tips.

- Vegen op je telefoon, `←`/`→` en `Enter` op een computer. **Overslaan** staat er altijd.
- Sluit je de app halverwege, dan ga je de volgende keer verder waar je was.
- Opnieuw bekijken? **Instellingen → Over → Onboarding opnieuw bekijken.**

## Wat moet ik halen? zonder koppeling

Vanuit een oefen-walkout of de demo (en via Ctrl/⌘ K zonder koppeling) opent **Wat moet ik
halen?** met handmatig invullen: je cijfers en hun weging, je doel en de weging van de volgende
toets. Niets daarvan wordt bewaard.

## Logo vervangen

Het logo staat op één plek: [`lib/brand/index.ts`](lib/brand/index.ts) (de vorm in een vak van
40 × 40 en de merkkleuren). Het logo in de app, de intro, het favicon (`/logo.svg`), het
apple-touch-icon, de PWA-iconen, de deelafbeelding en het watermerk in de video komen daar allemaal
uit.

## Koppelen

Koppel je eigen Magister op de pagina **Koppelen** (in het menu onder **Meer**, of via de chip
linksonder). Je wachtwoord vul je nooit in SuperMagister in: je logt in bij Magister zelf, en
SuperMagister krijgt alleen een tijdelijke sleutel (een token) van ongeveer een uur.

**Met de bladwijzer (de gewone manier)**

1. Sleep op de pagina **Koppelen** de knop **SuperMagister** naar je bladwijzerbalk. Zie je die
   balk niet? Druk op `Ctrl+Shift+B` (op een Mac `⌘+Shift+B`).
2. Ga naar je eigen Magister (`jouwschool.magister.net`) en log in.
3. Klik op de bladwijzer. SuperMagister opent en is gekoppeld.

De bladwijzer leest alleen je sessie in je eigen Magister en geeft die door via het `#`-deel van de
link, nooit in de rest van het adres. SuperMagister haalt dat deel meteen weg uit de adresbalk.

**Met plakken (als de bladwijzer niet werkt)**

Open Magister op een computer, druk op `F12`, kies **Application** (Firefox: **Opslag**) →
**Session storage** → je Magister-adres, en kopieer de waarde van de regel die begint met
`oidc.user:`. Plak die op de pagina **Koppelen** onder **Plakken**.

**Op je telefoon** kun je de bladwijzer met de hand maken: kopieer de code op de pagina
**Koppelen**, maak een bladwijzer en zet de code bij het adres. Typ daarna in Magister de naam van
de bladwijzer in de adresbalk en tik erop.

**Wat er daarna gebeurt**

- Alles wat al in Magister stond, zit meteen in je collectie, ook je cijfers van eerdere
  schooljaren. Je laatste vijf cijfers liggen klaar in een **welkomstpack**. Nieuwe cijfers worden
  vanaf dan vanzelf een pack.
- Zolang de app open is, haalt hij elk kwartier nieuwe gegevens op (en als je terugkomt in het
  tabblad, maar niet vaker). Wat is opgehaald, blijft op dit apparaat staan. Zo zie je je laatste
  stand ook als je koppeling verlopen is ("laatste update 14:02").
- Vijf minuten voor het verlopen krijg je een seintje. Is hij verlopen, dan vraagt de app je
  vriendelijk om opnieuw te koppelen: in Magister nog een keer op de bladwijzer klikken.
- Rekent Magister een gemiddelde anders uit dan SuperMagister, dan zie je bij dat vak een
  waarschuwingsdriehoekje met uitleg.
- **Instellingen → Gegevens:** bekijk een eerder schooljaar terug, koppel opnieuw of
  **ontkoppel**. Ontkoppelen wist je token en alles van je eigen Magister van dit apparaat.

Voor ontwikkelaars: de app praat met Magister via de eigen proxy (`/api/magister`, alleen GET,
alleen naar `{school}.magister.net/api/…`, token verplicht, maximaal 300 verzoeken per minuut per
IP-adres); dat wordt op één plek geregeld in `lib/magister/config.ts`. De bladwijzer opent
`NEXT_PUBLIC_SITE_URL`, of anders het adres waarop de app draait. Bij **Instellingen →
Ontwikkelaar** kun je tijdens het bouwen koppelen met de geanonimiseerde testbestanden, en zie je
bij **Gegevens controleren** wat er binnenkomt.

In de live versie zijn de ontwikkelaarsinstellingen verborgen. Tik bij **Instellingen → Over
SuperMagister** zeven keer snel op het versienummer om ze aan (of weer uit) te zetten.

## Omgevingsvariabelen

Alles staat met uitleg in [`.env.example`](.env.example). Lokaal: kopieer het naar `.env.local`.
Zonder de variabelen werkt de app ook; dan is er alleen geen dashboard en wordt er niets geteld.

| Variabele                     | Waarvoor                                                                     |
| ----------------------------- | ---------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`        | Het adres van de site: bladwijzer, deelafbeelding, robots.txt en sitemap.    |
| `DEV_DASHBOARD_PATH`          | Het geheime adres van het ontwikkelaarsdashboard, bijv. `/dev-Xk3v9x7q2Lr8`. |
| `DEV_DASHBOARD_PASSWORD`      | Het wachtwoord voor het dashboard (minstens 8 tekens).                       |
| `DEV_DASHBOARD_KEY`           | Zonder `?key=<deze waarde>` is zelfs de inlogpagina een 404 (minstens 8).    |
| `DEV_DASHBOARD_ANALYTICS_URL` | Optioneel: de directe link naar Vercel Analytics van dit project.            |
| `UPSTASH_REDIS_REST_URL`      | De opslag voor de tellers. Vult Vercel zelf in (als `KV_REST_API_URL`).      |
| `UPSTASH_REDIS_REST_TOKEN`    | Hoort bij de opslag. Vult Vercel zelf in (als `KV_REST_API_TOKEN`).          |

## Anonieme statistieken

SuperMagister telt een paar dingen, anoniem en alleen als dagteller: hoe vaak de app geopend
wordt, of de onboarding afgerond of overgeslagen wordt (en bij welke stap), koppelingen, walkouts,
gokken, video's, de calculator, fouten (alleen de soort) en hoe het met de proxy gaat. Nooit een
IP-adres, id, user-agent, school, naam, vak of cijfer, ook niet in logs.

- **Bezoekers:** [Vercel Web Analytics](https://vercel.com/docs/analytics), zonder cookies. Het
  adres gaat zonder `?…` en `#…` mee, en `/cijfers/<vak>` wordt `/cijfers/[vak]`.
- **Eigen tellers:** `POST /api/telling` met alleen `{"e":"<eventnaam>"}`. Alleen namen uit de
  whitelist in [`lib/stats/events.ts`](lib/stats/events.ts) tellen; rem van 60 per minuut per IP
  (alleen in het geheugen). Per dag één hash in Redis (`sm:dag:<datum>`) met alleen tellers; na
  400 dagen (ruim 13 maanden) verdwijnt hij vanzelf. De proxy telt zelf mee (aantal, statusgroep,
  responstijd per uur), zonder dat de browser iets stuurt.
- **Uit:** Instellingen → Privacy → "Anonieme statistieken delen". Do Not Track of Global Privacy
  Control in de browser: dan wordt er niets geteld.

**Wat de gratis plannen kunnen** (oktober 2026, check de actuele prijzen):

- _Vercel Web Analytics op Hobby (gratis):_ 50.000 events per maand, alleen paginabezoeken
  (pagina's, verwijzers, landen, apparaten, browsers) en een maand terugkijken. Geen eigen events
  (`track()`), daarvoor is Pro nodig. Ga je over de 50.000, dan pauzeert Vercel het verzamelen
  (er komt nooit een rekening). Daarom staan onze eigen events niet in Vercel maar in Redis.
  Wil je bezoekers langer dan een maand terugzien zonder Pro, dan past **Plausible** beter
  (cookieloos, EU-gehost, vanaf ongeveer $9 per maand, of gratis als je het zelf host).
- _Upstash Redis (via de Vercel Marketplace):_ gratis tot 500.000 commando's per maand en
  256 MB. Daarboven $0,20 per 100.000 commando's. De tellers worden per serverinstantie gebundeld
  en hooguit eens per 5 seconden weggeschreven, dus ook met een paar honderd gebruikers per dag
  blijf je ruim binnen het gratis deel.

## Ontwikkelaarsdashboard

Een privé dashboard voor de maker, met de tellers van hierboven: vandaag in één oogopslag (met het
verschil met gisteren en vorige week), grafieken over 7, 30 of 90 dagen, de trechter van openen tot
eerste walkout, waar mensen in de onboarding afhaken, populariteit per onderdeel, en de gezondheid
van de proxy (statuscodes met een waarschuwing als 401 of 5xx ineens stijgt, responstijd van
Magister, rate-limit-blokkades, Open-Meteo, de vakantie-API en fouten in de browser). Verder een
knop **Test nu**, build-info, een link naar Vercel Analytics en **CSV** om alles te downloaden.

- **Niet te vinden:** het adres komt uit `DEV_DASHBOARD_PATH` en staat nergens in de app, het
  menu, de command palette, robots.txt of de sitemap. Zonder geldige sessie geeft het precies
  dezelfde 404 als elke pagina die niet bestaat. Ook de inlogpagina, tenzij je `?key=` meegeeft.
- **Inloggen:** het wachtwoord wordt in constante tijd vergeleken; hooguit 5 pogingen per 15
  minuten per IP-adres. Daarna een httpOnly-, secure-, sameSite=strict-cookie dat 7 dagen geldig
  is en alleen naar het geheime adres gaat. **Uitloggen** staat rechtsboven.
- **Altijd noindex** (meta robots en `X-Robots-Tag`). Alle data komt van de server, alleen met een
  geldige sessie; er zit niets van in de JavaScript van de app.
- Hoe het werkt: `proxy.ts` stuurt het geheime adres intern door naar `/dev-dashboard-intern`
  (dat adres rechtstreeks openen geeft altijd een 404), en elke pagina en route daar controleert
  de sessie zelf nog een keer (`lib/dev-dashboard/guard.ts`).

**Zo zet je het aan op Vercel**

1. **Opslag koppelen.** Ga in Vercel naar je project → **Storage** → **Create Database** (of
   **Marketplace**) → kies **Upstash** → **Upstash for Redis** → **Continue**. Kies de gratis
   variant en een regio dicht bij je functies (Frankfurt, `fra1`/`eu-central-1`, als je project
   daar draait; anders Washington, `iad1`). Geef hem een naam (bijv. `supermagister-tellers`) en
   koppel hem bij **Connect Project** aan SuperMagister, voor alle omgevingen. Vercel zet daarna
   zelf `KV_REST_API_URL` en `KV_REST_API_TOKEN` (en een paar andere) bij je variabelen. Daar hoef
   je niets aan te doen.
2. **Drie geheimen maken.** Draai dit drie keer in een terminal en bewaar de uitkomsten in je
   wachtwoordmanager:

   ```bash
   node -e "console.log(require('crypto').randomBytes(18).toString('base64url'))"
   ```

3. **Variabelen invullen.** Project → **Settings** → **Environment Variables** → **Add New**,
   steeds alleen voor **Production**:
   - `DEV_DASHBOARD_PATH` = `/dev-` plus de eerste uitkomst (bijv. `/dev-Xk3v9x7q2Lr8aB…`)
   - `DEV_DASHBOARD_PASSWORD` = de tweede uitkomst
   - `DEV_DASHBOARD_KEY` = de derde uitkomst
   - optioneel `DEV_DASHBOARD_ANALYTICS_URL` = `https://vercel.com/<jouw-team>/<project>/analytics`

   Zet ze op **Sensitive** als Vercel dat aanbiedt.

4. **Vercel Web Analytics aanzetten.** Project → **Analytics** → **Enable**. De app laadt het
   script zelf al (alleen op Vercel).
5. **Opnieuw deployen.** **Deployments** → de bovenste → **…** → **Redeploy**. Variabelen gelden
   pas na een nieuwe deploy.
6. **Eerste keer inloggen.** Open `https://supermagister.nl<DEV_DASHBOARD_PATH>?key=<DEV_DASHBOARD_KEY>`,
   vul het wachtwoord in en zet het adres zonder `?key=…` in je bladwijzers (een week lang kom je
   er dan zonder inloggen in). Verlopen? Gebruik de link met `?key=` weer.

**Krijg je toch een 404?**

1. Zijn de variabelen ingevuld vóór de laatste deploy? Ze gelden pas na **Redeploy**.
2. Staan ze bij **Production** (niet alleen Preview of Development)?
3. Kijk in Vercel bij **Logs** naar een regel `[ontwikkelaarsdashboard] staat uit: …`. Daar staat
   wát er niet klopt (bijv. "DEV_DASHBOARD_PASSWORD is korter dan 8 tekens"), nooit de waarden.
4. Of controleer de echte waarden op je eigen computer, zonder dat ze op het scherm komen:

   ```bash
   npx vercel env pull .env.vercel --environment=production
   npm run dashboard:check -- .env.vercel
   rm .env.vercel
   ```

Hoofdletters, een slash vooraan of aan het eind, en aanhalingstekens rond de waarden maken niet
uit.

Lokaal kan het ook: zet de drie `DEV_DASHBOARD_`-variabelen in `.env.local`. Zonder Upstash zegt
het dashboard dat er nog geen opslag is gekoppeld.

## Live zetten op Vercel (supermagister.nl)

**1. Project importeren**

1. Log in op [vercel.com](https://vercel.com) met je GitHub-account.
2. Ga naar [vercel.com/new](https://vercel.com/new), kies de repository **SuperMagister** en klik
   op **Import**.
3. Vercel herkent Next.js vanzelf. Laat **Build Command**, **Output Directory** en **Install
   Command** op de standaard staan. De Node-versie (22) komt uit `package.json`.

**2. Omgevingsvariabele invullen**

1. Klap bij het importeren **Environment Variables** open (of later: **Settings → Environment
   Variables**).
2. Naam `NEXT_PUBLIC_SITE_URL`, waarde `https://supermagister.nl`, alleen voor **Production**.
3. Klik op **Deploy**. Na een minuut of twee draait de app op een adres als
   `supermagister-xxx.vercel.app`.

Verander je de variabele later, deploy dan opnieuw (**Deployments → … → Redeploy**): de waarde
gaat er tijdens het bouwen in.

**3. Domein toevoegen**

1. Ga in het project naar **Settings → Domains**.
2. Voeg `supermagister.nl` toe. Vercel vraagt of `www.supermagister.nl` mee moet: kies de optie
   waarbij **www doorstuurt naar supermagister.nl** (redirect).
3. Vercel laat nu per domein zien welke DNS-records nodig zijn. Houd dit scherm open.

**4. DNS bij YourHosting**

1. Log in bij YourHosting, ga naar **Mijn domeinen → supermagister.nl → DNS-beheer** (of "DNS
   instellingen").
2. Verwijder bestaande **A**- en **AAAA**-records voor `@` (de kale domeinnaam) en een bestaand
   record voor `www`, als die er zijn. Laat MX-records (mail) staan.
3. Maak deze records aan, met de waarden die Vercel in stap 3 toont. Meestal zijn dat:

| Type  | Naam (host) | Waarde                                        | TTL  |
| ----- | ----------- | --------------------------------------------- | ---- |
| A     | `@`         | `76.76.21.21` (of het adres dat Vercel toont) | 3600 |
| CNAME | `www`       | `cname.vercel-dns.com.` (of wat Vercel toont) | 3600 |

Laat Vercel een ander IP-adres of een andere CNAME zien (bijvoorbeeld
`xxxx.vercel-dns-017.com`), gebruik dan díe waarden. Vraagt Vercel om een **TXT**-record om
te bewijzen dat het domein van jou is, voeg dat ook toe. 4. Sla op. Binnen een paar minuten tot een paar uur zet Vercel bij **Domains** een groen vinkje
en regelt het vanzelf een https-certificaat.

**5. Daarna**

- Elke push naar `main` wordt vanzelf live gezet. Een andere branch krijgt een eigen
  testadres (preview).
- Zoekmachines zien alleen de voorkant en `/privacy` (zie `app/robots.ts`).
- Het dashboard en de statistieken zet je aan zoals beschreven bij
  [Ontwikkelaarsdashboard](#ontwikkelaarsdashboard).

## Techniek in het kort

- Next.js (App Router) met TypeScript in strict-modus
- Tailwind CSS voor styling, Framer Motion voor animaties
- Canvas 2D voor de walkout en de kaarten, Web Audio voor alle geluiden
- Video's met WebCodecs en Mediabunny (mp4), met MediaRecorder als terugval
- TanStack Query voor data, Zustand voor instellingen en UI-state, IndexedDB via idb-keyval
- Vitest voor alle rekenlogica, ESLint en Prettier voor de codekwaliteit
- Een strenge Content Security Policy met een nonce per pagina, en DOMPurify voor alle HTML uit
  Magister

## Disclaimer

SuperMagister is onofficieel. Het gebruikt een interne Magister-API die zonder aankondiging kan
veranderen, is niet verbonden aan Magister of Iddink, slaat je gegevens niet op een server op
(alleen anonieme dagtellers) en is alleen bedoeld voor je eigen account. Gebruik op eigen risico.
