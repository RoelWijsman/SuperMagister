"use client";

import { useRef, type HTMLAttributes, type PointerEvent } from "react";
import { cn } from "@/lib/cn";

interface TiltProps extends HTMLAttributes<HTMLDivElement> {
  /** Maximale kanteling in graden. */
  max?: number;
}

/**
 * Kaart die subtiel meekantelt met de muis. Alleen bij een echte muis en
 * nooit als iemand minder beweging wil (dan doet CSS niets met de variabelen).
 */
export function Tilt({ max = 6, className, style, children, ...props }: TiltProps) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef(0);

  const update = (x: number, y: number) => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      ref.current?.style.setProperty("--tilt-x", `${(-y * max).toFixed(2)}deg`);
      ref.current?.style.setProperty("--tilt-y", `${(x * max).toFixed(2)}deg`);
    });
  };

  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    update(
      (event.clientX - rect.left) / rect.width - 0.5,
      (event.clientY - rect.top) / rect.height - 0.5,
    );
  };

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={() => update(0, 0)}
      className={cn(
        "[transform:perspective(900px)_rotateX(var(--tilt-x,0deg))_rotateY(var(--tilt-y,0deg))] transition-transform duration-300 ease-out motion-reduce:[transform:none]",
        className,
      )}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
}
