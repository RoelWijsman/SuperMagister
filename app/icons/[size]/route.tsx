import { ImageResponse } from "next/og";
import { AppIcon } from "@/lib/brand/marks";

/**
 * PNG-iconen voor het PWA-manifest: /icons/192, /icons/512 en
 * /icons/maskable (512, met de kleur tot de rand). Gemaakt tijdens het bouwen.
 */
const ICONS = {
  "192": { size: 192, bleed: false },
  "512": { size: 512, bleed: false },
  maskable: { size: 512, bleed: true },
} as const;

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(ICONS).map((size) => ({ size }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size } = await params;
  const icon = ICONS[size as keyof typeof ICONS];
  if (!icon) return new Response("Niet gevonden", { status: 404 });
  return new ImageResponse(<AppIcon size={icon.size} bleed={icon.bleed} />, {
    width: icon.size,
    height: icon.size,
    headers: { "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
