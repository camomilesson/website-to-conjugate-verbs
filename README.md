# Website to Conjugate Verbs

A minimalist website for practicing verb conjugations, developed as a personal project for the Advanced JavaScript and TypeScript course at Harbour.Space University.

## About

Language-learning apps like Duolingo are great for building vocabulary and learning the basics, but I wanted something more focused: a simple way to drill verb conjugations across different tenses.

Existing tools tend to be either too limited or locked behind a paywall. This project aims to provide a free, straightforward alternative.

## Planned Features

- Practice conjugating verbs across different tenses and persons.
- Check answers and track performance.
- Choose which verbs and tenses to practice.
- Sign in and save settings and learning progress across devices.
- Keep the interface clean, simple, and distraction-free.

## Tech Stack

- TypeScript
- HTML/CSS
- pnpm for package management
- ESLint and Prettier

## Architecture decisions

- **Vercel** will host the web frontend.
- **Supabase Auth** will handle authentication; the initial sign-in method is
  still to be decided.
- **Supabase PostgreSQL** will store user settings and learning progress.
  Progress will use a shared table with records associated with each user,
  rather than a separate table per user.
- The frontend will initially access Supabase through its JavaScript client.
  Row-level security policies will restrict users to their own settings and
  progress. A custom backend server is not currently planned.

Vercel and Supabase are selected but have not been configured yet. The verb-data
source, frontend framework (if any), and definition of learning progress are
still open decisions.

The initial goal is a deployed, usable version within roughly a week and a half
of starting development. A minimal page should be deployed early so deployment
can be verified before the full practice flow is complete.

## Local development

Use Node.js 24 or newer and pnpm 12.16.1. Node runs the project's erasable
TypeScript directly; TypeScript checks types separately without generating files.

```sh
pnpm install
pnpm start
pnpm check
pnpm lint
pnpm format
```

`pnpm lint` runs type checking, type-aware ESLint checks, and Prettier checks.
`pnpm format` applies formatting. Commit `pnpm-lock.yaml` when dependencies change
and use pnpm consistently for dependency management.

## Status

In development. Project approved for the Advanced JavaScript and TypeScript course at Harbour.Space University.
The repository currently contains the TypeScript and pnpm tooling foundation;
the web interface, authentication, and persistence are not implemented yet.
