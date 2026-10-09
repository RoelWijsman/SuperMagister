import { useId } from "react";
import { clubInitials, CREST_INNER, CREST_PATHS, type CrestShape } from "@/lib/squad/club";

/**
 * Het clubwapen: een vorm in de kleuren van je thema, met de initialen van je
 * club erop. Wordt vanzelf gemaakt; je kiest alleen de vorm.
 */
export function Crest({
  name,
  shape,
  size = 48,
  className,
}: {
  name: string;
  shape: CrestShape;
  size?: number;
  className?: string;
}) {
  const id = useId();
  const initials = clubInitials(name);
  return (
    <svg
      viewBox="0 0 100 120"
      width={size}
      height={size * 1.2}
      className={className}
      role="img"
      aria-label={`Clubwapen van ${name}`}
    >
      <defs>
        <linearGradient id={`${id}-a`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--sm-accent)" />
          <stop offset="1" stopColor="var(--sm-accent-2)" />
        </linearGradient>
      </defs>
      <path d={CREST_PATHS[shape]} fill={`url(#${id}-a)`} />
      <path d={CREST_INNER[shape]} fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="3" />
      <path d="M22 70 H78" stroke="rgba(255,255,255,0.35)" strokeWidth="2" />
      <text
        x="50"
        y="62"
        textAnchor="middle"
        fontSize={initials.length > 3 ? 22 : 28}
        fontWeight="800"
        fill="#fff"
        style={{ fontFamily: "var(--font-card)", letterSpacing: "1px" }}
      >
        {initials}
      </text>
      <path
        d="M50 80 l3.5 7 7.6 1.1 -5.5 5.4 1.3 7.6 -6.9 -3.6 -6.9 3.6 1.3 -7.6 -5.5 -5.4 7.6 -1.1 Z"
        fill="rgba(255,255,255,0.85)"
      />
    </svg>
  );
}
