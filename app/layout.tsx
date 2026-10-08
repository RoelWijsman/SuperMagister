import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Inter, Unbounded } from "next/font/google";
import { headers } from "next/headers";
import { Sky } from "@/components/background/Sky";
import { AchievementWatcher } from "@/components/achievements/AchievementWatcher";
import { GoalWatcher } from "@/components/collection/GoalWatcher";
import { CommandPalette } from "@/components/command/CommandPalette";
import { LinkIntake } from "@/components/koppelen/LinkIntake";
import { SessionWatcher } from "@/components/koppelen/SessionWatcher";
import { Providers } from "@/components/providers/Providers";
import { AppShell } from "@/components/shell/AppShell";
import { MoreSheet } from "@/components/shell/MoreSheet";
import { ShortcutsSheet } from "@/components/shell/ShortcutsSheet";
import { ConfettiRain } from "@/components/ui/ConfettiRain";
import { Toaster } from "@/components/ui/Toaster";
import { WalkoutOverlay } from "@/components/walkout/WalkoutOverlay";
import { buildThemeScript } from "@/lib/theme/script";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const unbounded = Unbounded({
  subsets: ["latin"],
  variable: "--font-unbounded",
  display: "swap",
});

/** Sportief font voor de walkout en de kaarten. Laadt pas als het nodig is. */
const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: { default: "SuperMagister", template: "%s · SuperMagister" },
  description: "Je rooster, huiswerk en cijfers uit Magister. Mooi, supersnel en vooral leuk.",
  applicationName: "SuperMagister",
};

export const viewport: Viewport = {
  themeColor: "#070816",
  colorScheme: "dark light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // De nonce van de CSP (proxy.ts): zonder nonce mag het themascript niet draaien.
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html
      lang="nl"
      data-theme="aurora"
      data-mode="dark"
      data-tod="dag"
      suppressHydrationWarning
      className={`${inter.variable} ${unbounded.variable} ${bebas.variable}`}
    >
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: buildThemeScript() }} />
      </head>
      <body>
        <Providers>
          <Sky />
          <div id="app-root">
            <AppShell>{children}</AppShell>
          </div>
          <CommandPalette />
          <ShortcutsSheet />
          <MoreSheet />
          <WalkoutOverlay />
          <LinkIntake />
          <SessionWatcher />
          <GoalWatcher />
          <AchievementWatcher />
          <ConfettiRain />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
