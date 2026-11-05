import { useEffect, useRef, useState } from "react"
import {
  CATEGORIES,
  PERSONS,
  getPresetCategories,
  loadCatalogue,
  loadCatalogueVerb,
} from "../verb-catalogue/index.ts"
import type {
  Catalogue,
  CatalogueVerb,
  CategoryId,
  PersonId,
} from "../verb-catalogue/index.ts"
import "./practice.css"
import { SelectionDialog } from "./SelectionDialog.tsx"

import type { PracticeConfig, PracticeMode, Question } from "./session.ts"
import {
  PRACTICE_PERSONS,
  poolSize,
  createQuestionPool,
  createQuestions,
} from "./session.ts"

export function PracticeSetup({
  onStart,
}: {
  onStart: (questions: Question[], config: PracticeConfig) => void
}) {
  const [catalogue, setCatalogue] = useState<Catalogue | null>(null)
  const [selectedVerbs, setSelectedVerbs] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<CategoryId[]>(
    getPresetCategories("basic"),
  )
  const [selectionDialog, setSelectionDialog] = useState<
    "verbs" | "tenses" | "persons" | null
  >(null)
  const [verbSet, setVerbSet] = useState<"all" | "common" | "select">("all")
  const [tenseSet, setTenseSet] = useState<
    "basic" | "advanced" | "all" | "select"
  >("basic")
  const [personSet, setPersonSet] = useState<"all" | "select">("all")
  const [error, setError] = useState("")
  const [attempt, setAttempt] = useState(0)
  const [selectedPersons, setSelectedPersons] = useState<PersonId[]>([
    ...PRACTICE_PERSONS,
  ])
  const [length, setLength] = useState("20")
  const [strict, setStrict] = useState(true)
  const [mode, setMode] = useState<PracticeMode>("typing")
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

  useEffect(() => {
    const controller = new AbortController()
    void loadCatalogue(controller.signal)
      .then((data) => {
        setCatalogue(data)
        setSelectedVerbs(data.verbs.map((verb) => verb.id))
        setError("")
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted)
          setError(
            reason instanceof Error
              ? reason.message
              : "Could not load catalogue.",
          )
      })
    return () => controller.abort()
  }, [attempt])

  const currentChoiceData = choiceData?.key === choiceKey ? choiceData : null
  const choiceLoading =
    mode === "choice" && selectedVerbs.length > 0 && !currentChoiceData
  const selectedPoolSize = poolSize(
    selectedVerbs.length,
    selectedCategories,
    selectedPersons,
  )
  const available =
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
      : selectedPoolSize
  const validLength = Number.isSafeInteger(Number(length)) && Number(length) > 0
  async function start() {
    if (
      !catalogue ||
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
      if (!controller.signal.aborted)
        onStart(createQuestions(verbs, config), config)
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

  // Curated starter subset for useful first practice, not a frequency ranking.
  const commonIds =
    catalogue?.verbs
      .filter((verb) => ["ser", "ir", "tener", "hablar"].includes(verb.id))
      .map((verb) => verb.id) ?? []
  const summary = (labels: string[]) =>
    labels.length > 3
      ? `${labels.slice(0, 3).join(", ")} +${labels.length - 3}`
      : labels.join(", ") || "None selected"
  return (
    <section
      className="page-section setup-page"
      aria-labelledby="practice-title"
    >
      <h1 id="practice-title">Practice</h1>
      {error ? (
        <div role="alert">
          <p>{error}</p>
          <button onClick={() => setAttempt((value) => value + 1)}>
            Retry catalogue
          </button>
        </div>
      ) : !catalogue ? (
        <p role="status">Loading verbs…</p>
      ) : (
        <>
          <div className="compact-setup">
            <fieldset className="setup-row" disabled={loading}>
              <legend>Answer mode</legend>
              <div className="segmented-control mode-toggle">
                <label>
                  <input
                    type="radio"
                    name="practice-mode"
                    checked={mode === "typing"}
                    onChange={() => setMode("typing")}
                  />
                  Typing
                </label>
                <label>
                  <input
                    type="radio"
                    name="practice-mode"
                    checked={mode === "choice"}
                    onChange={() => setMode("choice")}
                  />
                  Multiple choice
                </label>
              </div>
            </fieldset>
            <fieldset className="setup-row" disabled={loading}>
              <legend>Verbs</legend>
              <div>
                <div className="selection-actions">
                  <button
                    aria-pressed={verbSet === "all"}
                    onClick={() => {
                      setSelectedVerbs(catalogue.verbs.map((verb) => verb.id))
                      setVerbSet("all")
                    }}
                  >
                    All
                  </button>
                  <button
                    aria-pressed={verbSet === "common"}
                    onClick={() => {
                      setSelectedVerbs(commonIds)
                      setVerbSet("common")
                    }}
                  >
                    Common
                  </button>
                  <button
                    aria-pressed={verbSet === "select"}
                    aria-haspopup="dialog"
                    onClick={() => setSelectionDialog("verbs")}
                  >
                    Select…
                  </button>
                </div>
                <p className="selection-summary">
                  {selectedVerbs.length} / {catalogue.verbs.length} ·{" "}
                  {summary(
                    catalogue.verbs
                      .filter((verb) => selectedVerbs.includes(verb.id))
                      .map((verb) => verb.infinitive),
                  )}
                </p>
              </div>
            </fieldset>
            <fieldset className="setup-row" disabled={loading}>
              <legend>Tenses & moods</legend>
              <div>
                <div className="selection-actions">
                  {(["basic", "advanced", "all"] as const).map((preset) => (
                    <button
                      key={preset}
                      aria-pressed={tenseSet === preset}
                      onClick={() => {
                        setSelectedCategories(getPresetCategories(preset))
                        setTenseSet(preset)
                      }}
                    >
                      {preset[0].toUpperCase() + preset.slice(1)}
                    </button>
                  ))}
                  <button
                    aria-pressed={tenseSet === "select"}
                    aria-haspopup="dialog"
                    onClick={() => setSelectionDialog("tenses")}
                  >
                    Select…
                  </button>
                </div>
                <p className="selection-summary">
                  {selectedCategories.length} / 16 categories
                  {tenseSet === "basic"
                    ? " · Everyday indicative forms"
                    : tenseSet === "advanced" || tenseSet === "all"
                      ? " · All supported forms"
                      : " · Custom selection"}
                </p>
              </div>
            </fieldset>
            <fieldset className="setup-row" disabled={loading}>
              <legend>Persons</legend>
              <div>
                <div className="selection-actions">
                  <button
                    aria-pressed={personSet === "all"}
                    onClick={() => {
                      setSelectedPersons([...PRACTICE_PERSONS])
                      setPersonSet("all")
                    }}
                  >
                    All
                  </button>
                  <button
                    aria-pressed={personSet === "select"}
                    aria-haspopup="dialog"
                    onClick={() => setSelectionDialog("persons")}
                  >
                    Select…
                  </button>
                </div>
                <p className="selection-summary">
                  {selectedPersons.length} / 6 ·{" "}
                  {personSet === "all"
                    ? "Including vosotros"
                    : summary(selectedPersons.map((person) => PERSONS[person]))}
                </p>
              </div>
            </fieldset>
            <fieldset className="setup-row settings-row" disabled={loading}>
              <legend>Session</legend>
              <div className="session-options">
                <label className="length-label">
                  Questions
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={length}
                    onChange={(event) => setLength(event.target.value)}
                  />
                </label>
                {mode === "typing" && (
                  <label className="option">
                    <input
                      type="checkbox"
                      checked={strict}
                      onChange={(event) => setStrict(event.target.checked)}
                    />
                    Require accents{" "}
                    <span className="field-note">(á, ñ, ü)</span>
                  </label>
                )}
              </div>
            </fieldset>
          </div>
          {selectionDialog && (
            <SelectionDialog
              title={
                selectionDialog === "verbs"
                  ? "Select verbs"
                  : selectionDialog === "tenses"
                    ? "Select tenses & moods"
                    : "Select persons"
              }
              searchable={selectionDialog === "verbs"}
              options={
                selectionDialog === "verbs"
                  ? catalogue.verbs.map((verb) => ({
                      id: verb.id,
                      label: verb.infinitive,
                      detail: verb.meaning,
                    }))
                  : selectionDialog === "tenses"
                    ? CATEGORIES.map((category) => ({
                        id: category.id,
                        label: category.label,
                        detail: category.english,
                        group: category.group,
                      }))
                    : PRACTICE_PERSONS.map((person) => ({
                        id: person,
                        label: PERSONS[person],
                        detail:
                          person === "yo"
                            ? "Not used in imperatives"
                            : person === "el"
                              ? "Includes usted for imperatives"
                              : person === "ellos"
                                ? "Includes ustedes for imperatives"
                                : undefined,
                      }))
              }
              selected={
                selectionDialog === "verbs"
                  ? selectedVerbs
                  : selectionDialog === "tenses"
                    ? selectedCategories
                    : selectedPersons
              }
              onClose={() => setSelectionDialog(null)}
              onApply={(ids) => {
                if (selectionDialog === "verbs") {
                  setSelectedVerbs(ids)
                  setVerbSet("select")
                }
                if (selectionDialog === "tenses") {
                  setSelectedCategories(ids as CategoryId[])
                  setTenseSet("select")
                }
                if (selectionDialog === "persons") {
                  setSelectedPersons(ids as PersonId[])
                  setPersonSet("select")
                }
                setSelectionDialog(null)
              }}
            />
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
            Guest practice. Results last for this sitting only.
          </p>
        </>
      )}
    </section>
  )
}
