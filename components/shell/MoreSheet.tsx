"use client";

import { Plug, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { Sheet } from "@/components/ui/Sheet";
import { Switch } from "@/components/ui/Switch";
import { useUi } from "@/stores/ui";
import { NAV_ITEMS } from "./nav";
import { togglePrivacyWithFeedback } from "./PrivacyToggle";

interface Tile {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

const EXTRA_TILES: readonly Tile[] = [
  { href: "/koppelen", label: "Koppelen", description: "Je eigen Magister", icon: Plug },
];

/** "Meer"-menu op mobiel: de pagina's die niet in de bottom-nav passen. */
export function MoreSheet() {
  const open = useUi((s) => s.moreOpen);
  const setOpen = useUi((s) => s.setMoreOpen);
  const privacy = useUi((s) => s.privacy);
  const tiles: Tile[] = [...NAV_ITEMS.filter((item) => !item.primary), ...EXTRA_TILES];

  return (
    <Sheet open={open} onClose={() => setOpen(false)} title="Meer">
      <ul className="grid grid-cols-2 gap-3">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <li key={tile.href}>
              <Link
                href={tile.href}
                onClick={() => setOpen(false)}
                className="flex h-full flex-col gap-3 rounded-3xl glass p-4 transition-transform active:scale-[0.97]"
              >
                <span className="grid size-10 place-items-center rounded-2xl bg-[color-mix(in_oklab,var(--sm-accent)_18%,transparent)] text-accent-ink">
                  <Icon size={20} strokeWidth={2.2} aria-hidden />
                </span>
                <span>
                  <span className="block font-semibold text-ink">{tile.label}</span>
                  <span className="block text-sm text-ink-2">{tile.description}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="mt-4 rounded-3xl border border-line px-4 py-1">
        <Switch
          checked={privacy}
          onCheckedChange={() => togglePrivacyWithFeedback()}
          label="Privacymodus"
          description="Vervaagt al je cijfers"
        />
      </div>
    </Sheet>
  );
}
