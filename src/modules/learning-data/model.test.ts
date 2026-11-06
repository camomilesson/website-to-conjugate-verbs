import test from "node:test"
import assert from "node:assert/strict"
import {
  retryableSubmission,
  parseAcknowledgement,
  submissionFor,
  totals,
  practiceMetadata,
} from "./model.ts"
import type { Submission } from "./model.ts"
const payload: Submission = {
  runId: "run",
  submissionId: "same-id",
  ordinal: 1,
  verbId: "hablar",
  category: "indicative.present",
  person: "yo",
  correct: true,
  text: "hablo",
  answers: ["hablo"],
}
void test("lost reply and retry use the same detached submission; simultaneous clicks share a request", async () => {
  const writes: Submission[] = []
  const request = retryableSubmission(payload, async (value) => {
    await Promise.resolve()
    writes.push(value)
    if (writes.length === 1) {
      value.answers[0] = "changed by transport"
      throw new Error("Reply lost")
    }
    return { acknowledged: true, duplicate: true, complete: false }
  })
  const first = request.send()
  assert.equal(first, request.send())
  await assert.rejects(first, /Reply lost/)
  const ack = await request.send()
  assert.equal(ack.duplicate, true)
  assert.deepEqual(writes[1], payload)
  await request.send()
  assert.equal(writes.length, 2)
})
void test("no unacknowledged result is treated as a saved answer", () => {
  for (const value of [
    null,
    {},
    { acknowledged: false, duplicate: false, complete: false },
  ])
    assert.throws(() => parseAcknowledgement(value))
})
void test("percentages weight counts rather than averaging cell percentages", () => {
  assert.deepEqual(
    totals([
      { correct: 1, answered: 1 },
      { correct: 1, answered: 9 },
    ]),
    { correct: 2, answered: 10, percentage: 20 },
  )
  assert.equal(totals([]).percentage, null)
})
void test("submission and metadata snapshots omit queues and detach mutable arrays", () => {
  const result = {
    question: {
      id: "hablar:indicative.present:yo",
      verbId: "hablar",
      infinitive: "hablar",
      meaning: "speak",
      category: "indicative.present" as const,
      person: "yo" as const,
      answers: ["hablo"],
    },
    text: "hablo",
    correct: true,
  }
  const submission = submissionFor("run", 1, result, "uuid")
  result.question.answers[0] = "changed"
  assert.deepEqual(submission.answers, ["hablo"])
  const config = {
    mode: "typing" as const,
    verbIds: ["hablar"],
    categories: ["indicative.present" as const],
    persons: ["yo" as const],
    length: 1,
    accentPolicy: "strict" as const,
  }
  const preferences = {
    ...config,
    length: "1",
    verbSet: "select" as const,
    tenseSet: "select" as const,
    personSet: "select" as const,
  }
  const metadata = practiceMetadata(config, preferences)
  config.verbIds.push("comer")
  assert.deepEqual(metadata.resolved.verbIds, ["hablar"])
  assert.equal("questions" in metadata, false)
})
