import type { Metadata } from "next";
import { CollectionView } from "@/components/collection/CollectionView";

export const metadata: Metadata = { title: "Collectie" };

export default function CollectiePage() {
  return <CollectionView />;
}
