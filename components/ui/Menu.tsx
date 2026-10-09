"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Check } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";

export interface MenuItem {
  label: string;
  icon?: LucideIcon;
  onSelect: () => void;
  disabled?: boolean;
  /** Een vinkje ervoor (bijv. het elftal dat nu open staat). */
  checked?: boolean;
  /** Een lijntje erboven, om groepjes te maken. */
  separated?: boolean;
}

/**
 * Een knop met een uitklapmenu, zoals het hoort: pijltjes, Home/End, Escape
 * (focus terug op de knop), klikken buiten het menu sluit het. Het menu is
 * dicht van kleur, dus altijd leesbaar.
 */
export function Menu({
  label,
  items,
  children,
  align = "end",
  className,
  buttonClassName,
}: {
  /** Toegankelijke naam van de knop (als de inhoud geen tekst is, of anders zegt). */
  label: string;
  items: readonly MenuItem[];
  /** Inhoud van de knop. */
  children: ReactNode;
  align?: "start" | "end";
  className?: string;
  buttonClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);

  const itemsEls = () =>
    [...(list.current?.querySelectorAll<HTMLButtonElement>("[role^=menuitem]") ?? [])].filter(
      (el) => !el.disabled,
    );

  useEffect(() => {
    if (!open) return;
    const first = requestAnimationFrame(() => itemsEls()[0]?.focus());
    const onDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => {
      cancelAnimationFrame(first);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  const close = (focusButton: boolean) => {
    setOpen(false);
    if (focusButton) button.current?.focus();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const els = itemsEls();
    const index = els.indexOf(document.activeElement as HTMLButtonElement);
    const go = (i: number) => {
      event.preventDefault();
      els[(i + els.length) % els.length]?.focus();
    };
    if (event.key === "ArrowDown") go(index + 1);
    else if (event.key === "ArrowUp") go(index - 1);
    else if (event.key === "Home") go(0);
    else if (event.key === "End") go(els.length - 1);
    else if (event.key === "Escape") {
      event.preventDefault();
      close(true);
    } else if (event.key === "Tab") close(false);
  };

  return (
    <div ref={root} className={cn("relative", className)} onKeyDown={open ? onKeyDown : undefined}>
      <button
        ref={button}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" && !open) {
            event.preventDefault();
            setOpen(true);
          }
        }}
        className={buttonClassName}
      >
        {children}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            ref={list}
            id={id}
            role="menu"
            aria-label={label}
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98, transition: { duration: 0.12 } }}
            transition={{ type: "spring", stiffness: 520, damping: 34 }}
            className={cn(
              "absolute top-full z-40 mt-2 min-w-56 overflow-hidden rounded-2xl border border-line-strong bg-surface p-1.5 shadow-[0_24px_60px_-18px_rgb(0_0_0/0.65)]",
              align === "end" ? "right-0 origin-top-right" : "left-0 origin-top-left",
            )}
          >
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  role={item.checked === undefined ? "menuitem" : "menuitemradio"}
                  aria-checked={item.checked}
                  tabIndex={-1}
                  disabled={item.disabled}
                  onClick={() => {
                    close(true);
                    item.onSelect();
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-ink outline-none hover:bg-glass-hover focus-visible:bg-glass-hover disabled:opacity-45",
                    item.separated && "mt-1.5 border-t border-line pt-3",
                  )}
                >
                  {item.checked !== undefined ? (
                    <Check
                      size={16}
                      aria-hidden
                      className={cn("shrink-0", item.checked ? "text-accent-ink" : "opacity-0")}
                    />
                  ) : (
                    Icon && <Icon size={16} aria-hidden className="shrink-0 text-ink-2" />
                  )}
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
