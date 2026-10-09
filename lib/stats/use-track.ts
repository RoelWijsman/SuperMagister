"use client";

import { useEffect } from "react";
import { track } from "./client";
import type { StatEvent } from "./events";

/** Telt een event elke keer dat iets opengaat (bijv. een sheet). */
export function useTrackOpen(open: boolean, event: StatEvent) {
  useEffect(() => {
    if (open) track(event);
  }, [open, event]);
}
