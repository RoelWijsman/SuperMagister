# Aanvulling op SuperMagister: 3 extra features + humorbijbel

Voeg deze 3 features toe aan het bestaande plan van SuperMagister. Bouw ze pas als de onderdelen waar ze op voortbouwen klaar zijn:
- "Gok je cijfer" en "Walkout als video": na fase 2 (cijferonthulling)
- "Laatste schooldag": na fase 6 (gamification + Wrapped)

Stop na elke feature, vertel me wat ik moet testen en wacht op mijn akkoord. Alle bestaande regels uit het hoofdplan gelden hier ook.

---

## HUMORBIJBEL (geldt voor de HELE app, lees dit eerst)

### De stem van de app

SuperMagister praat als die ene klasgenoot op de achterste rij die precies één zin zegt, waarna de hele klas ligt. Droog. Een beetje moe. Ziet alles. Nooit gemeen.

### Principes

1. **Droog > druk.** Maximaal één emoji per tekst, liefst nul. Geen uitroeptekens-regen. Geen "Wauw! Lekker bezig! 🎉🔥".
2. **Specifiek > algemeen.** Herkenbaar Nederlands schoolleven is het grappigst, bijvoorbeeld:
   - de tosti in de aula, het mentoruur, de conciërge
   - tegenwind op de fiets in november, in het donker
   - "pak een blaadje" (SO), een Teams-deadline om 23:59
   - de wifi die het nooit doet, het lokaal zonder ramen
   - "het is maar een oefentoets", de docent die 15 minuten met de beamer worstelt
   - de laatste les voor een vakantie (film of Kahoot, er is geen derde optie)
   - ouderavond, PWS
3. **Gebruik echte data in de grap.** "Je gokte een 5,8. Het is een 7,4. Waarom praat je zo over jezelf?" is 10× grappiger dan een algemene tekst. Gebruik template-variabelen: {cijfer}, {gok}, {verschil}, {vak}, {aantal}, {lokaal}, {tijd}, {klas}, {naam}.
4. **Absurde precisie.** "Dat zijn 20.860 frikandellen. We hebben het nagerekend."
5. **Timing.** Korte zin. Witregel. Punchline. Nooit de grap uitleggen.
6. **Galgenhumor en vrolijk nihilisme** (de vibe van 2026), maar de grap gaat altijd over de situatie, nooit over de leerling.
7. **Zelfspot.** De app weet dat ze een app is, en een "clanker" (gemaakt door AI). Dat mag ze toegeven.
8. **Bij een onvoldoende:** eerst de droge grap, dan in één zin oprecht steunend, dan een concrete actie ("Met een 7 sta je weer op een 6,1"). Nooit uitlachen.
9. **Memes spaarzaam en alleen als ze kloppen.**
   - Bruikbaar (2026): de nihilistische pinguïn (die eenzaam richting de bergen loopt), cooked, crash out, glazing, aura (farming), lowkey/highkey, low/high cortisol, lore-dump, clanker, delulu.
   - Nederlands: skeer, boeieuh, kaulo, ainaaa, je capt, ziek.
   - 6-7 maximaal één keer in de hele app, en dan zelfbewust (de app weet dat het een beetje dood is).
10. **NIET gebruiken:**
    - Italiaanse brainrot (Tung Tung Tung Sahur, Tralalero, enzovoort): door de Great Meme Reset van 2026 officieel dood verklaard
    - skibidi, gyatt, rizz-grappen
    - scheldwoorden, alles seksueels, alles wat een groep mensen belachelijk maakt

### Goed vs. slecht

| Slecht | Goed |
|---|---|
| "Wauw, een 8! Lekker bezig! 🎉🔥" | "Een 8,2. Je docent heeft drie keer gecontroleerd of dat klopte." |
| "Oei, een onvoldoende 😢" | "Een 5,4. De 5,5 was letterlijk dáár. Je kon hem ruiken." |
| "Je hebt een tussenuur! 🎉" | "Tussenuur. 50 minuten in de aula naar je tosti staren. Prachtig." |
| "Laden…" | "Magister wakker maken. Die is 's ochtends ook niet zo snel." |
| "Alle huiswerk af! Goed gedaan!" | "Alles af. Je hebt nu officieel niks meer te doen. Eng, hè." |

### Techniek

- Alle teksten in `content/copy.ts`, zodat ik ze zelf kan aanpassen.
- Per situatie minimaal 5 varianten. Toon nooit twee keer achter elkaar dezelfde.
- **Humor-review:** loop na het schrijven elke tekst langs met de vraag: "Zou een 15-jarige hier een screenshot van maken?" Zo nee: herschrijf of schrap. Kies altijd de kortste versie.
- Herschrijf met deze bijbel ook bestaande teksten in de rest van de app: laadteksten, lege staten, meldingen, achievements en begroetingen.

---

## Feature A: Gok je cijfer 🎯

Vóór elke kaart in de walkout gok je eerst welk cijfer je hebt.

### Het gokscherm

- Vak-icoon, vaknaam en toetsomschrijving, plus "Wat denk je dat je hebt?". Variant-subregels:
  - "Eerlijk zijn. Je weet het eigenlijk al."
  - "Je voelde het tijdens de toets al."
  - "Geen druk. (Wel een beetje.)"
- Een grote slider van 1,0 tot 10,0 (stap 0,1) met het cijfer gigantisch in beeld:
  - de kleur verloopt van rood naar groen
  - tikgeluidje met een stijgende toonhoogte en een lichte haptic
- **Live commentaar** onder de slider (meerdere varianten per bereik):
  - 1,0: "Je hebt je naam wel ingevuld, toch?"
  - 1–3: "Dat was geen toets. Dat was een ervaring." / "Je denkt nog steeds aan vraag 4, hè."
  - 3–5: "Lowkey cooked."
  - 5,0–5,4: "Zo dichtbij. Zo ver weg."
  - 5,5: "Precies genoeg. Efficiënt."
  - 6–6,9: "Realistisch. Saai. Respect."
  - **6,7:** de slider wiebelt even op en neer, met de tekst "…nee. We doen dit niet." (de enige 6-7-grap in de hele app)
  - 7–8: "Zelfvertrouwen van iemand die de oefentoets wél heeft gemaakt."
  - 8–9,4: "Aura farming."
  - 9,5–10: "Of je bent een genie, of je denkt aan een andere toets."
- Knoppen:
  - "Vastzetten"
  - "Overslaan, ik ben er klaar voor (ben ik niet)"
- Bij V/G/O wordt deze stap overgeslagen. Aan/uit in de instellingen.

### Na de onthulling

- Een strook onder de kaart: "Gegokt 7,2 · Echt 7,8 · +0,6".
- Reacties (gebruik echte getallen):
  - **precies goed:** paarse flits, sterren, een apart geluid, "HELDERZIENDE" groot in beeld. Tekst: "Precies goed. Dit is óf een gave, óf je hebt de nakijkstapel gezien. We vragen niks."
  - **binnen 0,3:** "Je kent jezelf beter dan je mentor je kent."
  - **binnen 0,5:** "Netjes ingeschat."
  - **verder ernaast:** "Jouw gok en jouw cijfer hebben elkaar nog nooit ontmoet."
  - **echt veel hoger:** "Je gokte een {gok}. Het is een {cijfer}. Waarom praat je zo over jezelf?"
  - **echt veel lager:** "Je gokte een {gok}. Het is een {cijfer}. De verwachtingen waren hoog. De werkelijkheid was ook aanwezig." Gevolgd door steun en een "Wat moet ik halen?"-knop.
- XP: veel bij precies goed, aflopend naar een paar XP voor de moeite.

### Gokkerstype (bij Cijfers en in het profiel)

- onderschat structureel → **"De Bescheiden Pessimist"**: "Je denkt elke keer dat je het verpest hebt. Je hebt het nog nooit verpest. Je gelooft ons niet. Ook dat zagen we aankomen."
- overschat structureel → **"Hoofdpersonage"**: "Elke toets voelt als een 8. Elke toets is een 6,2. We bewonderen de energie."
- zit er steeds dichtbij → **"Het Orakel van {klas}"**: "Je weet je cijfer voordat je docent het weet. Docenten zijn een beetje bang van je."
- totaal willekeurig → **"Chaosgokker"**: "Je gokken volgen geen enkel patroon. Wetenschappers willen je bestuderen."

Daarnaast:
- nauwkeurigheid per vak: "Bij wiskunde ben je een orakel. Bij Frans ben je een muntje dat je opgooit."
- een grafiekje met gok vs. echt cijfer in de tijd

### Achievements

- "Verdacht": precies goed gegokt
- "Orakel": 5 keer binnen 0,3
- "Lage verwachtingen, hoge cijfers": 10 keer te laag gegokt
- "Delulu is níet de solulu": 10 keer te hoog gegokt
- "Script gelezen": 3 keer op rij binnen 0,5
- **Geheim:** "Dit had niet mogen gebeuren": 6,7 gegokt én 6,7 gehaald

### Opslag

Per cijfer-id in IndexedDB: de gok, het moment en het verschil.

---

## Feature B: Walkout als video delen 🎬

### Techniek

- De video moet er precies zo uitzien als de walkout op het scherm. Maak de walkout-tijdlijn deterministisch: een pure functie van tijd t.
- Bouw een canvas-renderer die frame voor frame tekent (de live walkout mag ook zelf op die renderer draaien).
- Export bij voorkeur frame-exact via WebCodecs + een mp4-muxer (bijv. Mediabunny).
- Fallback: canvas.captureStream() + MediaRecorder (mp4 waar ondersteund, anders webm).
- Het geluid wordt apart gerenderd met een OfflineAudioContext en in de video gemuxt.

### Opties

- 9:16 (1080×1920) of 1:1 (1080×1080).
- **Mysterie-modus** (standaard aan): de video stopt vlak vóór de kaart omdraait en eindigt met een groot "?" en "Raad mijn cijfer." Daaronder klein: "Fout = jij haalt tosti's."
- **Cijfer verbergen:** een sticker over het cijfer. Kies uit: "Nee.", "Staatsgeheim", "Vraag mijn advocaat", "Niet vandaag", "Boeieuh".
- Je naam wel of niet tonen.
- Klein SuperMagister-logo als watermerk.

### Flow

- Knop "Maak video" op het eindscherm van de walkout en in de collectie.
- Een voortgangsscherm met procent en wisselende teksten:
  - "Pixels in de goede volgorde zetten…"
  - "Flares aansteken. Binnen. Niet thuis proberen."
  - "Deze clanker werkt zo hard als hij kan."
  - "Renderen gaat sneller dan jij je huiswerk maakt."
  - "Bijna klaar. (Dat zeggen we altijd.)"
- Preview-speler met "Delen" (Web Share API) en "Downloaden".
- Maak de video-engine herbruikbaar voor Wrapped (feature C).

---

## Feature C: Laatste schooldag voor de zomer ☀️

### Detectie

- De laatste schooldag wordt bepaald via de schoolvakanties (Rijksoverheid open data, de regio uit de instellingen) en de laatste les in het rooster.
- In de instellingen kun je de datum handmatig overschrijven.
- **Testknoppen** in de ontwikkelaarsinstellingen: "Simuleer laatste schooldag" en "Simuleer eindbel".

### De hele dag

- Zomerthema: warme zonsondergang-gradients, zwevende zonnetjes en ijsjes. Sup draagt een zonnebril.
- Een countdown op Vandaag die bij elke bel aftelt:
  - "Nog 4 lessen. Je bent er bijna. Je bent er niet."
  - "Nog 3 lessen. Je mentor wenst iedereen 'een fijne zomer'. Knik gewoon."
  - "Nog 2. Niemand doet nog iets. De docent ook niet."
  - "Laatste les. Film of Kahoot. Er is geen derde optie."
- De schooldag-laadbalk: "zomervakantie.exe — 78%", met daaronder klein: "Niet afsluiten tijdens de installatie."

### De finale (bij de laatste bel)

Als de app open is: fullscreen, gesynchroniseerd met de bel. Anders bij de eerste keer openen daarna.

1. Het scherm wordt donker en een countdown 10…1 klinkt steeds harder.
   - Bij 7 hapert het: "6… 7— nee. Professioneel blijven." Daarna gaat de countdown gewoon door.
2. Bij 0: een vuurwerkshow op canvas (pioenen, palmen, gouden regen, knetterend), confettikanonnen van beide kanten, een opbouwende fanfare (Web Audio) en een lange haptic.
3. Een gigantische titel "ZOMERVAKANTIE." met een wisselende ondertitel:
   - "School heeft je uitgelogd wegens inactiviteit. (Van jou. Sinds mei.)"
   - "Magister staat tot september stil. Wij ook."
   - "De pinguïn loopt richting de bergen. Maar dan blij."
   - "Tot september. Of nooit. (September.)"
4. Een knop: "Bekijk je jaar →".

**Extra knop:** "Ik ben over (ik zweer het)". Die start een walkout van een ICON-kaart: "PROMOTIE · Klas {x} → Klas {y}", met eronder klein: "Geverifieerd door: jijzelf".

### Jaar-Wrapped

Een swipebare story met grote cijfers en een animatie per slide. Gebruik overal echte data.

- **Uren op school:** "Je zat dit jaar {uren} uur op school." Witregel. Daarna een absurde eenheid (kies willekeurig):
  - "Dat is {x} keer alle Harry Potter-films."
  - "Of {x} frikandellen. 3 minuten per stuk. We hebben het nagemeten."
  - "Of één heel lang mentoruur."
- **Uitval:** "{x} uur uitval. {x} uur waarin je officieel niks hoefde. Waarschijnlijk de beste uren van je jaar."
- **Beste vak:** "Je beste vak: {vak}. Op de ouderavond noemen ze je waarschijnlijk 'een fijne leerling'."
- **Grootste stijger:** "Grootste stijger: Frans. Van 'pardon?' naar 'oké, ik snap het een beetje'." Met een grafiekje.
- **Beste kaart:** "Je beste kaart van het jaar." Daarna een mini-walkout.
- **Kaartverdeling:** "12 brons, 30 zilver, 15 goud, 3 TOTY. Een gebalanceerde collectie. Zo kun je het noemen."
- **Huiswerk:** "{x} huiswerkitems afgevinkt. Wij geloven je."
- **Streak:** "Langste streak: {x} dagen. Dag {x+1} was een woensdag. We weten wat er gebeurd is."
- **Focus:** "{x} uur gefocust. Je plantje is een boom geworden. Een kleine boom. Een boompje."
- **Gokkerstype** uit feature A.
- **Lokaal:** "Meest bezochte lokaal: {lokaal}. {x} uur. Je kent elke vlek op het plafond."
- **Vroegste les:** "Vroegste les: 08:10. In november. In het donker. Met tegenwind. Je bent een held."
- **Te laat:** "{x} keer te laat. Dat lag aan de wind. Toch?"
- **JAARTITEL** (de grote slide, onthuld als een walkout). Maak er minstens 15, elk met een datavoorwaarde en een ondertitel. Bijvoorbeeld:
  - veel uitval → **"Gesponsord door Uitval"**: "Je school viel {x} uur uit. Jij hebt elk uur gerespecteerd."
  - grote comeback → **"De Comeback Die Niemand Zag Aankomen"**: "Begonnen in brons. Geëindigd in goud. Netflix wil de rechten."
  - studieplannen gemaakt → **"Iemand Met Een Planning Voor De Planning"**
  - veel focusuren → **"Gevaarlijk Gefocust"**: "Je telefoon heeft je gemist."
  - veel tussenuren → **"Burgemeester van de Aula"**: "Het tostiapparaat kent je bij naam."
  - vaak te laat → **"Vecht Tegen De Wind (Verliest)"**
  - precies gokken → **"Het Orakel"**
  - hoog gemiddelde → **"Aura: Niet Meetbaar"**: "Docenten praten over je in de lerarenkamer. Positief."
  - stabiel rond de 6 → **"Zesjescultuur, Met Onderscheiding"**: "Precies genoeg. Elke keer. Dat is geen geluk, dat is strategie."
  - huiswerk vaak na 22:00 afgevinkt → **"Avondmens (Gedwongen)"**: "Je beste werk lever je om 23:47 in. Teams weet het."
  - gemiddelde elke periode gestegen → **"Elke Periode Een Update"**: "Versie 1.0 in september. Versie 3.2 nu. Minder bugs."
  - zware toetsweek overleefd → **"Overleefde de Toetsweek (Ternauwernood)"**
  - eerst veel onvoldoendes, toch over → **"De Pinguïn Die Toch Omdraaide"**: "Even richting de bergen gelopen. Toch teruggekomen. Respect."
  - **fallback** → **"Gewoon Een Heel Normaal Jaar"**: "Geen drama. Geen crash-outs. Eerlijk gezegd een beetje verdacht."
- **Laatste slide:** een poster met je jaartitel en je belangrijkste stats, deelbaar als afbeelding. Onderaan: "Seizoen 2 start in september. Niemand heeft erom gevraagd."

Delen kan per slide als afbeelding, of als video via de engine van feature B.

### Zomerstand

- De app wordt minimaal. Sup ligt in een strandstoel.
- Een countdown die van toon verandert:
  - begin: "Nog {x} dagen vakantie. Magister kan je niet vinden. Je bent vrij."
  - halverwege: "Nog {x} dagen. Je weet niet meer welke dag het is. Zo hoort het."
  - laatste week: "Nog {x} dagen. Je denkt er al aan, hè. Niet doen."
  - laatste dag: "Morgen weer school. De pinguïn draait om en loopt terug naar de kolonie."
- Wrapped blijft opnieuw te bekijken.
- In de laatste week een teaser: "SuperMagister seizoen 2. Nieuwe kaarten. Zelfde wifi."
