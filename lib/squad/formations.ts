/**
 * Jouw Elftal: de posities en formaties, zoals de squad builder van Ultimate
 * Team. Elke formatie heeft elf plekken op het veld (met een plek in procenten:
 * x van links naar rechts, y van de aanval bovenaan naar de keeper onderaan) en
 * de lijnen tussen plekken die naast elkaar staan. Over die lijnen loopt de
 * chemie.
 */

/** De vier linies van een elftal. */
export type Line = "aanval" | "middenveld" | "verdediging" | "keeper";

export const LINES: readonly Line[] = ["aanval", "middenveld", "verdediging", "keeper"];

export const LINE_LABELS: Readonly<Record<Line, string>> = {
  aanval: "Aanval",
  middenveld: "Middenveld",
  verdediging: "Verdediging",
  keeper: "Keeper",
};

/** Posities, met Nederlandse afkortingen. */
export type Position =
  | "K"
  | "LB"
  | "CV"
  | "RB"
  | "LVB"
  | "RVB"
  | "CVM"
  | "CM"
  | "LM"
  | "RM"
  | "CAM"
  | "LV"
  | "RV"
  | "SP";

export const POSITION_LINE: Readonly<Record<Position, Line>> = {
  K: "keeper",
  LB: "verdediging",
  CV: "verdediging",
  RB: "verdediging",
  LVB: "verdediging",
  RVB: "verdediging",
  CVM: "middenveld",
  CM: "middenveld",
  LM: "middenveld",
  RM: "middenveld",
  CAM: "middenveld",
  LV: "aanval",
  RV: "aanval",
  SP: "aanval",
};

/** Voluit, voor schermlezers en uitleg. */
export const POSITION_NAMES: Readonly<Record<Position, string>> = {
  K: "Keeper",
  LB: "Linksback",
  CV: "Centrale verdediger",
  RB: "Rechtsback",
  LVB: "Linker vleugelverdediger",
  RVB: "Rechter vleugelverdediger",
  CVM: "Verdedigende middenvelder",
  CM: "Centrale middenvelder",
  LM: "Linker middenvelder",
  RM: "Rechter middenvelder",
  CAM: "Aanvallende middenvelder",
  LV: "Linksvoor",
  RV: "Rechtsvoor",
  SP: "Spits",
};

export interface Slot {
  /** Uniek binnen de formatie, bijv. "cv-l". */
  id: string;
  position: Position;
  /** 0 = links, 100 = rechts. */
  x: number;
  /** 0 = de aanval bovenaan, 100 = de achterlijn onderaan. */
  y: number;
}

export type FormationId = "4-3-3" | "4-4-2" | "4-2-3-1" | "3-5-2" | "5-3-2";

export const FORMATION_IDS: readonly FormationId[] = [
  "4-3-3",
  "4-4-2",
  "4-2-3-1",
  "3-5-2",
  "5-3-2",
];

export interface Formation {
  id: FormationId;
  slots: readonly Slot[];
  /** De chemie-lijnen: paren van slot-id's die naast elkaar staan. */
  links: readonly (readonly [string, string])[];
}

const slot = (id: string, position: Position, x: number, y: number): Slot => ({
  id,
  position,
  x,
  y,
});

// Plekken zo verdeeld dat kaartjes in opeenvolgende linies om elkaar heen vallen
// (de centrale verdedigers staan naast de keeper, niet erboven): zo kunnen de
// kaartjes groot zijn zonder te overlappen. Zie lib/squad/layout.ts.
const K = slot("k", "K", 50, 88);
const BACK_FOUR = [
  slot("lb", "LB", 10, 66),
  slot("cv-l", "CV", 30, 72),
  slot("cv-r", "CV", 70, 72),
  slot("rb", "RB", 90, 66),
];
const BACK_FOUR_LINKS: readonly (readonly [string, string])[] = [
  ["k", "cv-l"],
  ["k", "cv-r"],
  ["lb", "cv-l"],
  ["cv-l", "cv-r"],
  ["cv-r", "rb"],
];
const BACK_THREE = [
  slot("cv-l", "CV", 30, 72),
  slot("cv-m", "CV", 50, 63),
  slot("cv-r", "CV", 70, 72),
];
const BACK_THREE_LINKS: readonly (readonly [string, string])[] = [
  ["k", "cv-l"],
  ["k", "cv-m"],
  ["k", "cv-r"],
  ["cv-l", "cv-m"],
  ["cv-m", "cv-r"],
];

export const FORMATIONS: Readonly<Record<FormationId, Formation>> = {
  "4-3-3": {
    id: "4-3-3",
    slots: [
      K,
      ...BACK_FOUR,
      slot("cm-l", "CM", 30, 43),
      slot("cm-m", "CM", 50, 39),
      slot("cm-r", "CM", 70, 43),
      slot("lv", "LV", 13, 18),
      slot("sp", "SP", 50, 12),
      slot("rv", "RV", 87, 18),
    ],
    links: [
      ...BACK_FOUR_LINKS,
      ["lb", "cm-l"],
      ["cv-l", "cm-m"],
      ["cv-r", "cm-m"],
      ["rb", "cm-r"],
      ["cm-l", "cm-m"],
      ["cm-m", "cm-r"],
      ["cm-l", "lv"],
      ["cm-m", "sp"],
      ["cm-r", "rv"],
      ["lv", "sp"],
      ["sp", "rv"],
    ],
  },
  "4-4-2": {
    id: "4-4-2",
    slots: [
      K,
      ...BACK_FOUR,
      slot("lm", "LM", 10, 40),
      slot("cm-l", "CM", 34, 45),
      slot("cm-r", "CM", 66, 45),
      slot("rm", "RM", 90, 40),
      slot("sp-l", "SP", 36, 13),
      slot("sp-r", "SP", 64, 13),
    ],
    links: [
      ...BACK_FOUR_LINKS,
      ["lb", "lm"],
      ["cv-l", "cm-l"],
      ["cv-r", "cm-r"],
      ["rb", "rm"],
      ["lm", "cm-l"],
      ["cm-l", "cm-r"],
      ["cm-r", "rm"],
      ["lm", "sp-l"],
      ["cm-l", "sp-l"],
      ["cm-r", "sp-r"],
      ["rm", "sp-r"],
      ["sp-l", "sp-r"],
    ],
  },
  "4-2-3-1": {
    id: "4-2-3-1",
    slots: [
      K,
      ...BACK_FOUR,
      slot("cvm-l", "CVM", 30, 47),
      slot("cvm-r", "CVM", 70, 47),
      slot("lm", "LM", 10, 31),
      slot("cam", "CAM", 50, 35),
      slot("rm", "RM", 90, 31),
      slot("sp", "SP", 50, 11),
    ],
    links: [
      ...BACK_FOUR_LINKS,
      ["lb", "lm"],
      ["cv-l", "cvm-l"],
      ["cv-r", "cvm-r"],
      ["rb", "rm"],
      ["cvm-l", "cvm-r"],
      ["cvm-l", "cam"],
      ["cvm-r", "cam"],
      ["lm", "cam"],
      ["cam", "rm"],
      ["lm", "sp"],
      ["cam", "sp"],
      ["rm", "sp"],
    ],
  },
  "3-5-2": {
    id: "3-5-2",
    slots: [
      K,
      ...BACK_THREE,
      slot("lm", "LM", 10, 39),
      slot("cvm-l", "CVM", 30, 47),
      slot("cam", "CAM", 50, 35),
      slot("cvm-r", "CVM", 70, 47),
      slot("rm", "RM", 90, 39),
      slot("sp-l", "SP", 30, 12),
      slot("sp-r", "SP", 70, 12),
    ],
    links: [
      ...BACK_THREE_LINKS,
      ["cv-l", "lm"],
      ["cv-l", "cvm-l"],
      ["cv-m", "cvm-l"],
      ["cv-m", "cvm-r"],
      ["cv-r", "cvm-r"],
      ["cv-r", "rm"],
      ["lm", "cvm-l"],
      ["cvm-l", "cvm-r"],
      ["cvm-r", "rm"],
      ["cvm-l", "cam"],
      ["cvm-r", "cam"],
      ["lm", "sp-l"],
      ["cam", "sp-l"],
      ["cam", "sp-r"],
      ["rm", "sp-r"],
      ["sp-l", "sp-r"],
    ],
  },
  "5-3-2": {
    id: "5-3-2",
    slots: [
      K,
      slot("lvb", "LVB", 10, 56),
      ...BACK_THREE,
      slot("rvb", "RVB", 90, 56),
      slot("cm-l", "CM", 30, 41),
      slot("cm-m", "CM", 50, 37),
      slot("cm-r", "CM", 70, 41),
      slot("sp-l", "SP", 35, 12),
      slot("sp-r", "SP", 65, 12),
    ],
    links: [
      ...BACK_THREE_LINKS,
      ["lvb", "cv-l"],
      ["cv-r", "rvb"],
      ["lvb", "cm-l"],
      ["cv-m", "cm-m"],
      ["rvb", "cm-r"],
      ["cm-l", "cm-m"],
      ["cm-m", "cm-r"],
      ["cm-l", "sp-l"],
      ["cm-m", "sp-l"],
      ["cm-m", "sp-r"],
      ["cm-r", "sp-r"],
      ["sp-l", "sp-r"],
    ],
  },
};

export function slotLine(slot: Slot): Line {
  return POSITION_LINE[slot.position];
}

/** De plekken naast een plek (via de chemie-lijnen). */
export function neighbours(formation: Formation, slotId: string): string[] {
  return formation.links.flatMap(([a, b]) => (a === slotId ? [b] : b === slotId ? [a] : []));
}

export function findSlot(formation: Formation, slotId: string): Slot | undefined {
  return formation.slots.find((s) => s.id === slotId);
}

export const BENCH_SIZE = 7;
