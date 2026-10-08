// @ts-check
/**
 * Het getal op het icoon: hoeveel nieuwe cijfers er klaarliggen. De app meldt
 * hoeveel er in je pack zitten en het nieuwste cijfer dat hij kent; daarna telt
 * de extensie zelf de cijfers die Magister nog later invoerde (elk kwartier).
 */
(function (root) {
  const SM = (root.SM = root.SM || {});

  /**
   * Cijfers uit /personen/{id}/cijfers/laatste die nieuwer zijn dan het nieuwste
   * cijfer dat de app al kent. Weet de app nog niets, dan tellen we niets: geen
   * badge van honderd bij de eerste keer.
   * @param {unknown} raw
   * @param {string | null | undefined} newestSeen
   */
  SM.countNewGrades = function (raw, newestSeen) {
    if (!newestSeen) return 0;
    const seen = Date.parse(newestSeen);
    if (!Number.isFinite(seen)) return 0;
    /** @type {Record<string, unknown>} */
    const record = raw && typeof raw === "object" ? Object(raw) : {};
    const items = record.items ?? record.Items;
    if (!Array.isArray(items)) return 0;
    const ids = new Set();
    for (const item of items) {
      if (!item || typeof item !== "object") continue;
      const entered = Date.parse(String(item.ingevoerdOp ?? item.IngevoerdOp ?? ""));
      if (!Number.isFinite(entered) || entered <= seen) continue;
      ids.add(String(item.kolomId ?? item.id ?? item.Id ?? ids.size));
    }
    return ids.size;
  };

  /** @param {number} count */
  SM.badgeText = function (count) {
    if (!Number.isFinite(count) || count <= 0) return "";
    return count > 99 ? "99+" : String(Math.floor(count));
  };
})(globalThis);
