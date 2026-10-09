import type { Metadata } from "next";
import { Suspense } from "react";
import { CollectionView } from "@/components/collection/CollectionView";

export const metadata: Metadata = { title: "Collectie" };

export default function CollectiePage() {
  // Suspense: het tabblad (album of elftal) komt uit het adres (?tab=elftal).
  return (
    <Suspense>
      <CollectionView />
    </Suspense>
  );
}
