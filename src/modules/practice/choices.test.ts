import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import {
  CATEGORIES,
  getCategoryPersons,
  parseCatalogue,
  parseCatalogueVerb,
} from "@conjugadora/verb-catalogue"
import { isCorrectAnswer, normaliseAnswer } from "../answer-checking/index.ts"
import { personInCategory, withChoices } from "./choices.ts"
import {
  createQuestionPool,
  createQuestions,
  initialSession,
  sessionReducer,
  PRACTICE_PERSONS,
} from "./session.ts"
import type { PracticeConfig } from "./session.ts"
const root = new URL("../../../public/data/", import.meta.url)
function read(path: string): unknown {
  return JSON.parse(readFileSync(new URL(path, root), "utf8")) as unknown
}
const catalogue = parseCatalogue(read("catalogue.json"))
const verbs = catalogue.verbs.map((entry) =>
  parseCatalogueVerb(read(`verbs/${entry.id}.json`)),
)
const config: PracticeConfig = {
  mode: "choice",
  verbIds: catalogue.verbs.map((entry) => entry.id),
  categories: CATEGORIES.map((item) => item.id),
  persons: [...PRACTICE_PERSONS],
  length: 10000,
  accentPolicy: "strict",
}

await test("every catalogue choice question has distinct options and exactly one accepted answer", () => {
  for (const random of [() => 0, () => 0.5, () => 0.99999]) {
    const questions = createQuestions(verbs, config, random)
    assert.equal(questions.length, 9400)
    assert.equal(new Set(questions.map((question) => question.id)).size, 9400)
    for (const question of questions) {
      assert.equal(question.options?.length, 4)
      assert.equal(
        new Set(
          question.options?.map((option) => normaliseAnswer(option, "strict")),
        ).size,
        4,
      )
      assert.equal(
        question.options?.filter((option) =>
          isCorrectAnswer(option, question.answers, "strict"),
        ).length,
        1,
      )
      const source = verbs.find((verb) => verb.id === question.verbId)
      assert.ok(source)
      const allForms = Object.values(source.conjugations).flatMap((forms) =>
        Object.values(forms).flatMap((answers) => answers ?? []),
      )
      const displayedForms =
        question.category === "imperative.negative"
          ? allForms.map((form) => `no ${form.replace(/^no\s+/i, "")}`)
          : allForms
      assert.ok(
        question.options?.every((option) => displayedForms.includes(option)),
      )
      if (question.category === "imperative.negative") {
        assert.ok(
          question.options?.every(
            (option) =>
              option.startsWith("no ") && !option.startsWith("no no "),
          ),
        )
      }
    }
  }
})
await test("distractors use only the same grammatical person and exclude every accepted variant", () => {
  for (const verb of verbs) {
    const questions = createQuestions(
      [verb],
      { ...config, verbIds: [verb.id] },
      () => 0.5,
    )
    for (const question of questions) {
      const samePersonForms = Object.entries(verb.conjugations).flatMap(
        ([category, forms]) => {
          const person = personInCategory(question.person, category)
          const answers = person ? (forms[person] ?? []) : []
          return question.category === "imperative.negative"
            ? answers.map((form) => `no ${form.replace(/^no\s+/i, "")}`)
            : answers
        },
      )
      assert.ok(
        question.options?.every((option) => samePersonForms.includes(option)),
        question.id,
      )
      assert.equal(
        question.options?.filter((option) =>
          isCorrectAnswer(option, question.answers, "strict"),
        ).length,
        1,
      )
    }
  }
  assert.equal(personInCategory("yo", "imperative.affirmative"), null)
  assert.equal(personInCategory("usted", "indicative.present"), "el")
  assert.equal(personInCategory("ustedes", "indicative.present"), "ellos")
  assert.equal(personInCategory("el", "imperative.negative"), "usted")
  assert.equal(personInCategory("ellos", "imperative.negative"), "ustedes")
})
await test("small candidate pools show fewer options or exclude a question before sizing the session", () => {
  const verb = structuredClone(verbs[0])
  for (const category of CATEGORIES)
    for (const person of getCategoryPersons(category.id))
      verb.conjugations[category.id][person] = ["same"]
  const typed = {
    ...config,
    mode: "typing" as const,
    verbIds: [verb.id],
    categories: ["indicative.present" as const],
    persons: ["yo" as const],
  }
  const question = createQuestions([verb], typed)[0]
  assert.equal(
    withChoices(question, verb, () => 0.5),
    null,
  )
  assert.equal(
    createQuestionPool([verb], { ...typed, mode: "choice" }).length,
    0,
  )
  assert.throws(
    () => createQuestions([verb], { ...typed, mode: "choice" }),
    /valid answer options/,
  )
  verb.conjugations["indicative.future"].yo = ["other", "OTHER"]
  const two = withChoices(question, verb, () => 0.5)
  assert.equal(two?.options?.length, 2)
  verb.conjugations["indicative.future"].tu = ["third"]
  assert.equal(withChoices(question, verb, () => 0.5)?.options?.length, 2)
  verb.conjugations["indicative.conditional"].yo = ["third"]
  assert.equal(withChoices(question, verb, () => 0.5)?.options?.length, 3)
})
await test("choice submission requires a valid offered index and stays strict regardless of typing policy", () => {
  const question = createQuestions(verbs, { ...config, length: 1 })[0]
  question.answers = ["hablé"]
  question.options = ["hablé", "hable"]
  const initial = initialSession([question], "relaxed")
  for (const index of [-1, 0.5, 2, NaN])
    assert.equal(
      sessionReducer(initial, { type: "submit-choice", index }),
      initial,
    )
  assert.equal(
    sessionReducer(initial, { type: "submit", text: "hablé" }),
    initial,
  )
  const wrong = sessionReducer(initial, { type: "submit-choice", index: 1 })
  assert.equal(wrong.results[0].correct, false)
  assert.equal(wrong.results[0].text, "hable")
  assert.equal(
    sessionReducer(wrong, { type: "submit-choice", index: 0 }),
    wrong,
  )
  const right = sessionReducer(initial, { type: "submit-choice", index: 0 })
  assert.equal(right.results[0].correct, true)
  assert.equal(sessionReducer(right, { type: "next" }).phase, "complete")
  const typing = { ...question, options: undefined }
  assert.equal(
    sessionReducer(initialSession([typing], "strict"), {
      type: "submit-choice",
      index: 0,
    }).results.length,
    0,
  )
})
