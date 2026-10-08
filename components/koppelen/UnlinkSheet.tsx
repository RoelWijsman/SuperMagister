"use client";

import { Unplug } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { useUnlink } from "./useUnlink";

/** Vraagt nog één keer of je echt wilt ontkoppelen, en zegt precies wat er weggaat. */
export function UnlinkSheet({
  open,
  onClose,
  school,
}: {
  open: boolean;
  onClose: () => void;
  school: string;
}) {
  const unlink = useUnlink();
  const [busy, setBusy] = useState(false);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={`Ontkoppelen van ${school}?`}
      description="Alles van je eigen Magister gaat van dit apparaat af. Bij Magister zelf verandert niets."
      size="sm"
    >
      <ul className="list-disc space-y-1.5 pl-5 text-ink-2">
        <li>je koppeling (het token), in alle tabbladen</li>
        <li>je opgehaalde cijfers, rooster, huiswerk en absenties</li>
        <li>je kaarten, vitrine en gokken bij je echte cijfers</li>
        <li>je notities en wat je hebt afgevinkt</li>
      </ul>
      <p className="mt-4 text-sm text-ink-3">
        Je instellingen blijven staan. Koppel je later opnieuw, dan krijg je weer een welkomstpack.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button
          variant="danger"
          icon={Unplug}
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            await unlink();
            setBusy(false);
            onClose();
          }}
        >
          Ontkoppelen
        </Button>
        <Button variant="ghost" onClick={onClose}>
          Toch niet
        </Button>
      </div>
    </Sheet>
  );
}
