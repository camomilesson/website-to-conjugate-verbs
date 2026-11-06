import { supabase } from "../auth/client.ts"
import { DEFAULTS_VERSION, parseAcknowledgement } from "./model.ts"
import type {
  CountRow,
  PracticeMetadata,
  Submission,
  TrackingContext,
} from "./model.ts"
function client() {
  if (!supabase) throw new Error("Account services are unavailable.")
  return supabase
}
export async function startTrackedPractice(
  userId: string,
  metadata: PracticeMetadata,
  datasetVersion: string,
  expected: number,
): Promise<TrackingContext> {
  const response = await client().rpc("start_practice", {
    p_configuration: metadata,
    p_dataset_version: datasetVersion,
    p_defaults_version: DEFAULTS_VERSION,
    p_expected: expected,
  })
  const data: unknown = response.data
  const error = response.error
  if (error)
    throw new Error(`Could not start tracked practice: ${error.message}`)
  if (typeof data !== "string")
    throw new Error("Invalid practice identifier from server.")
  return { runId: data, userId }
}
export async function submitTrackedAnswer(value: Submission) {
  const response = await client().rpc("submit_practice_answer", {
    p_run_id: value.runId,
    p_submission_id: value.submissionId,
    p_ordinal: value.ordinal,
    p_verb_id: value.verbId,
    p_category_id: value.category,
    p_person_id: value.person,
    p_correct: value.correct,
    p_text: value.text,
    p_answers: value.answers,
  })
  const data: unknown = response.data
  const error = response.error
  if (error) throw new Error(`Answer not acknowledged: ${error.message}`)
  return parseAcknowledgement(data)
}
export async function readCounts(userId: string): Promise<CountRow[]> {
  const all: CountRow[] = []
  // Explicit pagination avoids the API's default 1,000-row cap (up to 4,800 buckets).
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await client()
      .from("accuracy_counts")
      .select("verb_id,category_id,mode,accent_policy,correct,answered")
      .eq("user_id", userId)
      .order("verb_id")
      .order("category_id")
      .order("mode")
      .order("accent_policy")
      .range(offset, offset + 499)
    if (error) throw new Error(`Could not load progress: ${error.message}`)
    const rows = data as CountRow[]
    if (
      !Array.isArray(rows) ||
      rows.some(
        (row) =>
          !Number.isSafeInteger(row.correct) ||
          !Number.isSafeInteger(row.answered) ||
          row.correct < 0 ||
          row.answered <= 0 ||
          row.correct > row.answered,
      )
    )
      throw new Error("Invalid progress counts from server.")
    all.push(...rows)
    if (rows.length < 500) return all
  }
}
