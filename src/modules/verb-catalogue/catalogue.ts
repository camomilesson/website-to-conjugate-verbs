import { CATEGORIES, getCategoryPersons } from "./categories.ts"
import type { CategoryId, PersonId } from "./categories.ts"

export interface CatalogueEntry {
  id: string
  infinitive: string
  meaning: string
  common?: boolean
}
export interface Catalogue {
  schemaVersion: 1
  datasetVersion: string
  verbs: CatalogueEntry[]
}
export interface CatalogueVerb extends CatalogueEntry {
  schemaVersion: 1
  datasetVersion: string
  tags: string[]
  conjugations: Record<CategoryId, Partial<Record<PersonId, string[]>>>
}

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
function nonempty(value: unknown): value is string {
  return typeof value === "string" && value.trim() === value && value.length > 0
}
function entry(value: unknown): value is CatalogueEntry {
  return (
    object(value) &&
    nonempty(value.id) &&
    /^[a-z]+$/.test(value.id) &&
    nonempty(value.infinitive) &&
    nonempty(value.meaning) &&
    (value.common === undefined || typeof value.common === "boolean")
  )
}
export function parseCatalogue(value: unknown): Catalogue {
  if (
    !object(value) ||
    value.schemaVersion !== 1 ||
    !nonempty(value.datasetVersion) ||
    !Array.isArray(value.verbs) ||
    value.verbs.length === 0 ||
    !value.verbs.every(entry)
  ) {
    throw new Error(
      "Invalid catalogue: expected version and nonempty verb entries.",
    )
  }
  if (new Set(value.verbs.map((verb) => verb.id)).size !== value.verbs.length)
    throw new Error("Duplicate verb IDs in catalogue.")
  return {
    schemaVersion: 1,
    datasetVersion: value.datasetVersion,
    verbs: value.verbs,
  }
}
export function parseCatalogueVerb(value: unknown): CatalogueVerb {
  if (
    !entry(value) ||
    !object(value) ||
    value.schemaVersion !== 1 ||
    !nonempty(value.datasetVersion) ||
    !Array.isArray(value.tags) ||
    !value.tags.every(nonempty) ||
    !object(value.conjugations)
  ) {
    throw new Error("Invalid verb metadata or conjugation tables.")
  }
  const tables = value.conjugations
  if (Object.keys(tables).length !== CATEGORIES.length)
    throw new Error(`Invalid category coverage for ${value.id}.`)
  for (const category of CATEGORIES) {
    const forms = tables[category.id]
    const persons = getCategoryPersons(category.id)
    if (!object(forms) || Object.keys(forms).length !== persons.length)
      throw new Error(`Invalid persons for ${value.id}: ${category.id}.`)
    for (const person of persons) {
      const answers = forms[person]
      if (
        !Array.isArray(answers) ||
        answers.length === 0 ||
        !answers.every(nonempty) ||
        new Set(answers).size !== answers.length
      )
        throw new Error(
          `Invalid answers for ${value.id}: ${category.id}: ${person}.`,
        )
    }
  }
  // Every registry category/person and every answer has been checked above.
  return value as unknown as CatalogueVerb
}

export async function loadCatalogue(signal?: AbortSignal): Promise<Catalogue> {
  const response = await fetch("/data/catalogue.json", { signal })
  if (!response.ok)
    throw new Error(`Could not load the verb catalogue (${response.status}).`)
  const data: unknown = await response.json()
  return parseCatalogue(data)
}
export async function loadCatalogueVerb(
  verb: CatalogueEntry,
  datasetVersion: string,
  signal?: AbortSignal,
): Promise<CatalogueVerb> {
  if (!/^[a-z]+$/.test(verb.id)) throw new Error("Invalid verb ID.")
  const response = await fetch(`/data/verbs/${verb.id}.json`, { signal })
  if (!response.ok)
    throw new Error(`Could not load ${verb.infinitive} (${response.status}).`)
  const data: unknown = await response.json()
  const loaded = parseCatalogueVerb(data)
  if (
    loaded.id !== verb.id ||
    loaded.infinitive !== verb.infinitive ||
    loaded.meaning !== verb.meaning ||
    loaded.datasetVersion !== datasetVersion
  )
    throw new Error(
      "Catalogue and verb data do not match. Reload and try again.",
    )
  return loaded
}
