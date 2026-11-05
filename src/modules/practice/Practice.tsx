import { useEffect, useState } from "react"
import {
  CATEGORIES,
  PERSONS,
  getCategoryPersons,
  getPresetCategories,
  loadCatalogue,
  loadCatalogueVerb,
} from "../verb-catalogue/index.ts"
import type {
  Catalogue,
  CatalogueVerb,
  CategoryId,
  PersonId,
  Preset,
} from "../verb-catalogue/index.ts"
import "./practice.css"

export function Practice() {
  const [catalogue, setCatalogue] = useState<Catalogue | null>(null)
  const [selectedVerbs, setSelectedVerbs] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<CategoryId[]>(
    getPresetCategories("basic"),
  )
  const [search, setSearch] = useState("")
  const [error, setError] = useState("")
  const [attempt, setAttempt] = useState(0)
  const [previewAttempt, setPreviewAttempt] = useState(0)
  const [previewVerbId, setPreviewVerbId] = useState("hablar")
  const [previewCategoryId, setPreviewCategoryId] =
    useState<CategoryId>("indicative.present")
  const [previewPersonId, setPreviewPersonId] = useState<PersonId>("yo")
  const [preview, setPreview] = useState<CatalogueVerb | null>(null)
  const [previewError, setPreviewError] = useState("")

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

  const activeVerb =
    catalogue?.verbs.find(
      (verb) => verb.id === previewVerbId && selectedVerbs.includes(verb.id),
    ) ?? catalogue?.verbs.find((verb) => selectedVerbs.includes(verb.id))
  const activeCategory = selectedCategories.includes(previewCategoryId)
    ? previewCategoryId
    : selectedCategories[0]
  const persons = activeCategory ? getCategoryPersons(activeCategory) : []
  const activePerson = persons.includes(previewPersonId)
    ? previewPersonId
    : persons[0]

  useEffect(() => {
    if (!activeVerb || !catalogue) return
    const controller = new AbortController()
    void loadCatalogueVerb(
      activeVerb,
      catalogue.datasetVersion,
      controller.signal,
    )
      .then((data) => {
        setPreview(data)
        setPreviewError("")
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted)
          setPreviewError(
            reason instanceof Error ? reason.message : "Could not load verb.",
          )
      })
    return () => controller.abort()
  }, [activeVerb, catalogue, previewAttempt])

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
  const loadedPreview = preview?.id === activeVerb?.id ? preview : null
  const answers =
    activeCategory && activePerson
      ? loadedPreview?.conjugations[activeCategory][activePerson]
      : undefined

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
            <fieldset>
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
            <fieldset>
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
          <section
            className="catalogue-preview"
            aria-labelledby="preview-title"
          >
            <h2 id="preview-title">Answer preview</h2>
            {!selectedVerbs.length || !selectedCategories.length ? (
              <p role="status">
                Select at least one verb and one tense to preview an answer.
              </p>
            ) : (
              <>
                <div className="preview-controls">
                  <label>
                    Verb
                    <select
                      value={activeVerb?.id ?? ""}
                      onChange={(event) => {
                        setPreviewError("")
                        setPreviewVerbId(event.target.value)
                      }}
                    >
                      {catalogue.verbs
                        .filter((verb) => selectedVerbs.includes(verb.id))
                        .map((verb) => (
                          <option value={verb.id} key={verb.id}>
                            {verb.infinitive}
                          </option>
                        ))}
                    </select>
                  </label>
                  <label>
                    Tense / mood
                    <select
                      value={activeCategory}
                      onChange={(event) =>
                        setPreviewCategoryId(event.target.value as CategoryId)
                      }
                    >
                      {CATEGORIES.filter((category) =>
                        selectedCategories.includes(category.id),
                      ).map((category) => (
                        <option value={category.id} key={category.id}>
                          {category.group} · {category.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Person
                    <select
                      value={activePerson}
                      onChange={(event) =>
                        setPreviewPersonId(event.target.value as PersonId)
                      }
                    >
                      {persons.map((person) => (
                        <option value={person} key={person}>
                          {PERSONS[person]}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                {previewError ? (
                  <div role="alert">
                    <p>{previewError}</p>
                    <button
                      onClick={() => setPreviewAttempt((value) => value + 1)}
                    >
                      Retry data
                    </button>
                  </div>
                ) : (
                  <p className="answer-preview" role="status" lang="es">
                    {answers ? answers.join(" / ") : "Loading…"}
                  </p>
                )}
                {activeCategory?.startsWith("imperative.") && (
                  <p className="field-note">
                    Imperatives have no yo form. Only applicable persons are
                    offered.
                  </p>
                )}
              </>
            )}
          </section>
          <p className="placeholder-note">
            Catalogue preview only. Practice sessions are coming next.
          </p>
        </>
      )}
    </section>
  )
}
