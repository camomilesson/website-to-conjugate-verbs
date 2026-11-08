# Learning data modlet

`index.ts` exposes account tracking, queries, immutable submission snapshots and
weighted totals. `model.ts` stays pure; `repository.ts` uses the auth client.
Practice starts a server-issued run with effective configuration, presets,
defaults/dataset versions, and actual eligible length. Each answer is locally
checked, then persisted before feedback/advance. `retryableSubmission` holds one
in-memory ID/payload across failures and shares concurrent send attempts. The UI
blocks further answers until acknowledgement and drops its queue on identity
change. No persisted browser queue or resume mechanism exists.

Database writes use owner-checked security-definer RPCs with empty search_path,
explicit permissions, run-row serialization, atomic counter upserts, and unique
submission/ordinal/question receipts. Final-answer receipt, counts and history
share one transaction. Only History retains a completed test; incomplete run
metadata contains no question queue. Counts use choice/na, typing/strict, and
typing/relaxed dimensions. Overall percentages divide summed counts.

Retries expire after 24h. Old run IDs always reject, even after cleanup. Metadata
and receipts are eligible for opportunistic owner cleanup at 7 days; aggregate
counts and completed history remain until reset/deletion. See
[tracking verification guide](../../../docs/OPERATIONS.md#verification) for SQL tests, hosted setup,
retention caveats, concurrency checks and local test runtime instructions.

Correctness is client-reported personal practice data, not secure grading.
Reads are RLS-scoped and sorted; count reads page through all buckets (rather
than silently accepting the API's 1,000-row default). The History modlet owns cursor pagination of completed entries. Read requests ignore stale identity responses;
there is no real-time subscription. Refresh or re-enter the tab to reload data.

`data.ts` is the public entry point for pure models and History response parsing;
it can be imported by Node tests without initializing browser account services.
`index.ts` also exposes the account repositories and React hook. History rows
and Progress count rows are validated at their repository boundaries, including
nested History selections, optional saved defaults, timestamps, and mistakes.
Malformed replies reject with a message handled by the existing retry UI.
