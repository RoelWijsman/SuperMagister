import type { CSSProperties } from "react";
import { createRandom } from "@/lib/random";

interface Star {
  top: string;
  left: string;
  size: string;
  style: CSSProperties;
}

/** Vaste sterrenhemel: altijd dezelfde posities, dus geen hydratieverschillen. */
const STARS: readonly Star[] = (() => {
  const random = createRandom(20261005);
  return Array.from({ length: 70 }, () => {
    const size = 1 + random.next() * 1.6;
    return {
      top: `${(random.next() * 72).toFixed(2)}%`,
      left: `${(random.next() * 100).toFixed(2)}%`,
      size: `${size.toFixed(2)}px`,
      style: {
        "--twinkle-duration": `${(2.6 + random.next() * 4).toFixed(2)}s`,
        "--twinkle-delay": `${(-random.next() * 6).toFixed(2)}s`,
        "--star-min": (0.15 + random.next() * 0.45).toFixed(2),
      } as CSSProperties,
    };
  });
})();

/**
 * De achtergrond van de hele app: een langzaam bewegende aurora, een laag die
 * meekleurt met de tijd van de dag, 's nachts sterren, en een fijne korrel.
 * Puur CSS (zie .sky in globals.css), dus geen JavaScript per frame.
 */
export function Sky() {
  return (
    <div className="sky" aria-hidden>
      <div className="sky__blob sky__blob--1" />
      <div className="sky__blob sky__blob--2" />
      <div className="sky__blob sky__blob--3" />
      <div className="sky__blob sky__blob--4" />
      <div className="sky__ribbon" />
      <div className="sky__time sky__time--ochtend" />
      <div className="sky__time sky__time--dag" />
      <div className="sky__time sky__time--avond" />
      <div className="sky__time sky__time--nacht" />
      <div className="sky__stars">
        {STARS.map((star, i) => (
          <span
            key={i}
            className="sky__star"
            style={{
              ...star.style,
              top: star.top,
              left: star.left,
              width: star.size,
              height: star.size,
            }}
          />
        ))}
        <span className="sky__meteor" />
      </div>
      <div className="sky__vignette" />
      <div className="sky__noise" />
    </div>
  );
}
