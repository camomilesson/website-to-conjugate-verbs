import { useEffect, useRef } from "react"
import { choiceNumber } from "./polish.ts"
import type { RefObject } from "react"

export function ChoiceAnswer({
  person,
  options,
  selectedIndex,
  disabled,
  inputRef,
  onSelect,
  onSubmit,
}: {
  person: string
  options: readonly string[]
  selectedIndex: number | null
  disabled: boolean
  inputRef: RefObject<HTMLInputElement | null>
  onSelect: (index: number) => void
  onSubmit: () => void
}) {
  const fieldset = useRef<HTMLFieldSetElement>(null)
  useEffect(() => {
    if (disabled) return
    const choose = (event: KeyboardEvent) => {
      const editable =
        event.target instanceof Element &&
        !!event.target.closest(
          'input:not([type="radio"]), textarea, select, [contenteditable]:not([contenteditable="false"])',
        )
      const index = choiceNumber(
        event.key,
        options.length,
        editable || !!document.querySelector("dialog[open]"),
        event.ctrlKey || event.altKey || event.metaKey || event.shiftKey,
        event.repeat,
        event.isComposing,
      )
      if (event.defaultPrevented || index === null) return
      event.preventDefault()
      onSelect(index)
      fieldset.current
        ?.querySelectorAll<HTMLInputElement>('input[type="radio"]')
        .item(index)
        ?.focus()
    }
    document.addEventListener("keydown", choose)
    return () => document.removeEventListener("keydown", choose)
  }, [disabled, options, onSelect])
  return (
    <fieldset
      ref={fieldset}
      aria-labelledby="choice-person"
      className="choice-options"
      disabled={disabled}
      onKeyDown={(event) => {
        if (event.key !== "Enter") return
        event.preventDefault()
        if (
          !event.repeat &&
          !event.nativeEvent.isComposing &&
          !disabled &&
          selectedIndex !== null
        )
          onSubmit()
      }}
    >
      <span id="choice-person" className="choice-person" lang="es">
        {person}
      </span>
      <div className="choice-list">
        {options.map((option, index) => (
          <label
            className={`choice-option${selectedIndex === index ? " selected" : ""}`}
            key={option}
          >
            <input
              type="radio"
              name="choice-answer"
              aria-keyshortcuts={String(index + 1)}
              value={index}
              checked={selectedIndex === index}
              onChange={() => onSelect(index)}
              ref={index === 0 ? inputRef : undefined}
            />
            <span className="choice-number" aria-hidden="true">
              {index + 1}
            </span>
            <span lang="es">{option}</span>
          </label>
        ))}
      </div>
      {!disabled && (
        <p className="field-note">
          Use 1–{options.length} or arrow keys to choose, then Enter to submit.
        </p>
      )}
    </fieldset>
  )
}
