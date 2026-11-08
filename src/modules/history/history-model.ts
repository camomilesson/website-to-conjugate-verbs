import { CATEGORIES, PERSONS } from "@conjugadora/verb-catalogue"
import type { PersonId } from "@conjugadora/verb-catalogue"
import type { HistoryRow } from "../learning-data/index.ts"
export const HISTORY_PAGE_SIZE = 10
export type HistoryMode = "all" | "typing" | "choice"
export interface HistoryCursor {
  completedAt: string
  id: string
}
export interface HistoryPage {
  rows: HistoryRow[]
  hasMore: boolean
  next: HistoryCursor | null
}
export function cursorFor(
  row: Pick<HistoryRow, "id" | "completed_at">,
): HistoryCursor {
  return { id: row.id, completedAt: row.completed_at }
}
export function cursorCondition(cursor: HistoryCursor, inclusive = false) {
  // Preserve PostgreSQL microseconds. Date.toISOString would truncate the cursor.
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      cursor.id,
    ) ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/.test(
      cursor.completedAt,
    ) ||
    !Number.isFinite(Date.parse(cursor.completedAt))
  )
    throw new Error("Invalid history page cursor.")
  return `completed_at.lt.${cursor.completedAt},and(completed_at.eq.${cursor.completedAt},id.${inclusive ? "gte" : "gt"}.${cursor.id})`
}
export function historyPage(rows: HistoryRow[]): HistoryPage {
  const visible = rows.slice(0, HISTORY_PAGE_SIZE)
  return {
    rows: visible,
    hasMore: rows.length > HISTORY_PAGE_SIZE,
    next: visible.length ? cursorFor(visible[visible.length - 1]) : null,
  }
}
const initialDefaults = {
  mode: "typing",
  length: 20,
  accentPolicy: "strict",
  verbSet: "all",
  tenseSet: "basic",
  personSet: "all",
}
export function nonDefaultSettings(row: HistoryRow): string[] | null {
  const cfg = row.configuration.resolved
  const sets = row.configuration.selections
  const baseline =
    row.configuration.defaults ??
    (row.defaults_version === "practice-1" ? initialDefaults : null)
  if (!baseline) return null
  const changes: string[] = []
  if (cfg.mode !== baseline.mode)
    changes.push(cfg.mode === "choice" ? "Multiple choice" : "Typing")
  if (cfg.length !== baseline.length)
    changes.push(
      `${cfg.length} requested ${cfg.length === 1 ? "question" : "questions"}`,
    )
  if (row.answered !== cfg.length)
    changes.push(`${row.answered} eligible questions`)
  if (cfg.mode === "typing" && cfg.accentPolicy !== baseline.accentPolicy)
    changes.push(
      cfg.accentPolicy === "strict" ? "Accents required" : "Accents ignored",
    )
  if (sets.verbSet !== baseline.verbSet)
    changes.push(`Verbs: ${setLabel(sets.verbSet)}`)
  if (sets.tenseSet !== baseline.tenseSet)
    changes.push(`Tenses: ${setLabel(sets.tenseSet)}`)
  if (sets.personSet !== baseline.personSet)
    changes.push(`Persons: ${cfg.persons.map(personLabel).join(", ")}`)
  return changes
}
export function setLabel(value: string) {
  return (
    (
      {
        all: "All",
        common: "Common",
        select: "Selected",
        basic: "Basic",
        advanced: "Advanced",
      } as Record<string, string>
    )[value] ?? value
  )
}
export function categoryLabel(id: string) {
  const category = CATEGORIES.find((category) => category.id === id)
  return category ? `${category.group} · ${category.label}` : id
}
export function personLabel(id: string) {
  return PERSONS[id as PersonId] ?? id
}
