# Step 13 release handover

Status: **Ready for owner review after staging deployment** · 6 November 2026.
Do not mark the implementation plan Verified until the owner confirms this pass.

## Decisions and scope

- Green workspace design approved and already deployed to production.
- Displayed name **Conjugadora** approved; Google Branding already uses that name.
  The handover build aligns the website, document titles and notices, and adds
  the green/á SVG favicon. URLs and saved-data keys are retained.
- Google OAuth deliberately stays **Testing** with basic identity scopes.
  Public redirect inspection requested `email profile`; no sensitive scopes were
  present. No real Google account was used by the assistant for this inspection.
- Owner reviewed current Vercel/Supabase plans and accepted the costs/limits.
- Lasting product/architecture guidance moved to README/module docs; schema,
  retention and operational guidance moved to OPERATIONS.md. Temporary BLUEPRINT.md
  is retired; its history remains in Git. No new database migration/function needed.

## Checks performed by the assistant

- `pnpm check:release`: lint/typecheck/formatting, 55 Node tests, catalogue
  validation, production build and built-artifact audit.
- SQL harness: all four actual migrations plus all four rolled-back SQL suites,
  including practice-default RLS (now included in the harness), tracking,
  generation/reset/deletion and Progress display preferences.
- Artifact audit checks index assets/favicon, 100 static verb files, old displayed
  branding, development fixture routes/content, known server credential names,
  secret-key patterns and privileged JWT roles. It is a targeted static check,
  not proof that arbitrary credentials can never be introduced.
- Public production routes `/practice`, `/progress`, `/history`, `/settings`,
  `/privacy` return 200 without a Vercel session. Manifest and hablar data return
  JSON; missing `/assets/` and `/data/` files return 404 rather than app HTML.
- Public guest browser: complete typing with Enter and wrong-answer feedback;
  Space to results; select choice with number key, Enter to submit, correct
  automatic advance to results. Progress stays unpractised and History unsaved.
  Privacy/contact page opens. No application console errors observed.
- Public Google sign-in reaches Google's email-entry page with the correct
  Supabase callback and production return URL; the privacy link matches the app.
  Account credentials were not entered and no new signed-in integration claim
  is made from reaching that page.

A final contrast pass darkened secondary text slightly on sage surfaces and
used that same text token for unpractised dashes; keyboard hints remain clearer.
Primary text, primary buttons, muted labels and heatmap values meet at least
4.5:1 for the checked solid-colour pairs. Decorative marks are not data labels.

The build emits Vite's existing warning about a JS chunk above 500 kB (roughly
615 kB raw / 178 kB gzip). Catalogue JSON is separate. This is a known performance
maintenance item, not a failing check. A dedicated mobile polish and consolidation
of the layered CSS remain deferred; system fonts require no redistributed fonts.

## Handover build verification

Vercel reports the staging handover deployment completed. This assistant browser
is redirected to Vercel login by preview protection, so no deployed staging
browser pass is claimed. The owner can use the existing protected staging access.
The locally served production build was checked at 1280×720: Conjugadora in the
wordmark/title, favicon link and SVG response, no horizontal page overflow, and
correct updated privacy/retention copy. The favicon is served as image/svg+xml.

## Owner final verification

On stable staging, then approve production promotion:

1. Confirm **Conjugadora**, the subline and the green/á tab icon. Browser favicon
   caches can outlive a page reload; use a fresh tab/private window if needed.
2. Complete both practice modes. Check number selection, Enter Submit, Space
   Next, automatic correct advance and Enter Repeat. Review a tense tooltip.
3. With a real account, submit a short practice and check Progress/History. Reopen
   on another browser/device to confirm settings and counts restore. Accounts
   remain isolated. Earlier hosted checks were owner-approved; the handover does
   not change persistence or schema.
4. Inspect the renamed Settings/privacy copy and public contact. Confirm the
   final documentation matches the intended release.

Reset/deletion were previously deployed and verified by the owner. No destructive
retest is required merely for the name/favicon/docs change. If an account-control
regression is suspected, use a disposable identity and ACCOUNT_SETUP.md; never
use a main learning account. SQL/WASM is single-connection, so independent hosted
races and the real GoTrue deletion service are not proved by those local tests.

After approval: promote the reviewed staging commit, verify Vercel production
completion, then record step 13 Verified. Google brand verification remains deferred
by choice. This checklist does not silently enable paid plans or provider settings.
