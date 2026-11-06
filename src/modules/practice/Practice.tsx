import {
  retryableSubmission,
  submissionFor,
  submitTrackedAnswer,
} from "../learning-data/index.ts"
import type { TrackingContext } from "../learning-data/index.ts"
import type { SessionAction } from "./session.ts"
import { useEffect, useRef, useState, useReducer } from "react"
import { useBlocker } from "react-router"
import { CATEGORIES, PERSONS } from "../verb-catalogue/index.ts"
import type { PracticeConfig, Question } from "./session.ts"
import { initialSession, sessionReducer, sessionScore } from "./session.ts"
import { ChoiceAnswer } from "./ChoiceAnswer.tsx"
import { PracticeSetup } from "./PracticeSetup.tsx"

function LeavePrompt({
  onStay,
  onLeave,
}: {
  onStay: () => void
  onLeave: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const element = dialog.current
    element?.showModal()
    return () => element?.close()
  }, [])
  return (
    <dialog
      ref={dialog}
      aria-labelledby="leave-title"
      onCancel={(event) => {
        event.preventDefault()
        onStay()
      }}
    >
      <h2 id="leave-title">Leave this practice?</h2>
      <p>
        This practice cannot be resumed. Acknowledged answers stay in account
        progress. An unfinished practice has no History entry; a submitted final
        answer may already have completed it.
      </p>
      <div className="selection-actions">
        <button onClick={onStay} autoFocus>
          Keep practising
        </button>
        <button onClick={onLeave}>Leave practice</button>
      </div>
    </dialog>
  )
}

function PracticeSession({
  questions,
  config,
  storageNotice,
  tracking,
  onReset,
}: {
  questions: Question[]
  config: PracticeConfig
  storageNotice: string | null
  tracking: TrackingContext | null
  onReset: () => void
}) {
  const [state, dispatch] = useReducer(
    sessionReducer,
    initialSession(questions, config.accentPolicy),
  )
  const active = useRef(true)
  const busy = useRef(false)
  const pending = useRef<{
    action: SessionAction
    request: ReturnType<typeof retryableSubmission>
  } | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  useEffect(() => {
    active.current = true
    return () => {
      active.current = false
    }
  }, [])
  useEffect(() => {
    if (state.phase === "complete") return
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [state.phase])
  const [text, setText] = useState("")
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [leaving, setLeaving] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const next = useRef<HTMLButtonElement>(null)
  const resultsHeading = useRef<HTMLHeadingElement>(null)
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      state.phase !== "complete" &&
      currentLocation.pathname !== nextLocation.pathname,
  )
  useEffect(() => {
    if (state.phase === "question") input.current?.focus()
    if (state.phase === "feedback") next.current?.focus()
    if (state.phase === "complete") resultsHeading.current?.focus()
  }, [state.phase, state.index])

  function advance() {
    setText("")
    setSelectedIndex(null)
    dispatch({ type: "next" })
  }
  function insertCharacter(character: string) {
    if (state.phase !== "question") return
    const start = input.current?.selectionStart ?? text.length
    const end = input.current?.selectionEnd ?? start
    setText(text.slice(0, start) + character + text.slice(end))
    requestAnimationFrame(() => {
      input.current?.focus()
      input.current?.setSelectionRange(start + 1, start + 1)
    })
  }
  async function savePending() {
    if (!pending.current || busy.current) return
    busy.current = true
    setSaving(true)
    setSaveError(null)
    const current = pending.current
    try {
      await current.request.send()
      if (!active.current) return
      pending.current = null
      dispatch(current.action)
    } catch (reason: unknown) {
      if (active.current)
        setSaveError(
          reason instanceof Error
            ? reason.message
            : "Could not save your answer. Retry.",
        )
    } finally {
      busy.current = false
      if (active.current) setSaving(false)
    }
  }
  function submit() {
    if (state.phase !== "question" || pending.current || busy.current) return
    const action: SessionAction =
      config.mode === "choice"
        ? { type: "submit-choice", index: selectedIndex ?? -1 }
        : { type: "submit", text }
    const proposed = sessionReducer(state, action)
    if (proposed === state) return
    if (!tracking) {
      dispatch(action)
      return
    }
    pending.current = {
      action,
      request: retryableSubmission(
        submissionFor(
          tracking.runId,
          state.index + 1,
          proposed.results[proposed.results.length - 1],
        ),
        submitTrackedAnswer,
      ),
    }
    void savePending()
  }
  const modeLabel = config.mode === "choice" ? "Multiple-choice" : "Typing"
  const policyLabel =
    config.mode === "choice"
      ? "Choose one answer"
      : config.accentPolicy === "strict"
        ? "Accents required"
        : "Accents ignored"
  const score = sessionScore(state.results)
  const question = state.questions[state.index]
  const category = CATEGORIES.find((item) => item.id === question.category)
  const result = state.results[state.results.length - 1]
  useEffect(() => {
    if (
      state.phase !== "feedback" ||
      !result?.correct ||
      leaving ||
      blocker.state === "blocked"
    )
      return
    const timer = window.setTimeout(() => {
      setText("")
      setSelectedIndex(null)
      dispatch({ type: "auto-next", index: state.index })
    }, 650)
    return () => window.clearTimeout(timer)
  }, [state.phase, state.index, result?.correct, leaving, blocker.state])

  return (
    <section
      className="page-section typing-session"
      aria-labelledby="session-title"
      onKeyDown={(event) => {
        if (event.nativeEvent.isComposing) {
          if (event.key === "Enter") event.preventDefault()
          return
        }
        if (
          (event.key === "Enter" ||
            (state.phase === "feedback" && event.key === " ")) &&
          event.repeat
        ) {
          event.preventDefault()
          return
        }
        if (
          state.phase === "feedback" &&
          event.key === " " &&
          event.target === next.current
        ) {
          event.preventDefault()
          advance()
        }
      }}
    >
      {storageNotice && (
        <p className="field-note" role="status">
          {storageNotice}
        </p>
      )}
      {blocker.state === "blocked" || leaving ? (
        <LeavePrompt
          onStay={() => {
            if (blocker.state === "blocked") blocker.reset()
            setLeaving(false)
          }}
          onLeave={() => {
            if (blocker.state === "blocked") blocker.proceed()
            else onReset()
          }}
        />
      ) : null}
      {state.phase === "complete" ? (
        <>
          <h1 id="session-title" ref={resultsHeading} tabIndex={-1}>
            Practice complete
          </h1>
          <p className="final-score">{score.percentage}%</p>
          <p>
            {score.correct} correct · {score.incorrect} incorrect ·{" "}
            {score.total} answered
          </p>
          <p className="field-note">
            {modeLabel}
            {config.mode === "typing" ? ` · ${policyLabel}` : ""}. Practice
            {tracking
              ? "results saved to your account."
              : "results are not saved in guest mode."}
          </p>
          {score.incorrect ? (
            <>
              <h2>Mistakes</h2>
              <ol className="mistake-list">
                {state.results
                  .filter((answer) => !answer.correct)
                  .map((answer) => {
                    const tense = CATEGORIES.find(
                      (item) => item.id === answer.question.category,
                    )
                    return (
                      <li key={answer.question.id}>
                        <p lang="es">
                          <strong>{answer.question.infinitive}</strong> ·{" "}
                          {tense?.group} · {tense?.label} ·{" "}
                          {PERSONS[answer.question.person]}
                        </p>
                        <p>
                          Your answer: <span lang="es">{answer.text}</span>
                        </p>
                        <p>
                          Accepted:{" "}
                          <span lang="es">
                            {answer.question.answers.join(" / ")}
                          </span>
                        </p>
                      </li>
                    )
                  })}
              </ol>
            </>
          ) : (
            <p>No mistakes.</p>
          )}
          <button className="primary-button" onClick={onReset}>
            New practice
          </button>
        </>
      ) : (
        <>
          <div className="session-heading">
            <h1 id="session-title">{modeLabel} practice</h1>
            <button onClick={() => setLeaving(true)}>End practice</button>
          </div>
          <p className="field-note">
            Question {state.index + 1} of {state.questions.length} ·{" "}
            {policyLabel}
          </p>
          <div className="question-prompt">
            <h2>
              Conjugate{" "}
              <strong className="prompt-verb" lang="es">
                {question.infinitive}
              </strong>{" "}
              in{" "}
              <span className="prompt-tense" lang="es">
                {category?.group} · {category?.label}
              </span>
              .
            </h2>
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              submit()
            }}
          >
            {question.options ? (
              <ChoiceAnswer
                person={PERSONS[question.person]}
                options={question.options}
                selectedIndex={selectedIndex}
                disabled={state.phase === "feedback" || saving || !!saveError}
                inputRef={input}
                onSelect={setSelectedIndex}
                onSubmit={submit}
              />
            ) : (
              <>
                <div className="typed-answer-row">
                  <label
                    className="answer-label"
                    htmlFor="typed-answer"
                    lang="es"
                  >
                    {PERSONS[question.person]}:
                  </label>
                  <input
                    id="typed-answer"
                    ref={input}
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    disabled={
                      state.phase === "feedback" || saving || !!saveError
                    }
                    maxLength={2000}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    aria-describedby="answer-help"
                  />
                </div>
                <p id="answer-help" className="field-note">
                  Include required reflexive pronouns or “no”, but omit the
                  subject pronoun.
                </p>
              </>
            )}
            {state.phase === "question" && !saving && !saveError && (
              <>
                {config.mode === "typing" && (
                  <div className="accent-keys" aria-label="Spanish characters">
                    {["á", "é", "í", "ó", "ú", "ñ", "ü"].map((character) => (
                      <button
                        key={character}
                        type="button"
                        aria-label={`Insert ${character}`}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => insertCharacter(character)}
                      >
                        {character}
                      </button>
                    ))}
                  </div>
                )}
                <button
                  type="submit"
                  className="primary-button"
                  disabled={
                    config.mode === "choice"
                      ? selectedIndex === null
                      : !text.trim()
                  }
                >
                  Submit <span className="key-hint">Enter</span>
                </button>
              </>
            )}
          </form>
          {saving && (
            <p role="status">
              Saving answer… Waiting for acknowledgement before continuing.
            </p>
          )}
          {saveError && (
            <div role="alert">
              <p>{saveError}</p>
              <p>
                Your answer stays locked so retry sends the same submission. If
                you leave now, a lost reply may still have been saved.
              </p>
              <button
                className="primary-button"
                onClick={() => {
                  void savePending()
                }}
              >
                Retry save
              </button>
            </div>
          )}
          {state.phase === "feedback" && (
            <div className="answer-feedback" role="status">
              <h2>{result.correct ? "Correct" : "Incorrect"}</h2>
              <p>
                Accepted: <span lang="es">{question.answers.join(" / ")}</span>
              </p>
              {result.correct ? (
                <p className="field-note">
                  {state.index === state.questions.length - 1
                    ? "Finishing practice…"
                    : "Next question…"}
                </p>
              ) : (
                <button
                  type="button"
                  className="primary-button"
                  ref={next}
                  onClick={advance}
                >
                  {state.index === state.questions.length - 1
                    ? "See results"
                    : "Next"}{" "}
                  <span className="key-hint">Space</span>
                </button>
              )}
            </div>
          )}
        </>
      )}
    </section>
  )
}

export function Practice() {
  const [session, setSession] = useState<{
    questions: Question[]
    config: PracticeConfig
    storageNotice: string | null
    tracking: TrackingContext | null
  } | null>(null)
  return session ? (
    <PracticeSession
      questions={session.questions}
      config={session.config}
      storageNotice={session.storageNotice}
      tracking={session.tracking}
      onReset={() => {
        setSession(null)
        window.scrollTo(0, 0)
      }}
    />
  ) : (
    <PracticeSetup
      onStart={(questions, config, storageNotice, tracking) => {
        setSession({ questions, config, storageNotice, tracking })
        window.scrollTo(0, 0)
      }}
    />
  )
}
