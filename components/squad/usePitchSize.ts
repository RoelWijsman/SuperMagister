"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { fitCardWidth, type PitchSize } from "@/lib/squad/layout";

/** Verhouding van het veld op een telefoon (breedte : hoogte), zoals een echt veld. */
const PHONE_RATIO = 68 / 92;
/** Op een computer mag het veld iets breder zijn dan hoog: dan passen grotere kaartjes. */
const WIDE_MAX_RATIO = 1.05;

/**
 * De maat van het veld en de kaartjes. Op een tablet of computer (`fit`) past
 * het hele veld in de hoogte van het scherm, vanaf waar het begint; op een
 * telefoon is het zo breed als de pagina. Gemeten met een ResizeObserver op het veld en op
 * de pagina (verandert er iets erboven, dan schuift het begin mee).
 */
export function usePitchSize(fit: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<PitchSize | null>(null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => {
      const available = element.clientWidth;
      if (!available) return;
      let width: number;
      let height: number;
      if (fit) {
        const top = element.getBoundingClientRect().top + window.scrollY;
        height = Math.round(Math.min(900, Math.max(440, window.innerHeight - top - 20)));
        width = Math.min(available, Math.round(height * WIDE_MAX_RATIO));
      } else {
        width = available;
        height = Math.round(width / PHONE_RATIO);
      }
      setSize((previous) =>
        previous && previous.width === width && previous.height === height
          ? previous
          : { width, height },
      );
    };
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    const page = element.closest("main");
    if (page) observer.observe(page);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [fit]);

  return { ref, size, cardWidth: size ? fitCardWidth(size) : 0 };
}
