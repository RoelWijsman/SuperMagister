import { proxyToMagister } from "@/lib/magister/proxy";

/**
 * Proxy naar Magister: alleen GET, alleen naar {school}.magister.net, logt
 * nooit tokens en slaat niets op. Zie lib/magister/proxy.ts.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return proxyToMagister(request, path);
}
