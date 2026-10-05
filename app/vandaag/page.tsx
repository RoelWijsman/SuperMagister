import type { Metadata } from "next";
import { TodayView } from "@/components/today/TodayView";

export const metadata: Metadata = { title: "Vandaag" };

export default function VandaagPage() {
  return <TodayView />;
}
