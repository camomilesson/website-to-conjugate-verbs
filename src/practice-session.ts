type ResultKind = "correct" | "incorrect" | "skipped"

class PracticeSession {
  private counts: Record<ResultKind, number> = {
    correct: 0,
    incorrect: 0,
    skipped: 0,
  }

  recordResult(kind: ResultKind): void {
    this.counts[kind] += 1
  }

  reset(): void {
    this.counts = {
      correct: 0,
      incorrect: 0,
      skipped: 0,
    }
  }

  getResults(): Record<ResultKind, number> {
    return { ...this.counts }
  }
}

// Example usage

const session = new PracticeSession()

session.recordResult("correct")
session.recordResult("correct")
session.recordResult("incorrect")
session.recordResult("skipped")

console.log("Practice results:", session.getResults())

session.reset()

console.log("After reset:", session.getResults())
