import { formatTime } from "@/lib/date";

export interface GreetingInput {
  now: Date;
  firstName: string;
  /** Lessen vandaag, zonder uitval. */
  lessonsToday: number;
  /** Lessen die vandaag nog moeten beginnen of nog bezig zijn. */
  lessonsLeft: number;
  testsToday: number;
  firstLessonStart: Date | null;
  /** Begin van de eerstvolgende schooldag na vandaag. */
  nextSchoolDayStart: Date | null;
  isBirthday: boolean;
}

export interface Greeting {
  title: string;
  subtitle: string;
}

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

function testsPhrase(n: number): string {
  return n === 1 ? "een toets" : `${n} toetsen`;
}

/** Begroeting bovenaan Vandaag. Verandert met het tijdstip en wat er op de dag staat. */
export function getGreeting(input: GreetingInput): Greeting {
  const { now, firstName, lessonsToday, lessonsLeft, testsToday } = input;
  const minutes = now.getHours() * 60 + now.getMinutes();
  const nightOwl = minutes >= 23 * 60 || minutes < 5 * 60;
  const weekday = now.getDay();

  let title: string;
  if (input.isBirthday) title = `Gefeliciteerd ${firstName}! 🎂`;
  else if (nightOwl) title = "Huh, ben je nog wakker? 🌙";
  else if (minutes < 12 * 60) title = `Goeiemorgen ${firstName} ☀️`;
  else if (minutes < 18 * 60) title = `Goeiemiddag ${firstName} 👋`;
  else title = `Goeienavond ${firstName} 🌆`;

  return { title, subtitle: subtitleFor() };

  function subtitleFor(): string {
    if (nightOwl) {
      return input.nextSchoolDayStart
        ? `Je eerste les begint om ${formatTime(input.nextSchoolDayStart)}. Slaap lekker 😴`
        : "Slaap lekker 😴";
    }
    if (lessonsToday === 0) {
      return weekday === 0 || weekday === 6
        ? "Weekend! Geen lessen vandaag 🎉"
        : "Geen lessen vandaag. Geniet ervan 🎉";
    }
    if (lessonsLeft === 0) return "School zit erop voor vandaag ✅";
    if (weekday === 5) {
      return `Vrijdag! Nog ${lessonsLeft} ${plural(lessonsLeft, "les", "lessen")} tot het weekend 🎉`;
    }
    if (testsToday > 0 && (lessonsToday >= 7 || testsToday >= 2)) {
      return `Pittige dag: ${lessonsToday} uur en ${testsPhrase(testsToday)}`;
    }
    if (testsToday > 0) return `Vandaag ${testsPhrase(testsToday)}. Jij kan dit 💪`;
    if (lessonsLeft < lessonsToday) {
      return `Nog ${lessonsLeft} ${plural(lessonsLeft, "les", "lessen")} te gaan`;
    }
    return input.firstLessonStart
      ? `${lessonsToday} uur vandaag, eerste les om ${formatTime(input.firstLessonStart)}`
      : `${lessonsToday} uur vandaag`;
  }
}
