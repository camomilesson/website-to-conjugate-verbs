# La Conjugadora — Development Blueprint

Status: **Approved** · Updated 5 November 2026

This document is the development reference for the first public release. The
user approved the direction, amendments, and 16-category release scope recorded
here. At release, move
lasting product, architecture, setup, and maintenance information into the README
and module documentation before deleting this temporary blueprint.

## 1. Product goal

A publicly accessible, desktop-first website for practising approximately 100
common Spanish verbs. Users configure tests, answer by typing or multiple
choice, and inspect their accuracy in a verb-by-tense heatmap and test history.
The visual identity evokes an old newspaper.

### Agreed requirements

- Public deployment; local development is not the final delivery.
- Approximately 100 common verbs with broad tense/mood coverage.
- Authentication and per-user persistent learning data; account controls.
- Two test modes: multiple choice and typing.
- Typing can require or ignore written stress accents.
- Select one verb, several verbs, or all verbs for the current test.
- Select individual tense/mood categories, all categories, or built-in
  Basic/Advanced presets.
- No user-created or named saved verb/tense presets.
- No skip action. Wrong answer reveals the correct one and the "Next" button.
- Every submitted answer contributes to persistent progress, including answers
  from a test that is subsequently abandoned.
- Only completed tests appear in History. Incomplete tests cannot be resumed.
- Progress includes a heatmap: verbs are rows, tense/mood categories are columns,
  and each verb also has overall accuracy.
- Four tabs: Practice, Progress, History, Settings.
- Desktop is the release target. A dedicated mobile layout is deferred.
- Minimise operating costs without requiring every service to remain free.

### Proposed release boundaries

Guest practice is available; Google sign-in enables cross-device progress,
history, and saved settings. No spaced repetition, mastery score, leaderboard,
custom verb editor, custom presets, timer, or complete historical answer review.
No fixed deadline is assumed.

## 2. Proposed architecture

| Concern        | Proposal                                                            | Reason                                              |
| -------------- | ------------------------------------------------------------------- | --------------------------------------------------- |
| Frontend       | React + TypeScript + Vite                                           | Fits interactive tests and reusable controls        |
| Styling        | Plain CSS with shared design tokens                                 | Direct control over the newspaper aesthetic         |
| UI state       | React state/context initially                                       | Avoid unnecessary state libraries                   |
| Hosting        | Vercel, initially on its provided domain                            | Public deployment with an early end-to-end check    |
| Authentication | Supabase Auth with Google                                           | One initial sign-in method                          |
| User data      | Supabase PostgreSQL                                                 | Fits settings, test records, and aggregate counters |
| Verb data      | Versioned static JSON assets                                        | Shared read-only content, independent of accounts   |
| Backend logic  | Supabase SQL functions; a server-side function for account deletion | Atomic updates and privileged account operations    |
| Tooling        | Retain pnpm, strict TypeScript, ESLint, Prettier                    | Extend the existing foundation                      |

React/Vite, Vercel, Supabase, Google sign-in, and guest practice are the approved
architecture direction.

The browser reads public verb data and accesses user data through the Supabase
client. Row-level security restricts every user-owned record to its owner.
Privileged credentials never enter browser code. A separate general-purpose
application server is not proposed.

## 3. Verb catalogue and coverage

### Data organisation

- One source JSON file per verb, plus a small catalogue with stable verb IDs,
  infinitives, English meanings, and useful tags such as reflexive/irregular.
- A category registry defines stable tense/mood IDs, labels, ordering, persons,
  and preset membership. Labels are not database keys.
- Conjugation entries contain arrays of accepted forms, including alternatives.
- Static delivery loads the catalogue first and the selected verbs as needed;
  choosing all verbs may load the whole catalogue's conjugation data.
- Store generation instructions, reference provenance, any required attribution,
  and a dataset version.
- Validate every dataset entry during build/checks. Required answer arrays must
  be nonempty and contain nonempty strings.

Around 20,000 readable JSON lines is acceptable. Measure the actual transfer
size and loading behaviour after import rather than optimising for line count.

### Catalogue generation

Generate and own the catalogue rather than requiring a third-party conjugation
dataset. Curate approximately 100 useful common verbs, including irregular and
reflexive verbs; do not claim a strict frequency ranking without evidence.

During development, the assistant will generate the approximately 100 verb JSON
files directly and commit the reviewed files to the repository. These files are
the canonical production data. Production serves the committed static JSON; no
AI call, runtime conjugator, or build-time conjugation engine is required.

Validate schema and coverage for every file, then independently check irregular
forms, accent placement, participles, accepted variants, and reflexive imperatives
against authoritative grammatical references. Record reference provenance and
review status. Validation scripts check the committed catalogue; they do not
regenerate it. A third-party dataset is not a required source or dependency.

### Approved release inventory

The release includes 16 practice categories, reduced from the earlier 23-category
proposal. Defer preterite
anterior, future subjunctive, future perfect subjunctive, and preterite/imperfect/
future/conditional progressive constructions. Keep present progressive because
it is a useful everyday construction. This is the agreed product scope,
not a claim that the omitted forms are invalid or that Spanish has 16 tenses.

| Group                     | Release categories                                               |
| ------------------------- | ---------------------------------------------------------------- |
| Simple indicative         | Present, preterite, imperfect, future, conditional               |
| Perfect indicative        | Present perfect, pluperfect, future perfect, conditional perfect |
| Simple subjunctive        | Present, imperfect (accept both -ra/-se)                         |
| Perfect subjunctive       | Present perfect, pluperfect (accept both variants)               |
| Imperative                | Affirmative, negative                                            |
| Progressive constructions | Present                                                          |

Built-in presets:

- **Basic:** five simple indicative categories plus present perfect indicative
  (6 columns).
- **Advanced:** the three other perfect indicative categories, four
  subjunctive categories, two imperative categories, and present progressive
  (10 columns; excludes Basic).
- **All:** all 16 supported categories, combining Basic and Advanced.

These are convenience selections, not formal proficiency levels. All means all
supported release categories; the UI and README must not promise every possible
Spanish tense or construction. Both imperfect subjunctive variants remain valid
answers within one column.

### Persons and language — proposed

Use yo, tú, él/ella/usted, nosotros, vosotros, ellos/ellas/ustedes, with a setting
to exclude vosotros. Imperatives use their applicable persons and never yo.
Vos is deferred. Reflexive prompts and answers include the required pronouns;
accepted forms account for valid placement. Use English interface controls,
Spanish category names, and explanatory English labels where helpful.

## 4. Test experience

### Setup

Keep the desktop setup compact enough for an ordinary 1280×720 viewport. Verbs
use All/Common/Select; Common currently means hablar, ser, ir, tener in the starter
catalogue (a curated subset, not a frequency ranking). Select opens a searchable
modal. Tenses use Basic/Advanced/All/Select and persons use All/Select, with modal
checkbox selection. Dialogs have Apply and Cancel; cancelling discards draft
changes. Typing/Multiple choice is a segmented toggle. Presets populate the
same underlying selections. Persist the most recently started test configuration
as the next test’s defaults; do not create named presets.
Choose mode and length. Apply person preferences and, for typing, accent policy.
Reject an empty verb/category/person pool with a clear explanation.

Proposed defaults: Basic, all verbs, typing, 20 questions, all supported persons,
and strict accents. These apply on first use only. Subsequently, restore the
last-started configuration: verb/category IDs, mode, length, persons, and accent
policy. Persist locally for guests and to the account for signed-in users. Save
on Start, not on every intermediate checkbox change. Settings edits update the
same preferences; the latest saved configuration wins. Restore only IDs still
supported by the catalogue and explain any necessary fallback. A changed default
never alters a test already in progress. Guest choices are not automatically
merged into an existing account’s saved preferences.

### Question generation and interaction

- A question identifies verb, category, and person unambiguously.
- Proposed sampling: uniformly shuffle eligible verb/category/person combinations
  without replacement. If a requested test exceeds the pool, cap its length and
  explain the available count before starting.
- Accept any valid form for that question, not only the first stored alternative.
- Multiple choice proposes four unique options. Distractors are curated/generated
  from other tenses/moods of the same verb and grammatical person only, exclude
  every accepted answer, and are checked using the
  same comparison rules. Show fewer options if four safe options are unavailable;
  require at least two, otherwise exclude that question from choice mode.
- Enter submits the current typed answer or selected choice. After submission,
  lock the answer and show feedback and accepted forms. Space activates Next only
  while feedback is visible and any persistence acknowledgement has completed.
  Ordinary spaces still work while typing. Ignore held-key repeats, avoid global
  shortcuts on other controls, and prevent the Next shortcut from scrolling the
  page. After correct feedback, advance automatically after a brief 650 ms pause;
  after an incorrect answer require Next. Auto-advance also opens final results
  after the final correct answer and pauses during an abandonment dialog. Once
  persistence exists, acknowledgement is required before either kind of advance.
  Button clicks remain available for incorrect-answer review.
- A nonempty wrong response counts as incorrect; whitespace-only typing cannot
  be submitted. There is no skip button or skip counter.
- Final score is correct divided by the fixed question count. All questions must
  be answered to complete a test. Show counts, percentage, and list of mistakes.
- Starting another test or leaving an active test abandons it. Proposed: warn
  before deliberate in-app abandonment. Reloading does not restore the test.

### Typing comparison — proposed

Always trim surrounding whitespace, compare without letter case, normalise
Unicode, and collapse repeated internal whitespace. Strict mode preserves
written stress accents. Relaxed mode folds á/é/í/ó/ú/ñ/ü to a/e/i/o/u/n/u, including
uppercase equivalents. Display the correct accents
even when a relaxed answer is accepted. Provide clickable accented characters.
Require the conjugated form including necessary reflexive/negative words, not
the subject pronoun shown in the prompt. No fuzzy spelling acceptance.

## 5. Progress and persistence

### Accuracy definition

Store integer correct/answered counters; calculate percentages at display time.
Aggregate across persons for each verb/category cell. Overall verb accuracy is
the sum of correct answers divided by the sum of answered questions across its
categories, never the unweighted average of cell percentages.

Separate storage dimensions for mode and accent policy allow filtering. Choice
uses a not-applicable accent policy. Proposed Progress filters: combined, choice,
typing; strict/relaxed applies when typing is selected. Combined percentages are
weighted by answer counts. Unattempted cells are empty, not 0%.

### Immediate progress and completed history

Each submitted answer updates the counters immediately. Abandonment preserves
those updates but creates no history item. Consequently, Progress includes more
answers than completed-test History can account for; explain this in the UI.
Do not persist an unfinished question queue or provide a resume endpoint.

### Proposed data model

| Entity              | Important fields                                                                                                                                                    |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| User settings       | User ID, default mode/length/selections, accent policy, person preferences                                                                                          |
| Accuracy aggregates | User ID, verb ID, category ID, mode, accent policy, correct count, answered count                                                                                   |
| Completed tests     | User ID, test ID, completion time, mode, correct/total counts, exact verb/category/person selections, effective settings, dataset version, optional example mistake |
| Submission receipts | User ID, submission ID, test ID, submission time; minimal metadata for retry deduplication                                                                          |

No saved-list table is needed. Last/default selections persist as agreed settings,
not as user-created named presets.

Use an atomic database operation that deduplicates a submission and increments
its aggregate together. The client supplies stable submission/test IDs so retries
cannot double-count. Final-answer processing should also insert completed-test
history in the same transaction, preventing duplicate history or partial final
updates. Derive ownership from the authenticated session, not a supplied user ID.
Submission receipts do not store enough information to resume a test; choose a
retention period compatible with the retry policy during implementation.

These are personal learning statistics, not verified competitive scores. The
first release does not need server-side verification of the public answer key.

### Connection behaviour — proposed

Signed-in submissions remain pending until acknowledged. On failure, retain the
same submission ID and offer Retry; do not claim they were saved or advance until
acknowledged. Do not silently switch a signed-in test to guest mode. Offline
practice with queued cross-session syncing is deferred. Guest practice keeps
results only for the current test, and signing in starts future tracked tests;
there is no automatic import of guest answers.

## 6. Tabs

### Practice

Setup, active question, feedback, and final results. Keep a completed test's
summary available until another is started or the user leaves it.

### Progress

The main feature is a desktop heatmap with one verb per row and one category per
column. Include all catalogue verbs, including unpractised ones. Use sticky verb
names and column headers, grouped mood headers, percentages inside cells, and
an Overall column. Unattempted cells show a dash. Hover/focus reveals full
category names and correct/answered counts. Use horizontal scrolling where
needed, never unreadably narrow columns.

Proposed initial view: Basic columns, with Advanced/All and individual column
selection available; all 16 supported categories remain accessible. Overall accuracy uses
all categories matching the active mode/accent filters, regardless of visible
columns, and is labelled accordingly. Include verb search and sorting by name,
accuracy, and attempts. Always expose sample size in cell details. Colour is a
secondary cue; values remain readable without it.

### History

Newest completed tests first, with pagination. Each entry shows completion date,
choice/typing, score, verb set, tense set, non-default settings, and one example
mistake. Store all effective settings even though only deviations from the
approved application defaults are highlighted. Persist the defaults version so
this interpretation stays stable after future default changes.

Proposed example: first incorrect answer, its verb/category/person, submitted
answer, and accepted forms. A perfect test shows “No mistakes”. Full historical
mistake review is outside release scope. Store timestamps in UTC and display
them in the viewer's local timezone.

### Settings

Default test preferences, person selection, accent policy, Google account state,
sign out, Reset all learning data, and Delete account. Reset clears both history
and aggregates (plus deduplication records); account deletion also removes saved
settings and the authentication account. Require explicit confirmation for these
destructive actions. Prevent active/pending tests from repopulating cleared data.
Offer a short explanation of stored data and how to delete it.

## 7. Visual direction and accessibility

Warm paper background, near-black ink, thin newspaper rules, serif typography,
and a proposed muted burgundy accent. Keep texture subtle and text contrast
strong. Use typewriter styling selectively for prompts/labels, readable serif
text elsewhere, and verify Spanish character coverage and font licensing.
The heatmap can use a restrained tonal scale without making small percentages
illegible. Design for a comfortable desktop viewport with explicit overflow.

Keyboard support includes setup controls, typing submission, choice selection,
Next, and accessible heatmap cell details. Feedback is conveyed through text as
well as colour. Preserve visible focus and meaningful form labels. Mobile
optimisation is deferred, but no fixed-width clipping of essential controls.

## 8. Modlet organisation

Organise by cohesive module/feature, co-locating implementation, styles, tests,
documentation, and useful isolated demos. Modlets are folder organisation and
module boundaries; they do not require separate packages or a framework change.

```text
src/
  app/                  # entry point, navigation, composition, global theme
  modules/
    practice/           # setup, session, question/feedback UI, local tests/docs
    answer-checking/    # normalisation and matching; pure logic and tests
    verb-catalogue/     # model, validation, registry, loader, local fixtures
    progress/           # heatmap, filters, aggregate queries, tests/docs/demo
    history/            # completed test list and detail
    settings/           # persisted last/default preferences and account controls
    auth/               # Google session and auth UI
  shared/               # genuinely reused UI and infrastructure adapters
scripts/
  verb-catalogue/        # catalogue validation and review tools
public/
  data/verbs/            # canonical JSON generated during development and reviewed
supabase/
  migrations/           # schema, policies, atomic functions
  functions/            # privileged account deletion
```

Within a UI modlet, use descriptive files such as `Progress.tsx`, `progress.css`,
`progress.test.ts`, `README.md`, and an isolated demo where useful. Pure logic
modlets need no artificial UI demo. Expose a small public API through `index.ts`;
other modules must not import private internals. Keep answer checking and
question generation independent of React and network clients. Shared modules
must not depend on feature modules. Avoid circular feature dependencies; compose
features in app/. Co-locate fixtures and meaningful tests with their owners.
No Storybook or other demo framework is required initially; lightweight demo
entry points can exercise the heatmap and question UI with fixtures.

This follows the modlet principle of keeping a module and its supporting
resources together; it does not impose boilerplate on every small helper.

## 9. Delivery milestones and acceptance checks

[IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) breaks these milestones into
numbered implementation steps. Complete one requested step, provide verification
instructions, and wait for user review before starting the next.

1. **Approve the blueprint and verify data feasibility.** Resolve the choices
   below, confirm generated-data rules and category coverage, and validate sample
   irregular and reflexive verbs. Exit: an explicit supported-category inventory.
2. **Deploy the shell.** Set up React/Vite and the four tabs with design tokens;
   deploy a minimal public page. Exit: the public URL works on a separate browser
   session and refreshing a tab route works.
3. **Complete guest practice.** Build selection, generation, both modes, accent
   handling, feedback, and scoring using a small reviewed dataset. Exit: complete
   tests work end to end; no ambiguous multiple-choice questions.
4. **Expand the catalogue.** Generate approximately 100 verbs with coverage checks,
   reference provenance, stable IDs, and a version. Exit: all offered questions have valid
   answers, with measured asset sizes and acceptable loading behaviour.
5. **Add accounts and persistence.** Google sign-in, settings, atomic progress,
   completed history, deletion/reset. Exit: two accounts cannot read/change each
   other's data; retries cannot double-count; abandonment follows agreed rules.
6. **Finish Progress and History.** Heatmap, filters, sorting, counts, history
   details and pagination. Exit: aggregate totals match known answer sequences,
   including mixed modes and abandoned tests.
7. **Release review.** Newspaper styling, keyboard checks, failure states, public
   auth redirects, production configuration, and cost review. Exit: the deployed
   version meets all agreed requirements and has no placeholder learning data.

Use focused automated checks for validation, normalisation, question generation,
weighted aggregation, idempotency, and access policies. Retain the existing lint
checks. Manually verify the deployed sign-in flow, deletion, and desktop layout.

## 10. Decision status and documentation lifecycle

Approved: overall architecture, guest practice, Google sign-in, desktop-first
newspaper direction, four tabs (Practice/Progress/History/Settings), immediate
progress permanence, no skips or resumable tests, history and heatmap model,
mode/accent dimensions, and account controls. Most recently started selections
persist. Relaxed typing folds ñ and ü as well as acute accents. Enter submits;
Space advances only from acknowledged feedback. Completed-test results include
the in-memory mistake list; stored history retains one example mistake.

Approved: the 16-category release inventory and its 6/10 Basic/Advanced presets (All: 16).
The assistant generates the canonical JSON files during development; production
uses those static files. Retain the independent correctness checks above. Follow the modlet structure
when implementation starts; this documentation update does not move source code.

[MANUAL_SETUP.md](MANUAL_SETUP.md) tracks owner account/setup work and when it is
needed. Exact verb list, app name/domain, fonts, plan choice, and receipt retention
are implementation-stage decisions within this scope.

During development, README contains only the core product/architecture summary,
current implementation status, and links to this blueprint and setup checklist.
After public release, migrate lasting setup/architecture/maintenance details into
README and module docs, then delete BLUEPRINT.md. Do not lose generation,
operational, or security-policy documentation during that migration.

## 11. Reference documentation

- [React: building an app from scratch](https://react.dev/learn/build-a-react-app-from-scratch)
- [Vercel: Vite deployment](https://vercel.com/docs/frameworks/frontend/vite)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase Google sign-in](https://supabase.com/docs/guides/auth/social-sign-in/auth-google)
- [Firebase Google sign-in alternative](https://firebase.google.com/docs/auth/web/google-signin)
- [Modlet workflows](https://www.bitovi.com/blog/modlet-workflows)
- [Instituto Cervantes: subjunctive usage](https://cvc.cervantes.es/ensenanza/biblioteca_ele/publicaciones_centros/PDF/tokio_2015/07_fukushima.pdf)

### Step 1 visual refinement

Approved name: La Conjugadora. Subline: Practica los verbos en español.
Keep the newspaper typography, paper background, rules, and burgundy accent,
while removing promotional panels, decorative captions, numbered navigation,
and redundant slogans. Prioritise functional practice controls as they arrive.

Progress display choices (sort, answer-mode/accent filter, preset and custom
columns) save automatically per account in `progress_preferences`, independently
of Practice defaults. Guests retain those choices locally. Search and scroll
remain temporary. Learning-data reset preserves display choices; account deletion
removes them. Active practice exposes English tense help on hover/focus/tap,
including formation hints for compound tenses and the progressive.
