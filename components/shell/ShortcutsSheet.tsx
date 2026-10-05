"use client";

import { Kbd } from "@/components/ui/Kbd";
import { Sheet } from "@/components/ui/Sheet";
import { useIsApple } from "@/lib/hooks";
import { useUi } from "@/stores/ui";
import { NAV_ITEMS } from "./nav";

function Row({ keys, label, soon }: { keys: string[]; label: string; soon?: string }) {
  return (
    <li className="flex items-center justify-between gap-4 py-2.5">
      <span className={soon ? "text-ink-3" : "text-ink"}>
        {label}
        {soon && <span className="ml-2 text-xs">({soon})</span>}
      </span>
      <span className="flex shrink-0 gap-1">
        {keys.map((key) => (
          <Kbd key={key}>{key}</Kbd>
        ))}
      </span>
    </li>
  );
}

/** Overzicht van alle sneltoetsen (toets ?). */
export function ShortcutsSheet() {
  const open = useUi((s) => s.shortcutsOpen);
  const setOpen = useUi((s) => s.setShortcutsOpen);
  const isApple = useIsApple();

  return (
    <Sheet open={open} onClose={() => setOpen(false)} title="Sneltoetsen" size="sm">
      <ul className="divide-y divide-line">
        <Row keys={[isApple ? "⌘" : "Ctrl", "K"]} label="Zoeken en commando's" />
        {NAV_ITEMS.map((item) => (
          <Row key={item.href} keys={[item.shortcut]} label={item.label} />
        ))}
        <Row keys={["P"]} label="Privacymodus aan/uit" />
        <Row keys={["?"]} label="Dit overzicht" />
        <Row keys={["Esc"]} label="Sluiten" />
        <Row keys={["←", "→"]} label="Vorige / volgende dag" soon="fase 3" />
        <Row keys={["F"]} label="Focusmodus" soon="fase 3" />
      </ul>
    </Sheet>
  );
}
