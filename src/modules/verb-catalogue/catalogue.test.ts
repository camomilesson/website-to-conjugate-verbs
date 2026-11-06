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

await test("static catalogue has 100 matching files and complete supported coverage", () => {
  assert.equal(catalogue.verbs.length, 100)
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
  assert.equal(cells, 9400)
})

await test("presets and imperative persons match release scope", () => {
  assert.equal(new Set(CATEGORIES.map((category) => category.id)).size, 16)
  assert.equal(getPresetCategories("basic").length, 6)
  assert.equal(getPresetCategories("advanced").length, 10)
  assert.equal(getPresetCategories("all").length, 16)
  assert.ok(
    getPresetCategories("advanced").every(
      (id) => !getPresetCategories("basic").includes(id),
    ),
  )
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

await test("expanded catalogue review anchors cover spelling, irregular families, and reflexive commands", () => {
  const anchors: [
    string,
    keyof ReturnType<typeof verb>["conjugations"],
    "yo" | "tu" | "nosotros" | "vosotros" | "el",
    string[],
  ][] = [
    ["pagar", "indicative.preterite", "yo", ["pagué"]],
    ["buscar", "subjunctive.present", "yo", ["busque"]],
    ["empezar", "subjunctive.present", "nosotros", ["empecemos"]],
    ["jugar", "subjunctive.present", "nosotros", ["juguemos"]],
    ["leer", "indicative.preterite", "el", ["leyó"]],
    ["caer", "indicative.present-perfect", "yo", ["he caído"]],
    ["hacer", "indicative.preterite", "el", ["hizo"]],
    ["decir", "indicative.preterite", "el", ["dijo"]],
    [
      "conducir",
      "subjunctive.imperfect",
      "nosotros",
      ["condujéramos", "condujésemos"],
    ],
    ["morir", "indicative.present-perfect", "yo", ["he muerto"]],
    ["dormir", "subjunctive.present", "nosotros", ["durmamos"]],
    ["preferir", "subjunctive.present", "nosotros", ["prefiramos"]],
    ["mantener", "imperative.affirmative", "tu", ["mantén"]],
    ["conseguir", "progressive.present", "yo", ["estoy consiguiendo"]],
    ["vestirse", "imperative.affirmative", "vosotros", ["vestíos"]],
    ["sentarse", "imperative.affirmative", "nosotros", ["sentémonos"]],
    ["irse", "imperative.affirmative", "vosotros", ["idos", "iros"]],
    ["irse", "progressive.present", "yo", ["me estoy yendo", "estoy yéndome"]],
    [
      "vestirse",
      "progressive.present",
      "yo",
      ["me estoy vistiendo", "estoy vistiéndome"],
    ],
  ]
  for (const [id, category, person, answers] of anchors)
    assert.deepEqual(
      verb(id).conjugations[category][person],
      answers,
      `${id}:${category}:${person}`,
    )
  assert.equal(catalogue.verbs.filter((entry) => entry.common).length, 25)
  assert.equal(
    [...verbs.values()].filter((entry) => entry.tags.includes("reflexive"))
      .length,
    10,
  )
})
