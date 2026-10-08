import {
  CalendarDays,
  ChartColumn,
  GalleryVerticalEnd,
  House,
  ListChecks,
  Settings,
  Trophy,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Sneltoets 1–7. */
  shortcut: string;
  /** Staat in de bottom-nav op mobiel; de rest zit onder "Meer". */
  primary: boolean;
  description: string;
  /** Alleen zichtbaar als prestaties en XP aan staan (Instellingen > Ontwikkelaar). */
  gamification?: boolean;
}

export const NAV_ITEMS: readonly NavItem[] = [
  {
    href: "/vandaag",
    label: "Vandaag",
    icon: House,
    shortcut: "1",
    primary: true,
    description: "Je dag in één oogopslag",
  },
  {
    href: "/rooster",
    label: "Rooster",
    icon: CalendarDays,
    shortcut: "2",
    primary: true,
    description: "Lessen, uitval en lokalen",
  },
  {
    href: "/huiswerk",
    label: "Huiswerk",
    icon: ListChecks,
    shortcut: "3",
    primary: true,
    description: "Wat moet er af, en wanneer",
  },
  {
    href: "/cijfers",
    label: "Cijfers",
    icon: ChartColumn,
    shortcut: "4",
    primary: true,
    description: "Gemiddeldes per vak",
  },
  {
    href: "/collectie",
    label: "Collectie",
    icon: GalleryVerticalEnd,
    shortcut: "5",
    primary: false,
    description: "Je verzamelkaarten",
  },
  {
    href: "/prestaties",
    label: "Prestaties",
    icon: Trophy,
    shortcut: "6",
    primary: false,
    description: "Je prestaties met gokken",
    gamification: true,
  },
  {
    href: "/instellingen",
    label: "Instellingen",
    icon: Settings,
    shortcut: "7",
    primary: false,
    description: "Thema, vakken en meer",
  },
];

/**
 * De pagina's die je nu ziet. Staan prestaties uit, dan verdwijnt die pagina
 * uit de navigatie en schuiven de sneltoetsen op (1 t/m 6, zonder gat).
 */
export function visibleNavItems(gamification: boolean): NavItem[] {
  return NAV_ITEMS.filter((item) => gamification || !item.gamification).map((item, index) => ({
    ...item,
    shortcut: String(index + 1),
  }));
}

/** Welk navigatie-item hoort bij dit pad? */
export function activeNavItem(pathname: string): NavItem | undefined {
  return NAV_ITEMS.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
}
