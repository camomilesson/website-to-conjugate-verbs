import test from "node:test"
import assert from "node:assert/strict"
import { choiceNumber, quickPreferences, practiceSummary } from "./polish.ts"
import type { PracticePreferences } from "../practice-preferences/index.ts"
const saved: PracticePreferences = {
  mode: "typing",
  accentPolicy: "relaxed",
  verbIds: ["hablar"],
  categories: ["indicative.present"],
  persons: ["yo"],
  length: "7",
  verbSet: "select",
  tenseSet: "select",
  personSet: "select",
}
void test("quick start overrides only mode, preserves saved accent policy and detaches the draft", () => {
  const choice = quickPreferences(saved, "choice")
  assert.equal(choice.mode, "choice")
  assert.equal(choice.accentPolicy, "relaxed")
  choice.verbIds.push("comer")
  assert.deepEqual(saved.verbIds, ["hablar"])
  assert.equal(saved.mode, "typing")
  assert.equal(quickPreferences(choice, "typing").accentPolicy, "relaxed")
  assert.match(practiceSummary(saved), /Selected verbs \(1\).*7 questions/)
})
void test("number shortcuts select available options without repeats, modifiers, composition or editing", () => {
  assert.equal(choiceNumber("1", 4, false, false, false, false), 0)
  assert.equal(choiceNumber("4", 4, false, false, false, false), 3)
  assert.equal(choiceNumber("4", 3, false, false, false, false), null)
  assert.equal(choiceNumber("0", 4, false, false, false, false), null)
  for (const flags of [
    [true, false, false, false],
    [false, true, false, false],
    [false, false, true, false],
    [false, false, false, true],
  ] as const)
    assert.equal(
      choiceNumber("2", 4, flags[0], flags[1], flags[2], flags[3]),
      null,
    )
})
