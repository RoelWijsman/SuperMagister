import { shiftDay } from "./day";
import {
  ONBOARDING_STEP_NAMES,
  ERROR_KINDS,
  type ErrorKind,
  type OnboardingStepName,
} from "./events";
import {
  FIELDS,
  LATENCY_BOUNDS,
  RATE_LIMIT_SOURCES,
  STATUS_GROUPS,
  type StatusGroup,
} from "./fields";

/**
 * Van ruwe dagtellers naar wat het dashboard laat zien. Allemaal pure functies
 * van `Day[]` (oudste eerst), zodat ze los te testen zijn.
 */

export interface Day {
  date: string;
  fields: Readonly<Record<string, number>>;
}

/** Som van alle velden die met een van deze voorvoegsels beginnen (of er precies gelijk aan zijn). */
export function sumFields(
  fields: Readonly<Record<string, number>>,
  keys: readonly string[],
): number {
  let total = 0;
  for (const [field, value] of Object.entries(fields)) {
    if (keys.some((key) => (key.endsWith(":") ? field.startsWith(key) : field === key)))
      total += value;
  }
  return total;
}

/** Een getal op het dashboard, opgebouwd uit één of meer tellers. */
export interface Metric {
  id: string;
  label: string;
  /** Veldnamen; eindigt er een op ":", dan telt alles met dat voorvoegsel. */
  fields: readonly string[];
}

const e = (name: string) => `e:${name}`;

/** "Vandaag in één oogopslag" en de grafieken per dag. */
export const HEADLINE_METRICS: readonly Metric[] = [
  { id: "geopend", label: "App geopend", fields: [e("app-geopend")] },
  { id: "koppelingen", label: "Koppelingen", fields: [e("gekoppeld:"), e("opnieuw-gekoppeld")] },
  { id: "walkouts", label: "Walkouts", fields: [e("walkout-gestart")] },
  { id: "gokken", label: "Gokken", fields: [e("gok-gebruikt")] },
  { id: "videos", label: "Video's", fields: [e("video-gemaakt:")] },
];

/** Feature-populariteit: wat er het meest gebruikt wordt. */
export const FEATURE_METRICS: readonly Metric[] = [
  { id: "walkout", label: "Walkout (pack of herhaling)", fields: [e("walkout-gestart")] },
  { id: "gok", label: "Gokmoment gebruikt", fields: [e("gok-gebruikt")] },
  { id: "gok-skip", label: "Gok overgeslagen", fields: [e("gok-overgeslagen")] },
  { id: "precies", label: "Precies goed gegokt", fields: [e("gok-precies-goed")] },
  { id: "oefen", label: "Oefen-walkout", fields: [e("oefen-walkout")] },
  { id: "calculator", label: "Wat moet ik halen?", fields: [e("calculator-gebruikt")] },
  { id: "video-9x16", label: "Video 9:16", fields: [e("video-gemaakt:9x16:")] },
  { id: "video-1x1", label: "Video 1:1", fields: [e("video-gemaakt:1x1:")] },
  {
    id: "video-mysterie",
    label: "…waarvan mysterie",
    fields: [e("video-gemaakt:9x16:mysterie"), e("video-gemaakt:1x1:mysterie")],
  },
  { id: "demo", label: "Demo gestart", fields: [e("demo-gestart")] },
  { id: "bladwijzer", label: "Gekoppeld met bladwijzer", fields: [e("gekoppeld:bladwijzer")] },
  { id: "plakken", label: "Gekoppeld met plakken", fields: [e("gekoppeld:plakken")] },
  { id: "opnieuw", label: "Opnieuw gekoppeld", fields: [e("opnieuw-gekoppeld")] },
  { id: "verlopen", label: "Koppeling verlopen", fields: [e("koppeling-verlopen")] },
  { id: "ontkoppeld", label: "Ontkoppeld", fields: [e("ontkoppeld")] },
  { id: "welkomstpack", label: "Welkomstpack geopend", fields: [e("welkomstpack-geopend")] },
  { id: "walkout-skip", label: "Walkout overgeslagen", fields: [e("walkout-overgeslagen")] },
  { id: "pwa", label: "App geïnstalleerd (PWA)", fields: [e("pwa-geinstalleerd")] },
];

export function metricValue(day: Day | undefined, metric: Metric): number {
  return day ? sumFields(day.fields, metric.fields) : 0;
}

export function metricSeries(days: readonly Day[], metric: Metric): number[] {
  return days.map((day) => metricValue(day, metric));
}

export function metricTotal(days: readonly Day[], metric: Metric): number {
  return days.reduce((sum, day) => sum + metricValue(day, metric), 0);
}

export interface Glance {
  metric: Metric;
  today: number;
  yesterday: number;
  lastWeek: number;
}

/** Vandaag, gisteren en dezelfde dag vorige week. `days` moet die dagen bevatten. */
export function glance(days: readonly Day[], today: string): Glance[] {
  const byDate = new Map(days.map((day) => [day.date, day]));
  const at = (date: string) => byDate.get(date);
  return HEADLINE_METRICS.map((metric) => ({
    metric,
    today: metricValue(at(today), metric),
    yesterday: metricValue(at(shiftDay(today, -1)), metric),
    lastWeek: metricValue(at(shiftDay(today, -7)), metric),
  }));
}

/** Verschil als tekst: "+3", "−2" of "±0". */
export function formatDelta(now: number, before: number): string {
  const diff = now - before;
  if (diff === 0) return "±0";
  return diff > 0 ? `+${diff}` : `−${Math.abs(diff)}`;
}

export interface FunnelStep {
  label: string;
  value: number;
  /** Ten opzichte van de eerste stap (0–1); null als de eerste stap 0 is. */
  share: number | null;
}

/**
 * De trechter over de gekozen periode. Let op: dit zijn losse tellers, geen
 * gevolgde personen, dus het is een benadering (iemand die vorige week opende
 * en vandaag koppelt, telt in verschillende dagen).
 */
export function funnel(days: readonly Day[]): FunnelStep[] {
  const total = (fields: string[]) =>
    days.reduce((sum, day) => sum + sumFields(day.fields, fields), 0);
  const steps: [string, number][] = [
    ["App geopend", total([e("app-geopend")])],
    ["Onboarding afgerond", total([e("onboarding-afgerond")])],
    ["Demo of gekoppeld", total([e("demo-gestart"), e("gekoppeld:")])],
    ["Eerste walkout", total([e("eerste-walkout")])],
  ];
  const first = steps[0]![1];
  return steps.map(([label, value]) => ({ label, value, share: first > 0 ? value / first : null }));
}

export interface OnboardingRow {
  step: OnboardingStepName;
  reached: number;
  skipped: number;
}

/** Per stap van de onboarding: hoe vaak bereikt, en hoe vaak daar "Overslaan". */
export function onboardingDropOff(days: readonly Day[]): OnboardingRow[] {
  return ONBOARDING_STEP_NAMES.map((step) => ({
    step,
    reached: days.reduce((sum, day) => sum + (day.fields[e(`onboarding-stap:${step}`)] ?? 0), 0),
    skipped: days.reduce(
      (sum, day) => sum + (day.fields[e(`onboarding-overgeslagen:${step}`)] ?? 0),
      0,
    ),
  }));
}

// ——— Gezondheid ———————————————————————————————————————————————————————————

export interface ProxyDay {
  date: string;
  total: number;
  status: Record<StatusGroup, number>;
  rejected: number;
}

export function proxyDays(days: readonly Day[]): ProxyDay[] {
  return days.map((day) => ({
    date: day.date,
    total: day.fields[FIELDS.proxyRequests] ?? 0,
    status: Object.fromEntries(
      STATUS_GROUPS.map((group) => [group, day.fields[FIELDS.proxyStatus(group)] ?? 0]),
    ) as Record<StatusGroup, number>,
    rejected: day.fields[FIELDS.proxyRejected] ?? 0,
  }));
}

export const share = (part: number, total: number) => (total > 0 ? part / total : 0);

export interface SpikeWarning {
  group: "401" | "5xx";
  today: number;
  baseline: number;
  requests: number;
}

/** Zo veel verzoeken moeten er vandaag zijn voordat we iets durven te zeggen. */
export const SPIKE_MIN_REQUESTS = 20;

/**
 * Stijgt het aandeel 401 of 5xx ineens? Vergelijkt de laatste dag met het
 * gemiddelde aandeel van de zeven dagen ervoor. Een waarschuwing als het aandeel
 * minstens 10 procentpunt hoger ligt en minstens het dubbele is, of als het
 * boven de 40% komt. Een plotselinge golf 401's betekent vaak dat Magister iets
 * aan het inloggen of de API heeft veranderd.
 */
export function detectSpikes(days: readonly ProxyDay[]): SpikeWarning[] {
  const last = days[days.length - 1];
  if (!last || last.total < SPIKE_MIN_REQUESTS) return [];
  const before = days.slice(-8, -1).filter((day) => day.total > 0);
  const warnings: SpikeWarning[] = [];
  for (const group of ["401", "5xx"] as const) {
    const today = share(last.status[group], last.total);
    const baseTotal = before.reduce((sum, day) => sum + day.total, 0);
    const baseline = share(
      before.reduce((sum, day) => sum + day.status[group], 0),
      baseTotal,
    );
    const jumped = today - baseline >= 0.1 && today >= baseline * 2;
    if (jumped || today >= 0.4) warnings.push({ group, today, baseline, requests: last.total });
  }
  return warnings;
}

export interface Latency {
  count: number;
  /** Gemiddelde in ms; null zonder metingen. */
  average: number | null;
  /** Bovengrens van het emmertje waar 95% onder valt; Infinity = boven de hoogste grens. */
  p95: number | null;
}

/** Gemiddelde en p95 uit de tellers van een of meer uren. */
export function latencyFrom(
  fields: readonly Readonly<Record<string, number>>[],
  hours: readonly string[],
): Latency {
  let count = 0;
  let sum = 0;
  const buckets = new Array<number>(LATENCY_BOUNDS.length + 1).fill(0);
  for (const f of fields) {
    for (const hour of hours) {
      count += f[FIELDS.latencyCount(hour)] ?? 0;
      sum += f[FIELDS.latencySum(hour)] ?? 0;
      buckets.forEach((_, i) => (buckets[i]! += f[FIELDS.latencyBucket(hour, i)] ?? 0));
    }
  }
  if (count === 0) return { count, average: null, p95: null };
  const needed = Math.ceil(count * 0.95);
  let seen = 0;
  let p95 = Infinity;
  for (let i = 0; i < buckets.length; i++) {
    seen += buckets[i]!;
    if (seen >= needed) {
      p95 = LATENCY_BOUNDS[i] ?? Infinity;
      break;
    }
  }
  return { count, average: Math.round(sum / count), p95 };
}

export const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));

export function latencyPerDay(days: readonly Day[]): { date: string; latency: Latency }[] {
  return days.map((day) => ({ date: day.date, latency: latencyFrom([day.fields], HOURS) }));
}

/** De laatste 48 uur per uur (gisteren en vandaag), tot en met het huidige uur. */
export function latencyPerHour(
  yesterday: Day | undefined,
  today: Day | undefined,
  currentHour: string,
): { label: string; latency: Latency }[] {
  const rows: { label: string; latency: Latency }[] = [];
  for (const [day, name] of [
    [yesterday, "gisteren"],
    [today, "vandaag"],
  ] as const) {
    for (const hour of HOURS) {
      if (name === "vandaag" && hour > currentHour) break;
      rows.push({
        label: `${name} ${hour}:00`,
        latency: latencyFrom(day ? [day.fields] : [], [hour]),
      });
    }
  }
  return rows;
}

export function rateLimitSeries(days: readonly Day[]) {
  return RATE_LIMIT_SOURCES.map((source) => ({
    source,
    values: days.map((day) => day.fields[FIELDS.rateLimited(source)] ?? 0),
  }));
}

export function errorTotals(days: readonly Day[]): { kind: ErrorKind; value: number }[] {
  return ERROR_KINDS.map((kind) => ({
    kind,
    value: days.reduce((sum, day) => sum + (day.fields[e(`fout:${kind}`)] ?? 0), 0),
  })).sort((a, b) => b.value - a.value);
}

/** Alle tellers als CSV: datum, teller, waarde. Alleen tellers, dus niets persoonlijks. */
export function toCsv(days: readonly Day[]): string {
  const rows = ["datum,teller,waarde"];
  for (const day of days) {
    for (const field of Object.keys(day.fields).sort()) {
      // De veldnamen zijn al streng (a-z, 0-9, : en -), dus quoten hoeft niet.
      rows.push(`${day.date},${field},${day.fields[field]}`);
    }
  }
  return `${rows.join("\n")}\n`;
}
