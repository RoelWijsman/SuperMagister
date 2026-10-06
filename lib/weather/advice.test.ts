import { describe, expect, it } from "vitest";
import {
  COMPASS_DEGREES,
  headwind,
  hourAt,
  parseForecast,
  rideAdvice,
  worstRide,
  type HourWeather,
} from "./advice";

const calm: HourWeather = {
  time: new Date("2026-10-06T08:00:00"),
  temperature: 12,
  precipitation: 0,
  precipitationProbability: 5,
  windSpeed: 8,
  windGusts: 15,
  windDirection: 240,
  weatherCode: 1,
};

describe("headwind", () => {
  it("is tegenwind als de wind komt uit de richting waar je heen fietst", () => {
    // Naar het noorden fietsen met noordenwind: alles tegen.
    expect(headwind(0, 20, COMPASS_DEGREES.N)).toBeCloseTo(20);
    // Zuidenwind in de rug.
    expect(headwind(180, 20, COMPASS_DEGREES.N)).toBeCloseTo(-20);
    // Zijwind telt niet.
    expect(headwind(90, 20, COMPASS_DEGREES.N)).toBeCloseTo(0);
  });
});

describe("rideAdvice", () => {
  it("vindt rustig weer prima", () => {
    expect(rideAdvice(calm, COMPASS_DEGREES.N).kind).toBe("prima");
  });

  it("waarschuwt eerst voor storm, dan regen, dan tegenwind", () => {
    const storm = { ...calm, windGusts: 75, precipitation: 3 };
    const rain = { ...calm, precipitation: 0.6, windDirection: 0, windSpeed: 25 };
    const wind = { ...calm, windDirection: 0, windSpeed: 25 };
    expect(rideAdvice(storm, COMPASS_DEGREES.N).kind).toBe("storm");
    expect(rideAdvice(rain, COMPASS_DEGREES.N).kind).toBe("regen");
    expect(rideAdvice(wind, COMPASS_DEGREES.N).kind).toBe("tegenwind");
    expect(rideAdvice(wind, COMPASS_DEGREES.Z).kind).toBe("rugwind");
  });

  it("noemt kans op regen ook regen", () => {
    expect(rideAdvice({ ...calm, precipitationProbability: 70 }, 0).kind).toBe("regen");
  });

  it("let op kou en hitte", () => {
    expect(rideAdvice({ ...calm, temperature: 1 }, 0).kind).toBe("koud");
    expect(rideAdvice({ ...calm, temperature: 28 }, 0).kind).toBe("warm");
  });
});

describe("worstRide", () => {
  it("kiest de rit waar je het meest aan moet denken", () => {
    const heen = rideAdvice(calm, 0);
    const terug = rideAdvice({ ...calm, precipitation: 1 }, 180);
    expect(worstRide([heen, terug])).toBe(terug);
    expect(worstRide([heen, heen])).toBe(heen);
  });
});

describe("parseForecast en hourAt (Open-Meteo)", () => {
  const json = {
    hourly: {
      time: ["2026-10-06T08:00", "2026-10-06T09:00", "2026-10-06T15:00"],
      temperature_2m: [10, 11, 14],
      precipitation: [0, 0.2, 1.4],
      precipitation_probability: [10, 20, 80],
      wind_speed_10m: [12, 14, 22],
      wind_gusts_10m: [20, 25, 40],
      wind_direction_10m: [200, 210, 250],
      weather_code: [2, 3, 61],
    },
  };

  it("zet de uurlijsten om in uren", () => {
    const hours = parseForecast(json);
    expect(hours).toHaveLength(3);
    expect(hours[2]).toMatchObject({ temperature: 14, precipitation: 1.4, windSpeed: 22 });
    expect(hours[2]!.time).toEqual(new Date("2026-10-06T15:00:00"));
  });

  it("vindt het uur bij een tijdstip, en niets als het te ver weg is", () => {
    const hours = parseForecast(json);
    expect(hourAt(hours, new Date("2026-10-06T08:20:00"))?.temperature).toBe(10);
    expect(hourAt(hours, new Date("2026-10-06T15:10:00"))?.temperature).toBe(14);
    expect(hourAt(hours, new Date("2026-10-07T15:10:00"))).toBeNull();
  });

  it("overleeft een onverwacht antwoord", () => {
    expect(parseForecast(null)).toEqual([]);
    expect(parseForecast({ hourly: { time: "nee" } })).toEqual([]);
  });
});
