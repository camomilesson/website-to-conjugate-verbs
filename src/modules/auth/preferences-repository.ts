import type { PreferenceRepository } from "../practice-preferences/index.ts"
import { supabase } from "./client.ts"
export function accountPreferencesRepository(
  userId: string,
): PreferenceRepository {
  const client = supabase
  if (!client) throw new Error("Account services are not configured.")
  return {
    async read() {
      const response = await client
        .from("user_preferences")
        .select("preferences")
        .eq("user_id", userId)
        .maybeSingle()
      if (response.error)
        throw new Error(
          `Could not load account preferences: ${response.error.message}`,
        )
      const row: unknown = response.data
      if (row === null) return null
      if (typeof row !== "object" || !("preferences" in row))
        throw new Error("Invalid account preferences response.")
      return row.preferences
    },
    async write(payload) {
      const { error } = await client
        .from("user_preferences")
        .upsert(
          { user_id: userId, preferences: payload },
          { onConflict: "user_id" },
        )
      if (error)
        throw new Error(`Could not save account preferences: ${error.message}`)
    },
  }
}
