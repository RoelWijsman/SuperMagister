"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { isModalOpen, isTypingTarget } from "@/lib/hooks";
import { useUi } from "@/stores/ui";
import { NAV_ITEMS } from "./nav";
import { togglePrivacyWithFeedback } from "./PrivacyToggle";

/**
 * Globale sneltoetsen: Ctrl/⌘ K (command palette), 1–7 (pagina's),
 * P (privacymodus) en ? (overzicht). ← → zitten in het rooster zelf.
 */
export function KeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        useUi.getState().togglePalette();
        return;
      }
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
      if (isTypingTarget(event.target) || isModalOpen()) return;

      const page = NAV_ITEMS.find((item) => item.shortcut === event.key);
      if (page) {
        event.preventDefault();
        router.push(page.href);
      } else if (event.key === "p" || event.key === "P") {
        event.preventDefault();
        togglePrivacyWithFeedback();
      } else if (event.key === "?" || (event.code === "Slash" && event.shiftKey)) {
        event.preventDefault();
        useUi.getState().setShortcutsOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  return null;
}
