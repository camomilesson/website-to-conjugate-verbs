import { useEffect, useRef, useState } from "react"
import { useAuth } from "../auth/ui.ts"
import { cursorFor } from "./history-model.ts"
import type {
  HistoryCursor,
  HistoryMode,
  HistoryPage,
} from "./history-model.ts"
import { readHistoryPage } from "./history-repository.ts"
export function useHistory() {
  const auth = useAuth()
  const [mode, setMode] = useState<HistoryMode>("all")
  const [cursors, setCursors] = useState<(HistoryCursor | null)[]>([null])
  const [revision, setRevision] = useState(0)
  const ceiling = useRef<HistoryCursor | null>(null)
  const [result, setResult] = useState<{
    key: string
    data?: HistoryPage
    error?: string
  } | null>(null)
  const cursor = cursors[cursors.length - 1]
  const userId = auth.user?.id
  const key = JSON.stringify([userId, mode, cursor, revision])
  useEffect(() => {
    if (!userId) return
    const controller = new AbortController()
    void readHistoryPage(userId, {
      mode,
      cursor,
      ceiling: ceiling.current,
      signal: controller.signal,
    })
      .then((data) => {
        if (controller.signal.aborted) return
        if (!ceiling.current && data.rows.length)
          ceiling.current = cursorFor(data.rows[0])
        setResult({ key, data })
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted)
          setResult({
            key,
            error:
              reason instanceof Error
                ? reason.message
                : "Could not load history.",
          })
      })
    return () => controller.abort()
  }, [userId, mode, cursor, revision, key])
  const current = result?.key === key ? result : null
  const loading = !!userId && !current
  function reset(nextMode = mode) {
    ceiling.current = null
    setMode(nextMode)
    setCursors([null])
    setRevision((n) => n + 1)
  }
  return {
    mode,
    changeMode: (value: HistoryMode) => reset(value),
    page: cursors.length,
    data: current?.data ?? null,
    error: current?.error ?? null,
    loading,
    guest: !userId && auth.status !== "loading" && auth.status !== "error",
    authError: auth.status === "error",
    refresh: () => reset(),
    retry: () => setRevision((n) => n + 1),
    previous: () => {
      if (!loading)
        setCursors((value) => (value.length > 1 ? value.slice(0, -1) : value))
    },
    next: () => {
      if (!loading && current?.data?.hasMore && current.data.next)
        setCursors((value) => [...value, current.data!.next])
    },
  }
}
