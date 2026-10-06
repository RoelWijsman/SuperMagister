/**
 * Fase 3a: fietsweer. Het weer op je vertrektijd en je eindtijd, en één
 * advies: storm, regen, tegenwind, kou, hitte, rugwind of gewoon prima.
 * Data van Open-Meteo (gratis, geen sleutel); hier alleen pure logica.
 */

export type Compass = "N" | "NO" | "O" | "ZO" | "Z" | "ZW" | "W" | "NW";

export const COMPASS_DEGREES: Readonly<Record<Compass, number>> = {
  N: 0,
  NO: 45,
  O: 90,
  ZO: 135,
  Z: 180,
  ZW: 225,
  W: 270,
  NW: 315,
};

export const COMPASS_LABELS: Readonly<Record<Compass, string>> = {
  N: "Noord",
  NO: "Noordoost",
  O: "Oost",
  ZO: "Zuidoost",
  Z: "Zuid",
  ZW: "Zuidwest",
  W: "West",
  NW: "Noordwest",
};

export interface HourWeather {
  time: Date;
  /** °C */
  temperature: number;
  /** mm in dat uur */
  precipitation: number;
  /** % */
  precipitationProbability: number;
  /** km/u */
  windSpeed: number;
  windGusts: number;
  /** Waar de wind vandaan komt, in graden (meteorologisch). */
  windDirection: number;
  /** WMO-weercode */
  weatherCode: number;
}

/**
 * Hoeveel van de wind je recht tegen hebt (km/u). Positief = tegenwind,
 * negatief = rugwind. `heading` is de richting waarin je fietst.
 */
export function headwind(windFrom: number, windSpeed: number, heading: number): number {
  return windSpeed * Math.cos(((windFrom - heading) * Math.PI) / 180);
}

export type RideAdviceKind =
  "storm" | "regen" | "tegenwind" | "koud" | "warm" | "rugwind" | "prima";

/** Belangrijkste eerst: daar moet je het eerst aan denken. */
const PRIORITY: readonly RideAdviceKind[] = [
  "storm",
  "regen",
  "tegenwind",
  "koud",
  "warm",
  "rugwind",
  "prima",
];

export interface RideAdvice {
  kind: RideAdviceKind;
  hour: HourWeather;
  /** Tegenwind in km/u (negatief = rugwind). */
  headwind: number;
}

const LIMITS = {
  stormGusts: 60,
  stormWind: 45,
  rainMm: 0.3,
  rainChance: 60,
  wind: 15,
  cold: 2,
  hot: 26,
} as const;

export function rideAdvice(hour: HourWeather, heading: number): RideAdvice {
  const against = headwind(hour.windDirection, hour.windSpeed, heading);
  const kind: RideAdviceKind =
    hour.windGusts >= LIMITS.stormGusts || hour.windSpeed >= LIMITS.stormWind
      ? "storm"
      : hour.precipitation >= LIMITS.rainMm || hour.precipitationProbability >= LIMITS.rainChance
        ? "regen"
        : against >= LIMITS.wind
          ? "tegenwind"
          : hour.temperature <= LIMITS.cold
            ? "koud"
            : hour.temperature >= LIMITS.hot
              ? "warm"
              : against <= -LIMITS.wind
                ? "rugwind"
                : "prima";
  return { kind, hour, headwind: against };
}

/** De rit waar je het meest aan moet denken (bij gelijkspel de eerste). */
export function worstRide(rides: readonly RideAdvice[]): RideAdvice | null {
  let worst: RideAdvice | null = null;
  for (const ride of rides) {
    if (!worst || PRIORITY.indexOf(ride.kind) < PRIORITY.indexOf(worst.kind)) worst = ride;
  }
  return worst;
}

const numbers = (value: unknown): number[] | null =>
  Array.isArray(value) && value.every((n) => typeof n === "number" || n === null)
    ? value.map((n) => (typeof n === "number" ? n : 0))
    : null;

/** Zet het uurlijke antwoord van Open-Meteo (lokale tijd, timezone=auto) om in uren. */
export function parseForecast(json: unknown): HourWeather[] {
  const hourly = (json as { hourly?: Record<string, unknown> } | null)?.hourly;
  if (!hourly || !Array.isArray(hourly.time)) return [];
  const times = hourly.time.filter((t): t is string => typeof t === "string");
  const field = (key: string) => numbers(hourly[key]) ?? times.map(() => 0);
  const temperature = field("temperature_2m");
  const precipitation = field("precipitation");
  const probability = field("precipitation_probability");
  const speed = field("wind_speed_10m");
  const gusts = field("wind_gusts_10m");
  const direction = field("wind_direction_10m");
  const code = field("weather_code");
  return times.map((time, i) => ({
    time: new Date(`${time}:00`),
    temperature: temperature[i] ?? 0,
    precipitation: precipitation[i] ?? 0,
    precipitationProbability: probability[i] ?? 0,
    windSpeed: speed[i] ?? 0,
    windGusts: gusts[i] ?? 0,
    windDirection: direction[i] ?? 0,
    weatherCode: code[i] ?? 0,
  }));
}

/** Het uur waarin `at` valt; null als de verwachting daar niet komt. */
export function hourAt(hours: readonly HourWeather[], at: Date): HourWeather | null {
  const t = at.getTime();
  return (
    hours.find((hour) => hour.time.getTime() <= t && t < hour.time.getTime() + 3_600_000) ?? null
  );
}
