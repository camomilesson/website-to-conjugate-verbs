# Checkpoint: Load a file in your project

[Assignment and requirements](https://cjb-labs.github.io/knowledge-base/hsfe403/module3/async/create-load/reference/)

Conjugadora implements asynchronous JSON loading in its browser application.
The existing implementation demonstrates promises, `async`/`await`, runtime
validation, and errors propagated through asynchronous calls. It adapts the
assignment's Node filesystem and process-exit behavior to a browser interface.
This document records that adaptation; it does not claim literal compliance
with every Node-specific requirement.

## Files to review

- [catalogue.ts](../../packages/verb-catalogue/src/catalogue.ts): `loadCatalogue`
  and `loadCatalogueVerb` fetch and validate JSON; `parseCatalogue` and
  `parseCatalogueVerb` check its structure before returning typed data.
- [catalogue.json](../../public/data/catalogue.json): the external catalogue
  manifest, containing schema version, dataset version, and 100 verb entries.
- [hablar.json](../../public/data/verbs/hablar.json): an example individual verb
  file with the conjugation data loaded by `loadCatalogueVerb`.
- [useCatalogue.ts](../../src/modules/progress/useCatalogue.ts): a caller that
  handles the loader's promise, stores successful data, and catches errors.
- [Progress.tsx](../../src/modules/progress/Progress.tsx): displays loading and
  failure states and offers Retry.
- [catalogue.test.ts](../../packages/verb-catalogue/src/catalogue.test.ts): tests
  valid data, rejected shapes, HTTP errors, malformed JSON, mismatched data,
  and cancellation.

## Loading and validation

`loadCatalogue` returns `Promise<Catalogue>`. It awaits `fetch`, checks the HTTP
status, awaits JSON parsing, and treats the parsed result as `unknown`.
`parseCatalogue` then checks the schema and dataset versions, a nonempty list of
valid verb entries, and unique verb IDs before returning a `Catalogue`.

`loadCatalogueVerb` follows the same sequence for an individual verb. Its parser
checks all supported categories, valid persons, and nonempty unique answer
arrays. The loader also checks that the verb's identity and dataset version
match the manifest. Data is returned to the caller only after these checks pass.

The parsers use runtime checks and private type guards such as `object`,
`nonempty`, and `entry`; a TypeScript annotation alone does not establish that
downloaded JSON has the expected structure.

## Distinct failures and recovery

Examples of separate failure messages in the implementation:

- An unsuccessful manifest request: `Could not load the verb catalogue (404).`
- An invalid manifest structure:
  `Invalid catalogue: expected version and nonempty verb entries.`
- A manifest/verb identity or version mismatch:
  `Catalogue and verb data do not match. Reload and try again.`

Malformed JSON also rejects during `await response.json()`. Its message comes
from the browser's JSON parser rather than a custom application message.

Errors thrown inside the async loaders reject their returned promises. In the
Progress view, `useCatalogue` catches the rejection and exposes its message to
the component. The component displays the failure instead of the catalogue
view and provides Retry. An `AbortController` cancels obsolete requests, and
the hook suppresses state updates from cancelled loads.

## Mapping to the checkpoint

| Requirement                                              | Existing implementation and differences                                                                                                                                                                          |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| JSON file and a function returning a promise of its data | External JSON under `public/data/`; `loadCatalogue` and `loadCatalogueVerb` return promises of validated data.                                                                                                   |
| Load data at start-up with `await`                       | Loaders use `await`; the Progress view starts loading when it mounts. This is browser view initialization, rather than a Node program's top-level start-up. Individual verb files load when needed for practice. |
| Guard the shape before use                               | Runtime parsers and type guards check downloaded values before the loaders return them.                                                                                                                          |
| Path built from the reading module's folder              | Adapted: `/data/catalogue.json` and `/data/verbs/<id>.json` resolve from the website's origin. They are not module-relative filesystem paths.                                                                    |
| At least two different failure messages                  | HTTP failures, invalid shapes, and manifest/verb mismatches have distinct messages.                                                                                                                              |
| Print the failure and exit non-zero                      | Adapted: the interface displays the failure and offers recovery. A browser application does not expose a Node process exit code.                                                                                 |
| Node execution and typecheck                             | The production app runs in a browser. Catalogue tests run with Node, and the code is checked by TypeScript; these do not make the browser loader a Node filesystem loader.                                       |
| Scope limited to this cycle's concepts                   | The loader demonstrates the relevant async and guard concepts. Its React caller and cancellation handling belong to the larger application and go beyond the checkpoint's minimal example.                       |

## Verification commands

From the repository root, using Node 24 and the pinned pnpm version:

```sh
pnpm validate:catalogue
pnpm check
pnpm dev
```

Open Progress to exercise its catalogue loading interface.
The automated catalogue tests exercise loader success and failure paths without
requiring account credentials.
