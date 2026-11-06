import { useState } from "react"
import { Link } from "react-router"
import { readCounts, useAccountData } from "../learning-data/index.ts"
import { Heatmap } from "./Heatmap.tsx"
import { useCatalogue } from "./useCatalogue.ts"
export function Progress() {
  const { data, error, guest, authError, refresh } = useAccountData(readCounts)
  const [attempt, setAttempt] = useState(0)
  const { catalogue, error: catalogueError } = useCatalogue(attempt)
  const reload = () => {
    setAttempt((n) => n + 1)
    refresh()
  }
  return (
    <section className="page-section" aria-labelledby="progress-title">
      <h1 id="progress-title">Progress</h1>
      {guest ? (
        <p>
          <Link to="/settings">Sign in</Link> to save progress. Guest answers
          are not stored.
        </p>
      ) : authError ? (
        <p role="alert">Account session unavailable. Retry from Settings.</p>
      ) : error || catalogueError ? (
        <div role="alert">
          <p>{error ?? catalogueError}</p>
          <button onClick={reload}>Retry progress</button>
        </div>
      ) : data === null || !catalogue ? (
        <p role="status">Loading progress…</p>
      ) : (
        <Heatmap catalogue={catalogue} counts={data} onRefresh={reload} />
      )}
    </section>
  )
}
