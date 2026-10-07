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

- **Daan Visser, 5 havo (examenklas)**, op het fictieve Noorderlicht College: 12 vakken met cijfers
  plus mentoruur, 61 handgeschreven cijfers, een vast weekrooster en absenties.
- De cijfers vertellen verhalen: Engels gaat elke toets omhoog, Duits worstelt met een comeback,
  scheikunde krabbelt op na een 4,9, en wiskunde levert een ICON op.
- Het eerste pack bevat vier cijfers: 5,2 Duits (brons), 6,8 scheikunde (In Form, comeback),
  8,1 Engels (In Form, record, reeks) en als laatste 9,7 wiskunde A (ICON).
- De ICON uit het startpack maakt het verzameldoel "Exacte toppers" af (daarvoor staat de
  biologietoets H4 op een 8,4 en niet hoger). Zo zie je in de demo ook een doel binnenkomen.
  "Goudkoorts" blijft bewust open: Duits heeft nog geen gouden kaart.
- **Kalender.** De demo rekent vanaf vandaag terug in schooldagen (zonder weekend, zomer- en
  kerstvakantie). Omdat drie periodes cijfers nodig hebben, loopt het demo-schooljaar daardoor
  over de zomer heen: periode 1 en 2 liggen in het voorjaar, periode 3 is nu. Dat is een bewuste
  keuze voor een rijke demo.
- Rond vandaag staan altijd een paar vaste gebeurtenissen: vandaag een lokaalwijziging en het
  laatste uur uitval, morgen het eerste uur uitval ("uitslapen") en een toets, en toetsen verspreid
  over de komende twee weken. Hetzelfde vak heeft nooit twee toetsen binnen 10 dagen.
- Deterministisch: dezelfde dag geeft dezelfde data, en cijfers houden op elke dag hun id en waarde.

## Datalaag

- `SchoolDataSource` (`lib/data/source.ts`) is het contract. De demo-bron levert alles uit
  `lib/demo`; in fase 5 komt er een Magister-bron achter de proxy. Componenten gebruiken alleen de
  hooks uit `lib/data/hooks.ts`.
- Huiswerk en toetsen worden afgeleid uit lessen (`lib/school/derive.ts`), net als bij Magister.
- Welke cijfers al onthuld zijn, staat per databron in IndexedDB. Niet-onthulde cijfers tellen nog
  nergens mee, zodat gemiddeldes je pack niet verklappen.
- **Magister-client (voorbereid in fase 4).** `lib/magister/client.ts` praat alleen met een
  _transport_. Welke transport, staat op één plek: `TRANSPORT` in `lib/magister/config.ts`.
  Nu is dat `"proxy"`: GET-verzoeken naar de eigen route `/api/magister/...` met het token in
  `Authorization` en de school in `X-Magister-School` (gecontroleerd op
  `^[a-z0-9-]+\.magister\.net$`, paden alleen letters, cijfers, `-`, `_` en `/`). Later kan het
  `"extensie"` worden (een browserextensie); die transport bestaat al en zegt eerlijk dat de
  extensie er nog niet is. De rest van de app merkt van zo'n wissel niets. Fouten worden
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
- Let op voor de CSP in fase 5: het kaartmasker is een `data:`-SVG en de deelvoorbeelden zijn
  `blob:`-adressen, dus `img-src` moet `data:` en `blob:` toestaan.

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
- **Demo.** Daan heeft 38 eerdere gokken: een bescheiden pessimist, een orakel bij wiskunde A en
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
- **Voor de CSP in fase 5:** de preview speelt een `blob:`-adres af, dus `media-src` moet `blob:`
  toestaan. Mediabunny gebruikt geen workers of externe bestanden.
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
- **Voor de CSP in fase 5:** `connect-src` moet `https://api.open-meteo.com` en
  `https://geocoding-api.open-meteo.com` toestaan.

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
- **Demo:** bij **Instellingen → Ontwikkelaar** verzin je een roosterwijziging (uitval of ander
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

Blijft wel: de **reeks** (RKS) op de kaarten uit fase 2. Dat is een reeks voldoendes per vak, geen
app-streak. De **"ik heb geen zin"-knop** (fase 3c) blijft ook, met zijn eigen 5-minutentimer.

## Nog niet gebouwd

Koppelen, proxy-route, parsers en CSP (fase 5; de client staat klaar) · XP, achievements,
profiel, mascotte Sup, quests en recaps (fase 6) · PWA, offline, meldingen, seizoensthema's en
easter eggs (fase 7).
