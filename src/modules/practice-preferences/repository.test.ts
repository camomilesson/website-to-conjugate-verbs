import assert from "node:assert/strict"
import { test } from "node:test"
import { parseCatalogue } from "@conjugadora/verb-catalogue"
import {
  defaultPreferences,
  loadAccountPreferences,
  preferencePayload,
  saveAccountPreferences,
} from "./index.ts"
import type { PreferenceRepository } from "./index.ts"
const catalogue = parseCatalogue({
  schemaVersion: 1,
  datasetVersion: "test",
  verbs: [
    { id: "hablar", infinitive: "hablar", meaning: "to speak", common: true },
  ],
})
await test("new accounts get defaults and existing account rows take precedence", async () => {
  const defaults = defaultPreferences(catalogue)
  const account = { ...defaults, length: "8", accentPolicy: "relaxed" as const }
  const blank: PreferenceRepository = {
    read: () => Promise.resolve(null),
    write: () => Promise.resolve(),
  }
  assert.deepEqual(
    (await loadAccountPreferences(blank, catalogue)).preferences,
    defaults,
  )
  assert.deepEqual(
    (
      await loadAccountPreferences(
        { ...blank, read: () => Promise.resolve(preferencePayload(account)) },
        catalogue,
      )
    ).preferences,
    account,
  )
})
await test("account fetch failure rejects instead of importing guest preferences", async () => {
  const failure = new Error("RLS or connection failure")
  const repository = {
    read: () => Promise.reject(failure),
    write: () => Promise.reject(failure),
  }
  await assert.rejects(loadAccountPreferences(repository, catalogue), failure)
  assert.equal(
    await saveAccountPreferences(repository, defaultPreferences(catalogue)),
    failure.message,
  )
})
await test("account saves serialize only preferences and reject invalid drafts", async () => {
  const writes: unknown[] = []
  const repository: PreferenceRepository = {
    read: () => Promise.resolve(null),
    write: (payload) => {
      writes.push(payload)
      return Promise.resolve()
    },
  }
  const value = { ...defaultPreferences(catalogue), answers: ["never upload"] }
  assert.equal(await saveAccountPreferences(repository, value), null)
  assert.equal(JSON.stringify(writes).includes("answers"), false)
  assert.ok(await saveAccountPreferences(repository, { ...value, verbIds: [] }))
  assert.equal(writes.length, 1)
})
