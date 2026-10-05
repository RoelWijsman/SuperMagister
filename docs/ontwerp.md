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
  Collectie, Prestaties, Instellingen, Koppelen en de stijlgids.
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
- Het eerste pack bevat vier cijfers: 9,7 (ICON), 8,1 (goud, In Form), 6,8 (zilver, Comeback) en
  5,2 (brons).
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

## Bewust nog niet in fase 1

Walkout, kaarten en geluid (fase 2) · versleepbare widgets, rooster-weergaven, afvinken en focus
(fase 3) · vak-detail en calculators (fase 4) · koppelen, proxy en CSP (fase 5) · XP, Sup en recaps
(fase 6) · PWA, offline, meldingen, seizoensthema's en easter eggs (fase 7).
