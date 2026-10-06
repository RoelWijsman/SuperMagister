import { describe, expect, it } from "vitest";
import { practiceDeck } from "./practice";

const deck = practiceDeck("Daan Visser");
const byId = (id: string) => deck.find((entry) => entry.id === id)!;

describe("practiceDeck", () => {
  it("heeft van elke tier een kaart, plus In Form", () => {
    expect(deck.map((entry) => entry.card.tier)).toEqual([
      "brons",
      "zilver",
      "goud",
      "goud",
      "toty",
      "icon",
    ]);
    expect(byId("inform").card.primaryVariant).toBe("inform");
  });

  it("maakt een onvoldoende bij brons en een comeback bij zilver", () => {
    expect(byId("brons").card.isFail).toBe(true);
    expect(byId("zilver").card.variants).toContain("comeback");
  });

  it("laat de TOTY- en ICON-kaart hun eigen look houden (geen In Form)", () => {
    expect(byId("toty").card.primaryVariant).toBe("record");
    expect(byId("icon").card.primaryVariant).toBe("record");
  });

  it("markeert alles als oefenkaart met de naam van de leerling", () => {
    for (const entry of deck) {
      expect(entry.card.isPractice).toBe(true);
      expect(entry.card.studentName).toBe("Daan Visser");
      expect(entry.grades.some((g) => g.id === entry.card.gradeId)).toBe(true);
    }
  });
});
