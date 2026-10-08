import { describe, expect, it, vi } from "vitest";
import { withCache, type CacheBackend, type CacheEntry, type LockFn } from "./cache";
import { MagisterError } from "./transport";

const MINUTE = 60_000;

function memoryBackend(): CacheBackend & { entries: Map<string, CacheEntry> } {
  const entries = new Map<string, CacheEntry>();
  return {
    entries,
    get: async <T>(key: string) => entries.get(key) as CacheEntry<T> | undefined,
    set: async (key, entry) => {
      entries.set(key, entry);
    },
  };
}

/** Zoals navigator.locks: taken met dezelfde naam wachten op elkaar. */
function memoryLock(): LockFn {
  const queues = new Map<string, Promise<unknown>>();
  return (name, task) => {
    const previous = queues.get(name) ?? Promise.resolve();
    const next = previous.then(task, task);
    queues.set(
      name,
      next.catch(() => undefined),
    );
    return next;
  };
}

function setup({ backend = memoryBackend(), lock = memoryLock() } = {}) {
  let time = Date.UTC(2026, 9, 7, 14, 2);
  let version = 1;
  const inner = {
    id: "magister:voorbeeld.magister.net:1002",
    getGrades: vi.fn(async () => [`cijfers v${version}`]),
    getLessons: vi.fn(async (range: { from: string; to: string }) => [`${range.from} v${version}`]),
    label: "Voorbeeld",
  };
  const onFresh = vi.fn();
  const onError = vi.fn();
  const source = withCache(inner, {
    prefix: inner.id,
    methods: ["getGrades", "getLessons"],
    freshness: { getGrades: 15 * MINUTE, getLessons: 15 * MINUTE },
    backend,
    lock,
    now: () => time,
    onFresh,
    onError,
  });
  return {
    source,
    inner,
    backend,
    onFresh,
    onError,
    tick: (ms: number) => (time += ms),
    bump: () => version++,
    now: () => time,
  };
}

/** Wacht tot achtergrondwerk (verversen) klaar is. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("withCache", () => {
  it("haalt de eerste keer op en bewaart het antwoord", async () => {
    const { source, inner, backend } = setup();
    expect(await source.getGrades()).toEqual(["cijfers v1"]);
    expect(inner.getGrades).toHaveBeenCalledTimes(1);
    expect([...backend.entries.keys()]).toContain(
      "magister:voorbeeld.magister.net:1002|getGrades|[]",
    );
  });

  it("laat andere velden van de bron met rust", () => {
    const { source } = setup();
    expect(source.id).toBe("magister:voorbeeld.magister.net:1002");
    expect(source.label).toBe("Voorbeeld");
  });

  it("vraagt binnen 15 minuten niets opnieuw aan Magister", async () => {
    const { source, inner, tick } = setup();
    await source.getGrades();
    tick(14 * MINUTE);
    await source.getGrades();
    expect(inner.getGrades).toHaveBeenCalledTimes(1);
  });

  it("geeft daarna eerst het oude antwoord en ververst op de achtergrond", async () => {
    const { source, inner, tick, bump, onFresh } = setup();
    await source.getGrades();
    tick(16 * MINUTE);
    bump();
    expect(await source.getGrades()).toEqual(["cijfers v1"]);
    await settle();
    expect(inner.getGrades).toHaveBeenCalledTimes(2);
    expect(onFresh).toHaveBeenCalledTimes(2);
    expect(await source.getGrades()).toEqual(["cijfers v2"]);
  });

  it("ververst ook als de klok van het scherm net iets vóórloopt", async () => {
    // De schermen verversen elke 15 minuten; zonder speling zou het telkens net te vroeg
    // zijn en werd het pas na 30 minuten echt ververst.
    const { source, inner, tick } = setup();
    await source.getGrades();
    tick(15 * MINUTE - 10_000);
    await source.getGrades();
    await settle();
    expect(inner.getGrades).toHaveBeenCalledTimes(2);
  });

  it("houdt per argument (week) een eigen antwoord bij", async () => {
    const { source, inner } = setup();
    await source.getLessons({ from: "2026-10-05", to: "2026-10-11" });
    await source.getLessons({ from: "2026-10-12", to: "2026-10-18" });
    await source.getLessons({ from: "2026-10-05", to: "2026-10-11" });
    expect(inner.getLessons).toHaveBeenCalledTimes(2);
  });

  it("vraagt niet dubbel als twee schermen tegelijk hetzelfde willen", async () => {
    const { source, inner } = setup();
    await Promise.all([source.getGrades(), source.getGrades(), source.getGrades()]);
    expect(inner.getGrades).toHaveBeenCalledTimes(1);
  });

  it("vraagt niet opnieuw als een ander tabblad net heeft ververst", async () => {
    // Twee tabbladen: dezelfde opslag (IndexedDB) en hetzelfde slot.
    const backend = memoryBackend();
    const lock = memoryLock();
    const first = setup({ backend, lock });
    const second = setup({ backend, lock });
    await Promise.all([first.source.getGrades(), second.source.getGrades()]);
    expect(first.inner.getGrades.mock.calls.length + second.inner.getGrades.mock.calls.length).toBe(
      1,
    );
  });

  it("geeft een fout door als er nog niets bewaard is", async () => {
    const { source, inner, onError } = setup();
    const error = new MagisterError("verlopen", "Verlopen.", 401);
    inner.getGrades.mockRejectedValueOnce(error);
    await expect(source.getGrades()).rejects.toBe(error);
    expect(onError).toHaveBeenCalledWith(error);
  });

  it("houdt de oude data zichtbaar als verversen mislukt (bijv. een 401)", async () => {
    const { source, inner, tick, onError } = setup();
    await source.getGrades();
    tick(20 * MINUTE);
    const error = new MagisterError("verlopen", "Verlopen.", 401);
    inner.getGrades.mockRejectedValueOnce(error);
    expect(await source.getGrades()).toEqual(["cijfers v1"]);
    await settle();
    expect(onError).toHaveBeenCalledWith(error);
  });

  it("probeert na een mislukte verversing niet meteen opnieuw", async () => {
    const { source, inner, tick } = setup();
    await source.getGrades();
    tick(20 * MINUTE);
    inner.getGrades.mockRejectedValueOnce(new MagisterError("server", "Plat.", 502));
    await source.getGrades();
    await settle();
    await source.getGrades();
    await settle();
    expect(inner.getGrades).toHaveBeenCalledTimes(2);
    tick(2 * MINUTE);
    await source.getGrades();
    await settle();
    expect(inner.getGrades).toHaveBeenCalledTimes(3);
  });

  it("wacht bij 'te vaak' zo lang als Magister vraagt", async () => {
    const { source, inner, tick } = setup();
    await source.getGrades();
    tick(20 * MINUTE);
    inner.getGrades.mockRejectedValueOnce(new MagisterError("te-vaak", "Rustig.", 429, 300));
    await source.getGrades();
    await settle();
    tick(2 * MINUTE);
    await source.getGrades();
    await settle();
    expect(inner.getGrades).toHaveBeenCalledTimes(2);
    tick(4 * MINUTE);
    await source.getGrades();
    await settle();
    expect(inner.getGrades).toHaveBeenCalledTimes(3);
  });

  it("onthoudt wanneer de data voor het laatst is opgehaald", async () => {
    const { source, now, tick } = setup();
    expect(await source.lastUpdated()).toBeNull();
    await source.getGrades();
    const first = now();
    expect(await source.lastUpdated()).toBe(first);
    tick(5 * MINUTE);
    await source.getGrades();
    expect(await source.lastUpdated()).toBe(first);
  });
});
