import type { TestKind } from "@/lib/types";

/** Huiswerkteksten per vak, zoals docenten ze in Magister zetten (HTML). */
export const HOMEWORK_TEXTS: Readonly<Record<string, readonly string[]>> = {
  ne: [
    "<p>Lees hoofdstuk 4 van <em>Het Diner</em> en maak de vragen uit de studiewijzer.</p>",
    "<p>Maak opdracht 3 t/m 7 van §2.3 (argumentatieschema's).</p>",
    "<p>Schrijf de inleiding van je betoog (max. 150 woorden) en lever hem in via de ELO.</p>",
    "<p>Leer de stijlfiguren op blz. 112.</p>",
  ],
  en: [
    '<p>Learn the words of Unit 4 (A + B). Oefenen kan op <a href="https://quizlet.com">Quizlet</a>.</p>',
    "<p>Read chapter 5 of <em>The Great Gatsby</em> and answer questions 1–6.</p>",
    "<p>Exercises 12–15 on page 87 (passive voice).</p>",
    "<p>Write a short review (200 words) of a series you watched.</p>",
  ],
  du: [
    "<p>Lerne die Wörter von Kapitel 5, Wortschatz A.</p>",
    "<p>Maak oefening 4, 5 en 7 op blz. 62 (naamvallen).</p>",
    "<p>Hörverstehen: luister fragment 3 en maak de vragen.</p>",
  ],
  wisa: [
    "<p>Maak §5.2 opgave 14 t/m 22. Neem je GR mee!</p>",
    "<p>Maak de diagnostische toets van H5.</p>",
    "<p>Opgaven 30–35 (kansbomen). De uitwerkingen staan op de ELO.</p>",
  ],
  biol: [
    "<p>Leer §3 en §4 van thema Erfelijkheid en maak de samenvatting af.</p>",
    "<p>Maak opdracht 18–24 van basisstof 5.</p>",
    '<p>Bekijk <a href="https://www.youtube.com">de video over celdeling</a> en maak de quiz.</p>',
  ],
  schk: [
    "<p>Maak opgave 21 t/m 29 van §6.3 (redoxreacties). Gebruik Binas tabel 48.</p>",
    "<p>Werk je practicumverslag uit volgens de instructie op de ELO.</p>",
  ],
  nat: [
    "<p>Maak opgave 9–16 van §5.2 (trillingen). Het formuleblad mag erbij.</p>",
    "<p>Lees §5.3 en maak de oefentoets.</p>",
  ],
  ak: [
    "<p>Lees §4.2 en maak de opdrachten in je werkboek.</p>",
    "<p>Maak de kaartopdracht over het klimaat van Zuidoost-Azië.</p>",
  ],
  gs: [
    "<p>Bestudeer de kenmerkende aspecten van tijdvak 8 en maak bronopdracht 3.</p>",
    "<p>Maak de tijdlijn van de Koude Oorlog af.</p>",
  ],
  econ: [
    "<p>Maak opgave 1 t/m 9 van hoofdstuk 7 (speltheorie).</p>",
    "<p>Lees de casus over de rentestand en beantwoord de vragen.</p>",
  ],
  tek: [
    "<p>Neem je schetsboek en drie inspiratiebeelden mee.</p>",
    "<p>Maak je stilleven af voor de bespreking.</p>",
  ],
  lo: ["<p>Sportkleding mee! We doen een bleeptest.</p>"],
  mentor: ["<p>Vul de keuzevragenlijst voor je profielwerkstuk in.</p>"],
};

/** Kans dat een les huiswerk heeft, per vak. */
export const HOMEWORK_CHANCE: Readonly<Record<string, number>> = {
  lo: 0.15,
  mentor: 0.2,
  tek: 0.25,
};
export const DEFAULT_HOMEWORK_CHANCE = 0.38;

export interface DemoTestSpec {
  kind: Extract<TestKind, "toets" | "schriftelijk" | "mondeling">;
  html: string;
}

/** Toetsen per vak. LO, tekenen en mentoruur hebben geen toetsen in de demo. */
export const TEST_TEXTS: Readonly<Record<string, readonly DemoTestSpec[]>> = {
  ne: [
    {
      kind: "toets",
      html: "<p><strong>Toets leesvaardigheid</strong><br>Stof: tekstverbanden en argumentatie (H2–H3). Woordenboek toegestaan.</p>",
    },
    {
      kind: "mondeling",
      html: "<p><strong>Mondeling literatuur</strong><br>Bespreek drie gelezen boeken. Neem je leesdossier mee.</p>",
    },
  ],
  en: [
    {
      kind: "mondeling",
      html: "<p><strong>Speaking test: literature</strong><br>Discuss two books you read. 15 minutes.</p>",
    },
    {
      kind: "schriftelijk",
      html: "<p><strong>SO vocabulary</strong><br>Unit 4 + 5, English → Dutch.</p>",
    },
  ],
  du: [
    {
      kind: "schriftelijk",
      html: "<p><strong>SO Wortschatz</strong><br>Kapitel 5 (A + B), Deutsch → Niederländisch.</p>",
    },
  ],
  wisa: [
    {
      kind: "toets",
      html: "<p><strong>PW H6 Statistiek</strong><br>Stof: H6 + vaardigheden. GR verplicht.</p>",
    },
  ],
  biol: [
    {
      kind: "toets",
      html: "<p><strong>Toets H5 Ecologie</strong><br>Stof: §5.1 t/m §5.5 + practicum. Binas mee.</p>",
    },
  ],
  schk: [
    {
      kind: "schriftelijk",
      html: "<p><strong>SO Redox</strong><br>Stof: §6.1 t/m §6.3.</p>",
    },
  ],
  nat: [
    {
      kind: "toets",
      html: "<p><strong>Toets H5 Trillingen en golven</strong><br>Formuleblad en GR mee.</p>",
    },
  ],
  ak: [
    {
      kind: "toets",
      html: "<p><strong>Toets Aarde</strong><br>Stof: endogene processen, §2.1 t/m §2.4.</p>",
    },
  ],
  gs: [
    {
      kind: "toets",
      html: "<p><strong>PW Tijdvak 9</strong><br>Stof: kenmerkende aspecten 41–44 + bronnen.</p>",
    },
  ],
  econ: [
    {
      kind: "toets",
      html: "<p><strong>Toets Speltheorie</strong><br>Stof: H7, inclusief de opgaven uit de les.</p>",
    },
  ],
};
