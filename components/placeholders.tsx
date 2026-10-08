"use client";

import { House } from "lucide-react";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { useCopyParts } from "@/lib/use-copy";

/*
 * Pagina's zonder eigen inhoud. Ze staan hier als client-componenten omdat de
 * knoppen een icoon-component meekrijgen.
 */

export function NotFoundContent() {
  const copy = useCopyParts("leeg.404");
  return (
    <GlassPanel padding="lg" className="mt-6 md:mt-12">
      <EmptyState
        illustration="planeet"
        title={copy?.title ?? ""}
        description={copy?.body}
        action={
          <LinkButton href="/vandaag" variant="primary" icon={House}>
            Terug naar Vandaag
          </LinkButton>
        }
      />
    </GlassPanel>
  );
}
