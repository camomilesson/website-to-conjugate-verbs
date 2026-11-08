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
