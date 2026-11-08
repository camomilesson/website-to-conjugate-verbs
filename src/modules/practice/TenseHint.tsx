import { useEffect, useId, useLayoutEffect, useRef, useState } from "react"
import type { CategoryId } from "@conjugadora/verb-catalogue"
import { CATEGORIES } from "@conjugadora/verb-catalogue"
import { TENSE_HELP } from "./tense-help.ts"
export function TenseHint({ categoryId }: { categoryId: CategoryId }) {
  const category = CATEGORIES.find((item) => item.id === categoryId)!
  const help = TENSE_HELP[categoryId]
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ left: 16, top: 16 })
  const anchor = useRef<HTMLButtonElement>(null)
  const tooltip = useRef<HTMLSpanElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const id = useId()
  function show() {
    if (timer.current) clearTimeout(timer.current)
    setOpen(true)
  }
  function close() {
    if (timer.current) clearTimeout(timer.current)
    setOpen(false)
  }
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )
  useLayoutEffect(() => {
    if (!open) return
    const place = () => {
      const trigger = anchor.current?.getBoundingClientRect()
      const box = tooltip.current?.getBoundingClientRect()
      if (!trigger || !box) return
      const top = trigger.top - box.height - 10
      setPosition({
        left: Math.max(
          8,
          Math.min(
            window.innerWidth - box.width - 8,
            trigger.left + (trigger.width - box.width) / 2,
          ),
        ),
        top:
          top >= 8
            ? top
            : Math.min(
                window.innerHeight - box.height - 8,
                trigger.bottom + 10,
              ),
      })
    }
    place()
    window.addEventListener("resize", place)
    window.addEventListener("scroll", place, true)
    return () => {
      window.removeEventListener("resize", place)
      window.removeEventListener("scroll", place, true)
    }
  }, [open])
  return (
    <span
      className="tense-hint"
      onMouseEnter={show}
      onMouseLeave={() => {
        timer.current = setTimeout(() => {
          if (document.activeElement !== anchor.current) setOpen(false)
        }, 160)
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation()
          close()
        }
      }}
    >
      <button
        type="button"
        className="prompt-tense tense-trigger"
        ref={anchor}
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        onFocus={show}
        onBlur={close}
        onClick={show}
        lang="es"
      >
        {category.label.toLocaleLowerCase("es")} (
        {category.group.toLocaleLowerCase("es")})
      </button>
      {open && (
        <span
          ref={tooltip}
          id={id}
          role="tooltip"
          lang="en"
          className="tense-tooltip"
          style={{ left: position.left, top: position.top }}
          onMouseEnter={show}
        >
          <strong>{help.title}</strong>
          <span>{help.meaning}</span>
          <em>“{help.example}”</em>
          {help.formation && (
            <span>
              <b>Formation:</b> {help.formation}.
            </span>
          )}
        </span>
      )}
    </span>
  )
}
