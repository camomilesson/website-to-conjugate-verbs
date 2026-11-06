import { CATEGORIES, PERSONS } from "../verb-catalogue/index.ts"
import type { PersonId } from "../verb-catalogue/index.ts"
import { Link } from "react-router"
import { readHistory } from "../learning-data/index.ts"
import { useAccountData } from "../learning-data/useAccountData.ts"
export function History() {
  const { data, error, guest, authError, refresh } = useAccountData(readHistory)
  return (
    <section className="page-section" aria-labelledby="history-title">
      <h1 id="history-title">History</h1>
      {guest ? (
        <p>
          <Link to="/settings">Sign in</Link> to save completed practices. Guest
          results are not stored.
        </p>
      ) : authError ? (
        <p role="alert">Account session unavailable. Retry from Settings.</p>
      ) : error ? (
        <div role="alert">
          <p>{error}</p>
          <button onClick={refresh}>Retry history</button>
        </div>
      ) : data === null ? (
        <p role="status">Loading history…</p>
      ) : (
        <>
          <p>
            Latest 50 completed practices. Unfinished practices have no history
            entry.
          </p>
          <button onClick={refresh}>Refresh history</button>
          {!data.length ? (
            <p>No completed practices yet.</p>
          ) : (
            <ol className="mistake-list">
              {data.map((row) => {
                const cfg = row.configuration.resolved
                const sets = row.configuration.selections
                const overrides = [
                  cfg.mode !== "typing" ? "Multiple choice" : null,
                  cfg.length !== 20
                    ? `${cfg.length} requested ${cfg.length === 1 ? "question" : "questions"}`
                    : null,
                  row.answered !== cfg.length
                    ? `${row.answered} eligible questions`
                    : null,
                  cfg.mode === "typing" && cfg.accentPolicy !== "strict"
                    ? "Accents ignored"
                    : null,
                  sets.personSet !== "all"
                    ? `Persons: ${cfg.persons.join(", ")}`
                    : null,
                ].filter(Boolean)
                return (
                  <li key={row.id}>
                    <p>
                      <time dateTime={row.completed_at}>
                        {new Date(row.completed_at).toLocaleString()}
                      </time>{" "}
                      · {row.mode === "choice" ? "Multiple choice" : "Typing"} ·{" "}
                      <strong>
                        {Math.round((row.correct / row.answered) * 100)}%
                      </strong>{" "}
                      ({row.correct}/{row.answered})
                    </p>
                    <p>
                      Verbs: {sets.verbSet} ({cfg.verbIds.length}) · Tenses:{" "}
                      {sets.tenseSet} ({cfg.categories.length})
                    </p>
                    <p>
                      Non-default settings:{" "}
                      {overrides.join(" · ") ||
                        "None beyond the verb/tense sets shown above."}
                    </p>
                    {row.example_mistake ? (
                      <p>
                        Example mistake:{" "}
                        <span lang="es">{row.example_mistake.verbId}</span> ·{" "}
                        {CATEGORIES.find(
                          (category) =>
                            category.id === row.example_mistake?.category,
                        )?.label ?? row.example_mistake.category}{" "}
                        ·{" "}
                        {PERSONS[row.example_mistake.person as PersonId] ??
                          row.example_mistake.person}
                        : “{row.example_mistake.text}”. Accepted:{" "}
                        <span lang="es">
                          {row.example_mistake.answers.join(" / ")}
                        </span>
                        .
                      </p>
                    ) : (
                      <p>No mistakes.</p>
                    )}
                    <details>
                      <summary>Effective selections</summary>
                      <p>Verbs: {cfg.verbIds.join(", ")}</p>
                      <p>Categories: {cfg.categories.join(", ")}</p>
                      <p>Persons: {cfg.persons.join(", ")}</p>
                      <p>
                        Dataset: {row.dataset_version} · Defaults:{" "}
                        {row.defaults_version}
                      </p>
                    </details>
                  </li>
                )
              })}
            </ol>
          )}
        </>
      )}
    </section>
  )
}
