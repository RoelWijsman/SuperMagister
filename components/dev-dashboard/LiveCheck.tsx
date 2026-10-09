"use client";

import { CheckCircle2, RefreshCw, XCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { GlassPanel } from "@/components/ui/GlassPanel";
import type { CheckResult } from "@/lib/dev-dashboard/live-check";

/** "Test nu": de server kijkt meteen of de proxy, Magister, Open-Meteo en de vakantie-API werken. */
export function LiveCheck({ endpoint }: { endpoint: string }) {
  const [state, setState] = useState<
    | { kind: "rust" }
    | { kind: "bezig" }
    | { kind: "klaar"; results: CheckResult[]; at: Date }
    | { kind: "fout" }
  >({ kind: "rust" });

  const run = async () => {
    setState({ kind: "bezig" });
    try {
      const response = await fetch(endpoint, { method: "POST", cache: "no-store" });
      if (!response.ok) throw new Error(String(response.status));
      setState({
        kind: "klaar",
        results: (await response.json()) as CheckResult[],
        at: new Date(),
      });
    } catch {
      setState({ kind: "fout" });
    }
  };

  return (
    <GlassPanel padding="md" className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="primary" icon={RefreshCw} onClick={run} disabled={state.kind === "bezig"}>
          {state.kind === "bezig" ? "Bezig…" : "Test nu"}
        </Button>
        {state.kind === "klaar" && (
          <p className="text-sm text-ink-3">
            Getest om{" "}
            {state.at.toLocaleTimeString("nl-NL", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </p>
        )}
        {state.kind === "fout" && (
          <p role="alert" className="text-sm text-bad">
            De test zelf lukte niet. Is je sessie verlopen? Ververs de pagina.
          </p>
        )}
      </div>
      {state.kind === "klaar" && (
        <ul className="grid gap-2 sm:grid-cols-2" aria-live="polite">
          {state.results.map((result) => (
            <li key={result.id} className="flex items-start gap-2.5 text-sm">
              {result.ok ? (
                <CheckCircle2 size={18} aria-hidden className="mt-0.5 shrink-0 text-[#0ca30c]" />
              ) : (
                <XCircle size={18} aria-hidden className="mt-0.5 shrink-0 text-[#ff8a8a]" />
              )}
              <span>
                <span className="font-semibold text-ink">{result.label}</span>
                <span className="block text-ink-2">
                  {result.ok ? "Werkt" : "Werkt niet"} · {result.detail} · {result.ms} ms
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </GlassPanel>
  );
}
