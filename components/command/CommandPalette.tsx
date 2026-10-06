"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, CornerDownLeft, Search } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { Chip } from "@/components/ui/Chip";
import { Illustration } from "@/components/ui/illustrations";
import { Kbd } from "@/components/ui/Kbd";
import { cn } from "@/lib/cn";
import { rankCommands } from "@/lib/commands/rank";
import { useFocusTrap, useIsClient, useModalLock } from "@/lib/hooks";
import { useCopyParts } from "@/lib/use-copy";
import type { MatchRange } from "@/lib/search/fuzzy";
import { applyThemeVars } from "@/lib/theme/apply";
import { useSettings } from "@/stores/settings";
import { useUi } from "@/stores/ui";
import { useCommands, type Command, type PalettePage } from "./commands";

function NoResults({ query }: { query: string }) {
  const copy = useCopyParts("leeg.zoeken", { query: query.trim() });
  return (
    <div className="flex flex-col items-center px-6 py-8 text-center">
      <Illustration name="zoeken" className="mb-3 w-28 text-ink-3" />
      <p className="font-medium text-ink">{copy?.title}</p>
      <p className="mt-1 text-sm text-ink-2">{copy?.body}</p>
    </div>
  );
}

function Highlight({ text, ranges }: { text: string; ranges: MatchRange[] }) {
  if (ranges.length === 0) return <>{text}</>;
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  ranges.forEach(([start, end], i) => {
    if (start > cursor) parts.push(text.slice(cursor, start));
    parts.push(
      <mark key={i} className="bg-transparent font-semibold text-accent-ink">
        {text.slice(start, end)}
      </mark>,
    );
    cursor = end;
  });
  parts.push(text.slice(cursor));
  return <>{parts}</>;
}

const PLACEHOLDERS: Record<PalettePage, string> = {
  root: "Zoek een vak of huiswerk, of typ 'rooster morgen'…",
  themes: "Kies een thema…",
};

function restoreTheme() {
  const { theme, customVars } = useSettings.getState();
  applyThemeVars(theme, customVars);
}

/** Ctrl/⌘ K: spring naar pagina's en vakken, zoek huiswerk, voer acties uit. */
export function CommandPalette() {
  const open = useUi((s) => s.paletteOpen);
  const setOpen = useUi((s) => s.setPaletteOpen);
  const isClient = useIsClient();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState<PalettePage>("root");
  const [active, setActive] = useState(0);
  const panel = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const listId = useId();

  useModalLock(open);
  useFocusTrap(open, panel);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setPage("root");
    setActive(0);
    restoreTheme();
  }, [setOpen]);

  const goToPage = useCallback((next: PalettePage) => {
    setPage(next);
    setQuery("");
    setActive(0);
    if (next === "root") restoreTheme();
    requestAnimationFrame(() => input.current?.focus());
  }, []);

  const commands = useCommands({ page, query, close, goToPage });
  const groups = useMemo(() => rankCommands(commands, query), [commands, query]);
  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);
  const positions = useMemo(() => new Map(flat.map((item, i) => [item.command.id, i])), [flat]);
  const current = flat[Math.min(active, flat.length - 1)];

  // Thema's direct voorvertonen terwijl je erdoorheen bladert.
  useEffect(() => {
    if (open && page === "themes") current?.command.preview?.();
  }, [open, page, current]);

  useEffect(() => {
    list.current
      ?.querySelector<HTMLElement>('[aria-selected="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [active, page]);

  const run = (command: Command) => {
    const result = command.run();
    if (result !== "stay" && command.soon) close();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (flat.length === 0) return;
      const delta = event.key === "ArrowDown" ? 1 : -1;
      setActive((i) => (Math.min(i, flat.length - 1) + delta + flat.length) % flat.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (current) run(current.command);
    } else if (event.key === "Escape") {
      event.preventDefault();
      if (page !== "root") goToPage("root");
      else close();
    } else if (event.key === "Backspace" && query === "" && page !== "root") {
      event.preventDefault();
      goToPage("root");
    }
  };

  if (!isClient) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center px-3 pt-[max(0.75rem,env(safe-area-inset-top))] md:pt-[12vh]">
          <motion.div
            className="absolute inset-0 bg-[rgb(4_4_14/0.5)] backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={close}
          />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label="Zoeken en commando's"
            className="relative flex max-h-[min(36rem,82dvh)] w-full max-w-xl flex-col overflow-hidden rounded-panel glass-strong"
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98, transition: { duration: 0.14 } }}
            transition={{ type: "spring", stiffness: 520, damping: 38 }}
          >
            <div className="flex items-center gap-3 border-b border-line px-4">
              {page === "root" ? (
                <Search size={20} strokeWidth={2.2} aria-hidden className="shrink-0 text-ink-3" />
              ) : (
                <button
                  type="button"
                  onClick={() => goToPage("root")}
                  aria-label="Terug"
                  className="-ml-1 grid size-8 shrink-0 place-items-center rounded-full text-ink-2 hover:bg-glass"
                >
                  <ArrowLeft size={18} strokeWidth={2.2} />
                </button>
              )}
              <input
                ref={input}
                autoFocus
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActive(0);
                }}
                onKeyDown={onKeyDown}
                placeholder={PLACEHOLDERS[page]}
                role="combobox"
                aria-expanded="true"
                aria-controls={listId}
                aria-activedescendant={current ? `${listId}-${current.command.id}` : undefined}
                aria-autocomplete="list"
                spellCheck={false}
                className="h-15 min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink-3"
              />
              <Kbd className="hidden sm:inline-flex">Esc</Kbd>
            </div>

            <div
              ref={list}
              id={listId}
              role="listbox"
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2"
            >
              {flat.length === 0 && <NoResults query={query} />}
              {groups.map((group) => (
                <div key={group.group} role="group" aria-label={group.group} className="mb-1">
                  <p className="px-3 pt-2 pb-1.5 text-xs font-semibold tracking-wide text-ink-3">
                    {group.group}
                  </p>
                  {group.items.map(({ command, ranges }) => {
                    const myIndex = positions.get(command.id) ?? 0;
                    const selected = current?.command.id === command.id;
                    return (
                      <div
                        key={command.id}
                        id={`${listId}-${command.id}`}
                        role="option"
                        aria-selected={selected}
                        aria-disabled={command.soon ? true : undefined}
                        onPointerMove={() => myIndex !== active && setActive(myIndex)}
                        onClick={() => run(command)}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-2 transition-colors",
                          selected && "bg-glass-hover shadow-[inset_0_0_0_1px_var(--sm-line)]",
                        )}
                      >
                        {command.icon}
                        <div className="min-w-0 flex-1">
                          <p className={cn("truncate", command.soon ? "text-ink-2" : "text-ink")}>
                            <Highlight text={command.title} ranges={ranges} />
                          </p>
                          {command.subtitle && (
                            <p className="truncate text-sm text-ink-3">{command.subtitle}</p>
                          )}
                        </div>
                        {command.soon ? (
                          <Chip>{command.soon}</Chip>
                        ) : command.shortcut ? (
                          <span className="hidden gap-1 sm:flex">
                            {command.shortcut.map((key) => (
                              <Kbd key={key}>{key}</Kbd>
                            ))}
                          </span>
                        ) : (
                          selected && (
                            <CornerDownLeft size={16} aria-hidden className="text-ink-3" />
                          )
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="hidden items-center gap-4 border-t border-line px-4 py-2.5 text-xs text-ink-3 sm:flex">
              <span className="flex items-center gap-1.5">
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd> kiezen
              </span>
              <span className="flex items-center gap-1.5">
                <Kbd>↵</Kbd> openen
              </span>
              <span className="flex items-center gap-1.5">
                <Kbd>Esc</Kbd> {page === "root" ? "sluiten" : "terug"}
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
