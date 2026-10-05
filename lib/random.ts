/** Kleine seeded PRNG (mulberry32): dezelfde seed geeft altijd dezelfde demo. */
export function createRandom(seed: number) {
  let state = seed >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    next,
    /** Geheel getal in [min, max]. */
    int(min: number, max: number) {
      return min + Math.floor(next() * (max - min + 1));
    },
    chance(probability: number) {
      return next() < probability;
    },
    pick<T>(items: readonly T[]): T {
      const item = items[Math.floor(next() * items.length)];
      if (item === undefined) throw new Error("pick() op een lege lijst");
      return item;
    },
    /** Kiest `count` verschillende elementen. */
    sample<T>(items: readonly T[], count: number): T[] {
      const pool = [...items];
      const result: T[] = [];
      while (result.length < count && pool.length > 0) {
        const [item] = pool.splice(Math.floor(next() * pool.length), 1);
        if (item !== undefined) result.push(item);
      }
      return result;
    },
  };
}

export type Random = ReturnType<typeof createRandom>;
