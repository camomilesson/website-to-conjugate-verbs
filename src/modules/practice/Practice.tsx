import { useAuth } from "../auth/ui.ts"
import { useLearningGeneration } from "../account-controls/index.ts"
import {
  practiceMetadata,
  readCounts,
  startTrackedPractice,
} from "../learning-data/index.ts"
import { isTargetedVerbSet } from "../practice-preferences/index.ts"
import { resolveVerbSelection } from "./targeted.ts"
import { loadCatalogueVerb } from "@conjugadora/verb-catalogue"
import { TenseHint } from "./TenseHint.tsx"
import { shouldConfirmPracticeLeave } from "./navigation.ts"
import {
  retryableSubmission,
  submissionFor,
  submitTrackedAnswer,
} from "../learning-data/index.ts"
import type { TrackingContext } from "../learning-data/index.ts"
import { createSaveQueue } from "./save-queue.ts"
import type { SessionAction } from "./session.ts"
import { useEffect, useRef, useState, useReducer } from "react"
import { Link, useBlocker } from "react-router"
import { CATEGORIES, PERSONS } from "@conjugadora/verb-catalogue"
import type { PracticeConfig, PracticeSource, Question } from "./session.ts"
import {
  createQuestions,
  initialSession,
  sessionReducer,
  sessionScore,
} from "./session.ts"
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
        answer may already have completed it. Answers still waiting to be sent
        may be lost if you leave.
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
  source,
  onRepeat,
}: {
  questions: Question[]
  config: PracticeConfig
  storageNotice: string | null
  tracking: TrackingContext | null
  onReset: () => void
  source: PracticeSource
  onRepeat: (
    questions: Question[],
    tracking: TrackingContext | null,
    config: PracticeConfig,
    source: PracticeSource,
  ) => void
}) {
  const [state, dispatch] = useReducer(
    sessionReducer,
    initialSession(questions, config.accentPolicy),
  )
  const auth = useAuth()
  const learning = useLearningGeneration()
  const repeating = useRef(false)
  const [repeatLoading, setRepeatLoading] = useState(false)
  const [repeatError, setRepeatError] = useState<string | null>(null)
  async function repeatPractice() {
    if (repeating.current || saveQueue.snapshot().pending > 0) return
    repeating.current = true
    setRepeatLoading(true)
    setRepeatError(null)
    try {
      let nextConfig = config
      let nextSource = source
      if (isTargetedVerbSet(source.preferences.verbSet)) {
        if (!auth.user || !source.catalogue)
          throw new Error("Sign in again to refresh this selection.")
        const resolved = resolveVerbSelection(
          source.catalogue,
          await readCounts(auth.user.id),
          source.preferences,
        )
        if (!active.current) return
        const verbs = await Promise.all(
          source.catalogue.verbs
            .filter((verb) => resolved.preferences.verbIds.includes(verb.id))
            .map((verb) => loadCatalogueVerb(verb, source.datasetVersion)),
        )
        nextConfig = { ...config, verbIds: [...resolved.preferences.verbIds] }
        nextSource = {
          ...source,
          verbs,
          preferences: resolved.preferences,
          preferredPairs: resolved.preferredPairs,
        }
      }
      if (!active.current) return
      const questions = createQuestions(
        nextSource.verbs,
        nextConfig,
        Math.random,
        new Set(nextSource.preferredPairs),
      )
      if (auth.user && !learning.generation)
        throw new Error("Account data is still loading. Try again.")
      const tracking = auth.user
        ? await startTrackedPractice(
            auth.user.id,
            practiceMetadata(nextConfig, nextSource.preferences),
            source.datasetVersion,
            questions.length,
            learning.generation!,
          )
        : null
      if (active.current) onRepeat(questions, tracking, nextConfig, nextSource)
    } catch (reason: unknown) {
      if (active.current)
        setRepeatError(
          reason instanceof Error
            ? reason.message
            : "Could not repeat practice. Try again.",
        )
    } finally {
      repeating.current = false
      if (active.current) setRepeatLoading(false)
    }
  }
  const active = useRef(true)
  const [saveQueue] = useState(createSaveQueue)
  const [saveState, setSaveState] = useState(saveQueue.snapshot)
  const submittedIndex = useRef(-1)
  const saveError = saveState.error
  const unsaved = saveState.pending > 0
  useEffect(() => saveQueue.subscribe(setSaveState), [saveQueue])
  useEffect(() => {
    active.current = true
    return () => {
      active.current = false
    }
  }, [])
  useEffect(() => {
    if (state.phase === "complete" && !unsaved) return
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [state.phase, unsaved])
  const [text, setText] = useState("")
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [leaving, setLeaving] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const next = useRef<HTMLButtonElement>(null)
  const retrySave = useRef<HTMLButtonElement>(null)
  const resultsHeading = useRef<HTMLHeadingElement>(null)
  const blocker = useBlocker(({ currentLocation, nextLocation }) =>
    shouldConfirmPracticeLeave(
      unsaved ? "feedback" : state.phase,
      currentLocation,
      nextLocation,
    ),
  )
  useEffect(() => {
    if (saveError) {
      retrySave.current?.focus()
      return
    }
    if (state.phase === "question") input.current?.focus()
    if (state.phase === "feedback") next.current?.focus()
    if (state.phase === "complete") resultsHeading.current?.focus()
  }, [state.phase, state.index, saveError])

  function advance() {
    if (saveQueue.snapshot().error) return
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
  function submit() {
    if (
      state.phase !== "question" ||
      saveQueue.snapshot().error ||
      submittedIndex.current === state.index
    )
      return
    const action: SessionAction =
      config.mode === "choice"
        ? { type: "submit-choice", index: selectedIndex ?? -1 }
        : { type: "submit", text }
    const proposed = sessionReducer(state, action)
    if (proposed === state) return
    submittedIndex.current = state.index
    if (tracking) {
      saveQueue.enqueue(
        retryableSubmission(
          submissionFor(
            tracking.runId,
            state.index + 1,
            proposed.results[proposed.results.length - 1],
          ),
          submitTrackedAnswer,
        ),
      )
    }
    dispatch(action)
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
  const result = state.results[state.results.length - 1]
  useEffect(() => {
    if (
      state.phase !== "feedback" ||
      !result?.correct ||
      saveError ||
      leaving ||
      blocker.state === "blocked"
    )
      return
    const timer = window.setTimeout(() => {
      if (saveQueue.snapshot().error) return
      setText("")
      setSelectedIndex(null)
      dispatch({ type: "auto-next", index: state.index })
    }, 650)
    return () => window.clearTimeout(timer)
  }, [
    state.phase,
    state.index,
    result?.correct,
    leaving,
    blocker.state,
    saveError,
    saveQueue,
  ])

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
          state.phase === "complete" &&
          event.key === "Enter" &&
          event.target === resultsHeading.current
        ) {
          event.preventDefault()
          void repeatPractice()
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
      {unsaved && !saveError && (
        <p className="field-note" role="status">
          Saving progress… {saveState.pending}{" "}
          {saveState.pending === 1 ? "answer" : "answers"} pending.
        </p>
      )}
      {saveError && (
        <div role="alert">
          <p>{saveError}</p>
          <p>
            Practice is paused. Your feedback is kept; retry saves the same
            answer before sending the remaining answers. Leaving may lose
            answers that have not been sent; a lost reply may already have
            saved.
          </p>
          <button
            ref={retrySave}
            className="primary-button"
            disabled={saveState.saving}
            onClick={() => saveQueue.retry()}
          >
            {saveState.saving ? "Retrying save…" : "Retry save"}
          </button>
        </div>
      )}
      {state.phase === "complete" ? (
        <>
          <h1 id="session-title" ref={resultsHeading} tabIndex={-1}>
            {unsaved ? "Practice answered" : "Practice complete"}
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
              ? unsaved
                ? "results are waiting to be saved to your account."
                : "results saved to your account."
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
                          Correct answer:{" "}
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
          {repeatError && <p role="alert">{repeatError}</p>}
          <div className="selection-actions">
            <button
              className="primary-button"
              disabled={repeatLoading || unsaved}
              onClick={() => {
                void repeatPractice()
              }}
            >
              {repeatLoading ? "Starting…" : "Repeat practice"}{" "}
              <span className="key-hint">Enter</span>
            </button>
            {!unsaved && !repeatLoading && (
              <Link className="secondary-button" to="/progress">
                View progress
              </Link>
            )}
            <button onClick={onReset} disabled={repeatLoading || unsaved}>
              New practice
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="session-heading">
            <h1 id="session-title">{modeLabel} practice</h1>
            <button onClick={() => setLeaving(true)}>End practice</button>
          </div>
          <div
            className="session-progress"
            aria-label={`Question ${state.index + 1} of ${state.questions.length}`}
          >
            <span
              style={{
                width: `${((state.index + 1) / state.questions.length) * 100}%`,
              }}
            />
          </div>
          <p className="field-note question-counter">
            Question {state.index + 1} of {state.questions.length}
            {config.mode === "choice" ? " · Choose one answer" : ""}
          </p>
          <div className="question-prompt">
            <h2>
              <strong className="prompt-verb" lang="es">
                {question.infinitive}
              </strong>{" "}
              in <TenseHint key={question.id} categoryId={question.category} />
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
                disabled={state.phase === "feedback" || !!saveError}
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
                    {PERSONS[question.person]}
                  </label>
                  <input
                    id="typed-answer"
                    ref={input}
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    disabled={state.phase === "feedback" || !!saveError}
                    maxLength={2000}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    aria-describedby="answer-help"
                  />
                </div>
                <p id="answer-help" className="field-note">
                  {policyLabel} · Include required reflexive pronouns or “no”,
                  but omit the subject pronoun.
                </p>
              </>
            )}
            {state.phase === "question" && !saveError && (
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
          {state.phase === "feedback" && (
            <div className="answer-feedback" role="status">
              <h2>{result.correct ? "Correct" : "Incorrect"}</h2>
              <p>
                {result.correct ? "Accepted:" : "Correct answer:"}{" "}
                <span lang="es">{question.answers.join(" / ")}</span>
              </p>
              {result.correct ? (
                <p className="field-note">
                  {saveError
                    ? "Retry saving to continue."
                    : state.index === state.questions.length - 1
                      ? "Finishing practice…"
                      : "Next question…"}
                </p>
              ) : (
                <button
                  type="button"
                  className="primary-button"
                  ref={next}
                  disabled={!!saveError}
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
  const [run, setRun] = useState(0)
  const [session, setSession] = useState<{
    questions: Question[]
    config: PracticeConfig
    storageNotice: string | null
    tracking: TrackingContext | null
    source: PracticeSource
  } | null>(null)
  return session ? (
    <PracticeSession
      key={run}
      source={session.source}
      onRepeat={(questions, tracking, config, source) => {
        setRun((value) => value + 1)
        setSession({ ...session, questions, tracking, config, source })
        window.scrollTo(0, 0)
      }}
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
      onStart={(questions, config, storageNotice, tracking, source) => {
        setSession({ questions, config, storageNotice, tracking, source })
        window.scrollTo(0, 0)
      }}
    />
  )
}
