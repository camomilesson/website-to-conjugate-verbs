// Isolated development/test fixtures. Never inserted into a real account.
import { historyPage } from "./history-model.ts"
import type { HistoryCursor, HistoryMode } from "./history-model.ts"
import type { HistoryRow } from "../learning-data/index.ts"
export function historyFixtures(
  verbs = ["hablar", "comer", "vivir"],
): HistoryRow[] {
  return Array.from({ length: 26 }, (_, i) => {
    const length = i % 2 ? 7 : 20
    const answered = i % 5 === 4 ? 2 : length
    const correct = i % 4 === 0 ? answered : answered - 1
    const mode = i % 3 === 2 ? ("choice" as const) : ("typing" as const)
    const accentPolicy =
      i % 3 === 1 ? ("relaxed" as const) : ("strict" as const)
    const selected = i % 4 === 1
    return {
      id: `30000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
      completed_at: new Date(
        Date.UTC(2026, 10, 6, 12) - Math.floor(i / 2) * 60000,
      ).toISOString(),
      mode,
      accent_policy: mode === "choice" ? "na" : accentPolicy,
      correct,
      answered,
      dataset_version: "catalogue-1",
      defaults_version: "practice-1",
      configuration: {
        resolved: {
          mode,
          verbIds: selected ? ["hablar", "comer"] : [...verbs],
          categories: selected
            ? ["indicative.present", "subjunctive.present"]
            : [
                "indicative.present",
                "indicative.preterite",
                "indicative.imperfect",
                "indicative.future",
                "indicative.conditional",
                "indicative.present-perfect",
              ],
          persons: selected
            ? ["yo", "tu"]
            : ["yo", "tu", "el", "nosotros", "vosotros", "ellos"],
          length,
          accentPolicy,
        },
        selections: {
          verbSet: selected ? "select" : "all",
          tenseSet: selected ? "select" : "basic",
          personSet: selected ? "select" : "all",
        },
        defaults: {
          mode: "typing",
          length: 20,
          accentPolicy: "strict",
          verbSet: "all",
          tenseSet: "basic",
          personSet: "all",
        },
      },
      example_mistake:
        correct === answered
          ? null
          : {
              verbId: "hablar",
              category: "indicative.present",
              person: "yo",
              text: "habla",
              answers: ["hablo"],
            },
    }
  })
}
export function fixturePage(
  rows: HistoryRow[],
  mode: HistoryMode,
  cursor: HistoryCursor | null,
  ceiling: HistoryCursor | null = null,
) {
  const bound = cursor ?? ceiling
  return historyPage(
    rows.filter(
      (row) =>
        (mode === "all" || row.mode === mode) &&
        (!bound ||
          row.completed_at < bound.completedAt ||
          (row.completed_at === bound.completedAt &&
            (cursor ? row.id > bound.id : row.id >= bound.id))),
    ),
  )
}
