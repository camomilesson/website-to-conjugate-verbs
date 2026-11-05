# Settings modlet

Import `Settings` through `index.ts`. Uses the shared practice-preferences editor
and storage APIs; it does not import Practice internals. Save preferences commits
the draft, Restore defaults only changes the draft until saved, and navigation
without saving discards edits. Invalid/empty selections cannot be saved.

Preferences currently live only in this browser. Account controls are explicitly
unavailable until later milestones. The section does not save answers, incomplete
sessions, or history.
