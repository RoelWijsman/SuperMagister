/** Sleutels voor lokale opslag. Op één plek, zodat inline-script en stores het eens zijn. */
export const STORAGE_KEYS = {
  settings: "sm-instellingen",
} as const;

/** Prefix voor alles wat in IndexedDB staat (via idb-keyval). */
export const IDB_PREFIX = "sm:";
