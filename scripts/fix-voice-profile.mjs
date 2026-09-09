/**
 * Fix Voice Profile Script
 * Sets up the voice_trained_at field properly
 */

import { requireEnv } from './env.mjs'

const DEMO_ORG_ID = '00000000-0000-0000-0000-000000000001'

const { NEXT_PUBLIC_SUPABASE_URL: supabaseUrl, SUPABASE_SERVICE_ROLE_KEY: supabaseKey } = requireEnv(
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
)
const { createClient } = await import('@supabase/supabase-js')
const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  console.log('Updating voice profile with trained_at timestamp...')

  const { error } = await supabase
    .from('organizations')
    .update({
      voice_summary: 'Warm, professional, and grateful tone. Uses personal greetings and emphasizes community impact. The organization communicates with sincerity and appreciation, making donors feel valued and connected to the mission.',
      voice_formality: 'moderate',
      voice_warmth: 8,
      voice_signature_phrases: ['With gratitude', 'Together we can', 'Your support matters', 'Making a difference'],
      voice_greeting_style: 'Dear [First Name],',
      voice_closing_style: 'With warm regards, The Demo Nonprofit Team',
      voice_tone_characteristics: ['appreciative', 'community-focused', 'inspiring', 'personal'],
      voice_trained_at: new Date().toISOString(),
      // voice_trained_by requires a valid UUID, omit for demo
    })
    .eq('id', DEMO_ORG_ID)

  if (error) {
    console.error('Error:', error.message)
  } else {
    console.log('✅ Voice profile updated successfully!')
  }

  // Verify
  const { data } = await supabase
    .from('organizations')
    .select('voice_summary, voice_trained_at')
    .eq('id', DEMO_ORG_ID)
    .single()

  console.log('\nCurrent voice profile:')
  console.log('  Summary:', data?.voice_summary?.substring(0, 50) + '...')
  console.log('  Trained at:', data?.voice_trained_at)
}

main().catch(console.error)
