# Progress heatmap

`index.ts` exports the account Progress view and a development-only lazy demo
loader. `Heatmap.tsx` renders catalogue/count props without account access or
writes. `matrix.ts` provides pure weighted aggregation, filtering, search,
sorting, heat levels, and visible mood spans. Related styles and tests live here.

Every catalogue verb is a row, with Overall then category columns. The initial
view has six Basic columns. Advanced/All cover the approved 16-category inventory;
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
readable without colour; the burgundy scale is a secondary cue. Empty, no-match,
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

Hosted review on staging: sign in with the step 9 account, inspect the known
verb/category counts, switch Basic/All/custom, search and sort, use mode filters,
and open a cell with the keyboard. Confirm Overall includes hidden tenses.
No SQL migration or environment-variable change is needed. Main remains at
approved step 9 until the heatmap review is approved. History remains the initial
step 9 view; its full UI belongs to step 11.
