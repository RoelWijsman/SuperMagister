"use client";

import { House, RotateCcw } from "lucide-react";
import { Button, LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { useEffect } from "react";
import { trackError } from "@/lib/stats/client";
import { useCopyParts } from "@/lib/use-copy";

/** Als een pagina een fout gooit: de rest van de app (menu, instellingen) blijft staan. */
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const copy = useCopyParts("fout.pagina");
  // Alleen tellen dát een pagina omviel; de fout zelf gaat nergens heen.
  useEffect(() => trackError("render"), []);
  return (
    <GlassPanel padding="lg" className="mt-6 md:mt-12">
      <EmptyState
        illustration="stekker"
        title={copy?.title ?? "Er ging iets mis."}
        description={copy?.body}
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="primary" icon={RotateCcw} onClick={reset}>
              Opnieuw proberen
            </Button>
            <LinkButton href="/vandaag" variant="glass" icon={House}>
              Naar Vandaag
            </LinkButton>
          </div>
        }
      />
    </GlassPanel>
  );
}
