import type {
  PracticeMode,
  PracticePreferences,
} from "../practice-preferences/index.ts"
export function quickPreferences(
  preferences: PracticePreferences,
  mode: PracticeMode,
): PracticePreferences {
  return { ...structuredClone(preferences), mode }
}
export function practiceSummary(preferences: PracticePreferences) {
  const verbs =
    preferences.verbSet === "all"
      ? "All verbs"
      : preferences.verbSet === "common"
        ? "Common verbs"
        : preferences.verbSet === "least-practiced"
          ? "Least practiced"
          : preferences.verbSet === "most-mistakes"
            ? "Most mistakes"
            : `Selected verbs (${preferences.verbIds.length})`
  const tenses =
    preferences.tenseSet === "select"
      ? `Selected tenses (${preferences.categories.length})`
      : `${preferences.tenseSet[0].toUpperCase() + preferences.tenseSet.slice(1)} tenses`
  const persons =
    preferences.personSet === "all"
      ? "All persons"
      : `Selected persons (${preferences.persons.length})`
  return `${verbs} · ${tenses} · ${persons} · ${preferences.length} ${preferences.length === "1" ? "question" : "questions"}`
}
export function choiceNumber(
  key: string,
  count: number,
  blocked: boolean,
  modified: boolean,
  repeat: boolean,
  composing: boolean,
) {
  if (blocked || modified || repeat || composing || !/^[1-4]$/.test(key))
    return null
  const index = Number(key) - 1
  return index < count ? index : null
}
