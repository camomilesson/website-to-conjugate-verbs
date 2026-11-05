import "./practice-answers.ts"
import "./practice-session.ts"

import { readFileSync } from "node:fs"
import { loadVerb } from "../modules/verb-catalogue/verb-guard.ts"
import "./guard-examples.ts"

const savedVerb = readFileSync(
  new URL("../modules/verb-catalogue/data/hablar.json", import.meta.url),
  "utf8",
)
const hablar = loadVerb(savedVerb)
const presentYo = hablar.indicativo.presente.yo[0]

console.log(`Verbo: ${hablar.verbo}`)
console.log(`Presente de indicativo, yo: ${presentYo}`)
console.log(`Futuro perfecto, yo: ${hablar.perfecto.futuro.yo[0]}`)
console.log(`Imperativo afirmativo, tú: ${hablar.imperativo.afirmativo.tú[0]}`)
