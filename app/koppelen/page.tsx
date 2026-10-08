import type { Metadata } from "next";
import { ConnectView } from "@/components/koppelen/ConnectView";

export const metadata: Metadata = { title: "Koppelen" };

export default function KoppelenPage() {
  return <ConnectView />;
}
