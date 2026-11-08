import { CATEGORIES, PERSONS } from "@conjugadora/verb-catalogue"
import type { CountRow, HistoryRow, PracticeMetadata } from "./model.ts"

function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}
function text(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0
}
function strings(value: unknown): value is string[] {
  return Array.isArray(value) && value.length > 0 && value.every(text)
}
function positiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0
}
function counts(
  value: Record<string, unknown>,
): value is Record<string, unknown> & Pick<CountRow, "correct" | "answered"> {
  return (
    positiveInteger(value.answered) &&
    typeof value.correct === "number" &&
    Number.isSafeInteger(value.correct) &&
    value.correct >= 0 &&
    value.correct <= value.answered
  )
}
function modeAndAccent(value: Record<string, unknown>): boolean {
  return (
    (value.mode === "choice" && value.accent_policy === "na") ||
    (value.mode === "typing" &&
      (value.accent_policy === "strict" || value.accent_policy === "relaxed"))
  )
}
function selections(value: unknown): value is PracticeMetadata["selections"] {
  return (
    object(value) &&
    typeof value.verbSet === "string" &&
    ["all", "common", "select"].includes(value.verbSet) &&
    typeof value.tenseSet === "string" &&
    ["all", "basic", "advanced", "select"].includes(value.tenseSet) &&
    typeof value.personSet === "string" &&
    ["all", "select"].includes(value.personSet)
  )
}
function defaults(value: unknown): value is PracticeMetadata["defaults"] {
  return (
    object(value) &&
    (value.mode === "typing" || value.mode === "choice") &&
    (value.accentPolicy === "strict" || value.accentPolicy === "relaxed") &&
    positiveInteger(value.length) &&
    selections(value)
  )
}
function configuration(value: unknown): value is HistoryRow["configuration"] {
  if (
    !object(value) ||
    !object(value.resolved) ||
    !selections(value.selections) ||
    (value.defaults !== undefined && !defaults(value.defaults))
  )
    return false
  const cfg = value.resolved
  return (
    (cfg.mode === "typing" || cfg.mode === "choice") &&
    (cfg.accentPolicy === "strict" || cfg.accentPolicy === "relaxed") &&
    positiveInteger(cfg.length) &&
    strings(cfg.verbIds) &&
    strings(cfg.categories) &&
    cfg.categories.every((id) =>
      CATEGORIES.some((category) => category.id === id),
    ) &&
    strings(cfg.persons) &&
    cfg.persons.every((id) => Object.hasOwn(PERSONS, id))
  )
}
function mistake(value: unknown): value is HistoryRow["example_mistake"] {
  return (
    value === null ||
    (object(value) &&
      text(value.verbId) &&
      text(value.category) &&
      text(value.person) &&
      typeof value.text === "string" &&
      strings(value.answers))
  )
}
function uuid(value: unknown): boolean {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    )
  )
}
function timestamp(value: unknown): boolean {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/.test(
      value,
    ) &&
    Number.isFinite(Date.parse(value))
  )
}
function countRow(value: unknown): value is CountRow {
  return (
    object(value) &&
    text(value.verb_id) &&
    text(value.category_id) &&
    modeAndAccent(value) &&
    counts(value)
  )
}
function historyRow(value: unknown): value is HistoryRow {
  return (
    object(value) &&
    uuid(value.id) &&
    timestamp(value.completed_at) &&
    modeAndAccent(value) &&
    counts(value) &&
    text(value.dataset_version) &&
    text(value.defaults_version) &&
    configuration(value.configuration) &&
    value.configuration.resolved.mode === value.mode &&
    (value.mode === "choice" ||
      value.configuration.resolved.accentPolicy === value.accent_policy) &&
    value.configuration.resolved.length >= value.answered &&
    mistake(value.example_mistake)
  )
}

export function parseCountRows(value: unknown): CountRow[] {
  if (!Array.isArray(value) || !value.every(countRow))
    throw new Error(
      "Invalid progress data from server. Retry loading Progress.",
    )
  return value
}
export function parseHistoryRows(value: unknown): HistoryRow[] {
  if (!Array.isArray(value) || !value.every(historyRow))
    throw new Error("Invalid history data from server. Retry loading History.")
  return value
}
