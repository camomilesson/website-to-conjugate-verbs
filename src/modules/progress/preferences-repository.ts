import { supabase } from "../auth/index.ts"
import {
  defaultProgressPreferences,
  parseProgressPreferences,
  preferenceWriter,
  PROGRESS_STORAGE_KEY,
} from "./preferences.ts"
import type { ProgressPreferences } from "./preferences.ts"
interface PendingView {
  preferences: ProgressPreferences
  error: string | null
}
const pending = new Map<string, PendingView>()
const writers = new Map<string, ReturnType<typeof preferenceWriter>>()
function client() {
  if (!supabase) throw new Error("Account services unavailable.")
  return supabase
}
export async function readProgressPreferences(
  owner: string | null,
): Promise<ProgressPreferences> {
  if (!owner) {
    const raw = localStorage.getItem(PROGRESS_STORAGE_KEY)
    return raw
      ? parseProgressPreferences(JSON.parse(raw) as unknown)
      : defaultProgressPreferences()
  }
  await writers.get(owner)?.settled()
  const failed = pending.get(owner)
  if (failed?.error) return failed.preferences
  const { data, error } = await client()
    .from("progress_preferences")
    .select("settings")
    .eq("user_id", owner)
    .maybeSingle()
  if (error)
    throw new Error(`Could not load Progress choices: ${error.message}`)
  const row: unknown = data
  if (row === null) return defaultProgressPreferences()
  if (!row || typeof row !== "object" || !("settings" in row))
    throw new Error("Invalid Progress preferences response.")
  return parseProgressPreferences(row.settings)
}
export function progressPreferenceError(owner: string | null) {
  return owner ? (pending.get(owner)?.error ?? null) : null
}
export async function writeProgressPreferences(
  owner: string | null,
  value: ProgressPreferences,
) {
  const preferences = parseProgressPreferences(value)
  if (!owner) {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(preferences))
    return
  }
  let writer = writers.get(owner)
  if (!writer) {
    writer = preferenceWriter(async (settings) => {
      const { error } = await client()
        .from("progress_preferences")
        .upsert({ user_id: owner, settings }, { onConflict: "user_id" })
      if (error)
        throw new Error(`Could not save Progress choices: ${error.message}`)
    })
    writers.set(owner, writer)
  }
  const record: PendingView = { preferences, error: null }
  pending.set(owner, record)
  try {
    await writer.save(preferences)
    if (pending.get(owner) === record) pending.delete(owner)
  } catch (reason: unknown) {
    if (pending.get(owner) === record)
      record.error =
        reason instanceof Error
          ? reason.message
          : "Could not save Progress choices."
    throw reason
  }
}
