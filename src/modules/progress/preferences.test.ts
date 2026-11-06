import assert from "node:assert/strict"
import { test } from "node:test"
import {
  defaultProgressPreferences,
  parseProgressPreferences,
  preferenceWriter,
} from "./preferences.ts"

await test("display preferences validate columns and normalize a detached payload", () => {
  const input = {
    ...defaultProgressPreferences(),
    custom: ["subjunctive.present", "indicative.present", "indicative.present"],
    ignored: "temporary",
  }
  const parsed = parseProgressPreferences(input)
  assert.deepEqual(parsed.custom, ["indicative.present", "subjunctive.present"])
  assert.equal("ignored" in parsed, false)
  input.custom.length = 0
  assert.equal(parsed.custom.length, 2)
  for (const custom of [[null], ["unknown"], "indicative.present"]) {
    assert.throws(() =>
      parseProgressPreferences({ ...defaultProgressPreferences(), custom }),
    )
  }
  assert.deepEqual(
    parseProgressPreferences({ ...defaultProgressPreferences(), custom: [] })
      .custom,
    [],
  )
})

await test("queued saves preserve order, snapshot values and recover after failure", async () => {
  let release!: () => void
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  const seen: string[] = []
  const writer = preferenceWriter(async (value) => {
    seen.push(value.view)
    if (seen.length === 1) {
      await gate
      throw new Error("offline")
    }
  })
  const first = writer.save(defaultProgressPreferences())
  const rejection = assert.rejects(first, /offline/)
  const next = { ...defaultProgressPreferences(), view: "advanced" as const }
  const second = writer.save(next)
  next.custom.length = 0
  await new Promise<void>((resolve) => setImmediate(resolve))
  assert.deepEqual(seen, ["basic"])
  release()
  await rejection
  await second
  await writer.settled()
  assert.deepEqual(seen, ["basic", "advanced"])
})
