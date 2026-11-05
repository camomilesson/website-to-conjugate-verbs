import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import {
  parseCatalogueVerb,
  getPresetCategories,
} from "../verb-catalogue/index.ts"
import {
  createQuestions,
  initialSession,
  sessionReducer,
  sessionScore,
  poolSize,
  PRACTICE_PERSONS,
} from "./session.ts"
import type { PracticeConfig } from "./session.ts"
const data: unknown = JSON.parse(
  readFileSync(
    new URL("../../../public/data/verbs/hablar.json", import.meta.url),
    "utf8",
  ),
)
const hablar = parseCatalogueVerb(data)
const config: PracticeConfig = {
  verbIds: ["hablar"],
  categories: ["indicative.present"],
  persons: [...PRACTICE_PERSONS],
  length: 20,
  accentPolicy: "strict",
}

await test("questions cap at unique eligible combinations, copy answers, and retain selected metadata", () => {
  const questions = createQuestions([hablar, hablar], config, () => 0.5)
  assert.equal(questions.length, 6)
  assert.equal(new Set(questions.map((q) => q.id)).size, 6)
  assert.ok(
    questions.every(
      (q) => q.verbId === "hablar" && q.category === "indicative.present",
    ),
  )
  questions[0].answers.push("mutated")
  assert.ok(
    !hablar.conjugations["indicative.present"][questions[0].person]?.includes(
      "mutated",
    ),
  )
  assert.equal(createQuestions([hablar], { ...config, length: 2 }).length, 2)
})
await test("imperative eligibility maps usted/ustedes and excludes yo", () => {
  const questions = createQuestions([hablar], {
    ...config,
    categories: ["imperative.affirmative"],
  })
  assert.equal(questions.length, 5)
  assert.ok(!questions.some((q) => q.person === "yo"))
  assert.equal(
    createQuestions([hablar], {
      ...config,
      categories: ["imperative.negative"],
      persons: ["el"],
    })[0].person,
    "usted",
  )
  assert.equal(
    createQuestions([hablar], {
      ...config,
      categories: ["imperative.negative"],
      persons: ["ellos"],
    })[0].person,
    "ustedes",
  )
  assert.equal(poolSize(7, getPresetCategories("all"), PRACTICE_PERSONS), 658)
  assert.equal(poolSize(1, ["imperative.affirmative"], ["yo"]), 0)
})
await test("invalid lengths and empty pools reject instead of starting unusable sessions", () => {
  for (const length of [0, -1, 1.5, NaN, Infinity])
    assert.throws(() => createQuestions([hablar], { ...config, length }))
  for (const override of [
    { verbIds: [] },
    { categories: [] },
    { persons: [] },
    {
      categories: ["imperative.affirmative" as const],
      persons: ["yo" as const],
    },
  ])
    assert.throws(() => createQuestions([hablar], { ...config, ...override }))
  assert.throws(() => initialSession([], "strict"))
})
await test("shuffle handles boundary choices, does not mutate catalogue, and never repeats", () => {
  const a = createQuestions([hablar], config, () => 0)
  const b = createQuestions([hablar], config, () => 0.999999)
  assert.notDeepEqual(
    a.map((q) => q.id),
    b.map((q) => q.id),
  )
  assert.deepEqual(a.map((q) => q.id).sort(), b.map((q) => q.id).sort())
})
await test("submission locks feedback; next cannot skip; completion counts every question exactly once", () => {
  const questions = createQuestions([hablar], { ...config, length: 2 })
  let state = initialSession(questions, "strict")
  assert.equal(sessionReducer(state, { type: "next" }), state)
  assert.equal(sessionReducer(state, { type: "submit", text: "  " }), state)
  state = sessionReducer(state, {
    type: "submit",
    text: questions[0].answers[0],
  })
  assert.equal(state.phase, "feedback")
  assert.equal(sessionReducer(state, { type: "submit", text: "wrong" }), state)
  state = sessionReducer(state, { type: "next" })
  assert.equal(state.index, 1)
  assert.equal(sessionReducer(state, { type: "next" }), state)
  state = sessionReducer(state, { type: "submit", text: "wrong" })
  assert.equal(state.phase, "feedback")
  state = sessionReducer(state, { type: "next" })
  assert.equal(state.phase, "complete")
  assert.deepEqual(sessionScore(state.results), {
    correct: 1,
    incorrect: 1,
    total: 2,
    percentage: 50,
  })
  assert.equal(sessionReducer(state, { type: "next" }), state)
  assert.equal(
    sessionReducer(state, { type: "submit", text: "anything" }),
    state,
  )
})
await test("sessions accept non-first alternatives and preserve strict/relaxed policy", () => {
  const questions = createQuestions([hablar], {
    ...config,
    categories: ["subjunctive.imperfect"],
    persons: ["nosotros"],
  })
  const strict = initialSession(questions, "strict")
  assert.equal(
    sessionReducer(strict, { type: "submit", text: "hablásemos" }).results[0]
      .correct,
    true,
  )
  assert.equal(
    sessionReducer(strict, { type: "submit", text: "hablasemos" }).results[0]
      .correct,
    false,
  )
  assert.equal(
    sessionReducer(initialSession(questions, "relaxed"), {
      type: "submit",
      text: "hablasemos",
    }).results[0].correct,
    true,
  )
  assert.equal(sessionScore([]).percentage, 0)
})
