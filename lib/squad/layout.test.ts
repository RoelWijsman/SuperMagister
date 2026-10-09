import { describe, expect, it } from "vitest";
import { FORMATION_IDS, FORMATIONS } from "./formations";
import { cardBox, cardsFit, CARD_ASPECT, fitCardWidth } from "./layout";

describe("kaartjes op het veld", () => {
  it("zijn op een telefoon groot genoeg om te lezen", () => {
    // 375 px breed scherm, 16 px marge aan elke kant, veld 68 × 92.
    expect(fitCardWidth({ width: 343, height: 464 })).toBeGreaterThanOrEqual(58);
  });

  it("zijn op een computer rond de 100 px als er ruimte is", () => {
    expect(fitCardWidth({ width: 560, height: 560 })).toBeGreaterThanOrEqual(85);
    expect(fitCardWidth({ width: 600, height: 700 })).toBeGreaterThanOrEqual(100);
    expect(fitCardWidth({ width: 900, height: 900 })).toBe(112);
  });

  it.each(FORMATION_IDS)("%s: geen kaartje raakt een ander of de rand", (id) => {
    for (const size of [
      { width: 343, height: 464 },
      { width: 560, height: 560 },
      { width: 640, height: 720 },
    ]) {
      const width = fitCardWidth(size);
      expect(cardsFit(FORMATIONS[id], width, size)).toBe(true);
      // Een paar pixels groter en het past niet meer: de maat is echt de grootste.
      expect(FORMATION_IDS.some((f) => !cardsFit(FORMATIONS[f], width + 2, size))).toBe(
        width < 112,
      );
    }
  });

  it("rekent een kaartje uit vanaf het midden van de plek", () => {
    const box = cardBox({ id: "x", position: "SP", x: 50, y: 50 }, 100, {
      width: 400,
      height: 400,
    });
    expect(box).toEqual({ left: 150, right: 250, top: 200 - 65, bottom: 200 + 65 });
    expect(CARD_ASPECT).toBe(1.3);
  });
});
