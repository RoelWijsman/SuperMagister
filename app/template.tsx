"use client";

import { motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { NAV_ITEMS } from "@/components/shell/nav";

/** Index van de vorige pagina in het menu, om de schuifrichting te bepalen. */
let previousIndex = -1;
/** Pas na de eerste mount animeren: de eerste paint moet meteen zichtbaar zijn. */
let hasMounted = false;

const indexOf = (pathname: string) =>
  NAV_ITEMS.findIndex((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));

/**
 * Paginatransitie. Een template krijgt bij elke navigatie een nieuwe key, dus
 * deze animatie speelt elke keer. Naar een pagina verderop in het menu schuift
 * de inhoud van rechts in, terug van links. Bij minder beweging: alleen een fade.
 * Bij het allereerste laden animeren we niet, zodat de server-HTML direct
 * zichtbaar is (snellere eerste paint).
 */
export default function Template({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduced = useReducedMotion();
  const [animateIn] = useState(() => hasMounted);
  const index = indexOf(pathname);
  const direction = previousIndex < 0 || index < 0 ? 0 : Math.sign(index - previousIndex);

  useEffect(() => {
    hasMounted = true;
    previousIndex = index;
  }, [index]);

  const initial = !animateIn
    ? false
    : reduced
      ? { opacity: 0 }
      : { opacity: 0, x: direction * 28, y: direction === 0 ? 12 : 0 };

  return (
    <motion.div
      initial={initial}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ type: "spring", stiffness: 360, damping: 34, opacity: { duration: 0.22 } }}
    >
      {children}
    </motion.div>
  );
}
