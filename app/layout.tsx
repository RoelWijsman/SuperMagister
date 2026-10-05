import type { Metadata, Viewport } from "next";
import { Inter, Unbounded } from "next/font/google";
import { Sky } from "@/components/background/Sky";
import { CommandPalette } from "@/components/command/CommandPalette";
import { Providers } from "@/components/providers/Providers";
import { AppShell } from "@/components/shell/AppShell";
import { MoreSheet } from "@/components/shell/MoreSheet";
import { ShortcutsSheet } from "@/components/shell/ShortcutsSheet";
import { Toaster } from "@/components/ui/Toaster";
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="nl"
      data-theme="aurora"
      data-mode="dark"
      data-tod="dag"
      suppressHydrationWarning
      className={`${inter.variable} ${unbounded.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: buildThemeScript() }} />
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
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
