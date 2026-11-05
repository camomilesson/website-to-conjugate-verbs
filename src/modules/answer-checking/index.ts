export type AccentPolicy = "strict" | "relaxed"

export function normaliseAnswer(text: string, policy: AccentPolicy): string {
  const normalised = text
    .normalize("NFC")
    .trim()
    .toLocaleLowerCase("es")
    .replace(/\s+/gu, " ")
  if (policy === "strict") return normalised
  const folds: Record<string, string> = {
    á: "a",
    é: "e",
    í: "i",
    ó: "o",
    ú: "u",
    ñ: "n",
    ü: "u",
  }
  return normalised.replace(/[áéíóúñü]/gu, (letter) => folds[letter])
}

export function isCorrectAnswer(
  text: string,
  accepted: readonly string[],
  policy: AccentPolicy,
): boolean {
  if (!text.trim()) return false
  const normalised = normaliseAnswer(text, policy)
  return accepted.some(
    (answer) => normaliseAnswer(answer, policy) === normalised,
  )
}
