import { targetedVerbs } from "./targeted.ts"
import type { TargetedMode } from "./targeted.ts"
import { usePracticeCounts } from "./usePracticeCounts.ts"
import { Link } from "react-router"
import { practiceSummary, quickPreferences } from "./polish.ts"
import type {
  PracticeMode,
  PracticePreferences,
} from "../practice-preferences/index.ts"
import { useLearningGeneration } from "../account-controls/index.ts"
import { useAuth } from "../auth/ui.ts"
import {
  practiceMetadata,
  startTrackedPractice,
} from "../learning-data/index.ts"
import type { TrackingContext } from "../learning-data/index.ts"
import { useEffect, useMemo, useRef, useState } from "react"
import { loadCatalogueVerb } from "@conjugadora/verb-catalogue"
import type { CatalogueVerb } from "@conjugadora/verb-catalogue"
import {
  PreferenceFields,
  usePreferenceDraft,
} from "../practice-preferences/ui.ts"
import type { PracticeConfig, PracticeSource, Question } from "./session.ts"
import { poolSize, createQuestionPool, createQuestions } from "./session.ts"
import "./practice.css"

export function PracticeSetup({
  onStart,
}: {
  onStart: (
    questions: Question[],
    config: PracticeConfig,
    storageNotice: string | null,
    tracking: TrackingContext | null,
    source: PracticeSource,
  ) => void
}) {
  const [customizing, setCustomizing] = useState(false)
  const [startingMode, setStartingMode] = useState<PracticeMode | null>(null)
  const customizeButton = useRef<HTMLButtonElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const previousView = useRef(customizing)
  useEffect(() => {
    if (previousView.current === customizing) return
    previousView.current = customizing
    if (customizing) heading.current?.focus()
    else customizeButton.current?.focus()
  }, [customizing])
  const beforeCustomize = useRef<PracticePreferences | null>(null)
  const auth = useAuth()
  const metadata = auth.user?.user_metadata
  const displayName = [
    metadata?.given_name,
    metadata?.full_name,
    metadata?.name,
  ]
    .find(
      (value): value is string => typeof value === "string" && !!value.trim(),
    )
    ?.trim()
    .split(/\s+/)[0]
  const learning = useLearningGeneration()
  const {
    catalogue,
    preferences,
    setPreferences,
    notice,
    error,
    retry,
    save,
    isAccount,
  } = usePreferenceDraft()
  const [targeted, setTargeted] = useState<TargetedMode | null>(null)
  const progress = usePracticeCounts(customizing && !!auth.user)
  const ranked = useMemo(
    () =>
      catalogue && preferences && targeted && progress.counts
        ? targetedVerbs(catalogue, progress.counts, preferences, targeted)
        : [],
    [catalogue, preferences, targeted, progress.counts],
  )
  const effectivePreferences =
    preferences && targeted
      ? {
          ...preferences,
          verbIds: ranked.map((row) => row.verb.id),
          verbSet: "select" as const,
        }
      : preferences
  const selectedVerbs = useMemo(
    () => effectivePreferences?.verbIds ?? [],
    [preferences?.verbIds, targeted, ranked],
  )
  const targetedUnavailable =
    !!targeted && (!progress.counts || !!progress.error || !ranked.length)
  const selectedCategories = preferences?.categories ?? []
  const selectedPersons = preferences?.persons ?? []
  const mode = preferences?.mode ?? "typing"
  const length = preferences?.length ?? "20"
  const strict = preferences?.accentPolicy !== "relaxed"
  const [choiceData, setChoiceData] = useState<{
    key: string
    verbs?: CatalogueVerb[]
    error?: string
  } | null>(null)
  const [choiceAttempt, setChoiceAttempt] = useState(0)
  const choiceKey = JSON.stringify([catalogue?.datasetVersion, selectedVerbs])
  useEffect(() => {
    if (
      !customizing ||
      mode !== "choice" ||
      !catalogue ||
      !selectedVerbs.length
    )
      return
    const controller = new AbortController()
    void Promise.all(
      catalogue.verbs
        .filter((verb) => selectedVerbs.includes(verb.id))
        .map((verb) =>
          loadCatalogueVerb(verb, catalogue.datasetVersion, controller.signal),
        ),
    )
      .then((verbs) => {
        if (!controller.signal.aborted) setChoiceData({ key: choiceKey, verbs })
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted)
          setChoiceData({
            key: choiceKey,
            error:
              reason instanceof Error
                ? reason.message
                : "Could not prepare answer options.",
          })
      })
    return () => controller.abort()
  }, [catalogue, selectedVerbs, mode, choiceKey, choiceAttempt, customizing])
  const [loading, setLoading] = useState(false)
  const [startError, setStartError] = useState("")
  const startController = useRef<AbortController | null>(null)
  useEffect(() => () => startController.current?.abort(), [])

  const currentChoiceData = choiceData?.key === choiceKey ? choiceData : null
  const choiceLoading =
    customizing &&
    mode === "choice" &&
    selectedVerbs.length > 0 &&
    !currentChoiceData
  const selectedPoolSize = poolSize(
    selectedVerbs.length,
    selectedCategories,
    selectedPersons,
  )
  const available = useMemo(
    () =>
      mode === "choice"
        ? createQuestionPool(
            currentChoiceData?.verbs ?? [],
            {
              mode,
              verbIds: selectedVerbs,
              categories: selectedCategories,
              persons: selectedPersons,
              length: 1,
              accentPolicy: "strict",
            },
            () => 0.5,
          ).length
        : selectedPoolSize,
    [
      mode,
      currentChoiceData?.verbs,
      selectedVerbs,
      selectedCategories,
      selectedPersons,
      selectedPoolSize,
    ],
  )
  const validLength = Number.isSafeInteger(Number(length)) && Number(length) > 0
  async function start(targetMode: PracticeMode = mode) {
    if (
      targetedUnavailable ||
      (auth.user && !learning.generation) ||
      !catalogue ||
      !preferences ||
      loading ||
      startController.current ||
      (customizing && choiceLoading) ||
      !selectedPoolSize ||
      !validLength
    )
      return
    const snapshot = quickPreferences(effectivePreferences!, targetMode)
    const config: PracticeConfig = {
      mode: targetMode,
      verbIds: [...selectedVerbs],
      categories: [...selectedCategories],
      persons: [...selectedPersons],
      length: Number(length),
      accentPolicy: targetMode === "choice" || strict ? "strict" : "relaxed",
    }
    const controller = new AbortController()
    startController.current = controller
    setLoading(true)
    setStartingMode(targetMode)
    setStartError("")
    try {
      const verbs =
        targetMode === "choice" && currentChoiceData?.verbs
          ? currentChoiceData.verbs
          : await Promise.all(
              catalogue.verbs
                .filter((verb) => config.verbIds.includes(verb.id))
                .map((verb) =>
                  loadCatalogueVerb(
                    verb,
                    catalogue.datasetVersion,
                    controller.signal,
                  ),
                ),
            )
      if (!controller.signal.aborted) {
        const preferredPairs =
          targeted === "least-practiced"
            ? ranked.flatMap((row) =>
                row.unattempted.map((category) => `${row.verb.id}:${category}`),
              )
            : []
        const questions = createQuestions(
          verbs,
          config,
          Math.random,
          new Set(preferredPairs),
        )
        const tracking = auth.user
          ? await startTrackedPractice(
              auth.user.id,
              practiceMetadata(config, snapshot),
              catalogue.datasetVersion,
              questions.length,
              learning.generation!,
            )
          : null
        if (controller.signal.aborted) return
        const storageNotice = await save(
          quickPreferences(preferences, targetMode),
        )
        if (controller.signal.aborted) return
        if (isAccount && storageNotice) throw new Error(storageNotice)
        onStart(questions, config, storageNotice, tracking, {
          verbs,
          datasetVersion: catalogue.datasetVersion,
          preferences: snapshot,
          preferredPairs,
        })
      }
    } catch (reason: unknown) {
      if (!controller.signal.aborted)
        setStartError(
          reason instanceof Error
            ? reason.message
            : "Could not load selected verbs. Try again.",
        )
    } finally {
      if (!controller.signal.aborted) {
        startController.current = null
        setLoading(false)
        setStartingMode(null)
      }
    }
  }

  return (
    <section
      className={`page-section setup-page${customizing ? "" : " practice-home"}`}
      aria-labelledby="practice-title"
    >
      {!customizing && (
        <>
          {auth.status === "signed-in" && (
            <p className="practice-greeting">
              {displayName ? `Hello, ${displayName}.` : "Welcome back."}
            </p>
          )}
          <p className="eyebrow">A FEW MINUTES. A LITTLE MORE FLUENT.</p>
        </>
      )}
      <h1 id="practice-title" ref={heading} tabIndex={-1}>
        {customizing ? (
          "Customize practice"
        ) : (
          <>
            Make conjugation
            <br />
            <em>second nature.</em>
          </>
        )}
      </h1>
      {error ? (
        <div role="alert">
          <p>{error}</p>
          <button onClick={retry}>Retry catalogue</button>
        </div>
      ) : !catalogue || !preferences ? (
        <p role="status">Loading preferences…</p>
      ) : (
        <>
          {!customizing ? (
            <>
              <p className="practice-intro">
                Less translating in your head. More knowing what comes next.
              </p>
              <div className="saved-setup">
                <span className="eyebrow">YOUR CURRENT SETUP</span>
                <p className="quick-summary">{practiceSummary(preferences)}</p>
                <p className="field-note">
                  Typing:{" "}
                  {preferences.accentPolicy === "strict"
                    ? "accents required"
                    : "accents ignored"}
                  .
                </p>
              </div>
              <div className="quick-practice-actions">
                <button
                  className="practice-card choice-card"
                  aria-label="Multiple-choice practice"
                  disabled={loading || learning.loading || !!learning.error}
                  onClick={() => {
                    void start("choice")
                  }}
                >
                  <span className="card-topline">
                    <span>01 / RECOGNIZE</span>
                    <span aria-hidden="true">↗</span>
                  </span>
                  <span className="card-art choice-art" aria-hidden="true">
                    <span>a</span>
                    <span>á</span>
                    <span>a</span>
                  </span>
                  <strong>
                    {loading && startingMode === "choice"
                      ? "Starting…"
                      : "Multiple choice"}
                  </strong>
                  <span className="card-description">
                    Find the right form. Build your instinct.
                  </span>
                  <span className="card-action">
                    Start practice <span aria-hidden="true">→</span>
                  </span>
                </button>
                <button
                  className="practice-card typing-card"
                  aria-label="Typing practice"
                  disabled={loading || learning.loading || !!learning.error}
                  onClick={() => {
                    void start("typing")
                  }}
                >
                  <span className="card-topline">
                    <span>02 / RECALL</span>
                    <span aria-hidden="true">↗</span>
                  </span>
                  <span className="card-art typing-art" aria-hidden="true">
                    habl<span>o</span>
                    <i />
                  </span>
                  <strong>
                    {loading && startingMode === "typing"
                      ? "Starting…"
                      : "Typing"}
                  </strong>
                  <span className="card-description">
                    Make it come to you. Write the answer.
                  </span>
                  <span className="card-action">
                    Start practice <span aria-hidden="true">→</span>
                  </span>
                </button>
                <button
                  className="customize-action"
                  ref={customizeButton}
                  disabled={loading}
                  onClick={() => {
                    beforeCustomize.current = structuredClone(preferences)
                    setCustomizing(true)
                    setStartError("")
                  }}
                >
                  Customize practice <span aria-hidden="true">↗</span>
                </button>
              </div>
              {!isAccount && (
                <p className="field-note guest-progress-prompt">
                  <Link to="/settings">
                    Sign in with Google to track progress
                  </Link>
                </p>
              )}
            </>
          ) : (
            <>
              <PreferenceFields
                catalogue={catalogue}
                value={effectivePreferences!}
                targeted={!!targeted}
                onManualVerbs={() => setTargeted(null)}
                verbActions={
                  auth.user ? (
                    <div className="targeted-selection">
                      <div className="selection-actions">
                        <button
                          disabled={!progress.counts || !!progress.error}
                          aria-pressed={targeted === "least-practiced"}
                          onClick={() => setTargeted("least-practiced")}
                        >
                          Least practiced
                        </button>
                        <button
                          disabled={!progress.counts || !!progress.error}
                          aria-pressed={targeted === "most-mistakes"}
                          onClick={() => setTargeted("most-mistakes")}
                        >
                          Most mistakes
                        </button>
                      </div>
                      {!progress.counts && !progress.error && (
                        <p className="field-note" role="status">
                          Loading progress-based selections…
                        </p>
                      )}
                      {progress.error && (
                        <div role="alert">
                          <p>{progress.error}</p>
                          <button onClick={progress.retry}>
                            Retry progress
                          </button>
                        </div>
                      )}
                      {targeted && (
                        <p className="field-note" role="status">
                          {targeted === "least-practiced"
                            ? "Most unattempted verb–tense combinations first; ties use fewest attempts. Questions favour unattempted combinations."
                            : "Lowest accuracy first; ties use more attempts. Unattempted verbs are excluded."}{" "}
                          {ranked.length
                            ? `Using ${ranked.length} verbs for this session.`
                            : targeted === "most-mistakes"
                              ? "No attempted verbs match this answer mode and tense selection yet."
                              : "Select a tense and an applicable person to find verbs."}{" "}
                          Your saved manual verb selection is kept. Progress
                          combines all persons.
                        </p>
                      )}
                    </div>
                  ) : undefined
                }
                onChange={setPreferences}
                disabled={loading}
              />
            </>
          )}
          {notice && (
            <p className="field-note" role="status">
              {notice}
            </p>
          )}
          {customizing && (
            <>
              {choiceLoading && <p role="status">Preparing answer options…</p>}
              {mode === "choice" && currentChoiceData?.error && (
                <div role="alert">
                  <p>{currentChoiceData.error}</p>
                  <button
                    onClick={() => {
                      setChoiceData(null)
                      setChoiceAttempt((value) => value + 1)
                    }}
                  >
                    Retry options
                  </button>
                </div>
              )}
              {mode === "choice" &&
                available < selectedPoolSize &&
                !choiceLoading &&
                !currentChoiceData?.error && (
                  <p className="field-note">
                    {selectedPoolSize - available} combinations excluded because
                    they lack distinct incorrect options.
                  </p>
                )}
              <p className="field-note" role="status">
                {available} unique {available === 1 ? "question" : "questions"}{" "}
                available.
                {validLength && Number(length) > available && available > 0
                  ? ` This practice will contain ${available} ${available === 1 ? "question" : "questions"} instead of ${length}.`
                  : ""}
              </p>
              {!available && !choiceLoading && !currentChoiceData?.error && (
                <p role="status">
                  Select at least one verb, tense, and applicable person.
                </p>
              )}
              {!validLength && (
                <p role="status">
                  Choose a positive whole number of questions.
                </p>
              )}
            </>
          )}
          {learning.loading && <p role="status">Checking learning data…</p>}
          {learning.error && (
            <div role="alert">
              <p>{learning.error}</p>
              <button onClick={learning.retry}>Retry learning data</button>
            </div>
          )}
          {startError && <p role="alert">{startError}</p>}
          {customizing && (
            <div className="selection-actions">
              <button
                className="primary-button"
                disabled={
                  loading ||
                  choiceLoading ||
                  learning.loading ||
                  !!learning.error ||
                  !available ||
                  targetedUnavailable ||
                  !validLength
                }
                onClick={() => {
                  void start()
                }}
              >
                {loading
                  ? "Loading selected verbs…"
                  : `Start ${mode === "choice" ? "multiple-choice" : "typing"} practice${validLength && available ? ` · ${Math.min(Number(length), available)} ${Math.min(Number(length), available) === 1 ? "question" : "questions"}` : ""}`}
              </button>
              <button
                disabled={loading}
                onClick={() => {
                  if (beforeCustomize.current)
                    setPreferences(structuredClone(beforeCustomize.current))
                  setCustomizing(false)
                  setTargeted(null)
                  setStartError("")
                }}
              >
                Back
              </button>
            </div>
          )}
          <p className="field-note">
            Preferences{" "}
            {isAccount ? "sync to your account" : "are stored in this browser"}.{" "}
            {isAccount
              ? "Submitted answers update your progress; completed practices appear in History."
              : "Guest answers and results are not saved."}
          </p>
        </>
      )}
    </section>
  )
}
