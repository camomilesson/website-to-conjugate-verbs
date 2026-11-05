import { useEffect, useRef, useState } from "react"

export interface SelectionOption {
  id: string
  label: string
  detail?: string
  group?: string
}
export function SelectionDialog({
  title,
  options,
  selected,
  searchable = false,
  onApply,
  onClose,
}: {
  title: string
  options: readonly SelectionOption[]
  selected: readonly string[]
  searchable?: boolean
  onApply: (ids: string[]) => void
  onClose: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [draft, setDraft] = useState([...selected])
  const [search, setSearch] = useState("")
  useEffect(() => {
    const previousFocus = document.activeElement
    const element = dialog.current
    element?.showModal()
    element?.querySelector<HTMLInputElement>('input[type="search"]')?.focus()
    return () => {
      element?.close()
      if (previousFocus instanceof HTMLElement) previousFocus.focus()
    }
  }, [])
  const visible = options.filter((option) =>
    `${option.label} ${option.detail ?? ""}`
      .toLowerCase()
      .includes(search.trim().toLowerCase()),
  )
  return (
    <dialog
      className="selection-dialog"
      ref={dialog}
      aria-labelledby="selection-title"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
    >
      <div className="dialog-heading">
        <h2 id="selection-title">{title}</h2>
        <button onClick={onClose} aria-label="Close selection">
          ×
        </button>
      </div>
      {searchable && (
        <label className="search-label">
          Search verbs
          <input
            type="search"
            autoFocus
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Infinitive or meaning"
          />
        </label>
      )}
      <div className="selection-actions">
        <button onClick={() => setDraft(options.map((option) => option.id))}>
          Select all
        </button>
        <button onClick={() => setDraft([])}>Clear selection</button>
        <span className="field-note" role="status">
          {draft.length} selected
        </span>
      </div>
      <div className="dialog-options">
        {visible.map((option, index) => (
          <div key={option.id}>
            {option.group && option.group !== visible[index - 1]?.group && (
              <h3 lang="es">{option.group}</h3>
            )}
            <label className="option">
              <input
                type="checkbox"
                checked={draft.includes(option.id)}
                onChange={() =>
                  setDraft((current) =>
                    current.includes(option.id)
                      ? current.filter((id) => id !== option.id)
                      : [...current, option.id],
                  )
                }
              />
              <span>
                <span lang="es">{option.label}</span>
                {option.detail && <small>{option.detail}</small>}
              </span>
            </label>
          </div>
        ))}
      </div>
      {!visible.length && <p>No matching verbs.</p>}
      <div className="dialog-footer">
        <button onClick={onClose}>Cancel</button>
        <button className="primary-button" onClick={() => onApply(draft)}>
          Apply selection
        </button>
      </div>
    </dialog>
  )
}
