import type { Metadata } from "next";
import { Suspense } from "react";
import { ScheduleView } from "@/components/schedule/ScheduleView";

export const metadata: Metadata = { title: "Rooster" };

export default function RoosterPage() {
  return (
    <Suspense>
      <ScheduleView />
    </Suspense>
  );
}
