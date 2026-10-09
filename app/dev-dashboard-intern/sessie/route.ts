import { requireAccess } from "@/lib/dev-dashboard/guard";
import { handleLogin } from "@/lib/dev-dashboard/login";
import { scheduleFlush } from "@/lib/stats/server";

/** Inloggen (POST vanuit het formulier). Zie lib/dev-dashboard/login.ts. */
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const config = await requireAccess("inloggen");
  const response = await handleLogin(request, config);
  scheduleFlush();
  return response;
}
