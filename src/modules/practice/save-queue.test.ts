import assert from "node:assert/strict"
import { test } from "node:test"
import { setImmediate } from "node:timers/promises"
import { createSaveQueue } from "./save-queue.ts"
import { initialSession, sessionReducer } from "./session.ts"
import { retryableSubmission, submissionFor } from "../learning-data/data.ts"
import type { Submission } from "../learning-data/model.ts"
function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>((done) => {
    resolve = done
  })
  return { promise, resolve }
}
const question = {
  id: "hablar:indicative.present:yo",
  verbId: "hablar",
  infinitive: "hablar",
  meaning: "speak",
  category: "indicative.present" as const,
  person: "yo" as const,
  answers: ["hablo"],
}
await test("feedback and local completion do not wait for saves; requests remain serial", async () => {
  const first = deferred(),
    last = deferred()
  const queue = createSaveQueue()
  const calls: number[] = []
  queue.subscribe(() => {})
  let state = initialSession(
    [question, { ...question, id: "second" }],
    "strict",
  )
  for (let i = 0; i < 2; i++) {
    state = sessionReducer(state, { type: "submit", text: "hablo" })
    assert.equal(state.phase, "feedback")
    queue.enqueue({
      send: () => {
        calls.push(i)
        return i === 0 ? first.promise : last.promise
      },
    })
    state = sessionReducer(state, { type: "auto-next", index: i })
  }
  assert.equal(state.phase, "complete")
  assert.equal(state.results.length, 2)
  assert.deepEqual(calls, [0])
  assert.equal(queue.snapshot().pending, 2)
  assert.equal(queue.snapshot().saved, 0)
  first.resolve()
  await setImmediate()
  assert.deepEqual(calls, [0, 1])
  assert.equal(queue.snapshot().pending, 1)
  last.resolve()
  await setImmediate()
  assert.deepEqual(queue.snapshot(), {
    pending: 0,
    saved: 2,
    saving: false,
    error: null,
  })
})
await test("lost committed reply stops the queue; retry reuses the same payload without duplicating counts", async () => {
  const queue = createSaveQueue()
  queue.subscribe(() => {})
  const calls: Submission[] = []
  const committed = new Set<string>()
  let loseReply = true
  const send = async (value: Submission) => {
    await Promise.resolve()
    calls.push(value)
    const duplicate = committed.has(value.submissionId)
    if (!duplicate) {
      assert.equal(value.ordinal, committed.size + 1)
      committed.add(value.submissionId)
    }
    if (loseReply) {
      loseReply = false
      throw new Error("Lost reply")
    }
    return {
      acknowledged: true as const,
      duplicate,
      complete: committed.size === 2,
    }
  }
  const answer = { question, text: "hablo", correct: true }
  for (let i = 1; i <= 2; i++)
    queue.enqueue(
      retryableSubmission(submissionFor("run", i, answer, `id-${i}`), send),
    )
  await setImmediate()
  assert.equal(queue.snapshot().error, "Lost reply")
  assert.equal(queue.snapshot().pending, 2)
  assert.equal(calls.length, 1)
  queue.retry()
  queue.retry()
  await setImmediate()
  assert.deepEqual(calls[0], calls[1])
  assert.deepEqual(
    calls.map((value) => value.ordinal),
    [1, 1, 2],
  )
  assert.equal(committed.size, 2)
  assert.equal(queue.snapshot().pending, 0)
})
await test("leaving or changing account stops unsent answers and late UI notifications", async () => {
  const first = deferred()
  const queue = createSaveQueue()
  let notifications = 0,
    sent = 0
  const unsubscribe = queue.subscribe(() => {
    notifications++
  })
  queue.enqueue({
    send: () => {
      sent++
      return first.promise
    },
  })
  queue.enqueue({
    send: () => {
      sent++
      return Promise.resolve()
    },
  })
  unsubscribe()
  const before = notifications
  first.resolve()
  await setImmediate()
  assert.equal(notifications, before)
  assert.equal(sent, 1)
  assert.equal(queue.snapshot().pending, 1)
})
await test("effect resubscription does not submit the in-flight answer twice", async () => {
  const request = deferred()
  const queue = createSaveQueue()
  let calls = 0
  const unsubscribe = queue.subscribe(() => {})
  queue.enqueue({
    send: () => {
      calls++
      return request.promise
    },
  })
  unsubscribe()
  queue.subscribe(() => {})
  assert.equal(calls, 1)
  request.resolve()
  await setImmediate()
  assert.equal(queue.snapshot().pending, 0)
})
await test("progression remains paused until a retry is acknowledged", async () => {
  const retry = deferred()
  const queue = createSaveQueue()
  queue.subscribe(() => {})
  let attempts = 0
  queue.enqueue({
    send: () => {
      attempts++
      return attempts === 1
        ? Promise.reject(new Error("Offline"))
        : retry.promise
    },
  })
  await setImmediate()
  queue.retry()
  assert.equal(queue.snapshot().saving, true)
  assert.equal(queue.snapshot().error, "Offline")
  assert.equal(queue.snapshot().pending, 1)
  retry.resolve()
  await setImmediate()
  assert.equal(queue.snapshot().error, null)
  assert.equal(queue.snapshot().pending, 0)
})
