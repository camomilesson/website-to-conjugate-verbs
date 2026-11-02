import type {
  ConjugationSet,
  ImperativeConjugationSet,
  Indicativo,
  Perfecto,
  Progresivo,
  Subjuntivo,
  PerfectoSubjuntivo,
  Imperativo,
  Verb,
} from "./verb.ts"

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every((item: unknown) => typeof item === "string")
  )
}

function isConjugationSet(value: unknown): value is ConjugationSet {
  return (
    isObject(value) &&
    isStringArray(value.yo) &&
    isStringArray(value.tú) &&
    isStringArray(value["él/ella/usted"]) &&
    isStringArray(value.nosotros) &&
    isStringArray(value.vosotros) &&
    isStringArray(value["ellos/ellas/ustedes"])
  )
}

function isImperativeConjugationSet(
  value: unknown,
): value is ImperativeConjugationSet {
  return (
    isObject(value) &&
    isStringArray(value.tú) &&
    isStringArray(value.usted) &&
    isStringArray(value.nosotros) &&
    isStringArray(value.vosotros) &&
    isStringArray(value.ustedes)
  )
}

function isIndicativo(value: unknown): value is Indicativo {
  return (
    isObject(value) &&
    isConjugationSet(value.presente) &&
    isConjugationSet(value.preterito) &&
    isConjugationSet(value.imperfecto) &&
    isConjugationSet(value.futuro) &&
    isConjugationSet(value.condicional)
  )
}

function isPerfecto(value: unknown): value is Perfecto {
  return (
    isObject(value) &&
    isConjugationSet(value.presente) &&
    isConjugationSet(value.preterito) &&
    isConjugationSet(value.pasado) &&
    isConjugationSet(value.futuro) &&
    isConjugationSet(value.condicional)
  )
}

function isProgresivo(value: unknown): value is Progresivo {
  return (
    isObject(value) &&
    isConjugationSet(value.presente) &&
    isConjugationSet(value.preterito) &&
    isConjugationSet(value.imperfecto) &&
    isConjugationSet(value.futuro) &&
    isConjugationSet(value.condicional)
  )
}

function isSubjuntivo(value: unknown): value is Subjuntivo {
  return (
    isObject(value) &&
    isConjugationSet(value.presente) &&
    isConjugationSet(value.imperfecto) &&
    isConjugationSet(value.imperfecto2) &&
    isConjugationSet(value.futuro)
  )
}

function isPerfectoSubjuntivo(value: unknown): value is PerfectoSubjuntivo {
  return (
    isObject(value) &&
    isConjugationSet(value.presente) &&
    isConjugationSet(value.pasado) &&
    isConjugationSet(value.futuro)
  )
}

function isImperativo(value: unknown): value is Imperativo {
  return (
    isObject(value) &&
    isImperativeConjugationSet(value.afirmativo) &&
    isImperativeConjugationSet(value.negativo)
  )
}

export function isVerb(value: unknown): value is Verb {
  return (
    isObject(value) &&
    typeof value.verbo === "string" &&
    (value.meaning === undefined || typeof value.meaning === "string") &&
    isIndicativo(value.indicativo) &&
    isPerfecto(value.perfecto) &&
    isProgresivo(value.progresivo) &&
    isSubjuntivo(value.subjuntivo) &&
    isPerfectoSubjuntivo(value.perfecto_subjuntivo) &&
    isImperativo(value.imperativo)
  )
}

export function loadVerb(text: string): Verb {
  const data: unknown = JSON.parse(text)

  if (!isVerb(data)) {
    throw new Error(
      "Invalid verb data: expected verbo, all conjugation tables with string arrays, and an optional string meaning.",
    )
  }

  return data
}
