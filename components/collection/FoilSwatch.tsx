import { Lock } from "lucide-react";
import type { CSSProperties } from "react";
import { CARD_MASK } from "@/components/cards/mask";
import type { FoilId } from "@/lib/collection/goals";
import { cn } from "@/lib/cn";

const SWATCH: CSSProperties = {
  maskImage: CARD_MASK,
  WebkitMaskImage: CARD_MASK,
  ["--px" as string]: "32%",
  ["--py" as string]: "28%",
  ["--mx" as string]: "-0.4",
  ["--my" as string]: "-0.45",
  ["--hyp" as string]: "0.6",
};

/** Mini-kaartje met een folie erop, om folies te vergelijken. */
export function FoilSwatch({
  foil,
  locked = false,
  className,
}: {
  foil: FoilId;
  locked?: boolean;
  className?: string;
}) {
  return (
    <span aria-hidden className={cn("relative block aspect-[500/720] w-10 shrink-0", className)}>
      <span
        className={cn(
          "absolute inset-0 bg-[linear-gradient(160deg,#3b3f5c,#14162a_55%,#262a44)]",
          locked && "opacity-50",
        )}
        style={{ maskImage: CARD_MASK, WebkitMaskImage: CARD_MASK }}
      />
      {!locked && <span className="holo" data-foil={foil} style={SWATCH} />}
      {locked && (
        <span className="absolute inset-0 grid place-items-center text-white/70">
          <Lock size={14} strokeWidth={2.6} />
        </span>
      )}
    </span>
  );
}
