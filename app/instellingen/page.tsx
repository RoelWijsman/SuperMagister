import type { Metadata } from "next";
import { SettingsView } from "@/components/settings/SettingsView";

export const metadata: Metadata = { title: "Instellingen" };

export default function InstellingenPage() {
  return <SettingsView />;
}
