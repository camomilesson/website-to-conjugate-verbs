import { getCategoryPersons } from "@conjugadora/verb-catalogue"
import type { Catalogue, CategoryId } from "@conjugadora/verb-catalogue"
import type { CountRow } from "../learning-data/data.ts"
import type { PracticePreferences } from "../practice-preferences/index.ts"
export type TargetedMode = "least-practiced" | "most-mistakes"
export function targetedVerbs(
  catalogue: Catalogue,
  counts: readonly CountRow[],
  preferences: PracticePreferences,
  mode: TargetedMode,
) {
  const categories = [...new Set(preferences.categories)].filter((category) =>
    getCategoryPersons(category).some((person) =>
      preferences.persons.includes(
        person === "usted" ? "el" : person === "ustedes" ? "ellos" : person,
      ),
    ),
  )
  if (!categories.length) return []
  const cells = new Map<string, { correct: number; answered: number }>()
  for (const count of counts) {
    if (
      count.mode !== preferences.mode ||
      (count.mode === "typing" &&
        count.accent_policy !== preferences.accentPolicy) ||
      !categories.includes(count.category_id as CategoryId)
    )
      continue
    const key = `${count.verb_id}:${count.category_id}`
    const cell = cells.get(key) ?? { correct: 0, answered: 0 }
    cell.correct += count.correct
    cell.answered += count.answered
    cells.set(key, cell)
  }
  return catalogue.verbs
    .map((verb) => {
      let correct = 0,
        answered = 0
      const unattempted = categories.filter((category) => {
        const cell = cells.get(`${verb.id}:${category}`)
        correct += cell?.correct ?? 0
        answered += cell?.answered ?? 0
        return !cell?.answered
      })
      return { verb, correct, answered, unattempted }
    })
    .filter((row) => mode === "least-practiced" || row.answered > 0)
    .sort((a, b) => {
      const rank =
        mode === "least-practiced"
          ? b.unattempted.length - a.unattempted.length ||
            a.answered - b.answered
          : a.correct / a.answered - b.correct / b.answered ||
            b.answered - a.answered
      return rank || a.verb.infinitive.localeCompare(b.verb.infinitive, "es")
    })
    .slice(0, 20)
}
