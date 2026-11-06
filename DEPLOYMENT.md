# Deployment and publishing workflow

Production: **https://conjugadora.vercel.app**

Stable staging: **https://conjugadora-git-staging-camomilesson-3235s-projects.vercel.app**

Vercel project slug: `conjugadora`; displayed brand: Conjugadora. Production
must open without a Vercel session. Preview deployment protection can remain on.

## Build settings

Import `camomilesson/website-to-conjugate-verbs` from GitHub with repository root
as Root Directory, **Vite**, **Node.js 24.x**, and production branch **main**.
`package.json` pins pnpm 12.16.1. `vercel.json` defines:

- Install: `pnpm install --frozen-lockfile`
- Build: `pnpm build`
- Output: `dist`

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` for both Production
and Preview. They are browser-public configuration; no privileged key belongs
there. Redeploy after variable changes. Without configuration, guest practice
works but account features do not. See AUTH_SETUP.md for provider configuration.

## Agreed publishing workflow

1. Implement on a `codex/` feature branch and run relevant checks.
2. Merge into permanent **staging**, push, wait for successful Vercel deployment,
   and have the owner review at the stable staging URL. Use that origin for OAuth
   tests; branch previews are for isolated review and may not support sign-in.
3. After approval, fast-forward **main** to the reviewed commit and push. Confirm
   the new production deployment completes and public routes/assets work.
4. Keep staging as a Preview environment; do not change the production branch.

Existing production/staging deployments use the same Supabase database. Avoid
breaking migrations or destructive test actions on real accounts. See
OPERATIONS.md for migration order, rollback and incident handling.

## Routes and release checks

`vercel.json` serves `index.html` for SPA routes. React provides `/practice`,
`/progress`, `/history`, `/settings` and `/privacy`; unknown app routes redirect
to Practice. `/assets/` and `/data/` are excluded from the SPA rewrite, so missing
static files return errors rather than HTML. `/favicon.svg` is the tab icon.

Run `pnpm check:release` before release; the optional SQL harness is documented
in TRACKING_SETUP.md. Run `pnpm preview` to inspect built output, then verify the
real deployed routes, provider redirects and public access. The full final pass
is in RELEASE_CHECKLIST.md. Google OAuth remains Testing by owner decision;
only the basic-identity scopes are in scope for release.

A changed domain requires updating Supabase Site URL and allowed `/settings`
returns, relevant Google origins/callback settings, and the deletion function's
allowed origins. Browser-local guest preferences and sessions do not migrate
between origins. Keep the legacy preference key to preserve existing users' data.

References: [Vercel Vite guidance](https://vercel.com/docs/frameworks/frontend/vite),
[project configuration](https://vercel.com/docs/project-configuration),
[environments](https://vercel.com/docs/deployments/environments).
