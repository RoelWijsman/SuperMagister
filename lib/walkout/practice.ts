import { formatGrade } from "@/lib/calc/average";
import { computeCards } from "@/lib/calc/cards";
import { toCardData, type CardData, type CardSubject } from "@/lib/cards/model";
import type { Grade } from "@/lib/types";

/**
 * De walkout-oefenmodus (§11): nepcijfers om alle tiers en varianten te
 * bekijken. Elke kaart heeft een kleine, verzonnen geschiedenis, zodat
 * varianten en stats kloppen. Niets hiervan wordt opgeslagen.
 */
export interface PracticeEntry {
  id: string;
  label: string;
  card: CardData;
  /** Alle (nep)cijfers van het vak, voor de reactieregels. */
  grades: Grade[];
}

interface PracticeSpec {
  id: string;
  label: string;
  subject: CardSubject & { id: string };
  description: string;
  history: number[];
  value: number;
  weight: number;
}

const SPECS: readonly PracticeSpec[] = [
  {
    id: "brons",
    label: "Brons",
    subject: { id: "oefen-fa", name: "Frans", code: "fa", icon: "Croissant", color: "#ff77a9" },
    description: "SO Passé composé",
    history: [6.2],
    value: 4.6,
    weight: 1,
  },
  {
    id: "zilver",
    label: "Zilver",
    subject: {
      id: "oefen-sk",
      name: "Scheikunde",
      code: "schk",
      icon: "FlaskConical",
      color: "#2ccfc0",
    },
    description: "Toets Zuren en basen",
    history: [6, 5],
    value: 6.3,
    weight: 2,
  },
  {
    id: "goud",
    label: "Goud",
    subject: {
      id: "oefen-gs",
      name: "Geschiedenis",
      code: "gs",
      icon: "Landmark",
      color: "#ffb38a",
    },
    description: "PW Koude Oorlog",
    history: [7.9, 8],
    value: 7.6,
    weight: 3,
  },
  {
    id: "inform",
    label: "In Form",
    subject: {
      id: "oefen-en",
      name: "Engels",
      code: "en",
      icon: "MessagesSquare",
      color: "#3db8ff",
    },
    description: "Literature: Gatsby",
    history: [6.5, 7],
    value: 8.2,
    weight: 2,
  },
  {
    id: "toty",
    label: "TOTY",
    subject: { id: "oefen-bi", name: "Biologie", code: "biol", icon: "Leaf", color: "#3ee69a" },
    description: "Toets H5 Ecologie",
    history: [8.3, 8.8],
    value: 9.1,
    weight: 2,
  },
  {
    id: "icon",
    label: "ICON",
    subject: { id: "oefen-wb", name: "Wiskunde B", code: "wisB", icon: "Sigma", color: "#8c6bff" },
    description: "PW Differentiëren",
    history: [9, 9.4],
    value: 9.8,
    weight: 3,
  },
];

function grade(spec: PracticeSpec, value: number, index: number, isMain: boolean): Grade {
  const day = String(index + 1).padStart(2, "0");
  return {
    id: isMain ? `oefen-${spec.id}` : `oefen-${spec.id}-${index}`,
    subjectId: spec.subject.id,
    description: isMain ? spec.description : `Oefentoets ${index + 1}`,
    weight: isMain ? spec.weight : 1,
    date: `2026-09-${day}`,
    enteredAt: `2026-09-${day}T15:00:00.000Z`,
    periodId: "oefen",
    countsTowardAverage: true,
    isPTA: false,
    kind: "numeric",
    value,
    display: formatGrade(value),
    isSufficient: value >= 5.5,
  };
}

export function practiceDeck(studentName: string): PracticeEntry[] {
  return SPECS.map((spec) => {
    const grades = [
      ...spec.history.map((value, i) => grade(spec, value, i, false)),
      grade(spec, spec.value, spec.history.length, true),
    ];
    const core = computeCards(grades).get(`oefen-${spec.id}`)!;
    return {
      id: spec.id,
      label: spec.label,
      card: toCardData(core, spec.subject, {
        studentName,
        periodName: "Oefenen",
        isPractice: true,
      }),
      grades,
    };
  });
}
