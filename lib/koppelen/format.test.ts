import { describe, expect, it } from "vitest";
import { formatMoment } from "./format";

const now = new Date(2026, 9, 7, 15, 30);

describe("formatMoment", () => {
  it("geeft vandaag alleen de tijd", () => {
    expect(formatMoment(new Date(2026, 9, 7, 14, 2).getTime(), now)).toBe("14:02");
  });

  it("zegt gisteren, en anders de datum", () => {
    expect(formatMoment(new Date(2026, 9, 6, 9, 5).getTime(), now)).toBe("gisteren 09:05");
    expect(formatMoment(new Date(2026, 8, 30, 21, 40).getTime(), now)).toBe("30 sep 21:40");
  });
});
