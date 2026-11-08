import test from "node:test"
import assert from "node:assert/strict"
import { parseCountRows } from "./validation.ts"

const row = {
  verb_id: "hablar",
  category_id: "indicative.present",
  mode: "typing",
  accent_policy: "strict",
  correct: 0,
  answered: 1,
}
void test("progress responses accept unattempted lists and attempted zero accuracy", () => {
  assert.deepEqual(parseCountRows([]), [])
  assert.deepEqual(parseCountRows([row]), [row])
  assert.equal(
    parseCountRows([{ ...row, mode: "choice", accent_policy: "na" }]).length,
    1,
  )
})
void test("invalid progress responses reject before reaching the matrix", () => {
  for (const value of [
    null,
    {},
    [null],
    [row, null],
    [{ ...row, verb_id: null }],
    [{ ...row, category_id: [] }],
    [{ ...row, mode: "unknown" }],
    [{ ...row, mode: "choice" }],
    [{ ...row, accent_policy: "na" }],
    [{ ...row, correct: "0" }],
    [{ ...row, correct: -1 }],
    [{ ...row, correct: 2 }],
    [{ ...row, answered: 0 }],
    [{ ...row, answered: 1.5 }],
    [{ ...row, answered: Number.MAX_SAFE_INTEGER + 1 }],
  ])
    assert.throws(() => parseCountRows(value), /Invalid progress data.*Retry/)
})
