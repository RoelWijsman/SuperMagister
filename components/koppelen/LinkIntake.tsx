"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { parseLinkFragment } from "@/lib/koppelen/fragment";
import { completeLink, failLink } from "@/lib/koppelen/link";

/**
 * Leest het koppel-fragment van de bookmarklet (…/koppelen#koppel=1&token=…)
 * en wist het meteen uit de adresbalk en de geschiedenis, nog vóór er iets
 * anders gebeurt. Daarna koppelt hij, en zie je op /koppelen hoe het ging.
 */
export function LinkIntake() {
  const router = useRouter();

  useEffect(() => {
    const { hash, pathname, search } = window.location;
    const parsed = parseLinkFragment(hash, Date.now());
    if (parsed.kind === "geen") return;
    // Het token hoort niet in de adresbalk, de geschiedenis of op een screenshot.
    window.history.replaceState(window.history.state, "", pathname + search);
    if (pathname !== "/koppelen") router.push("/koppelen");
    if (parsed.kind === "ongeldig") failLink("bookmarklet", parsed.reason);
    else void completeLink(parsed.session, "bookmarklet");
  }, [router]);

  return null;
}
