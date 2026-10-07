import { describe, expect, it } from "vitest";
import { arr, bool, field, int, num, obj, parseGradeValue, str, toLocalDate } from "./fields";

describe("field (PascalCase en camelCase)", () => {
  it("vindt een veld ongeacht hoofdletters", () => {
    expect(field({ Omschrijving: "Toets" }, "omschrijving")).toBe("Toets");
    expect(field({ omschrijving: "Toets" }, "Omschrijving")).toBe("Toets");
    expect(field({ OMSCHRIJVING: "Toets" }, "Omschrijving")).toBe("Toets");
  });

  it("probeert meerdere namen op volgorde", () => {
    expect(field({ Lokatie: "A12" }, "Lokaal", "Lokatie")).toBe("A12");
  });

  it("geeft undefined bij een ontbrekend veld of geen object", () => {
    expect(field({}, "Id")).toBeUndefined();
    expect(field(null, "Id")).toBeUndefined();
    expect(field("tekst", "Id")).toBeUndefined();
  });

  it("volgt een pad door geneste objecten", () => {
    expect(field({ Persoon: { Id: 42 } }, "Persoon.Id")).toBe(42);
    expect(field({ persoon: null }, "Persoon.Id")).toBeUndefined();
  });
});

describe("getallen, tekst, booleans en lijsten", () => {
  it("leest getallen, ook met een decimale komma", () => {
    expect(num({ Weging: 2 }, "Weging")).toBe(2);
    expect(num({ Weging: "1,5" }, "Weging")).toBe(1.5);
    expect(num({ Weging: "1.5" }, "Weging")).toBe(1.5);
    expect(num({ Weging: "" }, "Weging")).toBeNull();
    expect(num({ Weging: "veel" }, "Weging")).toBeNull();
    expect(num({}, "Weging")).toBeNull();
  });

  it("maakt hele getallen alleen van hele getallen", () => {
    expect(int({ Id: 42 }, "Id")).toBe(42);
    expect(int({ Id: "42" }, "Id")).toBe(42);
    expect(int({ Id: 4.2 }, "Id")).toBeNull();
  });

  it("leest tekst, en maakt van lege tekst null", () => {
    expect(str({ Naam: " Daan " }, "Naam")).toBe("Daan");
    expect(str({ Naam: "" }, "Naam")).toBeNull();
    expect(str({ Naam: 3 }, "Naam")).toBe("3");
    expect(str({}, "Naam")).toBeNull();
  });

  it("leest booleans, ook als tekst", () => {
    expect(bool({ TeltMee: true }, "TeltMee")).toBe(true);
    expect(bool({ TeltMee: "false" }, "TeltMee")).toBe(false);
    expect(bool({}, "TeltMee")).toBeNull();
  });

  it("geeft altijd een lijst, ook uit { Items: [...] }", () => {
    expect(arr({ Items: [1, 2] }, "Items")).toEqual([1, 2]);
    expect(arr({ items: null }, "Items")).toEqual([]);
    expect(arr([3], "Items")).toEqual([3]);
    expect(obj({ Vak: { Id: 1 } }, "Vak")).toEqual({ Id: 1 });
    expect(obj({ Vak: [] }, "Vak")).toBeNull();
  });
});

describe("parseGradeValue", () => {
  it("leest cijfers met komma of punt", () => {
    expect(parseGradeValue("7,8")).toEqual({ kind: "numeric", value: 7.8 });
    expect(parseGradeValue("10")).toEqual({ kind: "numeric", value: 10 });
    expect(parseGradeValue(" 5.4 ")).toEqual({ kind: "numeric", value: 5.4 });
    expect(parseGradeValue(6)).toEqual({ kind: "numeric", value: 6 });
  });

  it("houdt V, G, O en andere beoordelingen apart", () => {
    expect(parseGradeValue("V")).toEqual({ kind: "text", value: "V" });
    expect(parseGradeValue("g")).toEqual({ kind: "text", value: "G" });
    expect(parseGradeValue("ZG")).toEqual({ kind: "text", value: "ZG" });
    expect(parseGradeValue("nb")).toEqual({ kind: "text", value: "NB" });
    expect(parseGradeValue("Inh")).toEqual({ kind: "text", value: "INH" });
    expect(parseGradeValue("RV")).toEqual({ kind: "text", value: "RV" });
    expect(parseGradeValue("Vr")).toEqual({ kind: "text", value: "VR" });
  });

  it("geeft null voor leeg of onzin", () => {
    expect(parseGradeValue("")).toBeNull();
    expect(parseGradeValue(null)).toBeNull();
    expect(parseGradeValue("vrijstelling?")).toBeNull();
    expect(parseGradeValue("12")).toBeNull();
  });
});

describe("toLocalDate", () => {
  it("geeft de Nederlandse kalenderdag, ook vlak na middernacht UTC", () => {
    expect(toLocalDate("2026-10-07T06:30:00.0000000Z")).toBe("2026-10-07");
    // 23:30 UTC is in de zomertijd al de volgende dag in Nederland.
    expect(toLocalDate("2026-10-06T23:30:00Z")).toBe("2026-10-07");
    expect(toLocalDate("2026-10-07")).toBe("2026-10-07");
    expect(toLocalDate("geen datum")).toBeNull();
    expect(toLocalDate(undefined)).toBeNull();
  });
});
