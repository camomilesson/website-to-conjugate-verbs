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
  CategoryId,
  PersonId,
  Preset,
} from "../verb-catalogue/index.ts"
import "./practice.css"

import type { PracticeConfig, Question } from "./session.ts"
import { PRACTICE_PERSONS, poolSize, createQuestions } from "./session.ts"

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
  const [search, setSearch] = useState("")
  const [error, setError] = useState("")
  const [attempt, setAttempt] = useState(0)
  const [selectedPersons, setSelectedPersons] = useState<PersonId[]>([
    ...PRACTICE_PERSONS,
  ])
  const [length, setLength] = useState("20")
  const [strict, setStrict] = useState(true)
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

  const available = poolSize(
    selectedVerbs.length,
    selectedCategories,
    selectedPersons,
  )
  const validLength = Number.isSafeInteger(Number(length)) && Number(length) > 0
  async function start() {
    if (
      !catalogue ||
      loading ||
      startController.current ||
      !available ||
      !validLength
    )
      return
    const config: PracticeConfig = {
      verbIds: [...selectedVerbs],
      categories: [...selectedCategories],
      persons: [...selectedPersons],
      length: Number(length),
      accentPolicy: strict ? "strict" : "relaxed",
    }
    const controller = new AbortController()
    startController.current = controller
    setLoading(true)
    setStartError("")
    try {
      const verbs = await Promise.all(
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

  function toggleVerb(id: string) {
    setSelectedVerbs((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    )
  }
  function toggleCategory(id: CategoryId) {
    setSelectedCategories((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    )
  }
  return (
    <section className="page-section" aria-labelledby="practice-title">
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
          <div className="selection-grid">
            <fieldset disabled={loading}>
              <legend>
                Verbs{" "}
                <span className="selection-count">
                  {selectedVerbs.length} / {catalogue.verbs.length}
                </span>
              </legend>
              <label className="search-label">
                Search verbs
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Infinitive or meaning"
                />
              </label>
              <div className="selection-actions">
                <button
                  onClick={() =>
                    setSelectedVerbs(catalogue.verbs.map((verb) => verb.id))
                  }
                >
                  Select all verbs
                </button>
                <button onClick={() => setSelectedVerbs([])}>
                  Clear verbs
                </button>
              </div>
              <div className="verb-options">
                {catalogue.verbs
                  .filter((verb) =>
                    `${verb.infinitive} ${verb.meaning}`
                      .toLowerCase()
                      .includes(search.trim().toLowerCase()),
                  )
                  .map((verb) => (
                    <label className="option" key={verb.id}>
                      <input
                        type="checkbox"
                        checked={selectedVerbs.includes(verb.id)}
                        onChange={() => toggleVerb(verb.id)}
                      />
                      <span lang="es">{verb.infinitive}</span>
                      <small>{verb.meaning}</small>
                    </label>
                  ))}
                {!catalogue.verbs.some((verb) =>
                  `${verb.infinitive} ${verb.meaning}`
                    .toLowerCase()
                    .includes(search.trim().toLowerCase()),
                ) && <p>No matching verbs.</p>}
              </div>
            </fieldset>
            <fieldset disabled={loading}>
              <legend>
                Tenses & moods{" "}
                <span className="selection-count">
                  {selectedCategories.length} / {CATEGORIES.length}
                </span>
              </legend>
              <div className="selection-actions">
                {(["basic", "advanced", "all"] as Preset[]).map((preset) => (
                  <button
                    key={preset}
                    onClick={() =>
                      setSelectedCategories(getPresetCategories(preset))
                    }
                  >
                    {preset[0].toUpperCase() + preset.slice(1)}
                  </button>
                ))}
                <button onClick={() => setSelectedCategories([])}>
                  Clear tenses
                </button>
              </div>
              <p className="field-note">
                Basic: 6 categories. Advanced and All: all 16 supported
                categories.
              </p>
              <div className="category-groups">
                {Array.from(
                  new Set(CATEGORIES.map((category) => category.group)),
                ).map((group) => (
                  <div className="category-group" key={group}>
                    <h2 lang="es">{group}</h2>
                    {CATEGORIES.filter(
                      (category) => category.group === group,
                    ).map((category) => (
                      <label
                        className="option category-option"
                        key={category.id}
                      >
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(category.id)}
                          onChange={() => toggleCategory(category.id)}
                        />
                        <span>
                          <span lang="es">{category.label}</span>
                          <small>{category.english}</small>
                        </span>
                      </label>
                    ))}
                  </div>
                ))}
              </div>
            </fieldset>
          </div>
          <fieldset className="practice-options" disabled={loading}>
            <legend>Persons</legend>
            <div className="person-options">
              {PRACTICE_PERSONS.map((person) => (
                <label className="option" key={person}>
                  <input
                    type="checkbox"
                    checked={selectedPersons.includes(person)}
                    onChange={() =>
                      setSelectedPersons((current) =>
                        current.includes(person)
                          ? current.filter((item) => item !== person)
                          : [...current, person],
                      )
                    }
                  />
                  <span lang="es">{PERSONS[person]}</span>
                </label>
              ))}
            </div>
            <p className="field-note">
              Imperatives exclude yo; usted and ustedes follow their
              corresponding selections.
            </p>
            <div className="session-options">
              <label>
                Questions
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={length}
                  onChange={(event) => setLength(event.target.value)}
                />
              </label>
              <label className="option">
                <input
                  type="checkbox"
                  checked={strict}
                  onChange={(event) => setStrict(event.target.checked)}
                />
                Require written accents (including ñ and ü)
              </label>
            </div>
          </fieldset>
          <p className="field-note" role="status">
            {available} unique {available === 1 ? "question" : "questions"}{" "}
            available.
            {validLength && Number(length) > available && available > 0
              ? ` This practice will contain ${available} ${available === 1 ? "question" : "questions"} instead of ${length}.`
              : ""}
          </p>
          {!available && (
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
            disabled={loading || !available || !validLength}
            onClick={() => {
              void start()
            }}
          >
            {loading
              ? "Loading selected verbs…"
              : `Start typing practice${validLength && available ? ` · ${Math.min(Number(length), available)} ${Math.min(Number(length), available) === 1 ? "question" : "questions"}` : ""}`}
          </button>
          <p className="field-note">
            Guest practice. Results last for this sitting only.
          </p>
        </>
      )}
    </section>
  )
}
