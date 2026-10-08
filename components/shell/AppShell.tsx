import type { ReactNode } from "react";
import { LinkGate } from "@/components/koppelen/LinkGate";
import { BottomNav } from "./BottomNav";
import { KeyboardShortcuts } from "./KeyboardShortcuts";
import { MobileTopBar } from "./MobileTopBar";
import { Sidebar } from "./Sidebar";

/** Het frame om elke pagina: sidebar of bottom-nav, en de inhoud. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only z-[70] rounded-full bg-accent px-4 py-2 font-semibold text-on-accent focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Naar de inhoud
      </a>
      <KeyboardShortcuts />
      <Sidebar />
      <MobileTopBar />
      <div className="md:pl-[calc(var(--sidebar-w)+0.75rem)] lg:pl-[calc(var(--sidebar-w)+1rem)]">
        <main
          id="main"
          tabIndex={-1}
          className="mx-auto w-full max-w-[1160px] px-4 pt-3 pb-36 outline-none sm:px-6 md:px-8 md:pt-9 md:pb-16"
        >
          <LinkGate>{children}</LinkGate>
        </main>
      </div>
      <BottomNav />
    </>
  );
}
