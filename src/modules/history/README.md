# Completed-practice History

`index.ts` exposes History and a lazy development-only demo loader. The account
hook reads owner-scoped pages through `history-repository.ts`; pure formatting,
default comparisons and cursor helpers live in `history-model.ts`. The list and
controls are separate presentational components, with their styles here.

Pages contain 10 completed practices, ordered by completion time descending and
UUID ascending as a deterministic tie-breaker. The query requests 11 rows to
know whether another page exists; it no longer truncates the account to its
latest 50 practices. Date and UUID keyset cursors preserve PostgreSQL microseconds
and are validated before building PostgREST filters. The first page records an
upper ordering bound so returning to it does not pull in newer entries; Refresh
resets that bound and the page stack. Mode changes reset pagination. All reads
include user_id and remain protected by the existing RLS policy.

Requests are aborted on page/identity changes and stale results are hidden by a
request key. The application remounts this view when account identity changes.
Loading, error/Retry, signed-out and empty states are explicit. Page changes
announce and focus the page status, so keyboard users return to the new list.

Entries show device-local date/time, mode, percentage and correct/total, verb/
tense presets and counts, non-default settings, and one saved example mistake or
No mistakes. Expand Practice details for exact verb, category and person lists,
actual/requested count, and applicable accent policy. Mood/person labels are
readable; historical unknown IDs fall back to their stored values. Comparisons
use each entry's saved defaults snapshot, with practice-1 fallback only for a
known legacy version. The full mistake log is never implied to exist in History.

## Isolated fixture review

Run `pnpm dev` and open `/dev/history`. The demo uses 26 synthetic records,
including equal timestamps, different configurations, perfect results and
mistakes. It has 10/10/6 pages, an eight-record choice filter, expandable details,
and an Empty account toggle. It performs no account/database writes and is
removed from production builds. The production History tab always queries real
account data; there is no fake account history or migration to apply.

Tests cover page boundaries/tied timestamps, all-record traversal, cursor input
validation and microsecond preservation, mode filtering, saved-default version
changes, label rendering and perfect-test examples. Local desktop browser checks
covered next/previous, last-page disabling, focus after paging, mode reset,
keyboard expansion and empty-state controls. Hosted review remains the owner's
checkpoint: compare two real completed practices (ideally including a perfect
one), check exact selections and the saved example, and confirm abandoned tests
are absent. Switch accounts to verify no data carries over.
