import { defaultProgressPreferences } from "./preferences.ts"
import type { ProgressPreferences } from "./preferences.ts"
import { useEffect, useMemo, useRef, useState } from "react"
import type { KeyboardEvent } from "react"
import { CATEGORIES, getPresetCategories } from "@conjugadora/verb-catalogue"
import type { Catalogue, CategoryId, Preset } from "@conjugadora/verb-catalogue"
import { totals } from "../learning-data/index.ts"
import type { CountRow } from "../learning-data/index.ts"
import { SelectionDialog } from "../practice-preferences/ui.ts"
import { buildMatrix, heatLevel, moodGroups, selectRows } from "./matrix.ts"
import type { Accuracy, ModeFilter, SortOrder } from "./matrix.ts"
import "./progress.css"
interface CellDetail {
  verb: string
  category: string
  accuracy: Accuracy
}
function describe(detail: CellDetail) {
  const { accuracy } = detail
  return `${detail.verb} · ${detail.category}: ${accuracy.percentage === null ? "Not practised" : `${accuracy.percentage}% · ${accuracy.correct} correct / ${accuracy.answered} answered`}`
}
function DetailDialog({
  detail,
  onClose,
}: {
  detail: CellDetail
  onClose: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const previous = document.activeElement
    ref.current?.showModal()
    return () => {
      ref.current?.close()
      if (previous instanceof HTMLElement) previous.focus()
    }
  }, [])
  return (
    <dialog
      ref={ref}
      aria-labelledby="accuracy-detail-title"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
    >
      <h2 id="accuracy-detail-title" lang="es">
        {detail.verb} · {detail.category}
      </h2>
      <p>
        {detail.accuracy.percentage === null
          ? "Not practised yet."
          : `${detail.accuracy.percentage}% · ${detail.accuracy.correct} correct out of ${detail.accuracy.answered} answered.`}
      </p>
      <p>
        Counts combine all persons for the selected answer mode. Overall
        includes all tenses and moods, even hidden columns.
      </p>
      <button autoFocus onClick={onClose}>
        Close details
      </button>
    </dialog>
  )
}
export function Heatmap({
  catalogue,
  counts,
  onRefresh,
  initialPreferences,
  onPreferencesChange,
}: {
  catalogue: Catalogue
  counts: readonly CountRow[]
  onRefresh?: () => void
  initialPreferences?: ProgressPreferences
  onPreferencesChange?: (value: ProgressPreferences) => void
}) {
  const initial = initialPreferences ?? defaultProgressPreferences()
  const [mode, setMode] = useState<ModeFilter>(initial.mode)
  const [view, setView] = useState<Preset | "select">(initial.view)
  const [custom, setCustom] = useState<CategoryId[]>(initial.custom)
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState<SortOrder>(initial.sort)
  const emitted = useRef(
    JSON.stringify({
      schemaVersion: 1,
      mode: initial.mode,
      view: initial.view,
      custom: initial.custom,
      sort: initial.sort,
    }),
  )
  useEffect(() => {
    const value: ProgressPreferences = {
      schemaVersion: 1,
      mode,
      view,
      custom,
      sort,
    }
    const serialized = JSON.stringify(value)
    if (serialized === emitted.current) return
    emitted.current = serialized
    onPreferencesChange?.(value)
  }, [mode, view, custom, sort, onPreferencesChange])
  const [selecting, setSelecting] = useState(false)
  const [detail, setDetail] = useState<CellDetail | null>(null)
  const [focused, setFocused] = useState({ row: 0, col: 0 })
  const [focusedText, setFocusedText] = useState("")
  const buttons = useRef(new Map<string, HTMLButtonElement>())
  const matrix = useMemo(
    () => buildMatrix(catalogue, counts, mode),
    [catalogue, counts, mode],
  )
  const rows = useMemo(
    () => selectRows(matrix, search, sort),
    [matrix, search, sort],
  )
  const visibleIds = view === "select" ? custom : getPresetCategories(view)
  const columns = CATEGORIES.filter((category) =>
    visibleIds.includes(category.id),
  )
  const groups = moodGroups(columns)
  const summary = totals(rows.map((row) => row.overall))
  const focusRow = Math.min(focused.row, Math.max(0, rows.length - 1))
  const focusCol = Math.min(focused.col, columns.length)
  const modeLabel =
    mode === "all"
      ? "Combined"
      : mode === "choice"
        ? "Multiple choice"
        : mode === "typing"
          ? "All typing"
          : mode === "strict"
            ? "Typing · accents required"
            : "Typing · accents ignored"
  function move(
    event: KeyboardEvent<HTMLButtonElement>,
    row: number,
    col: number,
  ) {
    let nextRow = row,
      nextCol = col
    if (event.key === "ArrowDown") nextRow++
    else if (event.key === "ArrowUp") nextRow--
    else if (event.key === "ArrowRight") nextCol++
    else if (event.key === "ArrowLeft") nextCol--
    else if (event.key === "Home") {
      nextCol = 0
      if (event.ctrlKey) nextRow = 0
    } else if (event.key === "End") {
      nextCol = columns.length
      if (event.ctrlKey) nextRow = rows.length - 1
    } else return
    event.preventDefault()
    nextRow = Math.max(0, Math.min(rows.length - 1, nextRow))
    nextCol = Math.max(0, Math.min(columns.length, nextCol))
    buttons.current.get(`${rows[nextRow].verb.id}:${nextCol}`)?.focus()
  }
  function cell(
    verb: string,
    accuracy: Accuracy,
    col: number,
    row: number,
    label: string,
  ) {
    const value = { verb, category: label, accuracy }
    const text = describe(value)
    return (
      <button
        className={`accuracy-cell heat-${heatLevel(accuracy)}`}
        title={text}
        aria-label={text}
        tabIndex={row === focusRow && col === focusCol ? 0 : -1}
        ref={(element) => {
          const key = `${rows[row].verb.id}:${col}`
          if (element) buttons.current.set(key, element)
          else buttons.current.delete(key)
        }}
        onFocus={() => {
          setFocused({ row, col })
          setFocusedText(text)
        }}
        onKeyDown={(event) => move(event, row, col)}
        onClick={() => setDetail(value)}
      >
        {accuracy.percentage === null ? "—" : `${accuracy.percentage}%`}
      </button>
    )
  }
  return (
    <>
      <div className="progress-controls">
        <label>
          Search verbs
          <input
            type="search"
            value={search}
            placeholder="Verb or meaning"
            onChange={(event) => {
              setSearch(event.target.value)
              setFocused({ row: 0, col: 0 })
              setFocusedText("")
            }}
          />
        </label>
        <label>
          Answer mode
          <select
            value={mode}
            onChange={(event) => {
              setMode(event.target.value as ModeFilter)
              setFocusedText("")
            }}
          >
            <option value="all">Combined</option>
            <option value="typing">All typing</option>
            <option value="choice">Multiple choice</option>
            <option value="strict">Typing · accents required</option>
            <option value="relaxed">Typing · accents ignored</option>
          </select>
        </label>
        <label>
          Sort verbs
          <select
            value={sort}
            onChange={(event) => {
              setSort(event.target.value as SortOrder)
              setFocusedText("")
            }}
          >
            <option value="name">Name A–Z</option>
            <option value="name-desc">Name Z–A</option>
            <option value="accuracy">Accuracy: highest first</option>
            <option value="accuracy-asc">Accuracy: lowest first</option>
            <option value="attempts">Attempts: most first</option>
            <option value="attempts-asc">Attempts: fewest first</option>
          </select>
        </label>
        {onRefresh && <button onClick={onRefresh}>Refresh progress</button>}
      </div>
      <fieldset className="column-controls">
        <legend>Tense columns</legend>
        {(["basic", "advanced", "all"] as const).map((preset) => (
          <button
            key={preset}
            aria-pressed={view === preset}
            onClick={() => {
              setView(preset)
              setFocusedText("")
            }}
          >
            {preset[0].toUpperCase() + preset.slice(1)}
          </button>
        ))}
        <button
          aria-pressed={view === "select"}
          onClick={() => setSelecting(true)}
        >
          Select columns…
        </button>
        <span className="field-note">{columns.length} / 16</span>
      </fieldset>
      {selecting && (
        <SelectionDialog
          title="Select tense columns"
          options={CATEGORIES.map((category) => ({
            id: category.id,
            label: category.label,
            group: category.group,
            detail: category.english,
          }))}
          selected={visibleIds}
          onApply={(ids) => {
            setCustom(
              CATEGORIES.filter((category) => ids.includes(category.id)).map(
                (category) => category.id,
              ),
            )
            setView("select")
            setSelecting(false)
            setFocusedText("")
          }}
          onClose={() => setSelecting(false)}
        />
      )}
      <p className="progress-summary" role="status">
        {rows.length} / {catalogue.verbs.length} verbs · {modeLabel} ·{" "}
        {summary.percentage === null
          ? "No answers yet"
          : `${summary.percentage}% · ${summary.correct} correct / ${summary.answered} answered`}
      </p>
      <p id="heatmap-help" className="field-note">
        Overall includes all tenses and moods, including hidden columns. — means
        not practised. Focus a cell and use arrow keys to move; Enter opens its
        counts.
      </p>
      <p className="cell-readout" aria-live="polite">
        {focusedText || "Select a cell to inspect accuracy and sample size."}
      </p>
      <div
        className="heatmap-scroll"
        role="region"
        aria-label="Verb accuracy matrix"
        tabIndex={0}
        aria-describedby="heatmap-help"
      >
        <table className="heatmap">
          <caption className="visually-hidden">
            Verb-by-tense accuracy · {modeLabel}
          </caption>
          <thead>
            <tr className="mood-headers">
              <th className="verb-column" rowSpan={2} scope="col">
                Verb
              </th>
              <th className="overall-column" rowSpan={2} scope="col">
                Overall<small>All categories</small>
              </th>
              {groups.map((group) => (
                <th
                  key={group.name}
                  scope="colgroup"
                  colSpan={group.span}
                  lang="es"
                >
                  {group.name}
                </th>
              ))}
            </tr>
            <tr className="tense-headers">
              {columns.map((category) => (
                <th
                  key={category.id}
                  scope="col"
                  lang="es"
                  title={`${category.group} · ${category.label}`}
                >
                  {category.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={row.verb.id}>
                <th
                  scope="row"
                  className="verb-column"
                  title={row.verb.meaning}
                  lang="es"
                >
                  {row.verb.infinitive}
                </th>
                <td className="overall-column">
                  {cell(
                    row.verb.infinitive,
                    row.overall,
                    0,
                    rowIndex,
                    "Overall · all categories",
                  )}
                </td>
                {columns.map((category, colIndex) => (
                  <td key={category.id}>
                    {cell(
                      row.verb.infinitive,
                      row.cells[category.id] ?? {
                        correct: 0,
                        answered: 0,
                        percentage: null,
                      },
                      colIndex + 1,
                      rowIndex,
                      `${category.group} · ${category.label}`,
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && (
          <p className="no-verbs">No verbs match your search.</p>
        )}
      </div>
      {detail && (
        <DetailDialog detail={detail} onClose={() => setDetail(null)} />
      )}
    </>
  )
}
