# Practice preferences modlet

`index.ts` is the pure API for types, defaults, validation, and storage. `ui.ts`
exports the browser-only controlled fields and catalogue/restore hook. This keeps
Node tests independent of JSX and keeps Settings and Practice independent of each
other. Both consume this module's public APIs.

- `preferences.ts`: versioned localStorage record under
  `la-conjugadora.practice-preferences.v1`. Stores mode, verb/category/person IDs,
  requested length, typing accent policy, and built-in selection labels. Only
  preferences are serialised; questions, answers, and results are excluded.
- `PreferenceFields.tsx`: shared controlled compact editor and selection dialogs.
  Editing a draft never saves. The typing accent policy is retained when choice
  mode hides the checkbox. Functional state updates keep paired ID/preset changes
  together without losing one update.
- `SelectionDialog.tsx`: co-located native modal with draft/Apply/Cancel controls.
- `usePreferenceDraft.ts`: load the catalogue, then read and validate preferences
  when opening setup/settings. Cancel stale requests on unmount. Do not subscribe
  an active practice session to preference changes.

Practice saves only after selected data validates and questions are generated,
just before starting the session. Settings saves explicitly. The last successful
save wins. Reload/New practice restores setup but never resumes a question queue.
An active session owns a detached snapshot, so another tab's saved edits affect
only the next setup. Unsaved edits in Settings or Practice are discarded on exit.

On catalogue changes, All/Common and built-in tense presets resolve against the
current catalogue. Custom IDs are filtered and deduplicated; empty/invalid fields
fall back to valid defaults. A surviving impossible combination (only yo with
imperatives) restores all persons. Adjustments are explained in the UI. A record
with malformed JSON/unknown schema version falls back to approved first-use
values. Nothing is silently rewritten during restore.

Storage getters, reads, and writes can fail. Reads fall back with a notice; a
failed practice save is reported while still allowing the session, and Settings
never claims a failed write succeeded. This is browser-local data: each origin
(including production versus preview) has its own settings. Account syncing uses
the auth repository; guest learning data is never imported.

Run `pnpm test` for round trips, latest-save behaviour, custom/preset restores,
invalid/stale values, storage failures, and serialization boundaries. Browser
checks cover save-on-Start, Settings Save, reload, and a second-tab edit while
practice remains in progress.

## Account storage

When signed in, `usePreferenceDraft` loads/saves via the auth modlet's Supabase
repository. New accounts use factory defaults; guest data is not imported.
Identity changes hide stale drafts and cancel pending loads. A failed account
read/write is surfaced without silently falling back to local storage. See
[operations/authentication guide](../../../docs/OPERATIONS.md#authentication) for the verified configuration and review checklist.

Verb picker options use Spanish alphabetical ordering without mutating catalogue
order or stored IDs. Shared interface sizing lives in the application theme;
setup retains its compact field layout at the common page width.

Selection dialogs use a flex column with only the options list scrolling. Heading,
search, selection actions and Apply/Cancel stay visible, including on short mobile
viewports. The shared layout applies in both Practice and Settings.

`verbSet` includes `least-practiced` and `most-mistakes` as saved selection rules.
Only signed-in Practice and Settings show those buttons. Practice supplies an
optional progress-preview/status slot; Settings explains that up to 20 verbs are
chosen at start. Restoring a rule discards stale cached IDs; fresh progress resolves
the actual list for each run. Manual presets and draft/Back behaviour stay intact.
