import test from "node:test"
import assert from "node:assert/strict"
import { buildMatrix, selectRows, moodGroups, heatLevel } from "./matrix.ts"
import { parseCatalogue, CATEGORIES } from "@conjugadora/verb-catalogue"
import { readFileSync } from "node:fs"
import type { CountRow } from "../learning-data/index.ts"
const catalogue = parseCatalogue(
  JSON.parse(
    readFileSync(
      new URL("../../../public/data/catalogue.json", import.meta.url),
      "utf8",
    ),
  ) as unknown,
)
const counts: CountRow[] = [
  {
    verb_id: "hablar",
    category_id: "indicative.present",
    mode: "typing",
    accent_policy: "strict",
    correct: 1,
    answered: 1,
  },
  {
    verb_id: "hablar",
    category_id: "subjunctive.present",
    mode: "typing",
    accent_policy: "strict",
    correct: 1,
    answered: 9,
  },
  {
    verb_id: "hablar",
    category_id: "indicative.present",
    mode: "choice",
    accent_policy: "na",
    correct: 0,
    answered: 2,
  },
  {
    verb_id: "hablar",
    category_id: "indicative.present",
    mode: "typing",
    accent_policy: "relaxed",
    correct: 3,
    answered: 3,
  },
  {
    verb_id: "comer",
    category_id: "indicative.present",
    mode: "typing",
    accent_policy: "strict",
    correct: 0,
    answered: 2,
  },
]
void test("matrix includes every catalogue verb, sums persons/buckets and leaves unattempted cells empty", () => {
  const rows = buildMatrix(catalogue, counts, "all")
  assert.equal(rows.length, 100)
  const hablar = rows.find((row) => row.verb.id === "hablar")!
  assert.deepEqual(hablar.cells["indicative.present"], {
    correct: 4,
    answered: 6,
    percentage: 67,
  })
  assert.deepEqual(hablar.overall, { correct: 5, answered: 15, percentage: 33 })
  assert.equal(
    rows.find((row) => row.verb.id === "comer")!.overall.percentage,
    0,
  )
  assert.equal(
    rows.find((row) => row.verb.id === "vivir")!.overall.percentage,
    null,
  )
  assert.equal(hablar.cells["indicative.future"], undefined)
  assert.equal(
    heatLevel(rows.find((row) => row.verb.id === "vivir")!.overall),
    "none",
  )
})
void test("mode and accent filters remain separate and overall includes hidden categories", () => {
  for (const [filter, correct, answered] of [
    ["strict", 2, 10],
    ["relaxed", 3, 3],
    ["choice", 0, 2],
    ["typing", 5, 13],
  ] as const) {
    const hablar = buildMatrix(catalogue, counts, filter).find(
      (row) => row.verb.id === "hablar",
    )!
    assert.equal(hablar.overall.correct, correct)
    assert.equal(hablar.overall.answered, answered)
  }
  const row = buildMatrix(catalogue, counts, "strict")[0]
  assert.equal(row.cells["indicative.present"]?.percentage, 100)
  assert.equal(row.overall.percentage, 20)
})
void test("search matches names/meanings, sorting is deterministic and accuracy puts empty verbs last", () => {
  const rows = buildMatrix(catalogue, counts, "all")
  assert.deepEqual(
    selectRows(rows, "SPEAK", "name").map((row) => row.verb.id),
    ["hablar"],
  )
  assert.deepEqual(
    selectRows(rows, "  comer ", "name").map((row) => row.verb.id),
    ["comer"],
  )
  assert.equal(selectRows(rows, "", "accuracy")[0].verb.id, "hablar")
  assert.equal(selectRows(rows, "", "accuracy-asc")[0].verb.id, "comer")
  assert.equal(selectRows(rows, "", "attempts")[0].verb.id, "hablar")
  assert.equal(selectRows(rows, "not-a-verb", "name").length, 0)
  assert.equal(selectRows(rows, "", "name")[0].verb.id, "abrir")
  assert.equal(selectRows(rows, "", "name-desc")[0].verb.id, "volver")
})
void test("column groups track registry order and visible category spans", () => {
  assert.equal(
    moodGroups(CATEGORIES).reduce((sum, group) => sum + group.span, 0),
    16,
  )
  assert.deepEqual(moodGroups(CATEGORIES.filter((c) => c.basic)), [
    { name: "Indicativo", span: 6 },
  ])
  assert.deepEqual(moodGroups([]), [])
})
