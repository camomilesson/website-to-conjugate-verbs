import { useState } from "react"
import { Link } from "react-router"
import { readCounts, totals } from "../learning-data/index.ts"
import { useAccountData } from "../learning-data/useAccountData.ts"
import { CATEGORIES } from "../verb-catalogue/index.ts"
export function Progress() {
  const { data, error, guest, authError, refresh } = useAccountData(readCounts)
  const [filter, setFilter] = useState("all")
  const rows = (data ?? []).filter(
    (row) =>
      filter === "all" ||
      (filter === "choice"
        ? row.mode === "choice"
        : row.mode === "typing" && row.accent_policy === filter),
  )
  const score = totals(rows)
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
      ) : error ? (
        <div role="alert">
          <p>{error}</p>
          <button onClick={refresh}>Retry progress</button>
        </div>
      ) : data === null ? (
        <p role="status">Loading progress…</p>
      ) : (
        <>
          <p>
            All acknowledged answers count, including answers from unfinished
            practices.
          </p>
          <label>
            Answer mode{" "}
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            >
              <option value="all">Combined</option>
              <option value="choice">Multiple choice</option>
              <option value="strict">Typing · accents required</option>
              <option value="relaxed">Typing · accents ignored</option>
            </select>
          </label>{" "}
          <button onClick={refresh}>Refresh progress</button>
          <p>
            {score.percentage === null
              ? "No answers yet."
              : `${score.percentage}% · ${score.correct} correct / ${score.answered} answered`}
          </p>
          {!!rows.length && (
            <div style={{ overflowX: "auto" }}>
              <table>
                <caption>Accuracy by verb, category, and answer mode</caption>
                <thead>
                  <tr>
                    <th>Verb</th>
                    <th>Category</th>
                    <th>Mode</th>
                    <th>Correct / answered</th>
                    <th>Accuracy</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={`${row.verb_id}:${row.category_id}:${row.mode}:${row.accent_policy}`}
                    >
                      <th scope="row" lang="es">
                        {row.verb_id}
                      </th>
                      <td>
                        {CATEGORIES.find((c) => c.id === row.category_id)
                          ?.label ?? row.category_id}
                      </td>
                      <td>
                        {row.mode === "choice"
                          ? "Choice"
                          : `Typing · ${row.accent_policy}`}
                      </td>
                      <td>
                        {row.correct} / {row.answered}
                      </td>
                      <td>{totals([row]).percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  )
}
