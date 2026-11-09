export interface SaveState {
  pending: number
  saved: number
  saving: boolean
  error: string | null
}
interface SaveRequest {
  send: () => Promise<unknown>
}
/** Serial, memory-only saves. A failed head stays in place for an identical retry. */
export function createSaveQueue() {
  const requests: SaveRequest[] = []
  let saved = 0
  let saving = false
  let error: string | null = null
  let listener: ((state: SaveState) => void) | null = null
  const snapshot = (): SaveState => ({
    pending: requests.length,
    saved,
    saving,
    error,
  })
  const notify = () => listener?.(snapshot())
  const subscribed = () => listener !== null
  async function drain(retryFailed = false) {
    if (!listener || saving || (error && !retryFailed) || !requests.length)
      return
    saving = true
    notify()
    while (subscribed() && requests.length) {
      try {
        await requests[0].send()
        requests.shift()
        saved++
        error = null
      } catch (reason: unknown) {
        error =
          reason instanceof Error
            ? reason.message
            : "Could not save your answer. Retry."
        break
      }
      notify()
    }
    saving = false
    notify()
  }
  return {
    snapshot,
    subscribe(onChange: (state: SaveState) => void) {
      listener = onChange
      notify()
      void drain()
      return () => {
        if (listener === onChange) listener = null
      }
    },
    enqueue(request: SaveRequest) {
      requests.push(request)
      notify()
      void drain()
    },
    retry() {
      if (saving) return
      void drain(true)
    },
  }
}
