# Vercel deployment

Production: https://conjugadora.vercel.app — owner confirmed the renamed domain
and approved steps 7–8 on 6 November 2026.

## First import

1. Create/sign in to your [Vercel account](https://vercel.com/signup), completing
   any account terms yourself. Choose a plan appropriate to this personal project;
   no paid upgrade or custom domain is required for this shell.
2. Open [New Project](https://vercel.com/new) and import
   `camomilesson/website-to-conjugate-verbs` from GitHub. Authorise the Vercel GitHub
   integration for this repository when prompted.
3. Set the project name to `conjugadora` if available (an alternative slug is
   fine). Keep the repository root as Root Directory, framework **Vite**, and
   choose Node.js **24.x** in project settings.
4. The repository's `vercel.json` sets installation to
   `pnpm install --frozen-lockfile`, build to `pnpm build`, and output to `dist`.
   No environment variables are needed at this stage. Deploy the `main` branch.
5. Share the resulting production URL in this chat. We will verify public access,
   assets, and direct navigation/refresh for all four app routes. Do not assume
   the URL from the requested project name before Vercel confirms it.

## Agreed publishing workflow

- `main` is production; pushes trigger Vercel production deployments after the
  repository integration is connected.
- Future work uses `codex/` feature branches, then merges into the permanent
  `staging` branch for review. Register staging’s stable branch URL once with
  Google/Supabase and use it for authentication testing. Feature preview URLs
  need no OAuth setup unless explicitly required.
- After owner approval, merge reviewed staging changes into `main` for production.
  `staging` remains a Preview environment; do not change Vercel’s production
  branch from `main`.
- This first deployment is authorised to commit/push the prepared shell to main.
- Production must be available without a Vercel login. Check the production URL
  in a private window; preview access can remain restricted independently.
- No Supabase or Google OAuth configuration is required until the account step.

## Routing and checks

`vercel.json` serves `index.html` for client-side app routes. `/assets/` and
`/data/` are excluded so missing static files return errors instead of HTML.
React handles `/practice`, `/progress`, `/history`, and `/settings`, and redirects
unknown application routes to Practice.

Before publishing, run `pnpm lint` and `pnpm build`. To inspect the built output
locally, run `pnpm preview` and visit its printed URL. Vite preview verifies the
build, but the Vercel rewrite must also be verified after the real deployment.

Release smoke check:

- Open the production URL without a Vercel session.
- Confirm La Conjugadora and Practica los verbos en español appear.
- Click all four navigation links; verify the active link and document title.
- Paste each route directly into the address bar and refresh; no platform 404.
- Confirm JS/CSS assets load, with no browser errors or original console examples.
- Confirm an absent `/assets/` file does not return the application HTML.

## References

- [Vercel Vite guidance](https://vercel.com/docs/frameworks/frontend/vite)
- [Vercel project configuration](https://vercel.com/docs/project-configuration)
- [Vercel environments](https://vercel.com/docs/deployments/environments)

## Project rename checkpoint

Requested Vercel slug: `conjugadora`; display name remains La Conjugadora.
In Vercel Project Settings → General, save the new project name. Then check
Settings → Domains and ensure `conjugadora.vercel.app` is assigned to this
project; changing the name alone must not be treated as domain verification.
Keep the existing domain until the replacement works, if Vercel allows it.
Update Supabase Site URL to `https://conjugadora.vercel.app` and add
`https://conjugadora.vercel.app/settings` to allowed redirects. Recheck preview
redirects against the actual branch URL. The Google callback still points to
Supabase. Environment variables stay on the same Vercel project.

The auth client derives its return URL from the browser origin. The local
preference key retains its existing name to preserve saved settings on existing
origins; moving domains creates separate browser storage.
