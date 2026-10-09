"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useIsClient } from "@/lib/hooks";
import { track } from "@/lib/stats/client";
import { isReturningUser, useOnboarding } from "@/stores/onboarding";

/** De laag zelf (intro, uitleg, mini-walkouts) laadt pas als de onboarding echt open gaat. */
const OnboardingLayer = dynamic(() => import("./Onboarding").then((m) => m.OnboardingLayer), {
  ssr: false,
});

/** Pagina's die je altijd moet kunnen lezen, ook midden in de onboarding (de privacylink). */
const NO_ONBOARDING = ["/privacy"];

/**
 * De onboarding: de eerste keer dat je SuperMagister opent. Een laag over de
 * app (onder de walkout), met een intro, drie uitlegkaarten, je thema, je
 * woonplaats, koppelen met de bladwijzer en je welkomstpack. Vegen op mobiel,
 * pijltjes en Enter op desktop, en altijd "Overslaan". Wie de app al gebruikte,
 * krijgt hem niet vanzelf (wel via Instellingen).
 */
export function OnboardingGate() {
  const isClient = useIsClient();
  const status = useOnboarding((s) => s.status);
  const hidden = NO_ONBOARDING.includes(usePathname());

  // De eerste keer: beginnen, behalve voor wie de app al gebruikte.
  useEffect(() => {
    if (!isClient || hidden) return;
    const state = useOnboarding.getState();
    if (state.status !== "nieuw") return;
    let keys: string[] = [];
    try {
      keys = Object.keys(window.localStorage);
    } catch {
      // Geen opslag: dan gewoon beginnen.
    }
    if (isReturningUser(keys)) state.finish();
    else {
      state.begin();
      track("onboarding-gestart");
    }
  }, [isClient, hidden]);

  return isClient && !hidden && status === "bezig" ? <OnboardingLayer /> : null;
}
