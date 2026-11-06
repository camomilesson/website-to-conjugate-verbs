# Account controls modlet

Public UI: DataControls, useLearningGeneration; a lazy fixture demo is available
only during development. Repository calls owner-scoped reset/generation RPCs and
the authenticated deletion Edge Function. No privileged key is read in the app.

Reset confirmation captures a UUID and acknowledged generation. Retry reuses both
until the dialog closes. Server generation/reset ID comparison stops a lost
reply's retry from erasing newer work. Practice setup obtains a generation before
Start is enabled; writes are serialized against reset through learning_state
row locks. Old run IDs, old generations and legacy starts after reset reject.
Same-browser tabs invalidate through the AuthProvider data revision/Broadcast-
Channel, remounting Practice/Progress/History/Settings. Cross-device safety is
server-enforced even without that notification.

Deletion requires typed DELETE and account-specific confirmation. The Edge
Function remotely validates the bearer token and ignores client-supplied target
IDs except to compare the expected current owner. The verified identity is
hard-deleted through the admin API; all six public account tables cascade from
auth.users. Frontend sign-out only applies to the same account that initiated the
request. Unknown outcomes remain errors; retries cannot delete a different new
account. Cancel never calls a write. In-flight confirmations cannot be dismissed
with Cancel/Escape. No real account is touched by automated/browser tests.

See [ACCOUNT_SETUP.md](../../../ACCOUNT_SETUP.md) for deployment, keys, SQL tests,
manual disposable-account verification, compatibility and retention details.
`supabase/functions/delete-account/index.ts` is typechecked separately by Deno;
the pure shared handler is tested by Node and checked by the app's TypeScript/
ESLint project. Development demo data/code and server credentials are excluded
from frontend production assets. Step 13 still owns release-wide privacy/terms
and provider publishing review.
