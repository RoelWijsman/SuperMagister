import type { Metadata } from "next";
import { AchievementsPlaceholder } from "@/components/placeholders";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "Prestaties" };

export default function PrestatiesPage() {
  return (
    <>
      <PageHeader eyebrow="XP, levels en achievements" title="Prestaties" />
      <AchievementsPlaceholder />
    </>
  );
}
