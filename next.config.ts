import type { NextConfig } from "next";
import { version } from "./package.json";

/**
 * Security-headers voor elke pagina. De Content Security Policy staat apart in
 * proxy.ts (die heeft een nonce per verzoek nodig).
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), serial=(), hid=(), browsing-topics=()",
  },
  // Alleen https, twee jaar lang (ook voor www). Lokaal (http) negeert de browser dit.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // SM_BUILD_TIME: alleen voor de build-info op het ontwikkelaarsdashboard (server).
  env: { NEXT_PUBLIC_APP_VERSION: version, SM_BUILD_TIME: new Date().toISOString() },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // De API (Magister-proxy, vakanties) hoort nooit in een zoekmachine.
      { source: "/api/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
    ];
  },
};

export default nextConfig;
