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
  return (
    <fieldset
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
        {person}:
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
              value={index}
              checked={selectedIndex === index}
              onChange={() => onSelect(index)}
              ref={index === 0 ? inputRef : undefined}
            />
            <span lang="es">{option}</span>
          </label>
        ))}
      </div>
      {!disabled && (
        <p className="field-note">
          Use arrow keys to choose, then Enter to submit.
        </p>
      )}
    </fieldset>
  )
}
