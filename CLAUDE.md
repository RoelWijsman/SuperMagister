@AGENTS.md

# SuperMagister

- De volledige opdracht staat in `docs/bouwopdracht.md`; gemaakte keuzes en afwijkingen in
  `docs/ontwerp.md`. Lees beide voordat je aan een nieuwe fase begint.
- Alles in de app is Nederlands (teksten, comments, testnamen mogen Engels).
- Werk in fases. Na elke fase: `npm run check` moet slagen, geef een kort testlijstje, wacht op
  akkoord en maak één commit voor de fase.
- Rekenlogica (`lib/calc`, `lib/school`, `lib/demo`, …) eerst met een falende Vitest-test.
- Componenten kennen alleen de domeintypes uit `lib/types.ts` en de hooks uit `lib/data/hooks.ts`.
- Let op bij tool-invoer: `\u…`-escapes in geschreven bestanden worden echte tekens. Gebruik
  daarom geen `\u`-escapes in regexen of strings, of controleer het bestand na het schrijven.
