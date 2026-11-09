# Conjugadora operations

Production: https://conjugadora.vercel.app

Staging: https://conjugadora-git-staging-camomilesson-3235s-projects.vercel.app

Both environments currently use the same Supabase project (`gtwnkerinjbonfoynach`).
A staging practice can therefore change real account statistics. Use disposable
identities for reset/deletion and regression tests. A feature branch preview has
its own origin/storage and may lack an allowed OAuth return URL; use stable
staging for account review. Production access must not require a Vercel login.

The owner approved the public release (step 13) on 6 November 2026. The
implemented product and development commands live in [README](../README.md).
This document is the operational reference; historical plans/checkpoints remain
in Git rather than separate setup files.

- [Hosting and deployment](#hosting-and-deployment)
- [Database and migrations](#database-and-migrations)
- [Authentication](#authentication)
- [Account deletion](#account-deletion)
- [Verification](#verification)
- [Routine release and rollback](#routine-release-and-rollback)
- [Troubleshooting](#troubleshooting)

## Hosting and deployment

Import `camomilesson/website-to-conjugate-verbs` from GitHub with repository root
as Root Directory, **Vite**, **Node.js 24.x**, and production branch **main**.
`package.json` pins pnpm 12.16.1. `vercel.json` defines:

- Install: `pnpm install --frozen-lockfile`
- Build: `pnpm build`
- Output: `dist`

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` for both Production
and Preview. They are browser-public configuration; no privileged key belongs
there. Redeploy after variable changes. Without configuration, guest practice
works but account features do not. See [Authentication](#authentication) for provider configuration.

### Publishing workflow

1. Implement on a `codex/` feature branch and run relevant checks.
2. Merge into permanent **staging**, push, wait for successful Vercel deployment,
   and have the owner review at the stable staging URL. Use that origin for OAuth
   tests; branch previews are for isolated review and may not support sign-in.
3. After approval, fast-forward **main** to the reviewed commit and push. Confirm
   the new production deployment completes and public routes/assets work.
4. Keep staging as a Preview environment; do not change the production branch.

Existing production/staging deployments use the same Supabase database. Avoid
breaking migrations or destructive test actions on real accounts. See the migration, rollback and troubleshooting sections below.

`vercel.json` serves the SPA for `/practice`, `/progress`, `/history`, `/settings`
and `/privacy`; unknown application routes redirect to Practice. `/assets/` and
`/data/` are excluded from the rewrite so missing static files return errors,
not application HTML. `/favicon.svg` is the tab icon. Verify real deployed
routes after release; `pnpm preview` only checks a local production build.

A changed domain also requires updating Supabase Site URL/allowed returns,
Google origin/callback configuration as appropriate, and deletion allowed
origins. Browser-local choices and sessions do not migrate between origins.
Retain the existing preference key to preserve saved data on the same origin.

## Database and migrations

Apply migrations once in filename order on a new project:

1. [202611050001_user_preferences.sql](../supabase/migrations/202611050001_user_preferences.sql): practice defaults, ownership RLS.
2. [202611060001_durable_practice.sql](../supabase/migrations/202611060001_durable_practice.sql): runs, receipts, accuracy, History, atomic RPCs.
3. [202611060002_account_controls.sql](../supabase/migrations/202611060002_account_controls.sql): learning generation, safe reset and guarded writes.
4. [202611060003_progress_preferences.sql](../supabase/migrations/202611060003_progress_preferences.sql): display settings, ownership RLS.
5. [202611090001_targeted_verb_modes.sql](../supabase/migrations/202611090001_targeted_verb_modes.sql): allow saved Least practiced/Most mistakes labels in practice metadata and History.

The existing hosted project has the first four migrations; **do not rerun them**.
Apply migration 5 once in the Supabase SQL editor before testing saved targeted
modes. It preserves existing rows and public write guards. No Edge Function or
Google provider configuration change is needed.
Create a new additive migration for schema changes. Rehearse in a disposable
project, test access policies and compatibility, apply the migration before
shipping code that requires it. Never relax RLS to work around a frontend error.

Seven public tables reference `auth.users` with deletion cascades:

| Table                | Purpose                                                       |
| -------------------- | ------------------------------------------------------------- |
| user_preferences     | Versioned practice defaults                                   |
| progress_preferences | Versioned display preferences                                 |
| practice_runs        | Short-lived run metadata; no resumable queue                  |
| answer_receipts      | Minimal deduplication/fingerprint records                     |
| accuracy_counts      | Correct/answered buckets by verb/category/mode/accent policy  |
| practice_history     | Completed summaries, effective settings/versions, one mistake |
| learning_state       | Generation and reset marker preventing stale writes           |

Users can read their own learning records; only RPCs write counts/History.
Both preference tables allow authenticated users to read/insert/update only their
own versioned row; anonymous access is denied. Progress display settings are
independent of practice defaults. Missing tables/network errors must surface as
errors rather than importing guest settings.
RPCs derive identity from authentication, serialize writes and atomically update
receipts, counts and final History. Retry payloads/IDs remain immutable. A reset
changes the generation so old runs cannot restore cleared counts. Browser tab
notifications improve freshness; server checks enforce cross-device safety.
After reset, older generation-less clients must reload the current app. Runs
from before reset cannot restore cleared data. Only one example mistake is kept
per run/history; question queues and full answer logs are never stored. Pending
browser submissions are memory-only: closing the page loses pending state, and
an unknown network reply may already have committed. These statistics are
client-checked personal practice data, not tamper-proof grading.

## Retention

- Practice submissions expire after 24 hours. An old run never becomes writable
  again because a receipt was removed.
- Run metadata/receipts become eligible for cleanup seven days after creation.
  Cleanup is opportunistic on the owner's next practice start, not a scheduled
  daily job. Inactive accounts can retain metadata longer.
- Counts/History remain until learning reset or account deletion. Both kinds of
  preferences survive learning reset and are removed on account deletion.
- A minimal generation/reset marker remains after reset to reject stale requests.
- Guest choices/session tokens are browser-local. Account deletion does not erase
  independent guest defaults. Provider backups/logs follow provider retention.

## Authentication

### Sign-in storage rollout (1.1.0)

No database migration, Edge Function deployment, environment variable or new OAuth
redirect URL is required for the remember-me change. Deploy the frontend to stable
staging first. Existing sessions keep working; ask the small tester group to sign
out and sign in once to make the new choice. Do not clear learning data.

Before production, verify:

1. Sign out, leave “Keep me signed in on this device” unchecked, and complete real
   Google sign-in. Refresh the same tab: account/preferences/progress should return.
   Open a separate tab directly: it should be a guest when no persistent session
   exists. Browser restore or Duplicate Tab may preserve session storage.
2. Sign out, repeat with the checkbox checked, and verify sign-in in a separately
   opened tab and after closing/reopening the site. Sign out and confirm the other
   persistent tab updates. Independent session-only logins are separate sessions.
3. Confirm Google cancellation/error handling, retry, account switching and existing
   data restoration. Verify deletion's existing local sign-out path in a disposable
   test account only; never delete a real tester account just for a smoke check.
4. Inspect Supabase dashboard session timebox/inactivity settings if an exact login
   duration is needed. This update does not set a fixed maximum: access tokens
   refresh, and persistence ends on sign-out, site-data removal, expiry or revocation.

Google OAuth intentionally remains **Testing** by owner decision on 6 November 2026. Declared scopes are `openid`, `https://www.googleapis.com/auth/userinfo.email`
and `https://www.googleapis.com/auth/userinfo.profile`. The public production
redirect was inspected at release and requested only `email profile`, with the
correct Supabase callback and production `/settings` return. No Gmail/Drive API
access is part of the product.

Google's basic identity exception permits users outside the test list without
the usual testing warning or seven-day authorization expiry. Adding other scopes
changes the requirements. Workspace/account restrictions can still block access.
Brand verification/publication is deferred by explicit choice, not a pending
release task. [Google's audience guidance](https://support.google.com/cloud/answer/15549945?hl=en).

### Provider setup for a new environment

1. Create a Supabase project; choose a region/plan and store its password privately.
2. Apply all five migrations once in the [order above](#database-and-migrations).
3. Obtain the project URL and **publishable key** (`sb_publishable_…`).
4. In Google Auth Platform, configure Branding, Audience and the three basic
   scopes in Data Access. Create a Web application OAuth client.
5. Register the exact callback from Supabase's Google provider panel as Google's
   authorized redirect URI. The current callback is
   `https://gtwnkerinjbonfoynach.supabase.co/auth/v1/callback`.
   Use the new project's own callback for a new environment, not this value.
6. Enable Google in Supabase Authentication → Providers; enter the Google client
   ID and client secret there. Never put that secret in browser code or Vercel
   `VITE_` variables. Keep nonce checks enabled and do not allow missing email.
7. Set Supabase Site URL to `https://conjugadora.vercel.app`. Allow these exact
   application redirects:
   - `https://conjugadora.vercel.app/settings`
   - `https://conjugadora-git-staging-camomilesson-3235s-projects.vercel.app/settings`
   - Optional local origin plus `/settings`, matching localhost or 127.0.0.1 exactly.
8. Where Google requires JavaScript origins, use application origins with no
   path. The OAuth callback remains the Supabase callback, not an app route.
9. Set the two browser variables for **Production and Preview** in Vercel:

```text
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_…
```

Use Vercel Config for browser-public values. Redeploy after edits because Vite
embeds them at build time. Local development can use `.env.local` copied from
`.env.example`, followed by a Vite restart. No key should be pasted into chat.

### Branding contacts

Public app contact: conjugadora.support@gmail.com. For Google's User support
email dropdown, sign in as that Google account with project Editor/Owner access,
or select a Google Group managed by the signed-in user. Developer contact can
remain the owner's private monitored address. Changing these does not require
replacing OAuth client credentials. The owner confirmed Google's displayed
Branding name is already Conjugadora; confirm the support dropdown if not yet
updated. [Google's branding settings](https://support.google.com/cloud/answer/15549049?hl=en).

Use stable staging for account review. Unregistered feature preview origins may
fall back to production's Site URL. Browser sessions/guest storage are separate
per origin, even when account data is shared. Last successful account preference
save wins across devices; there is no live subscription. Refresh/re-enter data
tabs to load new account data.

## Account deletion

From the repository root, using the Supabase account that owns your project:

```sh
npx supabase login
npx supabase secrets set ACCOUNT_ALLOWED_ORIGINS='https://conjugadora.vercel.app,https://conjugadora-git-staging-camomilesson-3235s-projects.vercel.app' --remote=YOUR_PROJECT_REF
npx supabase functions deploy delete-account --remote=YOUR_PROJECT_REF
```

Replace YOUR_PROJECT_REF with the identifier before `.supabase.co` in your
project URL. Use the stable staging domain as listed by Vercel, correcting the
origin above if it differs. Run these from the folder containing `supabase/`;
the function imports the adjacent shared handler, so deploy the whole function,
not only a pasted fragment of index.ts.

The runtime supplies `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` for the
server-only admin client. If your project requires a current secret key instead,
set **ACCOUNT_ADMIN_KEY** in Supabase Edge Function Secrets to an `sb_secret_…`
key; it overrides the built-in service-role credential. Enter that privately via
the dashboard rather than putting a secret literal in shell history. Neither
credential belongs in Vercel VITE variables, Git, browser code or chat.

The function configuration has `verify_jwt = false`: the handler performs its
own mandatory remote `auth.getUser(token)` verification, rejects missing/invalid
sessions, and derives the deletion target solely from the verified user. This
supports the browser publishable-key setup without relying on the gateway's
legacy verification. Do not deploy a different anonymous handler under this
name or remove the in-handler verification. Only configured web origins are
accepted for CORS. All deletions require POST, explicit DELETE confirmation and
an expected user ID matching the authenticated account.

No additional Vercel variables or Google OAuth changes are needed for deletion.
For dashboard deployment, include both files and matching configuration/secrets.
Existing access JWTs may remain valid until expiry after account deletion, but
server identity checks prevent deleted users from creating new learning state.
A retry cannot select a newly signed-in different account for deletion.

## Verification

Run these from the repository root:

```sh
pnpm check:release
npm install --prefix /private/tmp/conjugadora-db-check @electric-sql/pglite
node scripts/check-learning-sql.mjs /private/tmp/conjugadora-db-check/node_modules/@electric-sql/pglite/dist/index.js
```

`check:release` runs lint/typecheck/formatting, Node tests, catalogue validation,
production build and artifact audit. The audit checks asset/favicon references,
100 static verb files, old branding, fixture routes/content, known server-only
credential names, secret-key patterns and privileged JWT roles. It is a targeted
static audit. The optional SQL harness runs actual migrations and all five SQL
suites with simulated auth roles in PGlite; it adds no application dependency.
Deno separately checks the deployable Edge Function entry point when changing it:

```sh
deno check supabase/functions/delete-account/index.ts
```

### Database verification

For hosted SQL checks, use a **disposable project**, apply the relevant migrations
in order, and run each entire test including its transaction/rollback. Expected:
Success, no rows. Never substitute real account IDs.

| Suite                                                                  | What it checks                                                                                                                                          |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [preferences_rls.sql](../supabase/tests/preferences_rls.sql)           | Own preference reads/writes, foreign/anonymous denial                                                                                                   |
| [durable_practice.sql](../supabase/tests/durable_practice.sql)         | Known counts, immutable duplicate/final retries, ordinals/questions, mode buckets, expiry, ownership and atomic rollback after injected History failure |
| [account_controls.sql](../supabase/tests/account_controls.sql)         | Reset retention, lost-reply reset replay after newer answers, stale/legacy write rejection, private/anonymous denial and deletion cascades              |
| [progress_preferences.sql](../supabase/tests/progress_preferences.sql) | Display validation, two-owner isolation, reset preservation and seventh-table deletion cascade                                                          |

The tracking test installs an intentionally failing trigger within its rollback
transaction, so it must not run in the primary project. PGlite serializes one
connection; it does not prove independent hosted races or the real Supabase
GoTrue deletion service. Deletion-handler Node tests and a prior Deno entry-point
check complement the SQL suites. Local fixture UI routes never call real deletion.

### Background practice-save checks (1.1.0)

No migration or server redeployment is needed. The existing answer RPC still
requires sequential ordinals and deduplicates retries by submission ID/payload.

On stable staging, test typing and choice with throttled network responses:
feedback should appear immediately and questions may advance while saves remain
pending. After all questions, results must say they are waiting to save, disable
Repeat/New practice, and warn before navigation until acknowledgement completes.
Simulate a failed response: progression pauses and Retry save retains the original
submission. After successful retry, counts/history must not duplicate. Reload or
confirmed navigation can lose unsent answers; this is not offline persistence.
Account changes/reset must stop unsent requests from the old practice. Existing
server owner/generation checks remain authoritative for any in-flight requests.

### Targeted practice checks (1.1.0)

Apply migration 5 above before testing the saved modes. On staging, check that guest
Customize has no Least practiced/Most mistakes controls. Signed-in Customize
should load current counts, filter ranking when mode/accent/tenses change, and
explain an empty Most mistakes pool. Least practiced can start from an empty
account and prioritises unattempted combinations. Both cap selection at 20 verbs.
Save either targeted mode in Settings or start it from Customize. Reload and confirm
the home summary retains the mode. Test both quick-start cards and Repeat against
current progress (the previous resolved list must not become a fixed selection).
History should name the mode and retain the actual selected verbs. View progress
opens the updated heatmap only after all saves are acknowledged.
Inspect the tertiary Customize button and wrapped selection controls on mobile.

### Release smoke check

1. Open production without a Vercel session. Confirm Conjugadora, the subline,
   green/á favicon and all five public routes, including direct navigation/refresh.
   Missing `/assets/` and `/data/` paths must return errors, not the app HTML.
2. Complete guest typing and choice practices. Verify number selection, Enter
   Submit, Space Next, correct auto-advance, Repeat with the same settings, tense
   help and active-run leave confirmation. Guest answers must stay unsaved.
3. Sign in on stable staging: same allowed origin on return, session survives
   reload, new accounts start from factory defaults, existing settings restore.
   Sign-out/account switching clears stale drafts/questions and never imports
   guest answers. Check on another browser/device; users remain isolated.
4. Check Basic 6 / Advanced 10 / All 16, custom columns including Overall only,
   mode/accent filters, sorting/search, sticky matrix labels and keyboard details.
   Display preferences survive navigation/reload/devices; search/scroll do not.
   A failed save shows retry, not false success. Changes are not durable offline
   until successfully saved.
5. Inspect completed History, pagination, exact selections and a mistake; dates
   are viewer-local. Confirm public privacy/contact copy matches actual storage.
   Browser errors should be investigated, not dismissed as cosmetic.

### Deterministic tracking and retry check

Use a test account, Typing, hablar, present indicative, only yo/tú, 2 questions.
Answers are `hablo` (yo) and `hablas` (tú). Record starting counts.

1. Submit one correct answer, then abandon: Progress gains 1/1, no History entry,
   no resume after reload.
2. Complete another run with one correct/one wrong: Progress gains 1/2 and History
   gets exactly one 50% entry with effective configuration/versions and a mistake.
3. Repeat in relaxed typing and choice; check buckets and count-weighted Overall.
4. Simulate Offline before submission: save fails, answer stays locked, no Next
   or auto-advance. Restore Online and Retry: exactly one answer is counted.
   A lost-reply retry reuses the same ID/payload; SQL tests cover conflicting
   retries, duplicate ordinals/questions and final-answer rollback.
5. Start hablar/present/yo in two tabs and submit `hablo` in each: +2 correct/+2
   answered and two History entries. Repeat overlapping submissions for hosted
   concurrency. Refresh and check no duplicate History. Account switches must
   discard the old queue, not submit it as the new owner.

### Disposable-account reset/deletion check

Use a disposable Google identity, with owner confirmation for irreversible steps.
Never use the main learning account merely to rerun a release checklist.

1. Save both preference types, complete practice, record Progress/History. Cancel
   reset; nothing changes. Confirm reset; learning records clear while sign-in
   and both preference types remain.
2. Start a run in another tab/device before reset. Its later submissions must
   reject; a fresh post-reset practice saves normally. The SQL suite simulates
   a lost reset reply: retrying its ID must not clear newer answers.
3. Cancel Delete account; nothing changes. Reopen, type DELETE and explicitly
   confirm. Expect local sign-out and removal of that auth user and all seven
   public tables' owned rows. Other users remain intact.
4. Sign in again with that Google identity: fresh app user ID, factory defaults,
   no previous learning data; the Google account itself remains.
5. Network/function failures must not report success. A lost deletion reply may
   already have committed; inspect Supabase if the old identity is unavailable.
   Retry verification cannot target a newly signed-in different account.

### Release evidence and limits

Step 13 was owner-approved and promoted on 6 November 2026 (`ee8c80d`). The
release pass included 55 Node tests, all four SQL suites, lint/typecheck/build,
artifact audit, public route/static-file responses, guest keyboard flows,
Google's basic-scope redirect and a 1280×720 built branding/favicon/privacy check.
Hosted sign-in, cross-device settings, account isolation, progress/History and
reset/deletion were separately verified by the owner during development.
Vercel preview protection prevented the assistant's staging browser review; it
was left enabled. Prior synthetic local lost-reply browser tests proved their
fixture behavior, not hosted integration.

Known maintenance items: Vite warns about an approximately 615 kB raw / 178 kB
gzip JS chunk, while verb JSON remains separate; CSS still has a final visual
layer over baseline styles; dedicated mobile polish is deferred. System fonts
are installed fallbacks, not redistributed files. Values/labels accompany colours
and focus/keyboard controls remain available. The checked solid text/background
pairs meet 4.5:1 or better. Retest affected behavior after changes; completed
checks do not require destructive repetition for documentation-only updates.

## Routine release and rollback

1. Work on a `codex/` branch. Run `pnpm lint`, `pnpm test`, `pnpm build`, the SQL
   harness for database-related work, and the release artifact check (`pnpm check:release` covers the frontend checks).
2. Merge reviewed work into staging and wait for Vercel success. Review the stable
   staging URL with the owner, including account behavior when relevant.
3. After approval, fast-forward main and push. Verify the new production
   deployment, public routes and account sign-in. Keep the last good SHA/deployment.
4. For a frontend regression, restore the last good production deployment via
   Vercel or deploy a reviewed Git revert. Keep Git and the deployed state aligned.
   A frontend rollback does not undo migrations or recover deleted account data.

Do not blindly roll back database schema after deploying writes. Diagnose,
prepare a compatible corrective migration and test it separately. Before
potentially destructive maintenance, confirm available backups/recovery with
Supabase and the owner; no backup schedule is implied by this repository.

## Troubleshooting

| Symptom                                                  | Check                                                                                                           |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Redirect lands on production after starting on a preview | Exact originating `/settings` URL in Supabase allow list; use stable staging                                    |
| Google rejects sign-in                                   | Requested scopes, client/provider settings, exact callback, account/Workspace restrictions                      |
| Settings unavailable                                     | Browser env configuration, session, migration presence, RLS and Supabase status                                 |
| Answer save fails                                        | Keep the page open; retry the same submission after connectivity returns; do not promise unsaved data persisted |
| Progress differs from History                            | Abandoned sessions still contribute answers; filters differ; refresh/re-enter to reload account reads           |
| Delete fails                                             | Function deployment, allowed origin, remote auth and server logs; never substitute a client-supplied target ID  |
| New catalogue rejected                                   | Manifest/file dataset versions, category/person coverage, static file status/content                            |

Never request passwords, access/refresh tokens, private keys or unredacted auth
headers in a support report. Useful reports include public URL, time, action,
visible error, browser and relevant verb/category, with personal data removed.
Public contact: conjugadora.support@gmail.com.

## Costs and maintenance

The owner reviewed the current Vercel/Supabase plans and accepted them on
6 November 2026. Check the providers' actual dashboards for usage, limits,
retention and any spending controls; this document makes no fixed price or
free-tier guarantee. Review database size, authentication usage, bandwidth and
function failures as usage grows. A custom domain is optional.

Catalogue corrections: edit canonical public JSON, independently review affected
forms, update dataset versions consistently and add meaningful regression anchors.
See [the catalogue guide](CATALOGUE.md) for provenance. Keep category IDs stable because
stored statistics/history use them; changing historical meanings needs an explicit
migration strategy. Defaults/history interpretation is also versioned.

## References

- [Vercel Vite hosting](https://vercel.com/docs/frameworks/frontend/vite), [environments](https://vercel.com/docs/deployments/environments).
- [Supabase Google OAuth](https://supabase.com/docs/guides/auth/social-sign-in/auth-google), [API keys](https://supabase.com/docs/guides/getting-started/api-keys), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [SQL functions](https://supabase.com/docs/guides/database/functions).
- [Edge Function deployment](https://supabase.com/docs/guides/functions/deploy), [secrets](https://supabase.com/docs/guides/functions/secrets), [auth](https://supabase.com/docs/guides/functions/auth), [admin deletion](https://supabase.com/docs/reference/javascript/auth-admin-deleteuser), [user data/deletion](https://supabase.com/docs/guides/auth/managing-user-data).
- [Google audience](https://support.google.com/cloud/answer/15549945?hl=en), [branding](https://support.google.com/cloud/answer/15549049?hl=en).
- [PostgreSQL atomic upsert](https://www.postgresql.org/docs/18/sql-insert.html).
