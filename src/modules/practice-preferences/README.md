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
(including production versus preview) has its own settings. Account syncing is
step 8; no guest-learning-data import is introduced here.

Run `pnpm test` for round trips, latest-save behaviour, custom/preset restores,
invalid/stale values, storage failures, and serialization boundaries. Browser
checks cover save-on-Start, Settings Save, reload, and a second-tab edit while
practice remains in progress.

## Account storage

When signed in, `usePreferenceDraft` loads/saves via the auth modlet's Supabase
repository. New accounts use factory defaults; guest data is not imported.
Identity changes hide stale drafts and cancel pending loads. A failed account
read/write is surfaced without silently falling back to local storage. See
[AUTH_SETUP.md](../../../AUTH_SETUP.md); hosted verification is still pending.
