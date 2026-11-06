import { useAuth } from "../auth/ui.ts"
import {
  practiceMetadata,
  startTrackedPractice,
} from "../learning-data/index.ts"
import type { TrackingContext } from "../learning-data/index.ts"
import { useEffect, useMemo, useRef, useState } from "react"
import { loadCatalogueVerb } from "../verb-catalogue/index.ts"
import type { CatalogueVerb } from "../verb-catalogue/index.ts"
import {
  PreferenceFields,
  usePreferenceDraft,
} from "../practice-preferences/ui.ts"
import type { PracticeConfig, Question } from "./session.ts"
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
  ) => void
}) {
  const auth = useAuth()
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
  const selectedVerbs = preferences?.verbIds ?? []
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
    if (mode !== "choice" || !catalogue || !selectedVerbs.length) return
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
  }, [catalogue, selectedVerbs, mode, choiceKey, choiceAttempt])
  const [loading, setLoading] = useState(false)
  const [startError, setStartError] = useState("")
  const startController = useRef<AbortController | null>(null)
  useEffect(() => () => startController.current?.abort(), [])

  const currentChoiceData = choiceData?.key === choiceKey ? choiceData : null
  const choiceLoading =
    mode === "choice" && selectedVerbs.length > 0 && !currentChoiceData
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
  async function start() {
    if (
      !catalogue ||
      !preferences ||
      loading ||
      startController.current ||
      choiceLoading ||
      !available ||
      !validLength
    )
      return
    const config: PracticeConfig = {
      mode,
      verbIds: [...selectedVerbs],
      categories: [...selectedCategories],
      persons: [...selectedPersons],
      length: Number(length),
      accentPolicy: mode === "choice" || strict ? "strict" : "relaxed",
    }
    const controller = new AbortController()
    startController.current = controller
    setLoading(true)
    setStartError("")
    try {
      const verbs =
        mode === "choice" && currentChoiceData?.verbs
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
        const questions = createQuestions(verbs, config)
        const storageNotice = await save(structuredClone(preferences))
        if (controller.signal.aborted) return
        if (isAccount && storageNotice) throw new Error(storageNotice)
        const tracking = auth.user
          ? await startTrackedPractice(
              auth.user.id,
              practiceMetadata(config, preferences),
              catalogue.datasetVersion,
              questions.length,
            )
          : null
        if (controller.signal.aborted) return
        onStart(questions, config, storageNotice, tracking)
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
      }
    }
  }

  return (
    <section
      className="page-section setup-page"
      aria-labelledby="practice-title"
    >
      <h1 id="practice-title">Practice</h1>
      {error ? (
        <div role="alert">
          <p>{error}</p>
          <button onClick={retry}>Retry catalogue</button>
        </div>
      ) : !catalogue || !preferences ? (
        <p role="status">Loading preferences…</p>
      ) : (
        <>
          <PreferenceFields
            catalogue={catalogue}
            value={preferences}
            onChange={setPreferences}
            disabled={loading}
          />
          {notice && (
            <p className="field-note" role="status">
              {notice}
            </p>
          )}
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
            <p role="status">Choose a positive whole number of questions.</p>
          )}
          {startError && <p role="alert">{startError}</p>}
          <button
            className="primary-button"
            disabled={loading || choiceLoading || !available || !validLength}
            onClick={() => {
              void start()
            }}
          >
            {loading
              ? "Loading selected verbs…"
              : `Start ${mode === "choice" ? "multiple-choice" : "typing"} practice${validLength && available ? ` · ${Math.min(Number(length), available)} ${Math.min(Number(length), available) === 1 ? "question" : "questions"}` : ""}`}
          </button>
          <p className="field-note">
            Preferences{" "}
            {isAccount ? "sync to your account" : "are stored in this browser"}.
            {isAccount
              ? "Submitted answers update your progress; completed practices appear in History."
              : "Guest answers and results are not saved."}
          </p>
        </>
      )}
    </section>
  )
}
