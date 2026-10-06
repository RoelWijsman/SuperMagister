# SuperMagister: bouwopdracht

> **Let op (6 oktober 2026):** wekkeradvies, tas-inpaklijst, planner, studieplan-generator,
> focusmodus en streak zijn geschrapt, nu en in latere fases. Zie "Geschrapt" in
> `docs/ontwerp.md`. De opdracht hieronder is verder ongewijzigd.

Bouw "SuperMagister": een webapp die de Magister-leerlingomgeving vervangt door iets dat mooi, supersnel en vooral leuk is. Speels, vol kleine verrassingen en beloningsmomenten, maar nooit in de weg: het is een tool die je elke dag gebruikt.

Het grote paradepaardje: nieuwe cijfers onthul je met een walkout in FIFA/EA FC Ultimate Team-stijl, en elk cijfer wordt een verzamelkaart. Dat FIFA-thema geldt alleen voor de cijferonthulling, de kaarten en de collectie. De rest van de app heeft géén voetbalthema, maar een eigen frisse, speelse stijl.

Alles in het Nederlands.

---

## 1. Tech stack

- Next.js (App Router) + TypeScript (strict)
- Styling en animatie:
  - Tailwind CSS voor styling
  - Framer Motion voor animaties en paginatransities
  - canvas (2D) voor deeltjes, flares en confetti (canvas-confetti mag)
- Data en state:
  - TanStack Query voor data ophalen en cachen
  - Zustand voor UI-state en instellingen
  - idb-keyval (IndexedDB) voor offline cache en lokale data
- UI-hulpmiddelen:
  - lucide-react voor iconen
  - DOMPurify voor huiswerk-HTML
  - html-to-image voor deelbare afbeeldingen
  - dnd-kit voor drag & drop
- Grafieken: zelfgebouwde SVG-componenten (mooier en lichter), of visx als dat nodig is
- Kwaliteit:
  - Vitest voor unit tests van alle rekenlogica
  - ESLint + Prettier
- PWA: manifest, service worker en installeerbaar op telefoon
- Geen database, geen accounts: alles via de Magister-API plus lokale opslag

## 2. Mappenstructuur

- app/: routes (vandaag, rooster, huiswerk, cijfers, collectie, prestaties, instellingen, koppelen)
- app/api/magister/[...path]/route.ts: de proxy
- components/ui/: design system (Button, GlassPanel, Sheet, Tabs, Toast, Skeleton, CommandPalette, Widget)
- components/walkout/: walkout en pack-opening
- components/cards/: de verzamelkaart in alle tiers en varianten
- components/mascot/: de mascotte (zie §4)
- lib/magister/: endpoints.ts, client.ts, parsers.ts, types.ts
- lib/demo/: realistische nepdata
- lib/calc/: gemiddelden, "wat moet ik halen", overgangsnormen, kaarttiers en kaartstats (met tests)
- lib/audio/: Web Audio-synthesizer voor alle geluiden
- lib/gamification/: XP, levels, achievements, quests
- stores/: Zustand-stores

---

## 3. Koppelen met Magister (veilig, geen wachtwoorden)

Magister heeft geen officiële publieke API. De leerlingomgeving gebruikt een interne REST-API op https://{school}.magister.net/api/... met een Bearer-token (OIDC via accounts.magister.net). Een externe site kan niet zelf via Magister inloggen, en de browser blokkeert directe calls (CORS).

1. **Nooit wachtwoorden vragen of opslaan.** Geen nagebouwd Magister-loginformulier.
2. **Koppelen via bookmarklet.** Een mooie koppelpagina (/koppelen) met een geanimeerde uitleg in 3 stappen en een bookmarklet om naar de bladwijzerbalk te slepen. Als je ingelogd op {school}.magister.net op de bookmarklet klikt:
   - zoekt hij in sessionStorage de key die begint met `oidc.user:` en haalt daar `access_token` en `expires_at` uit
   - opent hij SuperMagister met token, schoolhost en verloopdatum in het URL-**fragment** (#), nooit in de query string
   - leest de app het fragment, slaat het op in sessionStorage en wist het fragment direct (history.replaceState)
3. **Fallback:** een veld om het token handmatig te plakken, met uitleg.
4. **Proxy** `/api/magister/[...path]`:
   - stuurt alleen GET-requests door naar `https://{school}.magister.net/api/{path}`
   - geeft de Authorization-header van de client door
   - valideert de schoolhost strikt met `^[a-z0-9-]+\.magister\.net$` (SSRF-preventie)
   - logt nooit tokens en slaat niets op
5. **Verlopen token:** een vriendelijke "Opnieuw koppelen"-sheet in plaats van een foutmelding, terwijl de laatst opgehaalde data zichtbaar blijft.
6. **Demo-modus:** een volledig werkende app met realistische nepdata (12 vakken, ~60 cijfers met wegingen over 3 periodes, inclusief onvoldoendes en een paar 9+, een volledig rooster met uitval, lokaalwijzigingen, toetsen, huiswerk en absenties). Bouw en test alles eerst in demo-modus.
7. **Zichtbaar onderscheid:** altijd duidelijk welke data je ziet, via een "DEMO"-label of een "Gekoppeld met {school}"-chip.
8. **CSP-headers** en DOMPurify voor alle HTML uit Magister.

### API-laag

Deze endpoints zijn bekend uit open-source projecten. Ze zijn onofficieel en kunnen veranderd zijn. Zet ze allemaal in `endpoints.ts`:

- `GET /api/account` → Persoon.Id, Roepnaam, Achternaam (en mogelijk de geboortedatum)
- `GET /api/personen/{id}/cijfers/laatste?top=50&skip=0` → laatste cijfers (vak, waarde, weegfactor, omschrijving, ingevoerdOp, isVoldoende, teltMee)
- `GET /api/personen/{id}/afspraken?van=YYYY-MM-DD&tot=YYYY-MM-DD` → rooster (Start, Einde, LesuurVan, LesuurTotMet, Omschrijving, Lokatie, Vakken, Docenten, Inhoud = huiswerk-HTML, InfoType, Status, Afgerond)
- `GET /api/personen/{id}/aanmeldingen` → schooljaren
- `GET /api/personen/{id}/aanmeldingen/{aanmeldingId}/cijfers/cijferoverzichtvooraanmelding?actievePerioden=false&alleenBerekendeKolommen=false&alleenPTAKolommen=false` → volledig cijferoverzicht
- `GET /api/personen/{id}/absenties?van=...&tot=...` → absenties

Parsers moeten defensief zijn:
- zowel PascalCase als camelCase keys accepteren
- decimale komma's ("7,8") omzetten
- niet-numerieke waarden ("V", "G", "O", "ZG") apart behandelen
- ontbrekende velden opvangen

Zet alles om naar eigen, schone types: Subject, Grade, Lesson, Homework, Test, Absence. De rest van de app kent alleen deze types. Status- en InfoType-codes vertaal je naar enums (les, toets, schriftelijk, mondeling, huiswerk, uitval, wijziging).

Als je twijfelt hoe een response eruitziet: vraag mij om een voorbeeld uit het Netwerk-tabblad in plaats van te gokken.

---

## 4. Design system ("fantastisch" is de eis)

**Look:**
- Achtergrond: donker en diep, met een langzaam bewegende aurora-gradient (zachte radial gradients die vloeien) en een fijne noise-textuur.
- Panelen: glasmorphism (backdrop-blur, 1px lichte rand, zachte binnengloed).
- Accenten: levendig, in de kleur van het gekozen thema.
- Afgeronde, zachte vormen.

**Achtergrond die meeleeft met de tijd:** 's ochtends warm oranje/roze, overdag fris blauw, 's avonds paars, 's nachts donker met langzaam twinkelende sterren.

**Typografie:**
- een karaktervol display-font voor grote cijfers en koppen (bijv. "Space Grotesk" of "Clash Display")
- "Inter" voor tekst
- cijfers altijd met tabular-nums
- de walkout en kaarten gebruiken hun eigen sportieve font (bijv. "Bebas Neue")

**Vakkleuren en iconen:** elk vak krijgt automatisch een vaste kleur (hash van de vakcode naar een zorgvuldig palet van 16 kleuren) en een passend icoon (wiskunde → Sigma, biologie → Leaf, aardrijkskunde → Globe, enzovoort). Beide zijn aanpasbaar in de instellingen en overal consequent.

**Thema's:**
- presets: "Aurora", "Middernacht", "Neon", "Pastel", "Zonsondergang", "Oceaan"
- een eigen kleur via een kleurkiezer
- vrij te spelen thema's via levels
- light mode als optie

**Seizoensthema's** (automatisch, uitschakelbaar):
- vallende blaadjes in de herfst
- sneeuw in december
- een oranje accent op Koningsdag
- confetti en een felicitatie op je verjaardag

**Motion-principes:**
- alles reageert: knoppen veren licht in, kaarten kantelen subtiel op hover
- shared-element-transities: een vakkaart "groeit" uit tot de detailpagina
- lijsten verschijnen gestaggerd
- altijd 60fps
- `prefers-reduced-motion` krijgt een rustige fade-variant

**Geluid:**
- subtiele UI-geluidjes en grote geluiden in de walkout
- alles gesynthetiseerd met Web Audio, geen bestanden
- globale mute; UI-geluid staat standaard uit, walkout-geluid aan

**Haptics:** `navigator.vibrate` bij afvinken, reveals en achievements (uitschakelbaar).

**Mascotte "Sup" (optioneel, aan/uit):** een klein, schattig SVG-figuurtje (bijv. een blobje met grote ogen) in een hoek, dat reageert op wat er gebeurt:
- blij springend bij een goed cijfer
- slaperig bij uitval
- aanmoedigend bij een onvoldoende
- dansend als al je huiswerk af is
- gaat slapen als je de app 's nachts opent

Sup heeft vrij te spelen accessoires (petje, zonnebril, kroontje).

**Layout:**
- desktop: zwevende glazen sidebar
- mobiel: een bottom-nav met 5 tabs
- grote touch targets

**Loading:**
- skeletons in de vorm van de echte content, met shimmer
- grappige laadteksten ("Cijfers worden opgepoetst…", "Rooster wordt ontward…", "Huiswerk wordt verstopt… grapje")

**Pull-to-refresh** op mobiel met een elastische animatie (Sup springt mee).

**Command palette (Ctrl/Cmd+K):** spring naar vakken, zoek huiswerk en voer acties uit ("wat moet ik halen voor wiskunde", "rooster morgen", "start focus", "thema wisselen", "open pack").

**Sneltoetsen:** 1–7 voor pagina's, ← → voor dagen, P voor de privacymodus, F voor focus, ? voor een overzicht.

**Lege staten** met illustratie en humor ("Geen huiswerk. Tijd voor de bank. 🛋️").

**Toasts** die zacht invliegen en wegglijden.

---

## 5. Navigatie

Vandaag · Rooster · Huiswerk · Cijfers · Collectie · Prestaties · Instellingen

---

## 6. Onboarding (eerste keer openen)

Een intro van ±4 seconden (overslaanbaar): de aurora-achtergrond vloeit binnen, het SuperMagister-logo bouwt zich op uit deeltjes, en Sup zwaait.

Daarna 4 swipebare stappen:
1. Welkom.
2. Kies je thema: de UI kleurt live mee.
3. Koppelen met Magister, of "Probeer eerst de demo".
4. Je eerste walkout: je eigen profielkaart wordt onthuld (een voorproefje van de cijferonthulling).

---

## 7. Vandaag (dashboard)

Alle blokken zijn widgets: in "bewerken"-modus te verslepen, aan/uit te zetten en te vergroten of verkleinen (dnd-kit, layout lokaal opgeslagen).

**Schooldag-laadbalk bovenaan:** de schooldag als een downloadbalk.
- Segmenten per lesuur, pauzes gemarkeerd.
- Tekst als "Schooldag 64% geladen · nog 2u 14m".
- Bij 100%: een "Download voltooid ✅"-momentje met een klein feestje.
- Buiten schooltijd: "Volgende schooldag start morgen 08:30".

**Nu bezig:**
- vak, lokaal, docentcode
- ronde voortgangsring met minuten tot de bel
- de volgende les eronder, met een knipperende badge bij een lokaalwijziging

**Pack-banner:** bij nieuwe cijfers een groot, gloeiend, zwevend kaartenpakket ("🎁 3 nieuwe cijfers"). De gloedkleur verraadt subtiel de beste tier in het pack.

**Trend:** je laatste 5 cijfers als gekleurde bolletjes, met een pijltje of je stijgt of daalt.

**Dagtijdlijn:** horizontale tijdlijn van vandaag met lessen als blokken in vakkleur. Uitval doorgestreept, tussenuren als "gat".

**Huiswerk voor morgen** met afvinken en de totale geschatte tijd.

**Toets-radar:** een radar-animatie met toetsen in de komende 14 dagen als stipjes (dichterbij = dichter bij het midden). Tik op een stip voor de stof, de countdown en het studieplan.

**Fietsweer:**
- Open-Meteo API (gratis, geen key), plaats instelbaar
- weer en wind op je vertrektijd en eindtijd van school
- advies als "🌧️ Om 15:10 regen, jas mee" of "💨 Flinke tegenwind naar huis"

**Wekkeradvies voor morgen:** "Eerste les 09:20 → zet je wekker om 07:55" (op basis van de ingestelde reistijd en voorbereidingstijd).

**Tas-inpaklijst voor morgen:** per vak stel je in welke spullen nodig zijn (boek, rekenmachine, gymkleding, laptop, schrift). De app maakt automatisch een afvinklijst voor morgen ("🧮 rekenmachine · 👟 gymspullen · 💻 laptop"), met optioneel een herinnering 's avonds.

**Countdowns:** weekend, eerstvolgende vakantie (schoolvakanties via de open-data API van Rijksoverheid, regio Noord/Midden/Zuid instelbaar, met hardcoded fallback; controleer de actuele URL) en eindexamen voor examenklassen.

**Begroeting** die verandert met tijd en context ("Goeiemorgen Daan ☀️ Pittige dag: 7 uur en een toets", "Vrijdag! Nog 2 lessen tot het weekend 🎉", "Huh, ben je nog wakker? 🌙").

**Je profielkaart** klein, live bijgewerkt.

**Dagelijkse quest** (zie gamification).

---

## 8. Rooster

**Weergaven:**
- Dag: mobiel standaard, swipen tussen dagen.
- Week: desktop standaard, met een live "nu"-lijn.
- Lijst.
- Maand: met stipjes voor toetsen.

**Lescards** in vakkleur met icoon, lokaal, docent, lesuur en iconen voor huiswerk/toets.

**Uitval:**
- de kaart wordt grijs en er komt met een klap een schuine "VERVALLEN"-stempel op (eenmalige animatie)
- tussenuren worden "Tussenuur! ☕"
- eerste uren uitval worden "Uitslapen! 😴", laatste uren "Vroeg naar huis! 🏠", met een klein confettimoment

**Roosterwijzigingen-detector:**
- de app bewaart een snapshot (IndexedDB) en vergelijkt bij elke refresh
- een "Wat is er veranderd?"-paneel ("Di 3e uur: lokaal B12 → A04", "Do 5e uur: Frans vervalt")
- gewijzigde lessen hebben een pulserende rand tot je ze gezien hebt

**Slimme tussenuren:** suggestie in het gat ("45 min vrij: je Engels-huiswerk (±20 min) past hier precies → start focus").

**Toetsen:** opvallende kaart met een gloeiende rand en een 📝-badge. Tik erop voor de stof, de countdown, notities en het studieplan.

**Weekbelasting:** boven de week een kleurbalk per dag met hoe druk die dag is (lessen + huiswerk + toetsen), plus een waarschuwing "⚠️ Drukke week: 3 toetsen".

**Dagsamenvatting** bovenaan elke dag: "6 uur · 08:30–14:50 · 1 toets · 2× huiswerk".

**Export:** het rooster als .ics downloaden voor Google/Apple Calendar.

**Weekstatistiekje:** "Deze week: 31 lessen, 2 uitgevallen, 4 tussenuren".

**Langste dag / kortste dag** van de week met een iconetje.

---

## 9. Huiswerk

**Overzichten:** "Vandaag", "Komende dagen" en "Later", plus een kanban-weergave (Te doen / Bezig / Klaar).

**Afvinken:** voldoening is de eis.
- een veerende checkbox-animatie, een plopgeluidje en een haptic
- +XP vliegt omhoog
- als alles voor morgen af is: een confetti-regen en Sup danst

**Tijdsschatting** per item (standaard per vak, aanpasbaar) en een "drukte"-meter per dag.

**Planner:** sleep huiswerk naar de dag waarop je het wílt doen (los van de deadline).

**Studieplan-generator voor toetsen:**
- vul de stof in (bijv. "H3, H4, H5" of vrije tekst)
- kies hoeveel dagen je wilt leren
- de app verdeelt het over je rustigste dagen, met een herhaaldag vlak voor de toets
- de taken komen automatisch in je lijst

**"Ik heb geen zin"-knop:**
- splitst een taak op in mini-stapjes, of
- start een timer van 5 minuten ("Begin gewoon 5 minuten, daarna mag je stoppen")
- na 5 minuten: "Lekker bezig! Nog 5?"

**Focusmodus:**
- fullscreen, rustige weergave met een grote timer (pomodoro 25/5, instelbaar)
- gesynthetiseerde achtergrondgeluiden: regen, café-geroezemoes, zachte lo-fi beat, wit geluid
- een groeiend plantje dat groter wordt naarmate je langer focust (en verwelkt een beetje als je de sessie afbreekt)
- focusminuten tellen voor XP en statistieken

**Notities** per les en per toets (lokaal).

**Streak 🔥:** het aantal schooldagen op rij waarop je al het huiswerk voor de volgende dag af had. Eén keer per week mag je een "streak-bevriezer" gebruiken.

**Huiswerk-HTML** uit Magister netjes en veilig weergeven (DOMPurify), met klikbare links.

---

## 10. Cijfers

**Overzicht per vak:**
- kaarten met het gewogen gemiddelde groot in het display-font
- trend-sparkline en het aantal cijfers
- kleur rood < 5,5, oranje 5,5–6,4, groen ≥ 6,5
- niet-onthulde cijfers zijn geblurd met "🔒 Open je pack"

**Ranglijst:** al je vakken gesorteerd op gemiddelde, met ↑↓-pijltjes voor wat er veranderd is sinds het vorige cijfer.

**Vak-detail:**
- een grafiek van alle cijfers in de tijd (de grootte van de stip = de weging), met een gemiddeldelijn en een 5,5-lijn
- lijst van alle cijfers met omschrijving en datum
- het gemiddelde per periode

**"Wat moet ik halen?"-calculator:**
- kies een vak, een doelgemiddelde en de weging van de volgende toets → het benodigde cijfer, groot getoond
- duidelijke meldingen voor "onmogelijk 😬" of "al binnen 😎"
- ook het omgekeerde: "Met een 6 sta ik dan op…"

**Simulator:**
- voeg hypothetische cijfers toe met sliders
- het gemiddelde en de overgangsmeter bewegen live mee
- te resetten

**Overgangsmeter:**
- configureerbare overgangsnormen (bijv. maximaal X tekortpunten, kernvakken Ne/En/Wi met eigen regels, minimaal gemiddelde), met een paar veelvoorkomende presets
- een meter met de status "Over ✅", "Bespreekgeval ⚠️" of "Gevarenzone ❌"
- precies welke vakken het verschil maken

**Bovenbouw (examenklassen):**
- SE-gemiddelde per vak, afgerond en onafgerond
- combinatiecijfer
- PTA-kolommen apart

**Periodes vergelijken:** periode 1 vs 2 vs 3 per vak in een grafiek.

**Inzichten** in gewone taal, automatisch berekend:
- "📈 Engels gaat al 3 toetsen omhoog"
- "Je hoogste cijfers haal je op dinsdag" (grappige stat)
- "Je gemiddelde is dit jaar 0,4 gestegen"

**Cijfertijdlijn:** een scrollbare tijdlijn van al je cijfers ooit, als een verhaal.

---

## 11. De cijferonthulling: FIFA-walkout (het paradepaardje, maak dit spectaculair)

Bijhouden welke cijfers al onthuld zijn gaat via IndexedDB (op cijfer-/kolom-id). Nieuwe cijfers worden een "pack".

### Kaarttiers (rating = cijfer × 10, dus 7,8 → 78)

- < 5,5 → **Brons**
- 5,5–6,9 → **Zilver**
- 7,0–8,4 → **Goud**
- 8,5–9,4 → **TOTY** (blauw/zwart, glinsterend)
- ≥ 9,5 → **ICON** (wit/goud, de meest extreme animatie)

### Speciale kaartvarianten (bovenop de tier)

- **In Form**: minstens 1 punt boven je vakgemiddelde, met een zwarte kaart en een gouden rand
- **Record**: je hoogste cijfer ooit in dit vak
- **Comeback**: een voldoende direct na een onvoldoende in hetzelfde vak
- **Reeks**: je derde voldoende op rij in dit vak

### Walkout-sequentie

Fullscreen, ±8 seconden, overslaanbaar met tik of knop, ingedrukt houden versnelt:
1. Zwart scherm, aanzwellend stadiongeluid, zwaaiende schijnwerpers.
2. Rookpluimen/flares in een kleur die de tier verraadt: wit = brons/zilver, goud = goud, blauw = TOTY, regenboog = ICON. Bij hogere tiers komen er meer flares en schudt het scherm.
3. Drie onthullingen, net als in FIFA, elk met een whoosh en een boom:
   - vlag-positie: vak-icoon + vaknaam
   - positie: weging ("×3")
   - club-positie: toetsomschrijving
4. Het silhouet van de kaart draait in, dan de flip naar de volle kaart met de rating groot linksboven.
5. Goud en hoger: confetti en vuurwerk. ICON: gouden lichtstralen, slow-motion, een epische geluidsfinale en een lange haptic.
6. Onvoldoende: rustiger en bemoedigend.
   - een "Comeback-kaart loading…"-tekst: "Je kunt dit nog ophalen 💪"
   - direct een knop "Wat moet ik halen?"
   - nooit belachelijk maken

### Pack-opening

- Bij meerdere nieuwe cijfers scheurt eerst een pack open (de kleur is afhankelijk van de beste kaart).
- Daarna de cijfers één voor één, het beste altijd als laatste.
- Aan het eind een overzicht van alle nieuwe kaarten, plus de knop "Bekijk in collectie".

### De kaart

FIFA-stijl kaart in de tierkleur, met de vaknaam, het vak-icoon, je naam en 6 stats:
- CYF: het cijfer
- GEM: vakgemiddelde na dit cijfer
- IMP: hoeveel het gemiddelde steeg of daalde (+0,3)
- WEG: weging
- TOP: hoogste cijfer in dit vak
- RKS: voldoende-reeks in dit vak

### Geluid en techniek

- Alles via de Web Audio-synthesizer: stadionruis (gefilterde ruis), whoosh, sub-boom, juichen en vuurwerk-knallen.
- Framer Motion en canvas voor deeltjes, CSS 3D voor de kaartflip.
- Moet soepel draaien op een gemiddelde telefoon.

### Instellingen

- snelheid (normaal/snel/direct)
- automatisch of handmatig per kaart
- geluid aan/uit
- een "walkout-oefenmodus" met nepcijfers om alle tiers te bekijken

---

## 12. Collectie

- Album van alle onthulde kaarten, te filteren op vak, tier, periode en variant. Tellers per tier.
- Tik op een kaart:
  - fullscreen
  - 3D-kanteling op muis of gyroscoop (telefoon kantelen)
  - een holografisch folie-effect dat meebeweegt (CSS-gradients op cursorpositie)
  - omdraaien voor de achterkant met datum, toetsomschrijving en context
- **Vitrine:** kies je 5 favoriete kaarten om op je profiel te laten zien.
- **Deelbare afbeelding:** van een kaart of van je vitrine (html-to-image).
- **Verzameldoelen:** zoals "Verzamel van elk vak een gouden kaart" of "3 TOTY-kaarten in exacte vakken", met voortgangsbalken en een beloning.

---

## 13. Prestaties (gamification, positief, nooit straffend)

**XP en levels (1–50):**
- XP krijg je voor afvinken, packs openen, goede cijfers, focusminuten, streaks en quests
- elk level ontgrendelt iets: thema's, kaartranden, walkout-effecten (bijv. andere flare-kleuren of vuurwerk) en accessoires voor Sup
- een levelbalk met een level-up-animatie

**Achievements** (met een unlock-animatie en een paar geheime achievements), bijvoorbeeld:
- "Op dreef": 3 voldoendes op rij
- "Vlekkeloos": een periode zonder onvoldoende
- "Comeback": van een onvoldoende naar een 8+
- "Vroege vogel": al het huiswerk af vóór 17:00
- "Focusmonster": 10 uur focus
- "Verzamelaar": 50 kaarten
- "Eerste ICON"
- "Planner Pro": een studieplan helemaal afgemaakt
- "Tussenuurheld": huiswerk gemaakt in een tussenuur

**Dagelijkse en wekelijkse quests:** bijvoorbeeld "Vink 3 huiswerkitems af", "Doe één focussessie" of "Bekijk je rooster voor morgen".

**Geen XP-verlies en geen negatieve meldingen.** Het moet motiveren, niet stressen.

---

## 14. Profiel en recaps

**Profielkaart** (in dezelfde kaartstijl als de walkout):
- overall rating = totaalgemiddelde × 10
- 6 stats per vakgroep: Talen, Exact, Mens & Maatschappij, Kunst & Cultuur, Bewegen, Overig
- je vitrine, level en badges

**Aanwezigheid:** een overzicht van absenties, te laat en geoorloofd/ongeoorloofd, plus een "Op tijd-streak".

**Weekrecap** (vrijdagmiddag, swipebaar als een story):
- lessen gevolgd, uitgevallen uren
- huiswerk afgevinkt, focusminuten
- nieuwe kaarten

**SuperMagister Wrapped** (einde periode en einde schooljaar), een Spotify Wrapped-achtige story met grote cijfers, animaties en muziek-synth. Bijvoorbeeld:
- "Je kreeg 23 uur cadeau door uitval"
- beste vak, grootste stijger
- verdeling van je kaarten over de tiers
- totaal aantal focusuren
- je meest bezochte lokaal
- je vroegste begintijd

Elke slide is deelbaar als afbeelding.

---

## 15. Overal in de app

**Privacymodus:** één tik (of P) blurt alle cijfers, handig als iemand meekijkt. Kan ook automatisch aan staan.

**Offline:**
- de laatst opgehaalde data blijft zichtbaar, met "Offline · laatste update 14:02"
- automatisch verversen zodra je weer online bent

**Meldingen** (browser-notificaties met toestemming, terwijl de app open is of als PWA):
- nieuw cijfer ("Er staat een pack voor je klaar 🎁")
- roosterwijziging voor morgen
- toets morgen
- tas-inpakherinnering om een ingestelde tijd

**Verversen:** elke 15 minuten de data verversen terwijl de app open is.

**Easter eggs:**
- Konami-code → retro pixel-thema
- 7× op het logo tikken → Sup doet een dansje
- vrijdag na het laatste uur → een "Weekend!"-knop met disco-lichten
- 1 april → de UI staat 3 seconden op z'n kop

**Toegankelijkheid:**
- goed contrast, toetsenbordnavigatie, aria-labels en focus-states
- reduced motion

**Prestaties:**
- Lighthouse ≥ 90 op alle onderdelen
- geen layout shift
- snel op een gemiddelde telefoon en op iPhone Safari

---

## 16. Werkwijze (in fases, stop na elke fase)

**Fase 1, fundament:** project opzetten, design system (kleuren, thema's, typografie, GlassPanel, knoppen, aurora-achtergrond), demo-data, app-shell met navigatie (sidebar + bottom-nav), paginatransities en command palette.

**Fase 2, cijferonthulling:** de walkout met alle tiers en varianten, pack-opening, kaartcomponent, geluid, oefenmodus en collectie. **Laat dit aan mij zien voordat je verdergaat.**

**Fase 3, dagelijks gebruik:** Vandaag (widgets), rooster en huiswerk, inclusief focusmodus, studieplan-generator en tas-inpaklijst.

**Fase 4, cijfers:** overzicht, vak-detail, calculator, simulator, overgangsmeter, bovenbouw en inzichten. Alle rekenlogica met Vitest-tests.

**Fase 5, koppeling:** bookmarklet, koppelpagina, proxy en echte data. Vraag me om echte voorbeeldresponses om de parsers te controleren.

**Fase 6, gamification:** XP, levels, achievements, quests, profiel, mascotte, weekrecap en Wrapped.

**Fase 7, afwerking:** PWA, offline, meldingen, seizoensthema's, easter eggs, toegankelijkheid en performance.

Na elke fase:
- `npm run build`, lint en tests moeten slagen
- vertel me in een kort lijstje wat ik moet testen
- wacht op mijn akkoord

## 17. README

- hoe je het lokaal draait
- hoe je koppelt via de bookmarklet
- hoe je het op Vercel zet
- een disclaimer: SuperMagister is een onofficiële app die een onofficiële, interne Magister-API gebruikt, niet verbonden aan Magister/Iddink, en alleen bedoeld voor je eigen account
