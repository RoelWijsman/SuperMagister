import type { Metadata } from "next";
import { ConnectPlaceholder } from "@/components/placeholders";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "Koppelen" };

export default function KoppelenPage() {
  return (
    <>
      <PageHeader eyebrow="Fase 5" title="Koppelen met Magister" />
      <ConnectPlaceholder />
    </>
  );
}
