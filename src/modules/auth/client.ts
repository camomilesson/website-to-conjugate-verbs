import { createClient } from "@supabase/supabase-js"
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
export const supabase = config
  ? createClient(config.url, config.key, {
      auth: {
        flowType: "pkce",
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null
