import { ImageResponse } from "next/og";
import { AppIcon } from "@/lib/brand/marks";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Het icoon op het beginscherm van een iPhone of iPad. */
export default function AppleIcon() {
  return new ImageResponse(<AppIcon size={180} bleed />, size);
}
