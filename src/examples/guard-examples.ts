import { readFileSync } from "node:fs"
import { loadVerb } from "../modules/verb-catalogue/verb-guard.ts"

const savedVerb = readFileSync(
  new URL("../modules/verb-catalogue/data/hablar.json", import.meta.url),
  "utf8",
)
const validVerb = loadVerb(savedVerb)

function tryLoadingVerb(label: string, text: string): void {
  try {
    const verb = loadVerb(text)
    console.log(`${label}: accepted ${verb.verbo}`)
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.log(`${label}: rejected — ${error.message}`)
    } else {
      throw error
    }
  }
}

// Test cases for loadVerb
tryLoadingVerb("Without meaning", savedVerb)
tryLoadingVerb(
  "With meaning",
  JSON.stringify({ ...validVerb, meaning: "to speak" }),
)
tryLoadingVerb("Missing fields", JSON.stringify({ verbo: "hablar" }))
tryLoadingVerb(
  "Wrong conjugation type",
  JSON.stringify({
    ...validVerb,
    indicativo: {
      ...validVerb.indicativo,
      presente: { ...validVerb.indicativo.presente, yo: [123] },
    },
  }),
)
tryLoadingVerb(
  "Invalid meaning",
  JSON.stringify({ ...validVerb, meaning: 123 }),
)
tryLoadingVerb("Null data", "null")
tryLoadingVerb("Malformed JSON", "{broken")
