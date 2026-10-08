import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Inter, Unbounded } from "next/font/google";
import { headers } from "next/headers";
import { Sky } from "@/components/background/Sky";
import { AchievementWatcher } from "@/components/achievements/AchievementWatcher";
import { GoalWatcher } from "@/components/collection/GoalWatcher";
import { LinkIntake } from "@/components/koppelen/LinkIntake";
import { SessionWatcher } from "@/components/koppelen/SessionWatcher";
import { Providers } from "@/components/providers/Providers";
import { AppShell } from "@/components/shell/AppShell";
import { LazyOverlays, LazyWalkout } from "@/components/shell/LazyOverlays";
import { OnboardingGate } from "@/components/onboarding/OnboardingGate";
import { ConfettiRain } from "@/components/ui/ConfettiRain";
import { Toaster } from "@/components/ui/Toaster";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
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
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  // Alleen de voorkant (Vandaag) en /privacy mogen in zoekmachines; zie ook app/robots.ts.
  robots: { index: false, follow: false },
  openGraph: {
    type: "website",
    locale: "nl_NL",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: "/",
  },
  twitter: { card: "summary_large_image", title: SITE_NAME, description: SITE_DESCRIPTION },
  appleWebApp: { capable: true, title: SITE_NAME, statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
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
          <LazyOverlays />
          <OnboardingGate />
          <LazyWalkout />
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
