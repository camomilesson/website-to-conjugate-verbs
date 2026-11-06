# Project owner setup checklist

These tasks need your account ownership, sign-in, consent, or product judgement.
They are not all prerequisites for starting development. Configuration can be
done together once the accounts exist; app code, database migrations, deployment
configuration, and tests remain development work.

## Before the first public deployment

- [x] Choose a working application/project name: La Conjugadora. A custom domain is optional.
- [x] Sign in to or create your GitHub account, if needed, and ensure the project
      repository is available there. Authorise access only to the required repo.
- [x] Sign in to or create a [Vercel account](https://vercel.com/signup).
- [x] Authorise Vercel's repository integration and select the repository when
      we are ready to import it. Review the plan and any billing commitment.
- [x] Check the first deployed URL opens without a Vercel account in a private
      browser window; the finished app must be publicly accessible.

We will prepare the Vite build and deployment settings. No server rental or
custom domain purchase is required.

## Before implementing hosted authentication and persistence

- [ ] Sign in to or create a [Supabase account](https://supabase.com/dashboard).
- [ ] Create the organisation/project, select a suitable region, and review the
      plan. Store the database password in your password manager.
- [ ] Make the project URL and browser publishable key available through local
      environment configuration. These are browser configuration, unlike server
      secrets. Do not commit local secret-bearing environment files.
- [ ] Sign in to [Google Cloud Console](https://console.cloud.google.com/) with
      the Google account that should own the OAuth application.
- [ ] Create/select a Google Cloud project and configure its OAuth consent and
      branding: application name, support contact, audience, and developer contact.
- [ ] Create a Web application OAuth client. Configure the exact origins and
      callback required by the chosen Supabase Google flow. The Google callback
      points to Supabase; Supabase's allowed application redirects point back to
      our website. Use the actual project/dashboard values when configuring.
- [ ] Enter the Google client ID and client secret in Supabase's Google provider
      configuration. Keep the secret out of browser code, Git, and chat messages.
- [ ] Configure Supabase's production Site URL and allowed redirects. Permit
      local development explicitly; do not assume arbitrary preview deployments
      will have working Google sign-in.
- [ ] Complete any Google publishing/verification steps actually required by the
      selected branding/scopes, and ensure the app is available to the intended
      public audience rather than only listed test users.

We will prepare the environment-variable template, schema, row-level security,
atomic submission functions, auth integration, and account-deletion function.
Account owners may need to authorise CLI access or apply prepared configuration.
We will request specific values/actions when their milestone is ready.

## Before release

- [ ] Confirm the final verb selection, supported categories, and presentation.
- [ ] Supply a public support/contact address and review the short data/privacy
      explanation we prepare; it should match what the app actually stores.
- [ ] Test Google sign-in yourself, plus sign-out and cross-device preferences.
      Where available, use a second account to check the public sign-in flow.
- [ ] Try a practice session, abandon one, inspect Progress/History, and test
      reset/account deletion using a disposable account.
- [ ] Review current service costs/limits and select any available budget alerts
      or spending controls before enabling paid usage.
- [ ] Optional: buy a domain, configure DNS, and update OAuth/application URLs.
      This can wait until after launch.

## Setup references

- [Vercel getting started](https://vercel.com/docs/getting-started-with-vercel)
- [Supabase Google sign-in](https://supabase.com/docs/guides/auth/social-sign-in/auth-google)

Provider dashboards change. Follow current documentation and actual project
values at setup time; this checklist defines responsibilities and sequencing.

## Current checkpoint — steps 7–8

The catalogue and account integration are ready on the review branch. Follow
[AUTH_SETUP.md](AUTH_SETUP.md) for the exact migration, environment variables,
Google redirects, and two-account verification. Guest review needs no setup.

## Step 9 checkpoint

[TRACKING_SETUP.md](TRACKING_SETUP.md) gives the new migration to run in the
existing project, disposable-project SQL checks, and browser review cases.
No new account, OAuth client, key, or Vercel variable is needed.

## Step 12 checkpoint

Public support contact supplied: conjugadora.support@gmail.com.
[ACCOUNT_SETUP.md](ACCOUNT_SETUP.md) covers the new generation/reset migration,
server-only deletion function, allowed origins, and disposable-account checks.
No real reset/deletion is authorised for the assistant to execute by this setup
checklist; the owner performs the final irreversible test confirmations.
