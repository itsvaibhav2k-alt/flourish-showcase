import { requireEnv } from './env.mjs'

const { NEXT_PUBLIC_SUPABASE_URL: supabaseUrl, SUPABASE_SERVICE_ROLE_KEY: supabaseKey } = requireEnv(
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
)
const { createClient } = await import('@supabase/supabase-js')

const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  console.log('Checking organizations...')
  const { data: orgs, error: orgError } = await supabase
    .from('organizations')
    .select('*')
    .limit(5)

  if (orgError) {
    console.error('Org error:', orgError.message)
  } else {
    console.log('Organizations:', orgs)
  }

  console.log('\nChecking contacts...')
  const { data: contacts, error: contactError } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, organization_id')
    .limit(5)

  if (contactError) {
    console.error('Contact error:', contactError.message)
  } else {
    console.log('Contacts:', contacts)
  }

  console.log('\nChecking auth users...')
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers()

  if (authError) {
    console.error('Auth error:', authError.message)
  } else {
    console.log('Users:', users?.map(u => ({ id: u.id, email: u.email })))
  }
}

check()
