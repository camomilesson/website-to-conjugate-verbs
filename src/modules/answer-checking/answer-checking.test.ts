import assert from "node:assert/strict"
import { test } from "node:test"
import { isCorrectAnswer, normaliseAnswer } from "./index.ts"

await test("matching normalises whitespace, Spanish case, and Unicode composition", () => {
  assert.equal(
    normaliseAnswer("  ME   HE\tLEVANTADO \n", "strict"),
    "me he levantado",
  )
  assert.ok(isCorrectAnswer("HABLE\u0301", ["hablé"], "strict"))
  assert.equal(isCorrectAnswer("   ", [""], "relaxed"), false)
})
await test("strict preserves á/ñ/ü; relaxed folds them without ignoring spelling", () => {
  for (const [plain, accented] of [
    ["hable", "hablé"],
    ["sueno", "sueño"],
    ["averigue", "averigüé"],
  ]) {
    assert.equal(isCorrectAnswer(plain, [accented], "strict"), false)
    assert.equal(isCorrectAnswer(plain, [accented], "relaxed"), true)
  }
  assert.equal(isCorrectAnswer("  AVERIGÜÉ ", ["averigüé"], "strict"), true)
  assert.equal(isCorrectAnswer("hablaz", ["hablas"], "relaxed"), false)
  assert.equal(
    isCorrectAnswer("no levantes", ["no te levantes"], "relaxed"),
    false,
  )
  assert.equal(isCorrectAnswer("yo hablo", ["hablo"], "strict"), false)
})
