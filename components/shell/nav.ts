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
    description: "XP, levels en achievements",
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

/** Welk navigatie-item hoort bij dit pad? */
export function activeNavItem(pathname: string): NavItem | undefined {
  return NAV_ITEMS.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
}
