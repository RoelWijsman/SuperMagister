/** Gemiddelde van de vakgemiddeldes (vakken zonder gemiddelde tellen niet mee). */
export function overallAverage(summaries: readonly { average: number | null }[]): number | null {
  const values = summaries.flatMap((s) => (s.average === null ? [] : [s.average]));
  return values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : null;
}
