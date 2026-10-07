/** Sleutels voor lokale opslag. Op één plek, zodat inline-script en stores het eens zijn. */
export const STORAGE_KEYS = {
  settings: "sm-instellingen",
  collection: "sm-collectie",
  achievements: "sm-prestaties",
  today: "sm-vandaag",
  schedule: "sm-rooster",
  homework: "sm-huiswerk",
  grades: "sm-cijfers",
} as const;

/** Prefix voor alles wat in IndexedDB staat (via idb-keyval). */
export const IDB_PREFIX = "sm:";
