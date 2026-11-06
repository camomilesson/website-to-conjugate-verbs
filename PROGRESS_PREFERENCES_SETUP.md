# Progress display preferences setup

The owner applied and verified this migration. For a new environment, one database change is needed. No new Vercel environment variables,
Google OAuth configuration or Edge Function deployment is required.

## Apply once in the existing project

In the existing Supabase project (`gtwnkerinjbonfoynach`), open SQL Editor,
create a new query, paste the entire contents of
`supabase/migrations/202611060003_progress_preferences.sql` and run it.
The previous three migrations must already be applied. Do not rerun earlier
migrations or rerun this one after it succeeds. This adds a table and policies;
it does not modify existing practice defaults, learning counts or History.

The table holds one versioned JSON settings row per user. Authenticated users
can only select, insert and update their own row. Anonymous access is denied.
A learning reset leaves the row intact; deleting auth.users cascades its removal.

## Review on staging

1. Open Progress, change sorting, answer-mode/accent filter and columns.
2. Visit History, return to Progress, then reload: choices should remain.
3. Choose custom columns, including Overall only; reopen after navigation.
4. Sign in to the same account on another device: choices should restore.
5. Switch accounts: each should retain its own choices; new accounts use defaults.
6. Search is temporary and clears on leaving Progress. Guest choices stay in
   that browser, and do not become account defaults when signing in.
7. Inspect Basic (6), Advanced (10, excludes Basic) and All (16) in Practice
   and Progress. Previously saved built-in Advanced selections follow the new
   split; custom selections and historical practices retain their exact IDs.
8. Hover/focus/tap a tense during practice. Read the English explanation and
   compound/progressive formation hint; Escape closes it. No score penalty.

If saving fails, the view shows an error and Retry saving view. Navigation
waits for queued saves when restoring. Offline writes are not a durable offline
sync system: retry successfully before closing the browser.

## Isolated SQL checks

Use a disposable Supabase project with all four migrations for
`supabase/tests/progress_preferences.sql`. It tests two owners, foreign read and
write rejection, anonymous rejection, validation, reset preservation and account
cascade inside a rolled-back transaction. Never substitute real users.

Local equivalent:
`node scripts/check-learning-sql.mjs /path/to/@electric-sql/pglite/dist/index.js`

Hosted cross-device review remains an owner check; local SQL tests do not replace it.
