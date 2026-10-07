import { describe, expect, it } from "vitest";
import { estimateMinutes } from "./estimate";

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
