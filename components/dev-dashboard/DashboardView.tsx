"use client";

import {
  Activity,
  AlertTriangle,
  BarChart3,
  Download,
  ExternalLink,
  Filter,
  GitCommit,
  HeartPulse,
  LogOut,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { BarList } from "@/components/charts/BarList";
import { LineChart } from "@/components/charts/LineChart";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { cn } from "@/lib/cn";
import type { BuildInfo, Range } from "@/lib/dev-dashboard/data";
import { OVER_MAX_MS, type DashboardModel } from "@/lib/dev-dashboard/model";
import { STATUS_GROUPS } from "@/lib/stats/fields";
import { formatDelta } from "@/lib/stats/summary";
import { LiveCheck } from "./LiveCheck";

const nl = (value: number) => value.toLocaleString("nl-NL");
const percent = (value: number) =>
  `${value.toLocaleString("nl-NL", { maximumFractionDigits: 1 })}%`;
const millis = (value: number) =>
  value >= OVER_MAX_MS
    ? "> 8 s"
    : value >= 1000
      ? `${(value / 1000).toLocaleString("nl-NL", { maximumFractionDigits: 1 })} s`
      : `${Math.round(value)} ms`;

const STATUS_LABELS: Record<string, string> = {
  "2xx": "2xx (gelukt)",
  "401": "401 (verlopen)",
  "403": "403 (geen toegang)",
  "404": "404 (niet gevonden)",
  "429": "429 (te vaak)",
  "5xx": "5xx (Magister plat of onbereikbaar)",
  overig: "Overig",
};

const STEP_LABELS: Record<string, string> = {
  intro: "Intro",
  pack: "Uitleg: walkout",
  gok: "Uitleg: gokken",
  overzicht: "Uitleg: je dag",
  thema: "Thema",
  woonplaats: "Woonplaats",
  koppelen: "Koppelen",
  "eerste-pack": "Welkomstpack",
  klaar: "Klaar",
};

const LIMIT_LABELS: Record<string, string> = {
  proxy: "Proxy",
  telling: "Event-endpoint",
  inloggen: "Inloggen dashboard",
};

const ERROR_LABELS: Record<string, string> = {
  typeerror: "TypeError",
  referenceerror: "ReferenceError",
  rangeerror: "RangeError",
  syntaxerror: "SyntaxError",
  chunk: "Laden van code (chunk)",
  netwerk: "Netwerk",
  opslag: "Opslag vol",
  render: "Pagina omgevallen",
  overig: "Overig",
};

function Section({
  title,
  icon: Icon,
  description,
  children,
  id,
}: {
  title: string;
  icon: typeof Activity;
  description?: ReactNode;
  children: ReactNode;
  id: string;
}) {
  return (
    <section aria-labelledby={id} className="space-y-3">
      <div>
        <h2
          id={id}
          className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight text-ink"
        >
          <Icon size={19} strokeWidth={2.2} aria-hidden className="text-accent-ink" />
          {title}
        </h2>
        {description && <p className="mt-1 text-sm text-ink-2">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function Card({
  title,
  children,
  className,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <GlassPanel padding="md" className={cn("min-w-0", className)}>
      {title && <h3 className="mb-3 text-sm font-semibold text-ink">{title}</h3>}
      {children}
    </GlassPanel>
  );
}

function Delta({ now, before, label }: { now: number; before: number; label: string }) {
  const diff = now - before;
  return (
    <span className="whitespace-nowrap">
      <span
        className={cn(
          "font-semibold tabular-nums",
          diff > 0 ? "text-good" : diff < 0 ? "text-warn" : "text-ink-2",
        )}
      >
        {formatDelta(now, before)}
      </span>{" "}
      <span className="text-ink-3">{label}</span>
    </span>
  );
}

function Warning({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-panel border border-[#d03b3b]/60 bg-[#d03b3b]/15 p-4 text-sm text-ink"
    >
      <AlertTriangle size={20} aria-hidden className="mt-0.5 shrink-0 text-[#ff8a8a]" />
      <div>{children}</div>
    </div>
  );
}

export function DashboardView({
  model,
  storage,
  basePath,
  build,
  analyticsUrl,
}: {
  model: DashboardModel | null;
  storage: "ok" | "geen-opslag" | "fout";
  basePath: string;
  build: BuildInfo;
  analyticsUrl: string;
}) {
  const ranges: Range[] = [7, 30, 90];
  const range = model?.range ?? 30;

  return (
    <main className="mx-auto max-w-6xl space-y-10 px-4 py-8 sm:px-6 md:py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-sm font-medium text-ink-3">Alleen voor de maker · anoniem</p>
          <h1 className="font-display text-[clamp(1.4rem,0.9rem+3vw,2.75rem)] leading-[1.08] font-semibold tracking-[-0.035em] [overflow-wrap:anywhere] text-ink">
            Ontwikkelaarsdashboard
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <nav aria-label="Periode" className="flex rounded-full glass p-1">
            {ranges.map((r) => (
              <Link
                key={r}
                href={`${basePath}?dagen=${r}`}
                prefetch={false}
                aria-current={r === range ? "page" : undefined}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors",
                  r === range ? "bg-white/15 text-ink" : "text-ink-2 hover:text-ink",
                )}
              >
                {r} dagen
              </Link>
            ))}
          </nav>
          <a
            href={`${basePath}/export?dagen=400`}
            className="inline-flex items-center gap-1.5 rounded-full glass px-3.5 py-2 text-sm font-semibold text-ink-2 hover:text-ink"
          >
            <Download size={16} aria-hidden /> CSV
          </a>
          <form method="post" action={`${basePath}/uitloggen`}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-full glass px-3.5 py-2 text-sm font-semibold text-ink-2 hover:text-ink"
            >
              <LogOut size={16} aria-hidden /> Uitloggen
            </button>
          </form>
        </div>
      </header>

      {storage !== "ok" && (
        <Warning>
          {storage === "geen-opslag" ? (
            <>
              <strong>Er is nog geen opslag gekoppeld.</strong> Zonder Upstash Redis worden er geen
              tellers bewaard. Koppel de opslag in Vercel (zie de README) en deploy opnieuw.
            </>
          ) : (
            <>
              <strong>De opslag gaf geen antwoord.</strong> Probeer het zo nog eens, of kijk bij
              Upstash of de database draait.
            </>
          )}
        </Warning>
      )}

      {model?.proxy.spikes.map((spike) => (
        <Warning key={spike.group}>
          <strong>
            Het aandeel {spike.group === "401" ? "401 (verlopen)" : "5xx (Magister plat)"} is
            vandaag {percent(spike.today * 100)}
          </strong>{" "}
          van {nl(spike.requests)} proxy-verzoeken, tegen {percent(spike.baseline * 100)} de week
          ervoor.{" "}
          {spike.group === "401"
            ? "Een plotselinge golf 401's betekent vaak dat Magister iets aan het inloggen of de API heeft veranderd."
            : "Magister lijkt plat of traag, of iets tussen ons en Magister hapert."}
        </Warning>
      ))}

      {model && (
        <>
          <Section id="vandaag" title="Vandaag in één oogopslag" icon={Sparkles}>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {model.glance.map((g) => (
                <li key={g.id}>
                  <GlassPanel padding="md" className="h-full">
                    <p className="text-sm text-ink-2">{g.label}</p>
                    <p className="mt-1 font-display text-4xl font-semibold tracking-tight text-ink">
                      {nl(g.today)}
                    </p>
                    <p className="mt-2 flex flex-col gap-0.5 text-xs">
                      <Delta now={g.today} before={g.yesterday} label="t.o.v. gisteren" />
                      <Delta now={g.today} before={g.lastWeek} label="t.o.v. vorige week" />
                    </p>
                  </GlassPanel>
                </li>
              ))}
            </ul>
          </Section>

          <Section
            id="per-dag"
            title="Per dag"
            icon={BarChart3}
            description={`De laatste ${range} dagen, tot en met vandaag (Nederlandse tijd).`}
          >
            <div className="grid gap-3 md:grid-cols-2">
              {model.daily.map((metric) => (
                <Card key={metric.id} title={`${metric.label} · ${nl(metric.total)} in totaal`}>
                  <LineChart
                    title={`${metric.label} per dag`}
                    labels={model.labels}
                    series={[{ name: metric.label, values: metric.values }]}
                  />
                </Card>
              ))}
            </div>
          </Section>

          <Section
            id="trechter"
            title="Trechter"
            icon={Filter}
            description="Losse dagtellers, geen gevolgde mensen: lees het als een benadering."
          >
            <div className="grid gap-3 md:grid-cols-2">
              <Card title="Van openen tot eerste walkout">
                <BarList
                  items={model.funnel.map((step) => ({
                    label: step.label,
                    value: step.value,
                    note: step.share === null ? undefined : percent(step.share * 100),
                  }))}
                />
              </Card>
              <Card title="Onboarding per stap: bereikt en overgeslagen">
                {model.onboarding.every((row) => row.reached === 0 && row.skipped === 0) ? (
                  <p className="text-sm text-ink-3">Nog niets geteld.</p>
                ) : (
                  <table className="w-full text-left text-sm tabular-nums">
                    <thead>
                      <tr className="text-ink-3">
                        <th className="py-1 pr-3 font-medium">Stap</th>
                        <th className="py-1 pr-3 text-right font-medium">Bereikt</th>
                        <th className="py-1 text-right font-medium">Overgeslagen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {model.onboarding.map((row) => (
                        <tr key={row.step} className="border-t border-line">
                          <td className="py-1.5 pr-3 text-ink-2">
                            {STEP_LABELS[row.step] ?? row.step}
                          </td>
                          <td className="py-1.5 pr-3 text-right text-ink">{nl(row.reached)}</td>
                          <td
                            className={cn(
                              "py-1.5 text-right",
                              row.skipped > 0 ? "font-semibold text-warn" : "text-ink-3",
                            )}
                          >
                            {nl(row.skipped)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </Card>
            </div>
          </Section>

          <Section id="populariteit" title="Wat wordt het meest gebruikt" icon={Activity}>
            <Card>
              <BarList items={model.features} />
            </Card>
          </Section>

          <Section
            id="gezondheid"
            title="Gezondheid"
            icon={HeartPulse}
            description="Alles wat de proxy en de andere diensten doen, zonder tokens of adressen."
          >
            <div className="grid gap-3 md:grid-cols-2">
              <Card title="Proxy-verzoeken naar Magister per dag">
                <LineChart
                  title="Proxy-verzoeken per dag"
                  labels={model.labels}
                  series={[{ name: "Verzoeken", values: model.proxy.totals }]}
                />
              </Card>
              <Card title="Aandeel 401 en 5xx per dag">
                <LineChart
                  title="Aandeel 401 en 5xx per dag"
                  labels={model.labels}
                  series={[
                    { name: "401 (verlopen)", values: model.proxy.share401 },
                    { name: "5xx (Magister plat)", values: model.proxy.share5xx },
                  ]}
                  format={percent}
                />
              </Card>
              <Card title={`Statuscodes, laatste ${range} dagen`}>
                <BarList
                  items={[
                    // Vaste volgorde (Object.entries zet "401" vóór "2xx").
                    ...STATUS_GROUPS.map((group) => ({
                      label: STATUS_LABELS[group] ?? group,
                      value: model.proxy.statusTotals[group],
                    })),
                    { label: "Geweigerd door de proxy zelf", value: model.proxy.rejected },
                  ]}
                />
              </Card>
              <Card title="Responstijd van Magister per dag">
                <LineChart
                  title="Responstijd van Magister per dag"
                  labels={model.labels}
                  series={[
                    { name: "Gemiddeld", values: model.latency.dayAvg },
                    { name: "p95", values: model.latency.dayP95 },
                  ]}
                  format={millis}
                />
              </Card>
              <Card title="Responstijd van Magister, laatste 48 uur">
                <LineChart
                  title="Responstijd van Magister per uur"
                  labels={model.latency.hourLabels}
                  series={[
                    { name: "Gemiddeld", values: model.latency.hourAvg },
                    { name: "p95", values: model.latency.hourP95 },
                  ]}
                  format={millis}
                />
              </Card>
              <Card title="Rate-limit-blokkades per dag">
                <LineChart
                  title="Rate-limit-blokkades per dag"
                  labels={model.labels}
                  series={model.rateLimits.map((row) => ({
                    name: LIMIT_LABELS[row.source] ?? row.source,
                    values: row.values,
                  }))}
                />
              </Card>
              <Card title="Fouten van Open-Meteo en de vakantie-API">
                <LineChart
                  title="Fouten van Open-Meteo en de vakantie-API per dag"
                  labels={model.labels}
                  series={[
                    { name: "Open-Meteo", values: model.external.openMeteo },
                    { name: "Vakantie-API", values: model.external.holidays },
                  ]}
                />
              </Card>
              <Card title="Fouten in de browser, per soort">
                <BarList
                  items={model.errors.map((row) => ({
                    label: ERROR_LABELS[row.kind] ?? row.kind,
                    value: row.value,
                  }))}
                  color="#d95926"
                  empty="Geen fouten geteld. Verdacht stil."
                />
              </Card>
            </div>
          </Section>
        </>
      )}

      <Section
        id="live"
        title="Live check"
        icon={HeartPulse}
        description="Vraagt nu, vanaf de server en zonder token, of alles bereikbaar is."
      >
        <LiveCheck endpoint={`${basePath}/check`} />
      </Section>

      <Section id="build" title="Build" icon={GitCommit}>
        <Card>
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="text-ink-3">Versie</dt>
            <dd className="text-ink tabular-nums">{build.version}</dd>
            <dt className="text-ink-3">Commit</dt>
            <dd className="font-mono text-ink">
              {build.commit ? build.commit.slice(0, 7) : "onbekend (niet op Vercel)"}
              {build.branch && <span className="ml-2 text-ink-3">{build.branch}</span>}
            </dd>
            <dt className="text-ink-3">Gebouwd</dt>
            <dd className="text-ink">
              {build.builtAt
                ? new Date(build.builtAt).toLocaleString("nl-NL", { timeZone: "Europe/Amsterdam" })
                : "onbekend"}
            </dd>
            <dt className="text-ink-3">Omgeving</dt>
            <dd className="text-ink">
              {build.environment}
              {build.region && <span className="ml-2 text-ink-3">{build.region}</span>}
            </dd>
          </dl>
          <a
            href={analyticsUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-ink underline-offset-2 hover:underline"
          >
            Bezoekers in Vercel Analytics <ExternalLink size={14} aria-hidden />
          </a>
        </Card>
      </Section>
    </main>
  );
}
