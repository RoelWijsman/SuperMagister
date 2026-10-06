/**
 * Vooraf getekende sprites (gloed, rook, glinstering). Eén keer tekenen per
 * kleur en daarna alleen nog drawImage: veel sneller dan per deeltje een
 * gradient maken, dus soepel op een gemiddelde telefoon.
 */
const cache = new Map<string, HTMLCanvasElement>();

function make(
  key: string,
  size: number,
  draw: (ctx: CanvasRenderingContext2D, size: number) => void,
) {
  let canvas = cache.get(key);
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (ctx) draw(ctx, size);
    cache.set(key, canvas);
  }
  return canvas;
}

/** Zachte, ronde gloed. */
export function glowSprite(color: string): HTMLCanvasElement {
  return make(`glow:${color}`, 128, (ctx, size) => {
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, color);
    g.addColorStop(0.35, `${color}aa`);
    g.addColorStop(1, `${color}00`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  });
}

/** Rookpluim: een paar overlappende zachte vlekken, minder perfect rond. */
export function smokeSprite(color: string): HTMLCanvasElement {
  return make(`smoke:${color}`, 128, (ctx, size) => {
    const blobs = [
      [0.5, 0.5, 0.5, 0.55],
      [0.38, 0.42, 0.32, 0.35],
      [0.64, 0.58, 0.3, 0.32],
      [0.5, 0.66, 0.28, 0.28],
    ] as const;
    for (const [x, y, r, a] of blobs) {
      const g = ctx.createRadialGradient(x * size, y * size, 0, x * size, y * size, r * size);
      g.addColorStop(
        0,
        `${color}${Math.round(a * 255)
          .toString(16)
          .padStart(2, "0")}`,
      );
      g.addColorStop(1, `${color}00`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
    }
  });
}

/** Vierpuntige glinstering met een kleine gloed. */
export function sparkleSprite(color: string): HTMLCanvasElement {
  return make(`sparkle:${color}`, 64, (ctx, size) => {
    const c = size / 2;
    const g = ctx.createRadialGradient(c, c, 0, c, c, c);
    g.addColorStop(0, `${color}cc`);
    g.addColorStop(0.25, `${color}33`);
    g.addColorStop(1, `${color}00`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(c, 2);
    ctx.quadraticCurveTo(c + 3, c - 3, size - 2, c);
    ctx.quadraticCurveTo(c + 3, c + 3, c, size - 2);
    ctx.quadraticCurveTo(c - 3, c + 3, 2, c);
    ctx.quadraticCurveTo(c - 3, c - 3, c, 2);
    ctx.fill();
  });
}
