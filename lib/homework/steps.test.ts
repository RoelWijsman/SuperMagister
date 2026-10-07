import { describe, expect, it } from "vitest";
import { miniSteps, type Step } from "./steps";

const text = (steps: Step[]) =>
  steps.map((step) => (step.kind === "tekst" ? step.text : `[${step.key}]`));

describe("miniSteps (ik heb geen zin)", () => {
  it("knipt lezen en maken op in losse stapjes", () => {
    expect(text(miniSteps({ text: "Lees § 3.2 en maak 4 t/m 7.", isTest: false }))).toEqual([
      "[stapjes.begin]",
      "Lees § 3.2",
      "Maak opdracht 4",
      "Maak opdracht 5",
      "Maak opdracht 6",
      "Maak opdracht 7",
      "[stapjes.einde]",
    ]);
  });

  it("neemt het woord uit de opdracht over en houdt een lijst heel", () => {
    expect(text(miniSteps({ text: "Opgave 4, 6 en 9", isTest: false })).slice(1, -1)).toEqual([
      "Maak opgave 4",
      "Maak opgave 6",
      "Maak opgave 9",
    ]);
  });

  it("maakt van een lange reeks blokjes van vier", () => {
    expect(text(miniSteps({ text: "Maak opgaven 30-45", isTest: false })).slice(1, -1)).toEqual([
      "Maak opgave 30 t/m 33",
      "Maak opgave 34 t/m 37",
      "Maak opgave 38 t/m 41",
      "Maak opgave 42 t/m 45",
    ]);
  });

  it("leest elke paragraaf apart", () => {
    expect(text(miniSteps({ text: "Lees §2.1, §2.2 en §2.3", isTest: false }))).toEqual([
      "[stapjes.begin]",
      "Lees § 2.1",
      "Lees § 2.2",
      "Lees § 2.3",
      "[stapjes.einde]",
    ]);
  });

  it("knipt niet bij afkortingen als blz.", () => {
    expect(
      text(miniSteps({ text: "Lees blz. 45 tot 50. Maak opdracht 3.", isTest: false })).slice(
        1,
        -1,
      ),
    ).toEqual(["Lees blz. 45 tot 50", "Maak opdracht 3"]);
  });

  it("houdt vrije tekst als één stapje", () => {
    expect(text(miniSteps({ text: "Neem je schetsboek mee", isTest: false }))).toEqual([
      "[stapjes.begin]",
      "Neem je schetsboek mee",
      "[stapjes.einde]",
    ]);
  });

  it("geeft bij een toets stapjes om te leren", () => {
    expect(text(miniSteps({ text: "Toets H4 Kansrekening", isTest: true }))).toEqual([
      "[stapjes.begin]",
      "[stapjes.toetsStof]",
      "[stapjes.toetsSamenvatting]",
      "[stapjes.toetsOefenen]",
      "[stapjes.einde]",
    ]);
  });

  it("heeft altijd iets, ook zonder tekst", () => {
    expect(text(miniSteps({ text: "", isTest: false }))).toEqual([
      "[stapjes.begin]",
      "[stapjes.lezen]",
      "[stapjes.eerste]",
      "[stapjes.einde]",
    ]);
  });
});
