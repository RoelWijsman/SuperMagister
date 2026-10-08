/** Sleutels voor lokale opslag. Op één plek, zodat inline-script en stores het eens zijn. */
export const STORAGE_KEYS = {
  settings: "sm-instellingen",
  collection: "sm-collectie",
  achievements: "sm-prestaties",
  today: "sm-vandaag",
  schedule: "sm-rooster",
  homework: "sm-huiswerk",
  grades: "sm-cijfers",
  /** Met welk Magister-account je gekoppeld bent (nooit het token zelf). */
  connection: "sm-koppeling",
  /** Waar je in de onboarding was, en of hij klaar is. */
  onboarding: "sm-onboarding",
} as const;

/** Prefix voor alles wat in IndexedDB staat (via idb-keyval). */
export const IDB_PREFIX = "sm:";
