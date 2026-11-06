import { useEffect, useRef } from "react"
import {
  categoryLabel,
  nonDefaultSettings,
  personLabel,
  setLabel,
} from "./history-model.ts"
import type { HistoryMode, HistoryPage } from "./history-model.ts"
import "./history.css"
export function HistoryControls({
  mode,
  onMode,
  onRefresh,
  disabled = false,
}: {
  mode: HistoryMode
  onMode: (mode: HistoryMode) => void
  onRefresh?: () => void
  disabled?: boolean
}) {
  return (
    <div className="history-controls">
      <label>
        Answer mode
        <select
          value={mode}
          disabled={disabled}
          onChange={(event) => onMode(event.target.value as HistoryMode)}
        >
          <option value="all">All modes</option>
          <option value="typing">Typing</option>
          <option value="choice">Multiple choice</option>
        </select>
      </label>
      {onRefresh && (
        <button disabled={disabled} onClick={onRefresh}>
          Refresh history
        </button>
      )}
    </div>
  )
}
export function HistoryList({
  data,
  page,
  onPrevious,
  onNext,
}: {
  data: HistoryPage
  page: number
  onPrevious: () => void
  onNext: () => void
}) {
  const pageStatus = useRef<HTMLParagraphElement>(null)
  useEffect(() => {
    pageStatus.current?.focus()
  }, [page])
  return (
    <>
      <p className="field-note">
        Newest first · Dates and times are local to your device. Only completed
        practices appear here.
      </p>
      <p role="status" ref={pageStatus} tabIndex={-1}>
        Page {page} · {data.rows.length}{" "}
        {data.rows.length === 1 ? "practice" : "practices"}
      </p>
      {!data.rows.length ? (
        <p>No completed practices for this selection.</p>
      ) : (
        <ol className="history-list" start={(page - 1) * 10 + 1}>
          {data.rows.map((row) => {
            const cfg = row.configuration.resolved
            const sets = row.configuration.selections
            const changes = nonDefaultSettings(row)
            const mistake = row.example_mistake
            return (
              <li key={row.id}>
                <div className="history-entry-heading">
                  <time dateTime={row.completed_at}>
                    {new Intl.DateTimeFormat(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(row.completed_at))}
                  </time>
                  <span>
                    {row.mode === "typing" ? "Typing" : "Multiple choice"}
                  </span>
                  <strong className="history-score">
                    {Math.round((row.correct / row.answered) * 100)}%
                  </strong>
                  <span>
                    {row.correct} / {row.answered} correct
                  </span>
                </div>
                <p>
                  Verbs: <strong>{setLabel(sets.verbSet)}</strong> (
                  {cfg.verbIds.length}) · Tenses:{" "}
                  <strong>{setLabel(sets.tenseSet)}</strong> (
                  {cfg.categories.length})
                </p>
                <p className="history-settings">
                  <span>Non-default settings:</span>{" "}
                  {changes === null
                    ? "Default comparison unavailable for this saved version."
                    : changes.length
                      ? changes.join(" · ")
                      : "None."}
                </p>
                {mistake ? (
                  <div className="history-mistake">
                    <p>
                      Example mistake ·{" "}
                      <span lang="es">
                        <strong>{mistake.verbId}</strong> ·{" "}
                        {categoryLabel(mistake.category)} ·{" "}
                        {personLabel(mistake.person)}
                      </span>
                    </p>
                    <p>
                      Your answer: <span lang="es">{mistake.text}</span>
                    </p>
                    <p>
                      Accepted:{" "}
                      <span lang="es">{mistake.answers.join(" / ")}</span>
                    </p>
                  </div>
                ) : (
                  <p className="history-perfect">No mistakes.</p>
                )}
                <details>
                  <summary>Practice details</summary>
                  <dl className="history-details">
                    <dt>Verbs · {setLabel(sets.verbSet)}</dt>
                    <dd lang="es">{cfg.verbIds.join(", ")}</dd>
                    <dt>Tenses and moods · {setLabel(sets.tenseSet)}</dt>
                    <dd>
                      <ul>
                        {cfg.categories.map((category) => (
                          <li key={category} lang="es">
                            {categoryLabel(category)}
                          </li>
                        ))}
                      </ul>
                    </dd>
                    <dt>Persons</dt>
                    <dd lang="es">{cfg.persons.map(personLabel).join(", ")}</dd>
                    <dt>Question count</dt>
                    <dd>
                      {cfg.length} requested · {row.answered} answered
                    </dd>
                    <dt>Accent matching</dt>
                    <dd>
                      {row.mode === "choice"
                        ? "Not applicable to multiple choice"
                        : cfg.accentPolicy === "strict"
                          ? "Accents required"
                          : "Accents ignored"}
                    </dd>
                  </dl>
                  <p className="field-note">
                    History keeps one example mistake. The full mistake review
                    is available only at the end of the original practice.
                  </p>
                </details>
              </li>
            )
          })}
        </ol>
      )}
      <nav className="history-pagination" aria-label="History pages">
        <button disabled={page === 1} onClick={onPrevious}>
          Previous page
        </button>
        <span>Page {page}</span>
        <button disabled={!data.hasMore} onClick={onNext}>
          Next page
        </button>
      </nav>
    </>
  )
}
