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
