import { useState } from "react"
import type { Dispatch, SetStateAction } from "react"
import {
  CATEGORIES,
  PERSONS,
  getPresetCategories,
} from "../verb-catalogue/index.ts"
import type {
  Catalogue,
  CategoryId,
  PersonId,
} from "../verb-catalogue/index.ts"
import { PRACTICE_PERSONS, commonVerbIds } from "./preferences.ts"
import type { PracticePreferences, PracticeMode } from "./preferences.ts"
import { SelectionDialog } from "./SelectionDialog.tsx"
import "./preferences.css"

export function PreferenceFields({
  catalogue,
  value,
  onChange,
  disabled = false,
}: {
  catalogue: Catalogue
  value: PracticePreferences
  onChange: Dispatch<SetStateAction<PracticePreferences | null>>
  disabled?: boolean
}) {
  const {
    verbIds: selectedVerbs,
    categories: selectedCategories,
    persons: selectedPersons,
    mode,
    length,
    accentPolicy,
    verbSet,
    tenseSet,
    personSet,
  } = value
  const strict = accentPolicy === "strict"
  const loading = disabled
  const [selectionDialog, setSelectionDialog] = useState<
    "verbs" | "tenses" | "persons" | null
  >(null)
  function update(patch: Partial<PracticePreferences>) {
    onChange((current) => (current ? { ...current, ...patch } : current))
  }
  const setSelectedVerbs = (verbIds: string[]) => update({ verbIds })
  const setSelectedCategories = (categories: CategoryId[]) =>
    update({ categories })
  const setSelectedPersons = (persons: PersonId[]) => update({ persons })
  const setMode = (mode: PracticeMode) => update({ mode })
  const setLength = (length: string) => update({ length })
  const setStrict = (strict: boolean) =>
    update({ accentPolicy: strict ? "strict" : "relaxed" })
  const setVerbSet = (verbSet: PracticePreferences["verbSet"]) =>
    update({ verbSet })
  const setTenseSet = (tenseSet: PracticePreferences["tenseSet"]) =>
    update({ tenseSet })
  const setPersonSet = (personSet: PracticePreferences["personSet"]) =>
    update({ personSet })
  const commonIds = commonVerbIds(catalogue)
  const summary = (labels: string[]) =>
    labels.length > 3
      ? `${labels.slice(0, 3).join(", ")} +${labels.length - 3}`
      : labels.join(", ") || "None selected"
  return (
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
                Require accents <span className="field-note">(á, ñ, ü)</span>
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
              ? [...catalogue.verbs]
                  .sort((a, b) =>
                    a.infinitive.localeCompare(b.infinitive, "es"),
                  )
                  .map((verb) => ({
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
    </>
  )
}
