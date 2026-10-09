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

const K = slot("k", "K", 50, 88);
const BACK_FOUR = [
  slot("lb", "LB", 13, 66),
  slot("cv-l", "CV", 37, 69),
  slot("cv-r", "CV", 63, 69),
  slot("rb", "RB", 87, 66),
];
const BACK_FOUR_LINKS: readonly (readonly [string, string])[] = [
  ["k", "cv-l"],
  ["k", "cv-r"],
  ["lb", "cv-l"],
  ["cv-l", "cv-r"],
  ["cv-r", "rb"],
];
const BACK_THREE = [
  slot("cv-l", "CV", 28, 68),
  slot("cv-m", "CV", 50, 70),
  slot("cv-r", "CV", 72, 68),
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
      slot("cm-l", "CM", 28, 42),
      slot("cm-m", "CM", 50, 46),
      slot("cm-r", "CM", 72, 42),
      slot("lv", "LV", 16, 19),
      slot("sp", "SP", 50, 13),
      slot("rv", "RV", 84, 19),
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
      slot("lm", "LM", 13, 39),
      slot("cm-l", "CM", 38, 44),
      slot("cm-r", "CM", 62, 44),
      slot("rm", "RM", 87, 39),
      slot("sp-l", "SP", 36, 14),
      slot("sp-r", "SP", 64, 14),
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
      slot("cvm-l", "CVM", 37, 49),
      slot("cvm-r", "CVM", 63, 49),
      slot("lm", "LM", 15, 29),
      slot("cam", "CAM", 50, 31),
      slot("rm", "RM", 85, 29),
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
      slot("lm", "LM", 10, 40),
      slot("cvm-l", "CVM", 34, 49),
      slot("cam", "CAM", 50, 31),
      slot("cvm-r", "CVM", 66, 49),
      slot("rm", "RM", 90, 40),
      slot("sp-l", "SP", 35, 12),
      slot("sp-r", "SP", 65, 12),
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
      slot("lvb", "LVB", 9, 56),
      ...BACK_THREE,
      slot("rvb", "RVB", 91, 56),
      slot("cm-l", "CM", 28, 38),
      slot("cm-m", "CM", 50, 42),
      slot("cm-r", "CM", 72, 38),
      slot("sp-l", "SP", 35, 13),
      slot("sp-r", "SP", 65, 13),
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
