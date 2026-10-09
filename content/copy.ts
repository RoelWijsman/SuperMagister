/**
 * Alle teksten met karakter in SuperMagister, op één plek.
 *
 * Volgt de humorbijbel (docs/aanvulling.md): droog, specifiek, maximaal één
 * emoji, minstens 5 varianten per situatie. De app toont nooit twee keer
 * achter elkaar dezelfde variant.
 *
 * Een witregel (\n) splitst een tekst in een titel en een uitleg.
 * Variabelen tussen accolades worden ingevuld: {cijfer}, {vak}, {naam}, …
 * Pas gerust aan; de tests in lib/copy.test.ts bewaken de regels.
 */
export const COPY = {
  // ——— Laden ———————————————————————————————————————————————————————————
  "laden.algemeen": [
    "Magister wakker maken. Die is 's ochtends ook niet zo snel.",
    "De conciërge zoekt de juiste sleutel.",
    "Laden. Net als jij om 08:29.",
    "Even geduld. De beamer moet ook nog opwarmen.",
    "Verbinding maken. Niet met de schoolwifi, gelukkig.",
  ],
  "laden.cijfers": [
    "Cijfers worden opgepoetst…",
    "Komma's worden rechtgezet…",
    "Weegfactoren worden gewogen. Zwaar werk.",
    "De rode pen wordt opgeborgen…",
    "De nakijkstapel wordt doorgebladerd…",
  ],
  "laden.rooster": [
    "Rooster wordt ontward…",
    "Lokalen worden geteld. Er is er weer één kwijt.",
    "Tussenuren worden opgespoord…",
    "Uitval wordt gezocht. Duimen.",
    "De bel wordt gestemd…",
  ],
  "laden.huiswerk": [
    "Huiswerk wordt verstopt… grapje",
    "Agenda wordt opengeslagen. Die was al weken dicht.",
    "Teams-deadlines worden geteld. Allemaal om 23:59.",
    "Opdrachten worden gezocht. Helaas gevonden.",
    "De studiewijzer wordt ontcijferd…",
  ],
  "laden.pack": [
    "Flares worden aangestoken…",
    "Het stadion loopt vol…",
    "Kaarten worden geschud…",
    "Spanning wordt opgebouwd. Professioneel.",
    "Schijnwerpers worden scheef gehangen…",
  ],
  "laden.collectie": [
    "Album wordt opengeslagen…",
    "Kaarten worden gesorteerd. Op glans.",
    "Plaatjes worden gladgestreken…",
    "De zeldzame kaarten worden apart gelegd…",
    "Je verzameling wordt afgestoft…",
  ],

  // ——— Begroeting (titel bovenaan Vandaag) ————————————————————————————————
  "begroeting.ochtend": [
    "Goeiemorgen {naam}.",
    "Morgen, {naam}.",
    "Hé {naam}. Vroeg, hè.",
    "Goeiemorgen {naam} ☀️",
    "{naam}. Je bent wakker. Knap.",
  ],
  "begroeting.middag": [
    "Hoi {naam}.",
    "Goeiemiddag {naam}.",
    "Daar ben je, {naam}.",
    "Middag, {naam}.",
    "Hé {naam}. Nog steeds hier.",
  ],
  "begroeting.avond": [
    "Goeienavond {naam}.",
    "Avond, {naam}.",
    "Hé {naam}. Nog even dan.",
    "{naam}. Huiswerktijd. Sorry.",
    "Goeienavond {naam} 🌆",
  ],
  "begroeting.nacht": [
    "Huh, ben je nog wakker? 🌙",
    "Het is {tijd}, {naam}.",
    "Nog wakker? Wij ook. Wij zijn een app.",
    "{naam}. Bed. Nu.",
    "Slapen is ook een vak, {naam}.",
  ],
  "begroeting.verjaardag": [
    "Gefeliciteerd, {naam}.",
    "Gefeliciteerd {naam} 🎂",
    "Jarig, {naam}. Zelfde rooster.",
    "{naam} is jarig. Je docent weet het niet.",
    "Hoera, {naam}. De tosti is vandaag van jou.",
  ],

  // ——— Dag (regel onder de begroeting) ——————————————————————————————————
  "dag.weekend": [
    "Weekend. Magister weet even niet waar je bent.",
    "Geen lessen vandaag. Lees dat nog een keer.",
    "Weekend. De schoolwifi doet het nu vast wél.",
    "Geen school. Zelfs de conciërge is vrij.",
    "Geen bel vandaag. Hooguit die van de pizzabezorger.",
  ],
  "dag.vrij": [
    "Geen lessen vandaag. Verdacht, maar we klagen niet.",
    "Leeg rooster. Iemand heeft zich vergist. Niet melden.",
    "Vandaag geen school. Officieel.",
    "Geen lessen. De tostimachine in de aula voelt zich eenzaam.",
    "Vrij. Zelfs het mentoruur gaat niet door.",
  ],
  "dag.klaar": [
    "School zit erop. De rest van de dag is van jou.",
    "Laatste bel is geweest. Je bent vrij. Ongeveer.",
    "Klaar voor vandaag. Je tas mag in de hoek.",
    "School is uit. Huiswerk is nog aan.",
    "Dat was het. De conciërge doet zo het licht uit.",
  ],
  "dag.vrijdag": [
    "Vrijdag. Nog {aantal} {lessen} tussen jou en het weekend.",
    "Nog {aantal} {lessen}. Je ruikt het weekend al.",
    "Vrijdag. Nog {aantal} {lessen} volhouden. Waarschijnlijk lukt dat.",
    "Nog {aantal} {lessen}, dan is het weekend. Niet vooruitlopen.",
    "Vrijdag. {aantal} {lessen} te gaan. Daarna: heerlijk niks.",
  ],
  "dag.pittig": [
    "Pittige dag: {uren} uur en {toetsen}.",
    "{uren} uur en {toetsen}. Neem een extra tosti mee.",
    "Vandaag: {uren} uur en {toetsen}. Diep ademhalen.",
    "{uren} uur en {toetsen}. Low cortisol zit er vandaag niet in.",
    "{uren} uur school en {toetsen}. Je komt erdoorheen. We hebben het nagerekend.",
  ],
  "dag.toets": [
    "Vandaag {toetsen}. Je kunt dit.",
    "{toetsen} vandaag. Pak alvast een blaadje.",
    "Vandaag {toetsen}. Je hebt geleerd. Toch?",
    "{toetsen} op het menu. Succes. Echt.",
    "Vandaag {toetsen}. Je brein heeft er zin in. Zegt hij.",
  ],
  "dag.bezig": [
    "Nog {aantal} {lessen} te gaan.",
    "Nog {aantal} {lessen}. Je bent er bijna. Je bent er niet.",
    "Nog {aantal} {lessen}. De klok tikt. Langzaam.",
    "Nog {aantal} {lessen}. Water drinken, mensen.",
    "{aantal} {lessen} nog. Dan mag je weer ademen.",
  ],
  "dag.voorSchool": [
    "{uren} uur vandaag. Eerste les om {tijd}.",
    "Eerste bel om {tijd}. Daarna nog {uren} uur. Succes.",
    "Om {tijd} begint het. {uren} uur. Je kunt het.",
    "{uren} uur school. De eerste om {tijd}. Fiets voorzichtig.",
    "Eerste les om {tijd}. Je hebt nog even. Niet te lang.",
  ],
  "dag.nacht": [
    "Je eerste les begint om {tijd}. Slaap lekker.",
    "Morgen om {tijd} weer. Je mentor rekent op je. Een beetje.",
    "Om {tijd} moet je er staan. Je telefoon mag ook slapen.",
    "Morgen {tijd}. Dat is sneller dan je denkt.",
    "Eerste les om {tijd}. Je wekker weet het al. Jij nu ook.",
  ],
  "dag.nachtVrij": [
    "Morgen geen school. Slapen mag toch.",
    "Geen school morgen. Uitslapen is ook een vaardigheid.",
    "Morgen vrij. Je bed is het enige lokaal dat telt.",
    "Niks morgen. Ga toch maar slapen.",
    "Morgen geen les. De wekker mag uit. Echt.",
  ],

  // ——— Nu bezig ——————————————————————————————————————————————————————————
  "nu.pauze": [
    "Pauze. Nog {minuten} minuten. Ren naar de aula.",
    "Pauze. {minuten} minuten. De rij bij de kantine is al lang.",
    "{minuten} minuten pauze. Genoeg voor één tosti. Net.",
    "Pauze. {minuten} minuten niks. Geniet ervan.",
    "Pauze. Jij hebt {minuten} minuten. De wifi heeft er nul.",
  ],
  "nu.tussenuur": [
    "Tussenuur. {minuten} minuten in de aula naar je tosti staren. Prachtig.",
    "Tussenuur. {minuten} minuten officieel niks. Onofficieel huiswerk.",
    "Tussenuur. De aula is van jou. En van die drie anderen.",
    "{minuten} minuten tussenuur. Je kunt huiswerk maken. Je gaat het niet doen.",
    "Tussenuur. Zoek een stopcontact. Je weet waarom.",
  ],
  "nu.voorSchool": [
    "Nog {minuten} minuten tot de eerste bel.",
    "Over {minuten} minuten gaat de bel. Waar is je pasje?",
    "Nog {minuten} minuten. Fietsen gaat sneller dan lopen. Dat is wetenschap.",
    "Eerste bel om {tijd}. Je bent er bijna. Of nog thuis.",
    "Nog {minuten} minuten. Geen paniek. Wel opschieten.",
  ],
  "nu.klaar": [
    "School zit erop.",
    "Klaar voor vandaag.",
    "Uit. Echt uit.",
    "Laatste bel geweest.",
    "Dat was het voor vandaag.",
  ],
  "nu.vrij": [
    "Vrij.",
    "Geen school. Geen bel.",
    "Vandaag niks. Echt niks.",
    "Lege dag. Mooie dag.",
    "Vrij. Zelfs de schoolbel is vrij.",
  ],

  // ——— Lege staten (titel\nuitleg) ————————————————————————————————————————
  "leeg.huiswerk": [
    "Geen huiswerk. Tijd voor de bank. 🛋️\nDe komende vier weken staat er niks. Verdacht, maar we klagen niet.",
    "Geen huiswerk.\nNiet doorvertellen aan je ouders.",
    "Niks te doen.\nJe docenten zijn vergeten huiswerk op te geven. Wij zeggen niks.",
    "Huiswerkvrij.\nGeniet ervan voordat iemand het merkt.",
    "Leeg.\nZelfs de studiewijzer weet het even niet.",
  ],
  "leeg.huiswerkMorgen": [
    "Geen huiswerk. Tijd voor de bank.",
    "Niks opgegeven. Verdacht rustig.",
    "Je agenda heeft vakantie.",
    "Geen huiswerk. Je tas wordt lichter.",
    "Niks te doen. Zeg het niet te hard.",
  ],
  "leeg.toetsen": [
    "Geen toetsen in zicht.",
    "Twee weken geen toetsen. Je hartslag mag omlaag.",
    "Geen toetsen. Je hoeft geen blaadje te pakken.",
    "Niks op de radar. Voor nu.",
    "Geen toetsen. Je docenten zijn nog aan het bedenken.",
  ],
  "leeg.lessenVandaag": [
    "Geen lessen vandaag.",
    "Leeg rooster. Mooi rooster.",
    "Niks vandaag. De beamer heeft rust.",
    "Geen les. Geen bel. Geen probleem.",
    "Vandaag geen lessen. De aula mist je. Een beetje.",
  ],
  "leeg.roosterDag": [
    "Geen lessen. Lekker.",
    "Leeg. Zo mag het altijd.",
    "Niks. Nada. Noppes.",
    "Geen les. Geen bel. Geen probleem.",
    "Vrij. De beamer hoeft vandaag niet te worstelen.",
  ],
  "leeg.collectie": [
    "Je album is leeg.\nOpen je eerste pack. Daar komen kaarten uit, dat is het hele idee.",
    "Nog geen kaarten.\nElk cijfer wordt een kaart. Ook de 5,4. Vooral de 5,4.",
    "Leeg album.\nTijd om iets te verzamelen dat geen huiswerk is.",
    "Nul kaarten.\nDe collectie wacht. Het pack ook.",
    "Hier komen je kaarten.\nVan brons tot ICON. Meestal zilver. Zo is het leven.",
  ],
  "leeg.collectieFilter": [
    "Geen kaarten met deze filters.\nIets te streng gefilterd. Net als je docent bij een PO.",
    "Niks gevonden.\nDeze combinatie bestaat (nog) niet.",
    "Leeg.\nMisschien komt deze kaart nog. Misschien niet.",
    "Geen match.\nZet een filter uit. Of twee.",
    "Nul resultaten.\nOok onder de tafels gekeken.",
  ],
  "leeg.vitrine": [
    "Je vitrine is nog leeg.\nKies je vijf beste kaarten. Opscheppen mag hier.",
    "Lege vitrine.\nTik een kaart aan en zet hem erin.",
    "Nog niks in de vitrine.\nVijf plekken. Kies wijs. Of gewoon je ICON.",
    "Vitrine: leeg.\nDit is de plek voor je beste kaarten. Niet voor die 4,9.",
    "Hier komen je toppers.\nMaximaal vijf. Zo werkt een vitrine.",
  ],
  "leeg.zoeken": [
    "Niks gevonden voor ‘{query}’.\nProbeer ‘rooster morgen’ of de naam van een vak.",
    "‘{query}’ zegt ons niks.\nWe zijn een app, geen helderziende.",
    "Geen resultaten voor ‘{query}’.\nWel een goede poging.",
    "‘{query}’? Nee.\nProbeer een vak, of ‘rooster vrijdag’.",
    "Overal gezocht. Ook achter de radiator.\nGeen ‘{query}’.",
  ],
  // Foutpagina (app/error.tsx): er ging iets mis tijdens het tekenen van een pagina.
  "fout.pagina": [
    "Er ging iets mis.\nDeze pagina struikelde over zijn eigen veters. Probeer het nog eens.",
    "Oeps.\nIets in de app viel om. Je gegevens zijn veilig, de pagina even niet.",
    "Kortsluiting.\nDe conciërge is onderweg. Of je drukt zelf op opnieuw proberen.",
    "Dit hoort niet.\nDe pagina gaf een fout. Nog een keer proberen helpt vaak.",
    "Even een black-out.\nNiet die van je laatste toets. Probeer het opnieuw.",
  ],
  "leeg.404": [
    "Deze pagina is zoek.\nMisschien is hij uitgevallen. Of hij heeft een tussenuur.",
    "Pagina niet gevonden.\nHij zit waarschijnlijk in het lokaal zonder ramen.",
    "404.\nDeze pagina is net als je gymtas: niet hier.",
    "Hier is niks.\nDe conciërge heeft ook al gekeken.",
    "Deze pagina heeft zich ziek gemeld.\nBeterschap. Jij kunt gewoon terug naar Vandaag.",
  ],

  // ——— Meldingen (titel\nuitleg) ———————————————————————————————————————————
  "toast.privacyAan": [
    "Privacymodus aan.\nJe cijfers zijn vervaagd. Niemand hoeft het te weten.",
    "Cijfers verstopt.\nDe meekijker naast je ziet nu alleen blur.",
    "Privacymodus aan.\nJe tante op de verjaardag kan lang kijken.",
    "Cijfers vervaagd.\nDruk op P om ze weer te zien.",
    "Privacymodus aan.\nGeheim blijft geheim.",
  ],
  "toast.privacyUit": [
    "Privacymodus uit.\nAlles is weer zichtbaar. Ook die ene.",
    "Cijfers zichtbaar.\nKijk even of er niemand achter je staat.",
    "Blur weg.\nDe waarheid is terug.",
    "Privacymodus uit.\nDapper.",
    "Alles zichtbaar.\nMet trots. Of niet.",
  ],
  "toast.thema": [
    "Thema {thema}.\nDe hele app is omgekleed. Jij nog niet.",
    "{thema} staat aan.\nZelfde rooster, mooiere kleuren.",
    "Nieuw thema: {thema}.\nGoede keuze. Wij hadden hetzelfde gekozen.",
    "{thema}.\nHet huiswerk blijft hetzelfde. Sorry.",
    "Thema gewisseld naar {thema}.\nVoelt meteen anders. Is het ook.",
  ],
  "toast.binnenkort": [
    "{wat} komt in {fase}.\nWe zijn ermee bezig. Het wordt mooi.",
    "{wat}: nog even geduld.\nKomt in {fase}.",
    "Nog niet klaar.\n{wat} komt in {fase}. Beloofd.",
    "{wat} staat gepland voor {fase}.\nEr wordt aan gesleuteld.",
    "Bijna. Nou ja, {fase}.\n{wat} is nog in de maak.",
  ],
  "toast.geenPack": [
    "Geen nieuwe cijfers.\nJe docenten zijn nog aan het nakijken. Of aan de koffie.",
    "Niks om te openen.\nAlles is al onthuld. Probeer de oefenmodus.",
    "Pack leeg.\nHet volgende komt vanzelf.",
    "Geen pack.\nGeen nieuws is goed nieuws. Meestal.",
    "Er ligt niks klaar.\nRust. Geniet ervan.",
  ],
  "toast.vitrineToegevoegd": [
    "In je vitrine gezet.\nOpscheppen is ook een vak.",
    "Vitrinewaardig.\nDeze kaart staat nu vooraan.",
    "Toegevoegd.\nHij glimt er al.",
    "In de vitrine.\nDe rest van je kaarten is jaloers.",
    "Staat erin.\nGoede keuze. Wij oordelen niet. Een beetje wel.",
  ],
  "toast.vitrineWeg": [
    "Uit je vitrine gehaald.\nHij ligt weer gewoon in je album.",
    "Weggehaald.\nGeen drama. Hij kan terug.",
    "Uit de vitrine.\nDe kaart begrijpt het. Denken we.",
    "Verwijderd.\nPlek vrij voor iets moois.",
    "Eruit.\nGeen hard feelings.",
  ],
  "toast.vitrineVol": [
    "Vitrine vol.\nVijf is het maximum. Haal er eerst eentje uit.",
    "Geen plek meer.\nVijf kaarten. Kiezen is ook een vaardigheid.",
    "Vol.\nZelfs een vitrine heeft grenzen.",
    "Het past niet.\nVijf plekken, vijf kaarten. Wiskunde.",
    "Vitrine zit vol.\nWie mag eruit? Moeilijk, hè.",
  ],
  "toast.video": [
    "Video klaar.\nVijftien seconden roem, frame voor frame.",
    "Klaar.\nJe groepsapp weet nog van niks.",
    "Video gemaakt.\nRegie: jij. Vuurwerk: wij. Popcorn: zelf meenemen.",
    "Klaar voor de première.\nRode loper niet inbegrepen.",
    "Video staat klaar.\nNiemand hoeft te weten hoe vaak je hem terugkijkt.",
  ],
  "toast.afbeelding": [
    "Afbeelding klaar.\nDelen is opscheppen met extra stappen.",
    "Opgeslagen.\nNu nog een goed moment om hem te sturen.",
    "Klaar om te delen.\nJe groepsapp weet nog van niks.",
    "Gedownload.\nPixel voor pixel. Met liefde gemaakt.",
    "Afbeelding gemaakt.\nDe screenshot-generatie is trots op je.",
  ],
  "toast.doelGehaald": [
    "Doel gehaald: {wat}.\nDe beloning ligt klaar. Verdiend.",
    "{wat}: gelukt.\nJe album wordt er beter van.",
    "Verzameldoel binnen.\n{wat}. Niemand had het verwacht. Behalve wij.",
    "{wat}. Check.\nVolgende doel staat al klaar.",
    "Gelukt: {wat}.\nWe zouden applaudisseren, maar we zijn een app.",
  ],

  // ——— Koppelen met Magister (fase 5b) ———————————————————————————————————
  "toast.gekoppeld": [
    "Gekoppeld met {school}.\nHoi {naam}. Je welkomstpack ligt klaar.",
    "Je bent binnen.\n{school} is gekoppeld. Er ligt een pack voor je klaar.",
    "Koppeling gelukt.\nZonder wachtwoord. Zo hoort het.",
    "Welkom, {naam}.\nJe eigen rooster, huiswerk en cijfers. Eindelijk mooi.",
    "Gekoppeld.\nJe echte cijfers staan klaar. Dapper.",
  ],
  "toast.weerGekoppeld": [
    "Weer gekoppeld.\nAlles wordt bijgewerkt.",
    "Je bent er weer.\nNieuw uur, nieuwe kansen.",
    "Opnieuw gekoppeld.\nMagister had je even gemist. Wij ook.",
    "Weer verbonden.\nDe data wordt ververst.",
    "Gelukt.\nWeer een uur Magister zonder Magister.",
  ],
  "toast.ontkoppeld": [
    "Ontkoppeld.\nJe gegevens zijn van dit apparaat gewist.",
    "Ontkoppeld en opgeruimd.\nKoppel opnieuw wanneer je wilt.",
    "Alles is weg.\nJe cijfers, je gokken, je notities. Netjes opgeruimd.",
    "Ontkoppeld.\nNiks meer van jou op dit apparaat. Tot de volgende keer.",
    "Klaar.\nAlsof je hier nooit was. De conciërge heeft geveegd.",
  ],
  "toast.bijnaVerlopen": [
    "Je koppeling verloopt over {minuten} minuten.\nKlik in Magister op je bladwijzer om te verlengen.",
    "Nog {minuten} minuten gekoppeld.\nMagister geeft maar een uur. Eén klik op je bladwijzer en je kunt verder.",
    "Bijna tijd.\nOver {minuten} minuten moet je opnieuw koppelen. Net als een les: net te kort.",
    "Nog {minuten} minuten.\nDaarna zie je even je laatst opgehaalde data.",
    "Je koppeling loopt bijna af.\nNog {minuten} minuten. De bel gaat zo.",
  ],
  "koppeling.verlopen": [
    "Je koppeling is verlopen.\nMagister geeft je maar een uur. Wat je ziet, is van {tijd}.",
    "Even opnieuw koppelen.\nJe token is op. De stand van {tijd} blijft gewoon staan.",
    "Tijd voor een nieuwe sessie.\nMagister vertrouwt niemand langer dan een uur. Niet persoonlijk bedoeld.",
    "Verlopen.\nZoals je schoolpas in juli. Je ziet nu de stand van {tijd}.",
    "Je moet even opnieuw koppelen.\nEén klik op je bladwijzer in Magister. Tot die tijd: de stand van {tijd}.",
  ],
  "koppelen.gelukt": [
    "Je bent binnen, {naam}.",
    "Gekoppeld. Zonder wachtwoord.",
    "Welkom bij je eigen data, {naam}.",
    "Gekoppeld met {school}. Eindelijk.",
    "Daar ben je, {naam}.",
  ],
  "koppelen.fout": [
    "Dat ging mis.",
    "Koppelen lukte niet.",
    "Hm. Geen koppeling.",
    "Niet gelukt. Nog niet.",
    "Dat werkte niet.",
  ],
  // Vaste zin, precies zoals gevraagd: bij een vak waar Magisters gemiddelde anders is.
  "cijfers.magisterAnders": ["Magister rekent hier anders, check je cijferoverzicht."],

  // ——— Onboarding (eerste keer openen) ————————————————————————————————————
  // Onder het logo in de intro.
  "onboarding.intro": [
    "Magister, maar dan leuk.",
    "Je rooster, huiswerk en cijfers. Met vuurwerk.",
    "Zelfde school. Betere app.",
    "Magister, maar dan met een walkout.",
    "Gemaakt voor de achterste rij.",
  ],
  "onboarding.pack": [
    "Elk nieuw cijfer is een kaart. Brons, zilver, goud, of die ene ICON.",
    "Eerst de spanning, dan het cijfer. Zoals het hoort.",
    "Een 5,4 wordt er niet beter van. Wel spannender.",
    "Je docent voert het in, wij maken er een moment van.",
    "Magister laat een tabel zien. Wij een stadion.",
  ],
  "onboarding.gok": [
    "Vlak voor de onthulling gok je. Zit je ernaast, dan weet je dat ook.",
    "Raad je cijfer. Precies goed? Dan ben je officieel helderziend.",
    "Gok eerst. Dan kun je straks zeggen dat je het wist.",
    "Optimist of pessimist? Na tien gokken weten we het.",
    "Hoe goed ken je je eigen cijfers? Spoiler: matig.",
  ],
  "onboarding.overzicht": [
    "Uitval, tussenuren en wat er morgen af moet. Zonder zoeken.",
    "Eén blik en je weet of je wekker eerder moet.",
    "Je hele dag op één scherm. Ook het lokaal dat weer is veranderd.",
    "Huiswerk afvinken voelt hier als winnen. Is het ook.",
    "Rooster, huiswerk en toetsen. De rest van de agenda mag je zelf houden.",
  ],
  "onboarding.thema": [
    "De hele app kleurt mee. Kies er een, je kunt altijd wisselen.",
    "Kies je kleur. Het huiswerk blijft hetzelfde, sorry.",
    "Een thema voor elke stemming. Ook voor maandag.",
    "Tik er een aan en kijk wat er gebeurt.",
    "Kies wijs. Of gewoon de mooiste.",
  ],
  "onboarding.woonplaats": [
    "Voor het fietsweer en de vakanties. Je plaats blijft op je apparaat.",
    "Dan weten we of je tegenwind hebt. Belangrijke informatie.",
    "Voor het weer onderweg en het aftellen naar de vakantie.",
    "Zodat de app weet wanneer het herfstvakantie is. En of het regent.",
    "Optioneel. Maar tegenwind voorspellen is ons ding.",
  ],
  "onboarding.koppelen": [
    "Je logt in bij Magister zelf. Je wachtwoord komt hier nooit.",
    "Eén keer koppelen en je echte cijfers staan klaar. Eng, hè.",
    "Eén keer een bladwijzer neerzetten, dan is het klaar. Zonder wachtwoord.",
    "Koppelen kost een minuut. Daarna nooit meer zoeken in Magister.",
    "Klik in Magister op je bladwijzer en je bent binnen.",
  ],
  "onboarding.eerstePack": [
    "Hier gebeurt het. Open hem maar.",
    "Laatste stap. De leukste ook.",
    "Er ligt iets voor je klaar. Je weet hoe het werkt.",
    "Tijd voor je eerste walkout. Geluid aan, als het kan.",
    "Nog één tik en je zit in het stadion.",
  ],
  "onboarding.klaar": [
    "Klaar. Je weet nu meer dan de meeste docenten over deze app.",
    "Je bent er klaar voor. Magister niet, maar dat is hun probleem.",
    "Dat was het. Geen toets over deze uitleg, beloofd.",
    "Klaar. Het lokaal is open, de beamer doet het zelfs.",
    "Alles staat. Ga je gang.",
  ],

  // ——— Pack en cijfers —————————————————————————————————————————————————————
  "pack.teaser": [
    "Er zit iets in. De gloed verraadt het al.",
    "Je docent heeft ze al gezien. Jij nog niet.",
    "Spannend. Of niet. Dat weet je pas als je kijkt.",
    "Negeren lukt niemand. Probeer het maar.",
    "Ingevoerd door je docent, ingepakt door ons.",
  ],
  "pack.leeg": [
    "Alles bekeken.\nNieuwe cijfers verschijnen hier als pack.",
    "Geen nieuwe cijfers.\nJe docenten zijn nog aan het nakijken. Of aan de koffie.",
    "Alles onthuld.\nRust. Eindelijk.",
    "Pack leeg.\nHet volgende komt vanzelf. Soms helaas.",
    "Niks nieuws.\nGeen nieuws is goed nieuws. Meestal.",
  ],
  "pack.slot": [
    "Ze tellen pas mee als je ze onthult. Niet spieken.",
    "Je gemiddelde wacht ook. Het is net zo nieuwsgierig.",
    "Op slot tot je ze opent. Die regel hebben wij bedacht.",
    "Ze liggen klaar. Ze kijken naar je.",
    "Eerst openen, dan rekenen.",
  ],
  "huiswerk.subtitel": [
    "{aantal} {dingen} te doen.",
    "{aantal} {dingen}. Eén voor één.",
    "{aantal} {dingen} te doen. Of te negeren. Doe dat niet.",
    "{aantal} {dingen} in de wachtrij.",
    "{aantal} {dingen} te doen. Teams telt mee.",
  ],
  "cijfers.subtitel.goed": [
    "Gemiddeld {gem} over {aantal} vakken.",
    "{gem} gemiddeld over {aantal} vakken. Netjes.",
    "Je staat op een {gem}. De rapportvergadering wordt kort.",
    "{gem} over {aantal} vakken. Je ouders zeggen 'zie je wel'.",
    "Gemiddeld een {gem}. Dit rapport mag gezien worden.",
  ],
  "cijfers.subtitel.krap": [
    "Gemiddeld {gem} over {aantal} vakken. Krap, maar binnen.",
    "{gem} gemiddeld. Precies genoeg. Strategie.",
    "Je staat op een {gem}. Niet spannend, wel voldoende.",
    "{gem} over {aantal} vakken. De zesjescultuur leeft.",
    "Gemiddeld {gem}. Er zit nog rek in. Wij zien het.",
  ],
  "cijfers.subtitel.zwaar": [
    "Gemiddeld {gem} over {aantal} vakken. Werk aan de winkel. Te doen.",
    "{gem} gemiddeld. Geen paniek. Wel een plan.",
    "Je staat op een {gem}. Dit is het begin van een comeback.",
    "{gem} over {aantal} vakken. Tijd voor een plan, niet voor paniek.",
    "Gemiddeld {gem}. Eén goede toetsweek verandert veel.",
  ],
  // Privacymodus: de toon mag niet verraden hoe het gaat.
  "cijfers.subtitel.privacy": [
    "Gemiddeld {gem} over {aantal} vakken. Meer zeggen we niet.",
    "Je gemiddelde is {gem}. Staatsgeheim.",
    "{gem} over {aantal} vakken. Wie meekijkt, ziet niks.",
    "Gemiddeld {gem}. Wij weten het, jij weet het, verder niemand.",
    "{aantal} vakken, één gemiddelde: {gem}. Vervaagd, voor de zekerheid.",
  ],

  // ——— Walkout: reacties per tier ——————————————————————————————————————————
  "walkout.reactie.icon": [
    "Een {cijfer}. Ergens in de lerarenkamer valt een koffiekopje.",
    "{cijfer} voor {vak}. Er moet ergens een plaquette komen.",
    "Een {cijfer}. We hebben het nagerekend. Het klopt echt.",
    "{cijfer}. Dit gaat op de koelkast. Digitaal dan.",
    "Een {cijfer} voor {omschrijving}. Rustig blijven. Gewoon knikken.",
  ],
  "walkout.reactie.toty": [
    "Een {cijfer}. Team of the Year. Het jaar is nog niet eens om.",
    "{cijfer} voor {vak}. Dat is geen toeval meer.",
    "Een {cijfer}. Zeg het niet te hard in de aula.",
    "Een {cijfer}. De nakijkpen viel er even stil van.",
    "{cijfer}. Op de ouderavond wordt over je gesproken. Positief.",
  ],
  "walkout.reactie.goud": [
    "Een {cijfer}. Je docent heeft drie keer gecontroleerd of dat klopte.",
    "{cijfer} voor {vak}. Geen drama. Gewoon goed.",
    "Een {cijfer}. Vandaag mag de tosti extra kaas.",
    "Een {cijfer}. Daar kun je mee thuiskomen.",
    "{cijfer}. Netjes. Je ouders zeggen 'zie je wel'.",
  ],
  "walkout.reactie.zilver": [
    "Een {cijfer}. Voldoende. Het systeem is tevreden.",
    "{cijfer}. Niet spectaculair. Wel binnen.",
    "Een {cijfer} voor {vak}. De zesjescultuur leeft.",
    "Een {cijfer}. Geen applaus, geen gedoe.",
    "Een {cijfer}. Overleefd. Daar gaat het om.",
  ],
  "walkout.reactie.tekst": [
    "Een {cijfer}. Geen cijfer, wel een mening.",
    "{cijfer}. Kort en krachtig. Net als je gymdocent.",
    "Een {cijfer}. Telt niet mee. Voelt wel goed.",
    "{cijfer} voor {vak}. Je hebt bewogen. Genoteerd.",
    "Een {cijfer}. Beoordeeld met een fluitje om de nek.",
  ],

  // ——— Walkout: onvoldoende (grap, steun, actie) ——————————————————————————
  "walkout.onvoldoende.bijna": [
    "Een {cijfer}. De 5,5 was letterlijk dáár. Je kon hem ruiken.",
    "Een {cijfer}. Zo dichtbij dat het pijn doet.",
    "{cijfer}. Eén goed antwoord. Eén.",
    "Een {cijfer}. De voldoende stond buiten te wachten. Hij is naar huis.",
    "{cijfer} voor {vak}. Bijna is ook een woord. Geen fijn woord.",
  ],
  "walkout.onvoldoende.grap": [
    "Een {cijfer}. Die toets had een slechte dag. Jij ook.",
    "{cijfer} voor {vak}. Kaulo zuur. Maar het is één cijfer.",
    "Een {cijfer}. De pinguïn begint richting de bergen te lopen. Roep hem terug.",
    "Een {cijfer}. Deze kaart gaat niet in de vitrine.",
    "{cijfer}. Niet je beste werk. Ook niet je laatste toets.",
  ],
  "walkout.onvoldoende.steun": [
    "Eén cijfer zegt niks over wat je kunt.",
    "Dit is te fixen. Vervelend, maar te fixen.",
    "Je hebt zwaardere weken overleefd.",
    "Iedereen heeft er zo één. Je docent vroeger ook.",
    "Volgende toets is een nieuwe kans. Klinkt cliché, klopt wel.",
  ],
  "walkout.onvoldoende.actie": [
    "Met een {nodig} op de volgende toets sta je weer op een {doel}.",
    "Haal een {nodig} en je staat weer op een {doel}.",
    "Een {nodig} op de volgende toets, en je gemiddelde is weer {doel}.",
    "Volgende keer een {nodig}? Dan sta je op een {doel}. Doable.",
    "Met een {nodig} ben je terug op een {doel}. Eén toets.",
  ],
  "walkout.onvoldoende.actieRustig": [
    "Je staat nog op een {gem}. Met een {nodig} op de volgende toets is het weer {doel}.",
    "Gemiddeld nog een {gem}. Een {nodig} erachteraan en je zit op {doel}.",
    "Je gemiddelde is nog {gem}. Eén tik, geen breuk. Met een {nodig} wordt het {doel}.",
    "Nog steeds een {gem} gemiddeld. Volgende toets een {nodig}? Dan {doel}.",
    "Rustig: je staat op een {gem}. Met een {nodig} haal je {doel}.",
  ],
  "walkout.onvoldoende.actieLang": [
    "Dit fix je niet in één toets. Wel in een paar. Begin bij de volgende.",
    "Eén toets is niet genoeg om het recht te trekken. Twee of drie wel.",
    "Dit wordt een project. Een haalbaar project.",
    "Niet in één keer, wel stap voor stap. Je mentor denkt graag mee.",
    "Lange adem nodig. Je hebt er meer van dan je denkt.",
  ],
  "walkout.onvoldoende.comeback": [
    "Je kunt dit nog ophalen 💪",
    "Wordt vervolgd. Met een beter cijfer.",
    "Deze kaart krijgt een vervolg.",
    "Aflevering 1. Het wordt beter.",
    "Elke goede comeback begint hier.",
  ],

  // ——— Walkout: varianten ——————————————————————————————————————————————————
  "walkout.variant.inform": [
    "In Form. {verschil} boven je gemiddelde.",
    "In Form. Je gemiddelde kan het niet bijhouden.",
    "In Form-kaart. Zwart met goud. Net als je toekomst.",
    "In Form. {verschil} boven je eigen normaal. Wie ben jij?",
    "In Form. Je gemiddelde staat ervan te kijken.",
  ],
  "walkout.variant.record": [
    "Record. Je hoogste {vak}-cijfer ooit.",
    "Nieuw record voor {vak}. Het vorige record is beledigd.",
    "Record. Zo hoog kwam je in {vak} nog nooit.",
    "Record. Zet het in je bio.",
    "Persoonlijk record. De lat ligt nu hoger. Sorry.",
  ],
  "walkout.variant.comeback": [
    "Comeback. Eerst onvoldoende, nu dit.",
    "Comeback-kaart. Netflix wil de rechten.",
    "Comeback. De pinguïn draaide om.",
    "Van onvoldoende naar dit. Character development.",
    "Comeback. Je vorige cijfer wil er niet meer over praten.",
  ],
  "walkout.variant.reeks": [
    "Reeks: {aantal} voldoendes op rij.",
    "{aantal} keer op rij voldoende. Stabieler dan de schoolwifi.",
    "Reeks van {aantal}. Niet stoppen nu.",
    "{aantal} op rij. Consistent. Eng consistent.",
    "Reeks: {aantal}. Je docent begint een patroon te zien.",
  ],

  // ——— Walkout: pack en oefenen ———————————————————————————————————————————
  "walkout.pack.klaar": [
    "Pack leeg.\n{aantal} nieuwe {kaarten}. Gevoelens: gemengd tot goed.",
    "Dat waren ze.\n{aantal} {kaarten}. Je kunt weer ademen.",
    "{aantal} {kaarten} erbij.\nJe album wordt dikker. Je tas niet.",
    "Klaar.\n{aantal} nieuwe {kaarten} in je collectie. Niemand vroeg erom, iedereen wil ze.",
    "Pack geopend.\n{aantal} {kaarten}. Geen retour mogelijk.",
  ],
  "walkout.oefen": [
    "Nepcijfers, echte flares.\nZie alle tiers zonder dat er iets meetelt.",
    "Oefenen zonder risico.\nGeen cijfer telt mee. Je hartslag wel.",
    "De generale repetitie.\nAlle kaarten, nul gevolgen.",
    "Testpack.\nVoor als je de ICON-walkout nog eens wilt zien. Begrijpelijk.",
    "Oefenmodus.\nHier is een 9,8 gratis. Geniet ervan.",
  ],

  // ——— Gok je cijfer (feature A) ——————————————————————————————————————————
  // Vaste zin zolang je nog niet gesleept hebt; daarna praat het commentaar mee met je teller.
  "gok.vraag": ["Geen druk. (Wel een beetje.)"],
  "gok.commentaar.een": [
    "Je hebt je naam wel ingevuld, toch?",
    "Een 1,0 krijg je al voor je naam. Meestal.",
    "Het minimum. Er zit geen kelder onder.",
    "Je hebt de toets toch wel ingeleverd?",
    "Lager kan niet. Dat hebben we geprobeerd.",
  ],
  "gok.commentaar.laag": [
    "Dat was geen toets. Dat was een ervaring.",
    "Je denkt nog steeds aan vraag 4, hè.",
    "Je hebt de achterkant van het blaadje wel gezien?",
    "Dit is geen gok meer. Dit is verwerking.",
    "Na de toets naar huis gefietst. Met tegenwind. In het donker.",
  ],
  "gok.commentaar.zwak": [
    "Lowkey cooked.",
    "De herkansing staat in je hoofd al gepland.",
    "Je hoopt op een nakijkfout. Wij hopen mee.",
    "Je weet niet meer wat je bij vraag 2 had. Dat zegt genoeg.",
    "Het was maar een oefentoets. Toch?",
  ],
  "gok.commentaar.bijna": [
    "Zo dichtbij. Zo ver weg.",
    "De 5,5 kan je bijna ruiken.",
    "Eén goed antwoord meer. Eén.",
    "Afronden is je hobby niet, maar het zou nu wel helpen.",
    "Net niet. Op papier dan.",
  ],
  "gok.commentaar.precies": [
    "Precies genoeg. Efficiënt.",
    "Een 5,5. Geen energie verspild.",
    "Niet te veel, niet te weinig. Een kunst.",
    "Exact de grens. Je hebt het uitgerekend, hè.",
    "Minimale moeite, maximaal resultaat. Bijna een natuurwet.",
  ],
  "gok.commentaar.krap": [
    "Voldoende. Met een zucht.",
    "Erdoor, met een paar tienden reserve.",
    "Krap. Maar wie telt dat nou. Wij. Wij tellen dat.",
    "Een voldoende waar je niet over praat.",
    "Net boven de streep. Telt.",
  ],
  "gok.commentaar.realistisch": [
    "Realistisch. Saai. Respect.",
    "Een cijfer waar niemand iets van vindt. Perfect.",
    "Je ouders knikken. Meer niet.",
    "Gewoon prima. Niemand belt.",
    "Niet spannend. Wel verstandig.",
  ],
  "gok.commentaar.67": ["…nee. We doen dit niet."],
  "gok.commentaar.zelfvertrouwen": [
    "Zelfvertrouwen van iemand die de oefentoets wél heeft gemaakt.",
    "Je hebt geleerd. Dat zie je aan je duim.",
    "Een zeven-gevoel. Die zijn zeldzaam.",
    "Je liep na de toets net iets rechter op.",
    "Stevige gok. Je weet iets wat wij niet weten.",
  ],
  "gok.commentaar.aura": [
    "Aura farming.",
    "Het zelfvertrouwen van iemand met een uitgewerkte samenvatting.",
    "Hoog ingezet. We filmen het.",
    "Je hebt de stof uitgelegd aan je groepje. Dat merk je.",
    "Je praat alsof je de toets zelf hebt gemaakt.",
  ],
  "gok.commentaar.genie": [
    "Of je bent een genie, of je denkt aan een andere toets.",
    "Een 9,5 of meer. We bellen alvast de krant.",
    "Dit is geen gok. Dit is een statement.",
    "Je docent heeft dit cijfer in jaren niet gegeven. Maar goed.",
    "Hoger dan dit kan niet. Dat weet je, hè.",
  ],

  "gok.uitslag.exact": [
    "Precies goed. Dit is óf een gave, óf je hebt de nakijkstapel gezien. We vragen niks.",
    "Op de tiende nauwkeurig. De nakijkstapel lag zeker open.",
    "{gok} gegokt, {cijfer} gehaald. We hebben vragen. We stellen ze niet.",
    "Precies {cijfer}. Of je hebt stiekem in de gewone Magister gekeken. We oordelen niet.",
    "Exact. Docenten vragen zich af hoe.",
  ],
  "gok.uitslag.dichtbij": [
    "Je kent jezelf beter dan je mentor je kent.",
    "{verschil} ernaast. Dat noemen we zelfkennis.",
    "Bijna precies. Nog even en je voorspelt ook de uitval.",
    "Zo goed ingeschat dat het een beetje eng is.",
    "Je zat er {verschil} naast. Het weerbericht is minder precies.",
  ],
  "gok.uitslag.netjes": [
    "Netjes ingeschat.",
    "{verschil} ernaast. Gewoon goed.",
    "Dichtbij genoeg om trots op te zijn. Een beetje.",
    "Redelijk zicht op je eigen kunnen. Zeldzaam.",
    "Je gevoel klopte. Bijna.",
  ],
  "gok.uitslag.ernaast": [
    "Jouw gok en jouw cijfer hebben elkaar nog nooit ontmoet.",
    "{verschil} ernaast. Je gevoel had een vrije dag.",
    "Je gok en de werkelijkheid zitten niet in dezelfde klas.",
    "Gedurfd geschat. Niet goed, wel gedurfd.",
    "Je gevoel en je cijfer appen niet met elkaar.",
  ],
  "gok.uitslag.veelHoger": [
    "Je gokte een {gok}. Het is een {cijfer}. Waarom praat je zo over jezelf?",
    "Je gokte een {gok}. Het is een {cijfer}. Bescheidenheid is mooi, maar dit is overdreven.",
    "{gok} gegokt, {cijfer} gehaald. Je bent beter dan je denkt. Letterlijk, met cijfers.",
    "Een {cijfer}, terwijl jij op een {gok} rekende. Wij rekenden op jou.",
    "Je gokte een {gok}. Het werd een {cijfer}. Tijd om je zelfbeeld te updaten.",
  ],
  "gok.uitslag.veelLager": [
    "Je gokte een {gok}. Het is een {cijfer}. De verwachtingen waren hoog. De werkelijkheid was ook aanwezig.",
    "Je gokte een {gok}. Het is een {cijfer}. Je gevoel had het mis. Je gevoel is niet de baas.",
    "{gok} gegokt, {cijfer} gekregen. Optimisme blijft een talent.",
    "Een {gok} verwacht, een {cijfer} gekregen. Dat doet even pijn.",
    "Je dacht {gok}. Het is {cijfer}. Het verschil zit in de details. Helaas.",
  ],
  "gok.steun": [
    "Eén cijfer. Volgende keer weet je precies waar het zat.",
    "Dit zegt iets over deze toets, niet over jou.",
    "Kijk de toets in. Dan weet je wat er misging.",
    "Je zat ernaast, niet erdoorheen.",
    "Vraag je docent wat het verschil maakte. Die weet het.",
  ],

  "gok.type.pessimist": [
    "Je denkt elke keer dat je het verpest hebt. Je hebt het nog nooit verpest. Je gelooft ons niet. Ook dat zagen we aankomen.",
    "Je gokt gemiddeld {verschil} te laag. Elke keer. Vertrouw jezelf eens.",
    "Na elke toets: 'Dat ging slecht.' Daarna: een voldoende. Dit patroon zien we.",
    "{aantal} gokken, bijna allemaal te laag. Je bent strenger dan je docent.",
    "Je onderschat jezelf structureel. Wij hebben de grafiek. Kijk maar.",
  ],
  "gok.type.hoofdpersonage": [
    "Elke toets voelt als een 8. Elke toets is een 6,2. We bewonderen de energie.",
    "Je gokt gemiddeld {verschil} te hoog. Het zelfvertrouwen is er. De cijfers komen eraan.",
    "Na elke toets ben jij de hoofdpersoon. Het script zegt: bijrol.",
    "{aantal} gokken, bijna allemaal te hoog. Optimisme is ook een vaardigheid.",
    "Jij gaat elke toets in als een finale. De docent ziet een voorronde.",
  ],
  "gok.type.orakel": [
    "Je weet je cijfer voordat je docent het weet. Docenten zijn een beetje bang van je.",
    "Gemiddeld maar {verschil} ernaast. Dat is geen gokken meer, dat is weten.",
    "Je voorspelt je cijfers sneller dan Magister ze laadt.",
    "{aantal} gokken, steeds raak. We vertrouwen jou meer dan het weerbericht.",
    "Nakijken is voor jou eigenlijk overbodig. Laat het je docent niet weten.",
  ],
  "gok.type.chaos": [
    "Je gokken volgen geen enkel patroon. Wetenschappers willen je bestuderen.",
    "Soms te hoog, soms te laag, altijd verrassend.",
    "Gemiddeld {verschil} ernaast, in alle richtingen. Respect voor de chaos.",
    "Er zit geen systeem in. Dat is ook een systeem.",
    "Jouw gokken zijn een dobbelsteen met een eigen mening.",
  ],
  "gok.type.teWeinig": [
    "Nog {aantal} gokken, dan weten we wat voor gokker je bent.",
    "Na nog {aantal} gokken krijg je een gokkerstype. Spannend.",
    "Nog {aantal} gokken tot je profiel. We houden alles bij.",
    "Nog {aantal} keer gokken. Dan hebben we genoeg bewijs.",
    "Je gokkerstype laadt. Nog {aantal} gokken.",
  ],
  "gok.vakken": [
    "Bij {vak} ben je een orakel. Bij {vak2} ben je een muntje dat je opgooit.",
    "{vak}: je weet het precies. {vak2}: je weet het niet. Wel lekker eerlijk.",
    "Bij {vak} zit je er steeds dichtbij. Bij {vak2} gok je met je ogen dicht.",
    "{vak} voorspel je blind. {vak2} blijft een mysterie. Ook voor jou.",
    "Bij {vak} heb je een zesde zintuig. Bij {vak2} is dat zintuig met vakantie.",
  ],
  "leeg.gokken": [
    "Nog niks gegokt.\nBij je volgende pack gok je eerst je cijfer. Daarna weet je wat voor gokker je bent.",
    "Geen gokken.\nOpen een pack en gok eerst. Wij houden bij hoe goed je jezelf kent.",
    "Nul gokken.\nDe slider wacht. Hij is groot en hij gaat tot 10.",
    "Hier komen je gokken.\nGok voor elke kaart wat je hebt. Wij zeggen niet wat we ervan vinden. Nou ja.",
    "Nog geen gokgeschiedenis.\nJe volgende pack verandert dat.",
  ],

  "toast.prestatie": [
    "Prestatie: {wat}.\nStaat nu bij Prestaties. Mag je laten zien.",
    "{wat}.\nNieuwe prestatie. Wij hebben het genoteerd.",
    "Ontgrendeld: {wat}.\nNiemand kan het je meer afpakken.",
    "{wat}. Binnen.\nKijk maar bij Prestaties.",
    "Nieuwe prestatie: {wat}.\nDe lijst wordt langer. Jij wordt beter.",
  ],
  "toast.prestatieGeheim": [
    "Geheime prestatie: {wat}.\nWe gaan er verder niet over praten.",
    "{wat}.\nGeheime prestatie. Vertel het niemand. Of iedereen.",
    "Ontgrendeld: {wat}.\nDeze stond nergens. Nu wel.",
    "Een geheime prestatie: {wat}.\nWie dit leest, is getuige.",
    "{wat}.\nDeze prestatie bestond officieel niet.",
  ],
  "prestaties.binnenkort": [
    "Je hebt {xp} XP met gokken.\nUitgeven kan nergens. Trots zijn mag.",
    "{xp} XP verdiend.\nPuur voor de eer. Net als een 10 voor tekenen.",
    "{xp} XP op de teller.\nHij gaat alleen omhoog. Dat is meer dan je van je rooster kunt zeggen.",
    "Spaarstand: {xp} XP.\nGeen rente, geen winkel, wel een mooi getal.",
    "{xp} XP, gewoon door te gokken.\nNiemand vroeg erom. Toch fijn.",
  ],

  // ——— Collectie ——————————————————————————————————————————————————————————
  "collectie.subtitel": [
    "{aantal} {kaarten}. Geen enkele te koop.",
    "{aantal} {kaarten} verzameld. Met bloed, zweet en SO's.",
    "{aantal} {kaarten}. Elke kaart een toets die je overleefd hebt.",
    "{aantal} {kaarten}. Allemaal eerlijk verdiend.",
    "{aantal} {kaarten} in je album. Plakken hoeft niet.",
  ],
  // ——— Vandaag (fase 3a) ———————————————————————————————————————————————
  "trend.omhoog": [
    "Het gaat de goede kant op. De lijn bevestigt het.",
    "Stijgende lijn. Je docenten merken het ook.",
    "Omhoog. Niet stoppen, het werkt.",
    "Elke toets een tikje beter. Dat is geen toeval.",
    "Trend: omhoog. Zeg het voort.",
  ],
  "trend.omlaag": [
    "Even een dipje. Dat herstelt vaker dan je denkt.",
    "Het gaat iets omlaag. Kijk welke toets het zwaarst telt.",
    "Lichte daling. Tijd voor een plan, niet voor paniek.",
    "Omlaag, maar nog niet om. Eén goede toets en je bent terug.",
    "Het zakt een beetje. Vraag je docent waar het zat.",
  ],
  "trend.gelijk": [
    "Constant. Je cijfers hebben een vaste vorm.",
    "Rechte lijn. Saai, maar betrouwbaar.",
    "Geen schokken. Je cijferhartslag is stabiel.",
    "Gelijkmatig. Docenten houden van voorspelbaar.",
    "Niet omhoog, niet omlaag. Gewoon jij.",
  ],
  "trend.leeg": [
    "Nog te weinig cijfers voor een trend.",
    "Twee cijfers en we zien een lijn. Even geduld.",
    "Geen trend zonder cijfers. Zo werkt wiskunde.",
    "Hier komt je lijn. Zodra er cijfers zijn.",
    "Nog niks te zien. Je docenten zijn aan het nakijken.",
  ],

  "weer.storm": [
    "Om {tijd} stormt het. Fiets voorzichtig, of laat je brengen.",
    "Windstoten tot {wind} km/u om {tijd}. Je fiets wil vliegen. Laat hem niet.",
    "Storm rond {tijd}. Vandaag is een goede dag om de bus te ontdekken.",
    "Om {tijd} zoveel wind dat je fiets een vlieger wordt.",
    "Code geel op het fietspad om {tijd}. Houd je stuur vast.",
  ],
  "weer.regen": [
    "Om {tijd} regen. Jas mee.",
    "Regen om {tijd}. Een regenbroek is niet stijlvol, wel droog.",
    "Om {tijd} gaat het regenen. Je haar is gewaarschuwd.",
    "Natte rit om {tijd}. Jas mee, ook al is hij lelijk.",
    "Om {tijd} komt de regen. Precies als jij de deur uit gaat. Uiteraard.",
  ],
  "weer.tegenwind": [
    "Flinke tegenwind om {tijd}. Reken op een paar minuten extra.",
    "Om {tijd} tegenwind, {wind} km/u. Benen, het spijt ons.",
    "Tegenwind om {tijd}. De Nederlandse ervaring, helemaal gratis.",
    "{wind} km/u recht tegen om {tijd}. Je trapt, maar je komt nergens.",
    "Om {tijd} wind van voren. Trappen en niet klagen. Of wel klagen.",
  ],
  "weer.koud": [
    "{temp} graden om {tijd}. Handschoenen zijn geen schande.",
    "Om {tijd} vriest het bijna. Muts op, ook al zit je haar goed.",
    "Koud om {tijd}: {temp} graden. Je oren gaan dit voelen.",
    "{temp} graden. Je stuur is een ijsblok. Handschoenen mee.",
    "Om {tijd} {temp} graden. Laagjes. Veel laagjes.",
  ],
  "weer.warm": [
    "{temp} graden om {tijd}. Water mee en rustig aan.",
    "Warm om {tijd}. Je komt bezweet binnen. Iedereen.",
    "Om {tijd} {temp} graden. Het lokaal zonder ramen wordt een sauna.",
    "Zomerweer om {tijd}. Neem water mee, geen energiedrank.",
    "{temp} graden. Fietsen door de schaduw is ook een strategie.",
  ],
  "weer.rugwind": [
    "Rugwind om {tijd}. Je bent nog nooit zo snel geweest.",
    "Om {tijd} wind in de rug. Geniet, dit gebeurt bijna nooit.",
    "{wind} km/u rugwind om {tijd}. Je bent nu officieel wielrenner.",
    "Rugwind om {tijd}. Morgen is het vast weer andersom.",
    "Om {tijd} duwt de wind je vooruit. Bedankt, wind.",
  ],
  "weer.prima": [
    "Prima fietsweer. Geen excuses vandaag.",
    "Droog en rustig. De fiets doet het, de wind ook.",
    "Niks bijzonders. Fietsen en gaan.",
    "Goed weer om {tijd}. Zeldzaam in Nederland. Geniet.",
    "Geen regen, geen storm. Verdacht, maar we nemen het.",
  ],
  "weer.fout": [
    "Het weer is even onbereikbaar. Kijk uit het raam.",
    "Geen verbinding met de weerman. Raam open, hand naar buiten.",
    "Weerdata kwijt. Neem voor de zekerheid een jas mee.",
    "Het weer laadt niet. Het zal wel Nederlands weer zijn.",
    "Geen weer gevonden. Dat bestaat niet, maar toch.",
  ],
  "weer.geenSchool": [
    "Geen fietsritten naar school in zicht. De fiets mag rusten.",
    "Deze week geen school meer. Je fiets weet even niet wat hij moet.",
    "Geen ritten om te checken. Fiets lekker voor de lol.",
    "Niks te fietsen naar school. Het weer mag doen wat het wil.",
    "Geen school in zicht, dus geen fietsweer. Wel gewoon weer.",
  ],

  "radar.aftellen": [
    "Nog {aantal} {dagen}. Genoeg tijd. In theorie.",
    "Over {aantal} {dagen}. Begin vandaag, dan ben je straks blij.",
    "Nog {aantal} {dagen}. Je toekomstige zelf kijkt mee.",
    "{aantal} {dagen} te gaan. Dat is {aantal} keer 'ik begin morgen'.",
    "Nog {aantal} {dagen}. De stof wordt niet vanzelf korter.",
  ],
  "radar.morgen": [
    "Morgen al. Vanavond is het moment.",
    "Morgen. Herhaal de lastigste paragraaf, niet de makkelijkste.",
    "Morgen. Leg je spullen klaar en slaap op tijd.",
    "Morgen is het zover. Je kunt meer dan je denkt.",
    "Morgen. Wat je vanavond leert, zit morgen nog vers.",
  ],
  "radar.vandaag": [
    "Vandaag. Diep in, diep uit. Je kunt dit.",
    "Het is vandaag. Lees de vragen twee keer.",
    "Vandaag. Pen mee? Pen mee.",
    "Toets vandaag. Rustig blijven, je weet meer dan je denkt.",
    "Vandaag. Daarna mag je er niet meer aan denken.",
  ],

  "aftellen.weekend.dagen": [
    "Nog {aantal} {dagen} tot het weekend. Volhouden.",
    "{aantal} {dagen} en dan is het zaterdag.",
    "Weekend over {aantal} {dagen}. Je voelt het al.",
    "Nog {aantal} {dagen}. De week heeft een einde, beloofd.",
    "{aantal} {dagen} tot je wekker vrij heeft.",
  ],
  "aftellen.weekend.minuten": [
    "Nog {tijd} tot het weekend. Niet op de klok kijken. Oké, wel.",
    "Weekend over {tijd}. De laatste bel staat klaar.",
    "Nog {tijd}. Vrijdagmiddag duurt langer, dat is wetenschap.",
    "{tijd} tot het weekend. Je jas mag alvast aan. Niet echt.",
    "Nog {tijd}. Bijna. Echt bijna.",
  ],
  "aftellen.weekend.nu": [
    "Het is weekend. Magister mag even dicht.",
    "Weekend. Geen bel, geen rooster.",
    "Weekend. Doe iets wat niet op je rooster staat.",
    "Weekend. De wifi thuis is ook beter.",
    "Weekend. Uitslapen is ook een vaardigheid.",
  ],
  "aftellen.vakantie.komt": [
    "{vakantie} over {aantal} {dagen}. De docenten tellen ook af.",
    "{vakantie}: nog {aantal} {dagen}. Uitslapen staat al in je agenda.",
    "{vakantie} komt eraan. Nog {aantal} {dagen} volhouden.",
    "{vakantie} in {aantal} {dagen}. Daarna even helemaal niks.",
    "{vakantie} over {aantal} {dagen}. Je wekker heeft er zin in.",
  ],
  "aftellen.vakantie.bezig": [
    "{vakantie}. Nog {aantal} {dagen} vrij. Geniet ervan.",
    "{vakantie}. Nog {aantal} {dagen}. Magister kan je even niet vinden.",
    "{vakantie}: nog {aantal} {dagen}. Niet aan school denken. Dit telt ook.",
    "{vakantie} duurt nog {aantal} {dagen}. Je bent officieel offline.",
    "{vakantie}. Nog {aantal} {dagen} tot school. Niet gaan tellen.",
  ],
  "aftellen.vakantie.laatste": [
    "Laatste vrije dag. Morgen weer school. Maak er iets van.",
    "Laatste vakantiedag. Je wekker staat al te popelen. Jij niet.",
    "Morgen weer school. Vandaag telt nog even niet.",
    "Laatste dag vrij. Zoek je etui maar vast op.",
    "Vakantie, laatste aflevering. Morgen begint seizoen school weer.",
  ],
  "aftellen.examen": [
    "Nog {aantal} {dagen} tot je eerste examen. Rustig opbouwen.",
    "{aantal} {dagen} tot het centraal examen. Elke dag een beetje.",
    "Examens over {aantal} {dagen}. Meer tijd dan je denkt, minder dan je hoopt.",
    "Nog {aantal} {dagen}. De eindstreep is in zicht. Een beetje.",
    "{aantal} {dagen} tot {datum}. Daarna de langste zomer van je leven.",
  ],

  // ——— Rooster (fase 3b) ———————————————————————————————————————————————
  /** Onder "Uitslapen! 😴": je eerste les is nu later. */
  "uitval.uitslapen": [
    "Je eerste les is om {tijd}. Je kussen heeft gewonnen.",
    "Pas om {tijd} naar school. Snooze met een goed geweten.",
    "Eerste uur weg. Om {tijd} begint het echte werk.",
    "Je wekker mag een uur later. Hij weet het nog niet.",
    "Om {tijd} pas. Ontbijt met zitten, voor één keer.",
  ],
  /** Onder "Vroeg naar huis! 🏠": je laatste les is eerder klaar. */
  "uitval.vroeg": [
    "Om {tijd} ben je klaar. De fietsenstalling is nog leeg.",
    "Vrij om {tijd}. De middag is van jou.",
    "Laatste uur weg. Om {tijd} sta je buiten.",
    "Om {tijd} naar huis. Tegenwind telt vandaag niet.",
    "Klaar om {tijd}. Niet te hard juichen in de gang.",
  ],
  /** Onder "Tussenuur! ☕": een gat door uitval. */
  "uitval.tussenuur": [
    "De les valt uit. De aula verwacht je.",
    "Opeens vrij. De tosti weet het al.",
    "Uitval in het midden. Een ingebouwde pauze.",
    "Geen les. Wel school. Het blijft een raar concept.",
    "Een gat in je rooster. Je mag hem zelf vullen.",
  ],
  /** Slim tussenuur: huiswerk dat precies past. */
  "tussenuur.suggestie": [
    "{minuten} min vrij: je {vak}-huiswerk (±{schatting} min) past hier precies.",
    "{minuten} minuten. Genoeg voor {vak} (±{schatting} min). Daarna ben je er vanaf.",
    "Je hebt {minuten} min. {vak} kost ±{schatting} min. Dat is wiskunde, en het klopt.",
    "{minuten} min in de aula, of {vak} af (±{schatting} min). Je toekomstige zelf kiest het tweede.",
    "Tussenuur van {minuten} min. Ideaal moment voor {vak} (±{schatting} min).",
  ],
  "tussenuur.vrij": [
    "{minuten} min vrij en geen huiswerk dat past. Zeldzaam. Geniet.",
    "{minuten} minuten niks. De aula is van jou.",
    "{minuten} min vrij. Tosti of telefoon, het zijn allebei keuzes.",
    "{minuten} minuten zonder plan. Soms is dat het plan.",
    "{minuten} min. Niks dat past. Even helemaal niks dan.",
  ],
  /** Onder "⚠️ Drukke week: 3 toetsen". */
  "rooster.druk": [
    "Plan je avonden. Of in elk geval een paar.",
    "Begin vroeg. De week begint toch al.",
    "Eén toets per keer. Dan valt het mee.",
    "Drukke week. Volgende week is er weer een andere.",
    "Slaap genoeg. Dat is ook leren, zeggen ze.",
  ],
  /** Banner bovenaan het rooster. */
  "rooster.wijzigingen": [
    "{aantal} {wijzigingen} sinds je laatste bezoek.",
    "Je rooster is veranderd. {aantal} {wijzigingen}.",
    "{aantal} {wijzigingen} in je rooster. Even kijken voordat je naar het verkeerde lokaal loopt.",
    "Nieuw in je rooster: {aantal} {wijzigingen}.",
    "Magister heeft geschoven. {aantal} {wijzigingen}.",
  ],
  "rooster.wijzigingen.leeg": [
    "Niks veranderd. Je rooster zit stil.",
    "Geen wijzigingen. Alles staat waar het stond.",
    "Rustig rooster. Geen verrassingen.",
    "Alles zoals gepland. Verdacht, maar fijn.",
    "Niks nieuws. Het lokaal staat er nog.",
  ],
  // Geheime handeling: 7× tikken op het versienummer in Instellingen.
  "toast.ontwikkelaarAan": [
    "Ontwikkelaarsmodus aan.\nJe vindt hem bij Instellingen, onder Ontwikkelaar.",
    "Je bent nu ontwikkelaar.\nNiet op je cv zetten. Nog niet.",
    "Geheime knoppen ontgrendeld.\nZe staan bij Instellingen, onder Ontwikkelaar.",
    "Toegang verleend.\nDe motorkap is open. Kijk, maar sleutel voorzichtig.",
    "Ontwikkelaarsmodus aan.\nZeven keer tikken. Jij laat je niet afschepen.",
  ],
  "toast.ontwikkelaarUit": [
    "Ontwikkelaarsmodus uit.\nDe motorkap is weer dicht.",
    "Terug naar normaal.\nDe geheime knoppen zijn weer geheim.",
    "Ontwikkelaarsmodus uit.\nNiemand heeft iets gezien.",
    "Weer gewoon leerling.\nOok prima.",
    "Uitgezet.\nZeven keer tikken en hij is er weer.",
  ],
  // Demo voor bezoekers die (nog) niet gekoppeld zijn: Daan Visser, 5 havo, verzonnen.
  "toast.demoAan": [
    "Welkom in de demo.\nJe kijkt mee met Daan uit 5 havo. Alles is verzonnen, ook zijn 4,9.",
    "Demo staat aan.\nDaan leent je even zijn rooster. Hij weet van niks.",
    "Je bent nu Daan.\nNiet echt. Maar je mag wel aan zijn cijfers zitten.",
    "Demo gestart.\nVerzonnen school, verzonnen cijfers, echte walkouts.",
    "Even rondkijken.\nDit is Daan zijn week. Koppelen kan altijd nog.",
  ],
  "toast.demoUit": [
    "Demo gestopt.\nDaan krijgt zijn rooster terug.",
    "Terug uit de demo.\nKoppel je eigen Magister als je klaar bent voor het echte werk.",
    "Demo uit.\nDaan zwaait.",
    "Klaar met rondkijken.\nJe eigen cijfers wachten in Magister.",
    "Demo gestopt.\nAlles van Daan blijft netjes los van jouw gegevens.",
  ],
  // De balk boven elke pagina in de demo (geen titel, één zin).
  "demo.banner": [
    "Je kijkt mee met Daan uit 5 havo. Alles hier is verzonnen.",
    "Dit is de demo: Daan zijn rooster, huiswerk en cijfers. Niet de jouwe.",
    "Verzonnen school, verzonnen Daan. Je eigen Magister is één bladwijzer verderop.",
    "Demo. Daan vindt het prima dat je meekijkt.",
    "Je ziet de demo. Je echte cijfers blijven veilig in Magister tot je koppelt.",
  ],
  "toast.ics": [
    "Rooster gedownload.\nOpen het bestand en je agenda weet alles.",
    "Agendabestand klaar.\nJe telefoon weet nu ook waar je moet zijn.",
    "Rooster geëxporteerd.\nUitval zie je in je agenda als vervallen.",
    "Gedownload.\nVier weken rooster, in één bestand.",
    "Klaar.\nImporteer hem in je agenda en vergeet nooit meer een lokaal.",
  ],

  // ——— Huiswerk (fase 3c) ————————————————————————————————————————————————
  /** Alles voor de volgende schooldag is af (titel\nuitleg). {dag} = "morgen" of "maandag". */
  "huiswerk.allesAf": [
    "Alles af.\nJe hebt nu officieel niks meer te doen. Eng, hè.",
    "Alles voor {dag} is af.\nDe rest van de avond is van jou.",
    "Klaar. Allemaal.\nJe weet nu even niet wat je met jezelf aan moet.",
    "Niks meer open voor {dag}.\nDit gebeurt een paar keer per jaar. Screenshot maken.",
    "Alles afgevinkt.\nDe bank roept je naam.",
  ],
  /** Onder de drukte-meter, als een dag zwaar wordt. {tijd} = "1u 40m". */
  "huiswerk.drukte": [
    "{dag} wordt zwaar: {tijd} huiswerk. Begin er vandaag een stukje van.",
    "Voor {dag} moet er {tijd} af. Dat is een hele film, zonder film.",
    "{tijd} voor {dag}. Verdeel het, dan voelt het als minder.",
    "{dag}: {tijd} huiswerk. Je toekomstige zelf hoopt dat je nu begint.",
    "{tijd} voor {dag}. Niet allemaal op de avond ervoor, als het kan.",
  ],
  /** Bovenaan "Ik heb geen zin". */
  "geenZin.intro": [
    "Snap ik. Kies er een. Allebei kleiner dan het hele ding.",
    "Geen zin is ook een gevoel. We gaan er gewoon omheen.",
    "Je hoeft niet alles. Alleen een begin.",
    "Beginnen is het zwaarste stuk. Daarna is het gewoon doorgaan.",
    "Oké. We maken het zo klein dat het bijna zielig is.",
  ],
  "geenZin.stapjes": [
    "Eén stapje tegelijk. Het eerste is bijna te makkelijk.",
    "Klein gemaakt. Vink ze af, dan voelt het als winnen.",
    "Niet naar het hele lijstje kijken. Alleen naar het bovenste.",
    "In hapklare stukjes. Zonder saus, helaas.",
    "Zo bouwen ze ook piramides, denken we. Stapje voor stapje.",
  ],
  /** Vóór de timer van 5 minuten. */
  "geenZin.timer": [
    "Vijf minuten. Daarna mag je stoppen. Echt.",
    "Alleen vijf minuten. Na het belletje mag je weg.",
    "Vijf minuten, dan ben je vrij. Afspraak is afspraak.",
    "Doe vijf minuten. Daarna beslis je opnieuw.",
    "Vijf minuten is korter dan een reclameblok. Je kunt dit.",
  ],
  /** Terwijl de timer loopt. */
  "geenZin.bezig": [
    "Telefoon weg. Ja, die.",
    "Je bent bezig. Niet kijken hoe lang nog.",
    "Gewoon doorgaan. De timer let wel op.",
    "Dit lijkt verdacht veel op huiswerk maken.",
    "Niemand ziet het, maar je bent goed bezig.",
  ],
  /** De vijf minuten zijn om (titel\nuitleg). */
  "geenZin.klaar": [
    "Vijf minuten.\nJe bent officieel begonnen. Nog 5?",
    "Belletje.\nJe mag stoppen. Of nog 5, nu je toch bezig bent?",
    "Gehaald.\nHet ergste stuk is voorbij. Nog 5?",
    "Vijf minuten gedaan.\nDe motor draait. Nog 5?",
    "Tijd.\nStoppen mag. Doorgaan ook. Nog 5?",
  ],
  // Mini-stapjes. Wat uit Magister komt ("Lees § 3.2") staat ertussen.
  "stapjes.begin": [
    "Leg je telefoon met het scherm naar beneden.",
    "Pak je boek. Alleen pakken, verder niks.",
    "Zet een glas water klaar. Dat is ook voorbereiding.",
    "Open je schrift op een lege bladzijde.",
    "Ga zitten waar geen bed in de buurt is.",
  ],
  "stapjes.lezen": [
    "Lees de opdracht één keer. Niks doen, alleen lezen.",
    "Lees wat er precies moet. Soms is het minder dan je dacht.",
    "Kijk wat de opdracht vraagt. Hardop mag ook.",
    "Lees de opdracht en onderstreep wat moet.",
    "Zoek uit wat er eigenlijk gevraagd wordt.",
  ],
  "stapjes.eerste": [
    "Doe alleen het eerste stukje.",
    "Maak de eerste vraag. Alleen die.",
    "Schrijf de eerste zin op. Mag slecht zijn.",
    "Begin met het makkelijkste stuk.",
    "Doe het begin. Meer hoeft nu niet.",
  ],
  "stapjes.einde": [
    "Vink het af. Dit is het beste stapje.",
    "Klaar? Afvinken en weglopen.",
    "Kijk of je niks vergeten bent. Dan afvinken.",
    "Stop het in je tas. Dan ligt het morgen niet thuis.",
    "Afvinken. Plop.",
  ],
  "stapjes.toetsStof": [
    "Zoek op wat je precies moet kennen.",
    "Kijk welke stof erbij hoort. Niet gokken.",
    "Schrijf de paragrafen op die in de toets komen.",
    "Check de studiewijzer. Daar staat het echt.",
    "Vraag je af: wat moet ik echt weten?",
  ],
  "stapjes.toetsSamenvatting": [
    "Lees de samenvatting. Of maak er een.",
    "Schrijf de belangrijkste begrippen op een blaadje.",
    "Maak een spiekbriefje dat je niet gaat gebruiken.",
    "Zet de formules of woorden op een rij.",
    "Lees je aantekeningen één keer door.",
  ],
  "stapjes.toetsOefenen": [
    "Maak drie oefenvragen.",
    "Leg het uit aan je kamerplant.",
    "Overhoor jezelf met de begrippen.",
    "Maak een oefentoets. Het is maar een oefentoets.",
    "Doe de opgaven die je vorige keer fout had.",
  ],

  // ——— Cijfers (fase 4) ————————————————————————————————————————————————————
  /** Calculator: dit cijfer heb je minimaal nodig. */
  "calc.mogelijk": [
    "Haal een {nodig} en je staat op een {doel}.",
    "Minimaal een {nodig}. Dan sta je op een {doel}.",
    "Een {nodig} is genoeg voor een {doel}. Niet minder, wel meer.",
    "{nodig}. Dat is het getal. Dan sta je op een {doel}.",
    "Met een {nodig} kom je op een {doel}. Te doen.",
  ],
  /** Calculator: zelfs een 1,0 is genoeg (titel\nuitleg). */
  "calc.binnen": [
    "Al binnen. 😎\nZelfs met een 1,0 sta je nog op een {doel}.",
    "Je staat er al. 😎\nDeze toets krijgt je niet meer onder de {doel}.",
    "Binnen. 😎\nJe mag een 1,0 halen. Doe het niet.",
    "Geen zorgen. 😎\nOok met een 1,0 blijf je op een {doel}.",
    "Al geregeld. 😎\nDeze toets is bonus.",
  ],
  /** Calculator: zelfs een 10 is niet genoeg (titel\nuitleg). */
  "calc.onmogelijk": [
    "Onmogelijk. 😬\nZelfs een 10 brengt je niet op een {doel}. Met de toets erna wel dichterbij.",
    "Dat gaat niet lukken. 😬\nMet één toets kom je niet op een {doel}. Wel een flink stuk.",
    "Wiskundig uitgesloten. 😬\nEen 10 is niet genoeg. Een lager doel wel.",
    "Zelfs een 10 is te weinig. 😬\nKies een lager doel, of reken met een zwaardere toets.",
    "Niet met deze toets. 😬\nDe {doel} komt pas in zicht met meer cijfers.",
  ],
  /** Calculator: de volgende toets heeft weging 0 (titel\nuitleg). */
  "calc.teltNiet": [
    "Deze toets telt niet mee.\nWeging 0 verandert niets aan je gemiddelde. Oefenen mag wel.",
    "Weging 0.\nWat je ook haalt, je gemiddelde blijft staan.",
    "Telt niet.\nEen oefentoets. Geen druk, wel nuttig.",
    "Geen weging.\nDeze is voor de oefening, niet voor het rapport.",
    "Dit is een oefenrondje.\nJe gemiddelde kijkt niet mee.",
  ],
  /** Het omgekeerde: met dit cijfer sta je op… */
  "calc.omgekeerd": [
    "Met een {cijfer} sta je dan op een {gem}.",
    "Haal je een {cijfer}, dan wordt je gemiddelde een {gem}.",
    "Een {cijfer} erbij? Dan sta je op een {gem}.",
    "Een {cijfer} maakt er een {gem} van.",
    "Met een {cijfer} kom je uit op een {gem}.",
  ],
  "simulator.intro": [
    "Wat als? Voeg cijfers toe en kijk wat er gebeurt. Er wordt niks opgeslagen.",
    "Speel met cijfers die er nog niet zijn. De echte blijven gewoon staan.",
    "Denkbeeldige cijfers, echte gevolgen. Voor de meter dan.",
    "Hier mag je jezelf een 10 geven. Alleen hier.",
    "Probeer het uit. Resetten kan altijd, Magister merkt niks.",
  ],
  // Overgangsmeter, onder de status.
  "overgang.over": [
    "Je gaat over. Zeg het nog niet hardop, dan horen de cijfers het.",
    "Over, op deze cijfers. De zomer is in zicht.",
    "Alles binnen de normen. De rapportvergadering wordt saai, voor jou.",
    "Je staat erover. Rustig blijven, nog even volhouden.",
    "Over. Niemand hoeft een vergadering over je te houden.",
  ],
  "overgang.bespreek": [
    "Bespreekgeval. Er wordt over je vergaderd. Geef ze iets goeds om over te praten.",
    "Net over de grens. Eén vak omhoog en het is opgelost.",
    "Op het randje. De docenten gaan stemmen. Maak het ze makkelijk.",
    "Bespreekzone. Niet fijn, wel te redden. Hieronder staat welk vak het verschil maakt.",
    "Je bent een agendapunt. Nog tijd om dat te veranderen.",
  ],
  "overgang.gevaar": [
    "Gevarenzone. Nog niet te laat, wel tijd voor een plan.",
    "Zo ga je niet over. Hieronder staat welk vak het meest helpt.",
    "Rood licht. Eén of twee vakken omhoog en het ziet er heel anders uit.",
    "Dit is de gevarenzone. Praat met je mentor, die wil dit ook oplossen.",
    "Niet goed, wel te draaien. Begin bij het vak bovenaan de lijst.",
  ],
  "overgang.onbekend": [
    "Nog niets om mee te rekenen. Eerst cijfers, dan conclusies.",
    "Nog geen gemiddelden. De meter wacht geduldig.",
    "Geen cijfers, geen oordeel. Voor nu.",
    "Leeg. Open je pack, dan kan de meter iets.",
    "Nog geen data. De meter zit in de wachtkamer.",
  ],
  "examen.over": [
    "Op je SE sta je geslaagd. Het centraal examen moet het nog bevestigen.",
    "Geslaagd, op deze cijfers. Het CE heeft nog een woordje mee te spreken.",
    "Je SE zegt: geslaagd. Nu het CE nog. Geen druk.",
    "Op papier geslaagd. Het CE maakt het echt.",
    "Je SE is op orde. Laat de vlag nog even in de kast.",
  ],
  "examen.gevaar": [
    "Op je SE zou je nu zakken. Het CE kan veel goedmaken. Hieronder staat waar.",
    "Gevarenzone. Nog geen vlag, wel een plan. Begin bij het vak bovenaan.",
    "Zo red je het nog niet. Je mentor denkt graag mee.",
    "Je SE is krap. Het CE telt bij de meeste vakken voor de helft. Kansen genoeg.",
    "Zakken ligt op de loer. Nog tijd om dat te veranderen.",
  ],
  // Inzichten in gewone taal.
  "inzicht.stijgt": [
    "{vak} gaat al {aantal} toetsen op rij omhoog. Je docent heeft het ook gezien.",
    "{aantal} keer op rij beter voor {vak}. Dat is geen toeval meer, dat is een trend.",
    "{vak}: {aantal} toetsen op rij omhoog. Niemand vraagt hoe. Gewoon doorgaan.",
    "{vak} klimt al {aantal} toetsen. De grafiek wijst naar rechtsboven, zoals het hoort.",
    "{aantal} toetsen op rij hoger bij {vak}. Je bent op dreef. Niet te hard zeggen.",
  ],
  "inzicht.daalt": [
    "{vak} zakt al {aantal} toetsen. De calculator laat zien wat de volgende moet worden.",
    "{aantal} keer op rij lager bij {vak}. Niet erg, wel een seintje.",
    "{vak} gaat al {aantal} toetsen omlaag. Tijd voor een plan. Een klein plan.",
    "{vak} glijdt al {aantal} toetsen af. Eén goede toets draait het om.",
    "{aantal} toetsen omlaag voor {vak}. Vraag je docent wat er mist. Die weet het.",
  ],
  "inzicht.randje": [
    "{vak} staat op een {cijfer}. Een voldoende, met de nadruk op net.",
    "{vak}: {cijfer}. Je balanceert op de 5,5. Niet gaan wiebelen.",
    "{vak} op {cijfer}. Eén mindere toets en het wordt rood.",
    "Een {cijfer} voor {vak}. Voldoende, maar niet om over op te scheppen.",
    "{vak} staat op {cijfer}. De volgende toets telt, letterlijk.",
  ],
  "inzicht.jaarOmhoog": [
    "Je gemiddelde is sinds periode 1 met {verschil} gestegen. Gewoon beter geworden.",
    "+{verschil} sinds periode 1. Je bent officieel aan het groeien.",
    "Je staat gemiddeld {verschil} hoger dan in periode 1. Iemand let op.",
    "Sinds periode 1 gemiddeld {verschil} erbij. Zo werkt dat dus.",
    "{verschil} hoger dan in periode 1. De rapportvergadering gaat het merken.",
  ],
  "inzicht.jaarOmlaag": [
    "Je gemiddelde is sinds periode 1 {verschil} gezakt. Er is nog tijd.",
    "{verschil} lager dan in periode 1. Een paar goede toetsen en het is weg.",
    "Sinds periode 1 gemiddeld {verschil} eraf. Kijk welk vak trekt.",
    "Je staat {verschil} lager dan in periode 1. Niet fijn, wel te repareren.",
    "-{verschil} sinds periode 1. De simulator laat zien wat helpt.",
  ],
  "inzicht.dag": [
    "Je hoogste cijfers haal je op {dag}: gemiddeld een {cijfer}. Plan je toetsen daar.",
    "Op {dag} scoor je het best: gemiddeld {cijfer}. Niemand weet waarom.",
    "{dag} is jouw dag: gemiddeld een {cijfer}. Statistisch gezien.",
    "Toetsen op {dag}: gemiddeld {cijfer}. Je beste dag. Wij noemen het geen bijgeloof.",
    "Gemiddeld een {cijfer} op {dag}. De rest van de week mag een voorbeeld nemen.",
  ],
  "inzicht.beste": [
    "{vak} is je beste vak: gemiddeld een {cijfer}.",
    "Je sterkste vak? {vak}, met een {cijfer}. Geen discussie.",
    "{vak} staat bovenaan met een {cijfer}. Stabiel.",
    "Met een {cijfer} is {vak} je paradepaardje.",
    "Gemiddeld een {cijfer} voor {vak}. Dat vak heb je onder controle.",
  ],
  "inzicht.negens": [
    "Al {aantal} keer een 9 of hoger dit jaar. Je docenten hebben het druk met jou.",
    "{aantal} negens of hoger. Die mogen in een lijstje.",
    "Dit jaar al {aantal} keer 9+. Dat gebeurt niet per ongeluk.",
    "{aantal} cijfers van 9 of meer. Je hebt een collectie.",
    "Al {aantal} keer een 9 of hoger. Niet te vaak zeggen, dan klinkt het als opscheppen.",
  ],
  // Cijfertijdlijn: mijlpalen in het verhaal.
  "tijdlijn.eerste": [
    "Het eerste cijfer van het jaar. {vak}, een {cijfer}. Hier begint het.",
    "Startschot: een {cijfer} voor {vak}.",
    "Zo begon het: {vak}, {cijfer}. Niemand wist wat er ging komen.",
    "Cijfer één. {vak}. Een {cijfer}. Het jaar is begonnen.",
    "Het allereerste: een {cijfer} voor {vak}. Nog alles mogelijk.",
  ],
  "tijdlijn.hoogste": [
    "Je hoogste cijfer van het jaar: een {cijfer} voor {vak}.",
    "Piek bereikt. {vak}, {cijfer}. Inlijsten.",
    "Dit is de top: een {cijfer} voor {vak}. Tot nu toe.",
    "Een {cijfer} voor {vak}. Hoger kwam je dit jaar niet.",
    "Hoogtepunt: {vak}, {cijfer}. Die mag je onthouden.",
  ],
  "tijdlijn.negen": [
    "Je eerste 9 van het jaar. {vak}, een {cijfer}.",
    "Eerste negen binnen: {vak}. Dat smaakt naar meer.",
    "{vak} levert je eerste 9+: een {cijfer}.",
    "Een {cijfer} voor {vak}. De eerste negen. Er volgen er hopelijk meer.",
    "Daar is hij: je eerste 9. {vak}, {cijfer}.",
  ],
  "tijdlijn.comeback": [
    "Comeback. Van een {vorig} naar een {cijfer} voor {vak}.",
    "Na een {vorig} kwam een {cijfer}. {vak} had je onderschat.",
    "{vak}: eerst een {vorig}, toen een {cijfer}. Zo doe je dat.",
    "Van {vorig} naar {cijfer} voor {vak}. Plot twist.",
    "Een {vorig}, en daarna een {cijfer}. {vak} kreeg een tweede seizoen.",
  ],
  /** Vak-detail zonder cijfers (titel\nuitleg). */
  "cijfers.vakLeeg": [
    "Nog geen cijfers.\nDit vak wacht nog op zijn eerste toets.",
    "Leeg.\nDe docent heeft nog niets ingevoerd. Geniet ervan.",
    "Geen cijfers.\nGeen cijfers, geen gemiddelde, geen zorgen.",
    "Nog niks.\nHet eerste cijfer komt vanzelf. Of niet vanzelf.",
    "Stil hier.\nDit vak heeft nog geen mening over je.",
  ],

  // ——— Video (feature B) ——————————————————————————————————————————————
  "video.voortgang": [
    "Pixels in de goede volgorde zetten…",
    "Flares aansteken. Binnen. Niet thuis proberen.",
    "Deze clanker werkt zo hard als hij kan.",
    "Renderen gaat sneller dan jij je huiswerk maakt.",
    "Bijna klaar. (Dat zeggen we altijd.)",
  ],
  /** Klein onder "Raad mijn cijfer." aan het eind van een mysterie-video. */
  "video.inzet": [
    "Fout = jij haalt tosti's.",
    "Fout = jij haalt tosti's. Twee.",
    "Antwoord in de comments. Fout = trakteren.",
    "Goed geraden = eeuwige roem. Fout = tosti's halen.",
    "Wie fout zit, staat morgen in de rij bij de aula.",
  ],

  // ——— Jouw Elftal ————————————————————————————————————————————————————
  /** Sterkste linie, met het vak dat hem draagt. */
  "elftal.sterk": [
    "Je {linie} draait op {vak}. Respect, eerlijk gezegd.",
    "Je {linie} is het sterkst. {vak} doet daar al het werk.",
    "{vak} houdt je {linie} overeind. Iemand moet het doen.",
    "Je {linie} is op orde. Bedank {vak} even.",
    "De {linie} is je beste linie. {vak} weet ervan.",
  ],
  /** Zwakste linie, met het vak met de laagste rating daar. */
  "elftal.zwak": [
    "Je {linie} is van papier. {vak}, we kijken naar jou.",
    "Zwakste plek: de {linie}. {vak} weet waarom.",
    "Je {linie} lekt. {vak} heeft er geen zin in vandaag.",
    "De {linie} wankelt. {vak} staat te kijken.",
    "Je {linie} is het zwakst. {vak} heeft een herkansing nodig.",
  ],
  "elftal.tip.leeg": [
    "Nog {aantal} lege plekken. Een elftal met gaten is een elftal met een probleem.",
    "{aantal} plekken leeg. Zo speel je met minder man, en dat mag niet eens.",
    "Er ontbreken er nog {aantal}. Tik op een lege plek en kies een kaart.",
    "Vul de {aantal} lege plekken. Een spelersbus is geen tactiek.",
    "Nog {aantal} plekken vrij. Het veld is groot, je kaarten ook.",
  ],
  "elftal.tip.keeper": [
    "Je keeper is geen keeper. Zet LO op doel: de enige die officieel mag duiken.",
    "Er staat geen LO op doel. Een keeper zonder gymkleren, dat gaat mis.",
    "Op doel hoort LO. Alleen die heeft ooit een bal tegengehouden.",
    "Je doel is onbewaakt. Ja, er staat iemand. Nee, dat telt niet.",
    "Keeper gezocht. Bij voorkeur iemand die weleens een gymles heeft gehad.",
  ],
  "elftal.tip.positie": [
    "{vak} staat verkeerd. Die hoort in de {linie}.",
    "Zet {vak} in de {linie}. Daar voelt hij zich thuis.",
    "{vak} speelt uit positie. Terug naar de {linie} ermee.",
    "{vak} in de {linie} geeft meer chemie. Gewoon even schuiven.",
    "{vak} staat er een beetje verloren bij. De {linie} is waar hij hoort.",
  ],
  "elftal.tip.chemie": [
    "{aantal} rode lijnen. Zet vakken uit dezelfde vakgroep naast elkaar.",
    "Veel rood op het veld. Talen naast talen, exact naast exact.",
    "{aantal} rode lijnen. Je elftal praat niet met elkaar.",
    "Rode lijnen kosten chemie. Dezelfde periode of allebei een SO helpt ook.",
    "{aantal} keer rood. Dit is geen team, dit is een groepsopdracht.",
  ],
  "elftal.tip.aanvoerder": [
    "Nog geen aanvoerder. Tik op een kaart en geef hem de band.",
    "Kies een aanvoerder: dat is één chemie extra, gratis.",
    "Geen aanvoerder. Iemand moet de toss doen.",
    "Een aanvoerder geeft +1 chemie. Wie verdient de band?",
    "Wie wordt aanvoerder? Tip: niet degene die altijd te laat is.",
  ],
  "elftal.tip.top": [
    "Niks op aan te merken. Verdacht, maar goed.",
    "Dit elftal klopt. Laat het niet aan je mentor zien, die wil ook meedoen.",
    "Alles staat goed. Nu nog die cijfers omhoog, dan ben je klaar.",
    "Geen tips. Je weet wat je doet. Of je hebt geluk.",
    "Perfect opgesteld. De rest is aan de docenten.",
  ],
  /** Lege staat: nog geen onthulde kaarten met een cijfer (titel\nuitleg). */
  "elftal.leeg": [
    "Nog geen spelers.\nOpen eerst je pack. Een elftal zonder kaarten is een schoolplein.",
    "Geen selectie.\nOnthul een paar cijfers, dan heb je spelers.",
    "Leeg veld.\nJe kaarten zitten nog in het pack. Trainer zijn is wachten.",
    "Niemand komt opdagen.\nOnthul eerst cijfers in je pack, dan kun je opstellen.",
    "Nog geen elftal.\nZonder onthulde cijfers geen spelers. Zo werkt de transfermarkt.",
  ],
  "elftal.gebouwd": [
    "Opgesteld. Rating {cijfer}, chemie {aantal}.",
    "Daar staat je beste elftal. Rating {cijfer}, chemie {aantal}.",
    "Klaar. De trainer heeft gesproken: rating {cijfer}, chemie {aantal}.",
    "Beste elftal staat. {cijfer} rating, {aantal} chemie. Niet slecht.",
    "Opstelling gemaakt. Rating {cijfer}, chemie {aantal}. Wissel gerust.",
  ],

  // ——— Oefenwedstrijd ——————————————————————————————————————————————————
  "wedstrijd.goalOns": [
    "{vak} loopt alleen op de keeper af… en scoort. Net als in H4.",
    "Goal. {vak} schiet hem erin. Zo gaat dat met een goede voorbereiding.",
    "{vak} kopt raak. Niemand had het verwacht, {vak} zelf ook niet.",
    "Doelpunt van {vak}. Strak in de hoek, zoals een sommetje dat in één keer klopt.",
    "{vak} scoort. Het hele lokaal juicht. Ja, ook achterin.",
    "Wat een goal van {vak}. Voor de herhaling: dit was geen herkansing.",
  ],
  "wedstrijd.goalZij": [
    "Tegendoelpunt. {tegenstander} profiteert van een slaapje. Typisch het eerste uur.",
    "{tegenstander} scoort. Je verdediging was even naar de kantine.",
    "Au. {tegenstander} maakt hem. Niemand stond op zijn plek, net als bij een brandoefening.",
    "Goal voor {tegenstander}. Je keeper keek naar zijn telefoon.",
    "{tegenstander} scoort uit een counter. Sneller dan de bel om 15:10.",
  ],
  "wedstrijd.kansOns": [
    "{vak} schiet net naast. Dat was bijna een voldoende.",
    "Grote kans voor {vak}. Paal. Er is altijd een paal.",
    "{vak} kapt er twee uit en schiet over. Mooi bedacht, minder mooi uitgevoerd.",
    "{vak} komt vrij voor de keeper. Te lang nagedacht. Net als bij vraag 4.",
    "Schot van {vak}. De keeper heeft er gelukkig geen moeite mee. Voor hem dan.",
  ],
  "wedstrijd.kansZij": [
    "{tegenstander} krijgt een kans. Over. Opgelucht ademhalen.",
    "Paniek achterin. {tegenstander} mist van dichtbij.",
    "{tegenstander} raakt de lat. Iedereen kijkt de andere kant op.",
    "Kans voor {tegenstander}. Je keeper redt, met zijn gezicht.",
    "{tegenstander} schiet. Gelukkig net zo raak als de schoolwifi.",
  ],
  "wedstrijd.rust": [
    "Rust. Iedereen haalt een tosti.",
    "Rust. De trainer zegt iets over inzet. Niemand luistert.",
    "Rust. Kwartiertje pauze, net als op school, maar dan met gras.",
    "Rust. Drinken, ademen, niet aan je proefwerk denken.",
    "Rust. De tweede helft is als het zesde uur: zwaar.",
  ],
  "wedstrijd.winst": [
    "Gewonnen van {tegenstander}. Leg het vast, voor de ouderavond.",
    "Winst tegen {tegenstander}. Je elftal kan wat je cijferlijst soms niet kan.",
    "Overwinning. {tegenstander} gaat met de bus naar huis. Met vertraging.",
    "Gewonnen. {tegenstander} vraagt om een herkansing. Die krijgen ze niet.",
    "Drie punten tegen {tegenstander}. Het bord in de aula wordt bijgewerkt.",
  ],
  "wedstrijd.gelijk": [
    "Gelijk tegen {tegenstander}. Een voldoende, net.",
    "Gelijkspel. {tegenstander} en jij delen de punten en de tosti's.",
    "Gelijk. Niemand blij, niemand boos. Net als na een mentoruur.",
    "Remise tegen {tegenstander}. De 5,5 onder de uitslagen.",
    "Gelijk. Volgende keer beter, zegt iedereen, altijd.",
  ],
  "wedstrijd.verlies": [
    "Verloren van {tegenstander}. Het was maar een oefenwedstrijd. Het was maar een oefentoets.",
    "Verlies. {tegenstander} was beter. Dat mag gezegd.",
    "Verloren. Je elftal neemt de fiets naar huis. Tegenwind.",
    "Nederlaag tegen {tegenstander}. Wissel een paar kaarten en probeer het nog eens.",
    "Verloren van {tegenstander}. Niet erg. Morgen weer school, ook niet erg.",
  ],
} as const satisfies Record<string, readonly string[]>;

/** Feature B: de vaste teksten van de video (geen grappen die moeten wisselen). */
export const VIDEO_TEXT = {
  /** Groot onder het "?" aan het eind van een mysterie-video. */
  raad: "Raad mijn cijfer.",
  /** Boven de rollende teller in een normale video. */
  gok: "Mijn gok",
} as const;

/** Feature B: kies wat er op de sticker over je cijfer staat. */
export const VIDEO_STICKERS = [
  "Nee.",
  "Staatsgeheim",
  "Vraag mijn advocaat",
  "Niet vandaag",
  "Boeieuh",
] as const;

/**
 * Jouw Elftal: de clubnaam-generator plakt een voorvoegsel aan een schoolwoord.
 * Alleen schoolwoorden, dus er komt nooit een echte clubnaam uit.
 */
export const CLUB_PREFIXES = [
  "FC",
  "SV",
  "VV",
  "AC",
  "Atletico",
  "Olympique",
  "Dynamo",
  "Real",
  "Inter",
  "Sporting",
  "Racing",
  "Athletic",
  "United",
] as const;

export const CLUB_WORDS = [
  "Herkansing",
  "Tussenuur",
  "Aula",
  "Oefentoets",
  "Mentoruur",
  "Rooster",
  "Uitval",
  "Absentie",
  "Kluisje",
  "Studiewijzer",
  "Proefwerkweek",
  "Fietsenstalling",
  "Tostiapparaat",
  "Beamer",
  "Huiswerkklas",
  "Spiekbriefje",
  "Pauzebel",
  "Gymzaal",
  "Rode Pen",
  "Nakijkstapel",
  "Conciërge",
  "Zesje",
] as const;

/** Verzonnen tegenstanders voor de oefenwedstrijd. Geen echte clubs, mensen of docenten. */
export const MATCH_OPPONENTS = [
  "De Huiswerkploeg XI",
  "Team Maandagochtend",
  "Sportclub Studiewijzer",
  "De Nablijvers",
  "Teams-deadline 23:59",
  "Ouderavond United",
  "De Rode Pennen",
  "Real Toetsweek",
] as const;

export type CopyKey = keyof typeof COPY;
