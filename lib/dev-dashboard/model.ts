import { LATENCY_BOUNDS, STATUS_GROUPS, type StatusGroup } from "@/lib/stats/fields";
import {
  detectSpikes,
  errorTotals,
  FEATURE_METRICS,
  funnel,
  glance,
  HEADLINE_METRICS,
  latencyPerDay,
  latencyPerHour,
  metricSeries,
  metricTotal,
  onboardingDropOff,
  proxyDays,
  rateLimitSeries,
  share,
  type Day,
  type FunnelStep,
  type Latency,
  type OnboardingRow,
  type SpikeWarning,
} from "@/lib/stats/summary";
import { FIELDS } from "@/lib/stats/fields";

/**
 * Alles wat het dashboard toont, als gewone data (de pagina is een
 * client-component). Gemaakt op de server, alleen voor wie ingelogd is.
 */

/** Boven de hoogste grens van de responstijd: we weten alleen "langer dan 8 s". */
export const OVER_MAX_MS = LATENCY_BOUNDS[LATENCY_BOUNDS.length - 1]! + 1;

const ms = (latency: Latency, key: "average" | "p95") => {
  const value = latency[key];
  return value === null ? null : Number.isFinite(value) ? value : OVER_MAX_MS;
};

export interface DashboardModel {
  range: number;
  today: string;
  labels: string[];
  glance: { id: string; label: string; today: number; yesterday: number; lastWeek: number }[];
  daily: { id: string; label: string; values: number[]; total: number }[];
  funnel: FunnelStep[];
  onboarding: OnboardingRow[];
  features: { label: string; value: number }[];
  proxy: {
    totals: number[];
    share401: number[];
    share5xx: number[];
    statusTotals: Record<StatusGroup, number>;
    rejected: number;
    spikes: SpikeWarning[];
  };
  latency: {
    dayAvg: (number | null)[];
    dayP95: (number | null)[];
    hourLabels: string[];
    hourAvg: (number | null)[];
    hourP95: (number | null)[];
  };
  rateLimits: { source: string; values: number[] }[];
  external: { openMeteo: number[]; holidays: number[] };
  errors: { kind: string; value: number }[];
}

const MONTH = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short", timeZone: "UTC" });

/** "2026-10-09" → "9 okt" */
export function dayLabel(date: string): string {
  return MONTH.format(new Date(`${date}T12:00:00Z`)).replace(".", "");
}

/**
 * @param all   alle geladen dagen, oudste eerst, tot en met vandaag (minstens 8)
 * @param range hoeveel dagen de grafieken tonen
 */
export function buildModel(
  all: readonly Day[],
  range: number,
  today: string,
  hour: string,
): DashboardModel {
  const days = all.slice(-range);
  const proxyAll = proxyDays(all);
  const proxy = proxyAll.slice(-range);
  const statusTotals = Object.fromEntries(
    STATUS_GROUPS.map((group) => [group, proxy.reduce((sum, day) => sum + day.status[group], 0)]),
  ) as Record<StatusGroup, number>;
  const perDay = latencyPerDay(days);
  const perHour = latencyPerHour(all[all.length - 2], all[all.length - 1], hour);

  return {
    range,
    today,
    labels: days.map((day) => dayLabel(day.date)),
    glance: glance(all, today).map((g) => ({
      id: g.metric.id,
      label: g.metric.label,
      today: g.today,
      yesterday: g.yesterday,
      lastWeek: g.lastWeek,
    })),
    daily: HEADLINE_METRICS.map((metric) => ({
      id: metric.id,
      label: metric.label,
      values: metricSeries(days, metric),
      total: metricTotal(days, metric),
    })),
    funnel: funnel(days),
    onboarding: onboardingDropOff(days),
    features: FEATURE_METRICS.map((metric) => ({
      label: metric.label,
      value: metricTotal(days, metric),
    })).sort((a, b) => b.value - a.value),
    proxy: {
      totals: proxy.map((day) => day.total),
      share401: proxy.map((day) => Math.round(share(day.status["401"], day.total) * 1000) / 10),
      share5xx: proxy.map((day) => Math.round(share(day.status["5xx"], day.total) * 1000) / 10),
      statusTotals,
      rejected: proxy.reduce((sum, day) => sum + day.rejected, 0),
      spikes: detectSpikes(proxyAll),
    },
    latency: {
      dayAvg: perDay.map((d) => ms(d.latency, "average")),
      dayP95: perDay.map((d) => ms(d.latency, "p95")),
      hourLabels: perHour.map((h) => h.label),
      hourAvg: perHour.map((h) => ms(h.latency, "average")),
      hourP95: perHour.map((h) => ms(h.latency, "p95")),
    },
    rateLimits: rateLimitSeries(days),
    external: {
      openMeteo: days.map((day) => day.fields["e:fout-open-meteo"] ?? 0),
      holidays: days.map((day) => day.fields[FIELDS.holidaysFailed] ?? 0),
    },
    errors: errorTotals(days).filter((row) => row.value > 0),
  };
}
