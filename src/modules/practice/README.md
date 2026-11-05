# Practice modlet

Import `Practice` through `index.ts`. The feature owns guest typing and multiple-choice practice;
all conjugation IDs/data come from the catalogue public API, and matching comes
from the independent answer-checking module.

- `PracticeSetup.tsx`: uses the shared practice-preferences editor for configuration,
  length, strict/relaxed accents, pre-start pool count/capping, and cancellable
  loading of the selected verb files. Invalid/empty pools cannot start. Errors
  retain the selection and let the user retry Start.
- `session.ts`: pure eligible-person mapping, unique shuffled question sampling,
  session transitions, and score calculation. usted/ustedes follow the selected
  third-person singular/plural groups. Questions snapshot accepted alternatives.
- `choices.ts`: real same-verb distractors, excluding all accepted alternatives,
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
Multiple choice is implemented in step 5. Choice submissions require an offered
index and always use strict matching, independently of the typing accent policy.
Setup preloads selected verb files in choice mode to show the eligible pool size,
handles loading/error/retry, and aborts stale loads. Typing still loads on Start.
Authenticated progress/history remains later work.
Run `pnpm test` for matching, sampling, and state regression checks. Browser review
covers keyboard input/focus, character insertion, navigation cancellation, refresh,
and end-to-end scoring; those are not simulated by the pure unit tests.
