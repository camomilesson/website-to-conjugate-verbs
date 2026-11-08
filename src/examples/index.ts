import "./practice-answers.ts"
import "./practice-session.ts"

import { readFileSync } from "node:fs"
import { loadVerb } from "@conjugadora/verb-catalogue"
import "./guard-examples.ts"

const savedVerb = readFileSync(
  new URL(
    "../../packages/verb-catalogue/src/data/hablar.json",
    import.meta.url,
  ),
  "utf8",
)
const hablar = loadVerb(savedVerb)
const presentYo = hablar.indicativo.presente.yo[0]

console.log(`Verbo: ${hablar.verbo}`)
console.log(`Presente de indicativo, yo: ${presentYo}`)
console.log(`Futuro perfecto, yo: ${hablar.perfecto.futuro.yo[0]}`)
console.log(`Imperativo afirmativo, tú: ${hablar.imperativo.afirmativo.tú[0]}`)
