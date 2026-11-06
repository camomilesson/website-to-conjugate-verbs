import type { AnswerResult, PracticeConfig } from "../practice/session.ts"
import type { PracticePreferences } from "../practice-preferences/index.ts"

export const DEFAULTS_VERSION = "practice-1"
export interface TrackingContext {
  runId: string
  userId: string
}
export interface PracticeMetadata {
  resolved: PracticeConfig
  selections: Pick<PracticePreferences, "verbSet" | "tenseSet" | "personSet">
  defaults: {
    mode: "typing"
    length: 20
    accentPolicy: "strict"
    verbSet: "all"
    tenseSet: "basic"
    personSet: "all"
  }
}
export function practiceMetadata(
  config: PracticeConfig,
  preferences: PracticePreferences,
): PracticeMetadata {
  return structuredClone({
    resolved: config,
    selections: {
      verbSet: preferences.verbSet,
      tenseSet: preferences.tenseSet,
      personSet: preferences.personSet,
    },
    defaults: {
      mode: "typing",
      length: 20,
      accentPolicy: "strict",
      verbSet: "all",
      tenseSet: "basic",
      personSet: "all",
    },
  })
}
export interface Submission {
  runId: string
  submissionId: string
  ordinal: number
  verbId: string
  category: string
  person: string
  correct: boolean
  text: string
  answers: string[]
}
export function submissionFor(
  runId: string,
  ordinal: number,
  result: AnswerResult,
  id: string = crypto.randomUUID(),
): Submission {
  return {
    runId,
    submissionId: id,
    ordinal,
    verbId: result.question.verbId,
    category: result.question.category,
    person: result.question.person,
    correct: result.correct,
    text: result.text,
    answers: [...result.question.answers],
  }
}
export interface Acknowledgement {
  acknowledged: true
  duplicate: boolean
  complete: boolean
}
export function parseAcknowledgement(value: unknown): Acknowledgement {
  if (
    !value ||
    typeof value !== "object" ||
    !("acknowledged" in value) ||
    value.acknowledged !== true ||
    !("duplicate" in value) ||
    typeof value.duplicate !== "boolean" ||
    !("complete" in value) ||
    typeof value.complete !== "boolean"
  )
    throw new Error(
      "The server did not acknowledge this answer. Retry the same submission.",
    )
  return {
    acknowledged: true,
    duplicate: value.duplicate,
    complete: value.complete,
  }
}
// Holds one immutable in-memory payload across failed/lost replies. No offline storage.
export function retryableSubmission(
  payload: Submission,
  write: (value: Submission) => Promise<Acknowledgement>,
) {
  const frozen = structuredClone(payload)
  let inFlight: Promise<Acknowledgement> | null = null
  let acknowledged: Acknowledgement | null = null
  return {
    send(): Promise<Acknowledgement> {
      if (acknowledged) return Promise.resolve(acknowledged)
      if (inFlight) return inFlight
      inFlight = write(structuredClone(frozen))
        .then((result) => {
          acknowledged = parseAcknowledgement(result)
          return acknowledged
        })
        .finally(() => {
          inFlight = null
        })
      return inFlight
    },
  }
}
export interface CountRow {
  verb_id: string
  category_id: string
  mode: "typing" | "choice"
  accent_policy: "strict" | "relaxed" | "na"
  correct: number
  answered: number
}
export function totals(
  rows: readonly Pick<CountRow, "correct" | "answered">[],
) {
  const correct = rows.reduce((n, row) => n + row.correct, 0)
  const answered = rows.reduce((n, row) => n + row.answered, 0)
  return {
    correct,
    answered,
    percentage: answered ? Math.round((correct / answered) * 100) : null,
  }
}
export interface HistoryRow {
  id: string
  completed_at: string
  mode: "typing" | "choice"
  accent_policy: string
  correct: number
  answered: number
  configuration: PracticeMetadata
  dataset_version: string
  defaults_version: string
  example_mistake: {
    verbId: string
    category: string
    person: string
    text: string
    answers: string[]
  } | null
}
