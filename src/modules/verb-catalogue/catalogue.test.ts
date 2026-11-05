import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import { test } from "node:test"
import {
  CATEGORIES,
  getCategoryPersons,
  getPresetCategories,
} from "./categories.ts"
import {
  parseCatalogue,
  parseCatalogueVerb,
  loadCatalogue,
  loadCatalogueVerb,
} from "./catalogue.ts"

const root = new URL("../../../public/data/", import.meta.url)
function readJson(path: string): unknown {
  return JSON.parse(readFileSync(new URL(path, root), "utf8")) as unknown
}
const catalogue = parseCatalogue(readJson("catalogue.json"))
const verbs = new Map(
  catalogue.verbs.map((entry) => [
    entry.id,
    parseCatalogueVerb(readJson(`verbs/${entry.id}.json`)),
  ]),
)
function verb(id: string) {
  const value = verbs.get(id)
  assert.ok(value)
  return value
}

await test("static starter catalogue has seven matching files and complete supported coverage", () => {
  assert.equal(catalogue.verbs.length, 7)
  assert.deepEqual(
    readdirSync(new URL("verbs/", root)).sort(),
    catalogue.verbs.map((entry) => `${entry.id}.json`).sort(),
  )
  let cells = 0
  for (const entry of catalogue.verbs) {
    const data = verb(entry.id)
    assert.equal(data.id, entry.id)
    assert.equal(data.infinitive, entry.infinitive)
    assert.equal(data.meaning, entry.meaning)
    assert.equal(data.datasetVersion, catalogue.datasetVersion)
    for (const category of CATEGORIES) {
      for (const person of getCategoryPersons(category.id)) {
        const answers = data.conjugations[category.id][person]
        assert.ok(answers?.length)
        assert.ok(answers.every((answer) => answer === answer.normalize("NFC")))
        cells++
      }
    }
  }
  assert.equal(cells, 658)
})

await test("presets and imperative persons match release scope", () => {
  assert.equal(new Set(CATEGORIES.map((category) => category.id)).size, 16)
  assert.equal(getPresetCategories("basic").length, 6)
  assert.equal(getPresetCategories("advanced").length, 16)
  assert.deepEqual(getPresetCategories("all"), getPresetCategories("advanced"))
  assert.equal(
    getCategoryPersons("imperative.affirmative").includes("yo"),
    false,
  )
  assert.equal(getCategoryPersons("imperative.negative").includes("yo"), false)
})

await test("rejects malformed catalogue and answer tables", () => {
  assert.throws(() => parseCatalogue(null))
  assert.throws(() => parseCatalogue({ ...catalogue, verbs: [] }))
  assert.throws(() =>
    parseCatalogue({
      ...catalogue,
      verbs: [catalogue.verbs[0], catalogue.verbs[0]],
    }),
  )
  for (const answers of [[], [""], [" "], [123], ["hablo", "hablo"]]) {
    const data = structuredClone(verb("hablar"))
    const broken: unknown = {
      ...data,
      conjugations: {
        ...data.conjugations,
        "indicative.present": {
          ...data.conjugations["indicative.present"],
          yo: answers,
        },
      },
    }
    assert.throws(() => parseCatalogueVerb(broken))
  }
  const missing = structuredClone(verb("hablar"))
  delete missing.conjugations["indicative.present"].yo
  assert.throws(() => parseCatalogueVerb(missing))
  const extra = structuredClone(verb("hablar"))
  extra.conjugations["imperative.affirmative"].yo = ["hablo"]
  assert.throws(() => parseCatalogueVerb(extra))
  assert.throws(() =>
    parseCatalogueVerb({ ...verb("hablar"), conjugations: {} }),
  )
})

await test("review anchors cover irregulars, regular groups, and accented variants", () => {
  assert.deepEqual(verb("ser").conjugations["imperative.affirmative"].tu, [
    "sé",
  ])
  assert.deepEqual(verb("ir").conjugations["imperative.affirmative"].vosotros, [
    "id",
  ])
  assert.deepEqual(verb("ir").conjugations["imperative.affirmative"].nosotros, [
    "vamos",
    "vayamos",
  ])
  assert.deepEqual(verb("tener").conjugations["indicative.future"].yo, [
    "tendré",
  ])
  assert.deepEqual(
    verb("tener").conjugations["subjunctive.imperfect"].nosotros,
    ["tuviéramos", "tuviésemos"],
  )
  assert.deepEqual(verb("comer").conjugations["indicative.preterite"].el, [
    "comió",
  ])
  assert.deepEqual(verb("vivir").conjugations["indicative.present"].vosotros, [
    "vivís",
  ])
  assert.deepEqual(
    verb("hablar").conjugations["subjunctive.pluperfect"].nosotros,
    ["hubiéramos hablado", "hubiésemos hablado"],
  )
})

await test("reflexive forms preserve accent, placement, and imperative consonant changes", () => {
  const data = verb("levantarse")
  assert.deepEqual(data.conjugations["imperative.affirmative"].nosotros, [
    "levantémonos",
  ])
  assert.deepEqual(data.conjugations["imperative.affirmative"].vosotros, [
    "levantaos",
  ])
  assert.deepEqual(data.conjugations["imperative.negative"].tu, [
    "no te levantes",
  ])
  assert.deepEqual(data.conjugations["progressive.present"].yo, [
    "me estoy levantando",
    "estoy levantándome",
  ])
  assert.deepEqual(data.conjugations["indicative.present-perfect"].yo, [
    "me he levantado",
  ])
})

await test("loaders handle HTTP failures, malformed data, mismatch, success, and cancellation", async () => {
  const original = globalThis.fetch
  try {
    globalThis.fetch = () =>
      Promise.resolve(new Response("not found", { status: 404 }))
    await assert.rejects(loadCatalogue(), /404/)
    await assert.rejects(
      loadCatalogueVerb(catalogue.verbs[0], catalogue.datasetVersion),
      /404/,
    )
    globalThis.fetch = () => Promise.resolve(new Response("{broken"))
    await assert.rejects(loadCatalogue(), SyntaxError)
    globalThis.fetch = () => Promise.resolve(Response.json(catalogue))
    assert.deepEqual(await loadCatalogue(), catalogue)
    globalThis.fetch = () => Promise.resolve(Response.json(verb("hablar")))
    assert.equal(
      (await loadCatalogueVerb(catalogue.verbs[0], catalogue.datasetVersion))
        .id,
      "hablar",
    )
    await assert.rejects(
      loadCatalogueVerb(catalogue.verbs[0], "obsolete-version"),
      /do not match/,
    )
    await assert.rejects(
      loadCatalogueVerb(catalogue.verbs[1], catalogue.datasetVersion),
      /do not match/,
    )
    await assert.rejects(
      loadCatalogueVerb(
        { ...catalogue.verbs[0], id: "../secret" },
        catalogue.datasetVersion,
      ),
      /Invalid verb ID/,
    )
    globalThis.fetch = (_input, options) => {
      assert.ok(options?.signal?.aborted)
      return Promise.reject(new DOMException("Aborted", "AbortError"))
    }
    const controller = new AbortController()
    controller.abort()
    await assert.rejects(loadCatalogue(controller.signal), {
      name: "AbortError",
    })
  } finally {
    globalThis.fetch = original
  }
})
