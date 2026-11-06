# Application shell

Owns entry point, routes, navigation, document titles, route focus and global
design tokens. Feature views are imported through their public APIs. Unknown
URLs redirect to /practice; direct links/refresh work through Vercel rewrites.
Practice blocks active-run navigation with confirmation and resets on explicit
Practice-tab entry. Identity changes remount account-specific views.

The approved green workspace uses a fixed desktop rail and narrow-screen
horizontal navigation. `theme.css` supplies baseline rules; `design.css` is the
final green visual layer, imported last in main.tsx. Consolidate these during
future style maintenance; preserve the approved rendered behavior. Georgia and
installed Avenir/Segoe UI/sans-serif fallbacks require no font downloads.

Displayed brand is Conjugadora. `public/favicon.svg` is the matching green/á
browser-tab icon, linked by index.html; theme-color matches the green brand.
Development fixture routes are lazy and excluded from production builds.

## Design rationale

The owner approved the green workspace on 6 November 2026. Ivory surfaces,
forest green, pale sage and a small citron highlight give the app a calm study
workspace. Serif headings/verbs establish identity; sans-serif labels and data
keep controls readable. Desktop uses a fixed left rail; narrow screens use
horizontal navigation. The two mode cards distinguish recognition from recall,
with one shared saved-setup summary and a quieter Customize action. Active
practice uses a question progress line and a clear verb/tense/person hierarchy.
Results, dialogs, Settings, History and the matrix share tokens/surfaces; the
heatmap uses a green scale with numeric labels and distinct unpractised dashes.

Review UI changes at 1280×720/800, check focus and reduced motion, and verify
narrow-screen overflow as a fallback. Keep selection, scoring, persistence and
account ownership separate from visual changes. Local-only fixture routes help
inspect populated data; use the configured stable staging origin for account
review rather than broadening the OAuth allow list for cosmetic previews.
