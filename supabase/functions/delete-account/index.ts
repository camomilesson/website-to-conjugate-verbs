import { createClient } from "npm:@supabase/supabase-js@2.119.0"
import { createDeleteHandler } from "../_shared/delete-handler.ts"

// Runtime-only admin credentials. Never use a VITE_ variable for these.
const url = Deno.env.get("SUPABASE_URL")
const key =
  Deno.env.get("ACCOUNT_ADMIN_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
const origins = (Deno.env.get("ACCOUNT_ALLOWED_ORIGINS") ?? "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean)
if (!url || !key || !origins.length)
  throw new Error("Account deletion server configuration is incomplete.")
const admin = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
})
const handler = createDeleteHandler({
  origins,
  async verifyUser(token) {
    // Remote verification checks the identity still exists, not merely JWT claims.
    const { data, error } = await admin.auth.getUser(token)
    if (error) {
      if (error.status === 401 || error.status === 403 || error.status === 404)
        return null
      throw error
    }
    return data.user ? { id: data.user.id } : null
  },
  async deleteUser(id) {
    const { error } = await admin.auth.admin.deleteUser(id, false)
    if (error) throw error
  },
})
Deno.serve(handler)
