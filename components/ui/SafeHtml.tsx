"use client";

import DOMPurify from "dompurify";
import { useMemo } from "react";
import { cn } from "@/lib/cn";
import { useIsClient } from "@/lib/hooks";
import { htmlToText } from "@/lib/school/derive";

const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "sub",
  "sup",
  "span",
  "div",
  "ul",
  "ol",
  "li",
  "a",
  "h1",
  "h2",
  "h3",
  "h4",
  "blockquote",
  "code",
  "pre",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "hr",
];

let hookAdded = false;

function sanitize(html: string): string {
  if (!hookAdded) {
    // Links openen altijd in een nieuw tabblad, zonder toegang tot deze pagina.
    DOMPurify.addHook("afterSanitizeAttributes", (node) => {
      if (node instanceof Element && node.tagName === "A") {
        node.setAttribute("target", "_blank");
        node.setAttribute("rel", "noopener noreferrer nofollow");
      }
    });
    hookAdded = true;
  }
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ["href", "title", "colspan", "rowspan"],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Toont HTML uit Magister (huiswerk, toetsstof) veilig: alleen opmaak en
 * links blijven over, scripts, stijlen en event-handlers gaan eruit.
 */
export function SafeHtml({ html, className }: { html: string; className?: string }) {
  const isClient = useIsClient();
  const clean = useMemo(() => (isClient ? sanitize(html) : null), [html, isClient]);

  if (clean === null) {
    return <div className={cn("homework-html", className)}>{htmlToText(html)}</div>;
  }
  return (
    <div className={cn("homework-html", className)} dangerouslySetInnerHTML={{ __html: clean }} />
  );
}
