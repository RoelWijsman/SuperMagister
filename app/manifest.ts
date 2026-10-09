import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

/** Het PWA-manifest: zo heet en oogt SuperMagister op je beginscherm. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    lang: "nl",
    start_url: "/vandaag",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#070816",
    theme_color: "#070816",
    categories: ["education", "productivity"],
    icons: [
      { src: "/logo.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icons/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
