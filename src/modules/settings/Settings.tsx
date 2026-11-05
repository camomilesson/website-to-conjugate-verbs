import { useState } from "react"
import {
  PreferenceFields,
  usePreferenceDraft,
} from "../practice-preferences/ui.ts"
import {
  defaultPreferences,
  savePreferences,
  validPreferences,
} from "../practice-preferences/index.ts"

export function Settings() {
  const { catalogue, preferences, setPreferences, notice, error, retry } =
    usePreferenceDraft()
  const [status, setStatus] = useState<{
    text: string
    failed: boolean
  } | null>(null)
  return (
    <section
      className="page-section setup-page"
      aria-labelledby="settings-title"
    >
      <h1 id="settings-title">Settings</h1>
      <p className="field-note">
        Defaults for your next practice. Stored in this browser.
      </p>
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
              disabled={!validPreferences(preferences)}
              onClick={() => {
                const failure = savePreferences(preferences)
                setStatus({
                  text: failure ?? "Preferences saved for your next practice.",
                  failed: failure !== null,
                })
              }}
            >
              Save preferences
            </button>
            <button
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
            here take effect after Save preferences. Answers and unfinished
            tests are never saved.
          </p>
          <p className="field-note">
            Google sign-in and account controls are coming later.
          </p>
        </>
      )}
    </section>
  )
}
