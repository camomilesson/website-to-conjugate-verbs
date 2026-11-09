import assert from "node:assert/strict"
import { test } from "node:test"
import { readFileSync } from "node:fs"
import { parseCatalogue, parseCatalogueVerb } from "@conjugadora/verb-catalogue"
import type { CountRow } from "../learning-data/data.ts"
import { defaultPreferences } from "../practice-preferences/index.ts"
import { targetedVerbs } from "./targeted.ts"
import { createQuestions } from "./session.ts"
const catalogue = parseCatalogue(
  JSON.parse(
    readFileSync(
      new URL("../../../public/data/catalogue.json", import.meta.url),
      "utf8",
    ),
  ) as unknown,
)
const prefs = {
  ...defaultPreferences(catalogue),
  categories: ["indicative.present", "indicative.future"] as const,
}
// Keep the array mutable like the public preference model.
const preferences = { ...prefs, categories: [...prefs.categories] }
function count(
  verb_id: string,
  answered: number,
  correct: number,
  category_id = "indicative.present",
): CountRow {
  return {
    verb_id,
    category_id,
    answered,
    correct,
    mode: "typing",
    accent_policy: "strict",
  }
}
await test("least practiced counts absent combinations, not attempted 0% cells, then uses fewer attempts", () => {
  const small = {
    ...catalogue,
    verbs: catalogue.verbs.filter((v) =>
      ["hablar", "comer", "vivir"].includes(v.id),
    ),
  }
  const result = targetedVerbs(
    small,
    [count("hablar", 10, 0), count("comer", 2, 2)],
    preferences,
    "least-practiced",
  )
  assert.deepEqual(
    result.map((row) => row.verb.id),
    ["vivir", "comer", "hablar"],
  )
  assert.equal(result[0].unattempted.length, 2)
  assert.deepEqual(result[2].unattempted, ["indicative.future"])
})
await test("most mistakes weights counts, excludes empty verbs, and filters tenses, modes and accent policies", () => {
  const counts: CountRow[] = [
    count("hablar", 1, 1),
    count("hablar", 9, 0, "indicative.future"),
    count("comer", 2, 1),
    { ...count("comer", 100, 0), mode: "choice", accent_policy: "na" },
    { ...count("comer", 100, 0), accent_policy: "relaxed" },
    count("comer", 100, 0, "subjunctive.present"),
    count("obsolete", 100, 0),
  ]
  const result = targetedVerbs(catalogue, counts, preferences, "most-mistakes")
  assert.deepEqual(
    result.map((row) => row.verb.id),
    ["hablar", "comer"],
  )
  assert.equal(result[0].correct, 1)
  assert.equal(result[0].answered, 10)
  assert.equal(
    targetedVerbs(
      catalogue,
      counts,
      { ...preferences, mode: "choice" },
      "most-mistakes",
    )[0].answered,
    100,
  )
  assert.equal(
    targetedVerbs(
      catalogue,
      counts,
      { ...preferences, accentPolicy: "relaxed" },
      "most-mistakes",
    )[0].answered,
    100,
  )
})
await test("accuracy uses full precision; ties favour more attempts then Spanish name", () => {
  const counts = [
    count("hablar", 3, 1),
    count("comer", 100, 33),
    count("vivir", 6, 2),
    count("abrir", 6, 2),
  ]
  assert.deepEqual(
    targetedVerbs(catalogue, counts, preferences, "most-mistakes").map(
      (r) => r.verb.id,
    ),
    ["comer", "abrir", "vivir", "hablar"],
  )
})
await test("empty accounts offer at most 20 new verbs; mistake mode stays empty and ineligible persons produce no pool", () => {
  const selected = targetedVerbs(catalogue, [], preferences, "least-practiced")
  assert.equal(selected.length, 20)
  assert.deepEqual(
    selected.map((r) => r.verb.infinitive),
    [...catalogue.verbs]
      .sort((a, b) => a.infinitive.localeCompare(b.infinitive, "es"))
      .slice(0, 20)
      .map((v) => v.infinitive),
  )
  assert.deepEqual(
    targetedVerbs(catalogue, [], preferences, "most-mistakes"),
    [],
  )
  assert.deepEqual(
    targetedVerbs(
      catalogue,
      [],
      {
        ...preferences,
        categories: ["imperative.affirmative"],
        persons: ["yo"],
      },
      "least-practiced",
    ),
    [],
  )
})
await test("targeted question sampling favours unattempted pairs, then fills without duplicates in both answer modes", () => {
  const verb = parseCatalogueVerb(
    JSON.parse(
      readFileSync(
        new URL("../../../public/data/verbs/hablar.json", import.meta.url),
        "utf8",
      ),
    ) as unknown,
  )
  for (const mode of ["typing", "choice"] as const) {
    const config = { ...preferences, mode, verbIds: ["hablar"], length: 7 }
    const preferred = new Set(["hablar:indicative.future"])
    const questions = createQuestions([verb], config, () => 0.5, preferred)
    assert.equal(questions.length, 7)
    assert.ok(
      questions.slice(0, 6).every((q) => q.category === "indicative.future"),
    )
    assert.equal(questions[6].category, "indicative.present")
    assert.equal(new Set(questions.map((q) => q.id)).size, 7)
  }
})
