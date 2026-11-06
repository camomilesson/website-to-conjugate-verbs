# Google sign-in and account preferences

The owner configured and verified Google sign-in, cross-device preferences and
two-account isolation, then approved production deployment. This is the setup
reference for a new environment; do not recreate the existing client/project or
rerun applied migrations.

## Existing configuration

- App/Google Branding name: **Conjugadora**. Subline: Practica los verbos en español.
- Supabase project: `gtwnkerinjbonfoynach`.
- Production: `https://conjugadora.vercel.app`.
- Stable staging: `https://conjugadora-git-staging-camomilesson-3235s-projects.vercel.app`.
- OAuth publishing status: **Testing**, intentionally retained by the owner on
  6 November 2026. Brand verification/publication is deferred, not an unfinished
  launch requirement.
- Basic identity scopes only: `openid`, `https://www.googleapis.com/auth/userinfo.email`,
  `https://www.googleapis.com/auth/userinfo.profile`. The app has no Gmail/Drive permissions.

Google documents an exception for basic identity-only requests: users need not
be test-listed, do not receive the usual testing warning, and authorization does
not expire after seven days. Other scopes remove that exception. Workspace and
individual account restrictions can still affect sign-in. Check actual requested
scopes if provider configuration changes. The public production redirect was
inspected during step 13 and requested only `email profile`, with the correct
Supabase callback and production `/settings` return. See [Google's audience guidance](https://support.google.com/cloud/answer/15549945?hl=en).

## New-environment setup

1. Create a Supabase project; choose a region/plan and store its password privately.
2. Apply all four migrations once in the order listed in OPERATIONS.md.
3. Obtain the project URL and **publishable key** (`sb_publishable_…`).
4. In Google Auth Platform, configure Branding, Audience and the three basic
   scopes in Data Access. Create a Web application OAuth client.
5. Register the exact callback from Supabase's Google provider panel as Google's
   authorized redirect URI. The current callback is
   `https://gtwnkerinjbonfoynach.supabase.co/auth/v1/callback`.
   Use the new project's own callback for a new environment, not this value.
6. Enable Google in Supabase Authentication → Providers; enter the Google client
   ID and client secret there. Never put that secret in browser code or Vercel
   `VITE_` variables. Keep nonce checks enabled and do not allow missing email.
7. Set Supabase Site URL to `https://conjugadora.vercel.app`. Allow these exact
   application redirects:
   - `https://conjugadora.vercel.app/settings`
   - `https://conjugadora-git-staging-camomilesson-3235s-projects.vercel.app/settings`
   - Optional local origin plus `/settings`, matching localhost or 127.0.0.1 exactly.
8. Where Google requires JavaScript origins, use application origins with no
   path. The OAuth callback remains the Supabase callback, not an app route.
9. Set the two browser variables for **Production and Preview** in Vercel:

```text
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_…
```

Use Vercel Config for browser-public values. Redeploy after edits because Vite
embeds them at build time. Local development can use `.env.local` copied from
`.env.example`, followed by a Vite restart. No key should be pasted into chat.

## Branding contacts

Public app contact: conjugadora.support@gmail.com. For Google's User support
email dropdown, sign in as that Google account with project Editor/Owner access,
or select a Google Group managed by the signed-in user. Developer contact can
remain the owner's private monitored address. Changing these does not require
replacing OAuth client credentials. The owner confirmed Google's displayed
Branding name is already Conjugadora; confirm the support dropdown if not yet
updated. [Google's branding settings](https://support.google.com/cloud/answer/15549049?hl=en).

## Verification and troubleshooting

Use stable staging for account review; arbitrary feature-preview return origins
are intentionally not allow-listed. A sign-in begun from another preview can
fall back to the production Site URL. Production and staging share a database
but have separate browser sessions/storage.

- Sign-in returns to Settings on the same allowed origin; refresh retains the session.
- A new account uses factory defaults. Existing account choices restore across devices.
- Guest settings stay local; neither sign-in nor a failed cloud load imports them.
- Sign-out restores guest state. Account switching clears stale drafts/questions.
- Failed saves show errors/retry, rather than silently falling back to local data.
- Run `supabase/tests/preferences_rls.sql` only in a disposable project after the
  preferences migration. The rolled-back fixtures test two-owner isolation and
  anonymous denial. The owner previously reported success; the local release
  harness also runs it. Hosted multi-session behavior remains a separate check.

See RELEASE_CHECKLIST.md for the final release pass, TRACKING_SETUP.md for
answer persistence, and ACCOUNT_SETUP.md for reset/deletion.

References: [Supabase Google OAuth](https://supabase.com/docs/guides/auth/social-sign-in/auth-google),
[API keys](https://supabase.com/docs/guides/getting-started/api-keys),
[RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).
