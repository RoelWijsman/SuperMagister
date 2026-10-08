# SuperMagister

Je rooster, huiswerk en cijfers uit Magister. Mooi, supersnel en vooral leuk. Nieuwe cijfers onthul
je met een walkout in FIFA-stijl, en elk cijfer wordt een verzamelkaart.

> **Disclaimer:** SuperMagister is onofficieel. Het gebruikt een interne Magister-API die kan
> veranderen, is niet verbonden aan Magister of Iddink, slaat geen gegevens op een server op en is
> alleen bedoeld voor je eigen account.

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
| —    | Onboarding: de eerste keer openen, van intro tot je welkomstpack                       | Bezig      |
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
uitleg (de onboarding) die eindigt met koppelen aan je eigen Magister. Er is geen demo: zonder
koppeling vraagt elke pagina met schooldata of je wilt koppelen. Tijdens het bouwen kun je bij
**Instellingen → Ontwikkelaar** koppelen met de geanonimiseerde testbestanden.

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

Voor ontwikkelaars: de app praat met Magister via de eigen proxy (`/api/magister`, alleen GET);
dat wordt op één plek geregeld in `lib/magister/config.ts`. Het adres in de
bladwijzer is het adres waarop de app draait; zet `NEXT_PUBLIC_APP_URL` om een ander adres te
gebruiken. Bij **Instellingen → Ontwikkelaar** kun je tijdens het bouwen koppelen met de
geanonimiseerde testbestanden, en zie je bij **Gegevens controleren** wat er binnenkomt.

## Op Vercel zetten

1. Zet het project in een eigen GitHub-repository.
2. Ga naar [vercel.com/new](https://vercel.com/new) en importeer de repository.
3. Vercel herkent Next.js vanzelf. Er zijn geen omgevingsvariabelen nodig. (Wil je dat de
   bladwijzer een ander adres opent dan waarop de app draait, zet dan `NEXT_PUBLIC_APP_URL`.)
4. Klik op **Deploy**. Elke push naar je hoofdbranch wordt daarna automatisch gepubliceerd.

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
veranderen, is niet verbonden aan Magister of Iddink, slaat geen gegevens op een server op en is
alleen bedoeld voor je eigen account. Gebruik op eigen risico.
