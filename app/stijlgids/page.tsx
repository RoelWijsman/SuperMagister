import type { Metadata } from "next";
import { StyleguideView } from "@/components/styleguide/StyleguideView";

export const metadata: Metadata = { title: "Stijlgids" };

export default function StijlgidsPage() {
  return <StyleguideView />;
}
