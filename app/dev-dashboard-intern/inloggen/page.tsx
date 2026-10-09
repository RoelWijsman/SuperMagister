import type { Metadata } from "next";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { requireAccess } from "@/lib/dev-dashboard/guard";
import { LOGIN_LIMIT, LOGIN_WINDOW_MS } from "@/lib/dev-dashboard/login";

/** Inloggen op het dashboard. Alleen te zien met de juiste ?key= (zie proxy.ts). */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Inloggen",
  robots: { index: false, follow: false, nocache: true },
};

const MESSAGES: Record<string, string> = {
  fout: "Dat wachtwoord klopt niet.",
  "te-vaak": `Te vaak geprobeerd. Wacht ${LOGIN_WINDOW_MS / 60_000} minuten (maximaal ${LOGIN_LIMIT} pogingen).`,
};

export default async function DevLoginPage({
  searchParams,
}: PageProps<"/dev-dashboard-intern/inloggen">) {
  const config = await requireAccess("inloggen");
  const params = await searchParams;
  const key = typeof params.key === "string" ? params.key : "";
  const message = typeof params.fout === "string" ? MESSAGES[params.fout] : undefined;

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <GlassPanel padding="lg" className="w-full max-w-sm">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">Inloggen</h1>
        <p className="mt-1 text-sm text-ink-2">Alleen voor de maker.</p>
        <form
          method="post"
          action={`${config.path}/sessie?key=${encodeURIComponent(key)}`}
          className="mt-6 space-y-4"
        >
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink">Wachtwoord</span>
            <input
              type="password"
              name="wachtwoord"
              required
              autoFocus
              autoComplete="current-password"
              className="w-full rounded-xl border border-line-strong bg-glass-strong px-3.5 py-2.5 text-ink outline-none focus-visible:ring-2 focus-visible:ring-[var(--sm-accent)]"
            />
          </label>
          {message && (
            <p role="alert" className="text-sm text-bad">
              {message}
            </p>
          )}
          <button
            type="submit"
            className="w-full rounded-full bg-[linear-gradient(135deg,var(--sm-accent),var(--sm-accent-2))] px-4 py-2.5 font-semibold text-white"
          >
            Inloggen
          </button>
        </form>
      </GlassPanel>
    </main>
  );
}
