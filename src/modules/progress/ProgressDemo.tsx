import { useMemo, useState } from "react"
import type { CountRow } from "../learning-data/index.ts"
import { CATEGORIES } from "../verb-catalogue/index.ts"
import { Heatmap } from "./Heatmap.tsx"
import { useCatalogue } from "./useCatalogue.ts"
export default function ProgressDemo() {
  const { catalogue, error } = useCatalogue(0)
  const [empty, setEmpty] = useState(false)
  const counts = useMemo<CountRow[]>(
    () =>
      catalogue
        ? catalogue.verbs.flatMap((verb, i) =>
            CATEGORIES.flatMap((category, j) =>
              i % 9 === 8
                ? []
                : (["strict", "relaxed", "na"] as const).map((policy, k) => ({
                    verb_id: verb.id,
                    category_id: category.id,
                    mode:
                      policy === "na"
                        ? ("choice" as const)
                        : ("typing" as const),
                    accent_policy: policy,
                    answered: 20 + k * 10,
                    correct: Math.round(
                      ((20 + k * 10) * ((i * 7 + j * 13 + k * 9) % 101)) / 100,
                    ),
                  })),
            ),
          )
        : [],
    [catalogue],
  )
  return (
    <section className="page-section">
      <h1>Progress · isolated fixture demo</h1>
      <p>Development-only synthetic counts. No account or database writes.</p>
      <label className="progress-demo-switch">
        <input
          type="checkbox"
          checked={empty}
          onChange={(event) => setEmpty(event.target.checked)}
        />
        Empty account
      </label>
      {error ? (
        <p role="alert">{error}</p>
      ) : !catalogue ? (
        <p>Loading verbs…</p>
      ) : (
        <Heatmap catalogue={catalogue} counts={empty ? [] : counts} />
      )}
    </section>
  )
}
