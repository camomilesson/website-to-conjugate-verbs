# Google accounts: owner setup and verification

Step 8 code is prepared; hosted authentication is **not verified yet**. You can
review the 100-verb guest experience without doing any of this first.

## 1. Supabase

1. Create a [Supabase project](https://supabase.com/dashboard), choose its region,
   and save the database password privately.
2. In SQL Editor, run
   [the migration](supabase/migrations/202611050001_user_preferences.sql) once.
   It creates only account preferences with per-user row-level security. It does
   not create learning-progress tables or account deletion functions.
3. From the project's Connect/API keys panel, copy the project URL and
   **publishable key** (`sb_publishable_…`). This app deliberately accepts that
   key format. Never use a secret key or service-role key in a VITE variable.

## 2. Google and redirects

1. Create/select a [Google Cloud project](https://console.cloud.google.com/).
   Configure the OAuth consent/branding, support contact, audience, and developer
   contact. Use the application name La Conjugadora. While Google is in testing,
   add the accounts you intend to test with; public availability needs the
   appropriate published audience and any verification Google requires.
2. Create an OAuth **Web application** client. Copy the exact callback URL shown
   in Supabase's Google provider panel into Google's authorised redirect URIs
   (normally `https://<project-ref>.supabase.co/auth/v1/callback`). The callback
   goes to Supabase, not directly to La Conjugadora. Use the exact project values.
   Follow the provider instructions for authorised JavaScript origins if requested.
3. Enable Google in Supabase Authentication → Providers. Enter the Google client
   ID and client secret there. Keep the secret out of Git, Vercel VITE variables,
   and chat.
4. In Supabase Authentication → URL Configuration, set Site URL to
   `https://conjugadora.vercel.app`. Add application redirect URLs:
   - `https://conjugadora.vercel.app/settings`
   - The exact stable branch preview's `https://…vercel.app/settings` URL, obtained
     via Visit in Vercel (the dashboard URL is not an application redirect).
   - Optionally `http://localhost:5173/settings` or
     `http://127.0.0.1:5173/settings`, matching your actual local origin.

## 3. Configure and redeploy the review branch first

In Vercel → Project → Settings → Environment Variables, set these for **Preview**:

```text
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_…
```

Redeploy the branch so Vite embeds the configuration. No other environment
variables are needed for this step. These two values are browser configuration;
row-level security protects the data. Local development can use `.env.local`
based on `.env.example`, then restart Vite. Do not commit your environment file.
After review, configure Production and redeploy/promote the approved branch.
Do not enable production sign-in before applying the migration and redirects.

## 4. Checks before step 8 is approved

- Google sign-in returns to Settings; refresh retains the account; cancelling
  sign-in gives a recoverable message.
- New account starts from factory defaults, even when guest settings differ.
- Save preferences, reopen the site in another browser, sign in to the same
  account, and confirm those preferences. Starting practice also saves defaults.
- Sign out: browser-local guest settings return; unfinished questions are
  discarded. Guest practice still works. Signing in to a second account never
  displays the first account's selections.
- In a disposable Supabase project, run
  [preferences_rls.sql](supabase/tests/preferences_rls.sql) through SQL Editor.
  It creates temporary test identities in a transaction, checks ownership and
  anonymous denial, then rolls back. This script is prepared but **has not been
  executed**. Do not treat frontend tests as proof of database isolation.
- Check missing-table/network failures show an error and allow retry, rather
  than overwriting cloud preferences with local settings.

Stop here for review. Learning data, history, heatmap, and account deletion are
later plan steps; only authentication and preferences belong to this checkpoint.

References: [Supabase Google OAuth](https://supabase.com/docs/guides/auth/social-sign-in/auth-google),
[API keys](https://supabase.com/docs/guides/getting-started/api-keys),
[row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security).
