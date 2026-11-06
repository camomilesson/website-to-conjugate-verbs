# Settings modlet

Import `Settings` through `index.ts`. Uses the shared practice-preferences editor
and storage APIs; it does not import Practice internals. Save preferences commits
the draft, Restore defaults only changes the draft until saved, and navigation
without saving discards edits. Invalid/empty selections cannot be saved.

Guest choices stay browser-local; account choices sync through the auth preference
repository. The view composes Google sign-in/sign-out and the account-controls
modlet for confirmed learning reset/account deletion. It does not save answer
queues or incomplete sessions. Progress display choices persist independently.
