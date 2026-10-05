import type { Metadata } from "next";
import { CollectionPlaceholder } from "@/components/placeholders";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "Collectie" };

export default function CollectiePage() {
  return (
    <>
      <PageHeader eyebrow="Je verzamelkaarten" title="Collectie" />
      <CollectionPlaceholder />
    </>
  );
}
