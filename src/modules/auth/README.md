# Account modlet

`index.ts` exposes the configured Supabase client to other feature repositories.
`ui.ts` exposes the provider, account controls, auth hook, and account preference
repository. The application uses Supabase Google OAuth with PKCE. Session changes
remount Practice and Settings, clearing previous user drafts/questions. Stale
preference loads are ignored after identity changes. Auth callbacks stay
synchronous so they do not deadlock the SDK session lock.

No configuration means guest mode. Partial/invalid configuration is reported in
Settings. Only project URL and publishable key belong in frontend environment
variables; database ownership is enforced by the prepared RLS migration.
Cloud failures are reported, never converted into guest writes. The learning-data
modlet uses this same session for tracked answers and owner-scoped reads. First-time
accounts get factory defaults; existing cloud data wins. Guest preferences stay
browser-local and are never imported automatically. Concurrent device saves use
last-write-wins, with no automatic live subscription.

See [operations/authentication guide](../../../docs/OPERATIONS.md#authentication) for the setup and hosted verification
reference. Pure configuration/repository tests run without credentials. Owner
verified hosted sign-in, two-account isolation and cross-device preferences. SDK DOM
declaration compatibility requires TypeScript skipLibCheck; strict checking of
application code remains enabled.

Reset acknowledgements increment the data revision embedded in identityKey and
notify same-browser account tabs. This invalidates active practices and cached
views without importing guest data. Server generation checks enforce correctness
when other devices cannot receive the broadcast.

Account change notices are held in provider memory, survive a Settings remount,
and can be dismissed. A confirmed reset announces retained preferences; a
verified deletion acknowledgement sets a notice before local sign-out so the
signed-out Settings view can confirm the result. Failures never announce success.

## Sign-in storage choice (1.1.0)

`session-storage.ts` selects tab-scoped sessionStorage by default, or localStorage
when the sign-in checkbox is selected. The existing default Supabase key is kept
for persistent sessions; each session-only tab gets a separate SDK key (including
its BroadcastChannel namespace). A tab's storage choice and identifier survive
reload and OAuth return. Duplicated/restored tabs can inherit sessionStorage.

AccountControls keeps the checkbox unchecked for each new sign-in UI. Sign-in
writes the choice plus a one-use pending redirect flag and reloads Settings. The
new client therefore owns the correct storage before writing the PKCE verifier.
AuthProvider consumes the flag and starts Google OAuth once, including under React
StrictMode. Verifier exchange and session refresh are handled by the SDK. Errors
surface in Account controls; storage failure never falls back to persistence.

Unmarked existing localStorage sessions are retained during rollout without
recording consent. Testers sign out/in once to make an explicit choice. Learning
records and preferences are unchanged; no SQL migration is needed. The SDK's local
sign-out clears its selected session and informs tabs sharing that persistent
session. Independently authenticated session-only tabs have their own sessions.

Pure storage and SDK tests use synthetic tokens/responses, never live credentials.
Local browser fixture review covered both OAuth redirects, reload, new-tab isolation,
persistent sharing and sign-out broadcast. Real Google and provider session limits
remain hosted verification checkpoints in OPERATIONS.
