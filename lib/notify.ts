import type { CopyKey } from "@/content/copy";
import { toast, type Toast } from "@/stores/toast";
import { copyText, splitCopy, type CopyVars } from "./copy";

/** Toont een melding met een tekst uit content/copy.ts (titel\nuitleg). */
export function notify(
  key: CopyKey,
  vars?: CopyVars,
  extra: Partial<Omit<Toast, "title" | "description">> = {},
) {
  const { title, body } = splitCopy(copyText(key, vars));
  return toast({ ...extra, title, description: body || undefined });
}
