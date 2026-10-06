import { describe, expect, it } from "vitest";
import { cardLook, cardTierLabel, silhouetteCaption } from "./model";

describe("cardLook", () => {
  it("geeft een In Form-kaart de zwart-gouden look", () => {
    expect(cardLook({ tier: "goud", primaryVariant: "inform" })).toBe("inform");
    expect(cardLook({ tier: "zilver", primaryVariant: "inform" })).toBe("inform");
  });

  it("laat TOTY en ICON altijd als zichzelf zien, ook als ze In Form zijn", () => {
    expect(cardLook({ tier: "icon", primaryVariant: "inform" })).toBe("icon");
    expect(cardLook({ tier: "toty", primaryVariant: "inform" })).toBe("toty");
  });

  it("gebruikt anders gewoon de tier", () => {
    expect(cardLook({ tier: "brons", primaryVariant: null })).toBe("brons");
    expect(cardLook({ tier: "goud", primaryVariant: "record" })).toBe("goud");
  });
});

describe("cardTierLabel", () => {
  it("volgt de look", () => {
    expect(cardTierLabel({ tier: "goud", primaryVariant: "inform" })).toBe("IN FORM");
    expect(cardTierLabel({ tier: "icon", primaryVariant: "inform" })).toBe("ICON");
  });
});

describe("silhouetteCaption", () => {
  it("zegt op het silhouet waar je op gokt: vak, toets en weging", () => {
    expect(
      silhouetteCaption({
        subjectName: "Wiskunde A",
        grade: { description: "SO Kansrekening" },
        stats: { weg: "×3" },
      }),
    ).toEqual({ subject: "WISKUNDE A", detail: "SO KANSREKENING · ×3" });
  });

  it("laat een lege toetsomschrijving weg", () => {
    expect(
      silhouetteCaption({
        subjectName: "Duits",
        grade: { description: "  " },
        stats: { weg: "×1" },
      }),
    ).toEqual({ subject: "DUITS", detail: "×1" });
  });
});
