interface TypedAnswer {
  kind: "typed"
  text: string
}

interface ChoiceAnswer {
  kind: "choice"
  options: string[]
  selectedIndex: number
}

type PracticeAnswer = TypedAnswer | ChoiceAnswer

function getAnswerText(answer: PracticeAnswer): string {
  if (answer.kind === "typed") {
    return answer.text
  }

  if (
    !Number.isInteger(answer.selectedIndex) ||
    answer.selectedIndex < 0 ||
    answer.selectedIndex >= answer.options.length
  ) {
    throw new Error("Selected answer index must refer to an available option.")
  }

  return answer.options[answer.selectedIndex]
}

const typedAnswer: TypedAnswer = {
  kind: "typed",
  text: "hablo",
}

const choiceAnswer: ChoiceAnswer = {
  kind: "choice",
  options: ["hablas", "hablo", "habla"],
  selectedIndex: 1,
}

console.log(`Typed answer: ${getAnswerText(typedAnswer)}`)
console.log(`Choice answer: ${getAnswerText(choiceAnswer)}`)
