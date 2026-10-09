import { logoSvg } from "@/lib/brand";

/** Het favicon, gemaakt uit het logo in lib/brand/index.ts. Tijdens het bouwen vastgezet. */
export const dynamic = "force-static";

export function GET() {
  return new Response(logoSvg(), {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
