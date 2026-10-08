"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { useUi } from "@/stores/ui";
import { DataSourceChip } from "./DataSourceChip";
import { Logo } from "./Logo";
import { PrivacyToggle } from "./PrivacyToggle";

/** Smalle balk bovenaan op mobiel. Wordt glas zodra je scrolt. */
export function MobileTopBar() {
  const openPalette = useUi((s) => s.setPaletteOpen);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="pt-safe sticky top-0 z-20 md:hidden">
      <div
        className={cn(
          "mx-2 mt-1 flex h-14 items-center gap-1 rounded-2xl border border-transparent px-2 transition-[background-color,border-color,box-shadow] duration-300",
          scrolled && "glass-strong",
        )}
      >
        <Link href="/vandaag" aria-label="SuperMagister, naar Vandaag" className="rounded-xl p-1">
          {/* Op hele smalle schermen wijkt het woordmerk voor de koppelchip. */}
          <Logo compact className="min-[390px]:hidden" />
          <Logo className="hidden min-[390px]:flex" />
        </Link>
        <div className="ml-auto flex items-center gap-0.5">
          <DataSourceChip />
          <PrivacyToggle />
          <Button
            variant="ghost"
            size="icon-sm"
            icon={Search}
            aria-label="Zoeken of een commando typen"
            onClick={() => openPalette(true)}
          />
        </div>
      </div>
    </header>
  );
}
