import { Link } from "react-router"
import { useEffect, useRef, useState } from "react"
import { useAuth } from "../auth/ui.ts"
import {
  deleteOwnAccount,
  getLearningGeneration,
  resetLearningData,
} from "./repository.ts"
import "./controls.css"
type Action = "reset" | "delete"
interface Confirmation {
  action: Action
  owner: string
  email: string
  operationId: string
  generation: string | null
}
export function DataControls() {
  const auth = useAuth()
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)
  const [preparing, setPreparing] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const active = useRef(true)
  useEffect(() => {
    active.current = true
    return () => {
      active.current = false
    }
  }, [])
  async function prepare(action: Action) {
    if (!auth.user || preparing) return
    setPreparing(true)
    setMessage(null)
    try {
      const generation =
        action === "reset" ? await getLearningGeneration() : null
      if (active.current)
        setConfirmation({
          action,
          owner: auth.user.id,
          email: auth.user.email ?? "this account",
          operationId: crypto.randomUUID(),
          generation,
        })
    } catch (reason: unknown) {
      if (active.current)
        setMessage(
          reason instanceof Error
            ? reason.message
            : "Could not prepare this action.",
        )
    } finally {
      if (active.current) setPreparing(false)
    }
  }
  if (!auth.user) return null
  return (
    <section className="data-controls" aria-labelledby="data-controls-title">
      <h2 id="data-controls-title">Your data</h2>
      <p>
        Reset clears saved accuracy, practice history and retry records. Your
        sign-in and practice preferences stay. Active practices cannot restore
        cleared data.
      </p>
      <p className="field-note">
        <Link to="/privacy">Read about stored data and retention</Link> ·
        conjugadora.support@gmail.com
      </p>
      <div className="selection-actions">
        <button
          disabled={preparing}
          onClick={() => {
            void prepare("reset")
          }}
        >
          Reset all learning data
        </button>
        <button
          disabled={preparing}
          onClick={() => {
            void prepare("delete")
          }}
        >
          Delete account
        </button>
      </div>
      {preparing && <p role="status">Preparing confirmation…</p>}
      {message && <p role="alert">{message}</p>}
      {confirmation && (
        <ConfirmDataAction
          confirmation={confirmation}
          onClose={() => setConfirmation(null)}
          executeDelete={(owner) =>
            deleteOwnAccount(owner, () => {
              if (active.current) auth.announceAccountDeletion()
            })
          }
          onReset={() => {
            auth.invalidateLearningData()
            setConfirmation(null)
          }}
        />
      )}
    </section>
  )
}
export function ConfirmDataAction({
  confirmation,
  onClose,
  onReset,
  executeReset = resetLearningData,
  executeDelete = deleteOwnAccount,
}: {
  confirmation: Confirmation
  onClose: () => void
  onReset: () => void
  executeReset?: typeof resetLearningData
  executeDelete?: typeof deleteOwnAccount
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [typed, setTyped] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lock = useRef(false)
  const active = useRef(true)
  useEffect(() => {
    active.current = true
    const previous = document.activeElement
    const element = dialog.current
    element?.showModal()
    return () => {
      active.current = false
      element?.close()
      if (previous instanceof HTMLElement) previous.focus()
    }
  }, [])
  async function confirm() {
    if (
      lock.current ||
      (confirmation.action === "delete" && typed !== "DELETE")
    )
      return
    lock.current = true
    setBusy(true)
    setError(null)
    try {
      if (confirmation.action === "reset") {
        await executeReset(confirmation.operationId, confirmation.generation!)
        if (active.current) onReset()
      } else {
        await executeDelete(confirmation.owner)
        if (active.current) onClose()
      }
    } catch (reason: unknown) {
      if (active.current)
        setError(
          reason instanceof Error
            ? reason.message
            : "The operation was not acknowledged. Retry.",
        )
    } finally {
      lock.current = false
      if (active.current) setBusy(false)
    }
  }
  const deleting = confirmation.action === "delete"
  return (
    <dialog
      ref={dialog}
      aria-labelledby="data-confirm-title"
      onCancel={(event) => {
        event.preventDefault()
        if (!busy) onClose()
      }}
    >
      <h2 id="data-confirm-title">
        {deleting ? "Delete your account?" : "Reset all learning data?"}
      </h2>
      <p>
        Account: <strong>{confirmation.email}</strong>
      </p>
      <p>
        {deleting
          ? "This permanently deletes your La Conjugadora account, preferences, progress, history and retry records. It cannot be undone. It does not delete your Google account."
          : "This permanently clears your progress, history and retry records. Your account and saved preferences remain. It cannot be undone."}
      </p>
      {deleting && (
        <label className="delete-confirm-label">
          Type DELETE to confirm
          <input
            value={typed}
            disabled={busy}
            onChange={(event) => setTyped(event.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
        </label>
      )}
      {error && (
        <div role="alert">
          <p>{error}</p>
          <p>
            A lost reply may mean this already completed. Retry reuses this
            confirmation; Cancel only closes the dialog.
          </p>
        </div>
      )}
      {busy && (
        <p role="status">
          {deleting ? "Deleting account…" : "Resetting learning data…"} Waiting
          for acknowledgement.
        </p>
      )}
      <div className="selection-actions">
        <button autoFocus disabled={busy} onClick={onClose}>
          Cancel
        </button>
        <button
          className="primary-button"
          disabled={busy || (deleting && typed !== "DELETE")}
          onClick={() => {
            void confirm()
          }}
        >
          {busy
            ? "Working…"
            : error
              ? "Retry same request"
              : deleting
                ? "Permanently delete account"
                : "Confirm reset"}
        </button>
      </div>
    </dialog>
  )
}
