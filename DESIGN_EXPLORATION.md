# Design exploration · Second nature

Experimental branch: `codex/design-exploration`. Production and staging are
unchanged. This is a working UI proposal, not an amendment to the approved
blueprint until the owner reviews it.

## Direction

A calm study workspace: ivory surfaces, deep forest green, pale sage and a small
citron highlight. Georgia remains for the identity, verbs and large headings;
installed Avenir/Segoe UI/sans-serif handles controls and data. No remote fonts,
new dependencies, third-party assets or image requests.

Desktop navigation moves to a fixed left rail, with a compact horizontal version
on narrow screens. The landing screen gives two distinct practice cards with
recognition/recall cues, a shared saved-setup summary and a quieter Customize
action. Practice adds a question progress line; keyboard controls and the
person/answer layout remain. Results, selection dialogs, Settings, History and
the Progress matrix use the same surfaces, typography and spacing. The heatmap
uses a green scale with explicit percentages and empty-state dashes.

## Scope and review

All existing catalogue, auth, preference, scoring, tracking and account-control
logic stays in place. Copy and markup change for presentation. No SQL migration,
environment variable or server-function deployment is required.

`src/app/design.css` is deliberately a final visual layer after the existing
styles, keeping the experiment easy to compare/revert. If accepted, consolidate
tokens and feature styles into the corresponding modlets rather than retaining
two competing themes long-term. `theme.css` is retained as the baseline.

Check on the branch preview:

- Home, both practice modes, feedback, results, repeat and Customize.
- Settings, verb/person/tense selection dialogs and keyboard focus.
- Progress controls, sticky matrix headers, horizontal/vertical scrolling and
  cell details; History entries, expanded details and pagination.
- Desktop at 1280×720 and 1280×800, with narrow-screen overflow as a fallback.
- Reduced motion and visible keyboard focus.

Existing `/dev/progress` and `/dev/history` routes provide clearly labelled
synthetic data for local visual review only. They are excluded from production
builds and never write account data. Guest previews do not prove hosted account
sync; underlying account behavior is not being redesigned.

Feature previews retain the existing OAuth allow-list requirements. Do not
broaden authentication access merely to preview styling; the established staging
origin can be used after the design is approved for staging.
