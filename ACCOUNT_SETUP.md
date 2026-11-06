# Reset and account deletion setup

The owner deployed and verified the controls on staging and approved production
promotion on 6 November 2026. This file remains the setup reference for new
environments.
The assistant has not reset or deleted any real account. All controls are deployed. Support contact: conjugadora.support@gmail.com.

## 1. Apply the migration

In the existing Supabase project → SQL Editor → New query, run all of
[202611060002_account_controls.sql](supabase/migrations/202611060002_account_controls.sql)
**once**, after the two existing migrations. Expected: Success, no rows.
Do not rerun the earlier migrations.

This adds the learning-data generation marker, reset RPC and guarded practice
write wrappers. Old clients remain compatible until that particular account is
reset; after reset, old generation-less starts fail closed and require the new
app. Existing runs get the current generation. This migration is already applied to the current project. For a new environment,
apply it before starting tracked practices. Test reset/deletion only with a
disposable account.

## 2. Deploy the server function

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

No new Vercel environment variables or Google OAuth changes are needed.
If you prefer dashboard deployment, we can walk through uploading both files and
matching the function's configuration/secrets; do not paste just the entry point
without its shared dependency.

## 3. Verify using a disposable Google/account identity

These are irreversible actions on the account you choose. Do not use your main
learning account for destructive verification. The owner performs the actual
reset/deletion confirmations.

1. On stable staging, sign in with the disposable account, change preferences,
   and complete a practice. Open Progress/History and record the known state.
2. Settings → Reset all learning data → Cancel. Verify nothing changed.
3. Confirm reset. Progress and History must be empty; sign-in and saved practice
   preferences must remain. The SQL reset is atomic and retains only the minimal
   generation/reset marker needed to reject old requests.
4. Open a practice in another tab before reset. After reset, attempts from that
   old run must not restore data. Same-browser tabs invalidate through a
   BroadcastChannel; other browsers/devices are stopped by the server marker.
   Start a fresh practice and verify new answers save normally.
5. Simulate a lost reset reply with the SQL test below. Repeating its ID must
   acknowledge the same reset without clearing answers submitted afterwards.
6. Settings → Delete account → Cancel. Verify nothing changed. Reopen, type
   DELETE, then explicitly confirm. Expect local sign-out. In Supabase Auth and
   the database, that disposable user and their rows must be gone.
7. Sign in again using that Google identity. Expect a fresh Supabase user ID,
   factory account preferences, and no previous learning data. Your Google
   account itself is unchanged. Other users' records must remain intact.
8. Check failed network/function responses show an error rather than success.
   A lost delete reply may already have committed: retry remotely verifies the
   identity and cannot target a newly signed-in different account. If the old
   account is already unavailable, sign out and inspect Supabase before retrying.
9. Read `/privacy` and confirm the contact and storage/retention description.

Browser-local guest defaults stay separate and are not erased by account reset
or deletion. Deletion clears the active database via FK cascades; provider logs
and backups follow their own retention. Existing access JWTs can remain valid
until expiry, but deleted identities cannot create new learning state or write
practice data, and no old database rows remain accessible.

## 4. Isolated SQL verification

In a disposable project with the earlier migrations applied, apply the new
migration, then run all of
[account_controls.sql](supabase/tests/account_controls.sql), including begin and
rollback. It creates synthetic identities and models deletion by deleting only
its own fixture auth row inside the rollback transaction.

Expected: Success, no rows. Checks cover reset preserving settings, all learning
record deletion, duplicate reset after new answers, stale reset/start/answer
rejection, legacy-client sealing, another user's data surviving, the original six-table
FK cascade coverage (the Progress preferences test covers the seventh), private-helper/anonymous denial, and old deleted-user JWT
rejection. This is not a substitute for testing the deployed GoTrue deletion
endpoint with the disposable account.

## Checks already performed

- Actual SQL migrations/tests pass in isolated PostgreSQL/WASM.
- Deletion-handler unit tests reject unauthenticated, foreign-origin,
  unconfirmed and mismatched-target requests. Server failures never report
  success. A supplied victim ID cannot select a deletion target.
- Deno typecheck passes for the deployable entry point. Its pinned SDK and admin
  credentials stay outside frontend code; production assets are checked for
  server-only credential names/handler code.
- The development-only `/dev/account-controls` fixture tests cancellation,
  failure/retry with the same request ID, and exact typed DELETE gating without
  calling Supabase or deleting anything real. It is excluded from production.
- The owner deployed the migration/function and verified account controls.
  Independent multi-connection races require hosted checks; local WASM is serialized.

References: [Edge Function deployment](https://supabase.com/docs/guides/functions/deploy),
[server secrets](https://supabase.com/docs/guides/functions/secrets),
[auth verification](https://supabase.com/docs/guides/functions/auth),
[admin deletion](https://supabase.com/docs/reference/javascript/auth-admin-deleteuser),
[JWT/deletion behaviour](https://supabase.com/docs/guides/auth/managing-user-data).
