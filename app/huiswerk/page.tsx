import type { Metadata } from "next";
import { Suspense } from "react";
import { HomeworkView } from "@/components/homework/HomeworkView";

export const metadata: Metadata = { title: "Huiswerk" };

export default function HuiswerkPage() {
  return (
    <Suspense>
      <HomeworkView />
    </Suspense>
  );
}
