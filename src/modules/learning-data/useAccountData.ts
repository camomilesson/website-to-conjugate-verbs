import { useEffect, useState } from "react"
import { useAuth } from "../auth/ui.ts"
export function useAccountData<T>(load: (userId: string) => Promise<T>) {
  const auth = useAuth()
  const [data, setData] = useState<{ owner: string; value: T } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    setError(null)
    if (auth.user) {
      void load(auth.user.id)
        .then((value) => {
          if (active) setData({ owner: auth.user!.id, value })
        })
        .catch((reason: unknown) => {
          if (active)
            setError(
              reason instanceof Error
                ? reason.message
                : "Could not load account data.",
            )
        })
    }
    return () => {
      active = false
    }
  }, [auth.user?.id, load, attempt])
  return {
    data: auth.user && data?.owner === auth.user.id ? data.value : null,
    error,
    guest: !auth.user && auth.status !== "loading" && auth.status !== "error",
    authError: auth.status === "error",
    refresh: () => setAttempt((n) => n + 1),
  }
}
