import { DAY_NAMES, diffInCalendarDays, nextWeekday, parseISODate, toISODate } from "@/lib/date";
import type { LoadLevel } from "@/lib/schedule/summary";
import type { Homework, ISODate } from "@/lib/types";
import { homeworkMinutes, type MinutesSource } from "./estimate";

/**
 * Fase 3c: huiswerk met jouw eigen status en tijden erbovenop, in groepen
 * (vandaag, morgen, komende dagen, later) en met de drukte per dag.
 */

/**
 * XP per afgevinkt item: vliegt omhoog bij het afvinken, alleen als prestaties
 * aan staan (Instellingen > Ontwikkelaar; fase 6 is vervallen).
 */
export const HOMEWORK_XP = 10;

export type HomeworkStatus = "todo" | "bezig" | "klaar";

/** Wat je zelf hebt aangepast. Blijft op dit apparaat; Magister merkt er niets van. */
export interface HomeworkPrefs {
  status: Readonly<Record<string, { status: HomeworkStatus; at: string }>>;
  /** Je eigen tijd per item, in minuten. */
  items: Readonly<Record<string, number>>;
  /** Je standaardtijd per vak, in minuten. */
  subjects: Readonly<Record<string, number>>;
}

export interface HomeworkItem extends Homework {
  status: HomeworkStatus;
  /** Wanneer je het afvinkte (alleen als je dat in deze app deed). */
  doneAt: string | null;
  minutes: number;
  minutesSource: MinutesSource;
}

export function resolveHomework(
  homework: readonly Homework[],
  prefs: HomeworkPrefs,
): HomeworkItem[] {
  return homework.map((item) => {
    const mine = prefs.status[item.id];
    const status: HomeworkStatus = mine?.status ?? (item.isDone ? "klaar" : "todo");
    const { minutes, source } = homeworkMinutes(item, prefs);
    return {
      ...item,
      status,
      isDone: status === "klaar",
      doneAt: mine?.status === "klaar" ? mine.at : null,
      minutes,
      minutesSource: source,
    };
  });
}

export type GroupKey = "vandaag" | "volgende" | "komend" | "later";

export interface HomeworkGroup {
  key: GroupKey;
  title: string;
  items: HomeworkItem[];
  /** Geschatte tijd van wat nog open staat. */
  openMinutes: number;
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
const openMinutes = (items: readonly HomeworkItem[]) =>
  items.reduce((sum, item) => sum + (item.isDone ? 0 : item.minutes), 0);

/** Vandaag, de volgende schooldag ("Morgen" of "Maandag"), komende dagen en later. */
export function groupHomework(items: readonly HomeworkItem[], today: Date): HomeworkGroup[] {
  const next = nextWeekday(today);
  const nextIso = toISODate(next);
  const nextDays = diffInCalendarDays(next, today);
  const groups: Record<GroupKey, HomeworkItem[]> = {
    vandaag: [],
    volgende: [],
    komend: [],
    later: [],
  };
  const sorted = [...items].sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  for (const item of sorted) {
    const days = diffInCalendarDays(parseISODate(item.dueDate), today);
    if (days <= 0) groups.vandaag.push(item);
    else if (item.dueDate === nextIso) groups.volgende.push(item);
    else if (days <= 7) groups.komend.push(item);
    else groups.later.push(item);
  }
  const titles: Record<GroupKey, string> = {
    vandaag: "Vandaag",
    volgende: nextDays === 1 ? "Morgen" : capitalize(DAY_NAMES[next.getDay()] ?? ""),
    komend: "Komende dagen",
    later: "Later",
  };
  return (Object.keys(groups) as GroupKey[])
    .filter((key) => groups[key].length > 0)
    .map((key) => ({
      key,
      title: titles[key],
      items: groups[key],
      openMinutes: openMinutes(groups[key]),
    }));
}

/** Hoe zwaar een dag huiswerk is, op basis van de open tijd. */
export function loadLevel(minutes: number): LoadLevel {
  if (minutes <= 0) return "vrij";
  if (minutes <= 30) return "rustig";
  if (minutes <= 60) return "normaal";
  if (minutes <= 100) return "druk";
  return "zwaar";
}

export interface DayLoad {
  date: ISODate;
  minutes: number;
  open: number;
  total: number;
  level: LoadLevel;
}

/** De drukte-meter: open tijd per schooldag, vanaf de volgende schooldag. */
export function homeworkLoad(items: readonly HomeworkItem[], today: Date, days: number): DayLoad[] {
  const result: DayLoad[] = [];
  let date = today;
  for (let i = 0; i < days; i++) {
    date = nextWeekday(date);
    const iso = toISODate(date);
    const due = items.filter((item) => item.dueDate === iso);
    const minutes = openMinutes(due);
    result.push({
      date: iso,
      minutes,
      open: due.filter((item) => !item.isDone).length,
      total: due.length,
      level: loadLevel(minutes),
    });
  }
  return result;
}

/** Alles voor deze dag af (en er was ook echt iets)? */
export function allDoneFor(items: readonly HomeworkItem[], date: ISODate): boolean {
  const due = items.filter((item) => item.dueDate === date);
  return due.length > 0 && due.every((item) => item.isDone);
}
