/**
 * Offline regression check: every script that needs credentials must exit 1,
 * naming the missing variables, BEFORE it prints any progress or touches a
 * database / API. Runs each script in a scrubbed environment (PATH only).
 *
 *   npm run test:env-guards
 */
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
import assert from 'node:assert/strict'

const here = dirname(fileURLToPath(import.meta.url))
const SUPABASE = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']

// script -> required env var names
const SCRIPTS = {
  'check-db.mjs': SUPABASE,
  'apply-migrations.mjs': SUPABASE,
  'seed-new-features.mjs': SUPABASE,
  'fix-voice-profile.mjs': SUPABASE,
  'test-ai.mjs': [...SUPABASE, 'ANTHROPIC_API_KEY'],
  'test-email-generation.mjs': [...SUPABASE, 'ANTHROPIC_API_KEY'],
  'seed-test-data.mjs': [...SUPABASE, 'SEED_USER_EMAIL', 'SEED_USER_PASSWORD'],
  'seed-with-pg.mjs': ['DATABASE_URL', 'SEED_USER_EMAIL', 'SEED_USER_PASSWORD'],
}

function run(script, env) {
  return spawnSync(process.execPath, [join(here, script)], {
    env: { PATH: process.env.PATH, ...env },
    encoding: 'utf8',
    timeout: 20_000,
  })
}

for (const [script, required] of Object.entries(SCRIPTS)) {
  test(`${script} fails closed with no environment`, () => {
    const r = run(script, {})
    assert.equal(r.status, 1, `expected exit 1, got ${r.status}; stderr: ${r.stderr}`)
    for (const name of required) assert.match(r.stderr, new RegExp(name))
    assert.equal(r.stdout, '', 'script printed output before the env guard exited')
  })

  test(`${script} still fails when only the first variable is set`, () => {
    const [first, ...rest] = required
    const r = run(script, { [first]: 'placeholder-not-a-real-value' })
    assert.equal(r.status, 1)
    assert.doesNotMatch(r.stderr, new RegExp(`variable\\(s\\): .*${first}`))
    for (const name of rest) assert.match(r.stderr, new RegExp(name))
    assert.equal(r.stdout, '')
  })
}
