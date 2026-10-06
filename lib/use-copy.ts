"use client";

import { createElement, Fragment, useState, type ReactNode } from "react";
import type { CopyKey } from "@/content/copy";
import { fillCopy, pickCopy, splitCopy, splitPlaceholders, type CopyVars } from "./copy";
import { useIsClient } from "./hooks";

/**
 * Kiest één variant van een tekst en houdt die vast zolang het component
 * leeft en de situatie (sleutel) gelijk blijft. Op de server en tijdens
 * hydratie: `null`, zodat er geen verschil ontstaat tussen server en browser.
 */
export function useCopy(key: CopyKey | null | undefined, vars?: CopyVars): string | null {
  const isClient = useIsClient();
  const [picked, setPicked] = useState<{ key: CopyKey; text: string } | null>(null);

  // Nieuwe situatie: nieuwe variant (state bijwerken tijdens render mag hier).
  if (isClient && key && picked?.key !== key) {
    setPicked({ key, text: pickCopy(key) });
  }

  if (!isClient || !key || !picked || picked.key !== key) return null;
  return fillCopy(picked.text, vars);
}

/**
 * Zoals useCopy, maar sommige variabelen worden componenten. Zo blijft een
 * cijfer in een grappige zin gewoon vervagen in de privacymodus.
 */
export function useCopyNodes(
  key: CopyKey | null | undefined,
  vars: CopyVars,
  nodes: Record<string, ReactNode>,
): ReactNode[] | null {
  const text = useCopy(key, vars);
  if (text === null) return null;
  return splitPlaceholders(text, Object.keys(nodes)).map((part, i) =>
    typeof part === "string" ? part : createElement(Fragment, { key: i }, nodes[part.name]),
  );
}

/** Zoals useCopy, maar gesplitst in titel en uitleg (bij een witregel). */
export function useCopyParts(key: CopyKey | null | undefined, vars?: CopyVars) {
  const text = useCopy(key, vars);
  return text === null ? null : splitCopy(text);
}
