import {
  Amphora,
  Atom,
  Bike,
  BookOpen,
  BookText,
  Brain,
  BriefcaseBusiness,
  Brush,
  Calculator,
  Camera,
  Castle,
  CodeXml,
  Compass,
  Croissant,
  Drama,
  Dumbbell,
  FlaskConical,
  Footprints,
  Globe,
  Guitar,
  HeartHandshake,
  Landmark,
  Languages,
  Leaf,
  Lightbulb,
  MessagesSquare,
  Microscope,
  Music,
  NotebookPen,
  Palette,
  Pi,
  Puzzle,
  Rocket,
  Scale,
  Scroll,
  Sigma,
  Star,
  Telescope,
  Theater,
  TrendingUp,
  Users,
  Wrench,
} from "lucide";
import type { SubjectIconName } from "@/lib/subjects/icons";

/**
 * De vak-iconen als vectordata, zodat ze ook op canvas getekend kunnen worden
 * (walkout, kaarten, video). Bron: het vanilla lucide-pakket, dezelfde versie
 * als lucide-react, dus overal hetzelfde icoon.
 */
export type IconNode = readonly (readonly [string, Readonly<Record<string, unknown>>])[];

export const SUBJECT_ICON_NODES: Readonly<Record<SubjectIconName, IconNode>> = {
  BookOpen,
  BookText,
  MessagesSquare,
  Languages,
  Croissant,
  Castle,
  Guitar,
  Scroll,
  Amphora,
  Sigma,
  Pi,
  Calculator,
  Atom,
  FlaskConical,
  Leaf,
  Microscope,
  Telescope,
  CodeXml,
  Wrench,
  Lightbulb,
  Globe,
  Landmark,
  TrendingUp,
  BriefcaseBusiness,
  Users,
  Scale,
  Brain,
  HeartHandshake,
  Theater,
  Palette,
  Brush,
  Music,
  Drama,
  Camera,
  Dumbbell,
  Bike,
  Compass,
  NotebookPen,
  Footprints,
  Rocket,
  Puzzle,
  Star,
};

export interface IconPath {
  d: string;
  fill: boolean;
}

const num = (value: unknown) => Number(value ?? 0);

function points(value: unknown): string {
  const coords = String(value ?? "")
    .trim()
    .split(/[\s,]+/)
    .map(Number);
  const parts: string[] = [];
  for (let i = 0; i + 1 < coords.length; i += 2) {
    parts.push(`${i === 0 ? "M" : "L"}${coords[i]} ${coords[i + 1]}`);
  }
  return parts.join("");
}

function rectPath(attrs: Readonly<Record<string, unknown>>): string {
  const x = num(attrs.x);
  const y = num(attrs.y);
  const w = num(attrs.width);
  const h = num(attrs.height);
  const r = Math.min(num(attrs.rx ?? attrs.ry), w / 2, h / 2);
  if (r <= 0) return `M${x} ${y}H${x + w}V${y + h}H${x}Z`;
  return (
    `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}` +
    `V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}` +
    `H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}` +
    `V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`
  );
}

function ellipsePath(cx: number, cy: number, rx: number, ry: number): string {
  return `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${rx * 2} 0a${rx} ${ry} 0 1 0 ${-rx * 2} 0Z`;
}

/** SVG-elementen van een lucide-icoon als losse paden (24×24, lijndikte 2). */
export function iconNodeToPaths(node: IconNode): IconPath[] {
  const paths: IconPath[] = [];
  for (const [tag, attrs] of node) {
    let d: string | null = null;
    switch (tag) {
      case "path":
        d = String(attrs.d ?? "");
        break;
      case "circle":
        d = ellipsePath(num(attrs.cx), num(attrs.cy), num(attrs.r), num(attrs.r));
        break;
      case "ellipse":
        d = ellipsePath(num(attrs.cx), num(attrs.cy), num(attrs.rx), num(attrs.ry));
        break;
      case "rect":
        d = rectPath(attrs);
        break;
      case "line":
        d = `M${num(attrs.x1)} ${num(attrs.y1)}L${num(attrs.x2)} ${num(attrs.y2)}`;
        break;
      case "polyline":
        d = points(attrs.points);
        break;
      case "polygon":
        d = `${points(attrs.points)}Z`;
        break;
    }
    if (d) paths.push({ d, fill: attrs.fill !== undefined && attrs.fill !== "none" });
  }
  return paths;
}
