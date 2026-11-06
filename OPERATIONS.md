# Conjugadora operations

Production: https://conjugadora.vercel.app

Staging: https://conjugadora-git-staging-camomilesson-3235s-projects.vercel.app

Both environments currently use the same Supabase project (`gtwnkerinjbonfoynach`).
A staging practice can therefore change real account statistics. Use disposable
identities for reset/deletion and regression tests. A feature branch preview has
its own origin/storage and may lack an allowed OAuth return URL; use stable
staging for account review. Production access must not require a Vercel login.

## Database and migrations

Apply migrations once in filename order on a new project:

1. `202611050001_user_preferences.sql`: practice defaults, ownership RLS.
2. `202611060001_durable_practice.sql`: runs, receipts, accuracy, History, atomic RPCs.
3. `202611060002_account_controls.sql`: learning generation, safe reset and guarded writes.
4. `202611060003_progress_preferences.sql`: display settings, ownership RLS.

The existing hosted project already has these migrations; **do not rerun them**.
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
RPCs derive identity from authentication, serialize writes and atomically update
receipts, counts and final History. Retry payloads/IDs remain immutable. A reset
changes the generation so old runs cannot restore cleared counts. Browser tab
notifications improve freshness; server checks enforce cross-device safety.

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

## Keys, OAuth and account deletion

Browser variables, for both Vercel Production and Preview:
`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`. Vite embeds them at build
time; redeploy after changes. RLS protects data, not secrecy of these values.
Keep privileged keys and Google client secrets server-side only.

Google's client secret lives in Supabase's Google provider configuration.
The callback is `https://gtwnkerinjbonfoynach.supabase.co/auth/v1/callback`.
Supabase permits the production/staging `/settings` redirects; the app derives
its return origin from the browser. See AUTH_SETUP.md for exact settings.

OAuth stays in Testing by explicit owner decision (6 November 2026). Basic
`openid`, email and profile are the intended/declared scopes. The public sign-in redirect
was checked during release review and requested `email profile`. Check the actual
requested scopes when provider configuration changes. Additional scopes can
introduce different testing/verification requirements. No Google API integration
beyond sign-in is part of this release.

The `delete-account` Edge Function has `verify_jwt = false` in platform config
because the handler validates bearer tokens remotely with `auth.getUser` and
binds deletion to that verified identity. This is not an anonymous deletion API.
`ACCOUNT_ALLOWED_ORIGINS` permits the exact production/staging origins. The
platform supplies server credentials; they must never enter a Vite environment.
Deploy both the entry point and `_shared/delete-handler.ts` dependency; commands
and disposable-account checks are in ACCOUNT_SETUP.md.

## Routine release and rollback

1. Work on a `codex/` branch. Run `pnpm lint`, `pnpm test`, `pnpm build`, the SQL
   harness for database-related work, and the release artifact check.
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
See the catalogue modlet/report for provenance. Keep category IDs stable because
stored statistics/history use them; changing historical meanings needs an explicit
migration strategy. Defaults/history interpretation is also versioned.
