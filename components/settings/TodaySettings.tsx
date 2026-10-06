"use client";

import { Bike, MapPin, Minus, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import { cn } from "@/lib/cn";
import type { HolidayRegion } from "@/lib/school/holidays";
import { COMPASS_LABELS, type Compass } from "@/lib/weather/advice";
import { searchPlaces } from "@/lib/weather/open-meteo";
import { useSettings, type WeatherPlace } from "@/stores/settings";

/** De kompasroos als raster: het midden is je fiets. */
const ROSE: readonly (Compass | null)[] = ["NW", "N", "NO", "W", null, "O", "ZW", "Z", "ZO"];

function PlaceSearch() {
  const place = useSettings((s) => s.weatherPlace);
  const set = useSettings((s) => s.set);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<WeatherPlace[] | null>(null);
  const [failed, setFailed] = useState(false);

  // Zoeken terwijl je typt, met een korte pauze zodat we niet bij elke letter vragen.
  useEffect(() => {
    const name = query.trim();
    if (name.length < 2) return;
    const controller = new AbortController();
    const id = setTimeout(() => {
      searchPlaces(name, controller.signal)
        .then((found) => {
          setResults(found);
          setFailed(false);
        })
        .catch(() => {
          if (!controller.signal.aborted) setFailed(true);
        });
    }, 300);
    return () => {
      clearTimeout(id);
      controller.abort();
    };
  }, [query]);

  const choose = (choice: WeatherPlace) => {
    set("weatherPlace", choice);
    setQuery("");
    setResults(null);
  };

  return (
    <div className="py-2">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <span className="font-medium text-ink">Woonplaats</span>
        <span className="inline-flex items-center gap-1.5 text-sm text-ink-2">
          <MapPin size={15} aria-hidden />
          {place.name}
          {place.region && place.region !== place.name && `, ${place.region}`}
        </span>
      </div>
      <label className="relative mt-2.5 block">
        <span className="sr-only">Zoek een plaats</span>
        <Search
          size={16}
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-3"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Zoek je woonplaats"
          autoComplete="off"
          className="h-11 w-full rounded-full border border-line bg-glass pr-4 pl-10 text-ink placeholder:text-ink-3"
        />
      </label>
      {query.trim().length >= 2 && (
        <ul className="mt-2 space-y-1" aria-live="polite">
          {failed && (
            <li className="px-3 py-2 text-sm text-ink-2">
              Zoeken lukte niet. Probeer het zo nog eens.
            </li>
          )}
          {results?.length === 0 && !failed && (
            <li className="px-3 py-2 text-sm text-ink-2">Geen plaats gevonden met die naam.</li>
          )}
          {results?.map((result) => (
            <li key={`${result.latitude},${result.longitude}`}>
              <button
                type="button"
                onClick={() => choose(result)}
                className="flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm hover:bg-glass-strong"
              >
                <MapPin size={15} aria-hidden className="text-ink-3" />
                <span className="font-medium text-ink">{result.name}</span>
                {result.region && <span className="text-ink-3">{result.region}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Fase 3a: instellingen voor de widgets op Vandaag. */
export function TodaySettings() {
  const heading = useSettings((s) => s.bikeHeading);
  const minutes = useSettings((s) => s.bikeMinutes);
  const region = useSettings((s) => s.holidayRegion);
  const set = useSettings((s) => s.set);

  return (
    <div className="divide-y divide-line">
      <PlaceSearch />

      <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium text-ink">Richting naar school</p>
          <p className="mt-0.5 text-sm text-ink-2">
            Voor de tegenwind. Nu: {COMPASS_LABELS[heading].toLowerCase()}.
          </p>
        </div>
        <div
          role="radiogroup"
          aria-label="Richting naar school"
          className="grid grid-cols-3 gap-1.5"
        >
          {ROSE.map((point, i) =>
            point ? (
              <button
                key={point}
                type="button"
                role="radio"
                aria-checked={heading === point}
                aria-label={COMPASS_LABELS[point]}
                onClick={() => set("bikeHeading", point)}
                className={cn(
                  "size-10 rounded-xl border text-sm font-semibold transition-colors",
                  heading === point
                    ? "border-transparent bg-[linear-gradient(135deg,var(--sm-accent),var(--sm-accent-2))] text-on-accent"
                    : "border-line bg-glass text-ink-2 hover:text-ink",
                )}
              >
                {point}
              </button>
            ) : (
              <span
                key={`fiets-${i}`}
                aria-hidden
                className="grid size-10 place-items-center text-ink-3"
              >
                <Bike size={18} />
              </span>
            ),
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2.5 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium text-ink">Fietstijd naar school</p>
          <p className="mt-0.5 text-sm text-ink-2">Zo weten we wanneer je vertrekt.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="glass"
            size="icon-sm"
            icon={Minus}
            aria-label="Vijf minuten korter"
            disabled={minutes <= 5}
            onClick={() => set("bikeMinutes", Math.max(5, minutes - 5))}
          />
          <span className="w-16 text-center font-semibold text-ink tabular-nums" aria-live="polite">
            {minutes} min
          </span>
          <Button
            variant="glass"
            size="icon-sm"
            icon={Plus}
            aria-label="Vijf minuten langer"
            disabled={minutes >= 90}
            onClick={() => set("bikeMinutes", Math.min(90, minutes + 5))}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2.5 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium text-ink">Regio voor schoolvakanties</p>
          <p className="mt-0.5 text-sm text-ink-2">
            Staat op de site van je school, of vraag je mentor.
          </p>
        </div>
        <Tabs<HolidayRegion>
          id="vakantieregio"
          aria-label="Regio voor schoolvakanties"
          size="sm"
          value={region}
          onValueChange={(value) => set("holidayRegion", value)}
          items={[
            { value: "noord", label: "Noord" },
            { value: "midden", label: "Midden" },
            { value: "zuid", label: "Zuid" },
          ]}
        />
      </div>
    </div>
  );
}
