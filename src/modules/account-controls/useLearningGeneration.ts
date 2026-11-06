import { useEffect, useState } from "react"
import { useAuth } from "../auth/ui.ts"
import { getLearningGeneration } from "./repository.ts"
export function useLearningGeneration() {
  const auth = useAuth()
  const [generation, setGeneration] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    setGeneration(null)
    setError(null)
    if (auth.user)
      void getLearningGeneration()
        .then((value) => {
          if (active) setGeneration(value)
        })
        .catch((reason: unknown) => {
          if (active)
            setError(
              reason instanceof Error
                ? reason.message
                : "Could not load learning data.",
            )
        })
    return () => {
      active = false
    }
  }, [auth.identityKey, auth.user?.id, attempt])
  return {
    generation,
    error,
    loading: !!auth.user && !generation && !error,
    retry: () => setAttempt((n) => n + 1),
  }
}
