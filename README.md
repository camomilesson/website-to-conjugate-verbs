# La Conjugadora

[Open La Conjugadora](https://conjugadora.vercel.app)

A desktop-first Spanish conjugation practice website with an old-newspaper
visual style, developed for the Advanced JavaScript and TypeScript course at
Harbour.Space University.

## Planned experience

- Approximately 100 common verbs across a defined set of tenses and moods.
- Typing and multiple-choice practice, configurable by verbs, categories, persons,
  and test length; optional accent-insensitive typing.
- Practice, Progress, History, and Settings tabs.
- Google sign-in, remembered practice preferences, and cross-device learning data.
- A verb-by-tense accuracy heatmap and completed-test history. Submitted answers
  count toward progress even when a test is abandoned; tests cannot be resumed.
- Public hosting, guest practice, and account/data deletion controls.

## Architecture direction

React, TypeScript, Vite, and plain CSS; Vercel hosting; Supabase authentication and
PostgreSQL for user data. The assistant generates the versioned JSON verb catalogue during development;
production serves the reviewed static files. Organise implementation as modlets, keeping related code,
styles, tests, documentation, and useful demos together. Retain pnpm, ESLint, and
Prettier.

## Current status and development reference

Production includes typing, multiple choice, and remembered browser preferences.
The steps 7–8 review branch expands this to 100 verbs and prepares Google accounts
and synced preferences. Authentication still needs owner setup; see
[AUTH_SETUP.md](AUTH_SETUP.md). Progress and History persistence come later.
Original console examples remain separate from the browser app.

Use Node.js 24+ and pnpm 12.16.1:

```sh
pnpm install
pnpm dev       # local browser app; also available as pnpm start
pnpm lint      # typecheck, ESLint, and formatting
pnpm test      # catalogue, answer checking, and session regression checks
pnpm build     # typecheck, validate catalogue, build in dist/
pnpm preview   # serve the production build locally
pnpm examples  # original standalone console examples
```

Open the URL printed by Vite. Navigation uses `/practice`, `/progress`, `/history`,
and `/settings`; Vercel routing is deployed and verified. See [DEPLOYMENT.md](DEPLOYMENT.md) for
import settings and the publishing workflow. The public shell is live; practice features are still in development. Feature code lives
under `src/modules/`, while `src/app/` owns composition and the global theme.

[BLUEPRINT.md](BLUEPRINT.md) is the approved development reference, including the
16-category release inventory. [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)
provides numbered steps and review checkpoints. [MANUAL_SETUP.md](MANUAL_SETUP.md) lists account
and setup work for the project owner. At public release, update this README with
the deployed URL and lasting usage/development documentation, migrate necessary
blueprint details, and remove the temporary blueprint.
