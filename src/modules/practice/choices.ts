import { normaliseAnswer } from "../answer-checking/index.ts"
import type { CatalogueVerb } from "../verb-catalogue/index.ts"
import type { Question } from "./session.ts"

export function shuffled<T>(values: readonly T[], random: () => number): T[] {
  const result = [...values]
  for (let i = result.length - 1; i > 0; i--) {
    const index = Math.floor(random() * (i + 1))
    ;[result[i], result[index]] = [result[index], result[i]]
  }
  return result
}

// Use real forms of the same verb. Prefer other persons in the requested tense,
// then other tenses in the same group, then the remaining supported categories.
export function withChoices(
  question: Question,
  verb: CatalogueVerb,
  random: () => number,
): Question | null {
  const accepted = new Set(
    question.answers.map((answer) => normaliseAnswer(answer, "strict")),
  )
  const seen = new Set(accepted)
  const entries = Object.entries(verb.conjugations)
  const tiers = [
    entries.filter(([id]) => id === question.category),
    entries.filter(
      ([id]) =>
        id !== question.category &&
        id.split(".")[0] === question.category.split(".")[0],
    ),
    entries.filter(
      ([id]) => id.split(".")[0] !== question.category.split(".")[0],
    ),
  ]
  const distractors: string[] = []
  for (const tier of tiers) {
    const candidates = tier.flatMap(([, forms]) =>
      Object.values(forms).flatMap((answers) => answers ?? []),
    )
    for (const candidate of shuffled(candidates, random)) {
      const key = normaliseAnswer(candidate, "strict")
      if (seen.has(key)) continue
      seen.add(key)
      distractors.push(candidate)
      if (distractors.length === 3) break
    }
    if (distractors.length === 3) break
  }
  if (!distractors.length) return null
  const correct =
    question.answers[Math.floor(random() * question.answers.length)]
  return { ...question, options: shuffled([correct, ...distractors], random) }
}
