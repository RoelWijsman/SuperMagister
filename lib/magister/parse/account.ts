import type { Account } from "@/lib/types";
import type { Enrollment } from "./enrollments";
import { int, str, toLocalDate, field } from "./fields";

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** /api/account: wie je bent. De klas komt uit het huidige schooljaar. */
export function parseAccount(
  raw: unknown,
  { schoolHost, enrollment }: { schoolHost: string; enrollment: Enrollment | null },
): Account {
  const id = int(raw, "Persoon.Id");
  if (id === null) throw new Error("Geen persoon in het Magister-account.");
  const firstName = str(raw, "Persoon.Roepnaam", "Persoon.OfficieleVoornamen") ?? "";
  const lastName = [str(raw, "Persoon.Tussenvoegsel"), str(raw, "Persoon.Achternaam")]
    .filter(Boolean)
    .join(" ");
  const birthDate = toLocalDate(field(raw, "Persoon.Geboortedatum")) ?? undefined;
  return {
    id,
    firstName,
    lastName,
    fullName: [firstName, lastName].filter(Boolean).join(" "),
    ...(birthDate ? { birthDate } : {}),
    schoolName: capitalize(schoolHost.split(".")[0] ?? schoolHost),
    schoolHost,
    className: enrollment?.group ?? undefined,
    studyLabel:
      enrollment?.level && enrollment.year
        ? `${enrollment.level} ${enrollment.year}`
        : (enrollment?.group ?? undefined),
    isExamYear: enrollment?.isExamYear ?? false,
  };
}
