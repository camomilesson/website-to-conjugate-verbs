export const PERSONS = {
  yo: "yo",
  tu: "tú",
  el: "él / ella / usted",
  nosotros: "nosotros",
  vosotros: "vosotros",
  ellos: "ellos / ellas / ustedes",
  usted: "usted",
  ustedes: "ustedes",
} as const

export type PersonId = keyof typeof PERSONS
const ordinaryPersons = [
  "yo",
  "tu",
  "el",
  "nosotros",
  "vosotros",
  "ellos",
] as const
const imperativePersons = [
  "tu",
  "usted",
  "nosotros",
  "vosotros",
  "ustedes",
] as const

export const CATEGORIES = [
  {
    id: "indicative.present",
    label: "Presente",
    group: "Indicativo",
    english: "Present",
    basic: true,
  },
  {
    id: "indicative.preterite",
    label: "Pretérito perfecto simple",
    group: "Indicativo",
    english: "Preterite",
    basic: true,
  },
  {
    id: "indicative.imperfect",
    label: "Pretérito imperfecto",
    group: "Indicativo",
    english: "Imperfect",
    basic: true,
  },
  {
    id: "indicative.future",
    label: "Futuro simple",
    group: "Indicativo",
    english: "Future",
    basic: true,
  },
  {
    id: "indicative.conditional",
    label: "Condicional simple",
    group: "Indicativo",
    english: "Conditional",
    basic: true,
  },
  {
    id: "indicative.present-perfect",
    label: "Pretérito perfecto compuesto",
    group: "Indicativo",
    english: "Present perfect",
    basic: true,
  },
  {
    id: "indicative.pluperfect",
    label: "Pretérito pluscuamperfecto",
    group: "Indicativo",
    english: "Pluperfect",
    basic: false,
  },
  {
    id: "indicative.future-perfect",
    label: "Futuro compuesto",
    group: "Indicativo",
    english: "Future perfect",
    basic: false,
  },
  {
    id: "indicative.conditional-perfect",
    label: "Condicional compuesto",
    group: "Indicativo",
    english: "Conditional perfect",
    basic: false,
  },
  {
    id: "subjunctive.present",
    label: "Presente",
    group: "Subjuntivo",
    english: "Present subjunctive",
    basic: false,
  },
  {
    id: "subjunctive.imperfect",
    label: "Pretérito imperfecto",
    group: "Subjuntivo",
    english: "Imperfect subjunctive · accepts -ra and -se",
    basic: false,
  },
  {
    id: "subjunctive.present-perfect",
    label: "Pretérito perfecto compuesto",
    group: "Subjuntivo",
    english: "Present perfect subjunctive",
    basic: false,
  },
  {
    id: "subjunctive.pluperfect",
    label: "Pretérito pluscuamperfecto",
    group: "Subjuntivo",
    english: "Pluperfect subjunctive · accepts both variants",
    basic: false,
  },
  {
    id: "imperative.affirmative",
    label: "Afirmativo",
    group: "Imperativo",
    english: "Affirmative imperative",
    basic: false,
  },
  {
    id: "imperative.negative",
    label: "Negativo",
    group: "Imperativo",
    english: "Negative imperative",
    basic: false,
  },
  {
    id: "progressive.present",
    label: "Presente progresivo",
    group: "Progresivo",
    english: "Present progressive",
    basic: false,
  },
] as const

export type CategoryId = (typeof CATEGORIES)[number]["id"]
export type Preset = "basic" | "advanced" | "all"
export function getPresetCategories(preset: Preset): CategoryId[] {
  return CATEGORIES.filter(
    (category) =>
      preset === "all" ||
      (preset === "basic" ? category.basic : !category.basic),
  ).map((category) => category.id)
}
export function getCategoryPersons(
  categoryId: CategoryId,
): readonly PersonId[] {
  return categoryId.startsWith("imperative.")
    ? imperativePersons
    : ordinaryPersons
}
