import { useEffect, useState } from "react"
import { loadCatalogue } from "@conjugadora/verb-catalogue"
import { HistoryControls, HistoryList } from "./HistoryList.tsx"
import { fixturePage, historyFixtures } from "./history-fixtures.ts"
import type { HistoryCursor, HistoryMode } from "./history-model.ts"
export default function HistoryDemo() {
  const [verbs, setVerbs] = useState<string[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<HistoryMode>("all")
  const [empty, setEmpty] = useState(false)
  const [cursors, setCursors] = useState<(HistoryCursor | null)[]>([null])
  useEffect(() => {
    const controller = new AbortController()
    void loadCatalogue(controller.signal)
      .then((catalogue) => {
        if (!controller.signal.aborted)
          setVerbs(catalogue.verbs.map((verb) => verb.id))
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted)
          setError(
            reason instanceof Error
              ? reason.message
              : "Could not load fixture verbs.",
          )
      })
    return () => controller.abort()
  }, [])
  const page = fixturePage(
    empty ? [] : historyFixtures(verbs ?? []),
    mode,
    cursors[cursors.length - 1],
  )
  return (
    <section className="page-section">
      <h1>History · isolated fixture demo</h1>
      <p>
        Development-only synthetic completed practices. No account or database
        writes.
      </p>
      <label>
        <input
          type="checkbox"
          checked={empty}
          onChange={(event) => {
            setEmpty(event.target.checked)
            setCursors([null])
          }}
        />{" "}
        Empty account
      </label>
      <HistoryControls
        mode={mode}
        onMode={(value) => {
          setMode(value)
          setCursors([null])
        }}
      />
      {error ? (
        <p role="alert">{error}</p>
      ) : !verbs ? (
        <p>Loading demo…</p>
      ) : (
        <HistoryList
          data={page}
          page={cursors.length}
          onPrevious={() =>
            setCursors((value) =>
              value.length > 1 ? value.slice(0, -1) : value,
            )
          }
          onNext={() => {
            if (page.hasMore && page.next)
              setCursors((value) => [...value, page.next])
          }}
        />
      )}
    </section>
  )
}
