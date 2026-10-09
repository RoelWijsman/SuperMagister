import { requireAccess } from "@/lib/dev-dashboard/guard";
import { handleLogout } from "@/lib/dev-dashboard/login";

/** Uitloggen: het sessiecookie weg, terug naar de voorkant. */
export const dynamic = "force-dynamic";

export async function POST() {
  const config = await requireAccess("dashboard");
  return handleLogout(config);
}
