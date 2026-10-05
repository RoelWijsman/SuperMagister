"use client";

import { motion } from "framer-motion";
import { Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Kbd } from "@/components/ui/Kbd";
import { cn } from "@/lib/cn";
import { useIsApple } from "@/lib/hooks";
import { useUi } from "@/stores/ui";
import { DataSourceChip } from "./DataSourceChip";
import { Logo } from "./Logo";
import { activeNavItem, NAV_ITEMS, type NavItem } from "./nav";
import { PrivacyToggle } from "./PrivacyToggle";

function SidebarLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <li>
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        title={`${item.label} (${item.shortcut})`}
        className={cn(
          "group relative flex h-11 items-center gap-3 rounded-2xl px-3 text-[0.9375rem] font-medium transition-colors md:justify-center lg:justify-start",
          active ? "text-ink" : "text-ink-2 hover:bg-glass hover:text-ink",
        )}
      >
        {active && (
          <motion.span
            layoutId="sidebar-active"
            className="absolute inset-0 rounded-2xl bg-[color-mix(in_oklab,var(--sm-accent)_17%,transparent)] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--sm-accent)_32%,transparent),0_8px_24px_-14px_var(--sm-accent)]"
            transition={{ type: "spring", stiffness: 480, damping: 38 }}
          />
        )}
        <Icon
          size={20}
          strokeWidth={active ? 2.4 : 2}
          aria-hidden
          className={cn("relative shrink-0", active && "text-accent-ink")}
        />
        <span className="relative hidden lg:inline">{item.label}</span>
        <Kbd className="relative ml-auto hidden opacity-0 transition-opacity group-hover:opacity-100 lg:inline-flex">
          {item.shortcut}
        </Kbd>
      </Link>
    </li>
  );
}

/** Zwevende glazen zijbalk voor tablet en desktop. */
export function Sidebar() {
  const pathname = usePathname();
  const active = activeNavItem(pathname);
  const openPalette = useUi((s) => s.setPaletteOpen);
  const isApple = useIsApple();
  const main = NAV_ITEMS.filter((item) => item.href !== "/instellingen");
  const settings = NAV_ITEMS.find((item) => item.href === "/instellingen");

  return (
    <aside className="fixed inset-y-3 left-3 z-30 hidden w-[var(--sidebar-w)] md:flex lg:inset-y-4 lg:left-4">
      <nav aria-label="Hoofdmenu" className="flex w-full flex-col rounded-panel glass p-3">
        <Link
          href="/vandaag"
          aria-label="SuperMagister, naar Vandaag"
          className="mb-4 flex items-center justify-center rounded-2xl p-1.5 lg:justify-start"
        >
          <Logo compact className="lg:hidden" />
          <Logo className="hidden lg:flex" />
        </Link>

        <button
          type="button"
          onClick={() => openPalette(true)}
          aria-label="Zoeken of een commando typen"
          className="mb-4 flex h-11 items-center gap-2.5 rounded-2xl border border-line bg-glass px-3 text-sm text-ink-3 transition-colors hover:border-line-strong hover:text-ink-2 md:justify-center lg:justify-start"
        >
          <Search size={18} strokeWidth={2.2} aria-hidden className="shrink-0" />
          <span className="hidden lg:inline">Zoeken…</span>
          <span className="ml-auto hidden items-center gap-1 lg:flex">
            <Kbd>{isApple ? "⌘" : "Ctrl"}</Kbd>
            <Kbd>K</Kbd>
          </span>
        </button>

        <ul className="flex flex-col gap-1">
          {main.map((item) => (
            <SidebarLink key={item.href} item={item} active={active?.href === item.href} />
          ))}
        </ul>

        <div className="mt-auto flex flex-col gap-3">
          <div className="flex flex-col items-center gap-2 lg:flex-row lg:justify-between lg:px-1.5">
            <DataSourceChip className="lg:hidden" compact />
            <DataSourceChip className="hidden lg:inline-flex" />
            <PrivacyToggle />
          </div>
          {settings && (
            <ul>
              <SidebarLink item={settings} active={active?.href === settings.href} />
            </ul>
          )}
        </div>
      </nav>
    </aside>
  );
}
