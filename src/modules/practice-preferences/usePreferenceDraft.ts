import { useEffect, useState } from "react"
import { loadCatalogue } from "@conjugadora/verb-catalogue"
import type { Catalogue } from "@conjugadora/verb-catalogue"
import { accountPreferencesRepository, useAuth } from "../auth/ui.ts"
import { readPreferences, savePreferences } from "./preferences.ts"
import { loadAccountPreferences, saveAccountPreferences } from "./repository.ts"
import type { PracticePreferences } from "./preferences.ts"

export function usePreferenceDraft() {
  const auth = useAuth()
  const [catalogue, setCatalogue] = useState<Catalogue | null>(null)
  const [preferences, setPreferences] = useState<PracticePreferences | null>(
    null,
  )
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [loadedFor, setLoadedFor] = useState("")
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    if (auth.status === "loading" || auth.status === "error") return
    const controller = new AbortController()
    const userId = auth.user?.id
    void loadCatalogue(controller.signal)
      .then(async (data) => {
        const restored = userId
          ? await loadAccountPreferences(
              accountPreferencesRepository(userId),
              data,
            )
          : readPreferences(data)
        if (controller.signal.aborted) return
        setCatalogue(data)
        setPreferences(restored.preferences)
        setNotice(restored.notice)
        setLoadedFor(auth.identityKey)
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
  }, [attempt, auth.status, auth.user?.id, auth.identityKey])
  async function save(value: PracticePreferences) {
    return auth.user
      ? saveAccountPreferences(
          accountPreferencesRepository(auth.user.id),
          value,
        )
      : savePreferences(value)
  }
  const ready =
    loadedFor === auth.identityKey &&
    auth.status !== "loading" &&
    auth.status !== "error"
  return {
    catalogue: ready ? catalogue : null,
    preferences: ready ? preferences : null,
    setPreferences,
    notice: ready ? notice : null,
    setNotice,
    error:
      auth.status === "error"
        ? "Account session could not be loaded. Retry from Settings."
        : error,
    save,
    isAccount: !!auth.user,
    retry: () => setAttempt((value) => value + 1),
  }
}
