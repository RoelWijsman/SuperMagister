import { describe, expect, it } from "vitest";
import { anonymousUrl } from "@/components/stats/VercelAnalytics";
import { buildModel, dayLabel } from "@/lib/dev-dashboard/model";
import { browserOptedOut, classifyError } from "./client";
import { amsterdamParts, daysUntil, shiftDay } from "./day";
import { latencyBucket, statusGroup } from "./fields";
import {
  detectSpikes,
  formatDelta,
  funnel,
  glance,
  latencyFrom,
  onboardingDropOff,
  proxyDays,
  sumFields,
  toCsv,
  type Day,
} from "./summary";

const day = (date: string, fields: Record<string, number> = {}): Day => ({ date, fields });

describe("datums", () => {
  it("rekent in Nederlandse tijd", () => {
    // 23:30 UTC op 9 oktober is in Nederland (zomertijd) al 10 oktober, 01:30.
    expect(amsterdamParts(new Date(Date.UTC(2026, 9, 9, 23, 30)))).toEqual({
      date: "2026-10-10",
      hour: "01",
    });
    expect(shiftDay("2026-03-29", 1)).toBe("2026-03-30");
    expect(daysUntil("2026-10-09", 3)).toEqual(["2026-10-07", "2026-10-08", "2026-10-09"]);
    expect(dayLabel("2026-10-09")).toBe("9 okt");
  });
});

describe("statusgroepen en responstijd", () => {
  it("deelt statussen in", () => {
    expect([200, 204, 302, 401, 403, 404, 429, 500, 503, 418].map(statusGroup)).toEqual([
      "2xx",
      "2xx",
      "401",
      "401",
      "403",
      "404",
      "429",
      "5xx",
      "5xx",
      "overig",
    ]);
  });

  it("p95 en gemiddelde uit de emmertjes", () => {
    expect(latencyBucket(80)).toBe(0);
    expect(latencyBucket(100)).toBe(0);
    expect(latencyBucket(101)).toBe(1);
    expect(latencyBucket(60_000)).toBe(11);
    // 100 metingen: 90 onder 200 ms, 10 tussen 1 en 1,5 s.
    const fields = { "p:t:09:n": 100, "p:t:09:ms": 100 * 300, "p:t:09:b1": 90, "p:t:09:b6": 10 };
    expect(latencyFrom([fields], ["09"])).toEqual({ count: 100, average: 300, p95: 1500 });
    expect(latencyFrom([fields], ["10"])).toEqual({ count: 0, average: null, p95: null });
    expect(latencyFrom([{ "p:t:09:n": 1, "p:t:09:ms": 9000, "p:t:09:b11": 1 }], ["09"]).p95).toBe(
      Infinity,
    );
  });
});

describe("piek in 401 of 5xx", () => {
  const normal = (date: string) =>
    day(date, { "p:n": 200, "p:s:2xx": 190, "p:s:401": 8, "p:s:5xx": 2 });
  const week = daysUntil("2026-10-08", 7).map(normal);

  it("waarschuwt bij een plotselinge golf 401's", () => {
    const today = day("2026-10-09", { "p:n": 100, "p:s:2xx": 60, "p:s:401": 40 });
    const [warning, ...rest] = detectSpikes(proxyDays([...week, today]));
    expect(rest).toEqual([]);
    expect(warning).toMatchObject({ group: "401", today: 0.4, requests: 100 });
    expect(warning!.baseline).toBeCloseTo(0.04);
  });

  it("niet bij een gewone dag, of met te weinig verzoeken", () => {
    expect(detectSpikes(proxyDays([...week, normal("2026-10-09")]))).toEqual([]);
    const quiet = day("2026-10-09", { "p:n": 10, "p:s:401": 10 });
    expect(detectSpikes(proxyDays([...week, quiet]))).toEqual([]);
  });

  it("wel bij veel 5xx, ook zonder geschiedenis", () => {
    const today = day("2026-10-09", { "p:n": 50, "p:s:2xx": 25, "p:s:5xx": 25 });
    expect(detectSpikes(proxyDays([today])).map((w) => w.group)).toEqual(["5xx"]);
  });
});

describe("overzichten", () => {
  const days = [
    day("2026-10-02", { "e:app-geopend": 4 }),
    ...daysUntil("2026-10-07", 5).map((d) => day(d)),
    day("2026-10-08", { "e:app-geopend": 10, "e:gekoppeld:bladwijzer": 1 }),
    day("2026-10-09", {
      "e:app-geopend": 12,
      "e:onboarding-afgerond": 6,
      "e:demo-gestart": 2,
      "e:gekoppeld:bladwijzer": 2,
      "e:gekoppeld:plakken": 1,
      "e:opnieuw-gekoppeld": 3,
      "e:eerste-walkout": 4,
      "e:onboarding-stap:koppelen": 7,
      "e:onboarding-overgeslagen:koppelen": 2,
    }),
  ];

  it("telt voorvoegsels op", () => {
    expect(sumFields(days[days.length - 1]!.fields, ["e:gekoppeld:"])).toBe(3);
  });

  it("vandaag tegenover gisteren en vorige week", () => {
    const opened = glance(days, "2026-10-09").find((g) => g.metric.id === "geopend")!;
    expect(opened).toMatchObject({ today: 12, yesterday: 10, lastWeek: 4 });
    const links = glance(days, "2026-10-09").find((g) => g.metric.id === "koppelingen")!;
    expect(links.today).toBe(6);
    expect(formatDelta(12, 10)).toBe("+2");
    expect(formatDelta(4, 10)).toBe("−6");
    expect(formatDelta(3, 3)).toBe("±0");
  });

  it("trechter en onboarding per stap", () => {
    expect(funnel(days.slice(-1)).map((s) => [s.label, s.value, s.share])).toEqual([
      ["App geopend", 12, 1],
      ["Onboarding afgerond", 6, 0.5],
      ["Demo of gekoppeld", 5, 5 / 12],
      ["Eerste walkout", 4, 1 / 3],
    ]);
    const koppelen = onboardingDropOff(days).find((row) => row.step === "koppelen");
    expect(koppelen).toEqual({ step: "koppelen", reached: 7, skipped: 2 });
  });

  it("het model voor het dashboard", () => {
    const model = buildModel(days, 7, "2026-10-09", "14");
    expect(model.labels).toHaveLength(7);
    expect(model.daily.find((d) => d.id === "geopend")!.values.slice(-2)).toEqual([10, 12]);
    expect(model.latency.hourLabels[0]).toBe("gisteren 00:00");
    expect(model.latency.hourLabels.at(-1)).toBe("vandaag 14:00");
  });

  it("CSV: alleen datum, teller en waarde", () => {
    expect(toCsv([day("2026-10-09", { "p:n": 3, "e:app-geopend": 2 })])).toBe(
      "datum,teller,waarde\n2026-10-09,e:app-geopend,2\n2026-10-09,p:n,3\n",
    );
  });
});

describe("in de browser", () => {
  it("van een fout gaat alleen de soort mee", () => {
    expect(classifyError(new TypeError("x is undefined"))).toBe("typeerror");
    expect(classifyError(new TypeError("Failed to fetch"))).toBe("netwerk");
    expect(
      classifyError(
        Object.assign(new Error("Loading chunk 12 failed"), { name: "ChunkLoadError" }),
      ),
    ).toBe("chunk");
    expect(classifyError(new RangeError("te diep"))).toBe("rangeerror");
    expect(classifyError("iets")).toBe("overig");
  });

  it("Do Not Track en Global Privacy Control", () => {
    expect(browserOptedOut({ doNotTrack: "1" }, {})).toBe(true);
    expect(browserOptedOut({ globalPrivacyControl: true }, {})).toBe(true);
    expect(browserOptedOut({}, { doNotTrack: "1" })).toBe(true);
    expect(browserOptedOut({ doNotTrack: "0" }, {})).toBe(false);
  });

  it("Vercel Analytics krijgt het adres zonder query, fragment of vak", () => {
    expect(anonymousUrl("https://supermagister.nl/koppelen#token=geheim&school=x")).toBe(
      "https://supermagister.nl/koppelen",
    );
    expect(anonymousUrl("https://supermagister.nl/rooster?dag=2026-10-09")).toBe(
      "https://supermagister.nl/rooster",
    );
    expect(anonymousUrl("https://supermagister.nl/cijfers/wiskunde-a")).toBe(
      "https://supermagister.nl/cijfers/[vak]",
    );
  });
});
