import { describe, expect, it } from "vitest";
import { shortSubjectName } from "./short";

describe("korte vaknamen", () => {
  it.each([
    ["Lichamelijke opvoeding", "lo", "LO"],
    ["Wiskunde A", "wisA", "Wis A"],
    ["Wiskunde B", "wisb", "Wis B"],
    ["Natuurkunde", "nat", "Nat"],
    ["Biologie", "bi", "Bio"],
    ["Aardrijkskunde", "ak", "Ak"],
    ["Geschiedenis", "gs", "Gs"],
    ["Economie", "ec", "Econ"],
    ["Nederlands", "ne", "Ne"],
    ["Engels", "en", "En"],
    ["Duits", "du", "Du"],
    ["Tekenen", "tek", "Tek"],
    ["Scheikunde", "sk", "Sk"],
    ["Handvaardigheid", "ha", "Hv"],
  ])("%s → %s", (name, code, short) => {
    expect(shortSubjectName(name, code)).toBe(short);
  });

  it("houdt een onbekend vak kort", () => {
    expect(shortSubjectName("Xylo")).toBe("Xylo");
    expect(shortSubjectName("Ruimtevaartkunde")).toBe("Ruim");
  });
});
