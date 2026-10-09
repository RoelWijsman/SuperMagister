import { amsterdamParts, daysUntil } from "@/lib/stats/day";
import { readDays, redisConfig } from "@/lib/stats/store";
import type { Day } from "@/lib/stats/summary";

/** De periodes waaruit je kiest; "export" mag tot de bewaartermijn. */
export const RANGES = [7, 30, 90] as const;
export type Range = (typeof RANGES)[number];

export function parseRange(value: string | string[] | undefined): Range {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return (RANGES as readonly number[]).includes(n) ? (n as Range) : 30;
}

export type DashboardData =
  | { status: "geen-opslag"; today: string; hour: string }
  | { status: "fout"; today: string; hour: string }
  | { status: "ok"; today: string; hour: string; days: Day[] };

/**
 * Leest de dagen die het dashboard nodig heeft: de gekozen periode, maar
 * minstens acht dagen (vandaag, gisteren en dezelfde dag vorige week, en de
 * week ervoor voor de piekdetectie).
 */
export async function loadDays(count: number, now = new Date()): Promise<DashboardData> {
  const { date: today, hour } = amsterdamParts(now);
  const config = redisConfig();
  if (!config) return { status: "geen-opslag", today, hour };
  const dates = daysUntil(today, count);
  try {
    const fields = await readDays(dates, config);
    return {
      status: "ok",
      today,
      hour,
      days: dates.map((date, i) => ({ date, fields: fields[i] ?? {} })),
    };
  } catch {
    return { status: "fout", today, hour };
  }
}

export interface BuildInfo {
  version: string;
  commit: string | null;
  branch: string | null;
  builtAt: string | null;
  environment: string;
  region: string | null;
}

/**
 * Wat Vercel tijdens het bouwen en draaien meegeeft. Versie en bouwtijd komen uit
 * next.config.ts (die vult Next.js letterlijk in, dus hier niet via een variabele lezen).
 */
export function buildInfo(): BuildInfo {
  return {
    version: process.env.NEXT_PUBLIC_APP_VERSION ?? "onbekend",
    commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    branch: process.env.VERCEL_GIT_COMMIT_REF ?? null,
    builtAt: process.env.SM_BUILD_TIME ?? null,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "onbekend",
    region: process.env.VERCEL_REGION ?? null,
  };
}

/**
 * Het Vercel Analytics-dashboard. Zonder eigen adres de "kies je project"-link
 * van Vercel, die je naar Analytics van het juiste project brengt.
 */
export function analyticsUrl(env: Record<string, string | undefined> = process.env): string {
  const own = env.DEV_DASHBOARD_ANALYTICS_URL;
  if (own && /^https:\/\/vercel\.com\//.test(own)) return own;
  return "https://vercel.com/d?to=%2F%5Bteam%5D%2F%5Bproject%5D%2Fanalytics&title=Web+Analytics";
}
