import type { Metadata } from "next";
import { TodayView } from "@/components/today/TodayView";

export const metadata: Metadata = {
  title: "Vandaag",
  // De voorkant van de site (/ stuurt hierheen): mag in zoekmachines.
  robots: { index: true, follow: true },
  alternates: { canonical: "/vandaag" },
};

export default function VandaagPage() {
  return <TodayView />;
}
