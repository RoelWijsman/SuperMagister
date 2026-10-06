import { describe, expect, it } from "vitest";
import { COPY, type CopyKey } from "@/content/copy";
import { createPicker, fillCopy, splitCopy, splitPlaceholders } from "./copy";

const keys = Object.keys(COPY) as CopyKey[];
const allVariants = keys.flatMap((key) => COPY[key].map((text) => ({ key, text })));

/** Emoji tellen (pictogrammen, geen cijfers of leestekens). */
const emojiCount = (text: string) => (text.match(/\p{Extended_Pictographic}/gu) ?? []).length;

describe("humorbijbel: regels voor alle teksten", () => {
  // De 6,7-grap is één vaste zin, precies zoals de aanvulling hem voorschrijft.
  const ONE_LINERS: ReadonlySet<string> = new Set(["gok.commentaar.67"]);

  it.each(keys.filter((key) => !ONE_LINERS.has(key)))("%s heeft minstens 5 varianten", (key) => {
    expect(COPY[key].length).toBeGreaterThanOrEqual(5);
  });

  it("gebruikt maximaal één emoji per tekst", () => {
    const offenders = allVariants.filter(({ text }) => emojiCount(text) > 1);
    expect(offenders).toEqual([]);
  });

  it("heeft geen uitroeptekens-regen", () => {
    const offenders = allVariants.filter(({ text }) => (text.match(/!/g) ?? []).length > 1);
    expect(offenders).toEqual([]);
  });

  it("bevat geen verboden memes", () => {
    const banned = /skibidi|gyatt|rizz|tung tung|tralalero|sahur|brainrot/i;
    expect(allVariants.filter(({ text }) => banned.test(text))).toEqual([]);
  });

  it("gebruikt elke meme hooguit één keer, zodat hij leuk blijft", () => {
    const memes = [
      "clanker",
      "aura",
      "npc",
      "main character",
      "delulu",
      "slay",
      "fanum",
      "mewing",
      "lowkey",
      "highkey",
      "cooked",
      "goated",
      "cortisol",
    ];
    // Bewuste callback: bij een onvoldoende loopt de pinguïn weg, bij de comeback draait hij om.
    const limits: Record<string, number> = { pinguïn: 2 };
    const overused = [...memes, ...Object.keys(limits)].filter(
      (meme) =>
        allVariants.filter(({ text }) => text.toLowerCase().includes(meme)).length >
        (limits[meme] ?? 1),
    );
    expect(overused).toEqual([]);
  });

  it("gebruikt de 6-7-grap hooguit één keer in de hele app", () => {
    const sixSeven = allVariants.filter(({ text }) => /\b6\s*[-–…,.]*\s*7\b/.test(text));
    expect(sixSeven.length).toBeLessThanOrEqual(1);
  });

  it("gebruikt alleen bekende variabelen", () => {
    const known = new Set([
      "naam",
      "vak2",
      "xp",
      "cijfer",
      "gok",
      "verschil",
      "vak",
      "aantal",
      "lokaal",
      "tijd",
      "klas",
      "minuten",
      "uren",
      "toetsen",
      "lessen",
      "dingen",
      "nodig",
      "doel",
      "weging",
      "omschrijving",
      "query",
      "wat",
      "fase",
      "thema",
      "gem",
      "kaarten",
    ]);
    const unknown = allVariants.flatMap(({ key, text }) =>
      [...text.matchAll(/\{(\w+)\}/g)]
        .map((m) => m[1])
        .filter((v) => !known.has(v!))
        .map((v) => `${key}: ${v}`),
    );
    expect(unknown).toEqual([]);
  });
});

describe("fillCopy", () => {
  it("vult variabelen in", () => {
    expect(fillCopy("Een {cijfer} voor {vak}.", { cijfer: "8,2", vak: "Engels" })).toBe(
      "Een 8,2 voor Engels.",
    );
  });

  it("maakt de eerste letter een hoofdletter", () => {
    expect(fillCopy("{toetsen} vandaag.", { toetsen: "een toets" })).toBe("Een toets vandaag.");
  });

  it("laat onbekende variabelen staan", () => {
    expect(fillCopy("Hoi {naam}.", {})).toBe("Hoi {naam}.");
  });
});

describe("splitPlaceholders", () => {
  it("knipt een tekst rond de opgegeven variabelen", () => {
    expect(splitPlaceholders("Gemiddeld {gem} over {aantal} vakken.", ["gem"])).toEqual([
      "Gemiddeld ",
      { name: "gem" },
      " over {aantal} vakken.",
    ]);
  });

  it("vindt een variabele aan het begin en aan het eind", () => {
    expect(splitPlaceholders("{gem} gemiddeld, {gem}", ["gem"])).toEqual([
      { name: "gem" },
      " gemiddeld, ",
      { name: "gem" },
    ]);
  });

  it("laat een tekst zonder variabelen heel", () => {
    expect(splitPlaceholders("Netjes.", ["gem"])).toEqual(["Netjes."]);
  });
});

describe("splitCopy", () => {
  it("splitst op de eerste witregel in titel en tekst", () => {
    expect(splitCopy("Geen huiswerk.\nTijd voor de bank.\nEcht.")).toEqual({
      title: "Geen huiswerk.",
      body: "Tijd voor de bank.\nEcht.",
    });
  });

  it("geeft een lege tekst als er geen witregel is", () => {
    expect(splitCopy("Alleen een titel.")).toEqual({ title: "Alleen een titel.", body: "" });
  });
});

describe("createPicker", () => {
  it("toont nooit twee keer achter elkaar dezelfde variant", () => {
    let seed = 1;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    const pick = createPicker({ random });
    let previous = "";
    for (let i = 0; i < 200; i++) {
      const next = pick("laden.cijfers");
      expect(next).not.toBe(previous);
      previous = next;
    }
  });

  it("onthoudt de laatste keuze per sleutel", () => {
    const memory = new Map<string, number>();
    const pick = createPicker({ random: () => 0, memory });
    pick("laden.cijfers");
    expect(memory.get("laden.cijfers")).toBe(0);
    pick("laden.cijfers");
    expect(memory.get("laden.cijfers")).toBe(1);
  });
});
