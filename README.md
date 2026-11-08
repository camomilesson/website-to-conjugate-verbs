# Conjugadora

[Practise online](https://conjugadora.vercel.app) · [Privacy & your data](https://conjugadora.vercel.app/privacy)

**Practica los verbos en español.** A desktop-first Spanish conjugation practice
website built for the Advanced JavaScript and TypeScript course at Harbour.Space
University. The interface uses ivory, forest green and citron, with serif verbs
and headings and sans-serif controls. No external font service is used.

## Practice

Choose **Multiple choice** or **Typing** to start with the last saved setup.
**Customize practice** lets you choose All/Common/individual verbs, categories,
persons, question count and accent policy. Common is a curated 25-verb subset,
not a statistical frequency ranking. First-use defaults are all verbs, Basic,
all supported persons, 20 questions and strict typing.

- **100 verbs**, including regular, irregular and reflexive verbs; **16 supported
  practice categories**. Coverage does not mean every possible Spanish tense.
- Questions are shuffled without replacement and capped at the eligible pool.
  Imperatives exclude yo. Vosotros is selectable; vos is outside release scope.
- Type the conjugated form, including required reflexive pronouns or `no`,
  without the subject pronoun. All listed answer alternatives are accepted.
- Strict typing preserves accents. Relaxed typing folds acute vowels, ñ → n
  and ü → u. Both modes ignore case and normalize surrounding/repeated spaces;
  arbitrary spelling changes and punctuation are not forgiven.
- Multiple-choice distractors match the verb and grammatical person. Negative
  commands put `no` on every option before deduplication. Usually four options
  are shown; unsafe questions are excluded or use fewer options (minimum two).
- Correct feedback advances after 650 ms. Incorrect feedback shows the answer
  and waits for Next. No skips or resumable practices.
- Hover, focus or tap the tense for English help. Compound/progressive hints
  include formation; hints do not change the score.
- Results show the score and all mistakes from that sitting. **Repeat practice**
  creates a fresh randomized run with the same settings, including answer mode.
  **New practice** returns to the mode-choice screen.

Basic has 6 categories, Advanced has the other 10, and All combines both (16).
These are convenience sets, not formal proficiency levels. See the
[catalogue guide](docs/CATALOGUE.md) for the full verb list, supported inventory,
provenance, review limits and correction procedure.

### Keyboard controls

| Context                   | Keys                                                                                                |
| ------------------------- | --------------------------------------------------------------------------------------------------- |
| Typing or selected choice | Enter submits                                                                                       |
| Multiple choice           | 1–4 or arrow keys select an option                                                                  |
| Incorrect feedback        | Space on the focused Next/See results button, or activate it normally                               |
| Results                   | Enter from the initially focused heading repeats practice                                           |
| Tense help / dialogs      | Escape dismisses                                                                                    |
| Progress matrix           | Arrow keys move cells; Home/End move across a row; Ctrl+Home/End reach corners; Enter opens details |

Tab navigation, visible focus and clickable controls remain available. Held-key
repeats are ignored. Practice navigation asks before abandoning an active run;
returning to Practice from completed results needs no confirmation.

## Accounts, Progress and History

Guest practice saves only browser-local practice/display choices. Answers and
results remain in memory and are never imported into a signed-in account.
Google sign-in enables account-specific settings, Progress and History across
devices. Practice defaults save when starting a session or using Settings Save;
Progress sort/filter/column choices save automatically. Search and scroll are
not persisted. Separate browser origins have separate guest/session storage.

Each acknowledged signed-in answer updates Progress immediately, even if the
practice is later abandoned. Only completed practices create History entries.
Incomplete queues are not saved. A connection failure locks the submitted answer
and offers Retry using the same ID; it never silently becomes a guest answer.
There is no durable offline-sync queue.

Progress has one verb per row, Overall plus tense columns, sticky headers and
labels, search, sorting and mode/accent filters. Accuracy divides summed correct
counts by summed answered counts, never averages cell percentages. Overall
includes hidden categories. A dash means unpractised, distinct from attempted
0%. Cell details expose sample sizes; colour is secondary to the numbers.

History is paginated, newest first, with local date/time, mode, score, exact
selections, non-default settings and one example mistake. The full mistake list
is available only in the current results view. Settings includes sign-out,
learning reset and account deletion. Reset retains both kinds of preferences;
deletion also removes the authentication account and saved preferences. See
[account operations](docs/OPERATIONS.md#account-deletion) and the public privacy page.

## Development

Use **Node.js 24.x** and **pnpm 12.16.1**, matching `package.json`.

```sh
pnpm install --frozen-lockfile
pnpm dev                  # Vite; pnpm start is an alias
pnpm lint                 # strict app typecheck, ESLint, Prettier
pnpm test                 # pure logic, catalogue, repositories and deletion-handler tests
pnpm build                # Nx: catalogue validation, then app typecheck/build to dist/
pnpm preview              # serve the production build locally
pnpm validate:catalogue    # catalogue-focused validation
pnpm examples             # preserved course console examples
```

Copy `.env.example` to `.env.local` for local account access. Only the Supabase
project URL and **publishable** key belong in `VITE_` variables; these are public
browser configuration. Never put the Google client secret or Supabase privileged
keys in frontend code or Git. Without configuration the app supports guests.

## Workspace and CI

The repository has two pnpm workspace packages: `conjugadora` (the app at the
root) and `@conjugadora/verb-catalogue` (`packages/verb-catalogue`). The app
imports the catalogue through its public package entry point and declares it as
`workspace:*`. Both packages use `typescript: catalog:`; the exact shared version
is pinned in `pnpm-workspace.yaml`.

`pnpm build` runs Nx across both packages. The `build` task default in `nx.json`
uses `dependsOn: ["^build"]`, so the catalogue's typecheck and dataset tests must
pass before the app builds. The catalogue exports TypeScript source, consumed
by Vite and Node 24; it does not need a separate emitted JavaScript bundle.

[Workspace checks](.github/workflows/workspace-check.yml) runs on pushes and pull
requests only when source, assets, build configuration, dependencies, or the
workflow itself change. It installs from the frozen lockfile and runs
`pnpm check:release` (lint, all tests, ordered builds, and artifact audit).
Documentation-only changes outside the source packages do not trigger CI.
See [the workspace checkpoint](docs/submission/submission-workspace.md) for submission files.

## Architecture and maintenance

React + TypeScript + Vite + plain CSS; Vercel serves the SPA/static assets.
Supabase Auth handles Google OAuth/PKCE. PostgreSQL RLS and atomic owner-scoped
RPCs handle account data. A Supabase Edge Function performs authenticated account
deletion with server-only credentials. No separate Fastify/application server is
required. Learning statistics are client-reported personal practice data, not
secure competitive grading.

`src/app/` owns composition/navigation and the global visual layer. Feature
modlets under `src/modules/` co-locate implementation, CSS, tests, docs and useful
demos, with public entry points. Answer checking and question generation remain
independent of React/network clients. Static verb JSON is canonical: no production
AI calls or runtime conjugation engine. The catalogue loads first, then selected
verb files; IDs and dataset versions are validated before use.

Local-only `/dev/progress`, `/dev/history` and `/dev/account-controls` routes use
labelled synthetic data. Their imports/routes are excluded from production.
The green visual layer is currently applied after the older baseline styles;
consolidating those styles is maintenance work, not a release requirement.

- [Operations](docs/OPERATIONS.md): hosting, Google/Supabase setup, migration order,
  schema, retention, release verification, rollback and troubleshooting.
- [Catalogue](docs/CATALOGUE.md): verb selection, category coverage, provenance
  and data maintenance.
- Module READMEs in `src/` explain feature APIs and implementation details beside
  their code. Completed plans/checkpoint docs are retired; Git preserves history.

The owner approved the public release (step 13) on 6 November 2026. Production
and staging use the established publishing workflow described in Operations.

Google OAuth deliberately remains **Testing**, requesting only basic identity
scopes; branding verification is deferred. The owner has reviewed the current
hosting/database plans and is happy with them. Desktop support is the release
target; narrow-screen fallbacks exist, but a mobile polish pass is deferred.
Spaced repetition, named custom presets, timers, leaderboards and full historical
answer logs are outside release scope.

Public support: **conjugadora.support@gmail.com**.
