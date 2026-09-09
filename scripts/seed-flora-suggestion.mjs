import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seedFloraSuggestion() {
  // Get a donor contact
  const { data: contact, error: contactError } = await supabase
    .from('contacts')
    .select('id, organization_id, first_name, last_name, lifetime_giving, total_gifts, last_gift_date')
    .eq('is_donor', true)
    .limit(1)
    .single()

  if (contactError || !contact) {
    console.error('No donor contact found:', contactError)

    // Try to get any contact
    const { data: anyContact, error: anyError } = await supabase
      .from('contacts')
      .select('id, organization_id, first_name, last_name, lifetime_giving, total_gifts, last_gift_date')
      .limit(1)
      .single()

    if (anyError || !anyContact) {
      console.error('No contacts found at all:', anyError)
      process.exit(1)
    }

    console.log('Using contact:', anyContact.first_name, anyContact.last_name)
    await insertSuggestion(anyContact)
    return
  }

  console.log('Found donor:', contact.first_name, contact.last_name)
  await insertSuggestion(contact)
}

async function insertSuggestion(contact) {
  const suggestion = {
    organization_id: contact.organization_id,
    contact_id: contact.id,
    action_type: 'send_ask',
    priority: 85,
    title: `Perfect time to reach out to ${contact.first_name}`,
    description: `${contact.first_name} has been a consistent supporter and December is typically a strong giving month. Consider a personalized ask for their year-end gift.`,
    reasoning: `Based on ${contact.first_name}'s giving history of $${(contact.lifetime_giving || 0).toLocaleString()} across ${contact.total_gifts || 0} gifts, they show strong engagement with your mission. December historically sees 30% of annual charitable giving, making this an optimal time for outreach. Their last gift was ${contact.last_gift_date || 'recently'}, and patterns suggest they may be receptive to a year-end appeal.`,
    predicted_gift_amount: Math.round((contact.lifetime_giving || 500) / (contact.total_gifts || 1) * 1.2),
    predicted_success_rate: 75,
    optimal_timing: 'This week',
    preferred_channel: 'email',
    donor_score: 82,
    donor_score_reasoning: 'High engagement donor with consistent giving pattern',
    context_snapshot: {
      lifetimeGiving: contact.lifetime_giving || 0,
      totalGifts: contact.total_gifts || 0,
      lastGiftDate: contact.last_gift_date,
      lastGiftAmount: null,
      lapseRisk: 'low',
      segment: 'engaged'
    },
    status: 'pending',
    generated_at: new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('copilot_actions')
    .insert(suggestion)
    .select()
    .single()

  if (error) {
    console.error('Error inserting suggestion:', error)
    process.exit(1)
  }

  console.log('✅ Flora suggestion created!')
  console.log('   ID:', data.id)
  console.log('   Title:', data.title)
  console.log('   Priority:', data.priority)
}

seedFloraSuggestion()
