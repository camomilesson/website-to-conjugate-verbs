# Implementation plan

Status: **Step 2 in progress** · 5 November 2026

[BLUEPRINT.md](BLUEPRINT.md) defines the approved product and architecture.
This file tracks execution. [MANUAL_SETUP.md](MANUAL_SETUP.md) lists account-owner
setup work. Step 1 was accepted by the user moving on to deployment.

## Working agreement

Ask “do step N” to start a step. The assistant implements that step, runs relevant
checks, records the result here, and provides exact verification instructions.
You verify it, report any issues, and approve moving on. Fixes belong to the
current step; do not silently start the next one. Steps may span several messages
when account setup or deployment needs your participation.

Use these states: Not started → In progress → Ready for your review → Verified.
Only mark Verified after your confirmation. Record changed scope explicitly in
the blueprint and plan. Do not commit, push, or deploy merely because a local
step is complete; agree the publishing workflow during step 2. Subsequent steps
should use that workflow so the public review build stays current.

Each handoff includes the outcome, automated check results, exact URL/commands,
manual checks with expected results, and any limitations. Commands and URLs below
describe expected verification; supply the actual working ones at handoff. Local
development is useful, but the final product and release checks are public.

## Step 1 — Navigable app shell

**Status:** Verified · **Depends on:** none

**Outcome:** A browser app with Practice, Progress, History, and Settings tabs.

**Assistant work:** Set up React/TypeScript/Vite, app composition and modlet
boundaries. Establish paper/ink/burgundy design tokens and base typography.
Retain useful existing logic, move console demonstrations out of the app entry,
and document development/build commands. Unimplemented tabs clearly explain
their current state; no fabricated progress or history. Retain lint tooling.

**Your prerequisites:** None.

**Assistant checks:** Typecheck, lint, formatting, production build, navigation
smoke check. No boilerplate tests for static placeholders.

**Your verification:** Start the supplied development command, visit all four
tabs, refresh the page, and inspect the desktop appearance and keyboard focus.
Expect a coherent shell, working navigation, and no console-example output.

## Step 2 — First public deployment

**Status:** In progress · **Depends on:** 1

**Outcome:** The shell is accessible at a public Vercel URL.

**Assistant work:** Prepare Vercel build/routing configuration, validate the
production build, and guide/import the prepared repo when access is available.
Agree the branch/push/deployment workflow, distinguishing production from review
deployments. Record the actual URL and setup instructions.

**Your prerequisites:** Complete the first-deployment section of MANUAL_SETUP:
repository access, Vercel account/integration, working app name, plan choice.

**Assistant checks:** Production build and public page/routing checks after the
deployment exists; confirm no secret configuration is bundled.

**Your verification:** Open the URL in a private browser window without signing
into Vercel. Visit/refresh all tabs. Expect the shell to remain publicly usable.
Agree how later review builds will be published.

## Step 3 — Reviewed starter catalogue

**Status:** Not started · **Depends on:** 2

**Outcome:** Inspectable canonical JSON data and a real verb/category selector.

**Assistant work:** Define stable IDs and all 16 approved categories with 6/16
Basic/Advanced presets; All covers all supported forms. Generate a small starter
catalogue, including regular hablar/comer/vivir, irregular ser/ir/tener, and
reflexive levantarse. Combine accepted subjunctive variants. Add catalogue
validation, reference/review notes, and a loader. Show verb/category selections
in Practice, with unavailable combinations excluded explicitly.

**Your prerequisites:** None; review the starter selection and labels.

**Assistant checks:** Validate every starter entry, category/person coverage,
nonempty answer arrays, imperative applicability, accepted variants, and loading
errors. Independently check tricky forms against grammatical references.

**Your verification:** Inspect one JSON file and the Practice selectors. Expect
seven verbs, Basic selecting 6 categories and Advanced/All selecting 16. Verify
that yo is never offered for an imperative and both subjunctive variants share
one category. A practice session is not yet expected to run.

## Step 4 — Complete guest typing practice

**Status:** Not started · **Depends on:** 3

**Outcome:** A guest can configure and complete a typing test.

**Assistant work:** Implement the eligible question pool, random sampling without
replacement, length capping, one/many/all verb selection, category/person
selection, typed checking, strict/relaxed accents, feedback, Next, and final
score/mistake list. Enter submits; Space advances only during feedback, without
breaking spaces in input. Prevent double submissions and held-key repeats.
Abandonment never restores a test; no skip action. Public Progress/History still
explain that tracked account data is forthcoming.

**Your prerequisites:** None.

**Assistant checks:** Pool uniqueness and capping, all accepted variants,
case/whitespace/Unicode normalisation, strict-vs-relaxed á/ñ/ü, score calculation,
state transitions, and keyboard behaviour.

**Your verification:** Complete a short hablar-present test with deliberate right
and wrong answers. Compare accented/unaccented answers in both policies and
exercise ñ/ü using the supplied fixtures or catalogue examples. Enter must submit
once, Space must advance only after feedback, and final counts must match your
answers. Reload mid-test: expect a fresh setup, no resumed test.

## Step 5 — Multiple-choice practice

**Status:** Not started · **Depends on:** 4

**Outcome:** The same configured test works with multiple-choice answers.

**Assistant work:** Add choice selection, keyboard-accessible options, plausible
distractors, shared feedback/scoring, and safe handling of small option pools.
Four unique options where possible; no accepted alternative may be a distractor.
Use fewer safe options when necessary, excluding questions with fewer than two.

**Your prerequisites:** None.

**Assistant checks:** Distractor uniqueness and validity across the starter
catalogue, accepted-answer exclusion, selected-answer submission, mode switching,
and correct pool sizing when questions are excluded.

**Your verification:** Complete a choice test containing irregular and reflexive
verbs. Expect one defensible correct option per question, accessible keyboard
selection, matching final counts, and no leftover typed answer when switching
modes for a new test.

## Step 6 — Remembered preferences and Settings

**Status:** Not started · **Depends on:** 5

**Outcome:** Guests return to their most recently started configuration.

**Assistant work:** Implement Settings and local persistence of verb/category IDs,
mode, length, persons, and accent policy. Save when starting a test; Settings
edits affect the same defaults. Handle missing/invalid/obsolete stored values.
Do not persist question queues or guest learning history.

**Your prerequisites:** None.

**Assistant checks:** Restore/fallback rules, save-on-Start, Settings precedence,
and isolation of preferences from active-session state.

**Your verification:** Start a customised test, leave/reload, and expect its setup
to be restored without resuming questions. Merely changing checkboxes without
starting must not replace saved selections. Change a preference in Settings and
expect it on the next setup. Existing active questions must remain unchanged.

## Step 7 — Full 100-verb catalogue

**Status:** Not started · **Depends on:** 6

**Outcome:** Both modes support the full release catalogue.

**Assistant work:** Curate 100 common useful verbs, including irregulars and
reflexives. Generate the JSON files directly during development; commit-ready
static files are the canonical data, not outputs of a required conjugation
engine. Review in manageable batches and record provenance, coverage, review
status, and version. Extend validators, check distractors against the full pool,
and measure download/loading behaviour.

**Your prerequisites:** Review the proposed 100-verb list before bulk generation.
This review occurs within the step; existing features remain usable meanwhile.

**Assistant checks:** All files and supported combinations validate; independently
check irregular families, participles, accents, alternatives, and reflexive
imperatives. Production build serves static assets without AI requests.

**Your verification:** Browse/search the 100 verbs, test an irregular and a
reflexive selection, then start an all-verbs/all-categories test. Review the
catalogue report and loading measurements. Expect 16 supported categories and
no missing-answer questions.

## Step 8 — Google accounts and synced preferences

**Status:** Not started · **Depends on:** 7

**Outcome:** Public Google sign-in works; account preferences follow the user.

**Assistant work:** Add Supabase client/environment template, auth UI, session
lifecycle, protected per-user settings schema/policies, and preference syncing.
Existing account settings take precedence over guest preferences; use approved
defaults for a new account. Do not import guest answers. Signed-out practice
remains available. Starting tracked practice and durable scoring arrive in step 9.

**Your prerequisites:** Supabase and Google OAuth setup in MANUAL_SETUP, production
redirect configuration, browser-safe project configuration, and account access
for applying prepared migrations/deployment settings. Never paste secrets into
chat. Decide whether auth testing uses production or one explicitly allowed
stable review URL.

**Assistant checks:** Settings ownership policies using two identities, session
errors, sign-out cleanup, production redirect, and no privileged browser keys.

**Your verification:** Sign in through the public URL, save a configuration, and
sign in with the same account in another browser. Expect matching preferences.
Sign out and verify guest practice. A second account must not inherit the first
account's preferences.

## Step 9 — Durable answer tracking and test completion

**Status:** Not started · **Depends on:** 8

**Outcome:** Every acknowledged signed-in answer updates progress; completed
tests create exactly one history record. Data is inspectable before the final UI.

**Assistant work:** Add aggregates by user/verb/category/mode/accent policy,
submission receipts, atomic deduplication/increment functions, and atomic final
answer/history insertion. Store counts, effective configuration/defaults version,
dataset version, and one example mistake. Integrate pending/error/Retry states;
the same submission ID is reused on retry. Provide a minimal real-data summary
in Progress/History for this step's review. Define receipt retention and retry
expiry together so old retries cannot count twice. No resume data or offline queue.

**Your prerequisites:** Permission/access to apply prepared database migrations.

**Assistant checks:** Known-answer counters, weighted percentages, concurrent
increments, duplicate retries, final-answer atomicity, user isolation, and network
failure handling. Mode/accent buckets must remain distinct.

**Your verification:** Submit a known right/wrong sequence, abandon the test, and
reload. Expect those answers in aggregates and no completed-history item. Finish
another test and expect one history item. Use the supplied retry check to verify
no duplicate count. During a failed save, expect a visible pending/error state
and no Next until acknowledged. A second account must see none of these records.

## Step 10 — Progress heatmap

**Status:** Not started · **Depends on:** 9

**Outcome:** The desktop verb-by-category heatmap displays real account data.

**Assistant work:** Replace the interim Progress summary with sticky headers and
verb names, mood groups, cell percentages/count details, Overall column, Basic/
Advanced/All/custom column views, search, sorting, and mode/accent filters.
Unattempted cells show a dash. Overall reflects all categories matching the
mode/accent filters, even when some columns are hidden. Include an isolated
fixture demo to inspect dense and empty states without polluting user data.

**Your prerequisites:** An account with the known results from step 9.

**Assistant checks:** Weighted aggregation, filters, missing cells, sorting, and
keyboard-accessible cell details. Review dense layout at desktop sizes.

**Your verification:** Locate the known verb/category cells and inspect their
counts. Switch Basic/All, scroll both axes, search, sort, and filter modes. Expect
fixed labels, all 100 verb rows available, 16 columns under All, correct weighted
overall values, and no 0% for unattempted cells.

## Step 11 — Completed-test history

**Status:** Not started · **Depends on:** 10

**Outcome:** History is a usable paginated list of real completed tests.

**Assistant work:** Build newest-first entries showing local completion date/time,
mode, correct/total and percentage, exact selections, non-default settings, and
first example mistake (or No mistakes). Expand entries for readable configuration
details. Preserve the distinction between a completed test's in-memory full
mistake review and history's single saved example.

**Your prerequisites:** Complete at least two tests with different settings and
one abandoned test during verification.

**Assistant checks:** Field rendering, defaults-version comparison, ordering,
pagination with fixtures, perfect-test handling, and per-user queries.

**Your verification:** Compare entries to the tests you completed, including a
perfect test if practical. Expect correct settings/scores and one example where
applicable; the abandoned test must be absent. Verify pagination using the demo
or enough completed tests, without inserting fake production history.

## Step 12 — Reset and account deletion

**Status:** Not started · **Depends on:** 11

**Outcome:** Users can clear learning data or delete their account safely.

**Assistant work:** Implement Reset all learning data and authenticated
server-side account deletion with explicit confirmations, failure states, and
data/privacy explanation. Reset clears aggregates, history, and receipts while
retaining settings; deletion also removes settings and auth identity. Invalidate
pending/active test submissions on reset so they cannot recreate cleared data;
deduplication plus a data-generation marker can enforce this server-side.

**Your prerequisites:** Disposable account, server-function deployment access,
and public contact address for the data explanation.

**Assistant checks:** Ownership, full deletion coverage, rejected stale writes
after reset, cancellation/failure behaviour, and absence of privileged secrets
in frontend assets. Never run destructive verification on your main account.

**Your verification:** On a disposable account, cancel a reset and confirm nothing
changes. Confirm reset and expect empty Progress/History with settings retained.
Delete the account and expect sign-out and removed records. Signing in again
must create a fresh profile without the deleted learning data.

## Step 13 — Public release and documentation handover

**Status:** Not started · **Depends on:** 12

**Outcome:** A polished public release matches the approved blueprint.

**Assistant work:** Finish newspaper styling, typography/licensing, contrast,
keyboard focus and shortcuts, empty/loading/error states, and comfortable desktop
overflow. Run the release checks, verify public auth/routing, and document current
deployment, development, data maintenance, and operations. Migrate lasting
blueprint information into README/module docs, then delete BLUEPRINT.md as
agreed. Mark this plan complete only after your release verification.

**Your prerequisites:** Review branding/contact copy and service costs/limits;
finish applicable release tasks in MANUAL_SETUP. A custom domain is optional.

**Assistant checks:** Full lint/typecheck/build and relevant automated suites;
deployed smoke checks for guest/authenticated practice, remembered settings,
progress, history, retry behaviour, and disposable-account controls.

**Your verification:** Open the public URL in a fresh browser, complete both
practice modes, sign in and check cross-browser persistence, inspect heatmap and
history, and use keyboard-only Submit/Next. Confirm visual approval and public
availability. Desktop support is required; mobile polish remains deferred.

## Step completion record

Append a short entry after each handoff; amend it after your review:

```text
Step N — Ready for your review / Verified
Review URL or exact local command:
Checks run and results:
Manual verification instructions / user result:
Known limitations or approved deviations:
```

### Step 1 — Ready for your review

- Local command: `pnpm dev`; open the printed URL (normally
  `http://127.0.0.1:5173/`). The verification server was stopped after checks.
- Checks passed: `pnpm lint`, `pnpm build`, and `pnpm examples`.
- Browser checks passed: all four navigation links, document titles, Settings and
  Practice refresh, Enter activation of a navigation link, Tab focus and Skip to
  content. No browser warnings/errors or console-example output observed.
- Manual review: visit all four tabs, refresh a nested URL, use Tab/Enter to
  navigate, and review desktop typography/colours. Views explicitly identify
  features that are not yet implemented; the shell contains only navigation and concise feature placeholders.
- Source structure: app composition/theme under `src/app`, co-located feature
  views/docs under `src/modules`, original demonstrations under `src/examples`.
- Limitations: local only; deployment belongs to step 2. Approved name is La Conjugadora. No user verification recorded.

Step 1 review amendments: renamed the app La Conjugadora across source, metadata,
package configuration, and documentation. Simplified all views to a heading and
one honest availability note; removed promotional panels and ornamental copy.
Awaiting user verification of the revised shell.

### Step 2 — In progress

User confirmed React/Vite + Supabase without Fastify and authorised committing/
pushing the prepared app to main. Agreed workflow: main for production; separate
codex/ branches for future review deployments. Vercel account not yet created.
See DEPLOYMENT.md for the prepared import settings and production smoke checks.
Public deployment remains incomplete until account setup/import and URL checks.
