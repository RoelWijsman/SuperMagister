import { HOLIDAYS_SOURCE } from "@/lib/school/holidays";

/**
 * "Test nu": kan de server de proxy, Magister, Open-Meteo en de vakantie-API
 * bereiken? Zonder token en zonder iets van een gebruiker. De proxy testen we
 * door hem zonder token aan te roepen: dan hoort hij netjes "geen-token" (401)
 * te zeggen, zonder Magister te vragen.
 */

export interface CheckResult {
  id: "proxy" | "magister" | "open-meteo" | "vakanties";
  label: string;
  ok: boolean;
  /** Bijv. "401 geen-token, zoals bedoeld" of "time-out na 8 s". */
  detail: string;
  ms: number;
}

const TIMEOUT_MS = 8000;

async function timed(
  run: () => Promise<{ ok: boolean; detail: string }>,
): Promise<{ ok: boolean; detail: string; ms: number }> {
  const start = performance.now();
  try {
    const result = await run();
    return { ...result, ms: Math.round(performance.now() - start) };
  } catch (error) {
    const timeout = error instanceof DOMException && error.name === "TimeoutError";
    return {
      ok: false,
      detail: timeout ? `time-out na ${TIMEOUT_MS / 1000} s` : "niet bereikbaar",
      ms: Math.round(performance.now() - start),
    };
  }
}

export async function runLiveCheck(
  origin: string,
  doFetch: typeof fetch = fetch,
): Promise<CheckResult[]> {
  const get = (url: string, init: RequestInit = {}) =>
    doFetch(url, {
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      ...init,
    });

  const checks: [CheckResult["id"], string, () => Promise<{ ok: boolean; detail: string }>][] = [
    [
      "proxy",
      "Eigen proxy (/api/magister)",
      async () => {
        const response = await get(`${origin}/api/magister/account`, {
          headers: { "X-Magister-School": "statuscheck.magister.net" },
        });
        const body = (await response.json().catch(() => null)) as { fout?: string } | null;
        const ok = response.status === 401 && body?.fout === "geen-token";
        return {
          ok,
          detail: ok ? "401 geen-token, zoals bedoeld" : `onverwacht: ${response.status}`,
        };
      },
    ],
    [
      "magister",
      "Magister-inlog (accounts.magister.net)",
      async () => {
        const response = await get(
          "https://accounts.magister.net/.well-known/openid-configuration",
        );
        return { ok: response.ok, detail: `${response.status}` };
      },
    ],
    [
      "open-meteo",
      "Open-Meteo (fietsweer)",
      async () => {
        const response = await get(
          "https://api.open-meteo.com/v1/forecast?latitude=52.09&longitude=5.12&hourly=temperature_2m&forecast_days=1",
        );
        return { ok: response.ok, detail: `${response.status}` };
      },
    ],
    [
      "vakanties",
      "Vakantie-API (Rijksoverheid)",
      async () => {
        const response = await get(HOLIDAYS_SOURCE);
        return { ok: response.ok, detail: `${response.status}` };
      },
    ],
  ];

  return Promise.all(
    checks.map(async ([id, label, run]) => ({ id, label, ...(await timed(run)) })),
  );
}
