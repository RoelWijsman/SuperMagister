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
  hartslag. Op de plek van de rating staat een groot "?" met "Wat heb je?" erboven.
- **Eén gebaar.** Slepen (waar dan ook) rolt de teller als een gokkast-teller van 1,0 tot 10,0,
  6 px per tiende, met oplopende tikjes en een lichte trilling. Op een computer ook het scrollwiel
  of ↑/↓ (Page Up/Down per hele punt, Home/End naar 1,0/10,0). Je eerste beweging begint bij je
  gemiddelde voor dat vak; alles rekent in tienden (geen afrondingsfouten). Loslaten of Enter zet
  de gok vast: klik, het getal bevriest, een halve seconde stilte, dan meteen de flip. Tik je op
  de kaart zonder te slepen, dan draait hij meteen om zonder gok (heb je met het wiel of de
  pijltjes al een getal gekozen, dan zet de tik dat vast). Na 8 seconden zonder actie verschijnt
  rustig "Sleep omhoog of omlaag". Nooit een automatische skip of tijdsdruk: "Overslaan" springt
  hooguit naar het gokmoment, nooit eroverheen.
- **Commentaar** staat klein onder de kaart en wisselt mee met je teller. Tussen 5,6 en 5,9 heeft
  een eigen bereik; de opdracht sloeg dat over. Bij 6,7 wiebelt de teller en staat er "…nee. We
  doen dit niet.": de enige 6-7-grap, als één vaste zin (een bewuste uitzondering op "minstens 5
  varianten").
- **Een open einde in een pure tijdlijn.** Zolang je nog niet gegokt hebt, duurt de fase `gok`
  oneindig lang (de tijdlijn stopt daar netjes). Bij het vastzetten bouwen we de tijdlijn opnieuw,
  met de gokduur ingevuld; alles daarvóór blijft gelijk, dus het beeld loopt naadloos door. De
  spanningsloop wordt in blokken van 12 seconden ingepland en loopt in elk blok precies door.
- **Na de flip** verschijnt je gok als doorschijnend "spookcijfer" (in de inktkleur van de kaart,
  met een paarse rand) naast de echte rating en schuift er met een klap tegenaan: lichtflits,
  "boem" en een kleine terugvering. Daarna de strook "Gegokt 7,2 · Echt 7,8 · +0,6" met een
  reactie.
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

## Bewust nog niet in fase 2

Walkout als video (feature B) · versleepbare widgets, rooster-weergaven,
afvinken en focus (fase 3) · vak-detail en de calculator achter "Wat moet ik halen?" (fase 4) ·
koppelen, proxy en CSP (fase 5) · XP, achievements, profiel en recaps (fase 6) · PWA, offline,
meldingen, seizoensthema's en easter eggs (fase 7).
