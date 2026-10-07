import { describe, expect, it } from "vitest";
import type { Homework } from "@/lib/types";
import {
  allDoneFor,
  groupHomework,
  homeworkLoad,
  loadLevel,
  resolveHomework,
  type HomeworkItem,
  type HomeworkPrefs,
} from "./overview";

const hw = (id: string, dueDate: string, extra: Partial<Homework> = {}): Homework => ({
  id,
  lessonId: id.replace("hw-", ""),
  subjectId: "wisa",
  dueDate,
  dueAt: `${dueDate}T09:20:00`,
  html: "<p>Maak opdracht 1 t/m 5</p>",
  text: "Maak opdracht 1 t/m 5",
  isDone: false,
  isTest: false,
  ...extra,
});

const none: HomeworkPrefs = { status: {}, items: {}, subjects: {} };
// Woensdag 7 oktober 2026, 's middags.
const WED = new Date(2026, 9, 7, 15, 0);
const FRI = new Date(2026, 9, 9, 15, 0);

describe("resolveHomework", () => {
  it("neemt de status van Magister over als je niks hebt aangepast", () => {
    const [open, done] = resolveHomework(
      [hw("hw-a", "2026-10-08"), hw("hw-b", "2026-10-08", { isDone: true })],
      none,
    );
    expect(open).toMatchObject({ status: "todo", isDone: false, doneAt: null, minutes: 20 });
    expect(done).toMatchObject({ status: "klaar", isDone: true, doneAt: null });
  });

  it("laat jouw status en tijd winnen", () => {
    const prefs: HomeworkPrefs = {
      status: {
        "hw-a": { status: "klaar", at: "2026-10-07T16:00:00.000Z" },
        "hw-b": { status: "bezig", at: "2026-10-07T16:05:00.000Z" },
      },
      items: { "hw-b": 50 },
      subjects: {},
    };
    const [a, b] = resolveHomework(
      [hw("hw-a", "2026-10-08"), hw("hw-b", "2026-10-08", { isDone: true })],
      prefs,
    );
    expect(a).toMatchObject({ status: "klaar", isDone: true, doneAt: "2026-10-07T16:00:00.000Z" });
    expect(b).toMatchObject({
      status: "bezig",
      isDone: false,
      minutes: 50,
      minutesSource: "eigen",
    });
  });
});

const resolved = (items: Homework[], prefs = none): HomeworkItem[] => resolveHomework(items, prefs);

describe("groupHomework", () => {
  it("verdeelt over vandaag, morgen, komende dagen en later, met de open tijd", () => {
    const groups = groupHomework(
      resolved([
        hw("hw-1", "2026-10-07"),
        hw("hw-2", "2026-10-08"),
        hw("hw-3", "2026-10-08", { isDone: true }),
        hw("hw-4", "2026-10-12"),
        hw("hw-5", "2026-10-20"),
      ]),
      WED,
    );
    expect(groups.map((g) => [g.key, g.title, g.items.length, g.openMinutes])).toEqual([
      ["vandaag", "Vandaag", 1, 20],
      ["volgende", "Morgen", 2, 20],
      ["komend", "Komende dagen", 1, 20],
      ["later", "Later", 1, 20],
    ]);
  });

  it("noemt na een vrijdag de volgende schooldag bij naam", () => {
    const groups = groupHomework(resolved([hw("hw-1", "2026-10-12")]), FRI);
    expect(groups[0]).toMatchObject({ key: "volgende", title: "Maandag" });
  });

  it("zet de items op volgorde van inleveren", () => {
    const groups = groupHomework(
      resolved([
        hw("hw-b", "2026-10-13", { dueAt: "2026-10-13T11:20:00" }),
        hw("hw-a", "2026-10-12", { dueAt: "2026-10-12T08:30:00" }),
      ]),
      WED,
    );
    expect(groups[0]!.items.map((i) => i.id)).toEqual(["hw-a", "hw-b"]);
  });
});

describe("homeworkLoad (drukte per dag)", () => {
  it("telt de open tijd per schooldag, vanaf de volgende schooldag", () => {
    const load = homeworkLoad(
      resolved([
        hw("hw-1", "2026-10-08"),
        hw("hw-2", "2026-10-08", { text: "Lees hoofdstuk 3" }),
        hw("hw-3", "2026-10-08", { isDone: true }),
        hw("hw-4", "2026-10-12", { isTest: true }),
      ]),
      WED,
      3,
    );
    expect(load).toEqual([
      { date: "2026-10-08", minutes: 50, open: 2, total: 3, level: "normaal" },
      { date: "2026-10-09", minutes: 0, open: 0, total: 0, level: "vrij" },
      { date: "2026-10-12", minutes: 45, open: 1, total: 1, level: "normaal" },
    ]);
  });

  it("geeft elke hoeveelheid een niveau", () => {
    expect([0, 25, 60, 95, 140].map(loadLevel)).toEqual([
      "vrij",
      "rustig",
      "normaal",
      "druk",
      "zwaar",
    ]);
  });
});

describe("allDoneFor", () => {
  it("is alleen waar als er huiswerk was en alles af is", () => {
    const items = resolved([
      hw("hw-1", "2026-10-08", { isDone: true }),
      hw("hw-2", "2026-10-08", { isDone: true }),
      hw("hw-3", "2026-10-09"),
    ]);
    expect(allDoneFor(items, "2026-10-08")).toBe(true);
    expect(allDoneFor(items, "2026-10-09")).toBe(false);
    expect(allDoneFor(items, "2026-10-12")).toBe(false);
  });
});
