import type { CSSProperties } from "react";
import type { SubjectAppearance } from "@/lib/data/hooks";
import { cn } from "@/lib/cn";
import { SubjectIcon } from "./SubjectIcon";

type Size = "sm" | "md" | "lg";

const boxes: Record<Size, string> = {
  sm: "size-7 rounded-lg",
  md: "size-9 rounded-xl",
  lg: "size-12 rounded-2xl",
};
const icons: Record<Size, number> = { sm: 15, md: 18, lg: 24 };

/** Gekleurd vierkantje met het vak-icoon. Overal dezelfde kleur per vak. */
export function SubjectBadge({
  subject,
  size = "md",
  className,
}: {
  subject: Pick<SubjectAppearance, "color" | "icon" | "name">;
  size?: Size;
  className?: string;
}) {
  return (
    <span
      title={subject.name}
      style={{ "--subject": subject.color } as CSSProperties}
      className={cn(
        "grid shrink-0 place-items-center bg-[color-mix(in_oklab,var(--subject)_20%,transparent)] text-[var(--subject)] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--subject)_30%,transparent)] light:text-[color-mix(in_oklab,var(--subject)_62%,black)]",
        boxes[size],
        className,
      )}
    >
      <SubjectIcon name={subject.icon} size={icons[size]} strokeWidth={2.2} />
    </span>
  );
}

/** Stipje in de vakkleur, voor compacte lijsten. */
export function SubjectDot({ color, className }: { color: string; className?: string }) {
  return (
    <span
      aria-hidden
      style={{ background: color, boxShadow: `0 0 10px ${color}` }}
      className={cn("inline-block size-2.5 shrink-0 rounded-full", className)}
    />
  );
}
