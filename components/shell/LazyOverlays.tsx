"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useUi } from "@/stores/ui";
import { useWalkout } from "@/stores/walkout";

/*
 * De grote lagen (walkout, command palette, sheets) laden pas als ze voor het
 * eerst nodig zijn. Dat scheelt een flink stuk JavaScript bij het openen van
 * de app. Zodra de pagina rustig is, halen we de walkout en de palette alvast
 * op de achtergrond binnen, zodat de eerste keer openen niet trager voelt.
 * Eenmaal geladen blijven ze staan, zodat ook de sluitanimatie gewoon speelt.
 */

const loadWalkout = () => import("@/components/walkout/WalkoutOverlay");
const loadPalette = () => import("@/components/command/CommandPalette");

const WalkoutOverlay = dynamic(() => loadWalkout().then((m) => m.WalkoutOverlay), {
  ssr: false,
});
const CommandPalette = dynamic(() => loadPalette().then((m) => m.CommandPalette), {
  ssr: false,
});
const ShortcutsSheet = dynamic(
  () => import("@/components/shell/ShortcutsSheet").then((m) => m.ShortcutsSheet),
  { ssr: false },
);
const MoreSheet = dynamic(() => import("@/components/shell/MoreSheet").then((m) => m.MoreSheet), {
  ssr: false,
});

/** Wordt true zodra `now` één keer true was, en blijft dat. */
function useOnce(now: boolean): boolean {
  const [seen, setSeen] = useState(now);
  // Bijwerken tijdens het renderen mag hier (het verandert maar één keer).
  if (now && !seen) setSeen(true);
  return seen || now;
}

/** Op de achtergrond alvast binnenhalen, als de browser niets beters te doen heeft. */
function usePreload(loaders: (() => Promise<unknown>)[]) {
  useEffect(() => {
    const run = () => loaders.forEach((load) => void load().catch(() => undefined));
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(run, { timeout: 8000 });
      return () => window.cancelIdleCallback(id);
    }
    const timer = setTimeout(run, 4000);
    return () => clearTimeout(timer);
    // De loaders veranderen nooit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/** Command palette en sheets. */
export function LazyOverlays() {
  const palette = useOnce(useUi((s) => s.paletteOpen));
  const shortcuts = useOnce(useUi((s) => s.shortcutsOpen));
  const more = useOnce(useUi((s) => s.moreOpen));
  usePreload([loadWalkout, loadPalette]);

  return (
    <>
      {palette && <CommandPalette />}
      {shortcuts && <ShortcutsSheet />}
      {more && <MoreSheet />}
    </>
  );
}

/** De walkout, boven alles (ook boven de onboarding). */
export function LazyWalkout() {
  const walkout = useOnce(useWalkout((s) => s.session !== null));
  return walkout ? <WalkoutOverlay /> : null;
}
