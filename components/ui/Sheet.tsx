"use client";

import { AnimatePresence, motion, useReducedMotion, type PanInfo } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import { useFocusTrap, useIsClient, useMediaQuery, useModalLock } from "@/lib/hooks";
import { Button } from "./Button";

type Size = "sm" | "md" | "lg";

const widths: Record<Size, string> = {
  sm: "md:max-w-sm",
  md: "md:max-w-lg",
  lg: "md:max-w-2xl",
};

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  /** Titel alleen voor schermlezers (als de inhoud zelf al een kop heeft). */
  hideTitle?: boolean;
  size?: Size;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  /** "boven": ook boven de fullscreen walkout (bijv. de video vanaf het eindscherm). */
  layer?: "app" | "boven";
}

/**
 * Modaal paneel. Op mobiel een bottom sheet die je omlaag kunt vegen, op
 * desktop een zwevend venster in het midden.
 */
export function Sheet({
  open,
  onClose,
  title,
  description,
  hideTitle,
  size = "md",
  children,
  footer,
  className,
  layer = "app",
}: SheetProps) {
  const isClient = useIsClient();
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const reduced = useReducedMotion();
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useModalLock(open);
  useFocusTrap(open, panel);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 110 || info.velocity.y > 650) onClose();
  };

  const hidden = reduced
    ? { opacity: 0 }
    : isDesktop
      ? { opacity: 0, scale: 0.94, y: 12 }
      : { y: "100%" };

  if (!isClient) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          className={cn(
            "fixed inset-0 flex items-end justify-center md:items-center md:p-6",
            layer === "boven" ? "z-[90]" : "z-50",
          )}
        >
          <motion.div
            className="absolute inset-0 bg-[rgb(4_4_14/0.55)] backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descriptionId : undefined}
            tabIndex={-1}
            className={cn(
              "relative flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-t-[1.75rem] glass-strong outline-none md:rounded-panel",
              widths[size],
              className,
            )}
            initial={hidden}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={hidden}
            transition={{ type: "spring", stiffness: 420, damping: 38 }}
            drag={!isDesktop && !reduced ? "y" : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.65 }}
            onDragEnd={onDragEnd}
          >
            {!isDesktop && (
              <div aria-hidden className="flex justify-center pt-2.5">
                <span className="h-1.5 w-11 rounded-full bg-line-strong" />
              </div>
            )}
            <header
              className={cn(
                "flex items-start gap-3 px-5 pt-4 pb-2 md:px-6 md:pt-6",
                hideTitle && "sr-only",
              )}
            >
              <div className="min-w-0 flex-1">
                <h2 id={titleId} className="font-display text-xl font-semibold tracking-tight">
                  {title}
                </h2>
                {description && (
                  <p id={descriptionId} className="mt-1 text-sm text-ink-2">
                    {description}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                icon={X}
                aria-label="Sluiten"
                onClick={onClose}
                className="-mt-1 -mr-2"
              />
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-6 md:px-6">
              {children}
            </div>
            {footer && (
              <footer className="pb-safe border-t border-line px-5 py-4 md:px-6">{footer}</footer>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
