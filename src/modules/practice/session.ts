import { getCategoryPersons } from "@conjugadora/verb-catalogue"
import type {
  CatalogueVerb,
  CategoryId,
  PersonId,
} from "@conjugadora/verb-catalogue"
import { shuffled, withChoices } from "./choices.ts"
import { isCorrectAnswer } from "../answer-checking/index.ts"
import type { AccentPolicy } from "../answer-checking/index.ts"

import type { PracticeMode } from "../practice-preferences/index.ts"
export { PRACTICE_PERSONS } from "../practice-preferences/index.ts"
export type { PracticeMode } from "../practice-preferences/index.ts"
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
  options?: string[]
}
export interface PracticeConfig {
  mode: PracticeMode
  verbIds: string[]
  categories: CategoryId[]
  persons: PersonId[]
  length: number
  accentPolicy: AccentPolicy
}
export function createQuestionPool(
  verbs: readonly CatalogueVerb[],
  config: PracticeConfig,
  random: () => number = Math.random,
): Question[] {
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
        const question: Question = {
          id,
          verbId: verb.id,
          infinitive: verb.infinitive,
          meaning: verb.meaning,
          category,
          person,
          answers: [...answers],
        }
        const eligible =
          config.mode === "choice"
            ? withChoices(question, verb, random)
            : question
        if (eligible) pool.push(eligible)
      }
    }
  }
  return pool
}
export function createQuestions(
  verbs: readonly CatalogueVerb[],
  config: PracticeConfig,
  random: () => number = Math.random,
  preferredPairs: ReadonlySet<string> = new Set(),
): Question[] {
  if (!Number.isInteger(config.length) || config.length < 1)
    throw new Error("Choose a positive whole number of questions.")
  const pool = createQuestionPool(verbs, config, random)
  if (!pool.length)
    throw new Error(
      "Select at least one available verb, tense, and person with valid answer options.",
    )
  const randomized = shuffled(pool, random)
  const preferred = (question: Question) =>
    preferredPairs.has(`${question.verbId}:${question.category}`)
  return [
    ...randomized.filter(preferred),
    ...randomized.filter((question) => !preferred(question)),
  ].slice(0, config.length)
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
export type SessionAction =
  | { type: "submit"; text: string }
  | { type: "submit-choice"; index: number }
  | { type: "next" }
  | { type: "auto-next"; index: number }
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
  if (action.type === "submit" || action.type === "submit-choice") {
    if (state.phase !== "question") return state
    const question = state.questions[state.index]
    let text: string
    if (action.type === "submit-choice") {
      if (
        !question.options ||
        !Number.isInteger(action.index) ||
        action.index < 0 ||
        action.index >= question.options.length
      )
        return state
      text = question.options[action.index]
    } else {
      if (question.options || !action.text.trim()) return state
      text = action.text
    }
    return {
      ...state,
      phase: "feedback",
      results: [
        ...state.results,
        {
          question,
          text,
          correct: isCorrectAnswer(
            text,
            question.answers,
            question.options ? "strict" : state.accentPolicy,
          ),
        },
      ],
    }
  }
  if (
    action.type === "auto-next" &&
    (action.index !== state.index ||
      !state.results[state.results.length - 1]?.correct)
  )
    return state
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

// Original catalogue and selection snapshot for a fresh run with identical settings.
export interface PracticeSource {
  catalogue?: import("@conjugadora/verb-catalogue").Catalogue
  preferredPairs?: string[]
  verbs: CatalogueVerb[]
  datasetVersion: string
  preferences: import("../practice-preferences/index.ts").PracticePreferences
}
