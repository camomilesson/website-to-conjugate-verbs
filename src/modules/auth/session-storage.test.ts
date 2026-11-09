import assert from "node:assert/strict"
import { test } from "node:test"
import { createClient } from "@supabase/supabase-js"
import { createSessionStorage } from "./session-storage.ts"
function store() {
  const values = new Map<string, string>()
  return {
    values,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value)
    },
    removeItem: (key: string) => {
      values.delete(key)
    },
  }
}
const url = "https://test.supabase.co"
const legacy = "sb-test-auth-token"
await test("new sign-ins default to tab storage; reload retains it but a separate tab does not", () => {
  const local = store(),
    tab = store()
  const first = createSessionStorage(url, local, tab, () => "one")
  assert.equal(first.persistent, false)
  first.storage.setItem(first.storageKey, "session-token")
  assert.equal(local.values.size, 0)
  // Another tab choosing persistence must not upgrade this tab on reload.
  local.setItem(legacy, "other-tab-token")
  const reload = createSessionStorage(url, local, tab, () => "unused")
  assert.equal(reload.storage.getItem(reload.storageKey), "session-token")
  local.removeItem(legacy)
  const other = createSessionStorage(url, local, store(), () => "two")
  assert.notEqual(first.storageKey, other.storageKey)
  assert.equal(other.storage.getItem(other.storageKey), null)
})
await test("choice survives OAuth reload, pending redirect is consumed once, legacy is not recorded as consent", () => {
  const local = store(),
    tab = store()
  local.setItem(legacy, "legacy-token")
  const existing = createSessionStorage(url, local, tab, () => "one")
  assert.equal(existing.persistent, true)
  assert.equal(tab.getItem(`${legacy}:storage`), null)
  existing.prepareSignIn(false)
  const session = createSessionStorage(url, local, tab, () => "unused")
  assert.equal(session.persistent, false)
  assert.equal(session.consumeSignIn(), true)
  assert.equal(session.consumeSignIn(), false)
  assert.equal(session.storage.getItem(session.storageKey), null)
  assert.equal(local.getItem(legacy), "legacy-token")
  session.prepareSignIn(true)
  const persistent = createSessionStorage(url, local, tab, () => "unused")
  assert.equal(persistent.storage, local)
  assert.equal(persistent.storageKey, legacy)
})
await test("blocked storage prevents a pending redirect instead of silently switching persistence", () => {
  const local = store(),
    tab = store()
  const adapter = createSessionStorage(url, local, tab, () => "one")
  local.setItem = () => {
    throw new Error("blocked")
  }
  assert.throws(() => adapter.prepareSignIn(true), /blocked/)
  assert.equal(adapter.consumeSignIn(), false)
})
for (const remember of [false, true]) {
  await test(`SDK PKCE exchange, reload, refresh and sign-out use ${remember ? "persistent" : "session"} storage`, async () => {
    const local = store(),
      tab = store()
    createSessionStorage(url, local, tab, () => "one").prepareSignIn(remember)
    const adapter = createSessionStorage(url, local, tab, () => "unused")
    assert.equal(adapter.consumeSignIn(), true)
    let exchanges = 0
    const options = {
      auth: {
        storage: adapter.storage,
        storageKey: adapter.storageKey,
        flowType: "pkce" as const,
        persistSession: true,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        fetch: (input: RequestInfo | URL) => {
          const path = input instanceof Request ? input.url : input.toString()
          if (path.includes("/logout"))
            return Promise.resolve(new Response(null, { status: 204 }))
          exchanges++
          return Promise.resolve(
            new Response(
              JSON.stringify({
                access_token: `synthetic-token-${exchanges}`,
                refresh_token: "synthetic-refresh",
                token_type: "bearer",
                expires_in: 3600,
                user: {
                  id: "test-owner",
                  aud: "authenticated",
                  role: "authenticated",
                  email: "test@example.invalid",
                  app_metadata: {},
                  user_metadata: {},
                  created_at: "2026-11-09T00:00:00Z",
                },
              }),
              { headers: { "Content-Type": "application/json" } },
            ),
          )
        },
      },
    }
    const client = createClient(url, "sb_publishable_test", options)
    const started = await client.auth.signInWithOAuth({
      provider: "google",
      options: {
        skipBrowserRedirect: true,
        redirectTo: "https://app.example/settings",
      },
    })
    assert.equal(started.error, null)
    assert.ok(adapter.storage.getItem(`${adapter.storageKey}-code-verifier`))
    const exchanged = await client.auth.exchangeCodeForSession("synthetic-code")
    assert.equal(exchanged.error, null)
    assert.equal(
      adapter.storage.getItem(`${adapter.storageKey}-code-verifier`),
      null,
    )
    assert.ok(adapter.storage.getItem(adapter.storageKey))
    assert.equal((remember ? tab : local).getItem(adapter.storageKey), null)
    const reloaded = createClient(url, "sb_publishable_test", options)
    assert.equal(
      (await reloaded.auth.getSession()).data.session?.user.id,
      "test-owner",
    )
    assert.equal((await reloaded.auth.refreshSession()).error, null)
    assert.equal(exchanges, 2)
    assert.equal((await reloaded.auth.signOut({ scope: "local" })).error, null)
    assert.equal(adapter.storage.getItem(adapter.storageKey), null)
  })
}
