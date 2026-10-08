"use client";

import { useMemo } from "react";
import { useGamification } from "@/lib/use-gamification";
import { visibleNavItems } from "./nav";

/** De pagina's in de navigatie, met de juiste sneltoetsen. */
export function useNavItems() {
  const gamification = useGamification();
  return useMemo(() => visibleNavItems(gamification), [gamification]);
}
