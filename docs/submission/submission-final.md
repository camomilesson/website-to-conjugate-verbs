# Personal Project Final: Conjugadora

Conjugadora is a Spanish conjugation practice website with typing and
multiple-choice modes, a 100-verb catalogue, Google sign-in, saved preferences,
Progress, History, and account data controls.

- [Live application](https://conjugadora.vercel.app)
- [Setup, commands, package organization, and limitations](../../README.md)
- [Backend setup and operations](../OPERATIONS.md)

## Architecture and course requirements

The project uses a browser/cloud architecture rather than the course's
three-app CLI/API/web baseline. This records the implementation and differences
for review; it does not claim literal compliance or approval of every deviation.

| Final requirement                           | Evidence and limitations                                                                                                                                                                                                                                                                                           |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| CLI with a command and option               | Not implemented. The project is used through the browser.                                                                                                                                                                                                                                                          |
| API with several typed routes               | Supabase Auth, PostgreSQL data endpoints/RPCs, and a Deno account-deletion Edge Function provide backend functionality. There is no separate Node/Fastify API app. Domain repositories expose typed operations and validate incoming application data.                                                             |
| Web page showing server data                | The app loads catalogue JSON over HTTP and account data through Supabase. Progress and History display server-backed records.                                                                                                                                                                                      |
| Course concepts represented                 | Interfaces/unions, guards, generics, `Pick`, modules/re-exports, async loading, errors, HTTP, and browser interaction occur in production code. Commander/Inquirer and Fastify are absent; React handles rendering rather than imperative DOM list construction.                                                   |
| Application code in `src` directories       | Browser code lives in root `src/`; catalogue code in `packages/verb-catalogue/src/`. The exception is server-side code in the conventional `supabase/functions/` directory. Root configuration, maintenance scripts, SQL migrations/tests, and public assets serve tooling/data roles.                             |
| Every file belongs to the project           | Obsolete console exercises and their legacy-only verb model, guard, and sample JSON have been removed. Remaining development demos use labelled synthetic data to review actual features and are excluded from production.                                                                                         |
| Modlets                                     | Features under `src/modules/` expose public entry points. Auth has client (`index.ts`) and UI (`ui.ts`) entry points; learning data has a pure `data.ts` entry point for Node consumers. Cross-feature consumers use these boundaries.                                                                             |
| API access through services                 | Catalogue loaders and feature repositories separate network operations from UI callers. Account repositories use the configured Supabase SDK client.                                                                                                                                                               |
| External data validation and clear failures | Catalogue, preferences, tracking acknowledgements, History, and Progress replies are checked at their boundaries. History validation covers nested configuration, saved defaults when present, timestamps, counts, and mistakes. Invalid History/Progress replies produce errors handled by the existing retry UI. |
| Reproducible setup and checks               | The README documents prerequisites, installation, guest startup, cloud configuration, lint/tests/build, and release checks. CI uses a frozen install and `pnpm check:release`. Git ignores dependencies, builds, secrets, coverage, and Nx state.                                                                  |

## Suggested review path

1. Follow the root README quick start. Guest practice needs no credentials.
2. Try both answer modes, customization, feedback, and results.
3. With the documented account configuration, review saved preferences,
   Progress, and History. Reset/deletion affect real account data; use a
   disposable review account for those operations.
4. Read feature READMEs beside the implementation and the checkpoint mappings
   below for requirement-specific source links.

The root package holds the React app and workspace tooling.
`@conjugadora/verb-catalogue` holds catalogue types, validation, loaders, and
tests. Both use the shared TypeScript catalog; the app's `workspace:*`
dependency establishes the Nx catalogue-before-app build order.

## Current limits and future work

Guest answers are not saved to an account. Account features require cloud
configuration. There is no durable offline queue, resumable practice, or full
historical answer log. Mobile polish, OAuth branding verification, and
consolidation of layered CSS remain future work. Potential learning additions
include spaced repetition and named practice presets.

## Checkpoint evidence and verification

- [Workspace, catalog, Nx, and CI](submission-workspace.md)
- [Async loading and validation](submission-async-loading.md)
- [Server, fetch, generics, and DOM adaptations](submission-server-fetch-generics-dom.md)

Run `pnpm check:release` to reproduce app/catalogue typechecks, lint/formatting,
tests, ordered builds, and artifact checks. This does not typecheck the Deno-only
entry point or perform live OAuth, database migration, or destructive deletion
tests. Operations describes hosted verification and deployment.
