import { readFileSync } from 'fs'
import { join } from 'path'
import { requireEnv } from './env.mjs'

const { NEXT_PUBLIC_SUPABASE_URL: supabaseUrl, SUPABASE_SERVICE_ROLE_KEY: supabaseKey } = requireEnv(
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
)
const { createClient } = await import('@supabase/supabase-js')
const projectRef = new URL(supabaseUrl).hostname.split('.')[0]

const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigration(name, sql) {
  console.log(`\nApplying migration: ${name}...`)

  const { error } = await supabase.rpc('exec_sql', { query: sql })

  if (error) {
    // Try breaking it into statements
    const statements = sql.split(';').filter(s => s.trim())

    for (const statement of statements) {
      if (!statement.trim()) continue

      // Skip comments
      if (statement.trim().startsWith('--')) continue

      try {
        const { error: stmtError } = await supabase.from('_exec').select().limit(0)
        // This won't work either, we need to use REST API directly
      } catch (e) {
        // Expected
      }
    }

    console.log(`Migration ${name} may need manual application`)
    console.log('Error:', error.message)
    return false
  }

  console.log(`✓ Migration ${name} applied successfully`)
  return true
}

async function main() {
  console.log('Note: Supabase client does not support raw SQL execution.')
  console.log('Please apply these migrations via the Supabase Dashboard:')
  console.log('')
  console.log(`1. Go to: https://supabase.com/dashboard/project/${projectRef}/sql`)
  console.log('2. Run each migration file:')
  console.log('   - supabase/migrations/019_giving_potential.sql')
  console.log('   - supabase/migrations/020_major_gift_pipeline.sql')
  console.log('   - supabase/migrations/021_dynamic_impact_stories.sql')
  console.log('')
  console.log('OR use the Supabase CLI:')
  console.log(`   npx supabase link --project-ref ${projectRef}`)
  console.log('   npx supabase db push')
}

main()
