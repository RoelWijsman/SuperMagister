"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useMediaQuery } from "@/lib/hooks";
import { applyThemeVars } from "@/lib/theme/apply";
import { getTimeOfDay } from "@/lib/theme/time-of-day";
import { useSettings } from "@/stores/settings";
import { useUi } from "@/stores/ui";

function setAttr(name: string, value: string | null) {
  const root = document.documentElement;
  if (value === null) root.removeAttribute(name);
  else root.setAttribute(name, value);
}

/**
 * Houdt de attributen op <html> gelijk aan de instellingen. Het inline-script
 * zet ze al vóór de eerste paint; dit component neemt het daarna over (ook na
 * de dubbele mount van React Strict Mode in development).
 */
export function ThemeSync() {
  const theme = useSettings((s) => s.theme);
  const customVars = useSettings((s) => s.customVars);
  const colorMode = useSettings((s) => s.colorMode);
  const skyFollowsTime = useSettings((s) => s.skyFollowsTime);
  const ambientMotion = useSettings((s) => s.ambientMotion);
  const motion = useSettings((s) => s.motion);
  const privacy = useUi((s) => s.privacy);
  const preview = useUi((s) => s.timeOfDayPreview);
  const prefersLight = useMediaQuery("(prefers-color-scheme: light)");
  const [timeOfDay, setTimeOfDay] = useState(() => getTimeOfDay(new Date()));
  const privacyInitialized = useRef(false);

  useEffect(() => {
    const id = setInterval(() => setTimeOfDay(getTimeOfDay(new Date())), 60_000);
    return () => clearInterval(id);
  }, []);

  useLayoutEffect(() => {
    // Privacymodus die automatisch aan moet, al bij de eerste render meenemen.
    if (!privacyInitialized.current) {
      privacyInitialized.current = true;
      if (useSettings.getState().privacyAuto) useUi.getState().setPrivacy(true);
    }
    const light =
      colorMode === "system"
        ? window.matchMedia("(prefers-color-scheme: light)").matches
        : colorMode === "light";
    setAttr("data-mode", light ? "light" : "dark");
    applyThemeVars(theme, customVars);
    setAttr("data-tod", preview ?? (skyFollowsTime ? getTimeOfDay(new Date()) : "off"));
    setAttr("data-ambient", ambientMotion ? null : "off");
    setAttr("data-motion", motion === "system" ? null : motion);
    setAttr("data-privacy", useUi.getState().privacy ? "on" : null);
  }, [
    theme,
    customVars,
    colorMode,
    prefersLight,
    skyFollowsTime,
    ambientMotion,
    motion,
    privacy,
    preview,
    timeOfDay,
  ]);

  return null;
}
