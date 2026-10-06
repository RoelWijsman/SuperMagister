import { describe, expect, it } from "vitest";
import { FALLBACK_HOLIDAYS, holidaysForRegion, nextHoliday, normalizeHolidays } from "./holidays";

/** Zo ziet de open data van Rijksoverheid eruit (ingekort). */
const sample = [
  {
    type: "schoolvakanties",
    content: [
      {
        schoolyear: "\n  2026-2027 \n",
        vacations: [
          {
            type: "\n   Herfstvakantie \n ",
            regions: [
              {
                region: "noord",
                startdate: "2026-10-10T00:00:00.000Z",
                enddate: "2026-10-18T21:59:00.000Z",
              },
              {
                region: "midden",
                startdate: "2026-10-17T00:00:00.000Z",
                enddate: "2026-10-25T22:59:00.000Z",
              },
              {
                region: "zuid",
                startdate: "2026-10-17T00:00:00.000Z",
                enddate: "2026-10-25T22:59:00.000Z",
              },
            ],
          },
          {
            type: "Kerstvakantie",
            regions: [
              {
                region: "heel Nederland",
                startdate: "2026-12-19T00:00:00.000Z",
                enddate: "2027-01-03T22:59:00.000Z",
              },
            ],
          },
        ],
      },
    ],
  },
];

describe("normalizeHolidays", () => {
  it("haalt naam en data per regio uit de open data", () => {
    const entries = normalizeHolidays(sample);
    expect(entries).toEqual([
      {
        name: "Herfstvakantie",
        noord: ["2026-10-10", "2026-10-18"],
        midden: ["2026-10-17", "2026-10-25"],
        zuid: ["2026-10-17", "2026-10-25"],
      },
      {
        name: "Kerstvakantie",
        noord: ["2026-12-19", "2027-01-03"],
        midden: ["2026-12-19", "2027-01-03"],
        zuid: ["2026-12-19", "2027-01-03"],
      },
    ]);
  });

  it("geeft een lege lijst bij rommel", () => {
    expect(normalizeHolidays({ nee: true })).toEqual([]);
    expect(normalizeHolidays(null)).toEqual([]);
  });

  it("heeft een ingebouwde reserve die verder loopt dan dit schooljaar", () => {
    expect(FALLBACK_HOLIDAYS.length).toBeGreaterThanOrEqual(10);
    expect(FALLBACK_HOLIDAYS.some((h) => h.midden[0].startsWith("2027-07"))).toBe(true);
  });
});

describe("nextHoliday", () => {
  const holidays = holidaysForRegion(normalizeHolidays(sample), "midden");

  it("telt af naar de eerstvolgende vakantie in jouw regio", () => {
    expect(nextHoliday(holidays, "2026-10-06")).toEqual({
      state: "komt",
      name: "Herfstvakantie",
      days: 11,
      start: "2026-10-17",
      end: "2026-10-25",
    });
  });

  it("weet wanneer je al vrij bent, en hoe lang nog", () => {
    expect(nextHoliday(holidays, "2026-10-20")).toMatchObject({
      state: "bezig",
      name: "Herfstvakantie",
      days: 5,
    });
  });

  it("geeft null als er niets meer bekend is", () => {
    expect(nextHoliday(holidays, "2027-02-01")).toBeNull();
  });
});
