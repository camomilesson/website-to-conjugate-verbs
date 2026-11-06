import { useCallback, useEffect, useRef, useState } from "react"
import { useAuth } from "../auth/ui.ts"
import { defaultProgressPreferences } from "./preferences.ts"
import type { ProgressPreferences } from "./preferences.ts"
import {
  progressPreferenceError,
  readProgressPreferences,
  writeProgressPreferences,
} from "./preferences-repository.ts"
export function useProgressPreferences() {
  const auth = useAuth()
  const owner = auth.user?.id ?? null
  const [state, setState] = useState<{
    owner: string | null
    value: ProgressPreferences
  } | null>(null)
  const [readError, setReadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const alive = useRef(true)
  const version = useRef(0)
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])
  useEffect(() => {
    if (auth.status === "loading" || auth.status === "error") return
    let active = true
    setReadError(null)
    void readProgressPreferences(owner)
      .then((value) => {
        if (active) {
          setState({ owner, value })
          setSaveError(progressPreferenceError(owner))
        }
      })
      .catch((reason: unknown) => {
        if (active)
          setReadError(
            reason instanceof Error
              ? reason.message
              : "Could not load Progress choices.",
          )
      })
    return () => {
      active = false
    }
  }, [owner, auth.status, attempt])
  const change = useCallback(
    (value: ProgressPreferences) => {
      setState({ owner, value })
      setSaving(true)
      setSaveError(null)
      const current = ++version.current
      void writeProgressPreferences(owner, value)
        .then(() => {
          if (alive.current && current === version.current) setSaving(false)
        })
        .catch((reason: unknown) => {
          if (alive.current && current === version.current) {
            setSaving(false)
            setSaveError(
              reason instanceof Error
                ? reason.message
                : "Could not save Progress choices.",
            )
          }
        })
    },
    [owner],
  )
  return {
    value: state?.owner === owner ? state.value : null,
    readError,
    saveError,
    saving,
    change,
    retryRead: () => setAttempt((n) => n + 1),
    retrySave: () => {
      if (state?.owner === owner) change(state.value)
    },
    restore: () => {
      const value = defaultProgressPreferences()
      setReadError(null)
      change(value)
    },
  }
}
