"use client";

import Link from "next/link";
import { Switch } from "@/components/ui/Switch";
import { useIsClient } from "@/lib/hooks";
import { browserOptedOut } from "@/lib/stats/client";
import { useSettings } from "@/stores/settings";

/**
 * Instellingen → Privacy: "Anonieme statistieken delen". In gewone taal wat
 * het is, en een zin als je browser al om "niet volgen" vraagt (dan tellen we
 * hoe dan ook niets).
 */
export function StatsSetting() {
  const shareStats = useSettings((s) => s.shareStats);
  const set = useSettings((s) => s.set);
  // Pas in de browser te weten; op de server en tijdens hydratie nog niet.
  const browserSaysNo = useIsClient() && browserOptedOut();

  return (
    <div>
      <Switch
        label="Anonieme statistieken delen"
        description="We tellen alleen hoe vaak iets gebeurt, zoals “er is een walkout gestart”. Nooit wie je bent, je school, je cijfers of je vakken. Zo weten we wat er gebruikt wordt en wat stuk is."
        checked={shareStats}
        onCheckedChange={(value) => set("shareStats", value)}
      />
      {browserSaysNo && (
        <p className="mt-1 text-sm text-ink-2">
          Je browser vraagt om niet gevolgd te worden (Do Not Track of Global Privacy Control).
          Daarom tellen we nu niets, ook als dit aan staat.
        </p>
      )}
      <p className="mt-1 text-sm text-ink-3">
        <Link
          href="/privacy#statistieken"
          className="font-semibold text-accent-ink underline-offset-2 hover:underline"
        >
          Wat we precies tellen
        </Link>
      </p>
    </div>
  );
}
