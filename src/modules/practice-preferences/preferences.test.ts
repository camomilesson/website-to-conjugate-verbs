import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import { parseCatalogue } from "@conjugadora/verb-catalogue"
import {
  PREFERENCE_KEY,
  defaultPreferences,
  restorePreferences,
  readPreferences,
  savePreferences,
  validPreferences,
} from "./index.ts"
import type { PracticePreferences, PreferenceStorage } from "./index.ts"
const data: unknown = JSON.parse(
  readFileSync(
    new URL("../../../public/data/catalogue.json", import.meta.url),
    "utf8",
  ),
)
const catalogue = parseCatalogue(data)
const defaults = defaultPreferences(catalogue)
function stored(preferences: unknown) {
  return JSON.stringify({ schemaVersion: 1, preferences })
}
function memoryStorage() {
  const values = new Map<string, string>()
  const storage: PreferenceStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value)
    },
  }
  return { storage, values }
}
const custom: PracticePreferences = {
  ...defaults,
  mode: "choice",
  length: "7",
  accentPolicy: "relaxed",
  verbSet: "select",
  verbIds: ["tener"],
  tenseSet: "select",
  categories: ["indicative.future"],
  personSet: "select",
  persons: ["yo", "tu"],
}

await test("first visit restores approved defaults without writing storage", () => {
  const { storage, values } = memoryStorage()
  const result = readPreferences(catalogue, () => storage)
  assert.deepEqual(result.preferences, defaults)
  assert.equal(result.notice, null)
  assert.equal(values.size, 0)
  assert.equal(defaults.mode, "typing")
  assert.equal(defaults.length, "20")
  assert.equal(defaults.categories.length, 6)
  assert.equal(defaults.persons.length, 6)
})
await test("explicit save round-trips selections and hidden typing accent preference", () => {
  const { storage } = memoryStorage()
  assert.equal(
    savePreferences(custom, () => storage),
    null,
  )
  assert.deepEqual(
    readPreferences(catalogue, () => storage),
    { preferences: custom, notice: null },
  )
  const newer = { ...custom, mode: "typing" as const, length: "3" }
  assert.equal(
    savePreferences(newer, () => storage),
    null,
  )
  assert.deepEqual(readPreferences(catalogue, () => storage).preferences, newer)
})
await test("unsaved drafts do not alter defaults and saved data is a detached snapshot", () => {
  const { storage } = memoryStorage()
  const draft = structuredClone(custom)
  savePreferences(draft, () => storage)
  draft.verbIds.push("ser")
  draft.length = "11"
  assert.deepEqual(
    readPreferences(catalogue, () => storage).preferences,
    custom,
  )
  const activeSnapshot = structuredClone(custom)
  savePreferences({ ...custom, persons: ["nosotros"] }, () => storage)
  assert.deepEqual(activeSnapshot, custom)
})
await test("corrupt or unsupported storage uses defaults and explains the fallback", () => {
  for (const raw of [
    "{broken",
    "null",
    "[]",
    JSON.stringify({ schemaVersion: 99, preferences: custom }),
  ]) {
    const result = restorePreferences(raw, catalogue)
    assert.deepEqual(result.preferences, defaults)
    assert.ok(result.notice)
  }
  const broken = restorePreferences(
    stored({
      ...custom,
      mode: "other",
      length: "1.5",
      accentPolicy: false,
      persons: [],
    }),
    catalogue,
  )
  assert.equal(broken.preferences.mode, "typing")
  assert.equal(broken.preferences.length, "20")
  assert.equal(broken.preferences.accentPolicy, "strict")
  assert.equal(broken.preferences.persons.length, 6)
  assert.ok(broken.notice)
})
await test("obsolete custom IDs are filtered, deduplicated, or replaced with valid defaults", () => {
  const result = restorePreferences(
    stored({
      ...custom,
      verbIds: ["tener", "removed", "tener"],
      categories: ["indicative.future", "retired"],
      persons: ["tu", "vos"],
    }),
    catalogue,
  )
  assert.deepEqual(result.preferences.verbIds, ["tener"])
  assert.deepEqual(result.preferences.categories, ["indicative.future"])
  assert.deepEqual(result.preferences.persons, ["tu"])
  assert.ok(result.notice)
  const empty = restorePreferences(
    stored({
      ...custom,
      verbIds: ["removed"],
      categories: ["retired"],
      persons: [],
    }),
    catalogue,
  )
  assert.deepEqual(empty.preferences.verbIds, defaults.verbIds)
  assert.deepEqual(empty.preferences.categories, defaults.categories)
  assert.equal(validPreferences(empty.preferences), true)
  const impossible = restorePreferences(
    stored({
      ...custom,
      categories: ["imperative.affirmative"],
      persons: ["yo"],
    }),
    catalogue,
  )
  assert.equal(impossible.preferences.personSet, "all")
  assert.ok(impossible.notice)
})
await test("built-in sets follow current catalogue coverage while custom selections remain exact", () => {
  const expanded = {
    ...catalogue,
    verbs: [
      ...catalogue.verbs,
      { id: "hacer", infinitive: "hacer", meaning: "to do" },
    ],
  }
  assert.equal(
    restorePreferences(stored(defaults), expanded).preferences.verbIds.length,
    101,
  )
  assert.deepEqual(
    restorePreferences(stored(custom), expanded).preferences.verbIds,
    ["tener"],
  )
  const common = restorePreferences(
    stored({ ...defaults, verbSet: "common", tenseSet: "all" }),
    catalogue,
  ).preferences
  assert.equal(common.verbIds.length, 25)
  assert.equal(common.categories.length, 16)
  assert.equal(
    restorePreferences(stored({ ...defaults, tenseSet: "advanced" }), catalogue)
      .preferences.categories.length,
    10,
  )
})
await test("read/write storage failures are reported without blocking guest practice", () => {
  const blocked = () => {
    throw new Error("Storage denied")
  }
  assert.ok(readPreferences(catalogue, blocked).notice)
  assert.ok(savePreferences(custom, blocked))
  const { storage, values } = memoryStorage()
  assert.ok(savePreferences({ ...custom, length: "0" }, () => storage))
  assert.ok(savePreferences({ ...custom, verbIds: [] }, () => storage))
  assert.equal(values.size, 0)
})
await test("only preference fields are stored, never question queues or results", () => {
  const { storage, values } = memoryStorage()
  const extra = {
    ...custom,
    questions: ["secret answer"],
    results: [1],
    currentIndex: 2,
  }
  savePreferences(extra, () => storage)
  const raw = values.get(PREFERENCE_KEY)
  assert.ok(raw)
  assert.equal(raw.includes("questions"), false)
  assert.equal(raw.includes("results"), false)
  assert.equal(raw.includes("currentIndex"), false)
})
