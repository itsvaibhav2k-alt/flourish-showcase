# Flourish

A nonprofit relationship management project built with Next.js, TypeScript, and Supabase.

Flourish brings contacts, donors, volunteers, fundraising, events, and communications into one workspace. The codebase also includes Flora, an AI assistance area for drafting and research workflows.

## Explore the code

- `src/app/(dashboard)` — application pages and workflows
- `src/lib` — shared application logic and integrations
- `supabase/migrations` — database schema and access policies
- `tests/e2e` — browser test suite and fixtures

## Local development

Use Node.js and npm, plus a Supabase project you control. Start with a disposable local or development database, not production data.

```sh
npm ci
npm run dev
```

Before launching, configure `.env.local` with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and server-only `SUPABASE_SERVICE_ROLE_KEY` from your own development project. Database migrations live in `supabase/migrations`. Optional AI, email, voice, and payment integrations require separate provider configuration; never put privileged keys in browser-exposed variables.

Development server: http://localhost:3000

```sh
npm run lint
npm run build
npm run test:e2e
```

Browser tests require the test environment described by the Playwright configuration. Database scripts require explicit environment configuration and should only be run against a database you intend to modify.

## About this repository

This is a public source snapshot. Private development history, credentials, and internal screenshots are not included. The dashboard preview has been sanitized and is labeled illustrative. The repository does not include access to a hosted workspace or configured provider accounts.
