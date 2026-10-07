import type { Metadata } from "next";
import { SubjectDetailView } from "@/components/grades/SubjectDetailView";

export const metadata: Metadata = { title: "Vak" };

export default async function VakPage({ params }: { params: Promise<{ vak: string }> }) {
  const { vak } = await params;
  return <SubjectDetailView subjectId={decodeURIComponent(vak)} />;
}
