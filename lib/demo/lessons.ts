import {
  addDays,
  atTime,
  diffInCalendarDays,
  isoWeek,
  startOfDay,
  startOfWeek,
  toISODate,
} from "@/lib/date";
import { isTestInfoType } from "@/lib/school/derive";
import { hashString } from "@/lib/subjects/palette";
import type { Lesson } from "@/lib/types";
import { addSchoolDays, isDemoSchoolDay } from "./calendar";
import {
  DEFAULT_HOMEWORK_CHANCE,
  HOMEWORK_CHANCE,
  HOMEWORK_TEXTS,
  TEST_TEXTS,
  type DemoTestSpec,
} from "./content";
import { createRandom, type Random } from "@/lib/random";
import {
  BELL_SCHEDULE,
  DEMO_ACCOUNT,
  SPARE_ROOMS,
  SUBJECT_SPEC_BY_ID,
  WEEK_TIMETABLE,
} from "./school";

/** Hoeveel weken rooster de demo vóór en na deze week maakt. */
const WEEKS_BEFORE = 6;
const WEEKS_AFTER = 6;

function baseLessonsFor(date: Date): Lesson[] {
  const weekday = date.getDay();
  const slots = WEEK_TIMETABLE[weekday] ?? [];
  const iso = toISODate(date);
  return slots.map(([hourFrom, hourTo, subjectId]) => {
    const spec = SUBJECT_SPEC_BY_ID.get(subjectId);
    const [startTime] = BELL_SCHEDULE[hourFrom] ?? ["08:30"];
    const [, endTime] = BELL_SCHEDULE[hourTo] ?? ["", "09:20"];
    const teacher = spec?.teacher ?? { code: "???" };
    return {
      id: `demo-les-${iso}-${hourFrom}`,
      start: atTime(date, startTime).toISOString(),
      end: atTime(date, endTime).toISOString(),
      date: iso,
      hourFrom,
      hourTo,
      subjectId,
      title: `${spec?.code ?? subjectId} - ${teacher.code} - ${DEMO_ACCOUNT.className}`,
      location: spec?.room ?? null,
      previousLocation: null,
      teachers: [teacher],
      infoType: "geen",
      status: "normaal",
      contentHtml: null,
      isDone: false,
    };
  });
}

function moveRoom(lesson: Lesson, random: Random) {
  const original = lesson.previousLocation ?? lesson.location;
  const options = SPARE_ROOMS.filter((room) => room !== original);
  lesson.status = "wijziging";
  lesson.previousLocation = original;
  lesson.location = random.pick(options);
}

function cancel(lesson: Lesson) {
  lesson.status = "uitval";
  lesson.location = lesson.previousLocation ?? lesson.location;
  lesson.previousLocation = null;
}

function setTest(lesson: Lesson, test: DemoTestSpec) {
  lesson.infoType = test.kind;
  lesson.contentHtml = test.html;
  lesson.status = "normaal";
  lesson.location = lesson.previousLocation ?? lesson.location;
  lesson.previousLocation = null;
}

const canHaveTest = (lesson: Lesson) => Boolean(lesson.subjectId && TEST_TEXTS[lesson.subjectId]);

/** Willekeurige maar vaste variatie per week: uitval, lokaalwijzigingen, toetsen, huiswerk. */
function applyWeekVariation(week: Lesson[], now: Date) {
  const first = week[0];
  if (!first) return;
  const { year, week: number } = isoWeek(new Date(first.start));
  const random = createRandom(hashString(`demo-week-${year}-${number}`));

  for (const lesson of random.sample(week, random.int(1, 2))) cancel(lesson);

  const normal = week.filter((l) => l.status === "normaal");
  for (const lesson of random.sample(normal, random.int(1, 2))) moveRoom(lesson, random);

  const testable = week.filter((l) => l.status !== "uitval" && canHaveTest(l));
  for (const lesson of random.sample(testable, random.int(1, 2))) {
    setTest(lesson, random.pick(TEST_TEXTS[lesson.subjectId ?? ""] ?? []));
  }

  for (const lesson of week) {
    if (lesson.infoType !== "geen" || !lesson.subjectId) continue;
    const chance = HOMEWORK_CHANCE[lesson.subjectId] ?? DEFAULT_HOMEWORK_CHANCE;
    const texts = HOMEWORK_TEXTS[lesson.subjectId];
    if (!texts || !random.chance(chance)) continue;
    lesson.infoType = "huiswerk";
    lesson.contentHtml = random.pick(texts);
  }

  for (const lesson of week) {
    const isPast = new Date(lesson.end).getTime() < now.getTime();
    lesson.isDone = lesson.infoType === "huiswerk" && isPast && random.chance(0.85);
  }
}

/**
 * Vaste gebeurtenissen rond vandaag, zodat de demo altijd iets laat zien:
 * een lokaalwijziging en vroeg naar huis vandaag, uitslapen en een SO morgen,
 * en toetsen verspreid over de komende twee weken.
 */
function applyShowcase(byDate: Map<string, Lesson[]>, now: Date): Set<string> {
  const today = startOfDay(now);
  const random = createRandom(hashString(`demo-showcase-${toISODate(today)}`));
  const lessonsOn = (date: Date) => byDate.get(toISODate(date)) ?? [];

  const todayLessons = lessonsOn(today);
  if (isDemoSchoolDay(today) && todayLessons.length >= 4) {
    const moved = todayLessons[3];
    if (moved) moveRoom(moved, random);
    const last = todayLessons[todayLessons.length - 1];
    if (last) {
      cancel(last);
      last.infoType = "geen";
      last.contentHtml = null;
    }
  }

  const tomorrow = addSchoolDays(today, 1);
  const next = lessonsOn(tomorrow);
  const [firstHour, ...rest] = next;
  if (firstHour) {
    cancel(firstHour);
    firstHour.infoType = "geen";
    firstHour.contentHtml = null;
  }
  const showcaseTests = new Set<string>();
  const testedSubjects = new Set<string>();
  const markTest = (lesson: Lesson, test: DemoTestSpec) => {
    setTest(lesson, test);
    showcaseTests.add(lesson.id);
    if (lesson.subjectId) testedSubjects.add(lesson.subjectId);
  };
  const isFreeForTest = (lesson: Lesson) =>
    canHaveTest(lesson) && !testedSubjects.has(lesson.subjectId ?? "");

  const quizLesson = rest.find(canHaveTest);
  if (quizLesson) {
    const options = TEST_TEXTS[quizLesson.subjectId ?? ""] ?? [];
    markTest(quizLesson, options.find((t) => t.kind === "schriftelijk") ?? random.pick(options));
  }
  const others = rest.filter((l) => l !== quizLesson);
  const moved = others[others.length - 1];
  if (moved) moveRoom(moved, random);
  for (const lesson of others.slice(0, 3)) {
    const texts = lesson.subjectId ? HOMEWORK_TEXTS[lesson.subjectId] : undefined;
    if (!texts) continue;
    lesson.infoType = "huiswerk";
    lesson.contentHtml = random.pick(texts);
    lesson.isDone = false;
  }

  [4, 7, 9].forEach((offset, i) => {
    const candidates = lessonsOn(addSchoolDays(today, offset)).filter(isFreeForTest);
    const lesson = candidates[(i + 1) % Math.max(1, candidates.length)];
    if (lesson) markTest(lesson, random.pick(TEST_TEXTS[lesson.subjectId ?? ""] ?? []));
  });

  return showcaseTests;
}

/** Minimaal aantal dagen tussen twee toetsen van hetzelfde vak. */
const TEST_SPACING_DAYS = 10;

/**
 * Haalt willekeurige toetsen weg die te dicht op een andere toets van
 * hetzelfde vak zitten. Toetsen uit de vaste showcase gaan altijd voor.
 */
function spreadTests(lessons: readonly Lesson[], protectedIds: ReadonlySet<string>) {
  const tests = lessons
    .filter((l) => isTestInfoType(l.infoType))
    .sort((a, b) => a.start.localeCompare(b.start));
  const kept = tests.filter((l) => protectedIds.has(l.id));

  for (const lesson of tests) {
    if (protectedIds.has(lesson.id)) continue;
    const day = new Date(lesson.start);
    const tooClose = kept.some(
      (other) =>
        other.subjectId === lesson.subjectId &&
        Math.abs(diffInCalendarDays(new Date(other.start), day)) < TEST_SPACING_DAYS,
    );
    if (tooClose) {
      lesson.infoType = "geen";
      lesson.contentHtml = null;
    } else {
      kept.push(lesson);
    }
  }
}

/** Het complete demo-rooster: 13 weken rond vandaag. */
export function buildDemoLessons(now: Date): Lesson[] {
  const monday = startOfWeek(now);
  const byDate = new Map<string, Lesson[]>();

  for (let w = -WEEKS_BEFORE; w <= WEEKS_AFTER; w++) {
    const week: Lesson[] = [];
    for (let d = 0; d < 5; d++) {
      const date = addDays(monday, w * 7 + d);
      if (!isDemoSchoolDay(date)) continue;
      const lessons = baseLessonsFor(date);
      byDate.set(toISODate(date), lessons);
      week.push(...lessons);
    }
    applyWeekVariation(week, now);
  }

  const lessons = [...byDate.values()].flat();
  spreadTests(lessons, applyShowcase(byDate, now));
  return lessons;
}
