export interface VerifiedAccount {
  id: string
}
export interface DeleteDependencies {
  origins: readonly string[]
  verifyUser: (token: string) => Promise<VerifiedAccount | null>
  deleteUser: (id: string) => Promise<void>
}
// No secrets or network client here: injectable boundary for ownership/failure tests.
export function createDeleteHandler(deps: DeleteDependencies) {
  return async function handle(request: Request): Promise<Response> {
    const origin = request.headers.get("origin")
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      Vary: "Origin",
    }
    if (origin && !deps.origins.includes(origin))
      return new Response(JSON.stringify({ error: "Origin not allowed." }), {
        status: 403,
        headers,
      })
    if (origin) headers["Access-Control-Allow-Origin"] = origin
    headers["Access-Control-Allow-Headers"] =
      "authorization, apikey, content-type, x-client-info, x-supabase-api-version, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version"
    headers["Access-Control-Allow-Methods"] = "POST, OPTIONS"
    const reply = (status: number, body: unknown) =>
      new Response(JSON.stringify(body), { status, headers })
    if (request.method === "OPTIONS")
      return new Response(null, { status: 204, headers })
    if (request.method !== "POST") return reply(405, { error: "Use POST." })
    const authorization = request.headers.get("authorization") ?? ""
    const match = /^Bearer (\S+)$/i.exec(authorization)
    if (!match)
      return reply(401, {
        error: "Sign in again before deleting your account.",
      })
    const contentLength = Number(request.headers.get("content-length") ?? 0)
    if (contentLength > 2048) return reply(413, { error: "Request too large." })
    let body: unknown
    try {
      const text = await request.text()
      if (text.length > 2048) return reply(413, { error: "Request too large." })
      body = JSON.parse(text) as unknown
    } catch {
      return reply(400, { error: "Invalid confirmation." })
    }
    if (
      !body ||
      typeof body !== "object" ||
      !("confirmation" in body) ||
      body.confirmation !== "DELETE" ||
      !("expectedUserId" in body) ||
      typeof body.expectedUserId !== "string"
    )
      return reply(400, {
        error: "Explicit deletion confirmation is required.",
      })
    let user: VerifiedAccount | null
    try {
      user = await deps.verifyUser(match[1])
    } catch {
      return reply(503, {
        error:
          "Could not verify your session. Nothing was deleted; retry later.",
      })
    }
    if (!user)
      return reply(401, {
        error:
          "Your account session is unavailable. Sign out and sign in again.",
      })
    if (user.id !== body.expectedUserId)
      return reply(409, {
        error: "The signed-in account changed. Review deletion again.",
      })
    try {
      await deps.deleteUser(user.id)
    } catch {
      return reply(503, {
        error:
          "Deletion was not acknowledged. It may have completed; retry or sign out and check. No success is assumed.",
      })
    }
    return reply(200, { deleted: true, userId: user.id })
  }
}
