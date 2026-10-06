import type { CardVariant } from "@/lib/calc/cards";
import type { CardTier } from "@/lib/calc/tiers";
import type { SubjectGroup } from "@/lib/types";

/**
 * Verzameldoelen (§12) met voortgang en een beloning: een folie-effect voor
 * je kaarten. Folies blijven binnen de kaartenwereld; de rest van de app
 * houdt zijn eigen stijl.
 */
export type FoilId = "standaard" | "regenboog" | "goud" | "sterren" | "vlam" | "prisma";

export const FOILS: Readonly<Record<FoilId, { name: string; description: string }>> = {
  standaard: { name: "Glans", description: "Een zachte glimlijn die met je meebeweegt." },
  regenboog: { name: "Regenboog", description: "Alle kleuren, schuin over de kaart." },
  goud: { name: "Bladgoud", description: "Warme gouden schittering." },
  sterren: { name: "Sterrenhemel", description: "Fonkelende sterretjes onder het glas." },
  vlam: { name: "Vlammen", description: "Oranje gloed, voor kaarten met karakter." },
  prisma: { name: "Prisma", description: "Licht dat breekt in alle richtingen." },
};

export const FOIL_ORDER: readonly FoilId[] = [
  "standaard",
  "regenboog",
  "goud",
  "sterren",
  "vlam",
  "prisma",
];

export interface GoalCard {
  subjectId: string;
  tier: CardTier;
  variants: readonly CardVariant[];
  /** Voldoende-reeks in het vak tot en met deze kaart. */
  streak: number;
}

export interface CollectionGoal {
  id: string;
  title: string;
  description: string;
  current: number;
  target: number;
  done: boolean;
  reward: Exclude<FoilId, "standaard">;
}

const GOLD_OR_BETTER: ReadonlySet<CardTier> = new Set(["goud", "toty", "icon"]);
const TOTY_OR_BETTER: ReadonlySet<CardTier> = new Set(["toty", "icon"]);
const MIN_SUBJECTS = 5;

const progress = (
  base: Omit<CollectionGoal, "current" | "done">,
  value: number,
): CollectionGoal => ({
  ...base,
  current: Math.min(value, base.target),
  done: value >= base.target,
});

export function collectionGoals(
  cards: readonly GoalCard[],
  groupOf: (subjectId: string) => SubjectGroup,
): CollectionGoal[] {
  const subjects = new Set(cards.map((card) => card.subjectId));
  const goldSubjects = new Set(
    cards.filter((card) => GOLD_OR_BETTER.has(card.tier)).map((card) => card.subjectId),
  );
  const exactTops = cards.filter(
    (card) => TOTY_OR_BETTER.has(card.tier) && groupOf(card.subjectId) === "exact",
  );
  const comebacks = cards.filter((card) => card.variants.includes("comeback"));
  const longestStreak = cards.reduce((max, card) => Math.max(max, card.streak), 0);

  return [
    progress(
      {
        id: "startelftal",
        title: "Startelftal",
        description: "Verzamel 11 kaarten.",
        target: 11,
        reward: "regenboog",
      },
      cards.length,
    ),
    progress(
      {
        id: "goudkoorts",
        title: "Goudkoorts",
        description: "Een gouden kaart (of beter) in elk vak. Minstens vijf vakken.",
        target: Math.max(MIN_SUBJECTS, subjects.size),
        reward: "goud",
      },
      goldSubjects.size,
    ),
    progress(
      {
        id: "exact",
        title: "Exacte toppers",
        description: "3 TOTY- of ICON-kaarten in exacte vakken.",
        target: 3,
        reward: "sterren",
      },
      exactTops.length,
    ),
    progress(
      {
        id: "comeback",
        title: "Comebackkoning",
        description: "3 comeback-kaarten: van een onvoldoende naar een voldoende.",
        target: 3,
        reward: "vlam",
      },
      comebacks.length,
    ),
    progress(
      {
        id: "reeks",
        title: "Reeksmachine",
        description: "5 voldoendes op rij in één vak.",
        target: 5,
        reward: "prisma",
      },
      longestStreak,
    ),
  ];
}

/** Folies die je mag gebruiken: altijd de standaard, plus wat je verdiend hebt. */
export function unlockedFoils(goals: readonly CollectionGoal[]): FoilId[] {
  const earned = new Set<FoilId>(goals.filter((goal) => goal.done).map((goal) => goal.reward));
  return FOIL_ORDER.filter((foil) => foil === "standaard" || earned.has(foil));
}
