import { del, get, keys, set } from "idb-keyval";
import { IDB_PREFIX } from "@/lib/storage-keys";

/**
 * Dunne laag over idb-keyval. Alles krijgt een vaste prefix en fouten
 * (privévenster, geblokkeerde opslag) worden opgevangen: de app moet ook
 * zonder IndexedDB gewoon werken.
 */
export async function idbGet<T>(key: string): Promise<T | undefined> {
  try {
    return await get<T>(IDB_PREFIX + key);
  } catch {
    return undefined;
  }
}

export async function idbSet<T>(key: string, value: T): Promise<void> {
  try {
    await set(IDB_PREFIX + key, value);
  } catch {
    // Opslag niet beschikbaar: dan maar alleen in het geheugen.
  }
}

export async function idbDel(key: string): Promise<void> {
  try {
    await del(IDB_PREFIX + key);
  } catch {
    // idem
  }
}

/** Alle eigen sleutels (zonder prefix), bijvoorbeeld om bij ontkoppelen op te ruimen. */
export async function idbKeys(): Promise<string[]> {
  try {
    return (await keys())
      .filter((key): key is string => typeof key === "string" && key.startsWith(IDB_PREFIX))
      .map((key) => key.slice(IDB_PREFIX.length));
  } catch {
    return [];
  }
}
