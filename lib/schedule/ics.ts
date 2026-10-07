import type { Lesson } from "@/lib/types";
import { hourLabel } from "./summary";

/**
 * Fase 3b: het rooster als .ics, voor Google Agenda en Apple Agenda.
 * RFC 5545: CRLF-regels, opgevouwen op 75 bytes, tijden in Europe/Amsterdam.
 */

const ZONE = "Europe/Amsterdam";

/** De vaste regels voor zomer- en wintertijd in Nederland. */
const VTIMEZONE = [
  "BEGIN:VTIMEZONE",
  `TZID:${ZONE}`,
  "BEGIN:DAYLIGHT",
  "TZOFFSETFROM:+0100",
  "TZOFFSETTO:+0200",
  "TZNAME:CEST",
  "DTSTART:19700329T020000",
  "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
  "END:DAYLIGHT",
  "BEGIN:STANDARD",
  "TZOFFSETFROM:+0200",
  "TZOFFSETTO:+0100",
  "TZNAME:CET",
  "DTSTART:19701025T030000",
  "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
  "END:STANDARD",
  "END:VTIMEZONE",
];

export function escapeIcs(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

const encoder = new TextEncoder();

/** Lange regels opvouwen: maximaal 75 bytes, vervolgregels beginnen met een spatie. */
export function foldLine(line: string): string {
  const parts: string[] = [];
  let current = "";
  let bytes = 0;
  for (const char of line) {
    const size = encoder.encode(char).length;
    const limit = parts.length === 0 ? 75 : 74;
    if (bytes + size > limit) {
      parts.push(current);
      current = "";
      bytes = 0;
    }
    current += char;
    bytes += size;
  }
  parts.push(current);
  return parts.map((part, i) => (i === 0 ? part : ` ${part}`)).join("\r\n");
}

/** Kloktijd in Nederland als 20261006T083000, wat de tijdzone van de browser ook is. */
function wallTime(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("year")}${get("month")}${get("day")}T${get("hour")}${get("minute")}${get("second")}`;
}

const utcStamp = (date: Date) =>
  date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");

export function buildIcs(
  lessons: readonly Lesson[],
  subjectName: (id: string | null) => string,
  now: Date,
): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SuperMagister//Rooster//NL",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Rooster (SuperMagister)",
    `X-WR-TIMEZONE:${ZONE}`,
    ...VTIMEZONE,
  ];
  const stamp = utcStamp(now);
  for (const lesson of [...lessons].sort((a, b) => a.start.localeCompare(b.start))) {
    const cancelled = lesson.status === "uitval";
    const subject = subjectName(lesson.subjectId);
    const teachers = lesson.teachers.map((t) => t.code).join(", ");
    const description = [hourLabel(lesson), teachers ? `docent ${teachers}` : null]
      .filter(Boolean)
      .join(" · ");
    lines.push(
      "BEGIN:VEVENT",
      `UID:${lesson.id}@supermagister`,
      `DTSTAMP:${stamp}`,
      `DTSTART;TZID=${ZONE}:${wallTime(lesson.start)}`,
      `DTEND;TZID=${ZONE}:${wallTime(lesson.end)}`,
      `SUMMARY:${escapeIcs(cancelled ? `Vervalt: ${subject}` : subject)}`,
    );
    if (lesson.location) lines.push(`LOCATION:${escapeIcs(lesson.location)}`);
    if (description) lines.push(`DESCRIPTION:${escapeIcs(description)}`);
    lines.push(`STATUS:${cancelled ? "CANCELLED" : "CONFIRMED"}`, "END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.map(foldLine).join("\r\n") + "\r\n";
}
