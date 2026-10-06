import type { Metadata } from "next";
import { StyleguideView } from "@/components/styleguide/StyleguideView";

// Ontwikkelaarspagina: niet in de navigatie, alleen via /stijlgids of Instellingen > Ontwikkelaar.
export const metadata: Metadata = { title: "Stijlgids", robots: { index: false, follow: false } };

export default function StijlgidsPage() {
  return <StyleguideView />;
}
