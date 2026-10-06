import type { CopyKey } from "@/content/copy";
import { formatGrade, roundHalfUp } from "@/lib/calc/average";
import type { CardCore, CardVariant } from "@/lib/calc/cards";
import { averageWith, requiredGrade } from "@/lib/calc/whatif";
import { guessOutcome, type GuessOutcome, type GuessOutcomeKind } from "@/lib/guess/outcome";
import type { CopyLine } from "@/lib/greeting";
import type { Grade } from "@/lib/types";

const PASS = 5.5;
/** Het "realistische goede cijfer" waarmee we rekenen als het gemiddelde nog voldoende is. */
const DECENT = 7;

const TIER_REACTION: Readonly<Record<CardCore["tier"], CopyKey>> = {
  icon: "walkout.reactie.icon",
  toty: "walkout.reactie.toty",
  goud: "walkout.reactie.goud",
  zilver: "walkout.reactie.zilver",
  brons: "walkout.reactie.tekst",
};

const VARIANT_REACTION: Readonly<Record<NonNullable<CardCore["primaryVariant"]>, CopyKey>> = {
  inform: "walkout.variant.inform",
  record: "walkout.variant.record",
  comeback: "walkout.variant.comeback",
  reeks: "walkout.variant.reeks",
};

/**
 * Welke variant het beste verhaal vertelt. Los van de look: een In Form-kaart
 * is zwart met goud, maar als het ook een comeback is, zeggen we dat.
 */
const STORY_ORDER: readonly CardVariant[] = ["comeback", "record", "reeks", "inform"];

const GUESS_REACTION: Readonly<Record<GuessOutcomeKind, CopyKey>> = {
  exact: "gok.uitslag.exact",
  dichtbij: "gok.uitslag.dichtbij",
  netjes: "gok.uitslag.netjes",
  ernaast: "gok.uitslag.ernaast",
  veelHoger: "gok.uitslag.veelHoger",
  veelLager: "gok.uitslag.veelLager",
};

/** Cijfers van hetzelfde vak tot en met dit cijfer. */
function historyUpTo(grade: Grade, grades: readonly Grade[]): Grade[] {
  return grades.filter(
    (other) =>
      other.subjectId === grade.subjectId &&
      (other.date < grade.date ||
        (other.date === grade.date && other.enteredAt <= grade.enteredAt)),
  );
}

/**
 * De regels op het eindscherm van een kaart. Bij een onvoldoende volgens de
 * humorbijbel: eerst de droge grap, dan oprechte steun, dan een concrete actie.
 */
export function reactionLines(
  card: CardCore,
  grades: readonly Grade[],
  { subjectName: vak }: { subjectName: string },
): CopyLine[] {
  const grade = card.grade;
  const numeric = grade.kind === "numeric";
  const cijfer = numeric ? formatGrade(grade.value) : grade.display;

  if (card.isFail) {
    const lines: CopyLine[] = [
      {
        key: numeric && grade.value >= 5 ? "walkout.onvoldoende.bijna" : "walkout.onvoldoende.grap",
        vars: { cijfer, vak },
      },
      { key: "walkout.onvoldoende.steun", vars: {} },
    ];
    if (!numeric) return lines;

    const history = historyUpTo(grade, grades);
    const weight = grade.weight > 0 ? grade.weight : 1;
    const average = card.avgAfter;
    const calm = () =>
      lines.push({
        key: "walkout.onvoldoende.actieRustig",
        vars: {
          gem: formatGrade(average ?? grade.value),
          nodig: formatGrade(DECENT),
          doel: formatGrade(averageWith(history, DECENT, weight)),
        },
      });

    if (average !== null && roundHalfUp(average, 1) >= PASS) {
      calm();
    } else {
      const needed = requiredGrade(history, PASS, weight);
      if (needed.status === "mogelijk" && needed.grade !== null) {
        lines.push({
          key: "walkout.onvoldoende.actie",
          vars: { nodig: formatGrade(needed.grade), doel: formatGrade(PASS) },
        });
      } else if (needed.status === "onmogelijk") {
        lines.push({ key: "walkout.onvoldoende.actieLang", vars: {} });
      } else {
        calm();
      }
    }
    return lines;
  }

  const lines: CopyLine[] = [
    {
      key: numeric ? TIER_REACTION[card.tier] : "walkout.reactie.tekst",
      vars: { cijfer, vak, omschrijving: grade.description },
    },
  ];
  const story = STORY_ORDER.find((variant) => card.variants.includes(variant));
  if (story) {
    const verschil =
      numeric && card.avgBefore !== null
        ? formatGrade(Math.max(0, grade.value - card.avgBefore))
        : "0,0";
    lines.push({
      key: VARIANT_REACTION[story],
      vars: { verschil, vak, aantal: card.streak },
    });
  }
  return lines;
}

export interface GuessReaction {
  outcome: GuessOutcome;
  /** De kop van het eindscherm: wat we van je gok vinden. */
  line: CopyLine;
  /** Na een veel te hoge gok bij een voldoende: één zin steun. */
  support: CopyLine | null;
  /** Bij een onvoldoende of een veel te hoge gok: de knop "Wat moet ik halen?". */
  showWhatToGet: boolean;
}

/** Feature A: de reactie op je gok, met de echte getallen. Alleen voor cijfers, niet voor V/G/O. */
export function guessReaction(card: CardCore, guess: number): GuessReaction {
  const actual = card.grade.kind === "numeric" ? card.grade.value : guess;
  const outcome = guessOutcome(guess, actual);
  return {
    outcome,
    line: {
      key: GUESS_REACTION[outcome.kind],
      vars: {
        gok: formatGrade(guess),
        cijfer: formatGrade(actual),
        verschil: formatGrade(Math.abs(outcome.diff)),
      },
    },
    support: outcome.kind === "veelLager" && !card.isFail ? { key: "gok.steun", vars: {} } : null,
    showWhatToGet: card.isFail || outcome.kind === "veelLager",
  };
}
