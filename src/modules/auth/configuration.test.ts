import assert from "node:assert/strict"
import { test } from "node:test"
import { authConfiguration } from "./configuration.ts"
await test("missing account setup leaves guest mode enabled", () => {
  assert.equal(authConfiguration(undefined, undefined), null)
  assert.equal(authConfiguration("", ""), null)
})
await test("only browser publishable keys and secure project URLs are accepted", () => {
  assert.deepEqual(
    authConfiguration("https://example.supabase.co/", "sb_publishable_test"),
    { url: "https://example.supabase.co", key: "sb_publishable_test" },
  )
  for (const key of ["sb_secret_no", "service_role", "eyJlegacy", ""])
    assert.throws(() => authConfiguration("https://example.supabase.co", key))
  assert.throws(() =>
    authConfiguration("http://remote.example", "sb_publishable_test"),
  )
  assert.throws(() => authConfiguration("", "sb_publishable_test"))
  assert.ok(authConfiguration("http://127.0.0.1:54321", "sb_publishable_test"))
})
