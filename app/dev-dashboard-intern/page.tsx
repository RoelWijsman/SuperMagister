import type { Metadata } from "next";
import { DashboardView } from "@/components/dev-dashboard/DashboardView";
import { analyticsUrl, buildInfo, loadDays, parseRange } from "@/lib/dev-dashboard/data";
import { requireAccess } from "@/lib/dev-dashboard/guard";
import { buildModel } from "@/lib/dev-dashboard/model";

/**
 * Het privé ontwikkelaarsdashboard. Alleen bereikbaar via het geheime adres
 * (DEV_DASHBOARD_PATH) met een geldige sessie; zie proxy.ts en
 * lib/dev-dashboard. Rechtstreeks naar dit interne adres: de gewone 404.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false, nocache: true },
};

export default async function DevDashboardPage({
  searchParams,
}: PageProps<"/dev-dashboard-intern">) {
  const config = await requireAccess("dashboard");
  const range = parseRange((await searchParams).dagen);
  const data = await loadDays(Math.max(range, 8));
  const model = data.status === "ok" ? buildModel(data.days, range, data.today, data.hour) : null;
  return (
    <DashboardView
      model={model}
      storage={data.status}
      basePath={config.path}
      build={buildInfo()}
      analyticsUrl={analyticsUrl()}
    />
  );
}
