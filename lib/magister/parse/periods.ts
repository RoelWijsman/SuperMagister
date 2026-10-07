import type { Period } from "@/lib/types";
import { arr, field, int, num, str, toLocalDate, toLocalEndDate } from "./fields";

/** Cijferperioden van een schooljaar, op volgorde. */
export function parsePeriods(raw: unknown): Period[] {
  return arr(raw, "Items")
    .flatMap((item) => {
      const id = int(item, "Id");
      const start = toLocalDate(field(item, "Start", "Begin"));
      const end = toLocalEndDate(field(item, "Einde", "Eind"));
      if (id === null || !start || !end) return [];
      return [
        {
          order: num(item, "VolgNummer", "Volgnummer") ?? 0,
          period: {
            id: String(id),
            name: str(item, "Omschrijving") ?? str(item, "Naam") ?? `Periode ${id}`,
            start,
            end,
          },
        },
      ];
    })
    .sort((a, b) => a.order - b.order || a.period.start.localeCompare(b.period.start))
    .map(({ period }) => period);
}
