import type { SchoolDataSource } from "./source";

/**
 * Zolang je niet gekoppeld bent: een lege bron. Er is geen demo meer; de
 * pagina's met schooldata vragen dan om te koppelen (zie LinkGate).
 */
export function createEmptySource(): SchoolDataSource {
  return {
    id: "leeg",
    kind: "leeg",
    label: "Niet gekoppeld",
    getAccount: async () => ({
      id: 0,
      firstName: "",
      lastName: "",
      fullName: "",
      schoolName: "",
      schoolHost: "",
      isExamYear: false,
    }),
    getSubjects: async () => [],
    getPeriods: async () => [],
    getGrades: async () => [],
    getHistory: async () => [],
    getLessons: async () => [],
    getAbsences: async () => [],
    getInitialPackIds: async () => [],
    getInitialGuesses: async () => ({}),
  };
}
