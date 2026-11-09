# Progress heatmap

`index.ts` exports the account Progress view and a development-only lazy demo
loader. `Heatmap.tsx` renders catalogue/count props without account access or
writes. `matrix.ts` provides pure weighted aggregation, filtering, search,
sorting, heat levels, and visible mood spans. Related styles and tests live here.

Every catalogue verb is a row, with Overall then category columns. The initial
view has six Basic columns. Advanced contains the other 10 categories; All covers the 16-category inventory;
Select columns supports arbitrary subsets, including Overall only. Overall sums
all supported categories matching the mode/accent filter, regardless of visible
columns. Missing data is a dash, distinct from attempted 0%. Persons are combined
in the stored counts. Unknown obsolete verb/category IDs are excluded from the
current catalogue view rather than creating phantom rows.

Modes: Combined, all typing, choice, strict typing, relaxed typing. Search covers
infinitive/English meaning and folds accents/case. Sort by name, accuracy or
attempts in either direction; empty accuracy sorts last and ties use Spanish
alphabetical order. Counts, not averaged cell percentages, determine accuracy.
The summary describes all search-matching verbs in the selected answer mode.

The table scrolls both axes with sticky mood/tense headers, verb names and
Overall. Each cell exposes full names/counts in a native hover title, an accessible
label, a focus readout, and a modal on click/Enter. There is one roving cell tab
stop; arrows move across rows/columns, Home/End move within a row, and Ctrl+Home/
End reach matrix corners. Escape closes details and restores focus. Values remain
readable without colour; the green scale is a secondary cue. Empty, no-match,
loading, error, retry and guest states are explicit.

## Isolated demo and review

Run `pnpm dev`, then open `/dev/progress`. This development-only route uses the
same Heatmap component with deterministic synthetic counts. Toggle Empty account
to inspect all 100 unpractised rows. It needs no sign-in and never writes to the
database. The demo import/route is eliminated from the production build.

Local browser review at 1280px desktop width covered 100 rows, 16 columns,
keyboard detail counts, Ctrl+End scrolling in both axes with fixed labels,
custom one-column selection without changing Overall, mode filtering, name/
accuracy sorting, search/no matches, and empty accounts without false 0% cells.
Pure tests also check weighted totals, bucket separation, sorting, absent cells,
and mood header spans. Existing colour overrides from shared button CSS were
corrected and computed backgrounds/foregrounds inspected.

Hosted review: sign in, inspect known verb/category counts, switch Basic/All/custom,
search and sort, filter modes and open a cell with the keyboard. Overall includes
hidden categories. Display persistence requires all four migrations; see the root
setup documents. The owner approved the heatmap and subsequent persistence work.

## Remembered display choices

`preferences.ts` validates versioned display settings and serializes writes.
`preferences-repository.ts` keeps account writes queued across tab unmounts and
isolated by owner; reads wait for pending saves. Failed saves expose retry and
keep the latest selection in memory. `useProgressPreferences.ts` hydrates before
mounting Heatmap. No guest choices are imported into an account.

Sort, answer mode/accent filter, column preset and custom columns save
automatically. Search, focus and scroll remain temporary. Guest display choices
are browser-local (guest answers remain unsaved). Reset learning data retains
these preferences; deleting the account cascades them.

For new environments, follow the [migration order](../../../docs/OPERATIONS.md#database-and-migrations)
and [verification cases](../../../docs/OPERATIONS.md#verification). Existing applied
migrations must not be rerun.

## Mobile column layout

At widths up to 760 px, only Verb remains horizontally frozen. Its width follows
the longest displayed infinitive with compact padding. Overall scrolls alongside
the tense columns; its header stays vertically sticky. Desktop keeps both frozen
columns.
