import { CATEGORIES } from "@conjugadora/verb-catalogue"
import type {
  Catalogue,
  CatalogueEntry,
  CategoryId,
} from "@conjugadora/verb-catalogue"
import type { CountRow } from "../learning-data/index.ts"
export type ModeFilter = "all" | "typing" | "choice" | "strict" | "relaxed"
export type SortOrder =
  | "name"
  | "name-desc"
  | "accuracy"
  | "accuracy-asc"
  | "attempts"
  | "attempts-asc"
export interface Accuracy {
  correct: number
  answered: number
  percentage: number | null
}
export interface MatrixRow {
  verb: CatalogueEntry
  overall: Accuracy
  cells: Partial<Record<CategoryId, Accuracy>>
}
const empty = (): Accuracy => ({ correct: 0, answered: 0, percentage: null })
function add(target: Accuracy, row: CountRow) {
  target.correct += row.correct
  target.answered += row.answered
  target.percentage = Math.round((target.correct / target.answered) * 100)
}
export function matchesMode(row: CountRow, filter: ModeFilter) {
  return (
    filter === "all" ||
    row.mode === filter ||
    (row.mode === "typing" && row.accent_policy === filter)
  )
}
export function buildMatrix(
  catalogue: Catalogue,
  counts: readonly CountRow[],
  filter: ModeFilter,
): MatrixRow[] {
  const rows = new Map<string, MatrixRow>(
    catalogue.verbs.map((verb) => [
      verb.id,
      { verb, overall: empty(), cells: {} },
    ]),
  )
  for (const count of counts) {
    const row = rows.get(count.verb_id)
    const category = CATEGORIES.find(
      (category) => category.id === count.category_id,
    )
    if (!row || !category || !matchesMode(count, filter)) continue
    const cell = (row.cells[category.id] ??= empty())
    add(cell, count)
    add(row.overall, count)
  }
  return [...rows.values()]
}
function fold(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("es")
    .trim()
}
export function selectRows(
  rows: readonly MatrixRow[],
  search: string,
  order: SortOrder,
): MatrixRow[] {
  const query = fold(search)
  return rows
    .filter((row) =>
      fold(`${row.verb.infinitive} ${row.verb.meaning}`).includes(query),
    )
    .sort((a, b) => {
      const name = a.verb.infinitive.localeCompare(b.verb.infinitive, "es")
      if (order === "name") return name
      if (order === "name-desc") return -name
      if (order.startsWith("accuracy")) {
        if (!a.overall.answered || !b.overall.answered)
          return (
            Number(!a.overall.answered) - Number(!b.overall.answered) || name
          )
        const diff =
          a.overall.correct / a.overall.answered -
          b.overall.correct / b.overall.answered
        return (order === "accuracy" ? -diff : diff) || name
      }
      const diff = a.overall.answered - b.overall.answered
      return (order === "attempts" ? -diff : diff) || name
    })
}
export function moodGroups(categories: readonly (typeof CATEGORIES)[number][]) {
  const groups: { name: string; span: number }[] = []
  for (const category of categories) {
    const last = groups.at(-1)
    if (last?.name === category.group) last.span++
    else groups.push({ name: category.group, span: 1 })
  }
  return groups
}
export function heatLevel(value: Accuracy) {
  return value.percentage === null
    ? "none"
    : value.percentage < 40
      ? "low"
      : value.percentage < 70
        ? "medium"
        : value.percentage < 90
          ? "high"
          : "excellent"
}
