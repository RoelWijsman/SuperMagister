import type { Metadata } from "next";
import { AchievementsView } from "@/components/achievements/AchievementsView";

export const metadata: Metadata = { title: "Prestaties" };

export default function PrestatiesPage() {
  return <AchievementsView />;
}
