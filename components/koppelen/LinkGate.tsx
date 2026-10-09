"use client";

import { BookOpen, Plug } from "lucide-react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Button, LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { useIsClient } from "@/lib/hooks";
import { useConnection } from "@/stores/connection";
import { useOnboarding } from "@/stores/onboarding";
import { DemoButton } from "./Demo";

/** Pagina's die ook zonder koppeling werken. */
const OPEN_PAGES = ["/koppelen", "/instellingen", "/privacy", "/stijlgids"];

/**
 * Zonder koppeling (en zonder demo) vraagt elke pagina met schooldata om je
 * Magister te koppelen, of eerst de demo te proberen. Koppelen, Instellingen, Privacy en de stijlgids blijven open.
 */
export function LinkGate({ children }: { children: ReactNode }) {
  const isClient = useIsClient();
  const pathname = usePathname();
  const linked = useConnection((s) => s.account !== null || s.demo);
  const open = OPEN_PAGES.some((page) => pathname === page || pathname.startsWith(`${page}/`));
  if (open || (isClient && linked)) return children;
  // Op de server weten we nog niet of je gekoppeld bent (dat staat in je browser). Een lege
  // plek in plaats van de hele pagina: scheelt veel werk bij het laden, en wie niet gekoppeld
  // is, krijgt meteen de koppeluitleg in plaats van een pagina die direct weer verdwijnt.
  if (!isClient) return <div aria-busy="true" className="min-h-[60vh]" />;

  return (
    <GlassPanel padding="lg" className="mt-6 md:mt-12">
      <EmptyState
        illustration="stekker"
        level={1}
        title="Koppel je Magister"
        description="SuperMagister laat je eigen rooster, huiswerk en cijfers zien. Koppelen gaat met een bladwijzer en kost een minuut. Je wachtwoord komt hier nooit."
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <LinkButton href="/koppelen" variant="primary" icon={Plug}>
              Koppelen
            </LinkButton>
            <DemoButton />
            <Button
              variant="ghost"
              icon={BookOpen}
              onClick={() => useOnboarding.getState().restart()}
            >
              Uitleg bekijken
            </Button>
          </div>
        }
      />
    </GlassPanel>
  );
}
