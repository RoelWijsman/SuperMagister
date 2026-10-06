@AGENTS.md

# SuperMagister

- De volledige opdracht staat in `docs/bouwopdracht.md`, de aanvulling (humorbijbel + features A,
  B en C) in `docs/aanvulling.md`; gemaakte keuzes en afwijkingen in `docs/ontwerp.md`. Lees ze
  voordat je aan een nieuwe fase of feature begint.
- Volgorde: fase 1 → 2 → feature A (Gok je cijfer) → feature B (Walkout als video) → fase 3 → 4 →
  5 → 6 → feature C (Laatste schooldag) → fase 7. Stop na elke fase én elke feature.
- Alles in de app is Nederlands (teksten, comments, testnamen mogen Engels).
- Alle teksten met karakter (laadteksten, lege staten, meldingen, begroetingen, reacties) staan in
  `content/copy.ts` en volgen de humorbijbel: droog, specifiek, max. één emoji, minstens 5
  varianten, nooit twee keer achter elkaar dezelfde.
- Werk in fases. Na elke fase: `npm run check` moet slagen, geef een kort testlijstje, wacht op
  akkoord en maak één commit voor de fase.
- Rekenlogica (`lib/calc`, `lib/school`, `lib/demo`, …) eerst met een falende Vitest-test.
- Componenten kennen alleen de domeintypes uit `lib/types.ts` en de hooks uit `lib/data/hooks.ts`.
- De walkout is een pure functie van tijd t (`lib/walkout/plan.ts` + `render.ts`). Controleer
  visuele wijzigingen met de walkout-schuif op `/stijlgids`: elk tijdstip geeft hetzelfde frame.
- Kaartuiterlijk altijd via `cardLook`/`cardTierLabel` (`lib/cards/model.ts`), niet zelf afleiden.
- Elk nieuw component komt ook in de stijlgids (`components/styleguide/StyleguideView.tsx`). De
  stijlgids blijft buiten navigatie en command palette: alleen `/stijlgids` en Instellingen >
  Ontwikkelaar.
- Let op bij tool-invoer: `\u…`-escapes in geschreven bestanden worden echte tekens. Gebruik
  daarom geen `\u`-escapes in regexen of strings, of controleer het bestand na het schrijven.
