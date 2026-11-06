import { useEffect, useState } from "react"
import { loadCatalogue } from "../verb-catalogue/index.ts"
import type { Catalogue } from "../verb-catalogue/index.ts"
export function useCatalogue(attempt: number) {
  const [catalogue, setCatalogue] = useState<Catalogue | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    setError(null)
    void loadCatalogue(controller.signal)
      .then((value) => {
        if (!controller.signal.aborted) setCatalogue(value)
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted)
          setError(
            reason instanceof Error ? reason.message : "Could not load verbs.",
          )
      })
    return () => controller.abort()
  }, [attempt])
  return { catalogue, error }
}
