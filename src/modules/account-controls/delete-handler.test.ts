import test from "node:test"
import assert from "node:assert/strict"
import { createDeleteHandler } from "../../../supabase/functions/_shared/delete-handler.ts"
const origin = "https://conjugadora.vercel.app"
function request(
  body: unknown = { confirmation: "DELETE", expectedUserId: "owner" },
  token = "owner-token",
  from = origin,
) {
  return new Request("https://fixture.invalid/delete-account", {
    method: "POST",
    headers: {
      origin: from,
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  })
}
void test("delete endpoint derives target from remotely verified user, never a supplied victim ID", async () => {
  const deleted: string[] = []
  const handler = createDeleteHandler({
    origins: [origin],
    verifyUser: (token) =>
      Promise.resolve(token === "owner-token" ? { id: "owner" } : null),
    deleteUser: (id) => {
      deleted.push(id)
      return Promise.resolve()
    },
  })
  assert.equal(
    (
      await handler(
        request({ confirmation: "DELETE", expectedUserId: "victim" }),
      )
    ).status,
    409,
  )
  assert.deepEqual(deleted, [])
  assert.equal(
    (
      await handler(
        request({
          confirmation: "DELETE",
          expectedUserId: "owner",
          userId: "victim",
        }),
      )
    ).status,
    200,
  )
  assert.deepEqual(deleted, ["owner"])
})
void test("missing/invalid authentication, confirmation and foreign origins cannot delete", async () => {
  let called = 0
  const handler = createDeleteHandler({
    origins: [origin],
    verifyUser: () => Promise.resolve(null),
    deleteUser: () => {
      called++
      return Promise.resolve()
    },
  })
  assert.equal(
    (await handler(new Request("https://fixture.invalid", { method: "POST" })))
      .status,
    401,
  )
  assert.equal((await handler(request())).status, 401)
  assert.equal(
    (await handler(request({ expectedUserId: "owner" }))).status,
    400,
  )
  assert.equal(
    (await handler(request(undefined, "token", "https://attacker.invalid")))
      .status,
    403,
  )
  assert.equal(
    (
      await handler(
        new Request("https://fixture.invalid", {
          method: "GET",
          headers: { origin },
        }),
      )
    ).status,
    405,
  )
  assert.equal(called, 0)
})
void test("preflight is permitted only for configured origins and errors never claim deletion", async () => {
  const handler = createDeleteHandler({
    origins: [origin],
    verifyUser: () => Promise.resolve({ id: "owner" }),
    deleteUser: () => Promise.reject(new Error("secret database details")),
  })
  const preflight = await handler(
    new Request("https://fixture.invalid", {
      method: "OPTIONS",
      headers: { origin },
    }),
  )
  assert.equal(preflight.status, 204)
  assert.equal(preflight.headers.get("Access-Control-Allow-Origin"), origin)
  const response = await handler(request())
  assert.equal(response.status, 503)
  assert.ok(!(await response.text()).includes("secret database details"))
  const unavailable = createDeleteHandler({
    origins: [origin],
    verifyUser: () => Promise.reject(new Error("network")),
    deleteUser: () => Promise.resolve(),
  })
  assert.equal((await unavailable(request())).status, 503)
})
