/**
 * Kan deze browser de extensie gebruiken? Chrome en Edge (en andere Chromium-
 * browsers) op een computer wel; telefoons en andere browsers koppelen met de
 * bladwijzer of het plakveld.
 */
export type ExtensionSupport = "ja" | "telefoon" | "andere-browser";

interface NavigatorLike {
  userAgent: string;
  userAgentData?: { mobile?: boolean; brands?: readonly { brand: string }[] };
}

export function extensionSupport(navigator: NavigatorLike): ExtensionSupport {
  const ua = navigator.userAgent;
  const data = navigator.userAgentData;
  const mobile = data?.mobile ?? /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
  if (mobile) return "telefoon";
  const chromium = data?.brands
    ? data.brands.some((b) => /Chromium|Google Chrome|Microsoft Edge/.test(b.brand))
    : /(Chrome|Chromium|Edg)\//.test(ua) && !/Firefox|FxiOS/.test(ua);
  return chromium ? "ja" : "andere-browser";
}
