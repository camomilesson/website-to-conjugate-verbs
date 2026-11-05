export function authConfiguration(
  url: unknown,
  key: unknown,
): { url: string; key: string } | null {
  if (!url && !key) return null
  if (typeof url !== "string" || typeof key !== "string" || !url || !key)
    throw new Error(
      "Set both Supabase environment variables to enable Google sign-in.",
    )
  const parsed = new URL(url)
  if (
    parsed.protocol !== "https:" &&
    !(
      parsed.protocol === "http:" &&
      ["localhost", "127.0.0.1"].includes(parsed.hostname)
    )
  )
    throw new Error("Use an HTTPS Supabase project URL.")
  if (!key.startsWith("sb_publishable_"))
    throw new Error(
      "Use a Supabase publishable key, never a secret or service-role key.",
    )
  return { url: url.replace(/\/$/, ""), key }
}
