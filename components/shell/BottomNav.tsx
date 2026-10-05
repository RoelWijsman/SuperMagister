"use client";

import { motion } from "framer-motion";
import { LayoutGrid, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useUi } from "@/stores/ui";
import { activeNavItem, NAV_ITEMS } from "./nav";

function Item({
  icon: Icon,
  label,
  active,
  children,
}: {
  icon: LucideIcon;
  label: string;
  active: boolean;
  children: (content: ReactNode, className: string) => ReactNode;
}) {
  const content = (
    <>
      {active && (
        <motion.span
          layoutId="bottom-nav-active"
          className="absolute inset-0.5 rounded-[1.15rem] bg-[color-mix(in_oklab,var(--sm-accent)_18%,transparent)] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--sm-accent)_30%,transparent)]"
          transition={{ type: "spring", stiffness: 520, damping: 40 }}
        />
      )}
      <motion.span
        whileTap={{ scale: 0.86 }}
        className="relative flex flex-col items-center gap-0.5"
      >
        <Icon
          size={22}
          strokeWidth={active ? 2.4 : 2}
          aria-hidden
          className={cn(active && "text-accent-ink")}
        />
        <span className="text-[0.6875rem] leading-none font-semibold">{label}</span>
      </motion.span>
    </>
  );
  return (
    <li className="flex-1">
      {children(
        content,
        cn(
          "relative flex h-14 w-full items-center justify-center rounded-[1.2rem] transition-colors",
          active ? "text-ink" : "text-ink-3",
        ),
      )}
    </li>
  );
}

/** Bottom-nav voor mobiel: vier vaste tabs en "Meer". */
export function BottomNav() {
  const pathname = usePathname();
  const active = activeNavItem(pathname);
  const moreOpen = useUi((s) => s.moreOpen);
  const setMoreOpen = useUi((s) => s.setMoreOpen);
  const primary = NAV_ITEMS.filter((item) => item.primary);
  const moreActive = moreOpen || (!active?.primary && pathname !== "/");

  return (
    <nav
      aria-label="Hoofdmenu"
      className="fixed inset-x-3 bottom-[calc(0.6rem+env(safe-area-inset-bottom))] z-30 md:hidden"
    >
      <ul className="mx-auto flex max-w-md items-stretch rounded-[1.6rem] glass-strong p-1">
        {primary.map((item) => {
          const isActive = !moreOpen && active?.href === item.href;
          return (
            <Item key={item.href} icon={item.icon} label={item.label} active={isActive}>
              {(content, className) => (
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={className}
                >
                  {content}
                </Link>
              )}
            </Item>
          );
        })}
        <Item icon={LayoutGrid} label="Meer" active={moreActive}>
          {(content, className) => (
            <button
              type="button"
              aria-haspopup="dialog"
              aria-expanded={moreOpen}
              onClick={() => setMoreOpen(true)}
              className={className}
            >
              {content}
            </button>
          )}
        </Item>
      </ul>
    </nav>
  );
}
