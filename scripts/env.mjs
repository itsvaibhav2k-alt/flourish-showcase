/**
 * Fail-closed environment loader for the maintenance scripts in scripts/.
 *
 * No credential is hardcoded in these scripts. Every script calls requireEnv()
 * at module top level, before the Supabase/Postgres/Anthropic packages are even
 * imported (they are loaded with dynamic import() after the guard),
 * and exits with code 1 if anything is missing.
 *
 * Load a local env file with Node's built-in flag, e.g.
 *   node --env-file=.env.local scripts/check-db.mjs
 *
 * Variables used by the scripts:
 *   NEXT_PUBLIC_SUPABASE_URL   Supabase project URL (local dev: http://127.0.0.1:54321)
 *   SUPABASE_SERVICE_ROLE_KEY  service_role key (privileged; never commit it)
 *   DATABASE_URL               Postgres connection string (seed-with-pg.mjs only)
 *   SEED_USER_EMAIL            email for the seeded test login (seed-test-data, seed-with-pg)
 *   SEED_USER_PASSWORD         password for the seeded test login (seed-test-data, seed-with-pg)
 *   ANTHROPIC_API_KEY          test-ai.mjs, test-email-generation.mjs
 */
export function requireEnv(...names) {
  const missing = names.filter((name) => !process.env[name]?.trim())
  if (missing.length > 0) {
    console.error(`Missing required environment variable(s): ${missing.join(', ')}`)
    console.error('Set them in your shell, or run: node --env-file=.env.local scripts/<script>.mjs')
    process.exit(1)
  }
  return Object.fromEntries(names.map((name) => [name, process.env[name]]))
}
