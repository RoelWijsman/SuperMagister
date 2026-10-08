"use client";

import { Sparkles } from "lucide-react";
import { MiniDay } from "@/components/onboarding/MiniDay";
import { MiniWalkout } from "@/components/onboarding/MiniWalkout";
import { Button } from "@/components/ui/Button";
import { useOnboarding } from "@/stores/onboarding";

/** De mini-animaties van de uitlegkaarten, en een knop om de hele onboarding te zien. */
export function OnboardingSamples() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Pack", node: <MiniWalkout variant="pack" active /> },
          { label: "Gokken", node: <MiniWalkout variant="gok" active /> },
          { label: "Je dag", node: <MiniDay active /> },
        ].map(({ label, node }) => (
          <div key={label} className="flex flex-col items-center gap-2">
            {node}
            <span className="text-xs text-ink-3">{label}</span>
          </div>
        ))}
      </div>
      <Button variant="glass" icon={Sparkles} onClick={() => useOnboarding.getState().restart()}>
        Onboarding bekijken
      </Button>
    </div>
  );
}
