"use client";

import { ExternalLink, Plug } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { useLastUpdated } from "@/lib/data/hooks";
import { useNow } from "@/lib/hooks";
import { formatMoment } from "@/lib/koppelen/format";
import { useCopyParts } from "@/lib/use-copy";

/** Je eigen Magister-startpagina, om daar op de bladwijzer te klikken. */
export const magisterUrl = (schoolHost: string) => `https://${schoolHost}/magister/#/vandaag`;

/**
 * "Opnieuw koppelen": vriendelijk, zonder foutmelding. De laatst opgehaalde
 * data blijft gewoon zichtbaar. Klik je in Magister op de bladwijzer, dan
 * krijgt dit tabblad de nieuwe sessie vanzelf en gaat deze sheet dicht.
 */
export function RelinkSheet({
  open,
  onClose,
  schoolHost,
}: {
  open: boolean;
  onClose: () => void;
  schoolHost: string;
}) {
  const now = useNow(30_000);
  const lastUpdated = useLastUpdated();
  const moment = lastUpdated.data && now ? formatMoment(lastUpdated.data, now) : "eerder";
  const copy = useCopyParts(open ? "koppeling.verlopen" : null, { tijd: moment });

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={copy?.title ?? "Opnieuw koppelen"}
      description={copy?.body}
      size="sm"
    >
      <ol className="space-y-2.5 text-ink-2">
        <li className="flex gap-3">
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-glass-strong text-xs font-bold text-ink">
            1
          </span>
          Open Magister en log in als dat nodig is.
        </li>
        <li className="flex gap-3">
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-glass-strong text-xs font-bold text-ink">
            2
          </span>
          Klik daar op je SuperMagister-bladwijzer. Dit tabblad werkt zich daarna vanzelf bij.
        </li>
      </ol>
      <div className="mt-6 flex flex-wrap gap-3">
        <a
          href={magisterUrl(schoolHost)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 items-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--sm-accent),var(--sm-accent-2))] px-5 font-semibold text-on-accent shadow-[0_10px_28px_-10px_color-mix(in_oklab,var(--sm-accent)_75%,transparent)]"
        >
          <ExternalLink size={18} strokeWidth={2.2} aria-hidden />
          Open Magister
        </a>
        <Button variant="ghost" onClick={onClose}>
          Later
        </Button>
      </div>
      <p className="mt-5 text-sm text-ink-3">
        Geen bladwijzer meer?{" "}
        <Link
          href="/koppelen"
          onClick={onClose}
          className="text-accent-ink underline-offset-2 hover:underline"
        >
          <Plug size={13} aria-hidden className="mr-1 inline" />
          Koppel opnieuw
        </Link>
      </p>
    </Sheet>
  );
}
