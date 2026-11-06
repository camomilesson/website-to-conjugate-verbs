import type { SessionState } from "./session.ts"
export function practiceEntryKey(state: unknown): string {
  return state &&
    typeof state === "object" &&
    "practiceEntry" in state &&
    typeof state.practiceEntry === "string"
    ? state.practiceEntry
    : "initial"
}
export function shouldConfirmPracticeLeave(
  phase: SessionState["phase"],
  current: { pathname: string; state: unknown },
  next: { pathname: string; state: unknown },
) {
  return (
    phase !== "complete" &&
    (current.pathname !== next.pathname ||
      practiceEntryKey(current.state) !== practiceEntryKey(next.state))
  )
}
