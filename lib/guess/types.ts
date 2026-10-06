/** Eén gok, gekoppeld aan het echte cijfer. Basis voor profiel, grafiek en prestaties. */
export interface GuessEntry {
  gradeId: string;
  subjectId: string;
  subjectName: string;
  /** De gok, bijv. 7,2. */
  guess: number;
  /** Het echte cijfer. */
  actual: number;
  /** Moment van gokken (ISO). */
  at: string;
  /** Datum van de toets. */
  date: string;
}
