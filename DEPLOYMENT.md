# Vercel deployment

## First import

1. Create/sign in to your [Vercel account](https://vercel.com/signup), completing
   any account terms yourself. Choose a plan appropriate to this personal project;
   no paid upgrade or custom domain is required for this shell.
2. Open [New Project](https://vercel.com/new) and import
   `camomilesson/website-to-conjugate-verbs` from GitHub. Authorise the Vercel GitHub
   integration for this repository when prompted.
3. Set the project name to `la-conjugadora` if available (an alternative slug is
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
- Future work uses `codex/` feature branches with Vercel review deployments.
  Review a step before merging it into `main` and promoting it to production.
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
