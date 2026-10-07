import { describe, expect, it } from "vitest";
import { lesson } from "@/lib/test-utils/lesson";
import { buildIcs, escapeIcs, foldLine } from "./ics";

const D = "2026-10-06";
const names = (id: string | null) => (id === "wisa" ? "Wiskunde A" : "Les");

describe("buildIcs (export naar je agenda)", () => {
  const lessons = [
    lesson(D, "08:30", "09:20", {
      id: "a",
      hourFrom: 1,
      hourTo: 1,
      location: "B21",
      teachers: [{ code: "VDB" }],
    }),
    lesson(D, "09:20", "10:10", { id: "b", status: "uitval", subjectId: null }),
  ];
  const ics = buildIcs(lessons, names, new Date("2026-10-06T07:00:00Z"));
  const lines = ics.split("\r\n");

  it("is een geldige agenda met CRLF-regels", () => {
    expect(lines[0]).toBe("BEGIN:VCALENDAR");
    expect(lines).toContain("VERSION:2.0");
    expect(lines.at(-2)).toBe("END:VCALENDAR");
    expect(ics.endsWith("\r\n")).toBe(true);
  });

  it("zet elke les erin in Nederlandse tijd, met vak, lokaal en docent", () => {
    expect(lines).toContain("BEGIN:VTIMEZONE");
    expect(lines).toContain("UID:a@supermagister");
    expect(lines).toContain("DTSTART;TZID=Europe/Amsterdam:20261006T083000");
    expect(lines).toContain("DTEND;TZID=Europe/Amsterdam:20261006T092000");
    expect(lines).toContain("SUMMARY:Wiskunde A");
    expect(lines).toContain("LOCATION:B21");
    expect(lines).toContain("DESCRIPTION:1e uur · docent VDB");
  });

  it("markeert uitval als vervallen", () => {
    expect(lines).toContain("STATUS:CANCELLED");
    expect(lines).toContain("SUMMARY:Vervalt: Les");
  });
});

describe("hulpjes", () => {
  it("ontsnapt komma's, puntkomma's en regeleinden", () => {
    expect(escapeIcs("a, b; c\nd\\e")).toBe("a\\, b\\; c\\nd\\\\e");
  });

  it("vouwt lange regels op 75 tekens", () => {
    const folded = foldLine(`DESCRIPTION:${"x".repeat(100)}`);
    const parts = folded.split("\r\n");
    expect(parts[0]).toHaveLength(75);
    expect(parts[1]!.startsWith(" ")).toBe(true);
    expect(parts.join("").replace(/ /g, "")).toBe(`DESCRIPTION:${"x".repeat(100)}`);
  });
});
