"use client";

import { useQuery } from "@tanstack/react-query";
import type { WeatherPlace } from "@/stores/settings";
import { parseForecast, type HourWeather } from "./advice";

/**
 * Open-Meteo: gratis, zonder sleutel, met CORS. De browser haalt het weer
 * rechtstreeks op; er gaat alleen de plaats (coördinaten) mee die je zelf
 * instelt. Beide adressen staan in connect-src van de CSP (lib/security/csp.ts).
 */

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";

const HOURLY = [
  "temperature_2m",
  "precipitation",
  "precipitation_probability",
  "weather_code",
  "wind_speed_10m",
  "wind_gusts_10m",
  "wind_direction_10m",
].join(",");

export async function fetchForecast(
  place: WeatherPlace,
  signal?: AbortSignal,
): Promise<HourWeather[]> {
  const params = new URLSearchParams({
    latitude: place.latitude.toFixed(4),
    longitude: place.longitude.toFixed(4),
    hourly: HOURLY,
    timezone: "Europe/Amsterdam",
    forecast_days: "7",
    wind_speed_unit: "kmh",
  });
  const response = await fetch(`${FORECAST_URL}?${params}`, { signal });
  if (!response.ok) throw new Error(`Weer ophalen mislukt (${response.status})`);
  const hours = parseForecast(await response.json());
  if (hours.length === 0) throw new Error("Geen weerdata");
  return hours;
}

/** Het weer van de komende week, een half uur vers. */
export function useForecast(place: WeatherPlace) {
  return useQuery({
    queryKey: ["weer", place.latitude, place.longitude],
    queryFn: ({ signal }) => fetchForecast(place, signal),
    staleTime: 30 * 60_000,
    gcTime: 2 * 60 * 60_000,
    retry: 1,
  });
}

/** Plaatsen zoeken op naam, alleen in Nederland. */
export async function searchPlaces(name: string, signal?: AbortSignal): Promise<WeatherPlace[]> {
  const params = new URLSearchParams({
    name,
    count: "6",
    language: "nl",
    countryCode: "NL",
    format: "json",
  });
  const response = await fetch(`${GEOCODE_URL}?${params}`, { signal });
  if (!response.ok) throw new Error(`Zoeken mislukt (${response.status})`);
  const json = (await response.json()) as { results?: unknown };
  if (!Array.isArray(json.results)) return [];
  return json.results.flatMap((result) => {
    const r = result as Record<string, unknown>;
    if (
      typeof r.name !== "string" ||
      typeof r.latitude !== "number" ||
      typeof r.longitude !== "number"
    )
      return [];
    return [
      {
        name: r.name,
        region: typeof r.admin1 === "string" ? r.admin1 : "",
        latitude: r.latitude,
        longitude: r.longitude,
      },
    ];
  });
}
