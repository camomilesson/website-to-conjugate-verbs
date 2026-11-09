import { createClient } from "@supabase/supabase-js"
import { createSessionStorage } from "./session-storage.ts"
import { authConfiguration } from "./configuration.ts"
let config: ReturnType<typeof authConfiguration> = null
export let configurationError: string | null = null
try {
  config = authConfiguration(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  )
} catch (reason: unknown) {
  configurationError =
    reason instanceof Error ? reason.message : "Invalid account configuration."
}
export let sessionStorageChoice: ReturnType<
  typeof createSessionStorage
> | null = null
if (config) {
  try {
    sessionStorageChoice = createSessionStorage(
      config.url,
      window.localStorage,
      window.sessionStorage,
      () => crypto.randomUUID(),
    )
  } catch {
    configurationError =
      "Browser storage is unavailable. Allow site storage to sign in."
  }
}
export const supabase =
  config && sessionStorageChoice
    ? createClient(config.url, config.key, {
        auth: {
          flowType: "pkce",
          storage: sessionStorageChoice.storage,
          storageKey: sessionStorageChoice.storageKey,
          detectSessionInUrl: true,
          persistSession: true,
          autoRefreshToken: true,
        },
      })
    : null
