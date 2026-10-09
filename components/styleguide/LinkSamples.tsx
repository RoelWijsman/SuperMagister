"use client";

import { Plug } from "lucide-react";
import { useState } from "react";
import { AverageWarningPanel } from "@/components/grades/AverageWarning";
import { StatusDot } from "@/components/koppelen/ConnectionFacts";
import { DataErrorState } from "@/components/koppelen/DataErrorState";
import { DemoBanner, DemoButton } from "@/components/koppelen/Demo";
import { Disclaimer } from "@/components/legal/Disclaimer";
import { useCalculator } from "@/stores/calculator";
import { LinkSteps } from "@/components/koppelen/LinkSteps";
import { DevtoolsShot } from "@/components/koppelen/PasteCard";
import { RelinkSheet } from "@/components/koppelen/RelinkSheet";
import { Button } from "@/components/ui/Button";
import type { SessionStatus } from "@/lib/koppelen/session";
import { MagisterError } from "@/lib/magister/transport";

const STATES: { status: SessionStatus; label: string }[] = [
  { status: "geldig", label: "Gekoppeld" },
  { status: "bijna-verlopen", label: "Bijna verlopen" },
  { status: "verlopen", label: "Verlopen" },
];

/** Fase 5b: de bouwstenen van koppelen, met verzonnen gegevens. Hier koppel je niets echt. */
export function LinkSamples() {
  const [relink, setRelink] = useState(false);
  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-sm text-ink-3">De chip en het stipje voor de koppeling</p>
        <div className="flex flex-wrap gap-3">
          {STATES.map(({ status, label }) => (
            <span key={status} className="flex flex-col items-center gap-1.5">
              <span className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line bg-glass px-2.5 text-xs font-bold tracking-[0.12em] text-ink-2 uppercase">
                <span className="relative">
                  <Plug size={14} />
                  <StatusDot status={status} className="absolute -top-0.5 -right-1 size-1.5" />
                </span>
                Noorderlicht
              </span>
              <span className="text-xs text-ink-3">{label}</span>
            </span>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm text-ink-3">De bladwijzer in drie stappen</p>
        <LinkSteps />
      </div>

      <div>
        <p className="mb-2 text-sm text-ink-3">
          Het plakveld: zo ziet het eruit in de ontwikkelaarstools
        </p>
        <DevtoolsShot />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DataErrorState error={new MagisterError("verlopen", "Verlopen.", 401)} />
        <DataErrorState
          error={new MagisterError("netwerk", "Geen verbinding.")}
          onRetry={() => undefined}
        />
      </div>

      <div>
        <p className="mb-2 text-sm text-ink-3">
          De demo: de balk boven elke pagina, en de knop om hem te starten (die zet de demo echt
          aan)
        </p>
        <DemoBanner preview className="mb-3" />
        <DemoButton />
      </div>

      <div>
        <p className="mb-2 text-sm text-ink-3">
          &quot;Wat moet ik halen?&quot; met handmatig invullen (oefenkaarten, de demo, geen
          koppeling)
        </p>
        <Button variant="glass" onClick={() => useCalculator.getState().openManual()}>
          Open de handmatige calculator
        </Button>
      </div>

      <div>
        <p className="mb-2 text-sm text-ink-3">
          De disclaimer: op /koppelen, in de onboarding, op /privacy en in Instellingen
        </p>
        <Disclaimer />
      </div>

      <AverageWarningPanel
        checks={[{ subjectId: "en", periodId: null, ours: 6.84, magister: 6.62, differs: true }]}
      />

      <Button variant="glass" icon={Plug} onClick={() => setRelink(true)}>
        Bekijk de &quot;Opnieuw koppelen&quot;-sheet
      </Button>
      <RelinkSheet
        open={relink}
        onClose={() => setRelink(false)}
        schoolHost="noorderlicht.magister.net"
      />
    </div>
  );
}
