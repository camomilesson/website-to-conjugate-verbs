import { useEffect, useState } from "react"
import { loadCatalogue } from "@conjugadora/verb-catalogue"
import type { Catalogue } from "@conjugadora/verb-catalogue"
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
