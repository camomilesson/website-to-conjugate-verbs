import { useEffect, useRef, useState } from "react"

const storageKey = "conjugadora.practice.sound"

export function usePracticeSound() {
  const [enabled, setEnabled] = useState(() => {
    try {
      return localStorage.getItem(storageKey) !== "off"
    } catch {
      return true
    }
  })
  const context = useRef<AudioContext | null>(null)

  useEffect(
    () => () => {
      const audio = context.current
      context.current = null
      if (audio && audio.state !== "closed") void audio.close().catch(() => {})
    },
    [],
  )

  function toggle() {
    const next = !enabled
    setEnabled(next)
    try {
      localStorage.setItem(storageKey, next ? "on" : "off")
    } catch {
      // Sound still works when browser storage is unavailable.
    }
  }

  function play(correct: boolean) {
    if (!enabled) return
    try {
      const audio = context.current ?? new AudioContext()
      context.current = audio
      // Start within the answer submission gesture so browser audio can unlock.
      void audio
        .resume()
        .then(() => {
          if (audio.state !== "running") return
          const start = audio.currentTime
          const notes = correct ? [660, 880] : [220]
          notes.forEach((frequency, index) => {
            const oscillator = audio.createOscillator()
            const gain = audio.createGain()
            const at = start + index * 0.1
            const duration = correct ? 0.16 : 0.2
            oscillator.type = "sine"
            oscillator.frequency.value = frequency
            gain.gain.setValueAtTime(0, at)
            gain.gain.linearRampToValueAtTime(0.075, at + 0.012)
            gain.gain.exponentialRampToValueAtTime(0.001, at + duration)
            oscillator.connect(gain)
            gain.connect(audio.destination)
            oscillator.onended = () => {
              oscillator.disconnect()
              gain.disconnect()
            }
            oscillator.start(at)
            oscillator.stop(at + duration)
          })
        })
        .catch(() => {})
    } catch {
      // Audio support or device failures must never interrupt practice.
    }
  }

  return { enabled, toggle, play }
}
