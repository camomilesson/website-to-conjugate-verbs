# Practice modlet

Import `Practice` through `index.ts`. Owns local verb/category selection, search,
presets, and a labelled answer preview. It consumes the catalogue modlet's public
API without duplicating grammatical IDs or person rules. CSS is co-located.

Step 3 supports one/many/all verbs, individual categories, Basic/Advanced/All,
clear actions, loading/error/retry states, and previewing accepted alternatives.
Selections are local to this mounted view, not persisted yet. Starting/scoring a
practice session belongs to step 4, remembered defaults to step 6. The preview
exposes only applicable persons, excluding yo for imperatives.
