# Implementation plan

Status: **Step 13 ready for owner review** · 6 November 2026

[README.md](README.md) now defines the implemented product and architecture.
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

**Status:** Verified · **Depends on:** 1

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

**Status:** Verified · **Depends on:** 2

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

**Status:** Verified · **Depends on:** 3

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

**Status:** Verified · **Depends on:** 4

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

**Status:** Verified · **Depends on:** 5

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

**Status:** Verified · **Depends on:** 6

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

**Status:** Verified · **Depends on:** 7

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

**Status:** Verified · **Depends on:** 8

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

**Status:** Verified · **Depends on:** 9

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

**Status:** Verified · **Depends on:** 10

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

**Status:** Verified · **Depends on:** 11

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

## Step 12.5 — Polish

**Status:** Verified · **Depends on:** 12

User approved this additional checkpoint before release work.

### 12.5.1 — Keyboard and selection

Number keys 1–4 choose offered multiple-choice options; Enter submits. Numbers
appear beside the options and radios expose their shortcuts. Ignore shortcuts
when editing text, using modifiers, composing/repeating a key, viewing feedback,
or a modal is open. Verb pickers sort by Spanish alphabetical order without
changing catalogue IDs, saved selections or question sampling.

### 12.5.2 — Consistent interface

All four tabs share the desktop masthead, heading/body/control scale, full content
width and page padding. The matrix retains readable dense cells and its own
scroll container. Long mistake text wraps. Reset/deletion acknowledgements remain
visible in Settings, including the signed-out view after confirmed deletion.
No destructive backend logic or server setup changes are introduced.

### 12.5.3 — Simpler Practice entry

Three actions: Multiple-choice practice, Typing practice, Customize practice.
Quick starts use saved selections or factory defaults and override only mode;
the typing accent preference survives multiple-choice starts. A compact summary
shows the selections and typing policy. Customize exposes the detailed setup;
Back discards the draft and restores focus to Customize. Only a successfully
started practice saves its setup, as before. Loading/errors disable duplicate
starts and preserve retry behaviour.

**Assistant checks:** 51 tests, lint/build, and local browser checks cover number
selection/Enter, modal blocking, typed digits, picker ordering, draft cancellation,
mode/accent persistence, matching tab metrics, focus return, and 2,000-character
mistake wrapping. Existing bundle-size advisory remains.

**Your verification:** On staging, quick-start both modes with saved preferences,
use 1–4 then Enter, customize and back out, inspect alphabetical selection and
compare the four tabs. No migration, environment or function redeploy is needed.
Review notice wording using the existing disposable-account workflow if desired;
no real resets/deletions were performed by the assistant.

### 12.5.4 — Prompt clarity and Practice navigation

**Status:** Verified. Earlier 12.5.1–12.5.3 polish is approved/live.

- Non-invasive guest link below quick starts: Sign in with Google to track
  progress, leading to Settings.
- Question prompt: verb in tense (mood), lowercase Spanish category/mood, no
  Conjugate or trailing period, with spacing and existing accent-colour emphasis.
- No colon after the person. Incorrect feedback says Correct answer. Typing's
  accent policy shares the reflexive-pronoun help line; choice has no accent text.
- Practice tab (and home wordmark) creates a new entry intent. Active question/
  feedback states use the existing leave confirmation; cancellation preserves
  the draft, while confirmation resets. Completed results and customization
  return directly to the quick-start screen. New-tab/modifier clicks stay native.
- The entry intent only commits after router confirmation; it remounts Practice
  and focuses main without altering saved preferences, scoring or tracking.
- 52 tests, lint/build, and local browser checks cover these prompt/navigation
  states. No migration, environment or function deployment changes are needed.

## Step 13 — Public release and documentation handover

**Status:** Ready for your review · **Depends on:** 12.5

**Outcome:** A polished public release matches the approved blueprint.

**Assistant work:** Finalize the approved green workspace styling, typography/licensing, contrast,
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

### Step 2 — Verified (5 November 2026)

- Production URL: https://conjugadora.vercel.app
- User confirmed it works on their end.
- Independent unauthenticated HTTP checks: root and all four direct app routes
  return 200; missing /assets/ and /data/ files return 404 rather than app HTML.
- Browser verification: app renders publicly, all four navigation views and
  titles work, Progress refresh works, and no console warnings/errors appeared.
- Deployed source: initial shell/config commit 3ef1c80 on main.
- Step 3 remains not started, pending the user's request.

### Step 3 — Ready for your review

- Branch: codex/starter-catalogue. Production is unchanged until review/merge.
- Implemented seven canonical static verb files, the 16-category registry,
  cancellable validated loaders, selectors/search, presets, and an answer preview.
- Checks passed: pnpm lint, pnpm test (6 tests), pnpm build (also validates all
  658 answer cells). Browser checks: Basic/Advanced/All counts, empty selection,
  search with no matches, reflexive imperative and subjunctive variant previews.
- Run pnpm dev and open its printed URL. Start with 7/7 verbs and 6/16 categories.
  Click Advanced or All: expect 16/16. Clear verbs and select one to limit the
  preview. In Answer preview choose levantarse, Imperativo Afirmativo, vosotros:
  expect levantaos, with no yo choice. Subjuntivo Pretérito imperfecto should show
  both variants. Select Basic again: expect only six preview categories.
- Inspect public/data/verbs/levantarse.json; review notes and grammatical references
  are in src/modules/verb-catalogue/README.md. No practice session runs yet and
  selections do not persist yet, as scheduled for later steps.
- User verification is pending. Step 4 has not started.

### Step 4 — Ready for your review

- User approved step 3 and retained static JSON. Step 3 was fast-forwarded to
  main; step 4 lives on codex/typing-practice for review before promotion.
- Implemented guest typing setup/session/results, person selection, strict/relaxed
  accents, shuffled unique questions with pre-start capping, cancellable catalogue
  loading, feedback, Enter/Space controls, character insertion, and mistake review.
- Removed the development answer preview from setup; actual practice now uses the
  reviewed answer tables. No choices, stored preferences, accounts, or statistics
  persistence yet. Starting a new session restores first-use defaults until step 6.
- Checks: pnpm lint; pnpm test (14 tests); pnpm build. Browser: known two-answer
  sequence yielded 50% and one mistake; Enter submission, Space advance, Unicode
  accent composition, relaxed hable for hablé, spaces/character insertion,
  abandonment cancellation/reset, and refresh reset were verified without errors.
- Your verification: choose hablar only, clear tenses then choose Indicativo
  Presente, set 2 questions. Submit one right and one wrong answer, then inspect
  score/mistakes. Try End practice and cancelling a tab change. For a deterministic
  accent check choose hablar, preterite, yo only: requested 20 caps to 1. hable
  should be incorrect with accents required and correct with accents ignored.
- ñ/ü folding has unit-test fixtures (the seven starter verbs do not naturally
  exercise those characters). No practice session is restored after refresh.
- User review pending; step 5 has not started.

### Step 5 — Ready for your review

- User approved step 4; typing practice was fast-forwarded to main and Vercel
  reported a successful production deployment. The public setup was verified in
  the browser. Step 5 lives on codex/choice-practice pending review.
- Added a typing/choice selector, pre-start preparation of eligible choice pools,
  shuffled real-form options, keyboard-accessible radio choices, shared feedback,
  score and mistake review. Each question offers exactly one valid choice.
- Distractors prefer same-verb/same-category forms, then the same grammatical
  group, then other supported categories of that verb. All accepted alternatives
  are excluded. Two/three options are allowed when four are unavailable; questions
  with no safe wrong option are excluded before the displayed pool size/cap.
- Choice matching always preserves accents. The typing accent checkbox is hidden
  for choice mode and its local setting is retained when switching back in setup.
- Checks passed: pnpm lint, pnpm test (18 tests), pnpm build. Choice tests cover
  every one of the 658 catalogue combinations across deterministic shuffle
  boundaries, variants, small pools, indexed submissions, and invalid actions.
- Browser checks passed: arrow-key selection, Enter submission, Space advance,
  locked radio feedback, resetting selection for the next question, a known 50%
  result with one mistake, and a fresh empty typed answer after a choice session.
- Review: choose Multiple choice, ser and levantarse, affirmative imperative,
  and a short session. Check one right/wrong pair and the final result. Try arrows,
  Enter, and Space, then New practice and Typing. Production does not receive step
  5 until approval; preferences/history remain unsaved until later steps.
- Step 6 has not started.

### Step 5 — Review amendments (supersede the initial step 5 interaction rules)

- Compact setup and question controls verified at 1280×720 with no page scrolling.
- Verbs: All/Common/Select; starter Common subset is hablar/ser/ir/tener. Persons:
  All/Select. Tenses: Basic/Advanced/All/Select. Native dialogs support draft
  selection, Apply, Cancel/Escape, and searchable verbs. Mode is a segmented toggle.
- Correct answers advance after 650 ms, including the final correct answer to
  results. Incorrect answers still require Next. Timer actions are index-guarded,
  cleaned up on unmount, and paused during navigation/abandonment confirmation.
- Distractors now use ONLY the same verb and grammatical person across other
  categories. el/ellos and usted/ustedes are mapped consistently. No cross-person
  fallback; small pools retain the prior fewer-options/exclusion rules.
- 19 tests pass, including exhaustive starter same-person choices and stale timer
  guards. Browser checks cover search, cancelling and applying all three dialogs,
  Common subset, toggle, correct typed/choice auto-advance, incorrect review, and
  final score. Step 5 remains in review; step 6 has not started.

Step 5 question-layout amendment: show “Conjugate [verb] in [mood/tense]”,
then an answer container with the person on the left and the typing field or
choice options to its right.
Removed the separate right-aligned person and standalone meaning from questions.

Step 5 visual refinement: verb and tense are 50% larger and burgundy; verb stays
bold and tense stays normal weight. Choice person is centred on the option list.
Browser inspection verified 32.4px versus the 21.6px prompt, weights 700/400,
and matching vertical centres.

### Step 6 — Ready for your review

- Approved step 5 was promoted to main. Step 6 is on codex/remember-preferences.
- Added a shared practice-preferences modlet for defaults, validated local storage,
  controlled fields, and modal selection. Settings and Practice share this public
  API without importing one another's internals.
- Save-on-successful-Start and explicit Save preferences persist mode, IDs,
  built-in set labels, requested length, and typing accent policy. Draft edits and
  Restore defaults are unsaved until Start/Save. Never store queues or results.
- Built-in sets resolve against current catalogue coverage. Custom IDs are
  filtered/deduplicated; invalid/empty/unusable saved values fall back with a
  notice. Unknown/corrupt schema and blocked storage fail gracefully.
- Checks: 27 tests pass; lint/typecheck/build pass. Browser verification: draft
  edits vanish on refresh; Start restores Common/Advanced/choice/length after
  reload without resuming the test; Settings Save overrides next setup; a second
  tab's saved length/person changes leave the running five-question test intact
  and appear on its next setup. No browser warnings/errors observed.
- Your verification: customise and Start, then reload. Confirm setup restored,
  no active question. Change a selection without Start and reload: previous saved
  values should return. Save different values in Settings and revisit Practice.
- Settings are browser-local and origin-specific until account syncing in step 8.
  Step 7 has not started; final verb-list approval is its first checkpoint.

### Steps 7–8 — Review branch and manual setup checkpoint

- Owner approved step 6 and requested production promotion, then steps 7–8 through
  the manual setup boundary. Step 6 was promoted to main (5a3ec1c).
- This request authorises bulk catalogue preparation before the separate list
  checkpoint originally proposed in step 7. Review the final list in CATALOGUE_REPORT.md.
- Branch: codex/catalogue-and-auth. 100 verbs, 25 Common, 10 reflexive,
  16 categories, 9,400 cells. Static JSON remains canonical.
- Google OAuth/session UI, account preference repository, environment template,
  ownership migration and a two-identity SQL test are prepared. Guest settings
  are separate; new accounts start with defaults. Failed cloud reads/writes do
  not silently fall back to guest storage.
- AUTH_SETUP.md is the next owner checklist. No Supabase project or Google client
  was created, no migration was applied, and no hosted sign-in or RLS execution
  is claimed. Step 8 remains pending those checks. Steps 9 onward are untouched.
- SDK declaration conflicts with TypeScript 6 DOM WebAuthn types require
  skipLibCheck; application code remains strictly typechecked.

- Validation: 33 tests pass, strict application typecheck, ESLint, formatting,
  and production build pass. The SDK raises the bundle to about 570 KB minified /
  165 KB gzip; Vite reports its 500 KB chunk advisory. Browser checks covered
  all/all typing, 9,400-choice eligibility, correct choice scoring, verb search,
  and unconfigured account Settings. Hosted OAuth and SQL tests remain pending.

### Hosting rename — 6 November 2026

Owner requested Vercel project slug `conjugadora`. Deployment and auth setup
references now target `https://conjugadora.vercel.app`; dashboard rename, domain
assignment, and Supabase redirects still need owner confirmation. App display
name remains La Conjugadora.

### Permanent staging workflow — 6 November 2026

Owner approved creating `staging` from `codex/catalogue-and-auth`, including the
100-verb catalogue, account integration, and project rename references. Future
feature branches merge into staging for review, then approved work goes to main.
Register staging’s stable Vercel branch URL in Google and Supabase once. Main
remains production; staging uses Preview environment variables. Hosted OAuth
verification remains pending manual configuration.

### Steps 7–8 approved — 6 November 2026

Owner approved the catalogue and account work after reporting successful Google
sign-in on the stable staging URL, retained sessions/preferences, cross-device
sync (phone), and independent preferences while switching between two accounts.
Owner ran the migration and complete ownership SQL test in a separate disposable
Supabase project: both returned Success, no rows. This verifies the migration in
isolation, not an automated audit of the primary project's live policies.
Staging is approved for production promotion. Step 9 remains the next checkpoint.

### Step 9 — Durable answers prepared, 6 November 2026

- Branch codex/durable-practice, to staging for review; production remains step 8.
- Atomic owner-checked start/submission RPCs, receipt deduplication and strict,
  relaxed, choice aggregate buckets. Final answer and History commit together.
- UI waits for acknowledgement, locks failed submissions and retries identical
  IDs. Account changes discard queues; guest answers remain unsaved.
- Initial Progress/History show real counts and latest 50 completed tests.
  Heatmap and complete history UI remain steps 10–11.
- Retry expiry 24h; metadata/receipts eligible for owner cleanup after 7 days,
  opportunistically at next start. Counts/history persist independently.
- TRACKING_SETUP.md contains the one new migration and hosted review checklist.
  Actual SQL migration/tests pass in local PostgreSQL/WASM; hosted integration
  and multiple-connection concurrency remain pending. No primary database changes
  have been applied by the assistant.

- Browser verification also used a temporary synthetic account API backed by
  the actual SQL: committed-but-lost final reply, locked Retry, no duplicate count
  or History entry, and acknowledged abandoned-answer retention all passed.
  37 pure tests, lint and build pass. Existing Vite large-chunk advisory remains
  (about 580 KB minified / 168 KB gzip). Hosted checks still require the migration.

### Step 9 approved — 6 November 2026

Owner confirmed hosted tracking works and approved production promotion. The
interim Progress table is intentionally replaced by the step 10 matrix next.

### Step 10 — Heatmap ready for review, 6 November 2026

- Approved step 9 promoted to main; Vercel reported success. Heatmap work on
  codex/progress-heatmap goes to staging, leaving production tracking unchanged.
- All 100 catalogue verb rows, Overall and 16 supported category columns. Basic,
  Advanced, All and custom views; sticky mood/tense headers, verbs and Overall.
- Weighted cell/overall values, counts via hover/focus/dialog, unattempted dash,
  mode/accent filtering, search and sorting. Hidden columns never change Overall.
- Roving keyboard focus, arrow/Home/End navigation, Escape details dismissal.
- No new schema/configuration. Existing counts supply the matrix. Refresh keeps
  the previous matrix mounted so filters survive successful refreshes.
- Isolated synthetic dense/empty demo at /dev/progress in development only; no
  demo route or fixture text in the production build. No sample account writes.
- 41 tests, lint and build pass. Desktop browser review confirms 100×16 coverage,
  weighted hidden-column Overall, mode filters, custom columns, keyboard details,
  both scroll axes/fixed labels, sorting, search and empty states.
- Hosted real-account inspection remains the owner's review checkpoint. Step 11
  has not started. The existing large-bundle advisory remains (~170 KB gzip).

### Step 10 approved — 6 November 2026

Owner verified the heatmap and approved promotion and proceeding to step 11.

### Step 11 — Completed History ready for review, 6 November 2026

- Approved heatmap promoted to main; History work on codex/history-view goes to
  staging. Production remains step 10 until review.
- Newest-first pages of 10 with deterministic timestamp/UUID keyset cursors and
  a sentinel row for Next. Microsecond timestamps are preserved. Previous/Next,
  mode filters and Refresh; stale page/identity reads are aborted and masked.
- Entries show local time, score/counts, verb/tense presets, non-default settings
  compared against saved defaults, exact expandable selections, and one saved
  mistake or No mistakes. No implication of a stored full mistake log.
- Isolated /dev/history demo with 26 synthetic entries, equal timestamps,
  different configurations, perfect tests and empty states; no account writes.
  Demo/fixtures are excluded from production builds.
- 46 tests, lint, build and local browser pagination/filter/details/empty checks
  pass. No migration or environment changes. Owner's real-account review pending.
- Step 12 (reset/deletion) has not started.

### Step 11 approved — 6 November 2026

Owner verified History and approved production promotion and step 12.

### Step 12 — Account controls prepared, 6 November 2026

- Approved History promoted to main. Account controls on codex/account-controls
  go to staging; no live reset/deletion has been performed by the assistant.
- Reset SQL clears aggregates, history, runs/receipts and retains preferences.
  Generation locks reject stale starts/answers; reset IDs deduplicate lost replies
  even after new answers. Legacy clients remain compatible before their first
  reset and fail closed after reset; no primary-user data was touched.
- Server-only deletion function remotely verifies the bearer token, binds its
  target to that owner and hard-deletes through the admin API. FK cascades cover
  six public account tables. Explicit typed confirmation, failures and local
  sign-out; no privileged credentials in frontend code.
- Same-browser data-reset notification invalidates active queues/views; server
  checks enforce cross-device safety. Public /privacy explanation uses owner-
  supplied contact conjugadora.support@gmail.com.
- ACCOUNT_SETUP.md is the owner migration/deployment and disposable-account test
  checkpoint. SQL and deletion-handler tests pass locally; deployable function
  passes Deno check. Hosted deployment and destructive review remain pending.
- Local synthetic UI checks: Cancel makes no request, reset retry reuses its ID,
  exact DELETE text is required, and data/privacy route renders. No real accounts
  or production data were reset/deleted. Step 13 has not started.

- Validation: 49 tests, lint and production build pass; all three migrations and
  durable/reset/deletion-cascade SQL checks execute in local PostgreSQL/WASM.
  Deno typecheck passes for the server function. Production assets exclude admin
  credential identifiers, handler code and development fixture routes. Existing
  bundle-size advisory remains (~174 KB gzip). Hosted checks remain pending.

### Step 12 approved — 6 November 2026

Owner deployed the deletion function and allowed-origin setting to the shared
Supabase project, reported all reset/deletion checks working, and approved
production promotion. CLI commands now use --remote instead of deprecated
--project-ref. No real account was reset or deleted by the assistant. Step 13
remains the next checkpoint and has not started.

### Step 12.5 prepared — 6 November 2026

Owner approved the three polish substeps and associated focus/loading/overflow
checks. Work on codex/polish goes to staging; main remains approved step 12.
All four tabs measured at 1280px: 56px masthead, 28.8px h1, 22.4px page padding
and 1144px content width. All backend/auth ownership safeguards remain in place.
Step 13 has not started; awaiting hosted polish review.

### Step 12.5 approved — 6 November 2026

Owner approved production promotion and indicated more polish requests will
follow. Hold step 13 until those requests are addressed.

### Additional polish prepared — 6 November 2026

Owner approved the prompt, guest sign-in link and Practice-tab reset behaviour.
Branch codex/prompt-polish goes to staging, leaving main at the earlier approved
polish. Browser checks cover same-tab active confirmation/cancel/leave, completed
results without confirmation, customization discard, guest link destination,
incorrect feedback, both answer modes and combined typing help. Step 13 stays
on hold until the remaining polish is approved.

### Step 12.5.4 approved — 6 November 2026

Owner approved production promotion. Next polish under discussion: Advanced
excluding Basic, English tense hover descriptions (one example must be approved
before authoring all descriptions), and per-account Progress display preferences.

### Step 12.5.5 prepared — 6 November 2026

Approved: Advanced excludes Basic (6 Basic / 10 Advanced / 16 All), English tense
help using the approved example format and formation hints for compound and
progressive forms, and automatically remembered Progress display choices.
Per-account display choices use a separate RLS-protected progress_preferences
row; guest choices stay browser-local. Search/scroll are temporary. Reset keeps
display choices and account deletion cascades them. See
PROGRESS_PREFERENCES_SETUP.md for the one hosted migration and review checklist.
Step 13 remains on hold; this batch awaits hosted review before promotion.

### Step 12.5.5 approved; 12.5.6 prepared — 6 November 2026

Owner confirmed tense help and display preferences work, and approved promotion
of aecd655 to production. Next staging batch prefixes every negative-imperative
distractor with no before deduplication/accepted-answer exclusion. Results now
include Repeat practice (Enter from the initially focused results heading),
starting a fresh randomized run with the exact previous configuration and a new
tracked run ID. The completed run stays intact. Double starts/held Enter are
prevented and start failures leave results available with an error/retry action.
No database or environment changes. Step 13 remains on hold for polish review.

### Step 12.5 final approvals — 6 November 2026

Owner approved the green workspace on staging and requested production promotion.
Production main contains e74f15f, including negative-command distractors and Repeat
practice. The earlier newspaper direction is superseded by the approved green
workspace. Further polishing is deferred; proceed with step 13.

### Step 13 — Ready for your review · 6 November 2026

Owner chose to keep Google OAuth in Testing with basic identity scopes, accepted
the current Vercel/Supabase plans and approved the displayed name Conjugadora.
Google Branding already matches. Handover aligns the app name/notices/titles and
adds a matching green/á SVG favicon. URLs, storage keys, auth and learning logic
are retained. No migration, provider change or function deployment is needed.

README and module docs now describe the implemented product, supported categories,
keyboard controls and modlet architecture. OPERATIONS.md covers schema, retention,
keys, migration order, rollback and incident handling. Setup docs no longer claim
completed features are pending. The temporary blueprint is retired after migrating
its lasting content; historical decisions remain in Git and this plan.

Release checks and their limits are recorded in RELEASE_CHECKLIST.md: 55 Node
tests, lint/typecheck/build, artifact audit, all four SQL suites/migrations,
public routes/static errors, guest typing/choice/feedback and Google redirect.
Real cross-device sign-in and destructive account tests were previously verified
by the owner; this pass does not claim to rerun them with real credentials.
The new name/favicon/docs go to stable staging for final review, leaving
production at its approved design until promotion. Step 13 is not Verified yet.
