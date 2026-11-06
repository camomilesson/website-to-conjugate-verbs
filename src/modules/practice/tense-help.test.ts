import assert from "node:assert/strict"
import { test } from "node:test"
import { CATEGORIES } from "../verb-catalogue/index.ts"
import { TENSE_HELP } from "./tense-help.ts"
await test("every supported category has English help; compound and progressive forms have formation hints", () => {
  assert.deepEqual(
    Object.keys(TENSE_HELP).sort(),
    CATEGORIES.map((c) => c.id).sort(),
  )
  for (const category of CATEGORIES) {
    const help = TENSE_HELP[category.id]
    assert.ok(help.title && help.meaning && help.example)
    const needsFormation =
      (category.id.includes("perfect") && !category.id.endsWith("imperfect")) ||
      category.id === "indicative.pluperfect" ||
      category.id === "subjunctive.pluperfect" ||
      category.id === "progressive.present"
    assert.equal(Boolean(help.formation), needsFormation, category.id)
  }
})
