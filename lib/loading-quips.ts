export type QuipTopic = "algemeen" | "cijfers" | "rooster" | "huiswerk";

/** Laadteksten. Kort, een tikje flauw, nooit lang genoeg om te irriteren. */
export const LOADING_QUIPS: Readonly<Record<QuipTopic, readonly string[]>> = {
  algemeen: ["Schoolbel wordt gesmeerd…", "Glas wordt opgepoetst…", "Even de aurora aanzetten…"],
  cijfers: [
    "Cijfers worden opgepoetst…",
    "Komma's worden rechtgezet…",
    "Gemiddeldes worden gewogen…",
  ],
  rooster: ["Rooster wordt ontward…", "Lokalen worden geteld…", "Tussenuren worden gezocht…"],
  huiswerk: [
    "Huiswerk wordt verstopt… grapje",
    "Agenda wordt opengeslagen…",
    "Potloden worden geslepen…",
  ],
};
