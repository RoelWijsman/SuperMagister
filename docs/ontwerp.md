# Ontwerpkeuzes

Aanvulling op [bouwopdracht.md](bouwopdracht.md): wat er gekozen is en waarom, vooral waar de
opdracht ruimte liet of waar de uitvoering afwijkt.

## Visuele identiteit (fase 1)

- **Kenmerk: de levende hemel.** De achtergrond is een langzaam bewegende aurora (vier zachte
  vlekken plus een golvend "noorderlicht-lint") met een laag die meekleurt met de tijd van de dag:
  warm oranje/roze in de ochtend, fris blauw overdag, paars in de avond en 's nachts donker met
  twinkelende sterren en af en toe een vallende ster. Alles in CSS, zonder JavaScript per frame.
- **Typografie.** Display-font is **Unbounded** in plaats van Space Grotesk: breed, rond en met
  karakter, en het contrasteert bewust met het smalle, sportieve font van de kaarten (Bebas Neue,
  fase 2). Zo blijft het FIFA-thema van de walkout los van de rest van de app. Tekst in **Inter**
  met de enkellaagse "a" (`cv11`). Getallen altijd `tabular-nums`.
- **Glas.** Panelen gebruiken `backdrop-filter` met een lichte rand, een lichtrandje bovenaan en een
  zachte binnengloed. Bij `prefers-reduced-transparency` worden ze dicht.
- **Kleuren.** Drie lagen tokens: `--t-*` (themakleuren), `--sm-*` (semantisch, per licht/donker) en
  Tailwind-utilities (`bg-glass`, `text-ink-2`, `text-accent-ink`, …). Thema's staan in
  `lib/theme/themes.ts` als enige bron; een inline script in `<head>` zet ze vóór de eerste paint,
  `ThemeSync` neemt het daarna over.
- **Vakkleuren.** 16 kleuren (12 helder rond de kleurencirkel, 4 pastel). Elk vak krijgt de kleur
  van de hash van zijn code; bij een botsing schuift het met stappen van 7 door, zodat twee vakken
  nooit dezelfde of een naburige tint krijgen.

## Navigatie

- Desktop: zwevende glazen sidebar (smal met alleen iconen op tablet, breed vanaf 1024 px).
- Mobiel: bottom-nav met Vandaag, Rooster, Huiswerk, Cijfers en **Meer**. Onder Meer zitten
  Collectie, Prestaties, Instellingen en Koppelen.
- De stijlgids staat bewust niet in de navigatie of de command palette: alleen via `/stijlgids` of
  Instellingen > Ontwikkelaar. Nieuwe componenten komen er altijd bij.
- Paginatransities met Framer Motion via `app/template.tsx`: verderop in het menu schuift de pagina
  van rechts in, terug van links. Bij de allereerste paint wordt niet geanimeerd, zodat de
  server-HTML meteen zichtbaar is.
- Command palette (Ctrl/⌘ K) met fuzzy zoeken, natuurlijke zinnen ("wat moet ik halen voor
  wiskunde", "rooster vrijdag") en een themapagina met live voorvertoning. Functies uit latere fases
  staan er al in, gemarkeerd met "fase N".

## Demo-data

Op 8 oktober 2026 eruit, op 9 oktober (na de eerste test op supermagister.nl) terug als **keuze
voor bezoekers**: wie niet gekoppeld is, kan overal "Probeer de demo" kiezen (onboarding,
koppelscherm, Instellingen → Gegevens). `demo` staat in de koppel-store (`stores/connection.ts`),
gaat vanzelf uit zodra je echt koppelt en wordt niet aangeboden als je al gekoppeld bent. De
demo-bron heeft id `demo`, dus onthulde kaarten, gokken en de rest staan los van je echte
gegevens. Boven elke pagina staat dan een DEMO-balk met **Nu echt koppelen** en **Demo stoppen**
(`components/koppelen/Demo.tsx`), en de chip zegt DEMO. Zonder koppeling en zonder demo is er een
lege bron en vraagt elke pagina met schooldata om te koppelen of de demo te proberen
(`components/koppelen/LinkGate.tsx`). De roostertrucjes voor ontwikkelaars (nep-uitval) zijn niet
teruggekomen.

## Datalaag

- `SchoolDataSource` (`lib/data/source.ts`) is het contract. De Magister-bron (fase 5) praat via
  de proxy, met een cache ervoor; zonder koppeling is er een lege bron. Componenten
  gebruiken alleen de hooks uit `lib/data/hooks.ts`.
- Huiswerk en toetsen worden afgeleid uit lessen (`lib/school/derive.ts`), net als bij Magister.
- Welke cijfers al onthuld zijn, staat per databron in IndexedDB. Niet-onthulde cijfers tellen nog
  nergens mee, zodat gemiddeldes je pack niet verklappen.
- **Magister-client (voorbereid in fase 4).** `lib/magister/client.ts` praat alleen met een
  _transport_. Welke transport, staat op één plek: `TRANSPORT` in `lib/magister/config.ts`.
  Nu is dat `"proxy"`: GET-verzoeken naar de eigen route `/api/magister/...` met het token in
  `Authorization` en de school in `X-Magister-School` (gecontroleerd op
  `^[a-z0-9-]+\.magister\.net$`, paden alleen letters, cijfers, `-`, `_` en `/`). Tijdens het
  bouwen kan het ook `"voorbeeld"` zijn (de testbestanden). Fouten worden
  `MagisterError`s met een code (`verlopen`, `geen-toegang`, `netwerk`, …) en bevatten nooit het
  token. De paden uit de opdracht staan in `lib/magister/endpoints.ts`.

## Teksten en humor (aanvulling)

- Alle teksten met karakter staan in `content/copy.ts`, met minstens vijf varianten per situatie.
  `lib/copy.test.ts` bewaakt de humorbijbel: max. één emoji en één uitroepteken per tekst, geen
  verboden memes, de 6-7-grap hooguit één keer, elke meme hooguit één keer (de pinguïn mag twee
  keer: hij loopt weg bij een onvoldoende en draait om bij een comeback) en alleen bekende
  variabelen.
- `useCopy` kiest één variant per situatie en houdt die vast; `pickCopy` onthoudt per sessie de
  vorige keuze, zodat je nooit twee keer achter elkaar dezelfde tekst ziet. Op de server en tijdens
  hydratie is een tekst `null`, zodat server en browser altijd overeenkomen.
- Cijfers in een grappige zin blijven componenten (`useCopyNodes`), zodat ze in de privacymodus
  vervagen. In de privacymodus kiest de cijferpagina bovendien neutrale teksten: "werk aan de
  winkel" zou anders verraden hoe het gaat. Om dezelfde reden is de gloed van het pack dan neutraal.

## Cijferonthulling (fase 2)

- **De walkout is een pure functie van de tijd.** `buildWalkoutPlan` maakt de tijdlijn (fases,
  geluiden, vuurwerk) en `renderWalkoutFrame(scene, t)` tekent elk frame op canvas. Deeltjes zijn
  gesloten formules (ballistiek met luchtweerstand), geen simulatie: elk tijdstip is direct uit te
  rekenen. Dat maakt overslaan, versnellen en straks de video-export (feature B) eenvoudig. In de
  stijlgids kun je met een schuif door elke walkout spoelen.
- **Kaarten worden getekend, niet opgemaakt.** Eén tekenfunctie (`lib/cards/draw.ts`) maakt de kaart
  voor het album, de walkout en de deelbare afbeeldingen. Vak-iconen komen als paden uit Lucide.
- **Look.** In Form-kaarten zijn zwart met goud, maar TOTY en ICON zijn zeldzamer en blijven altijd
  zichzelf (`cardLook`); In Form staat dan als label op de kaart.
- **Eindscherm.** Op brede schermen staat het eindscherm naast de kaart, zoals in FIFA; anders
  eronder. Het eindscherm staat er vanaf het begin onzichtbaar, zodat de kaart precies weet hoeveel
  ruimte het nodig heeft. De grens (`SIDE_LAYOUT_MIN_ASPECT`) staat ook als CSS-variant `naast`.
- **Reactie.** De eerste regel volgt de tier, de tweede het beste verhaal: comeback, dan record,
  dan reeks, dan In Form. Bij een onvoldoende: grap, steun en een concrete actie met het echte
  cijfer dat je nodig hebt.
- **Geluid** wordt live gemaakt met de Web Audio API (gefilterde ruis, oscillatoren), zonder
  geluidsbestanden. Dezelfde recepten werken op een `OfflineAudioContext` voor feature B.
- **Snelheid.** Normaal, snel (×1,8) of direct naar de onthulling. Tikken springt naar de
  onthulling, ingedrukt houden versnelt ×3. Een verborgen tabblad pauzeert de walkout.
- **Pack.** De kleur van het pack verraadt de beste kaart; de tekst niet. Het beste cijfer komt
  altijd als laatste.

## Collectie (fase 2)

- Album met filters (vak, tier, periode, soort), tellers per tier en drie sorteringen. Een kaart
  opent fullscreen met 3D-kanteling (muis, of de gyroscoop van je telefoon; iOS vraagt eerst
  toestemming), een folie die het licht vangt en een achterkant met datum, toets en context.
- **Vitrine:** vijf favorieten, per databron opgeslagen, zodat demo- en echte kaarten niet door
  elkaar lopen.
- **Verzameldoelen** belonen je met een nieuwe folie voor je kaarten. Folies blijven binnen de
  kaartenwereld; de rest van de app houdt zijn eigen stijl (het FIFA-thema hoort alleen bij
  onthulling, kaarten en collectie). Een gehaald doel wordt na de walkout gemeld. Doelen die bij het
  eerste bezoek al gehaald zijn, worden stil vastgelegd.
- **Deelbare afbeeldingen** (1080 × 1350) maken we rechtstreeks met canvas in plaats van met
  html-to-image: de kaarten zijn al canvas, het resultaat is scherper en er is geen extra
  dependency nodig. Op een telefoon deel je via het deelmenu, anders sla je de afbeelding op.
- Voor de CSP (fase 5b): het kaartmasker is een `data:`-SVG en de deelvoorbeelden zijn
  `blob:`-adressen, dus `img-src` staat `data:` en `blob:` toe.

## Gok je cijfer (feature A)

- **Wanneer.** Bij elke kaart met een cijfer, in het pack en in de oefenmodus (oefengokken worden
  niet bewaard). Niet bij een herhaling uit de collectie en niet bij V, G of O. Instellingen >
  Walkout > Gokken: elke kaart (standaard), alleen de laatste kaart van een pack, of uit. Of er
  gegokt moet worden, wordt afgeleid uit de staat (kaart, instelling, al gegokt?) in plaats van
  een aparte stap; zo kan geen enkele overgang het gokken overslaan.
- **Eén gok per cijfer**, per databron in IndexedDB: de gok, het moment, het verschil (echt min
  gok) en de XP. Sluit je de walkout vóór de onthulling, dan blijft je gok staan.
- **Het gokmoment zit in de walkout**, er is geen apart gokscherm. Na de drie onthullingen draait
  het silhouet in beeld en blijft gloeiend hangen: dat is de fase `gok` in de tijdlijn, tussen
  silhouet en flip. De show loopt door: de flares bewegen, de camera zoomt heel langzaam in (tot
  9%) en het stadiongeluid maakt plaats voor een spanningsloop (hartslag van 64 naar 110 slagen
  per minuut, een aanzwellende drone) die steeds feller wordt. Het silhouet pulseert op dezelfde
  hartslag.
- **Meteen duidelijk wat je moet doen** (feedback na de eerste versie). Het getal staat groot in
  het midden van de kaart, met klein "Wat heb je?" erboven en pulserende pijltjes erboven en
  eronder (op 10,0 vervaagt het pijltje omhoog, op 1,0 dat omlaag). Onder de kaart staat vanaf
  de eerste seconde "Sleep omhoog of omlaag · loslaten = vastzetten". Naast de kaart staat een
  verticale schaal van 1 tot 10 met rood/oranje/groen-zones (dezelfde grenzen als de
  cijferkleuren: onder 5,5, tot 6,5, daarboven) en een streepje dat meebeweegt. Onderaan het
  silhouet staat waar je op gokt: vak-icoon en vaknaam, en daaronder toets · weging. De ster in
  het midden is weg; daar staat nu het getal. Pijltjes, uitleg en schaal horen bij het live
  gokken; in herhalingen en (straks) de video staan ze er niet.
- **Eén gebaar.** Slepen (waar dan ook) rolt de teller als een gokkast-teller van 1,0 tot 10,0,
  6 px per tiende, met oplopende tikjes en een lichte trilling. Op een computer ook het scrollwiel
  of ↑/↓ (Page Up/Down per hele punt, Home/End naar 1,0/10,0). Je eerste beweging begint bij je
  gemiddelde voor dat vak; alles rekent in tienden (geen afrondingsfouten). Loslaten of Enter zet
  de gok vast: klik, het getal bevriest, een halve seconde stilte, dan meteen de flip. Een tik
  (of Enter) zonder getal doet niets behalve de pijltjes een duwtje geven; zo botsen tikken en
  slepen nooit. Heb je met het wiel of de pijltjestoetsen al een getal gekozen, dan zet indrukken
  en loslaten dat vast. Zonder gok omdraaien kan alleen met het tekstknopje onderaan:
  "Overslaan, ik ben er klaar voor (ben ik niet)". Nooit een automatische skip of tijdsdruk: het
  gewone "Overslaan" springt hooguit naar het gokmoment, nooit eroverheen.
- **Commentaar** staat klein onder de kaart. Zolang je nog niets gekozen hebt, staat er één vaste
  zin: "Geen druk. (Wel een beetje.)" (op verzoek; net als de 6,7-grap een bewuste uitzondering op
  "minstens 5 varianten"). Daarna praat het live mee met je teller. Een nieuwe tekst verschijnt
  meteen, zonder te wachten tot de vorige weg is: met "wachten" bleef het commentaar bij snel
  slepen soms hangen. Tussen 5,6 en 5,9 heeft een eigen bereik; de opdracht sloeg dat over. Bij
  6,7 wiebelt de teller en staat er "…nee. We doen dit niet.": de enige 6-7-grap, als één vaste
  zin.
- **Een open einde in een pure tijdlijn.** Zolang je nog niet gegokt hebt, duurt de fase `gok`
  oneindig lang (de tijdlijn stopt daar netjes). Bij het vastzetten bouwen we de tijdlijn opnieuw,
  met de gokduur ingevuld; alles daarvóór blijft gelijk, dus het beeld loopt naadloos door. De
  spanningsloop wordt in blokken van 12 seconden ingepland en loopt in elk blok precies door.
- **Bij de flip** vliegt je gok uit het midden naar een plek naast de rating linksboven; onderweg
  krimpt hij en valt de komma weg (7,2 wordt 72, zoals een rating). Na de onthulling wordt hij een
  doorschijnend "spookcijfer" (in de inktkleur van de kaart, met een paarse rand), wacht even en
  klapt dan tegen de echte rating: lichtflits, "boem" en een kleine terugvering. Daarna de strook
  "Gegokt 7,2 · Echt 7,8 · +0,6" met een reactie. De vlucht is een pure functie van de tijd
  (`guessFlight`), getest los van het tekenen. Met minder beweging vervaagt het getal en verschijnt
  het spookcijfer op zijn plek.
- **Tekendetails.** De gloed van de rollende teller tekenen we apart van de cijfers (alleen de
  schaduw, zonder knipvenster), anders verraadt hij de randen van de rollen. Een kaart die recht
  van voren of achteren staat, tekenen we in één keer in plaats van in 40 stroken: bij het
  stilhangende silhouet schemerden de naden tussen de stroken anders door.
- **Herhalingen en video.** Heb je een kaart al gegokt (eerder in deze sessie of bewaard), dan
  speelt het gokmoment zich vanzelf af: na het "?" rolt de teller in 1,6 seconde naar je gok, klik,
  flip. Dat is een vaste, pure tijdlijn (`SCRIPTED_LOCK_AFTER`), dus de video van feature B kan
  hem frame voor frame renderen.
- **Uitkomst.** Precies goed, binnen 0,3, binnen 0,5, ernaast, of echt veel hoger of lager (vanaf
  1,5 verschil). XP: 50, 30, 20, 10 en 5 voor de moeite. De XP wordt bewaard en telt mee zodra er
  levels zijn (fase 6). Bij een veel te hoge gok volgt steun en de knop "Wat moet ik halen?", ook
  bij een voldoende.
- **HELDERZIENDE** (precies goed) zit in de pure tijdlijn van de walkout: het spookcijfer schuift
  óp de rating en smelt erin, en op dat moment volgen eigen geluid, paarse flits, sterren en een
  schuine stempel, bovenop het tierfeest. Daardoor komt het straks ook vanzelf in de video
  (feature B). Het feest duurt dan minstens twee seconden, zodat je het kunt lezen.
- **Gokkerstype** vanaf 5 gokken: orakel (gemiddeld hooguit 0,4 ernaast), bescheiden pessimist
  of hoofdpersonage (gemiddeld minstens 0,3 te laag of te hoog, in minstens 65% van de gokken),
  anders chaosgokker. Het staat bij Cijfers; in het profiel komt het in fase 6. Per vak noemen we
  je beste en slechtste vak (minstens 2 gokken per vak en 0,3 verschil).
- **Grafiek.** Een "dumbbell" per gok: de ring is je gok, de stip het echte cijfer, op één as van
  1 tot 10. Eén kleur (het accent), vorm als tweede kenmerk, tooltip op hover en focus, en een
  tabelweergave. Gecontroleerd met de dataviz-validator: in elk thema minstens 3:1 contrast.
- **Prestaties** volgen uit de gokgeschiedenis (niets extra bewaard) en staan op de
  Prestaties-pagina. Een nieuwe prestatie wordt na de walkout gemeld; wat bij het eerste bezoek
  al behaald was, leggen we stil vast.
- **Privacy.** Een gok op een cijfer dat je nog niet hebt onthuld, telt nergens mee; anders zou
  de statistiek je pack verraden. De grafiek en de strook vervagen in de privacymodus.
- **Demo** (vervallen met de demo). Daan had 38 eerdere gokken: een bescheiden pessimist, een orakel bij wiskunde A en
  een muntje bij Duits. Precies goed komt er niet in voor, zodat je "Verdacht" bij het eerste
  pack zelf kunt halen. "Pack opnieuw dichtplakken" zet ook de gokken en meldingen terug.
- **Hydratie.** Schooldata komt alleen in de browser binnen. De datahooks geven daarom tijdens de
  hydratie nog geen data terug, ook als een ander component (zoals de doelen- of
  prestatiewachter) die al heeft opgehaald. Zo tekenen server en browser de eerste keer hetzelfde.

## Walkout als video (feature B)

- **Precies de walkout.** De video gebruikt dezelfde pure tekenfunctie als het scherm
  (`renderWalkoutFrame`), beeld voor beeld op tijd t, met alleen het watermerk en de
  mysterietekst erover. De kaart blijft in beeld staan (geen eindscherm ernaast).
- **Het gokmoment is de cliffhanger** (op verzoek). Mysterie-modus (standaard aan) stopt precies
  op het "?" van het gokmoment: het silhouet hangt, de hartslag versnelt, de camera zoomt en na een
  seconde verschijnt "Raad mijn cijfer." met daaronder klein een inzet ("Fout = jij haalt
  tosti's.", vijf varianten). De video eindigt daar, abrupt, zonder flip. In de normale video rolt
  de teller onder "MIJN GOK" naar je gok, klik, flip, en je gok klapt als spookcijfer tegen de
  rating. Zonder gok (of bij V, G en O) is het gewoon de walkout. Pijltjes, uitleg en schaal van
  het live gokken staan niet in de video.
- **Opties.** 9:16 (1080 × 1920) of 1:1 (1080 × 1080); mysterie aan of uit; cijfer verbergen met
  een sticker ("Nee.", "Staatsgeheim", "Vraag mijn advocaat", "Niet vandaag", "Boeieuh"); naam wel
  of niet tonen. In de privacymodus staat de sticker standaard aan. Met een sticker valt
  HELDERZIENDE weg (dat zou het cijfer verraden) en landt het spookcijfer naast de sticker.
  In mysterie-modus zijn sticker en naam niet nodig: je ziet alleen het silhouet.
- **Watermerk:** het logo met "SUPERMAGISTER" en klein "ONOFFICIEEL · NIET VAN MAGISTER" onderaan.
  Het beeldmerk staat als vorm in `lib/brand.ts`, gedeeld met het logo in de app.
- **Engine** (`lib/video`), herbruikbaar voor Wrapped: hij krijgt een tekenfunctie van t, een
  lengte en het geluid, en weet niets van walkouts. Volgorde van voorkeur: WebCodecs + Mediabunny
  naar mp4 (frame-exact, sneller dan realtime, metadata vooraan zodat de video meteen speelt),
  dan MediaRecorder naar mp4 (realtime), dan WebCodecs naar webm, dan MediaRecorder naar webm, en
  als laatste een stille video. Mediabunny wordt pas geladen als je echt een video maakt.
- **Geluid** wordt apart offline gerenderd met dezelfde recepten (OfflineAudioContext, 48 kHz) en
  in de video gemuxt (aac, anders opus). Geluiden die over het einde heen lopen worden afgekapt; in
  mysterie speelt de spanningsloop door tot het laatste beeld en stopt het geluid kort, anders
  sterft het rustig uit. Het geluid zit er ook in als je het in de app hebt uitgezet.
- **Flow.** "Maak video" op het eindscherm van de walkout (het paneel ligt dan boven de walkout,
  en die gaat zolang niet vanzelf door) en "Video" in de kaartviewer van de collectie. Eerst de
  opties met een voorproefje van het laatste beeld, dan de voortgang met procent en wisselende
  teksten (annuleren kan), dan een speler met "Delen" (Web Share API, alleen als het apparaat een
  video kan delen) en "Downloaden".
- **Voor de CSP (fase 5b):** de preview speelt een `blob:`-adres af, dus `media-src` staat
  `blob:` toe. Mediabunny gebruikt geen workers of externe bestanden.
- **Getest:** een mp4 van 1080 × 1920 en ~11 seconden is in de app-browser in ongeveer 12 seconden
  klaar (3,8 MB), met geluid. De terugval via MediaRecorder levert in realtime ook een mp4.

## Vandaag (fase 3a)

- **Widgetbord.** Alle blokken op Vandaag zijn widgets. Via "Indelen" versleep je ze (muis,
  touch en toetsenbord met dnd-kit: spatie oppakken, pijltjes, spatie neerzetten, met
  Nederlandse meldingen voor schermlezers), zet je ze uit (en via de balk bovenaan weer aan) en
  kies je per widget een breedte: smal, half, breed of de hele rij, voor zover hij dat aankan.
  De indeling staat lokaal (`sm-vandaag`); de pure logica in `lib/today/layout.ts` vult nieuwe
  widgets uit latere versies vanzelf aan en ruimt geschrapte widgets op. In de bewerkmodus
  doet de inhoud van de widgets even niet mee (`inert`), zodat je niets per ongeluk aantikt.
- **Nu bezig** (al uit fase 1): vak, lokaal, docentcode, een ring met de minuten tot de bel, en de
  volgende les met een knipperend bolletje bij een lokaalwijziging.
- **Dagtijdlijn** vervangt het lijstje lessen: blokken in vakkleur op een tijdas, uitval
  doorgestreept en gearceerd, tussenuren als gestippeld gat, een "nu"-streep. Op een telefoon
  scrolt hij opzij. Een blok opent die dag in het rooster.
- **Toets-radar** vervangt het lijstje toetsen: toetsen in de komende 14 dagen als stipjes,
  dichterbij in tijd is dichter bij het midden, verspreid met de gulden hoek (nooit op elkaar).
  Een stip opent de stof, de datum en een aftelzin. Het studieplan is geschrapt (zie onder).
- **Trend:** je laatste vijf cijfers als bolletjes in de cijferkleuren, met een pijltje op basis
  van de lijn door de punten (vanaf 0,12 per cijfer). Alleen onthulde cijfers: wat nog in je pack
  zit, verklapt de trend niet. De bolletjes vervagen in de privacymodus.
- **Fietsweer** via Open-Meteo (gratis, zonder sleutel, met CORS): het weer op je vertrektijd
  (eerste les min je fietstijd) en je eindtijd, van vandaag of anders de volgende schooldag. Eén
  advies, belangrijkste eerst: storm, regen (vanaf 0,3 mm of 60% kans), tegenwind (vanaf 15 km/u
  recht tegen, berekend met je richting naar school), kou, hitte, rugwind, of gewoon prima. In de
  instellingen kies je je woonplaats (zoeken via de geocoder van Open-Meteo), je richting op een
  kompasroos en je fietstijd. Standaard: Utrecht, oost, 15 minuten. Alleen de coördinaten van die
  plaats gaan naar Open-Meteo.
- **Aftellen:** weekend (op vrijdag tot de laatste bel), de volgende vakantie in jouw regio
  (Noord, Midden of Zuid in de instellingen) en, in een examenklas, het eerste centraal examen
  (woensdag 12 mei 2027, bron: DUO-examenrooster 2027 havo en vwo; elk jaar bijwerken in
  `lib/today/countdowns.ts`). De vakanties komen uit de open data van Rijksoverheid. Die stuurt
  geen CORS-header mee, dus de app haalt ze via de eigen route `/api/schoolvakanties` (een dag
  gecachet, met een ingebouwde reserve tot en met de zomer van 2028).
- **Begroeting:** al uit fase 1, met tijd en context.
- **Nog niet op Vandaag:** de profielkaart en de dagelijkse quest horen bij de gamification en
  komen in fase 6. Afvinken met beloning en de tijdsschatting komen in fase 3c.
- **Voor de CSP (fase 5b):** `connect-src` staat `https://api.open-meteo.com` en
  `https://geocoding-api.open-meteo.com` toe.

## Rooster (fase 3b)

- **Vier weergaven.** Dag (standaard op een telefoon, vegen voor de vorige of volgende
  schooldag), week (standaard vanaf 768 px: kolommen op een tijdas met een live nu-lijn), lijst
  (de week dag voor dag) en maand (stipjes in vakkleur voor toetsen; tik op een dag voor de
  dagweergave). Je eigen keuze blijft bewaard (`sm-rooster`). De pijltjes links en rechts
  bladeren per dag, week of maand, ook met ← en → op het toetsenbord. In het weekend opent het
  rooster op maandag. Een link met `?dag=2026-10-09` springt naar die dag.
- **Lescards** in vakkleur met icoon, lokaal, docent en lesuur, plus icoontjes voor huiswerk en
  toetsen. In de weekweergave een kleine variant (vakcode, begintijd en lokaal).
- **Uitval:** grijs, doorgestreept en een schuine stempel "VERVALLEN". De eerste keer valt die
  er met een klap op, daarna staat hij er gewoon (per les onthouden). Valt het eerste uur uit:
  "Uitslapen! 😴" met de nieuwe begintijd; het laatste uur: "Vroeg naar huis! 🏠". Allebei met een
  klein confettimoment, één keer per dag. Een gat door uitval heet "Tussenuur! ☕". In de
  weekweergave zegt de stempel het al, daar tekenen we alleen de echte gaten.
- **Slimme tussenuren:** gaten van 40 minuten of meer tussen je eerste en laatste les, met het
  huiswerk dat er het eerst moet zijn en in het gat past (op basis van de tijdsschatting uit
  `lib/homework/estimate.ts`). Zonder passend huiswerk een vrije-tijdzin. Geen "start focus".
- **Wijzigingen-detector:** per databron een snapshot van de komende twee weken in IndexedDB
  (`rooster:<bron>`). Bij elke verversing vergelijken we: uitval, gaat toch door, ander lokaal,
  andere tijd, andere docent, extra les en verdwenen les. De eerste keer telt alles wat al
  afwijkt (uitval en lokaalwijzigingen). Een banner bovenaan noemt het aantal nieuwe
  wijzigingen; "Wat is er veranderd?" toont ze in gewone taal ("Do 5e uur: Frans vervalt") met
  de datum, en een tik springt naar die dag. Een gewijzigde les pulseert tot hij 2,5 seconde in
  beeld is geweest.
- **Toetsen** gloeien op hun kaart met een 📝-label. Tik voor de stof, het aftellen en je eigen
  notities (blijven op dit apparaat). Geen studieplan (geschrapt).
- **Weekbelasting:** per dag een kleurbalk (vrij, rustig, normaal, druk, zwaar) uit lesuren,
  huiswerk (1,5 per opdracht) en toetsen (4 per toets). Vanaf drie toetsen in een week:
  "⚠️ Drukke week: 3 toetsen". In de dagweergave is de balk ook de dagkiezer.
- **Samenvattingen:** per dag "6 uur · 08:30–14:50 · 1 toets · 2× huiswerk", per week
  "Deze week: 31 lessen, 2 uitgevallen, 4 tussenuren", en de langste (slak) en kortste (haas)
  dag van de week.
- **Exporteren:** "Naar je agenda" maakt een .ics met vier weken rooster (vanaf maandag van deze
  week), in de tijdzone Europe/Amsterdam. Uitval staat erin als vervallen.
- **Demo** (vervallen met de demo): bij **Instellingen → Ontwikkelaar** verzon je een roosterwijziging (uitval of ander
  lokaal in de komende week) om de detector te zien werken, en zet je alles weer terug.

## Huiswerk (fase 3c)

- **Overzichten:** Vandaag, de volgende schooldag ("Morgen", of na een vrijdag "Maandag"),
  Komende dagen en Later, met per groep de open tijd. Of als **kanban** (Te doen / Bezig /
  Klaar): sleep een kaart met muis of vinger (op een telefoon even vasthouden), of gebruik de
  pijlknoppen op de kaart (ook met het toetsenbord). Naar Klaar slepen is afvinken.
- **Afvinken** met beloning: de vinkknop veert, het vinkje tekent zichzelf, er spetteren puntjes
  weg, "+10 XP" vliegt omhoog, met een plop en een trilling. Is alles voor de volgende
  schooldag af, dan regent het confetti over de hele app en komt er een droge melding (één keer
  per dag). Sup die danst hoort bij de mascotte in fase 6. XP zelf telt pas mee in fase 6: die
  rekent het uit met het moment van afvinken dat nu al bewaard wordt.
- **Alleen op dit apparaat.** Afvinken, "bezig", eigen tijden en mini-stapjes staan lokaal per
  databron (`sm-huiswerk`). De koppeling met Magister leest alleen (de proxy doet alleen GET),
  dus Magister zelf merkt niets van je vinkjes. Wat Magister al als afgerond kent, staat
  meteen op Klaar.
- **Tijdsschatting per item:** de app schat uit de tekst (per opdracht, per paragraaf, een
  hoofdstuk lezen, leren voor een toets). Je kunt per vak een standaardtijd kiezen (Instellingen
  → Huiswerk, of vanuit een item), die geldt voor huiswerk maar niet voor toetsen. Per item kun
  je de tijd ook zelf zetten; die wint altijd. Ook de slimme tussenuren in het rooster rekenen
  met jouw tijden en slaan afgevinkt huiswerk over.
- **Drukte-meter:** de komende vijf schooldagen als staafjes met de open tijd per dag (vrij,
  rustig tot 30 min, normaal tot een uur, druk tot 100 min, daarboven zwaar). Een zware dag
  krijgt een zin. Tik op een dag om erheen te scrollen. Bovenaan staat de tijd voor de
  komende week (niet voor alle vier de weken, dat is vooral schrikken).
- **"Ik heb geen zin":** kies "Maak het kleiner" (de taak in mini-stapjes: wat uit de opdracht
  komt, zoals "Lees § 3.2" en "Maak opdracht 4", staat er letterlijk, de rest komt uit
  `content/copy.ts`; je vinkjes blijven bewaard) of "Alleen 5 minuten": een eigen timer van vijf
  minuten (geen focusmodus) die het item op Bezig zet. Na vijf minuten een belletje (ook als de
  app-geluidjes uit staan, maar niet bij "Alles stil") en "Nog 5?".
- **Vandaag:** de widget "Huiswerk voor morgen" heeft nu ook afvinken en de totale tijd.
- **Notities** kun je nu bij elke les en toets maken (in het rooster, tik op een les).
- **Geluid:** de plop en het belletje zijn gesynthetiseerd, net als de walkout. Ze klinken
  alleen als "Geluidjes in de app" aan staat (standaard uit, zie Instellingen → Geluid).
- Niet gebouwd (geschrapt): planner, studieplan-generator, focusmodus en streak.

## Cijfers (fase 4)

- **Overzicht:** per vak een kaart met het gewogen gemiddelde (rood onder 5,5, oranje tot 6,5,
  groen daarboven), een trendlijntje van de laatste cijfers met de 5,5 als stippellijn, het aantal
  cijfers en de laatste vijf. Wat nog in je pack zit, staat er geblurd bij met "Open je pack".
  Tik op een vak voor het vak-detail (`/cijfers/{vak}`).
- **Tabbladen:** Vakken, Ranglijst (op gemiddelde, met ↑↓ en het verschil dat het laatste cijfer
  maakte), Periodes (periode 1, 2 en 3 per vak als balken, één kleur die per periode voller wordt,
  met de 5,5 en een tabelweergave), Tijdlijn (al je cijfers per maand als verhaal, met mijlpalen:
  je eerste cijfer, je eerste 9, comebacks en je hoogste cijfer) en Examen (alleen in een
  examenklas, of als er PTA-cijfers zijn).
- **Vak-detail:** een grafiek van alle cijfers in de tijd (grotere stip = zwaardere toets, een open
  ring telt niet mee), de lijn van je gemiddelde tot dan toe en de 5,5-lijn, met tooltip en
  tabel. Daarnaast het gemiddelde per periode, het SE (als er PTA-cijfers zijn) en alle cijfers
  met omschrijving, datum, weging en PTA.
- **"Wat moet ik halen?"-calculator:** kies een vak, een doel en de weging van de volgende toets
  (standaard de weging die bij dat vak het vaakst voorkomt). Het benodigde cijfer staat groot in
  beeld, met "Al binnen. 😎", "Onmogelijk. 😬" of "telt niet mee" (weging 0) als dat zo is. Hij
  gokt niet op afronding: 5,45 is geen 5,5. Daaronder het omgekeerde: "Met een 7,0 sta je dan op
  een 5,6". Vakken met alleen V/G staan er niet in. Te openen vanaf Cijfers, het vak-detail, de
  walkout (bij een onvoldoende, met het vak al ingevuld) en Ctrl+K.
- **Simulator:** voeg denkbeeldige cijfers toe (vak, cijfer met een slider, weging, en in een
  examenklas of het voor je SE telt). Het gemiddelde per vak en de overgangsmeter bewegen live
  mee. Er wordt niets opgeslagen; Reset haalt alles weg.
- **Overgangsmeter:** "Over ✅", "Bespreekgeval ⚠️" of "Gevarenzone ❌", met een wijzer, de
  tekortpunten, het aantal onvoldoendes en het gemiddelde, en precies welke vakken het verschil
  maken: een tekort dat je status verbetert als het een 6 wordt, of een vak op het randje dat je
  status verslechtert als het een punt zakt. De normen zijn in te stellen: vrije tekortpunten,
  maximaal aantal tekortpunten en onvoldoendes, laagste cijfer, kernvakken (Ne/En/Wi) met eigen
  grenzen, een gemiddelde-eis bij tekorten en de marge voor een bespreekgeval. Presets:
  Veelvoorkomend, Streng, Ruim en de Slaag-zakregeling (een schatting op je SE; geen
  bespreekgeval). In een examenklas staat standaard de slaag-zakregeling aan en heet het de
  Slaagmeter.
- **Afronden:** een rapportcijfer is je gemiddelde zoals je het ziet (één decimaal), afgerond op
  een heel cijfer: 5,45 wordt 5,5 wordt 6. Het SE-cijfer heeft één decimaal; een vak zonder
  centraal examen krijgt dat SE-cijfer, afgerond op een heel cijfer, als eindcijfer (die dubbele
  afronding is hier de regel).
- **Bovenbouw:** per vak de PTA-kolommen apart, het SE onafgerond (drie decimalen) en afgerond, en
  het combinatiecijfer: het afgeronde gemiddelde van de afgeronde eindcijfers van de vakken die
  je kiest, ongeldig met een onderdeel onder de 4. De app stelt maatschappijleer, profielwerkstuk,
  ckv en dergelijke voor. De demo heeft die vakken niet (extra demovakken zouden de kleuren van
  bestaande vakken verschuiven); kies er zelf een paar om het te proberen.
- **Inzichten** in gewone taal, uit je onthulde cijfers: een vak dat al minstens drie toetsen op
  rij stijgt of daalt, een vak op het randje (5,5 of 5,6), je gemiddelde tegenover periode 1, de
  dag van de week met je hoogste cijfers, je beste vak en je aantal negens.
- **Rekenlogica** staat in `lib/calc` (gemiddelde, afronding, "wat moet ik halen", overgangsnormen,
  SE en combinatiecijfer, periodes, ranglijst, simulator, inzichten, tijdlijn), met Vitest-tests
  voor de lastige gevallen: V/G/O, cijfers die niet meetellen, weging 0 en een vak zonder cijfers.
- Alles telt alleen met onthulde cijfers. Je normen, tabblad en combinatievakken staan lokaal
  (`sm-cijfers`).

## Koppeling met Magister (fase 5a: de echte API)

- **Gecontroleerd met echte data.** `scripts/verzamel-magister.js` plak je één keer in de
  console van je eigen Magister (F12 → Console). Het gebruikt het token uit sessionStorage
  (key `oidc.user:https://accounts.magister.net:M6-{school}.magister.net`, met `access_token`
  en `expires_at`; zo'n token is ongeveer een uur geldig) alleen binnen het script. Het haalt
  rustig alle endpoints op, met per endpoint de bekende varianten, en downloadt één JSON-bestand.
  Tokens en cookies komen er nooit in; `lib/magister/collector.test.ts` controleert dat.
- **Ruwe exports blijven lokaal** in `magister-voorbeelden/` (in `.gitignore`, net als `*.har`).
  `scripts/anonimiseer-magister.mjs` maakt er testbestanden van in `lib/magister/__fixtures__`:
  nepnaam, nepdocenten, neplokalen, nep-id's en nepteksten, in precies dezelfde vorm. Cijfers
  schuiven per vak een vaste, geheime stap (veelvoud van 0,1, of hele stappen bij vakken met
  hele cijfers), zodat Magisters eigen gemiddelden blijven kloppen met de nepcijfers. Het
  script controleert zelf dat er geen echte waarde achterblijft.
- **Endpoints** (`lib/magister/endpoints.ts`): account, aanmeldingen (`?geenToekomstige=false`),
  vakken, cijferperioden, afspraken, roosterwijzigingen, absenties en laatste cijfers werkten
  allemaal zoals bekend. **Cijfers** komen niet uit het oude cijferoverzicht (dat bleek leeg of
  alleen lege vakregels) maar uit `/api/aanmeldingen/{id}/cijfers`: per cel de kolom met
  weegfactor, periode en studievak-id (het vak via `/vakken` van hetzelfde schooljaar). Het
  oude overzicht gebruiken we alleen nog om te weten welke vakken cijfers kunnen krijgen.
- **Codes, met echte voorbeelden:**
  - Afspraken: Type 13 = les; 1, 2 en 3 = persoonlijk, algemeen en schoolbreed (tonen we);
    6 = roostervrij, 101 = markering zonder duur en hele dagen tonen we niet.
  - Status 4 en 5 = vervallen (uitval), 3, 9 en 10 = gewijzigd; lessen uit
    `/roosterwijzigingen` zijn ook "gewijzigd" (Magister geeft daar het oude lokaal niet bij).
  - InfoType 1 = huiswerk (89 voorbeelden), 2 = toets (bevestigd), 3–5 tentamen, SO,
    mondeling, 6 = informatie, 7 = aantekening.
  - Absenties: Verantwoordingtype 1 afwezig (ook spijbelen, counseling), 2 te laat, 3 ziek,
    7 boeken/materiaal vergeten, 8 huiswerk vergeten.
  - Cijferkolommen: `cijfer` (toetsen), `gemiddelde` (kop VG: Magisters gemiddelde per vak),
    `formule` en `som` (kop TEK: tekortpunten, per school anders; die gebruiken we niet).
  - Beoordelingen: V, G, O, RV (ruim voldoende), Vr (vrijstelling) en Inh (inhalen). Achter
    V/G/O zet Magister een verborgen getal; dat telt niet mee, ook niet bij Magister zelf.
  - Magisters rekenvakken "gemiddelde over alle vakken" (gem) en "tekortpunten over alle
    vakken" (tek) zijn geen echte vakken.
- **Gemiddelden vergeleken:** over drie schooljaren en zo'n zestig vak-perioden is ons gewogen
  gemiddelde, afgerond op één decimaal, steeds gelijk aan Magisters VG-kolom. Het verschil
  (ongeveer ±0,05) is alleen afronding. `compareAverages` doet die vergelijking; bij een echt
  verschil staat er sinds 5b een waarschuwingsicoon. Magisters "gemiddelde over alle vakken" en
  zijn tekortpunten gebruiken een eigen keuze aan vakken; die vergelijken we niet.
- **Schooljaren:** het huidige schooljaar wordt automatisch gekozen (in de zomer het nieuwste
  dat al begonnen is); examenklassen herkennen we aan de studie ("K_HAVO/5", "6 vwo"). Een
  schooljaar kan meerdere perioden hebben (OV1, OV2); we volgen wat Magister erbij zet. PTA
  herkennen we voorlopig aan "SE"/"PTA" in periode of kolomkop: nog niet getest met echte
  bovenbouwdata.
- **Proxy** (`/api/magister/[...path]`, `lib/magister/proxy.ts`): alleen GET, school strikt
  `^[a-z0-9-]+\.magister\.net$`, paden alleen letters, cijfers, `-` en `_`, alleen het token en
  `Accept` door (geen cookies, geen doorverwijzingen volgen), nooit loggen of opslaan. Fouten:
  401 en een doorverwijzing worden "verlopen", 403, 404, 429 met "probeer over X seconden",
  5xx "Magister plat", time-out na 15 seconden.
- **Databron** (`lib/magister/source.ts`): levert de types uit `lib/types.ts`, via de
  client (dus de proxy). Zuinig: schooljaren, vakken en cijfers
  worden 30 seconden gedeeld in plaats van dubbel opgevraagd. Het welkomstpack zijn de laatste
  vijf echte cijfers (zonder Inh en vrijstellingen); de rest is bij de eerste koppeling al
  onthuld. Sinds 5b zit hij in de app (zie hieronder).

## Koppelen en echte data (fase 5b)

- **Eén plek voor het token** (`lib/koppelen/session.ts`): bewaren (alleen in sessionStorage van
  het tabblad, nooit in localStorage of op een server), verlopen (`expires_at`, of een 401) en
  opnieuw koppelen. Open tabbladen delen de sessie via een BroadcastChannel: een nieuw tabblad
  vraagt erom, opnieuw koppelen en ontkoppelen gelden overal tegelijk. De rest van de app vraagt alleen `get()`.
- **Alle wegen eindigen op dezelfde plek** (`lib/koppelen/link.ts`): bookmarklet, plakveld
  en voorbeelddata. Eerst `/api/account` om te kijken of het token werkt en wie
  je bent, dan pas bewaren. Een ander account dan hiervoor? Dan gaat eerst alles van het vorige
  account van dit apparaat af. Het welkomstpack werkt daardoor voor elke weg hetzelfde.
- **Bookmarklet** (`lib/koppelen/bookmarklet.ts`): zoekt in sessionStorage de sleutel
  `oidc.user:…`, anders elke sleutel in sessionStorage en localStorage met een `access_token`, en
  opent `/koppelen#koppel=1&token=…&expires_at=…&school=…`. Alleen op `*.magister.net` (niet
  `accounts.`), en niet als de sessie al verlopen is. Het adres is waar de app draait, of
  `NEXT_PUBLIC_SITE_URL`. React laat geen `javascript:`-links toe, dus de koppelpagina zet de
  `href` zelf. Getest door de code echt te draaien op een nagebootste Magister-pagina.
- **Fragment** (`lib/koppelen/fragment.ts`, `components/koppelen/LinkIntake.tsx`): het fragment
  wordt op elke pagina meteen gelezen en met `history.replaceState` gewist, nog voor er iets anders
  gebeurt. School streng `^[a-z0-9-]+\.magister\.net$`, token alleen Bearer-tekens (20–8192).
- **Plakveld** (`lib/koppelen/paste.ts`): snapt de waarde van `oidc.user:…` (JSON), een link van
  de bookmarklet, of een los token (met of zonder "Bearer"). Het verloopmoment komt uit
  `expires_at` of uit het token zelf (`exp`); de school uit de link, een tenant in het token, of het
  veld eronder. Het veld wordt na koppelen leeggemaakt.
- **Cache** (`lib/magister/cache.ts`): elk antwoord staat in IndexedDB onder
  `cache:{bron}|{methode}|{argumenten}`. Is het nog vers, dan vragen we Magister niets; anders zie
  je eerst het bewaarde antwoord en ververst het op de achtergrond. Versheid: rooster, cijfers en
  absenties 15 minuten (de schermen vragen elk kwartier, en bij terugkomen in het tabblad), vakken
  en perioden 6 uur, account en schooljaren een dag, eerdere schooljaren een week. Per onderdeel
  hooguit één verzoek tegelijk; tabbladen delen een slot (`navigator.locks`) en kijken eerst of een
  ander tabblad net heeft ververst. Na een mislukte verversing een minuut niet (bij 429 zo lang als
  Magister vraagt). Na een 401 vraagt de app Magister niets meer tot je opnieuw koppelt. Het
  rooster haalt vakken en cijfers via de cache, niet bij elke verversing opnieuw.
- **Laatste update:** het moment van de laatste geslaagde verversing, in de chip, Instellingen en
  de "Opnieuw koppelen"-sheet ("Je ziet de stand van 14:02").
- **Verlopen** (`components/koppelen/SessionWatcher.tsx`): 5 minuten ervoor een rustige melding,
  daarna (of bij een 401) de sheet, één keer per token. "Later" onthoudt dat tabblad. Een stuk dat
  nog nooit is opgehaald, toont geen eindeloze lader maar een uitleg met "Opnieuw koppelen"
  (`DataErrorState`). Fouten die niet beter worden van opnieuw proberen (verlopen, geen toegang)
  worden niet herhaald, en de schermen lezen de cache ook zonder internet.
- **Welkomstpack:** bij de eerste koppeling is alles al onthuld en in je collectie, behalve de
  laatste vijf cijfers. Heeft het schooljaar er nog geen vijf (in september, of zoals bij ons in
  oktober met alleen een Inh), dan komen ze uit vorig jaar. Cijfers uit eerdere schooljaren staan
  in de collectie (met het schooljaar op de kaart) en worden daarna nooit meer een pack, ook niet
  als een oud jaar pas later binnenkomt (`withHistoryRevealed`). Het pack wacht op de eerdere
  jaren, zodat een laat schooljaar geen pack van honderd kaarten wordt.
- **Per account en jaar apart:** alles wat per databron wordt bewaard, staat onder het id van
  de bron (`magister:{school}:{persoon}`): onthulde cijfers, gokken, vitrine, gemelde
  doelen en prestaties, huiswerkvinkjes, combinatiecijfer, roostersnapshot en nu ook de
  roosternotities en stempels (die waren nog gedeeld). Tijdens
  de hydratie is de bron altijd leeg, zodat server en browser hetzelfde tekenen; de
  chip blijft tot dan onzichtbaar.
- **Schooljaren:** automatisch het huidige; in Instellingen kies je een eerder jaar. Zo'n jaar
  krijgt een eigen bron-id (`…:{schooljaar}`), heeft geen pack, en de chip zegt welk jaar je
  bekijkt.
- **Ontkoppelen** (`lib/koppelen/wipe.ts`): token weg in alle tabbladen, alle IndexedDB-sleutels
  van `magister:`-bronnen, de per-bron-gegevens in localStorage en de queries in het geheugen.
  Daarna vraagt de app weer om te koppelen.
- **Gemiddelden:** wijkt Magisters VG-kolom (afgerond op één decimaal) af van het onze, dan staat
  er bij dat vak een driehoekje: "Magister rekent hier anders, check je cijferoverzicht", met per
  periode beide gemiddelden en de gebruikelijke oorzaken. Niet zolang er cijfers van dat vak in je
  pack zitten: Magisters gemiddelde zou je nieuwe cijfer verraden.
- **Koppelpagina:** de status, dan "Zo koppel je": de bladwijzer met drie geanimeerde stapjes,
  daaronder drie genummerde stappen (knop slepen, Magister openen, op de bladwijzer klikken), een
  uitklapper "Wat doet die bladwijzer precies?" en stappen voor de telefoon. Daaronder "Lukt het
  niet met de bladwijzer?": het plakveld met een nagebootst schermpje van de ontwikkelaarstools.
- **Voorbeelddata** (alleen tijdens het bouwen, Instellingen → Ontwikkelaar): koppelt met de
  geanonimiseerde testbestanden via de transport `"voorbeeld"`, zodat de hele route te testen is
  zonder echt account. Met een knop om de koppeling te laten verlopen.
- **CSP** (`proxy.ts`, `lib/security/csp.ts`): per pagina een nonce; scripts alleen van de app
  zelf (`'strict-dynamic'`, geen inline of eval buiten het bouwen), `connect-src` alleen de eigen
  server en Open-Meteo, `img-src` met `data:` en `blob:`, `media-src` met `blob:`, geen plugins,
  niet in een frame, `upgrade-insecure-requests` in productie. Stijlen mogen inline (Framer
  Motion). Daardoor wordt elke pagina per verzoek gerenderd.

## Browserextensie (fase 5c, verwijderd 8 oktober 2026)

De extensie is gebouwd, goedgekeurd en daarna op verzoek helemaal weer verwijderd: de map
`extension/`, `lib/extensie/`, de extensie-transport, het stil vernieuwen (`setRenewer`), de
scripts voor de Web Store en `privacy.md`. De bladwijzer is de hoofdmanier van koppelen, met het
plakveld als reserve. Na ongeveer een uur koppel je opnieuw met één klik op de bladwijzer.

## Onboarding

- **Eén keer, de eerste keer** (`stores/onboarding.ts`, `components/onboarding/`): intro (logo,
  ±4 s, tikken slaat over), drie uitlegkaarten met een mini-animatie (een stukje walkout, het
  gokmoment, een dag met uitval en afgevinkt huiswerk), thema, woonplaats en vakantieregio (mag
  "Later"), koppelen, het welkomstpack met walkout, en klaar met tips.
- **Koppelen is de echte stap:** geen demo om op terug te vallen. De koppelstap legt de bladwijzer
  uit met dezelfde kaart als `/koppelen` (plakken klapt uit onder "Lukt het niet?"). Zonder
  koppeling is er geen "Verder"-knop en doen `→` en vegen niets; **Overslaan** kan altijd. Zodra
  je gekoppeld bent (ook in het tabblad dat de bladwijzer opende, via het storage-event) gaat hij
  vanzelf door naar je welkomstpack.
- **Voortgang** staat in localStorage (`sm-onboarding`): sluit je halverwege, dan ga je verder
  waar je was. Wie de app al gebruikte (er staan al `sm-`-sleutels), krijgt hem niet ongevraagd.
  Opnieuw bekijken via Instellingen → Over.
- Vegen op aanraakschermen, `←`/`→`/`Enter` op een computer, werkt met minder beweging en op
  smalle telefoons. Disclaimer: "SuperMagister is onofficieel. Je gegevens blijven op je eigen
  apparaat."

## Live op supermagister.nl (v1.0.0)

- **Eén adres** (`lib/site.ts`): `NEXT_PUBLIC_SITE_URL`, anders het productiedomein van Vercel,
  anders `http://localhost:3000`. Altijd zonder `www.` (Vercel stuurt www door). Gebruikt voor
  `metadataBase`, robots.txt, de sitemap en de bladwijzer (die zonder instelling het huidige adres
  neemt, zodat previews en localhost blijven werken).
- **Metadata en iconen:** titel, beschrijving en Open Graph in de layout; een deelafbeelding
  (`app/opengraph-image.tsx`, nachtlucht, logo en twee gouden kaarten), een apple-touch-icon en
  PNG-iconen voor het manifest (`/icons/192`, `/icons/512`, `/icons/maskable`), allemaal met
  next/og uit dezelfde vorm als het logo in `lib/brand/index.ts` (`lib/brand/marks.tsx`). Manifest:
  `start_url` /vandaag, `scope` /, standalone, nachtkleur.
- **Zoekmachines:** alles staat op noindex behalve Vandaag (waar / heen stuurt) en /privacy;
  robots.txt zegt hetzelfde, de API krijgt `X-Robots-Tag: noindex`.
- **Headers:** naast de CSP (nu ook `frame-src 'none'` en `manifest-src 'self'`) HSTS voor twee
  jaar, COOP same-origin, geen DNS-prefetch en een Permissions-Policy die camera, microfoon,
  locatie, betalen en dergelijke uitzet. Lettertypes komen via next/font van de eigen server.
- **Proxy:** daarbovenop een rem per IP-adres (`lib/security/rate-limit.ts`): 300 verzoeken per
  minuut, ruim omdat een hele school achter één adres kan zitten. Alleen een teller in het
  geheugen, per serverinstantie; niets gelogd of bewaard.
- **Ontwikkelaarsinstellingen** zijn live verborgen; 7× snel tikken op het versienummer (Over
  SuperMagister) zet ze aan of uit (`developer` in de instellingen). De voorbeeldkoppeling en
  Gegevens controleren blijven alleen voor het bouwen.
- **Publieke pagina's:** /privacy in gewone taal; één disclaimer-component
  (`components/legal/Disclaimer.tsx`) op /koppelen, in de onboarding, op /privacy en in
  Instellingen; een foutpagina met humor (`app/error.tsx`) en een kaal vangnet
  (`app/global-error.tsx`) voor als zelfs de layout omvalt.
- **Sneller openen:** de walkout, command palette, sheets en de onboarding-laag laden pas als ze
  nodig zijn (`components/shell/LazyOverlays.tsx`, `components/onboarding/OnboardingGate.tsx`); de
  walkout en de palette worden daarna op de achtergrond alvast opgehaald. Pagina's achter de
  koppeling renderen op de server een lege plek in plaats van de hele pagina (de server weet
  niet of je gekoppeld bent). Daardoor zakte de Total Blocking Time van ±0,5–1 s naar ±0,25 s.
- **Lighthouse (mobiel, lokaal op de productie-build, mediaan van 3)** op 8 oktober 2026:

  | Pagina    | Performance | Toegankelijkheid | Best practices | SEO          |
  | --------- | ----------- | ---------------- | -------------- | ------------ |
  | Vandaag   | 75          | 100              | 100            | 100          |
  | Cijfers   | 77–78       | 100              | 100            | 63 (noindex) |
  | /koppelen | 77–82       | 100              | 100            | 63 (noindex) |

  SEO 63 is bewust: die pagina's staan op noindex. Performance blijft onder de 90 door de
  hoeveelheid JavaScript (React plus de app, ±1 MB onverpakt): de LCP (±4–5 s gesimuleerd op een
  trage telefoon) wacht op het hydrateren. Verder omlaag kan met kleinere bundels per pagina; de
  metingen op deze laptop schommelden ook flink, dus meet na livegang met PageSpeed Insights.

- **Controle van de geschiedenis** (8 oktober 2026): geen tokens (alleen het nep-token uit de
  tests), geen .env- of HAR-bestanden, geen ruwe Magister-exports en geen echte schoolnaam. Het
  verzamelscript staat in `scripts/` en wordt niet als pagina meegeleverd.

## Na de eerste test (9 oktober 2026)

- **Wat moet ik halen? zonder koppeling:** vanuit een oefenkaart of de demo opent een calculator
  met handmatig invullen (`components/grades/ManualCalculatorSheet.tsx`, `lib/calc/manual.ts`),
  boven alle lagen, in plaats van het koppelscherm.
- **Woonplaats:** geen standaard (Utrecht) meer; leeg tot je kiest. Het fietsweer zegt dan "Stel
  je woonplaats in" en vraagt niets op. Wie de oude standaard nog had, krijgt hem leeg (migratie
  naar instellingen-versie 3).
- **Gokmoment:** na de klap tegen de echte rating vervaagt je gok, zodat er nooit twee getallen
  tegen elkaar aan blijven staan (dat las als "4671"); ook op het eindscherm en met minder
  beweging.
- **Walkout:** vak, weging en toets staan ongeveer de helft langer in beeld, komen sneller binnen
  en blijven langer stil; vak en toets zijn groter (tot 92% van de breedte). Een walkout duurt
  daardoor ±9 in plaats van ±8 seconden.
- **Onboarding:** stappen wisselen zonder wachten (`AnimatePresence mode="popLayout"`): de nieuwe
  stap staat er meteen, de oude schuift erachter weg, dus geen leeg scherm en elke tik reageert
  binnen ±0,1 s. Eén stip per stap, ook voor elk van de drie uitlegkaarten. Een gloed in de
  themakleuren achter de onboarding, zodat een ander thema meteen zichtbaar is. Getest op 375,
  768 en 1280 px in Chrome.
- **Logo op één plek:** `lib/brand/index.ts`; het favicon is nu `/logo.svg`, gemaakt uit diezelfde
  vorm (`app/icon.svg` is weg).
- **Privacy:** contact via roelcool3@gmail.com (`CONTACT_EMAIL` in `lib/site.ts`).
- **Toegankelijkheid:** axe op alle pagina's (mobiel en desktop, zonder koppeling, in de demo en
  in de onboarding): geen meldingen meer. Het koppelscherm heeft nu een h1, de Meer-knop een
  duidelijke naam.

## Jouw Elftal (9 oktober 2026)

- **Plek:** een tabblad op Collectie (`?tab=elftal`, zodat de command palette ernaartoe kan),
  naast het album. Per databron opgeslagen (`sm-elftal`): demo, echte data en eerdere jaren lopen
  nooit door elkaar, en ontkoppelen wist de echte. Alleen kaart-id's, nooit cijfers.
- **Spelers** (`lib/squad/players.ts`): alleen onthulde kaarten. Rating = cijfer × 10 van de kaart.
  Afwijking: beoordelingen (V, G, …) spelen mee met een vaste rating (ZG 90, G 80, RV 72, V 65,
  O 45); vrijstelling, inhalen en "niet beoordeeld" niet. Zonder dit had bijna niemand een keeper,
  want LO krijgt op de meeste scholen alleen V's en G's (in de demo ook). "Geen dubbele spelers" gaat
  op de vaknaam (`vakKey`), zodat wiskunde A van dit en vorig jaar hetzelfde vak is.
- **Toetssoort** bestaat niet in Magister; we leiden hem af uit de omschrijving (SO, proefwerk, PO,
  mondeling, SE, toets, …). Onbekend telt nooit als "dezelfde soort". Periode = schooljaar + periode.
- **Formaties** (`lib/squad/formations.ts`): vijf, met posities in procenten en de lijnen per
  formatie. Een andere formatie houdt iedereen zo goed mogelijk op zijn plek (zelfde plek, dan
  positie, dan linie, dan wat over is); wie geen plek heeft, gaat naar de bank.
- **Chemie** (`lib/squad/chemistry.ts`): lijnwaarde groen 10, oranje 5, rood 0, het gemiddelde over
  de bezette buren. Spelerschemie = basis per soort plek plus een deel van dat gemiddelde:
  natuurlijk 4 + 0,6×, flexibel 3 + 0,6× (max 9), verkeerde linie 1 + 0,4× (max 5), keeper ↔
  veld altijd 0. Aanvoerder +1 (max 10), maar een keeper-fout blijft 0. Teamchemie = som / 110 ×
  100; een lege plek telt als 0. Squad-rating = afgerond gemiddelde van wie er staat.
- **Beste elftal** (`lib/squad/build.ts`): score = gemiddelde rating (lege plek = 0) + ¼ ×
  teamchemie. Per vak de beste kaart, een eerste opstelling op natuurlijke linie en rating, dan
  "beste wissel" (twee plekken omdraaien of iemand van de bank erin) tot het niet beter wordt.
  Altijd dezelfde uitkomst. Ter vergelijking rekent hij ook "alleen de hoogste ratings" uit en
  noemt hij een formatie die minstens 2 punten beter is.
- **Bediening:** tikken werkt overal (en met het toetsenbord: elke plek is een knop): lege plek →
  een lijst schuift omhoog, gesorteerd op chemie voor die plek en dan rating; volle plek →
  selecteren, dan een andere plek tikken om te wisselen, of Vervangen, Aanvoerder, Haal weg.
  Slepen alleen met de muis (dnd-kit, `MouseSensor`), zodat vegen op een telefoon gewoon scrolt.
  Elke plek heeft een naam als "Spits, Wiskunde, rating 82, chemie 9"; dnd-kit's
  `aria-disabled`/`aria-roledescription` halen we weg, anders klinkt een lege plek "uitgeschakeld".
- **Veld:** CSS-gras met gemaaide banen, stadionlicht in de themakleur, lijnen als SVG. Lijnen
  hebben naast de kleur ook een lijnsoort (doorgetrokken, gestreept, gestippeld). Kaartjes zijn
  HTML met de kleuren en vorm van de echte kaart (`faceStyleFor`, kaartmasker); de rating vervaagt
  in de privacymodus.
- **Delen** (`lib/squad/render.ts`): één tekenfunctie van t, zoals de walkout. Afbeelding = eindbeeld;
  video = kaarten vliegen één voor één op, dan de lijnen, dan tikt de rating op (±7 s), met
  dezelfde video-engine en geluidsrecepten. Standaard zonder ratings (ook de squad-rating wordt
  "–") en zonder naam.
- **Oefenwedstrijd** (`lib/squad/match.ts`): sterkte = 75% rating + 25% chemie (minder als je
  elftal niet vol is), doelpunten uit een Poisson-verdeling, scorers vaker uit de aanval.
  Verzonnen tegenstanders, nooit echte clubs, personen of docenten. Clubnamen komen uit
  schoolwoorden; zelf een bekende club invullen mag niet.
- **Statistieken:** vijf nieuwe anonieme events (elftal geopend, gebouwd, gedeeld, video,
  oefenwedstrijd), ook op het dashboard en in /privacy.

## Ontwikkelaarsdashboard en anonieme statistieken (9 oktober 2026)

- **Niet vindbaar.** Het adres komt uit `DEV_DASHBOARD_PATH`; `proxy.ts` stuurt het intern door naar
  `/dev-dashboard-intern` als er een geldige sessie is, of (alleen de inlogpagina en het inloggen)
  met de juiste `?key=` uit `DEV_DASHBOARD_KEY`. Anders gebeurt er niets bijzonders en is het
  adres een gewone, niet-bestaande pagina: getest, de 404 is byte voor byte gelijk aan die van een
  willekeurig adres (op het pad en de nonce na). Het interne adres rechtstreeks geeft ook een 404;
  die is wel van buiten te onderscheiden (Next.js zet er een `x-middleware-rewrite`-header bij),
  maar de naam staat toch al in deze openbare repo. De beveiliging zit in de drie geheimen, niet
  in de naam. Elke pagina en route controleert zelf nog een keer header en sessie
  (`lib/dev-dashboard/guard.ts`); de toegangsheader wordt van elk binnenkomend verzoek gewist.
- **Vergevingsgezind ingesteld** (na de eerste livegang, waar het dashboard een 404 bleef geven):
  de variabelen worden opgeschoond (spaties en aanhalingstekens weg, het pad met precies één slash
  vooraan en geen aan het eind), het pad wordt zonder hoofdletters vergeleken, een spatie in
  `?key=` telt als `+`, en de minimale lengte is 8 tekens. Klopt er toch iets niet, dan logt de
  server één regel met de reden (nooit de waarden), en `npm run dashboard:check` controleert een
  env-bestand zonder iets te tonen. De variabelen worden runtime gelezen (gecontroleerd: ze staan
  niet in de build), maar Vercel geeft nieuwe waarden pas mee na een nieuwe deploy.
- **Sessie zonder database:** een ondertekend cookie `v1.<verloopmoment>.<HMAC>`, met een sleutel
  uit het wachtwoord (nieuw wachtwoord = alle sessies weg). Vergelijken in constante tijd (beide
  kanten eerst door HMAC). Inlogrem: 5 per 15 minuten per IP, in het geheugen (per
  serverinstantie). Uitloggen wist het cookie op dit apparaat; een gestolen cookie stop je door
  het wachtwoord te veranderen.
- **Eigen layout.** Op het dashboard rendert de root-layout alleen de hemel (donker, met sterren):
  geen app-shell, onboarding, themascript, statistieken of Vercel Analytics. De grafieken
  (`components/charts`) zijn zelfgebouwd SVG, volgens de dataviz-skill: 2px lijnen, één as,
  crosshair met tooltip (ook ← en →), legenda bij twee of meer reeksen en altijd een tabel.
  Kleuren blauw, oranje en aqua, gevalideerd op de donkere achtergrond. In de stijlgids staan ze
  met neutrale voorbeelddata, zonder het dashboard te noemen.
- **Tellers:** één Redis-hash per dag (`sm:dag:<datum>`, Nederlandse tijd) met alleen
  veldnamen uit een vast alfabet (`a-z 0-9 : -`) en `EXPIREAT` op 400 dagen. Events alleen uit de
  whitelist (`lib/stats/events.ts`); keuzes zoals de onboardingstap of het videoformaat zitten
  in de naam zelf, dus vrije tekst kan er niet in. Tellen gaat via een buffer per serverinstantie
  die hooguit eens per 5 seconden in één pipeline wegschrijft (scheelt Upstash-commando's), na het
  antwoord met `after()`. Geen extra dependency: de REST-API van Upstash met `fetch`.
- **Proxy-gezondheid** zonder dat de browser iets stuurt: aantal verzoeken dat Magister bereikte,
  statusgroep (een doorverwijzing telt als 401: sessie weg), wat de proxy zelf weigerde, en de
  responstijd per uur als som, aantal en histogram (zo is de p95 te benaderen zonder losse
  metingen te bewaren). De waarschuwing komt als het aandeel 401 of 5xx vandaag minstens 10
  procentpunt hoger én het dubbele is van de week ervoor, of boven de 40% komt (vanaf 20
  verzoeken).
- **Afwijking: Open-Meteo** roept de browser rechtstreeks aan (zo gaan er geen coördinaten langs
  onze server). Fouten daarvan kunnen dus niet aan de serverkant geteld worden; de browser telt ze
  als event `fout-open-meteo`. De vakantie-API telt wel op de server.
- **Funnel en "eerste walkout":** er worden geen mensen gevolgd, dus de trechter is een benadering
  van losse tellers. Om "eerste walkout" en "welkomstpack" maar één keer te tellen staan er twee
  vinkjes in `sm-statistiek` (localStorage); die sleutel telt niet mee bij "is dit een
  terugkerende gebruiker" voor de onboarding.
- **Opt-out:** Instellingen → Privacy → "Anonieme statistieken delen" (standaard aan). Do Not Track
  of Global Privacy Control: de browser stuurt niets, en de server telt ook niets als de header
  toch binnenkomt. Vercel Analytics krijgt het adres zonder query en fragment, met `[vak]` in
  plaats van de vakcode.
- **Live check** vanaf de server: de eigen proxy (zonder token moet hij "geen-token" zeggen),
  accounts.magister.net, Open-Meteo en Rijksoverheid.

## Geschrapt (besluit 6 oktober 2026)

Deze onderdelen uit de opdracht gaan er helemaal uit, nu en in latere fases. Waar iets ernaar
verwees, laten we het weg of vervangen we het door iets wat nog wel bestaat.

- **Wekkeradvies.**
- **Tas-inpaklijst**, ook de herinnering in fase 7.
- **Planner** (huiswerk naar dagen slepen).
- **Studieplan-generator**, ook de knoppen ernaar bij de toets-radar en bij toetsen in het rooster.
- **Focusmodus**, ook "start focus" bij tussenuren en in de command palette (verwijderd), de
  sneltoets F (verwijderd), focusminuten voor XP, focusuren in Wrapped en de achievements en
  jaartitels daarover (zoals "Focusmonster" en "Gevaarlijk Gefocust").
- **Streak** (huiswerk op tijd), ook de streak-bevriezer, streak-achievements, de streak-slide in
  Wrapped, de streak in XP en quests, en de "Op tijd-streak" bij aanwezigheid.
- **Schooldag-laadbalk** ("Schooldag 64% geladen", besluit 7 oktober 2026, na fase 3a): de widget
  op Vandaag met het "Download voltooid"-moment is weer weg. Ook later: de balk
  "zomervakantie.exe — 78%" op de laatste schooldag (feature C) vervalt (de countdown in lessen
  blijft), en de laadbalk-scène in de Studio komt er niet.

- **Fase 6, gamification** (besluit 8 oktober 2026): geen XP, levels, quests, profiel,
  aanwezigheid, mascotte Sup, weekrecap of Wrapped. Wat er al was (XP, achievements, de pagina
  Prestaties) blijft in de code maar staat standaard uit: Instellingen → Ontwikkelaar → "Prestaties
  en XP tonen". Feature C (laatste schooldag) is geparkeerd.
- **De demo en de browserextensie** (8 oktober 2026), zie hierboven.

Blijft wel: de **reeks** (RKS) op de kaarten uit fase 2. Dat is een reeks voldoendes per vak, geen
app-streak. De **"ik heb geen zin"-knop** (fase 3c) blijft ook, met zijn eigen 5-minutentimer.

## Nog niet gebouwd

PWA, offline, meldingen, seizoensthema's en easter eggs (fase 7).
