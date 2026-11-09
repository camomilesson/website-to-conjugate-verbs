import { useEffect, useState } from "react"
import { useAuth } from "../auth/ui.ts"
import { readCounts } from "../learning-data/index.ts"
import type { CountRow } from "../learning-data/data.ts"
export function usePracticeCounts(enabled: boolean) {
  const auth = useAuth()
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<{
    key: string
    counts?: CountRow[]
    error?: string
  } | null>(null)
  const key = `${auth.identityKey}:${attempt}:${enabled}`
  useEffect(() => {
    setState(null)
    if (!enabled || !auth.user) return
    let active = true
    void readCounts(auth.user.id)
      .then((counts) => {
        if (active) setState({ key, counts })
      })
      .catch((reason: unknown) => {
        if (active)
          setState({
            key,
            error:
              reason instanceof Error
                ? reason.message
                : "Could not load practice progress.",
          })
      })
    return () => {
      active = false
    }
  }, [enabled, auth.user, key])
  return {
    counts: state?.key === key ? (state.counts ?? null) : null,
    error: state?.key === key ? state.error : undefined,
    retry: () => setAttempt((value) => value + 1),
  }
}
