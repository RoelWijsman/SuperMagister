"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/** `true` zodra we in de browser renderen (na hydratie), `false` op de server. */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

/** Live media query, bijv. `useMediaQuery("(min-width: 768px)")`. Op de server `false`. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** De huidige tijd, ververst elke `intervalMs`. Op de server en tijdens hydratie `null`. */
export function useNow(intervalMs = 30_000): Date | null {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, intervalMs);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [intervalMs]);
  return now;
}

let lockCount = 0;

/** Staat er nu een modale laag open (sheet, command palette)? */
export const isModalOpen = () => lockCount > 0;

/** Draait de app op een Mac/iPhone/iPad? Dan tonen we ⌘ in plaats van Ctrl. */
export function useIsApple(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => /Mac|iPhone|iPad/.test(navigator.userAgent),
    () => false,
  );
}

/** Typt de gebruiker ergens? Dan reageren sneltoetsen niet. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

/**
 * Voor modale lagen: zet de rest van de app op `inert` (geen focus, geen
 * klikken) en blokkeert scrollen. Werkt ook met meerdere lagen tegelijk.
 */
export function useModalLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const root = document.getElementById("app-root");
    lockCount++;
    root?.setAttribute("inert", "");
    document.documentElement.style.overflow = "hidden";
    return () => {
      lockCount = Math.max(0, lockCount - 1);
      if (lockCount === 0) {
        root?.removeAttribute("inert");
        document.documentElement.style.overflow = "";
      }
    };
  }, [active]);
}

/** Houdt Tab binnen `container` en zet focus terug als de laag sluit. */
export function useFocusTrap(active: boolean, container: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!active) return;
    const previous = document.activeElement as HTMLElement | null;
    const node = container.current;
    const focusables = () =>
      Array.from(
        node?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), textarea, select, [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );

    const first = setTimeout(() => {
      if (node && !node.contains(document.activeElement)) (focusables()[0] ?? node).focus();
    }, 30);

    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !node) return;
      const items = focusables();
      if (items.length === 0) return;
      const firstItem = items[0]!;
      const lastItem = items[items.length - 1]!;
      if (event.shiftKey && document.activeElement === firstItem) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault();
        firstItem.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(first);
      document.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
  }, [active, container]);
}
