"use client";

import { motion } from "framer-motion";
import { Check, Pipette } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { cn } from "@/lib/cn";
import { THEME_PRESETS, type ThemePreset } from "@/lib/theme/themes";
import { useSettings } from "@/stores/settings";

function SelectedBadge() {
  return (
    <motion.span
      layoutId="theme-selected"
      className="absolute top-2 right-2 grid size-6 place-items-center rounded-full bg-[linear-gradient(135deg,var(--sm-accent),var(--sm-accent-2))] text-on-accent shadow-[0_4px_12px_-4px_var(--sm-accent)]"
      transition={{ type: "spring", stiffness: 500, damping: 34 }}
    >
      <Check size={14} strokeWidth={3} aria-hidden />
    </motion.span>
  );
}

/** Mini-hemel in de kleuren van een thema. */
function Preview({
  theme,
}: {
  theme: Pick<ThemePreset, "bgDark" | "aurora" | "accent" | "accent2">;
}) {
  const [a1, a2, a3] = theme.aurora;
  return (
    <span
      aria-hidden
      className="relative block h-20 overflow-hidden rounded-2xl"
      style={{
        background: `radial-gradient(70% 90% at 15% 10%, ${a1}aa, transparent 70%), radial-gradient(60% 80% at 90% 30%, ${a2}88, transparent 70%), radial-gradient(70% 80% at 50% 120%, ${a3}77, transparent 70%), ${theme.bgDark}`,
      }}
    >
      <span
        className="absolute bottom-2.5 left-2.5 h-3 w-12 rounded-full"
        style={{ background: `linear-gradient(90deg, ${theme.accent}, ${theme.accent2})` }}
      />
      <span className="absolute top-2.5 left-2.5 h-2 w-8 rounded-full bg-white/50" />
    </span>
  );
}

/** Kies een themapreset of een eigen kleur. De hele app kleurt meteen mee. */
export function ThemePicker() {
  const theme = useSettings((s) => s.theme);
  const customAccent = useSettings((s) => s.customAccent);
  const setTheme = useSettings((s) => s.setTheme);
  const setCustomAccent = useSettings((s) => s.setCustomAccent);
  const [draft, setDraft] = useState(customAccent);
  const frame = useRef(0);

  // De kleurkiezer vuurt tijdens het slepen heel vaak; één update per frame is genoeg.
  useEffect(() => () => cancelAnimationFrame(frame.current), []);
  const onColor = (hex: string) => {
    setDraft(hex);
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => setCustomAccent(hex));
  };

  return (
    <div
      role="radiogroup"
      aria-label="Thema"
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
    >
      {THEME_PRESETS.map((preset) => {
        const selected = theme === preset.id;
        return (
          <button
            key={preset.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setTheme(preset.id)}
            className={cn(
              "relative rounded-3xl border p-2 text-left transition-[border-color,transform] duration-200 active:scale-[0.97]",
              selected
                ? "border-[color-mix(in_oklab,var(--sm-accent)_70%,transparent)] bg-glass-strong"
                : "border-line hover:border-line-strong",
            )}
          >
            <Preview theme={preset} />
            <span className="mt-2.5 block px-1.5 font-semibold text-ink">{preset.name}</span>
            <span className="block px-1.5 pb-1 text-xs text-ink-3">{preset.tagline}</span>
            {selected && <SelectedBadge />}
          </button>
        );
      })}

      <label
        className={cn(
          "relative cursor-pointer rounded-3xl border p-2 transition-colors",
          theme === "custom"
            ? "border-[color-mix(in_oklab,var(--sm-accent)_70%,transparent)] bg-glass-strong"
            : "border-line hover:border-line-strong",
        )}
      >
        <span
          aria-hidden
          className="relative block h-20 overflow-hidden rounded-2xl"
          style={{
            background:
              theme === "custom"
                ? `radial-gradient(80% 100% at 20% 0%, ${draft}cc, transparent 70%), radial-gradient(70% 90% at 100% 100%, var(--t-a2), transparent 70%), var(--t-bg-dark)`
                : "conic-gradient(from 200deg, #ff6b5b, #ffd23f, #3ee69a, #3db8ff, #8c6bff, #f45bd0, #ff6b5b)",
          }}
        >
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid size-9 place-items-center rounded-full bg-black/35 text-white backdrop-blur-sm">
              <Pipette size={17} strokeWidth={2.2} />
            </span>
          </span>
        </span>
        <span className="mt-2.5 block px-1.5 font-semibold text-ink">Eigen kleur</span>
        <span className="block px-1.5 pb-1 text-xs text-ink-3">
          {theme === "custom" ? draft.toUpperCase() : "Kies je eigen accent"}
        </span>
        <input
          type="color"
          value={draft}
          onChange={(event) => onColor(event.target.value)}
          aria-label="Eigen accentkleur kiezen"
          className="absolute inset-0 size-full cursor-pointer opacity-0"
          style={{ colorScheme: "normal" } as CSSProperties}
        />
        {theme === "custom" && <SelectedBadge />}
      </label>
    </div>
  );
}
