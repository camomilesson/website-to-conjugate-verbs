import {
  CATEGORIES,
  getCategoryPersons,
  getPresetCategories,
} from "../verb-catalogue/index.ts"
import type {
  Catalogue,
  CategoryId,
  PersonId,
} from "../verb-catalogue/index.ts"
import type { AccentPolicy } from "../answer-checking/index.ts"

export const PREFERENCE_KEY = "la-conjugadora.practice-preferences.v1"
export const PRACTICE_PERSONS = [
  "yo",
  "tu",
  "el",
  "nosotros",
  "vosotros",
  "ellos",
] as const
export type PracticeMode = "typing" | "choice"
export interface PracticePreferences {
  mode: PracticeMode
  verbIds: string[]
  categories: CategoryId[]
  persons: PersonId[]
  length: string
  accentPolicy: AccentPolicy
  verbSet: "all" | "common" | "select"
  tenseSet: "basic" | "advanced" | "all" | "select"
  personSet: "all" | "select"
}
export function commonVerbIds(catalogue: Catalogue): string[] {
  return catalogue.verbs
    .filter((verb) => ["ser", "ir", "tener", "hablar"].includes(verb.id))
    .map((verb) => verb.id)
}
export function defaultPreferences(catalogue: Catalogue): PracticePreferences {
  return {
    mode: "typing",
    verbIds: catalogue.verbs.map((verb) => verb.id),
    categories: getPresetCategories("basic"),
    persons: [...PRACTICE_PERSONS],
    length: "20",
    accentPolicy: "strict",
    verbSet: "all",
    tenseSet: "basic",
    personSet: "all",
  }
}
function object(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
function supported<T extends string>(
  value: unknown,
  allowed: readonly T[],
): T[] {
  return Array.isArray(value) ? allowed.filter((id) => value.includes(id)) : []
}
export function restorePreferences(
  raw: string | null,
  catalogue: Catalogue,
): { preferences: PracticePreferences; notice: string | null } {
  const defaults = defaultPreferences(catalogue)
  if (raw === null) return { preferences: defaults, notice: null }
  const fallback = {
    preferences: defaults,
    notice:
      "Saved preferences could not be restored. Default selections are shown.",
  }
  let saved: unknown
  try {
    saved = JSON.parse(raw) as unknown
  } catch {
    return fallback
  }
  if (!object(saved) || saved.schemaVersion !== 1 || !object(saved.preferences))
    return fallback
  const value = saved.preferences
  let adjusted = false
  function selection<T extends string>(
    rawValue: unknown,
    allowed: readonly T[],
    fallbackValue: T[],
  ): T[] {
    const result = supported(rawValue, allowed)
    if (
      !Array.isArray(rawValue) ||
      result.length !== rawValue.length ||
      !result.length
    )
      adjusted = true
    return result.length ? result : fallbackValue
  }
  const preferences = { ...defaults }
  if (value.mode === "typing" || value.mode === "choice")
    preferences.mode = value.mode
  else adjusted = true
  if (value.accentPolicy === "strict" || value.accentPolicy === "relaxed")
    preferences.accentPolicy = value.accentPolicy
  else adjusted = true
  if (
    typeof value.length === "string" &&
    Number.isSafeInteger(Number(value.length)) &&
    Number(value.length) > 0
  )
    preferences.length = String(Number(value.length))
  else adjusted = true
  if (
    value.verbSet === "all" ||
    value.verbSet === "common" ||
    value.verbSet === "select"
  )
    preferences.verbSet = value.verbSet
  else adjusted = true
  if (
    value.tenseSet === "basic" ||
    value.tenseSet === "advanced" ||
    value.tenseSet === "all" ||
    value.tenseSet === "select"
  )
    preferences.tenseSet = value.tenseSet
  else adjusted = true
  if (value.personSet === "all" || value.personSet === "select")
    preferences.personSet = value.personSet
  else adjusted = true
  preferences.verbIds =
    preferences.verbSet === "all"
      ? defaults.verbIds
      : preferences.verbSet === "common"
        ? commonVerbIds(catalogue)
        : selection(value.verbIds, defaults.verbIds, defaults.verbIds)
  if (!preferences.verbIds.length) {
    preferences.verbIds = defaults.verbIds
    preferences.verbSet = "all"
    adjusted = true
  }
  preferences.categories =
    preferences.tenseSet === "select"
      ? selection(
          value.categories,
          CATEGORIES.map((category) => category.id),
          defaults.categories,
        )
      : getPresetCategories(preferences.tenseSet)
  preferences.persons =
    preferences.personSet === "all"
      ? defaults.persons
      : selection(value.persons, PRACTICE_PERSONS, defaults.persons)
  // A surviving custom selection can still be unusable, such as only yo + imperative.
  if (!hasEligibleCombination(preferences)) {
    preferences.persons = defaults.persons
    preferences.personSet = "all"
    adjusted = true
  }
  return {
    preferences,
    notice: adjusted
      ? "Some saved preferences are no longer supported. Available selections and defaults were restored."
      : null,
  }
}
export function hasEligibleCombination(
  preferences: PracticePreferences,
): boolean {
  return (
    preferences.verbIds.length > 0 &&
    preferences.categories.some((category) =>
      getCategoryPersons(category).some((person) =>
        preferences.persons.includes(
          person === "usted" ? "el" : person === "ustedes" ? "ellos" : person,
        ),
      ),
    )
  )
}
export function validPreferences(preferences: PracticePreferences): boolean {
  return (
    Number.isSafeInteger(Number(preferences.length)) &&
    Number(preferences.length) > 0 &&
    hasEligibleCombination(preferences)
  )
}
export interface PreferenceStorage {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
}
export function readPreferences(
  catalogue: Catalogue,
  getStorage: () => PreferenceStorage = () => window.localStorage,
) {
  try {
    return restorePreferences(getStorage().getItem(PREFERENCE_KEY), catalogue)
  } catch {
    return {
      preferences: defaultPreferences(catalogue),
      notice:
        "Browser storage is unavailable. Preferences will not survive a reload.",
    }
  }
}
export function savePreferences(
  preferences: PracticePreferences,
  getStorage: () => PreferenceStorage = () => window.localStorage,
): string | null {
  if (!validPreferences(preferences))
    return "Choose a valid question count and at least one available verb, tense, and person."
  // Whitelist preference fields: never persist answers, question queues, or results.
  const {
    mode,
    verbIds,
    categories,
    persons,
    length,
    accentPolicy,
    verbSet,
    tenseSet,
    personSet,
  } = preferences
  try {
    getStorage().setItem(
      PREFERENCE_KEY,
      JSON.stringify({
        schemaVersion: 1,
        preferences: {
          mode,
          verbIds,
          categories,
          persons,
          length,
          accentPolicy,
          verbSet,
          tenseSet,
          personSet,
        },
      }),
    )
    return null
  } catch {
    return "Preferences could not be saved in this browser. Practice still works, but this setup will not survive a reload."
  }
}
