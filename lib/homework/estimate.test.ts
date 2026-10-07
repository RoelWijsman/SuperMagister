import { describe, expect, it } from "vitest";
import { estimateMinutes, homeworkMinutes } from "./estimate";

const hw = (text: string, isTest = false) => ({ text, isTest });

describe("estimateMinutes (tijdsschatting)", () => {
  it("rekent per opdracht", () => {
    expect(estimateMinutes(hw("Maak opdracht 3 t/m 7"))).toBe(20);
    expect(estimateMinutes(hw("Maak opgaven 30-35"))).toBe(25);
    expect(estimateMinutes(hw("Opdracht 4, 6 en 9"))).toBe(15);
  });

  it("schat lezen korter dan maken", () => {
    expect(estimateMinutes(hw("Lees §2.3"))).toBe(15);
    expect(estimateMinutes(hw("Lees hoofdstuk 4"))).toBe(30);
  });

  it("geeft leren voor een toets ruim de tijd", () => {
    expect(estimateMinutes(hw("SO Redox Stof: §6.1 t/m §6.3.", true))).toBe(45);
  });

  it("valt terug op twintig minuten, en blijft tussen 5 en 90", () => {
    expect(estimateMinutes(hw("Neem je schetsboek mee"))).toBe(20);
    expect(estimateMinutes(hw("Maak opdracht 1 t/m 60"))).toBe(90);
  });
});

describe("homeworkMinutes (eigen tijd, standaard per vak, schatting)", () => {
  const item = (text: string, isTest = false) => ({ id: "hw-1", subjectId: "wisa", text, isTest });
  const none = { items: {}, subjects: {} };

  it("gebruikt de schatting uit de tekst als je niks hebt ingesteld", () => {
    expect(homeworkMinutes(item("Maak opdracht 3 t/m 7"), none)).toEqual({
      minutes: 20,
      source: "schatting",
    });
  });

  it("gebruikt je standaard voor het vak, behalve bij toetsen", () => {
    const prefs = { items: {}, subjects: { wisa: 40 } };
    expect(homeworkMinutes(item("Maak opdracht 3 t/m 7"), prefs)).toEqual({
      minutes: 40,
      source: "vak",
    });
    expect(homeworkMinutes(item("Toets H4", true), prefs)).toEqual({
      minutes: 45,
      source: "schatting",
    });
  });

  it("laat je eigen tijd voor dit item altijd winnen", () => {
    const prefs = { items: { "hw-1": 35 }, subjects: { wisa: 40 } };
    expect(homeworkMinutes(item("Toets H4", true), prefs)).toEqual({
      minutes: 35,
      source: "eigen",
    });
  });

  it("houdt eigen tijden netjes: op vijf minuten, tussen 5 en 240", () => {
    expect(homeworkMinutes(item("x"), { items: { "hw-1": 2 }, subjects: {} }).minutes).toBe(5);
    expect(homeworkMinutes(item("x"), { items: { "hw-1": 33 }, subjects: {} }).minutes).toBe(35);
    expect(homeworkMinutes(item("x"), { items: { "hw-1": 999 }, subjects: {} }).minutes).toBe(240);
  });
});
