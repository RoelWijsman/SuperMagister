import { diffInCalendarDays, formatShortDate, formatTime } from "@/lib/date";

/** "14:02" vandaag, "gisteren 09:05", of "30 sep 21:40". Voor "laatste update" en verlopen. */
export function formatMoment(at: number, now: Date): string {
  const moment = new Date(at);
  const days = diffInCalendarDays(moment, now);
  if (days === 0) return formatTime(moment);
  if (days === -1) return `gisteren ${formatTime(moment)}`;
  return `${formatShortDate(moment)} ${formatTime(moment)}`;
}
