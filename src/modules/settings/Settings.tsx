import { AccountControls } from "../auth/ui.ts"
import { useState } from "react"
import {
  PreferenceFields,
  usePreferenceDraft,
} from "../practice-preferences/ui.ts"
import {
  defaultPreferences,
  validPreferences,
} from "../practice-preferences/index.ts"

export function Settings() {
  const {
    catalogue,
    preferences,
    setPreferences,
    notice,
    error,
    retry,
    save,
    isAccount,
  } = usePreferenceDraft()
  const [status, setStatus] = useState<{
    text: string
    failed: boolean
  } | null>(null)
  const [saving, setSaving] = useState(false)
  async function saveCurrent() {
    if (!preferences || saving) return
    setSaving(true)
    try {
      const failure = await save(structuredClone(preferences))
      setStatus({
        text: failure ?? "Preferences saved for your next practice.",
        failed: failure !== null,
      })
    } catch (reason: unknown) {
      setStatus({
        text:
          reason instanceof Error
            ? reason.message
            : "Could not save preferences.",
        failed: true,
      })
    } finally {
      setSaving(false)
    }
  }
  return (
    <section
      className="page-section setup-page"
      aria-labelledby="settings-title"
    >
      <h1 id="settings-title">Settings</h1>
      <p className="field-note">
        Defaults for your next practice.{" "}
        {isAccount ? "Synced to your account." : "Stored in this browser."}
      </p>
      <AccountControls />
      {error ? (
        <div role="alert">
          <p>{error}</p>
          <button onClick={retry}>Retry settings</button>
        </div>
      ) : !catalogue || !preferences ? (
        <p role="status">Loading preferences…</p>
      ) : (
        <>
          <PreferenceFields
            disabled={saving}
            catalogue={catalogue}
            value={preferences}
            onChange={(update) => {
              setStatus(null)
              setPreferences(update)
            }}
          />
          {notice && (
            <p className="field-note" role="status">
              {notice}
            </p>
          )}
          {!validPreferences(preferences) && (
            <p role="status">
              Choose a positive whole question count and at least one available
              verb, tense, and person.
            </p>
          )}
          <div className="selection-actions">
            <button
              className="primary-button"
              disabled={saving || !validPreferences(preferences)}
              onClick={() => {
                void saveCurrent()
              }}
            >
              {saving ? "Saving…" : "Save preferences"}
            </button>
            <button
              disabled={saving}
              onClick={() => {
                setPreferences(defaultPreferences(catalogue))
                setStatus({
                  text: "Default selections restored. Save preferences to keep them.",
                  failed: false,
                })
              }}
            >
              Restore defaults
            </button>
          </div>
          {status && (
            <p role={status.failed ? "alert" : "status"}>{status.text}</p>
          )}
          <p className="field-note">
            Starting a practice saves that setup as your new defaults. Changes
            here take effect after Save preferences. Signed-in answers update
            progress; unfinished tests cannot be resumed.
          </p>
        </>
      )}
    </section>
  )
}
