# Owner setup and release checklist

## Configured and previously verified

- [x] GitHub repository, Vercel integration, public production domain and stable staging.
- [x] Supabase project, all four migrations, Google provider and exact application redirects.
- [x] Supabase URL/publishable key in Vercel Production and Preview; redeployed and tested.
- [x] Google sign-in, sign-out, second-account isolation and cross-device saved preferences.
- [x] Tracked answers, completed History, heatmap and remembered Progress display choices.
- [x] Server deletion function and allowed origins; reset/deletion checked by owner.
- [x] Public support address: conjugadora.support@gmail.com; public privacy explanation.
- [x] Approved green design deployed to production; displayed name now approved as Conjugadora.
- [x] Hosting/database plans and costs reviewed; owner happy with current plans (6 November 2026).

## Intentional decisions

- Google OAuth stays **Testing**, using only openid/email/profile. The basic
  identity exception and remaining account restrictions are in AUTH_SETUP.md.
  Production publishing/brand verification is deferred by explicit choice.
- A custom domain and dedicated mobile polish are optional/deferred.
- Production and staging share one database. Use disposable identities for
  destructive checks. The assistant does not reset/delete real accounts.

## Final step 13 owner pass

Use RELEASE_CHECKLIST.md after the handover build is on staging. Confirm both
modes, keyboard controls, account persistence, counts/History and the renamed
brand/favicon. Earlier account/reset tests need repeating only if new evidence
or changes justify it; any destructive test uses a disposable identity and an
explicit owner confirmation. Approve production promotion after review.

Optional: if Google's support dropdown still shows the personal address, use
AUTH_SETUP.md to select conjugadora.support@gmail.com. The owner confirmed the
Google Branding app name is already Conjugadora. Developer contact can stay private.

Keep billing/recovery contacts monitored. Review actual provider dashboards for
usage/limits and available controls as traffic grows. No fixed cost guarantee or
provider backup schedule is implied by the app.

## Setup references

- AUTH_SETUP.md — provider, scopes, keys and redirects.
- OPERATIONS.md — migration order, schema, retention and rollback.
- TRACKING_SETUP.md — atomic answers, retries, counts and History checks.
- ACCOUNT_SETUP.md — reset/deletion deployment and disposable tests.
- PROGRESS_PREFERENCES_SETUP.md — display settings migration and checks.
- DEPLOYMENT.md — branch and publishing workflow.
