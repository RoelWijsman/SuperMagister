import { describe, expect, it } from "vitest";
import { CARD_RATIO } from "./draw";
import { SHARE_H, SHARE_W, showcaseSlots } from "./share-layout";

describe("showcaseSlots", () => {
  it("geeft één plek per kaart, maximaal vijf", () => {
    for (const count of [1, 2, 3, 4, 5]) expect(showcaseSlots(count)).toHaveLength(count);
    expect(showcaseSlots(8)).toHaveLength(5);
    expect(showcaseSlots(0)).toEqual([]);
  });

  it("zet de middelste kaart vooraan: het grootst en recht", () => {
    const slots = showcaseSlots(5);
    const middle = slots[2]!;
    expect(middle.angle).toBe(0);
    for (const slot of slots) expect(slot.w).toBeLessThanOrEqual(middle.w);
    expect(Math.max(...slots.map((s) => s.z))).toBe(middle.z);
  });

  it("is symmetrisch rond het midden", () => {
    const slots = showcaseSlots(4);
    expect(slots[0]!.x + slots[3]!.x).toBeCloseTo(SHARE_W);
    expect(slots[0]!.angle).toBeCloseTo(-slots[3]!.angle);
  });

  it("houdt alle kaarten binnen het beeld", () => {
    for (const count of [1, 2, 3, 4, 5]) {
      for (const slot of showcaseSlots(count)) {
        const h = slot.w * CARD_RATIO;
        // Ruime marge voor de kanteling.
        expect(slot.x - slot.w / 2).toBeGreaterThan(0);
        expect(slot.x + slot.w / 2).toBeLessThan(SHARE_W);
        expect(slot.y - h / 2).toBeGreaterThan(SHARE_H * 0.15);
        expect(slot.y + h / 2).toBeLessThan(SHARE_H * 0.92);
      }
    }
  });
});
