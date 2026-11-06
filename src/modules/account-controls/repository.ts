import { supabase } from "../auth/client.ts"
function client() {
  if (!supabase) throw new Error("Account services are unavailable.")
  return supabase
}
export async function getLearningGeneration(): Promise<string> {
  const response = await client().rpc("get_learning_generation")
  if (response.error)
    throw new Error(`Could not check learning data: ${response.error.message}`)
  const value: unknown = response.data
  if (typeof value !== "string")
    throw new Error("Invalid learning-data version.")
  return value
}
export async function resetLearningData(
  operationId: string,
  generation: string,
): Promise<string> {
  const response = await client().rpc("reset_learning_data", {
    p_operation_id: operationId,
    p_generation: generation,
  })
  if (response.error)
    throw new Error(`Reset was not acknowledged: ${response.error.message}`)
  const value: unknown = response.data
  if (typeof value !== "string")
    throw new Error(
      "Reset acknowledgement was invalid. Retry the same request.",
    )
  return value
}
export async function deleteOwnAccount(
  expectedUserId: string,
  onDeleted?: () => void,
) {
  const service = client()
  const response = await service.functions.invoke("delete-account", {
    body: { confirmation: "DELETE", expectedUserId },
  })
  const failure: unknown = response.error
  if (failure) {
    const context =
      typeof failure === "object" && "context" in failure
        ? failure.context
        : null
    if (context instanceof Response) {
      const body: unknown = await context.json().catch(() => null)
      if (
        body &&
        typeof body === "object" &&
        "error" in body &&
        typeof body.error === "string"
      )
        throw new Error(body.error)
    }
    throw new Error(
      "Account deletion was not acknowledged. It may have completed. Retry, or sign out and check your account.",
    )
  }
  const result: unknown = response.data
  if (
    !result ||
    typeof result !== "object" ||
    !("deleted" in result) ||
    result.deleted !== true ||
    !("userId" in result) ||
    result.userId !== expectedUserId
  )
    throw new Error(
      "Account deletion was not acknowledged. Retry or sign out and check.",
    )
  onDeleted?.()
  // Do not sign out a different account that signed in during the request.
  const session = await service.auth.getSession()
  if (session.data.session?.user.id === expectedUserId) {
    const { error: signOutError } = await service.auth.signOut({
      scope: "local",
    })
    if (signOutError)
      throw new Error(
        "Your account was deleted, but local sign-out failed. Sign out or close this browser before continuing.",
      )
  }
}
