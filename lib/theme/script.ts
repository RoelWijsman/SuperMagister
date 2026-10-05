import { STORAGE_KEYS } from "@/lib/storage-keys";
import { TIME_OF_DAY_STARTS } from "./time-of-day";
import { THEME_PRESETS, themeVars } from "./themes";

/**
 * Inline-script voor in <head>. Draait synchroon tijdens het parsen van de HTML,
 * dus vóór de eerste paint: thema, licht/donker, tijd van de dag en privacy
 * staan meteen goed en er is geen flits van het standaardthema.
 *
 * Leest dezelfde localStorage-sleutel als de Zustand-store (stores/settings.ts).
 */
export function buildThemeScript(): string {
  const presets = JSON.stringify(
    Object.fromEntries(THEME_PRESETS.map((preset) => [preset.id, themeVars(preset)])),
  );
  const t = TIME_OF_DAY_STARTS;
  return `(function(){try{var d=document.documentElement,P=${presets},S={};try{S=(JSON.parse(localStorage.getItem(${JSON.stringify(STORAGE_KEYS.settings)}))||{}).state||{}}catch(e){}var th=S.theme||"aurora",v=th==="custom"&&S.customVars?S.customVars:P[th]||P.aurora;for(var k in v)d.style.setProperty(k,v[k]);d.setAttribute("data-theme",th);var m=S.colorMode||"dark";if(m==="system")m=matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";d.setAttribute("data-mode",m);var n=new Date(),x=n.getHours()*60+n.getMinutes();d.setAttribute("data-tod",S.skyFollowsTime===false?"off":x>=${t.nacht}||x<${t.ochtend}?"nacht":x<${t.dag}?"ochtend":x<${t.avond}?"dag":"avond");if(S.ambientMotion===false)d.setAttribute("data-ambient","off");if(S.motion==="reduced"||S.motion==="full")d.setAttribute("data-motion",S.motion);if(S.privacyAuto)d.setAttribute("data-privacy","on")}catch(e){}})();`;
}
