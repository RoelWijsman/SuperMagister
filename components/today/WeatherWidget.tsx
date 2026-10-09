"use client";

import {
  Bike,
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Sun,
  Wind,
} from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/Skeleton";
import { Widget } from "@/components/ui/Widget";
import type { CopyKey } from "@/content/copy";
import { cn } from "@/lib/cn";
import { formatRelativeDay, formatTime } from "@/lib/date";
import { useCopy } from "@/lib/use-copy";
import {
  COMPASS_DEGREES,
  hourAt,
  rideAdvice,
  worstRide,
  type Compass,
  type RideAdvice,
} from "@/lib/weather/advice";
import { useForecast } from "@/lib/weather/open-meteo";
import { useSettings } from "@/stores/settings";

/** WMO-weercode naar een icoon. */
function WeatherIcon({ code }: { code: number }) {
  const props = { size: 18, "aria-hidden": true } as const;
  if (code === 0) return <Sun {...props} />;
  if (code <= 2) return <CloudSun {...props} />;
  if (code === 3) return <Cloud {...props} />;
  if (code <= 48) return <CloudFog {...props} />;
  if (code <= 57) return <CloudDrizzle {...props} />;
  if (code <= 67 || (code >= 80 && code <= 82)) return <CloudRain {...props} />;
  if (code <= 77 || code === 85 || code === 86) return <CloudSnow {...props} />;
  return <CloudLightning {...props} />;
}

const COMPASS_ORDER: readonly Compass[] = ["N", "NO", "O", "ZO", "Z", "ZW", "W", "NW"];
/** Uit welke windrichting (afgerond op 45°). */
const windFrom = (degrees: number) =>
  COMPASS_ORDER[Math.round((((degrees % 360) + 360) % 360) / 45) % 8]!;

export interface RideTimes {
  /** Wanneer je van huis vertrekt en wanneer de laatste bel gaat. */
  leave: Date;
  home: Date;
}

function Ride({ label, ride, at }: { label: string; ride: RideAdvice | null; at: Date }) {
  if (!ride) {
    return (
      <li className="flex items-center justify-between gap-3 text-sm text-ink-3">
        <span>
          {label} {formatTime(at)}
        </span>
        <span>geen verwachting</span>
      </li>
    );
  }
  const against = Math.round(ride.headwind);
  return (
    <li className="flex items-center gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-glass-strong text-ink">
        <WeatherIcon code={ride.hour.weatherCode} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">
          {label} <span className="tabular-nums">{formatTime(at)}</span>
        </p>
        <p className="truncate text-xs text-ink-2 tabular-nums">
          {Math.round(ride.hour.temperature)}° · {Math.round(ride.hour.windSpeed)} km/u uit het{" "}
          {windFrom(ride.hour.windDirection)}
          {ride.hour.precipitation >= 0.1 &&
            ` · ${ride.hour.precipitation.toFixed(1).replace(".", ",")} mm`}
        </p>
      </div>
      <span
        className={cn(
          "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums",
          against >= 15
            ? "bg-warn/15 text-warn"
            : against <= -15
              ? "bg-good/15 text-good"
              : "text-ink-3",
        )}
        title="Tegenwind (+) of rugwind (−)"
      >
        <Wind size={12} aria-hidden className="mr-1 inline align-[-1px]" />
        {against > 0 ? `${against} tegen` : against < 0 ? `${-against} mee` : "zijwind"}
      </span>
    </li>
  );
}

/**
 * Fase 3a: fietsweer op je vertrektijd en je eindtijd, met één advies.
 * `times` is null als er de komende dagen geen school is.
 */
export function WeatherWidget({ times, now }: { times: RideTimes | null; now: Date | null }) {
  const place = useSettings((s) => s.weatherPlace);
  const heading = useSettings((s) => s.bikeHeading);
  const forecast = useForecast(place);

  const hours = forecast.data ?? [];
  const toSchool = COMPASS_DEGREES[heading];
  const heen = times ? hourAt(hours, times.leave) : null;
  const terug = times ? hourAt(hours, times.home) : null;
  const rides = {
    heen: heen ? rideAdvice(heen, toSchool) : null,
    terug: terug ? rideAdvice(terug, (toSchool + 180) % 360) : null,
  };
  const worst = worstRide([rides.heen, rides.terug].filter((r): r is RideAdvice => r !== null));
  const worstAt = worst === rides.terug && times ? times.home : times?.leave;

  const key: CopyKey | null = forecast.isError
    ? "weer.fout"
    : !times && forecast.data
      ? "weer.geenSchool"
      : worst
        ? (`weer.${worst.kind}` as CopyKey)
        : null;
  const advice = useCopy(key, {
    tijd: worstAt ? formatTime(worstAt) : "",
    wind: worst ? Math.round(Math.max(worst.hour.windGusts, Math.abs(worst.headwind))) : 0,
    temp: worst ? Math.round(worst.hour.temperature) : 0,
  });

  return (
    <Widget
      title="Fietsweer"
      icon={Bike}
      action={
        <Link
          href="/instellingen#vandaag"
          className="text-sm font-medium text-accent-ink hover:underline"
        >
          {place ? place.name : "Instellen"}
        </Link>
      }
    >
      {!place ? (
        <div>
          <p className="font-display text-[1.05rem] leading-snug font-semibold text-ink">
            Stel je woonplaats in
          </p>
          <p className="mt-1 text-sm text-ink-2">
            Dan zie je hier of je tegenwind hebt, en of je regenkleding nodig hebt.
          </p>
          <Link
            href="/instellingen#vandaag"
            className="mt-3 inline-flex text-sm font-semibold text-accent-ink hover:underline"
          >
            Woonplaats kiezen
          </Link>
        </div>
      ) : forecast.isPending || !now ? (
        <div className="space-y-3">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-9 w-full rounded-xl" />
          <Skeleton className="h-9 w-full rounded-xl" />
        </div>
      ) : (
        <>
          <p className="font-display text-[1.05rem] leading-snug font-semibold text-ink">
            {advice}
          </p>
          {times && !forecast.isError && (
            <>
              <p className="mt-1 text-xs text-ink-3 first-letter:uppercase">
                {formatRelativeDay(times.leave, now)}
              </p>
              <ul className="mt-3 space-y-2.5">
                <Ride label="Heen" ride={rides.heen} at={times.leave} />
                <Ride label="Terug" ride={rides.terug} at={times.home} />
              </ul>
            </>
          )}
        </>
      )}
    </Widget>
  );
}
