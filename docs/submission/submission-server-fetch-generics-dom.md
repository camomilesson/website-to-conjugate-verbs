# Final checkpoint: Server, fetch, generics, and DOM

Conjugadora is a React browser app hosted on Vercel, with Supabase Auth,
PostgreSQL, and an account-deletion Edge Function. This submission maps the
existing implementation to the four Module 4 assignments. It distinguishes
implemented concepts, architectural adaptations, and requirements that are not
implemented literally. It does not claim that the professor has approved each
individual adaptation.

## 1. Server

[Assignment: A server in your project](https://cjb-labs.github.io/knowledge-base/hsfe403/module4/fastify/create-server/reference)

### Files to review

- [delete-handler.ts](../../supabase/functions/_shared/delete-handler.ts):
  injectable HTTP handler with method, header, body, and identity checks.
- [delete-account/index.ts](../../supabase/functions/delete-account/index.ts):
  configures server-only credentials, verifies the caller through Supabase Auth,
  deletes the authenticated account, and starts the Deno HTTP handler.
- [delete-handler.test.ts](../../src/modules/account-controls/delete-handler.test.ts):
  exercises authentication, validation, origin, ownership, and failure behavior.
- [Database migrations](../../supabase/migrations/): account-owned data, row-level
  security, and RPCs used by the app.

The Edge Function is a real backend endpoint. Its POST body must contain
`confirmation: "DELETE"` and an `expectedUserId`. A bearer token is required;
the server verifies the token and derives the deletion target from the verified
identity rather than trusting a caller-supplied account ID.

| Assignment requirement                                                         | Current implementation                                                                                                                                                                             |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fastify server with at least three routes in a plugin registered by `index.ts` | Not implemented. Supabase supplies data/auth services; the custom endpoint uses `Deno.serve`, not Fastify plugins or a standalone Node server.                                                     |
| Path parameter and 404 for an unknown ID                                       | No equivalent custom route. The deletion endpoint deliberately derives its target from authentication rather than a path parameter.                                                                |
| Body validation, 400 for invalid data, 201 for success                         | Body validation returns 400. Successful deletion returns 200; it does not create a resource and does not return 201.                                                                               |
| Required header and 401 when missing                                           | Implemented: absent or invalid bearer authentication returns 401.                                                                                                                                  |
| Restart on save; all routes/statuses reachable with curl                       | No Node watch server or three-route curl demonstration. The handler has automated request/response tests; hosted deletion requires a real account and is destructive.                              |
| Node runtime and typecheck                                                     | The deployed entry point uses Deno. The shared handler is imported by Node tests and checked with the app's TypeScript sources; the Deno entry point is outside the root TypeScript configuration. |
| Only this cycle's concepts                                                     | The implementation also includes CORS, authentication verification, ownership checks, and injected dependencies.                                                                                   |

## 2. Fetch

[Assignment: Fetch in your project](https://cjb-labs.github.io/knowledge-base/hsfe403/module4/fetch/create-fetch/reference)

### Files to review

- [catalogue.ts](../../packages/verb-catalogue/src/catalogue.ts): direct browser
  `fetch` calls for the catalogue and individual verb JSON files.
- [learning-data/repository.ts](../../src/modules/learning-data/repository.ts):
  Supabase reads and RPC calls for practice tracking and progress.
- [account-controls/repository.ts](../../src/modules/account-controls/repository.ts):
  account operations and server error-body handling for account deletion.
- [useCatalogue.ts](../../src/modules/progress/useCatalogue.ts) and
  [Progress.tsx](../../src/modules/progress/Progress.tsx): propagate loading
  failures into visible UI states with retry.

Catalogue loaders await HTTP responses, check `response.ok`, read JSON as
`unknown`, and validate it before returning typed values. Account repositories
use the Supabase SDK to issue database reads, JSON POST RPCs, and the deletion
function invocation. SDK-mediated requests are separate from the application's
direct use of `fetch`.

| Assignment requirement                                | Current implementation                                                                                                                                                                                            |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET and POST with a JSON body using `fetch`           | Direct `fetch` implements GET. POST operations exist through the Supabase SDK; there is no application-owned direct-fetch POST counterpart.                                                                       |
| Read every response as JSON and give it a type        | Successful catalogue replies are read and validated. Non-OK catalogue replies throw before reading the body. SDK repositories inspect returned data and errors; this is not one uniform JSON response reader.     |
| Non-OK status uses the server's message when supplied | Catalogue errors report HTTP status instead. The account-deletion repository reads an error response's JSON `error` field when available and throws that message. This behavior is not universal across requests. |
| Unreachable server gets a custom message              | Not consistently implemented. A rejected catalogue fetch propagates its browser-provided network error; other repository errors have operation-specific messages.                                                 |
| Node execution and cycle scope                        | The production callers run in the browser and include SDK/React integration. Catalogue loader tests run with Node and mocked fetch responses.                                                                     |

## 3. Generics and services

[Assignment: Services in your project](https://cjb-labs.github.io/knowledge-base/hsfe403/module4/generics/create-services/reference)

### Files to review

- [useAccountData.ts](../../src/modules/learning-data/useAccountData.ts):
  `useAccountData<T>` accepts a loader returning `Promise<T>` and preserves that
  type in account-owned state.
- [choices.ts](../../src/modules/practice/choices.ts):
  `shuffled<T>` returns a shuffled copy while preserving the element type.
- [preferences.ts](../../src/modules/practice-preferences/preferences.ts):
  private helpers `supported<T extends string>` and `selection<T extends string>`
  constrain values to supported string identifiers.
- [model.ts](../../src/modules/learning-data/model.ts):
  `PracticeMetadata.selections` derives its fields from `PracticePreferences`
  using `Pick`; `totals` also accepts a projection of `CountRow`.
- [learning-data/repository.ts](../../src/modules/learning-data/repository.ts):
  domain service functions separated from their UI callers.

| Assignment requirement                                                                       | Current implementation                                                                                                                               |
| -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Requests grouped into service functions                                                      | Implemented in feature repositories and the catalogue loader.                                                                                        |
| One private generic request function with an object constraint and a default type            | Not implemented. Existing generic helpers have other responsibilities; none supplies the requested shared request wrapper or default type parameter. |
| Two services use that wrapper and specify their reply types                                  | Not implemented as prescribed. Services have typed results, but do not share an application-owned generic request function.                          |
| A project type derived using `Pick` or `Omit`                                                | Implemented with `Pick`, including `PracticeMetadata.selections`.                                                                                    |
| Only services exported; request helper and server address private; no other file calls fetch | No matching centralized module. The catalogue directly calls fetch, while account repositories use a shared Supabase client.                         |
| Node execution, typecheck, and cycle scope                                                   | TypeScript checks the application, but the React hook and browser/SDK services are not a standalone Node services example.                           |

These files demonstrate actual generic functions, constraints, and derived
types. They do not substitute for the assignment's specific generic HTTP
wrapper design.

## 4. DOM page

[Assignment: A page in your project](https://cjb-labs.github.io/knowledge-base/hsfe403/module4/dom/create-page/reference)

### Files to review

- [main.tsx](../../src/app/main.tsx): finds the root element and throws
  `Application root is missing.` if it is absent, before mounting React.
- [Heatmap.tsx](../../src/modules/progress/Heatmap.tsx): renders catalogue and
  progress data as an interactive matrix, with keyboard navigation and details.
- [ChoiceAnswer.tsx](../../src/modules/practice/ChoiceAnswer.tsx): renders answer
  options, inspects `event.target` with `closest`, selects DOM elements for
  focus, and installs/removes a native keyboard listener.
- [TenseHint.tsx](../../src/modules/practice/TenseHint.tsx): adds native resize
  and scroll listeners and removes both when the effect is cleaned up.

| Assignment requirement                                                     | Current implementation                                                                                                                                                             |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Page listing items from project data                                       | Implemented through React components, including the progress matrix.                                                                                                               |
| Build the list with `createElement` and set item text with `textContent`   | Adapted: JSX and React render elements and text; application code does not use those imperative DOM calls to construct the list.                                                   |
| One delegated click listener on the list using `event.target` or `closest` | Not implemented in that form. React handles component interactions. `ChoiceAnswer` uses `event.target`/`closest` for keyboard-event filtering, not a delegated list click handler. |
| Remove a listener when no longer wanted                                    | Implemented through effect cleanup in `ChoiceAnswer` and `TenseHint`.                                                                                                              |
| Find page container with a selector; stop with a message if absent         | The root is found with `document.getElementById("root")`, with an explicit error if absent. This uses ID lookup rather than `querySelector`.                                       |
| No `innerHTML` assignment                                                  | Met: the app does not set `innerHTML` or use React's `dangerouslySetInnerHTML`.                                                                                                    |
| Browser execution and typecheck                                            | The app runs in the browser and is checked with TypeScript. React and its lifecycle go beyond the cycle's minimal DOM-only implementation.                                         |

## Review and verification

The architectural differences above should accompany the source evidence when
submitting. No additional server, duplicate request layer, or separate DOM demo
was introduced for this checkpoint.

From the repository root:

```sh
pnpm check:release
pnpm dev
```

The release check covers TypeScript, lint/formatting, existing tests (including
the shared deletion handler and catalogue loaders), ordered workspace builds,
and the production artifact audit. It does not deploy or typecheck the Deno
entry point, execute live account deletion, or prove literal compliance with the
four assignments. Account review and deployment details are in
[Operations](../OPERATIONS.md).
