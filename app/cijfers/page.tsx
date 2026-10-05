import type { Metadata } from "next";
import { Suspense } from "react";
import { GradesView } from "@/components/grades/GradesView";

export const metadata: Metadata = { title: "Cijfers" };

export default function CijfersPage() {
  return (
    <Suspense>
      <GradesView />
    </Suspense>
  );
}
