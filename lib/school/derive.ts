import type { Homework, Lesson, LessonInfoType, Test, TestKind } from "@/lib/types";

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

/** Platte tekst uit Magister-HTML, voor zoeken en korte previews. */
export function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
      if (entity[0] === "#") {
        const code =
          entity[1]?.toLowerCase() === "x"
            ? parseInt(entity.slice(2), 16)
            : parseInt(entity.slice(1), 10);
        return Number.isFinite(code) ? String.fromCodePoint(code) : match;
      }
      return NAMED_ENTITIES[entity.toLowerCase()] ?? match;
    })
    .replace(/\s+/g, " ")
    .trim();
}

const TEST_TYPES: Partial<Record<LessonInfoType, TestKind>> = {
  toets: "toets",
  tentamen: "tentamen",
  schriftelijk: "schriftelijk",
  mondeling: "mondeling",
};

export const isTestInfoType = (infoType: LessonInfoType) => infoType in TEST_TYPES;

/** Huiswerk = lessen met inhoud bij infotype huiswerk of een toets (wat je moet leren). */
export function homeworkFromLessons(lessons: readonly Lesson[]): Homework[] {
  const result: Homework[] = [];
  for (const lesson of lessons) {
    const html = lesson.contentHtml?.trim();
    if (!html) continue;
    const isTest = isTestInfoType(lesson.infoType);
    if (lesson.infoType !== "huiswerk" && !isTest) continue;
    result.push({
      id: `hw-${lesson.id}`,
      lessonId: lesson.id,
      subjectId: lesson.subjectId,
      dueDate: lesson.date,
      dueAt: lesson.start,
      html,
      text: htmlToText(html),
      isDone: lesson.isDone,
      isTest,
    });
  }
  return result;
}

export function testsFromLessons(lessons: readonly Lesson[]): Test[] {
  const result: Test[] = [];
  for (const lesson of lessons) {
    const kind = TEST_TYPES[lesson.infoType];
    if (!kind || lesson.status === "uitval") continue;
    const html = lesson.contentHtml?.trim() ?? "";
    result.push({
      id: `test-${lesson.id}`,
      lessonId: lesson.id,
      subjectId: lesson.subjectId,
      kind,
      date: lesson.date,
      start: lesson.start,
      html,
      text: htmlToText(html),
    });
  }
  return result;
}
