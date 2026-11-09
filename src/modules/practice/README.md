# Practice modlet

Import `Practice` through `index.ts`. The feature owns guest and tracked typing/multiple-choice practice;
all conjugation IDs/data come from the catalogue public API, and matching comes
from the independent answer-checking module.

- `PracticeSetup.tsx`: uses the shared practice-preferences editor for configuration,
  length, strict/relaxed accents, pre-start pool count/capping, and cancellable
  loading of the selected verb files. Invalid/empty pools cannot start. Errors
  retain the selection and let the user retry Start.
- `session.ts`: pure eligible-person mapping, unique shuffled question sampling,
  session transitions, and score calculation. usted/ustedes follow the selected
  third-person singular/plural groups. Questions snapshot accepted alternatives.
- `choices.ts`: same-verb distractors, excluding all accepted alternatives,
  with per-tier shuffling and two-to-four unique options. Invalid choice questions
  are excluded before session sizing. Only same-person forms in other categories
  are eligible; ordinary el/ellos map to imperative usted/ustedes and vice versa.
  There is no fallback to another person. Same grammatical group is preferred.
- `ChoiceAnswer.tsx`: native radio group with arrow selection and Enter submission.
- `Practice.tsx`: setup/session composition, form, accent keys, feedback, mistake
  review, and navigation confirmation. Enter submits; Space on the focused Next
  button advances from feedback. Repeated keys cannot submit/advance repeatedly;
  ordinary spaces remain input. Whitespace-only submissions are disabled.

The reducer ignores submit outside the question state and advance outside
feedback. Correct answers advance automatically after 650 ms; incorrect answers
require Next. Auto-advance actions include the question index and require correct
feedback, so stale timers cannot skip questions. The timer is cleaned up on
unmount and paused during an abandonment prompt. Final results remain visible.
The results screen lists every mistake for this sitting.

No guest answers, results, or question queues are persisted. Leaving via app
navigation or End practice prompts first; reload starts fresh without a resume
flow. Completed results remain while on the view until New practice/navigation.
The last successfully started configuration is saved as defaults. New practice
restores those defaults without restoring the session. Draft-only changes do not
write storage. Settings saves the same preferences explicitly. Storage failures
are reported, and the session keeps its own configuration snapshot.

The earlier development answer preview has been replaced by actual practice.
Choice submissions require an offered
index and always use strict matching, independently of the typing accent policy.
Setup preloads selected verb files in choice mode to show the eligible pool size,
handles loading/error/retry, and aborts stale loads. Typing still loads on Start.
Signed-in practice starts a tracked server run, shows feedback immediately and
saves through the serial memory-only queue in `save-queue.ts`. Each request keeps
its ID/payload for retry. A failed save pauses input and manual/automatic
advancement until retry succeeds. Leaving warns about unsent answers and replies
that may already have committed. Local results appear while the queue drains;
saved/completed wording and Repeat/New practice wait for acknowledgement of every
answer. Pending saves keep navigation/reload warnings active even on results.
Unmount/account changes stop unsent requests; in-flight writes may still commit.
The last answer creates history atomically with its counters.
See the learning-data modlet and the [tracking verification guide](../../../docs/OPERATIONS.md#verification). Guest scoring is unchanged.
Run `pnpm test` for matching, sampling, and state regression checks. Browser review
covers keyboard input/focus, character insertion, navigation cancellation, refresh,
and end-to-end scoring; those are not simulated by the pure unit tests.

## Quick practice and keyboard selection

Practice enters through three quick/customize buttons and a saved-selection
summary. Quick actions clone the current saved preferences and override mode
without losing the hidden typing accent policy. Detailed setup keeps a separate
entry snapshot: Back restores it without a save, and returns focus to Customize.
Successful starts still save defaults and use the same tracking/generation path.
Choice files prefetch only in detailed choice setup; quick choice start loads
the selected files directly and applies the usual eligible-question cap.

ChoiceAnswer handles 1–4 through a scoped-lifetime keyboard listener: no submit,
no missing option, no editing/modifier/repeat/composition/modal interception.
Selection focuses the radio; Enter remains the explicit submit action. Feedback/
pending save removes the listener. The visual numbers have aria-keyshortcuts on
the radios. Long mistake text wraps within the content width.

Local browser review verified both quick starts, Back discarding edits, sorted
verb dialogs, number selection without submission, modal protection, typed digits,
accent preference surviving choice→typing starts, focus return and long text.
Hosted account review remains the owner's checkpoint. No SQL or Edge Function
redeployment is needed.

## Additional prompt/navigation polish

Question wording is verb in tense (mood), with lowercase display labels, no
leading Conjugate or person colon, and spaced accent-colour emphasis. Typing
help includes the accent policy; choice does not. Incorrect feedback labels the
canonical answer as Correct answer; stored answers and scoring are unchanged.
Guests get a quiet Settings link below quick starts to sign in for tracking.

The App passes a fresh practiceEntry intent in router state for normal clicks on
Practice/home. navigation.ts validates that state and decides whether an active
session must confirm. The Practice component key changes only when navigation
commits, so cancelling keeps the same queue/draft. Completed results and setup
have no leave blocker. Main receives focus after the committed entry reset.
Modified clicks preserve normal browser behaviour. Regression/browser checks
cover same-tab re-entry as well as navigation to other tabs.

## Tense explanations

`tense-help.ts` provides English usage cues and English-only examples for all
16 supported categories. Compound and progressive categories include formation
hints; no current Spanish conjugated answer is revealed. `TenseHint.tsx` opens
above the tense on hover, keyboard focus or tap, moving below if necessary to
stay in the viewport. Escape dismisses it. Hints do not affect scoring.

Grammar review references (short cues are not exhaustive definitions):

- [UOC: verbs](https://www.uoc.edu/es/servicios/lengua-estilo/criterios/gramatica/verbos)
- [UCM: tense, aspect and mood](https://www.ucm.es/plataformaele/caracteristicas-tam)
- [INTEF: tense, mood and voice](https://descargas.intef.es/recursos_educativos/It_didac/Leng_ESO/1/04/04_El_verbo_tiempo_modo_voz/tiempo_modo_y_voz.html)

Negative-imperative distractors receive exactly one leading `no ` before
normalization, deduplication and accepted-answer exclusion, so the prefix cannot
identify the correct option. Base forms still match the requested verb/person.

Results offer Repeat practice, keeping the previous mode, verbs, categories,
persons, length and accent policy, with a newly randomized queue. It starts a
new tracked run (never reuses the completed run ID) and does not rewrite saved
defaults. Enter on the initially focused results heading or the Repeat button
starts it; held-key repeats and duplicate starts are ignored. Other focused
controls retain their normal behavior. Failed starts keep the results and allow
retry. New practice still returns to the quick-choice screen.

## Interface update (1.1.0)

Tense help has a visible circled question mark inside the existing trigger, an
explicit accessible explanation label and a 44 px minimum height. The Practice
home screen greets signed-in users using the first available given_name, full_name
or name, falling back to “Welcome back.” Names render as text and wrap; guest,
customization, question and result screens retain their existing copy.

## Progress-based session selections (1.1.0)

`targeted.ts` ranks up to 20 catalogue verbs using current aggregate counts.
Least practiced ranks missing verb/category cells then attempts; Most mistakes
ranks weighted accuracy then more attempts, excluding unattempted verbs. Filters
match current tenses, eligible persons, mode and accent policy; counts themselves
combine persons. Spanish names break ties. `usePracticeCounts.ts` loads counts on
customization entry with owner/retry guards and ignores late replies.

Signed-in Customize and Settings expose both modes as regular `verbSet` values.
A successful Start saves the selected rule; Settings saves it explicitly. Restored
rules ignore cached resolved IDs. The home summary names the mode, and each start
(including quick starts and Repeat) reads fresh counts and resolves a new list for
the requested answer mode. `resolveVerbSelection` snapshots this rule plus the
resolved IDs; `preferredPairs` prioritises missing combinations without storing
question queues. History records the mode name and the effective selected verbs.
No candidates means an explanatory error, never a silent manual fallback.

Saved modes require `202611090001_targeted_verb_modes.sql` after the previous four
migrations. It extends only the private start validator; public owner/generation
guards and existing data are preserved. Guests keep All/Common/Select.

Results link to Progress only after all saves are acknowledged. Guest results use
the existing guest Progress destination. Customize has a visible tertiary button
border/background and minimum 44 px height.
