# Step 9: setup and review

Step 9 is approved and deployed to production. This is the retained setup and
verification reference for a new database. Apply the migration only if absent.
No new keys, Google settings, environment variables, or paid services are needed.

## Apply the new migration

1. In the existing Supabase project used by Vercel, open SQL Editor → New query.
2. Run the **entire** [202611060001_durable_practice.sql](supabase/migrations/202611060001_durable_practice.sql)
   once. The earlier preferences migration must already exist; do not rerun it.
3. Expected: Success, no rows. If it errors, stop and share the message.
4. Open the stable staging URL ending in `/settings`, sign in, and start practice.
   The production website shares this database but its step 8 code is unchanged.

The migration adds four tables and two authenticated RPCs. Clients can only read
own counters/history; they cannot directly insert/update either. RPCs take the
owner from the active session, lock the run, and atomically write a receipt,
aggregate increment, and (on the last answer) one history record. Run metadata
has no queue and cannot resume a test. Server-issued run IDs prevent a deleted
receipt from being recreated as an old test.

## Browser verification on staging

For a deterministic test, choose Typing, only hablar, only Presente indicativo,
only yo/tú, and 2 questions. Use a dedicated test account or record the starting
counts first. The answers are `hablo` for yo and `hablas` for tú.

1. Submit one correct answer, then end the practice before answering the second.
   Progress gains one correct/answered; History gains nothing. Refresh and check
   the count remains. The unfinished practice must not be resumable.
2. Start another 2-question practice. Answer one correctly and type `wrong` for
   the other. Wait for acknowledgement, then finish. Progress gains 1/2; History
   gains exactly one item with score 50%, the effective sets, defaults/dataset
   version, and one mistake. Correct feedback still advances automatically.
3. Change to accents ignored and repeat; also try Multiple choice. Use the
   Progress filter to check strict/relaxed/choice buckets stay separate. Combined
   accuracy must divide summed correct by summed answered, not average percentages.
4. Browser developer tools → Network → Offline before submitting an answer.
   Submit: expect a save error, locked answer, and Retry save; no Next and no
   correct-answer automatic advance. Restore Online, click Retry save, and check
   exactly one new answer appears. Do not navigate away during this check.
5. For a lost-reply replay check, use the duplicate calls in the SQL test below.
   In the UI a saved answer's retry uses the same immutable ID/payload. The same
   ID with changed data rejects; a new ID for an already-counted ordinal rejects.
6. Use two tabs on the same account, start a single-question hablar/Presente/yo
   practice in both, and submit `hablo` in both. Expect exactly +2 correct/+2
   answered and two history entries; repeat overlapping submissions to exercise
   concurrent increments. Independent PostgreSQL-session concurrency remains a
   hosted verification item; the local WASM runtime serializes its connection.
7. Refresh History and check no duplicates. Sign out, verify guest practice stays
   unsaved, then switch accounts and check neither sees the other's data. Check
   an account switch abandons the current queue rather than submitting it as the
   new user. Cross-device review should show the same saved counts/history.

Progress is currently a real-data table with mode filters, not the step 10
heatmap. History shows the latest 50 entries; filtering/pagination/polish belong
to step 11. No reset or account deletion UI is introduced in this step.

## Database ownership / retry / atomicity test

Use a **disposable project**, not the primary project, because the test installs
an intentionally failing history trigger inside its rollback transaction.

1. Apply the earlier preferences migration if this temporary project is new.
2. Apply the new durable-practice migration once.
3. Run all of [durable_practice.sql](supabase/tests/durable_practice.sql), including
   its `begin` and final `rollback`. Expected: Success, no rows.

The script checks known counts, repeated submission IDs (including final-answer
retry), conflicting retries, ordinal/question uniqueness, abandoned tests,
mode/accent buckets, account isolation, forbidden direct writes/receipt reads,
anonymous denial, expiry, and rollback of all final writes after an injected
history failure. Fixtures and the failing trigger are rolled back.

## Retry lifetime and storage

Tracked runs accept submissions/retries for 24 hours after start, then reject
them (including old duplicate calls). Run metadata and minimal fingerprint
receipts remain for at least 7 days; starting another practice opportunistically
removes that user's older runs/receipts. There is no scheduled cleanup yet, so
inactive accounts can retain them longer. Completed History and aggregate counts
persist independently; cleanup does not reduce them. Unknown/deleted run IDs
reject and cannot be supplied to start_practice to resurrect an old run.

Only one example mistake is retained per run/history entry. Question queues and
full answer logs are never stored. Pending browser payloads exist only in memory:
closing/reloading discards them, and a lost reply may already have committed.
Correctness is checked by the client against static catalogue answers; this is
personal learning data, not a tamper-proof examination or leaderboard.

## Validation already performed

- Pure tests cover weighted percentages, immutable snapshots, rejected/malformed
  acknowledgements, single in-flight write, and retry after a lost reply.
- Both migrations and the full database test ran successfully in isolated PGlite
  PostgreSQL/WASM with simulated Supabase auth roles. This checks actual SQL but
  is not a claim of hosted Supabase integration or multiple-connection testing.
- Guest browser checks cover completing practice and signed-out Progress/History.
- A synthetic local account API backed by the actual SQL exercised tracked
  practice in the browser: an injected lost reply after commit locked the answer;
  retry acknowledged it once, with exactly one count and one History record. A
  second unfinished practice retained its correct answer without adding history.
  This fixture API is temporary test tooling, not a production dependency or a
  claim of testing Google/Supabase hosting.

To rerun SQL locally without adding a project dependency:

```sh
npm install --prefix /private/tmp/conjugadora-db-check @electric-sql/pglite
node scripts/check-learning-sql.mjs /private/tmp/conjugadora-db-check/node_modules/@electric-sql/pglite/dist/index.js
```

Sources for the implementation: [Supabase database functions](https://supabase.com/docs/guides/database/functions),
[Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security),
[PostgreSQL atomic upsert](https://www.postgresql.org/docs/18/sql-insert.html).
