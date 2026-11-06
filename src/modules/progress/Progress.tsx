import { useProgressPreferences } from "./useProgressPreferences.ts"
import { useState } from "react"
import { Link } from "react-router"
import { readCounts, useAccountData } from "../learning-data/index.ts"
import { Heatmap } from "./Heatmap.tsx"
import { useCatalogue } from "./useCatalogue.ts"
export function Progress() {
  const { data, error, guest, authError, refresh } = useAccountData(readCounts)
  const view = useProgressPreferences()
  const [attempt, setAttempt] = useState(0)
  const { catalogue, error: catalogueError } = useCatalogue(attempt)
  const reload = () => {
    setAttempt((n) => n + 1)
    refresh()
  }
  return (
    <section className="page-section" aria-labelledby="progress-title">
      <p className="eyebrow">THE BIG PICTURE</p>
      <h1 id="progress-title">Progress</h1>
      <p className="page-intro">
        See what sticks. Find what needs another look.
      </p>
      {guest && (
        <p>
          <Link to="/settings">Sign in</Link> to save progress. Guest answers
          are not stored; these display choices stay in this browser.
        </p>
      )}
      {authError ? (
        <p role="alert">Account session unavailable. Retry from Settings.</p>
      ) : error || catalogueError || view.readError ? (
        <div role="alert">
          <p>{error ?? catalogueError ?? view.readError}</p>
          <button
            onClick={() => {
              reload()
              view.retryRead()
            }}
          >
            Retry progress
          </button>
          {view.readError && (
            <button onClick={view.restore}>Restore default view</button>
          )}
        </div>
      ) : (!guest && data === null) || !catalogue || !view.value ? (
        <p role="status">Loading progress…</p>
      ) : (
        <>
          {view.saving && (
            <p className="field-note" role="status">
              Saving display choices…
            </p>
          )}
          {view.saveError && (
            <div role="alert">
              <p>{view.saveError}</p>
              <button onClick={view.retrySave}>Retry saving view</button>
            </div>
          )}
          <Heatmap
            catalogue={catalogue}
            counts={data ?? []}
            onRefresh={reload}
            initialPreferences={view.value}
            onPreferencesChange={view.change}
          />
        </>
      )}
    </section>
  )
}
