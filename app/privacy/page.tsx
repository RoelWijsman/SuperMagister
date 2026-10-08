import type { Metadata } from "next";
import { PrivacyView } from "@/components/legal/PrivacyView";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "Welke gegevens SuperMagister gebruikt, waar ze blijven (op je eigen apparaat) en wat de server wel en niet doet.",
  robots: { index: true, follow: true },
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return <PrivacyView />;
}
