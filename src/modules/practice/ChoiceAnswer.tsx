import type { RefObject } from "react"

export function ChoiceAnswer({
  options,
  selectedIndex,
  disabled,
  inputRef,
  onSelect,
  onSubmit,
}: {
  options: readonly string[]
  selectedIndex: number | null
  disabled: boolean
  inputRef: RefObject<HTMLInputElement | null>
  onSelect: (index: number) => void
  onSubmit: () => void
}) {
  return (
    <fieldset
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
      <legend>Choose your answer</legend>
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
      {!disabled && (
        <p className="field-note">
          Use arrow keys to choose, then Enter to submit.
        </p>
      )}
    </fieldset>
  )
}
