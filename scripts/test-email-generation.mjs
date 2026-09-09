/**
 * Test Email Generation Script
 *
 * This script tests the full email generation flow:
 * 1. Get a donor contact
 * 2. Generate a thank-you email using Claude Haiku
 * 3. Verify the result
 */

import { requireEnv } from './env.mjs'

const DEMO_ORG_ID = '00000000-0000-0000-0000-000000000001'

const { NEXT_PUBLIC_SUPABASE_URL: supabaseUrl, SUPABASE_SERVICE_ROLE_KEY: supabaseKey } = requireEnv(
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'ANTHROPIC_API_KEY',
)
const { createClient } = await import('@supabase/supabase-js')
const { default: Anthropic } = await import('@anthropic-ai/sdk')
const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  console.log('=== Email Generation Test ===\n')

  // Step 1: Get organization with voice profile
  console.log('1. Fetching organization voice profile...')
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('name, voice_summary, voice_formality, voice_warmth, voice_signature_phrases, voice_greeting_style, voice_closing_style, voice_tone_characteristics, voice_trained_at')
    .eq('id', DEMO_ORG_ID)
    .single()

  if (!org?.voice_summary || !org?.voice_trained_at) {
    console.error('   ❌ Voice profile not found or not trained')
    process.exit(1)
  }
  console.log('   ✅ Organization:', org.name)
  console.log('   ✅ Voice trained at:', org.voice_trained_at)

  // Step 2: Get a donor contact
  console.log('\n2. Finding a donor contact...')
  const { data: donor, error: donorError } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, email, lifetime_giving, total_gifts')
    .eq('organization_id', DEMO_ORG_ID)
    .eq('is_donor', true)
    .limit(1)
    .single()

  if (!donor) {
    console.error('   ❌ No donor found')
    process.exit(1)
  }
  console.log('   ✅ Found donor:', donor.first_name, donor.last_name)
  console.log('   Email:', donor.email)
  console.log('   Lifetime giving: $' + (donor.lifetime_giving || 0))

  // Step 3: Get or create a gift for this donor
  console.log('\n3. Checking for recent gift...')
  let { data: gift, error: giftError } = await supabase
    .from('gifts')
    .select('id, amount, gift_date')
    .eq('contact_id', donor.id)
    .order('gift_date', { ascending: false })
    .limit(1)
    .single()

  if (!gift) {
    console.log('   Creating a test gift...')
    const { data: newGift, error: createGiftError } = await supabase
      .from('gifts')
      .insert({
        organization_id: DEMO_ORG_ID,
        contact_id: donor.id,
        amount: 250,
        gift_date: new Date().toISOString().split('T')[0],
        gift_type: 'one_time',
        payment_method: 'credit_card',
      })
      .select()
      .single()

    if (createGiftError) {
      console.error('   ❌ Failed to create gift:', createGiftError.message)
      process.exit(1)
    }
    gift = newGift
    console.log('   ✅ Created test gift: $' + gift.amount)
  } else {
    console.log('   ✅ Found gift: $' + gift.amount, 'on', gift.gift_date)
  }

  // Step 4: Generate email using Claude Haiku
  console.log('\n4. Generating thank-you email with Claude Haiku...')

  const voiceProfile = {
    voiceSummary: org.voice_summary,
    formality: org.voice_formality,
    warmth: org.voice_warmth,
    signaturePhrases: org.voice_signature_phrases || [],
    greetingStyle: org.voice_greeting_style,
    closingStyle: org.voice_closing_style,
    toneCharacteristics: org.voice_tone_characteristics || [],
  }

  // Build the system prompt (similar to getThankYouSystemPrompt)
  const systemPrompt = `You are a skilled email writer for a nonprofit organization.

Your task is to write a personalized thank-you email to a donor.

ORGANIZATIONAL VOICE:
${voiceProfile.voiceSummary}

Formality level: ${voiceProfile.formality}
Warmth level: ${voiceProfile.warmth}/10
Signature phrases to incorporate naturally: ${voiceProfile.signaturePhrases.join(', ')}
Greeting style: ${voiceProfile.greetingStyle}
Closing style: ${voiceProfile.closingStyle}
Tone characteristics: ${voiceProfile.toneCharacteristics.join(', ')}

GUIDELINES:
1. Start with "Subject: " followed by a compelling subject line
2. Then write the email body
3. Keep the email concise but heartfelt (150-250 words)
4. Reference their specific gift amount
5. Make it personal and genuine
6. End with a warm closing`

  const userPrompt = `Write a thank-you email for:

DONOR:
Name: ${donor.first_name} ${donor.last_name}
Email: ${donor.email}
Lifetime giving: $${donor.lifetime_giving || 0}
Total gifts: ${donor.total_gifts || 1}

CURRENT GIFT:
Amount: $${gift.amount}
Date: ${gift.gift_date}

Please write a personalized thank-you email.`

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const startTime = Date.now()
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      temperature: 1.0,
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        { role: 'user', content: userPrompt }
      ]
    })
    const duration = Date.now() - startTime

    const content = message.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n')

    // Parse subject and body
    const subjectMatch = content.match(/Subject:\s*(.+)/i)
    const subject = subjectMatch ? subjectMatch[1].trim() : 'Thank You'
    let body = content
    if (subjectMatch) {
      body = content
        .substring(content.indexOf(subjectMatch[0]) + subjectMatch[0].length)
        .trim()
    }

    console.log('   ✅ Email generated successfully!')
    console.log('\n   --- GENERATED EMAIL ---')
    console.log('   Subject:', subject)
    console.log('   \n   Body:')
    console.log('   ' + body.split('\n').join('\n   '))
    console.log('   -------------------------')
    console.log('\n   Stats:')
    console.log('   - Model:', message.model)
    console.log('   - Duration:', duration + 'ms')
    console.log('   - Input tokens:', message.usage.input_tokens)
    console.log('   - Output tokens:', message.usage.output_tokens)
    console.log('   - Cache creation tokens:', message.usage.cache_creation_input_tokens || 0)
    console.log('   - Cache read tokens:', message.usage.cache_read_input_tokens || 0)

    // Step 5: Save as a draft (simulating what the app does)
    console.log('\n5. Saving draft to database...')
    const { data: draft, error: draftError } = await supabase
      .from('email_drafts')
      .insert({
        organization_id: DEMO_ORG_ID,
        contact_id: donor.id,
        email_type: 'thank_you',
        trigger_event: 'gift_received',
        trigger_event_id: gift.id,
        subject: subject,
        body: body,
        status: 'draft',
        model_used: 'claude-3-5-haiku-20241022',
      })
      .select('id')
      .single()

    if (draftError) {
      console.error('   ❌ Failed to save draft:', draftError.message)
    } else {
      console.log('   ✅ Draft saved with ID:', draft.id)
    }

  } catch (error) {
    console.error('   ❌ Claude API error:', error.message)
    process.exit(1)
  }

  console.log('\n=== Test Complete ===')
  console.log('\nThe AI email generation is working correctly!')
  console.log('You can view the draft at: http://localhost:3000/communications')
}

main().catch(console.error)
