import { addDays, isWeekend } from "@/lib/date";

/**
 * Schooldagen van de demo-school: maandag t/m vrijdag, behalve in de zomer-
 * (15 juli – 31 augustus) en kerstvakantie (22 december – 4 januari).
 */
export function isDemoSchoolDay(date: Date): boolean {
  if (isWeekend(date)) return false;
  const month = date.getMonth();
  const day = date.getDate();
  if ((month === 6 && day >= 15) || month === 7) return false;
  if ((month === 11 && day >= 22) || (month === 0 && day <= 4)) return false;
  return true;
}

/** Telt schooldagen op (of af bij een negatief getal). */
export function addSchoolDays(date: Date, amount: number): Date {
  const step = amount < 0 ? -1 : 1;
  let remaining = Math.abs(amount);
  let result = new Date(date);
  while (remaining > 0) {
    result = addDays(result, step);
    if (isDemoSchoolDay(result)) remaining--;
  }
  return result;
}
