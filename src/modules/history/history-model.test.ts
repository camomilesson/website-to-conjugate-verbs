import test from "node:test"
import assert from "node:assert/strict"
import {
  cursorCondition,
  cursorFor,
  historyPage,
  nonDefaultSettings,
  categoryLabel,
  personLabel,
} from "./history-model.ts"
import { fixturePage, historyFixtures } from "./history-fixtures.ts"
import { parseHistoryRows } from "../learning-data/data.ts"
const rows = historyFixtures()
void test("keyset pages retain timestamp ties and traverse every completed practice exactly once", () => {
  const seen: string[] = []
  let cursor = null as ReturnType<typeof cursorFor> | null
  for (let page = 0; page < 3; page++) {
    const result = fixturePage(rows, "all", cursor)
    assert.equal(result.rows.length, page === 2 ? 6 : 10)
    assert.equal(result.hasMore, page < 2)
    seen.push(...result.rows.map((row) => row.id))
    cursor = result.next
  }
  assert.deepEqual(
    seen,
    rows.map((row) => row.id),
  )
  assert.equal(new Set(seen).size, 26)
  assert.equal(historyPage([]).next, null)
})
void test("cursor preserves database microseconds and rejects filter injection", () => {
  const cursor = {
    id: rows[0].id,
    completedAt: "2026-11-06T12:00:00.123456+00:00",
  }
  assert.match(cursorCondition(cursor), /\.123456\+00:00/)
  assert.match(cursorCondition(cursor), /id.gt\./)
  assert.match(cursorCondition(cursor, true), /id.gte\./)
  assert.throws(() =>
    cursorCondition({ ...cursor, id: "anything),user_id.neq.secret" }),
  )
  assert.throws(() =>
    cursorCondition({ ...cursor, completedAt: "now),user_id.neq.secret" }),
  )
})
void test("mode pagination and anchored first page ignore newly completed entries until refresh", () => {
  const first = fixturePage(rows, "choice", null)
  assert.equal(first.rows.length, 8)
  assert.ok(first.rows.every((row) => row.mode === "choice"))
  assert.equal(first.hasMore, false)
  const newer = {
    ...rows[0],
    id: "30000000-0000-4000-8000-000000000099",
    completed_at: "2026-11-07T12:00:00.000Z",
  }
  assert.equal(
    fixturePage([newer, ...rows], "all", null, cursorFor(rows[0])).rows[0].id,
    rows[0].id,
  )
  assert.equal(fixturePage([newer, ...rows], "all", null).rows[0].id, newer.id)
})
void test("non-default settings use the saved baseline rather than current defaults", () => {
  assert.deepEqual(nonDefaultSettings(rows[0]), [])
  const changed = rows[1]
  assert.ok(nonDefaultSettings(changed)!.includes("7 requested questions"))
  assert.ok(nonDefaultSettings(changed)!.includes("Accents ignored"))
  assert.ok(nonDefaultSettings(changed)!.includes("Verbs: Selected"))
  const future = structuredClone(changed)
  future.defaults_version = "practice-2"
  future.configuration.defaults!.length = 7
  future.configuration.defaults!.accentPolicy = "relaxed"
  assert.ok(!nonDefaultSettings(future)!.includes("7 requested questions"))
  assert.ok(!nonDefaultSettings(future)!.includes("Accents ignored"))
  const choice = rows[2]
  assert.ok(
    !nonDefaultSettings(choice)!.some((value) => value.includes("Accents")),
  )
  assert.ok(nonDefaultSettings(rows[4])!.includes("2 eligible questions"))
})
void test("perfect tests have no example and labels disambiguate moods and persons", () => {
  assert.equal(rows[0].example_mistake, null)
  assert.equal(rows[1].example_mistake?.answers[0], "hablo")
  assert.equal(categoryLabel("subjunctive.present"), "Subjuntivo · Presente")
  assert.equal(personLabel("el"), "él / ella / usted")
  assert.equal(categoryLabel("legacy-category"), "legacy-category")
})

void test("history responses validate full records and preserve cursor precision and saved defaults", () => {
  assert.deepEqual(parseHistoryRows(rows), rows)
  assert.deepEqual(parseHistoryRows([]), [])
  const legacy = structuredClone(rows[0])
  delete legacy.configuration.defaults
  legacy.completed_at = "2026-11-06T12:00:00.123456+00:00"
  assert.deepEqual(nonDefaultSettings(parseHistoryRows([legacy])[0]), [])
  assert.equal(parseHistoryRows([legacy])[0].completed_at, legacy.completed_at)
  legacy.defaults_version = "future-defaults"
  assert.equal(nonDefaultSettings(parseHistoryRows([legacy])[0]), null)
})

void test("malformed history records fail with a recoverable message before rendering", () => {
  const base = rows[1]
  for (const value of [
    null,
    {},
    [null],
    [base, null],
    [{ ...base, id: "invalid" }],
    [{ ...base, completed_at: "yesterday" }],
    [{ ...base, correct: "1" }],
    [{ ...base, answered: 0 }],
    [{ ...base, correct: base.answered + 1 }],
    [{ ...base, mode: "choice" }],
    [{ ...base, dataset_version: null }],
    [{ ...base, configuration: null }],
    [{ ...base, configuration: { ...base.configuration, resolved: null } }],
    [{ ...base, configuration: { ...base.configuration, selections: {} } }],
    [{ ...base, configuration: { ...base.configuration, defaults: {} } }],
    [
      {
        ...base,
        configuration: {
          ...base.configuration,
          resolved: { ...base.configuration.resolved, persons: [null] },
        },
      },
    ],
    [
      {
        ...base,
        configuration: {
          ...base.configuration,
          resolved: { ...base.configuration.resolved, categories: ["unknown"] },
        },
      },
    ],
    [
      {
        ...base,
        configuration: {
          ...base.configuration,
          resolved: { ...base.configuration.resolved, length: 1 },
        },
      },
    ],
    [{ ...base, example_mistake: {} }],
    [
      {
        ...base,
        example_mistake: { ...base.example_mistake, answers: [null] },
      },
    ],
  ])
    assert.throws(() => parseHistoryRows(value), /Invalid history data.*Retry/)
})
