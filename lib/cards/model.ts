import type { CardCore } from "@/lib/calc/cards";
import { TIER_LABELS, type CardTier } from "@/lib/calc/tiers";
import type { SubjectIconName } from "@/lib/subjects/icons";

/**
 * Alles wat nodig is om een kaart te tekenen en te tonen: de kaartlogica
 * (CardCore) plus het vak, de kleur, het icoon en de naam van de leerling.
 */
export interface CardData extends CardCore {
  id: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  icon: SubjectIconName;
  /** Vakkleur (hex). */
  color: string;
  studentName: string;
  periodName: string | null;
  /** Oefenkaart: telt nergens mee en wordt niet bewaard. */
  isPractice: boolean;
}

export interface CardSubject {
  name: string;
  code: string;
  icon: SubjectIconName;
  color: string;
}

export function toCardData(
  core: CardCore,
  subject: CardSubject,
  context: { studentName: string; periodName?: string | null; isPractice?: boolean },
): CardData {
  return {
    ...core,
    id: core.gradeId,
    subjectId: core.grade.subjectId,
    subjectName: subject.name,
    subjectCode: subject.code,
    icon: subject.icon,
    color: subject.color,
    studentName: context.studentName,
    periodName: context.periodName ?? null,
    isPractice: context.isPractice ?? false,
  };
}

export type CardLook = CardTier | "inform";

/**
 * Het uiterlijk van een kaart. In Form is zwart met goud, maar TOTY en ICON
 * zijn zeldzamer en blijven daarom altijd zichzelf.
 */
export function cardLook(card: Pick<CardData, "tier" | "primaryVariant">): CardLook {
  const special = card.tier === "toty" || card.tier === "icon";
  return card.primaryVariant === "inform" && !special ? "inform" : card.tier;
}

/** "ICON", "TOTY", … en bij een In Form-kaart "IN FORM". */
export function cardTierLabel(card: Pick<CardData, "tier" | "primaryVariant">): string {
  return cardLook(card) === "inform" ? "IN FORM" : TIER_LABELS[card.tier].toUpperCase();
}

/** Korte beschrijving voor schermlezers. */
export function cardAltText(card: CardData): string {
  return `${cardTierLabel(card)}-kaart: ${card.subjectName}, ${card.stats.cyf} voor ${card.grade.description}.`;
}
