import { getCategoryPersons } from "../verb-catalogue/index.ts"
import type {
  CatalogueVerb,
  CategoryId,
  PersonId,
} from "../verb-catalogue/index.ts"
import { isCorrectAnswer } from "../answer-checking/index.ts"
import type { AccentPolicy } from "../answer-checking/index.ts"

export const PRACTICE_PERSONS = [
  "yo",
  "tu",
  "el",
  "nosotros",
  "vosotros",
  "ellos",
] as const
export function selectedCategoryPersons(
  category: CategoryId,
  selected: readonly PersonId[],
): PersonId[] {
  return getCategoryPersons(category).filter((person) =>
    selected.includes(
      person === "usted" ? "el" : person === "ustedes" ? "ellos" : person,
    ),
  )
}
export function poolSize(
  verbCount: number,
  categories: readonly CategoryId[],
  persons: readonly PersonId[],
): number {
  return (
    verbCount *
    [...new Set(categories)].reduce(
      (total, category) =>
        total + selectedCategoryPersons(category, persons).length,
      0,
    )
  )
}
export interface Question {
  id: string
  verbId: string
  infinitive: string
  meaning: string
  category: CategoryId
  person: PersonId
  answers: string[]
}
export interface PracticeConfig {
  verbIds: string[]
  categories: CategoryId[]
  persons: PersonId[]
  length: number
  accentPolicy: AccentPolicy
}
export function createQuestions(
  verbs: readonly CatalogueVerb[],
  config: PracticeConfig,
  random: () => number = Math.random,
): Question[] {
  if (!Number.isInteger(config.length) || config.length < 1)
    throw new Error("Choose a positive whole number of questions.")
  const pool: Question[] = []
  const seen = new Set<string>()
  for (const verb of verbs) {
    if (!config.verbIds.includes(verb.id)) continue
    for (const category of new Set(config.categories)) {
      for (const person of selectedCategoryPersons(category, config.persons)) {
        const id = `${verb.id}:${category}:${person}`
        if (seen.has(id)) continue
        const answers = verb.conjugations[category][person]
        if (!answers?.length) continue
        seen.add(id)
        pool.push({
          id,
          verbId: verb.id,
          infinitive: verb.infinitive,
          meaning: verb.meaning,
          category,
          person,
          answers: [...answers],
        })
      }
    }
  }
  if (!pool.length)
    throw new Error("Select at least one available verb, tense, and person.")
  for (let i = pool.length - 1; i > 0; i--) {
    const index = Math.floor(random() * (i + 1))
    ;[pool[i], pool[index]] = [pool[index], pool[i]]
  }
  return pool.slice(0, config.length)
}
export interface AnswerResult {
  question: Question
  text: string
  correct: boolean
}
export interface SessionState {
  questions: Question[]
  accentPolicy: AccentPolicy
  phase: "question" | "feedback" | "complete"
  index: number
  results: AnswerResult[]
}
export type SessionAction = { type: "submit"; text: string } | { type: "next" }
export function initialSession(
  questions: Question[],
  accentPolicy: AccentPolicy,
): SessionState {
  if (!questions.length) throw new Error("A practice session needs questions.")
  return { questions, accentPolicy, phase: "question", index: 0, results: [] }
}
export function sessionReducer(
  state: SessionState,
  action: SessionAction,
): SessionState {
  if (action.type === "submit") {
    if (state.phase !== "question" || !action.text.trim()) return state
    const question = state.questions[state.index]
    return {
      ...state,
      phase: "feedback",
      results: [
        ...state.results,
        {
          question,
          text: action.text,
          correct: isCorrectAnswer(
            action.text,
            question.answers,
            state.accentPolicy,
          ),
        },
      ],
    }
  }
  if (state.phase !== "feedback") return state
  return state.index === state.questions.length - 1
    ? { ...state, phase: "complete" }
    : { ...state, phase: "question", index: state.index + 1 }
}
export function sessionScore(results: readonly AnswerResult[]) {
  const correct = results.filter((result) => result.correct).length
  return {
    correct,
    incorrect: results.length - correct,
    total: results.length,
    percentage: results.length
      ? Math.round((correct / results.length) * 100)
      : 0,
  }
}
