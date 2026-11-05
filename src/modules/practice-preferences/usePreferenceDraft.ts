import { useEffect, useState } from "react"
import { loadCatalogue } from "../verb-catalogue/index.ts"
import type { Catalogue } from "../verb-catalogue/index.ts"
import { readPreferences } from "./preferences.ts"
import type { PracticePreferences } from "./preferences.ts"

export function usePreferenceDraft() {
  const [catalogue, setCatalogue] = useState<Catalogue | null>(null)
  const [preferences, setPreferences] = useState<PracticePreferences | null>(
    null,
  )
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    void loadCatalogue(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return
        const restored = readPreferences(data)
        setCatalogue(data)
        setPreferences(restored.preferences)
        setNotice(restored.notice)
        setError("")
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted)
          setError(
            reason instanceof Error
              ? reason.message
              : "Could not load practice defaults.",
          )
      })
    return () => controller.abort()
  }, [attempt])
  return {
    catalogue,
    preferences,
    setPreferences,
    notice,
    setNotice,
    error,
    retry: () => setAttempt((value) => value + 1),
  }
}
