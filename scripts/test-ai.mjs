/**
 * Test AI Integration Script
 *
 * This script tests:
 * 1. Anthropic API connection
 * 2. Creates demo organization if needed
 * 3. Creates test contacts
 */

import { requireEnv } from './env.mjs'

const DEMO_ORG_ID = '00000000-0000-0000-0000-000000000001'

// Initialize Supabase with service role key
const { NEXT_PUBLIC_SUPABASE_URL: supabaseUrl, SUPABASE_SERVICE_ROLE_KEY: supabaseKey } = requireEnv(
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'ANTHROPIC_API_KEY',
)
const { createClient } = await import('@supabase/supabase-js')
const { default: Anthropic } = await import('@anthropic-ai/sdk')
const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  console.log('=== AI Integration Test ===\n')

  // Test 1: Check Anthropic API key
  console.log('1. Testing Anthropic API key...')
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey || apiKey.length < 10) {
    console.error('   ❌ ANTHROPIC_API_KEY not set or invalid')
    process.exit(1)
  }
  console.log('   ✅ API key present (length:', apiKey.length, ')')

  // Test 2: Test Claude API with Haiku
  console.log('\n2. Testing Claude Haiku API...')
  try {
    const anthropic = new Anthropic({ apiKey })

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 100,
      messages: [
        { role: 'user', content: 'Say "API test successful" in exactly those words.' }
      ]
    })

    const response = message.content[0].type === 'text' ? message.content[0].text : ''
    console.log('   ✅ Claude Haiku response:', response.trim())
    console.log('   Input tokens:', message.usage.input_tokens)
    console.log('   Output tokens:', message.usage.output_tokens)
  } catch (error) {
    console.error('   ❌ Claude API error:', error.message)
    process.exit(1)
  }

  // Test 3: Ensure demo organization exists
  console.log('\n3. Checking demo organization...')

  // First check if organization exists
  const { data: existingOrg, error: checkError } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('id', DEMO_ORG_ID)
    .single()

  if (existingOrg) {
    console.log('   ✅ Demo organization exists:', existingOrg.name)
  } else {
    console.log('   Creating demo organization...')
    const { data: newOrg, error: createError } = await supabase
      .from('organizations')
      .insert({
        id: DEMO_ORG_ID,
        name: 'Demo Organization',
        slug: 'demo',
      })
      .select()
      .single()

    if (createError) {
      console.error('   ❌ Failed to create organization:', createError.message)
    } else {
      console.log('   ✅ Created demo organization:', newOrg.name)
    }
  }

  // Test 4: Check for contacts
  console.log('\n4. Checking contacts...')
  const { count: contactCount, error: contactError } = await supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', DEMO_ORG_ID)

  if (contactError) {
    console.error('   ❌ Failed to count contacts:', contactError.message)
  } else {
    console.log('   Contacts in demo org:', contactCount || 0)

    if (!contactCount || contactCount === 0) {
      console.log('   Creating test contacts...')

      const testContacts = [
        {
          organization_id: DEMO_ORG_ID,
          first_name: 'Sarah',
          last_name: 'Johnson',
          email: 'sarah@example.com',
          is_donor: true,
          is_volunteer: false,
          lifetime_giving: 5000,
          total_gifts: 10,
        },
        {
          organization_id: DEMO_ORG_ID,
          first_name: 'Michael',
          last_name: 'Chen',
          email: 'michael@example.com',
          is_donor: true,
          is_volunteer: true,
          lifetime_giving: 2500,
          total_gifts: 5,
        },
        {
          organization_id: DEMO_ORG_ID,
          first_name: 'Emily',
          last_name: 'Williams',
          email: 'emily@example.com',
          is_donor: false,
          is_volunteer: true,
          total_volunteer_hours: 45,
        },
      ]

      const { data: insertedContacts, error: insertError } = await supabase
        .from('contacts')
        .insert(testContacts)
        .select('id, first_name, last_name')

      if (insertError) {
        console.error('   ❌ Failed to create contacts:', insertError.message)
      } else {
        console.log('   ✅ Created', insertedContacts.length, 'test contacts')

        // Create a test gift for Sarah
        const sarah = insertedContacts.find(c => c.first_name === 'Sarah')
        if (sarah) {
          const { error: giftError } = await supabase
            .from('gifts')
            .insert({
              organization_id: DEMO_ORG_ID,
              contact_id: sarah.id,
              amount: 100,
              gift_date: new Date().toISOString().split('T')[0],
              gift_type: 'one_time',
              payment_method: 'credit_card',
            })

          if (!giftError) {
            console.log('   ✅ Created test gift for Sarah')
          }
        }
      }
    }
  }

  // Test 5: Check for voice profile (stored on organizations table)
  console.log('\n5. Checking voice profile...')
  const { data: orgWithVoice, error: voiceCheckError } = await supabase
    .from('organizations')
    .select('voice_summary, voice_trained_at')
    .eq('id', DEMO_ORG_ID)
    .single()

  if (orgWithVoice?.voice_summary) {
    console.log('   ✅ Voice profile exists (trained:', orgWithVoice.voice_trained_at, ')')
  } else {
    console.log('   ⚠️  No voice profile - adding test profile...')

    const { error: updateVoiceError } = await supabase
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
        voice_trained_by: 'demo-user',
      })
      .eq('id', DEMO_ORG_ID)

    if (updateVoiceError) {
      console.error('   ❌ Failed to set voice profile:', updateVoiceError.message)
    } else {
      console.log('   ✅ Added test voice profile to organization')
    }
  }

  console.log('\n=== Test Complete ===')
  console.log('\nYou can now test the AI features in the app:')
  console.log('1. Go to http://localhost:3000/contacts')
  console.log('2. Click on a contact')
  console.log('3. Use the "Generate Email" button')
}

main().catch(console.error)
